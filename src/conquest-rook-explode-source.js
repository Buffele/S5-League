import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_ROOK_EXPLODE_SOURCE} from './conquest-rook-explode-source-data.js';
export {CONQUEST_ROOK_EXPLODE_SOURCE,CONQUEST_ROOK_EXPLODE_ATTACK_STATES} from './conquest-rook-explode-source-data.js';
const actors=new WeakMap();
export function assertConquestRookExplodeActor(actor){
 const s=CONQUEST_ROOK_EXPLODE_SOURCE,d=CONQUEST_SOURCE_DATA.monsters[1110],model=actor?.model,stats=actor?.spawnStats;
 if(!(actor instanceof ConquestMonsterActor)||stats.monsterKey!==1110||model.monsterKey!==1110||model.source!==s.model||model.nativeSize!==stats.size||actor.aiScriptLiteral!==d.Resources.ai_lua||actor.aiScriptLiteral.toLowerCase()!==s.script||d.base.monster_group_key!=='1100'||d.Scene.death_effect!=='Effects/rook_death.seq'||d.Sequence.count!=='3'||CONQUEST_SOURCE_DATA.sourceHashes[s.script]!==s.scriptSha256||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated RookExplode1110 actor/model/XML/script required');
 const previous=actors.get(actor);if(previous&&(previous.model!==model||previous.stats!==stats||previous.id!==actor.id))throw Error('Replaced RookExplode source owner');if(!previous)actors.set(actor,{model,stats,id:actor.id});return actor;
}
