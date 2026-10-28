import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_PAWN_EXPLODE_SOURCE} from './conquest-pawn-explode-ai.js';
import {prepareConquestAttackRawPower} from './conquest-monster-attack-runtime.js';
import {conquestMonsterDamageComponents} from './conquest-monster-damage-components.js';
import {createConquestMonsterDamageRecord} from './conquest-monster-damage-player.js';
import {conquestOrdinaryPlayerRecordFlags,conquestPlayerRecordEligibility} from './conquest-monster-damage-record.js';
import {conquestPawnExplodeDistanceRate} from './conquest-pawn-explode-sphere.js';
const f=Math.fround,prepared=new WeakMap();
const peer=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff))throw Error('Actual full two-DWORD peer required');return value;};
const bool=(value,name)=>{if(typeof value!=='boolean')throw Error('Explicit '+name+' required');return value;};
export class ConquestPawnExplodeAttackPreparation{
 constructor({nextRandom15,nextInternalPercentRoll}={}){if(![nextRandom15,nextInternalPercentRoll].every(fn=>typeof fn==='function'))throw Error('Separate actual CRT/internal random producers required');this.nextRandom15=nextRandom15;this.nextInternalPercentRoll=nextInternalPercentRoll;this.actor=null;}
 prepare(actor){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||this.actor&&this.actor!==actor)throw Error('Actual retained Pawn Explode1013 preparation owner required');this.actor=actor;
  // CExplosion6012C0 inherits56B210; InitAttack16016A0→56CD80 keeps
  //394=0 and3F4=0. The original CMonster null154 branch still makes BOTH
  //574520 draws at zero chance;573B60 contributes0 without a draw.
  const random15=this.nextRandom15(actor),internalPercentRoll=this.nextInternalPercentRoll(actor);
  if(!Number.isInteger(random15)||random15<0||random15>32767||!Number.isInteger(internalPercentRoll)||internalPercentRoll< -0x80000000||internalPercentRoll>0x7fffffff)throw Error('Actual synchronous native random integer values required');
  const source=CONQUEST_PAWN_EXPLODE_SOURCE.explosion,result=Object.freeze({profile:'pawn-explode1013',shape50:5,weaponType:source.weaponType,attributeId:source.attackAttribute,damageApplyType:2,
   initialPower:source.rawPower,randomAddition:0,probabilityFactor:1,workingPower:prepareConquestAttackRawPower({initialPower:source.rawPower,randomAddition:0,probabilityFactor:1}),
   randomInputs:Object.freeze({random15,internalPercentRoll}),sourceNumericPreparationQualified:true,nativeRandomStreamQualified:false,nativeReady:false});
  prepared.set(result,{owner:this,actor,model:actor.model});return result;
 }
 owns(result,actor){const r=prepared.get(result);return !!r&&r.owner===this&&r.actor===actor&&r.model===actor.model&&this.actor===actor;}
}
function friendlyScale(source,target){
 const a=peer(source.peerId),b=peer(target.peerId);if(a[0]===b[0]&&a[1]===b[1])return f(.5);
 if(source.team===null||target.team===null)return 1;
 for(const team of [source.team,target.team])if(!Number.isInteger(team?.id)||team.id<0||team.id>255)throw Error('Current decoded native team selector or null required');
 if(source.team.id!==target.team.id)return 1;
 if(((b[1]>>>16)&7)===2)throw Error('Same-team subtype2 owner-peer path is not yet qualified');
 return f(.2);
}
function teamScale(source,session){
 if(!Number.isInteger(source.controllerFlag20)||source.controllerFlag20<0||source.controllerFlag20>255)throw Error('Explicit current controller byte20 required');
 if(source.controllerFlag20===0||source.team===null)return 1;
 if(source.team.id!==1&&source.team.id!==2||!session.worldPhase5||!session.ruleInfoPresent||!session.balanceServicePresent)return 1;
 throw Error('Active native team balancing862150 is not yet qualified');
}
// Actual EarthBomber74 has DAMAGEBYPART_DISABLE2, so part0 is used.
//570890 measures center-to-origin for applyType2. It multiplies each
//B8B2A0 component by CExplosion virtual2C601870, then team scale.
export function produceConquestPawnExplodePlayerDamageRecord({source,attack,target,session,distance,creditOwnerPeerId78}){
 if(source?.vtable!==0x13f0244||source.isLocalPlayer!==false||attack?.profile!=='pawn-explode1013'||attack.shape50!==5||attack.damageApplyType!==2||attack.weaponType!==55||attack.attributeId!==74||session?.ruleId!==12)throw Error('Qualified CExplosion1013 source-NPC/rule12 record profile required');
 for(const k of ['worldPhase5','ruleInfoPresent','balanceServicePresent'])bool(session[k],k);
 const flags=conquestOrdinaryPlayerRecordFlags({vtable:target?.vtable,ruleId:12,state:target?.state,attributeId:74,invincible:target?.invincible}),eligible=conquestPlayerRecordEligibility({...session,vtable:target.vtable,targetPhaseId:target.phaseId}),defenses=target.defenses;
 const components=conquestMonsterDamageComponents({sourcePeerId:source.peerId,sourceStatusGetter:0xacd900,weaponType:55,rawPower:attack.workingPower,...defenses});
 if(components.component0!==components.component1||components.component2!==components.component3)throw Error('Unequal part components require native orientation category6E9780');
 //5737D0 only has a special distance branch for applyType3 and shape4/7.
 //CMonster14C=9817E0 returns1 for actual rule12 (its special rule is8).
 const rate=conquestPawnExplodeDistanceRate(distance),friendly=friendlyScale(source,target),contactScale=f(f(1*rate)*friendly),balance=teamScale(source,session);
 let damage=f(f(components.component0*contactScale)*balance);
 if(!eligible&&!(f(attack.workingPower)<0)||target.invincible)damage=0;
 const record=createConquestMonsterDamageRecord({attributeId:74,sourcePeerId10:source.peerId,creditOwnerPeerId78,damage50:damage,...flags});
 return Object.freeze({record,components,flags,targetEligible:eligible,distance:f(distance),distanceRate:rate,friendlyScale:friendly,contactScale,sourceTeamScale:balance,orientationCategoryRequired:false,recordSideEffectsComplete:false,nativeReady:false});
}
