import {assertConquestRookActor,CONQUEST_ROOK_SOURCE} from './conquest-rook-source.js';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {ConquestMonsterStateManager,ConquestMonsterNormalState,ConquestMonsterRunState,ConquestMonsterDamageState,ConquestMonsterBlowState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {createConquestRookBaseLifecycle} from './conquest-rook-base-lifecycle.js';
import {assertConquestRookAura} from './conquest-rook-aura.js';
const owners=new WeakMap(),protection=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function assertConquestRookRuntime(runtime,{actor}={}){const r=owners.get(runtime);if(!r||r.actor!==actor)throw Error('Typed actual Rook runtime required');r.live();return runtime;}
export function readConquestRookStateProtection(state){const r=protection.get(state);if(!r)throw Error('Actual source-owned Rook state protection required');r.live();return Object.freeze({actor:r.actor,stateId:state.stateId,superArmorB8:r.superArmor,sourceSetter:0x4f25d0,nativeReady:false});}

export class ConquestRookRuntime{
 constructor({actor,readCurrentActor,auraOwner,reactionPorts,isFastRun,runMovement,beforeStateTick,animationOptions}={}){
  assertConquestRookActor(actor);assertConquestRookAura(auraOwner,{actor});
  if(![readCurrentActor,isFastRun,runMovement,beforeStateTick].every(fn=>typeof fn==='function')||!['readDamageTiming','readActorField','writeActorField','blowExitAllowed','actorOperation','prepareDeathEffect','writeDeathPresentation','applyDeathAlpha','applyDeathAnimation'].every(name=>typeof reactionPorts?.[name]==='function'))throw Error('Explicit actual Rook registry/movement/reaction ports required');
  const model=actor.model,reactions={...reactionPorts};let disposed=false,fault=null,busy=false;
  this.actor=actor;this.disposed=false;this.manager=new ConquestMonsterStateManager();this.animation=new ConquestMonsterAnimationAdapter(model,animationOptions);this.base=createConquestRookBaseLifecycle({actor});
  this.lastAnimation=null;this.lastActorPrefix=null;this.lastMovementResult=null;this.lastAura=null;
  const live=()=>{if(disposed||fault||readCurrentActor()!==actor||actor.model!==model)throw Error('Current actual Rook runtime required'+(fault?': '+fault:''));assertConquestRookActor(actor);assertConquestRookAura(auraOwner,{actor});};
  const ports={...reactions,baseEnter:state=>this.base.enter(state),baseExit:state=>this.base.exit(state),baseTick:(state,dt)=>this.base.tick(state,dt),
   animationEnter:(state,{transitionSerial})=>{const playbackRate=this.base.readPlaybackRate(state);this.lastAnimation=state.stateId===4&&state.requestedClip!=='00001'?reactions.applyDeathAnimation(state,{transitionSerial,playbackRate,animationAdapter:this.animation}):this.animation.enter(state.stateId,{transitionSerial,playbackRate});if(typeof this.lastAnimation?.accepted!=='boolean')throw Error('Actual Rook animation receipt required');},
   readMoveDirection:()=>actor.moveDirectionNative,isFastRun:state=>isFastRun(state),applyRunMotion:(state,dt,direction)=>{this.lastMovementResult=runMovement(actor,state,dt,direction);}};
  this.normal=new ConquestMonsterNormalState({actor,ports});this.run=new ConquestMonsterRunState({actor,ports});this.damage=new ConquestMonsterDamageState({actor,ports});this.blow=new ConquestMonsterBlowState({actor,ports});this.death=new ConquestMonsterDeathState({actor,ports});
  for(const state of [this.normal,this.run,this.damage,this.blow,this.death]){this.manager.registerState(state.stateId,state);protection.set(state,{actor,live,superArmor:CONQUEST_ROOK_SOURCE.superArmorStates.includes(state.stateId)});}
  this.commandPorts=Object.freeze({requestNativeInput:(target,input)=>{live();if(target!==actor)throw Error('Actual Rook input owner required');this.manager.requestInput(input);},findNativeInputState:(target,input)=>{live();if(target!==actor)throw Error('Actual Rook state lookup owner required');return this.manager.findInputState(input);}});
  this.tick=deltaMs=>{live();if(busy||!u32(deltaMs))throw Error('Nonreentrant Rook uint32 tick required');busy=true;try{this.lastAura=auraOwner.tick(deltaMs);this.lastActorPrefix=beforeStateTick(deltaMs);if(this.lastActorPrefix?.qualified!==true)throw Error('Rook physical prefix refused');live();this.manager.tick(deltaMs);return this.snapshot();}catch(error){fault=error.message;throw error;}finally{busy=false;}};
  this.snapshot=()=>({actorId:actor.id,monsterKey:1100,currentStateId:this.manager.current?.stateId??null,registeredStateIds:[0,1,2,3,4],unimplementedDefaultStateIds:[5,6,7,8,9],missingSourceClips:['00003','00005','00006'],offensiveAttackCount:0,superArmorStateIds:[0,1,2,3],animation:this.lastAnimation,aura:this.lastAura,actorPrefix:this.lastActorPrefix,disposed,fault,nativeReady:false});
  this.dispose=()=>{if(disposed)return;if(busy)throw Error('Cannot dispose Rook during source tick');const errors=[];for(const fn of [()=>this.base.dispose(),()=>this.animation.dispose()])try{fn();}catch(error){errors.push(error);}disposed=true;this.disposed=true;if(errors.length)throw new AggregateError(errors,'Rook runtime cleanup failed');};
  owners.set(this,{actor,live});try{this.manager.switchState(0);}catch(error){this.dispose();throw error;}
  this.assertActor=target=>{live();if(target!==actor)throw Error('Same actual Rook actor required');return actor;};
 }
}
