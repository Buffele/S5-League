import {createConquestBishopSnipePlayerFacing,CONQUEST_BISHOP_SNIPE_PLAYER_FACING_POLICY} from './conquest-bishop-snipe-player-facing.js';
import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {createConquestNavigationGraphRegistry,conquestNavigationAreaTeam,CONQUEST_NAVIGATION_GRAPH_MATH_PROFILE,auditConquestNavigationGraphRegistry} from './conquest-navigation-graph.js';
import {createConquestNavigationWorldQueries,CONQUEST_NAVIGATION_WORLD_MATH_PROFILE,auditConquestNavigationWorldQueries} from './conquest-navigation-world-queries.js';
import {createConquestMovementWorldQueries,CONQUEST_MOVEMENT_WORLD_MATH_PROFILE,auditConquestMovementWorldQueries} from './conquest-movement-world-queries.js';
import {createConquestPawnMapAI,CONQUEST_PAWN_MAP_AI_MATH_PROFILE,auditConquestPawnMapAI} from './conquest-pawn-map-ai.js';
import {createConquestAttackSideContext,createConquestPlayerAttackProfile,invalidateConquestPlayerAttackProfile} from './conquest-player-attack-profile.js';
import {createConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';
import {CONQUEST_PAWN_SOURCE_INITIAL_MOVEMENT_GLOBALS} from './conquest-pawn-movement-owner.js';
import {createConquestDeferredActorCleanup} from './conquest-deferred-actor-cleanup.js';
import {assertConquestPawnDeathEffects} from './conquest-pawn-death-effects.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {createS5RuntimeCRTRandom} from './s5runtime-crt-random.js';
import {createConquestPlayerBodyCollection,CONQUEST_CURRENT_PLAYER_BODY_POLICY} from './conquest-player-body-collection.js';

const f=Math.fround,owners=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const sync=(fn,args,label)=>{if(typeof fn!=='function')throw Error('Encounter '+label+' producer required');const value=fn(args);if(value&&typeof value.then==='function')throw Error('Encounter '+label+' must be synchronous');return value;};
const pair=p=>{if(!Array.isArray(p)||p.length!==2||!p.every(u32))throw Error('Explicit encounter two-DWORD peer required');return Object.freeze([...p]);};

// Composes the existing real source implementations. Owns only navigation,
// profiles, shared queries and per-actor subowners; Session still owns models,
// world, command phases, deferred unlink and scene/global Death effects.
export function prepareConquestEncounterNavigation({scene,world,controller,avatar,combatState,bridge,audio,soundBank,deathEffects,explodeResources=null,rookResources=null,knightResources=null,knightChargeResources=null,bishopResources=null,bishopSnipeResources=null,rookExplodeResources=null,queenResources=null,kingResources=null,
 seed,revision,playerId='local',playerTeam,playerPeerId2c,flipTeams,managerFlag20,readCurrentCollections,hooks={},mirrorEnabled=false,getAvatar,cacheStaticSegments=false,prepareStaticContacts=false}={}){
 if(!scene?.isScene||world?.nativeMapId!==46||!(controller instanceof Controller)||controller.world!==world||!(combatState instanceof CombatState)||!avatar?.group?.isObject3D||!(bridge instanceof ConquestRuntimeBridge))throw Error('Actual encounter Scene/map46/Controller/avatar/CombatState/bridge required');
 // Every lower owner must retain the SAME world as Controller/profile. The
 // collision source is a child service, never a substitute player world.
 if(world.sourceData?.schema!=='conquest-native-collision-source-v1'||world.collisionSourceWorld?.active!==true||!Array.isArray(world.nativeCollisionSources))throw Error('Controller world must expose its current collisionSourceWorld and source descriptors');
 if(!u32(seed)||typeof revision!=='string'||!revision.trim()||![1,2].includes(playerTeam)||typeof flipTeams!=='boolean'||typeof managerFlag20!=='boolean'||typeof mirrorEnabled!=='boolean'||typeof readCurrentCollections!=='function')throw Error('Explicit encounter seed/revision/team/current room/collections policy required');
 const playerPeer=pair(playerPeerId2c);if(((playerPeer[1]>>>16)&7)!==1)throw Error('Explicit source-kind1 player peer required');
 for(const key of ['readPlayerPeerId','resolveAttribute','readAttackPorts'])if(typeof hooks[key]!=='function')throw Error('Explicit encounter combat hook '+key+' required');
 assertConquestPawnDeathEffects(deathEffects,{world,scene});
 const random=createS5RuntimeCRTRandom(seed),monsterActors=bridge.actors,pawnRuntimes=bridge.pawnRuntimes,playerRecord={controller,combatState,model:avatar},playerActors=new Map([[playerId,playerRecord]]),playerTeamSelectors=new Map([[playerId,playerTeam]]),teamEntries=new Map([[0,{}],[1,{}],[2,{}]]);
 const actorOwners=new Map(),reactionsByActor=new Map(),selectionByActor=new Map(),solverOwners=new Set(),birthSerials=new Map(),pendingSelections=new Map(),abortUnbindIds=new Set(),waveEvents=[];
 const playerBodyCollection=createConquestPlayerBodyCollection({controller,combatState,playerActors,playerId,world,playerTeamSelectors,teamEntries,solverId:revision+':player-body:'+playerId,policy:CONQUEST_CURRENT_PLAYER_BODY_POLICY});
 let graphs,navigationQueries,movementQueries,actorAuthority,mapAI,playerProfile,sideContext,cleanup,playerFacingOwner,disposed=false,serial=0,api;
 function live(){if(disposed)throw Error('Disposed encounter navigation');if(controller.world!==world||playerRecord.controller!==controller||playerRecord.combatState!==combatState||playerRecord.model!==avatar||bridge.actors!==monsterActors||bridge.pawnRuntimes!==pawnRuntimes)throw Error('Current encounter player/round owners replaced');}
 function actorOwner(actor){live();const owner=actorOwners.get(actor);if(!owner||owner.disposed||bridge.actors.get(actor.id)!==actor)throw Error('Current encounter actor owner required');return owner;}
 function updatePlayerAvatar(nextAvatar){
  live();if(nextAvatar===avatar)return false;if(!nextAvatar?.group?.isObject3D)throw Error('Actual next encounter player avatar required');
  const previousAvatar=avatar,previousProfile=playerProfile;let nextProfile;
  playerRecord.model=nextAvatar;
  try{nextProfile=createConquestPlayerAttackProfile({playerId,playerActors,record:playerRecord,worldOwner:world,renderOwner:scene,sideContext,selection:'source-constructed-player-actions'});}
  catch(error){playerRecord.model=previousAvatar;throw error;}
  actorAuthority.unbind(playerId);invalidateConquestPlayerAttackProfile(previousProfile);avatar=nextAvatar;playerProfile=nextProfile;
  actorAuthority.bindPlayer(playerId,{profile:playerProfile,peerId2c:playerPeer});
  if(hooks.onPlayerAvatarChanged)sync(hooks.onPlayerAvatarChanged,{previousAvatar,avatar,previousProfile,profile:playerProfile,navigation:api},'player avatar change');
  return true;
 }
 const attackKeys=['prepareAttack','queryContacts','consumeContacts','isEnabled','collisionAllowed'];
 function lazyAttackPorts(actor){return Object.fromEntries(attackKeys.map(key=>[key,(...args)=>{
  const owner=actorOwner(actor),ports=sync(hooks.readAttackPorts,{actor,owner,navigation:api},'attack ports');
  if(typeof ports?.[key]!=='function')throw Error('Current encounter attack boundary '+key+' required');return ports[key](...args);
 }]));}
 function releaseActorOwners({actor,reason}={}){
  live();const owner=actorOwners.get(actor);
  const unbindAuthority=()=>{
   // Session abort retains its whole actor Map until every child owner has
   // released. Keep matching authority coverage throughout sibling hooks.
   if(reason==='session-abort'){abortUnbindIds.add(actor.id);if(actorOwners.size===0){for(const id of abortUnbindIds)actorAuthority.unbind(id);abortUnbindIds.clear();}}
   else actorAuthority.unbind(actor.id);
  };
  if(!owner){selectionByActor.delete(actor);unbindAuthority();return;}
  // Combat/weapon adapters release their actor receipts while the health,
  // runtime and model are still live. This is not model destruction.
  const errors=[];let receipt;
  try{if(hooks.unbindActor)sync(hooks.unbindActor,{actor,owner,navigation:api,reason},'combat unbind');}catch(error){errors.push(error);}
  try{receipt=owner.dispose();}catch(error){errors.push(error);}
  try{if(hooks.afterActorRelease)sync(hooks.afterActorRelease,{actor,owner,navigation:api,reason},'post-owner combat unbind');}catch(error){errors.push(error);}
  solverOwners.delete(owner.movement);actorOwners.delete(actor);reactionsByActor.delete(actor);selectionByActor.delete(actor);birthSerials.delete(actor.id);unbindAuthority();
  if(errors.length)throw new AggregateError(errors,'Encounter actor release failed');return {owner,receipt};
 }
 const producers={
  spawnSamples({request,session}={}){
   live();if(session&&session.bridge!==bridge||!request?.spawn||pendingSelections.has(request))throw Error('Current unconsumed encounter spawn request required');
   const raw=bridge.schedule.records[request.index]?.raw;if(!raw||![1003,1013,1100,1110,1203,1204,1303,1314,1403,1500].includes(Number(raw.monster_key))||request.spawn.monsterKey!==Number(raw.monster_key))throw Error('Actual integrated source monster spawn record required');
   const categories=['simple_waypoint','normal_waypoint','difficult_waypoint'].flatMap((key,i)=>Number(raw[key])!==0?[i]:[]),selections=[],statSamples=[],jitterSamples=[];
   for(let i=0;i<request.spawn.count;i++){
    selections.push(graphs.sampleSingleCategorySpawn({group320:request.spawn.spawnIndex,teamSelector64:[request.spawn.team,0],categoryCandidates:categories,readRand:()=>random.next()}));
    jitterSamples.push({jitterX:random.next()%200-100,jitterZ:random.next()%200-100});statSamples.push(Array.from({length:4},()=>random.next()));
   }
   pendingSelections.set(request,selections);return {statSamples,jitterSamples};
  },
  allocateActorId(){live();if(serial>=8191)throw Error('Explicit S5 encounter peer allocation exhausted');const id=revision+':pawn:'+(++serial);birthSerials.set(id,serial);return id;},
  onWaveEvent(context){live();waveEvents.push({index:context.request.index,sourceEvent:context.request.sourceEvent,sound:context.request.sound});if(hooks.onWaveEvent)return sync(hooks.onWaveEvent,{...context,navigation:api},'wave event');},
  onActorsCreated({actors,request,bridge:currentBridge}={}){
   live();const selected=pendingSelections.get(request);if(currentBridge!==bridge||!Array.isArray(actors)||selected?.length!==actors.length)throw Error('Actual complete encounter birth cohort required');
   // Bind ALL siblings before constructing a host or invoking registry checks.
   for(const [i,actor]of actors.entries()){
    const index=birthSerials.get(actor.id);if(!index||bridge.actors.get(actor.id)!==actor||actorOwners.has(actor))throw Error('Actual distinct encounter Pawn birth required');
    actorAuthority.bindMonster(actor.id,{peerId2c:[1,(((index*8+6)<<16)|index)>>>0]});selectionByActor.set(actor,selected[i]);
   }
   pendingSelections.delete(request);
  },
  createActorRuntime({actor,bridge:currentBridge}={}){
   live();if(currentBridge!==bridge||actorOwners.has(actor)||!selectionByActor.has(actor))throw Error('Current authority-bound encounter Pawn required');
   const selection=selectionByActor.get(actor),spawnBase=CONQUEST_SOURCE_DATA.spawns['MONSTER_REGEN_'+selection.group320]?.object_name;
   const owner=createConquestPawnActorRuntime({actor,bridge,scene,world,actorAuthority,playerActors,movementQueries,navigationQueries,graphs,mapAI,audio,soundBank,deathEffects,explodeResources,rookResources,knightResources,knightChargeResources,bishopResources,bishopSnipeResources,rookExplodeResources,queenResources,kingResources,playerFacingOwner,nextRandom15:()=>random.next(),
    readExplodeAttackPorts:args=>sync(hooks.readExplodeAttackPorts,{...args,navigation:api},'explosive attack ports'),
    readKnightAttackPorts:args=>sync(hooks.readKnightAttackPorts,{...args,navigation:api},'Knight attack ports'),
    readKnightChargeAttackPorts:args=>sync(hooks.readKnightChargeAttackPorts,{...args,navigation:api},'KnightCharge attack ports'),
    readBishopAttackPorts:args=>sync(hooks.readBishopAttackPorts,{...args,navigation:api},'Bishop attack ports'),
    readBishopSnipeAttackPorts:args=>sync(hooks.readBishopSnipeAttackPorts,{...args,navigation:api},'BishopSnipe attack ports'),
    readQueenAttackPorts:args=>sync(hooks.readQueenAttackPorts,{...args,navigation:api},'Queen attack ports'),
    readKingAttackPorts:args=>sync(hooks.readKingAttackPorts,{...args,navigation:api},'King attack ports'),
    readGameTime:()=>sync(hooks.readGameTime,{navigation:api},'current game time'),
    readRookExplodeAttackPorts:args=>sync(hooks.readRookExplodeAttackPorts,{...args,navigation:api},'RookExplode attack ports'),
    readRookAuraQuery:args=>sync(hooks.readRookAuraQuery,{...args,navigation:api},'Rook aura query'),
    graphSelection:selection,spawnBase,globalsProfile:CONQUEST_PAWN_SOURCE_INITIAL_MOVEMENT_GLOBALS,
    readCurrentMode:()=>{live();return {qualified:true,mode:12};},
    readRangeFloat:({minimum,maximum})=>({qualified:true,value:f(f(f(maximum-minimum)*f(random.next()/32767))+minimum)}),
    readPlayerPeerId:args=>sync(hooks.readPlayerPeerId,{...args,navigation:api},'player peer'),resolveAttribute:id=>sync(hooks.resolveAttribute,id,'attribute'),attackPorts:lazyAttackPorts(actor)});
   actorOwners.set(actor,owner);reactionsByActor.set(actor,owner.reactions);solverOwners.add(owner.movement);
   try{if(hooks.bindActor)sync(hooks.bindActor,{actor,owner,navigation:api},'combat bind');}catch(error){try{releaseActorOwners({actor,reason:'failed-combat-bind'});}catch(release){throw new AggregateError([error,release],'Encounter birth binding failed');}throw error;}
   return owner.runtime;
  },
  updateAI:({actor,deltaMs,gameTime})=>actorOwner(actor).tickAI(deltaMs,{gameTime,isHost:bridge.isHost}).commands,
  updateActorTail:({actor,deltaMs})=>actorOwner(actor).tickActorTail(deltaMs,{isHost:bridge.isHost}),
  updateActorPresentation:({actor,deltaMs})=>actorOwner(actor).tickPostPose?.(deltaMs),
  commandPorts:({actor})=>({...actorOwner(actor).commandPorts,mirrorEnabled,onDestroy(){}}),
  collectCleanup(){live();return cleanup.collect();},releaseActorOwners,
 };
 producers.createPawnRuntime=producers.createActorRuntime;
 function dispose(){
  if(disposed)return;if(actorOwners.size)throw Error('Release Session actor owners before encounter navigation');disposed=true;
  cleanup?.dispose();mapAI?.dispose();playerFacingOwner?.dispose();actorAuthority?.dispose();if(playerProfile)invalidateConquestPlayerAttackProfile(playerProfile);graphs?.dispose();navigationQueries?.dispose();movementQueries?.dispose();pendingSelections.clear();birthSerials.clear();playerActors.clear();playerTeamSelectors.clear();teamEntries.clear();owners.delete(api);
 }
 try{
  sideContext=createConquestAttackSideContext({ruleId:12,playerActors,playerTeamSelectors,teamEntries,referencePlayerId:playerId});
  playerProfile=createConquestPlayerAttackProfile({playerId,playerActors,record:playerRecord,worldOwner:world,renderOwner:scene,sideContext,selection:'source-constructed-player-actions'});
  graphs=createConquestNavigationGraphRegistry({world,revision,mathProfile:CONQUEST_NAVIGATION_GRAPH_MATH_PROFILE,readAreaTeam64:({rawTeam64})=>{live();return {qualified:true,team64:conquestNavigationAreaTeam(rawTeam64,{flipTeams})};}});
  navigationQueries=createConquestNavigationWorldQueries({world,revision,mathProfile:CONQUEST_NAVIGATION_WORLD_MATH_PROFILE,readManagerContext:()=>{live();return {qualified:true,managerFlag20};},cacheStaticSegments});
  movementQueries=createConquestMovementWorldQueries({world,revision,mathProfile:CONQUEST_MOVEMENT_WORLD_MATH_PROFILE,prepareStaticContacts,
   readCurrentContext:({input})=>{live();if(!solverOwners.has(input.sourceSolverId))throw Error('Actual retained encounter movement solver required');return input.sourceSolverId.readWorldContext({managerFlag20});},
   readCurrentCollections:request=>{live();const collections=sync(readCurrentCollections,{...request,controller,playerActors,navigation:api},'movement collections');if(collections?.qualified!==true)return collections;
    // The raw1000 bit is independent of globalMask. Only its reached branch
    // asks for player bodies; normal Pawn masks retain their original path.
    if(request.kind==='contact'&&(request.input.solverMask&0x1000))return {...collections,actorCollections:{...collections.actorCollections,[0x1000]:playerBodyCollection.read()}};
    return collections;}});
  actorAuthority=new ConquestPawnActorAuthority({playerActors,playerTeamSelectors,monsterActors:bridge.actors,worldOwner:world,renderOwner:scene,probeVisibility:hooks.probeVisibility});
  actorAuthority.bindPlayer(playerId,{profile:playerProfile,peerId2c:playerPeer});
  mapAI=createConquestPawnMapAI({world,actorAuthority,revision,mathProfile:CONQUEST_PAWN_MAP_AI_MATH_PROFILE});
  for(const [label,value]of [['graphs',graphs],['navigation queries',navigationQueries],['movement queries',movementQueries],['map AI',mapAI]])if(value.prepare().prepared!==true)throw Error('Encounter '+label+' preparation failed: '+value.snapshot().lastReason);
  playerFacingOwner=createConquestBishopSnipePlayerFacing({authority:actorAuthority,playerActors,world,renderOwner:scene,policy:CONQUEST_BISHOP_SNIPE_PLAYER_FACING_POLICY});
  cleanup=createConquestDeferredActorCleanup({monsterActors:bridge.actors,runtimes:bridge.pawnRuntimes,reactionsByActor,actorAuthority});
 }catch(error){dispose();throw error;}
 api=Object.freeze({kind:'conquest-encounter-navigation',producers:Object.freeze(producers),world,controller,get avatar(){return avatar;},combatState,bridge,playerId,playerPeerId2c:playerPeer,
  playerActors,playerRecord,playerTeamSelectors,teamEntries,sideContext,get playerProfile(){return playerProfile;},actorAuthority,graphs,navigationQueries,movementQueries,mapAI,cleanup,
  owners:actorOwners,ownerMaps:Object.freeze({actors:actorOwners,reactionsByActor,selectionByActor,solverOwners}),
  nextRandom15(){live();return random.next();},
  updatePlayerAvatar,syncPlayerAvatar(){live();if(typeof getAvatar!=='function')throw Error('Explicit current encounter avatar reader required');return updatePlayerAvatar(sync(getAvatar,undefined,'avatar reader'));},
  prepare(){live();return api.snapshot();},
  snapshot(){live();return {prepared:true,actorCount:actorOwners.size,solverCount:solverOwners.size,playerCount:playerActors.size,random:{policy:'explicit-S5-seeded-CRT',seed,draws:random.draws,state:random.state,nativeSeedObserved:false,nativeInterleavingObserved:false},identityPolicy:'S5 local encounter kind1/kind6 allocation',waveEvents:waveEvents.map(e=>({...e})),graphs:graphs.snapshot(),navigation:navigationQueries.snapshot(),movement:movementQueries.snapshot(),mapAI:mapAI.snapshot(),nativeReady:false};},
  dispose,
 });owners.set(api,{world,controller,bridge,audit(){
  live();
  // Same phase/revocation guards as the four diagnostic snapshots. Keep their
  // original order and side effects, without constructing diagnostic payloads.
  auditConquestNavigationGraphRegistry(graphs,{world});auditConquestNavigationWorldQueries(navigationQueries,{world});
  auditConquestMovementWorldQueries(movementQueries,{world});auditConquestPawnMapAI(mapAI,{world,actorAuthority});
 }});return api;
}
export function assertConquestEncounterNavigation(owner,{world,controller,bridge}={}){const record=owners.get(owner);if(!record||world!==undefined&&record.world!==world||controller!==undefined&&record.controller!==controller||bridge!==undefined&&record.bridge!==bridge)throw Error('Actual owned encounter navigation required');record.audit();return owner;}
