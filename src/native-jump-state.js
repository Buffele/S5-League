// Decoded CJumpState624F20 / substate54=626A20 / landing627B10.
// Native axes and source return-address keys. No keyboard mapping is inferred.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const scalar=(v,n)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`Explicit finite native ${n} required`);return f(v);};
const bool=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const vector=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit native XYZ required');return v.map(n=>scalar(n,'component'));};
const zero=v=>v.every(n=>n===0);
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
function requirePorts(p,names){if(typeof p.source!=='string'||!p.source.trim()||!names.every(n=>sync(p[n])))throw TypeError(`Explicit synchronous source ports required: ${names.join(', ')}`);}
function call(fn,...args){const result=fn(...args);if(result&&typeof result.then==='function')throw TypeError('Native Jump ports must complete synchronously');return result;}
function timer(value){
 if(!value||typeof value!=='object')throw TypeError('Explicit native Jump timer required');
 return {count:uint(value.count,'count'),limit:uint(value.limit,'limit'),elapsed:uint(value.elapsed,'elapsed'),paused:bool(value.paused,'timer pause')};
}
function advance(value,dtMs){const result=timer(value);if(!result.paused){result.count=(result.count+1)>>>0;result.elapsed=(result.elapsed+dtMs)>>>0;}return result;}
function reset(value){return {...timer(value),count:0,elapsed:0};}
function patch(p,changes,api){const current=call(p.readJumpState,api);if(!current||typeof current!=='object')throw TypeError('Explicit Jump state record required');call(p.writeJumpState,{...current,...changes},api);}
function readPhase(p,api){const phase=uint(call(p.readJumpState,api)?.phase134,'Jump phase134');if(phase>6)throw Error('Unqualified Jump phase outside0..6');return phase;}

export const NATIVE_JUMP_ACTOR70_CALLSITES=Object.freeze({preparation:0x625269,rising:0x6256f8,falling:0x625cd9,landing:0x626298});

//100AF90: SSE dot uses (X+Y)+Z, not a host norm or absolute direction.
export function nativeJumpLandingDot({actorForward8c,actorVectorEc}={}){
 const a=vector(actorForward8c),b=vector(actorVectorEc);return f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
}

const statePorts=['readJumpState','writeJumpState','readAnimationParameter','readAnimator','playAnimationB77cb0','airSequence627790','landingEffect627a80'];

// Full substate54 body: phase2/4 only assign134; they do not reset timers or
// play a substituted falling clip. Consumers retain real animation/effect work.
export function createNativeJumpSubstate54(p={}){
 requirePorts(p,statePorts);
 return (phase,api)=>{
  phase=uint(phase,'Jump destination phase');if(phase>6)throw Error('Unqualified Jump destination phase outside0..6');
  patch(p,{phase134:phase},api);
  if(phase===2||phase===4)return {qualified:true,phase,plays:0,physicalActorWrite:false,timer22cWrite:false,nativeReady:false};
  const parameterIndex=phase===0?0:phase===1?1:phase===3?2:phase===5?3:4;
  for(const slot of [0,1,3,4,5]){
   const current=call(p.readJumpState,api),duration=phase===0?uint(current.duration160,'Jump duration160'):phase===1||phase===3?uint(current.duration150,'Jump duration150'):0;
   const parameter=call(p.readAnimationParameter,parameterIndex,api);
   if(!parameter||typeof parameter!=='object')throw Error('Unqualified current Jump animation parameter');
   const animator=call(p.readAnimator,slot,api);
   call(p.playAnimationB77cb0,{type:'native-jump-animation',parameterIndex,parameter,animator,slot,duration,weight:1,argumentZero:0,source:'626A20:B77CB0'},api);
  }
  if(phase===1||phase===3){
   call(p.airSequence627790,api);
   const current=call(p.readJumpState,api);patch(p,{timer14c:reset(current.timer14c)},api);
  }else if(phase===5||phase===6)call(p.landingEffect627a80,api);
  return {qualified:true,phase,plays:5,physicalActorWrite:false,timer22cWrite:false,nativeReady:false};
 };
}

function movement(p,api,dtMs,rateIndex,callsite){
 const seconds=f(f(dtMs)*scalar(call(p.readFloat,3,api),'Float3'));
 const rate=scalar(call(p.readGameTempo,rateIndex,api),'GameTempo movement rate');
 const input=vector(call(p.readActorVector,api)),speed=scalar(call(p.readMoveSpeed,api),'actor speed51DAE0');
 const scaled=f(speed*rate),displacement=input.map(v=>f(f(v*scaled)*seconds));
 if(displacement.some(v=>!Number.isFinite(v)))throw TypeError('Jump movement overflow');
 const result={displacement,callsite,rateIndex};call(api.actor70,result);return result;
}

