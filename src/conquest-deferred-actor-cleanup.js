import {assertConquestKingRuntime} from './conquest-king-runtime.js';
import {assertConquestKingReactions} from './conquest-king-reactions.js';
import {assertConquestQueenRuntime} from './conquest-queen-runtime.js';
import {assertConquestQueenReactions} from './conquest-queen-reactions.js';
import {assertConquestRookExplodeRuntime} from './conquest-rook-explode-runtime.js';
import {assertConquestRookExplodeReactions} from './conquest-rook-explode-reactions.js';
import {assertConquestBishopSnipeRuntime} from './conquest-bishop-snipe-runtime.js';
import {assertConquestBishopSnipeReactions} from './conquest-bishop-snipe-reactions.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnRuntime} from './conquest-pawn-runtime.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {assertConquestPawnReactions} from './conquest-pawn-reactions.js';
import {assertConquestPawnExplodeRuntime} from './conquest-pawn-explode-runtime.js';
import {assertConquestPawnExplodeReactions} from './conquest-pawn-explode-reactions.js';
import {assertConquestRookRuntime} from './conquest-rook-runtime.js';
import {assertConquestRookReactions} from './conquest-rook-reactions.js';
import {assertConquestKnightRuntime} from './conquest-knight-runtime.js';
import {assertConquestKnightReactions} from './conquest-knight-reactions.js';
import {assertConquestKnightChargeRuntime} from './conquest-knight-charge-runtime.js';
import {assertConquestKnightChargeReactions} from './conquest-knight-charge-reactions.js';
import {assertConquestBishopRuntime} from './conquest-bishop-runtime.js';
import {assertConquestBishopReactions} from './conquest-bishop-reactions.js';

const tickets=new WeakMap(),owners=new WeakMap();
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// A016B0 calls controller.virtual20 -> A1DC00 -> A1D010 only on actual
// destructor entry. This arithmetic is deliberately separate from list unlink.
export function conquestAdvanceDestroyedCount(count,expectedCount){
 if(![count,expectedCount].every(n=>Number.isInteger(n)&&n>=-0x80000000&&n<=0x7fffffff))throw Error('Native int32 destruction count and expected count required');
 const next=(count+1)|0;return expectedCount!==0&&next>expectedCount?expectedCount:next;
}
export function conquestCleanupShortPeer(peer){
 if(!Array.isArray(peer)||peer.length!==2||!peer.every(u32))throw Error('Actual two-DWORD source peer identity required');
 return peer[1]>>>16;
}

// A11C70(after each virtual58) -> A12B00(empty) -> A12B10/A12480.
// Entries are retained references in collection order. The caller advances the
// real actors before this collector; it never calls their state update twice.
export function conquestDeferredCleanupPlan(entries){
 if(!Array.isArray(entries))throw Error('Ordered source actor entries required');
 for(const entry of entries)if(!entry?.actor||![0,1].includes(entry.cleanup359))throw Error('Explicit source actor359 byte required');
 const pending=entries.filter(e=>e.cleanup359!==0).map(e=>conquestCleanupShortPeer(e.peerId2c)),remaining=[...entries],removals=[];
 for(const shortPeer of pending){
  // A12480 erases the FIRST current match, not necessarily the flag writer.
  const index=remaining.findIndex(e=>conquestCleanupShortPeer(e.peerId2c)===shortPeer);
  if(index<0)continue;
  const [entry]=remaining.splice(index,1);removals.push({entry,shortPeer});
 }
 return {pending,removals,remaining};
}

