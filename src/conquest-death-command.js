import {assertConquestKingDeathCommand} from './conquest-king-death-producer.js';
import {assertConquestQueenDeathCommand} from './conquest-queen-reactions.js';
import {assertConquestRookExplodeDeathCommand} from './conquest-rook-explode-reactions.js';
import {assertConquestBishopSnipeDeathCommand} from './conquest-bishop-snipe-reactions.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {assertConquestPawnDeathCommand} from './conquest-pawn-reactions.js';
import {assertConquestPawnExplodeDeathCommand} from './conquest-pawn-explode-reactions.js';
import {assertConquestRookDeathCommand} from './conquest-rook-reactions.js';
import {assertConquestKnightDeathCommand} from './conquest-knight-reactions.js';
import {assertConquestKnightChargeDeathCommand} from './conquest-knight-charge-reactions.js';
import {assertConquestBishopDeathCommand} from './conquest-bishop-reactions.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
import {setConquestPawnCommandPosition} from './conquest-pawn-movement-owner.js';
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;

// 9FF570 -> 9FF250 /13EFCA8, type2. Enter9FF310 is actually empty.
// Exit9FF320 queues input4, restores command position/33C, then removes
// only the AI list reference. The actor, model and state runtime survive.
export class ConquestDeathCommand {
 constructor(source,{actor,actorAuthority}={}){
  if(!(actorAuthority instanceof ConquestPawnActorAuthority))throw Error('Actual Pawn Death actor authority required');
  if(actor?.spawnStats.monsterKey===1013)assertConquestPawnExplodeDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1100)assertConquestRookDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1203)assertConquestKnightDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1204)assertConquestKnightChargeDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1110)assertConquestRookExplodeDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1303)assertConquestBishopDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1403)assertConquestQueenDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1500)assertConquestKingDeathCommand(source,{actor,actorAuthority});
  else if(actor?.spawnStats.monsterKey===1314)assertConquestBishopSnipeDeathCommand(source,{actor,actorAuthority});
  else assertConquestPawnDeathCommand(source,{actor,actorAuthority});
  this.actor=actor;this.actorAuthority=actorAuthority;this.actorId=actor.id;
  this.gameTime=source.gameTime;this.peerId=Object.freeze([...source.peerId]);
  this.position=Object.freeze(conquestNativeMoveVector(source.position));this.field33C=source.field33C;
  this.counter={updates:0,durationMs:0,elapsedMs:0,paused:false};
 }
 enter(){}
 tick(deltaMs){if(!uint(deltaMs))throw Error('Exact native unsigned Death delta required');if(!this.counter.paused){this.counter.updates=(this.counter.updates+1)>>>0;this.counter.elapsedMs=(this.counter.elapsedMs+deltaMs)>>>0;}}
 isRunning(){return this.counter.durationMs>=this.counter.elapsedMs;}
 exit({requestNativeInput,removeAIReference}={}){
  const actor=this.actorAuthority.lookupFullIdentity(this.peerId);if(actor===null)return false;
  if(actor!==this.actor)throw Error('Pawn Death command actor identity was replaced');
  if(typeof requestNativeInput!=='function'||typeof removeAIReference!=='function')throw Error('Owned Death queued-input and AI-reference owners required');
  requestNativeInput(actor,4);setConquestPawnCommandPosition(actor,this.position);actor.nativeField33C=this.field33C;removeAIReference(actor);return true;
 }
}
