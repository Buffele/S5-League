import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestSession} from './conquest-session.js';
import {ConquestSmgCriticalPreparation} from './conquest-smg-critical-preparation.js';
import {SUBMACHINE_PROFILE} from './submachine-gun-runtime.js';
import {SOURCE_MOVEMENT} from './movement-profile.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {CONQUEST_SMG_SOURCE_DATA as data} from './conquest-smg-source-data.js';

const f=Math.fround,receipts=new WeakMap();
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Explicit finite '+name+' required');return f(v);};
export const CONQUEST_SMG_PLAIN_ITEM_POLICY=Object.freeze({id:'s5-conquest-smg-plain-catalogue-no-wear',itemKey:2010001,nativeItemInstanceQualified:false,nativeConquestTempoSelectionQualified:false,nativeReady:false});

// Shared B90710 numeric item stages with distinct SMG catalogue inputs.
//The selected native SMG callback/item application is not qualified by this
//S5 plain-item policy. Arithmetic alone grants no current-shot ownership.
export function conquestSmgEquipmentArguments({propertyPower,accuracy,durationTier,tempoDamage34,additionalPower}={}){
 const raw=finite(propertyPower,'item power'),aim=finite(accuracy,'item accuracy'),tempo=finite(tempoDamage34,'GameTempo34'),additional=finite(additionalPower,'AdditionalPower');
 if(!Number.isInteger(durationTier)||durationTier<0||durationTier>0xffffffff)throw Error('Explicit native duration tier required');
 const factors={1:f(.9),2:f(.5),3:f(.3),4:f(.1)};
 const equipmentPower=durationTier===5?1:f(raw*(factors[durationTier]??1)),power=f(equipmentPower*tempo);
 return Object.freeze({oneShotTime:0,equipmentPower,power,accuracy:aim,additionalPower:additional,initAttackPower:f(power+additional),nativeReady:false});
}

