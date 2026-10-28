import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
export const CONQUEST_ROOK_SOURCE=Object.freeze({monsterKey:1100,script:'script/monsterai_rook.lua',scriptSha256:'e05c8bdca844774b7fcb75857e654ae34fb645421129c0a045beb0dba27cb9f8',model:'model/monster/pve_mon_rook.scn',modelSha256:'3bd01351e90bb14f38c77538f7c61a8a7e816ba9bda0f9edc37e57c8e1109b46',deathEffect:'Effects/rook_death.seq',safeArea:'beta_safezone_00',offensiveAttackCount:0,superArmorStates:Object.freeze([0,1,2,3]),canSufferDefenseAura:false,
 aura:Object.freeze({intervalMs:200,radius:1000,defenseFactor:1,effect:'Effects/pve_mon_buf_eff01.seq',componentOffset:0x2e8,constructor:0xb7cf90,configure:0xb7d0a0,tick:0xb7d130,query:0xb7d200}),nativeReady:false});
export function assertConquestRookActor(actor){
 const d=CONQUEST_SOURCE_DATA.monsters[1100],s=CONQUEST_ROOK_SOURCE;
 if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1100||actor.model.monsterKey!==1100||actor.model.source!==s.model||actor.model.nativeSize!==actor.spawnStats.size||actor.aiScriptLiteral.toLowerCase()!==s.script||d.Resources.ai_lua.toLowerCase()!==s.script||d.Scene.value1.toLowerCase()!==s.model||d.Scene.death_effect!==s.deathEffect||d.Sequence.count!=='3'||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated Rook1100 actor/model/stats/script required');
 return actor;
}
