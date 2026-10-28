import {RAIL_GUN_SOURCE as source} from './rail-gun-data.js';import {railGunChargePower} from './rail-gun-charge.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'},map=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([k,n])=>[k,m[n]])));
export const RAIL_GUN_ARENA_POLICY=Object.freeze({name:'catalogue-powers-source-charge-manual-release-single-profile',chargeDurationMs:3000,minPower:source.ability.power,maxPower:source.ability.power*source.ability.charge_power_rate,attributeAdd:0,attributeScale:0,consumeAmmo:1,reloadMs:2000,recoveryMs:500,fireActivationStrictMs:100,wallClock:'explicit-or-arena-elapsed',nativeFactoryParametersVerified:false,nativeReady:false});
export const RAIL_GUN=Object.freeze({...source,run:map(source.run),runLower:map(source.runLower),actionLower:map(source.actionLower),reloadLower:map(source.reloadLower),capacity:4,reloadMs:RAIL_GUN_ARENA_POLICY.reloadMs,moveSpeedRate:.9,attackMoveSpeedRate:.9,nativeReady:false});
export function createRailGunState(){return {weapon:'railgun',profile:RAIL_GUN,phase:'idle',timeMs:0,chargeMs:0,clockMs:0,ammo:4,capacity:4,reserve:Infinity,serial:0,shotSerial:0,pendingShots:[],activationPending:false,held:false,aimPitch:0,aimTarget:null,arenaPolicy:RAIL_GUN_ARENA_POLICY};}
export function cancelRailGun(s,{held=s.held}={}){s.phase='idle';s.timeMs=0;s.chargeMs=0;s.activationPending=false;s.pendingShots.length=0;s.held=!!held;}
export function advanceRailGun(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Rail Gun delta required');const ms=dt*1000,held=!!input.light,pressed=!!input.lightPressed||held&&!s.held,released=!!input.lightReleased||s.held&&!held;s.held=held;s.clockMs+=ms;
 if(Number.isFinite(input.aimPitch))s.aimPitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,input.aimPitch));if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='reload'){s.timeMs+=ms;if(s.timeMs>=s.profile.reloadMs){const n=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=n;if(Number.isFinite(s.reserve))s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;}
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){cancelRailGun(s,{held});s.phase='reload';s.serial++;events.push('reloadStart');return events;}
 if(s.phase==='idle'&&s.activationPending){s.activationPending=false;s.chargeMs=0;}
 if(s.phase==='idle'&&pressed){if(!s.ammo){events.push('empty');return events;}s.phase='charge';s.timeMs=0;s.chargeMs=0;s.serial++;s.activationPending=true;events.push('chargeStart');}
 if(s.phase==='charge'){
  s.chargeMs+=ms;s.timeMs=s.chargeMs;const elapsedMs=Number.isInteger(input.nativeElapsedMs)?input.nativeElapsedMs:Math.floor(s.chargeMs+1e-7);s.chargeSample=railGunChargePower({...s.arenaPolicy,elapsedMs});
  if(released){s.phase='fire';s.timeMs=0;s.serial++;s.selectedProfile=s.chargeSample.full?2:1;s.releasedPower=s.chargeSample.power;s.ammo-=s.arenaPolicy.consumeAmmo;events.push('chargeRelease');}return events;
 }
 if(s.phase==='fire'){
  s.timeMs+=ms;if(s.activationPending&&s.timeMs>s.arenaPolicy.fireActivationStrictMs+1e-7){s.activationPending=false;s.shotSerial++;const p=source.sourceAttackProfiles.find(p=>p.id===s.selectedProfile),shot={weapon:'railgun',serial:s.shotSerial,delayRemaining:0,sourceAttackId:p.id,sourceAttribute:p.attribute,sourceAtMs:p.atMs,power:s.releasedPower,fullCharge:p.id===2,chargeElapsedMs:s.chargeMs,aimTarget:s.aimTarget?{...s.aimTarget}:null,blow:p.blow?[...p.blow]:null,arenaPolicy:s.arenaPolicy.name,nativeReady:false};s.pendingShots.push(shot);s.lastShot=shot;events.push('shot');}
  if(s.timeMs>s.arenaPolicy.recoveryMs){s.phase='idle';s.timeMs=0;s.chargeMs=0;s.activationPending=false;events.push('attackComplete');}
 }return events;
}
export function railGunPose(s,direction='front',moving=false,sex='male'){
 if(!(direction in presentation)||!['male','female'].includes(sex))throw new RangeError('Rail Gun direction/sex required');const base={loop:true,speed:1,fade:500/4800,restartKey:s.serial};
 if(s.phase==='reload'){const lower=moving?RAIL_GUN.reloadLower[direction]:source.reload;return {...base,clip:source.reload,lower,lowerLoopRequested:true,lowerRestartRequested:!moving,lowerRateScale:moving?(source.durationTicks[sex][lower]/4800)/.8:1};}
 if(s.phase==='charge'||s.phase==='fire'){const [up,center,down]=s.phase==='charge'?source.chargeBlend:source.fireBlend;return {...base,clip:center,aimBlend:{clip:s.aimPitch>=0?up:down,weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},lower:moving?RAIL_GUN.actionLower[direction]:source.actionLower.normal,lowerRateScale:moving?(source.durationTicks[sex][RAIL_GUN.actionLower[direction]]/4800)/.8:1,loop:s.phase==='charge',time:s.timeMs/1000,sourceBlendPolicy:'arena-pointer-pitch-not-native-weight-certified'};}
 return moving?{...base,clip:RAIL_GUN.run[direction],lower:RAIL_GUN.runLower[direction],fade:1000/4800}:{...base,clip:source.idle,fade:1000/4800};
}
