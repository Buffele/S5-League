// RookExplode1110 source-bound use of the already qualified CActParticle stages; own source/frame receipts.
// Rook source-bound use of the same independently CPU-qualified CActParticle stages.
// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import * as THREE from 'three';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {conquestRookExplodeParticleSourceNode} from './conquest-rook-explode-particle-source.js';
import {assertConquestRookExplodeParticleFrame,assertConquestRookExplodeParticleFrameReceipt} from './conquest-rook-explode-particle-frame.js';
import {createConquestRookExplodeParticleEmitter,assertConquestRookExplodeParticleEmitterReceipt} from './conquest-rook-explode-particle-emitter.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
import {integrateConquestRookExplodeParticleFields,initializeConquestRookExplodeParticleBirthFields,varyConquestRookExplodeParticleBirthFields,retargetConquestRookExplodeParticleFields} from './conquest-rook-explode-particle-simulation.js';
import {CONQUEST_PAWN_PARTICLE_TRIG_PROFILE} from './conquest-pawn-particle-spatial.js';
import {applyConquestRookExplodeParticleSpatialBirth} from './conquest-rook-explode-particle-spatial.js';
import {CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES} from './conquest-pawn-particle-admission.js';
import {conquestRookExplodeParticleBudget} from './conquest-rook-explode-particle-budget.js';
import {createConquestRookExplodeParticleRenderer} from './conquest-rook-explode-particle-render.js';
import {advanceConquestPawnParticlePool,advanceConquestRookExplodeParticleTexture} from './conquest-rook-explode-particle-pool.js';
const owners=new WeakMap(),drawReceipts=new WeakMap(),f=Math.fround,uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;

