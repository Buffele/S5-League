import {ConquestPlayerMonsterCombat,createConquestPlayerMonsterDamageRecord} from './conquest-player-monster-combat.js';
import {assertConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';
import {ConquestHandgunShotAdapter} from './conquest-handgun-shot-adapter.js';
import {CONQUEST_HANDGUN_PLAIN_ITEM_POLICY} from './conquest-handgun-equipment-power.js';
import {conquestHandgunCandidateRecordStorage} from './conquest-handgun-final-stages.js';
import {assertConquestPawnDamageState,conquestPawnDamageRecordFlags,conquestHandgunPawnDamageComponents} from './conquest-player-monster-damage-record.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';
import {assertConquestKingDamageNotification} from './conquest-king-damage-notification.js';

export const CONQUEST_ENCOUNTER_HANDGUN_POLICY='s5-conquest-handgun-playable-no-wear-dropoff1';
const peer=value=>{if(!Array.isArray(value)||value.length!==2||value.some(n=>!Number.isInteger(n)||n<0||n>0xffffffff)||(value[1]>>>16&7)!==1)throw Error('Actual attacking player-kind1 peer required');return [...value];};

// A13C90 dispatches current-state.virtual44, which is the original empty
//7563F0 for the owned Normal1003/Explode1013/Rook1100/Knight1203 classes,
//including DeathBomb13F16A8 and both Knight attack inputs13F1430.
//Damage2/Death4 are NOT inferred
// from this callback. The AI host still owns the actual HP/death-command path.
function notifyState(owner,inputAmount){
 const runtime=owner.runtime,current=runtime.manager.current;
 const variant=assertConquestHandgunPawnVariant({actor:owner.actor,runtime});
 if(current===null)return {sourceCallbackQualified:true,operation:0xa13c90,currentStatePresent:false,transitionQueued:false};
 const actual=new Map([[runtime.normal,0],[runtime.run,1],[runtime.damage,2],[runtime.blow,3],[runtime.death,4],...(runtime.attack?[[runtime.attack,5]]:[]),...(runtime.attacks?.map(state=>[state,state.stateId])??[])]),stateId=actual.get(current);
 if(stateId===undefined)return {sourceCallbackQualified:false,transitionQueued:false,reason:'unowned-current-state'};
 return {sourceCallbackQualified:true,operation:0xa13c90,stateId,vtable:variant.stateTables[stateId],virtual44:0x7563f0,
  inputAmount,sourceNoop:true,transitionQueued:false,conquestManagerBookkeepingQualified:false};
}

// Playable S5 composition. Native final50/dropoff/current attack gates remain
// explicitly unqualified; this policy never changes the strict source adapter.
export function createConquestEncounterCombat(config={}){
 if(config.policy!==CONQUEST_ENCOUNTER_HANDGUN_POLICY)throw Error('Explicit provisional S5 Conquest Handgun policy required');
 const combat=new ConquestPlayerMonsterCombat(config),adapter=new ConquestHandgunShotAdapter({...config,combat:undefined}),bindings=new Map(),consumed=new WeakSet();
 let disposed=false,last=[];
 function live(){if(disposed)throw Error('Disposed Conquest encounter combat');}
 function actorOf(value){return value?.actor??value;}
 function bindingFor(actor){
  const binding=bindings.get(actor);if(!binding)throw Error('Actual bound encounter actor required');
  assertConquestPawnActorRuntime(binding.owner,{actor,model:binding.model,runtime:binding.runtime});
  if(binding.owner.disposed)throw Error('Released encounter actor owner');binding.runtime.assertActor(actor);return binding;
 }
 const api={
  bindActor(owner){
   live();assertConquestPawnActorRuntime(owner,{actor:owner.actor,model:owner.model,runtime:owner.runtime});
   const actor=owner.actor;if(owner.disposed||bindings.has(actor))throw Error('Distinct live encounter actor owner required');
   if(actor.spawnStats.monsterKey===1500)assertConquestKingDamageNotification(owner.damageNotification,{actor,health:owner.health,runtime:owner.runtime,runtimes:config.runtimes});
   const pawnState=assertConquestPawnDamageState({pawnState:owner.damageState,actor,monsterActors:config.monsterActors});
   combat.bindMonster(actor,{receiver:owner.health,ownership:'borrowed'});
   try{adapter.bindPawn({actor,pawnState,runtime:owner.runtime});}catch(error){combat.unbindMonster(actor);throw error;}
   bindings.set(actor,{owner,model:owner.model,runtime:owner.runtime,pawnState});return actor;
  },
  unbindActor(value){
   live();const actor=actorOf(value),binding=bindings.get(actor);if(!binding)return false;
   bindingFor(actor);combat.unbindMonster(actor);adapter.releasePawn(actor);bindings.delete(actor);return true;
  },
  consumeResolvedShot(result){
   live();if(!adapter.lastResults.includes(result))throw Error('Actual current encounter shot-adapter result required');
   if(consumed.has(result.shot))throw Error('Encounter shot already consumed');
   if(!result.contact.hit){consumed.add(result.shot);return Object.freeze({shot:result.shot,contact:result.contact,status:'no-pawn-contact',delivered:false,nativeReady:false});}
   if(!result.equipmentPreparation||!result.finalStagesPreparation){consumed.add(result.shot);return Object.freeze({shot:result.shot,contact:result.contact,status:'historical-shot-equipment-snapshot-unavailable',delivered:false,nativeReady:false});}
   const actor=result.contact.target,binding=bindingFor(actor),stage=adapter.assertFinalStagesReceipt(result.finalStagesPreparation);
   const equipment=config.equipmentPowerOwner.assertReceipt(result.equipmentPreparation,{controller:config.controller,defenseState:config.sourceState.defenseState});
   if(equipment.itemPolicy!==CONQUEST_HANDGUN_PLAIN_ITEM_POLICY||equipment.propertyPower!==8.25||equipment.s5TempoDamage34!==2||equipment.arguments.additionalPower!==0||equipment.critical.probabilityFactor!==1)throw Error('Current supported plain Handgun8.25/tempo2/no-wear policy required');
   if(stage.pawnInvincibility128){consumed.add(result.shot);return {status:'pawn-special-property-blocked',delivered:false,nativeReady:false};}
   const sourcePeerId=peer(config.readPlayerPeerId({playerId:config.playerId,record:config.playerActors.get(config.playerId),controller:config.controller}));
   const flags=conquestPawnDamageRecordFlags({pawnState:binding.pawnState,runtime:binding.runtime});
   const components=conquestHandgunPawnDamageComponents({sourceState:config.sourceState,pawnState:binding.pawnState,sourcePeerId,workingPower:equipment.declaredWorkingPower,hitPart:result.contact.practiceContact.pawnContact.part});
   const storage=conquestHandgunCandidateRecordStorage({components,scalar:1,recordKind34:0});
   const record=createConquestPlayerMonsterDamageRecord({attributeId:55,sourcePeerId10:sourcePeerId,creditOwnerPeerId78:sourcePeerId,damage50:storage.candidate50,...flags});
   // Reserve once before entering attribute/identity callbacks; never replay a
   // possibly partially delivered record when an external producer throws.
   consumed.add(result.shot);
   const king=actor.spawnStats.monsterKey===1500;
   const delivery=combat.consumeWeaponContact(result.contact,{produceRecord:()=>record,...(king?{damageNotification:binding.owner.damageNotification,runtime:binding.runtime,runtimes:config.runtimes}:{})});
   const notification=delivery.delivered?(king?delivery.result.stateNotification??null:notifyState(binding.owner,delivery.result.stateNotificationInput)):null;
   return Object.freeze({shot:result.shot,contact:result.contact,record,delivery,notification,delivered:delivery.delivered,
    status:'s5-provisional-handgun-record-delivered',policy:config.policy,workingPower:equipment.declaredWorkingPower,components,
    nativeFinalRecordQualified:false,nativeLiveCompared:false,nativeReady:false,
    provisionalStages:Object.freeze(['S5 plain item no-wear','S5 selected GameTempo2','Linear dropoff multiplier1','Record kind0 scalar1 and shooter credit','Native current-attack/delivery side effects not closed'])});
  },
  resolveRifleShots(avatar){live();last=adapter.resolveRifleShots(avatar).map(result=>api.consumeResolvedShot(result));return last;},
  snapshot(){return {disposed,actorCount:bindings.size,policy:config.policy,last:last.map(r=>({status:r.status,delivered:r.delivered,damage:r.record?.damage50??null,hp:r.delivery?.result.hpAfter??null})),nativeReady:false,nativeLiveCompared:false};},
  dispose(){if(disposed)return;combat.dispose();adapter.dispose();bindings.clear();disposed=true;last=[];},
 };
 return Object.freeze(api);
}
