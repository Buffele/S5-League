import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
import {assertConquestKingActor} from './conquest-king-ai.js';

const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const counter=(durationMs)=>({updates:0,durationMs,elapsedMs:0,paused:false});
const validate=c=>{if(!c||![c.updates,c.durationMs,c.elapsedMs].every(u32)||typeof c.paused!=='boolean')throw Error('Explicit King source counter required');};
const advance=(c,dt)=>{if(!c.paused){c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+dt)>>>0;}};
const reset=c=>{c.updates=0;c.elapsedMs=0;};
const vec=d=>{if(!d||!['x','y','z'].every(k=>Number.isFinite(d[k])&&Number.isFinite(f(d[k]))))throw Error('Actual King movement direction298 required');return ['x','y','z'].map(k=>f(d[k]));};
const sync=(ports,names)=>{if(!names.every(k=>typeof ports?.[k]==='function'))throw Error('Explicit King special-state source consumers required');return ports;};
const identity=ids=>ids.map(i=>[i,i]);

export const CONQUEST_KING_SPECIAL_STATE_SOURCE=Object.freeze({
  8:Object.freeze({vtable:0x13f1f4c,ctor:0xa322e0,enter:0xa324b0,tick:0xa325c0,exit:0xa325a0,durationMs:3000,createNewCommand:false,onlyToGoal:false,superArmor:true}),
  9:Object.freeze({vtable:0x13f18c8,ctor:0xa2c300,enter:0xa2c430,tick:0xa2c500,exit:0xa2c4d0,durationMs:2000,createNewCommand:true,onlyToGoal:false,superArmor:true}),
  10:Object.freeze({vtable:0x13f1cc0,ctor:0xa30bd0,enter:0xa30df0,tick:0xa30f00,exit:0xa30ec0,durationMs:1500,createNewCommand:true,onlyToGoal:true,superArmor:true}),
});

// A2C500 increments BEFORE checking its duration; A30F00 tests the old clock
// and increments only after nonzero movement + the contact-group update.
// Every multiply retains its original float32 store. No direction normalization.
export function conquestKingTimedMotion({stateId,counter:input,deltaMs,direction,speed,tempo,multiplier}={}){
 if(![9,10].includes(stateId)||!u32(deltaMs)||![speed,tempo,multiplier].every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit King timed-motion operands required');
 validate(input);const next={...input},d=vec(direction);let requestNormal=false,move=null,contacts=false;
 if(stateId===9)advance(next,deltaMs);
 if(next.elapsedMs<=next.durationMs){if(d.some(n=>n!==0)){
  const time=f(f(deltaMs)*f(tempo)),distance=f(f(f(speed)*time)*f(multiplier));
  move=Object.freeze({x:f(d[0]*distance),y:f(d[1]*distance),z:f(d[2]*distance)});
  if(stateId===10){contacts=true;advance(next,deltaMs);}
 }}else requestNormal=true;
 return Object.freeze({counter:Object.freeze(next),move,contacts,requestNormal,nativeReady:false});
}

// Original A32140/A32180/A32250. Damage is cumulative across time windows;
// resetting a failed window clears its clock, not its accumulated amount.
export function conquestKingAccumDamageCancelTick({counter:input,damage,threshold,deltaMs}={}){
 validate(input);if(!u32(deltaMs)||![damage,threshold].every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit King cancellation operands required');
 const next={...input};advance(next,deltaMs);let continues=true;
 if(next.elapsedMs>next.durationMs){if(f(damage)>=f(threshold))continues=false;else reset(next);}
 return Object.freeze({counter:Object.freeze(next),continues});
}

// Original A325C0. Base lifecycle is outside this small kernel and is always
// called first. Cancel-animation playback and FastRun command creation are
// separate, required consumers; neither is replaced by an immediate switch.
export function conquestKingPreFastRunTick({counter:input,cancelCounter:cancelInput,phase,deltaMs,actorFrozen,cancelContinues}={}){
 validate(input);validate(cancelInput);if(![0,1].includes(phase)||!u32(deltaMs)||typeof actorFrozen!=='boolean'||cancelContinues!==null&&typeof cancelContinues!=='boolean')throw Error('Explicit King PreFastRun source state required');
 const next={...input},cancel={...cancelInput};let requestNormal=false,requestFastRun=false,queryCancel=false,startCancelAnimation=false;
 if(!actorFrozen){if(phase===0){if(next.elapsedMs<=next.durationMs){advance(next,deltaMs);if(next.elapsedMs<=next.durationMs){queryCancel=true;if(cancelContinues===false){phase=1;reset(cancel);startCancelAnimation=true;}}else requestFastRun=true;}}
 else {advance(cancel,deltaMs);if(cancel.elapsedMs>cancel.durationMs)requestNormal=true;}}
 return Object.freeze({counter:Object.freeze(next),cancelCounter:Object.freeze(cancel),phase,requestNormal,requestFastRun,queryCancel,startCancelAnimation});
}

const stateOwners=new WeakMap();
export function assertConquestKingSpecialState(state,{actor,stateId=state?.stateId}={}){const r=stateOwners.get(state);if(!r||r.actor!==actor||r.stateId!==stateId)throw Error('Typed actual King special state required');assertConquestKingActor(actor);return state;}

export class ConquestKingFastRunState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  assertConquestKingActor(actor);const p=sync(ports,['baseEnter','baseExit','baseTick','animationEnter','readMovementOperands','moveSourceDisplacement']);
  super({stateId:9,transitions:identity([1,2,3,4,0]),enter(manager){p.baseEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});reset(this.counter);},exit(){p.baseExit(this);},tick(dt,manager){
   p.baseTick(this,dt);const operands=p.readMovementOperands(this),plan=conquestKingTimedMotion({stateId:9,counter:this.counter,deltaMs:dt,...operands,multiplier:10});Object.assign(this.counter,plan.counter);
   if(plan.move)p.moveSourceDisplacement(this,plan.move);if(plan.requestNormal)manager.requestInput(0);this.lastPlan=plan;
  }});this.actor=actor;this.counter=counter(2000);this.lastPlan=null;stateOwners.set(this,{actor,stateId:9});
 }
}

