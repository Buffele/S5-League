import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestSession} from './conquest-session.js';
import {ConquestHandgunCriticalPreparation} from './conquest-handgun-critical-preparation.js';
import {HANDGUN} from './handgun-runtime.js';
import {IMPORTED_WEAPONS} from './weapon-inventory.js';
import {SOURCE_MOVEMENT} from './movement-profile.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {CONQUEST_HANDGUN_EQUIPMENT_DATA as data} from './conquest-handgun-equipment-data.js';

const f=Math.fround,receipts=new WeakMap();
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Explicit finite '+name+' required');return f(v);};
export const CONQUEST_HANDGUN_PLAIN_ITEM_POLICY='s5-catalogue-plain-no-wear';

// Original B90710→83EE40 arithmetic, independently compared to168 original CPU
// executions. Inputs are explicit logical fields; this function grants no owner.
export function conquestHandgunEquipmentArguments({propertyPower,accuracy,durationTier,tempoDamage34,additionalPower}={}){
 const raw=finite(propertyPower,'item power'),aim=finite(accuracy,'item accuracy'),tempo=finite(tempoDamage34,'GameTempo34'),additional=finite(additionalPower,'AdditionalPower');
 if(!Number.isInteger(durationTier)||durationTier<0||durationTier>0xffffffff)throw Error('Explicit native duration tier required');
 const factors={1:f(.9),2:f(.5),3:f(.3),4:f(.1)};
 const equipmentPower=durationTier===5?1:f(raw*(factors[durationTier]??1)),power=f(equipmentPower*tempo);
 return Object.freeze({oneShotTime:0,equipmentPower,power,accuracy:aim,additionalPower:additional,initAttackPower:f(power+additional),nativeReady:false});
}

