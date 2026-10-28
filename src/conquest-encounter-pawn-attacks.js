import {ConquestKingPlayerCombat} from './conquest-king-player-combat.js';
import {ConquestKingAttackPreparation} from './conquest-king-damage-record.js';
import {ConquestQueenPlayerCombat} from './conquest-queen-player-combat.js';
import {ConquestQueenAttackPreparation} from './conquest-queen-damage-record.js';
import {ConquestRookExplodePlayerCombat} from './conquest-rook-explode-player-combat.js';
import {ConquestRookExplodeAttackPreparation} from './conquest-rook-explode-damage-record.js';
import {ConquestBishopSnipePlayerCombat} from './conquest-bishop-snipe-player-combat.js';
import {ConquestBishopSnipeAttackPreparation} from './conquest-bishop-snipe-damage-record.js';
import {assertConquestEncounterNavigation} from './conquest-encounter-navigation.js';
import {ConquestAttackActorRegistry} from './conquest-monster-attack-actors.js';
import {readConquestMonsterAttackFields,readConquestPlayerAttackProfile} from './conquest-player-attack-profile.js';
import {ConquestPawnAttackPreparation} from './conquest-pawn-attack-preparation.js';
import {ConquestPawnPlayerCombat} from './conquest-pawn-player-combat.js';
import {ConquestPawnExplodePlayerCombat} from './conquest-pawn-explode-player-combat.js';
import {ConquestPawnExplodeAttackPreparation} from './conquest-pawn-explode-damage-record.js';
import {createConquestAttackWorldQueries,CONQUEST_ATTACK_WORLD_MATH_PROFILE} from './conquest-attack-world-queries.js';
import {ConquestKnightPlayerCombat} from './conquest-knight-player-combat.js';
import {ConquestKnightAttackPreparation} from './conquest-knight-damage-record.js';
import {ConquestKnightChargePlayerCombat} from './conquest-knight-charge-player-combat.js';
import {ConquestKnightChargeAttackPreparation} from './conquest-knight-charge-damage-record.js';
import {ConquestBishopPlayerCombat} from './conquest-bishop-player-combat.js';
import {ConquestBishopAttackPreparation} from './conquest-bishop-damage-record.js';
import {ConquestRookAuraCombat} from './conquest-rook-aura-combat.js';
import {ConquestRookDefenseConditions,CONQUEST_ROOK_AURA_PENDING_PRESENTATION,CONQUEST_ROOK_AURA_AUTHORED_PRESENTATION} from './conquest-rook-defense-conditions.js';
import {createConquestMonsterDefenseAuraFields} from './conquest-monster-defense-aura-fields.js';

const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const declaration=Object.freeze({nativeReady:false,source:'S5 declared local-host Conquest encounter',
 phase:'rule12, worldPhase5=false, rulePhase2, ruleEngine0, targetPhase0',
 predicates:'Current live Pawn/player; source orientation280 and origin281 enabled; manager20=false; subtype exclusions disabled',
 random:'Two draws from the supplied S5 rand15 service per attack; second modulo100. Native separate-stream parity unverified',
 creditOwner:'Current navigation local-host player peer; S5 allocation, no native peer mapping',
 initialPlayerMaxHp:100,recordSideEffectsComplete:false});

