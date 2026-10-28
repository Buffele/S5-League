import {ConquestAttackActorRegistry,CONQUEST_DIRECT_ROOK_SPHERE_ENUMERATION_POLICY} from './conquest-monster-attack-actors.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {ConquestCommandQueue} from './conquest-command-queue.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestRookAIRuntime} from './conquest-rook-ai.js';
import {assertConquestRookActor} from './conquest-rook-source.js';
import {assertConquestRookAuraRequest} from './conquest-rook-aura.js';
import {assertConquestMonsterDefenseAuraFields,assertConquestMonsterDefenseAuraFieldReceipt} from './conquest-monster-defense-aura-fields.js';
import {assertConquestRookDefenseConditions} from './conquest-rook-defense-conditions.js';
import {assertConquestAttackWorldQueries} from './conquest-attack-world-queries.js';
import {queryConquestPawnExplodeSphere} from './conquest-pawn-explode-sphere.js';
import {practiceSentryFilterImpacts} from './practice-sentry-impact.js';
import {orderConquestRookAuraContacts} from './conquest-rook-aura-order.js';
import {conquestRookAuraCandidateFilter,conquestRookAuraCandidateDecision} from './conquest-rook-aura-query.js';
const sources=new WeakMap(),f=Math.fround,uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function assertConquestRookDefenseCommandSource(source,{actorAuthority,conditionOwner}={}){const p=sources.get(source);if(!p||p.authority!==actorAuthority||p.conditions!==conditionOwner)throw Error('Typed source-produced Rook defense command required');p.live();return source;}
// Real complete owned actor registry -> type5 capsule geometry -> Rook filter
// -> rawMode0 ordering/obstruction -> original feet decision -> typed command.
// Generic sphere math is shape5 source; explosion rawMode1 is NOT reused.
export class ConquestRookAuraCombat{
 #actor;#registry;#binding;#authority;#monsters;#world;#queries;#conditions;#ai;#queue;#context;#enumeration;#fields=new Map();#requests=new WeakSet();#disposed=false;#busy=false;#last=null;
 constructor({actor,registry,sourceBinding,actorAuthority,monsterActors,world,worldQueries,conditionOwner,aiRuntime,commandQueue,readQueryContext,enumeration,resolveEqualDistance}={}){
  assertConquestRookActor(actor);if(!(registry instanceof ConquestAttackActorRegistry)||sourceBinding?.kind!=='monster'||sourceBinding.id!==actor.id||!(actorAuthority instanceof ConquestPawnActorAuthority)||!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor||!(aiRuntime instanceof ConquestRookAIRuntime)||aiRuntime.actor!==actor||!(commandQueue instanceof ConquestCommandQueue)||typeof readQueryContext!=='function')throw Error('Actual Rook actor/registry/AI/queue and current context required');
  if(resolveEqualDistance!==undefined)throw Error('Qualified original Rook qsort cannot be replaced by a tie callback');
  assertConquestAttackWorldQueries(worldQueries,{world});assertConquestRookDefenseConditions(conditionOwner,{actorAuthority});for(const name of ['excludeSubtype2','omitSecondRegistry','excludeSubtype5'])if(typeof enumeration?.[name]!=='boolean')throw Error('Explicit source enumeration selection required');
  this.#actor=actor;this.#registry=registry;this.#binding=sourceBinding;this.#authority=actorAuthority;this.#monsters=monsterActors;this.#world=world;this.#queries=worldQueries;this.#conditions=conditionOwner;this.#ai=aiRuntime;this.#queue=commandQueue;this.#context=readQueryContext;this.#enumeration={...enumeration};
 }
 #live(){if(this.#disposed||this.#monsters.get(this.#actor.id)!==this.#actor||this.#authority.actor(this.#actor.id)!==this.#actor)throw Error('Current owned Rook aura combat required');assertConquestRookActor(this.#actor);assertConquestRookDefenseConditions(this.#conditions,{actorAuthority:this.#authority});ConquestRookAIRuntime.prototype.assertLive.call(this.#ai);}
 bindActor({actor,fieldsOwner}={}){this.#live();if(this.#fields.has(actor)||this.#monsters.get(actor.id)!==actor)throw Error('Distinct real Rook aura candidate fields required');assertConquestMonsterDefenseAuraFields(fieldsOwner,{actor});this.#fields.set(actor,fieldsOwner);}
 unbindActor(actor){this.#live();return this.#fields.delete(actor);}
 #refuse(reason,details={}){return this.#last={accepted:false,queryQualified:false,reason,commands:[],...details,nativeReady:false};}
 consume(request,{owner,actor}={}){
  this.#live();assertConquestRookAuraRequest(request,{owner,actor});if(actor!==this.#actor||this.#busy||this.#requests.has(request))throw Error('Actual once-only nonreentrant Rook aura source required');this.#requests.add(request);this.#busy=true;
  try{
   const context=this.#context({actor,request});if(context?.then||typeof context?.managerHost20!=='boolean'||typeof context.worldPhase2!=='boolean'||!uint(context.gameTime))throw Error('Explicit synchronous current Rook host/phase2/GameTime required');if(!context.managerHost20||!context.worldPhase2)return this.#refuse('source-host-or-world-phase-gate');
   const snapshot=this.#registry.snapshotDirectSphere({source:this.#binding,...this.#enumeration,policy:CONQUEST_DIRECT_ROOK_SPHERE_ENUMERATION_POLICY});if(snapshot.source.object!==actor||snapshot.coverage.candidateProducerQualified!==true)return this.#refuse('unknown-typed-candidate-producers');assertConquestAttackWorldQueries(this.#queries,{world:this.#world});
   const origin=[...snapshot.source.position7c];origin[1]=f(origin[1]+f(snapshot.source.height6c*f(.5)));const geometry=queryConquestPawnExplodeSphere({origin,radius:request.radius,candidates:snapshot.candidates}),fieldReceipts=[];
   const filtered=geometry.contacts.filter(contact=>{const target=contact.actor.object;if(!(target instanceof ConquestMonsterActor))return false;const fieldsOwner=this.#fields.get(target);if(!fieldsOwner)throw Error('Missing real aura35B producer for current source-query candidate');const receipt=fieldsOwner.read();assertConquestMonsterDefenseAuraFieldReceipt(receipt,{owner:fieldsOwner,actor:target});fieldReceipts.push({receipt,fieldsOwner,target});return conquestRookAuraCandidateFilter({isCMonster:true,eligible44:contact.actor.eligible44,canSufferDefenseAura35B:receipt.canSufferDefenseAura35B,teamByte:target.teamSelector},{auraTeamByte:actor.teamSelector});});
   const mode0=practiceSentryFilterImpacts({requester:snapshot.source,contacts:filtered,rawMode:0,excludePeerSubtype2:false}),ordered=orderConquestRookAuraContacts({contacts:mode0,sourcePosition7c:snapshot.source.position7c,halfFactor:.5});
   const hits=[],blocked=[];for(const contact of ordered){const to=[...contact.actor.position7c];to[1]=f(to[1]+f(contact.actor.height6c*f(.5)));const result=this.#queries.probeSegment({from:[...origin],to,queryMask:0x2107c0,rawQueryFlag:false,coordinateSpace:'native'});if(result===null)return this.#refuse('unknown-real-world-obstruction');if(typeof result.blocked!=='boolean')throw Error('Actual aura obstruction boolean required');(result.blocked?blocked:hits).push(contact);}
   this.#registry.assertCurrent(snapshot);assertConquestAttackWorldQueries(this.#queries,{world:this.#world});for(const r of fieldReceipts)assertConquestMonsterDefenseAuraFieldReceipt(r.receipt,{owner:r.fieldsOwner,actor:r.target});this.#live();
   const commands=[];for(const contact of hits){const target=contact.actor.object;if(!this.#conditions.hasActor(target))return this.#refuse('missing-actual-target-condition208-owner');const conditions=this.#conditions.readConditions(target),decision=conquestRookAuraCandidateDecision({sourcePosition7c:snapshot.source.position7c,candidatePosition7c:contact.actor.position7c,hasCondition100:conditions.conditions.some(c=>c.activeVirtual54&&c.conditionMask===0x100),radius:request.radius});if(!decision.action)continue;
    const source=Object.freeze({kind:'defense-aura',actorId:actor.id,targetActorId:target.id,gameTime:(context.gameTime+112)>>>0,sourcePeerId:Object.freeze([...snapshot.source.peerId2c]),targetPeerId:Object.freeze([...contact.actor.peerId2c]),add:decision.action==='add',factor:request.defenseFactor,effect:request.effect,nativeType:6,sourceQueryCompositionQualified:true,nativeContextObserved:false,nativeReady:false});const sourceModel=actor.model,targetModel=target.model;
    const authority=this.#authority,conditionOwner=this.#conditions;sources.set(source,{authority,conditions:conditionOwner,live:()=>{assertConquestRookDefenseConditions(conditionOwner,{actorAuthority:authority});const currentSource=authority.lookupFullIdentity(source.sourcePeerId),currentTarget=authority.lookupFullIdentity(source.targetPeerId);if(actor.model!==sourceModel||target.model!==targetModel||currentSource!==null&&currentSource!==actor||currentTarget!==null&&currentTarget!==target)throw Error('Current full-peer Rook defense command provenance required');}});commands.push(source);
   }
   return this.#last={accepted:true,queryQualified:true,reason:null,commands,hits:hits.length,blocked:blocked.length,sourceGeometryAndPostQueryCompositionQualified:true,nativeRegistryOrderObserved:false,nativeContextObserved:false,recipientPresentationQualified:false,nativeReady:false};
  }finally{this.#busy=false;}
 }
 snapshot(){return this.#last??{accepted:false,queryQualified:false,reason:'idle',commands:[],nativeReady:false};}
 dispose(){if(this.#disposed)return;if(this.#busy)throw Error('Cannot dispose Rook aura during source query');this.#disposed=true;this.#fields.clear();}
}
