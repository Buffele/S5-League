import {HOMING_RIFLE_SOURCE as source} from './homing-rifle-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'},mapping=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
export const HOMING_RIFLE_ARENA_POLICY=Object.freeze({name:'catalogue8-cycles-three-source-attacks-cancel-release',cycleMs:1000/source.ability.rate_of_fire,cancelRemainingOnRelease:true,randomDamage:'unapplied-unverified',nativeReady:false});
export const HOMING_RIFLE=Object.freeze({...source,run:mapping(source.run),runLower:mapping(source.runLower),fireLower:mapping(source.fireLower),capacity:30,reloadMs:2000,periodMs:HOMING_RIFLE_ARENA_POLICY.cycleMs,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,nativeReady:false});
export function createHomingRifleState(){return {weapon:'homingrifle',profile:HOMING_RIFLE,phase:'idle',timeMs:0,clockMs:0,cooldownMs:0,ammo:30,capacity:30,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],scheduledShots:[],held:false,aimPitch:0,aimTarget:null,muzzle:source.muzzle,shotDelay:0,nextCycleAtMs:0,arenaPolicy:HOMING_RIFLE_ARENA_POLICY};}
export function advanceHomingRifle(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Homing Rifle delta required');const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held;s.held=!!input.light;s.clockMs+=ms;s.timeMs+=ms;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){if(s.timeMs>=HOMING_RIFLE.reloadMs){const amount=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=amount;if(Number.isFinite(s.reserve))s.reserve-=amount;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;}
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){s.phase='reload';s.timeMs=0;s.serial++;s.scheduledShots.length=0;s.pendingShots.length=0;events.push('reloadStart');return events;}
 if(!s.held&&!input.lightPressed){s.phase='idle';s.timeMs=0;s.scheduledShots.length=0;s.pendingShots.length=0;return events;}
 if(!s.ammo){s.phase='idle';s.scheduledShots.length=0;if(pressed)events.push('empty');return events;}
 if(s.phase!=='fire'){s.phase='fire';s.timeMs=0;s.serial++;s.scheduledShots.length=0;s.nextCycleAtMs=s.clockMs;}
 // Named arena repeat cadence; source attack times stay10/65/120ms. Each
 // activation is one CAttack, not an inferred expansion of ProjectileOffsets.
 while(s.nextCycleAtMs<=s.clockMs+1e-7&&s.scheduledShots.length<s.ammo){for(const a of source.attacks)s.scheduledShots.push({atMs:s.nextCycleAtMs+a.atMs,attack:a});s.nextCycleAtMs+=HOMING_RIFLE.periodMs;}
 s.scheduledShots.sort((a,b)=>a.atMs-b.atMs);
 while(s.scheduledShots.length&&s.scheduledShots[0].atMs<=s.clockMs+1e-7&&s.ammo>0){const {attack:a}=s.scheduledShots.shift();s.ammo-=a.consumeAmmo;s.shotSerial++;const shot={weapon:'homingrifle',serial:s.shotSerial,delayRemaining:0,sourceAttackId:a.id,sourceAtMs:a.atMs,sourceDirection:[...a.direction],sourceProjectileOffsets:a.projectileOffsets.map(p=>[...p]),projectileOffsetSelectionVerified:false,aimTarget:s.aimTarget?{...s.aimTarget}:null,power:source.ability.power,arenaPolicy:s.arenaPolicy.name,nativeReady:false};s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');}
 if(!s.ammo)s.scheduledShots.length=0;return events;
}
export function homingRiflePose(s,direction='front',moving=false,sex='male'){
 if(!(direction in HOMING_RIFLE.run)||!['male','female'].includes(sex))throw new RangeError('Homing Rifle direction/sex required');const base={loop:true,speed:1,fade:1000/4800,restartKey:s.serial};
 if(s.phase==='reload')return {...base,clip:source.reload,lower:source.reload,loop:false,time:Math.min(s.timeMs/2000,1)*source.reloadDurationTicks[sex]/4800,fade:500/4800};
 if(s.phase==='fire')return {...base,clip:source.aim.center,aimBlend:{clip:s.aimPitch>=0?source.aim.up:source.aim.down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?HOMING_RIFLE.fireLower[direction]:source.fireIdleLower,lowerRateScale:moving?(source.fireLowerDurationTicks[sex][HOMING_RIFLE.fireLower[direction]]/4800)/(source.fireLowerFitMs/1000):1,time:s.timeMs/1000,fade:100/4800};
 return moving?{...base,clip:HOMING_RIFLE.run[direction],lower:HOMING_RIFLE.runLower[direction]}:{...base,clip:source.idle};
}
