import * as THREE from 'three';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {conquestEnterBaseParticleSourceNode} from './conquest-enter-base-particle-source.js';
import {assertConquestPawnDeathFrame,assertConquestPawnDeathFrameReceipt} from './conquest-pawn-death-frame.js';
import {createConquestEnterBaseParticleEmitter,assertConquestEnterBaseParticleEmitterReceipt} from './conquest-enter-base-particle-emitter.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
import {integrateConquestEnterBaseParticleFields,initializeConquestEnterBaseParticleBirthFields,varyConquestEnterBaseParticleBirthFields,retargetConquestEnterBaseParticleFields} from './conquest-enter-base-particle-simulation.js';
import {CONQUEST_PAWN_PARTICLE_TRIG_PROFILE} from './conquest-pawn-particle-spatial.js';
import {applyConquestEnterBaseParticleSpatialBirth} from './conquest-enter-base-particle-spatial.js';
import {CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES} from './conquest-pawn-particle-admission.js';
import {conquestEnterBaseParticleBudget} from './conquest-enter-base-particle-budget.js';
import {createConquestEnterBaseParticleRenderer} from './conquest-enter-base-particle-render.js';
import {advanceConquestPawnParticlePool,advanceConquestEnterBaseParticleTexture} from './conquest-enter-base-particle-pool.js';
const owners=new WeakMap(),drawReceipts=new WeakMap(),f=Math.fround,uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;

