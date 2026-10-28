import {SPARK_RIFLE_SOURCE_DATA as source} from './spark-rifle-source-data.js';

const directions={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directional=map=>Object.fromEntries(Object.entries(directions).map(([key,native])=>[key,map[native]]));
export const SPARK_RIFLE_SOURCE_POLICY=Object.freeze({name:'catalogue-cycle-rate-two-deferred-attacks',cycleMs:1000/source.ability.rate_of_fire,animationMs:666,reloadMs:2000,nativeCycleVerified:false,nativeReady:false});
export const SPARK_RIFLE_SOURCE_PROFILE=Object.freeze({...source,run:directional(source.run),runLower:directional(source.runLower),actionLower:{...directional(source.actionLower),normal:source.actionLower.normal},moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,capacity:source.ability.magazine_capacity,zoom:{supported:source.ability.support_sniper_mode===1,sourceFov:source.ability.sniper_mode_fov,nativeInputBindingVerified:false}});

export function createSparkRifleSourceState(){
 return {weapon:'sparkrifle',profile:SPARK_RIFLE_SOURCE_PROFILE,phase:'idle',clockMs:0,phaseMs:0,nextCycleMs:0,cycleSerial:0,shotSerial:0,ammo:source.ability.magazine_capacity,capacity:source.ability.magazine_capacity,reserve:Infinity,held:false,activationPending:[],pendingShots:[],policy:SPARK_RIFLE_SOURCE_POLICY,nativeReady:false};
}
export function cancelSparkRifleSource(state,{held=state.held}={}){
 state.phase='idle';state.phaseMs=0;state.nextCycleMs=state.clockMs;state.held=held;state.activationPending.length=0;state.pendingShots.length=0;return state;
}
export function advanceSparkRifleSource(state,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw Error('Finite nonnegative Spark Rifle delta required');
 const ms=dt*1000,start=state.clockMs,end=start+ms,held=!!input.light,pressed=!!input.lightPressed||held&&!state.held;
 state.clockMs=end;state.held=held;
 if(input.cancel){cancelSparkRifleSource(state,{held});events.push('cancel');return events;}
 if(state.phase==='reload'){
  state.phaseMs+=ms;
  if(state.phaseMs+1e-7>=state.policy.reloadMs){const added=Math.min(state.capacity-state.ammo,state.reserve);state.ammo+=added;if(Number.isFinite(state.reserve))state.reserve-=added;state.phase='idle';state.phaseMs=0;state.nextCycleMs=end;events.push('reloadComplete');}
  return events;
 }
 if(input.reload&&state.ammo<state.capacity&&state.reserve>0){cancelSparkRifleSource(state,{held});state.phase='reload';state.cycleSerial++;events.push('reloadStart');return events;}
 if(state.phase==='fire')state.phaseMs+=ms;
 if(!held){
  if(state.activationPending.length||state.pendingShots.length)events.push('cancelPending');
  state.activationPending.length=0;state.pendingShots.length=0;
  if(state.phase==='fire'&&state.phaseMs>=state.policy.animationMs){state.phase='idle';state.phaseMs=0;}
  return events;
 }
 if(pressed)state.nextCycleMs=start;
 while(state.ammo>0){
  const nextActivation=state.activationPending[0]?.atMs??Infinity;
  if(state.nextCycleMs<end-1e-7&&state.nextCycleMs<=nextActivation){
   const cycleAt=state.nextCycleMs;
   state.nextCycleMs+=state.policy.cycleMs;
   state.cycleSerial++;state.phase='fire';state.phaseMs=Math.max(0,end-cycleAt);
   for(const attack of source.attacks)state.activationPending.push({attackId:attack.id,atMs:cycleAt+attack.activationMs,cycleSerial:state.cycleSerial});
   state.activationPending.sort((a,b)=>a.atMs-b.atMs||a.attackId-b.attackId);
   events.push('cycle');continue;
  }
  if(nextActivation>end+1e-7)break;
  const activation=state.activationPending.shift(),attack=source.attacks.find(a=>a.id===activation.attackId);
  if(state.ammo<attack.consumeAmmo){events.push('empty');continue;}
  state.ammo-=attack.consumeAmmo;state.shotSerial++;
  state.pendingShots.push({weapon:'sparkrifle',serial:state.shotSerial,cycleSerial:activation.cycleSerial,attackId:attack.id,activationMs:attack.activationMs,sourceTimeMs:activation.atMs,sourceFunction:source.sourceFunction,sourceFunctionSha256:source.sourceFunctionSha256,power:source.ability.power,geometry:'MAKERAY',offsetDeclarations:attack.offsetDeclarations.map(v=>[...v]),offsetConsumerNativeVerified:false,contactAllowedWithoutOffsetPolicy:attack.offsetDeclarations.length===0,arenaPolicy:state.policy.name,nativeReady:false});
  events.push('shot');
 }
 if(!state.ammo)state.activationPending.length=0;
 return events;
}

export function sparkRifleSourcePose(state,direction='front',moving=false,sex='male',blendFactor=1){
 if(!(direction in directions)||!['male','female'].includes(sex)||!Number.isFinite(blendFactor)||blendFactor<0||blendFactor>1)throw Error('Explicit Spark Rifle direction/sex/blend required');
 const base={speed:1,loop:true,fade:500/4800,restartKey:state.cycleSerial};
 if(state.phase==='reload'){
  const rate=(source.durationTicks[sex][source.reload]/4800)/2;
  return {...base,clip:source.reload,speed:rate,loop:false,time:state.phaseMs/1000,lower:moving?null:source.reload,lowerRateScale:rate,lowerLoopRequested:false,lowerRestartRequested:!moving,lowerMappingVerified:!moving,sourceMappingGate:moving?'ReloadState_SPARK_RIFLE declares only neutral lower':null};
 }
 if(state.phase==='fire'){
  const lower=moving?state.profile.actionLower[direction]:source.actionLower.normal;
  return {...base,clip:source.upperBlend[0],speed:(source.durationTicks[sex][source.upperBlend[0]]/4800)/(state.policy.animationMs/1000),aimBlend:{clip:source.upperBlend[1],weight:blendFactor},time:state.phaseMs/1000,lower,lowerRateScale:moving?(source.durationTicks[sex][lower]/4800)/.8:1,lowerLoopRequested:true,lowerRestartRequested:!moving,customLowerBlend:{clips:[...source.lowerBlend],weight:blendFactor},customBlendDriverNativeVerified:false,customLowerPriorityNativeVerified:false};
 }
 return moving?{...base,clip:state.profile.run[direction],lower:state.profile.runLower[direction],fade:1000/4800,lowerFade:1000/4800}:{...base,clip:source.idle,fade:1000/4800};
}
