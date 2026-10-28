import {GRENADE_SOURCE_DATA as source} from './grenade-source-data.js';
const directions={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directional=map=>Object.fromEntries(Object.entries(directions).map(([key,native])=>[key,map[native]]));
export const GRENADE_SOURCE_POLICY=Object.freeze({name:'latched-primary-strict-source-delay-natural-reload',launchMs:100,actionMs:500,cycleMs:1000/source.ability.rate_of_fire,reloadMs:source.durationTicks.male[source.reload]/4800*1000,inputNativeVerified:false,nativeCycleVerified:false,nativeReady:false});
export const GRENADE_SOURCE_PROFILE=Object.freeze({...source,run:directional(source.run),runLower:directional(source.runLower),actionLower:{...directional(source.actionLower),normal:source.actionLower.normal},capacity:source.ability.magazine_capacity,moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate});
export function createGrenadeSourceState(){return {weapon:'grenade',profile:GRENADE_SOURCE_PROFILE,phase:'idle',phaseMs:0,cooldownMs:0,ammo:source.ability.magazine_capacity,capacity:source.ability.magazine_capacity,reserve:source.ability.max_ammo,serial:0,spawnSerial:0,held:false,activationPending:false,pendingSpawns:[],policy:GRENADE_SOURCE_POLICY,nativeReady:false};}
export function cancelGrenadeSource(state){state.phase='idle';state.phaseMs=0;state.activationPending=false;state.pendingSpawns.length=0;return state;}
export function advanceGrenadeSource(state,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw Error('Finite nonnegative Grenade delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!state.held;state.held=!!input.light;
 state.cooldownMs=Math.max(0,state.cooldownMs-ms);
 if(input.cancel){cancelGrenadeSource(state);events.push('cancel');return events;}
 if(state.phase==='reload'){
  state.phaseMs+=ms;
  if(state.phaseMs+1e-7>=state.policy.reloadMs){const n=Math.min(state.capacity-state.ammo,state.reserve);state.ammo+=n;state.reserve-=n;state.phase='idle';state.phaseMs=0;events.push('reloadComplete');}
  return events;
 }
 if(input.reload&&state.phase==='idle'&&state.ammo<state.capacity&&state.reserve>0){state.phase='reload';state.phaseMs=0;state.serial++;events.push('reloadStart');return events;}
 if(state.phase==='idle'&&pressed){
  if(state.ammo<=0){events.push('empty');return events;}
  if(state.cooldownMs>1e-7){events.push('cooldown');return events;}
  state.phase='launch';state.phaseMs=0;state.activationPending=true;state.serial++;state.cooldownMs=Math.max(0,state.policy.cycleMs-ms);events.push('launchBegin');
 }
 if(state.phase==='launch'){
  state.phaseMs+=ms;
  if(state.activationPending&&state.phaseMs>state.policy.launchMs+1e-7){
   state.activationPending=false;state.ammo--;state.spawnSerial++;
   state.pendingSpawns.push({weapon:'grenade',serial:state.spawnSerial,actionSerial:state.serial,sourceFunction:'GrenadeUniqueLaunch',sourceFunctionSha256:source.sourceFunctions.GrenadeUniqueLaunch,initFunction:'GrenadeUniqueInit',initFunctionSha256:source.sourceFunctions.GrenadeUniqueInit,explosionFunction:'GrenadeUniqueExplosion',explosionFunctionSha256:source.sourceFunctions.GrenadeUniqueExplosion,speed:source.sourceLaunchArgs[4],projectileArgs:[...source.sourceProjectileArgs],damping:[...source.sourceDamping],policy:state.policy.name,nativeReady:false});
   events.push('projectileSpawn');
  }
  if(state.phaseMs>state.policy.actionMs+1e-7){state.phase='idle';state.phaseMs=0;events.push('launchEnd');}
 }
 return events;
}
export function grenadeSourcePose(state,direction='front',moving=false,sex='male',blendFactor=1,{airborne=false}={}){
 if(!(direction in directions)||!['male','female'].includes(sex)||!Number.isFinite(blendFactor)||blendFactor<0||blendFactor>1||typeof airborne!=='boolean')throw Error('Explicit Grenade direction/sex/blend/airborne context required');
 const base={speed:1,loop:true,fade:500/4800,restartKey:state.serial};
 if(state.phase==='reload')return {...base,clip:source.reload,lower:moving?null:source.reload,lowerLoopRequested:true,lowerRestartRequested:!moving,lowerMappingVerified:!moving,sourceMappingGate:moving?'ReloadState_Grenade_Unique declares only neutral lower':null};
 if(state.phase==='launch'){
  if(state.phaseMs<state.policy.launchMs)return {...base,clip:source.begin,loop:false,speed:(source.durationTicks[sex][source.begin]/4800)/.5,time:state.phaseMs/1000};
  const upper=moving||airborne?source.mobileUpperBlend:source.neutralUpperBlend,lowerBlend=moving||airborne?source.mobileLowerBlend:source.neutralLowerBlend;
  return {...base,clip:upper[0],aimBlend:{clip:upper[1],weight:blendFactor},loop:false,speed:(source.durationTicks[sex][upper[0]]/4800)/.5,time:state.phaseMs/1000,lower:airborne?lowerBlend[0]:moving?state.profile.actionLower[direction]:source.actionLower.normal,lowerRateScale:airborne?(source.durationTicks[sex][lowerBlend[0]]/4800)/.5:1,lowerLoopRequested:!airborne,lowerRestartRequested:airborne||!moving,customLowerBlend:{clips:[...lowerBlend],weight:blendFactor},customBlendDriverNativeVerified:false,customLowerPriorityNativeVerified:false,airborneContextProvided:airborne};
 }
 return moving?{...base,clip:state.profile.run[direction],lower:state.profile.runLower[direction],fade:1000/4800,lowerFade:1000/4800}:{...base,clip:source.idle,fade:1000/4800};
}
