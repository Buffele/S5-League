/** Native icons, or explicitly enabled rendered previews. Never loads a bundle or renderer. */
export function createInventoryNativeIcon(host,{document:doc=host.ownerDocument,className='',allowRenderedPreview=false,onStateChange=()=>{}}={}){
 let currentUrl,owned=null,disposed=false,state='empty';
 const publish=value=>{state=value;host.dataset.iconStatus=value;onStateChange(value);};
 const release=()=>{if(!owned)return;owned.image.removeEventListener('load',owned.load);owned.image.removeEventListener('error',owned.error);owned.image.remove();owned=null;};
 return {update(url,label=''){
  if(disposed)return state;
  const valid=typeof url==='string'&&(/^\/assets\/s5runtime\/(?:skills\/\d+|ui\/equipment-recovered\/[a-z0-9_]+)\.png$/.test(url)||allowRenderedPreview&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(url));
  const next=valid?url:null;
  if(currentUrl===next){if(owned)owned.image.alt=String(label);return state;}
  currentUrl=next;release();
  if(!next){publish(url?'unavailable':'empty');return state;}
  const image=doc.createElement('img');image.className=className;image.alt=String(label);image.decoding='async';image.draggable=false;image.hidden=true;
  const load=()=>{if(disposed||owned?.image!==image)return;image.hidden=false;publish('ready');};
  const error=()=>{if(disposed||owned?.image!==image)return;release();publish('unavailable');};
  owned={image,load,error};image.addEventListener('load',load);image.addEventListener('error',error);host.append(image);publish('loading');image.src=next;return state;
 },get state(){return state;},dispose(){if(disposed)return;disposed=true;release();}};
}
