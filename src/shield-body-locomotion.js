// Source-bounded lower container62A270/300/330/3E0/460, ground62B710.
// Native axes/units throughout. No keyboard mapping, F0 write or solver assumed.
const f=Math.fround;
function bool(v,name){if(typeof v!=='boolean')throw new TypeError(`${name} boolean required`);}
function scalar(v,name){if(!Number.isFinite(v))throw new TypeError(`${name} finite required`);return f(v);}
function vector(v){if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError('actorEC native vector required');return v.map(f);}
function dt(v){if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new TypeError('uint32 engine dt required');}
function port(p,name){if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor.name)||!['source-port','explicit-unverified'].includes(p.provenance?.kind)||!p.provenance?.source)throw new TypeError(`${name} synchronous port and provenance required`);}
function call(p,...args){const result=p.tick(...args);if(result?.then)throw new TypeError('Asynchronous lower port unsupported');return result;}

export function createShieldLowerContainer({children}={}){
 if(!Array.isArray(children)||children.length!==3)throw new TypeError('Three explicit source children required');
 for(const [i,child] of children.entries())for(const name of ['enter','leave','tick','input'])port(child?.[name],`child${i}.${name}`);
 return {children,selected:null,nativeReady:false};
}
function gates(raw){bool(raw?.actorSlot3c,'actorSlot3c');bool(raw?.actorSlot180,'actorSlot180');if(!Number.isInteger(raw.actorMode114))throw new TypeError('actorMode114 integer required');}
export function enterShieldLowerContainer(container,raw){
 gates(raw);container.selected=raw.actorSlot180?2:raw.actorMode114===0?0:1;
 call(container.children[container.selected].enter);return container.selected;
}
export function leaveShieldLowerContainer(container){if(container.selected!==null)call(container.children[container.selected].leave);}
export function switchShieldLowerContainer(container,next){
 if(!Number.isInteger(next)||next<0||next>2)throw new TypeError('child0..2 required');
 const had=container.selected!==null;
 if(had)call(container.children[container.selected].leave);
 container.selected=next;if(had)call(container.children[next].enter);
}
export function tickShieldLowerContainer(container,dtMs,raw){
 dt(dtMs);gates(raw);
 if(!raw.actorSlot3c&&raw.actorSlot180&&container.selected!==2)switchShieldLowerContainer(container,2);
 if(container.selected!==null)call(container.children[container.selected].tick,dtMs);
 return {selected:container.selected,nativeReady:false};
}
export function inputShieldLowerContainer(container,code){
 if(!Number.isInteger(code))throw new TypeError('Native input code required');
 if([27,28,15].includes(code)&&container.selected!==1){switchShieldLowerContainer(container,1);return {forwarded:false};}
 if(container.selected===null)throw new TypeError('Source input requires selected child');
 call(container.children[container.selected].input,code);return {forwarded:true};
}

// angleNative/crossYNative are outputs of100B180/100B040 supplied explicitly;
// importing a JS acos implementation would not prove native boundary behavior.
export function shieldGroundDirection({angleNative,crossYNative}={}){
 const angle=scalar(angleNative,'native angle'),cross=scalar(crossYNative,'native cross Y');
 if(angle<0||angle>f(Math.PI))throw new RangeError('Native angle outside0..pi');
 if(angle<f(.39269909262657166))return {phase:1,gameTempoIndex:0x17};
 if(angle>=f(2.7488937377929688))return {phase:8,gameTempoIndex:0x19};
 const sector=Math.trunc(f(f(angle-f(.39269909262657166))/f(.7853999733924866)));
 return {phase:sector+(cross<0?2:5),gameTempoIndex:0x18};
}

export function shieldGroundDisplacement({actorSlot3c,externalSkip,actorVector,speedFlag,
 actorSpeed51e090Native,actorSpeed51dae0Native,groundProperty14,directionalRate,float3,dtMs}={}){
 bool(actorSlot3c,'actorSlot3c');bool(externalSkip,'externalSkip');bool(speedFlag,'speedFlag');dt(dtMs);
 const input=vector(actorVector),speed=scalar(speedFlag?actorSpeed51e090Native:actorSpeed51dae0Native,'selected actor speed');
 const property=scalar(groundProperty14,'decoded ground property14'),rate=scalar(directionalRate,'selected GameTempo rate'),clock=scalar(float3,'Float3');
 const submit=!actorSlot3c&&!externalSkip;
 const velocity=f(speed*property),seconds=f(f(dtMs)*clock);
 const nativeDisplacement=input.map(v=>submit?f(f(f(v*velocity)*seconds)*rate):0);
 return {nativeDisplacement,submit,speedGetter:speedFlag?'51E090':'51DAE0',velocityWrite:false,nativeReady:false};
}

