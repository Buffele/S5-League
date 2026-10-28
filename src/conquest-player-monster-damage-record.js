import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {conquestNativePartDamageMultipliers} from './conquest-player-defense.js';
import {ConquestHandgunEquipmentPower} from './conquest-handgun-equipment-power.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';

const f=Math.fround,sourceOwners=new WeakMap(),pawnOwners=new WeakMap();
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Explicit finite '+name+' required');return f(v);};
const peer=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff))throw Error('Explicit native peer DWORDs required');return value;};
const bool=(v,name)=>{if(typeof v!=='boolean')throw Error('Explicit '+name+' required');return v;};
const integer=(v,name)=>{if(!Number.isInteger(v)||v<0||v>255)throw Error('Explicit native byte '+name+' required');return v;};
export const CONQUEST_HANDGUN_DAMAGE_SOURCE=Object.freeze({itemKey:2010007,weaponType:22,attackAttribute:55,catalogPower:8.25,
 attackLua:'script/weapon_revolver2.lua',attackLuaSha256:'eb7ecb7a3b1233d96bbb199b7898622b52492e60747e643088fcfec778112f96',componentCalculator:0xb8b2a0,playerBonuses:0xb8ba20,
 playerEquipmentBonuses:0xb8c660,monsterDefense:0xb8d640,nativeReady:false});

// Call once when the actual S5 player/native constructor-state is created.
// Equipment and conditions are the SAME retained33-field/81-vector owner used
// by the already qualified defense profile. Item application may update those
// arrays; this factory never clears them or silently recreates them per shot.
export function createInitialConquestPlayerDamageSource({playerId,playerActors,playerVtable,defenseState}={}){
 const record=playerActors?.get(playerId);
 if(!(playerActors instanceof Map)||!(record?.controller instanceof Controller)||!(record.combatState instanceof CombatState)||![0x13aafdc,0x13c1c14].includes(playerVtable)||defenseState?.playerVtable!==playerVtable)throw Error('Actual owned player and retained constructor defense/equipment state required');
 // Original513FC0 block515533..515593 obtains constant_float0 and writes3D8.
 const state={playerVtable,defenseState,actorRate3d8:0,nativeReady:false};
 sourceOwners.set(state,{playerId,playerActors,record,controller:record.controller,combatState:record.combatState});return state;
}
function sourceOwner(state){
 const owner=sourceOwners.get(state);
 if(!owner||owner.playerActors.get(owner.playerId)!==owner.record||owner.record.controller!==owner.controller||owner.record.combatState!==owner.combatState)throw Error('Current owned player damage state required');return owner;
}
export function assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller}={}){
 const owner=sourceOwner(sourceState);
 if(owner.playerId!==playerId||owner.playerActors!==playerActors||owner.controller!==controller)throw Error('Damage source must retain the same actual attacking player');
 return sourceState;
}

// Real fresh Pawn state: inherited54ABC0 constructs208/4C with logical0;
// inherited97BF00 initializes15F458C=false and15F4590=0. The actual Pawn XML
// has all three category/decrease pairs0. Active changes must retain this state.
export function createInitialConquestPawnDamageState({actor,monsterActors}={}){
 if(!(actor instanceof ConquestMonsterActor)||!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor)throw Error('Actual owned Pawn1003/Explode1013 required');
 const variant=assertConquestHandgunPawnVariant({actor}),ability=CONQUEST_SOURCE_DATA.monsters[variant.monsterKey].Ability;
 if(Number(ability.DP)!==0)throw Error('Nonzero source PawnDP application is not qualified');
 const state={property208Rate:0,properties:new Map([[0x15f458c,false],[0x15f4590,0]]),resistances:[1,2,3].map(i=>({category:Number(ability['category_type'+i]),rate:f(Number(ability['decrease'+i]))})),nativeReady:false};
 pawnOwners.set(state,{actor,monsterActors,model:actor.model,monsterKey:variant.monsterKey});return state;
}
function pawnOwner(state){const owner=pawnOwners.get(state);if(!owner||owner.monsterActors.get(owner.actor.id)!==owner.actor||owner.actor.model!==owner.model||assertConquestHandgunPawnVariant({actor:owner.actor}).monsterKey!==owner.monsterKey)throw Error('Current owned Pawn damage state required');return owner;}

