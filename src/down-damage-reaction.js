import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// DownDamage20:80A3E0 config,614370 Enter,6147A0 Leave,6148A0 Tick.
// Current owned18 registry: S32[57]=500ms, Float[112]=-250. The source
// lifecycle and record direction are distinct from ordinary Damage18.
export const DOWN_DAMAGE_REACTION_POLICY=Object.freeze({durationMs:500,horizontalNative:-250,blendTicks:100,nativeReady:false});

// An admitted positive-duration received record routes Down14 or DownDamage20
// to20. Reentry runs Leave/Enter and restarts the timer/pose; this function
// does not infer received-record admission or conditions' state requests.
export function beginDownDamageReaction(lifecycle){
 if(!lifecycle||![14,20].includes(lifecycle.stateId))return null;
 if(!Number.isSafeInteger(lifecycle.phaseSerial)||lifecycle.phaseSerial<0)throw new TypeError('Explicit recovery phase serial required');
 return {...lifecycle,stateId:20,phase:0,elapsedMs:0,age:0,
  phaseSerial:lifecycle.phaseSerial+1,allowLanding:false};
}

export function downDamageReactionAnimation(state,key){
 if(state?.stateId!==20)return null;
 if(!Number.isFinite(state.age)||state.age<0||!Number.isSafeInteger(state.phaseSerial))throw new TypeError('Explicit DownDamage20 cursor required');
 return {clip:'00023',speed:1,loop:false,key:`${key}/down-damage/${state.phaseSerial}`,
  phaseAge:state.age,blendTicks:DOWN_DAMAGE_REACTION_POLICY.blendTicks,
  requestedMs:DOWN_DAMAGE_REACTION_POLICY.durationMs};
}

//614640..61476D multiplies record+18.X/Z directly, not a freshly normalized
// radial vector. It preserves the stored vertical velocity. The source-unit
// multiply rounds before conversion to S5 scene units at this boundary.
export function downDamageReactionVelocity(recordDir,oldVelocity){
 const f=Math.fround;
 if(!Array.isArray(recordDir)||recordDir.length!==3||!recordDir.every(n=>Number.isFinite(n)&&Number.isFinite(f(n)))||
  !oldVelocity||!['x','y','z'].every(k=>Number.isFinite(oldVelocity[k])))throw new TypeError('Finite received-record direction and prior velocity required');
 return {x:f(f(recordDir[0])*DOWN_DAMAGE_REACTION_POLICY.horizontalNative)*SCN_SCENE_SCALE,
  y:oldVelocity.y,
  z:f(f(recordDir[2])*DOWN_DAMAGE_REACTION_POLICY.horizontalNative)*SCN_SCENE_SCALE};
}
