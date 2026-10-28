import {assertConquestRookExplodeFullPresentationBank,assertConquestRookExplodeFullPresentation} from './conquest-rook-explode-full-presentation.js';
import {assertConquestRookExplodeParticleEffect} from './conquest-rook-explode-particle-effects.js';
const services=new WeakMap(),handles=new WeakMap();
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// Application owner of actual effects, independent from the actor's shorter
// Death359 lifetime. It publishes real leases, never native refcount claims.
export function createConquestRookExplodeEffectsService({bank,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}={}){
 assertConquestRookExplodeFullPresentationBank(bank);if(world?.nativeMapId!==46||!scene?.isScene||!camera?.isCamera||typeof nextRandom15!=='function')throw Error('Actual Rook FX map/scene/camera/random owners required');let disposed=false,serial=0;const active=new Map();
 const live=()=>{if(disposed)throw Error('Rook effects service disposed');assertConquestRookExplodeFullPresentationBank(bank);};
 function create(options){live();const actor=options.actor;
  const effect=bank.createTransient({...options,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}),id=++serial;let released=false;
  const handle=Object.freeze({kind:'rook-explode-death-effect',actor,id,
   snapshot(){if(released)throw Error('Rook effect handle released');live();assertConquestRookExplodeParticleEffect(effect,{actor,world,scene});return effect.snapshot();},
   dispose(){if(released)return;effect.dispose();released=true;active.delete(handle);},
  });handles.set(handle,{service,actor,effect,readReleased:()=>released});active.set(handle,{actor,effect,name:options.name});return handle;
 }
 const service=Object.freeze({
  createDeath({actor,state,persistentPresentation}={}){live();assertConquestRookExplodeFullPresentation(persistentPresentation,{actor,bank});if(persistentPresentation.snapshot().retainedS5Effects344!==0)throw Error('Real persistent Rook effects must be cleared before Death');return create({name:actor.nativeField33C===2?'enter_base':'rook_death',actor,state});},
  tick(deltaMs){live();if(!uint(deltaMs))throw Error('Unsigned Rook effect-service delta required');for(const [handle,entry]of [...active]){const result=entry.effect.update(deltaMs);if(result.finished)handle.dispose();}return service.snapshot();},
  readActorLeases(actor){live();return Object.freeze([...active].filter(([,entry])=>entry.actor===actor).map(([handle])=>handle));},
  snapshot(){live();return {activeEffects:active.size,deathEffects:active.size,nativeReferenceCountQualified:false,nativeReady:false};},
  dispose(){if(disposed)return;const errors=[];for(const handle of [...active.keys()])try{handle.dispose();}catch(error){errors.push(error);}if(errors.length)throw new AggregateError(errors,'Rook effect-service cleanup failed');disposed=true;},
 });services.set(service,{bank,world,scene,live});return service;
}
export function assertConquestRookExplodeEffectsService(service,{bank,world,scene}={}){const r=services.get(service);if(!r||bank!==undefined&&r.bank!==bank||world!==undefined&&r.world!==world||scene!==undefined&&r.scene!==scene)throw Error('Typed actual Rook effects service required');r.live();return service;}
export function assertConquestRookExplodeEffectHandle(handle,{service,actor}={}){const r=handles.get(handle);if(!r||r.service!==service||r.actor!==actor||r.readReleased())throw Error('Typed retained Rook effect handle required');assertConquestRookExplodeEffectsService(service);return handle;}
