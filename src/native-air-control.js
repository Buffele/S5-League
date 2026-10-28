import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// CJumpState624F20 movement contribution only. ActorEC is already in native
// world axes. Neither input normalization nor keyboard mapping occurs here.
// Physical velocity, base Tick callbacks, collision and lifecycle stay external.
export function nativeJumpInputDisplacement({phase,actorGate,actorVector,actorMoveSpeedNative,jumpMoveRate,landMoveRate,dtMs,float3}={}){
 if(!Number.isInteger(phase)||phase<1||phase>6)throw new TypeError('Explicit active Jump phase1..6 required; preparation0 is outside this helper');
 if(typeof actorGate!=='boolean'||!Array.isArray(actorVector)||actorVector.length!==3||!actorVector.every(Number.isFinite))throw new TypeError('Explicit actor slot3C gate and three native actorEC components required');
 if(![actorMoveSpeedNative,jumpMoveRate,landMoveRate,dtMs,float3].every(Number.isFinite)||actorMoveSpeedNative<0||!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff||float3<0)throw new TypeError('Explicit native speed, movement rates, uint32 dtMs and Float3 required');
 const f=Math.fround,rate=phase<=4?jumpMoveRate:landMoveRate;
 const speed=f(f(actorMoveSpeedNative)*f(rate)),seconds=f(f(dtMs)*f(float3));
 const nativeDisplacement=actorVector.map(v=>actorGate?0:f(f(f(v)*speed)*seconds));
 return {nativeDisplacement,sceneDisplacement:nativeDisplacement.map(v=>v*SCN_SCENE_SCALE),rateIndex:phase<=4?0x1c:0x1d,velocityWrite:false,nativeReady:false};
}

// Submission only: no mutation of F0 and no invented order relative to actor
// physics or base/child Tick. The owner supplies the actor70 implementation.
export function submitNativeJumpInput(options,{actor70}={}){
 if(typeof actor70!=='function')throw new TypeError('Explicit actor70 displacement consumer required');
 const result=nativeJumpInputDisplacement(options);
 if(!options.actorGate)actor70([...result.nativeDisplacement]);
 return result;
}
