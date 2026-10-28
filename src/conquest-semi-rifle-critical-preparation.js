import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {assertConquestSemiRifleRuntime} from './conquest-semi-rifle-player-profile.js';
import {CONQUEST_SEMI_RIFLE_SOURCE_DATA as data} from './conquest-semi-rifle-source-data.js';

const receipts=new WeakMap(),synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);

// Player-specific574520 preparation, not the NPC154=null profile. SemiRifle
// SetCritical2.3/0 plus a real empty condition manager makes effective chance0.
// Selectors152/263 still execute in the source. Two strict inequalities can
// never both hold at half-window0, but BOTH random draws must be preserved.
export class ConquestSemiRifleCriticalPreparation{
 #id;#players;#record;#controller;#combat;#world;#position;#rifle;#defense;#conditions;#nextRandom;#nextInternal;#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,defenseState,nextRandom15,nextInternalPercentRoll}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||![0x13aafdc,0x13c1c14].includes(defenseState?.playerVtable)||!Array.isArray(defenseState.conditions)||typeof defenseState.statusManagerPresent!=='boolean'||![nextRandom15,nextInternalPercentRoll].every(synchronous))throw Error('Actual player authority, retained native status state and synchronous random streams required');
  this.#id=playerId;this.#players=playerActors;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#rifle=controller.rifle;this.#defense=defenseState;this.#conditions=defenseState.conditions;this.#nextRandom=nextRandom15;this.#nextInternal=nextInternalPercentRoll;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='semirifle'||this.#controller.rifle!==this.#rifle||!assertConquestSemiRifleRuntime(this.#rifle))throw Error('Current owned source SemiRifle Controller required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0)throw Error('Native critical selectors152/263 require the genuine retained empty condition vectors');
  if(this.#defense.statusManagerPresent!==true)throw Error('Qualified Semi Rifle critical profile requires the actual initialized empty status manager; null-manager branch remains unqualified');
 }
 prepare(){
  this.#current();const random15=this.#nextRandom(this.#controller);
  if(!Number.isInteger(random15)||random15<0||random15>32767)throw Error('Actual CRT rand15 output required');
  this.#current();const internalPercentRoll=this.#nextInternal(this.#controller);
  if(!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual signed per-attack random output required');
  this.#current();
  const receipt=Object.freeze({profile:'source-semi-rifle4-critical2.3-chance0-empty-conditions',weaponType:data.weaponType,attackAttribute:data.attackAttribute,
   configuredMultiplier:Math.fround(data.configuredCriticalMultiplier),configuredChancePercent:0,effectiveChancePercent:0,probabilityFactor:1,critical:false,
   sourceStatusManagerPresent:this.#defense.statusManagerPresent,sourceConditionSelectors:Object.freeze(this.#defense.statusManagerPresent?[0x152,0x263]:[]),
   randomInputs:Object.freeze({random15,internalPercentRoll}),sourceCriticalPreparationQualified:true,
   workingPowerProducerQualified:false,nativeRandomStreamQualified:false,nativeReady:false});
  receipts.set(receipt,{owner:this,controller:this.#controller});return receipt;
 }
 assertReceipt(receipt){this.#current();const r=receipts.get(receipt);if(r?.owner!==this||r.controller!==this.#controller)throw Error('Actual owned SemiRifle critical preparation receipt required');return receipt;}
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Critical preparation must retain the same actual player and condition owner');}
 dispose(){this.#disposed=true;}
}
