import {BURST_SHOTGUN_SOURCE as source} from './burst-shotgun-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directionalMapping=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
export const BURST_SHOTGUN=Object.freeze({...source,run:directionalMapping(source.run),runLower:directionalMapping(source.runLower),fireLower:directionalMapping(source.fireLower),capacity:source.ability.magazine_capacity,reloadMs:2500,fireMs:700,sourceCooldownMs:625,periodMs:1000/source.ability.rate_of_fire,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,nativeReady:false});
export function createBurstShotgunState(){return {weapon:'burstshotgun',profile:BURST_SHOTGUN,phase:'idle',timeMs:0,cooldownMs:0,ammo:BURST_SHOTGUN.capacity,capacity:BURST_SHOTGUN.capacity,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],held:false,aimPitch:0,aimTarget:null,muzzle:source.muzzle,shotDelay:0,activationPending:false};}
function activate(s,events){
 s.activationPending=false;s.ammo--;s.shotSerial++;
 const shot={weapon:'burstshotgun',serial:s.shotSerial,delayRemaining:0,aimTarget:s.aimTarget?{...s.aimTarget}:null,power:source.ability.power,
  projectiles:source.projectiles.map(p=>({...p,direction:[...p.direction],push:[...p.push],baseDamage:source.ability.power*p.powerScale})),nativeReady:false};
 s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');
}
export function advanceBurstShotgun(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Burst Shotgun delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;s.cooldownMs=Math.max(0,s.cooldownMs-ms);
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){
  s.timeMs+=ms;if(s.timeMs>=BURST_SHOTGUN.reloadMs){const n=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=n;if(Number.isFinite(s.reserve))s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;
 }
 if(s.phase==='fire'){
  s.timeMs+=ms;if(s.activationPending&&s.timeMs>=150)activate(s,events);
  if(s.timeMs>=BURST_SHOTGUN.fireMs){s.phase='idle';s.timeMs=0;}
 }
 if(s.phase!=='idle')return events;
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;events.push('reloadStart');return events;}
 if((s.held||pressed)&&s.cooldownMs===0){if(!s.ammo){if(pressed)events.push('empty');return events;}
  s.phase='fire';s.timeMs=0;s.serial++;s.activationPending=true;
  // Source main700/cool625 and catalogue1.2 are retained separately. Arena
  // enforces the catalogue period; native dispatcher arbitration is unverified.
  s.cooldownMs=Math.max(BURST_SHOTGUN.sourceCooldownMs,BURST_SHOTGUN.periodMs);events.push('burstShotgunAttackStart');
 }
 return events;
}
export function cancelBurstShotgun(s){s.phase='idle';s.timeMs=0;s.activationPending=false;s.held=false;}
export function burstShotgunPose(s,direction='front',moving=false,sex='male'){
 if(!(direction in BURST_SHOTGUN.run)||!['male','female'].includes(sex))throw new RangeError('Burst Shotgun direction/sex required');
 const base={loop:true,speed:1,fade:1000/4800,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:source.reload,loop:false,time:Math.min(s.timeMs/2500,1)*source.reloadDurationTicks[sex]/4800,fade:500/4800,...(moving?{lower:BURST_SHOTGUN.runLower[direction]}:{})};
 if(s.phase==='fire')return {...base,clip:source.aim.center,loop:false,time:s.timeMs/1000,fade:500/4800,aimBlend:{clip:s.aimPitch>=0?source.aim.up:source.aim.down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?BURST_SHOTGUN.fireLower[direction]:source.fireIdleLower};
 return moving?{...base,clip:BURST_SHOTGUN.run[direction],lower:BURST_SHOTGUN.runLower[direction]}:{...base,clip:source.idle};
}