//628BE0 phases0(after launch-delay),1/2,3 share this direct input term.
// Unlike ground, GameTempo1C is multiplied INTO speed before vector×time.
export function shieldAirDisplacement({actorSlot3c,actorVector,speedFlag,
 actorSpeed51e090Native,actorSpeed51dae0Native,airProperty28,jumpMoveRate,float3,dtMs}={}){
 bool(actorSlot3c,'actorSlot3c');bool(speedFlag,'speedFlag');dt(dtMs);
 const input=vector(actorVector),speed=scalar(speedFlag?actorSpeed51e090Native:actorSpeed51dae0Native,'selected actor speed');
 const property=scalar(airProperty28,'decoded air property28'),rate=scalar(jumpMoveRate,'GameTempo1C'),clock=scalar(float3,'Float3');
 const scaled=f(f(speed*property)*rate),seconds=f(f(dtMs)*clock);
 return {nativeDisplacement:input.map(v=>actorSlot3c?0:f(f(v*scaled)*seconds)),submit:!actorSlot3c,speedGetter:speedFlag?'51E090':'51DAE0',velocityWrite:false,nativeReady:false};
}

// Only phase0's strict launch expiry requests this write. Source constructs
// protected([0,1,0]*airProperty18), then calls578580 with THIS actor+F0.
//569850 destroys the temporary protected vector, not an actor movement call.
export function shieldAirLaunchVelocity({airProperty18}={}){
 return {nativeVelocity:[0,scalar(airProperty18,'decoded air property18'),0],velocityChannel:'physical-actor-F0',velocityWrite:true,nativeReady:false};
}

function timer(value,name){
 for(const key of ['counter','elapsedMs','durationMs'])if(!Number.isInteger(value?.[key])||value[key]<0||value[key]>0xffffffff)throw new TypeError(`${name}.${key} uint32 required`);
 bool(value.blocked,`${name}.blocked`);
}
function advanceTimer(value,dtMs){if(!value.blocked){value.counter=(value.counter+1)>>>0;value.elapsedMs=(value.elapsedMs+dtMs)>>>0;}return value.elapsedMs>value.durationMs;}
export function enterShieldAirLocomotion(state,ports={}){
 for(const name of ['readFrame','selectPhase'])port(ports[name],name);
 for(const name of ['animation','launch','landing'])timer(state?.[name],name);
 state.active=true;state.zeroInputAtLaunch=false;
 const frame=call(ports.readFrame,'enter');bool(frame?.actorSlot3c,'actorSlot3c');
 if(frame.actorSlot3c)return state.phase;
 if(!Number.isInteger(frame.actorMode114))throw new TypeError('actorMode114 required');
 if(frame.actorMode114===1){state.phase=1;state.animation.counter=0;state.animation.elapsedMs=0;call(ports.selectPhase,1);}
 else if(frame.actorMode114===2){state.phase=2;call(ports.selectPhase,2);}
 else if(state.launch.durationMs===0)state.phase=0;
 else {state.phase=0;call(ports.selectPhase,0);state.launch.counter=0;state.launch.elapsedMs=0;}
 return state.phase;
}
export function leaveShieldAirLocomotion(state){bool(state?.active,'air active');state.active=false;}
// State/lifecycle are explicit: timers correspond to air+38/+48/+58, no
// inferred animation duration. Phase callbacks must port629880 downstream.
export function tickShieldAirLocomotion(state,dtMs,ports={}){
 dt(dtMs);if(!Number.isInteger(state?.phase)||state.phase<0||state.phase>3)throw new TypeError('Air phase0..3 required');
 for(const name of ['animation','launch','landing'])timer(state[name],name);
 for(const name of ['readFrame','actor70','writeLaunchF0','setActorMode','selectPhase','switchToGround','animationExpired'])port(ports[name],name);
 const select=phase=>{state.phase=phase;if(phase===1){state.animation.counter=0;state.animation.elapsedMs=0;}call(ports.selectPhase,phase);};
 const frame=call(ports.readFrame,'gate');bool(frame?.actorSlot3c,'actorSlot3c');
 const move=()=>{const live=call(ports.readFrame,'movement');const result=shieldAirDisplacement({...live,actorSlot3c:false,dtMs});call(ports.actor70,[...result.nativeDisplacement]);return result;};
 let result={submit:false,velocityWrite:false,nativeReady:false};
 if(state.phase===0){
  if(!frame.actorSlot3c&&advanceTimer(state.launch,dtMs)){
   result=move();const live=call(ports.readFrame,'launch');
   const command=shieldAirLaunchVelocity(live);const ec=vector(live.actorVector);
   call(ports.writeLaunchF0,command.nativeVelocity);call(ports.setActorMode,1);
   state.zeroInputAtLaunch=ec.every(v=>v===0);select(1);result={...result,launchCommand:command};
  }
  return result;
 }
 if(state.phase===3){
  if(!frame.actorSlot3c){result=move();if(advanceTimer(state.landing,dtMs))call(ports.switchToGround);}
  return result;
 }
 if(!frame.actorSlot3c){
  result=move();const live=call(ports.readFrame,'afterActor70');
  if(!Number.isInteger(live?.actorMode114))throw new TypeError('Live actorMode114 required');
  const mode=live.actorMode114;
  if(mode===0||(state.phase!==1&&mode!==2)){
   if(state.landing.durationMs===0)call(ports.switchToGround);
   else {select(3);state.landing.counter=0;state.landing.elapsedMs=0;}
   return result;
  }
  if(state.phase===1&&mode===2){select(2);return result;}
 }
 // Animation timer runs even under actor3C gate in the middle phases.
 if(state.animation.elapsedMs<=state.animation.durationMs&&advanceTimer(state.animation,dtMs))call(ports.animationExpired);
 return result;
}

