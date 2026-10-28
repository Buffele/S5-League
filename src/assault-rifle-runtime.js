import {ASSAULT_RIFLE_SOURCE as source} from './assault-rifle-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directionalMapping=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
export const ASSAULT_RIFLE=Object.freeze({...source,run:directionalMapping(source.run),runLower:directionalMapping(source.runLower),fireLower:directionalMapping(source.fireLower),capacity:source.ability.magazine_capacity,reloadMs:2000,periodMs:1000/source.ability.rate_of_fire,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,nativeReady:false});
export function createAssaultRifleState(){return {weapon:'assaultrifle',profile:ASSAULT_RIFLE,phase:'idle',timeMs:0,cooldownMs:0,ammo:30,capacity:30,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],held:false,aimPitch:0,aimTarget:null,muzzle:source.muzzle,shotDelay:.01,quietMs:Infinity,patternIndex:0};}
export function advanceAssaultRifle(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Assault Rifle delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;s.timeMs+=ms;s.quietMs+=ms;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){
  if(s.timeMs>=ASSAULT_RIFLE.reloadMs){const amount=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=amount;if(Number.isFinite(s.reserve))s.reserve-=amount;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;
 }
 s.cooldownMs-=ms;
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;s.cooldownMs=0;events.push('reloadStart');return events;}
 if(!s.held&&!input.lightPressed){s.phase='idle';s.cooldownMs=Math.max(0,s.cooldownMs);return events;}
 if(!s.ammo){s.phase='idle';if(pressed)events.push('empty');return events;}
 if(s.phase!=='fire'){s.phase='fire';s.timeMs=0;s.serial++;s.cooldownMs=Math.max(0,s.cooldownMs);}
 // Queue belongs to this adapter; Controller must not append a second shot.
 // Fractional period carries overshoot for steady automatic fire. Native
 // integer timing/dispatcher and ammo debit instant still require comparison.
 while(s.cooldownMs<=1e-7&&s.ammo>0){
  if(s.quietMs>=500)s.patternIndex=0;
  const index=s.patternIndex;s.patternIndex=(index+1)%source.pattern.length;s.quietMs=0;
  s.ammo--;s.shotSerial++;s.cooldownMs+=ASSAULT_RIFLE.periodMs;
  const shot={weapon:'assaultrifle',serial:s.shotSerial,delayRemaining:.01,dispersion:{index,offset:[...source.pattern[index]]},aimTarget:s.aimTarget?{...s.aimTarget}:null,power:source.ability.power,nativeReady:false};
  s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');
 }
 return events;
}
export function assaultRiflePose(s,direction='front',moving=false,sex='male'){
 if(!(direction in ASSAULT_RIFLE.run)||!['male','female'].includes(sex))throw new RangeError('Assault Rifle direction/sex required');
 const base={loop:true,speed:1,fade:1000/4800,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:source.reload,loop:false,time:Math.min(s.timeMs/2000,1)*source.reloadDurationTicks[sex]/4800,fade:500/4800,...(moving?{lower:ASSAULT_RIFLE.runLower[direction]}:{})};
 if(s.phase==='fire')return {...base,clip:source.aim.center,aimBlend:{clip:s.aimPitch>=0?source.aim.up:source.aim.down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?ASSAULT_RIFLE.fireLower[direction]:source.fireIdleLower,time:s.timeMs/1000,fade:100/4800};
 return moving?{...base,clip:ASSAULT_RIFLE.run[direction],lower:ASSAULT_RIFLE.runLower[direction]}:{...base,clip:source.idle};
}
