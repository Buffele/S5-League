import {ConquestKingPreFastRunCommand,ConquestKingFastRunCommand} from './conquest-king-pre-fast-run-command.js';
import {commitConquestKingFastRunFlag35d} from './conquest-pawn-movement-owner.js';
import {ConquestWaveSchedule} from './conquest-wave-schedule.js';
import {ConquestNativeLedger} from './conquest-native-ledger.js';
import {conquestBaseContactIntent,conquestBaseContactAdmitted,conquestBaseDamageEvent} from './conquest-base-contact.js';
import {conquestSpawnLocation} from './conquest-spawn-location.js';
import {decodeConquestStageReport} from './conquest-stage-report.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {ConquestBaseGate} from './conquest-base-gate.js';
import {conquestSpawnStats} from './conquest-monster-stats.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnExplodeSelfBombCommand} from './conquest-pawn-explode-command.js';
import {assertConquestRetainedBaseCommands} from './conquest-base-volume.js';
import {conquestTeam1Count,conquestMonsterInitialHealth} from './conquest-monster-health.js';
import {ConquestMoveToCommand,conquestRunDisplacement} from './conquest-monster-movement.js';
import {ConquestCommandQueue} from './conquest-command-queue.js';
import {ConquestAttackCommand} from './conquest-attack-command.js';
import {ConquestDeathCommand} from './conquest-death-command.js';
import {ConquestRookDefenseCommand} from './conquest-rook-defense-command.js';
import {ConquestPawnRuntime} from './conquest-pawn-runtime.js';
import {conquestMonsterCollisionOperation} from './conquest-monster-collision.js';
import {ConquestPlayerDamageReceiver} from './conquest-monster-damage-player.js';
// Consumes explicit source events and real model-backed actors. The qualified
// base-contact path mutates the actor before calling AI lookup/queue ports.
// No AI registry, native RNG stream, ACK or stage win is fabricated here.
export class ConquestRuntimeBridge{
 constructor({participants,round,recallSelection,isHost,baseGates=[]}){this.participants=participants;this.isHost=isHost;this.ledger=new ConquestNativeLedger(participants);this.baseGates=new Map();this.playerDamageBindings=new Map();for(const gate of baseGates){if(!(gate instanceof ConquestBaseGate)||this.baseGates.has(gate.name))throw Error('Explicit distinct native Conquest base gates required');this.baseGates.set(gate.name,gate);}this.beginRound({round,recallSelection});}
 beginRound({round,recallSelection,preserveOwners=false}){
  if(typeof preserveOwners!=='boolean'||this.actors?.size||!preserveOwners&&this.commands&&!this.commands.empty)throw Error('Native cleanup/destructor records required before switching Conquest round');
  if(preserveOwners&&(!this.actors||!this.aiActors||!this.pawnRuntimes||!this.commands||this.aiActors.size||this.pawnRuntimes.size||this.commands.stepping||this.commands.mirrored.length))throw Error('Fully released current round registries and command owners required');
  if(preserveOwners)assertConquestRetainedBaseCommands(this.commands);
  const schedule=new ConquestWaveSchedule({rows:CONQUEST_SOURCE_DATA.waveRows,round,recallSelection,isHost:this.isHost});
  this.schedule=schedule;
  if(!preserveOwners){this.actors=new Map();this.aiActors=new Map();this.pawnRuntimes=new Map();this.commands=new ConquestCommandQueue();}
  this.moveCommands=new WeakSet();this.consumedSpawns=new Set();this.stageReport=null;this.nativeReady=false;
 }
 stepNativeClock(deltaMs){return this.schedule.step(deltaMs);}
 consumeSpawn(request,{jitterSamples,statSamples,actorFactory}){
  if(!request?.spawn||!this.isHost)return [];if(request.round!==this.schedule.round||request.spawn.recallIndex!==this.schedule.recallSelection)throw Error('Conquest round/recall mismatch');if(this.consumedSpawns.has(request.index))return [];
  const source=this.schedule.records[request.index];if(!source?.emitted||Number(source.raw.monster_key)!==request.spawn.monsterKey||Number(source.raw.monster_increase)%256!==request.spawn.count||Number(source.raw.team)%256!==request.spawn.team||Number(source.raw[`recall${this.schedule.recallSelection+1}`])%256!==request.spawn.spawnIndex)throw Error('Conquest spawn must match an emitted source record');
  if(typeof actorFactory!=='function'||!Array.isArray(jitterSamples)||jitterSamples.length!==request.spawn.count)throw Error('Real NPC factory and explicit native jitter per actor required');
  const model=CONQUEST_RENDER_DATA.monsters[request.spawn.monsterKey];if(!model)throw Error('Native Conquest monster model unresolved');
  if(!Array.isArray(statSamples)||statSamples.length!==request.spawn.count)throw Error('Explicit native stat draws per monster required');
  const team1Count=conquestTeam1Count(this.ledger.participants);
  const births=Array.from(statSamples,(draws,i)=>({nativeStats:conquestSpawnStats(request.spawn.monsterKey,draws),location:conquestSpawnLocation(request.spawn.spawnIndex,jitterSamples[i])}));
  // Consume before invoking external factories, preventing reentrant duplicates.
  this.consumedSpawns.add(request.index);const actors=[];
  for(const {location,nativeStats}of births){const actor=actorFactory({monsterKey:request.spawn.monsterKey,model,location,nativeStats,team1Count,team:request.spawn.team,waypointCandidates:[['simple_waypoint',0],['normal_waypoint',1],['difficult_waypoint',2]].filter(([key])=>Number(source.raw[key])!==0).map(([,value])=>value)});if(!actor||actor.id==null||this.actors.has(actor.id)||actor.model?.source!==model.scene||!actor.model.group?.isObject3D)throw Error('Actual unique NPC identity and source model required');if(actor.spawnStats!==nativeStats||actor.model.nativeSize!==nativeStats.size)throw Error('Native spawn stats and sampled model size must be applied');if(actor instanceof ConquestMonsterActor){const expected=conquestMonsterInitialHealth(nativeStats.healthRaw16,team1Count);if(actor.maxHealth!==expected||actor.health!==expected)throw Error('Native briefing-scaled initial monster health must be applied');}this.actors.set(actor.id,actor);this.aiActors.set(actor.id,actor);actors.push(actor);}return actors;
 }
 contactBase(actorId,source){const actor=this.actors.get(actorId);if(!actor)throw Error('Unknown Conquest NPC identity');if(!actor.contactState)throw Error('Actual NPC contact state unresolved');let gate=source.gate;if(source.gateName!==undefined){if(gate!==undefined)throw Error('Choose an owned gate or explicit contact source');const owned=this.baseGates.get(source.gateName);if(!owned)throw Error('Unknown Conquest base gate');gate=owned.snapshot();}const monster={...actor.contactState,...(Object.hasOwn(source,'aiScriptRegistered')?{aiScriptRegistered:source.aiScriptRegistered}:{})},intent=conquestBaseContactIntent({...source,gate,monster,isHost:this.isHost});return intent?{actor,intent,applyOrder:['actorChanges','eventQueue'],serverAccepted:false}:null;}
 consumeBaseDamage(event){if(event?.kind!==6)throw Error('Actual native base-damage event required');const gate=this.baseGates.get(event.baseName);if(!gate)throw Error('Unknown Conquest base gate');return {gateHealth:gate.receiveDamage(event),gateActive:gate.active,serverAccepted:false};}
 bindPlayerDamageReceiver(playerId,source){
  if(playerId==null||this.playerDamageBindings.has(playerId))throw Error('Distinct explicit Conquest player identity required');
  const receiver=new ConquestPlayerDamageReceiver(source),binding=Object.freeze({playerId,receiver});
  this.playerDamageBindings.set(playerId,binding);return binding;
 }
 unbindPlayerDamageReceiver(binding){if(!binding||this.playerDamageBindings.get(binding.playerId)!==binding)return false;return this.playerDamageBindings.delete(binding.playerId);}
 receivePlayerDamage(binding,record){
  if(!binding||this.playerDamageBindings.get(binding.playerId)!==binding)throw Error('Current owned Conquest player damage binding required');
  // Only the qualified typed record reaches the actual health owner. No
  // attack power fallback, inferred reaction or automatic score is supplied.
  return {...binding.receiver.receive(record),playerId:binding.playerId,serverAccepted:false};
 }
 consumePlayerDamageContacts(contacts){
  if(!Array.isArray(contacts))throw Error('Explicit ordered resolved Conquest damage contacts required');
  return contacts.map(({binding,record})=>this.receivePlayerDamage(binding,record));
 }
 movementActor(id){const actor=this.actors.get(id);if(actor!==undefined&&!(actor instanceof ConquestMonsterActor))throw Error('Actual Conquest movement actor required');return actor;}
 commandActor(id,runtime){const actor=this.movementActor(id);return runtime&&(runtime.disposed||actor!==runtime.actor)?null:actor;}
 attachPawnRuntime(actorId,{readRunContext,...ports}={}){
  const actor=this.movementActor(actorId);
  if(!actor||this.pawnRuntimes.has(actorId)||typeof readRunContext!=='function')throw Error('Distinct owned Pawn actor and explicit native run collision context required');
  const runtime=new ConquestPawnRuntime({...ports,actor,runMovement:(target,state,deltaMs)=>{
   if(target!==actor)throw Error('Owned Pawn movement actor required');
   const source=readRunContext(target,state,deltaMs);
   if(!source?.state||source.resolveNativeMovement!==undefined)throw Error('Qualified current native Pawn collision state/context required');
   return this.executeRunMovement(actorId,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Pawn state actor required');runtime.manager.requestInput(input);}});
  }});
  this.pawnRuntimes.set(actorId,runtime);return runtime;
 }
 stepMonsterStates(actorId,deltaMs){const runtime=this.pawnRuntimes.get(actorId);if(!runtime)throw Error('Owned actual Pawn state runtime required');return runtime.tick(deltaMs);}
 queueMoveCommand(source,{mirrorEnabled,clearNativeInput,onDestroy}={}){
  if(typeof clearNativeInput!=='function'||typeof onDestroy!=='function'||typeof mirrorEnabled!=='boolean')throw Error('Explicit native move input/destructor/mirror ports required');
  const command=new ConquestMoveToCommand(source),runtime=this.pawnRuntimes.get(command.actorId),lifecycle={gameTime:command.gameTime,nativeType:1,command,
   enter:()=>command.enter(this.commandActor(command.actorId,runtime)),
   tick:deltaMs=>command.tick(this.commandActor(command.actorId,runtime),deltaMs,{clearNativeInput}),
   exit:()=>command.exit(this.commandActor(command.actorId,runtime)),
   isRunning:()=>command.counter.durationMs>=command.counter.elapsedMs,
   destroy:()=>onDestroy(command)};
  this.commands.enqueue(lifecycle,{mirrorEnabled});this.moveCommands.add(command);return command;
 }
 stepCommands(deltaMs,{gameTime}={}){this.commands.step(deltaMs,{gameTime});}
 queueAttackCommand(source,ports={}){
  const runtime=this.pawnRuntimes.get(source?.actorId),statePorts=['requestNativeInput','findNativeInputState','acceptsAttackDirection','writeAttackDirection'];
  if(runtime){if(statePorts.some(name=>Object.hasOwn(ports,name)))throw Error('Owned Pawn input/state ports cannot be replaced');ports={...ports,...runtime.commandPorts};}
  const {mirrorEnabled,onDestroy}=ports;
  if(typeof mirrorEnabled!=='boolean'||!['onDestroy','requestNativeInput','findNativeInputState','acceptsAttackDirection','writeAttackDirection'].every(name=>typeof ports[name]==='function'))throw Error('Explicit native attack input/state/destructor/mirror ports required');
  const command=new ConquestAttackCommand(source),lifecycle={gameTime:command.gameTime,nativeType:4,command,
   enter:()=>command.enter(this.commandActor(command.actorId,runtime)),tick:deltaMs=>command.tick(deltaMs),
   exit:()=>command.exit(this.commandActor(command.actorId,runtime),ports),isRunning:()=>command.isRunning(),destroy:()=>onDestroy(command)};
  this.commands.enqueue(lifecycle,{mirrorEnabled});return command;
 }
 queueDeathCommand(source,{actorAuthority,mirrorEnabled,onDestroy,requestNativeInput}={}){
  const actor=this.movementActor(source?.actorId),runtime=this.pawnRuntimes.get(source?.actorId);
  if(typeof mirrorEnabled!=='boolean'||typeof onDestroy!=='function')throw Error('Explicit Death mirror/destructor owners required');
  if(runtime){if(requestNativeInput!==undefined)throw Error('Owned Pawn Death queued-input port cannot be replaced');requestNativeInput=runtime.commandPorts.requestNativeInput;}
  if(typeof requestNativeInput!=='function')throw Error('Explicit native Death queued-input owner required');
  const command=new ConquestDeathCommand(source,{actor,actorAuthority}),lifecycle={gameTime:command.gameTime,nativeType:2,command,
   enter:()=>command.enter(),tick:deltaMs=>command.tick(deltaMs),isRunning:()=>command.isRunning(),
   exit:()=>command.exit({requestNativeInput,removeAIReference:target=>{if(this.actors.get(target.id)!==target)throw Error('Current owned Death AI reference required');if(this.aiActors.get(target.id)===target)this.aiActors.delete(target.id);}}),destroy:()=>onDestroy(command)};
  this.commands.enqueue(lifecycle,{mirrorEnabled});return command;
 }
 queueSelfBombCommand(source,{actorAuthority,timerPorts,mirrorEnabled,onDestroy}={}){
  if(typeof mirrorEnabled!=='boolean'||typeof onDestroy!=='function')throw Error('Explicit SelfBomb mirror/destructor owners required');
  const actor=this.movementActor(source?.actorId),command=new ConquestPawnExplodeSelfBombCommand(source,{actor,actorAuthority,timerPorts});
  this.commands.enqueue({gameTime:command.gameTime,nativeType:11,command,enter:()=>command.enter(),tick:deltaMs=>command.tick(deltaMs),exit:()=>command.exit(),isRunning:()=>command.isRunning(),destroy:()=>{command.destroy();onDestroy(command);}},{mirrorEnabled});return command;
 }
 queueDefenseCommand(source,{actorAuthority,conditionOwner,mirrorEnabled,onDestroy}={}){
  if(typeof mirrorEnabled!=='boolean'||typeof onDestroy!=='function'||!actorAuthority||this.movementActor(source?.actorId)!==actorAuthority.actor(source?.actorId))throw Error('Current bridge-owned defense source, mirror and destructor owners required');
  const command=new ConquestRookDefenseCommand(source,{actorAuthority,conditionOwner});
  this.commands.enqueue({gameTime:command.gameTime,nativeType:6,command,enter:()=>command.enter(),tick:deltaMs=>command.tick(deltaMs),exit:()=>command.exit(),isRunning:()=>command.isRunning(),destroy:()=>{command.destroy();onDestroy(command);}},{mirrorEnabled});return command;
 }
 queueKingRunCommand(source,{actorAuthority,movementOwner,kingRuntime,mirrorEnabled,onDestroy}={}){
  const actor=this.movementActor(source?.actorId),runtime=this.pawnRuntimes.get(source?.actorId);
  if(!actor||actor.spawnStats.monsterKey!==1500||runtime!==kingRuntime||typeof mirrorEnabled!=='boolean'||typeof onDestroy!=='function')throw Error('Actual King bridge/runtime/command owners required');
  const Command=source.kind==='pre-fast-run'?ConquestKingPreFastRunCommand:source.kind==='fast-run'?ConquestKingFastRunCommand:null;if(!Command)throw Error('Authored King command type8/10 required');
  const command=new Command(source,{actor,actorAuthority,runtime,movementOwner,commitFastRunFlag35d:commitConquestKingFastRunFlag35d});
  this.commands.enqueue({gameTime:command.gameTime,nativeType:command.nativeType,command,enter:()=>command.enter(),tick:deltaMs=>command.tick(deltaMs),exit:()=>command.exit(),isRunning:()=>command.isRunning(),destroy:()=>{command.destroy();onDestroy(command);}},{mirrorEnabled});return command;
 }
 queueAICommand(source,ports){if(source?.kind==='pre-fast-run'||source?.kind==='fast-run')return this.queueKingRunCommand(source,ports);if(source?.kind==='move')return this.queueMoveCommand(source,ports);if(source?.kind==='attack')return this.queueAttackCommand(source,ports);if(source?.kind==='death')return this.queueDeathCommand(source,ports);if(source?.kind==='self-bomb')return this.queueSelfBombCommand(source,ports);if(source?.kind==='defense-aura')return this.queueDefenseCommand(source,ports);throw Error('Conquest AI command kind not integrated');}
 activateMoveCommand(source){const command=new ConquestMoveToCommand(source);command.enter(this.movementActor(command.actorId));this.moveCommands.add(command);return command;}
 tickMoveCommand(command,deltaMs,ports){if(!this.moveCommands.has(command))throw Error('Owned native move command required');return command.tick(this.movementActor(command.actorId),deltaMs,ports);}
 exitMoveCommand(command){if(!this.moveCommands.has(command))throw Error('Owned native move command required');return command.exit(this.movementActor(command.actorId));}
 executeRunMovement(actorId,deltaMs,{stateId,statusRate,resolveNativeMovement,requestNativeState,...collision}={}){
  const actor=this.movementActor(actorId);if(!actor)return null;
  if(stateId!==1)throw Error('Active native ordinary-run state required');
  if(typeof requestNativeState!=='function'||!collision.state&&typeof resolveNativeMovement!=='function')throw Error('Native monster collision/state ports required');
  const displacement=conquestRunDisplacement({direction:actor.moveDirectionNative,baseSpeed:actor.spawnStats.moveSpeed,commandMultiplier:actor.commandSpeedMultiplier,statusRate,deltaMs});
  if(displacement===null){requestNativeState(actor,0);return {actor,displacement:null,serverAccepted:false};}
  if(collision.state){
   if(resolveNativeMovement!==undefined)throw Error('Choose qualified monster collision or explicit diagnostic solver');
   const result=conquestMonsterCollisionOperation({...collision,displacement});
   if(result.qualified)actor.setNativePosition(result.position);
   return {...result,actor,requestedDisplacement:displacement,serverAccepted:false};
  }
  // The actual solver must supply the resulting native position. No free
  // translation, humanoid collision fallback or invented route is provided.
  const position=resolveNativeMovement(actor,displacement);actor.setNativePosition(position);
  return {actor,displacement,serverAccepted:false};
 }
 executeBaseContact(actorId,{gateName,playing,timeTokenRaw},{hasRegisteredAIResource,enqueue}={}){
  const actor=this.actors.get(actorId),gate=this.baseGates.get(gateName);
  if(!(actor instanceof ConquestMonsterActor))throw Error('Actual Conquest monster actor required');
  if(!gate)throw Error('Unknown Conquest base gate');
  const source={playing,isHost:this.isHost,timeTokenRaw,gate:gate.snapshot(),monster:actor.contactState};
  if(!conquestBaseContactAdmitted(source))return null;
  if(typeof hasRegisteredAIResource!=='function'||typeof enqueue!=='function')throw Error('Explicit native AI lookup/event queue required');
  actor.neutralizeForBase();
  const registered=hasRegisteredAIResource(actor.aiScriptLiteral);
  if(typeof registered!=='boolean')throw Error('Explicit native AI resource lookup result required');
  const event=registered?conquestBaseDamageEvent(source):null;if(event)enqueue(event);
  return {actor,event,serverAccepted:false};
 }
 consumeKill(event){return this.ledger.applyKill(event);}
 consumeDestructor(actorId,{nativeCleanupPermitted}){if(typeof nativeCleanupPermitted!=='boolean'||!nativeCleanupPermitted)return false;this.pawnRuntimes.get(actorId)?.dispose();this.pawnRuntimes.delete(actorId);this.aiActors.delete(actorId);return this.actors.delete(actorId);}
 consumeStageReport(id,bytes){this.stageReport=decodeConquestStageReport(id,bytes);return this.stageReport;}
 get status(){return {round:this.schedule.round,actorCount:this.actors.size,clientReportId:this.stageReport?.id??null,serverAccepted:false,winner:null,nativeReady:false};}
}
