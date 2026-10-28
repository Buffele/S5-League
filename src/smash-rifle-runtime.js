import {SMASH_RIFLE} from './smash-rifle-data.js';
import {referenceRifleReserve} from './rifle-ammo-reference.js';
export {SMASH_RIFLE};
export function createSmashRifleState(){return {phase:'idle',timeMs:0,cooldownMs:0,capacity:40,ammo:40,reserve:referenceRifleReserve('smashrifle'),serial:0,shotSerial:0,pendingShots:[],held:false,aimPitch:0,aimTarget:null};}
export function advanceSmashRifle(s,dt,input,events,profile={capacity:40,reloadMs:2000,periodMs:125}){
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;
 s.held=!!input.light;s.timeMs+=ms;s.cooldownMs=Math.max(-ms,s.cooldownMs-ms);
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));
 if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){
  if(s.timeMs>=profile.reloadMs){const n=Math.min(profile.capacity-s.ammo,s.reserve);s.ammo+=n;s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}
  return;
 }
 if(input.reload&&s.ammo<profile.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;events.push('reloadStart');return;}
 if(!s.held){s.phase='idle';s.cooldownMs=Math.max(0,s.cooldownMs);return;}
 if(!s.ammo){s.phase='idle';if(pressed)events.push('empty');return;}
 if(s.cooldownMs<=1e-6){
  if(s.phase!=='fire'){s.phase='fire';s.timeMs=0;s.serial++;s.cooldownMs=0;}
  s.ammo--;s.cooldownMs+=profile.periodMs;s.shotSerial++;events.push('shot');
 }
}
export function smashRiflePose(s,direction,moving){
 const base={loop:true,speed:1,fade:.1,restartKey:s.serial};
 // DD004 is 11200 ticks at 4800 Hz; SetAnim fits it into 2000 ms.
 // REX: missing directional reload entries must not freeze moving legs.
 if(s.phase==='reload')return {...base,clip:'DD004',loop:false,time:Math.min(s.timeMs/2000,1)*11200/4800,...(moving?{lower:SMASH_RIFLE.runLower[direction]}:{})};
 // DD001/DD002/DD003 are up/center/down aim, not torso/legs.
 if(s.phase==='fire')return {...base,clip:'DD002',aimBlend:{clip:s.aimPitch>=0?'DD001':'DD003',weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?SMASH_RIFLE.fireLower[direction]:'DD013',time:s.timeMs/1000%(3200/4800)};
 return moving?{...base,clip:SMASH_RIFLE.run[direction],lower:SMASH_RIFLE.runLower[direction]}:{...base,clip:'DD000'};
}
