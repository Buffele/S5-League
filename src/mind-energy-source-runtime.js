import{MIND_ENERGY_SOURCE_DATA as source}from './mind-energy-source-data.js';
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const mapping=m=>Object.freeze(Object.fromEntries(Object.entries(presentation).map(([key,native])=>[key,m[native]])));
export const MIND_ENERGY_SOURCE_ARENA_POLICY=Object.freeze({name:'catalogue-request-cadence-explicit-heal-conversion',beginMs:200,requestPeriodMs:1000/source.ability.rate_of_fire,ammoPerRequest:1,endMs:500,reloadMs:3000,blendFactorWhenUnspecified:1,endPresentation:'source-normal-idle-preview',nativeReady:false});
export const MIND_ENERGY_SOURCE_PROFILE=Object.freeze({...source,run:mapping(source.run),runLower:mapping(source.runLower),actionLower:{...mapping(source.actionLower),normal:source.actionLower.normal},moveSpeedRate:source.ability.move_speed_rate,attackMoveSpeedRate:source.ability.attack_move_speed_rate,capacity:source.ability.magazine_capacity});
export function createMindEnergySourceState(){return{weapon:'mindenergy',profile:MIND_ENERGY_SOURCE_PROFILE,phase:'idle',timeMs:0,pulseMs:0,ammo:source.ability.magazine_capacity,capacity:source.ability.magazine_capacity,reserve:Infinity,serial:0,requestSerial:0,held:false,pendingHealingRequests:[],blendFactor:1,arenaPolicy:MIND_ENERGY_SOURCE_ARENA_POLICY,nativeReady:false};}
export function cancelMindEnergySource(s,{held=s.held}={}){s.phase='idle';s.timeMs=0;s.pulseMs=0;s.pendingHealingRequests.length=0;s.held=held;return s;}
export function advanceMindEnergySource(s,dt,input={},events=[]){
 if(!Number.isFinite(dt)||dt<0)throw Error('Finite nonnegative Mind Energy delta required');
 const ms=dt*1000,pressed=!!input.lightPressed||!!input.light&&!s.held,held=!!input.light;s.held=held;
 if(input.blendFactor!==undefined){if(!Number.isFinite(input.blendFactor)||input.blendFactor<0||input.blendFactor>1)throw Error('Explicit normalized blend factor required');s.blendFactor=input.blendFactor;}
 if(input.cancel){cancelMindEnergySource(s,{held});events.push('healCancel');return events;}
 if(s.phase==='reload'){s.timeMs+=ms;if(s.timeMs+1e-7>=s.arenaPolicy.reloadMs){const n=Math.min(s.capacity-s.ammo,s.reserve);s.ammo+=n;if(Number.isFinite(s.reserve))s.reserve-=n;s.phase='idle';s.timeMs=0;events.push('reloadComplete');}return events;}
 if(input.reload&&s.ammo<s.capacity&&s.reserve>0){cancelMindEnergySource(s,{held});s.phase='reload';s.serial++;events.push('reloadStart');return events;}
 if((s.phase==='begin'||s.phase==='hold')&&!held){s.phase='end';s.timeMs=0;s.pulseMs=0;s.pendingHealingRequests.length=0;events.push('healEnd');return events;}
 if(s.phase==='end'){s.timeMs+=ms;if(s.timeMs+1e-7>=s.arenaPolicy.endMs){s.phase='idle';s.timeMs=0;}return events;}
 if(s.phase==='idle'&&pressed){if(s.ammo<=0){events.push('empty');return events;}s.phase='begin';s.timeMs=0;s.pulseMs=0;s.serial++;events.push('healBegin');}
 if(s.phase==='begin'){s.timeMs+=ms;if(s.timeMs>s.arenaPolicy.beginMs+1e-7){s.phase='hold';s.pulseMs=s.timeMs-s.arenaPolicy.beginMs;s.timeMs=s.pulseMs;events.push('healHold');}else return events;}
 else if(s.phase==='hold'){s.timeMs+=ms;s.pulseMs+=ms;}
 while(s.phase==='hold'&&s.pulseMs+1e-7>=s.arenaPolicy.requestPeriodMs&&s.ammo>=s.arenaPolicy.ammoPerRequest){s.pulseMs=Math.max(0,s.pulseMs-s.arenaPolicy.requestPeriodMs);s.ammo-=s.arenaPolicy.ammoPerRequest;s.requestSerial++;s.pendingHealingRequests.push({weapon:'mindenergy',serial:s.requestSerial,actionSerial:s.serial,sourceFunction:'MindHeal',sourceFunctionSha256:source.sourceFunctionSha256,healingHP:[...source.healingHP],damageHP:[...source.damageHP],findLimit:[...source.findLimit],rangeLimit:[...source.rangeLimit],conversionPolicyRequired:true,arenaPolicy:s.arenaPolicy.name,nativeReady:false});events.push('healingRequest');}
 if(s.phase==='hold'&&!s.ammo){s.phase='end';s.timeMs=0;events.push('empty');}return events;
}
export function mindEnergySourcePose(s,direction='front',moving=false,sex='male'){
 if(!(direction in presentation)||!['male','female'].includes(sex))throw Error('Explicit Mind Energy direction/sex required');const base={speed:1,loop:true,fade:500/4800,restartKey:s.serial};
 if(s.phase==='reload')return{...base,clip:source.reload,lower:moving?null:source.reload,lowerLoopRequested:true,lowerRestartRequested:!moving,lowerMappingVerified:!moving,sourceMappingGate:moving?'ReloadState_MindEnergy declares only neutral lower':null};
 if(s.phase==='begin')return{...base,clip:source.begin,loop:false,time:s.timeMs/1000,fade:200/4800};
 if(s.phase==='hold'){const lower=moving?MIND_ENERGY_SOURCE_PROFILE.actionLower[direction]:source.actionLower.normal;return{...base,clip:source.blendUpper[1],aimBlend:{clip:source.blendUpper[0],weight:1-s.blendFactor},lower,time:s.timeMs/1000,lowerRateScale:moving?(source.durationTicks[sex][lower]/4800)/.8:1,lowerLoopRequested:true,lowerRestartRequested:!moving,customLowerBlend:{clips:[...source.blendLower],weight:s.blendFactor},customBlendDriverNativeVerified:false,customLowerPriorityNativeVerified:false};}
 const result=moving?{...base,clip:MIND_ENERGY_SOURCE_PROFILE.run[direction],lower:MIND_ENERGY_SOURCE_PROFILE.runLower[direction],fade:2000/4800,lowerFade:1000/4800}:{...base,clip:source.idle,fade:1000/4800};
 return s.phase==='end'?{...result,endMappingNativeVerified:false,sourceMappingGate:'MindHeal end presentation is explicit arena normal-state preview'}:result;
}
