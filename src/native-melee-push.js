import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// AddPushCondition5703c0 -> constructor54fca0, vtable13aba4c.
// Enter54ffe0 starts the scalar at parameter1 and negates record direction.
// Update5500a0 integrates parameter2, then submits a displacement (not Blow's
// velocity write). Proof: work/melee-batch-5/push-native.md.
// timeFactor is the native parameter registry entry3: deliberately REQUIRED
// until its registry loading is authenticated. Actor+70 is separately ported
// in native-push-actor.js, with its unresolved actor policy inputs explicit.
export function createNativeMeleePush(parameters,recordDirection,{timeFactor,additionalAcceleration=0,accelerationRate=0,scale=SCN_SCENE_SCALE,clockMode='native-u32'}={}){
 if(!Array.isArray(parameters)||parameters.length!==3||!parameters.every(Number.isFinite)||parameters[0]<0||parameters[0]>0xffffffff||!Number.isInteger(parameters[0]))throw new TypeError('Push duration and two finite source parameters required');
 if(!Array.isArray(recordDirection)||recordDirection.length!==3||!recordDirection.every(Number.isFinite))throw new TypeError('Three finite record direction components required');
 if(![timeFactor,additionalAcceleration,accelerationRate,scale].every(Number.isFinite)||timeFactor<=0||scale<=0)throw new TypeError('Explicit positive native time factor and scene scale required');
 if(!['native-u32','arena-fractional-ms'].includes(clockMode))throw new RangeError('Explicit clock mode required');
 return {durationMs:parameters[0],scalar:Math.fround(parameters[1]),acceleration:Math.fround(parameters[2]),
  direction:recordDirection.map(v=>Math.fround(-v)),timeFactor:Math.fround(timeFactor),additionalAcceleration:Math.fround(additionalAcceleration),accelerationRate:Math.fround(accelerationRate),scale,clockMode,
  elapsedMs:0,ticks:0,updateCount:0,paused:false,active:true};
}

export function advanceNativeMeleePush(state,dtMs,{actorAcceptsUpdate=true}={}){
 if(!Number.isFinite(dtMs)||dtMs<0||dtMs>0xffffffff||(state.clockMode==='native-u32'&&!Number.isInteger(dtMs)))throw new RangeError('Valid tick delta required');
 if(!state.active)return {displacement:{x:0,y:0,z:0},active:false};
 if(!actorAcceptsUpdate){state.active=false;return {displacement:{x:0,y:0,z:0},active:false};}
 const f=Math.fround,dt=f(f(dtMs)*state.timeFactor);
 const acceleration=f(f(state.acceleration+state.additionalAcceleration)+f(state.accelerationRate*f(Math.abs(state.acceleration))));
 state.scalar=f(state.scalar+f(acceleration*dt));
 const delta=state.direction.map(v=>f(f(v*state.scalar)*dt)*state.scale);
 state.updateCount=(state.updateCount+1)>>>0;
 // The native update submits displacement BEFORE the clock test, including
 // the tick that exceeds duration. Clock pause does not skip the update body.
 if(!state.paused){
  state.ticks=(state.ticks+1)>>>0;
  state.elapsedMs=state.clockMode==='native-u32'?(state.elapsedMs+dtMs)>>>0:state.elapsedMs+dtMs;
  state.active=state.elapsedMs<=state.durationMs;
 }
 return {displacement:{x:delta[0],y:delta[1],z:delta[2]},active:state.active};
}
