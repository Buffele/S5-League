import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {assertConquestDaggerCutRuntime} from './conquest-dagger-player-profile.js';

const receipts=new WeakMap();
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);

// SpyDaggerCut creates a fresh CAttack and never calls SetCritical: its own
// constructor1/0 survives. Original type24 numeric blocks, both random draws
// and genuine empty status vectors: conquest-dagger-20261023/critical-source.json.
// This owner deliberately provides no equipment power or NPC contact authority.
export class ConquestDaggerCutCriticalPreparation{
 #players;#id;#record;#controller;#combat;#world;#position;#defense;#vtable;#conditions;#nextRandom;#nextInternal;#cuts=new WeakMap();#preparing=false;#disposed=false;
 constructor({playerId,playerActors,controller,worldOwner,defenseState,nextRandom15,nextInternalPercentRoll}={}){
  const record=playerActors?.get(playerId);
  if(!(playerActors instanceof Map)||!(controller instanceof Controller)||record?.controller!==controller||!(record.combatState instanceof CombatState)||controller.world!==worldOwner||![0x13aafdc,0x13c1c14].includes(defenseState?.playerVtable)||!Array.isArray(defenseState.conditions)||typeof defenseState.statusManagerPresent!=='boolean'||![nextRandom15,nextInternalPercentRoll].every(synchronous))throw Error('Actual Dagger player, retained status owner and synchronous random streams required');
  this.#players=playerActors;this.#id=playerId;this.#record=record;this.#controller=controller;this.#combat=record.combatState;this.#world=worldOwner;this.#position=controller.position;this.#defense=defenseState;this.#vtable=defenseState.playerVtable;this.#conditions=defenseState.conditions;this.#nextRandom=nextRandom15;this.#nextInternal=nextInternalPercentRoll;this.#current();
 }
 #current(){
  if(this.#disposed||this.#players.get(this.#id)!==this.#record||this.#record.controller!==this.#controller||this.#record.combatState!==this.#combat||this.#combat.dead||!(this.#combat.hp>0)||this.#controller.world!==this.#world||this.#controller.position!==this.#position||this.#controller.weapon!=='dagger')throw Error('Current living owned Dagger Controller required');
  if(this.#defense.conditions!==this.#conditions||this.#conditions.length!==0||this.#defense.playerVtable!==this.#vtable||typeof this.#defense.statusManagerPresent!=='boolean')throw Error('Retained genuine empty source status vectors required');
 }
 #cut(cut){this.#current();if(assertConquestDaggerCutRuntime(this.#controller)!==cut||(cut.phase!==undefined&&cut.phase!=='action'))throw Error('Actual current primary Dagger cut required');}
 prepare({cut=this.#controller.attack}={}){
  if(this.#preparing)throw Error('Dagger critical preparation is already in progress');
  this.#cut(cut);const prior=this.#cuts.get(cut);if(prior)return this.assertReceipt(prior);const statusManagerPresent=this.#defense.statusManagerPresent,combatSerial=this.#combat.serial;
  this.#preparing=true;
  try{
  const random15=this.#nextRandom(this.#controller);if(!Number.isInteger(random15)||random15<0||random15>32767)throw Error('Actual CRT rand15 output required');
  this.#cut(cut);const internalPercentRoll=this.#nextInternal(this.#controller);if(!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual signed per-attack random output required');
  this.#cut(cut);if(this.#combat.serial!==combatSerial)throw Error('Source life/reaction changed during critical preparation');if(this.#defense.statusManagerPresent!==statusManagerPresent)throw Error('Source status owner changed during critical preparation');
  const receipt=Object.freeze({profile:'source-dagger24-cut-constructor1-chance0-empty-conditions',weaponType:24,configuredMultiplier:1,configuredChancePercent:0,effectiveChancePercent:0,probabilityFactor:1,critical:false,
   sourceStatusManagerPresent:this.#defense.statusManagerPresent,sourceConditionSelectors:Object.freeze(this.#defense.statusManagerPresent?[0x152,0x263]:[]),randomInputs:Object.freeze({random15,internalPercentRoll}),
   sourceCriticalPreparationQualified:true,workingPowerProducerQualified:false,nativeRandomStreamQualified:false,nativeReady:false});
  receipts.set(receipt,{owner:this,cut,statusManagerPresent:this.#defense.statusManagerPresent,combatSerial:this.#combat.serial});this.#cuts.set(cut,receipt);return receipt;
  }finally{this.#preparing=false;}
 }
 assertReceipt(receipt){const r=receipts.get(receipt);if(r?.owner!==this)throw Error('Actual owned Dagger cut critical receipt required');this.#cut(r.cut);if(r.combatSerial!==this.#combat.serial)throw Error('Current owned Dagger cut critical receipt required');if(r.statusManagerPresent!==this.#defense.statusManagerPresent)throw Error('Retained source status manager presence required');return receipt;}
 assertSource({controller,defenseState}={}){this.#current();if(controller!==this.#controller||defenseState!==this.#defense)throw Error('Critical preparation must retain the same actual player and condition owner');}
 dispose(){this.#disposed=true;}
}
