import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {HANDGUN} from './handgun-runtime.js';

const receipts=new WeakMap(),synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);

// Player-specific574520 preparation, not the NPC154=null profile. Handgun
// SetCritical2/0 plus a real empty condition manager makes effective chance0.
// Selectors152/263 still execute in the source. Two strict inequalities can
// never both hold at half-window0, but BOTH random draws must be preserved.
export class ConquestHandgunCriticalPreparation{
 #id;#players;#record;#controller;#combat;#world;#position;#rifle;#defense;#conditions;#nextRandom;#nextInternal;#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,defenseState,nextRandom15,nextInternalPercentRoll}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||![0x13aafdc,0x13c1c14].includes(defenseState?.playerVtable)||!Array.isArray(defenseState.conditions)||typeof defenseState.statusManagerPresent!=='boolean'||![nextRandom15,nextInternalPercentRoll].every(synchronous))throw Error('Actual player authority, retained native status state and synchronous random streams required');
  this.#id=playerId;this.#players=playerActors;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#rifle=controller.rifle;this.#defense=defenseState;this.#conditions=defenseState.conditions;this.#nextRandom=nextRandom15;this.#nextInternal=nextInternalPercentRoll;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='handgun'||this.#controller.rifle!==this.#rifle||this.#rifle?.profile!==HANDGUN)throw Error('Current owned source Handgun Controller required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0)throw Error('Native critical selectors152/263 require the genuine retained empty condition vectors');
  if(typeof this.#defense.statusManagerPresent!=='boolean')throw Error('Actual source status manager presence required');
 }
 prepare(){
  this.#current();const random15=this.#nextRandom(this.#controller);
  if(!Number.isInteger(random15)||random15<0||random15>32767)throw Error('Actual CRT rand15 output required');
  this.#current();const internalPercentRoll=this.#nextInternal(this.#controller);
  if(!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual signed per-attack random output required');
  this.#current();
  const receipt=Object.freeze({profile:'source-handgun22-critical2-chance0-empty-conditions',weaponType:22,attackAttribute:55,
   configuredMultiplier:2,configuredChancePercent:0,effectiveChancePercent:0,probabilityFactor:1,critical:false,
   sourceStatusManagerPresent:this.#defense.statusManagerPresent,sourceConditionSelectors:Object.freeze(this.#defense.statusManagerPresent?[0x152,0x263]:[]),
   randomInputs:Object.freeze({random15,internalPercentRoll}),sourceCriticalPreparationQualified:true,
   workingPowerProducerQualified:false,nativeRandomStreamQualified:false,nativeReady:false});
  receipts.set(receipt,{owner:this,controller:this.#controller});return receipt;
 }
 assertReceipt(receipt){this.#current();const r=receipts.get(receipt);if(r?.owner!==this||r.controller!==this.#controller)throw Error('Actual owned Handgun critical preparation receipt required');return receipt;}
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Critical preparation must retain the same actual player and condition owner');}
 dispose(){this.#disposed=true;}
}
