import {submitNativeJumpInput} from './native-air-control.js';
// Frame dispatch order only, from actor51EAB0. Callbacks retain actor gates,
// intermediate mutations, state transitions and child effects explicitly.
export function traceNativeJumpDispatch({actorAcceptsPhysics,physicsTick,betweenPhysicsAndState,resolveCurrentStateTick,dtMs}={}){
 if(typeof actorAcceptsPhysics!=='boolean'||!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff||![physicsTick,betweenPhysicsAndState,resolveCurrentStateTick].every(v=>typeof v==='function'))throw new TypeError('Explicit native gate, uint32 tick and callbacks required');
 const timeline=[];
 if(actorAcceptsPhysics){physicsTick(dtMs);timeline.push('actor-physics');}
 betweenPhysicsAndState(dtMs);timeline.push('intermediate-actor-callbacks');
 const currentStateTick=resolveCurrentStateTick();timeline.push('resolve-current-state');
 if(currentStateTick!==null&&typeof currentStateTick!=='function')throw new TypeError('Current state Tick must be resolved explicitly or null');
 if(currentStateTick){currentStateTick(dtMs);timeline.push('current-state-tick');}
 return {timeline,nativeReady:false};
}

function logicalVector(value){
 if(!value||!['x','y','z'].every(axis=>Number.isFinite(value[axis])))throw new TypeError('Explicit decoded logical actor velocity required');
 return {x:value.x,y:value.y,z:value.z};
}
function provenance(value){
 if(!['source-port','explicit-no-op-unverified'].includes(value))throw new TypeError('Explicit callback provenance required');
 return value;
}
// For active phases1..6 only. Phase0 launch/entry must retain its own complete
// Tick callback until ported. Read phase/input AFTER base callbacks mutate it.
export function createNativeJumpAirControlTick({baseJumpTick,readMovementOptions,actor70,baseProvenance}={}){
 if(![baseJumpTick,readMovementOptions,actor70].every(fn=>typeof fn==='function'))throw new TypeError('Explicit Jump base, live movement options and actor70 callbacks required');
 provenance(baseProvenance);
 return dtMs=>{
  baseJumpTick(dtMs);
  const movement=submitNativeJumpInput({...readMovementOptions(),dtMs},{actor70});
  return {movement,baseProvenance,nativeReady:false};
 };
}
// Opt-in harness, OFF by default. It does not infer policy/gates or replace an
// unported current state. Resolver supplies the complete Tick of that state.
export function runNativeJumpDiagnostic({enabled=false,readPhysicalVelocityNative,intermediateProvenance,...options}={}){
 if(enabled===false)return {status:'disabled',nativeReady:false};
 if(enabled!==true||typeof readPhysicalVelocityNative!=='function')throw new TypeError('Explicit diagnostic enable and logical actor velocity reader required');
 if(![options.physicsTick,options.betweenPhysicsAndState,options.resolveCurrentStateTick].every(fn=>typeof fn==='function'))throw new TypeError('Explicit diagnostic actor callbacks required');
 provenance(intermediateProvenance);
 const snapshots={beforePhysics:logicalVector(readPhysicalVelocityNative())};
 const dispatch=traceNativeJumpDispatch({...options,
  physicsTick:dtMs=>{options.physicsTick(dtMs);snapshots.afterPhysics=logicalVector(readPhysicalVelocityNative());},
  betweenPhysicsAndState:dtMs=>{options.betweenPhysicsAndState(dtMs);snapshots.beforeCurrentState=logicalVector(readPhysicalVelocityNative());},
 });
 snapshots.afterCurrentState=logicalVector(readPhysicalVelocityNative());
 return {status:'diagnostic-only',...dispatch,physicalVelocityNative:snapshots,intermediateProvenance,limits:['Callback provenance is supplied, not independently certified','No keyboard mapping, physics gate or actor70 collision policy inferred'],nativeReady:false};
}
