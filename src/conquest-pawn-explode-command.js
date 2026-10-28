import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {assertConquestPawnExplodeSelfBombRequest} from './conquest-pawn-explode-ai.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;

// A00090 ->9FFDB0 /13EFD7C, native kind11. Unlike Death/ordinary Attack,
// its nonempty slot14 runs on pending admission A24700, not on expiry.
export class ConquestPawnExplodeSelfBombCommand{
 constructor(source,{actor,actorAuthority,timerPorts}={}){
  assertConquestPawnExplodeSelfBombRequest(source,{actor});
  if(!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor||!['readTimerBombOwner','startTimerBomb'].every(k=>typeof timerPorts?.[k]==='function'))throw Error('Current1013 actor authority and actual timer owner/activation ports required');
  Object.assign(this,{actor,actorAuthority,actorId:actor.id,gameTime:source.gameTime,bombTimeMs:source.bombTimeMs,nativeType:11,disposed:false});
  this.peerId=Object.freeze(actorAuthority.identity(actor.id));
  this.timerPorts=Object.freeze({readTimerBombOwner:timerPorts.readTimerBombOwner,startTimerBomb:timerPorts.startTimerBomb});
  this.counter={updates:0,durationMs:0,elapsedMs:0,paused:false};
 }
 currentActor(){if(this.disposed)throw Error('Live Pawn Explode command required');const actor=this.actorAuthority.lookupFullIdentity(this.peerId);if(actor!==null&&actor!==this.actor)throw Error('Pawn Explode command actor identity replaced');return actor;}
 enter(){
  const actor=this.currentActor();if(actor===null)return false;
  // A04A10 guards the actor+2F4 component before callingB8A720. No component
  // is fabricated and this command does not resolve explosion damage.
  const owner=this.timerPorts.readTimerBombOwner(actor);if(owner===undefined||owner?.then)throw Error('Explicit synchronous current timer component or null required');
  if(owner===null)return false;
  const result=this.timerPorts.startTimerBomb(owner,{actor,bombTimeMs:this.bombTimeMs});if(result?.then)throw Error('Synchronous native timer activation required');return true;
 }
 tick(deltaMs){
  if(!u32(deltaMs))throw Error('Exact uint32 Pawn Explode command delta required');
  const advance=()=>{if(!this.counter.paused){this.counter.updates=(this.counter.updates+1)>>>0;this.counter.elapsedMs=(this.counter.elapsedMs+deltaMs)>>>0;}};
  //9FFE40 first runs base9FCC20, then resolves the current full actor ID.
  advance();if(this.currentActor()===null){this.counter.updates=0;this.counter.durationMs=0;this.counter.elapsedMs=0;advance();}
 }
 isRunning(){if(this.disposed)throw Error('Live Pawn Explode command required');return this.counter.durationMs>=this.counter.elapsedMs;}
 exit(){if(this.disposed)throw Error('Live Pawn Explode command required');}
 destroy(){this.disposed=true;}
 snapshot(){return {nativeType:11,actorId:this.actorId,peerId:[...this.peerId],gameTime:this.gameTime,bombTimeMs:this.bombTimeMs,counter:{...this.counter},disposed:this.disposed,
  commandKernelQualified:true,timerExecutionQualified:false,nativeReady:false};}
}
