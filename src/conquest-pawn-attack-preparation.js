import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_PAWN_ATTACK_CONTACT,prepareConquestAttackRawPower} from './conquest-monster-attack-runtime.js';
import {CONQUEST_PAWN_SOURCE_ATTACK_ENUMS} from './conquest-pawn-ai-runtime-constants.js';

const prepared=new WeakMap();
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);

// One producer per original CAttack. Its random services retain their own
// streams; identical numeric outcomes do not permit skipping source draws.
export class ConquestPawnAttackPreparation{
 constructor({nextRandom15,nextInternalPercentRoll}={}){
  if(![nextRandom15,nextInternalPercentRoll].every(synchronous))throw Error('Explicit synchronous CRT and per-attack random streams required');
  this.nextRandom15=nextRandom15;this.nextInternalPercentRoll=nextInternalPercentRoll;this.actor=null;
 }
 prepare(actor){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1003||actor.model.monsterKey!==1003)throw Error('Actual ordinary Pawn1003 actor required');
  if(this.actor&&this.actor!==actor)throw Error('Pawn attack preparation belongs to a different actor');
  this.actor=actor;
  //573B60 sees constructor394==0: addition0, no random draw.574520 sees
  //CMonster154==null and constructor3F4==0. It still draws CRT then internal
  //PRNG, but its two strict inequalities cannot both hold at chance0.
  const random15=this.nextRandom15(actor);
  if(!Number.isInteger(random15)||random15<0||random15>32767)throw Error('Actual CRT rand15 result required');
  const internalPercentRoll=this.nextInternalPercentRoll(actor);
  if(!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual signed per-attack random result required');
  const initialPower=CONQUEST_PAWN_ATTACK_CONTACT.rawPower,randomAddition=0,probabilityFactor=1;
  const result=Object.freeze({profile:'pawn-normal1003',shape50:1,orderedAttenuation2b9:false,
   weaponType:CONQUEST_PAWN_SOURCE_ATTACK_ENUMS.weaponType,attributeId:CONQUEST_PAWN_SOURCE_ATTACK_ENUMS.attackAttribute,
   initialPower,randomAddition,probabilityFactor,workingPower:prepareConquestAttackRawPower({initialPower,randomAddition,probabilityFactor}),
   randomInputs:Object.freeze({random15,internalPercentRoll}),sourceNumericPreparationQualified:true,nativeRandomStreamQualified:false,nativeReady:false});
  prepared.set(result,{owner:this,actor});return result;
 }
 owns(result,actor){const receipt=prepared.get(result);return !!receipt&&receipt.owner===this&&receipt.actor===actor&&this.actor===actor;}
}