// The aura condition must write the same retained208/4C read by B8D640,
// never a parallel defense bag. Admission remains tied to the actual target
// and registry; condition provenance/lifetime belongs to the aura owner.
export function assertConquestPawnDamageState({pawnState,actor,monsterActors}={}){
 const owner=pawnOwner(pawnState);
 if(owner.actor!==actor||owner.monsterActors!==monsterActors)throw Error('Same actual target and monster registry required for208/4C');
 return pawnState;
}
export function setConquestPawnDefenseAuraRate({pawnState,actor,monsterActors,rate}={}){
 assertConquestPawnDamageState({pawnState,actor,monsterActors});
 pawnState.property208Rate=finite(rate,'source defense aura208/4C');
 return Object.freeze({actor,pawnState,rate:pawnState.property208Rate,sourceSetter:0x578fe0,nativeReady:false});
}

// Original B8B2A0 arithmetic with a PLAYER source, not the NPC zero-bonus
// branch. These are logical inputs from the explicit producers below. Source
// active condition25E is excluded by the supported genuinely empty vector state.
export function conquestPlayerMonsterDamageComponents({sourcePeerId,weaponType,workingPower,sourceBonusFlat,sourceBonusRate,targetDefenseRate,targetReduction,partNormalMultiplier,partCriticalMultiplier}){
 if((peer(sourcePeerId)[1]>>>16&7)!==1||weaponType!==22)throw Error('Actual player kind1 Handgun22 branch required');
 const power=finite(workingPower,'workingPower'),flat=finite(sourceBonusFlat,'source flat bonus'),rate=finite(sourceBonusRate,'source rate bonus'),defense=finite(targetDefenseRate,'monster defense rate'),reduction=finite(targetReduction,'target reduction'),normal=finite(partNormalMultiplier,'normal part multiplier'),critical=finite(partCriticalMultiplier,'critical part multiplier');
 let correction=f(f(0+flat)+f(power*rate));const sourceCorrection=correction;
 if(f(power+correction)>0){
  const defenseAmount=f(f(power*defense)+0);correction=f(correction-defenseAmount);
  correction=f(correction-f(reduction*flat));correction=f(correction-f(f(power*rate)*reduction));correction=f(correction-f(reduction*power));
  if(f(power+correction)<0){const difference=f(power-1);correction=f((difference<0?1:-1)*difference);}
 }
 const total=f(power+correction);
 // CMonster is NOT CPlayer RTTI; no player43C/440 part reduction is read.
 return Object.freeze({component0:f(normal*total),component1:f(critical*total),component2:f(normal*sourceCorrection),component3:f(critical*sourceCorrection),nativeReady:false});
}

