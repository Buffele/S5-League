import {createSmashRifleState,advanceSmashRifle} from './smash-rifle-runtime.js';
import {SEMI_RIFLE} from './semi-rifle-data.js';
import {referenceRifleReserve} from './rifle-ammo-reference.js';
const PROFILE={capacity:30,reloadMs:2000,periodMs:125};
export function createSemiRifleState(){return {...createSmashRifleState(),capacity:30,ammo:30,reserve:referenceRifleReserve('semirifle'),muzzle:'Smg_02_Fire_Dummy',zoom:false,shotDelay:.01};}
export function advanceSemiRifle(s,dt,input,events){
 s.zoom=!!input.heavyHeld;
 advanceSmashRifle(s,dt,input,events,PROFILE);
}
export function semiRiflePose(s,direction,moving,sex='male'){
 const base={loop:true,speed:1,fade:.1,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:'W0004',loop:false,time:Math.min(s.timeMs/2000,1)*(sex==='female'?15200:14720)/4800,...(moving?{lower:SEMI_RIFLE.runLower[direction]}:{})};
 if(s.phase==='fire')return {...base,clip:'W0002',aimBlend:{clip:s.aimPitch>=0?'W0001':'W0003',weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?SEMI_RIFLE.fireLower[direction]:'W0013',time:(s.timeMs/1000*2)%(640/4800)};
 return moving?{...base,clip:SEMI_RIFLE.run[direction],lower:SEMI_RIFLE.runLower[direction]}:{...base,clip:'W0000'};
}
