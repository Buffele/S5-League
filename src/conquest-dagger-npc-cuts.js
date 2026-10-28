import {meleeActivations} from './melee-activations.js';
import {conquestInactiveMainShieldCollection,readConquestConfiguredPlayerActorFlags} from './conquest-player-configured-actor-flags.js';
import {assertConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';
import {assertConquestKingDamageNotification} from './conquest-king-damage-notification.js';
import {ConquestPlayerMonsterCombat,assertConquestMonsterHealth,createConquestPlayerMonsterDamageRecord} from './conquest-player-monster-combat.js';
import {assertConquestPlayerDamageSource,assertConquestPawnDamageState,conquestPawnDamageRecordFlags} from './conquest-player-monster-damage-record.js';
import {conquestNativePartDamageMultipliers} from './conquest-player-defense.js';
import {ConquestDaggerCutCriticalPreparation} from './conquest-dagger-critical-preparation.js';
import {ConquestDaggerCutEquipmentPower,CONQUEST_DAGGER_PLAIN_ITEM_POLICY} from './conquest-dagger-equipment-power.js';
import {conquestDaggerDamageComponents,conquestDaggerMonsterDefenseRate} from './conquest-dagger-damage-kernel.js';
import {createConquestDaggerFanContacts,CONQUEST_DAGGER_FAN_CONTACT_POLICY} from './conquest-dagger-fan-contacts.js';

const f=Math.fround,sync=fn=>typeof fn==='function'&&fn.constructor.name==='Function';
const finite=(value,label)=>{if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Finite Dagger '+label+' required');return f(value);};
const playerPeer=value=>{if(!Array.isArray(value)||value.length!==2||value.some(n=>!Number.isInteger(n)||n<0||n>0xffffffff)||(value[1]>>>16&7)!==1)throw Error('Actual attacking player-kind1 peer required');return [...value];};
export const CONQUEST_DAGGER_NPC_CUT_POLICY=Object.freeze({id:'s5-conquest-dagger24-primary-plain-free2-unlimited-nil-fan',itemKey:2000006,weaponType:24,attackAttribute:61,activationIndex:0,activationTimeMs:260,
 timing:'S5 Controller >=260ms captured authored melee activation; native strictly greater timer not certified',recordKind34:0,scalar:1,contactPart:0,rush:'refused-unqualified-class',shield:'current-empty-main-collection-only; nonempty-or-unqualified-melee-shield-query-refused',nativeDeliveryQualified:false,nativeReady:false});

// The adapter captures item/critical ownership on the actual creation step,
// then captures the authored contact event on its later Controller substep.
// No second animation clock, polling hit test or arena damage value is used.
export function createConquestDaggerNpcCuts(config={}){
 config=Object.freeze({...config});
 const {playerId,playerActors,controller,sourceState,equipmentPowerOwner,criticalPreparation,monsterActors,runtimes}=config;
 if(config.policy!==CONQUEST_DAGGER_NPC_CUT_POLICY||!(equipmentPowerOwner instanceof ConquestDaggerCutEquipmentPower)||!(criticalPreparation instanceof ConquestDaggerCutCriticalPreparation)||!(monsterActors instanceof Map)||!(runtimes instanceof Map)||!sync(config.readPlayerPeerId))throw Error('Actual Dagger owners/maps/peer producer and immutable primary policy required');
 const combat=new ConquestPlayerMonsterCombat(config),geometry=createConquestDaggerFanContacts({...config,policy:CONQUEST_DAGGER_FAN_CONTACT_POLICY}),bindings=new Map(),captures=new WeakMap();
 let disposed=false,busy=false,pending=null,last=Object.freeze([]),captureCount=0,activationCount=0,deliveryCount=0,discardedCount=0;
 const live=()=>{if(disposed)throw Error('Disposed Dagger NPC cut owner');assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});};
 const idle=()=>{live();if(busy)throw Error('Nonreentrant Dagger cut lifecycle required');};
 const validCut=cut=>controller.weapon==='dagger'&&controller.attack===cut&&['light','air'].includes(cut?.type)&&(cut.phase===undefined||cut.phase==='action');
 const discard=()=>{if(pending){pending=null;discardedCount++;}};
 const shieldCollectionEmpty=job=>{
  if(controller.sourceShieldQuery!==job.shieldQuery)return false;
  if(!conquestInactiveMainShieldCollection(controller,job.shieldQuery))return false;
  if(controller.s5runtimeShieldActorProfile)readConquestConfiguredPlayerActorFlags(controller);return true;
 };
 const currentJob=job=>{
  if(!validCut(job.cut)||playerActors.get(playerId)?.combatState?.serial!==job.combatSerial)return false;
  // Equipment/critical receipts already retain the exact loadout, life,
  // condition owner and world. A normal cancellation drops this one job;
  // it must not propagate a stale-cut error into the whole AI simulation.
  try{equipmentPowerOwner.assertReceipt(job.equipment,{controller,defenseState:sourceState.defenseState});return true;}catch{return false;}
 };
 const bindingLive=actor=>{
  const b=bindings.get(actor);if(!b||monsterActors.get(actor.id)!==actor||actor.model!==b.model||runtimes.get(actor.id)!==b.runtime)throw Error('Current bound Dagger NPC identity/runtime required');
  if(b.factoryOwner){assertConquestPawnActorRuntime(b.factoryOwner,{actor,model:b.model,runtime:b.runtime});if(b.factoryOwner.disposed)throw Error('Released Dagger target factory');}
  b.runtime.assertActor(actor);assertConquestHandgunPawnVariant({actor,runtime:b.runtime});assertConquestPawnDamageState({pawnState:b.pawnState,actor,monsterActors});assertConquestMonsterHealth(b.health,{...config,actor});
  if(actor.spawnStats.monsterKey===1500)assertConquestKingDamageNotification(b.damageNotification,{actor,health:b.health,runtime:b.runtime,runtimes});return b;
 };
 const bind=({actor,pawnState,runtime,health,damageNotification,factoryOwner=null}={})=>{
  idle();if(bindings.has(actor)||monsterActors.get(actor?.id)!==actor||runtimes.get(actor.id)!==runtime)throw Error('Distinct current actual Dagger target binding required');
  runtime.assertActor(actor);assertConquestHandgunPawnVariant({actor,runtime});assertConquestPawnDamageState({pawnState,actor,monsterActors});assertConquestMonsterHealth(health,{...config,actor});
  if(actor.spawnStats.monsterKey===1500)assertConquestKingDamageNotification(damageNotification,{actor,health,runtime,runtimes});else if(damageNotification!==undefined)throw Error('King-only numeric notification owner required');
  geometry.bindMonster({actor,pawnState,runtime,health,damageNotification});
  try{combat.bindMonster(actor,{receiver:health,ownership:'borrowed'});}catch(error){geometry.unbindActor(actor);throw error;}
  bindings.set(actor,{actor,model:actor.model,pawnState,runtime,health,damageNotification,factoryOwner});return actor;
 };
 const componentsFor=(job,b,sourcePeerId,hitPart)=>{
  const state=sourceState.defenseState;equipmentPowerOwner.assertReceipt(job.equipment,{controller,defenseState:state});assertConquestPawnDamageState({pawnState:b.pawnState,actor:b.actor,monsterActors});
  if(!Array.isArray(state.conditions)||state.conditions.length!==0||typeof state.statusManagerPresent!=='boolean')throw Error('Genuine empty Dagger source conditions/status required');
  let flat=0,rate=0;
  if(state.statusManagerPresent){const a=state.equipment?.flat,c=state.equipment?.rate;if(a?.length!==33||c?.length!==33)throw Error('Actual retained33-field Dagger equipment arrays required');
   // Type24 one-hot CPU proof selects common4 + melee5, for both parts.
   for(const index of [4,5]){flat=f(flat+finite(a[index],'equipment flat'+index));rate=f(rate+finite(c[index],'equipment rate'+index));}rate=f(rate+finite(sourceState.actorRate3d8,'actor3D8'));
  }
  const targetDefenseRate=conquestDaggerMonsterDefenseRate(b.pawnState);if(!(b.pawnState.properties instanceof Map))throw Error('Actual retained target properties required');
  const targetReduction=b.pawnState.properties.has(0x15f4590)?finite(b.pawnState.properties.get(0x15f4590),'target reduction'):0;
  const components=conquestDaggerDamageComponents({sourcePeerId,weaponType:24,workingPower:job.equipment.declaredWorkingPower,sourceBonusFlat:flat,sourceBonusRate:rate,targetDefenseRate,targetReduction,...conquestNativePartDamageMultipliers(hitPart)});
  return Object.freeze({components,equipmentIndices:Object.freeze([4,5]),sourceBonusFlat:flat,sourceBonusRate:rate,targetDefenseRate,targetReduction,componentKernelQualified:true,finalRecordQualified:false,nativeReady:false});
 };
 const consume=(job,query,contact)=>{
  const actor=contact.target,b=bindingLive(actor);geometry.assertContact(contact,{receipt:query,actor});
  if(job.targets.has(actor))return Object.freeze({contact,delivered:false,status:'dagger-target-already-consumed',nativeReady:false});job.targets.add(actor);
  if(b.pawnState.properties.get(0x15f458c)===true)return Object.freeze({contact,delivered:false,status:'dagger-target-special-property-blocked',nativeReady:false});
  if(typeof b.pawnState.properties.get(0x15f458c)!=='boolean'||contact.hitPart!==0)throw Error('Actual supported Dagger property/part0 contact required');
  const sourcePeerId=playerPeer(config.readPlayerPeerId({playerId,record:playerActors.get(playerId),controller}));live();bindingLive(actor);geometry.assertContact(contact,{receipt:query,actor});
  if(!currentJob(job))return Object.freeze({contact,delivered:false,status:'dagger-cut-invalidated-during-delivery',nativeReady:false});
  const componentReceipt=componentsFor(job,b,sourcePeerId,contact.hitPart),flags=conquestPawnDamageRecordFlags({pawnState:b.pawnState,runtime:b.runtime});
  // Null134 part0 has equal normal/critical coefficients1. No unqualified
  // facing/back-hit decision, extra critical or arena contact.damage cast.
  const record=createConquestPlayerMonsterDamageRecord({attributeId:61,sourcePeerId10:sourcePeerId,creditOwnerPeerId78:sourcePeerId,damage50:componentReceipt.components.component0,...flags}),king=actor.spawnStats.monsterKey===1500;
  const delivery=combat.consumeWeaponContact(contact,{produceRecord:()=>{geometry.assertContact(contact,{receipt:query,actor});if(!currentJob(job)||!shieldCollectionEmpty(job)||!currentJob(job))return null;return record;},...(king?{damageNotification:b.damageNotification,runtime:b.runtime,runtimes}:{})});
  if(delivery.delivered)deliveryCount++;
  return Object.freeze({attack:job.cut,index:0,contact,equipmentPreparation:job.equipment,componentReceipt,record,delivery,notification:king?delivery.result?.stateNotification??null:null,
   delivered:delivery.delivered===true,status:delivery.delivered?'s5-provisional-dagger-cut-record-delivered':'dagger-cut-delivery-refused',policy:config.policy.id,nativeFinalRecordQualified:false,nativeLiveCompared:false,nativeReady:false});
 };
 const api=Object.freeze({
  bindMonster:bind,
  bindActor(owner){idle();assertConquestPawnActorRuntime(owner,{actor:owner.actor,model:owner.model,runtime:owner.runtime});if(owner.disposed)throw Error('Live Dagger target factory required');return bind({actor:owner.actor,pawnState:owner.damageState,runtime:owner.runtime,health:owner.health,damageNotification:owner.actor.spawnStats.monsterKey===1500?owner.damageNotification:undefined,factoryOwner:owner});},
  unbindActor(value){idle();const actor=value?.actor??value;if(!bindings.has(actor))return false;bindingLive(actor);geometry.unbindActor(actor);combat.unbindMonster(actor);bindings.delete(actor);return true;},
  captureStep(){idle();if(pending&&!currentJob(pending))discard();const cut=controller.attack;let captured=0,activated=0;
   if(validCut(cut)&&controller.events.includes('attack')&&!captures.has(cut)){
    const equipment=equipmentPowerOwner.prepare({criticalPreparation,cut}),job={cut,equipment,combatSerial:playerActors.get(playerId).combatState.serial,ready:false,consumed:false,targets:new Set()};captures.set(cut,job);pending=job;captureCount++;captured++;
   }
   for(const activation of meleeActivations(controller.events,cut)){const job=captures.get(activation.attack);if(job&&job===pending&&activation.index===0&&activation.atMs===260&&!job.ready&&!job.consumed&&currentJob(job)){job.ready=true;activationCount++;activated++;}}
   return Object.freeze({captured,activated,pendingJobs:pending?1:0,discardedJobs:discardedCount,nativeReady:false});
  },
  resolveCuts(avatar){idle();if(!pending){last=Object.freeze([]);return last;}const job=pending;
   if(!currentJob(job)){discard();last=Object.freeze([]);return last;}if(!job.ready){last=Object.freeze([]);return last;}
   // Remove before any query/consumer callback. A miss, unsupported Shield or
   // rejected record is consumed once, never retried at subsequent renders.
   pending=null;job.consumed=true;busy=true;
   try{
    if(avatar?.weapon!=='dagger'||!avatar.group?.isObject3D||playerActors.get(playerId)?.model!==avatar)throw Error('Actual current player Dagger post-mixer avatar required');
    job.shieldQuery=controller.sourceShieldQuery;
    const refuseShield=()=>Object.freeze([Object.freeze({attack:job.cut,index:0,status:'dagger-shield-query-unqualified',delivered:false,nativeReady:false})]);
    if(!shieldCollectionEmpty(job)){last=refuseShield();return last;}
    if(!currentJob(job)){last=Object.freeze([]);return last;}
    const query=geometry.query({attack:job.cut,index:0,equipmentReceipt:job.equipment,avatar}),results=[];
    for(const contact of query.contacts){if(!currentJob(job))break;if(!shieldCollectionEmpty(job)){results.push(...refuseShield());break;}if(!currentJob(job))break;results.push(consume(job,query,contact));}
    if(!results.length)results.push(Object.freeze({attack:job.cut,index:0,query,delivered:false,status:query.status==='dagger-fan-contacts-classified'?'dagger-no-npc-contact':query.status,nativeReady:false}));
    last=Object.freeze(results);return last;
   }finally{busy=false;}
  },
  snapshot(){live();return {policy:config.policy.id,actorCount:bindings.size,capturedJobs:captureCount,activatedJobs:activationCount,pendingJobs:pending?1:0,discardedJobs:discardedCount,deliveredRecords:deliveryCount,last:last.map(r=>({status:r.status,delivered:r.delivered,damage50:r.record?.damage50??null})),nativeReady:false};},
  dispose(){if(disposed)return;if(busy)throw Error('Cannot release delivering Dagger cuts');pending=null;geometry.dispose();combat.dispose();bindings.clear();last=Object.freeze([]);disposed=true;},
 });live();return api;
}