// Main-scene composition, not a replacement query or a training HP shortcut.
// Session/nav own actors, models and profiles. This owner retains only attack
// registry placement, one map tree, per-Pawn combat and an optional HP binding.
export function prepareConquestEncounterPawnAttacks({navigation,bridge,world,scene,combatState,defenseState,playerVtable,readCurrentCollections,nextRandom15,enableRound3=false,rookEffectsService=null,readGameTime,readPlaying}={}){
 assertConquestEncounterNavigation(navigation,{world,bridge});
 if(navigation.world!==world||navigation.bridge!==bridge||navigation.combatState!==combatState||!scene?.isScene||bridge.isHost!==true||!defenseState||defenseState.playerVtable!==playerVtable||!synchronous(readCurrentCollections)||!synchronous(nextRandom15))throw Error('Current local-host encounter, actual player HP/defenses and synchronous collections/random services required');
 const playerId=navigation.playerId,playerRecord=navigation.playerRecord,monsterMap=bridge.actors,playerMap=navigation.playerActors;
 const registry=new ConquestAttackActorRegistry({worldOwner:world,renderOwner:scene,monsterActors:monsterMap,playerActors:playerMap});
 const pool=registry.createFirstPool({identity:'encounter-local-player',tag:1}),bindings=new Map(),combats=new Map(),released=new WeakSet();
 if(typeof enableRound3!=='boolean'||enableRound3&&(!synchronous(readGameTime)||!synchronous(readPlaying)))throw Error('Explicit current third-round clocks/playing context required');
 const fields=new Map(),borrowedFields=new WeakSet(),conditionOwner=enableRound3?new ConquestRookDefenseConditions({actorAuthority:navigation.actorAuthority,monsterActors:monsterMap,presentationPolicy:rookEffectsService?CONQUEST_ROOK_AURA_AUTHORED_PRESENTATION:CONQUEST_ROOK_AURA_PENDING_PRESENTATION,effectsService:rookEffectsService}):null;
 const worldQueries=createConquestAttackWorldQueries({world,revision:'S5-encounter-pawn-attacks',mathProfile:CONQUEST_ATTACK_WORLD_MATH_PROFILE,
  readCurrentCollections,readManagerContext:()=>({qualified:true,managerFlag20:false})});
 let disposed=false,playerBinding=null,profile=null,avatar=null,damageBinding=null,ownsDamageBinding=false;
 function live(){
  if(disposed)throw Error('Disposed encounter Pawn attacks');
  assertConquestEncounterNavigation(navigation,{world,bridge});
  if(bridge.actors!==monsterMap||navigation.playerActors!==playerMap||playerMap.get(playerId)!==playerRecord||playerRecord.combatState!==combatState||bridge.playerDamageBindings.get(playerId)!==damageBinding||damageBinding.receiver.target!==combatState||damageBinding.receiver.profile.vtable!==playerVtable||damageBinding.receiver.profile.ruleId!==12)throw Error('Current encounter attack/HP owners replaced');
 }
 function bindPlayer(){
  const currentProfile=navigation.playerProfile,currentAvatar=playerRecord.model;
  // Validate the typed profile now, before publishing its registry binding.
  const receipt=readConquestPlayerAttackProfile(currentProfile);
  if(receipt.controller!==navigation.controller||receipt.combatState!==combatState||receipt.model!==currentAvatar)throw Error('Current navigation player profile required');
  playerBinding=registry.bindPlayer({identity:playerId,playerId,record:playerRecord,peerId2c:navigation.actorAuthority.identity(playerId),vtable:playerVtable,readSourceFields:()=>readConquestPlayerAttackProfile(currentProfile)});
  registry.append(playerBinding,{registry:'first',pool});profile=currentProfile;avatar=currentAvatar;
 }
 function bindTarget(entry){entry.target=entry.combat.bindPlayerTarget({actorBinding:playerBinding,damageBinding,defenseState,
  readContext:()=>({phaseId:0,invincible:combatState.invincible,slot4c:false,maxHp:damageBinding.receiver.maxHp,team:{id:navigation.playerTeamSelectors.get(playerId)}})});}
 function syncPlayerAvatar(){
  live();if(profile===navigation.playerProfile&&avatar===playerRecord.model)return false;
  for(const entry of combats.values())if(entry.kind!=='rook')entry.combat.unbindPlayerTarget(entry.target);
  registry.unbind(playerBinding);bindPlayer();for(const entry of combats.values())if(entry.kind!=='rook')bindTarget(entry);return true;
 }
 function allActors(){
  // onActorsCreated has already registered the whole cohort in nav authority.
  // Registry coverage must not depend on which sibling runtime binds first.
  for(const actor of monsterMap.values())if(!bindings.has(actor)&&!released.has(actor)){
   const binding=registry.bindMonster({identity:actor.id,actorId:actor.id,actor,peerId2c:navigation.actorAuthority.identity(actor.id),
    readSourceFields:()=>readConquestMonsterAttackFields({actorId:actor.id,actor,monsterActors:monsterMap,sideContext:navigation.sideContext})});
   registry.append(binding,{registry:'third'});bindings.set(actor,binding);
  }
 }
 function owned(actor){
  live();const entry=combats.get(actor),owner=navigation.owners.get(actor);
  if(!entry||entry.owner!==owner||owner.disposed||owner.runtime.disposed||bridge.actors.get(actor.id)!==actor||bridge.pawnRuntimes.get(actor.id)!==owner.runtime)throw Error('Current bound encounter Pawn attack owner required');
  return entry;
 }
 function bindActor(owner){
  live();syncPlayerAvatar();const actor=owner?.actor;
  if(!actor||navigation.owners.get(actor)!==owner||owner.disposed||owner.runtime?.disposed||bridge.pawnRuntimes.get(actor.id)!==owner.runtime||released.has(actor))throw Error('Actual current navigation Pawn runtime owner required');
  const previous=combats.get(actor);if(previous){if(previous.owner!==owner)throw Error('Pawn attack owner replaced');return previous.ports;}
  allActors();
  if(enableRound3){const fieldOwner=owner.defenseAuraFields??createConquestMonsterDefenseAuraFields({actor,readCurrentActor:()=>monsterMap.get(actor.id)});if(owner.defenseAuraFields)borrowedFields.add(fieldOwner);fields.set(actor,fieldOwner);for(const entry of combats.values())if(entry.kind==='rook')entry.combat.bindActor({actor,fieldsOwner:fieldOwner});}
  if(conditionOwner){conditionOwner.bindActor({actor,pawnState:owner.damageState,fieldsOwner:fields.get(actor)});owner.movement.bindDefenseConditions({owner:conditionOwner,actorAuthority:navigation.actorAuthority});}
  if(actor.spawnStats.monsterKey===1100){
   if(!conditionOwner)throw Error('Prepared third-round aura conditions required');
   const combat=new ConquestRookAuraCombat({actor,registry,sourceBinding:bindings.get(actor),actorAuthority:navigation.actorAuthority,monsterActors:monsterMap,world,worldQueries,conditionOwner,aiRuntime:owner.host.ai,commandQueue:bridge.commands,
    readQueryContext:()=>({managerHost20:bridge.isHost,worldPhase2:readPlaying(),gameTime:readGameTime()}),enumeration:{excludeSubtype2:false,omitSecondRegistry:false,excludeSubtype5:false}});
   for(const [target,fieldsOwner]of fields)combat.bindActor({actor:target,fieldsOwner});
   const entry={kind:'rook',owner,combat,target:null,ports:null};
   entry.ports=Object.freeze({consumeAura:(request,context)=>{owned(actor);allActors();syncPlayerAvatar();const result=combat.consume(request,context);if(!result.queryQualified)throw Error('Current Rook aura query refused: '+result.reason);for(const source of result.commands)bridge.queueAICommand(source,{actorAuthority:navigation.actorAuthority,conditionOwner,mirrorEnabled:false,onDestroy(){}});return result;}});
   combats.set(actor,entry);return entry.ports;
  }
  const explosive=actor.spawnStats.monsterKey===1013,charge=actor.spawnStats.monsterKey===1204,knight=charge||actor.spawnStats.monsterKey===1203,snipe=actor.spawnStats.monsterKey===1314,rookExplode=actor.spawnStats.monsterKey===1110,queen=actor.spawnStats.monsterKey===1403,king=actor.spawnStats.monsterKey===1500,bishop=snipe||actor.spawnStats.monsterKey===1303,Combat=king?ConquestKingPlayerCombat:queen?ConquestQueenPlayerCombat:rookExplode?ConquestRookExplodePlayerCombat:explosive?ConquestPawnExplodePlayerCombat:charge?ConquestKnightChargePlayerCombat:snipe?ConquestBishopSnipePlayerCombat:bishop?ConquestBishopPlayerCombat:knight?ConquestKnightPlayerCombat:ConquestPawnPlayerCombat,Preparation=king?ConquestKingAttackPreparation:queen?ConquestQueenAttackPreparation:rookExplode?ConquestRookExplodeAttackPreparation:explosive?ConquestPawnExplodeAttackPreparation:charge?ConquestKnightChargeAttackPreparation:snipe?ConquestBishopSnipeAttackPreparation:bishop?ConquestBishopAttackPreparation:knight?ConquestKnightAttackPreparation:ConquestPawnAttackPreparation;
  const combat=new Combat({bridge,registry,sourceBinding:bindings.get(actor),world,worldQueries,
   preparation:new Preparation({nextRandom15,nextInternalPercentRoll:source=>nextRandom15(source)%100,...(queen?{rangeCapture:owner.rangeCapture}:{})}),
   readSessionContext:()=>({ruleId:12,worldPhase5:false,rulePhaseId:2,ruleEngineStateId:0,ruleInfoPresent:false,balanceServicePresent:false}),
   readSourceContext:()=>({controllerFlag20:0,team:{id:actor.teamSelector},creditOwnerPeerId78:navigation.actorAuthority.identity(playerId)}),
   orientDirection280:true,placeOrigin281:true,excludeSubtype2:false,omitSecondRegistry:false,excludeSubtype5:false,excludePeerSubtype2:false,
   // Same declared S5 local-host actor eligibility policy as ordinary attacks.
   // Native attack-owner predicates remain a separate live-parity gate.
   readAttackGate:()=>{owned(actor);return {qualified:true,enabled:actor.eligibleVirtual44,collisionAllowed:actor.eligibleVirtual44};}});
  const entry={kind:king?'king':queen?'queen':rookExplode?'rook-explode':bishop?'bishop':knight?'knight':explosive?'explosive':'pawn',owner,combat,target:null,ports:null};
  const current=()=>{const retained=owned(actor);syncPlayerAvatar();allActors();return retained;};
  entry.ports=explosive||knight||bishop||rookExplode||queen||king?Object.freeze(Object.fromEntries(['prepareAttack','readTickGate',knight||bishop||rookExplode||queen||king?'consumeAttackEvent':'consumeExplosionEvent','exitAttack'].map(name=>[name,request=>{
   // Timer destruction releases its prepared attack while the enclosing
   // actor factory is already releasing. Keep that genuine episode alive
   // until the post-owner hook unbinds this combat; no new query is admitted.
   if(name==='exitAttack'){if(combats.get(actor)!==entry||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Retained explosion cleanup episode required');}
   else current();return combat.ports[name](request);
  }]))) : Object.freeze({
   prepareAttack:source=>{current();if(source!==actor)throw Error('Bound Pawn attack source required');return combat.ports.prepareAttack(source);},
   queryContacts:request=>{current();return combat.ports.queryContacts(request);},
   consumeContacts:request=>{current();return combat.ports.consumeContacts(request);},
   isEnabled:()=>{current();return actor.eligibleVirtual44&&!combatState.dead;},
   collisionAllowed:()=>{current();return actor.eligibleVirtual44&&!combatState.dead;}
  });
  bindTarget(entry);combats.set(actor,entry);return entry.ports;
 }
 function unbindActor(actor){
  if(disposed)return false;
  const entry=combats.get(actor),binding=bindings.get(actor);if(!entry&&!binding)return false;
  if(conditionOwner?.hasActor(actor))conditionOwner.unbindActor(actor);
  for(const retained of combats.values())if(retained.kind==='rook'&&retained!==entry)retained.combat.unbindActor(actor);
  const fieldOwner=fields.get(actor);if(fieldOwner&&!borrowedFields.has(fieldOwner))fieldOwner.dispose();fields.delete(actor);
  entry?.combat.dispose();combats.delete(actor);if(binding){registry.unbind(binding);bindings.delete(actor);}released.add(actor);return true;
 }
 function dispose(){
  if(disposed)return;conditionOwner?.dispose();disposed=true;for(const entry of combats.values())entry.combat.dispose();combats.clear();for(const fieldOwner of fields.values())if(!borrowedFields.has(fieldOwner))fieldOwner.dispose();fields.clear();bindings.clear();registry.dispose();worldQueries.dispose();
  if(ownsDamageBinding)bridge.unbindPlayerDamageReceiver(damageBinding);
 }
 try{
  if(worldQueries.prepare().prepared!==true)throw Error('Encounter attack map preparation failed: '+worldQueries.snapshot().lastReason);
  damageBinding=bridge.playerDamageBindings.get(playerId);
  if(!damageBinding){damageBinding=bridge.bindPlayerDamageReceiver(playerId,{target:combatState,vtable:playerVtable,ruleId:12,maxHp:100,slot44:true,slot4c:false});ownsDamageBinding=true;}
  live();bindPlayer();allActors();for(const owner of navigation.owners.values())bindActor(owner);
 }catch(error){dispose();throw error;}
 return Object.freeze({bindActor,unbindActor,
  // Borrow the already prepared complete map provider. Player melee must use
  // the same current category400/world ownership, without recompiling the map
  // at every inventory switch. This owner retains disposal responsibility.
  readWorldQueries(){live();return worldQueries;},
  readAttackPorts({actor}={}){const entry=owned(actor);syncPlayerAvatar();allActors();return entry.ports;},
  readExplodeAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1013||!entry||entry.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1013 attack owner required');return entry.ports;},syncPlayerAvatar,dispose,
  readKnightAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1203||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1203 attack owner required');return entry.ports;},
  readKnightChargeAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1204||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1204 attack owner required');return entry.ports;},
  readBishopAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1303||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1303 attack owner required');return entry.ports;},
  readBishopSnipeAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1314||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1314 attack owner required');return entry.ports;},
  readQueenAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1403||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1403 attack owner required');return entry.ports;},
  readKingAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1500||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1500 attack owner required');return entry.ports;},
  readRookExplodeAttackPorts({actor,owner}={}){const entry=combats.get(actor);if(disposed||actor?.spawnStats.monsterKey!==1110||entry?.owner!==owner||navigation.owners.get(actor)!==owner||bridge.actors.get(actor.id)!==actor)throw Error('Current retained1110 attack owner required');return entry.ports;},
  readRookAuraQuery({actor,owner,request,context}={}){const entry=owned(actor);if(entry.kind!=='rook'||entry.owner!==owner)throw Error('Current retained1100 aura owner required');return entry.ports.consumeAura(request,context);},
  snapshot(){live();return {prepared:true,actorBindings:bindings.size,combatOwners:combats.size,playerId,hp:combatState.hp,ownsDamageBinding,
   world:worldQueries.snapshot(),combats:[...combats].map(([actor,entry])=>({actorId:actor.id,...entry.combat.snapshot()})),declaration,nativeReady:false};}});
}
