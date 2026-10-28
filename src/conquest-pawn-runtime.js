import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {ConquestMonsterStateManager,ConquestMonsterNormalState,ConquestMonsterRunState,ConquestMonsterAttackState,ConquestMonsterDamageState,ConquestMonsterBlowState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {ConquestPawnAttackContactRuntime,CONQUEST_PAWN_ATTACK_CONTACT} from './conquest-monster-attack-runtime.js';
import {applyConquestPawnAttackFacing} from './conquest-pawn-attack-facing.js';
const functions=(ports,names)=>names.every(name=>typeof ports?.[name]==='function');

// Actual model-backed Pawn composition. Native base-state side effects,
// status/stat getters, world queries and the damage receiver remain explicit.
export class ConquestPawnRuntime{
 #beforeStateTick;
 constructor({actor,baseStatePorts,attackPorts,reactionPorts,readPlaybackRate,isFastRun,runMovement,beforeStateTick,animationOptions}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1003)throw Error('Actual normal Pawn actor/model required');
  if(!functions(baseStatePorts,['enter','exit','tick'])||!functions(attackPorts,['prepareAttack','queryContacts','consumeContacts','isEnabled','collisionAllowed'])||
   attackPorts.faceAttackDirection!==undefined&&typeof attackPorts.faceAttackDirection!=='function'||
   !functions(reactionPorts,['readDamageTiming','readActorField','writeActorField','blowExitAllowed','actorOperation','prepareDeathEffect','writeDeathPresentation','applyDeathAlpha','applyDeathAnimation'])||
   ![readPlaybackRate,isFastRun,runMovement].every(fn=>typeof fn==='function'))throw Error('Explicit native Pawn base lifecycle, reaction, status, attack query/recipient and movement ports required');
  if(beforeStateTick!==undefined&&typeof beforeStateTick!=='function')throw Error('Explicit source actor prefix required');
  this.#beforeStateTick=beforeStateTick;this.lastActorPrefix=null;
  this.actor=actor;this.disposed=false;this.manager=new ConquestMonsterStateManager();
  this.animation=new ConquestMonsterAnimationAdapter(actor.model,animationOptions);
  this.contacts=new ConquestPawnAttackContactRuntime(attackPorts);
  this.lastAnimation=null;this.lastContactResult=null;this.lastMovementResult=null;this.lastFacing=null;
  this.sourceFacingQualified=attackPorts.faceAttackDirection===undefined;
  const ports={...reactionPorts,
   baseEnter:state=>baseStatePorts.enter(state),baseExit:state=>baseStatePorts.exit(state),baseTick:(state,delta)=>baseStatePorts.tick(state,delta),
   animationEnter:(state,{transitionSerial})=>{const playbackRate=readPlaybackRate(state);
    if(state.stateId===4&&state.requestedClip!=='00001'){
     const receipt=reactionPorts.applyDeathAnimation(state,{transitionSerial,playbackRate,animationAdapter:this.animation});
     if(typeof receipt?.accepted!=='boolean'||receipt.clip!==state.requestedClip)throw Error('Explicit native Death animation application receipt required');this.lastAnimation=receipt;
    }
    else this.lastAnimation=this.animation.enter(state.stateId,{transitionSerial,playbackRate});},
   readMoveDirection:()=>actor.moveDirectionNative,isFastRun:state=>isFastRun(state),
   applyRunMotion:(state,delta,direction)=>{this.lastMovementResult=runMovement(actor,state,delta,direction);},
   attackEnter:()=>this.contacts.enter(actor),attackExit:()=>this.contacts.exit(),
   attackTick:(state,delta)=>{this.lastContactResult=this.contacts.tick(delta,{enabled:attackPorts.isEnabled(state),collisionAllowed:attackPorts.collisionAllowed(state)});},
   // The complete source wrapper is now qualified. Explicit diagnostic
   // overrides stay visible in the snapshot and never inherit its receipt.
   faceAttackDirection:state=>{this.lastFacing=this.sourceFacingQualified?applyConquestPawnAttackFacing(state,{actor}):attackPorts.faceAttackDirection(state);},
  };
  this.normal=new ConquestMonsterNormalState({actor,ports});this.run=new ConquestMonsterRunState({actor,ports});
  this.attack=new ConquestMonsterAttackState({actor,stateId:5,durationMs:CONQUEST_PAWN_ATTACK_CONTACT.stateDurationMs,ports});
  this.damage=new ConquestMonsterDamageState({actor,ports});this.blow=new ConquestMonsterBlowState({actor,ports});this.death=new ConquestMonsterDeathState({actor,ports});
  this.manager.registerState(0,this.normal);this.manager.registerState(1,this.run);this.manager.registerState(5,this.attack);
  this.manager.registerState(2,this.damage);this.manager.registerState(3,this.blow);this.manager.registerState(4,this.death);
  this.commandPorts={requestNativeInput:(target,input)=>{this.assertActor(target);this.manager.requestInput(input);},
   findNativeInputState:(target,input)=>{this.assertActor(target);return this.manager.findInputState(input);},
   acceptsAttackDirection:state=>!this.disposed&&state===this.attack,
   writeAttackDirection:(state,direction)=>{this.assertActor(this.actor);if(state!==this.attack)throw Error('Owned actual Pawn attack state required');this.attack.setAttackDirection(direction);}};
  // Factory A0A7C0 registers defaults/script before its initial Switch(0).
  this.manager.switchState(0);
 }
 assertActor(actor){if(this.disposed||actor!==this.actor)throw Error('Live owned Pawn runtime actor required');}
 tick(deltaMs){this.assertActor(this.actor);if(this.#beforeStateTick){this.lastActorPrefix=this.#beforeStateTick(deltaMs);if(this.lastActorPrefix?.qualified!==true)throw Error('Pawn source actor prefix refused: '+(this.lastActorPrefix?.reason??'unknown qualification'));}this.manager.tick(deltaMs);return this.snapshot();}
 snapshot(){return {actorId:this.actor.id,currentStateId:this.manager.current?.stateId??null,previousStateId:this.manager.previous?.stateId??null,
  pendingInputs:this.manager.pendingInputs,attackCounter:{...this.attack.counter},contactCounter:{...this.contacts.counter},animation:this.lastAnimation,
  sourceFacingQualified:this.sourceFacingQualified,facing:this.lastFacing,actorPrefix:this.lastActorPrefix,
  registeredStateIds:[0,1,2,3,4,5],missingDefaultStateIds:[],reactionEffectsQualified:false,reactionCounters:{damage:{...this.damage.counter},death:{...this.death.counter},deathFade:{...this.death.fadeCounter}},nativeReady:false,serverAccepted:false};}
 dispose(){if(this.disposed)return;this.contacts.exit();this.animation.dispose();this.disposed=true;}
}
