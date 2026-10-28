import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestAttackActorRegistry} from './conquest-monster-attack-actors.js';
import {ConquestPawnExplodeAttackPreparation,produceConquestPawnExplodePlayerDamageRecord} from './conquest-pawn-explode-damage-record.js';
import {CONQUEST_PAWN_EXPLODE_SOURCE} from './conquest-pawn-explode-ai.js';
import {readConquestPawnExplodeTimerOwner,assertConquestPawnExplodeExplosionEvent} from './conquest-pawn-explode-timer.js';
import {CONQUEST_PAWN_EXPLODE_CONSTANTS,queryConquestPawnExplodeSphere,classifyConquestPawnExplodeContacts} from './conquest-pawn-explode-sphere.js';
import {assertConquestAttackWorldQueries} from './conquest-attack-world-queries.js';
import {conquestPlayerDefenseProfile} from './conquest-player-defense.js';
const f=Math.fround,sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,value)=>{const result=fn(value);if(result?.then)throw Error('Synchronous retained explosion context required');return result;};
const bool=(value,label)=>{if(typeof value!=='boolean')throw Error('Explicit '+label+' required');return value;};
const vector=value=>['x','y','z'].map(k=>f(value[k]));
const length=v=>f(Math.sqrt(f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]))));
// The real timer's private event → full owned candidate enumeration → source
//capsule query → real map obstruction → typed player record → actual bridge HP.
//No1003 preparation/BOX attribute is reused. No query-empty fallback exists.
export class ConquestPawnExplodePlayerCombat{
 #bridge;#registry;#source;#world;#queries;#prepare;#session;#sourceContext;#gate;#options;#episodes=new WeakMap();#targets=new Map();#disposed=false;#busy=false;#last=null;
 constructor({bridge,registry,sourceBinding,world,worldQueries,preparation,readSessionContext,readSourceContext,readAttackGate,
  excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2,resolveEqualDistance}={}){
  if(!(bridge instanceof ConquestRuntimeBridge)||!(registry instanceof ConquestAttackActorRegistry)||sourceBinding?.kind!=='monster'||!(preparation instanceof ConquestPawnExplodeAttackPreparation)||![readSessionContext,readSourceContext,readAttackGate].every(sync)||resolveEqualDistance!==undefined&&!sync(resolveEqualDistance))throw Error('Actual explosion bridge/registry/preparation and synchronous source context required');
  assertConquestAttackWorldQueries(worldQueries,{world});for(const [k,v]of Object.entries({excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2}))bool(v,k);
  this.#bridge=bridge;this.#registry=registry;this.#source=sourceBinding;this.#world=world;this.#queries=worldQueries;this.#prepare=preparation;this.#session=readSessionContext;this.#sourceContext=readSourceContext;this.#gate=readAttackGate;
  this.#options={excludeSubtype2,omitSecondRegistry,excludeSubtype5,excludePeerSubtype2,resolveEqualDistance};
  this.ports=Object.freeze({prepareAttack:request=>this.prepareAttack(request),readTickGate:request=>this.readTickGate(request),consumeExplosionEvent:event=>this.consumeExplosionEvent(event),exitAttack:request=>this.exitAttack(request)});
 }
 #active(){if(this.#disposed)throw Error('Disposed Pawn Explode/player pipeline');}
 #actor(actor){this.#active();if(actor?.id!==this.#source.id||this.#bridge.actors.get(actor.id)!==actor||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013)throw Error('Actual current bridge-owned Pawn Explode1013 required');return actor;}
 bindPlayerTarget({actorBinding,damageBinding,defenseState,readContext}={}){
  this.#active();if(actorBinding?.kind!=='player'||this.#targets.has(actorBinding)||damageBinding?.playerId!==actorBinding.id||this.#bridge.playerDamageBindings.get(damageBinding.playerId)!==damageBinding||!defenseState||!sync(readContext))throw Error('Distinct actual player actor/damage binding, defenses and current context required');
  const token=Object.freeze({actorBinding,damageBinding});this.#targets.set(actorBinding,{token,damageBinding,defenseState,readContext});return token;
 }
 unbindPlayerTarget(token){this.#active();return this.#targets.get(token?.actorBinding)?.token===token&&this.#targets.delete(token.actorBinding);}
 prepareAttack({actor,source,generation}={}){
  this.#actor(actor);if(source!==CONQUEST_PAWN_EXPLODE_SOURCE.explosion||!Number.isInteger(generation)||generation<=0)throw Error('Actual source explosion and timer generation required');
  const value=this.#prepare.prepare(actor);this.#episodes.set(value,{actor,generation,consumed:false,exited:false});return value;
 }
 #episode({actor,source,prepared}){
  this.#actor(actor);const episode=this.#episodes.get(prepared);if(source!==CONQUEST_PAWN_EXPLODE_SOURCE.explosion||episode?.actor!==actor||episode.exited||!this.#prepare.owns(prepared,actor))throw Error('Current retained explosion preparation episode required');return episode;
 }
 readTickGate(request){this.#episode(request);const gate=call(this.#gate,request);if(gate?.qualified!==true||typeof gate.enabled!=='boolean'||typeof gate.collisionAllowed!=='boolean')throw Error('Current qualified explosion attack tick predicates required');return gate;}
 exitAttack({actor,prepared,source}){this.#active();const e=this.#episodes.get(prepared);if(e?.actor!==actor||source!==CONQUEST_PAWN_EXPLODE_SOURCE.explosion)throw Error('Owned explosion preparation required for resource release');e.exited=true;}
 #refuse(status,details={}){return this.#last={qualified:false,status,reason:status,deliveries:[],...details,nativeReady:false};}
 consumeExplosionEvent(event){
  this.#active();if(this.#busy)throw Error('Nonreentrant explosion consumption required');this.#busy=true;
  try{return this.#consume(event);}finally{this.#busy=false;}
 }
 #consume(event){
  const actor=this.#bridge.actors.get(this.#source.id),owner=readConquestPawnExplodeTimerOwner(actor);assertConquestPawnExplodeExplosionEvent(event,{owner,actor});
  const request={actor,source:event.source,prepared:event.prepared},episode=this.#episode(request);
  if(event.generation!==episode.generation||episode.consumed||event.elapsedMs<=3000)throw Error('Actual once-only post3000ms explosion event required');episode.consumed=true;
  const snapshot=this.#registry.snapshot({source:this.#source,excludeSubtype2:this.#options.excludeSubtype2,omitSecondRegistry:this.#options.omitSecondRegistry,excludeSubtype5:this.#options.excludeSubtype5});
  if(snapshot.source.object!==actor)throw Error('Current source registry/timer actor mismatch');
  if(snapshot.coverage.candidateProducerQualified!==true)return this.#refuse('unknown-typed-actor-producers');
  const origin=vector(event.transform.position),expected=[...snapshot.source.position7c];expected[1]=f(expected[1]+f(snapshot.source.height6c*CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33));
  if(event.transform.heightFactor33!==CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33||origin.some((v,i)=>!Number.isFinite(v)||v!==expected[i]))throw Error('Current source constant_float33/position/height explosion transform required');
  assertConquestAttackWorldQueries(this.#queries,{world:this.#world});
  const geometry=queryConquestPawnExplodeSphere({origin,radius:event.source.radius,candidates:snapshot.candidates}),partition=classifyConquestPawnExplodeContacts({requester:snapshot.source,contacts:geometry.contacts,origin,excludePeerSubtype2:this.#options.excludePeerSubtype2,probeSegment:q=>this.#queries.probeSegment(q),resolveEqualDistance:this.#options.resolveEqualDistance});
  this.#registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(this.#queries,{world:this.#world});
  if(partition.status!=='contacts-classified')return this.#refuse(partition.status,{geometry,blocked:partition.blocked});
  const session=call(this.#session,{actor,prepared:event.prepared,snapshot});if(session?.ruleId!==12)throw Error('Current actual Conquest rule12 context required');
  for(const k of ['worldPhase5','ruleInfoPresent','balanceServicePresent'])bool(session[k],k);
  const sourceContext=call(this.#sourceContext,{actor,prepared:event.prepared,snapshot});
  if(!sourceContext||!Object.hasOwn(sourceContext,'controllerFlag20')||!Object.hasOwn(sourceContext,'team')||!Object.hasOwn(sourceContext,'creditOwnerPeerId78')||sourceContext.team!==null&&sourceContext.team?.id!==actor.teamSelector)throw Error('Current source controller/team selector and credit owner required');
  const deliveries=[];
  for(const contact of partition.hits){
   const candidate=contact.actor,target=this.#targets.get(candidate.binding),binding=target?.damageBinding,receiver=binding?.receiver;
   if(!target)return this.#refuse('unknown-player-target-binding');
   if(this.#bridge.playerDamageBindings.get(binding.playerId)!==binding||receiver.target!==candidate.combatState||receiver.profile.vtable!==candidate.actorVtable)throw Error('Current real bridge player HP owner/profile required');
   const context=call(target.readContext,{actor:candidate,combatState:candidate.combatState,fieldReceipt:candidate.fieldReceipt,session});
   if(!Number.isInteger(context?.phaseId)||!Number.isFinite(context.maxHp)||context.maxHp!==receiver.maxHp||bool(context.invincible,'target invincibility')!==candidate.combatState.invincible||!Object.hasOwn(context,'team'))throw Error('Current explicit player phase/HP/invincibility/team required');
   bool(context.slot4c,'target slot4C');const state=candidate.fieldReceipt?.currentState;if(!state)throw Error('Actual typed current player state required');
   const defenses=conquestPlayerDefenseProfile({playerVtable:candidate.actorVtable,weaponType:55,hitPart:0,playerState:target.defenseState}),center=[...candidate.position7c];center[1]=f(center[1]+f(candidate.height6c*CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33));
   const distance=length(center.map((v,i)=>f(v-origin[i]))),produced=produceConquestPawnExplodePlayerDamageRecord({source:{vtable:0x13f0244,isLocalPlayer:false,peerId:snapshot.source.peerId2c,controllerFlag20:sourceContext.controllerFlag20,team:sourceContext.team},attack:event.prepared,
    target:{vtable:candidate.actorVtable,peerId:candidate.peerId2c,team:context.team,state,phaseId:context.phaseId,invincible:context.invincible,defenses},session,distance,creditOwnerPeerId78:sourceContext.creditOwnerPeerId78});
   deliveries.push({contact,target,binding,produced,slot44:candidate.eligible44,slot4c:context.slot4c,invincible:context.invincible});
  }
  // Prepare every record and revalidate the entire retained collection before
  //the first actual HP write. Query/reaction callbacks cannot inject stale hits.
  this.#active();assertConquestPawnExplodeExplosionEvent(event,{owner,actor});this.#registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(this.#queries,{world:this.#world});
  for(const d of deliveries)if(this.#targets.get(d.contact.actor.binding)!==d.target||this.#bridge.playerDamageBindings.get(d.binding.playerId)!==d.binding||d.binding.receiver.target!==d.contact.actor.combatState||d.contact.actor.combatState.invincible!==d.invincible)throw Error('Player HP binding/invincibility changed during explosion production');
  const results=deliveries.map(({contact,binding,produced,slot44,slot4c})=>{binding.receiver.slot44=slot44;binding.receiver.slot4c=slot4c;return {targetIdentity:contact.actor.identity,produced,result:this.#bridge.receivePlayerDamage(binding,produced.record)};});
  return this.#last={qualified:true,status:'pawn-explode-player-records-delivered',deliveries:results,blocked:partition.blocked,geometry,world:this.#queries.snapshot(),explosionGeometryQualified:true,damageRecordQualified:true,recordSideEffectsComplete:false,nativeReady:false};
 }
 snapshot(){return this.#last??{qualified:false,status:'idle',nativeReady:false};}
 dispose(){if(this.#disposed)return;this.#disposed=true;this.#targets.clear();}
}