// Retained11361B0 action for the authenticated single-key Rook
// nodes. Controller windows, frustum admission and the integer clock are
// caller-owned source contracts, not inferred from current time or actor HP.
export function createConquestRookExplodeParticleAction({source,nodeIndex,frameOwner,actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,renderBank}={}){
 const node=conquestRookExplodeParticleSourceNode(source,nodeIndex),spec=node.emitter.sourceFields;
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS||trigProfile!==CONQUEST_PAWN_PARTICLE_TRIG_PROFILE||!CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES.includes(qualityProfile)||!camera?.isCamera||typeof nextRandom15!=='function'||spec.simulationStepMs!==0)throw Error('Exact Rook third effect action, actual camera and explicit numerical/RNG/quality contracts required');
 const retained={actor,world,scene};let disposed=false;
 function live(){if(disposed)throw Error('Pawn particle action disposed');assertConquestRookExplodeParticleFrame(frameOwner,retained);if(!camera.isCamera)throw Error('Actual retained S5 camera required');}
 live();let emitter=createConquestRookExplodeParticleEmitter({source,nodeIndex,numericalProfile,frameOwner,...retained}),burstLatch=false,fractionalCarry=0,emitting=true,currentTime=0,revision=0,renderParticles=[],lastReceipt=null,renderer=null;
 const particles=[],cam=new THREE.Vector3(),textureCounts=new Uint32Array(spec.textures.length);
 function birth(p,frame,row){
  initializeConquestRookExplodeParticleBirthFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale,currentEmitterFields:row.currentFields});
  applyConquestRookExplodeParticleSpatialBirth(p,{source,nodeIndex,numericalProfile,trigProfile,currentEmitterFields:row.currentFields,runtimeFrame:frame,nextRandom15});
  varyConquestRookExplodeParticleBirthFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale,nextRandom15});
 }
 function snapshot(){live();return Object.freeze({kind:'conquest-owned-rook-particle-action',nodeIndex,revision,currentTime,emitting44:emitting,burstLatch38:burstLatch,fractionalCarry3C:fractionalCarry,poolSize:particles.length,renderCount:renderParticles.length,textureCounts:Object.freeze([...textureCounts]),finished1136050:!emitting&&renderParticles.length===0,field4C:false,qualityProfile:qualityProfile.name,sourceEmissionBudgetQualified:true,sourceSimulationStagesQualified:true,sourcePoolTraversalQualified:true,sourceTextureTimelineQualified:true,rendererReady:renderer!==null,admissionProducerQualified:false,nativeGPUQualified:false,effectLifetimeQualified:false,nativeReady:false});}
 const api=Object.freeze({nodeIndex,
  readEmitting44(){live();return emitting;},
  setEmitting1282F20(value){live();if(typeof value!=='boolean')throw Error('Explicit source emission flag required');emitting=value;burstLatch=false;return snapshot();},
  readFinished1136050(){live();return !emitting&&renderParticles.length===0;},
  tick({previous,current,deltaMs,admission,frameReceipt}={}){
   live();if(![previous,current,deltaMs].every(uint)||typeof admission!=='boolean')throw Error('Explicit unsigned action times/delta and source admission required');
   const frame=assertConquestRookExplodeParticleFrameReceipt(frameReceipt,{owner:frameOwner});
   currentTime=(currentTime+deltaMs)>>>0;revision++;renderParticles=[];textureCounts.fill(0);
   if(deltaMs>250||admission){for(const p of particles)p.setUint32(4,0xffffffff,true);lastReceipt=snapshot();return lastReceipt;}
   const row=emitter.update(frame);assertConquestRookExplodeParticleEmitterReceipt(row,{owner:emitter});camera.updateWorldMatrix(true,false);camera.getWorldPosition(cam);const cameraPositionNative=[cam.x,cam.y,cam.z].map(v=>f(v/SCN_SCENE_SCALE));
   const budget=conquestRookExplodeParticleBudget({source,nodeIndex,currentEmitterFields:row.currentFields,emitting,burstLatch,fractionalCarry,deltaMs,qualityProfile,cameraPositionNative,originNative:frame.originNative});burstLatch=budget.burstLatch;fractionalCarry=budget.fractionalCarry;
   advanceConquestPawnParticlePool(particles,{remaining:budget.count,capacity:node.capacity,deltaMs,control54:node.control54,originNative:frame.originNative},{integrate(p,delta){integrateConquestRookExplodeParticleFields(p,delta,{numericalProfile});},retarget(p){retargetConquestRookExplodeParticleFields(p,{source,nodeIndex,numericalProfile,parentScale:frame.parentScale,nextRandom15});},textureTick(p){advanceConquestRookExplodeParticleTexture(p,{source,nodeIndex,nextRandom15});},birth(p){birth(p,frame,row);},render(p){const index=p.getUint32(0xa4,true);if(index>=textureCounts.length)throw Error('Source Pawn texture index exceeds current table');textureCounts[index]=(textureCounts[index]+1)>>>0;renderParticles.push(p);}});
   lastReceipt=snapshot();return lastReceipt;
  },
  reset(){live();emitter.dispose();emitter=createConquestRookExplodeParticleEmitter({source,nodeIndex,numericalProfile,frameOwner,...retained});burstLatch=false;fractionalCarry=0;emitting=true;currentTime=0;revision++;for(const p of particles)p.setUint32(4,0xffffffff,true);renderParticles=[];textureCounts.fill(0);lastReceipt=null;renderer?.reset();return snapshot();},
  readParticles(){live();return Object.freeze(renderParticles.map(p=>new DataView(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength))));},
  snapshot,
  render({instanceAlpha,frameReceipt}={}){live();if(!renderer)throw Error('Pawn source particle render owner not prepared');const receipt=Object.freeze({kind:'conquest-owned-rook-particle-draw-state',revision,nodeIndex});drawReceipts.set(receipt,{action:api,revision});return renderer.render(receipt,{instanceAlpha,frameReceipt});},
  readRenderer(){live();if(!renderer)throw Error('Pawn source particle render owner not prepared');return renderer.snapshot();},
  dispose(){if(disposed)return;renderer?.dispose();emitter.dispose();disposed=true;particles.length=0;renderParticles=[];},
 });
 owners.set(api,{source,nodeIndex,frameOwner,live,get revision(){return revision;},readDrawParticles:()=>renderParticles.map(p=>new DataView(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength)))});
 try{if(renderBank)renderer=createConquestRookExplodeParticleRenderer({source,nodeIndex,action:api,frameOwner,actor,world,scene,camera,bank:renderBank});}catch(error){api.dispose();throw error;}return api;
}
export function assertConquestRookExplodeParticleAction(action,{source,nodeIndex,frameOwner}={}){const record=owners.get(action);if(!record||record.source!==source||record.nodeIndex!==nodeIndex||record.frameOwner!==frameOwner)throw Error('Typed original Pawn particle action required');record.live();return action;}
export function readConquestRookExplodeParticleDrawState(receipt,{action}={}){const owner=owners.get(action),proof=drawReceipts.get(receipt);if(!owner||proof?.action!==action||proof.revision!==owner.revision)throw Error('Current typed Pawn particle draw state required');owner.live();return Object.freeze({particles:Object.freeze(owner.readDrawParticles())});}
