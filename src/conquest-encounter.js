import {prepareConquestKingSoundBank} from './conquest-king-audio.js';
import {conquestInactiveMainShieldCollection,readConquestConfiguredPlayerActorFlags} from './conquest-player-configured-actor-flags.js';
import {prepareConquestKingEffectsPresentation,CONQUEST_KING_AUTHORED_PRESENTATION_POLICY,CONQUEST_KING_AUTHORED_DEATH_PRESENTATION} from './conquest-king-effects-presentation.js';
import {createConquestKingEffectsService} from './conquest-king-effects-service.js';
import {CONQUEST_KING_RETAIN_EVALUATED_MOVEBOX} from './conquest-king-movebox.js';
import {CONQUEST_KING_MISSING_BLOW_CLIP_POLICY} from './conquest-king-runtime.js';
import {CONQUEST_KING_CANCEL_ANIMATION_POLICY} from './conquest-king-cancel-animation.js';
import {CONQUEST_KING_CURRENT_HOST_ROLE_POLICY} from './conquest-king-host-role.js';
import {CONQUEST_KING_DECLARED_CLOCK_STORAGE_POLICY} from './conquest-king-ai-clocks.js';
import {CONQUEST_KING_DECLARED_RANDOM_SEED} from './conquest-king-random.js';
import {prepareConquestQueenSoundBank} from './conquest-queen-audio.js';
import {createConquestQueenRayDistanceLimit} from './conquest-queen-ray-distance.js';
import {prepareConquestQueenEffectsPresentation,CONQUEST_QUEEN_AUTHORED_PRESENTATION_POLICY,CONQUEST_QUEEN_AUTHORED_DEATH_PRESENTATION} from './conquest-queen-effects-presentation.js';
import {createConquestQueenEffectsService} from './conquest-queen-effects-service.js';
import {CONQUEST_QUEEN_RETAIN_EVALUATED_MOVEBOX} from './conquest-queen-movebox.js';
import {CONQUEST_QUEEN_INACTIVE_STEALTH_POLICY} from './conquest-queen-stealth.js';
import {CONQUEST_QUEEN_DECLARED_RANDOM_SEED} from './conquest-queen-choice-fields.js';
import {prepareConquestRookExplodeFullPresentation,CONQUEST_ROOK_EXPLODE_FULL_PRESENTATION_POLICY} from './conquest-rook-explode-full-presentation.js';
import {createConquestRookExplodeEffectsService} from './conquest-rook-explode-effects-service.js';
import {CONQUEST_ROOK_EXPLODE_AUTHORED_REACTION_PRESENTATION} from './conquest-rook-explode-reactions.js';
import {CONQUEST_ROOK_EXPLODE_MISSING_ATTACK_CLIP_POLICY} from './conquest-rook-explode-runtime.js';
import {createConquestBishopSnipeRayDistanceLimit} from './conquest-bishop-snipe-ray-distance.js';
import {CONQUEST_BISHOP_SNIPE_PENDING_PRESENTATION} from './conquest-bishop-snipe-pending-presentation.js';
import {prepareConquestBishopSoundBank} from './conquest-bishop-audio.js';
import {prepareConquestBishopPresentation,CONQUEST_BISHOP_AUTHORED_PRESENTATION_POLICY} from './conquest-bishop-presentation.js';
import {createConquestBishopEffectsService} from './conquest-bishop-effects-service.js';
import {createConquestBishopRayDistanceLimit} from './conquest-bishop-ray-distance.js';
import {NATIVE_RIFLE_RANGE} from './native-rifle-range-data.js';
import {CombatState} from './combat-state.js';
import {ConquestSession} from './conquest-session.js';
import {prepareConquestEncounterNavigation} from './conquest-encounter-navigation.js';
import {prepareConquestEncounterPawnAttacks} from './conquest-encounter-pawn-attacks.js';
import {createConquestEncounterCombat,CONQUEST_ENCOUNTER_HANDGUN_POLICY} from './conquest-encounter-combat.js';
import {prepareConquestPawnSoundBank} from './conquest-pawn-presentation.js';
import {prepareConquestWaveAudio} from './conquest-wave-audio.js';
import {prepareNativeBooleanDistanceAcceleration} from './native-collision-bool-wasm.js';
import {prepareConquestPawnDeathEffects} from './conquest-pawn-death-effects.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
import {CONQUEST_PAWN_PARTICLE_TRIG_PROFILE} from './conquest-pawn-particle-spatial.js';
import {CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES} from './conquest-pawn-particle-admission.js';
import {createInitialConquestPlayerDefenseState} from './conquest-player-defense.js';
import {createInitialConquestPlayerDamageSource} from './conquest-player-monster-damage-record.js';
import {ConquestHandgunCriticalPreparation} from './conquest-handgun-critical-preparation.js';
import {ConquestHandgunEquipmentPower,CONQUEST_HANDGUN_PLAIN_ITEM_POLICY} from './conquest-handgun-equipment-power.js';
import {ConquestSmgCriticalPreparation} from './conquest-smg-critical-preparation.js';
import {ConquestSmgEquipmentPower,CONQUEST_SMG_PLAIN_ITEM_POLICY} from './conquest-smg-equipment-power.js';
import {createConquestSmgNpcShots,CONQUEST_SMG_NPC_SHOT_POLICY} from './conquest-smg-npc-shots.js';
import {ConquestSemiRifleCriticalPreparation} from './conquest-semi-rifle-critical-preparation.js';
import {ConquestSemiRifleEquipmentPower,CONQUEST_SEMI_RIFLE_PLAIN_ITEM_POLICY} from './conquest-semi-rifle-equipment-power.js';
import {createConquestSemiRifleNpcShots,CONQUEST_SEMI_RIFLE_NPC_SHOT_POLICY} from './conquest-semi-rifle-npc-shots.js';
import {ConquestAssaultRifleCriticalPreparation} from './conquest-assault-rifle-critical-preparation.js';
import {ConquestAssaultRifleEquipmentPower,CONQUEST_ASSAULT_RIFLE_PLAIN_ITEM_POLICY} from './conquest-assault-rifle-equipment-power.js';
import {createConquestAssaultRifleNpcShots,CONQUEST_ASSAULT_RIFLE_NPC_SHOT_POLICY} from './conquest-assault-rifle-npc-shots.js';
import {ConquestDaggerCutCriticalPreparation} from './conquest-dagger-critical-preparation.js';
import {ConquestDaggerCutEquipmentPower,CONQUEST_DAGGER_PLAIN_ITEM_POLICY} from './conquest-dagger-equipment-power.js';
import {createConquestDaggerNpcCuts,CONQUEST_DAGGER_NPC_CUT_POLICY} from './conquest-dagger-npc-cuts.js';
import {ConquestBaseGate} from './conquest-base-gate.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {sealConquestStaticSource} from './conquest-static-source-frame.js';
import {prepareConquestStageRoundBank} from './conquest-stage-round-bank.js';
import {createConquestPawnFinalizationOwner,CONQUEST_S5_PAWN_FINALIZATION_POLICY} from './conquest-pawn-finalization.js';
import {prepareConquestPawnExplodePresentation,CONQUEST_PAWN_EXPLODE_PRESENTATION_POLICY} from './conquest-pawn-explode-presentation.js';
import {prepareConquestPawnExplodeSoundBank} from './conquest-pawn-explode-audio.js';
import {CONQUEST_PAWN_EXPLODE_FRAME_POLICY} from './conquest-pawn-explode-frame.js';
import {conquestStageSequenceContinues,startConquestStageSequence} from './conquest-stage-progress.js';
import {prepareConquestRookFullPresentation,CONQUEST_ROOK_FULL_PRESENTATION_POLICY} from './conquest-rook-full-presentation.js';
import {CONQUEST_ROOK_AUTHORED_REACTION_PRESENTATION} from './conquest-rook-reactions.js';
import {createConquestRookEffectsService} from './conquest-rook-effects-service.js';
import {prepareConquestKnightSoundBank} from './conquest-knight-audio.js';
import {prepareConquestKnightChargeSoundBank} from './conquest-knight-charge-audio.js';
import {prepareConquestKnightChargePresentation,CONQUEST_KNIGHT_CHARGE_AUTHORED_PRESENTATION_POLICY} from './conquest-knight-charge-presentation.js';
import {CONQUEST_KNIGHT_RETAIN_EVALUATED_MOVEBOX} from './conquest-knight-movebox.js';
import {CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION} from './conquest-knight-reactions.js';