// Typed producer for the real post-state/tail Session phase. This grants only
// global-reference removal. No boolean here authorizes a native destructor or
// disposing the model: A12480 Release can leave other references alive.
export function createConquestDeferredActorCleanup({monsterActors,runtimes,reactionsByActor,actorAuthority}={}){
 if(!(monsterActors instanceof Map)||!(runtimes instanceof Map)||!(reactionsByActor instanceof Map)||!(actorAuthority instanceof ConquestPawnActorAuthority))throw Error('Actual actor/runtime/reaction Maps and authority required');
 let disposed=false,serial=0,outstanding=[],passOrder=[];
 const owner={};
 function live(){if(disposed)throw Error('Disposed deferred actor cleanup owner');}
 function entryFor(actor){
  if(!(actor instanceof ConquestMonsterActor)||monsterActors.get(actor.id)!==actor||actorAuthority.actor(actor.id)!==actor)throw Error('Current authority-owned source monster required');
  const runtime=runtimes.get(actor.id),reactions=reactionsByActor.get(actor);
  if(actor.spawnStats.monsterKey===1013){assertConquestPawnExplodeRuntime(runtime,{actor});assertConquestPawnExplodeReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1100){assertConquestRookRuntime(runtime,{actor});assertConquestRookReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1203){assertConquestKnightRuntime(runtime,{actor});assertConquestKnightReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1204){assertConquestKnightChargeRuntime(runtime,{actor});assertConquestKnightChargeReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1110){assertConquestRookExplodeRuntime(runtime,{actor});assertConquestRookExplodeReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1303){assertConquestBishopRuntime(runtime,{actor});assertConquestBishopReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1403){assertConquestQueenRuntime(runtime,{actor});assertConquestQueenReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1500){assertConquestKingRuntime(runtime,{actor});assertConquestKingReactions(reactions,{actor});}
  else if(actor.spawnStats.monsterKey===1314){assertConquestBishopSnipeRuntime(runtime,{actor});assertConquestBishopSnipeReactions(reactions,{actor});}
  else {if(!(runtime instanceof ConquestPawnRuntime)||runtime.disposed||runtime.actor!==actor)throw Error('Current actual Pawn runtime required');assertConquestPawnReactions(reactions,{actor});}
  const fields=reactions.snapshot().fields;
  return {actor,runtime,reactions,model:actor.model,peerId2c:actorAuthority.identity(actor.id),cleanup359:fields.cleanup359};
 }
 function currentTicket(ticket){
  live();const record=tickets.get(ticket);
  if(record?.owner!==owner||record.done||outstanding[0]!==ticket)throw Error('Current first owned cleanup ticket required');
  // Earlier acknowledgements can remove entries, but all remaining originals
  // must retain their order, actual objects, identities and owner bindings.
  const current=[...monsterActors.values()];
  if(current.length!==passOrder.length||current.some((actor,i)=>actor!==passOrder[i]))throw Error('Actor collection changed during deferred cleanup pass');
  const actual=entryFor(record.entry.actor);
  if(actual.runtime!==record.entry.runtime||actual.reactions!==record.entry.reactions||actual.model!==record.entry.model||actual.peerId2c.some((v,i)=>v!==record.entry.peerId2c[i]))throw Error('Cleanup actor owner replaced');
  return record;
 }
 Object.assign(owner,{
  collect(){
   live();if(outstanding.length)throw Error('Complete the previous deferred cleanup pass first');
   const entries=[...monsterActors.values()].map(entryFor),plan=conquestDeferredCleanupPlan(entries);passOrder=entries.map(e=>e.actor);serial++;
   outstanding=plan.removals.map(({entry,shortPeer})=>{
    const ticket=Object.freeze({actorId:entry.actor.id,passSerial:serial,shortPeer,
     sourceGlobalReferenceRemovalPermitted:true,nativeCleanupPermitted:false,
     nativeReferenceCountQualified:false,nativeDestructorQualified:false,modelDisposalPermitted:false,
     source:{collect:0xa11c70,pending:0xa12b10,remove:0xa12480}});
    tickets.set(ticket,{owner,entry,done:false});return ticket;
   });return [...outstanding];
  },
  assertTicket(ticket,{actor}={}){const record=currentTicket(ticket);if(actor!==undefined&&record.entry.actor!==actor)throw Error('Cleanup ticket belongs to another actor');return ticket;},
  // Caller first validates the ticket while all bindings are live, then unbinds
  // authority/contact owners and removes the actual global Map reference. No
  // native deletion or model disposal is performed by this method.
  acknowledgeGlobalRemoval(ticket){
   live();const record=tickets.get(ticket);
   if(record?.owner!==owner||record.done||outstanding[0]!==ticket)throw Error('Current first owned cleanup ticket required');
   const actor=record.entry.actor;
   if(monsterActors.has(actor.id))throw Error('Remove the actual global reference before acknowledging cleanup');
   const expected=passOrder.filter(a=>a!==actor),current=[...monsterActors.values()];
   if(current.length!==expected.length||current.some((a,i)=>a!==expected[i]))throw Error('Unexpected actor removal/replacement during cleanup');
   // Coverage also rejects a stale private authority binding retaining the
   // removed actor, while verifying all remaining actor bindings still live.
   actorAuthority.monsters();
   record.done=true;outstanding.shift();passOrder=expected;
   return Object.freeze({actorId:actor.id,globalReferenceRemoved:true,modelDisposalPermitted:false,nativeDestructorQualified:false});
  },
  snapshot(){live();return {passSerial:serial,pendingCount:outstanding.length,actorCount:monsterActors.size,
   collectionOrder:'actual S5 monster Map insertion order',nativeRegistryOrderObserved:false,nativeReferenceCountQualified:false,nativeDestructorQualified:false};},
  dispose(){if(disposed)return;disposed=true;outstanding=[];passOrder=[];},
 });owners.set(owner,{monsterActors,runtimes,reactionsByActor,actorAuthority});return Object.freeze(owner);
}

export function assertConquestDeferredActorCleanup(owner,{monsterActors,runtimes}={}){
 const record=owners.get(owner);if(!record||monsterActors!==undefined&&record.monsterActors!==monsterActors||runtimes!==undefined&&record.runtimes!==runtimes)throw Error('Actual retained deferred cleanup owner required');owner.snapshot();return owner;
}
export function assertConquestActorCleanupTicket(ticket,{owner,actor}={}){
 assertConquestDeferredActorCleanup(owner);return owner.assertTicket(ticket,{actor});
}
