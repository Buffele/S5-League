import {conquestPawnParticleSourceNode} from './conquest-pawn-particle-source.js';
const f=Math.fround;
export const CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES=Object.freeze([0,1,2].map(level=>Object.freeze({name:'s5-explicit-native-particle-quality-'+level,level,nativeRuntimeValueObserved:false})));
function vector(v){if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)||!Number.isFinite(f(x))))throw Error('Finite current native camera and emitter positions required');return v.map(f);}
// Scoped11363B8..11366E5. All five true authored keys are burst, not
// continuous. Native4C=false is the actual retained constructor branch.
export function conquestPawnParticleBurstBudget({source,nodeIndex,currentEmitterFields,emitting,burstLatch,qualityProfile,cameraPositionNative,originNative}={}){
 const node=conquestPawnParticleSourceNode(source,nodeIndex);
 if(!(currentEmitterFields instanceof DataView)||currentEmitterFields.byteLength<0x64||typeof emitting!=='boolean'||typeof burstLatch!=='boolean'||!CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES.includes(qualityProfile))throw Error('Current emitter, retained emission flags and explicit source quality profile required');
 if(node.emitterContinuous||currentEmitterFields.getUint8(0x10)!==0)throw Error('Source five-node Pawn burst branch required');
 const camera=vector(cameraPositionNative),origin=vector(originNative),d=camera.map((v,i)=>f(v-origin[i])),distanceSquared=f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]));
 let count=0;
 if(emitting&&!burstLatch){count=currentEmitterFields.getUint32(0x5c,true);if(qualityProfile.level===1)count=Math.trunc(f(count)*.5+1)>>>0;else if(qualityProfile.level===2)count=Math.trunc(f(count)*.25+1)>>>0;if(distanceSquared>25000000)count=Math.trunc(f(count)*.25+1)>>>0;else if(distanceSquared>6250000)count=Math.trunc(f(count)*.5+1)>>>0;burstLatch=true;}
 return Object.freeze({count,burstLatch,distanceSquared,sourceBurstBudgetQualified:true,qualityProfile:qualityProfile.name,nativeQualityValueObserved:false,cameraProducerQualified:false,admissionProducerQualified:false,nativeReady:false});
}
