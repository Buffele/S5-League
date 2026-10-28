import {assertConquestKingEffectsPresentation,assertConquestKingEffectsPresentationBank,CONQUEST_KING_AUTHORED_PRESENTATION_POLICY,CONQUEST_KING_AUTHORED_DEATH_PRESENTATION} from './conquest-king-effects-presentation.js';
import {assertConquestKingEffectsService} from './conquest-king-effects-service.js';
import {assertConquestQueenEffectsPresentation,assertConquestQueenEffectsPresentationBank,CONQUEST_QUEEN_AUTHORED_PRESENTATION_POLICY,CONQUEST_QUEEN_AUTHORED_DEATH_PRESENTATION} from './conquest-queen-effects-presentation.js';
import {assertConquestQueenEffectsService} from './conquest-queen-effects-service.js';
import {createConquestKingAttackOwner,readConquestKingAttackOwner} from './conquest-king-attack.js';
import {ConquestKingBaseLifecycle,assertConquestKingBaseLifecycle} from './conquest-king-base-lifecycle.js';
import {createPreparedConquestKingAudio,assertConquestKingAudio} from './conquest-king-audio.js';
import {createConquestKingReactions,assertConquestKingReactions,CONQUEST_KING_PENDING_DEATH_PRESENTATION} from './conquest-king-reactions.js';
import {ConquestKingAIHost,assertConquestKingAIHost} from './conquest-king-ai-host.js';
import {assertConquestKingRuntime} from './conquest-king-runtime.js';
import {createConquestKingPendingPresentation,assertConquestKingPendingPresentation,CONQUEST_KING_PENDING_PRESENTATION} from './conquest-king-pending-presentation.js';
import {createConquestKingMoveBox,assertConquestKingMoveBox} from './conquest-king-movebox.js';
import {createConquestKingCancelAnimation,assertConquestKingCancelAnimation} from './conquest-king-cancel-animation.js';
import {readConquestKingActorFrozen} from './conquest-king-host-role.js';
import {createConquestKingAIClocks,assertConquestKingAIClocks} from './conquest-king-ai-clocks.js';
import {createConquestKingRandom,assertConquestKingRandom} from './conquest-king-random.js';
import {createConquestKingProbabilityOwner,assertConquestKingProbabilityOwner} from './conquest-king-probability.js';
import {createConquestKingAIControls,assertConquestKingAIControls} from './conquest-king-ai-controls.js';
import {createConquestKingDeathProducer,assertConquestKingDeathProducer} from './conquest-king-death-producer.js';
import {createConquestKingFastRunProducer} from './conquest-king-fast-run-producer.js';
import {createConquestKingDamageNotification,assertConquestKingDamageNotification} from './conquest-king-damage-notification.js';
import {createConquestQueenAttackOwner,readConquestQueenAttackOwner} from './conquest-queen-attack.js';
import {ConquestQueenBaseLifecycle,assertConquestQueenBaseLifecycle} from './conquest-queen-base-lifecycle.js';
import {createPreparedConquestQueenPresentation,assertConquestQueenAudio} from './conquest-queen-audio.js';
import {createConquestQueenReactions,assertConquestQueenReactions,CONQUEST_QUEEN_PENDING_DEATH_PRESENTATION} from './conquest-queen-reactions.js';
import {ConquestQueenAIHost} from './conquest-queen-ai-host.js';
import {createConquestQueenChoiceFields,assertConquestQueenChoiceFields} from './conquest-queen-choice-fields.js';
import {assertConquestQueenRuntime} from './conquest-queen-runtime.js';
import {createConquestQueenPendingPresentation,assertConquestQueenPendingPresentation,CONQUEST_QUEEN_PENDING_PRESENTATION} from './conquest-queen-pending-presentation.js';
import {assertConquestQueenRayDistanceLimit,assertConquestQueenRayDistanceCapture} from './conquest-queen-ray-distance.js';
import {createConquestQueenStealth,assertConquestQueenStealth} from './conquest-queen-stealth.js';
import {createConquestQueenMoveBox,assertConquestQueenMoveBox} from './conquest-queen-movebox.js';
import {createConquestRookExplodeAttackOwner,readConquestRookExplodeAttackOwner} from './conquest-rook-explode-attack.js';
import {assertConquestRookExplodeBaseLifecycle} from './conquest-rook-explode-base-lifecycle.js';
import {createConquestRookExplodeReactions,assertConquestRookExplodeReactions,CONQUEST_ROOK_EXPLODE_AUTHORED_REACTION_PRESENTATION} from './conquest-rook-explode-reactions.js';
import {ConquestRookExplodeAIHost} from './conquest-rook-explode-ai-host.js';
import {assertConquestRookExplodeRuntime} from './conquest-rook-explode-runtime.js';
import {assertConquestRookExplodeFullPresentation,assertConquestRookExplodeFullPresentationBank} from './conquest-rook-explode-full-presentation.js';
import {assertConquestRookExplodeEffectsService} from './conquest-rook-explode-effects-service.js';
import {createConquestBishopSnipeAttackOwner,readConquestBishopSnipeAttackOwner} from './conquest-bishop-snipe-attack.js';
import {ConquestBishopSnipeBaseLifecycle,assertConquestBishopSnipeBaseLifecycle} from './conquest-bishop-snipe-base-lifecycle.js';
import {createConquestBishopSnipeAudio,assertConquestBishopSnipeAudio} from './conquest-bishop-snipe-audio.js';
import {createConquestBishopSnipeReactions,assertConquestBishopSnipeReactions,CONQUEST_BISHOP_SNIPE_PENDING_DEATH_PRESENTATION} from './conquest-bishop-snipe-reactions.js';
import {ConquestBishopSnipeAIHost} from './conquest-bishop-snipe-ai-host.js';
import {createConquestBishopSnipeAIRates,assertConquestBishopSnipeAIRates} from './conquest-bishop-snipe-ai-rates.js';
import {assertConquestBishopSnipeRuntime} from './conquest-bishop-snipe-runtime.js';
import {createConquestBishopSnipePendingPresentation,assertConquestBishopSnipePendingPresentation,CONQUEST_BISHOP_SNIPE_PENDING_PRESENTATION} from './conquest-bishop-snipe-pending-presentation.js';
import {assertConquestBishopSnipeRayDistanceLimit,assertConquestBishopSnipeRayDistanceCapture} from './conquest-bishop-snipe-ray-distance.js';
import {createConquestBishopSnipeDirectionOwner,assertConquestBishopSnipeDirectionOwner} from './conquest-bishop-snipe-direction-owner.js';
import {createConquestBishopAttackOwner,readConquestBishopAttackOwner} from './conquest-bishop-attack.js';
import {ConquestBishopBaseLifecycle,assertConquestBishopBaseLifecycle} from './conquest-bishop-base-lifecycle.js';
import {createPreparedConquestBishopPresentation,assertConquestBishopAudio} from './conquest-bishop-audio.js';
import {createConquestBishopReactions,assertConquestBishopReactions,CONQUEST_BISHOP_PENDING_DEATH_PRESENTATION,CONQUEST_BISHOP_AUTHORED_DEATH_PRESENTATION} from './conquest-bishop-reactions.js';
import {ConquestBishopAIHost} from './conquest-bishop-ai-host.js';
import {createConquestBishopAIRates,assertConquestBishopAIRates} from './conquest-bishop-ai-rates.js';
import {assertConquestBishopRuntime} from './conquest-bishop-runtime.js';
import {createConquestBishopPendingPresentation,assertConquestBishopPendingPresentation,CONQUEST_BISHOP_PENDING_PRESENTATION} from './conquest-bishop-pending-presentation.js';
import {assertConquestBishopPresentation,assertConquestBishopPresentationBank,CONQUEST_BISHOP_AUTHORED_PRESENTATION_POLICY} from './conquest-bishop-presentation.js';
import {assertConquestBishopEffectsService} from './conquest-bishop-effects-service.js';
import {assertConquestBishopRayDistanceLimit,assertConquestBishopRayDistanceCapture} from './conquest-bishop-ray-distance.js';
import {assertConquestKnightChargePresentation,assertConquestKnightChargePresentationBank,CONQUEST_KNIGHT_CHARGE_AUTHORED_PRESENTATION_POLICY} from './conquest-knight-charge-presentation.js';
import {createConquestKnightChargeAttackOwner,readConquestKnightChargeAttackOwner} from './conquest-knight-charge-attack.js';
import {createConquestKnightChargeMoveBox,assertConquestKnightChargeMoveBox} from './conquest-knight-charge-movebox.js';
import {ConquestKnightChargeBaseLifecycle,assertConquestKnightChargeBaseLifecycle} from './conquest-knight-charge-base-lifecycle.js';
import {createPreparedConquestKnightChargeAudio,assertConquestKnightChargeAudio} from './conquest-knight-charge-audio.js';
import {createConquestKnightChargeReactions,assertConquestKnightChargeReactions,CONQUEST_KNIGHT_CHARGE_PENDING_DEATH_PRESENTATION} from './conquest-knight-charge-reactions.js';
import {ConquestKnightChargeAIHost} from './conquest-knight-charge-ai-host.js';
import {assertConquestKnightChargeRuntime} from './conquest-knight-charge-runtime.js';
import {createConquestKnightChargePendingPresentation,assertConquestKnightChargePendingPresentation,CONQUEST_KNIGHT_CHARGE_PENDING_PRESENTATION} from './conquest-knight-charge-pending-presentation.js';
import {ConquestPawnMovementOwner} from './conquest-pawn-movement-owner.js';
import {ConquestMonsterHealth} from './conquest-player-monster-combat.js';
import {createConquestPawnReactions} from './conquest-pawn-reactions.js';
import {createPreparedConquestPawnPresentation} from './conquest-pawn-presentation.js';
import {ConquestPawnBaseLifecycle} from './conquest-pawn-base-lifecycle.js';
import {ConquestPawnPath} from './conquest-pawn-path.js';
import {ConquestPawnAIHost} from './conquest-pawn-ai-host.js';
import {ConquestPawnRuntime} from './conquest-pawn-runtime.js';
import {ConquestPawnExplodeRuntime,assertConquestPawnExplodeRuntime} from './conquest-pawn-explode-runtime.js';
import {ConquestPawnExplodeBaseLifecycle} from './conquest-pawn-explode-base-lifecycle.js';
import {createConquestPawnExplodeReactions} from './conquest-pawn-explode-reactions.js';
import {createPreparedConquestPawnExplodeAudio} from './conquest-pawn-explode-audio.js';
import {assertConquestPawnExplodePresentation} from './conquest-pawn-explode-presentation.js';
import {ConquestPawnExplodeAIHost} from './conquest-pawn-explode-ai-host.js';
import {createConquestPawnExplodeTimerOwner} from './conquest-pawn-explode-timer.js';
import {CONQUEST_PAWN_EXPLODE_CONSTANTS} from './conquest-pawn-explode-sphere.js';
import {createInitialConquestPawnDamageState} from './conquest-player-monster-damage-record.js';
import {createConquestRookAura,assertConquestRookAura} from './conquest-rook-aura.js';
import {assertConquestRookPresentation} from './conquest-rook-presentation.js';
import {assertConquestRookFullPresentation} from './conquest-rook-full-presentation.js';
import {createConquestRookReactions,assertConquestRookReactions,CONQUEST_ROOK_PARTIAL_REACTION_PRESENTATION,CONQUEST_ROOK_AUTHORED_REACTION_PRESENTATION} from './conquest-rook-reactions.js';
import {ConquestRookAIHost,assertConquestRookAIHost} from './conquest-rook-ai-host.js';
import {assertConquestRookRuntime} from './conquest-rook-runtime.js';
import {assertConquestRookBaseLifecycle} from './conquest-rook-base-lifecycle.js';
import {createConquestKnightAttackOwner,readConquestKnightAttackOwner} from './conquest-knight-attack.js';
import {createConquestKnightMoveBox,assertConquestKnightMoveBox} from './conquest-knight-movebox.js';
import {ConquestKnightBaseLifecycle,assertConquestKnightBaseLifecycle} from './conquest-knight-base-lifecycle.js';
import {createPreparedConquestKnightAudio,assertConquestKnightAudio} from './conquest-knight-audio.js';
import {createConquestKnightReactions,assertConquestKnightReactions} from './conquest-knight-reactions.js';
import {ConquestKnightAIHost,assertConquestKnightAIHost} from './conquest-knight-ai-host.js';
import {assertConquestKnightRuntime} from './conquest-knight-runtime.js';
import {createConquestMonsterDefenseAuraFields,assertConquestMonsterDefenseAuraFields} from './conquest-monster-defense-aura-fields.js';

