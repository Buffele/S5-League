import {BoundMovementInput} from './game-input-bindings.js';

// Free cursor is the default. Right drag belongs to the room camera and never
// enters weapon input or requests pointer lock.
export function installWaitingRoomInput({canvas,document:doc=canvas.ownerDocument,window:win=doc.defaultView,bindings,isActive,isMenuOpen=()=>false,onLook=()=>{},onMenu=()=>{}}){
 const movement=new BoundMovementInput(bindings),listeners=[];let dragging=false,lastX=0,lastY=0;
 const bind=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push([target,type,handler]);};
 const editable=target=>!!target?.closest?.('input,select,textarea,button,a[href],summary,[contenteditable="true"],[role="list"][tabindex]');
 const available=()=>isActive()&&!isMenuOpen();
 function clear(){dragging=false;movement.clear();canvas.classList?.remove('waiting-room-camera-drag');}
 bind(win,'keydown',event=>{
  if(!available()||event.defaultPrevented||editable(event.target))return;
  if(event.code==='Escape'){event.preventDefault();clear();onMenu();return;}
  const command=movement.commandFor(event.code);
  if(['forward','backward','left','right','jump'].includes(command)||/^Arrow(?:Up|Down|Left|Right)$/.test(event.code)){event.preventDefault();movement.keyDown(event.code,performance.now()/1000,event.repeat);}
 });
 bind(win,'keyup',event=>movement.keyUp(event.code));
 bind(canvas,'mousedown',event=>{if(!available()||event.button!==2)return;event.preventDefault();dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.classList?.add('waiting-room-camera-drag');});
 bind(win,'mouseup',event=>{if(event.button===2){dragging=false;canvas.classList?.remove('waiting-room-camera-drag');}});
 bind(doc,'mousemove',event=>{
  if(!available())return;
  // A room refresh/busy interval clears input. The physical button remains
  // authoritative when the cursor returns to the canvas; no second click is
  // required and UI drags still belong to the UI.
  if(!dragging){
   if(!(event.buttons&2)||event.target!==canvas)return;
   dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.classList?.add('waiting-room-camera-drag');
  }
  if((event.buttons&2)===0){clear();return;}
  const dx=Number.isFinite(event.movementX)&&event.movementX!==0?event.movementX:event.clientX-lastX,dy=Number.isFinite(event.movementY)&&event.movementY!==0?event.movementY:event.clientY-lastY;
  lastX=event.clientX;lastY=event.clientY;onLook({movementX:dx,movementY:dy});
 });
 bind(canvas,'contextmenu',event=>{if(isActive())event.preventDefault();});
 bind(win,'blur',clear);bind(doc,'visibilitychange',()=>{if(doc.hidden)clear();});
 bind(doc,'focusin',event=>{if(editable(event.target))clear();});
 return {sample(facing){if(!available()){clear();return {facing};}const input=movement.sample(facing);return {facing,x:input.x,z:input.z,forward:input.forward,side:input.side,jump:!!input.jump};},clear,snapshot:()=>({dragging,active:available()}),dispose(){clear();movement.dispose();for(const [target,type,handler]of listeners)target.removeEventListener(type,handler);}};
}
