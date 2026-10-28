// Offline comparison contract. Never infer logical values from protected storage,
// actor state IDs, artwork, or an unverified actor pointer.
import {createHash} from 'node:crypto';
import {serializeComparisonActorMpProfile,validateComparisonActorMpCase} from './comparison-actor-mp-profile.js';
const profileSha256=value=>createHash('sha256').update(value).digest('hex');
export const MOVEMENT_TOLERANCES=Object.freeze({position:.06,velocity:.6,energy:1,time:.025,maxSampleGap:.05});
export const REALIZED_VELOCITY_DERIVATION=Object.freeze({method:'backward-difference',positionChannel:'physical-feet',initialSample:'zero',timeUnit:'seconds'});
export function validateReplayTickDeltasMs(deltas){
  if(!Array.isArray(deltas)||!deltas.length)throw Error('Missing measured tick deltas');
  for(const [i,dtMs] of deltas.entries())if(!Number.isInteger(dtMs)||dtMs<=0||dtMs>1000/30)throw Error(`Unsupported replay tick ${i}: positive integer milliseconds <=1/30 second required; no split/drop`);
  return [...deltas];
}
export function nativeReplayTickDeltasMs(reference){
  validateMovementTrace(reference);
  if(reference.engine!=='s5runtime'||!/^[a-f0-9]{64}$/i.test(reference.metadata.captureSha256||''))throw Error('Native cadence requires authenticated S5Runtime capture');
  if(Math.abs(reference.samples[0].t)>1e-9)throw Error('Native replay must begin at measured input origin t=0');
  const samples=reference.samples,m=reference.metadata;
  let deltas;
  if(m.measuredTickDeltasMs!==undefined&&!Array.isArray(m.measuredTickDeltasMs))throw Error('Invalid measuredTickDeltasMs declaration');
  if(Array.isArray(m.measuredTickDeltasMs))deltas=validateReplayTickDeltasMs(m.measuredTickDeltasMs);
  else if(m.cadenceTimestampsAuthenticated===true){
    deltas=samples.slice(1).map((s,i)=>{
      const milliseconds=(s.t-samples[i].t)*1000,rounded=Math.round(milliseconds);
      if(Math.abs(milliseconds-rounded)>1e-7)throw Error(`Unsupported fractional native timestamp interval ${i}; no rounding of cadence`);
      return rounded;
    });
    deltas=validateReplayTickDeltasMs(deltas);
  }else throw Error('Missing measuredTickDeltasMs or authenticated cadence timestamps');
  if(deltas.length!==samples.length-1)throw Error('Native tick count differs from recorded physical samples');
  for(let i=0;i<deltas.length;i++)if(Math.abs((samples[i+1].t-samples[i].t)*1000-deltas[i])>1e-7)throw Error(`Native cadence and physical timestamps differ at tick ${i}`);
  return deltas;
}
export function movementReplayInputSchedule(scenario,deltas){
  validateReplayTickDeltasMs(deltas);
  let elapsedMs=0,previousTickStart=-Infinity;
  return deltas.map(dtMs=>{
    const t=elapsedMs/1000,input=scenario.input(t,dtMs/1000,previousTickStart);
    elapsedMs+=dtMs;previousTickStart=t;
    return {t,dtMs,input};
  });
}
const vector=(v,name)=>{
  if(!v||!['x','y','z'].every(k=>Number.isFinite(v[k])))throw Error(`Invalid ${name}`);
  return v;
};
// Derive only from recorded physical feet and elapsed seconds. Initial zero is
// a sampling convention, never an assertion that an impact wrote zero F0.
export function realizedFeetVelocities(samples){
  return samples.map((sample,i)=>{
    vector(sample.position,'physical position');
    if(!Number.isFinite(sample.t)||(i&&sample.t<=samples[i-1].t))throw Error('Sample times must increase strictly');
    return i?Object.fromEntries(['x','y','z'].map(k=>[k,(sample.position[k]-samples[i-1].position[k])/(sample.t-samples[i-1].t)])):{x:0,y:0,z:0};
  });
}
export function validateMovementTrace(trace){
  if(trace?.schema!==1||!['s5runtime','s5','synthetic'].includes(trace.engine))throw Error('Invalid movement trace schema/engine');
  const m=trace.metadata;
  for(const key of ['scenario','environment','loadout','positionChannel','velocityChannel','source','initialConditions'])if(!m?.[key])throw Error(`Missing ${key}`);
  if(!['physical-actor-F0','realized-feet-difference'].includes(m.velocityChannel))throw Error('Unsupported velocityChannel');
  if(m.velocityChannel==='realized-feet-difference')for(const [key,value] of Object.entries(REALIZED_VELOCITY_DERIVATION))if(m.velocityDerivation?.[key]!==value)throw Error(`Invalid velocityDerivation.${key}`);
  if(!/^[a-f0-9]{64}$/i.test(m.inputFingerprint||''))throw Error('Missing verified input schedule fingerprint');
  if(!m.clockOrigin?.event||m.clockOrigin.measured!==true||!Number.isFinite(m.clockOrigin.sourceTimeSeconds))throw Error('Missing measured clock origin event');
  const initial=m.initialConditions;
  if(!initial.sex||!initial.weapon||!Number.isFinite(initial.energy)||!Number.isFinite(initial.facing))throw Error('Missing initial conditions');
  const profileCase=validateComparisonActorMpCase(m,{sha256:profileSha256});
  if(profileCase&&trace.samples?.[0]?.energy!==profileCase.actorProfile.currentMp)throw Error('Actor profile differs from sample0 current MP');
  if(m.units!=='scene'||m.axes!=='s5-world'||m.positionChannel!=='physical-feet')throw Error('Trace needs explicit physical feet in scene / s5-world coordinates');
  if(m.actorVerified!==true||m.logicalValuesDecoded!==true)throw Error('Actor identity and logical decoding must be verified');
  if(!Array.isArray(trace.samples)||trace.samples.length<2)throw Error('Insufficient samples');
  let previous=-Infinity;
  for(const s of trace.samples){
    if(!Number.isFinite(s.t)||s.t<=previous)throw Error('Sample times must increase strictly');
    previous=s.t;vector(s.position,'physical position');vector(s.velocity,'declared velocity channel');
    if(!Number.isFinite(s.energy))throw Error('Invalid logical energy');
  }
  if(m.velocityChannel==='realized-feet-difference'){
    const expected=realizedFeetVelocities(trace.samples);
    for(let i=0;i<expected.length;i++)for(const axis of ['x','y','z'])if(Math.abs(trace.samples[i].velocity[axis]-expected[i][axis])>1e-9)throw Error(`Velocity does not match realized feet difference at sample ${i}.${axis}`);
  }
  return trace;
}
function interpolate(samples,t,index){
  while(index+1<samples.length&&samples[index+1].t<t)index++;
  const a=samples[index],b=samples[Math.min(index+1,samples.length-1)];
  const ratio=(t-a.t)/(b.t-a.t||1),result={t,energy:a.energy+(b.energy-a.energy)*ratio};
  for(const key of ['position','velocity'])result[key]=Object.fromEntries(['x','y','z'].map(k=>[k,a[key][k]+(b[key][k]-a[key][k])*ratio]));
  return {sample:result,index};
}
export function compareMovementTraces(reference,candidate,tolerances=MOVEMENT_TOLERANCES){
  validateMovementTrace(reference);validateMovementTrace(candidate);
  const limits={...MOVEMENT_TOLERANCES,...tolerances};
  if(!Object.values(limits).every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid tolerance');
  for(const key of ['scenario','environment','loadout','inputFingerprint','velocityChannel'])if(reference.metadata[key]!==candidate.metadata[key])throw Error(`Non-equivalent ${key}`);
  for(const key of ['sex','weapon','energy','facing'])if(reference.metadata.initialConditions[key]!==candidate.metadata.initialConditions[key])throw Error(`Non-equivalent initial ${key}`);
  if(reference.metadata.actorProfile!==undefined||candidate.metadata.actorProfile!==undefined){
    if(reference.metadata.caseId!==candidate.metadata.caseId||reference.metadata.actorProfileFingerprint!==candidate.metadata.actorProfileFingerprint||serializeComparisonActorMpProfile(reference.metadata.actorProfile)!==serializeComparisonActorMpProfile(candidate.metadata.actorProfile))throw Error('Non-equivalent actor MP profile/case');
    if(reference.metadata.initialConditions.maximumMp!==candidate.metadata.initialConditions.maximumMp)throw Error('Non-equivalent initial maximum MP');
  }
  if(reference.metadata.clockOrigin.event!==candidate.metadata.clockOrigin.event)throw Error('Non-equivalent clock origin event');
  const r=reference.samples,c=candidate.samples;
  const blocked=[];
  // Backward differences average over their preceding interval. Interpolating
  // different averaging windows could hide a launch/contact discontinuity.
  if(reference.metadata.velocityChannel==='realized-feet-difference'&&(r.length!==c.length||r.some((s,i)=>Math.abs(s.t-c[i].t)>1e-9)))blocked.push('Realized velocity sampling intervals differ; replay the same measured tick schedule');
  if(reference.engine!=='s5runtime'||candidate.engine!=='s5')blocked.push('No original S5Runtime versus S5 pair');
  if(reference.engine==='s5runtime'&&!/^[a-f0-9]{64}$/i.test(reference.metadata.captureSha256||''))blocked.push('Missing native capture fingerprint');
  // Time zero is supplied by the measured common input event. Do not fit away
  // launch delays or freely rotate/scale trajectories until their shapes agree.
  if(Math.abs(r[0].t-c[0].t)>limits.time||Math.abs(r.at(-1).t-c.at(-1).t)>limits.time)blocked.push('Capture windows differ');
  for(const [engine,rows] of [['reference',r],['candidate',c]])if(rows.some((s,i)=>i&&s.t-rows[i-1].t>limits.maxSampleGap))blocked.push(`${engine} contains an excessive sample gap`);
  const errors={position:[],velocity:[],energy:[]};let index=0;
  for(const s of r){
    if(s.t<c[0].t||s.t>c.at(-1).t)continue;
    const result=interpolate(c,s.t,index);index=result.index;
    for(const key of ['position','velocity'])errors[key].push(Math.hypot(...['x','y','z'].map(k=>s[key][k]-result.sample[key][k])));
    errors.energy.push(Math.abs(s.energy-result.sample.energy));
  }
  if(errors.position.length<2)blocked.push('Insufficient common time coverage');
  const metrics=Object.fromEntries(Object.entries(errors).map(([key,values])=>[key,{max:values.length?Math.max(...values):null,rmse:values.length?Math.sqrt(values.reduce((n,v)=>n+v*v,0)/values.length):null,tolerance:limits[key]}]));
  const passed=!blocked.length&&Object.values(metrics).every(m=>m.max!==null&&m.max<=m.tolerance);
  return {schema:1,scenario:reference.metadata.scenario,velocityChannel:reference.metadata.velocityChannel,scope:'Physical feet position, the explicitly matched velocity channel and energy over the supplied equivalent window only; excludes animation, sound, VFX and unmeasured collision variants.',status:blocked.length?'blocked':passed?'pass':'fail',nativeReady:passed,blocked,metrics,comparedSamples:errors.position.length,tolerances:limits,toleranceBasis:'Provisional engineering acceptance limits; not measured native variability. No time/position fitting.',sources:[reference.metadata.source,candidate.metadata.source]};
}