const owners=new WeakMap(),releaseReceipts=new WeakMap();
const releaseOrder=Object.freeze(['lifecycle','runtime','host','path','reactions','health','presentation','movement']);
const explodeReleaseOrder=Object.freeze(['lifecycle','runtime','host','path','timer','reactions','health','presentation','persistentPresentation','movement']);
// Retain the implementations, not writable methods on returned child objects.
let disposeMethods;
function retainedDispose(name){
 // Resolve after module initialization: specialized Death, movement and the
 // bridge form a real ES module cycle. Retain implementations at first use.
 disposeMethods??=new Map([
 ['movement',ConquestPawnMovementOwner.prototype.dispose],['health',ConquestMonsterHealth.prototype.dispose],
 ['lifecycle',ConquestPawnBaseLifecycle.prototype.dispose],['path',ConquestPawnPath.prototype.dispose],
 ['host',ConquestPawnAIHost.prototype.dispose],['runtime',ConquestPawnRuntime.prototype.dispose],
 ]);return disposeMethods.get(name);
}

function identity(owner,{actor,model,runtime}={}){
 const record=owners.get(owner);
 if(!record||actor!==undefined&&record.actor!==actor||model!==undefined&&record.model!==model||runtime!==undefined&&record.runtime!==runtime)throw Error('Actual privately owned composed Pawn actor/runtime/model required');
 return record;
}
export function assertConquestPawnActorRuntime(owner,expected={}){identity(owner,expected);return owner;}
export function assertConquestPawnActorReleaseReceipt(receipt,{owner,...expected}={}){
 const record=identity(owner,expected);
 if(releaseReceipts.get(receipt)!==record||record.readReceipt()!==receipt||record.readPhase()!=='released')throw Error('Successful retained Pawn sub-owner release receipt required');
 return receipt;
}

