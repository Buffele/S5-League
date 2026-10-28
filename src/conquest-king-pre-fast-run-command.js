import {assertConquestKingActor} from './conquest-king-ai.js';
import {assertConquestKingRuntime} from './conquest-king-runtime.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {assertConquestPawnMovementOwner} from './conquest-pawn-movement-owner.js';
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,flagReceipts=new WeakMap(),commands=new WeakMap();
const commandRecord=command=>{const r=commands.get(command);if(!r||r.destroyed||command.counter!==r.counter)throw Error('Disposed or replaced King source command');return r;};
const resolve=command=>{const r=commandRecord(command),actor=r.authority.lookupFullIdentity(r.peer);if(actor===null)return null;if(actor!==r.actor)throw Error('King command full identity replaced');assertConquestKingRuntime(r.runtime,{actor});return actor;};
export function assertConquestKingFastRunFlagReceipt(receipt,{actor,movementOwner}={}){const r=flagReceipts.get(receipt);if(!r||r.actor!==actor||movementOwner!==undefined&&r.movementOwner!==movementOwner)throw Error('Typed actual King FastRun35D receipt required');r.live();return receipt;}
class KingTimedCommand{
 constructor(source,{actor,actorAuthority,runtime}={},kind){
  assertConquestKingActor(actor);assertConquestKingRuntime(runtime,{actor});if(!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor||source?.kind!==kind||source.actorId!==actor.id||!uint(source.gameTime)||source.source!==(kind==='pre-fast-run'?'CreatePreFastRunCommand':'CreateFastRunCommand'))throw Error('Actual owned King command source/identity required');
  const counter={updates:0,durationMs:kind==='pre-fast-run'?0:2000,elapsedMs:0,paused:false};Object.defineProperties(this,{actorId:{value:actor.id,enumerable:true},gameTime:{value:source.gameTime,enumerable:true},nativeType:{value:kind==='pre-fast-run'?8:10,enumerable:true}});this.counter=counter;commands.set(this,{actor,authority:actorAuthority,runtime,peer:Object.freeze(actorAuthority.identity(actor.id)),counter,destroyed:false,entered:false,entering:false});
 }
 tick(deltaMs){const r=commandRecord(this);if(!uint(deltaMs))throw Error('Live uint32 King command tick required');const c=r.counter;if(!c.paused){c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}}
 isRunning(){const c=commandRecord(this).counter;return c.durationMs>=c.elapsedMs;}
 exit(){commandRecord(this);}
 destroy(){const r=commands.get(this);if(!r||r.destroyed)return;if(r.entering)throw Error('Cannot destroy King command during Enter');r.destroyed=true;}
}
//9FF030/13EFC7C type8:9FF090 queues8 at Enter;9FF0E0 Exit is empty.
export class ConquestKingPreFastRunCommand extends KingTimedCommand{
 constructor(source,options){super(source,options,'pre-fast-run');}
 enter(){const r=commandRecord(this);if(r.entered||r.entering)throw Error('Once-only King command Enter required');const actor=resolve(this);r.entered=true;if(actor===null)return false;r.runtime.commandPorts.requestNativeInput(actor,8);return true;}
}
//9FE5E0/13EFC24 type10:9FE640 writes35D before queuing input10.
//The source calls this FastRunCommand, but it activates MoveAttack10.
export class ConquestKingFastRunCommand extends KingTimedCommand{
 #movement;#commit;
 constructor(source,options={}){super(source,options,'fast-run');if(source.durationMs!==2000||typeof options.commitFastRunFlag35d!=='function')throw Error('Exact King duration2000 and typed MovementOwner flag commit required');assertConquestPawnMovementOwner(options.movementOwner,{actor:options.actor});this.#movement=options.movementOwner;this.#commit=options.commitFastRunFlag35d;}
 enter(){const r=commandRecord(this);if(r.entered||r.entering)throw Error('Once-only King command Enter required');const actor=resolve(this);r.entered=true;if(actor===null)return false;r.entering=true;
  const receipt=Object.freeze({kind:'conquest-king-source-fast-run35d',actorId:actor.id,nativeType:10,sourceEnter:0x9fe640,nativeReady:false}),record={actor,movementOwner:this.#movement,live:()=>{if(!r.entering||r.destroyed||resolve(this)!==actor)throw Error('Current committing King FastRun35D receipt required');assertConquestPawnMovementOwner(this.#movement,{actor});}};flagReceipts.set(receipt,record);
  try{if(this.#commit(actor,receipt)!==receipt||this.#movement.isFastRun(r.runtime.moveAttack)!==true)throw Error('Actual retained King35D flag commit required before input10');r.runtime.commandPorts.requestNativeInput(actor,10);return true;}finally{r.entering=false;}
 }
}
