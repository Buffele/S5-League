import {CONQUEST_DAGGER_CUT_ACTION_SOURCE,assertConquestDaggerCutRuntime} from './conquest-dagger-player-profile.js';
import {readConquestConfiguredPlayerActorFlags} from './conquest-player-configured-actor-flags.js';
import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {TUNING} from './movement-profile.js';
import {HANDGUN} from './handgun-runtime.js';
import {SUBMACHINE_PROFILE} from './submachine-gun-runtime.js';
import {assertConquestSemiRifleRuntime} from './conquest-semi-rifle-player-profile.js';
import {assertConquestAssaultRifleRuntime} from './conquest-assault-rifle-player-profile.js';
import {CONQUEST_PLAYER_MOBILITY_ATTACK_SOURCE,selectConquestPlayerMobilityState,selectConquestPlayerMobilityReturnState} from './conquest-player-mobility-profile.js';
const contexts=new WeakMap(),profiles=new WeakMap(),receipts=new WeakMap();
const rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const f=Math.fround;
export const CONQUEST_PLAYER_ORDINARY_ATTACK_SOURCE=Object.freeze({actorVtable:0x13c1c14,stateVtable:0x13b5dc4,stateConstructor:0x62c4c0,
 actor154Initial:true,actor1aaInitial:false,actor270Initial:false,actorA4Initial:200,actorACInitial:320,
 stateWidth68Initial:f(.7),stateHeight6cInitial:1,stateB0:true,attackWidth68:140,attackHeight6c:320,nativeReady:false});

export const CONQUEST_PLAYER_LOCOMOTION_ATTACK_SOURCE=Object.freeze(Object.fromEntries([
 ['normal','CNormalState',0x13b5dc4,0x62c4c0],['run','CRunState',0x13b6350,0x634810],
 ['fastRun','CFastRunState',0x13b4a80,0x616300],['jump','CJumpState',0x13b58cc,0x624780]
].map(([key,nativeClass,vtable,constructor])=>[key,Object.freeze({nativeClass,vtable,constructor,width68:f(.7),height6c:1,slotB0:true,nativeReady:false})])));
export const CONQUEST_PLAYER_ACTION_ATTACK_SOURCE=Object.freeze({...CONQUEST_PLAYER_LOCOMOTION_ATTACK_SOURCE,daggerCut:CONQUEST_DAGGER_CUT_ACTION_SOURCE,...CONQUEST_PLAYER_MOBILITY_ATTACK_SOURCE,
 jump:Object.freeze({...CONQUEST_PLAYER_LOCOMOTION_ATTACK_SOURCE.jump,height6c:f(1.1),constructorHeight6c:1,shapeSetup:0x808270}),
 fastRun:Object.freeze({...CONQUEST_PLAYER_LOCOMOTION_ATTACK_SOURCE.fastRun,height6c:f(1.1),constructorHeight6c:1,shapeSetup:0x80a5c0}),
 ...Object.fromEntries([
 ['handgunFire','CAttackRevolverShotState',0x13b0d98,0x5d0a90],
 ['smgFire','CAttackPistolShotState',0x13b0b6c,0x5cd120],
 ['smgReload','CReloadState',0x13b5ef0,0x62d680],
 ['semiFire','CAttackPistolShotState',0x13b0b6c,0x5cd120],
 ['semiReload','CReloadState',0x13b5ef0,0x62d680],
 ['assaultFire','CAttackPistolShotState',0x13b0b6c,0x5cd120],
 ['assaultReload','CReloadState',0x13b5ef0,0x62d680],
 ['handgunReload','CReloadState',0x13b5ef0,0x62d680],['fall','CFallState',0x13b4900,0x615420]
 ].map(([key,nativeClass,vtable,constructor])=>[key,Object.freeze({nativeClass,vtable,constructor,width68:f(.7),height6c:key==='fall'?f(1.1):1,constructorHeight6c:1,...(key==='fall'?{shapeSetup:0x808810}:{}),slotB0:true,nativeReady:false})]))});