// Synchronous real birth after ConquestSession has parented and registered the
// entire cohort. Borrowed map/query/authority/audio-bank owners remain shared;
// every actor retains its own body, health, reactions, timers, mixer and path.
// Native room/RNG/attack predicates and recipients remain explicit producers.
// No dummy target, assumed clear collision or invented final damage is added.
export function createConquestPawnActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,
 movementQueries,navigationQueries,graphs,mapAI,audio,soundBank,graphSelection,spawnBase,
 readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,attackPorts,
 globalsProfile,deathEffects=null,explodeResources,explodeAttackPorts,readExplodeAttackPorts,rookResources,knightResources,readRookAuraQuery,readKnightAttackPorts,knightChargeResources,readKnightChargeAttackPorts,bishopResources,readBishopAttackPorts,bishopSnipeResources,readBishopSnipeAttackPorts,nextRandom15,playerFacingOwner,rookExplodeResources,readRookExplodeAttackPorts,queenResources,readQueenAttackPorts,kingResources,readKingAttackPorts,readGameTime}={}){
 if(actor?.spawnStats?.monsterKey===1500)return createConquestKingActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,kingResources,readKingAttackPorts,readGameTime,nextRandom15});
 if(actor?.spawnStats?.monsterKey===1403)return createConquestQueenActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,queenResources,readQueenAttackPorts,nextRandom15,rookResources});
 if(actor?.spawnStats?.monsterKey===1110)return createConquestRookExplodeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,rookExplodeResources,readRookExplodeAttackPorts});
 if(actor?.spawnStats?.monsterKey===1314)return createConquestBishopSnipeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,bishopSnipeResources,readBishopSnipeAttackPorts,nextRandom15,playerFacingOwner});
 if(actor?.spawnStats?.monsterKey===1303)return createConquestBishopActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,bishopResources,readBishopAttackPorts});
 if(actor?.spawnStats?.monsterKey===1204)return createConquestChargeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,knightChargeResources,readKnightChargeAttackPorts});
 if([1100,1203].includes(actor?.spawnStats?.monsterKey))return createConquestRound3ActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,deathEffects,rookResources,knightResources,readRookAuraQuery,readKnightAttackPorts});
 const model=actor?.model,actorId=actor?.id;
 const explosive=actor?.spawnStats?.monsterKey===1013;
 if(explosive&&(!explodeResources||typeof explodeResources.presentationBank?.create!=='function'||typeof explodeResources.readOrientation8C!=='function'||!explodeResources.particles||Object.hasOwn(explodeResources.particles,'actor')||typeof readExplodeAttackPorts!=='function'&&(!explodeAttackPorts||!['prepareAttack','readTickGate','consumeExplosionEvent','exitAttack'].every(k=>typeof explodeAttackPorts[k]==='function'))||readExplodeAttackPorts!==undefined&&explodeAttackPorts!==undefined))throw Error('Explicit prepared1013 presentation/audio/particles/orientation and exclusive actual explosion attack producer required');
 let movement,health,damageState,reactions,presentation,persistentPresentation,timer,lifecycle,path,host,runtime,disposed=false,prepared=false,api,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child)=>{
  const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?(explosive?[['death','dispose'],['animation','dispose']]:[['contacts','exit'],['animation','dispose']]):[])
   .map(([key,method])=>({key,method,child:child[key],implementation:child[key][method]}));
  const dispose=explosive&&name==='lifecycle'?ConquestPawnExplodeBaseLifecycle.prototype.dispose:explosive&&name==='host'?ConquestPawnExplodeAIHost.prototype.dispose:explosive&&name==='runtime'?child.dispose:retainedDispose(name)??child.dispose;
  children.set(name,{child,dispose,dependents});return child;
 };
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant Pawn actor owner cleanup');if(failure)throw failure;return receipt;}
  disposed=true;phase='releasing';const errors=[];
  if(prepared){
   // A live factory owner must still own its current children when release
   // begins. Already-disposed/replaced children cannot earn a new proof by
   // making their idempotent dispose methods silently return.
   for(const [name,check]of [
    ['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Pawn factory ownership changed before release');}],
    ['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],
    ['reactions',()=>reactions.snapshot()],['presentation',()=>presentation.snapshot()],
    ['lifecycle',()=>{const prototype=explosive?ConquestPawnExplodeBaseLifecycle.prototype:ConquestPawnBaseLifecycle.prototype;prototype.snapshot.call(lifecycle,runtime.manager.current);}],
    ['movement',()=>movement.synchronize()],['runtime',()=>{if(explosive)assertConquestPawnExplodeRuntime(runtime,{actor});else ConquestPawnRuntime.prototype.assertActor.call(runtime,actor);}],
    // A sibling may already have been unbound from shared authority during
    // Session abort. Releasing this host must not query global coverage.
    ['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('Pawn AI host ownership changed before release');}],
    ['path',()=>ConquestPawnPath.prototype.assertLive.call(path)],
   ])try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   if(explosive)for(const [name,check]of [['timer',()=>{if(timer.actor!==actor||timer.snapshot().disposed)throw Error('Current actual1013 timer required');}],['persistentPresentation',()=>assertConquestPawnExplodePresentation(persistentPresentation,{actor})]])try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const dependent of entry.dependents)try{
    if(entry.child[dependent.key]!==dependent.child||dependent.child[dependent.method]!==dependent.implementation||dependent.child.disposed===true)throw Error('Pawn nested '+name+'.'+dependent.key+' owner replaced or already disposed');
   }catch(error){errors.push(error);failed.push(name+'.'+dependent.key+':pre-release');}
  }
  // Exit real base state while its channel/audio still exist. Abort does not
  // manufacture a Death transition, native reference release or stage result.
  for(const name of explosive?explodeReleaseOrder:releaseOrder){const entry=children.get(name);if(!entry)continue;attempted.push(name);
   try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Pawn actor owner cleanup failed');throw failure;}
  if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',
   releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});
  releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}));
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}));
  //208 belongs to the target actor. Rebuilding the shooter's equipment or
  // changing the player's avatar must not reset an existing defense aura.
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  if(explosive){
   persistentPresentation=retain('persistentPresentation',explodeResources.presentationBank.create({actor,renderModelEffects:true,particles:{...explodeResources.particles,world,scene}}));
   assertConquestPawnExplodePresentation(persistentPresentation,{actor});
   presentation=retain('presentation',createPreparedConquestPawnExplodeAudio({actor,audio,soundBank:explodeResources.soundBank}));
   lifecycle=retain('lifecycle',new ConquestPawnExplodeBaseLifecycle({actor,...presentation.ports}));
   reactions=retain('reactions',createConquestPawnExplodeReactions({actor,healthOwner:health,deathEffects,movementOwner:movement,persistentPresentation}));
   const readAttackPort=(name,args)=>{
    const ports=readExplodeAttackPorts?readExplodeAttackPorts({actor,owner:api}):explodeAttackPorts;
    if(!ports||ports.then||typeof ports[name]!=='function')throw Error('Current synchronous1013 explosion consumer required: '+name);
    return ports[name](...args);
   };
   timer=retain('timer',createConquestPawnExplodeTimerOwner({actor,actorAuthority,attackPorts:Object.fromEntries(['prepareAttack','readTickGate','consumeExplosionEvent','exitAttack'].map(name=>[name,(...args)=>readAttackPort(name,args)])),
    readTempoHeightFactor33:()=>CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33,readOrientation8C:explodeResources.readOrientation8C,presentation:presentation.timerPorts}));
  }else{
   reactions=retain('reactions',createConquestPawnReactions({actor,healthOwner:health,deathEffects,movementOwner:movement,recipientEffects:rookResources?.effectsService??null}));
   presentation=retain('presentation',createPreparedConquestPawnPresentation({actor,audio,soundBank}));
   lifecycle=retain('lifecycle',new ConquestPawnBaseLifecycle({actor,...presentation.ports}));
  }
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:request=>graphs.resolveGraph(request),
   findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:request=>navigationQueries.probeSegment(request),readCurrentMode,readRangeFloat}));
  path.initializeFactoryGraph(graphSelection);
  const AIHost=explosive?ConquestPawnExplodeAIHost:ConquestPawnAIHost;
  host=retain('host',new AIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,
   readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}));
  const common={baseStatePorts:lifecycle.ports,reactionPorts:reactions.ports,readPlaybackRate:state=>lifecycle.readPlaybackRate(state),animationOptions:{previousRequestedName:''}};
  runtime=retain('runtime',explosive?movement.attachExplodeRuntime({...common,timerOwner:timer,presentationOwner:persistentPresentation,readTempoHeightFactor33:()=>CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33,readOrientation8C:explodeResources.readOrientation8C}):movement.attachPawnRuntime({...common,attackPorts}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Pawn birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actor.id)!==actor||bridge.pawnRuntimes.get(actor.id)!==runtime||runtime.disposed)throw Error('Current owned composed Pawn runtime required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,reactions,path,host,...(explosive?{timer,persistentPresentation,audioPresentation:presentation}:{}),
  get disposed(){return disposed;},
  releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],
   releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},
  readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},
  tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},
  tickPostPose(deltaMs){live();return explosive?runtime.updatePresentation(deltaMs):null;},
  // The same full-identity authority that produced the host's Death command
  // must reach its queue consumer. Locomotion-only ports omit this owner and
  // otherwise fail as soon as an actual Pawn reaches the defense base.
  commandPorts:Object.freeze({...host.commandPorts,actorAuthority,...(explosive?{timerPorts:timer.commandPorts}:{})}),
  snapshot(){live();return {actorId:actor.id,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},
  dispose:release,
 });
 owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// Round3 uses the same private factory/release registries. Legacy1003/1013
