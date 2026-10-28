import {assertConquestKingRuntime} from './conquest-king-runtime.js';
import {assertConquestQueenRuntime} from './conquest-queen-runtime.js';
import {assertConquestRookExplodeRuntime} from './conquest-rook-explode-runtime.js';
import {assertConquestBishopSnipeRuntime} from './conquest-bishop-snipe-runtime.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnRuntime} from './conquest-pawn-runtime.js';
import {assertConquestPawnExplodeRuntime} from './conquest-pawn-explode-runtime.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {assertConquestRookRuntime} from './conquest-rook-runtime.js';
import {assertConquestKnightRuntime} from './conquest-knight-runtime.js';
import {assertConquestKnightChargeRuntime} from './conquest-knight-charge-runtime.js';
import {assertConquestBishopRuntime} from './conquest-bishop-runtime.js';
const owners=new WeakMap();
const common=Object.freeze({0:0x13f1d64,1:0x13f2000,2:0x13f1570,3:0x13f14d4});
export const CONQUEST_HANDGUN_PAWN_VARIANTS=Object.freeze({
 1003:Object.freeze({monsterKey:1003,script:'Script/MonsterAI_Pawn_Normal.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430})}),
 1013:Object.freeze({monsterKey:1013,script:'Script/MonsterAI_Pawn_Explode.lua',criticalPoint:0,deathStateVtable:0x13f16a8,stateTables:Object.freeze({...common,4:0x13f16a8})}),
 1100:Object.freeze({monsterKey:1100,script:'Script/MonsterAI_Rook.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c})}),
 1203:Object.freeze({monsterKey:1203,script:'Script/MonsterAI_Knight_Normal.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430,6:0x13f1430})}),
 1403:Object.freeze({monsterKey:1403,script:'Script/MonsterAI_Queen_Normal.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430,6:0x13f1430})}),
 1500:Object.freeze({monsterKey:1500,script:'Script/MonsterAI_King.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430,8:0x13f1f4c,9:0x13f18c8,10:0x13f1cc0})}),
 1204:Object.freeze({monsterKey:1204,script:'Script/MonsterAI_Knight_Charge.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430,6:0x13f1430})}),
 1110:Object.freeze({monsterKey:1110,script:'Script/MonsterAI_Rook_Explode.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430})}),
 1303:Object.freeze({monsterKey:1303,script:'Script/MonsterAI_Bishop_Normal.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430})}),
 1314:Object.freeze({monsterKey:1314,script:'Script/MonsterAI_Bishop_Snipe.lua',criticalPoint:0,deathStateVtable:0x13f179c,stateTables:Object.freeze({...common,4:0x13f179c,5:0x13f1430})}),
});
// Actual Pawn/Rook/Knight groups use concrete CMonsterA01170. It initializes
//2F8=null; A01B30 only creates the detailed-volume object when the actual
//XML critical_point byte276 is nonzero. These authenticated variants are0.
export function assertConquestHandgunPawnVariant({actor,runtime}={}){
 const key=actor?.spawnStats?.monsterKey,profile=CONQUEST_HANDGUN_PAWN_VARIANTS[key],source=CONQUEST_SOURCE_DATA.monsters[key],descriptor=CONQUEST_RENDER_DATA.monsters[key];
 if(!(actor instanceof ConquestMonsterActor)||!profile||actor.model.monsterKey!==key||actor.model.source!==descriptor?.scene||actor.model.nativeSize!==actor.spawnStats.size||actor.aiScriptLiteral!==profile.script||source?.Resources.ai_lua!==profile.script||Number(source.Ability.critical_point)!==0||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated Pawn1003/Explode1013 target variant required');
 const retained=owners.get(actor);if(retained&&(retained.model!==actor.model||retained.stats!==actor.spawnStats||retained.key!==key))throw Error('Replaced or relabelled Pawn Handgun target source owner');
 if(!retained)owners.set(actor,{model:actor.model,stats:actor.spawnStats,key});
 if(runtime!==undefined){if(key===1003){if(!(runtime instanceof ConquestPawnRuntime))throw Error('Actual Normal1003 runtime required');}else if(key===1013)assertConquestPawnExplodeRuntime(runtime,{actor});else if(key===1100)assertConquestRookRuntime(runtime,{actor});else if(key===1203)assertConquestKnightRuntime(runtime,{actor});else if(key===1204)assertConquestKnightChargeRuntime(runtime,{actor});else if(key===1403)assertConquestQueenRuntime(runtime,{actor});else if(key===1500)assertConquestKingRuntime(runtime,{actor});else if(key===1110)assertConquestRookExplodeRuntime(runtime,{actor});else if(key===1314)assertConquestBishopSnipeRuntime(runtime,{actor});else assertConquestBishopRuntime(runtime,{actor});runtime.assertActor(actor);}
 return profile;
}
