import {assertConquestBishopSnipeActor} from './conquest-bishop-snipe-ai.js';
import {assertConquestBishopSnipeBaseLifecycle} from './conquest-bishop-snipe-base-lifecycle.js';
import {assertConquestBishopSnipeReactions} from './conquest-bishop-snipe-reactions.js';
import {createConquestBishopSnipeAttackStates,readConquestBishopSnipeAttackOwner} from './conquest-bishop-snipe-attack.js';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {ConquestMonsterStateManager,ConquestMonsterNormalState,ConquestMonsterRunState,ConquestMonsterDamageState,ConquestMonsterBlowState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
const owners=new WeakMap(),uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function assertConquestBishopSnipeRuntime(runtime,{actor}={}){const r=owners.get(runtime);if(!r||r.actor!==actor)throw Error('Typed actual Bishop1314 runtime required');r.live();return runtime;}

// Bishop's own source states and attack. No Pawn attack duration, Knight
// MoveBox, fabricated projectile or borrowed presentation state is installed.
export class ConquestBishopSnipeRuntime{
 constructor({actor,readCurrentActor,baseLifecycle,reactions,attackOwner,isFastRun,runMovement,beforeStateTick,animationOptions}={}){
  assertConquestBishopSnipeActor(actor);assertConquestBishopSnipeBaseLifecycle(baseLifecycle,{actor});assertConquestBishopSnipeReactions(reactions,{actor});
  if(attackOwner!==readConquestBishopSnipeAttackOwner(actor)||!attackOwner||!attackOwner.snapshot().sourceRangeCaptureQualified||![readCurrentActor,isFastRun,runMovement,beforeStateTick].every(fn=>typeof fn==='function'))throw Error('Actual Bishop identity, captured ray range, attack, Run and physical prefix required');
  const model=actor.model;let disposed=false,fault=null,busy=false;
  this.actor=actor;this.disposed=false;this.manager=new ConquestMonsterStateManager();this.animation=new ConquestMonsterAnimationAdapter(model,animationOptions);this.lastAnimation=null;this.lastMovementResult=null;this.lastActorPrefix=null;this.lastTracking=null;
  const live=()=>{if(disposed||fault||readCurrentActor()!==actor||actor.model!==model||readConquestBishopSnipeAttackOwner(actor)!==attackOwner)throw Error('Current owned BishopSnipe runtime required'+(fault?': '+fault:''));assertConquestBishopSnipeActor(actor);assertConquestBishopSnipeBaseLifecycle(baseLifecycle,{actor});assertConquestBishopSnipeReactions(reactions,{actor});};
  const ports={...reactions.ports,baseEnter:state=>baseLifecycle.enter(state),baseExit:state=>baseLifecycle.exit(state),baseTick:(state,delta)=>baseLifecycle.tick(state,delta),
   animationEnter:(state,context)=>{live();const ctx={...context,playbackRate:baseLifecycle.readPlaybackRate(state),animationAdapter:this.animation};this.lastAnimation=state.stateId===4&&state.requestedClip!=='00001'?reactions.ports.applyDeathAnimation(state,ctx):this.animation.enter(state.stateId,ctx);if(this.lastAnimation?.accepted!==true)throw Error('Actual authored Bishop clip required');},
   readMoveDirection:()=>actor.moveDirectionNative,isFastRun,
   applyRunMotion:(state,delta,direction)=>{this.lastMovementResult=runMovement(actor,state,delta,direction);if(this.lastMovementResult?.qualified!==true)throw Error('Bishop Run collision consumer refused');},
   updateAttackTransform:state=>{live();if(this.manager.current!==state)throw Error('Current registered Bishop attack state required');this.lastTracking=attackOwner.captureTransform(state);},
  };
  this.normal=new ConquestMonsterNormalState({actor,ports});this.run=new ConquestMonsterRunState({actor,ports});this.damage=new ConquestMonsterDamageState({actor,ports});this.blow=new ConquestMonsterBlowState({actor,ports});this.death=new ConquestMonsterDeathState({actor,ports});this.attacks=createConquestBishopSnipeAttackStates({actor,attackOwner,ports});this.attack=this.attacks[0];
  for(const state of [this.normal,this.run,this.damage,this.blow,this.death,...this.attacks])this.manager.registerState(state.stateId,state);
  this.commandPorts=Object.freeze({requestNativeInput:(target,input)=>{live();if(target!==actor)throw Error('Actual Bishop input actor required');this.manager.requestInput(input);},findNativeInputState:(target,input)=>{live();if(target!==actor)throw Error('Actual Bishop lookup actor required');return this.manager.findInputState(input);},acceptsAttackDirection:state=>!disposed&&!fault&&state===this.attack,writeAttackDirection:(state,direction)=>{live();if(state!==this.attack)throw Error('Actual Bishop attack state required');state.setAttackDirection(direction);}});
  this.assertActor=target=>{live();if(target!==actor)throw Error('Same actual Bishop actor required');};
  this.tick=delta=>{live();if(busy||!uint(delta))throw Error('Nonreentrant source uint32 Bishop tick required');busy=true;try{this.lastActorPrefix=beforeStateTick(delta);if(this.lastActorPrefix?.qualified!==true)throw Error('Bishop physical prefix refused');live();this.manager.tick(delta);return this.snapshot();}catch(error){fault=error.message;throw error;}finally{busy=false;}};
  this.snapshot=()=>({actorId:actor.id,monsterKey:1314,currentStateId:this.manager.current?.stateId??null,pendingInputs:this.manager.pendingInputs,registeredStateIds:[0,1,2,3,4,5],unimplementedDefaultStateIds:[6,7,8,9],animation:this.lastAnimation,tracking:this.lastTracking,attack:attackOwner.snapshot(),actorPrefix:this.lastActorPrefix,hpRecoveryConsumerQualified:false,disposed,fault,nativeReady:false});
  this.dispose=()=>{if(disposed)return;if(busy)throw Error('Cannot dispose Bishop during source tick');const errors=[];try{this.manager.current?.exit(this.manager);}catch(error){errors.push(error);}try{this.animation.dispose();}catch(error){errors.push(error);}disposed=true;this.disposed=true;if(errors.length)throw new AggregateError(errors,'BishopSnipe runtime cleanup failed');};
  owners.set(this,{actor,live});try{this.manager.switchState(0);}catch(error){this.dispose();throw error;}
 }
}
