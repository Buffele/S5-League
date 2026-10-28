import {MovementInput} from './input.js';
import {mergeLateralRelease} from './lateral-release.js';

export const GAMEPAD_DEFAULTS=Object.freeze({enabled:true,deadzone:.18,lookSpeed:2.6,invertY:false});
export const GAMEPAD_BINDINGS=Object.freeze({jump:0,dodge:1,reload:2,skill:11,nextWeapon:3,cameraStep:6,secondary:7,primary:5,scoreboard:8,menu:9,sprint:4,weapon1:14,weapon2:12,weapon3:15});
// PlayStation: L2 dodges toward the left stick; face buttons select fixed slots.
export const PLAYSTATION_GAMEPAD_BINDINGS=Object.freeze({...GAMEPAD_BINDINGS,dodge:6,reload:null,secondary:7,cameraStep:null,skill:null,nextWeapon:null,weapon1:2,weapon2:3,weapon3:1});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function gamepadStick(x,y,deadzone=.18){
 x=Number.isFinite(x)?clamp(x,-1,1):0;y=Number.isFinite(y)?clamp(y,-1,1):0;
 const length=Math.hypot(x,y);if(length<=deadzone)return {x:0,y:0};
 const scale=(Math.min(1,length)-deadzone)/(1-deadzone)/length;
 // Small cross-axis drift must not prevent an otherwise straight sprint.
 return {x:Math.abs(x)<deadzone*.6?0:x*scale,y:Math.abs(y)<deadzone*.6?0:y*scale};
}
const button=(pad,index,wasPressed=false)=>{const b=pad.buttons?.[index],threshold=(index===6||index===7)&&wasPressed ? .35 : .55;return b?.pressed===true||(Number.isFinite(b?.value)&&b.value>=threshold);};
const family=id=>/054c|dualsense|dualshock|playstation|sony/i.test(id)?'PlayStation':/045e|xbox|xinput/i.test(id)?'Xbox':'Standard';
const validSettings=s=>s&&typeof s.enabled==='boolean'&&typeof s.invertY==='boolean'&&Number.isFinite(s.deadzone)&&s.deadzone>=.05&&s.deadzone<=.4&&Number.isFinite(s.lookSpeed)&&s.lookSpeed>=.5&&s.lookSpeed<=6;

