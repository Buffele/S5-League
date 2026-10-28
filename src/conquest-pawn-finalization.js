import {ConquestSession} from './conquest-session.js';
import {assertConquestEncounterNavigation} from './conquest-encounter-navigation.js';
import {assertConquestActorCleanupTicket,conquestAdvanceDestroyedCount} from './conquest-deferred-actor-cleanup.js';
import {assertConquestPawnActorRuntime,assertConquestPawnActorReleaseReceipt} from './conquest-pawn-actor-runtime.js';
import {assertConquestStageRoundBank} from './conquest-stage-round-bank.js';

export const CONQUEST_S5_PAWN_FINALIZATION_POLICY=Object.freeze({id:'s5-released-pawn-model-finalization-v1',nativeReferenceCountQualified:false,nativeDestructorQualified:false,nativeReady:false});
const receipts=new WeakMap(),sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name),i32=n=>Number.isInteger(n)&&n>=-0x80000000&&n<=0x7fffffff;
const call=(fn,input)=>{const result=fn(input);if(result&&typeof result.then==='function')throw Error('Current external Pawn leases must be synchronous');return result;};

// Explicit application finalization, separate from source359/list unlink.
// Native reference totals remain unknown. Only this S5 policy ends its actual
// model/pool leases and feeds the already-qualified destructor-entry counter.
export function createConquestPawnFinalizationOwner({session,navigation,stageBank,stageState,readCurrentLeases,policy}={}){
 if(!(session instanceof ConquestSession)||session.phase!=='prepared'||policy!==CONQUEST_S5_PAWN_FINALIZATION_POLICY||!sync(readCurrentLeases))throw Error('Prepared real Session, explicit S5 finalization policy and current external-lease producer required');
 assertConquestEncounterNavigation(navigation,{world:session.world,bridge:session.bridge});assertConquestStageRoundBank(stageBank);
 const bridge=session.bridge,models=session.models,plans=session.plans,retired=session.retiredActors,sequence=stageState?.sequence,capturedModels=new Map(),observed=new Map();
 let disposed=false,running=false,entries=0,completed=0;
 const round=stageBank.readRound(session.config.round-1);
 function sourceSequence(){
  assertConquestStageRoundBank(stageBank);
  if(stageState.sequence!==sequence||!round||sequence?.round!==round||typeof sequence.active!=='boolean'||!i32(sequence.destroyedCount)||stageState.rawRound78!==round.rawRoundIndex)throw Error('Current authenticated source round/sequence required before finalization');
  const field=Object.getOwnPropertyDescriptor(sequence,'destroyedCount');if(!field||!Object.hasOwn(field,'value')||!field.writable)throw Error('Actual writable source destruction-count field required');return sequence;
 }
 function live(){
  if(disposed)throw Error('Disposed Pawn finalization owner');
  if(session.bridge!==bridge||session.models!==models||session.plans!==plans||session.retiredActors!==retired||session.phase!=='running'&&session.phase!=='prepared')throw Error('Current Session finalization owners required');
  assertConquestEncounterNavigation(navigation,{world:session.world,bridge});sourceSequence();
 }
 sourceSequence();
 for(const model of models){
  if(!model?.group?.isObject3D||!model.mixer||!Array.isArray(model.meshes)||typeof model.dispose!=='function'||typeof model.update!=='function')throw Error('Actual prepared source model resource owner required');
  capturedModels.set(model,{dispose:model.dispose,update:model.update});
 }
 function poolSlot(model){
  const found=[];for(const plan of plans.values())for(let i=0;i<plan.models.length;i++)if(plan.models[i]===model)found.push({plan,index:i,array:plan.models});
  if(found.length!==1||found[0].plan.consumed!==true)throw Error('Exactly one consumed prepared model slot required');return found[0];
 }
 function observeGlobalRemoval({actor,runtime,record,actorOwner}={}){
  live();if(running||session.phase!=='running'||observed.has(actor?.id))throw Error('Distinct live cleanup observation required');
  assertConquestActorCleanupTicket(record,{owner:session.actorCleanup?.owner,actor});assertConquestPawnActorRuntime(actorOwner,{actor,model:actor.model,runtime});
  if(navigation.owners.get(actor)!==actorOwner||bridge.actors.get(actor.id)!==actor||bridge.pawnRuntimes.get(actor.id)!==runtime||!models.has(actor.model)||!capturedModels.has(actor.model))throw Error('Current actual actor/model/sub-owner before global removal required');
  observed.set(actor.id,{actor,runtime,actorOwner,model:actor.model,ticket:record,slot:poolSlot(actor.model),phase:'observed',receipt:null});return record;
 }
 function structuralReadiness(record){
  const {actor,model,runtime,actorOwner,slot}=record,retirement=retired.get(actor.id);
  if(!retirement)return 'awaiting-actual-retirement';
  if(retirement.actor!==actor||retirement.model!==model||retirement.actorOwner!==actorOwner||retirement.receipt?.actorId!==actor.id||retirement.receipt.globalReferenceRemoved!==true)throw Error('Current captured Session retirement record required');
  assertConquestPawnActorReleaseReceipt(retirement.releaseReceipt,{owner:actorOwner,actor,model,runtime});
  if(bridge.actors.has(actor.id)||bridge.aiActors.has(actor.id)||bridge.pawnRuntimes.has(actor.id)||navigation.owners.has(actor)||navigation.ownerMaps.reactionsByActor.has(actor)||navigation.ownerMaps.selectionByActor.has(actor)||navigation.ownerMaps.solverOwners.has(actorOwner.movement)||model.group.parent!==null)throw Error('Actual scene/runtime/navigation leases must be released before finalization');
  if(!models.has(model)||plans.size===0||slot.plan.models!==slot.array||slot.array[slot.index]!==model||poolSlot(model).plan!==slot.plan)throw Error('Captured Session model/pool leases changed before finalization');
  for(const list of [bridge.commands.active,bridge.commands.pending,bridge.commands.mirrored])if(list.some(item=>item.command?.actorId===actor.id||item.command?.actor===actor))return 'awaiting-command-lease-release';
  return null;
 }
 function readiness(record){
  const waiting=structuralReadiness(record);if(waiting)return waiting;
  const {actor,model,runtime,actorOwner}=record;
  const leases=call(readCurrentLeases,{actor,model,runtime,actorOwner,session,navigation});
  if(leases?.qualified!==true||leases.policy!==policy||!Array.isArray(leases.owners))return 'external-leases-unqualified';
  if(leases.owners.some(owner=>!owner||typeof owner!=='object'&&typeof owner!=='function'))throw Error('Actual retained external lease owner objects required');
  if(leases.owners.length)return 'awaiting-external-lease-release';return null;
 }
 function finalizeActor(actorId){
  live();if(running)throw Error('Reentrant Pawn finalization');const record=observed.get(actorId);if(!record)throw Error('Observe the genuine cleanup ticket before releasing actor owners');
  if(record.phase==='completed')throw Error('Pawn finalization replay refused');if(record.phase==='failed')throw Error('Failed model finalization cannot be retried as a successful destructor');
  running=true;
  try{
   const waiting=readiness(record);if(waiting)return {status:waiting,actorId,nativeReady:false};
   // Revalidate after the host's external-lease producer, before count/GPU writes.
   live();const changed=structuralReadiness(record);if(changed)return {status:changed,actorId,nativeReady:false};
   const {actor,model,slot}=record,retirement=retired.get(actorId),retained=capturedModels.get(model);
   assertConquestPawnActorReleaseReceipt(retirement.releaseReceipt,{owner:record.actorOwner,actor,model,runtime:record.runtime});
   if(retirement.actor!==actor||!models.has(model)||slot.array[slot.index]!==model||model.group.parent!==null)throw Error('Finalization owner changed during external lease read');
   retained.update.call(model,0);
   const resources=new Set(model.meshes.flatMap(mesh=>[mesh.geometry,...[].concat(mesh.material)])),released=new Set(),listeners=[];
   for(const resource of resources){if(typeof resource?.addEventListener!=='function'||typeof resource.removeEventListener!=='function')throw Error('Actual model GPU resource disposal events required');const listener=()=>released.add(resource);resource.addEventListener('dispose',listener);listeners.push([resource,listener]);}
   const countBefore=sequence.destroyedCount;record.phase='entered';entries++;
   // Full original A016B0 calls A1DC00/A1D010 BEFORE its resource releases.
   try{
    sequence.destroyedCount=conquestAdvanceDestroyedCount(countBefore,round.expectedCount);
    retained.dispose.call(model);
    if(released.size!==resources.size)throw Error('Actual model resource disposal did not complete');
    let refused=false;try{retained.update.call(model,0);}catch{refused=true;}if(!refused)throw Error('Disposed model still accepts source updates');
    models.delete(model);slot.array[slot.index]=null;retired.delete(actorId);record.phase='completed';completed++;
    const receipt=Object.freeze({actorId,s5FinalizationCompleted:true,modelDisposalCompleted:true,poolSlotReleased:true,destroyedCountBefore:countBefore,destroyedCountAfter:sequence.destroyedCount,sourceCounterArithmeticQualified:true,sourceCounterEntryOrderingQualified:true,policy,nativeReferenceCountQualified:false,nativeDestructorQualified:false,applicationFrameOrderQualified:false,nativeReady:false});
    record.receipt=receipt;receipts.set(receipt,{owner:api,record});return {status:'s5-pawn-finalized',actorId,receipt,nativeReady:false};
   }catch(error){record.phase='failed';throw error;}finally{for(const [resource,listener]of listeners)resource.removeEventListener('dispose',listener);}
  }finally{running=false;}
 }
 const api=Object.freeze({observeGlobalRemoval,finalizeActor,
  finalizeRetired(){live();return [...observed].filter(([,record])=>record.phase==='observed'&&retired.has(record.actor.id)).map(([id])=>finalizeActor(id));},
  snapshot(){live();return {observed:observed.size,entered:entries,completed,pending:[...observed.values()].filter(r=>r.phase==='observed').length,failed:[...observed.values()].filter(r=>r.phase==='failed').length,unobservedRetired:[...retired.keys()].filter(id=>!observed.has(id)).length,policy,nativeReferenceCountQualified:false,nativeDestructorQualified:false,nativeReady:false};},
  dispose(){if(running)throw Error('Cannot abort during Pawn finalization');if(disposed)return;disposed=true;observed.clear();capturedModels.clear();}
 });return api;
}
export function assertConquestPawnFinalizationReceipt(receipt,{owner,actor}={}){
 const retained=receipts.get(receipt);if(!retained||retained.owner!==owner||retained.record.phase!=='completed'||retained.record.receipt!==receipt||actor!==undefined&&retained.record.actor!==actor)throw Error('Actual completed S5 Pawn finalization receipt required');return receipt;
}
