import {MovementInput} from './input.js';
import {mergeLateralRelease} from './lateral-release.js';

export function usesTouchControls({search=globalThis.location?.search??'',navigator=globalThis.navigator,matchMedia=globalThis.matchMedia}={}){
 const choice=new URLSearchParams(search).get('touch');
 if(choice==='0')return false;
 return choice==='1'||((navigator?.maxTouchPoints??0)>0&&!!matchMedia?.('(pointer: coarse)').matches);
}

// Translate gestures; the normal Controller keeps all physics and SP gates.
export class TouchInput{
 constructor(){this.movement=new MovementInput();this.sprintHeld=false;this.pending={};}
 move(x,y,time=performance.now()/1000){
  const length=Math.hypot(x,y),active=length>.22;
  const directions={KeyW:active&&y/length<-.38,KeyS:active&&y/length>.38,KeyA:active&&x/length<-.38,KeyD:active&&x/length>.38};
  for(const [code,held]of Object.entries(directions))if(held)this.movement.keyDown(code,time);else this.movement.keyUp(code,time);
 }
 button(action,pressed,time=performance.now()/1000){
  if(action==='jump'){if(pressed)this.movement.keyDown('Space',time);else this.movement.keyUp('Space',time);}
  if(action==='reload'&&pressed)this.movement.pending.reload=true;
  if(action==='sprint'&&pressed!==this.sprintHeld){this.sprintHeld=pressed;this.pending[pressed?'sprintPressed':'sprintReleased']=true;}
 }
 merge(input,facing,time=performance.now()/1000){
  const touch=this.movement.sample(facing,time),pending=this.pending;this.pending={};
  const forward=Math.max(-1,Math.min(1,(input.forward??0)+touch.forward)),side=Math.max(-1,Math.min(1,(input.side??0)+touch.side));
  const result={...input,forward,side,x:Math.sin(facing)*forward-Math.cos(facing)*side,z:Math.cos(facing)*forward+Math.sin(facing)*side,
   forwardHeld:!!input.forwardHeld||touch.forwardHeld,backwardHeld:!!input.backwardHeld||touch.backwardHeld,leftHeld:!!input.leftHeld||touch.leftHeld,rightHeld:!!input.rightHeld||touch.rightHeld,
   jump:!!input.jump||!!touch.jump,reload:!!input.reload||!!touch.reload,
   forwardPressed:!!input.forwardPressed||!!touch.forwardPressed,sprintPressed:!!input.sprintPressed||!!touch.sprintPressed||!!pending.sprintPressed,
   sprintReleased:!!input.sprintReleased||!!touch.sprintReleased||!!pending.sprintReleased,
   sprint:(!!input.sprint||touch.sprint)&&forward>0&&side===0,
   leftReleased:mergeLateralRelease(input.leftHeld,input.leftReleased,touch.leftHeld,touch.leftReleased),rightReleased:mergeLateralRelease(input.rightHeld,input.rightReleased,touch.rightHeld,touch.rightReleased)};
  if(touch.jumpPressedAt!==undefined)result.jumpPressedAt=touch.jumpPressedAt;
  if(this.sprintHeld)Object.assign(result,{forward:1,side:0,x:Math.sin(facing),z:Math.cos(facing),forwardHeld:true,backwardHeld:false,leftHeld:false,rightHeld:false,sprint:true});
  return result;
 }
 consumeEvents(events){this.movement.consumeEvents(events);}
 clear(){this.movement.clear();this.sprintHeld=false;this.pending={};}
}
