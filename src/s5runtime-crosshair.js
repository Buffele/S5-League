import {S5RUNTIME_CROSSHAIR_DATA} from './s5runtime-crosshair-data.js';

const installed=new WeakMap();
const BASE='/assets/s5runtime/hud/crosshairs/';
const FALLBACK='/assets/s5runtime/hud/crosshair.png';
// Installation is scoped to the existing HUD host; camera/result visibility stays in control.
const CSS=`
#crosshair[data-s5runtime-crosshair-installed]{opacity:1;visibility:visible;transition:opacity .20s linear,visibility 0s linear}
#crosshair[data-s5runtime-crosshair-installed][data-s5runtime-visible="false"]{opacity:0;visibility:hidden;transition:opacity .20s linear,visibility 0s linear .20s}
#crosshair[data-s5runtime-crosshair-installed][data-s5runtime-crosshair="native"]{width:calc(100vh * 260 / 2160);height:calc(100vh * 260 / 2160);padding:calc(100vh * 40 / 2160);box-sizing:border-box;line-height:0}
#crosshair[data-s5runtime-crosshair-installed][data-s5runtime-crosshair="native"]>img{width:100%;height:100%;object-fit:contain;display:block}
#crosshair[data-s5runtime-crosshair-installed][data-s5runtime-crosshair="fallback"]{width:64px;height:64px;padding:0;line-height:0}
#crosshair[data-s5runtime-crosshair-installed][data-s5runtime-crosshair="fallback"]>img{width:100%;height:100%;object-fit:contain;display:block}
`;
const ATTRIBUTES=['data-s5runtime-crosshair-installed','data-s5runtime-crosshair','data-s5runtime-visible','data-s5runtime-crosshair-item','data-s5runtime-crosshair-zoom','data-s5-crosshair-shape'];

function resolveMapping(weapon,zoom){
 const id=String(weapon??'');
 const itemKey=Object.hasOwn(S5RUNTIME_CROSSHAIR_DATA.weaponItems,id)?S5RUNTIME_CROSSHAIR_DATA.weaponItems[id]:(Object.hasOwn(S5RUNTIME_CROSSHAIR_DATA.items,id)?Number(id):null);
 const mapping=itemKey==null?null:S5RUNTIME_CROSSHAIR_DATA.items[itemKey];
 const file=mapping?.[zoom?'secondary':'primary']??null;
 return {weapon:id,itemKey,zoom:!!zoom,native:!!file,file,src:file?BASE+file:null};
}

export function resolveS5RuntimeCrosshair(weapon,zoom=false){return resolveMapping(weapon,zoom);}

function shapeFor(mapping){
 if(mapping.zoom)return 'zoom';
 if(mapping.file&&/^(circle|melee|projectile)/.test(mapping.file))return 'circle';
 return 'cross';
}

// Uses published DDS-to-PNG pixels and the exact source item/zoom lookup.
// Viewport-height scaling and manual appearance triggers retain their existing qualification.
export function installS5RuntimeCrosshair(target,{theme='source'}={}){
 if(!target)return null;
 if(installed.has(target))return installed.get(target);
 if(theme!=='source')throw new TypeError('Unknown crosshair theme');
 const doc=target.ownerDocument;
 let image=target.querySelector('img'),createdImage=false;
 const originalSrc=image?.getAttribute('src')??null;
 const originalHidden=image?.getAttribute('hidden')??null;
 const originalAttributes=new Map(ATTRIBUTES.map(name=>[name,target.getAttribute(name)]));
 if(!image){image=doc.createElement('img');image.alt='';target.append(image);createdImage=true;}
 image.removeAttribute('hidden');
 const artwork=image,fallbackSrc=originalSrc??FALLBACK;
 const style=doc.createElement('style');style.textContent=CSS;doc.head?.append(style);
 target.setAttribute('data-s5runtime-crosshair-installed','');
 let previous=null,appearance=null,disposed=false;
 const assign=(name,value)=>{if(target.getAttribute(name)!==value)target.setAttribute(name,value);};
 const setImage=src=>{if(src==null){if(image.getAttribute('src')!=null)image.removeAttribute('src');}else if(image.getAttribute('src')!==src)image.setAttribute('src',src);};
 const cancelAppearance=()=>{appearance?.cancel();appearance=null;};
 const api={
  update({weapon,zoom=false,visible=false}={}){
   if(disposed)return null;
   const id=String(weapon??''),actualZoom=!!zoom,actualVisible=!!visible;
   // Resolve and allocate only when inputs change, including on the hot frame path.
   if(previous&&previous.weapon===id&&previous.zoom===actualZoom&&previous.visible===actualVisible)return previous;
   const mapping=resolveMapping(id,actualZoom);
   const next={...mapping,visible:actualVisible,theme,shape:shapeFor(mapping),imageSrc:mapping.src??fallbackSrc};
   assign('data-s5runtime-crosshair',next.native?'native':'fallback');
   assign('data-s5runtime-visible',String(next.visible));
   assign('data-s5runtime-crosshair-item',String(next.itemKey??''));
   assign('data-s5runtime-crosshair-zoom',String(next.zoom));
   setImage(next.imageSrc);
   const reveal=next.visible&&!previous?.visible;
   const changed=next.itemKey!==previous?.itemKey||next.file!==previous?.file;
   if(!next.visible||!next.native)cancelAppearance();
   else if(reveal||changed){
    cancelAppearance();
    if(artwork.animate){
     const layout=S5RUNTIME_CROSSHAIR_DATA.layout;
     try{appearance=artwork.animate(layout.appearanceScale.map((scale,index)=>({transform:`scale(${scale})`,opacity:layout.appearanceOpacity[index]})),{duration:layout.appearanceMs,easing:layout.easing});}catch{/* The source image remains usable when animation is unavailable. */}
    }
   }
   previous=next;return next;
  },
  dispose(){
   if(disposed)return;disposed=true;cancelAppearance();style.remove();
   for(const [name,value] of originalAttributes){if(value==null)target.removeAttribute(name);else target.setAttribute(name,value);}
   if(createdImage)image.remove();
   else{
    setImage(originalSrc);
    if(originalHidden==null)image.removeAttribute('hidden');else image.setAttribute('hidden',originalHidden);
   }
   installed.delete(target);
  },
 };
 installed.set(target,api);return api;
}

export function updateS5RuntimeCrosshair(state,{document=globalThis.document,theme='source'}={}){
 const target=document?.getElementById('crosshair');
 if(!target)return null;
 return (installed.get(target)??installS5RuntimeCrosshair(target,{theme})).update(state);
}
