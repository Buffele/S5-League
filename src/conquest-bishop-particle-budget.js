// Bishop source-bound use of the same independently CPU-qualified CActParticle stages.
// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import {conquestBishopParticleSourceNode} from './conquest-bishop-particle-source.js';
import {CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES} from './conquest-pawn-particle-admission.js';
const f=Math.fround;
function vector(v){if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)||!Number.isFinite(f(x))))throw Error('Finite native camera/emitter vectors required');return v.map(f);}
//11363B8..11366E5: the three continuous source nodes retain fractional3C
// across ticks, never set the burst latch, and cap the seconds multiplier at
// .25. Burst nodes instead clear3C and set38 on their first admitted burst.
export function conquestBishopParticleBudget({source,nodeIndex,currentEmitterFields,emitting,burstLatch,fractionalCarry,deltaMs,qualityProfile,cameraPositionNative,originNative}={}){
 const node=conquestBishopParticleSourceNode(source,nodeIndex),e=currentEmitterFields;
 if(!(e instanceof DataView)||e.byteLength<0x64||Boolean(e.getUint8(0x10))!==node.emitterContinuous||typeof emitting!=='boolean'||typeof burstLatch!=='boolean'||!Number.isFinite(fractionalCarry)||fractionalCarry<0||fractionalCarry>=1||!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>250||!CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES.includes(qualityProfile))throw Error('Exact Bishop third effect current emitter, admitted delta, fractional carry and explicit source flags/quality required');
 const camera=vector(cameraPositionNative),origin=vector(originNative),d=camera.map((v,i)=>f(v-origin[i])),distanceSquared=f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]));let count=0;fractionalCarry=f(fractionalCarry);
 if(emitting&&!burstLatch){
  let rate=e.getUint32(0x5c,true);if(qualityProfile.level===1)rate=Math.trunc(f(rate)*.5+1)>>>0;else if(qualityProfile.level===2)rate=Math.trunc(f(rate)*.25+1)>>>0;
  if(distanceSquared>25000000)rate=Math.trunc(f(rate)*.25+1)>>>0;else if(distanceSquared>6250000)rate=Math.trunc(f(rate)*.5+1)>>>0;
  if(node.emitterContinuous){const seconds=f(f(deltaMs)*.001),total=f(f(rate)*Math.min(seconds,.25)+fractionalCarry);count=Math.trunc(total)>>>0;fractionalCarry=f(total-f(count));}
  else{count=rate;fractionalCarry=0;burstLatch=true;}
 }
 return Object.freeze({count,burstLatch,fractionalCarry,distanceSquared,sourceContinuousBudgetQualified:true,sourceBurstBudgetQualified:true,currentEmitterProducerQualified:false,nativeQualityValueObserved:false,cameraProducerQualified:false,admissionProducerQualified:false,nativeReady:false});
}