//above retain their exact construction and8/10-owner cleanup paths.
function createConquestRound3ActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,deathEffects,rookResources,knightResources,readRookAuraQuery,readKnightAttackPorts}){
 const knight=actor.spawnStats.monsterKey===1203,key=actor.spawnStats.monsterKey,actorId=actor.id,model=actor.model;
 const fullRook=!knight&&rookResources?.presentationPolicy===CONQUEST_ROOK_AUTHORED_REACTION_PRESENTATION,assertRookPresentation=fullRook?assertConquestRookFullPresentation:assertConquestRookPresentation;
 if(!knight&&(!rookResources||typeof rookResources.presentationBank?.create!=='function'||![CONQUEST_ROOK_PARTIAL_REACTION_PRESENTATION,CONQUEST_ROOK_AUTHORED_REACTION_PRESENTATION].includes(rookResources.presentationPolicy)||fullRook&&(!rookResources.particles||!rookResources.effectsService)||typeof readRookAuraQuery!=='function'))throw Error('Prepared Rook source presentation bank/policy and real lazy aura consumer required');
 if(knight&&(!knightResources||typeof readKnightAttackPorts!=='function'))throw Error('Prepared Knight resources and real lazy source attack consumers required');
 const order=knight?['runtime','lifecycle','host','path','attackOwner','moveBox','reactions','health','presentation','auraFields','movement']:['runtime','lifecycle','host','path','aura','reactions','health','presentation','auraFields','movement'];
 let movement,health,damageState,defenseAuraFields,reactions,presentation,lifecycle,path,host,runtime,aura,attackOwner,moveBox,disposed=false,prepared=false,api,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose'],...(!knight?[['base','dispose']]:[])]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant round3 actor owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Round3 factory actor/runtime/model ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['reactions',()=>knight?assertConquestKnightReactions(reactions,{actor}):assertConquestRookReactions(reactions,{actor})],['presentation',()=>knight?assertConquestKnightAudio(presentation,{actor}):assertRookPresentation(presentation,{actor,bank:rookResources.presentationBank})],['lifecycle',()=>knight?assertConquestKnightBaseLifecycle(lifecycle,{actor}):assertConquestRookBaseLifecycle(lifecycle,{actor})],['movement',()=>movement.synchronize()],['runtime',()=>knight?assertConquestKnightRuntime(runtime,{actor}):assertConquestRookRuntime(runtime,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('Round3 AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   if(knight)checks.push(['attackOwner',()=>{if(readConquestKnightAttackOwner(actor)!==attackOwner)throw Error('Actual retained Knight attack group required');}],['moveBox',()=>assertConquestKnightMoveBox(moveBox,{actor})]);else checks.push(['aura',()=>assertConquestRookAura(aura,{actor})]);
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('Round3 nested '+name+'.'+d.field+' owner replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Round3 actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  if(knight){
   presentation=retain('presentation',createPreparedConquestKnightAudio({actor,audio,soundBank:knightResources.soundBank}));
   moveBox=retain('moveBox',createConquestKnightMoveBox({actor,readCurrentActor:()=>bridge.actors.get(actorId),moveSourceDisplacement:movement.moveSourceDisplacement,missingClipPolicy:knightResources.missingClipPolicy}));
   lifecycle=retain('lifecycle',new ConquestKnightBaseLifecycle({actor,...presentation.ports,moveBoxOwner:moveBox}),ConquestKnightBaseLifecycle.prototype.dispose);
   // The shared ordinary Pawn bank is not a Knight effect producer. A
   //future Knight bank must be passed explicitly and pass its typed guard.
   reactions=retain('reactions',createConquestKnightReactions({actor,healthOwner:health,movementOwner:movement,deathEffects:knightResources.deathEffects??null,deathPresentationPolicy:knightResources.deathPresentationPolicy,recipientEffects:rookResources?.effectsService??null}));
   const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readKnightAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual Knight attack consumer required: '+name);return current[name](...args);} ]));
   attackOwner=retain('attackOwner',createConquestKnightAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),ports}));
  }else{
   presentation=retain('presentation',rookResources.presentationBank.create({actor,...(fullRook?{particles:{...rookResources.particles,world,scene}}:{})}));assertRookPresentation(presentation,{actor,bank:rookResources.presentationBank});
   reactions=retain('reactions',createConquestRookReactions({actor,healthOwner:health,persistentPresentation:presentation,movementOwner:movement,presentationPolicy:rookResources.presentationPolicy,effectsService:fullRook?rookResources.effectsService:null}));
   aura=retain('aura',createConquestRookAura({actor,readCurrentActor:()=>bridge.actors.get(actorId),queryAndQueueDefense:(request,context)=>{const result=readRookAuraQuery({actor,owner:api,request,context});if(result?.then)throw Error('Synchronous actual Rook sphere/condition-command consumer required');return result;}}));
  }
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:request=>graphs.resolveGraph(request),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:request=>navigationQueries.probeSegment(request),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  const Host=knight?ConquestKnightAIHost:ConquestRookAIHost;host=retain('host',new Host({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),Host.prototype.dispose);
  runtime=retain('runtime',knight?movement.attachKnightRuntime({baseLifecycle:lifecycle,reactions,attackOwner,moveBoxOwner:moveBox,animationOptions:{previousRequestedName:''}}):movement.attachRookRuntime({auraOwner:aura,reactionPorts:reactions.ports,animationOptions:{previousRequestedName:''}}));
  if(!knight)lifecycle=retain('lifecycle',runtime.base);
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Round3 birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed round3 actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,lifecycle,...(knight?{attackOwner,moveBox,audioPresentation:presentation}:{aura,persistentPresentation:presentation}),
  get disposed(){return disposed;},
  releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},
  readReleaseReceipt(){return receipt;},tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},
  tickPostPose(deltaMs){live();return knight?runtime.updatePresentation(deltaMs):presentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:key,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// Charge1204 owns its distinct Lua groups, reactions, five pending effects and
//source audio rows. Keep all prior factory bodies independently unchanged.
function createConquestChargeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,knightChargeResources,readKnightChargeAttackPorts}){
 const actorId=actor.id,model=actor.model,authoredPresentation=knightChargeResources?.presentationPolicy===CONQUEST_KNIGHT_CHARGE_AUTHORED_PRESENTATION_POLICY;const assertPersistent=authoredPresentation?assertConquestKnightChargePresentation:assertConquestKnightChargePendingPresentation;
 if(!authoredPresentation&&knightChargeResources?.presentationPolicy!==CONQUEST_KNIGHT_CHARGE_PENDING_PRESENTATION||typeof readKnightChargeAttackPorts!=='function'||authoredPresentation&&(!knightChargeResources.particles||!knightChargeResources.presentationBank))throw Error('Prepared Charge resources, exact five-effects pending policy and real lazy attack consumers required');
 const order=['runtime','lifecycle','host','path','attackOwner','moveBox','reactions','health','presentation','persistentPresentation','auraFields','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,moveBox,runtime,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant Charge owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Charge factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestKnightChargeRuntime(runtime,{actor})],['reactions',()=>assertConquestKnightChargeReactions(reactions,{actor})],['presentation',()=>assertConquestKnightChargeAudio(presentation,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor,...(authoredPresentation?{bank:knightChargeResources.presentationBank}:{})})],['lifecycle',()=>assertConquestKnightChargeBaseLifecycle(lifecycle,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestKnightChargeAttackOwner(actor)!==attackOwner)throw Error('Actual retained Charge attack group required');}],['moveBox',()=>assertConquestKnightChargeMoveBox(moveBox,{actor})],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('Charge AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('Charge nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Charge actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  if(authoredPresentation)assertConquestKnightChargePresentationBank(knightChargeResources.presentationBank);
  persistentPresentation=retain('persistentPresentation',authoredPresentation?knightChargeResources.presentationBank.create({actor,particles:{...knightChargeResources.particles,world,scene}}):createConquestKnightChargePendingPresentation({actor,policy:knightChargeResources.presentationPolicy}));assertPersistent(persistentPresentation,{actor,...(authoredPresentation?{bank:knightChargeResources.presentationBank}:{})});
  presentation=retain('presentation',createPreparedConquestKnightChargeAudio({actor,audio,soundBank:knightChargeResources.soundBank}));
  moveBox=retain('moveBox',createConquestKnightChargeMoveBox({actor,readCurrentActor:()=>bridge.actors.get(actorId),moveSourceDisplacement:movement.moveSourceDisplacement,missingClipPolicy:knightChargeResources.missingClipPolicy??null}));
  lifecycle=retain('lifecycle',new ConquestKnightChargeBaseLifecycle({actor,...presentation.ports,moveBoxOwner:moveBox}),ConquestKnightChargeBaseLifecycle.prototype.dispose);
  reactions=retain('reactions',createConquestKnightChargeReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,persistentPresentationPolicy:knightChargeResources.presentationPolicy,deathPresentationPolicy:CONQUEST_KNIGHT_CHARGE_PENDING_DEATH_PRESENTATION}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readKnightChargeAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual Charge attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestKnightChargeAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),ports}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestKnightChargeAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestKnightChargeAIHost.prototype.dispose);
  runtime=retain('runtime',movement.attachKnightChargeRuntime({baseLifecycle:lifecycle,reactions,attackOwner,moveBoxOwner:moveBox,animationOptions:{previousRequestedName:''}}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Charge birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed Charge actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,moveBox,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();return {motion:runtime.updatePresentation(deltaMs),effects:persistentPresentation.update(deltaMs)};},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:1204,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// Distinct Bishop1303 factory, preserving the prior source families.
function createConquestBishopActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,bishopResources,readBishopAttackPorts}){
 const actorId=actor.id,model=actor.model,rangeOwner=bishopResources?.rangeOwner;
 const authoredPresentation=bishopResources?.presentationPolicy===CONQUEST_BISHOP_AUTHORED_PRESENTATION_POLICY,assertPersistent=authoredPresentation?assertConquestBishopPresentation:assertConquestBishopPendingPresentation;
 if((!authoredPresentation&&bishopResources?.presentationPolicy!==CONQUEST_BISHOP_PENDING_PRESENTATION)||typeof readBishopAttackPorts!=='function')throw Error('Prepared Bishop source resources and actual lazy attack consumers required');
 if(authoredPresentation){assertConquestBishopPresentationBank(bishopResources.presentationBank);assertConquestBishopEffectsService(bishopResources.effectsService,{bank:bishopResources.presentationBank,world,scene});}
 assertConquestBishopRayDistanceLimit(rangeOwner,{world});
 const order=['runtime','lifecycle','host','path','attackOwner','rangeCapture','rates','reactions','health','presentation','persistentPresentation','auraFields','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,rangeCapture,rates,runtime,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant Bishop owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Bishop factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestBishopRuntime(runtime,{actor})],['reactions',()=>assertConquestBishopReactions(reactions,{actor})],['presentation',()=>assertConquestBishopAudio(presentation,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor,...(authoredPresentation?{bank:bishopResources.presentationBank}:{})})],['lifecycle',()=>assertConquestBishopBaseLifecycle(lifecycle,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestBishopAttackOwner(actor)!==attackOwner)throw Error('Actual retained Bishop attack group required');}],['rangeCapture',()=>assertConquestBishopRayDistanceCapture(rangeCapture,{actor,world})],['rates',()=>assertConquestBishopAIRates(rates,{actor,monsterActors:bridge.actors})],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('Bishop AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('Bishop nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Bishop actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  persistentPresentation=retain('persistentPresentation',authoredPresentation?bishopResources.presentationBank.create({actor,particles:{...bishopResources.particles,world,scene},effectsService:bishopResources.effectsService}):createConquestBishopPendingPresentation({actor,policy:bishopResources.presentationPolicy}));
  presentation=retain('presentation',createPreparedConquestBishopPresentation({actor,audio,soundBank:bishopResources.soundBank}));
  rates=retain('rates',createConquestBishopAIRates({actor,monsterActors:bridge.actors}));
  rangeCapture=retain('rangeCapture',rangeOwner.capture({actor}),()=>rangeOwner.releaseActor(actor));
  lifecycle=retain('lifecycle',new ConquestBishopBaseLifecycle({actor,...presentation.ports,persistentPresentation,persistentPresentationPolicy:bishopResources.presentationPolicy}),ConquestBishopBaseLifecycle.prototype.dispose);
  reactions=retain('reactions',createConquestBishopReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,persistentPresentationPolicy:bishopResources.presentationPolicy,deathPresentationPolicy:authoredPresentation?CONQUEST_BISHOP_AUTHORED_DEATH_PRESENTATION:CONQUEST_BISHOP_PENDING_DEATH_PRESENTATION}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readBishopAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual Bishop attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestBishopAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),rangeCapture,ports}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestBishopAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,rates,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestBishopAIHost.prototype.dispose);
  runtime=retain('runtime',movement.attachBishopRuntime({baseLifecycle:lifecycle,reactions,attackOwner,animationOptions:{previousRequestedName:''}}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Bishop birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed Bishop actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,rangeCapture,rates,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();return persistentPresentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:1303,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// Distinct Snipe1314 factory; source owns one pending aura and no AddSound.
function createConquestBishopSnipeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,bishopSnipeResources,readBishopSnipeAttackPorts,nextRandom15,playerFacingOwner}){
 const actorId=actor.id,model=actor.model,rangeOwner=bishopSnipeResources?.rangeOwner;
 const assertPersistent=assertConquestBishopSnipePendingPresentation;
 if((bishopSnipeResources?.presentationPolicy!==CONQUEST_BISHOP_SNIPE_PENDING_PRESENTATION)||typeof readBishopSnipeAttackPorts!=='function')throw Error('Prepared Bishop source resources and actual lazy attack consumers required');
 assertConquestBishopSnipeRayDistanceLimit(rangeOwner,{world});
 const order=['runtime','lifecycle','host','path','attackOwner','rangeCapture','directionOwner','rates','reactions','health','presentation','persistentPresentation','auraFields','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,rangeCapture,directionOwner,rates,runtime,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant Bishop owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Bishop factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestBishopSnipeRuntime(runtime,{actor})],['reactions',()=>assertConquestBishopSnipeReactions(reactions,{actor})],['presentation',()=>assertConquestBishopSnipeAudio(presentation,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor,})],['lifecycle',()=>assertConquestBishopSnipeBaseLifecycle(lifecycle,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestBishopSnipeAttackOwner(actor)!==attackOwner)throw Error('Actual retained Bishop attack group required');}],['rangeCapture',()=>assertConquestBishopSnipeRayDistanceCapture(rangeCapture,{actor,world})],['directionOwner',()=>assertConquestBishopSnipeDirectionOwner(directionOwner,{actor,monsterActors:bridge.actors,authority:actorAuthority})],['rates',()=>assertConquestBishopSnipeAIRates(rates,{actor,monsterActors:bridge.actors})],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors||host.directionOwner!==directionOwner)throw Error('Bishop AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('Bishop nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Bishop actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  persistentPresentation=retain('persistentPresentation',createConquestBishopSnipePendingPresentation({actor,policy:bishopSnipeResources.presentationPolicy}));
  presentation=retain('presentation',createConquestBishopSnipeAudio({actor}));
  directionOwner=retain('directionOwner',createConquestBishopSnipeDirectionOwner({actor,monsterActors:bridge.actors,authority:actorAuthority,playerFacingOwner,playerActors,world,renderOwner:scene,nextRandom15}));
  rates=retain('rates',createConquestBishopSnipeAIRates({actor,monsterActors:bridge.actors}));
  rangeCapture=retain('rangeCapture',rangeOwner.capture({actor}),()=>rangeOwner.releaseActor(actor));
  lifecycle=retain('lifecycle',new ConquestBishopSnipeBaseLifecycle({actor,...presentation.ports,persistentPresentation,persistentPresentationPolicy:bishopSnipeResources.presentationPolicy}),ConquestBishopSnipeBaseLifecycle.prototype.dispose);
  reactions=retain('reactions',createConquestBishopSnipeReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,persistentPresentationPolicy:bishopSnipeResources.presentationPolicy,deathPresentationPolicy:CONQUEST_BISHOP_SNIPE_PENDING_DEATH_PRESENTATION}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readBishopSnipeAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual Bishop attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestBishopSnipeAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),rangeCapture,ports}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestBishopSnipeAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,rates,directionOwner,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestBishopSnipeAIHost.prototype.dispose);
  runtime=retain('runtime',movement.attachBishopSnipeRuntime({baseLifecycle:lifecycle,reactions,attackOwner,animationOptions:{previousRequestedName:''}}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Bishop birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed Bishop actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,rangeCapture,directionOwner,rates,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();return persistentPresentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:1314,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// RookExplode1110: ordinary source attack, never a Pawn SelfBomb timer.
function createConquestRookExplodeActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,rookExplodeResources,readRookExplodeAttackPorts}){
 const actorId=actor.id,model=actor.model;
 const assertPersistent=assertConquestRookExplodeFullPresentation;
 if((rookExplodeResources?.presentationPolicy!==CONQUEST_ROOK_EXPLODE_AUTHORED_REACTION_PRESENTATION)||typeof readRookExplodeAttackPorts!=='function')throw Error('Prepared RookExplode source resources and actual lazy attack consumers required');
 assertConquestRookExplodeFullPresentationBank(rookExplodeResources.presentationBank);assertConquestRookExplodeEffectsService(rookExplodeResources.effectsService,{bank:rookExplodeResources.presentationBank,world,scene});
 const order=['runtime','lifecycle','host','path','attackOwner','reactions','health','presentation','auraFields','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,runtime,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant RookExplode owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('RookExplode factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestRookExplodeRuntime(runtime,{actor})],['reactions',()=>assertConquestRookExplodeReactions(reactions,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor,})],['lifecycle',()=>{if(runtime.base!==lifecycle)throw Error('Actual retained RookExplode base lifecycle required');assertConquestRookExplodeBaseLifecycle(lifecycle,{actor});}],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestRookExplodeAttackOwner(actor)!==attackOwner)throw Error('Actual retained RookExplode attack group required');}],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('RookExplode AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('RookExplode nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'RookExplode actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  presentation=retain('presentation',rookExplodeResources.presentationBank.create({actor,particles:{...rookExplodeResources.particles,world,scene}}));persistentPresentation=presentation;
  reactions=retain('reactions',createConquestRookExplodeReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,presentationPolicy:rookExplodeResources.presentationPolicy,effectsService:rookExplodeResources.effectsService}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readRookExplodeAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual RookExplode attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestRookExplodeAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),ports}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestRookExplodeAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestRookExplodeAIHost.prototype.dispose);
  runtime=retain('runtime',movement.attachRookExplodeRuntime({reactionPorts:reactions.ports,attackOwner,missingAttackClipPolicy:rookExplodeResources.missingAttackClipPolicy,animationOptions:{previousRequestedName:''}}));lifecycle=retain('lifecycle',runtime.base);
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'RookExplode birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed RookExplode actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();return persistentPresentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:1110,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}

