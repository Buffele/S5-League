import {s5LobbyIcon} from './s5-lobby-icons.js';

/** Input for the preview clone only; no live avatar, camera or gameplay port. */
export function installAvatarPreviewRotation(container,{document:doc=container?.ownerDocument}={}){
 if(!container?.addEventListener||!doc?.createElement)return null;
 let yaw=0,drag=null,disposed=false;const bindings=[];
 const bind=(node,type,handler)=>{node.addEventListener(type,handler);bindings.push([node,type,handler]);};
 const previous={tabIndex:container.getAttribute('tabindex'),label:container.getAttribute('aria-label')};
 container.tabIndex=0;container.setAttribute('aria-label','Character preview · Drag to rotate, or use Left and Right. Home resets the view.');container.dataset.rotatable='true';
 const toolbar=doc.createElement('div');toolbar.className='s5-avatar-rotation-controls';toolbar.setAttribute('aria-label','Character rotation');
 const hint=doc.createElement('span');hint.className='s5-avatar-rotation-hint';hint.textContent='Drag to rotate';toolbar.append(hint);
 function turn(value){if(!disposed&&Number.isFinite(value))yaw=((value+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;}
 for(const [label,icon,action]of [['Rotate character left','back',()=>turn(yaw-.3)],['Reset character rotation','refresh',()=>turn(0)],['Rotate character right','next',()=>turn(yaw+.3)]]){
  const button=doc.createElement('button');button.type='button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML=s5LobbyIcon(icon);bind(button,'click',event=>{event.stopPropagation();action();});toolbar.append(button);
 }
 bind(toolbar,'pointerdown',event=>event.stopPropagation());
 function end(event){if(!drag||event.pointerId!==drag.id)return;const id=drag.id;drag=null;delete container.dataset.rotating;try{container.releasePointerCapture?.(id);}catch{}}
 bind(container,'pointerdown',event=>{if(disposed||event.button!==0)return;drag={id:event.pointerId,x:event.clientX};container.dataset.rotating='true';try{container.setPointerCapture?.(event.pointerId);}catch{}container.focus?.({preventScroll:true});});
 bind(container,'pointermove',event=>{if(!drag||event.pointerId!==drag.id||!Number.isFinite(event.clientX))return;const delta=event.clientX-drag.x;drag.x=event.clientX;turn(yaw+delta*.008);if(event.cancelable)event.preventDefault();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])bind(container,type,end);
 bind(container,'keydown',event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();event.stopPropagation();turn(event.key==='Home'?0:yaw+(event.key==='ArrowLeft'?-.15:.15));});
 container.append(toolbar);
 return {get yaw(){return yaw;},reset:()=>turn(0),dispose(){if(disposed)return;disposed=true;if(drag){try{container.releasePointerCapture?.(drag.id);}catch{}drag=null;}for(const [node,type,handler]of bindings)node.removeEventListener(type,handler);toolbar.remove();delete container.dataset.rotatable;delete container.dataset.rotating;for(const [name,value]of [['tabindex',previous.tabIndex],['aria-label',previous.label]]){if(value===null)container.removeAttribute(name);else container.setAttribute(name,value);}}};
}
