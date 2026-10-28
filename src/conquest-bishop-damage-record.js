import {assertConquestBishopActor} from './conquest-bishop-ai.js';
import {assertConquestBishopAttackDeclaration} from './conquest-bishop-attack.js';
import {prepareConquestAttackRawPower} from './conquest-monster-attack-runtime.js';
import {conquestMonsterDamageComponents} from './conquest-monster-damage-components.js';
import {createConquestMonsterDamageRecord} from './conquest-monster-damage-player.js';
import {conquestOrdinaryPlayerRecordFlags,conquestPlayerRecordEligibility} from './conquest-monster-damage-record.js';
const f=Math.fround,prepared=new WeakMap();
export class ConquestBishopAttackPreparation{
 constructor({nextRandom15,nextInternalPercentRoll}={}){if(![nextRandom15,nextInternalPercentRoll].every(fn=>typeof fn==='function'))throw Error('Separate actual CRT and per-CAttack random producers required');this.nextRandom15=nextRandom15;this.nextInternalPercentRoll=nextInternalPercentRoll;this.actor=null;}
 prepare(actor,attack){
  assertConquestBishopActor(actor);assertConquestBishopAttackDeclaration(attack);if(this.actor&&this.actor!==actor)throw Error('Bishop preparation belongs to another actor');this.actor=actor;
  const random15=this.nextRandom15({actor,attack});if(!Number.isInteger(random15)||random15<0||random15>32767)throw Error('Actual CRT rand15 required');
  const internalPercentRoll=this.nextInternalPercentRoll({actor,attack});if(!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual signed per-CAttack random value required');
  const value=Object.freeze({profile:'bishop1303',attackId:attack.id,shape50:7,weaponType:60,sourceApplyType3D0:0,attributeId:attack.attributeId,initialPower:attack.rawPower,randomAddition:0,probabilityFactor:1,
   workingPower:prepareConquestAttackRawPower({initialPower:attack.rawPower,randomAddition:0,probabilityFactor:1}),randomInputs:Object.freeze({random15,internalPercentRoll}),sourceNumericPreparationQualified:true,nativeRandomStreamQualified:false,nativeReady:false});
  prepared.set(value,{owner:this,actor,model:actor.model,attack});return value;
 }
 owns(value,actor,attack){const p=prepared.get(value);return !!p&&p.owner===this&&p.actor===actor&&p.model===actor.model&&p.attack===attack&&this.actor===actor;}
}
function scale(source,session){
 const flag=source.controllerFlag20;if(!Number.isInteger(flag)||flag<0||flag>255)throw Error('Explicit Bishop source controller byte20 required');if(flag===0||source.team===null)return 1;
 if(!Number.isInteger(source.team?.id)||source.team.id<0||source.team.id>255)throw Error('Actual Bishop source team selector or null required');
 if(source.team.id!==1&&source.team.id!==2||!session.worldPhase5||!session.ruleInfoPresent||!session.balanceServicePresent)return 1;
 throw Error('Active native team balancing862150 is not yet qualified');
}
// Authenticated PVE_BISHOP152 has SetDamageData(250,2,2): part0.
// Raw attack20 enters original preparation; XML AP50/base_attack500 do not.
export function produceConquestBishopPlayerDamageRecord({source,attack,target,session,creditOwnerPeerId78}){
 if(!prepared.has(attack))throw Error('Actual retained Bishop source preparation required');
 if(source?.vtable!==0x13f0244||source.isLocalPlayer!==false||attack?.profile!=='bishop1303'||attack.shape50!==7||attack.sourceApplyType3D0!==0||attack.weaponType!==60||attack.attributeId!==152||session?.ruleId!==12)throw Error('Qualified actual Bishop1303 CAttack/rule12 source profile required');
 for(const k of ['worldPhase5','ruleInfoPresent','balanceServicePresent'])if(typeof session[k]!=='boolean')throw Error('Explicit current '+k+' required');
 const flags=conquestOrdinaryPlayerRecordFlags({vtable:target?.vtable,ruleId:12,state:target?.state,attributeId:attack.attributeId,invincible:target?.invincible}),eligible=conquestPlayerRecordEligibility({...session,vtable:target.vtable,targetPhaseId:target.phaseId}),d=target.defenses;
 const components=conquestMonsterDamageComponents({sourcePeerId:source.peerId,sourceStatusGetter:0xacd900,weaponType:60,rawPower:attack.workingPower,targetDefenseFlat:d?.targetDefenseFlat,targetDefenseRate:d?.targetDefenseRate,targetReduction:d?.targetReduction,partNormalMultiplier:d?.partNormalMultiplier,partCriticalMultiplier:d?.partCriticalMultiplier,playerPartReduction:d?.playerPartReduction});
 if(components.component0!==components.component1||components.component2!==components.component3)throw Error('Unequal part components require native orientation category6E9780');
 // Original ctor56BC4C sets applyType3D0=0; Bishop has no override.
 // Full5737D0/type7 returns float47=1 times CMonster9817E0(rule12)=1.
 // This does not admit the different type7/applyType3 dropoff branch.
 const teamScale=scale(source,session);let damage=f(components.component0*teamScale);if(!eligible&&!(f(attack.workingPower)<0)||target.invincible)damage=0;
 const record=createConquestMonsterDamageRecord({attributeId:attack.attributeId,sourcePeerId10:source.peerId,creditOwnerPeerId78,damage50:damage,...flags});
 return Object.freeze({record,components,flags,targetEligible:eligible,contactScale:1,sourceTeamScale:teamScale,recordSideEffectsComplete:false,nativeReady:false});
}
