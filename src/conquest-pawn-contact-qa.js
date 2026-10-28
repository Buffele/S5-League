import {readAsset} from './scene-assets.js';
import {CombatState} from './combat-state.js';
import {createConquestMonsterModel} from './conquest-monster-model.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {conquestSpawnStats} from './conquest-monster-stats.js';
import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestAttackActorRegistry} from './conquest-monster-attack-actors.js';
import {createConquestAttackSideContext,createConquestPlayerAttackProfile,readConquestPlayerAttackProfile,
 readConquestMonsterAttackFields,invalidateConquestPlayerAttackProfile} from './conquest-player-attack-profile.js';
import {createInitialConquestPlayerDefenseState} from './conquest-player-defense.js';
import {ConquestPawnAttackPreparation} from './conquest-pawn-attack-preparation.js';
import {ConquestPawnAttackContactRuntime} from './conquest-monster-attack-runtime.js';
import {createConquestAttackWorldQueries,CONQUEST_ATTACK_WORLD_MATH_PROFILE} from './conquest-attack-world-queries.js';
import {ConquestPawnPlayerCombat} from './conquest-pawn-player-combat.js';

// An explicit main-game QA encounter: actual map, Controller, avatar, Pawn,
// animation, geometry, record producer and HP owner. Placement, initial phase,
// fresh equipment state, RNG and enabled predicates are declared arrangements.
// This is not a wave/AI implementation or a live native-comparison receipt.
export async function createConquestPawnContactQA({scene,world,controller,avatar,timeMs=301}={}){
 if(!scene?.isScene||world?.nativeMapId!==46||controller?.world!==world||!avatar?.group?.isObject3D||!Number.isInteger(timeMs)||timeMs<0||timeMs>670)throw Error('Actual Conquest main scene/player/avatar and QA time0..670ms required');
 const health=new CombatState(),playerId='local',playerVtable=0x13c1c14;
 const record={controller,combatState:health,model:avatar},players=new Map([[playerId,record]]),teamEntries=new Map([[1,{}],[2,{}]]);
 const bridge=new ConquestRuntimeBridge({participants:[{accountId:1n,team:1}],round:1,recallSelection:0,isHost:true});
 let model,registry,profile,worldQueries,combat,runtime,damageBinding,actor,attackAction,disposed=false,last=null,elapsedMs=0;
 try{
  const data=await readAsset('/assets/s5runtime/conquest/models/pve_mon_pawn.json'),stats=conquestSpawnStats(1003,[0,32767,0,0]);
  model=await createConquestMonsterModel(data,{monsterKey:1003,size:stats.size});scene.add(model.group);
  const p=controller.position;
  actor=new ConquestMonsterActor({id:'qa-conquest-pawn',model,nativeStats:stats,team:2,teamRegistry:new Set([2]),team1Count:1,
   position:{x:Math.fround(p.x/.006),y:Math.fround(p.y/.006),z:Math.fround(p.z/.006-200)}});
  actor.setNativeFacingDirection({x:0,y:0,z:1});
  // Registry insertion is an explicit arranged birth, not a forged source
  // scheduler event. A future real wave supplies its actor via consumeSpawn.
  bridge.actors.set(actor.id,actor);
  const side=createConquestAttackSideContext({ruleId:12,playerActors:players,playerTeamSelectors:new Map([[playerId,1]]),teamEntries,referencePlayerId:playerId});
  profile=createConquestPlayerAttackProfile({playerId,playerActors:players,record,worldOwner:world,renderOwner:scene,sideContext:side,selection:'source-constructed-player-actions'});
  registry=new ConquestAttackActorRegistry({worldOwner:world,renderOwner:scene,monsterActors:bridge.actors,playerActors:players});
  const sourceBinding=registry.bindMonster({identity:actor.id,actorId:actor.id,actor,peerId2c:[1,6<<16],readSourceFields:()=>readConquestMonsterAttackFields({actorId:actor.id,actor,monsterActors:bridge.actors,sideContext:side})});
  const playerBinding=registry.bindPlayer({identity:playerId,playerId,record,peerId2c:[2,1<<16],vtable:playerVtable,readSourceFields:()=>readConquestPlayerAttackProfile(profile)});
  const pool=registry.createFirstPool({identity:'qa-local-player-pool',tag:1});registry.append(playerBinding,{registry:'first',pool});registry.append(sourceBinding,{registry:'third'});
  // This QA owns just this player and Pawn, with no active shield. Preserve
  // the declaration in the public snapshot; no empty native list is claimed.
  worldQueries=createConquestAttackWorldQueries({world,revision:'main-pawn-contact-qa',mathProfile:CONQUEST_ATTACK_WORLD_MATH_PROFILE,
   readCurrentCollections:()=>controller.s5runtimeShieldActorProfile||controller.s5runtimeShieldBodyState?{qualified:false}:{qualified:true,category400:{complete:true,records:[]}},
   readManagerContext:()=>({qualified:true,managerFlag20:false})});
  if(!worldQueries.prepare().prepared)throw Error('QA world query preparation failed: '+worldQueries.snapshot().lastReason);
  damageBinding=bridge.bindPlayerDamageReceiver(playerId,{target:health,vtable:playerVtable,ruleId:12,maxHp:100,slot44:true,slot4c:false});
  const defenseState=createInitialConquestPlayerDefenseState({playerVtable});
  combat=new ConquestPawnPlayerCombat({bridge,registry,sourceBinding,preparation:new ConquestPawnAttackPreparation({nextRandom15:()=>0,nextInternalPercentRoll:()=>0}),world,worldQueries,
   readSessionContext:()=>({ruleId:12,worldPhase5:false,rulePhaseId:2,ruleEngineStateId:0,ruleInfoPresent:false,balanceServicePresent:false}),
   readSourceContext:()=>({controllerFlag20:0,team:{id:2},creditOwnerPeerId78:[3,1<<16]}),
   orientDirection280:true,placeOrigin281:true,excludeSubtype2:false,omitSecondRegistry:false,excludeSubtype5:false,excludePeerSubtype2:false});
  combat.bindPlayerTarget({actorBinding:playerBinding,damageBinding,defenseState,readContext:()=>({phaseId:0,invincible:false,slot4c:false,maxHp:100})});
  runtime=new ConquestPawnAttackContactRuntime(combat.ports);runtime.enter(actor);attackAction=model.playSourceState('attack0');
  while(elapsedMs<timeMs){const delta=Math.min(16,timeMs-elapsedMs),step=runtime.tick(delta,{enabled:true,collisionAllowed:true});if(step.queried)last=step;model.update(delta/1000);elapsedMs+=delta;}
 }catch(error){cleanup();throw error;}
 function cleanup(){
  runtime?.exit();combat?.dispose?.();registry?.dispose();worldQueries?.dispose();
  if(profile)invalidateConquestPlayerAttackProfile(profile);
  if(damageBinding)bridge.unbindPlayerDamageReceiver(damageBinding);
  bridge.actors.clear();model?.dispose();
 }
 return {health,actor,bridge,worldQueries,
  snapshot(){return {scenario:'conquest-pawn-contact',arrangedScenario:true,elapsedMs,hp:health.hp,dead:health.dead,
   actorId:actor.id,actorPosition:{...actor.positionNative},clip:attackAction?.getClip().name??null,
   queried:last?.queried??false,result:last?{status:last.result.status,contactCount:last.contacts.length,
    deliveries:(last.result.deliveries??[]).map(delivery=>({targetIdentity:delivery.targetIdentity,damage:delivery.produced.record.damage50,accepted:delivery.result.accepted})),
    blockedCount:last.result.blocked?.length??0,recordSideEffectsComplete:last.result.recordSideEffectsComplete??false}:null,sourceWorld:worldQueries.snapshot(),
   sourceAIUsed:false,mainModeIntegrated:false,nativeLiveCompared:false,nativeReady:false,
   arrangements:['Pawn/player relative placement','Fresh player defense state and initial phase','Deterministic external RNG services','Attack enabled predicates','Manager flag and currently empty shield collection','Initial attack orientation flags']};},
  dispose(){if(disposed)return;disposed=true;cleanup();},
 };
}