// Queen1403 has a real nonnull inactive Stealth owner and distinct MoveBox.
function createConquestQueenActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,queenResources,readQueenAttackPorts,nextRandom15,rookResources}){
 const actorId=actor.id,model=actor.model,rangeOwner=queenResources?.rangeOwner;
 const authoredPresentation=queenResources?.presentationPolicy===CONQUEST_QUEEN_AUTHORED_PRESENTATION_POLICY,assertPersistent=authoredPresentation?assertConquestQueenEffectsPresentation:assertConquestQueenPendingPresentation;
 if((!authoredPresentation&&queenResources?.presentationPolicy!==CONQUEST_QUEEN_PENDING_PRESENTATION)||typeof readQueenAttackPorts!=='function')throw Error('Prepared Queen source resources and actual lazy attack consumers required');
 if(authoredPresentation){assertConquestQueenEffectsPresentationBank(queenResources.presentationBank);assertConquestQueenEffectsService(queenResources.effectsService,{bank:queenResources.presentationBank,world,scene});}
 assertConquestQueenRayDistanceLimit(rangeOwner,{world});
 const order=['runtime','lifecycle','host','path','attackOwner','rangeCapture','rates','reactions','health','presentation','persistentPresentation','auraFields','moveBox','stealthOwner','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,rangeCapture,stealthOwner,moveBox,rates,runtime,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant Queen owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('Queen factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestQueenRuntime(runtime,{actor})],['reactions',()=>assertConquestQueenReactions(reactions,{actor})],['presentation',()=>assertConquestQueenAudio(presentation,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor,...(authoredPresentation?{bank:queenResources.presentationBank}:{})})],['lifecycle',()=>assertConquestQueenBaseLifecycle(lifecycle,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestQueenAttackOwner(actor)!==attackOwner)throw Error('Actual retained Queen attack group required');}],['rangeCapture',()=>assertConquestQueenRayDistanceCapture(rangeCapture,{actor,world})],['stealthOwner',()=>assertConquestQueenStealth(stealthOwner,{actor,monsterActors:bridge.actors,actorAuthority})],['moveBox',()=>assertConquestQueenMoveBox(moveBox,{actor})],['rates',()=>assertConquestQueenChoiceFields(rates,{actor,monsterActors:bridge.actors})],['host',()=>{if(host.disposed||host.actor!==actor||host.path!==path||host.reactions!==reactions||host.authority!==actorAuthority||host.monsterActors!==bridge.actors)throw Error('Queen AI host ownership changed before release');}],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('Queen nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of order){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'Queen actor owner cleanup failed');throw failure;}if(!prepared){phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  persistentPresentation=retain('persistentPresentation',authoredPresentation?queenResources.presentationBank.create({actor,particles:{...queenResources.particles,world,scene},effectsService:queenResources.effectsService}):createConquestQueenPendingPresentation({actor,policy:queenResources.presentationPolicy}));
  presentation=retain('presentation',createPreparedConquestQueenPresentation({actor,audio,soundBank:queenResources.soundBank}));
  moveBox=retain('moveBox',createConquestQueenMoveBox({actor,readCurrentActor:()=>bridge.actors.get(actorId),moveSourceDisplacement:movement.moveSourceDisplacement,missingClipPolicy:queenResources.missingClipPolicy}));
  stealthOwner=retain('stealthOwner',createConquestQueenStealth({actor,monsterActors:bridge.actors,actorAuthority,policy:queenResources.stealthPolicy}));
  rates=retain('rates',createConquestQueenChoiceFields({actor,monsterActors:bridge.actors,stealth:stealthOwner,seed32:queenResources.seed32,seedPolicy:queenResources.seedPolicy}));
  rangeCapture=retain('rangeCapture',rangeOwner.capture({actor}),()=>rangeOwner.releaseActor(actor));
  lifecycle=retain('lifecycle',new ConquestQueenBaseLifecycle({actor,...presentation.ports,persistentPresentation,persistentPresentationPolicy:queenResources.presentationPolicy,moveBoxOwner:moveBox}),ConquestQueenBaseLifecycle.prototype.dispose);
  reactions=retain('reactions',createConquestQueenReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,persistentPresentationPolicy:queenResources.presentationPolicy,deathPresentationPolicy:authoredPresentation?CONQUEST_QUEEN_AUTHORED_DEATH_PRESENTATION:CONQUEST_QUEEN_PENDING_DEATH_PRESENTATION,stealthOwner,recipientEffects:rookResources?.effectsService??null}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readQueenAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual Queen attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestQueenAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),rangeCapture,ports}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestQueenAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,reactions,rates,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestQueenAIHost.prototype.dispose);
  runtime=retain('runtime',movement.attachQueenRuntime({baseLifecycle:lifecycle,reactions,attackOwner,moveBoxOwner:moveBox,animationOptions:{previousRequestedName:''}}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'Queen birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed Queen actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,rangeCapture,stealthOwner,moveBox,rates,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();runtime.updatePresentation(deltaMs);stealthOwner.tick(deltaMs);return persistentPresentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority}),
  snapshot(){live();return {actorId,monsterKey:1403,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}


// King1500 owns its nine source states, clock/RNG streams and distinct host.
// The sound bank/map/authority are borrowed; no model finalization occurs here.
function createConquestKingActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,graphSelection,spawnBase,readCurrentMode,readRangeFloat,readPlayerPeerId,resolveAttribute,globalsProfile,kingResources,readKingAttackPorts,readGameTime,nextRandom15}){
 const actorId=actor.id,model=actor.model,authoredPresentation=kingResources?.presentationPolicy===CONQUEST_KING_AUTHORED_PRESENTATION_POLICY,assertPersistent=authoredPresentation?assertConquestKingEffectsPresentation:assertConquestKingPendingPresentation;
 if(!authoredPresentation&&kingResources?.presentationPolicy!==CONQUEST_KING_PENDING_PRESENTATION||![readKingAttackPorts,readGameTime,nextRandom15].every(fn=>typeof fn==='function'&&fn.constructor.name==='Function'))throw Error('Prepared King resources and synchronous lazy attack/game-clock/CRT consumers required');
 // Local S5 command playback has no remote mirror. This is an explicit host
 // policy, not a claim about the native network controller's configuration.
 const commandMirrorEnabled=false;
 if(authoredPresentation){assertConquestKingEffectsPresentationBank(kingResources.presentationBank);assertConquestKingEffectsService(kingResources.effectsService,{bank:kingResources.presentationBank,world,scene});if(kingResources.deathPresentationPolicy!==CONQUEST_KING_AUTHORED_DEATH_PRESENTATION)throw Error('Exact authored King Death policy required');}
 const order=['damageNotification','runtime','lifecycle','cancelAnimation','host','path','attackOwner','controlOwner','probabilityOwner','randomOwner','reactions','deathProducer','clockOwner','health','presentation','persistentPresentation','auraFields','moveBox','movement'];
 let movement,health,damageState,defenseAuraFields,presentation,persistentPresentation,lifecycle,reactions,path,host,attackOwner,moveBox,runtime,clockOwner,randomOwner,probabilityOwner,controlOwner,deathProducer,fastRunProducer,cancelAnimation,damageNotification,api,disposed=false,prepared=false,receipt=null,failure=null,phase='preparing';
 const releaseOrder=['fastRunProducer',...order],children=new Map(),attempted=[],released=[],failed=[];
 const retain=(name,child,dispose=child.dispose)=>{const dependents=(name==='host'?[['ai','dispose'],['navigation','dispose']]:name==='runtime'?[['animation','dispose']]:[]).map(([field,method])=>({field,method,child:child[field],implementation:child[field][method]}));children.set(name,{child,dispose,dependents});return child;};
 const release=()=>{
  if(disposed){if(phase==='releasing')throw Error('Reentrant King owner cleanup');if(failure)throw failure;return receipt;}disposed=true;phase='releasing';const errors=[];
  if(prepared){
   const checks=[['identity',()=>{if(actor.model!==model||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime)throw Error('King factory ownership changed before release');}],['health',()=>ConquestMonsterHealth.prototype.readCurrentRecord.call(health)],['movement',()=>movement.synchronize()],['runtime',()=>assertConquestKingRuntime(runtime,{actor})],['reactions',()=>assertConquestKingReactions(reactions,{actor})],['presentation',()=>assertConquestKingAudio(presentation,{actor})],['persistentPresentation',()=>assertPersistent(persistentPresentation,{actor})],['lifecycle',()=>assertConquestKingBaseLifecycle(lifecycle,{actor})],['auraFields',()=>assertConquestMonsterDefenseAuraFields(defenseAuraFields,{actor})],['attackOwner',()=>{if(readConquestKingAttackOwner(actor)!==attackOwner)throw Error('Actual retained King attack group required');}],['moveBox',()=>assertConquestKingMoveBox(moveBox,{actor})],['cancelAnimation',()=>assertConquestKingCancelAnimation(cancelAnimation,{actor,animation:runtime.animation})],['clockOwner',()=>assertConquestKingAIClocks(clockOwner,{actor,monsterActors:bridge.actors})],['randomOwner',()=>assertConquestKingRandom(randomOwner)],['probabilityOwner',()=>assertConquestKingProbabilityOwner(probabilityOwner,{actor,monsterActors:bridge.actors})],['controlOwner',()=>assertConquestKingAIControls(controlOwner,{actor,monsterActors:bridge.actors,runtime})],['deathProducer',()=>assertConquestKingDeathProducer(deathProducer,{actor,monsterActors:bridge.actors})],['damageNotification',()=>assertConquestKingDamageNotification(damageNotification,{actor,health,runtime,runtimes:bridge.pawnRuntimes})],['host',()=>assertConquestKingAIHost(host,{actor})],['path',()=>ConquestPawnPath.prototype.assertLive.call(path)]];
   for(const [name,check]of checks)try{check();}catch(error){errors.push(error);failed.push(name+':pre-release');}
   for(const [name,entry]of children)for(const d of entry.dependents)try{if(entry.child[d.field]!==d.child||d.child[d.method]!==d.implementation||d.child.disposed===true)throw Error('King nested '+name+'.'+d.field+' replaced or disposed');}catch(error){errors.push(error);failed.push(name+'.'+d.field+':pre-release');}
  }
  for(const name of releaseOrder){const entry=children.get(name);if(!entry)continue;attempted.push(name);try{entry.dispose.call(entry.child);released.push(name);}catch(error){errors.push(error);failed.push(name);}}
  if(errors.length){phase='failed';failure=new AggregateError(errors,'King actor owner cleanup failed');throw failure;}if(!prepared){if(runtime&&bridge.pawnRuntimes.get(actorId)===runtime)bridge.pawnRuntimes.delete(actorId);phase='partial-released';return null;}
  phase='released';receipt=Object.freeze({kind:'conquest-pawn-subowners-released',actorId,policy:'s5-pawn-subowners-release-v1',releasedOwners:Object.freeze([...released]),modelDisposalPerformed:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false});releaseReceipts.set(receipt,owners.get(api));return receipt;
 };
 try{
  movement=retain('movement',new ConquestPawnMovementOwner({bridge,actor,world,worldQueries:movementQueries,globalsProfile}),ConquestPawnMovementOwner.prototype.dispose);
  health=retain('health',new ConquestMonsterHealth({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,readPlayerPeerId,resolveAttribute}),ConquestMonsterHealth.prototype.dispose);
  damageState=createInitialConquestPawnDamageState({actor,monsterActors:bridge.actors});
  defenseAuraFields=retain('auraFields',createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>bridge.actors.get(actorId)}));
  clockOwner=retain('clockOwner',createConquestKingAIClocks({actor,monsterActors:bridge.actors,policy:kingResources.clockStoragePolicy}));
  randomOwner=retain('randomOwner',createConquestKingRandom({seed32:kingResources.seed32,policy:kingResources.seedPolicy}));
  probabilityOwner=retain('probabilityOwner',createConquestKingProbabilityOwner({actor,monsterActors:bridge.actors,randomOwner,nextRandom15}));
  deathProducer=retain('deathProducer',createConquestKingDeathProducer({actor,monsterActors:bridge.actors}));
  persistentPresentation=retain('persistentPresentation',authoredPresentation?kingResources.presentationBank.create({actor,particles:{...kingResources.particles,world,scene},effectsService:kingResources.effectsService}):createConquestKingPendingPresentation({actor,policy:kingResources.presentationPolicy}));
  presentation=retain('presentation',createPreparedConquestKingAudio({actor,audio,soundBank:kingResources.soundBank}));
  moveBox=retain('moveBox',createConquestKingMoveBox({actor,readCurrentActor:()=>bridge.actors.get(actorId),moveSourceDisplacement:movement.moveSourceDisplacement,missingTrackPolicy:kingResources.missingTrackPolicy}));
  lifecycle=retain('lifecycle',new ConquestKingBaseLifecycle({actor,...presentation.ports,persistentPresentation,presentationPolicy:kingResources.presentationPolicy,moveBoxOwner:moveBox}),ConquestKingBaseLifecycle.prototype.dispose);
  reactions=retain('reactions',createConquestKingReactions({actor,healthOwner:health,movementOwner:movement,persistentPresentation,persistentPresentationPolicy:kingResources.presentationPolicy,deathPresentationPolicy:authoredPresentation?kingResources.deathPresentationPolicy:CONQUEST_KING_PENDING_DEATH_PRESENTATION,deathProducer,monsterActors:bridge.actors}));
  const ports=Object.fromEntries(['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].map(name=>[name,(...args)=>{const current=readKingAttackPorts({actor,owner:api});if(current?.then||typeof current?.[name]!=='function')throw Error('Current synchronous actual King attack consumer required: '+name);return current[name](...args);} ]));
  attackOwner=retain('attackOwner',createConquestKingAttackOwner({actor,readCurrentActor:()=>bridge.actors.get(actorId),ports}));
  runtime=retain('runtime',movement.attachKingRuntime({clockOwner,baseStatePorts:lifecycle.ports,reactionPorts:reactions.ports,attackPorts:attackOwner,readPlaybackRate:state=>lifecycle.readPlaybackRate(state),readActorFrozen:()=>readConquestKingActorFrozen({actor,bridge,policy:kingResources.hostRolePolicy}),playCancelAnimation:(target,state,args)=>{if(target!==actor||!cancelAnimation)throw Error('Actual King cancel owner required');return cancelAnimation.play(state,args);},requestFastRunCommand:(target,state,args)=>{if(target!==actor||!fastRunProducer)throw Error('Actual King FastRun producer required');return fastRunProducer.produce(state,args);},retainPostPose:({animation,state})=>moveBox.retainPostPose(animation,{cancellationReceipt:state===runtime.preFastRun&&state.phase===1?cancelAnimation.readCurrent():null}),missingBlowClipPolicy:kingResources.missingBlowClipPolicy,animationOptions:{previousRequestedName:''}}));
  cancelAnimation=retain('cancelAnimation',createConquestKingCancelAnimation({actor,animation:runtime.animation,readCurrentState:()=>runtime.manager.current,policy:kingResources.cancelPolicy}));
  controlOwner=retain('controlOwner',createConquestKingAIControls({actor,monsterActors:bridge.actors,runtime,clockOwner,probabilityOwner}));
  damageNotification=retain('damageNotification',createConquestKingDamageNotification({actor,monsterActors:bridge.actors,playerActors,worldOwner:world,renderOwner:scene,health,runtimes:bridge.pawnRuntimes,runtime}));
  path=retain('path',new ConquestPawnPath({actor,monsterActors:bridge.actors,graphRegistry:graphs,resolveGraph:r=>graphs.resolveGraph(r),findPathFromActor:(from,to)=>host.navigation.findPath(from,to),probeSegment:r=>navigationQueries.probeSegment(r),readCurrentMode,readRangeFloat}),ConquestPawnPath.prototype.dispose);path.initializeFactoryGraph(graphSelection);
  host=retain('host',new ConquestKingAIHost({actor,monsterActors:bridge.actors,actorAuthority,world,worldQueries:navigationQueries,path,mapAI,deathProducer,controlOwner,runtime,readGrounded:()=>movement.synchronize().grounded6b4,spawnBase}),ConquestKingAIHost.prototype.dispose);
  fastRunProducer=retain('fastRunProducer',createConquestKingFastRunProducer({actor,bridge,actorAuthority,movementOwner:movement,readAIHost:()=>host,readGameTime,mirrorEnabled:commandMirrorEnabled}));
 }catch(error){try{release();}catch(cleanup){throw new AggregateError([error,cleanup],'King birth and cleanup failed');}throw error;}
 const live=()=>{if(disposed||bridge.actors.get(actorId)!==actor||bridge.pawnRuntimes.get(actorId)!==runtime||runtime.disposed)throw Error('Current owned composed King actor required');};
 api=Object.freeze({actor,model,runtime,movement,health,damageState,defenseAuraFields,reactions,path,host,presentation,persistentPresentation,lifecycle,attackOwner,moveBox,clockOwner,randomOwner,probabilityOwner,controlOwner,deathProducer,fastRunProducer,cancelAnimation,damageNotification,audioPresentation:presentation,
  get disposed(){return disposed;},releaseSnapshot(){return {actorId,phase,disposed,prepared,attemptedOwners:[...attempted],releasedOwners:[...released],failedOwners:[...failed],releaseReceiptAvailable:receipt!==null,nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPerformed:false};},readReleaseReceipt(){return receipt;},
  tickAI(deltaMs,context){live();return host.tickAI(deltaMs,context);},tickActorTail(deltaMs,context){live();movement.synchronize();return host.tickActorTail(deltaMs,context);},tickPostPose(deltaMs){live();runtime.updatePresentation(deltaMs);return persistentPresentation.update(deltaMs);},commandPorts:Object.freeze({...host.commandPorts,actorAuthority,movementOwner:movement,kingRuntime:runtime}),
  snapshot(){live();return {actorId,monsterKey:1500,movement:movement.snapshot(),ai:host.snapshot(),presentation:presentation.snapshot(),persistentPresentation:persistentPresentation.snapshot(),state:runtime.snapshot(),commandMirrorEnabled,nativeReady:false,mainModeIntegrated:false};},dispose:release,
 });owners.set(api,{actor,model,runtime,readReceipt:()=>receipt,readPhase:()=>phase});prepared=true;phase='live';return api;
}