export function conquestHandgunPawnDamageComponents({sourceState,pawnState,sourcePeerId,workingPower,hitPart}){
 sourceOwner(sourceState);pawnOwner(pawnState);integer(hitPart,'contact part');
 const state=sourceState.defenseState;
 if(!Array.isArray(state.conditions)||state.conditions.length!==0)throw Error('Active native source condition aggregation is not qualified');
 bool(state.statusManagerPresent,'source status manager presence');
 let flat=0,rate=0;
 if(state.statusManagerPresent){
  const a=state.equipment?.flat,b=state.equipment?.rate;if(a?.length!==33||b?.length!==33)throw Error('Actual33-field equipment arrays required');
  // B8C660: common4, family10 for weapon22, head11/other12.7AE830's
  // unconditional nonzero fallthrough is preserved, including contactpart0.
  for(const index of [4,10,hitPart===1?11:12]){flat=f(flat+finite(a[index],'equipment flat'+index));rate=f(rate+finite(b[index],'equipment rate'+index));}
  rate=f(rate+finite(sourceState.actorRate3d8,'actor3D8'));
 }
 let defense=0;
 if(!Array.isArray(pawnState.resistances)||pawnState.resistances.length!==3)throw Error('Actual three monster category/decrease pairs required');
 for(const resistance of pawnState.resistances){
  const category=integer(resistance.category,'resistance category'),value=finite(resistance.rate,'monster decrease');
  if(category===9)defense=f(defense+value);
  else if(category!==0)throw Error('Nonzero native resistance category requires qualified9A8750 weapon category lookup');
 }
 defense=f(defense+finite(pawnState.property208Rate,'monster208/4C'));defense=defense<f(.9998999834060669)?defense:f(.9998999834060669);
 if(!(pawnState.properties instanceof Map))throw Error('Retained native monster properties required');
 const reduction=pawnState.properties.has(0x15f4590)?finite(pawnState.properties.get(0x15f4590),'property15F4590'):0;
 return conquestPlayerMonsterDamageComponents({sourcePeerId,weaponType:22,workingPower,sourceBonusFlat:flat,sourceBonusRate:rate,targetDefenseRate:defense,targetReduction:reduction,...conquestNativePartDamageMultipliers(hitPart)});
}

//6E9C30→CMonster108 A03B00→A13A60→current.findTransition(2). The input is
//always2 here, independently of constructor input48/attack attribute55.
export function conquestPawnDamageRecordFlags({pawnState,runtime}){
 const {actor}=pawnOwner(pawnState);
 assertConquestHandgunPawnVariant({actor,runtime});
 const current=runtime.manager.current;
 if(current!==null&&typeof current.findTransition!=='function')throw Error('Actual native mapped monster current state required');
 const reaction=current===null?-1:current.findTransition(2).stateId;
 return Object.freeze({field44:false,field47:current!==null,field4a:false,field4d:false,field40:reaction,field80:0,targetEligible13c:true,nativeReady:false});
}

// Work-in-progress REAL producer, intentionally closed at the first unresolved
// weapon stage. Computes the sourced stages from real owners; never emits a
// record from an arbitrary contact.damage, final50, or external scale callback.
export function produceConquestPlayerPawnDamageRecord({sourceState,pawnState,runtime,sourcePeerId,workingPower,hitPart,equipmentPowerOwner,equipmentPowerReceipt}={}){
 const source=sourceOwner(sourceState);pawnOwner(pawnState);
 if(source.controller.weapon!=='handgun')throw Error('Current actual Handgun controller required');
 const flags=conquestPawnDamageRecordFlags({pawnState,runtime}),unresolved=[];
 let equipmentPreparation=null;
 if(equipmentPowerOwner!==undefined||equipmentPowerReceipt!==undefined){
  if(workingPower!==undefined)throw Error('An equipment receipt cannot be mixed with an external workingPower');
  if(!(equipmentPowerOwner instanceof ConquestHandgunEquipmentPower))throw Error('Actual Handgun equipment preparation owner required');
  equipmentPreparation=equipmentPowerOwner.assertReceipt(equipmentPowerReceipt,{controller:source.controller,defenseState:sourceState.defenseState});
  if(equipmentPreparation.workingPowerProducerQualified===true)throw Error('Native Handgun equipment/tempo completion has not been qualified');
  unresolved.push(...equipmentPreparation.unresolved);
 }
 if(!Number.isFinite(workingPower))unresolved.push('actual-handgun-working-power-preparation');
 if(!Number.isInteger(hitPart))unresolved.push('native-npc-ray-contact-part');
 const components=unresolved.length?null:conquestHandgunPawnDamageComponents({sourceState,pawnState,sourcePeerId,workingPower,hitPart});
 unresolved.push('handgun-ApplyLinearDamageDropoff-native-consumer',equipmentPreparation?'handgun-current-contact-delivery-and-570890-final-gates':'handgun-source-critical-preparation-and-current-contact-delivery');
 return Object.freeze({record:null,status:'handgun-final-record-producer-unresolved',components,flags,equipmentPreparation,unresolved:Object.freeze(unresolved),nativeReady:false});
}
