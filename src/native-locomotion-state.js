// Decoded state contributions from the pinned client, without native execution.
// These ports deliberately retain base Tick, animation and transition effects.
// They do not certify the implementations supplied by their caller.
const f=Math.fround;
const uint=(value,label)=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return value;};
const scalar=(value,label)=>{if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`Explicit finite native ${label} required`);return f(value);};
const vector=value=>{if(!Array.isArray(value)||value.length!==3)throw TypeError('Explicit native XYZ required');return value.map(n=>scalar(n,'vector component'));};
const bool=value=>{if(typeof value!=='boolean')throw TypeError('Explicit native boolean gate required');return value;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const call=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Native state ports must complete synchronously');return value;};
const requirePorts=(ports,names)=>{if(!names.every(name=>sync(ports[name])))throw TypeError(`Explicit synchronous ports required: ${names.join(', ')}`);};
const evidence=value=>{if(typeof value!=='string'||!value.trim())throw TypeError('Explicit source-port provenance required');return value;};
const zero=value=>value.every(n=>n===0);

export const NATIVE_LOCOMOTION_CALLSITES=Object.freeze({run:0x6353a7,jumpPreparation:0x625269});

// 63529D..6353A5: no acceleration, diagonal normalization or F0 write.
// Directional rate must come from the live selection in 634D22..635218.
export function nativeRunInputDisplacement({actorVector,actorMoveSpeedNative,selectedDirectionalRate,dtMs,float3}={}){
 const input=vector(actorVector),speed=scalar(actorMoveSpeedNative,'move speed'),rate=scalar(selectedDirectionalRate,'selected Run rate');
 const seconds=f(f(uint(dtMs,'dtMs'))*scalar(float3,'Float3'));
 const scaledSpeed=f(speed*rate),displacement=input.map(n=>f(f(n*scaledSpeed)*seconds));
 if(displacement.some(n=>!Number.isFinite(n)))throw TypeError('Native Run displacement overflow');
 return {displacement,callsite:NATIVE_LOCOMOTION_CALLSITES.run,velocityWrite:false,modeWrite:false,timer22cWrite:false,nativeReady:false};
}

// 100B040: Y of cross(actor slot8C, actor slotEC), with SSE arithmetic.
export function nativeRunSideCrossY({forward8c,actorVector}={}){
 const forward=vector(forward8c),input=vector(actorVector);
 return f(f(forward[2]*input[0])-f(forward[0]*input[2]));
}

// Selection arithmetic only. The angle and cross Y are explicit outputs of
// the source vector helpers; JS acos/normalization is never substituted here.
export function nativeRunDirectionalSelection({angle,crossY,float0,float24,float41,float39,pi14c90b4}={}){
 angle=scalar(angle,'angle');crossY=scalar(crossY,'side cross Y');float0=scalar(float0,'Float0');pi14c90b4=scalar(pi14c90b4,'literal pi14C90B4');
 const frontBoundary=f(scalar(float24,'Float24')*pi14c90b4),backBoundary=f(scalar(float41,'Float41')*pi14c90b4);
 if(frontBoundary>angle)return {substate:0,rateIndex:0x17};
 if(angle>=backBoundary)return {substate:7,rateIndex:0x19};
 const interval=scalar(float39,'Float39'),sectorFloat=f(f(angle-frontBoundary)/interval);
 if(interval===0||!Number.isFinite(sectorFloat)||sectorFloat>=2147483648||sectorFloat< -2147483648)throw TypeError('Native Run angular sector cannot be qualified');
 const sector=Math.trunc(sectorFloat),substate=sector+(float0>crossY?1:4);
 return {substate,rateIndex:0x18};
}

function redirect(ports,api){
 if(bool(call(ports.readActorGate,api)))return false;
 if(!bool(call(ports.readActor180,api)))return false;
 const target=uint(call(ports.readRedirectTarget,api),'redirect state');
 if(target===0)return false;
 call(ports.actor24,target,api);return true;
}

// Entire CNormalState Tick body62CF70..62D01C, with its base5617F0 explicit.
// In particular Normal does NOT repeatedly zero F0 merely because it is idle.
export function createNativeNormalStateTick(ports={}){
 requirePorts(ports,['baseTick','readActorGate','readActor180','readRedirectTarget','readAirStateTarget','actor24']);evidence(ports.source);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');call(ports.baseTick,dtMs,api);
  if(redirect(ports,api))return {qualified:true,path:'redirect',nativeReady:false};
  const mode=uint(api.readPhysics().mode114,'actor mode114');
  if(mode!==0){const target=uint(call(ports.readAirStateTarget,api),'Normal state118');call(ports.actor24,target,api);return {qualified:true,path:'air-state',nativeReady:false};}
  return {qualified:true,path:'normal',nativeReady:false};
 };
}

