import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
import {readConquestPawnExplodeAttackTransform} from './conquest-pawn-explode-timer.js';
const f=Math.fround;

// A24AF0 ->A2A340 DeathBombState, deriving the already qualified Death4.
//1013 adds no attack: its Lua AddAttack block is commented out. Keep the
// derived transform/heading reads and second animation invocation nonetheless.
export class ConquestPawnExplodeDeathState extends ConquestMonsterDeathState{
 constructor({actor,ports,readCurrentActor,readTempoHeightFactor33,readOrientation8C}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||![readCurrentActor,readTempoHeightFactor33,readOrientation8C].every(fn=>typeof fn==='function'))throw Error('Actual1013 DeathBomb actor/current transform owners required');
  super({actor,ports:{...ports,animationEnter:(state,context)=>ports.animationEnter(state,{...context,sourceInvocation:0})}});
  this.directionNative={x:0,y:0,z:0};this.lastAttackTransform=null;this.disposed=false;this.fault=null;
  const baseEnter=this.enter,baseExit=this.exit,baseTick=this.tick;
  const live=()=>{if(this.disposed||this.fault||readCurrentActor()!==actor)throw Error('Current owned1013 DeathBomb state required');};
  const guarded=fn=>{live();try{return fn();}catch(error){this.fault=error.message;throw error;}};
  this.enter=manager=>guarded(()=>{
   baseEnter.call(this,manager);
   //5FD350 with the genuinely empty group returns without preparing or
   // activating an attack. This is the authored no-attack branch.
   ports.animationEnter(this,{transitionSerial:manager.transitionSerial,sourceInvocation:1});live();
  });
  this.exit=manager=>guarded(()=>{baseExit.call(this,manager);});
  this.tick=(deltaMs,manager)=>guarded(()=>{
   baseTick.call(this,deltaMs,manager);
   const d={...this.directionNative,y:0},length=f(Math.sqrt(f(f(f(d.x*d.x)+f(d.y*d.y))+f(d.z*d.z))));
   if(length!==0){const inverse=f(1/length);d.x=f(d.x*inverse);d.z=f(d.z*inverse);}
   actor.setNativeFacingDirection(d);
   this.lastAttackTransform=readConquestPawnExplodeAttackTransform(actor,{readTempoHeightFactor33,readOrientation8C});live();
   //5FD1F0 on this empty/inactive group has no collision consumer to run.
  });
  this.setAttackDirection=value=>{live();this.directionNative=conquestNativeMoveVector(value);};
  this.snapshot=()=>({actorId:actor.id,stateId:4,kind:'source-death-bomb1013',durationMs:2000,counter:{...this.counter},fadeCounter:{...this.fadeCounter},
   addedAttackCount:0,emptyAttackGroupQualified:true,lastAttackTransform:this.lastAttackTransform,disposed:this.disposed,fault:this.fault,nativeReady:false});
  this.dispose=()=>{this.disposed=true;};
 }
}
