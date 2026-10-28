import {MATCH_LOADING_ART} from './match-loading-art-data.js';
import {waitingRoomMapPreview} from './waiting-room-map-previews.js';

export function describeMatchLoadingArt(context={}){
 const art=MATCH_LOADING_ART[context?.mode];if(!art)return null;
 return {...art,mapImage:waitingRoomMapPreview(context.nativeMapId,context.sceneKey??null)?.image??null,mapLabel:String(context.mapLabel??'Map')};
}

export function createMatchLoadingArt(document,{onUnavailable=()=>{}}={}){
 const root=document.createElement('div');root.className='s5-match-loading-art';root.hidden=true;root.setAttribute('aria-hidden','true');
 let image=document.createElement('img');image.className='s5-match-loading-panel';image.alt='';image.draggable=false;
 let map=document.createElement('img');map.className='s5-match-loading-map';map.alt='';map.draggable=false;map.hidden=true;
 const label=document.createElement('div');label.className='s5-match-loading-map-label';root.append(image,map,label);
 let current=null,failed=false,mapFailed=null;
 const imageError=()=>{if(!current)return;failed=true;root.hidden=true;onUnavailable();};
 const mapError=()=>{if(!current)return;mapFailed=current.mapImage;map.hidden=true;};image.addEventListener('error',imageError);map.addEventListener('error',mapError);
 // Reassigning src can briefly keep the preceding image's decoded frame.
 // A new resource owns its image and error listener; detached failures cannot
 // hide a later mode or map while that new resource is being prepared.
 const replaceImage=(previous,onError)=>{
  const next=document.createElement('img');next.className=previous.className;next.alt='';next.draggable=false;
  previous.removeEventListener('error',onError);next.addEventListener('error',onError);root.replaceChild(next,previous);return next;
 };
 return {element:root,
  update(context){
   const next=describeMatchLoadingArt(context);
   if(!next){this.hide();return null;}
   if(current?.image!==next.image){failed=false;image=replaceImage(image,imageError);image.src=next.image;}
   if(failed)return null;
   if(next.mapImage!==current?.mapImage){mapFailed=null;if(next.mapImage){map=replaceImage(map,mapError);map.src=next.mapImage;}else map.removeAttribute('src');}
   map.hidden=!next.mapImage||mapFailed===next.mapImage;label.textContent=next.mapLabel;root.hidden=false;current=next;return next;
  },
  hide(){root.hidden=true;current=null;failed=false;mapFailed=null;},
  dispose(){image.removeEventListener('error',imageError);map.removeEventListener('error',mapError);root.remove();},
 };
}
