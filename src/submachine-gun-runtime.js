import {createSmashRifleState,advanceSmashRifle} from './smash-rifle-runtime.js';

// Current reference Lua: NormalState/RunState/ReloadState_SubMachineGun,
// UseWeapon1State_SubMachineGunAttack. Keep native semantic keys here.
export const SUBMACHINE_SOURCE={
 run:{front:'D0027',leftFront:'D0028',left:'D0029',rightFront:'D0030',right:'D0031',back:'D0032',leftBack:'D0033',rightBack:'D0034'},
 lower:{front:'00008',leftFront:'00009',left:'00010',rightFront:'00011',right:'00012',back:'00013',leftBack:'00014',rightBack:'00015'},
 fire:{front:'D0004',leftFront:'D0005',left:'D0006',rightFront:'D0007',right:'D0008',back:'D0009',leftBack:'D0010',rightBack:'D0011'},
};
// One boundary converts native lateral names to S5 presentation space.
const presentation={front:'front',back:'back',rightFront:'leftFront',right:'left',rightBack:'leftBack',leftFront:'rightFront',left:'right',leftBack:'rightBack'};
const directionalMapping=source=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,source[native]])));
export const SUBMACHINE={run:directionalMapping(SUBMACHINE_SOURCE.run),lower:directionalMapping(SUBMACHINE_SOURCE.lower),fire:directionalMapping(SUBMACHINE_SOURCE.fire)};
export const SUBMACHINE_PROFILE=Object.freeze({capacity:30,reloadMs:2000,periodMs:125});
export function createSubmachineGunState(){
 return {...createSmashRifleState(),profile:SUBMACHINE_PROFILE,capacity:30,ammo:30,reserve:Infinity,muzzle:'Gun_L_Fire_Dummy',shotDelay:.01};
}
export function advanceSubmachineGun(s,dt,input,events){advanceSmashRifle(s,dt,input,events,SUBMACHINE_PROFILE);}
export function submachineGunPose(s,direction,moving){
 const base={loop:true,speed:1,fade:500/4800,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:'D0003',time:Math.min(s.timeMs/2000,1)*10800/4800,
  ...(moving?{lower:SUBMACHINE.run[direction],lowerRateScale:(3200/4800)/.8}:{})};
 if(s.phase==='fire'){
  const stem=moving?SUBMACHINE.fire[direction]:null;
  return {...base,clip:stem?stem+'_1':'D0001',
   aimBlend:{clip:stem?(s.aimPitch>=0?stem:stem+'_2'):(s.aimPitch>=0?'D0000':'D0002'),weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},
   // Source lower state is D0002 at rest, not a pitch-dependent leg pose.
   lower:stem?stem+'_1':'D0002',time:s.timeMs/1000*(moving?1:2)};
 }
 return moving?{...base,clip:SUBMACHINE.run[direction],lower:SUBMACHINE.lower[direction]}:{...base,clip:'D0026'};
}