// CRunState outer Tick ordering. runHead owns635650 + child888310;
// selectDirection owns634D22..635218, including state54 animation selection.
// It returns {qualified:true,readRate}, preserving the later protected getter.
// runTail owns635D70 even when gated/zero. Those effects cannot be omitted.
export function createNativeRunStateTick(ports={}){
 requirePorts(ports,['baseTick','readActorGate','readActor180','readRedirectTarget','actor24','runHead','readActorVector','selectDirection','readFloat3','readMoveSpeed','runTail']);evidence(ports.source);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');call(ports.baseTick,dtMs,api);
  if(redirect(ports,api))return {qualified:true,path:'redirect',nativeReady:false};
  call(ports.runHead,dtMs,api);let movement=null,path='gated';
  if(!bool(call(ports.readActorGate,api))){
   const input=vector(call(ports.readActorVector,api));path='zero-input';
   if(!zero(input)){
    const selected=call(ports.selectDirection,input.slice(),api);
    if(!selected||selected.qualified!==true||!sync(selected.readRate))throw Error('Unqualified native Run direction selection');
    const float3=call(ports.readFloat3,api);
    const rate=scalar(call(selected.readRate,api),'selected Run rate');
    // The source reads actorEC again after direction/state54 effects.
    const currentInput=vector(call(ports.readActorVector,api)),speed=call(ports.readMoveSpeed,api);
    movement=nativeRunInputDisplacement({actorVector:currentInput,actorMoveSpeedNative:speed,selectedDirectionalRate:rate,dtMs,float3});
    call(api.actor70,movement);path='movement';
   }
  }
  call(ports.runTail,api);return {qualified:true,path,movement,nativeReady:false};
 };
}

export function copyNativeJumpPreparationTimer(timer){
 if(!timer||typeof timer.paused!=='boolean')throw TypeError('Explicit Jump timer15C required');
 return {count:uint(timer.count,'Jump timer count'),limit:uint(timer.limit,'Jump timer limit'),elapsed:uint(timer.elapsed,'Jump timer elapsed'),paused:timer.paused};
}

// 624FEA..625088. Equality does not launch; unsigned overflow is retained.
export function advanceNativeJumpPreparationTimer(timer,dtMs){
 const result=copyNativeJumpPreparationTimer(timer);dtMs=uint(dtMs,'dtMs');
 if(!result.paused){result.count=(result.count+1)>>>0;result.elapsed=(result.elapsed+dtMs)>>>0;}
 return {timer:result,expired:result.limit<result.elapsed};
}

// Phase0 body624FCC..6254E5 AFTER base Tick/early redirect. It first
// submits input, then writes the jump impulse F0 and mode1, then state54.
// Substate54's animation/parameter effects are mandatory external ports.
export function createNativeJumpPreparationTick(ports={}){
 requirePorts(ports,['baseTick','readActorGate','readActor180','readRedirectTarget','actor24','readPhase','readTimer15c','writeTimer15c','readFloat','readMoveSpeed','readActorVector','readJumpMoveRate','readJumpParameter0','writeStationary17c','enterSubstate54']);evidence(ports.source);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');call(ports.baseTick,dtMs,api);
  if(redirect(ports,api))return {qualified:true,path:'redirect',nativeReady:false};
  if(uint(call(ports.readPhase,api),'Jump phase')!==0)throw Error('Jump preparation port refuses active phases; supply their complete source Tick');
  if(bool(call(ports.readActorGate,api)))return {qualified:true,path:'gated',nativeReady:false};
  const timer=advanceNativeJumpPreparationTimer(call(ports.readTimer15c,api),dtMs);
  if(!timer.timer.paused)call(ports.writeTimer15c,timer.timer,api);
  if(!timer.expired)return {qualified:true,path:'preparation-delay',timer:timer.timer,nativeReady:false};
  const seconds=f(f(dtMs)*scalar(call(ports.readFloat,3,api),'Float3'));
  const speed=scalar(call(ports.readMoveSpeed,api),'move speed');
  const input=vector(call(ports.readActorVector,api)),rate=scalar(call(ports.readJumpMoveRate,api),'Jump movement rate');
  const scaledSpeed=f(speed*rate),displacement=input.map(n=>f(f(n*scaledSpeed)*seconds));
  if(displacement.some(n=>!Number.isFinite(n)))throw TypeError('Native Jump displacement overflow');
  const movement={displacement,callsite:NATIVE_LOCOMOTION_CALLSITES.jumpPreparation};
  call(api.actor70,movement);
  // Getter invocation order is Float0, Float47, Float0 (Z,Y,X).
  const z=scalar(call(ports.readFloat,0,api),'Float0'),y=scalar(call(ports.readFloat,47,api),'Float47'),x=scalar(call(ports.readFloat,0,api),'Float0');
  const force=scalar(call(ports.readJumpParameter0,api),'Jump parameter0'),impulse=[x,y,z].map(n=>f(n*force));
  if(impulse.some(n=>!Number.isFinite(n)))throw TypeError('Native Jump impulse overflow');
  call(api.writeVelocityF0,impulse);call(api.writeMode114,1);
  const stationary=zero(input),substate=stationary?1:3;
  call(ports.writeStationary17c,stationary,api);call(ports.enterSubstate54,substate,api);
  return {qualified:true,path:'launched',timer:timer.timer,movement,impulse,substate,timer22cWrite:false,nativeReady:false};
 };
}

