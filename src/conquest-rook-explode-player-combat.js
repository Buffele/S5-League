import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestAttackActorRegistry} from './conquest-monster-attack-actors.js';
import {assertConquestAttackWorldQueries} from './conquest-attack-world-queries.js';


import {conquestPlayerDefenseProfile} from './conquest-player-defense.js';
import {ConquestRookExplodeAttackPreparation,produceConquestRookExplodePlayerDamageRecord} from './conquest-rook-explode-damage-record.js';
import {readConquestRookExplodeAttackOwner,assertConquestRookExplodeAttackEvent,assertConquestRookExplodeAttackDeclaration} from './conquest-rook-explode-attack.js';
import {assertConquestRookExplodeActor} from './conquest-rook-explode-source.js';
import {conquestRookExplodeWorldAttackSphere,queryConquestRookExplodeSphereGeometry,classifyConquestRookExplodeContacts} from './conquest-rook-explode-geometry.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,arg)=>{const value=fn(arg);if(value?.then)throw Error('Synchronous RookExplode combat context required');return value;};
const bool=(value,name)=>{if(typeof value!=='boolean')throw Error('Explicit '+name+' required');return value;};
// Each private authored CAttack event is resolved independently, in native
//group order. The second hit reads the current scene/player after the first.
export class ConquestRookExplodePlayerCombat{
 #config;#targets=new Map();#episodes=new WeakMap();#disposed=false;#busy=false;#last=null;
 constructor(config={}){
  const {bridge,registry,sourceBinding,preparation,world,worldQueries,readSessionContext,readSourceContext,readAttackGate,resolveEqualDistance}=config;
  if(!(bridge instanceof ConquestRuntimeBridge)||!(registry instanceof ConquestAttackActorRegistry)||sourceBinding?.kind!=='monster'||!(preparation instanceof ConquestRookExplodeAttackPreparation)||![readSessionContext,readSourceContext,readAttackGate].every(sync)||resolveEqualDistance!==undefined&&!sync(resolveEqualDistance))throw Error('Actual RookExplode bridge/registry/preparation/context owners required');
  assertConquestAttackWorldQueries(worldQueries,{world});for(const k of ['excludeSubtype2','omitSecondRegistry','excludeSubtype5','excludePeerSubtype2'])bool(config[k],k);this.#config={...config};
  this.ports=Object.freeze({prepareAttack:r=>this.prepareAttack(r),readTickGate:r=>this.readTickGate(r),consumeAttackEvent:event=>this.consumeAttackEvent(event),exitAttack:r=>this.exitAttack(r)});
 }
 #live(){if(this.#disposed)throw Error('Disposed RookExplode/player combat');}
 #actor(actor){this.#live();assertConquestRookExplodeActor(actor);if(this.#config.sourceBinding.id!==actor.id||this.#config.bridge.actors.get(actor.id)!==actor)throw Error('Actual current bridge-owned RookExplode required');}
 #episode(request){this.#actor(request?.actor);assertConquestRookExplodeAttackDeclaration(request.attack);const e=this.#episodes.get(request.prepared);if(!e||e.actor!==request.actor||e.attack!==request.attack||e.generation!==request.generation||e.exited||e.input!==request.stateInput||!this.#config.preparation.owns(request.prepared,request.actor,request.attack))throw Error('Current retained RookExplode CAttack preparation required');return e;}
 prepareAttack({actor,attack,generation,stateInput}={}){this.#actor(actor);assertConquestRookExplodeAttackDeclaration(attack);if(!Number.isInteger(generation)||generation<=0||stateInput!==attack.stateInput)throw Error('Actual source RookExplode generation/input required');const value=this.#config.preparation.prepare(actor,attack);this.#episodes.set(value,{actor,attack,generation,input:stateInput,consumed:false,exited:false});return value;}
 readTickGate(request){this.#episode(request);const gate=call(this.#config.readAttackGate,request);if(gate?.qualified!==true||typeof gate.enabled!=='boolean'||typeof gate.collisionAllowed!=='boolean')throw Error('Qualified current RookExplode attack predicates required');return gate;}
 exitAttack(request){this.#live();const e=this.#episodes.get(request?.prepared);if(!e||e.actor!==request.actor||e.attack!==request.attack)throw Error('Owned RookExplode CAttack required for release');e.exited=true;}
 bindPlayerTarget({actorBinding,damageBinding,defenseState,readContext}={}){this.#live();if(actorBinding?.kind!=='player'||this.#targets.has(actorBinding)||damageBinding?.playerId!==actorBinding.id||this.#config.bridge.playerDamageBindings.get(damageBinding.playerId)!==damageBinding||!defenseState||!sync(readContext))throw Error('Actual distinct player HP/actor/defense/context binding required');const token=Object.freeze({actorBinding,damageBinding});this.#targets.set(actorBinding,{token,damageBinding,defenseState,readContext});return token;}
 unbindPlayerTarget(token){this.#live();return this.#targets.get(token?.actorBinding)?.token===token&&this.#targets.delete(token.actorBinding);}
 #refuse(reason,details={}){return this.#last={qualified:false,status:reason,reason,deliveries:[],...details,nativeReady:false};}
 consumeAttackEvent(event){this.#live();if(this.#busy)throw Error('Nonreentrant RookExplode record consumption required');this.#busy=true;try{return this.#consume(event);}finally{this.#busy=false;}}
 #consume(event){
  const c=this.#config,actor=c.bridge.actors.get(c.sourceBinding.id),owner=readConquestRookExplodeAttackOwner(actor);assertConquestRookExplodeAttackEvent(event,{owner,actor});const episode=this.#episode(event);
  if(episode.consumed||event.elapsedMs<=event.attack.collisionDelayMs)throw Error('Once-only actual post-delay RookExplode CAttack event required');episode.consumed=true;
  const snapshot=c.registry.snapshot({source:c.sourceBinding,excludeSubtype2:c.excludeSubtype2,omitSecondRegistry:c.omitSecondRegistry,excludeSubtype5:c.excludeSubtype5});if(snapshot.source.object!==actor)throw Error('Actual source RookExplode registry/timer mismatch');if(!snapshot.coverage.candidateProducerQualified)return this.#refuse('unknown-typed-actor-producers');
  assertConquestAttackWorldQueries(c.worldQueries,{world:c.world});
  const shape=conquestRookExplodeWorldAttackSphere({attack:event.attack,...snapshot.source}),geometry=queryConquestRookExplodeSphereGeometry({shape,candidates:snapshot.candidates});
  const partition=classifyConquestRookExplodeContacts({requester:snapshot.source,contacts:geometry.contacts,shape,excludePeerSubtype2:c.excludePeerSubtype2,probeSegment:q=>c.worldQueries.probeSegment(q),resolveEqualDistance:c.resolveEqualDistance,geometryPassesResolved:geometry.completeQueryWrapperQualified&&snapshot.coverage.candidateProducerQualified});
  c.registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(c.worldQueries,{world:c.world});if(partition.status!=='contacts-classified')return this.#refuse(partition.status,{geometry,blocked:partition.blocked});
  const session=call(c.readSessionContext,{actor,attack:event.attack,prepared:event.prepared,snapshot});if(session?.ruleId!==12)throw Error('Actual current Conquest rule12 context required');for(const k of ['worldPhase5','ruleInfoPresent','balanceServicePresent'])bool(session[k],k);
  const source=call(c.readSourceContext,{actor,attack:event.attack,prepared:event.prepared,snapshot});if(!source||!Object.hasOwn(source,'controllerFlag20')||!Object.hasOwn(source,'team')||!Object.hasOwn(source,'creditOwnerPeerId78')||source.team!==null&&source.team.id!==actor.teamSelector)throw Error('Actual RookExplode controller/team selector/credit owner required');
  const deliveries=[];
  for(const contact of partition.hits){
   const candidate=contact.actor,target=this.#targets.get(candidate.binding),binding=target?.damageBinding,receiver=binding?.receiver;if(!target)return this.#refuse('unknown-player-target-binding');
   if(c.bridge.playerDamageBindings.get(binding.playerId)!==binding||receiver.target!==candidate.combatState||receiver.profile.vtable!==candidate.actorVtable)throw Error('Current actual player HP owner/profile required');
   const context=call(target.readContext,{actor:candidate,combatState:candidate.combatState,fieldReceipt:candidate.fieldReceipt,session});if(!Number.isInteger(context?.phaseId)||!Number.isFinite(context.maxHp)||context.maxHp!==receiver.maxHp||bool(context.invincible,'target invincibility')!==candidate.combatState.invincible)throw Error('Actual current player phase/HP/invincibility required');bool(context.slot4c,'target slot4C');const state=candidate.fieldReceipt?.currentState;if(!state)throw Error('Actual typed player state required');
   const defenses=conquestPlayerDefenseProfile({playerVtable:candidate.actorVtable,weaponType:36,hitPart:0,playerState:target.defenseState}),produced=produceConquestRookExplodePlayerDamageRecord({source:{vtable:0x13f0244,isLocalPlayer:false,peerId:snapshot.source.peerId2c,controllerFlag20:source.controllerFlag20,team:source.team},attack:event.prepared,
    target:{vtable:candidate.actorVtable,state,phaseId:context.phaseId,invincible:context.invincible,defenses},session,creditOwnerPeerId78:source.creditOwnerPeerId78});
   deliveries.push({contact,target,binding,produced,slot44:candidate.eligible44,slot4c:context.slot4c,invincible:context.invincible});
  }
  this.#live();assertConquestRookExplodeAttackEvent(event,{owner,actor});c.registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(c.worldQueries,{world:c.world});
  for(const d of deliveries)if(this.#targets.get(d.contact.actor.binding)!==d.target||c.bridge.playerDamageBindings.get(d.binding.playerId)!==d.binding||d.binding.receiver.target!==d.contact.actor.combatState||d.contact.actor.combatState.invincible!==d.invincible)throw Error('Actual player binding/invincibility changed during RookExplode record production');
  const results=deliveries.map(({contact,binding,produced,slot44,slot4c})=>{binding.receiver.slot44=slot44;binding.receiver.slot4c=slot4c;return {targetIdentity:contact.actor.identity,produced,result:c.bridge.receivePlayerDamage(binding,produced.record)};});
  return this.#last={qualified:true,status:'rook-explode-player-records-delivered',attackId:event.attack.id,attributeId:event.attack.attributeId,deliveries:results,blocked:partition.blocked,geometry,world:c.worldQueries.snapshot(),geometryNumericParity:geometry.numericParity,recordSideEffectsComplete:false,nativeReady:false};
 }
 snapshot(){return this.#last??{qualified:false,status:'idle',nativeReady:false};}
 dispose(){this.#disposed=true;this.#targets.clear();}
}
