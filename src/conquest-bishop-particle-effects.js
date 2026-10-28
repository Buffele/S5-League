import {prepareConquestBishopParticleSource,CONQUEST_BISHOP_PARTICLE_SOURCE_ASSETS,conquestBishopParticleSequence} from './conquest-bishop-particle-source.js';
import {prepareConquestBishopParticleRenderBank} from './conquest-bishop-particle-render.js';
import {createConquestBishopParticleFrames,CONQUEST_BISHOP_PARTICLE_FRAME_POLICY} from './conquest-bishop-particle-frame.js';
import {createConquestBishopParticleAction} from './conquest-bishop-particle-action.js';
import {createConquestBishopParticleActionController} from './conquest-bishop-particle-action-controller.js';
import {resetNativeSequenceClock,advanceNativeSequenceClock} from './native-sequence-clock.js';
const owners=new WeakMap(),uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export const CONQUEST_BISHOP_PARTICLE_PRESENTATION_POLICY=Object.freeze({name:'s5-bishop-source-particle-postpose-direct-v1',admission:'explicit S5 direct admission=false, instanceAlpha=1',clock:'119FAE0 unsigned source clock, source duration/loop and action windows; caller-owned S5 leases',parents:CONQUEST_BISHOP_PARTICLE_FRAME_POLICY.name,nativeSceneAdmissionQualified:false,nativeGPUQualified:false,nativeReady:false});

// Share one bank across actors. No fetch, texture creation or model rebuild
// occurs in update. This owner creates the actual authored particle profiles.
export async function prepareConquestBishopParticleEffects({fetchAsset=globalThis.fetch,decodeImage=globalThis.createImageBitmap,policy}={}){
 if(policy!==CONQUEST_BISHOP_PARTICLE_PRESENTATION_POLICY||typeof fetchAsset!=='function'||typeof decodeImage!=='function')throw Error('Explicit Bishop source-particle presentation policy required');
 const prepared=new Map(),users=new Set();let disposed=false;
 try{for(const spec of CONQUEST_BISHOP_PARTICLE_SOURCE_ASSETS){const parts=await Promise.all(spec.sourceAssets.map(async a=>{const response=await fetchAsset(a.url);if(!response?.ok)throw Error('Bishop particle source unavailable '+a.url);return response.arrayBuffer();}));const source=await prepareConquestBishopParticleSource({name:spec.name,sequenceBytes:parts[0],parsedJsonBytes:parts[1]}),renderBank=await prepareConquestBishopParticleRenderBank({source,fetchAsset,decodeImage});prepared.set(spec.name,{source,renderBank});}}
 catch(error){for(const p of prepared.values())p.renderBank.dispose();throw error;}
 function live(){if(disposed)throw Error('Bishop particle bank disposed');}
 const bank=Object.freeze({async warm(renderer,camera,scene){live();const reports=[];for(const p of prepared.values())reports.push(await p.renderBank.warm(renderer,camera,scene));live();return reports;},
  create({name,actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,presentation,recipientFields,state}={}){
   live();const preparedSequence=prepared.get(name);if(!preparedSequence)throw Error('Exact prepared Bishop particle sequence required');const{source,renderBank}=preparedSequence,sequence=conquestBishopParticleSequence(source),frameOwner=createConquestBishopParticleFrames({source,actor,world,scene,presentation,recipientFields,state,policy:CONQUEST_BISHOP_PARTICLE_FRAME_POLICY}),actions=[],controls=[];let ownerDisposed=false,finished=false;
   try{for(const row of sequence.actions){if(row.type!=='CActParticle')continue;const frame=frameOwner.readFrame(row.index),action=createConquestBishopParticleAction({source,nodeIndex:row.index,frameOwner:frame,actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,renderBank});actions.push(action);controls.push(createConquestBishopParticleActionController({source,nodeIndex:row.index,particleAction:action,frameOwner:frame,actor,world,scene}));}}
   catch(error){for(const c of controls)c.dispose();for(const a of actions)a.dispose();frameOwner.dispose();throw error;}
   const clock={looping:sequence.loopingFlag,precisionBits:24,roundingMode:'nearest'};resetNativeSequenceClock(clock,sequence.durationMs);
   function current(){live();if(ownerDisposed)throw Error('Disposed Bishop particle sequence');}
   const owner=Object.freeze({
    update(deltaMs){current();if(!uint(deltaMs))throw Error('Unsigned Bishop particle delta required');if(deltaMs===0||finished)return owner.snapshot();const timing=advanceNativeSequenceClock(clock,deltaMs);if(!timing.dispatch){finished=true;for(const c of controls){c.resetActive18();c.resetParticle1282B80();}return owner.snapshot();}for(const c of controls)c.tick({emitting:clock.emitting,previous:clock.previous,current:clock.current});for(let i=0;i<actions.length;i++){if(!controls[i].readActive18())continue;const action=actions[i],frame=frameOwner.readFrame(action.nodeIndex),receipt=frame.readFrame();action.tick({previous:clock.previous,current:clock.current,deltaMs,admission:false,frameReceipt:receipt});action.render({instanceAlpha:1,frameReceipt:receipt});}return owner.snapshot();},
    snapshot(){current();return {sequencePath:sequence.sourcePath,sequenceTimeMs:clock.current,sourceDurationMs:sequence.durationMs,looping:sequence.loopingFlag,finished,sourceProfilesRendered:actions.length,pendingSourceNodes:sequence.actions.filter(a=>a.type!=='CActParticle').map(a=>({index:a.index,type:a.type,pending:true})),sourceSequenceComplete:sequence.actions.every(a=>a.type==='CActParticle'),frames:actions.map(a=>frameOwner.readFrame(a.nodeIndex).snapshot()),actions:actions.map(a=>a.snapshot()),renderers:actions.map(a=>a.readRenderer()),presentationPolicy:policy.name,sourceTextureResolutionQualified:true,sourceParentSelectionQualified:true,nativeRecipientAttachmentQualified:false,nativeWrapper344Qualified:false,nativeGPUQualified:false,nativeReady:false};},
    dispose(){if(ownerDisposed)return;ownerDisposed=true;const errors=[];for(const c of controls)try{c.dispose();}catch(e){errors.push(e);}for(const a of actions)try{a.dispose();}catch(e){errors.push(e);}try{frameOwner.dispose();}catch(e){errors.push(e);}users.delete(owner);if(errors.length)throw new AggregateError(errors,'Bishop source particle cleanup failed');},
   });users.add(owner);owners.set(owner,{actor,world,scene,source,bank,current});return owner;
  },
  snapshot(){live();return {preparedSequences:prepared.size,activeSequences:users.size,authoredParticleProfiles:[...prepared.values()].reduce((n,p)=>n+p.source.nodeCount,0),nativeReady:false};},
  dispose(){if(disposed)return;if(users.size)throw Error('Bishop particle bank still owns active sequences');for(const p of prepared.values())p.renderBank.dispose();disposed=true;},
 });return bank;
}
export function assertConquestBishopParticleEffect(owner,{actor,world,scene,bank}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.world!==world||r.scene!==scene||bank!==undefined&&r.bank!==bank)throw Error('Typed actual Bishop particle effect required');r.current();return owner;}