const idleSelection='source-constructed-normal-idle',locomotionSelection='source-constructed-ordinary-locomotion',actionSelection='source-constructed-player-actions';

//982470 ordinary rule branch compares virtual38 registry OBJECT identities.
//These are source team-entry objects, not string teams, HP or an eligibility bit.
export function createConquestAttackSideContext({ruleId,playerActors,playerTeamSelectors,teamEntries,referencePlayerId}={}){
 if(ruleId!==12||!(playerActors instanceof Map)||!(playerTeamSelectors instanceof Map)||!(teamEntries instanceof Map))throw Error('Rule12 and owned player/selector/team-entry Maps required');
 const reference=playerActors.get(referencePlayerId);
 if(!(reference?.controller instanceof Controller)||!(reference?.combatState instanceof CombatState))throw Error('Actual reference Controller/CombatState record required');
 const seen=new Set();for(const [selector,entry]of teamEntries){if(![0,1,2].includes(selector)||!entry||typeof entry!=='object'||seen.has(entry))throw Error('Distinct native team registry entry objects required');seen.add(entry);}
 const token=Object.freeze({kind:'conquest-rule12-side-context'});contexts.set(token,{playerActors,playerTeamSelectors,teamEntries,initialTeamEntries:new Map(teamEntries),referencePlayerId,reference,referenceController:reference.controller,referenceCombat:reference.combatState,referencePositionOwner:reference.controller.position});return token;
}
function sideContext(token){const c=contexts.get(token);if(!c||c.playerActors.get(c.referencePlayerId)!==c.reference||c.reference.controller!==c.referenceController||c.reference.combatState!==c.referenceCombat||c.reference.controller.position!==c.referencePositionOwner)throw Error('Current owned native side context required');return c;}
function teamEntry(c,selector){if(![0,1,2].includes(selector)||!c.teamEntries.has(selector)||c.teamEntries.get(selector)!==c.initialTeamEntries.get(selector))throw Error('Current source team selector/entry unresolved');return c.teamEntries.get(selector);}
function playerSide(c,id,record){if(c.playerActors.get(id)!==record)throw Error('Current player authority record required');return teamEntry(c,c.playerTeamSelectors.get(c.referencePlayerId))!==teamEntry(c,c.playerTeamSelectors.get(id));}
function assertProfile(p){
 if(!p||p.disposed||p.players.get(p.playerId)!==p.record||p.record.controller!==p.controller||p.record.combatState!==p.combat||p.controller.world!==p.world||p.controller.position!==p.positionOwner||p.record.model!==p.model||p.model?.group!==p.group||rootOf(p.group)!==p.renderOwner)throw Error('Stale/replaced/reset/disposed ordinary player profile');
}
function ordinary(p){
 const c=p.controller;
 const daggerCut=p.selection===actionSelection&&c.weapon==='dagger'&&c.attack&&['light','air'].includes(c.attack.type);
 if(c.attack&&!daggerCut||((c.dash>0||c.wallAction)&&p.selection!==actionSelection)||c.s5runtimeShieldBodyState||c.s5runtimeAnchoringBodyState||p.combat.reaction)throw Error('Current ordinary idle/locomotion player state required; other native classes unresolved');
 if(c.nativeActorFrameConfiguration||c.nativeJumpDiagnosticContext?.enabled||c.s5runtimeSkillDiagnosticContext?.enabled)throw Error('Another native body owner requires its own source attack profile');
 if(c.s5runtimeShieldActorProfile)readConquestConfiguredPlayerActorFlags(c);
 if(daggerCut){const action=assertConquestDaggerCutRuntime(c);return {key:'dagger-cut',state:p.states.daggerCut,actionOwner:action};}
 if(p.selection===actionSelection){const mobility=selectConquestPlayerMobilityState(c);if(mobility)return {...mobility,state:p.states[mobility.stateKey]};}
 const runtime=c.rifle;
 if(runtime&&runtime.phase!=='idle'){
  const handgun=c.weapon==='handgun'&&runtime.weapon==='handgun'&&runtime.profile===HANDGUN&&HANDGUN.nativeType===22;
  // Weapon2 is registered to PistolShot (not RevolverShot) by803795;
  // Reload has its own weapon2 child at8024B0. The legacy SMG owner has no
  // weapon field: its actual retained profile identifies this family.
  const smg=c.weapon==='submachinegun'&&runtime.profile===SUBMACHINE_PROFILE&&runtime.capacity===30;
  // Independent weapon4 factories803A12/802677, not a weapon2 alias.
  const semi=c.weapon==='semirifle'&&assertConquestSemiRifleRuntime(runtime)===runtime;
  // Equipment34 factories80415A/802C26; attack type2 is separate.
  const assault=c.weapon==='assaultrifle'&&assertConquestAssaultRifleRuntime(runtime)===runtime;
  if(p.selection!==actionSelection||(!handgun&&!smg&&!semi&&!assault)||!['fire','reload'].includes(runtime.phase)||!Number.isSafeInteger(runtime.serial)||runtime.serial<0)throw Error('Current weapon action requires its own qualified native player state');
  // The real S5 rifle owner holds Handgun fire/reload; Controller.attack is null.
  // 8036D0 registers RevolverShot for weapon22; 802390 registers Reload.
  // Validate the live lower-body provenance as well, without substituting it
  // for the current attack/reload class (Lua supplies walk/jump/fly channels).
  locomotion(p);
  const family=assault?'assault':semi?'semi':smg?'smg':'handgun';
  return {key:`${family}-${runtime.phase}`,state:p.states[family+(runtime.phase==='fire'?'Fire':'Reload')],actionOwner:runtime,actionSerial:runtime.serial};
 }
 if(p.selection===idleSelection){
  if(c.state!=='idle')throw Error('Current ordinary idle player state required; other native classes unresolved');
  return {key:'idle',state:p.states.normal};
 }
 return locomotion(p);
}
function locomotion(p){
 const c=p.controller;
 // Named S5 adaptation, not a claim of native input/action selection. The
 // Controller retains actual body provenance: normalJump, sprint, landing.
 if(c.state==='idle'&&c.grounded&&!c.normalJump&&!c.jumpRecovery&&!c.sprinting)return {key:'idle',state:p.states.normal};
 if(c.state==='run'&&c.grounded&&!c.normalJump&&!c.jumpRecovery&&!c.sprinting)return {key:'run',state:p.states.run};
 if(c.state==='sprint'&&c.grounded&&c.sprinting&&!c.normalJump&&!c.jumpRecovery)return {key:'sprint',state:p.states.fastRun};
 // The Controller reports vertical jump/fall while the retained sprint owns
 // airborne locomotion (616B3F clears upward velocity once on sprint entry).
 // Select the already qualified FastRun shape, then Fall after release.
 if(p.selection===actionSelection&&!c.grounded&&c.airLocomotion&&!c.normalJump&&!c.jumpRecovery&&!c.wallAction&&c.dash===0&&Number.isFinite(c.velocity.y)){
  if(c.sprinting&&c.state==='fall'&&c.velocity.y<=0)return {key:'air-sprint',state:p.states.fastRun};
  if(!c.sprinting&&c.state==='fall'&&c.velocity.y<=0)return {key:'air-locomotion-fall',state:p.states.fall};
 }

 if(['jump','fall'].includes(c.state)&&!c.grounded&&c.normalJump&&c.jumpAirborne&&!c.wallJumpAirborne&&!c.airLocomotion&&!c.ledgeFall&&!c.sprinting&&!c.jumpRecovery){
  if(c.state==='jump'?c.velocity.y>0:c.velocity.y<=0)return {key:c.state,state:p.states.jump};
 }
 if(c.state==='landing'&&c.grounded&&c.jumpRecovery&&!c.normalJump&&!c.sprinting&&!c.wallJumpAirborne)return {key:'landing',state:p.states.jump};
 if(p.selection===actionSelection&&c.state==='fall'&&!c.grounded&&c.ledgeFall&&!c.normalJump&&!c.jumpRecovery&&!c.sprinting&&!c.wallJumpAirborne&&!c.airLocomotion)return {key:'ledge-fall',state:p.states.fall};
 if(p.selection===actionSelection){const returned=selectConquestPlayerMobilityReturnState(c);if(returned)return {...returned,state:p.states[returned.stateKey]};}
 throw Error('Current ordinary idle/locomotion player state required; unqualified body provenance or state');
}
//Constructor properties and the explicitly qualified setup writers are owned
//simulation state. Arbitrary callbacks cannot impersonate this typed producer.
//Rendering model is retained only for lifecycle; actor1C is the STATE below.
export function createConquestPlayerAttackProfile({playerId,playerActors,record,worldOwner,renderOwner,sideContext:sideOwner,selection}={}){
 if(![idleSelection,locomotionSelection,actionSelection].includes(selection)||!(playerActors instanceof Map)||playerActors.get(playerId)!==record||!(record?.controller instanceof Controller)||!(record?.combatState instanceof CombatState)||record.controller.world!==worldOwner||!renderOwner?.isObject3D||!record.model?.group?.isObject3D)throw Error('Actual player owners and explicit source-constructed idle/locomotion/action selection required');
 const side=sideContext(sideOwner);if(side.playerActors!==playerActors)throw Error('Side context belongs to another player authority');
 if(TUNING.radius!==100*.006||TUNING.height!==320*.006)throw Error('Qualified player physical boundary changed');
 const token=Object.freeze({kind:'conquest-player-normal-attack-profile',playerId}),p={playerId,players:playerActors,record,controller:record.controller,combat:record.combatState,world:worldOwner,renderOwner,model:record.model,group:record.model.group,positionOwner:record.controller.position,sideOwner,selection,disposed:false,revision:0,selectionKey:null,states:Object.fromEntries(Object.entries(selection===actionSelection?CONQUEST_PLAYER_ACTION_ATTACK_SOURCE:CONQUEST_PLAYER_LOCOMOTION_ATTACK_SOURCE).map(([key,value])=>[key,Object.freeze({...value})])),
  actor154:true,actor270:false,actorA4:200,actorAC:320,state:null,writerLedger:[]};
 assertProfile(p);const selected=ordinary(p);p.state=selected.state;p.selectionKey=selected.key;p.actionOwner=selected.actionOwner;p.actionSerial=selected.actionSerial;playerSide(side,playerId,record);profiles.set(token,p);return token;
}
export function readConquestPlayerAttackProfile(profile){
 const p=profiles.get(profile);assertProfile(p);const selected=ordinary(p);if(p.state!==selected.state||p.selectionKey!==selected.key||p.actionOwner!==selected.actionOwner||p.actionSerial!==selected.actionSerial){p.state=selected.state;p.selectionKey=selected.key;p.actionOwner=selected.actionOwner;p.actionSerial=selected.actionSerial;p.revision++;}const side=sideContext(p.sideOwner),actor1aa=playerSide(side,p.playerId,p.record);
 // Reuse only the immutable receipt. Every read above still validates current
 // owners, state/action selection and team entries before this allocation fast path.
 const configured=p.controller.s5runtimeShieldActorProfile?readConquestConfiguredPlayerActorFlags(p.controller):null,actor154=configured?.actor154??p.actor154;
 if(p.cachedReceipt?.profileRevision===p.revision&&p.cachedReceipt.fields.actor1aa===actor1aa&&p.cachedReceipt.fields.actor154===actor154&&p.cachedActorProfile===configured?.profile&&p.cachedActorProfileRevision===configured?.revision)return p.cachedReceipt;
 const fields=Object.freeze({actor154,actor1aa,actor270:p.actor270,actorSizeA4:p.actorA4,actorHeightRateAC:p.actorAC,
  currentStatePresent:true,stateClassMatches:true,stateVtable:p.state.vtable,stateB0:p.state.slotB0,stateWidth68:p.state.width68,stateHeight6c:p.state.height6c});
 const receipt=Object.freeze({kind:'conquest-owned-player-attack-fields',playerId:p.playerId,controller:p.controller,combatState:p.combat,model:p.model,currentState:p.state,fields,profileRevision:p.revision,
  sourceFieldProducerQualified:true,selectedS5Adaptation:p.selection,selectedS5State:p.selectionKey,nativeStateSelectionObserved:false,nativeActorObserved:false,nativeReady:false});
 receipts.set(receipt,{profile,p,fields,side:actor1aa,configured,actionOwner:selected.actionOwner,actionSerial:selected.actionSerial});p.cachedReceipt=receipt;p.cachedActorProfile=configured?.profile;p.cachedActorProfileRevision=configured?.revision;return receipt;
}
export function assertConquestPlayerAttackFields(receipt,{controller,combatState,model}={}){
 const r=receipts.get(receipt);if(!r||r.p.controller!==controller||r.p.combat!==combatState||r.p.model!==model||r.p.revision!==receipt.profileRevision)throw Error('Stale/unqualified typed player field receipt or owners');
 assertProfile(r.p);const selected=ordinary(r.p);if(selected.state!==receipt.currentState||selected.key!==receipt.selectedS5State||selected.actionOwner!==r.actionOwner||selected.actionSerial!==r.actionSerial)throw Error('Stale player current-state receipt');if(playerSide(sideContext(r.p.sideOwner),r.p.playerId,r.p.record)!==r.side)throw Error('Stale native side receipt');
 const configured=r.p.controller.s5runtimeShieldActorProfile?readConquestConfiguredPlayerActorFlags(r.p.controller):null;if(configured?.profile!==r.configured?.profile||configured?.revision!==r.configured?.revision||(configured?.actor154??r.p.actor154)!==receipt.fields.actor154)throw Error('Stale configured player actor flag receipt');return receipt;
}
//Known initial source values remain live and explicit. Any later gameplay
//writer must name its source/adaptation; unqualified changes revoke producer
//qualification rather than silently retaining a constructor-only claim.
export function invalidateConquestPlayerAttackProfile(profile){const p=profiles.get(profile);if(!p||p.disposed)return false;p.disposed=true;p.revision++;return true;}

