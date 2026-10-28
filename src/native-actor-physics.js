// Base actor physics526D00, vtable13AAFDC+1F8. Logical, decoded fields in
// native units; protected-value storage and actor28 commands remain host ports.
// The actor70 callback includes the CURRENT wrapper accumulator/collision path.
const f=Math.fround;
export const NATIVE_PHYSICS_MOVEBY_CALLSITES=Object.freeze({ground:0x526f0e,air:0x527467});
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const float=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Explicit finite ${label} required`);return f(n);};
const vector=a=>{if(!Array.isArray(a)||a.length!==3)throw TypeError('Explicit native XYZ required');return a.map(n=>float(n,'vector component'));};
function timer(value){
 if(!value||typeof value.paused!=='boolean')throw TypeError('Explicit native22C timer state required');
 return {count:uint(value.count,'timer count'),limit:uint(value.limit,'timer limit'),elapsed:uint(value.elapsed,'timer elapsed'),paused:value.paused};
}
export function copyNativeActorPhysicsState(state){
 if(!state||typeof state.grounded6b4!=='boolean')throw TypeError('Explicit actor physics state required');
 return {...state,mode114:uint(state.mode114,'actor mode114'),actor2f0:vector(state.actor2f0),velocityF0:vector(state.velocityF0),
  field398:uint(state.field398,'actor field398'),timer22c:timer(state.timer22c)};
}
function lowTruncatedInt64(value){
 // FE6050 converts the already-stored f32 product and returns EAX. Do not
 // replace this with millisecond dt or a guessed fractional timer carry.
 if(!Number.isFinite(value)||value<-(2**63)||value>=2**63)throw RangeError('Native timer int64 conversion domain unqualified');
 return Number(BigInt.asUintN(32,BigInt(Math.trunc(value))));
}

export function nativeActorPhysicsTick({state,dtMs,readFloat,readTerminalSpeed,readGravity,moveBy}={}){
 const next=copyNativeActorPhysicsState(state);dtMs=uint(dtMs,'engine delta milliseconds');
 if(typeof readFloat!=='function'||typeof readTerminalSpeed!=='function'||typeof moveBy!=='function')throw TypeError('Current registry, terminal property and actor70 callbacks required');
 const registryReads=[],trace=[],actor28Commands=[];
 const registry=index=>{const value=float(readFloat(index,copyNativeActorPhysicsState(next)),`Float${index}`);registryReads.push({index,value});return value;};
 const terminal=()=>float(readTerminalSpeed(copyNativeActorPhysicsState(next)),'actor terminal speed slotB0');
 const seconds=f(f(dtMs)*registry(3)),before=next.actor2f0.slice();
 //526DDB..DE1: reset once at physics entry, including zero-dt/queued moves.
 next.grounded6b4=false;
 const submit=(displacement,callsite)=>{
  const result=moveBy({displacement:displacement.slice(),callsite,grounded6b4:next.grounded6b4,
   actor2f0:next.actor2f0.slice(),velocityF0:next.velocityF0.slice(),mode114:next.mode114,
   physicsState:copyNativeActorPhysicsState(next)});
  if(result?.qualified!==true)return {qualified:false,state:null,reason:result?.reason??'actor70-unqualified',trace,registryReads,actor28Commands:[]};
  if(typeof result.grounded6b4!=='boolean')throw TypeError('Explicit current solver ground byte required after actor70');
  next.actor2f0=vector(result.actor2f0);next.grounded6b4=result.grounded6b4;
  trace.push({callsite,displacement:displacement.slice(),actor2f0:next.actor2f0.slice(),grounded6b4:next.grounded6b4});
  return null;
 };
 if(next.mode114===0){
  //526DF8..6F0C: grounded mode ignores the retained physical F0 vector.
  const z=registry(0),x=registry(0),y=terminal();
  const refused=submit([f(x*seconds),f(y*seconds),f(z*seconds)],NATIVE_PHYSICS_MOVEBY_CALLSITES.ground);
  if(refused)return refused;
  if(next.grounded6b4)next.field398=0;
  else if(0>f(next.actor2f0[1]-before[1])){
   next.mode114=2;
   const fallZ=registry(0),factor=registry(23),fallX=registry(0);
   next.velocityF0=[fallX,f(terminal()*factor),fallZ];
   actor28Commands.push(0x36);
  }
 }else{
  if(typeof readGravity!=='function')throw TypeError('Current actor gravity property slotB4 required');
  //52719F..1B0 compares limit with elapsed (unsigned), then inverts JB.
  // The special factors/update branch runs while elapsed <= limit, including
  // equality; it stops after the boundary is exceeded.
  let gravityFactor=registry(47),movementFactor=registry(47);
  const t=next.timer22c;
  if(t.elapsed<=t.limit){
   gravityFactor=registry(60);movementFactor=registry(82);
   const increment=lowTruncatedInt64(f(registry(128)*seconds));
   if(!t.paused){t.count=(t.count+1)>>>0;t.elapsed=(t.elapsed+increment)>>>0;}
  }
  const gravity=float(readGravity(copyNativeActorPhysicsState(next)),'actor gravity slotB4');
  next.velocityF0[1]=f(next.velocityF0[1]+f(gravity*f(seconds*gravityFactor)));
  const speedLimit=terminal();if(speedLimit>next.velocityF0[1])next.velocityF0[1]=speedLimit;
  const travelSeconds=f(seconds*movementFactor);
  const refused=submit(next.velocityF0.map(n=>f(n*travelSeconds)),NATIVE_PHYSICS_MOVEBY_CALLSITES.air);
  if(refused)return refused;
  if(next.mode114===1){
   if(0>next.velocityF0[1]||0>f(next.actor2f0[1]-before[1]))next.mode114=2;
  }else if(next.mode114===2&&next.grounded6b4){
   next.mode114=0;actor28Commands.push(0x37);
  }
 }
 return {qualified:true,state:next,seconds,trace,registryReads,actor28Commands,
  nativeExecutionCompared:false,nativeReady:false};
}
