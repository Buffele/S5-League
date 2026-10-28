import {prepareConquestPawnExplodeParticleSource,CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS} from './conquest-pawn-explode-particle-source.js';
import {prepareConquestPawnExplodeParticleRenderBank} from './conquest-pawn-explode-particle-render.js';
import {createConquestPawnExplodeFrame,CONQUEST_PAWN_EXPLODE_FRAME_POLICY} from './conquest-pawn-explode-frame.js';
import {createConquestPawnExplodeParticleAction} from './conquest-pawn-explode-particle-action.js';
import {createConquestPawnExplodeParticleActionController} from './conquest-pawn-explode-particle-action-controller.js';
import {resetNativeSequenceClock,advanceNativeSequenceClock} from './native-sequence-clock.js';

// Retained exact two-node source sequence. S5 post-pose/direct admission and
// camera/material policies remain explicit; no static Death frame is reused.
export async function prepareConquestPawnExplodeThirdEffect({fetchAsset=globalThis.fetch,decodeImage=globalThis.createImageBitmap}={}){
 const parts=await Promise.all(CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS.map(async row=>{const response=await fetchAsset(row.url);if(!response?.ok)throw Error('Exact PawnExplode particle source unavailable');return response.arrayBuffer();}));
 const source=await prepareConquestPawnExplodeParticleSource({sequenceBytes:parts[0],parsedJsonBytes:parts[1],manifestBytes:parts[2]}),renderBank=await prepareConquestPawnExplodeParticleRenderBank({source,fetchAsset,decodeImage});
 let disposed=false;const users=new Set();
 return Object.freeze({async warm(renderer,camera,scene){if(disposed)throw Error('Third-effect bank disposed');const report=await renderBank.warm(renderer,camera,scene);if(disposed)throw Error('Third-effect bank disposed');return report;},
  create({actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,framePolicy}={}){
   if(disposed||framePolicy!==CONQUEST_PAWN_EXPLODE_FRAME_POLICY)throw Error('Prepared PawnExplode third effect and explicit live-frame policy required');
   const frame=createConquestPawnExplodeFrame({actor,world,scene,policy:framePolicy}),actions=[],controls=[];let ownerDisposed=false;
   try{for(let i=0;i<2;i++){const action=createConquestPawnExplodeParticleAction({source,nodeIndex:i,frameOwner:frame,actor,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile,renderBank});actions.push(action);controls.push(createConquestPawnExplodeParticleActionController({source,nodeIndex:i,particleAction:action,frameOwner:frame,actor,world,scene}));}}
   catch(error){for(const c of controls)c.dispose();for(const a of actions)a.dispose();frame.dispose();throw error;}
   const clock={looping:true,precisionBits:24,roundingMode:'nearest'};resetNativeSequenceClock(clock,1700);
   const owner=Object.freeze({
    update(deltaMs){if(ownerDisposed||disposed)throw Error('Disposed PawnExplode third effect');if(deltaMs===0)return owner.snapshot();const timing=advanceNativeSequenceClock(clock,deltaMs);if(timing.dispatch){for(const control of controls)control.tick({emitting:clock.emitting,previous:clock.previous,current:clock.current});const receipt=frame.readFrame();for(const action of actions){action.tick({previous:clock.previous,current:clock.current,deltaMs,admission:false,frameReceipt:receipt});action.render({instanceAlpha:1,frameReceipt:receipt});}}return owner.snapshot();},
    snapshot(){if(ownerDisposed||disposed)throw Error('Disposed PawnExplode third effect');return{sequencePath:'Effects/pve_mon_pawn_red_eff3.seq',sequenceTimeMs:clock.current,looping:true,frame:frame.snapshot(),actions:actions.map(a=>a.snapshot()),renderers:actions.map(a=>a.readRenderer()),sourceTextureResolutionQualified:true,sourceProfilesRendered:2,nativeWrapper344Qualified:false,nativeSceneAdmissionQualified:false,nativeCameraMappingQualified:false,nativeGPUQualified:false,nativeReady:false};},
    dispose(){if(ownerDisposed)return;ownerDisposed=true;const errors=[];for(const c of controls)try{c.dispose();}catch(e){errors.push(e);}for(const a of actions)try{a.dispose();}catch(e){errors.push(e);}frame.dispose();users.delete(owner);if(errors.length)throw new AggregateError(errors,'PawnExplode third effect cleanup failed');},
   });users.add(owner);return owner;
  },
  snapshot(){return{activeActors:users.size,disposed,nativeReady:false};},
  dispose(){if(disposed)return;if(users.size)throw Error('Third-effect bank has active actor owners');renderBank.dispose();disposed=true;},
 });
}
