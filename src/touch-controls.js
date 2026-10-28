import {TouchInput} from './touch-input.js';

export function installTouchControls({document:doc=globalThis.document,window:win=globalThis.window,enabled=false,onAction=()=>{},onLook=()=>{}}={}){
 const input=new TouchInput(),root=doc.createElement('section');root.id='s5-touch-controls';root.hidden=true;root.setAttribute('aria-label','Touch controls');
 root.innerHTML=`<div class="s5-touch-look" aria-label="Drag to aim"></div><div class="s5-touch-stick" aria-label="Movement joystick"><span></span></div>
 <nav class="s5-touch-top" aria-label="Mobile game menu"><button data-touch="pause">Menu</button><button data-touch="scoreboard">Score</button></nav>
 <nav class="s5-touch-slots" aria-label="Weapon slots"><button data-touch="weapon1">1</button><button data-touch="weapon2">2</button><button data-touch="weapon3">3</button></nav>
 <div class="s5-touch-actions"><button data-touch="reload">Reload</button><button data-touch="skill">Skill</button><button data-touch="sprint">Sprint</button><button data-touch="secondary">Alt attack</button><button data-touch="jump">Jump / dodge</button><button data-touch="primary">Attack</button></div>
 <p class="s5-touch-rotate">Rotate your phone to landscape for more space.</p>`;
 doc.body.append(root);doc.documentElement.classList.toggle('s5-touch-enabled',enabled);
 let active=false,gameplay=false,stickId=null,lookId=null,lastLook=null;
 const pointers=new Map(),listeners=[],stick=root.querySelector('.s5-touch-stick'),knob=stick.querySelector('span'),look=root.querySelector('.s5-touch-look');
 const listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
 const action=(name,pressed)=>{input.button(name,pressed);onAction(name,pressed);};
 function release(event){
  const name=pointers.get(event.pointerId);if(name){pointers.delete(event.pointerId);if(![...pointers.values()].includes(name))action(name,false);}
  if(event.pointerId===stickId){stickId=null;input.move(0,0);knob.style.transform='translate(0px,0px)';}
  if(event.pointerId===lookId){lookId=null;lastLook=null;}
 }
 function clear(){
  const held=[...new Set(pointers.values())];pointers.clear();for(const name of held)action(name,false);
  stickId=null;lookId=null;lastLook=null;input.clear();knob.style.transform='translate(0px,0px)';
 }
 function moveStick(event){const rect=stick.getBoundingClientRect(),radius=rect.width/2,dx=(event.clientX-rect.left-radius)/radius,dy=(event.clientY-rect.top-radius)/radius,scale=Math.max(1,Math.hypot(dx,dy));input.move(dx/scale,dy/scale);knob.style.transform=`translate(${dx/scale*radius*.65}px,${dy/scale*radius*.65}px)`;}
 listen(root,'contextmenu',e=>e.preventDefault());
 listen(root,'pointerdown',event=>{
  if(!active||event.button!==0)return;
  const button=event.target.closest('[data-touch]');
  if(button){
   event.preventDefault();const name=button.dataset.touch;if(!gameplay&&name!=='pause')return;
   button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,name);if([...pointers.values()].filter(v=>v===name).length===1)action(name,true);return;
  }
  if(!gameplay)return;
  if(event.target.closest('.s5-touch-stick')&&stickId===null){event.preventDefault();stickId=event.pointerId;stick.setPointerCapture(stickId);moveStick(event);}
  else if(event.target===look&&lookId===null){event.preventDefault();lookId=event.pointerId;lastLook={x:event.clientX,y:event.clientY};look.setPointerCapture(lookId);}
 });
 listen(root,'pointermove',event=>{
  if(event.pointerId===stickId){event.preventDefault();moveStick(event);}
  if(event.pointerId===lookId&&lastLook){event.preventDefault();const scale=5/Math.max(320,Math.min(win.innerWidth,win.innerHeight));onLook(-(event.clientX-lastLook.x)*scale,(event.clientY-lastLook.y)*scale*.8);lastLook={x:event.clientX,y:event.clientY};}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(root,type,release);
 listen(root,'click',event=>{const button=event.target.closest('[data-touch]');if(!button)return;event.preventDefault();if(event.detail===0&&active&&(gameplay||button.dataset.touch==='pause')){action(button.dataset.touch,true);action(button.dataset.touch,false);}});
 listen(win,'blur',clear);listen(win,'resize',clear);listen(doc,'visibilitychange',()=>{if(doc.hidden)clear();});
 return {input,root,get enabled(){return enabled;},sync({visible=false,canPlay=visible}={}){
  const next=enabled&&visible,nextGameplay=next&&canPlay;if(active!==next||gameplay!==nextGameplay){clear();active=next;gameplay=nextGameplay;root.hidden=!next;root.classList.toggle('s5-touch-locked',!gameplay);}
 },clear,dispose(){clear();for(const off of listeners)off();root.remove();doc.documentElement.classList.remove('s5-touch-enabled');}};
}
