import {assertConquestRookEffectsService,conquestRookRecipientModelGraphMatches} from './conquest-rook-effects-service.js';
import * as THREE from 'three';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {assertConquestKnightActor} from './conquest-knight-ai.js';
import {ConquestMonsterMappedState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {ConquestMonsterHealth} from './conquest-player-monster-combat.js';
import {ConquestMonsterAnimationAdapter,conquestMonsterAnimationIntent} from './conquest-monster-animation.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {assertConquestPawnDeathEffects} from './conquest-pawn-death-effects.js';
import {assertConquestPawnMovementOwner} from './conquest-pawn-movement-owner.js';

const owners=new WeakMap(),reactionOwners=new WeakMap(),materialOwners=new WeakMap(),timingRegistries=new WeakMap(),deathCommands=new WeakMap(),f=Math.fround;
const uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
export const CONQUEST_KNIGHT_REACTION_SOURCE=Object.freeze({damageTimingGetter:0x530190,reactionLookup:0x6e9390,blowPredicate:0x530300,deathBlinkReset:0xb7cbe0,deathEffect:'Effects/Knight_death.seq',nativeReady:false});
export const CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION=Object.freeze({id:'s5-pending-knight-death-presentation',monsterKey:1203,source:'Effects/Knight_death.seq',rendersEffects:false,nativeReady:false});
export const CONQUEST_KNIGHT_DAMAGE_TIMING_ATTRIBUTES=Object.freeze([
 Object.freeze({attributeId8:55,durationRaw28:0,sourceEnum:'ATTACKATTRIB_REVOLVER2',sourceLine:1439}),
 Object.freeze({attributeId8:136,durationRaw28:0,sourceEnum:'ATTACKATTRIB_BOSSSHOTA_LASER',sourceLine:6477}),
]);
// Only authored rows are created. Unknown IDs are NOT empty vector cells: the
// remaining current indexer has more entries whose timing is not ported here.
export function createConquestKnightDamageTimingRegistry(){
 const entries=new Map(CONQUEST_KNIGHT_DAMAGE_TIMING_ATTRIBUTES.map(a=>[a.attributeId8,Object.freeze({...a,sourceSha256:'f714b31691b87c020c5618d96f51876bab361445b689709b8a20880882048c65',setter:0x5f71d0,lookup:0x5fc090,timingSourceQualified:true,nativeReady:false})]));
 const registry=Object.freeze({lookup(attributeId){if(!uint(attributeId))throw Error('Explicit native unsigned attribute8 required');const entry=entries.get(attributeId);if(!entry)throw Error('Unqualified Knight damage timing attribute '+attributeId);return entry;},snapshot(){return {qualifiedAttributeIds:[...entries.keys()],missingRowsAreUnknown:true,nativeReady:false};}});timingRegistries.set(registry,entries);return registry;
}
export function assertConquestKnightDeathCommand(command,{actor,actorAuthority}={}){
 const c=deathCommands.get(command);if(!c||c.actor!==actor||c.actorAuthority!==actorAuthority)throw Error('Owned source Knight Death command required');c.assertLive();if(actorAuthority.actor(actor.id)!==actor||actorAuthority.identity(actor.id).some((v,i)=>v!==c.peer[i]))throw Error('Knight Death command identity was replaced');return command;
}
export function assertConquestKnightReactions(reactions,{actor}={}){const r=reactionOwners.get(reactions);if(!r||r.actor!==actor)throw Error('Typed actual Knight reactions owner required');r.assertLive();return reactions;}

// Create at real Knight birth, alongside its actual health owner. This owns the
// additional constructor fields, not a bag of guessed externally supplied
// values. Unsupported physical/SEQ branches refuse before claiming success.
export function createConquestKnightReactions({actor,healthOwner,timingRegistry=createConquestKnightDamageTimingRegistry(),deathEffects=null,movementOwner=null,deathPresentationPolicy=null,recipientEffects=null}={}){
 assertConquestKnightActor(actor);
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1203||actor.aiScriptLiteral.toLowerCase()!=='script/monsterai_knight_normal.lua'||actor.eligibleVirtual44!==true||actor.nativeField33C!==4||!(healthOwner instanceof ConquestMonsterHealth)||healthOwner.actor!==actor||healthOwner.readCurrentRecord!==ConquestMonsterHealth.prototype.readCurrentRecord||healthOwner.readCurrentRecord()!==null||owners.has(actor))throw Error('Fresh actual Knight and its unchanged initial health record owner required');
 const timingEntries=timingRegistries.get(timingRegistry);if(!timingEntries)throw Error('Typed source Knight damage timing registry required');
 if(deathEffects!==null)assertConquestPawnDeathEffects(deathEffects,{actor});
 if(deathPresentationPolicy!==null&&deathPresentationPolicy!==CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION)throw Error('Exact immutable optional Knight pending Death policy required');
 if(movementOwner!==null)assertConquestPawnMovementOwner(movementOwner,{actor});
 if(recipientEffects!==null)assertConquestRookEffectsService(recipientEffects);
 const damageRate=f(Number(CONQUEST_SOURCE_DATA.monsters[1203].Ability.damage_rigid_rate));if(damageRate!==1)throw Error('Authenticated Knight damage_rigid_rate changed');
 const sourceSequence=CONQUEST_SOURCE_DATA.monsters[1203].Sequence;if(sourceSequence?.count!=='0')throw Error('Authenticated Knight Sequence count0 producer required');
 const model=actor.model,group=model.group,mixer=model.mixer,meshes=[...model.meshes],materials=[...new Set(meshes.flatMap(mesh=>[].concat(mesh.material)))];
 // A113F0 constructs five empty string pairs. A0DDA0 fills only count rows;
 // source count0 therefore makes A067F0 produce no attached effects in344.
 // This owner has no external effect/stealth writer. Retain the actual model
 // graph as well. Only live typed condition-recipient additions may extend it;
 // those remain outside source344 and are released by their condition owner.
 const attachedEffects344=new Set(),modelGraph=new Map();group.traverse(node=>modelGraph.set(node,[...node.children]));
 if(!materials.length||materials.some(m=>!m.isMaterial||materialOwners.has(m)))throw Error('Exclusive actual Knight material ownership required');
 const meshMaterials=meshes.map(mesh=>[].concat(mesh.material)),savedMaterials=materials.map(material=>({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite}));
 const owner={},fields={phase114:0,cleanup359:0,flag35A:0,flag35C:0,deathQueued35E:false,modelStealth2EC:null,color178:[1,1,1,1],scalar194:null},blink={active30:false,counter:{updates:0,durationMs:100,elapsedMs:0,paused:false}},ledger=[];
 if(movementOwner)Object.defineProperty(fields,'phase114',{enumerable:true,get:()=>movementOwner.readPhysicalPhase114()});
 let disposed=false,lastBlocked=null,alphaApplied=null;const pendingDeathRequests=[];
 owners.set(actor,owner);for(const material of materials)materialOwners.set(material,owner);
 function live(){if(disposed||owners.get(actor)!==owner||actor.aiScriptLiteral.toLowerCase()!=='script/monsterai_knight_normal.lua'||actor.model!==model||model.group!==group||model.mixer!==mixer||healthOwner.actor!==actor||healthOwner.readCurrentRecord!==ConquestMonsterHealth.prototype.readCurrentRecord||timingRegistries.get(timingRegistry)!==timingEntries||model.meshes.length!==meshes.length||model.meshes.some((mesh,i)=>mesh!==meshes[i]||[].concat(mesh.material).length!==meshMaterials[i].length||[].concat(mesh.material).some((m,j)=>m!==meshMaterials[i][j]))||materials.some(m=>materialOwners.get(m)!==owner))throw Error('Knight reaction/model/material owner replaced or disposed');healthOwner.readCurrentRecord();}
 function stateOwner(state,ids=[2,3,4]){live();if(!(state instanceof ConquestMonsterMappedState)||state.actor!==actor||!ids.includes(state.stateId))throw Error('Owned real Knight reaction state required');}
 function block(code,message){lastBlocked={code,message};throw Error('Knight reaction blocked ['+code+']: '+message);}
 function log(entry){ledger.push(entry);if(ledger.length>128)ledger.shift();}
 function missingDeathRuntime(){
  if(deathEffects===null)return ['Knight_death.seq or enter_base.seq runtime'];
  assertConquestPawnDeathEffects(deathEffects,{actor});const prepared=deathEffects.snapshot();
  return actor.nativeField33C===2?(prepared.enterBaseRuntimePrepared?[]:['enter_base.seq runtime']):(prepared.ordinaryDeathRuntimePrepared?[]:['Knight_death.seq runtime']);
 }
 function timing(){const record=healthOwner.readCurrentRecord();if(record===null)return null;const entry=timingEntries.get(record.attributeId8);if(!entry)return block('damage-attribute-entry28','Actual record158 attribute '+record.attributeId8+' has no qualified source timing row; unknown is not null');return Object.freeze({durationRaw:entry.durationRaw28,rate:damageRate,record,entry,actor,healthOwner,sourceChainQualified:true,nativeReady:false});}
 const ports=Object.freeze({
  readDamageTiming(state){stateOwner(state,[2]);return timing();},
  readActorField(state,offset){stateOwner(state);switch(offset){case 0x33c:if(!uint(actor.nativeField33C))throw Error('Actual native actor33C required');return actor.nativeField33C;case 0x358:return +actor.eligibleVirtual44;case 0x114:return movementOwner?movementOwner.readPhysicalPhase114():fields.phase114;case 0x359:return fields.cleanup359;case 0x35a:return fields.flag35A;case 0x35c:return fields.flag35C;default:throw Error('Unsupported Knight reaction field');}},
  writeActorField(state,offset,value){stateOwner(state);if(!uint(value))throw Error('Unsigned Knight reaction field value required');
   if(offset===0x114){if(state.stateId!==3||value!==1)return block('physical-blow-completion','Only source Blow entry phase1 is qualified; phase0 requires the real physical producer');if(movementOwner)movementOwner.writeBlowPhase114(state,value);else fields.phase114=value;}
   else if(offset===0x35c&&state.stateId===3&&value<=255)fields.flag35C=value;
   else if(offset===0x35a&&state.stateId===3&&value===1)fields.flag35A=value;
   else if(offset===0x358&&state.stateId===4&&value===0)actor.eligibleVirtual44=false;
   else if(offset===0x359&&state.stateId===4&&value===1)fields.cleanup359=value;
   else throw Error('Unqualified Knight reaction field writer');
   log({stateId:state.stateId,offset,value});return {accepted:true,actor};
  },
  blowExitAllowed(state){stateOwner(state,[3]);return block('blow-protected154','530300 reads current protected actor154; this owner has no qualified live writer/reader for it');},
  actorOperation(state,address){stateOwner(state);
   if(state.stateId===4&&address===0xa04620){
    //2EC is created by the Lua-only CreateStealth setterA04F60, absent in
    // this authored Knight profile. Preserve its real constructor-null branch;
    // a future stealth writer needs a different qualified owner, not a reset.
    if(fields.modelStealth2EC!==null)return block('death-stealth-runtime','Non-null2EC requires the real B88CC0/B889A0 owner');log({stateId:4,operation:address,branch:'source-null2EC'});return {accepted:true,actor,sourceBranch:'A04620-null2EC',ordinarySourceProfileOnly:true};
   }
   if(state.stateId===4&&address===0xa04680){
    // A01B30 allocates the real B7C7B0 blink helper. A04680/B7CBE0 resets
    // its timer and actor presentation fields; it does not remove the actor.
    blink.active30=false;Object.assign(blink.counter,{updates:0,durationMs:100,elapsedMs:0});fields.scalar194=1;fields.color178=[1,1,1,1];log({stateId:4,operation:address});return {accepted:true,actor,sourceBranch:'A04680→B7CBE0'};
   }
   if(state.stateId===4&&address===0xa048d0){
    if(CONQUEST_SOURCE_DATA.monsters[1203].Sequence!==sourceSequence||sourceSequence.count!=='0'||attachedEffects344.size!==0||!(recipientEffects===null?[...modelGraph].every(([node,children])=>node.children.length===children.length&&node.children.every((child,i)=>child===children[i])):conquestRookRecipientModelGraphMatches({service:recipientEffects,actor,model,modelGraph})))return block('death-attached-effect-owner','Source count0/empty344 owner or actual model graph changed; external attached effects require their own qualified manager');
    // Empty A048D0 performs the real owned collection clear; AFE3D0 is never
    // called on this source-produced branch. This says nothing about the
    // separate Death sequence subsequently requested by A2B680.
    attachedEffects344.clear();log({stateId:4,operation:address,branch:'source-count0-empty344'});return {accepted:true,actor,sourceBranch:'A048D0-source-count0-empty344',removedEffects:0,managerReleaseCalls:0,ordinarySourceProfileOnly:true};
   }
   return block('actor-operation-'+address.toString(16),address===0xa04620?'2EC/B88CC0/B889A0 model blink/alpha owner not qualified':address===0xa048d0?'344 effect collection and AFE3D0 manager lifetime owner not qualified':'Blow physical2D8/reset/path solver operation not ported');
  },
  prepareDeathEffect(state,{enterBase,effectOverride}={}){stateOwner(state,[4]);if(typeof enterBase!=='boolean'||enterBase!==(actor.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact source death effect branch required');const path=effectOverride??CONQUEST_SOURCE_DATA.monsters[1203].Scene.death_effect;
   if(deathEffects!==null){assertConquestPawnDeathEffects(deathEffects,{actor});const receipt=deathEffects.prepareDeathEffect(state,{enterBase,effectOverride});log({stateId:4,path,effectId:receipt.effectId,renderer:receipt.renderer});return receipt;}
   if(deathPresentationPolicy===CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION){const receipt=Object.freeze({accepted:false,pending:true,actorId:actor.id,sourcePath:path,enterBase,renderer:null,policy:deathPresentationPolicy.id,nativeReady:false});pendingDeathRequests.push(receipt);if(pendingDeathRequests.length>16)pendingDeathRequests.shift();log({stateId:4,path,policy:receipt.policy,pending:true,renderer:null});return receipt;}
   return block('death-sequence-runtime','Actual requested '+path+' needs qualified SEQ renderer, manager registration and lifetime');},
  writeDeathPresentation(state,{scalar,color}={}){stateOwner(state,[4]);if(!Number.isFinite(scalar)||!Number.isFinite(f(scalar))||!Array.isArray(color)||color.length!==4||!color.every(v=>Number.isFinite(v)&&Number.isFinite(f(v))))throw Error('Finite source Death scalar/RGBA required');fields.scalar194=f(scalar);fields.color178=color.map(f);return {accepted:true,actor,scalar194:fields.scalar194,color178:[...fields.color178],nativeShaderApplicationQualified:false};},
  // Opacity is a uniform; only switching transparency needs a material version.
  applyDeathAlpha(state,alpha){stateOwner(state,[4]);if(!Number.isFinite(alpha)||alpha<0||alpha>1)throw Error('Source Death alpha range required');for(const {material,transparent} of savedMaterials){material.opacity=f(alpha);const nextTransparent=transparent||alpha<1;if(material.transparent!==nextTransparent){material.transparent=nextTransparent;material.needsUpdate=true;}}alphaApplied=f(alpha);return {accepted:true,model,alpha:alphaApplied,renderer:'s5-owned-material-opacity',nativeModelSetterQualified:false};},
  applyDeathAnimation(state,{transitionSerial,playbackRate,animationAdapter}={}){stateOwner(state,[4]);if(!(state instanceof ConquestMonsterDeathState)||state.requestedClip!=='BASE'||actor.nativeField33C!==2||!(animationAdapter instanceof ConquestMonsterAnimationAdapter)||animationAdapter.model!==model||animationAdapter.disposed||!Number.isSafeInteger(transitionSerial)||transitionSerial<=animationAdapter.lastTransitionSerial||!Number.isFinite(playbackRate)||playbackRate<=0)throw Error('Exact owned enter-base Death animation request required');
   const intent=conquestMonsterAnimationIntent({monsterKey:1203,stateId:4,previousRequestedName:animationAdapter.previousRequestedName}),clip=model.clips.find(c=>c.name==='BASE');if(!clip)throw Error('Actual source BASE clip missing');
   for(const action of animationAdapter.actions)action.stop();const action=mixer.clipAction(clip);action.stopFading();action.reset();action.enabled=true;action.setEffectiveWeight(1);action.setEffectiveTimeScale(playbackRate);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
   const receipt={...intent,clip:'BASE',arguments:['BASE',...intent.arguments.slice(1)],sourceDeclaredClip:intent.clip,clipOverrideSource:0xa2b741,accepted:true,transitionSerial,playbackRate,renderedBlend:false,sourceClipDurationSeconds:clip.duration,nativeDurationEstablished:false,nativeClockEstablished:false,nativeFadeEstablished:false,nativeReady:false,renderer:'three-source-tracks-death-override'};
   animationAdapter.actions.add(action);animationAdapter.currentAction=action;model.currentAction=action;animationAdapter.previousRequestedName='BASE';animationAdapter.lastTransitionSerial=transitionSerial;animationAdapter.lastReceipt=receipt;return receipt;
  },
 });
 const api=Object.freeze({ports,
  pollDeathCommand({actorAuthority,gameTime,isHost}={}){live();if(!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor||!uint(gameTime)||typeof isHost!=='boolean')throw Error('Actual source actor authority, uint32 game clock and explicit host role required');
   // A23B40 host branch: this is the source producer, not a post-HP heuristic
   // injected into the damage receiver. Its35E latch is set before queueing.
   if(!isHost||f(actor.health)>0||fields.deathQueued35E)return null;
   if(!Number.isFinite(actor.health)||!uint(actor.nativeField33C))throw Error('Finite actual Knight HP and source33C required');
   const peer=actorAuthority.identity(actor.id),position=Object.freeze({...actor.positionNative});if(!['x','y','z'].every(k=>Number.isFinite(position[k])))throw Error('Current owned native Knight position required');
   fields.deathQueued35E=true;const command=Object.freeze({kind:'death',nativeType:2,actorId:actor.id,gameTime:(gameTime+112)>>>0,peerId:Object.freeze([...peer]),position,field33C:actor.nativeField33C,source:'CreateDeathCommand',producer:0xa23b40,factory:0x9ff570,nativeReady:false});deathCommands.set(command,{actor,actorAuthority,peer,assertLive:live});log({operation:0xa23b40,write35E:1,commandGameTime:command.gameTime});return command;
  },
  readiness(stateId){live();if(![2,3,4].includes(stateId))throw Error('Explicit Knight reaction ID2/3/4 required');const record=healthOwner.readCurrentRecord(),missing=stateId===2?(record===null||timingEntries.has(record.attributeId8)?[]:['record158 attribute '+record.attributeId8+' source entry28 timing row']):stateId===3?['physical phase114 completion producer','live protected154 predicate','A04460/A045A0 physical2D8/path solver']:missingDeathRuntime();return {stateId,reactionPortsReady:missing.length===0,s5PendingDeathPresentationReady:stateId===4&&deathPresentationPolicy===CONQUEST_KNIGHT_PENDING_DEATH_PRESENTATION,missing,nativeReady:false};},
  snapshot(){live();const record=healthOwner.readCurrentRecord();return {actorId:actor.id,fields:{...fields,color178:[...fields.color178],eligible358:actor.eligibleVirtual44,field33C:actor.nativeField33C},blink:{...blink,counter:{...blink.counter}},alphaApplied,damageTimingBranch:record===null?'source-null-record158':timingEntries.has(record.attributeId8)?'source-attribute'+record.attributeId8:'blocked-entry28',timingRegistry:timingRegistry.snapshot(),ledger:ledger.map(e=>({...e})),lastBlocked:lastBlocked&&{...lastBlocked},reactionEffectsQualified:false,pendingDeathRequests:[...pendingDeathRequests],deathPresentationPolicy:deathPresentationPolicy?.id??null,nativeReady:false};},
  dispose(){if(disposed)return;for(const s of savedMaterials){if(materialOwners.get(s.material)===owner){s.material.opacity=s.opacity;s.material.transparent=s.transparent;s.material.depthWrite=s.depthWrite;s.material.needsUpdate=true;materialOwners.delete(s.material);}}if(owners.get(actor)===owner)owners.delete(actor);disposed=true;},
 });reactionOwners.set(api,{actor,assertLive:live});return api;
}
