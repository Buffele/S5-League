import {prepareConquestRookPresentation,CONQUEST_ROOK_PRESENTATION_POLICY,assertConquestRookPresentation} from './conquest-rook-presentation.js';
import {prepareConquestRookParticleEffects,CONQUEST_ROOK_PARTICLE_PRESENTATION_POLICY} from './conquest-rook-particle-effects.js';
import {assertConquestRookActor} from './conquest-rook-source.js';
const owners=new WeakMap(),banks=new WeakMap();
export const CONQUEST_ROOK_FULL_PRESENTATION_POLICY=Object.freeze({name:'s5-authored-rook-three-persistent-sequences-v1',model:CONQUEST_ROOK_PRESENTATION_POLICY.name,particles:CONQUEST_ROOK_PARTICLE_PRESENTATION_POLICY.name,nativeComplete344ReleaseQualified:false,nativeReady:false});

// Adapter intentionally separate from the previously delivered partial owner.
// Its old typed model owner is retained for genuine NodeLoader3 bone lookup.
export async function prepareConquestRookFullPresentation({fetchAsset=globalThis.fetch,decodeImage=globalThis.createImageBitmap,policy}={}){
 if(policy!==CONQUEST_ROOK_FULL_PRESENTATION_POLICY)throw Error('Explicit authored Rook full-presentation policy required');const modelBank=await prepareConquestRookPresentation({fetchAsset,decodeImage,policy:CONQUEST_ROOK_PRESENTATION_POLICY});let particleBank;try{particleBank=await prepareConquestRookParticleEffects({fetchAsset,decodeImage,policy:CONQUEST_ROOK_PARTICLE_PRESENTATION_POLICY});}catch(error){modelBank.dispose();throw error;}
 const users=new Set();let disposed=false;const live=()=>{if(disposed)throw Error('Rook full-presentation bank disposed');};
 const bank=Object.freeze({async warm(renderer,camera,scene){live();const reports=[];reports.push(await modelBank.warm(renderer,camera,scene));reports.push(await particleBank.warm(renderer,camera,scene));live();return reports;},
  create({actor,particles}={}){live();assertConquestRookActor(actor);if(!particles)throw Error('Actual Rook particle world/camera/RNG/numerical owners required');const modelPresentation=modelBank.create({actor}),effects=[];let cleared=false,ownerDisposed=false;
   try{for(const name of ['pve_mon_rook_spark','pve_mon_rook_aura','pve_rook_shield'])effects.push(particleBank.create({...particles,name,actor,presentation:modelPresentation}));}catch(error){for(const e of effects)e.dispose();modelPresentation.dispose();throw error;}
   function current(){live();if(ownerDisposed)throw Error('Rook full presentation disposed');assertConquestRookPresentation(modelPresentation,{actor});}
   const owner=Object.freeze({modelPresentation,
    update(deltaMs){current();modelPresentation.update(deltaMs);if(!cleared)for(const e of effects)e.update(deltaMs);return owner.snapshot();},
    snapshot(){current();return {...modelPresentation.snapshot(),persistentSourceComplete:true,persistentEffectsCleared:cleared,missingPersistentParticleNodes:0,retainedS5Effects344:cleared?0:3,sourceRequestedPersistentEffects:3,renderedS5ParticleProfiles:cleared?0:18,effects:cleared?[]:effects.map(e=>e.snapshot()),presentationPolicy:policy.name,nativeComplete344ReleaseQualified:false,nativeReady:false};},
    clearPersistentEffects(){current();if(cleared)return {removedS5ModelEffects:0,removedS5ParticleSequences:0,sourceRequestedEffects:3,nativeComplete344ReleaseQualified:false};const errors=[];for(const e of effects)try{e.dispose();}catch(error){errors.push(error);}if(errors.length)throw new AggregateError(errors,'Rook persistent particle cleanup failed');const model=modelPresentation.clearPersistentEffects();cleared=true;return {...model,removedS5ParticleSequences:3,sourceRequestedEffects:3,nativeComplete344ReleaseQualified:false};},
    findSourceNode(name){current();return modelPresentation.findSourceNode(name);},
    dispose(){if(ownerDisposed)return;const errors=[];if(!cleared)for(const e of effects)try{e.dispose();}catch(error){errors.push(error);}try{modelPresentation.dispose();}catch(error){errors.push(error);}if(errors.length)throw new AggregateError(errors,'Rook full-presentation cleanup failed');ownerDisposed=true;users.delete(owner);},
   });owners.set(owner,{actor,bank,current});users.add(owner);return owner;
  },
  createTransient(options){live();if(!['pve_mon_buf_eff01','rook_death','enter_base'].includes(options?.name))throw Error('Exact Rook recipient or Death source sequence required');return particleBank.create(options);},
  snapshot(){live();return {activeRooks:users.size,particles:particleBank.snapshot(),nativeReady:false};},
  dispose(){if(disposed)return;if(users.size)throw Error('Rook full-presentation bank has active actors');particleBank.dispose();modelBank.dispose();disposed=true;},
 });banks.set(bank,{live});return bank;
}
export function assertConquestRookFullPresentation(owner,{actor,bank}={}){const r=owners.get(owner);if(!r||r.actor!==actor||bank!==undefined&&r.bank!==bank)throw Error('Typed actual full Rook presentation owner required');r.current();return owner;}
export function assertConquestRookFullPresentationBank(bank){const r=banks.get(bank);if(!r)throw Error('Typed actual full Rook presentation bank required');r.live();return bank;}