//628480 jump table: raw actor slots190/194, no semantic direction names.
export function readShieldSpecialLowerPhase(ports={}){
 for(const name of ['readActorSlot190','readActorSlot194'])port(ports[name],name);
 const mode=call(ports.readActorSlot190);if(!Number.isInteger(mode)||mode<0||mode>0xffffffff)throw new TypeError('actorSlot190 uint32 required');
 if(mode===1)return 0;
 if([0,2,4,5].includes(mode))return 1;
 if(mode!==3)return 4;
 const first=call(ports.readActorSlot194);if(!Number.isInteger(first))throw new TypeError('actorSlot194 integer required');
 if(first===0)return 2;
 const second=call(ports.readActorSlot194);if(!Number.isInteger(second))throw new TypeError('actorSlot194 integer required');
 return second===1?3:4;
}
function specialPorts(ports){for(const name of ['readActorSlot190','readActorSlot194','readActorSlot180','readActorSlot3c','requestActorSlot178','playPhase','switchToAir'])port(ports[name],name);}
export function enterShieldSpecialLower(state,ports={}){
 specialPorts(ports);bool(state?.active,'special active');state.active=true;
 const gate=call(ports.readActorSlot180);bool(gate,'actorSlot180');if(!gate)call(ports.requestActorSlot178);
 state.phase=readShieldSpecialLowerPhase(ports);if(state.phase<4)call(ports.playPhase,state.phase);return state.phase;
}
export function leaveShieldSpecialLower(state){bool(state?.active,'special active');state.active=false;}
export function tickShieldSpecialLower(state,dtMs,ports={}){
 dt(dtMs);specialPorts(ports);bool(state?.active,'special active');if(!Number.isInteger(state.phase)||state.phase<0||state.phase>4)throw new TypeError('Special phase0..4 required');
 const next=readShieldSpecialLowerPhase(ports);
 if(next!==state.phase){state.phase=next;if(next<4&&state.active)call(ports.playPhase,next);}
 const gate=call(ports.readActorSlot3c);bool(gate,'actorSlot3c');
 if(!gate){const special=call(ports.readActorSlot180);bool(special,'actorSlot180');if(!special)call(ports.switchToAir);}
 return {phase:state.phase,velocityWrite:false,nativeReady:false};
}

// Required post62C390 includes source event/audio behavior; never hidden no-op.
// Caller classifies direction and chooses its live GameTempo rate BEFORE this
// port. Re-read actorEC for movement as62BBA5 does, after selectPhase callbacks.
export function tickShieldGroundLocomotion(dtMs,{readFrame,selectPhase,actor70,post62c390}={}){
 dt(dtMs);for(const [name,p] of Object.entries({readFrame,selectPhase,actor70,post62c390}))port(p,name);
 const frame=call(readFrame,'classification');
 bool(frame?.actorSlot3c,'actorSlot3c');bool(frame?.externalSkip,'externalSkip');
 let result={submit:false,nativeDisplacement:[0,0,0],velocityWrite:false,nativeReady:false};
 if(!frame.actorSlot3c){
  if(vector(frame.actorVector).every(v=>v===0))call(selectPhase,0);
  else if(frame.externalSkip)return {...result,postSkipped:true}; //62B7xx ->62BCAF
  else {
   const direction=shieldGroundDirection(frame);call(selectPhase,direction.phase);
   const live=call(readFrame,'movement',direction.gameTempoIndex);
   result=shieldGroundDisplacement({...live,actorSlot3c:false,externalSkip:false,dtMs});
   if(result.submit)call(actor70,[...result.nativeDisplacement]);
   result={...result,...direction};
  }
 }
 call(post62c390);return result;
}