//627B10: choose stationary/back-facing landing5, otherwise6; reset16C AFTER
// substate54. A zero landing duration exits directly without playing reception.
export function createNativeJumpLandingTransition(p={}){
 requirePorts(p,[...statePorts,'readActorVector','readActorForward','readFloat','actor24']);
 const enter=createNativeJumpSubstate54(p);
 return api=>{
  let current=call(p.readJumpState,api);const landing=timer(current.timer16c);
  if(landing.limit===0){const target=uint(current.returnState13c,'return state13C');call(p.actor24,target,api);return {qualified:true,path:'direct-return',target,nativeReady:false};}
  const input=vector(call(p.readActorVector,api)),forward=vector(call(p.readActorForward,api));
  let phase=5;
  if(!zero(input)){
   const threshold=scalar(call(p.readFloat,43,api),'Float43'),dot=nativeJumpLandingDot({actorForward8c:forward,actorVectorEc:input});
   if(threshold<=dot)phase=6;
  }
  enter(phase,api);current=call(p.readJumpState,api);patch(p,{timer16c:reset(current.timer16c)},api);
  return {qualified:true,path:'landing',phase,timer22cWrite:false,nativeReady:false};
 };
}

// Full decoded Tick0..6; base5617F0, current gates and effect consumers are
// mandatory. State writes can bind directly to frame-owned stateContainer.
export function createNativeJumpStateTick(p={}){
 requirePorts(p,[...statePorts,'baseTick','readActorGate','readActor180','actor24','readFloat','readGameTempo','readActorVector','readActorForward','readMoveSpeed','readJumpParameter0']);
 const enter=createNativeJumpSubstate54(p),land=createNativeJumpLandingTransition(p);
 function expiry14c(dtMs,api,allowed){
  const before=timer(call(p.readJumpState,api).timer14c);
  if(before.limit<before.elapsed)return false;
  const after=advance(before,dtMs);if(!after.paused)patch(p,{timer14c:after},api);
  if(after.limit>=after.elapsed||!allowed.includes(readPhase(p,api)))return false;
  for(const slot of [0,1,3,4,5]){
   const parameter=call(p.readAnimationParameter,5,api);if(!parameter||typeof parameter!=='object')throw Error('Unqualified Jump timer animation parameter5');
   const animator=call(p.readAnimator,slot,api);
   call(p.playAnimationB77cb0,{type:'native-jump-animation',parameterIndex:5,parameter,animator,slot,duration:0,weight:1,argumentZero:0,source:'624F20:B77CB0'},api);
  }
  return true;
 }
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');call(p.baseTick,dtMs,api);
  if(!bool(call(p.readActorGate,api),'actor slot3C')&&bool(call(p.readActor180,api),'actor slot180')){
   const target=uint(call(p.readJumpState,api).redirect144,'Jump redirect144');
   if(target!==0){call(p.actor24,target,api);return {qualified:true,path:'redirect',nativeReady:false};}
  }
  const phase=readPhase(p,api),gated=bool(call(p.readActorGate,api),'actor slot3C');let submitted=null,transition=null,expiryAnimation=false;
  if(phase===0){
   if(gated)return {qualified:true,path:'gated-preparation',nativeReady:false};
   const before=timer(call(p.readJumpState,api).timer15c),after=advance(before,dtMs);if(!after.paused)patch(p,{timer15c:after},api);
   if(after.limit>=after.elapsed)return {qualified:true,path:'preparation-delay',nativeReady:false};
   // Preparation source reads speed/vector BEFORE GameTempo1C, unlike1..6.
   const seconds=f(f(dtMs)*scalar(call(p.readFloat,3,api),'Float3')),speed=scalar(call(p.readMoveSpeed,api),'actor speed51DAE0'),input=vector(call(p.readActorVector,api));
   const rate=scalar(call(p.readGameTempo,28,api),'GameTempo1C'),scaled=f(speed*rate),displacement=input.map(v=>f(f(v*scaled)*seconds));
   if(displacement.some(v=>!Number.isFinite(v)))throw TypeError('Jump preparation movement overflow');
   submitted={displacement,callsite:NATIVE_JUMP_ACTOR70_CALLSITES.preparation,rateIndex:28};call(api.actor70,submitted);
   const z=scalar(call(p.readFloat,0,api),'Float0'),y=scalar(call(p.readFloat,47,api),'Float47'),x=scalar(call(p.readFloat,0,api),'Float0'),force=scalar(call(p.readJumpParameter0,api),'Jump parameter0');
   const impulse=[x,y,z].map(v=>f(v*force));if(impulse.some(v=>!Number.isFinite(v)))throw TypeError('Jump impulse overflow');
   call(api.writeVelocityF0,impulse);call(api.writeMode114,1);const stationary=zero(input);patch(p,{stationary17c:stationary},api);enter(stationary?1:3,api);
   return {qualified:true,path:'launched',submitted,impulse,timer22cWrite:false,nativeReady:false};
  }
  if(phase===1||phase===3){
   if(!gated){
    submitted=movement(p,api,dtMs,28,NATIVE_JUMP_ACTOR70_CALLSITES.rising);
    if(uint(api.readPhysics().mode114,'mode114')===0)transition=land(api);
    // Source reads mode AFTER the landing helper and phase AFTER its effects.
    if(uint(api.readPhysics().mode114,'mode114')===2)enter(readPhase(p,api)===1?2:4,api);
   }
   expiryAnimation=expiry14c(dtMs,api,[1,3]);
  }else if(phase===2||phase===4){
   if(!gated){
    submitted=movement(p,api,dtMs,28,NATIVE_JUMP_ACTOR70_CALLSITES.falling);
    if(uint(api.readPhysics().mode114,'mode114')===0)transition=land(api);
    else if(uint(api.readPhysics().mode114,'mode114')!==2)transition=land(api);
   }
   expiryAnimation=expiry14c(dtMs,api,[2,4]);
  }else if(phase===5||phase===6){
   if(gated)return {qualified:true,path:'gated-landing',nativeReady:false};
   submitted=movement(p,api,dtMs,29,NATIVE_JUMP_ACTOR70_CALLSITES.landing);
   const before=timer(call(p.readJumpState,api).timer16c),after=advance(before,dtMs);if(!after.paused)patch(p,{timer16c:after},api);
   if(after.limit<after.elapsed){const target=uint(call(p.readJumpState,api).returnState13c,'return state13C');call(p.actor24,target,api);transition={path:'return',target};}
  }
  return {qualified:true,path:'active',phase,submitted,transition,expiryAnimation,physicalVelocityWrite:false,timer22cWrite:false,nativeReady:false};
 };
}

