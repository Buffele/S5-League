import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestSession} from './conquest-session.js';
import {ConquestDaggerCutCriticalPreparation} from './conquest-dagger-critical-preparation.js';
import {assertConquestDaggerCutRuntime} from './conquest-dagger-player-profile.js';
import {SPY_DAGGER_ITEM} from './spy-dagger-data.js';
import {SOURCE_MOVEMENT} from './movement-profile.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {CONQUEST_DAGGER_EQUIPMENT_DATA as data} from './conquest-dagger-equipment-data.js';

const f=Math.fround,receipts=new WeakMap();
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Explicit finite '+name+' required');return f(v);};
export const CONQUEST_DAGGER_PLAIN_ITEM_POLICY=Object.freeze({id:'s5-conquest-dagger-cut-classic-no-wear-unlimited-empty-global',itemKey:2000006,balanceChannel:'unlimited',additionalGlobal:'nil',nativeReady:false});

// Original B90710→83EE40 arithmetic, independently compared to168 generic original CPU
// executions. Inputs are explicit logical fields; this function grants no owner.
export function conquestDaggerCutEquipmentArguments({propertyPower,accuracy,durationTier,tempoDamage34,additionalPower}={}){
 const raw=finite(propertyPower,'item power'),aim=finite(accuracy,'item accuracy'),tempo=finite(tempoDamage34,'GameTempo34'),additional=finite(additionalPower,'AdditionalPower');
 if(!Number.isInteger(durationTier)||durationTier<0||durationTier>0xffffffff)throw Error('Explicit native duration tier required');
 const factors={1:f(.9),2:f(.5),3:f(.3),4:f(.1)};
 const equipmentPower=durationTier===5?1:f(raw*(factors[durationTier]??1)),power=f(equipmentPower*tempo);
 return Object.freeze({oneShotTime:0,equipmentPower,power,accuracy:aim,additionalPower:additional,nativeReady:false});
}