// One browser poll per render frame, one movement sample per simulation step.
// Physical pads use the browser's STANDARD layout, never an ID-based guess.
// The existing MovementInput owns jump edges and shared melee hold timing.
export class GamepadInput {
 constructor({navigator:nav=globalThis.navigator,window:win=globalThis.window,document:doc=globalThis.document,controls,onAction=()=>{},onStatus=()=>{},settings=GAMEPAD_DEFAULTS}={}){
  if(!controls||typeof controls.attack!=='function'||typeof controls.releaseAttack!=='function')throw TypeError('Actual game movement input required');
  this.nav=nav;this.win=win;this.doc=doc;this.controls=controls;this.onAction=onAction;this.onStatus=onStatus;
  this.settings={...GAMEPAD_DEFAULTS,...settings};if(!validSettings(this.settings))this.settings={...GAMEPAD_DEFAULTS};
  this.movement=new MovementInput();this.sources=[new Set(),new Set()];this.previous=[];this.pending={};this.sprintHeld=false;this.selected=null;this.context='inactive';this.armed=false;this.claimed=false;this.requested=false;this.focused=true;this.disposed=false;this.move={x:0,y:0};this.look={deltaYaw:0,deltaPitch:0};this.menuDirection='';this.menuRepeatAt=0;this.lastStatus='';this.status='disconnected';
  this.blur=()=>{this.focused=false;this.suspend();};this.focus=()=>{this.focused=true;};this.visibility=()=>{if(this.doc?.hidden)this.suspend();};
  this.disconnected=event=>{if(event.gamepad?.index!==this.selected?.index)return;const wasActive=this.active;this.suspend();this.selected=null;this.requested=false;if(wasActive)this.onAction('disconnected');};
  win?.addEventListener('blur',this.blur);win?.addEventListener('focus',this.focus);doc?.addEventListener('visibilitychange',this.visibility);
  win?.addEventListener('gamepaddisconnected',this.disconnected);
 }
 get active(){return this.claimed&&this.context==='game'&&this.selected!==null&&this.focused&&!this.doc?.hidden&&this.settings.enabled;}
 get bindings(){return this.selected?.family==='PlayStation'?PLAYSTATION_GAMEPAD_BINDINGS:GAMEPAD_BINDINGS;}
 requestControl(){this.requested=true;}
 configure(patch){const next={...this.settings,...patch};if(!validSettings(next))return false;this.settings=next;this.suspend();return true;}
 attack(buttonIndex,pressed,time=performance.now()/1000,source='mouse'){
  const index=buttonIndex===0?0:buttonIndex===2?1:-1;if(index<0)return;
  const held=this.sources[index],was=held.size>0;
  if(pressed)held.add(source);else held.delete(source);
  // Settings/menu clears may have cancelled the shared input since our last
  // physical edge. A held gesture is never reconstructed after cancellation.
  if(!was&&held.size)this.controls.attack(buttonIndex,time);
  else if(was&&!held.size)this.controls.releaseAttack(buttonIndex,time);
 }
 suspend(){
  const hadPad=this.sources.some(s=>s.has('gamepad'));
  for(const s of this.sources)s.delete('gamepad');
  if(hadPad)this.controls.cancelAttacks({preserveLight:this.sources[0].size>0,preserveHeavy:this.sources[1].size>0});
  if(this.previous[this.bindings.skill])this.onAction('skill',false);
  if(this.previous[8])this.onAction('scoreboard',false);
  this.movement.clear();this.previous=[];this.pending={};this.sprintHeld=false;this.move={x:0,y:0};this.look={deltaYaw:0,deltaPitch:0};this.armed=false;this.claimed=false;this.menuDirection='';
 }
 poll(dt,{context='inactive',time=performance.now()/1000}={}){
  if(this.disposed)return this.snapshot();
  this.look={deltaYaw:0,deltaPitch:0};let pads=[];
  try{pads=Array.from(this.nav?.getGamepads?.()??[]).filter(p=>p?.connected!==false&&p);this.status=typeof this.nav?.getGamepads==='function'?'disconnected':'unavailable';}catch{this.status='unavailable';}
  const supported=pads.filter(p=>p.mapping==='standard'&&p.axes?.length>=4&&p.buttons?.length>=16);
  const pad=supported.find(p=>p.index===this.selected?.index&&p.id===this.selected?.id)??supported[0]??null;
  const changed=pad?.index!==this.selected?.index||pad?.id!==this.selected?.id;
  if(changed){const wasActive=this.active;this.suspend();this.selected=pad?{index:pad.index,id:pad.id,family:family(pad.id)}:null;if(wasActive&&!pad)this.onAction('disconnected');}
  const focused=this.focused&&!this.doc?.hidden&&(typeof this.doc?.hasFocus!=='function'||this.doc.hasFocus());
  const nextContext=this.settings.enabled&&focused&&['game','room','menu'].includes(context)?context:'inactive';
  if(nextContext!==this.context){this.suspend();this.context=nextContext;}
  if(!pad||nextContext==='inactive'){
   if(!pad)this.status=pads.length?'unsupported':this.status;
   else this.status=!this.settings.enabled?'disabled':!focused?'unfocused':'connected';
   this.publish();return this.snapshot();
  }
  this.status='connected';
  const pressed=Array.from({length:17},(_,i)=>button(pad,i,this.previous[i])),move=gamepadStick(pad.axes[0],pad.axes[1],this.settings.deadzone),look=gamepadStick(pad.axes[2],pad.axes[3],this.settings.deadzone);
  if(this.requested&&nextContext==='game'){this.claimed=true;this.requested=false;}
  // After focus/menu/connection changes require neutral input, preventing
  // a held trigger or confirmation button from firing into the new scene.
  if(!this.armed){if(!pressed.some(Boolean)&&!move.x&&!move.y&&!look.x&&!look.y)this.armed=true;this.previous=pressed;this.publish();return this.snapshot();}
  const bindings=this.bindings,down=i=>i!=null&&pressed[i]&&!this.previous[i],up=i=>i!=null&&!pressed[i]&&this.previous[i];
  if(nextContext==='menu'){
   const direction=pressed[12]||move.y<-.5?'up':pressed[13]||move.y>.5?'down':pressed[14]||move.x<-.5?'left':pressed[15]||move.x>.5?'right':'';
   if(direction&&(direction!==this.menuDirection||time>=this.menuRepeatAt)){this.onAction('navigate',direction);this.menuRepeatAt=time+(direction!==this.menuDirection ? .35 : .12);}
   this.menuDirection=direction;
   if(down(0))this.onAction('confirm');if(down(1)||down(9))this.onAction('back');
  }else{
   if(down(9)){this.previous=pressed;this.suspend();this.onAction('pause');this.publish();return this.snapshot();}
   const activity=pressed.some(Boolean)||move.x||move.y||look.x||look.y;
   if(nextContext==='game'&&activity)this.claimed=true;
   this.move=move;
   const directions={KeyW:move.y<0,KeyS:move.y>0,KeyA:move.x<0,KeyD:move.x>0,Space:pressed[0]};
   for(const [key,held] of Object.entries(directions)){if(held)this.movement.keyDown(key,time);else this.movement.keyUp(key,time);}
   if(nextContext==='game'){
    this.sprintHeld=pressed[4];
    if(down(4))this.pending.sprintPressed=true;
    if(up(4))this.pending.sprintReleased=true;
    if(down(bindings.dodge))this.pending.dodgeSide=move.x<0?-1:1;
    if(down(bindings.reload))this.movement.pending.reload=true;
    for(const [i,action,value]of [[bindings.nextWeapon,'cycleWeapon',1],[bindings.weapon1,'weapon',0],[bindings.weapon2,'weapon',1],[bindings.weapon3,'weapon',2]])if(down(i))this.onAction(action,value);
    for(const [i,action]of [[bindings.skill,'skill'],[bindings.scoreboard,'scoreboard']]){if(down(i))this.onAction(action,true);if(up(i))this.onAction(action,false);}
    for(const [i,mouse]of [[bindings.primary,0],[bindings.secondary,2]]){if(down(i))this.attack(mouse,true,time,'gamepad');if(up(i))this.attack(mouse,false,time,'gamepad');}
   }else if(down(3))this.onAction('roomStart');
   const seconds=Number.isFinite(dt)?clamp(dt,0,.05):0;
   const cameraStep=down(bindings.cameraStep)?(look.x<0?1:-1)*Math.PI/4:0;
   this.look={deltaYaw:-look.x*this.settings.lookSpeed*seconds+cameraStep,deltaPitch:look.y*this.settings.lookSpeed*.75*seconds*(this.settings.invertY?-1:1)};
  }
  this.previous=pressed;this.publish();return this.snapshot();
 }
 merge(input,facing,time=performance.now()/1000){
  if(!this.armed||!['game','room'].includes(this.context))return input;
  const pad=this.movement.sample(facing,time),forward=clamp((input.forward??0)-this.move.y,-1,1),side=clamp((input.side??0)+this.move.x,-1,1);
  const forwardHeld=!!(input.forwardHeld??input.forward>0)||pad.forwardHeld,backwardHeld=!!(input.backwardHeld??input.forward<0)||pad.backwardHeld,leftHeld=!!(input.leftHeld??input.side<0)||pad.leftHeld,rightHeld=!!(input.rightHeld??input.side>0)||pad.rightHeld;
  const pending=this.pending;this.pending={};
  const sprint=this.context==='game'&&this.sprintHeld;
  const result={...input,forward,side,x:Math.sin(facing)*forward-Math.cos(facing)*side,z:Math.cos(facing)*forward+Math.sin(facing)*side,
   forwardHeld,backwardHeld,leftHeld,rightHeld,
   jump:!!input.jump||!!pad.jump,jumpOnly:!!pad.jump&&!input.jump,reload:this.context==='game'&&(!!input.reload||!!pad.reload),sprint:this.context==='game'&&(!!input.sprint||sprint)&&forward>0&&side===0,
   forwardPressed:!!input.forwardPressed||!!pad.forwardPressed,sprintPressed:this.context==='game'&&(!!input.sprintPressed||!!pending.sprintPressed),sprintReleased:this.context==='game'&&(!!input.sprintReleased&&!sprint||!!pending.sprintReleased&&!input.sprint),
   leftReleased:mergeLateralRelease(input.leftHeld??input.side<0,input.leftReleased,pad.leftHeld,pad.leftReleased),rightReleased:mergeLateralRelease(input.rightHeld??input.side>0,input.rightReleased,pad.rightHeld,pad.rightReleased)};
  // L1 supplies forward + sprint to the normal controller. Heading follows
  // the current camera every step, exactly as it does with mouse look.
  if(sprint)Object.assign(result,{facing,forward:1,side:0,x:Math.sin(facing),z:Math.cos(facing),forwardHeld:true,backwardHeld:false,leftHeld:false,rightHeld:false,sprint:true,forwardPressed:!!pending.sprintPressed});
  // Dedicated dodge uses the existing controller physics and SP gates. It
  // never borrows the jump button or requires a lateral stick deflection.
  if(pending.dodgeSide){const side=pending.dodgeSide;Object.assign(result,{dodge:true,facing,forward:0,side,x:-Math.cos(facing)*side,z:Math.sin(facing)*side,forwardHeld:false,backwardHeld:false,leftHeld:side<0,rightHeld:side>0,sprint:false});}
  return result;
 }
 consumeEvents(events){this.movement.consumeEvents(events);}
 snapshot(){return {status:this.status,connected:!!this.selected,family:this.selected?.family??null,index:this.selected?.index??null,active:this.active,armed:this.armed,context:this.context,settings:{...this.settings}};}
 publish(){const state=this.snapshot(),key=JSON.stringify(state);if(key!==this.lastStatus){this.lastStatus=key;this.onStatus(state);}}
 dispose(){if(this.disposed)return;this.suspend();this.disposed=true;this.win?.removeEventListener('blur',this.blur);this.win?.removeEventListener('focus',this.focus);this.win?.removeEventListener('gamepaddisconnected',this.disconnected);this.doc?.removeEventListener('visibilitychange',this.visibility);}
}