// Entire624B00..624ED3 Enter body. All sourced timers/parameters are owned
// records; baseEnter/animation/actor callbacks still require real consumers.
// In particular a zero predelay stores phase0 WITHOUT playing preparation.
export function createNativeJumpStateEnter(p={}){
 requirePorts(p,[...statePorts,'baseEnter','readGameTempo','readActorGate','readActor180','actor24','writeActor214']);
 const enter=createNativeJumpSubstate54(p);
 return api=>{
  call(p.baseEnter,api);
  const force=scalar(call(p.readGameTempo,27,api),'GameTempo27'),flight=uint(call(p.readGameTempo,30,api),'GameTempo30'),preparation=uint(call(p.readGameTempo,31,api),'GameTempo31'),landing=uint(call(p.readGameTempo,32,api),'GameTempo32');
  // Parameters118 indices0..3 are explicitly written before typed reads1..3.
  const before=call(p.readJumpState,api);if(!before.parameters118||Array.isArray(before.parameters118)||typeof before.parameters118!=='object')throw TypeError('Explicit complete current Jump property118 table required');
  patch(p,{parameters118:{...before.parameters118,0:force,1:flight,2:preparation,3:landing},jumpParameter0:force},api);
  let state=call(p.readJumpState,api);const limits=[1,2,3].map(i=>uint(state.parameters118?.[i],`Jump parameter${i}`));
  const init=(value,limit)=>({...timer(value),count:0,limit,elapsed:0});
  patch(p,{timer14c:init(state.timer14c,limits[0]),timer15c:init(state.timer15c,limits[1]),timer16c:init(state.timer16c,limits[2]),duration150:limits[0],duration160:limits[1],duration170:limits[2]},api);
  if(!bool(call(p.readActorGate,api),'actor3C')&&bool(call(p.readActor180,api),'actor180')){
   const target=uint(call(p.readJumpState,api).redirect144,'Jump redirect144');
   if(target!==0){call(p.actor24,target,api);return {qualified:true,path:'redirect',target,nativeReady:false};}
  }
  state=call(p.readJumpState,api);patch(p,{stationary17c:false,timer14c:{...timer(state.timer14c),elapsed:uint(state.duration150,'Jump duration150')}},api);
  let selected=null;
  if(!bool(call(p.readActorGate,api),'actor3C')){
   state=call(p.readJumpState,api);
   if(uint(state.enterType130,'Jump enterType130')===1){selected=0;enter(0,api);}
   else if(uint(api.readPhysics().mode114,'mode114')===1){selected=1;enter(1,api);}
   else if(uint(api.readPhysics().mode114,'mode114')===2){selected=2;enter(2,api);}
   else if(uint(call(p.readJumpState,api).duration160,'Jump duration160')!==0){
    selected=0;enter(0,api);state=call(p.readJumpState,api);patch(p,{timer15c:reset(state.timer15c)},api);
   }else patch(p,{phase134:0},api);
  }
  call(p.writeActor214,false,api);
  return {qualified:true,path:'entered',selected,physicalVelocityWrite:false,nativeReady:false};
 };
}