// A real S5 loadout/Controller/Conquest session owner, with an EXPLICIT plain
// item policy. The S5 physics configuration selects FREE; this is separate
// from the unresolved native Conquest room→GameTempo selection. In particular
// an authored numeric2 cannot turn that missing native owner into a receipt.
export class ConquestDaggerCutEquipmentPower{
 #players;#id;#record;#controller;#combat;#world;#position;#loadout;#session;#map;#defense;#conditions;#flat;#rate;#cuts=new WeakMap();#preparing=false;#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,loadout,conquestSession,defenseState,plainItemPolicy}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||!(conquestSession instanceof ConquestSession)||conquestSession.world?.nativeMapId!==46||(conquestSession.world!==worldOwner&&conquestSession.world.collisionSourceWorld!==worldOwner)||typeof loadout?.snapshot!=='function'||plainItemPolicy!==CONQUEST_DAGGER_PLAIN_ITEM_POLICY||!Array.isArray(defenseState?.conditions)||![0x13aafdc,0x13c1c14].includes(defenseState.playerVtable))throw Error('Actual S5 player, confirmed loadout, map46 Conquest session and explicit plain-item policy required');
  this.#players=playerActors;this.#id=playerId;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#loadout=loadout;this.#session=conquestSession;this.#map=conquestSession.world;this.#defense=defenseState;this.#conditions=defenseState.conditions;this.#flat=defenseState.equipment?.flat;this.#rate=defenseState.equipment?.rate;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='dagger'||this.#combat.dead||!(this.#combat.hp>0)||this.#session.phase==='disposed'||this.#session.world!==this.#map||this.#map.nativeMapId!==46||(this.#map!==this.#world&&this.#map.collisionSourceWorld!==this.#world))throw Error('Current owned S5 DaggerCut and Conquest world required');
  const snapshot=this.#loadout.snapshot(),index=snapshot?.activeSlot;
  if(snapshot?.status!=='confirmed'||snapshot.pending!==false||!Number.isInteger(snapshot.revision)||snapshot.revision<0||![0,1,2].includes(index)||snapshot.slots?.length!==3||snapshot.skins?.length!==3||snapshot.slots[index]!=='dagger'||snapshot.skins[index]!=='classic')throw Error('Confirmed current classic DaggerCut loadout slot required');
  if(data.itemKey!==SPY_DAGGER_ITEM.key||data.weaponType!==SPY_DAGGER_ITEM.nativeType||data.ability.power!==SPY_DAGGER_ITEM.power||data.inherentModifiers.length!==0)throw Error('Authenticated current item2000006 source identity required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0||this.#defense.equipment?.flat!==this.#flat||this.#defense.equipment?.rate!==this.#rate||this.#flat?.length!==33||this.#rate?.length!==33)throw Error('Retained source condition/equipment owner required');
  const profile=SOURCE_MOVEMENT.profile;
  if(profile!==S5RUNTIME_NATIVE_PHYSICS.profile||!Object.hasOwn(data.tempoDamageValues,profile)||f(data.tempoDamageValues[profile])!==f(S5RUNTIME_NATIVE_PHYSICS.values.damage_multiplier))throw Error('Current explicit S5 physics profile and authenticated GameTempo34 required');
  return {revision:snapshot.revision,slot:index,profile,combatSerial:this.#combat.serial,tempo:f(data.tempoDamageValues[profile])};
 }
 #assertCut(cut){if(assertConquestDaggerCutRuntime(this.#controller)!==cut||(cut.phase!==undefined&&cut.phase!=='action'))throw Error('Actual current primary Dagger cut required');}
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Equipment preparation must retain the same actual player and condition owner');}
 prepare({criticalPreparation,cut}={}){
  if(this.#preparing)throw Error('Dagger equipment preparation is already in progress');
  this.#preparing=true;
  try{
  const current=this.#current();
  this.#assertCut(cut);
  if(!(criticalPreparation instanceof ConquestDaggerCutCriticalPreparation))throw Error('Actual owned player critical preparation required');
  criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  const prior=this.#cuts.get(cut);if(prior){if(receipts.get(prior)?.criticalPreparation!==criticalPreparation)throw Error('A cut must retain its original critical preparation owner');return this.assertReceipt(prior);}
  if(!this.#controller.events.includes('attack'))throw Error('Capture Dagger equipment at the actual cut activation step');
  const critical=criticalPreparation.prepare({cut});
  const after=this.#current();if(after.revision!==current.revision||after.slot!==current.slot||after.combatSerial!==current.combatSerial)throw Error('Loadout changed during source preparation');
  this.#assertCut(cut);
  criticalPreparation.assertReceipt(critical);criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  // No-wear is the caller-declared S5 item instance policy, not a measurement
  // of native9A0940. Source58C4B0 supplies the distinct correctly spelled AdditionalPower0.
  // Cut uses AddtionalPower instead; the named S5 policy explicitly selects nil.
  const args=conquestDaggerCutEquipmentArguments({propertyPower:data.ability.power,accuracy:data.ability.accuracy,durationTier:0,tempoDamage34:current.tempo,additionalPower:0});
  // Lua passes its global AddtionalPower as argument6 directly. Under the
  // explicit empty-global policy it is nil; original579560/1013310/401560
  // converts it to0. Five CPU wrapper cases retain numeric values too.
  // Constructor gauss chance0 gives zero without a third draw;574520 factor1
  // retains the two draws already performed by the real critical owner.
  const receipt=Object.freeze({itemKey:data.itemKey,weaponType:data.weaponType,attackAttribute:data.attackAttribute,loadoutRevision:current.revision,slot:current.slot,activationIndex:0,
   itemPolicy:CONQUEST_DAGGER_PLAIN_ITEM_POLICY,propertyPower:f(data.ability.power),inherentModifiers:Object.freeze([]),
   s5TempoProfile:current.profile,s5TempoDamage34:current.tempo,arguments:args,critical,
   balanceChannel:CONQUEST_DAGGER_PLAIN_ITEM_POLICY.balanceChannel,luaPowerFactor:data.sourceFactors.unlimited,luaAdditionalGlobal:null,convertedAdditionalPower:0,initAttackPower:f(args.power*data.sourceFactors.unlimited),
   declaredWorkingPower:f(f(f(args.power*data.sourceFactors.unlimited)+0)*critical.probabilityFactor),
   s5DeclaredEquipmentPowerProduced:true,nativeItemInstanceQualified:false,nativeConquestTempoSelectionQualified:false,workingPowerProducerQualified:false,
   unresolved:Object.freeze(['native-conquest-room-GameTempo-selection','native-item-instance-duration-and-effect-application','native-live-AddtionalPower-global','native-Conquest-balance-channel-selection']),nativeReady:false});
  receipts.set(receipt,{owner:this,revision:current.revision,slot:current.slot,criticalPreparation,cut,combatSerial:this.#combat.serial});this.#cuts.set(cut,receipt);return receipt;
  }finally{this.#preparing=false;}
 }
 assertReceipt(receipt,{controller,defenseState}={}){
  const current=this.#current(),record=receipts.get(receipt);
  if(record?.owner!==this||record.revision!==current.revision||record.slot!==current.slot||record.combatSerial!==this.#combat.serial||(controller!==undefined&&controller!==this.#controller)||(defenseState!==undefined&&defenseState!==this.#defense))throw Error('Actual current owned DaggerCut equipment preparation receipt required');
  this.#assertCut(record.cut);
  record.criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});record.criticalPreparation.assertReceipt(receipt.critical);return receipt;
 }
 dispose(){this.#disposed=true;}
}
