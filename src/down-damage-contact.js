import {meleeRuntimeContact} from './melee-runtime.js';
import {frontRangedRecordDirection} from './ranged-victim-push.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// Direction-only source closure: canonical attackattribindexer + each of the
//13 authenticated attack Lua files. No CollisionRangeAdjust override; default
//InitAttack1 true/true selects actual source actor position. This proves neither
//native collisions nor equipment/condition admission. VitalShock has no eligible
//ordinary positive contact. Unknown attributes/critical/fallbacks stay outside.
const attributes=new Set([
 'PLASMA_SWORD_STAND_WEAK','PLASMA_SWORD_ATTACK2_WEAK','PLASMA_SWORD_ATTACK2',
 'COUNTER_SWORD_ATTACK1','COUNTER_SWORD_ATTACK2','COUNTER_SWORD_ATTACK3','COUNTER_SWORD_ATTACK4','COUNTER_SWORD_JUMPDASH',
 'SPYDAGGER_ATTACK1','SPYDAGGER_ATTACK2','BREAKER_SWORD_JUMPDASH',
 'KATANA_A_SWORD_ATTACK1','KATANA_A_SWORD_ATTACK2','KATANA_A_SWORD_JUMPDASH','KATANA_A_SWORD_JUMPDASH_STAGGER',
 'DOUBLE_SWORD_ATTACK1','DOUBLE_SWORD_ATTACK3','BAT_SWORD_JUMP','IRON_BOOTS_UPPER_KICK_ATTACK','ASSASSIN_CLAW',
 'SIGMA_BLADE_ATTACK1','SIGMA_BLADE_COUNTER_CRITICAL','SIGMA_BLADE_COUNTER_ATTACK','SIGMA_BLADE_JUMPDASH',
 'DEATH_SCYTHE_ATTACK_1','DEATH_SCYTHE_ATTACK_2','DEATH_SCYTHE_SP_RIGHT_ATTACK',
 'DEMONIC_KNUCKLE_LEFT_ATTACK','DEMONIC_KNUCKLE_LEFT_ATTACK2',
].map(s=>'ATTACKATTRIB_'+s));
const counterAttributes={CounterSwordLight1:'ATTACKATTRIB_COUNTER_SWORD_ATTACK1',CounterSwordLight2:'ATTACKATTRIB_COUNTER_SWORD_ATTACK2',CounterSwordLight3:'ATTACKATTRIB_COUNTER_SWORD_ATTACK3',CounterSwordLight4:'ATTACKATTRIB_COUNTER_SWORD_ATTACK4',CounterSwordJumpAttack:'ATTACKATTRIB_COUNTER_SWORD_JUMPDASH'};
const meleeWeapons=new Set(['plasma','counter','dagger','breaker','katana','twinblade','bat','ironboots','assassinclaw','sigmablade','vitalshock','deathscythe','demonicknuckle']);
export function downDamageSourceContact(attack,contact=meleeRuntimeContact(attack)){
 if(!meleeWeapons.has(attack?.weapon)||!contact||contact.critical===true)return false;
 const duration=contact.reaction?.sourceDamageData?.[0];
 if(!Number.isInteger(duration)||duration<=0||duration>0xffffffff)return false;
 const conditions=[...(contact.conditions??[]),...(contact.sourceConditions??[]),contact.condition].filter(Boolean);
 if(conditions.some(c=>c.type!=='push'))return false;
 const attribute=contact.attribute??contact.source?.attribute??(attack.weapon==='counter'?counterAttributes[contact.source?.function]:null);
 return attributes.has(attribute);
}
export function receivedDownDamageDirection({state,avatar,attack,profile,source,victim}){
 if(![14,20].includes(state.blowReaction?.stateId)||!meleeWeapons.has(victim.weapon)||profile.reaction==='none'||profile.stun||profile.blow||!downDamageSourceContact(attack))return null;
 const duration=avatar?.actions?.get('00023')?.getClip()?.duration;
 if(!Number.isFinite(duration)||duration<=0)return null;
 const native=v=>({x:v.x/SCN_SCENE_SCALE,y:v.y/SCN_SCENE_SCALE,z:v.z/SCN_SCENE_SCALE});
 // Do not negate this vector: the signed Float112 multiplier supplies the
 // Down20 direction. Push applies its own separate negation/clock elsewhere.
 return frontRangedRecordDirection(native(source.position),native(victim.position),{x:Math.sin(victim.facing),y:0,z:Math.cos(victim.facing)});
}
