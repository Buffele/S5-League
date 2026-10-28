import {conquestMonsterDamageComponents} from './conquest-monster-damage-components.js';
import {CONQUEST_PLAYER_DAMAGE_PROFILES,createConquestMonsterDamageRecord} from './conquest-monster-damage-player.js';
import {CONQUEST_PLAYER_DAMAGE_STATE_SOURCE} from './conquest-player-damage-state-data.js';
const f=Math.fround;
const integer=(value,name)=>{if(!Number.isInteger(value)||value< -0x80000000||value>0x7fffffff)throw new TypeError('Explicit native '+name+' required');return value;};
const bool=(value,name)=>{if(typeof value!=='boolean')throw new TypeError('Explicit native '+name+' required');return value;};

// Distinct source class tables retain their own qualified record semantics.
// Action/mobility classes execute both original record wrappers in the
// player-action-damage-record-20261022 proof (160 cases). D8 differs for the
// attack class; it is a setter, not one of the damage predicates below.
// Their8C and88 are constant false;90 is constant0;34 performs the
// configured input→damage-state lookup (not a fixed empty table).
// 570890→6E8730 supplies input0x30, independently of record.attributeId8.
// Unqualified classes still refuse instead of borrowing ordinary flags.
export function conquestOrdinaryPlayerRecordFlags({vtable,ruleId,state,attributeId,invincible}){
 if(!CONQUEST_PLAYER_DAMAGE_PROFILES[vtable]||ruleId!==12)throw new TypeError('Qualified Conquest player required');
 const source=Number.isInteger(state?.vtable)&&Object.hasOwn(CONQUEST_PLAYER_DAMAGE_STATE_SOURCE,state.vtable)?CONQUEST_PLAYER_DAMAGE_STATE_SOURCE[state.vtable]:null;
 if(!source)throw new TypeError('Actual qualified ordinary/action player state required');
 integer(attributeId,'attributeId');bool(invincible,'target invincibility');
 let damageState=null;
 const field40Qualified=invincible||state.damageStates instanceof Map;
 if(state.damageStates instanceof Map&&state.damageStates.has(0x30))damageState=integer(state.damageStates.get(0x30),'damage-state ID');
 //520450 returns true even without a configured damage-state. Its lookup
 // changes reaction40, not the numeric-damage eligibility flag47.
 return Object.freeze({field44:source.recordField44,field47:source.recordField47,field4a:source.recordField4a,field4d:source.recordField4d,field40:field40Qualified?(invincible||damageState===null?-1:damageState):null,field40Qualified,field80:0,nativeReady:false});
}

// Preserve the strict historical API for callers selecting Normal only.
export function conquestNormalPlayerRecordFlags(context){
 if(context?.state?.vtable!==0x13b5dc4)throw new TypeError('Actual qualified CNormalState required');
 return conquestOrdinaryPlayerRecordFlags(context);
}

// PLAYER13C=51A060. Conquest12 bypasses its duel20 identity branch.
export function conquestPlayerRecordEligibility({vtable,ruleId,targetPhaseId,worldPhase5,rulePhaseId,ruleEngineStateId}){
 if(!CONQUEST_PLAYER_DAMAGE_PROFILES[vtable]||ruleId!==12)throw new TypeError('Qualified Conquest player required');
 integer(targetPhaseId,'player210 phase');bool(worldPhase5,'world phase5');
 if(targetPhaseId===3)return false;
 if(!worldPhase5)return true;
 integer(rulePhaseId,'rule phase');integer(ruleEngineStateId,'rule engine state');
 return rulePhaseId===2&&ruleEngineStateId!==2&&targetPhaseId!==4;
}

// CMonster3C=A04160 returns (controller.byte20==0).570890 can apply862150
// only when that returned boolean is false, hence byte20 must be nonzero.
// Known early exits in that real producer are handled here. Active balancing
// is a different calculation and is rejected instead of accepting a guessed1.
function sourceTeamScale({controllerFlag20,sourceTeam,worldPhase5,ruleInfoPresent,balanceServicePresent}){
 if(!Number.isInteger(controllerFlag20)||controllerFlag20<0||controllerFlag20>255)throw new TypeError('Explicit controller byte20 required');
 if(controllerFlag20===0||sourceTeam===null)return 1;
 if(!sourceTeam||!Number.isInteger(sourceTeam.id)||sourceTeam.id<0||sourceTeam.id>255)throw new TypeError('Actual source team object or null required');
 if(sourceTeam.id!==1&&sourceTeam.id!==2||!worldPhase5)return 1;
 if(!bool(ruleInfoPresent,'rule info10 present'))return 1;
 if(!bool(balanceServicePresent,'balance service5C present'))return 1;
 throw new TypeError('Active native team balancing862150 is not yet qualified');
}

// Final HP-record fields for the specified BOX Pawn/source-NPC/rule12 path.
// Working power, actual target defenses, player state transitions and session
// phase are external state. No raw5/AP/base_attack or four-flag fallback exists.
export function produceConquestPawnPlayerDamageRecord({source,attack,target,session,attributeId,creditOwnerPeerId78}){
 if(source?.vtable!==0x13f0244||source.isLocalPlayer!==false||attack?.profile!=='pawn-normal1003'||attack.shape50!==1||attack.orderedAttenuation2b9!==false)throw new TypeError('Qualified unmodified BOX Pawn NPC attack profile required');
 const flags=conquestOrdinaryPlayerRecordFlags({vtable:target?.vtable,ruleId:session?.ruleId,state:target?.state,attributeId,invincible:target?.invincible});
 const eligible=conquestPlayerRecordEligibility({...session,vtable:target.vtable,targetPhaseId:target.phaseId});
 const defenses=target.defenses;
 const components=conquestMonsterDamageComponents({sourcePeerId:source.peerId,sourceStatusGetter:0xacd900,weaponType:attack.weaponType,rawPower:attack.workingPower,targetDefenseFlat:defenses?.targetDefenseFlat,targetDefenseRate:defenses?.targetDefenseRate,targetReduction:defenses?.targetReduction,partNormalMultiplier:defenses?.partNormalMultiplier,partCriticalMultiplier:defenses?.partCriticalMultiplier,playerPartReduction:defenses?.playerPartReduction});
 // Different normal/critical results require orientation category6E9780. The
 // common-value case is independent of that category, so no category is faked.
 if(components.component0!==components.component1||components.component2!==components.component3)throw new TypeError('Unequal part components require native orientation category6E9780');
 const scale=sourceTeamScale({...session,controllerFlag20:source.controllerFlag20,sourceTeam:source.team});
 let damage=f(components.component0*scale);
 // 574780 permits negative working power through a false13C predicate.
 if(!eligible&&!(f(attack.workingPower)<0))damage=0;
 //570890 does not populate50/5C when target128 (invincibility) is true.
 if(target.invincible)damage=0;
 const record=createConquestMonsterDamageRecord({attributeId,sourcePeerId10:source.peerId,creditOwnerPeerId78,damage50:damage,...flags});
 return Object.freeze({record,components,flags,targetEligible:eligible,contactScale:1,sourceTeamScale:scale,orientationCategoryRequired:false,nativeReady:false});
}
