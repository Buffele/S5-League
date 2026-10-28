import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestAttackActorRegistry} from './conquest-monster-attack-actors.js';
import {ConquestPawnAttackPreparation} from './conquest-pawn-attack-preparation.js';
import {CONQUEST_PAWN_ATTACK_CONTACT,ConquestPawnAttackContactRuntime} from './conquest-monster-attack-runtime.js';
import {conquestPawnWorldAttackBox,queryConquestAttackBoxGeometry,conquestPawnBoxGeometryPasses} from './conquest-monster-attack-geometry.js';
import {classifyConquestBoxAttackContacts} from './conquest-monster-attack-contacts.js';
import {assertConquestAttackWorldQueries} from './conquest-attack-world-queries.js';
import {conquestPawnPlayerDefenseProfile} from './conquest-player-defense.js';
import {produceConquestPawnPlayerDamageRecord} from './conquest-monster-damage-record.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);
const bool=(value,name)=>{if(typeof value!=='boolean')throw Error('Explicit '+name+' required');return value;};
const call=(fn,arg)=>{const result=fn(arg);if(result&&typeof result.then==='function')throw Error('Synchronous current combat context required');return result;};

//Source Pawn BOX -> owned actor snapshots -> real map obstruction -> source
//damage record -> bridge-owned CombatState HP. It does not create an AI wave,
//source state gates, empty obstruction world or synthetic target defenses.
export class ConquestPawnPlayerCombat{
 #bridge;#registry;#source;#preparation;#world;#worldQueries;#session;#sourceContext;#options;#targets=new Map();#episodes=new WeakMap();#contacts=new WeakMap();#last=null;#disposed=false;
 constructor({bridge,registry,sourceBinding,preparation,world,worldQueries,readSessionContext,readSourceContext,
  orientDirection280,placeOrigin281,excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2,resolveEqualDistance}={}){
  if(!(bridge instanceof ConquestRuntimeBridge)||!(registry instanceof ConquestAttackActorRegistry)||!(preparation instanceof ConquestPawnAttackPreparation)||sourceBinding?.kind!=='monster'||![readSessionContext,readSourceContext].every(sync)||resolveEqualDistance!==undefined&&!sync(resolveEqualDistance))throw Error('Owned bridge/actor registry/Pawn preparation and explicit synchronous combat context required');
  assertConquestAttackWorldQueries(worldQueries,{world});
  for(const [name,value]of Object.entries({orientDirection280,placeOrigin281,excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2}))bool(value,name);
  this.#bridge=bridge;this.#registry=registry;this.#source=sourceBinding;this.#preparation=preparation;this.#world=world;this.#worldQueries=worldQueries;this.#session=readSessionContext;this.#sourceContext=readSourceContext;
  this.#options={orientDirection280,placeOrigin281,excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2,resolveEqualDistance};
  this.ports=Object.freeze({prepareAttack:actor=>this.prepareAttack(actor),queryContacts:request=>this.queryContacts(request),consumeContacts:request=>this.consumeContacts(request)});
 }
 #active(){if(this.#disposed)throw Error('Disposed Pawn/player combat pipeline');}
 #actor(actor){this.#active();if(actor?.id!==this.#source.id||this.#bridge.actors.get(actor.id)!==actor)throw Error('Actual current bridge-owned source Pawn required');return actor;}
 bindPlayerTarget({actorBinding,damageBinding,defenseState,readContext}={}){
  this.#active();if(actorBinding?.kind!=='player'||this.#targets.has(actorBinding)||!damageBinding||damageBinding.playerId!==actorBinding.id||this.#bridge.playerDamageBindings.get(damageBinding.playerId)!==damageBinding||!defenseState||!sync(readContext))throw Error('Distinct owned player actor/damage binding and retained defenses/current context required');
  const token=Object.freeze({actorBinding,damageBinding});this.#targets.set(actorBinding,{token,damageBinding,defenseState,readContext});return token;
 }
 unbindPlayerTarget(token){this.#active();if(this.#targets.get(token?.actorBinding)?.token!==token)return false;return this.#targets.delete(token.actorBinding);}
 prepareAttack(actor){this.#actor(actor);const prepared=this.#preparation.prepare(actor);this.#episodes.set(prepared,{actor,queried:false});return prepared;}
 #request(request){
  this.#actor(request?.actor);const episode=this.#episodes.get(request.prepared);
  if(!episode||episode.actor!==request.actor||!this.#preparation.owns(request.prepared,request.actor)||request.source!==CONQUEST_PAWN_ATTACK_CONTACT||!Number.isInteger(request.elapsedMs)||request.elapsedMs<=300)throw Error('Owned Pawn preparation and actual post300ms contact request required');return episode;
 }
 #collection(request,episode,{status,hits=[],...details}){
  const contacts=Object.freeze([...hits]);this.#contacts.set(contacts,{episode,actor:request.actor,prepared:request.prepared,status,consumed:false,...details});this.#last={status,hitCount:contacts.length,nativeReady:false};return contacts;
 }
 queryContacts(request){
  const episode=this.#request(request);if(episode.queried)throw Error('Pawn contact query replay refused');episode.queried=true;
  const snapshot=this.#registry.snapshot({source:this.#source,excludeSubtype2:this.#options.excludeSubtype2,omitSecondRegistry:this.#options.omitSecondRegistry,excludeSubtype5:this.#options.excludeSubtype5});
  if(snapshot.source.object!==request.actor)throw Error('Source actor registry/bridge identity mismatch');
  if(snapshot.coverage.candidateProducerQualified!==true)return this.#collection(request,episode,{status:'unknown-typed-actor-producers',snapshot});
  assertConquestAttackWorldQueries(this.#worldQueries,{world:this.#world});
  const shape=conquestPawnWorldAttackBox({...snapshot.source,orientDirection280:this.#options.orientDirection280,placeOrigin281:this.#options.placeOrigin281});
  //Type1 rejects the adjusted path for BOTH3B8 values (six original CPU cases).
  //false here selects a representative proof case; no live3B8 value is claimed.
  const geometry=queryConquestAttackBoxGeometry({shape,candidates:snapshot.candidates}),passes=conquestPawnBoxGeometryPasses({shapeType:shape.type,adjustment3b8:false});
  //No caller-supplied "complete" boolean: readiness follows the actual typed
  //registry receipt, original wrapper qualification and type1 selection proof.
  const geometryPassesResolved=snapshot.coverage.candidateProducerQualified&&geometry.completeQueryWrapperQualified&&passes.geometryPassSelectionResolved;
  const partition=classifyConquestBoxAttackContacts({requester:snapshot.source,contacts:geometry.contacts,shape,excludePeerSubtype2:this.#options.excludePeerSubtype2,
   probeSegment:probe=>this.#worldQueries.probeSegment(probe),resolveEqualDistance:this.#options.resolveEqualDistance,geometryPassesResolved});
  this.#registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(this.#worldQueries,{world:this.#world});
  return this.#collection(request,episode,{...partition,snapshot,shape,geometry,world:this.#worldQueries.snapshot()});
 }
 consumeContacts(request){
  const episode=this.#request(request),pending=this.#contacts.get(request.contacts);
  if(!pending||pending.episode!==episode||pending.actor!==request.actor||pending.prepared!==request.prepared||pending.consumed)throw Error('Owned current Pawn contact collection required; replay refused');pending.consumed=true;
  if(pending.status!=='contacts-classified')return {status:pending.status,deliveries:[],nativeReady:false};
  this.#registry.assertCurrent(pending.snapshot);assertConquestAttackWorldQueries(this.#worldQueries,{world:this.#world});
  const session=call(this.#session,{actor:request.actor,prepared:request.prepared,snapshot:pending.snapshot});
  if(session?.ruleId!==12)throw Error('Explicit current Conquest rule12 phase context required');
  for(const name of ['worldPhase5','ruleInfoPresent','balanceServicePresent'])bool(session[name],name);
  const sourceContext=call(this.#sourceContext,{actor:request.actor,snapshot:pending.snapshot,prepared:request.prepared});
  if(!sourceContext||!Object.hasOwn(sourceContext,'controllerFlag20')||!Object.hasOwn(sourceContext,'team')||!Object.hasOwn(sourceContext,'creditOwnerPeerId78'))throw Error('Current source controller20/team and explicit credit-owner peer context required');
  const deliveries=[];
  //Resolve all producer/binding gates before the first HP mutation. A missing
  //target never becomes a guessed numeric record or a different health owner.
  for(const contact of request.contacts){
   const actor=contact.actor,target=this.#targets.get(actor.binding),binding=target?.damageBinding,receiver=binding?.receiver;
   if(!target)return {status:'unknown-player-target-binding',deliveries:[],nativeReady:false};
   if(this.#bridge.playerDamageBindings.get(binding.playerId)!==binding||receiver.target!==actor.combatState||receiver.profile.vtable!==actor.actorVtable)throw Error('Current actual bridge player HP owner/profile required');
   const context=call(target.readContext,{actor,combatState:actor.combatState,fieldReceipt:actor.fieldReceipt,session});
   if(!context||!Number.isInteger(context.phaseId)||!Number.isFinite(context.maxHp)||context.maxHp!==receiver.maxHp||bool(context.invincible,'target invincibility')!==actor.combatState.invincible)throw Error('Current target phase, actual invincibility and explicit maximum HP required');
   bool(context.slot4c,'target slot4C');
   const state=actor.fieldReceipt?.currentState;
   if(!state)throw Error('Actual typed ordinary player state required');
   const defenses=conquestPawnPlayerDefenseProfile({playerVtable:actor.actorVtable,weaponType:request.prepared.weaponType,attackAttribute:request.prepared.attributeId,playerState:target.defenseState});
   const produced=produceConquestPawnPlayerDamageRecord({source:{vtable:0x13f0244,isLocalPlayer:false,peerId:pending.snapshot.source.peerId2c,controllerFlag20:sourceContext.controllerFlag20,team:sourceContext.team},attack:request.prepared,
    target:{vtable:actor.actorVtable,state,phaseId:context.phaseId,invincible:context.invincible,defenses},session,attributeId:request.prepared.attributeId,creditOwnerPeerId78:sourceContext.creditOwnerPeerId78});
   deliveries.push({contact,target,binding,produced,slot44:actor.eligible44,slot4c:context.slot4c,invincible:context.invincible});
  }
  this.#active();this.#registry.assertCurrent(pending.snapshot);assertConquestAttackWorldQueries(this.#worldQueries,{world:this.#world});
  for(const {contact,target,binding,invincible}of deliveries)if(this.#targets.get(contact.actor.binding)!==target||this.#bridge.playerDamageBindings.get(binding.playerId)!==binding||binding.receiver.target!==contact.actor.combatState||contact.actor.combatState.invincible!==invincible)throw Error('Target binding/invincibility changed during record production');
  const results=deliveries.map(({contact,binding,produced,slot44,slot4c})=>{binding.receiver.slot44=slot44;binding.receiver.slot4c=slot4c;return {targetIdentity:contact.actor.identity,produced,result:this.#bridge.receivePlayerDamage(binding,produced.record)};});
  return this.#last={status:'pawn-player-records-delivered',deliveries:results,blocked:pending.blocked,geometry:pending.geometry,world:pending.world,recordSideEffectsComplete:false,nativeReady:false};
 }
 createContactRuntime(){this.#active();return new ConquestPawnAttackContactRuntime(this.ports);}
 snapshot(){return this.#last??{status:'idle',nativeReady:false};}
 dispose(){if(this.#disposed)return;this.#disposed=true;this.#targets.clear();}
}
