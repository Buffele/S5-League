// Native mouse phase chain is pinned in work/s5runtime-inventory-recovery/interface-sounds/phase-binding/proof.json.
// DOM hit testing and UI state below are an explicit S5 projection, never native field reads.
export const INTERFACE_BUTTON_PROJECTION='s5-dom-button-projection-v1';
const contract='base-window-974910-974970';
function declaredIdentity(value){
 return value?.contract===contract&&value.widgetType==='CGUI_Button'&&typeof value.xui==='string'&&value.xui.startsWith('xui/')&&typeof value.nodePath==='string'&&value.nodePath.length>0&&/^[a-f0-9]{64}$/.test(value.sourceSha256??'');
}
export function createInterfaceButtonEvents({notify,identify,readWidget,onResult=()=>{}}={}){
 if([notify,identify,readWidget,onResult].some(fn=>typeof fn!=='function'))throw TypeError('Explicit audio, button identity, UI projection and result ports required');
 let hovered=null,pressed=null,disposed=false;
 function result(value){try{onResult(value);}catch{}return value;}
 function route(element,phase,event){
  if(disposed)return result({status:'disposed'});
  let identity,state;
  try{identity=identify(element);if(!declaredIdentity(identity))return result({status:'unknown',reason:'button-native-contract-not-declared'});state=readWidget(element,event);}
  catch(error){return result({status:'error',reason:'button-projection-failed',error:String(error?.message||error)});}
  if(state?.projection!==INTERFACE_BUTTON_PROJECTION)return result({status:'unknown',reason:'explicit-s5-ui-projection-required'});
  if(state.enabled!==true||state.visible!==true||state.intersect!==true)return result({status:'suppressed',reason:'button-ui-projection-ineligible'});
  const cue={kind:'native-base-button',nativeCallback:phase==='up'?'974910':'974970',mouseButton:event?.button,enabled:true,isButtonType:true,
   identity:Object.freeze({...identity}),projection:INTERFACE_BUTTON_PROJECTION,nativeEventId:phase==='up'?4:7};
  try{Promise.resolve(notify(cue)).then(value=>result(value),error=>result({status:'error',reason:'button-audio-port-failed',error:String(error?.message||error)}));}
  catch(error){return result({status:'error',reason:'button-audio-port-failed',error:String(error?.message||error)});}
  return cue;
 }
 function enter(element,event){
  if(disposed||element===hovered)return null;
  // CGUI_Button leave returns false while visual state1 is pressed; the
  // controller retains its hover target until the release resets that state.
  if(pressed&&hovered===pressed)return result({status:'suppressed',reason:'pressed-button-retains-hover'});
  hovered=element;return element?route(element,'enter',event):null;
 }
 return Object.freeze({
  enter,
  down(element,event){
   if(disposed||event?.button!==0)return null;
   try{const identity=identify(element);if(!declaredIdentity(identity))return null;const state=readWidget(element,event);
    if(state?.projection===INTERFACE_BUTTON_PROJECTION&&state.enabled===true&&state.visible===true&&state.intersect===true){pressed=element;return {status:'pressed',projection:INTERFACE_BUTTON_PROJECTION};}
   }catch(error){return result({status:'error',reason:'button-projection-failed',error:String(error?.message||error)});}return null;
  },
  up(element,event){if(disposed||event?.button!==0)return null;pressed=null;enter(element,event);return element?route(element,'up',event):null;},
  leave(element,event){if(hovered!==element)return null;return enter(null,event);},
  cancel(){hovered=null;pressed=null;},
  snapshot:()=>Object.freeze({hovered,pressed,disposed,projection:INTERFACE_BUTTON_PROJECTION,nativeReady:false}),
  dispose(){disposed=true;hovered=null;pressed=null;},
 });
}

// Effective CSS visibility and hit state are S5 UI projections. Native Enable,
// Show and Intersect correspond to A8/AA/A9; no native memory is inspected.
export function readDomInterfaceButtonState(element,event,{getComputedStyle=element?.ownerDocument?.defaultView?.getComputedStyle?.bind(element.ownerDocument.defaultView)}={}){
 if(!element||typeof getComputedStyle!=='function')throw TypeError('Actual DOM element/style reader required');
 let visible=element.isConnected===true,intersect=true;
 for(let node=element;node;node=node.parentElement){const style=getComputedStyle(node);if(node.hidden||node.getAttribute?.('aria-hidden')==='true'||style.display==='none'||['hidden','collapse'].includes(style.visibility))visible=false;if(node.inert)intersect=false;}
 const style=getComputedStyle(element);if(style.pointerEvents==='none')intersect=false;
 const rect=element.getBoundingClientRect();visible=visible&&rect.width>0&&rect.height>0;
 if(Number.isFinite(event?.clientX)&&Number.isFinite(event?.clientY))intersect=intersect&&event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
 return Object.freeze({projection:INTERFACE_BUTTON_PROJECTION,enabled:!element.disabled&&!element.matches?.(':disabled')&&element.getAttribute?.('aria-disabled')!=='true',visible,intersect});
}

export function installInterfaceButtonAudio({root,audio,identify,readWidget=readDomInterfaceButtonState,onResult,releaseTarget=root?.ownerDocument}={}){
 if(!root?.addEventListener||!root?.contains||typeof audio?.notify!=='function'||typeof identify!=='function')throw TypeError('Explicit root, audio and native button identity port required');
 const bridge=createInterfaceButtonEvents({notify:event=>audio.notify(event),identify,readWidget,onResult});
 const identifyAncestor=target=>{for(let node=target;node&&root.contains(node);node=node.parentElement)if(declaredIdentity(identify(node)))return node;return null;};
 const mouseOnly=event=>event.sourceCapabilities?.firesTouchEvents!==true;
 const bindings=[['mouseover',event=>{if(mouseOnly(event))bridge.enter(identifyAncestor(event.target),event);}],
  ['mouseout',event=>{if(mouseOnly(event)){const from=identifyAncestor(event.target),to=identifyAncestor(event.relatedTarget);if(from!==to)bridge.enter(to,event);}}],
  ['mousedown',event=>{if(mouseOnly(event))bridge.down(identifyAncestor(event.target),event);}],
  ['mouseup',event=>{if(mouseOnly(event))bridge.up(identifyAncestor(event.target),event);}]];
 for(const [name,handler] of bindings)root.addEventListener(name,handler,true);
 const releaseOutside=event=>{if(!root.contains(event.target))bridge.cancel();};releaseTarget?.addEventListener('mouseup',releaseOutside,true);
 let disposed=false;
 return Object.freeze({snapshot:bridge.snapshot,cancel:bridge.cancel,dispose(){if(disposed)return;disposed=true;for(const [name,handler] of bindings)root.removeEventListener(name,handler,true);releaseTarget?.removeEventListener('mouseup',releaseOutside,true);bridge.dispose();}});
}