//Monster1AA is the same rule12 consumer, using the actor's already source-bound
//team selector from its actual constructor, not a new S5 team interpretation.
export function readConquestMonsterAttackFields({actorId,actor,monsterActors,sideContext:sideOwner}={}){
 if(!(monsterActors instanceof Map)||monsterActors.get(actorId)!==actor||!(actor instanceof ConquestMonsterActor)||actor.id!==actorId)throw Error('Actual current monster authority binding required');
 const c=sideContext(sideOwner),entry=teamEntry(c,actor.teamSelector),reference=teamEntry(c,c.playerTeamSelectors.get(c.referencePlayerId)),fields=Object.freeze({actor1aa:reference!==entry});
 const receipt=Object.freeze({kind:'conquest-owned-monster-attack-fields',actor,fields,sourceFieldProducerQualified:true,nativeActorObserved:false,nativeReady:false});
 receipts.set(receipt,{actorId,actor,monsterActors,sideOwner,entry,reference});return receipt;
}
export function assertConquestMonsterAttackFields(receipt,{actor}={}){
 const r=receipts.get(receipt);if(!r||r.actor!==actor||r.monsterActors?.get(r.actorId)!==actor)throw Error('Current typed monster field receipt required');
 const c=sideContext(r.sideOwner);if(teamEntry(c,actor.teamSelector)!==r.entry||teamEntry(c,c.playerTeamSelectors.get(c.referencePlayerId))!==r.reference)throw Error('Stale monster side receipt');return receipt;
}
