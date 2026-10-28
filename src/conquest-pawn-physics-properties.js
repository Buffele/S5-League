import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {SOURCE_MOVEMENT} from './movement-profile.js';
import {CONQUEST_MONSTER_MOVEMENT_SOURCE_CLASSES} from './conquest-monster-movement-source-data.js';

const retained=new WeakMap(),f=Math.fround;
//97BF00 sets actor2C[15F4550]=true, then copies GameTempo18/19 via
//1053CF0 (NOT float constants18/19). Authenticated FREE/CLUB rows both
//contain -7500; LT5 contains -5000. S5 already explicitly selects FREE.
//The native Conquest room's tempo selection/overrides remain unmeasured.
export const CONQUEST_PAWN_PHYSICS_PROFILE=Object.freeze({
 profile:'s5-current-free-pawn-physics',s5TempoProfile:'GAMETEMPO_FREE',
 physicsEnabled:true,gravity:f(-7500),terminalVelocity:f(-7500),
 propertyKeys:Object.freeze({physicsEnabled:0x15f4550,gravity:0x15f4558,terminalVelocity:0x15f455c}),
 sourceConstructor:0x97bf00,sourceVirtualTable:0x13f0244,sourceVerticalTick:0xa033d0,
 sourceConstantInfoSha256:'b7117d79b6c5ea04f8d991188824964234acb5af1276729ac2c9f2aea4c17c5a',
 sourcePropertyInitializationQualified:true,nativeConquestTempoSelectionQualified:false,nativeReady:false,
});

// Each admitted source class uses the original CMonster constructor/table.
// This admits its shared physical/path/navigation body only. The legacy Pawn
// API name does not admit Pawn AI/attacks/reactions for Rook, Knight or Explode.
export function assertConquestPawnMovementSourceActor(actor){
 const key=actor?.spawnStats?.monsterKey,qualifiedClass=CONQUEST_MONSTER_MOVEMENT_SOURCE_CLASSES[key],script=qualifiedClass?.script;
 const source=CONQUEST_SOURCE_DATA.monsters[key],descriptor=CONQUEST_RENDER_DATA.monsters[key],model=actor?.model,stats=actor?.spawnStats;
 if(!(actor instanceof ConquestMonsterActor)||!script||model?.monsterKey!==key||model.source!==descriptor.scene||!model.group?.isObject3D||model.nativeSize!==stats.size||actor.aiScriptLiteral!==script||source.Resources.ai_lua!==script||source.Scene.value1.toLowerCase()!==descriptor.scene||descriptor.scene!==qualifiedClass.scene||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated CMonster1003/1013/1100/1203/1204/1303/1314 actor/model/stats/script required');
 return actor;
}
export function readConquestPawnPhysicsProperties(actor){
 assertConquestPawnMovementSourceActor(actor);
 const model=actor.model,stats=actor.spawnStats,p=CONQUEST_PAWN_PHYSICS_PROFILE;
 if(SOURCE_MOVEMENT.profile!==p.s5TempoProfile||S5RUNTIME_NATIVE_PHYSICS.profile!==p.s5TempoProfile||f(S5RUNTIME_NATIVE_PHYSICS.values.gravity)!==p.gravity||f(S5RUNTIME_NATIVE_PHYSICS.values.max_gravity_velocity)!==p.terminalVelocity||f(-SOURCE_MOVEMENT.gravity)!==p.gravity||f(-SOURCE_MOVEMENT.terminal)!==p.terminalVelocity)throw Error('Explicit current S5 FREE physics profile required');
 const prior=retained.get(actor);
 if(prior&&(prior.model!==model||prior.stats!==stats))throw Error('Stale or replaced Pawn physics source owner');
 if(!prior)retained.set(actor,{model,stats});
 //HP, state input, eligibleVirtual44 and33C do not gate97DFD0. A dying
 //actor continues its vertical update while its actual owner retains it.
 return Object.freeze({qualified:true,physicsEnabled:p.physicsEnabled,terminalVelocity:p.terminalVelocity,gravity:p.gravity,
  profile:p.profile,s5TempoProfile:p.s5TempoProfile,sourcePropertyInitializationQualified:true,
  nativeConquestTempoSelectionQualified:false,nativeReady:false});
}

