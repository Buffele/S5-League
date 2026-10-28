import {HANDGUN_SOURCE as source} from './handgun-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directionalMapping=map=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,map[native]])));
export const HANDGUN=Object.freeze({...source,run:directionalMapping(source.run),runLower:directionalMapping(source.runLower),fireLower:directionalMapping(source.fireLower),
 capacity:source.ability.magazine_capacity,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,
 fireMs:400,shotDelayMs:150,cooldownMs:350,reloadMs:3000,animationSpeed:.5,nativeReady:false,
 limits:Object.freeze(['InitLua main/cooldown and shot comparisons require native input/timing confirmation.','Reload fitting is source-backed; mobile reload legs use explicit arena RunState policy pending native confirmation.','Infinite reserve follows max_ammo=-1; initial logical native ammo not measured.','Pattern points are exact; reset after .5s quiet is an arena approximation of unresolved SetPatternRegression.','Push direction, native time factor and actor policy must be supplied; no generic Blow is substituted.'])});
export function createHandgunState(){return {weapon:'handgun',profile:HANDGUN,phase:'idle',timeMs:0,cooldownMs:0,ammo:HANDGUN.capacity,reserve:Infinity,capacity:HANDGUN.capacity,serial:0,shotSerial:0,pendingShots:[],held:false,aimPitch:0,aimTarget:null,muzzle:HANDGUN.muzzle,shotDelay:0,patternIndex:0,quietMs:Infinity,activationPending:false};}
function activate(s,events){
 s.ammo--;s.shotSerial++;s.activationPending=false;
 if(s.quietMs>=500)s.patternIndex=0;
 const index=s.patternIndex;s.patternIndex=(index+1)%HANDGUN.pattern.length;s.quietMs=0;
 // One source attack and one ammunition debit. API>=2 points form a pattern,
 // unlike the legacy AddProjectileOffset branch's simultaneous projectiles.
 const shot={weapon:'handgun',serial:s.shotSerial,delayRemaining:0,aimTarget:s.aimTarget?{...s.aimTarget}:null,
  dispersion:{index,offset:[...HANDGUN.pattern[index]]},power:HANDGUN.ability.power,sourcePush:[...HANDGUN.push],nativeReady:false};
 s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');
}
export function advanceHandgun(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Hand Gun delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));
 if(input.aimTarget)s.aimTarget={...input.aimTarget};
 s.quietMs+=ms;s.cooldownMs=Math.max(0,s.cooldownMs-ms);
 if(s.phase==='reload'){
  s.timeMs+=ms;
  if(s.timeMs>=HANDGUN.reloadMs){const n=Math.min(HANDGUN.capacity-s.ammo,s.reserve);s.ammo+=n;if(Number.isFinite(s.reserve))s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}
  return events;
 }
 if(s.phase==='fire'){
  s.timeMs+=ms;if(s.activationPending&&s.timeMs>=HANDGUN.shotDelayMs)activate(s,events);
  if(s.timeMs>=HANDGUN.fireMs){s.phase='idle';s.timeMs=0;}
 }
 if(s.phase!=='idle')return events;
 if(input.reload&&s.ammo<HANDGUN.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;events.push('reloadStart');return events;}
 // Keep accepting one cycle at a time while primary is held; activation
 // still owns the delayed single projectile and ammunition debit.
 if((s.held||pressed)&&s.cooldownMs===0){
  if(s.ammo<=0){if(pressed)events.push('empty');return events;}
  s.phase='fire';s.timeMs=0;s.serial++;s.cooldownMs=HANDGUN.cooldownMs;s.activationPending=true;events.push('handgunAttackStart');
 }
 return events;
}
export function cancelHandgun(s){s.phase='idle';s.timeMs=0;s.activationPending=false;s.held=false;}
export function handgunPose(s,direction='front',moving=false,sex='male'){
 if(!(direction in HANDGUN.run)||!['male','female'].includes(sex))throw new RangeError('Hand Gun sex/direction required');
 const base={loop:true,speed:1,fade:1000/4800,restartKey:s.serial};
 if(s.phase==='fire')return {...base,clip:HANDGUN.aim.center,loop:false,time:s.timeMs/1000*HANDGUN.animationSpeed,fade:500/4800,
  aimBlend:{clip:s.aimPitch>=0?HANDGUN.aim.up:HANDGUN.aim.down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},
  lower:moving?HANDGUN.fireLower[direction]:HANDGUN.fireIdleLower};
 if(s.phase==='reload')return {...base,clip:HANDGUN.reload,loop:false,time:s.timeMs/HANDGUN.reloadMs*HANDGUN.reloadDurationTicks[sex]/4800,fade:500/4800,
  ...(moving?{lower:HANDGUN.runLower[direction]}:{})};
 return moving?{...base,clip:HANDGUN.run[direction],lower:HANDGUN.runLower[direction]}:{...base,clip:HANDGUN.idle};
}
