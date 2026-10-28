import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {ConquestPawnNavigation} from './conquest-pawn-navigation.js';
import {ConquestPawnExplodeAIRuntime} from './conquest-pawn-explode-ai.js';
import {ConquestPawnPath} from './conquest-pawn-path.js';
import {assertConquestNavigationWorldQueries} from './conquest-navigation-world-queries.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestPawnExplodeReactions} from './conquest-pawn-explode-reactions.js';
import {assertConquestPawnMapAI} from './conquest-pawn-map-ai.js';

// Explosive1013 AI with its own authored policy and typed reactions. Shared CMonster navigation only.
// Per-actor composition for ConquestSession's separate AI and actor-tail
// phases. The world/provider, authority and path have their own lifecycles;
// this owner cannot replace them with a closest ray, free route or shadow actor.
export class ConquestPawnExplodeAIHost {
 constructor({actor,monsterActors,actorAuthority,world,worldQueries,path,readGrounded,mainPattern,spawnBase,reactions,mapAI,additionalBindings={}}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||monsterActors?.get(actor.id)!==actor||!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor||!(path instanceof ConquestPawnPath)||path.actor!==actor||path.monsterActors!==monsterActors||typeof readGrounded!=='function')throw Error('Current owned Pawn, actor authority, path, grounded producer and world required');
  assertConquestNavigationWorldQueries(worldQueries,{world});
  const sourceMainPattern=Number(CONQUEST_SOURCE_DATA.monsters[1013].base.monster_main_pattern);
  if(!Number.isInteger(sourceMainPattern)||![0,1,2,3].includes(sourceMainPattern)||mainPattern!==undefined&&mainPattern!==sourceMainPattern)throw Error('Actual Pawn source monster_main_pattern required; diagnostic AI selection cannot replace its authored pattern');
  if(Object.keys(additionalBindings).some(key=>key in ConquestPawnNavigation.prototype||['nearestActor','goalPosition','rakeMoveSpeedRate','distanceToActor','direction2To1','findPath'].includes(key)))throw Error('Owned Pawn navigation bindings cannot be replaced');
  if(reactions!==undefined)assertConquestPawnExplodeReactions(reactions,{actor});
  if(mapAI!==undefined){assertConquestPawnMapAI(mapAI,{world,actorAuthority});if(Object.keys(additionalBindings).some(key=>key in mapAI.bindings))throw Error('Owned Pawn map AI bindings cannot be replaced');}
  this.actor=actor;this.monsterActors=monsterActors;this.authority=actorAuthority;this.world=world;this.worldQueries=worldQueries;this.path=path;this.reactions=reactions;this.mapAI=mapAI;this.disposed=false;this.fault=null;
  this.navigation=new ConquestPawnNavigation({actor,monsterActors,pathPorts:path.pathPorts,perceptionPorts:actorAuthority.perceptionPorts,
   ports:{...actorAuthority.navigationPorts,...path.navigationPorts,readGrounded:owner=>{this.assertLive();if(owner!==actor)throw Error('Owned grounded actor required');const result=readGrounded(owner);if(typeof result!=='boolean')throw Error('Current retained native solver grounded flag required');return result;},
    probeNavigationSegment:request=>{this.assertLive();assertConquestNavigationWorldQueries(worldQueries,{world});return worldQueries.probeSegment(request);}}});
  this.ai=new ConquestPawnExplodeAIRuntime({actor,mainPattern:sourceMainPattern,spawnBase,bindings:{...additionalBindings,...mapAI?.bindings,...this.navigation.bindings,
   // Read the live target held by this navigation owner, including the initial
   // invalid identity. Do not replace this Lua read with a constant null.
   targetActor:owner=>{this.assertLive();this.navigation.assertActor(owner);return actorAuthority.lookupFullIdentity(this.navigation.targetIdentity);}},actorPorts:this.navigation.actorPorts,readCurrentActor:()=>monsterActors.get(actor.id)});
  // Historical port name from the move-command adapter. Original9FE910
  // actually calls9FEFC0 SetWaitTime(0) on actor+238; it does not clear the
  // state manager's queued inputs. Share the very counter advanced above.
  this.commandPorts=Object.freeze({clearNativeInput:target=>{
   this.assertLive();if(target!==actor)throw Error('Actual owned Pawn move completion required');
   this.ai.setWaitTime(0);
  }});
 }
 assertLive(){if(this.disposed||this.fault||this.monsterActors.get(this.actor.id)!==this.actor||this.authority.actor(this.actor.id)!==this.actor)throw Error('Live owned Pawn AI host required'+(this.fault?': '+this.fault:''));if(this.mapAI)assertConquestPawnMapAI(this.mapAI,{world:this.world,actorAuthority:this.authority});}
 tickAI(deltaMs,{gameTime,isHost}={}){this.assertLive();try{
  if(![deltaMs,gameTime].every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff)||typeof isHost!=='boolean')throw Error('Exact uint32 Pawn AI clocks and explicit host role required');
  // A23B40's host Death producer precedes the positive-health AI gate.
  // It is independent of the ordinary wait counter, including its300ms
  // initial delay. Its retained35E latch prevents a second queued command.
  const death=this.reactions&&assertConquestPawnExplodeReactions(this.reactions,{actor:this.actor}).pollDeathCommand({actorAuthority:this.authority,gameTime,isHost});
  const result=this.ai.tick(deltaMs,{gameTime,isHost});return death?{...result,commands:[death,...result.commands]}:result;
 }catch(error){this.fault=error.message;throw error;}}
 tickActorTail(deltaMs,{isHost}={}){this.assertLive();try{return this.navigation.updateHost(deltaMs,{isHost});}catch(error){this.fault=error.message;throw error;}}
 snapshot(){return {actorId:this.actor.id,disposed:this.disposed,fault:this.fault,deathProducerBound:!!this.reactions,mapAIBound:!!this.mapAI,ai:this.ai.snapshot(),navigation:this.navigation.snapshot(),path:this.path.snapshot(),nativeReady:false,mainModeIntegrated:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.ai.dispose();this.navigation.dispose();}
}