// A real S5 loadout/Controller/Conquest session owner, with an EXPLICIT plain
// item policy. The S5 physics configuration selects FREE; this is separate
// from the unresolved native Conquest roomâ†’GameTempo selection. In particular
// an authored numeric2 cannot turn that missing native owner into a receipt.
export class ConquestSmgEquipmentPower{
 #players;#id;#record;#controller;#combat;#world;#position;#rifle;#loadout;#session;#map;#defense;#conditions;#flat;#rate;#shots=new WeakMap();#highestSerial=0;#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,loadout,conquestSession,defenseState,plainItemPolicy}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||!(conquestSession instanceof ConquestSession)||conquestSession.world?.nativeMapId!==46||(conquestSession.world!==worldOwner&&conquestSession.world.collisionSourceWorld!==worldOwner)||typeof loadout?.snapshot!=='function'||plainItemPolicy!==CONQUEST_SMG_PLAIN_ITEM_POLICY||!Array.isArray(defenseState?.conditions)||![0x13aafdc,0x13c1c14].includes(defenseState.playerVtable))throw Error('Actual S5 player, confirmed loadout, map46 Conquest session and explicit plain-item policy required');
  this.#players=playerActors;this.#id=playerId;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#rifle=controller.rifle;this.#loadout=loadout;this.#session=conquestSession;this.#map=conquestSession.world;this.#defense=defenseState;this.#conditions=defenseState.conditions;this.#flat=defenseState.equipment?.flat;this.#rate=defenseState.equipment?.rate;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='submachinegun'||this.#controller.rifle!==this.#rifle||this.#rifle?.profile!==SUBMACHINE_PROFILE||this.#session.phase==='disposed'||this.#session.world!==this.#map||this.#map.nativeMapId!==46||(this.#map!==this.#world&&this.#map.collisionSourceWorld!==this.#world))throw Error('Current owned S5 SMG and Conquest world required');
  const snapshot=this.#loadout.snapshot(),index=snapshot?.activeSlot;
  if(snapshot?.status!=='confirmed'||snapshot.pending!==false||!Number.isInteger(snapshot.revision)||snapshot.revision<0||![0,1,2].includes(index)||snapshot.slots?.length!==3||snapshot.skins?.length!==3||snapshot.slots[index]!=='submachinegun'||snapshot.skins[index]!=='classic')throw Error('Confirmed current classic SMG loadout slot required');
  if(data.classicBinding?.loadoutId!=='submachinegun'||data.classicBinding.skin!=='classic'||data.classicBinding.itemKey!==2010001||data.classicBinding.sourceContractQualified!==true||data.itemKey!==2010001||data.weaponType!==2||data.attackAttribute!==8||data.ability.power!==7||data.ability.accuracy!==.04||data.inherentModifiers.length!==0)throw Error('Authenticated current item2010001 source identity required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0||this.#defense.equipment?.flat!==this.#flat||this.#defense.equipment?.rate!==this.#rate||this.#flat?.length!==33||this.#rate?.length!==33)throw Error('Retained source condition/equipment owner required');
  const profile=SOURCE_MOVEMENT.profile;
  if(profile!==S5RUNTIME_NATIVE_PHYSICS.profile||!Object.hasOwn(data.tempoDamageValues,profile)||f(data.tempoDamageValues[profile])!==f(S5RUNTIME_NATIVE_PHYSICS.values.damage_multiplier))throw Error('Current explicit S5 physics profile and authenticated GameTempo34 required');
  return {revision:snapshot.revision,slot:index,profile,tempo:f(data.tempoDamageValues[profile])};
 }
 // Controller's legacy automatic bridge creates jobs without weapon/serial or
 //lastShot. Capture ONLY at actual activation, then retain the private job
 //receipt through later queue/contact ticks instead of guessing its history.
 #assertShot(shot,record=null){
  if(!shot||!this.#rifle.pendingShots.includes(shot))throw Error('Actual pending SMG Controller job required');
  if(record){if(shot.mapAttackSource!==record.mapSource)throw Error('Captured SMG job source replaced');return;}
  if(shot!==this.#rifle.pendingShots.at(-1)||shot.mapAttackSource!==this.#rifle.mapAttackSource||!this.#controller.events.includes('shot')||!Number.isInteger(this.#rifle.shotSerial)||this.#rifle.shotSerial<=0||this.#rifle.shotSerial<=this.#highestSerial)throw Error('Capture the actual new SMG job at its activation step; historical equipment is unavailable');
 }
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Equipment preparation must retain the same actual player and condition owner');}
 prepare({criticalPreparation,shot}={}){
  const current=this.#current();
  const prior=this.#shots.get(shot);
  if(prior){if(receipts.get(prior)?.criticalPreparation!==criticalPreparation)throw Error('A job must retain its original critical owner');return this.assertReceipt(prior);}
  this.#assertShot(shot);
  if(!(criticalPreparation instanceof ConquestSmgCriticalPreparation))throw Error('Actual owned player critical preparation required');
  criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  const critical=criticalPreparation.prepare();
  const after=this.#current();if(after.revision!==current.revision||after.slot!==current.slot)throw Error('Loadout changed during source preparation');
  this.#assertShot(shot);
  criticalPreparation.assertReceipt(critical);criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});
  // No-wear is the caller-declared S5 item instance policy, not a measurement
  // of native9A0940. Source58C4B0 supplies AdditionalPower0 at item activation.
  const args=conquestSmgEquipmentArguments({propertyPower:data.ability.power,accuracy:data.ability.accuracy,durationTier:0,tempoDamage34:current.tempo,additionalPower:0});
  // Constructor gauss chance0 gives zero without a third draw;574520 factor1
  // retains the two draws already performed by the real critical owner.
  const receipt=Object.freeze({itemKey:data.itemKey,weaponType:data.weaponType,attackAttribute:data.attackAttribute,loadoutRevision:current.revision,slot:current.slot,shotSerial:this.#rifle.shotSerial,
   itemPolicy:CONQUEST_SMG_PLAIN_ITEM_POLICY,propertyPower:f(data.ability.power),inherentModifiers:Object.freeze([]),
   s5TempoProfile:current.profile,s5TempoDamage34:current.tempo,arguments:args,critical,
   declaredWorkingPower:f(f(args.initAttackPower+0)*critical.probabilityFactor),
   s5DeclaredEquipmentPowerProduced:true,nativeItemInstanceQualified:false,nativeConquestTempoSelectionQualified:false,workingPowerProducerQualified:false,
   unresolved:Object.freeze(['native-conquest-room-GameTempo-selection','native-item-instance-duration-and-effect-application']),nativeReady:false});
  receipts.set(receipt,{owner:this,revision:current.revision,slot:current.slot,criticalPreparation,shot,mapSource:shot.mapAttackSource});this.#highestSerial=this.#rifle.shotSerial;this.#shots.set(shot,receipt);return receipt;
 }
 assertReceipt(receipt,{controller,defenseState}={}){
  const current=this.#current(),record=receipts.get(receipt);
  if(record?.owner!==this||record.revision!==current.revision||record.slot!==current.slot||(controller!==undefined&&controller!==this.#controller)||(defenseState!==undefined&&defenseState!==this.#defense))throw Error('Actual current owned SMG equipment preparation receipt required');
  this.#assertShot(record.shot,record);
  record.criticalPreparation.assertSource({controller:this.#controller,defenseState:this.#defense});record.criticalPreparation.assertReceipt(receipt.critical);return receipt;
 }
 dispose(){this.#disposed=true;this.#highestSerial=0;}
}
