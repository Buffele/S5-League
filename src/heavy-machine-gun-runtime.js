import {HEAVY_MACHINE_GUN_SOURCE as source} from './heavy-machine-gun-data.js';
import {HMG_TIMING,createHmgClocks,advanceHmgClocks} from './heavy-machine-gun-scheduler.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const mapping=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
// Separate native clocks replace the former catalogue cadence/debit coupling.
// Ray direction, hit admission, buffs and input arbitration remain unqualified.
export const HEAVY_MACHINE_GUN_ARENA_POLICY=Object.freeze({name:'native-separate-clocks-standard-ammo',ammoPerShot:null,repeatSourcePattern:true,nativeReady:false});
export const HEAVY_MACHINE_GUN=Object.freeze({...source,run:mapping(source.run),runLower:mapping(source.runLower),fireLower:mapping(source.fireLower),capacity:source.ability.magazine_capacity,reloadMs:source.reloadDurationTicks.male/4800*1000,beginMs:HMG_TIMING.beginMs,timing:HMG_TIMING,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,nativeReady:false});
export function createHeavyMachineGunState(){return {weapon:'heavymachinegun',profile:HEAVY_MACHINE_GUN,phase:'idle',timeMs:0,cooldownMs:0,ammo:120,capacity:120,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],held:false,aimPitch:0,aimTarget:null,muzzle:source.muzzle,shotDelay:0,patternIndex:0,clocks:null,clockRemainderMs:0,arenaPolicy:HEAVY_MACHINE_GUN_ARENA_POLICY};}
export function advanceHeavyMachineGun(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Heavy Machine Gun delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;s.timeMs+=ms;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){
  if(s.timeMs>=HEAVY_MACHINE_GUN.reloadMs){const amount=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=amount;if(Number.isFinite(s.reserve))s.reserve-=amount;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;
 }
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;s.clocks=null;events.push('reloadStart');return events;}
 // Every queued ray has already crossed its source window. Release cancels
 // future windows, not contacts waiting for this frame's post-mixer consumer.
 if(!s.held&&!input.lightPressed){s.phase='idle';s.timeMs=0;s.cooldownMs=0;s.patternIndex=0;s.clocks=null;s.clockRemainderMs=0;return events;}
 if(s.phase==='empty')return events;
 if(s.phase==='idle'){
  if(!s.ammo){if(pressed)events.push('empty');return events;}
  s.phase='begin';s.timeMs=0;s.beginElapsedMs=0;s.serial++;s.clockRemainderMs=0;events.push('fireBegin');return events;
 }
 // S5 accepts fractional seconds; carry only their fractional millisecond at
 // this boundary. Native clocks themselves receive whole uint32 milliseconds.
 const total=ms+s.clockRemainderMs,firingMs=Math.floor(total+1e-7);s.clockRemainderMs=Math.max(0,total-firingMs);
 if(s.phase==='begin'){
  s.beginElapsedMs+=firingMs;s.timeMs=s.beginElapsedMs;
  // Native phase0 test is strict > duration, not >=750. Do not replay time
  // spent in begin as automatic shots when a coarse frame crosses expiry.
  if(s.timeMs<=HEAVY_MACHINE_GUN.beginMs)return events;
  if(!s.ammo){s.phase='empty';events.push('empty');return events;}
  s.phase='fire';s.timeMs=0;s.clocks=createHmgClocks();s.clockRemainderMs=0;s.serial++;events.push('fireReady');return events;
 }
 const tick=advanceHmgClocks(s.clocks,firingMs,{ammoAvailable:s.ammo>0});
 s.ammo=Math.max(0,s.ammo-tick.debit);
 if(tick.empty){s.phase='empty';events.push('empty');return events;}
 for(const index of tick.windows){
  s.patternIndex=(index+1)%20;s.shotSerial++;
  const shot={weapon:'heavymachinegun',serial:s.shotSerial,delayRemaining:0,sourcePatternIndex:index,sourceYDegrees:source.sourceYDegrees*source.sourceYScales[index],sourceZDegrees:source.sourceZDegrees[index],sourcePart:['LOWER','MIDDLE','UPPER'][source.sourceYScales[index]-1],aimTarget:s.aimTarget?{...s.aimTarget}:null,power:source.ability.power,arenaPolicy:s.arenaPolicy.name,nativeReady:false};
  s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');
 }
 return events;
}
export function heavyMachineGunPose(s,direction='front',moving=false,sex='male'){
 if(!(direction in HEAVY_MACHINE_GUN.run)||!['male','female'].includes(sex))throw new RangeError('Heavy Machine Gun direction/sex required');
 const base={loop:true,speed:1,fade:1000/4800,restartKey:s.serial};
 // SetAnim's1000 operand is a blend, not a requested1s duration. Both source
 // clips last5s at rate1; real native M/F refills were bracketed near5s.
 if(s.phase==='reload')return {...base,clip:source.reload,lower:source.reload,loop:true,time:s.timeMs/1000,fade:1000/4800};
 if(s.phase==='begin')return {...base,clip:source.begin,loop:false,time:Math.min(s.timeMs/750,1)*source.beginDurationTicks[sex]/4800,fade:200/4800};
 // Native phase1→2 stops presentation but retains the already selected aim.
 if(s.phase==='fire'||s.phase==='empty')return {...base,clip:source.aim.center,aimBlend:{clip:s.aimPitch>=0?source.aim.up:source.aim.down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?HEAVY_MACHINE_GUN.fireLower[direction]:source.fireIdleLower,time:s.timeMs/1000,fade:500/4800};
 return moving?{...base,clip:HEAVY_MACHINE_GUN.run[direction],lower:HEAVY_MACHINE_GUN.runLower[direction]}:{...base,clip:source.idle};
}
