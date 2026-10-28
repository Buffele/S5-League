import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
const owners=new WeakMap(),receipts=new WeakMap(),actors=new WeakMap();
const scripts=Object.freeze({1003:'Script/MonsterAI_Pawn_Normal.lua',1013:'Script/MonsterAI_Pawn_Explode.lua',1100:'Script/MonsterAI_Rook.lua',1110:'Script/MonsterAI_Rook_Explode.lua',1203:'Script/MonsterAI_Knight_Normal.lua',1204:'Script/MonsterAI_Knight_Charge.lua',1303:'Script/MonsterAI_Bishop_Normal.lua',1314:'Script/MonsterAI_Bishop_Snipe.lua',1403:'Script/MonsterAI_Queen_Normal.lua',1500:'Script/MonsterAI_King.lua'});
function sourceActor(actor){const key=actor?.spawnStats?.monsterKey,source=CONQUEST_SOURCE_DATA.monsters[key],descriptor=CONQUEST_RENDER_DATA.monsters[key];if(!(actor instanceof ConquestMonsterActor)||!scripts[key]||actor.model?.monsterKey!==key||actor.aiScriptLiteral!==scripts[key]||source.Resources.ai_lua!==scripts[key]||actor.model.source!==descriptor.scene||source.Scene.value1.toLowerCase()!==descriptor.scene||actor.model.nativeSize!==actor.spawnStats.size||!actor.model.group?.isObject3D||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual source-qualified defense-aura monster required');return key;}
// CMonster ctor A01534..A0153E initializes35B=true. Rook1100 and King1500
// explicitly call SetCanSufferDefenseAura(false), through A09450.
// This owner retains that native field independently of HP/DP/eligibility.
export function createConquestMonsterDefenseAuraFields({actor,readCurrentActor}={}){
 const key=sourceActor(actor),model=actor.model,stats=actor.spawnStats;if(typeof readCurrentActor!=='function'||actors.has(actor))throw Error('Distinct current defense-aura actor owner required');let disposed=false;
 const value=key!==1100&&key!==1500;
 function live(){if(disposed||readCurrentActor()!==actor||actor.model!==model||actor.spawnStats!==stats||actors.get(actor)!==owner||sourceActor(actor)!==key)throw Error('Current owned defense-aura35B fields required');}
 const owner=Object.freeze({
  read(){live();const receipt=Object.freeze({kind:'conquest-owned-monster-defense-aura-fields',actor,monsterKey:key,canSufferDefenseAura35B:value,sourceConstructor:0xa01170,sourceWrite:0xa01537,sourceSetter:!value?0xa09450:null,sourceFieldQualified:true,conditionApplicationQualified:false,nativeReady:false});receipts.set(receipt,{owner,actor,live});return receipt;},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===owner)actors.delete(actor);},
 });owners.set(owner,{actor,live});actors.set(actor,owner);try{live();}catch(error){owner.dispose();throw error;}return owner;
}
export function assertConquestMonsterDefenseAuraFields(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual defense-aura35B owner required');r.live();return owner;}
export function assertConquestMonsterDefenseAuraFieldReceipt(receipt,{owner,actor}={}){const r=receipts.get(receipt);if(!r||r.owner!==owner||r.actor!==actor)throw Error('Current typed defense-aura35B receipt required');r.live();return receipt;}
