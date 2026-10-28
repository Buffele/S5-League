import {assertConquestBishopPresentationBank,assertConquestBishopPresentation} from './conquest-bishop-presentation.js';
import {assertConquestBishopParticleEffect} from './conquest-bishop-particle-effects.js';
import {ConquestMonsterAttackState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
const services=new WeakMap(),handles=new WeakMap(),uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// Retained S5 leases, not a claim about the native manager/reference count.
// Attack leases end at real state exit; Death may outlive actor runtime.
export function createConquestBishopEffectsService({bank,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}={}){
 assertConquestBishopPresentationBank(bank);if(world?.nativeMapId!==46||!scene?.isScene||!camera?.isCamera||typeof nextRandom15!=='function')throw Error('Actual Bishop effects scene/camera/map/random owners required');let disposed=false,serial=0;const active=new Map();
 const live=()=>{if(disposed)throw Error('Bishop effects service disposed');assertConquestBishopPresentationBank(bank);};
 function create({actor,state,name}){live();const effect=bank.createTransient({name,actor,state,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}),id=++serial;let released=false;
  const handle=Object.freeze({id,actor,kind:name==='bishop_death'?'bishop-death-effect':'bishop-state-effect',snapshot(){live();if(released)throw Error('Released Bishop effect handle');assertConquestBishopParticleEffect(effect,{actor,world,scene});return effect.snapshot();},dispose(){if(released)return;effect.dispose();released=true;active.delete(handle);}});handles.set(handle,{service,actor,effect,released:()=>released});active.set(handle,{actor,state,name,effect});return handle;
 }
 function presentation(actor,owner){assertConquestBishopPresentation(owner,{actor,bank});}
 const service=Object.freeze({
  createAttack({actor,state,persistentPresentation,elapsedMs}={}){live();presentation(actor,persistentPresentation);if(!(state instanceof ConquestMonsterAttackState)||state.actor!==actor||state.stateId!==5||!uint(elapsedMs)||!elapsedMs)throw Error('Actual Bishop state effect source clock required');if([...active.values()].some(r=>r.actor===actor&&r.state===state&&r.name==='pve_mon_bishop_attack'))throw Error('Bishop state already retains its real AddSequence effect');return create({actor,state,name:'pve_mon_bishop_attack'});},
  releaseStateEffects({actor,state,persistentPresentation}={}){live();presentation(actor,persistentPresentation);let released=0;for(const[h,r]of [...active])if(r.actor===actor&&r.state===state&&r.name==='pve_mon_bishop_attack'){h.dispose();released++;}return {accepted:true,released,source:'A2D560→A2E400→AFE3D0+reset48',nativeReferenceCountQualified:false,nativeReady:false};},
  releaseActorStateEffects({actor,persistentPresentation}={}){live();presentation(actor,persistentPresentation);let released=0;for(const[h,r]of [...active])if(r.actor===actor&&r.name==='pve_mon_bishop_attack'){h.dispose();released++;}return {accepted:true,released,nativeReady:false};},
  createDeath({actor,state,persistentPresentation}={}){live();presentation(actor,persistentPresentation);if(!(state instanceof ConquestMonsterDeathState)||state.actor!==actor||actor.eligibleVirtual44!==false||actor.nativeField33C===2||persistentPresentation.snapshot().retainedS5Effects344!==0)throw Error('Actual ordinary Bishop Death after persistent clear required');return create({actor,state,name:'bishop_death'});},
  tick(deltaMs){live();if(!uint(deltaMs))throw Error('Unsigned Bishop effects service delta required');for(const[h,r]of [...active])if(r.effect.update(deltaMs).finished)h.dispose();return service.snapshot();},
  readActorLeases(actor){live();return Object.freeze([...active].filter(([,r])=>r.actor===actor).map(([h])=>h));},
  snapshot(){live();return {activeEffects:active.size,stateEffects:[...active.values()].filter(r=>r.name==='pve_mon_bishop_attack').length,deathEffects:[...active.values()].filter(r=>r.name==='bishop_death').length,nativeReferenceCountQualified:false,nativeReady:false};},
  dispose(){if(disposed)return;const errors=[];for(const h of [...active.keys()])try{h.dispose();}catch(e){errors.push(e);}if(errors.length)throw new AggregateError(errors,'Bishop effects service cleanup failed');disposed=true;},
 });services.set(service,{bank,world,scene,live});return service;
}
export function assertConquestBishopEffectsService(service,{bank,world,scene}={}){const r=services.get(service);if(!r||bank!==undefined&&r.bank!==bank||world!==undefined&&r.world!==world||scene!==undefined&&r.scene!==scene)throw Error('Typed actual Bishop effects service required');r.live();return service;}
export function assertConquestBishopEffectHandle(handle,{service,actor}={}){const r=handles.get(handle);if(!r||r.service!==service||r.actor!==actor||r.released())throw Error('Typed retained Bishop effect handle required');assertConquestBishopEffectsService(service);return handle;}