// Local playable source waves, including the staged King boss. All actors use the recovered source AI, geometry,
// states and effect owners. The explicit S5 Handgun arithmetic/identity/RNG
// policies do not qualify the remaining native equipment/delivery gates.
export async function prepareConquestEncounter({scene,world,controller,getAvatar,audio,camera,renderer,loadout,sex,fetchAsset,decodeImage,prepareStaticContacts=true,lastPreparedRound=8}={}){
 if(world?.nativeMapId!==46||controller.world!==world||typeof getAvatar!=='function'||typeof loadout?.snapshot!=='function')throw Error('Current map46 player and confirmed loadout required');
 if(renderer!==undefined&&(typeof renderer?.compileAsync!=='function'||!camera?.isCamera))throw Error('Conquest shader warmup requires the actual renderer and camera');
 sealConquestStaticSource(world);
 if(![1,2,3,4,5,6,7,8].includes(lastPreparedRound))throw Error('Currently prepared source rounds1..8 only');
 // Prepare outside gameplay clocks. Unsupported browsers retain the same VM;
 // each live query still reads the current navigation worlds and enable gates.
 await prepareNativeBooleanDistanceAcceleration();
 const health=new CombatState(),revision='s5-main-conquest-round1',playerId='local',playerPeer=[2,1<<16];
 let navigation,pawnAttacks,deathEffects,rookEffectsService,shooter,critical,equipment,shooterRifle,shooterRevision,stageBank,stageState,finalizer,waveAudio,explodeResources,explodePresentationBank,rookResources,rookPresentationBank,knightResources,knightChargeResources,knightChargePresentationBank,bishopResources,bishopRangeOwner,bishopPresentationBank,bishopEffectsService,bishopSnipeResources,bishopSnipeRangeOwner,rookExplodeResources,rookExplodePresentationBank,rookExplodeEffectsService,queenResources,queenRangeOwner,queenPresentationBank,queenEffectsService,kingResources,kingPresentationBank,kingEffectsService,disposed=false,carry=0,time=0,respawnRemainingMs=null,fault=null,lastShots=[];
 const playerVtable=sex==='female'?0x13c1c14:0x13aafdc;
 const defenseState=createInitialConquestPlayerDefenseState({playerVtable});
 const nextRandom15=()=>navigation.nextRandom15();
 const methodNames=['spawnSamples','allocateActorId','onWaveEvent','onActorsCreated','createPawnRuntime','createActorRuntime','updateAI','updateActorTail','updateActorPresentation','commandPorts','collectCleanup','releaseActorOwners'];
 const producers=Object.fromEntries(methodNames.map(key=>[key,args=>navigation.producers[key](args)]));
 producers.releaseActorOwners=args=>{
  if(args.reason==='source-global-reference-removal')finalizer.observeGlobalRemoval({...args,actorOwner:navigation.owners.get(args.actor)});
  return navigation.producers.releaseActorOwners(args);
 };
 producers.afterActorCleanup=()=>finalizer.finalizeRetired();
 const session=new ConquestSession({scene,world,ownsWorld:false,participants:[{accountId:1n,team:1}],round:1,recallSelection:0,isHost:true,spawnNode:'alpha_spawn_pos_01',teamRegistry:new Set([2]),producers,allowIncompleteTextures:true,preparedRounds:Array.from({length:lastPreparedRound-1},(_,i)=>i+2)});
 // Shield collection geometry remains a separate unported owner. Refuse that
 // query explicitly rather than publishing an empty collection for a shield.
 const readCurrentCollections=()=>{
  if(controller.s5runtimeShieldBodyState)return {qualified:false};
  if(controller.s5runtimeShieldActorProfile){readConquestConfiguredPlayerActorFlags(controller);if(!conquestInactiveMainShieldCollection(controller))return {qualified:false};}
  return {qualified:true,category400:{complete:true,records:[]}};
 };
 let shooterProfile=null;
 function releaseShooter(){shooter?.dispose();equipment?.dispose();critical?.dispose();shooter=equipment=critical=null;shooterRifle=null;shooterRevision=null;shooterProfile=null;}
 function finalizationSnapshot(){try{return finalizer.snapshot();}catch(error){return {qualified:false,reason:error.message,nativeReady:false};}}
 function prepareFinalizer(){return createConquestPawnFinalizationOwner({session,navigation,stageBank,stageState,policy:CONQUEST_S5_PAWN_FINALIZATION_POLICY,
  readCurrentLeases:({actor})=>({qualified:true,policy:CONQUEST_S5_PAWN_FINALIZATION_POLICY,owners:[...deathEffects.readActorLeases(actor),...(rookEffectsService?.readActorLeases(actor)??[]),...(bishopEffectsService?.readActorLeases(actor)??[]),...(rookExplodeEffectsService?.readActorLeases(actor)??[]),...(queenEffectsService?.readActorLeases(actor)??[]),...(kingEffectsService?.readActorLeases(actor)??[])]})});}
 function advanceCompletedRound(){
  if(session.defenseBase.state.snapshot().finished||session.config.round>=lastPreparedRound||stageState.sequence.destroyedCount!==stageState.sequence.round.expectedCount||session.bridge.commands.pending.length)return;
  if(conquestStageSequenceContinues(stageState.sequence))return;
  const nextIndex=stageState.rawRound78+1,next=stageBank.readRound(nextIndex),recallSelection=navigation.nextRandom15()%4;
  if(!next||!session.futurePlans.has(next.sourceRound))throw Error('Actual prepared next source round required');
  finalizer.dispose();session.enterPreparedRound({round:next.sourceRound,recallSelection});stageState.rawRound78=nextIndex;stageState.sequence.round=next;
  startConquestStageSequence(stageState,{beforeRoundStart:()=>{finalizer=prepareFinalizer();},startRound:round=>{stageBank.startRound(round,{recallSelection});session.start({gameTime:time});}});
 }
 function syncShooter(){
  const state=loadout.snapshot(),supported=['handgun','submachinegun','semirifle','assaultrifle','dagger'].includes(controller.weapon)&&state.status==='confirmed'&&!state.pending&&state.slots[state.activeSlot]===controller.weapon&&state.skins[state.activeSlot]==='classic';
  if(!supported){releaseShooter();return;}
  if(shooter&&shooterRifle===controller.rifle&&shooterRevision===state.revision&&(controller.weapon!=='dagger'||shooterProfile===navigation.playerProfile))return;
  releaseShooter();const base={playerId,playerActors:navigation.playerActors,controller,worldOwner:world,defenseState};
  if(controller.weapon==='dagger'){
   critical=new ConquestDaggerCutCriticalPreparation({...base,nextRandom15,nextInternalPercentRoll:()=>nextRandom15()%100});
   equipment=new ConquestDaggerCutEquipmentPower({...base,loadout,conquestSession:session,plainItemPolicy:CONQUEST_DAGGER_PLAIN_ITEM_POLICY});
   const sourceState=createInitialConquestPlayerDamageSource({...base,playerVtable});
   shooter=createConquestDaggerNpcCuts({...base,monsterActors:session.bridge.actors,runtimes:session.bridge.pawnRuntimes,renderOwner:scene,sourceState,equipmentPowerOwner:equipment,criticalPreparation:critical,readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),worldQueries:pawnAttacks.readWorldQueries(),sideContext:navigation.sideContext,playerAttackProfile:navigation.playerProfile,policy:CONQUEST_DAGGER_NPC_CUT_POLICY});
   shooterProfile=navigation.playerProfile;
  }else if(controller.weapon==='submachinegun'){
   critical=new ConquestSmgCriticalPreparation({...base,nextRandom15,nextInternalPercentRoll:()=>nextRandom15()%100});
   equipment=new ConquestSmgEquipmentPower({...base,loadout,conquestSession:session,plainItemPolicy:CONQUEST_SMG_PLAIN_ITEM_POLICY});
   const sourceState=createInitialConquestPlayerDamageSource({...base,playerVtable});
   shooter=createConquestSmgNpcShots({...base,monsterActors:session.bridge.actors,runtimes:session.bridge.pawnRuntimes,renderOwner:scene,sourceState,equipmentPowerOwner:equipment,criticalPreparation:critical,readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),policy:CONQUEST_SMG_NPC_SHOT_POLICY});
  }else if(controller.weapon==='semirifle'){
   critical=new ConquestSemiRifleCriticalPreparation({...base,nextRandom15,nextInternalPercentRoll:()=>nextRandom15()%100});
   equipment=new ConquestSemiRifleEquipmentPower({...base,loadout,conquestSession:session,plainItemPolicy:CONQUEST_SEMI_RIFLE_PLAIN_ITEM_POLICY});
   const sourceState=createInitialConquestPlayerDamageSource({...base,playerVtable});
   shooter=createConquestSemiRifleNpcShots({...base,monsterActors:session.bridge.actors,runtimes:session.bridge.pawnRuntimes,renderOwner:scene,sourceState,equipmentPowerOwner:equipment,criticalPreparation:critical,readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),policy:CONQUEST_SEMI_RIFLE_NPC_SHOT_POLICY});
  }else if(controller.weapon==='assaultrifle'){
   critical=new ConquestAssaultRifleCriticalPreparation({...base,nextRandom15,nextInternalPercentRoll:()=>nextRandom15()%100});
   equipment=new ConquestAssaultRifleEquipmentPower({...base,loadout,conquestSession:session,plainItemPolicy:CONQUEST_ASSAULT_RIFLE_PLAIN_ITEM_POLICY});
   const sourceState=createInitialConquestPlayerDamageSource({...base,playerVtable});
   shooter=createConquestAssaultRifleNpcShots({...base,monsterActors:session.bridge.actors,runtimes:session.bridge.pawnRuntimes,renderOwner:scene,sourceState,equipmentPowerOwner:equipment,criticalPreparation:critical,readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),policy:CONQUEST_ASSAULT_RIFLE_NPC_SHOT_POLICY});
  }else{
  critical=new ConquestHandgunCriticalPreparation({...base,nextRandom15,nextInternalPercentRoll:()=>nextRandom15()%100});
  equipment=new ConquestHandgunEquipmentPower({...base,loadout,conquestSession:session,plainItemPolicy:CONQUEST_HANDGUN_PLAIN_ITEM_POLICY});
  const sourceState=createInitialConquestPlayerDamageSource({...base,playerVtable});
  shooter=createConquestEncounterCombat({...base,monsterActors:session.bridge.actors,runtimes:session.bridge.pawnRuntimes,renderOwner:scene,sourceState,equipmentPowerOwner:equipment,criticalPreparation:critical,readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),policy:CONQUEST_ENCOUNTER_HANDGUN_POLICY});
  }
  for(const owner of navigation.owners.values())shooter.bindActor(owner);
  shooterRifle=controller.rifle;shooterRevision=state.revision;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  // Actor combat unbind must precede factory/health release. The callbacks
  // remain live until Session has released its complete actor cohort.
  session.dispose();finalizer?.dispose();releaseShooter();pawnAttacks?.dispose();navigation?.dispose();deathEffects?.dispose();rookEffectsService?.dispose();bishopEffectsService?.dispose();rookExplodeEffectsService?.dispose();queenEffectsService?.dispose();kingEffectsService?.dispose();kingPresentationBank?.dispose();queenPresentationBank?.dispose();rookExplodePresentationBank?.dispose();bishopPresentationBank?.dispose();explodePresentationBank?.dispose();rookPresentationBank?.dispose();knightChargePresentationBank?.dispose();bishopRangeOwner?.dispose();bishopSnipeRangeOwner?.dispose();queenRangeOwner?.dispose();stageBank?.dispose();waveAudio?.dispose();
 }
 try{
  const soundBank=await prepareConquestPawnSoundBank({audio,...(fetchAsset?{fetchAsset}:{})});
  waveAudio=await prepareConquestWaveAudio({audio,...(fetchAsset?{fetchAsset}:{})});
  if(lastPreparedRound>=2){
   const explodeSoundBank=await prepareConquestPawnExplodeSoundBank({audio,...(fetchAsset?{fetchAsset}:{})});
   explodePresentationBank=await prepareConquestPawnExplodePresentation({policy:CONQUEST_PAWN_EXPLODE_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   explodeResources={presentationBank:explodePresentationBank,soundBank:explodeSoundBank,particles:{camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0],framePolicy:CONQUEST_PAWN_EXPLODE_FRAME_POLICY},readOrientation8C:actor=>actor.facingNative};
  }
  if(lastPreparedRound>=3){
   rookPresentationBank=await prepareConquestRookFullPresentation({policy:CONQUEST_ROOK_FULL_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   const particles={camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]};
   rookEffectsService=createConquestRookEffectsService({bank:rookPresentationBank,world,scene,...particles});
   rookResources={presentationBank:rookPresentationBank,presentationPolicy:CONQUEST_ROOK_AUTHORED_REACTION_PRESENTATION,particles,effectsService:rookEffectsService};
   knightResources={soundBank:await prepareConquestKnightSoundBank({audio,...(fetchAsset?{fetchAsset}:{})}),missingClipPolicy:CONQUEST_KNIGHT_RETAIN_EVALUATED_MOVEBOX,deathPresentationPolicy:CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION};
  }
  deathEffects=await prepareConquestPawnDeathEffects({world,scene,camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0],clockProfile:{precisionBits:64,roundingMode:'nearest'},...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
  // A new local S5 match reloads the authenticated INI health into its retained
  // source gate. Cached map geometry survives the previous match; damaged gate
  // HP cannot become the constructor input for the new defense counter.
  const gate=world.baseGates?.[0],rule=CONQUEST_SOURCE_DATA.pveRule;
  if(world.baseGates?.length!==1||!(gate instanceof ConquestBaseGate)||gate.name!==rule.base_object_1)throw Error('Current source Conquest base required for a new match');
  gate.loadHealth(Number(rule.base_object_1_hp));
  if((await session.prepare()).phase!=='prepared')throw Error(session.blockers.join('; '));
  if(lastPreparedRound>=4){
   knightChargePresentationBank=await prepareConquestKnightChargePresentation({policy:CONQUEST_KNIGHT_CHARGE_AUTHORED_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   knightChargeResources={soundBank:await prepareConquestKnightChargeSoundBank({audio,...(fetchAsset?{fetchAsset}:{})}),missingClipPolicy:null,presentationPolicy:CONQUEST_KNIGHT_CHARGE_AUTHORED_PRESENTATION_POLICY,presentationBank:knightChargePresentationBank,particles:{camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]}};
  }
  if(lastPreparedRound>=5){
   bishopRangeOwner=createConquestBishopRayDistanceLimit({world,option33:NATIVE_RIFLE_RANGE.referenceOption33});
   bishopPresentationBank=await prepareConquestBishopPresentation({policy:CONQUEST_BISHOP_AUTHORED_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   const particles={camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]};
   bishopEffectsService=createConquestBishopEffectsService({bank:bishopPresentationBank,world,scene,...particles});
   bishopResources={rangeOwner:bishopRangeOwner,soundBank:await prepareConquestBishopSoundBank({audio,...(fetchAsset?{fetchAsset}:{})}),presentationPolicy:CONQUEST_BISHOP_AUTHORED_PRESENTATION_POLICY,presentationBank:bishopPresentationBank,effectsService:bishopEffectsService,particles};
  }
  if(lastPreparedRound>=6){bishopSnipeRangeOwner=createConquestBishopSnipeRayDistanceLimit({world,option33:NATIVE_RIFLE_RANGE.referenceOption33});bishopSnipeResources={rangeOwner:bishopSnipeRangeOwner,presentationPolicy:CONQUEST_BISHOP_SNIPE_PENDING_PRESENTATION};}
  // Prepared only after the full source wave7 composition is admitted.
  if(lastPreparedRound>=7){
   rookExplodePresentationBank=await prepareConquestRookExplodeFullPresentation({policy:CONQUEST_ROOK_EXPLODE_FULL_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   const particles={camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]};
   rookExplodeEffectsService=createConquestRookExplodeEffectsService({bank:rookExplodePresentationBank,world,scene,...particles});
   rookExplodeResources={presentationBank:rookExplodePresentationBank,particles,effectsService:rookExplodeEffectsService,presentationPolicy:CONQUEST_ROOK_EXPLODE_AUTHORED_REACTION_PRESENTATION,missingAttackClipPolicy:CONQUEST_ROOK_EXPLODE_MISSING_ATTACK_CLIP_POLICY};
  }
  if(lastPreparedRound>=7){
   queenRangeOwner=createConquestQueenRayDistanceLimit({world,option33:NATIVE_RIFLE_RANGE.referenceOption33});
   queenPresentationBank=await prepareConquestQueenEffectsPresentation({policy:CONQUEST_QUEEN_AUTHORED_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   const particles={camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]};
   queenEffectsService=createConquestQueenEffectsService({bank:queenPresentationBank,world,scene,...particles});
   queenResources={soundBank:await prepareConquestQueenSoundBank({audio,...(fetchAsset?{fetchAsset}:{})}),rangeOwner:queenRangeOwner,presentationBank:queenPresentationBank,effectsService:queenEffectsService,particles,presentationPolicy:CONQUEST_QUEEN_AUTHORED_PRESENTATION_POLICY,deathPresentationPolicy:CONQUEST_QUEEN_AUTHORED_DEATH_PRESENTATION,missingClipPolicy:CONQUEST_QUEEN_RETAIN_EVALUATED_MOVEBOX,stealthPolicy:CONQUEST_QUEEN_INACTIVE_STEALTH_POLICY,seed32:1,seedPolicy:CONQUEST_QUEEN_DECLARED_RANDOM_SEED};
  }
  if(lastPreparedRound>=8){
   kingPresentationBank=await prepareConquestKingEffectsPresentation({policy:CONQUEST_KING_AUTHORED_PRESENTATION_POLICY,...(fetchAsset?{fetchAsset}:{}),...(decodeImage?{decodeImage}:{})});
   const particles={camera,nextRandom15,numericalProfile:CONQUEST_PAWN_PARTICLE_NUMERICS,trigProfile:CONQUEST_PAWN_PARTICLE_TRIG_PROFILE,qualityProfile:CONQUEST_PAWN_PARTICLE_QUALITY_PROFILES[0]};
   kingEffectsService=createConquestKingEffectsService({bank:kingPresentationBank,world,scene,...particles});
   kingResources={soundBank:await prepareConquestKingSoundBank({audio,...(fetchAsset?{fetchAsset}:{})}),presentationPolicy:CONQUEST_KING_AUTHORED_PRESENTATION_POLICY,presentationBank:kingPresentationBank,effectsService:kingEffectsService,particles,deathPresentationPolicy:CONQUEST_KING_AUTHORED_DEATH_PRESENTATION,missingTrackPolicy:CONQUEST_KING_RETAIN_EVALUATED_MOVEBOX,missingBlowClipPolicy:CONQUEST_KING_MISSING_BLOW_CLIP_POLICY,cancelPolicy:CONQUEST_KING_CANCEL_ANIMATION_POLICY,hostRolePolicy:CONQUEST_KING_CURRENT_HOST_ROLE_POLICY,clockStoragePolicy:CONQUEST_KING_DECLARED_CLOCK_STORAGE_POLICY,seed32:1,seedPolicy:CONQUEST_KING_DECLARED_RANDOM_SEED};
  }
  navigation=prepareConquestEncounterNavigation({scene,world,controller,avatar:getAvatar(),combatState:health,bridge:session.bridge,audio,soundBank,deathEffects,explodeResources,rookResources,knightResources,knightChargeResources,bishopResources,bishopSnipeResources,rookExplodeResources,queenResources,kingResources,seed:1,revision,playerId,playerTeam:1,playerPeerId2c:playerPeer,flipTeams:false,managerFlag20:false,readCurrentCollections,getAvatar,cacheStaticSegments:true,prepareStaticContacts,
   hooks:{onWaveEvent:({request})=>waveAudio.play(request),readGameTime:()=>time,readKingAttackPorts:args=>pawnAttacks.readKingAttackPorts(args),readPlayerPeerId:()=>playerPeer,resolveAttribute:id=>({id}),readAttackPorts:args=>pawnAttacks.readAttackPorts(args),readExplodeAttackPorts:args=>pawnAttacks.readExplodeAttackPorts(args),
    bindActor:({owner})=>{shooter?.bindActor(owner);pawnAttacks.bindActor(owner);},
    readKnightAttackPorts:args=>pawnAttacks.readKnightAttackPorts(args),readKnightChargeAttackPorts:args=>pawnAttacks.readKnightChargeAttackPorts(args),readBishopAttackPorts:args=>pawnAttacks.readBishopAttackPorts(args),readBishopSnipeAttackPorts:args=>pawnAttacks.readBishopSnipeAttackPorts(args),readRookExplodeAttackPorts:args=>pawnAttacks.readRookExplodeAttackPorts(args),readQueenAttackPorts:args=>pawnAttacks.readQueenAttackPorts(args),readRookAuraQuery:args=>pawnAttacks.readRookAuraQuery(args),
    unbindActor:({actor})=>{shooter?.unbindActor(actor);if(![1013,1110,1203,1204,1303,1314,1403,1500].includes(actor.spawnStats.monsterKey))pawnAttacks?.unbindActor(actor);},
    afterActorRelease:({actor})=>{if([1013,1110,1203,1204,1303,1314,1403,1500].includes(actor.spawnStats.monsterKey))pawnAttacks?.unbindActor(actor);},
    probeVisibility:({from,to})=>{
     const authority=navigation.actorAuthority,a=authority.position(from),b=authority.position(to);
     // Half-height endpoints are the explicit S5 local-host LOS policy;
     // endpoint producer/native visibility parity remains unobserved.
     const result=navigation.navigationQueries.probeSegment({from:[a.x,a.y+authority.height(from)*.5,a.z],to:[b.x,b.y+authority.height(to)*.5,b.z],queryMask:0x4000bf,rawQueryFlag:true,coordinateSpace:'native',nativeEntry:0x7b57a0});
     return result?.qualified===true?{qualified:true,visible:!result.blocked}:{qualified:false};
    }}});
  pawnAttacks=prepareConquestEncounterPawnAttacks({navigation,bridge:session.bridge,world,scene,combatState:health,defenseState,playerVtable,readCurrentCollections,nextRandom15,enableRound3:lastPreparedRound>=3,rookEffectsService,readGameTime:()=>time,readPlaying:()=>session.phase==='running'});
  syncShooter();
  session.prepareActorCleanup({owner:navigation.cleanup,ownsOwner:false});
  session.prepareDeathEffects({effects:deathEffects,ownsEffects:false,readDeltaMs:({deltaMs})=>deltaMs});
  session.prepareDefenseBase({revision,mirrorEnabled:false,readTimeTokenRaw:({gameTime})=>gameTime,hasRegisteredAIResource:literal=>[...navigation.owners.values()].some(owner=>owner.actor.aiScriptLiteral===literal)});
  stageBank=await prepareConquestStageRoundBank({isHost:true});
  stageState={rawRound78:0,sequence:{round:stageBank.readRound(0),destroyedCount:0,active:true}};
  finalizer=prepareFinalizer();stageBank.startRound(stageState.sequence.round,{recallSelection:0});
  // Pool models are not in the scene until their source birth. Compiling the
  // visible loading scene alone therefore misses every future monster shader.
  if(renderer!==undefined){
   await session.warm(renderer,camera);
   // Effects retain detached templates until bank disposal, so their real
   // textures and matching shader programs can be prepared before gameplay.
   // Future per-instance vertex buffers are not uploaded by compileAsync.
   for(const bank of [deathEffects,explodePresentationBank,rookPresentationBank,knightChargePresentationBank,bishopPresentationBank,rookExplodePresentationBank,queenPresentationBank,kingPresentationBank])if(bank)await bank.warm(renderer,camera,scene);
  }
  session.start({gameTime:0});
 }catch(error){dispose();throw error;}
 const api={health,session,navigation,readRookEffects:()=>rookEffectsService?.snapshot()??null,readBishopEffects:()=>bishopEffectsService?.snapshot()??null,readQueenEffects:()=>queenEffectsService?.snapshot()??null,readKingEffects:()=>kingEffectsService?.snapshot()??null,
  step(dt){
   if(disposed||fault)return;
   try{
    navigation.syncPlayerAvatar();pawnAttacks.syncPlayerAvatar();syncShooter();
    carry+=dt*1000;const delta=Math.floor(carry);carry-=delta;time=(time+delta)>>>0;health.tick(dt);
    session.step(delta,{gameTime:time});rookEffectsService?.tick(delta);bishopEffectsService?.tick(delta);rookExplodeEffectsService?.tick(delta);queenEffectsService?.tick(delta);kingEffectsService?.tick(delta);advanceCompletedRound();
    if(health.dead){
     // Explicit temporary S5 respawn policy, not destructible-object INI
     // rebirthtime and not a claimed native player respawn measurement.
     respawnRemainingMs=(respawnRemainingMs??5000)-delta;
     if(respawnRemainingMs<=0){
      // The real Controller reset also resets its retained static/native body
      // and creates a fresh rifle. Preserve only the public position identity
      // pinned by navigation/profile owners, copying the actual reset result.
      // No coordinates, source actor flags or player reaction are invented.
      const position=controller.position;health.reset();releaseShooter();controller.reset();
      Object.assign(position,controller.position);controller.position=position;respawnRemainingMs=null;
     }
    }
   }catch(error){fault=error.message;console.error('Conquest encounter stopped',error);}
  },
  // The legacy automatic queue has no lastShot metadata. Capture immediately
  //after each Controller substep, before events/loadout can describe a later job.
  //Handgun keeps its existing post-mixer activation/preparation unchanged.
  captureStepShots(){if(disposed||fault||health.dead||!['submachinegun','semirifle','assaultrifle','dagger'].includes(controller.weapon))return null;try{navigation.syncPlayerAvatar();syncShooter();return shooter?.captureStep()??null;}catch(error){fault=error.message;console.error('Conquest shot capture stopped',error);return null;}},
  resolveRifleShots(avatar){if(disposed||fault||health.dead)return [];
   // Inventory evaluates the new avatar once at dt0 before the next Controller
   // substep. The departed action's state label is still present at that point.
   // Only the next actual simulation step may select/bind the new body profile.
   if(navigation.avatar!==avatar)return [];
   try{navigation.syncPlayerAvatar();syncShooter();lastShots=(controller.weapon==='dagger'?shooter?.resolveCuts(avatar):['submachinegun','semirifle','assaultrifle'].includes(controller.weapon)?shooter?.resolveShots(avatar):shooter?.resolveRifleShots(avatar))??[];return lastShots;}catch(error){fault=error.message;console.error('Conquest shot stopped',error);return []; }},
  snapshot(){const base=session.defenseBase?.state.snapshot(),completed=stageState.sequence.destroyedCount===stageState.sequence.round.expectedCount;return {status:fault?'faulted':base?.finished?'base-destroyed':completed?'round-cleared':'playing',fault,baseHp:base?.health??0,baseMaxHp:base?.maxHealth??30000,alive:session.bridge.actors.size,born:session.roundActorSerial,total:stageState.sequence.round.expectedCount,round:session.config.round,playerHp:health.hp,dead:health.dead,respawnRemainingMs,weaponSupported:!!shooter,weaponPrimaryOnly:!!shooter&&controller.weapon==='dagger',nativeReady:false,mainIntegrated:true,completedRounds:session.config.round-1+(completed?1:0),finalization:finalizationSnapshot(),nextRoundReady:session.futurePlans.has(session.config.round+1),playerRespawnPolicy:'S5 temporary5seconds',lastShots:lastShots.map(r=>({delivered:r.delivered,status:r.status,damage:r.record?.damage50??null})),staticSegments:navigation.navigationQueries.snapshot().staticSegments,session:session.snapshot()};},
  dispose,
 };
 return Object.freeze(api);
}