// Retained11361B0 action for the seven actual single-key Enter Base
// nodes. Controller windows, frustum admission and the integer clock are
// caller-owned source contracts, not inferred from current time or actor HP.
export function createConquestEnterBaseParticleAction({source,nodeIndex,frameOwner,actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,renderBank}={}){
 const node=conquestEnterBaseParticleSourceNode(source,nodeIndex),spec=node.emitter.sourceFields;
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS||trigProfile!==CONQUEST_PAWN_PARTICLE_TRIG_PROFILE||!CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES.includes(qualityProfile)||!camera?.isCamera||typeof nextRandom15!=='function'||spec.simulationStepMs!==0)throw Error('Exact Enter Base action, actual camera and explicit numerical/RNG/quality contracts required');
 const retained={actor,world,scene};let disposed=false;
 function live(){if(disposed)throw Error('Pawn particle action disposed');assertConquestPawnDeathFrame(frameOwner,retained);if(!camera.isCamera)throw Error('Actual retained S5 camera required');}
 live();let emitter=createConquestEnterBaseParticleEmitter({source,nodeIndex,numericalProfile,frameOwner,...retained}),burstLatch=false,fractionalCarry=0,emitting=true,currentTime=0,revision=0,renderParticles=[],lastReceipt=null,renderer=null;
 const particles=[],cam=new THREE.Vector3(),textureCounts=new Uint32Array(spec.textures.length);
 function birth(p,frame,row){
  initializeConquestEnterBaseParticleBirthFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale});
  applyConquestEnterBaseParticleSpatialBirth(p,{source,nodeIndex,numericalProfile,trigProfile,currentEmitterFields:row.currentFields,runtimeFrame:frame,nextRandom15});
  varyConquestEnterBaseParticleBirthFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale,nextRandom15});
 }
 function snapshot(){live();return Object.freeze({kind:'conquest-owned-enter-base-particle-action',nodeIndex,revision,currentTime,emitting44:emitting,burstLatch38:burstLatch,fractionalCarry3C:fractionalCarry,poolSize:particles.length,renderCount:renderParticles.length,textureCounts:Object.freeze([...textureCounts]),finished1136050:!emitting&&renderParticles.length===0,field4C:false,qualityProfile:qualityProfile.name,sourceEmissionBudgetQualified:true,sourceSimulationStagesQualified:true,sourcePoolTraversalQualified:true,sourceTextureTimelineQualified:true,rendererReady:renderer!==null,admissionProducerQualified:false,nativeGPUQualified:false,effectLifetimeQualified:false,nativeReady:false});}
 const api=Object.freeze({nodeIndex,
  readEmitting44(){live();return emitting;},
  setEmitting1282F20(value){live();if(typeof value!=='boolean')throw Error('Explicit source emission flag required');emitting=value;burstLatch=false;return snapshot();},
  readFinished1136050(){live();return !emitting&&renderParticles.length===0;},
  tick({previous,current,deltaMs,admission,frameReceipt}={}){
   live();if(![previous,current,deltaMs].every(uint)||typeof admission!=='boolean')throw Error('Explicit unsigned action times/delta and source admission required');
   const frame=assertConquestPawnDeathFrameReceipt(frameReceipt,{owner:frameOwner});
   currentTime=(currentTime+deltaMs)>>>0;revision++;renderParticles=[];textureCounts.fill(0);
   if(deltaMs>250||admission){for(const p of particles)p.setUint32(4,0xffffffff,true);lastReceipt=snapshot();return lastReceipt;}
   const row=emitter.update(frame);assertConquestEnterBaseParticleEmitterReceipt(row,{owner:emitter});camera.updateWorldMatrix(true,false);camera.getWorldPosition(cam);const cameraPositionNative=[cam.x,cam.y,cam.z].map(v=>f(v/SCN_SCENE_SCALE));
   const budget=conquestEnterBaseParticleBudget({source,nodeIndex,currentEmitterFields:row.currentFields,emitting,burstLatch,fractionalCarry,deltaMs,qualityProfile,cameraPositionNative,originNative:frame.originNative});burstLatch=budget.burstLatch;fractionalCarry=budget.fractionalCarry;
   advanceConquestPawnParticlePool(particles,{remaining:budget.count,capacity:node.capacity,deltaMs,control54:node.control54,originNative:frame.originNative},{integrate(p,delta){integrateConquestEnterBaseParticleFields(p,delta,{numericalProfile});},retarget(p){retargetConquestEnterBaseParticleFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale,nextRandom15});},textureTick(p){advanceConquestEnterBaseParticleTexture(p,{source,nodeIndex});},birth(p){birth(p,frame,row);},render(p){const index=p.getUint32(0xa4,true);if(index>=textureCounts.length)throw Error('Source Pawn texture index exceeds current table');textureCounts[index]=(textureCounts[index]+1)>>>0;renderParticles.push(p);}});
   lastReceipt=snapshot();return lastReceipt;
  },
  reset(){live();emitter.dispose();emitter=createConquestEnterBaseParticleEmitter({source,nodeIndex,numericalProfile,frameOwner,...retained});burstLatch=false;fractionalCarry=0;emitting=true;currentTime=0;revision++;for(const p of particles)p.setUint32(4,0xffffffff,true);renderParticles=[];textureCounts.fill(0);lastReceipt=null;renderer?.reset();return snapshot();},
  readParticles(){live();return Object.freeze(renderParticles.map(p=>new DataView(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength))));},
  snapshot,
  render({instanceAlpha,frameReceipt}={}){live();if(!renderer)throw Error('Pawn source particle render owner not prepared');const receipt=Object.freeze({kind:'conquest-owned-enter-base-particle-draw-state',revision,nodeIndex});drawReceipts.set(receipt,{action:api,revision});return renderer.render(receipt,{instanceAlpha,frameReceipt});},
  readRenderer(){live();if(!renderer)throw Error('Pawn source particle render owner not prepared');return renderer.snapshot();},
  dispose(){if(disposed)return;renderer?.dispose();emitter.dispose();disposed=true;particles.length=0;renderParticles=[];},
 });
 owners.set(api,{source,nodeIndex,frameOwner,live,get revision(){return revision;},readDrawParticles:()=>renderParticles.map(p=>new DataView(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength)))});
 try{if(renderBank)renderer=createConquestEnterBaseParticleRenderer({source,nodeIndex,action:api,frameOwner,actor,world,scene,camera,bank:renderBank});}catch(error){api.dispose();throw error;}return api;
}
export function assertConquestEnterBaseParticleAction(action,{source,nodeIndex,frameOwner}={}){const record=owners.get(action);if(!record||record.source!==source||record.nodeIndex!==nodeIndex||record.frameOwner!==frameOwner)throw Error('Typed original Pawn particle action required');record.live();return action;}
export function readConquestEnterBaseParticleDrawState(receipt,{action}={}){const owner=owners.get(action),proof=drawReceipts.get(receipt);if(!owner||proof?.action!==action||proof.revision!==owner.revision)throw Error('Current typed Pawn particle draw state required');owner.live();return Object.freeze({particles:Object.freeze(owner.readDrawParticles())});}
