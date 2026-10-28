import {createMindEnergySourceState,advanceMindEnergySource,cancelMindEnergySource,mindEnergySourcePose} from './mind-energy-source-runtime.js';

// Support requests have their own route. They must never enter pendingShots,
// generic ranged damage, or the melee fallback.
export const isSupportWeapon=weapon=>weapon==='mindenergy';
export const createSupportRuntime=weapon=>isSupportWeapon(weapon)?createMindEnergySourceState():null;
export function advanceSupportRuntime(weapon,state,dt,input,events){
 if(!isSupportWeapon(weapon))throw new RangeError('Unknown support family '+weapon);
 return advanceMindEnergySource(state,dt,input,events);
}
export function cancelSupportRuntime(weapon,state,held=false){
 if(!isSupportWeapon(weapon))throw new RangeError('Unknown support family '+weapon);
 return cancelMindEnergySource(state,{held});
}
export function supportRuntimePose(weapon,state,direction,moving,sex){
 if(!isSupportWeapon(weapon))throw new RangeError('Unknown support family '+weapon);
 const pose=mindEnergySourcePose(state,direction,moving,sex);
 return {...pose,lowerLoop:pose.lowerLoopRequested,
  lowerRestartKey:pose.lowerRestartRequested?`${weapon}/${state.phase}/${state.serial}`:null};
}