export class ConquestKingMoveAttackState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  assertConquestKingActor(actor);const p=sync(ports,['baseEnter','baseExit','baseTick','animationEnter','readMovementOperands','moveSourceDisplacement','attackEnter','attackExit','attackTick']);
  super({stateId:10,transitions:identity([1,2,3,4,0]),enter(manager){p.baseEnter(this);p.attackEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});reset(this.counter);},exit(){p.baseExit(this);p.attackExit(this);},tick(dt,manager){
   p.baseTick(this,dt);const operands=p.readMovementOperands(this),plan=conquestKingTimedMotion({stateId:10,counter:this.counter,deltaMs:dt,...operands,multiplier:2});
   if(plan.move)p.moveSourceDisplacement(this,plan.move);if(plan.contacts)p.attackTick(this,dt);Object.assign(this.counter,plan.counter);if(plan.requestNormal)manager.requestInput(0);this.lastPlan=plan;
  }});this.actor=actor;this.counter=counter(1500);this.lastPlan=null;this.directionNative={x:0,y:0,z:0};stateOwners.set(this,{actor,stateId:10});
 }
 setAttackDirection(direction){const d=vec(direction);this.directionNative={x:d[0],y:d[1],z:d[2]};}
}

export class ConquestKingPreFastRunState extends ConquestMonsterMappedState{
 #damage=0;#cancelCounter=counter(1000);
 constructor({actor,ports}={}){
  assertConquestKingActor(actor);const p=sync(ports,['baseEnter','baseExit','baseTick','animationEnter','readActorFrozen','playCancelAnimation','requestFastRunCommand']);
  super({stateId:8,transitions:identity([0,2,3,4,9,10]),enter(manager){p.baseEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});this.phase=0;this.#damage=0;reset(this.#cancelCounter);reset(this.counter);reset(this.cancelAnimationCounter);},exit(){p.baseExit(this);},tick(dt,manager){
   p.baseTick(this,dt);const frozen=p.readActorFrozen(this);if(typeof frozen!=='boolean')throw Error('Actual King actor virtual3C predicate required');
   const next={...this.counter};if(!frozen&&this.phase===0&&next.elapsedMs<=next.durationMs)advance(next,dt);
   let continues=null;if(!frozen&&this.phase===0&&this.counter.elapsedMs<=this.counter.durationMs&&next.elapsedMs<=next.durationMs){const c=conquestKingAccumDamageCancelTick({counter:this.#cancelCounter,damage:this.#damage,threshold:100,deltaMs:dt});this.#cancelCounter={...c.counter};continues=c.continues;}
   const plan=conquestKingPreFastRunTick({counter:this.counter,cancelCounter:this.cancelAnimationCounter,phase:this.phase,deltaMs:dt,actorFrozen:frozen,cancelContinues:continues});Object.assign(this.counter,plan.counter);Object.assign(this.cancelAnimationCounter,plan.cancelCounter);this.phase=plan.phase;
   if(plan.startCancelAnimation)p.playCancelAnimation(this,{clip:'00007',sourceSetArgument100:100,loop:true,resetClock:true});
   if(plan.requestFastRun)p.requestFastRunCommand(this,{durationMs:2000});if(plan.requestNormal)manager.requestInput(0);this.lastPlan=plan;
  }});this.actor=actor;this.counter=counter(3000);this.cancelAnimationCounter=counter(1100);this.phase=0;this.lastPlan=null;stateOwners.set(this,{actor,stateId:8});
 }
 accumulateDamage(amount){if(!Number.isFinite(amount)||!Number.isFinite(f(amount)))throw Error('Actual finite King state virtual44 amount required');this.#damage=f(this.#damage+f(amount));return this.#damage;}
 readCancellation(){return {damage:this.#damage,counter:{...this.#cancelCounter}};}
}
