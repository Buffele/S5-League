import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {ConquestMonsterStateManager,ConquestMonsterNormalState,ConquestMonsterRunState,ConquestMonsterDamageState,ConquestMonsterBlowState} from './conquest-monster-state-manager.js';
import {ConquestPawnExplodeDeathState} from './conquest-pawn-explode-death-state.js';
import {conquestPawnExplodeIsUniqueUnit} from './conquest-pawn-explode-ai.js';
import {readConquestPawnExplodeTimerOwner} from './conquest-pawn-explode-timer.js';
import {assertConquestPawnExplodePresentation} from './conquest-pawn-explode-presentation.js';

const owners=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const functions=(object,names)=>names.every(name=>typeof object?.[name]==='function');
export function assertConquestPawnExplodeRuntime(runtime,{actor}={}){const owner=owners.get(runtime);if(!owner||owner.actor!==actor)throw Error('Typed actual1013 state runtime required');owner.live();return runtime;}

// The inherited source states are shared, not normal-Pawn owner instances.
// All resource, reaction and physical side effects remain real required ports.
// A031D0's timer prefix precedes vertical motion and the state-manager tick.
export class ConquestPawnExplodeRuntime{
 constructor({actor,readCurrentActor,baseStatePorts,reactionPorts,readPlaybackRate,isFastRun,runMovement,beforeStateTick,
  timerOwner,presentationOwner,readTempoHeightFactor33,readOrientation8C,animationOptions}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||actor.aiScriptLiteral.toLowerCase()!=='script/monsterai_pawn_explode.lua')throw Error('Actual authenticated PawnExplode1013 required');
  if(!functions(baseStatePorts,['enter','exit','tick'])||!functions(reactionPorts,['readDamageTiming','readActorField','writeActorField','blowExitAllowed','actorOperation','prepareDeathEffect','writeDeathPresentation','applyDeathAlpha','applyDeathAnimation'])||
   ![readCurrentActor,readPlaybackRate,isFastRun,runMovement,beforeStateTick,readTempoHeightFactor33,readOrientation8C].every(fn=>typeof fn==='function'))throw Error('Explicit1013 lifecycle/reaction/vertical/current-owner ports required');
  if(timerOwner!==readConquestPawnExplodeTimerOwner(actor)||timerOwner===null)throw Error('Actual retained1013 timer component required');
  assertConquestPawnExplodePresentation(presentationOwner,{actor});
  if(animationOptions?.uniqueUnit!==undefined&&animationOptions.uniqueUnit!==conquestPawnExplodeIsUniqueUnit(1013))throw Error('Source1013 IsUniqueUnit cannot be overridden');
  const model=actor.model,retained={...baseStatePorts},reactions={...reactionPorts};
  let disposed=false,fault=null,busy=false,animationSerial=0,pendingPresentation=false;
  this.actor=actor;this.disposed=false;this.manager=new ConquestMonsterStateManager();
  this.animation=new ConquestMonsterAnimationAdapter(model,{...animationOptions,uniqueUnit:conquestPawnExplodeIsUniqueUnit(1013)});
  this.lastAnimation=null;this.lastActorPrefix=null;this.lastTimer=null;this.lastMovementResult=null;this.lastPresentation=null;this.animationInvocations=[];
  const live=()=>{if(disposed||fault||readCurrentActor()!==actor||actor.model!==model||readConquestPawnExplodeTimerOwner(actor)!==timerOwner)throw Error('Current owned1013 runtime required'+(fault?': '+fault:''));assertConquestPawnExplodePresentation(presentationOwner,{actor});};
  const enterAnimation=(state,{transitionSerial,sourceInvocation=0})=>{
   live();const playbackRate=readPlaybackRate(state),invocationSerial=++animationSerial;
   const context={transitionSerial:invocationSerial,sourceTransitionSerial:transitionSerial,sourceInvocation,playbackRate,animationAdapter:this.animation};
   // DeathBomb invokes A046B0 twice during one Enter. The adapter's serial
   // denotes an actual animation invocation, not the enclosing state switch.
   const receipt=state.stateId===4&&state.requestedClip!=='00001'?reactions.applyDeathAnimation(state,context):this.animation.enter(state.stateId,context);
   if(typeof receipt?.accepted!=='boolean')throw Error('Actual1013 animation application receipt required');
   this.lastAnimation={...receipt,sourceTransitionSerial:transitionSerial,sourceInvocation,invocationSerial};
   this.animationInvocations.push(this.lastAnimation);if(this.animationInvocations.length>32)this.animationInvocations.shift();
  };
  const ports={...reactions,baseEnter:state=>retained.enter(state),baseExit:state=>retained.exit(state),baseTick:(state,dt)=>retained.tick(state,dt),animationEnter:enterAnimation,
   readMoveDirection:()=>actor.moveDirectionNative,isFastRun:state=>isFastRun(state),applyRunMotion:(state,dt,direction)=>{this.lastMovementResult=runMovement(actor,state,dt,direction);}};
  this.normal=new ConquestMonsterNormalState({actor,ports});this.run=new ConquestMonsterRunState({actor,ports});
  this.damage=new ConquestMonsterDamageState({actor,ports});this.blow=new ConquestMonsterBlowState({actor,ports});
  this.death=new ConquestPawnExplodeDeathState({actor,ports,readCurrentActor,readTempoHeightFactor33,readOrientation8C});
  for(const state of [this.normal,this.run,this.damage,this.blow,this.death])this.manager.registerState(state.stateId,state);
  this.commandPorts=Object.freeze({requestNativeInput:(target,input)=>{live();if(target!==actor)throw Error('Actual1013 input actor required');this.manager.requestInput(input);},findNativeInputState:(target,input)=>{live();if(target!==actor)throw Error('Actual1013 state lookup actor required');return this.manager.findInputState(input);},
   acceptsAttackDirection:state=>!disposed&&!fault&&state===this.death,writeAttackDirection:(state,direction)=>{live();if(state!==this.death)throw Error('Actual1013 DeathBomb direction state required');state.setAttackDirection(direction);}});
  this.assertActor=target=>{live();if(target!==actor)throw Error('Actual1013 runtime actor required');};
  this.tick=deltaMs=>{live();if(busy||!u32(deltaMs))throw Error('Nonreentrant uint32 source1013 tick required');busy=true;
   try{this.lastTimer=timerOwner.tick(deltaMs);live();this.lastActorPrefix=beforeStateTick(deltaMs);if(this.lastActorPrefix?.qualified!==true)throw Error('1013 physical actor prefix refused');live();this.manager.tick(deltaMs);pendingPresentation=true;return this.snapshot();}
   catch(error){fault=error.message;throw error;}finally{busy=false;}
  };
  // Caller owns model.update(seconds), exactly once. Presentation is a
  // separate post-pose phase, never evaluated before or inside the mixer.
  this.updatePresentation=deltaMs=>{live();if(busy||!u32(deltaMs))throw Error('Post-pose1013 uint32 delta required');this.lastPresentation=presentationOwner.update(deltaMs);pendingPresentation=false;return this.lastPresentation;};
  this.snapshot=()=>({actorId:actor.id,monsterKey:1013,currentStateId:this.manager.current?.stateId??null,previousStateId:this.manager.previous?.stateId??null,pendingInputs:this.manager.pendingInputs,
   registeredStateIds:[0,1,2,3,4],unimplementedDefaultStateIds:[5,6,7,8,9],missingFastRunClips:['00005','00006'],animation:this.lastAnimation,animationInvocations:this.animationInvocations.map(r=>({...r})),
   timer:timerOwner.snapshot(),lastTimerUpdate:this.lastTimer&&{updated:this.lastTimer.updated,expired:this.lastTimer.expired??false,eventKind:this.lastTimer.event?.kind??null},actorPrefix:this.lastActorPrefix,presentationPending:pendingPresentation,death:this.death.snapshot(),damageCounter:{...this.damage.counter},disposed,fault,nativeReady:false});
  this.dispose=()=>{if(disposed)return;if(busy)throw Error('Cannot release1013 runtime during tick');const errors=[];for(const fn of [()=>this.death.dispose(),()=>this.animation.dispose()])try{fn();}catch(e){errors.push(e);}disposed=true;this.disposed=true;if(errors.length)throw new AggregateError(errors,'1013 runtime cleanup failed');};
  owners.set(this,{actor,live});
  try{this.manager.switchState(0);}catch(error){this.dispose();throw error;}
 }
}