// A real S5 loadout/Controller/Conquest session owner, with an EXPLICIT plain
// item policy. The S5 physics configuration selects FREE; this is separate
// from the unresolved native Conquest room→GameTempo selection. In particular
// an authored numeric2 cannot turn that missing native owner into a receipt.
export class ConquestHandgunEquipmentPower{
 #players;#id;#record;#controller;#combat;#world;#position;#rifle;#loadout;#session;#map;#defense;#conditions;#flat;#rate;#shots=new WeakMap();#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,loadout,conquestSession,defenseState,plainItemPolicy}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||!(conquestSession instanceof ConquestSession)||conquestSession.world?.nativeMapId!==46||(conquestSession.world!==worldOwner&&conquestSession.world.collisionSourceWorld!==worldOwner)||typeof loadout?.snapshot!=='function'||plainItemPolicy!==CONQUEST_HANDGUN_PLAIN_ITEM_POLICY||!Array.isArray(defenseState?.conditions)||![0x13aafdc,0x13c1c14].includes(defenseState.playerVtable))throw Error('Actual S5 player, confirmed loadout, map46 Conquest session and explicit plain-item policy required');
  this.#players=playerActors;this.#id=playerId;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#rifle=controller.rifle;this.#loadout=loadout;this.#session=conquestSession;this.#map=conquestSession.world;this.#defense=defenseState;this.#conditions=defenseState.conditions;this.#flat=defenseState.equipment?.flat;this.#rate=defenseState.equipment?.rate;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='handgun'||this.#controller.rifle!==this.#rifle||this.#rifle?.profile!==HANDGUN||this.#session.phase==='disposed'||this.#session.world!==this.#map||this.#map.nativeMapId!==46||(this.#map!==this.#world&&this.#map.collisionSourceWorld!==this.#world))throw Error('Current owned S5 Handgun and Conquest world required');
  const snapshot=this.#loadout.snapshot(),index=snapshot?.activeSlot;
  if(snapshot?.status!=='confirmed'||snapshot.pending!==false||!Number.isInteger(snapshot.revision)||snapshot.revision<0||![0,1,2].includes(index)||snapshot.slots?.length!==3||snapshot.skins?.length!==3||snapshot.slots[index]!=='handgun'||snapshot.skins[index]!=='classic')throw Error('Confirmed current classic Handgun loadout slot required');
  const identity=IMPORTED_WEAPONS.find(row=>row.loadoutId===snapshot.slots[index])?.nativeIdentity;
  if(identity?.itemKey!==data.itemKey||identity.weaponType!==data.weaponType||data.itemKey!==HANDGUN.itemKey||data.weaponType!==HANDGUN.nativeType||data.ability.power!==HANDGUN.ability.power||data.inherentModifiers.length!==0)throw Error('Authenticated current item2010007 source identity required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0||this.#defense.equipment?.flat!==this.#flat||this.#defense.equipment?.rate!==this.#rate||this.#flat?.length!==33||this.#rate?.length!==33)throw Error('Retained source condition/equipment owner required');
  const profile=SOURCE_MOVEMENT.profile;
  if(profile!==S5RUNTIME_NATIVE_PHYSICS.profile||!Object.hasOwn(data.tempoDamageValues,profile)||f(data.tempoDamageValues[profile])!==f(S5RUNTIME_NATIVE_PHYSICS.values.damage_multiplier))throw Error('Current explicit S5 physics profile and authenticated GameTempo34 required');
  return {revision:snapshot.revision,slot:index,profile,tempo:f(data.tempoDamageValues[profile])};
 }
 #assertShot(shot){if(!shot||shot!==this.#rifle.lastShot||shot.weapon!=='handgun'||!Number.isInteger(shot.serial)||shot.serial<=0||shot.serial!==this.#rifle.shotSerial)throw Error('Actual current activated Handgun shot required');}
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Equipment preparation must retain the same actual player and condition owner');}
 prepare({criticalPreparation,shot}={}){
  const current=this.#current();
  this.#assertShot(shot);
  if(!(criticalPreparation instanceof ConquestHandgunCriticalPreparation))throw Error('Actual owned player critical preparation required');
  criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  const prior=this.#shots.get(shot);if(prior){if(receipts.get(prior)?.criticalPreparation!==criticalPreparation)throw Error('A shot must retain its original critical preparation owner');return this.assertReceipt(prior);}
  const critical=criticalPreparation.prepare();
  const after=this.#current();if(after.revision!==current.revision||after.slot!==current.slot)throw Error('Loadout changed during source preparation');
  this.#assertShot(shot);
  criticalPreparation.assertReceipt(critical);criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  // No-wear is the caller-declared S5 item instance policy, not a measurement
  // of native9A0940. Source58C4B0 supplies AdditionalPower0 at item activation.
  const args=conquestHandgunEquipmentArguments({propertyPower:data.ability.power,accuracy:data.ability.accuracy,durationTier:0,tempoDamage34:current.tempo,additionalPower:0});
  // Constructor gauss chance0 gives zero without a third draw;574520 factor1
  // retains the two draws already performed by the real critical owner.
  const receipt=Object.freeze({itemKey:data.itemKey,weaponType:data.weaponType,attackAttribute:data.attackAttribute,loadoutRevision:current.revision,slot:current.slot,shotSerial:shot.serial,
   itemPolicy:CONQUEST_HANDGUN_PLAIN_ITEM_POLICY,propertyPower:f(data.ability.power),inherentModifiers:Object.freeze([]),
   s5TempoProfile:current.profile,s5TempoDamage34:current.tempo,arguments:args,critical,
   declaredWorkingPower:f(f(args.initAttackPower+0)*critical.probabilityFactor),
   s5DeclaredEquipmentPowerProduced:true,nativeItemInstanceQualified:false,nativeConquestTempoSelectionQualified:false,workingPowerProducerQualified:false,
   unresolved:Object.freeze(['native-conquest-room-GameTempo-selection','native-item-instance-duration-and-effect-application']),nativeReady:false});
  receipts.set(receipt,{owner:this,revision:current.revision,slot:current.slot,criticalPreparation,shot});this.#shots.set(shot,receipt);return receipt;
 }
 assertReceipt(receipt,{controller,defenseState}={}){
  const current=this.#current(),record=receipts.get(receipt);
  if(record?.owner!==this||record.revision!==current.revision||record.slot!==current.slot||(controller!==undefined&&controller!==this.#controller)||(defenseState!==undefined&&defenseState!==this.#defense))throw Error('Actual current owned Handgun equipment preparation receipt required');
  this.#assertShot(record.shot);
  record.criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});record.criticalPreparation.assertReceipt(receipt.critical);return receipt;
 }
 dispose(){this.#disposed=true;}
}
