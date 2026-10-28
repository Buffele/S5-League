import {createGrenadeSourceState,advanceGrenadeSource,cancelGrenadeSource,grenadeSourcePose} from './grenade-source-runtime.js';

// Creation requests belong to the held weapon. Transferred projectiles belong
// to the caller's independent manager and survive cancellation or switching.
export const isThrowableWeapon=weapon=>weapon==='grenade';
export const createThrowableRuntime=weapon=>isThrowableWeapon(weapon)?createGrenadeSourceState():null;
export function advanceThrowableRuntime(weapon,state,dt,input,events){
 if(!isThrowableWeapon(weapon))throw new RangeError('Unknown throwable family '+weapon);
 return advanceGrenadeSource(state,dt,input,events);
}
export function cancelThrowableRuntime(weapon,state,held=false){
 if(!isThrowableWeapon(weapon))throw new RangeError('Unknown throwable family '+weapon);
 cancelGrenadeSource(state);state.held=held;return state;
}
export function throwableRuntimePose(weapon,state,direction,moving,sex,{airborne=false}={}){
 if(!isThrowableWeapon(weapon))throw new RangeError('Unknown throwable family '+weapon);
 const pose=grenadeSourcePose(state,direction,moving,sex,1,{airborne});
 return {...pose,lowerLoop:pose.lowerLoopRequested,
  lowerRestartKey:pose.lowerRestartRequested?`${weapon}/${state.phase}/${state.serial}/${airborne?'air':'ground'}`:null,
  lowerSpeed:airborne&&pose.lower?pose.lowerRateScale:undefined};
}
