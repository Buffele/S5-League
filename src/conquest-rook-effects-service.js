import {assertConquestRookFullPresentationBank,assertConquestRookFullPresentation} from './conquest-rook-full-presentation.js';
import {assertConquestRookParticleEffect} from './conquest-rook-particle-effects.js';
const services=new WeakMap(),handles=new WeakMap(),attachmentReceipts=new WeakMap();
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// Application owner of actual effects, independent from the actor's shorter
// Death359 lifetime. It publishes real leases, never native refcount claims.
export function createConquestRookEffectsService({bank,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}={}){
 assertConquestRookFullPresentationBank(bank);if(world?.nativeMapId!==46||!scene?.isScene||!camera?.isCamera||typeof nextRandom15!=='function')throw Error('Actual Rook FX map/scene/camera/random owners required');let disposed=false,serial=0;const active=new Map();
 const live=()=>{if(disposed)throw Error('Rook effects service disposed');assertConquestRookFullPresentationBank(bank);};
 function create(options){live();const actor=options.actor,recipient=options.name==='pve_mon_buf_eff01',model=actor.model,before=new Set();if(recipient)model.group.traverse(node=>before.add(node));
  const effect=bank.createTransient({...options,world,scene,camera,nextRandom15,numericalProfile,trigProfile,qualityProfile}),id=++serial,attachments=[];let released=false;
  // Only nodes actually created by this authenticated recipient effect may
  // extend another actor's source344-empty model. Source344 stays untouched.
  if(recipient)model.group.traverse(node=>{if(!before.has(node))attachments.push(Object.freeze({node,parent:node.parent,children:Object.freeze([...node.children])}));});
  const handle=Object.freeze({kind:options.name==='pve_mon_buf_eff01'?'rook-recipient-effect':'rook-death-effect',actor,id,
   snapshot(){if(released)throw Error('Rook effect handle released');live();assertConquestRookParticleEffect(effect,{actor,world,scene});return effect.snapshot();},
   dispose(){if(released)return;effect.dispose();released=true;active.delete(handle);},
  });handles.set(handle,{service,actor,effect,model,attachments,readReleased:()=>released});active.set(handle,{actor,effect,name:options.name,model,attachments});return handle;
 }
 const service=Object.freeze({
  createDeath({actor,state,persistentPresentation}={}){live();assertConquestRookFullPresentation(persistentPresentation,{actor,bank});if(persistentPresentation.snapshot().retainedS5Effects344!==0)throw Error('Real persistent Rook effects must be cleared before Death');return create({name:actor.nativeField33C===2?'enter_base':'rook_death',actor,state});},
  createRecipient({actor,fieldsOwner}={}){return create({name:'pve_mon_buf_eff01',actor,recipientFields:fieldsOwner});},
  tick(deltaMs){live();if(!uint(deltaMs))throw Error('Unsigned Rook effect-service delta required');for(const [handle,entry]of [...active]){const result=entry.effect.update(deltaMs);if(result.finished)handle.dispose();}return service.snapshot();},
  readActorLeases(actor){live();return Object.freeze([...active].filter(([,entry])=>entry.actor===actor).map(([handle])=>handle));},
  readRecipientAttachments(actor){live();const model=actor?.model,entries=[...active].filter(([,e])=>e.actor===actor&&e.name==='pve_mon_buf_eff01');const receipt=Object.freeze({kind:'rook-owned-recipient-attachments',actor,model,attachments:Object.freeze(entries.flatMap(([,e])=>e.attachments)),nativeWrapper344Qualified:false,nativeReady:false});attachmentReceipts.set(receipt,{service,actor,model,entries});assertConquestRookRecipientAttachments(receipt,{service,actor,model});return receipt;},
  snapshot(){live();return {activeEffects:active.size,deathEffects:[...active.values()].filter(e=>e.name!=='pve_mon_buf_eff01').length,recipientEffects:[...active.values()].filter(e=>e.name==='pve_mon_buf_eff01').length,recipientActorIds:[...active.values()].filter(e=>e.name==='pve_mon_buf_eff01').map(e=>e.actor.id),nativeReferenceCountQualified:false,nativeReady:false};},
  dispose(){if(disposed)return;const errors=[];for(const handle of [...active.keys()])try{handle.dispose();}catch(error){errors.push(error);}if(errors.length)throw new AggregateError(errors,'Rook effect-service cleanup failed');disposed=true;},
 });services.set(service,{bank,world,scene,live});return service;
}
export function assertConquestRookEffectsService(service,{bank,world,scene}={}){const r=services.get(service);if(!r||bank!==undefined&&r.bank!==bank||world!==undefined&&r.world!==world||scene!==undefined&&r.scene!==scene)throw Error('Typed actual Rook effects service required');r.live();return service;}
export function assertConquestRookEffectHandle(handle,{service,actor}={}){const r=handles.get(handle);if(!r||r.service!==service||r.actor!==actor||r.readReleased())throw Error('Typed retained Rook effect handle required');assertConquestRookEffectsService(service);return handle;}
export function assertConquestRookRecipientAttachments(receipt,{service,actor,model}={}){
 const r=attachmentReceipts.get(receipt);if(!r||r.service!==service||r.actor!==actor||r.model!==model||actor.model!==model)throw Error('Typed current Rook recipient attachment receipt required');assertConquestRookEffectsService(service);
 const current=service.readActorLeases(actor).filter(handle=>handle.kind==='rook-recipient-effect');if(current.length!==r.entries.length||current.some((handle,i)=>handle!==r.entries[i][0]))throw Error('Rook recipient attachments changed since receipt');
 for(const [handle,entry]of r.entries){assertConquestRookEffectHandle(handle,{service,actor});const owner=services.get(service);assertConquestRookParticleEffect(entry.effect,{actor,world:owner.world,scene:owner.scene});entry.effect.snapshot();if(entry.model!==model||entry.attachments.some(({node,parent,children})=>node.parent!==parent||node.children.length!==children.length||node.children.some((child,i)=>child!==children[i])))throw Error('Owned Rook recipient attachment graph changed');}
 return receipt;
}
// Exact original graph is retained after excluding only privately certified
// condition-owned recipient nodes. This never certifies/deletes source344 FX.
export function conquestRookRecipientModelGraphMatches({service,actor,model,modelGraph}={}){
 assertConquestRookEffectsService(service);if(!(modelGraph instanceof Map))throw Error('Retained actual model graph required');const receipt=service.readRecipientAttachments(actor);assertConquestRookRecipientAttachments(receipt,{service,actor,model});const allowed=new Set(receipt.attachments.map(a=>a.node));
 for(const [node,children]of modelGraph){const actual=node.children.filter(child=>!allowed.has(child));if(actual.length!==children.length||actual.some((child,i)=>child!==children[i]))return false;}
 let matched=true;model.group.traverse(node=>{if(!modelGraph.has(node)&&!allowed.has(node))matched=false;});return matched;
}
