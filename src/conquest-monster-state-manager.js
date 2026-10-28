import {conquestNativeMoveVector} from './conquest-monster-movement.js';

const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const byte=value=>{if(!u32(value))throw Error('Explicit native unsigned monster input required');return value&255;};
const required=(ports,names)=>{if(!names.every(name=>typeof ports?.[name]==='function'))throw Error('Explicit native monster state lifecycle ports required');return ports;};
const identity=values=>values.map(value=>[value,value]);

// A134E0/A137B0/A13680/A139A0/A13B10. A request is queued, whereas a
// switch is immediate. STL allocation/shared_ptr ownership is not emulated.
export class ConquestMonsterStateManager{
 #states=new Map();
 #inputs=[];
 constructor(){this.current=null;this.previous=null;this.transitionSerial=0;}
 get pendingInputs(){return [...this.#inputs];}
 registerState(input,state){
  const key=byte(input);
  if(state!==null&&!['onInput','enter','exit','tick'].every(name=>typeof state?.[name]==='function'))throw Error('Explicit native monster state or null required');
  // A137F0 removes a previous registration before inserting its replacement;
  // registration alone never changes current/previous or calls Enter/Exit.
  this.#states.delete(key);this.#states.set(key,state);
  return state;
 }
 findInputState(input){return this.#states.get(byte(input))??null;}
 requestInput(input){this.#inputs.push(byte(input));}
 switchState(input){
  const key=byte(input);if(!this.#states.has(key))return false;
  const next=this.#states.get(key);
  if(this.current!==null)this.current.exit(this);
  this.previous=this.current;this.current=next;this.transitionSerial++;
  // There is deliberately no same-state guard: native reentry exits/enters.
  if(this.current!==null)this.current.enter(this);
  return true;
 }
 tick(deltaMs){
  if(!u32(deltaMs))throw Error('Explicit native unsigned monster state delta required');
  // Pop before dispatch, and read current again for every remaining input.
  // Inputs enqueued by input callbacks are consumed in this same pass.
  while(this.#inputs.length){const input=this.#inputs.shift();if(this.current!==null)this.current.onInput(input,this);}
  // Inputs enqueued by this final Tick wait until the next manager Tick.
  if(this.current!==null)this.current.tick(deltaMs,this);
 }
}

// A2D630/A2D6F0/A2D5F0: each state has its OWN byte->byte transition map.
// A missing transition returns false and sentinel11; duplicate insertion fails.
export class ConquestMonsterMappedState{
 #transitions=new Map();
 constructor({stateId,transitions,enter,exit,tick}={}){
  this.stateId=byte(stateId);
  if(!Array.isArray(transitions)||![enter,exit,tick].every(fn=>typeof fn==='function'))throw Error('Explicit native monster transitions and lifecycle required');
  for(const entry of transitions){if(!Array.isArray(entry)||entry.length!==2)throw Error('Explicit native transition pair required');this.addTransition(...entry);}
  this.enter=enter;this.exit=exit;this.tick=tick;
 }
 addTransition(input,target){const key=byte(input),value=byte(target);if(this.#transitions.has(key))return false;this.#transitions.set(key,value);return true;}
 findTransition(input){const key=byte(input);return this.#transitions.has(key)?{found:true,stateId:this.#transitions.get(key)}:{found:false,stateId:11};}
 onInput(input,manager){const transition=this.findTransition(input);if(transition.found)manager.switchState(transition.stateId);}
}

const basePorts=['baseEnter','baseExit','baseTick','animationEnter'];

// Normal A31BA0/A31D60. Movement becoming nonzero requests Run (or FastRun)
// for the next update; it does not switch state during the current Tick.
export class ConquestMonsterNormalState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  const p=required(ports,[...basePorts,'readMoveDirection','isFastRun']);
  super({stateId:0,transitions:identity([1,2,3,4,5,6,7]),
   enter(manager){p.baseEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});},
   exit(){p.baseExit(this);},
   tick(deltaMs,manager){p.baseTick(this,deltaMs);const d=conquestNativeMoveVector(p.readMoveDirection(this));
    if(d.x!==0||d.y!==0||d.z!==0){const fast=p.isFastRun(this);if(typeof fast!=='boolean')throw Error('Native fast-run flag must be explicit');manager.requestInput(fast?9:1);}}});
  this.actor=actor;
 }
}

// Run A33870/A33A20. The source movement/collision calculation is a separate
// required port; it is not replaced by directly translating a visual group.
export class ConquestMonsterRunState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  const p=required(ports,[...basePorts,'readMoveDirection','applyRunMotion']);
  super({stateId:1,transitions:identity([2,3,4,5,6,7]),
   enter(manager){p.baseEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});},
   exit(){p.baseExit(this);},
   tick(deltaMs,manager){p.baseTick(this,deltaMs);const d=conquestNativeMoveVector(p.readMoveDirection(this));
    if(d.x!==0||d.y!==0||d.z!==0)p.applyRunMotion(this,deltaMs,d);else manager.requestInput(0);}});
  this.actor=actor;
 }
}

// CreateAttackState A24830 -> A287C0/vtable13F1430. This counter belongs
// to the state, independently of the zero-duration type4 attack command.
export class ConquestMonsterAttackState extends ConquestMonsterMappedState{
 constructor({actor,stateId=5,durationMs,trackAttackTransform=false,ports}={}){
  if(!u32(durationMs)||typeof trackAttackTransform!=='boolean')throw Error('Explicit native monster attack duration/transform flag required');
  const names=[...basePorts,'attackEnter','attackExit','attackTick','faceAttackDirection'];
  if(trackAttackTransform)names.push('updateAttackTransform');
  const p=required(ports,names);
  super({stateId,transitions:identity([1,0,2,3,4]),
   enter(manager){p.baseEnter(this);p.attackEnter(this);p.animationEnter(this,{transitionSerial:manager.transitionSerial});},
   exit(){p.baseExit(this);p.attackExit(this);},
   tick(deltaMs,manager){
    p.baseTick(this,deltaMs);p.faceAttackDirection(this);
    if(this.trackAttackTransform)p.updateAttackTransform(this);
    p.attackTick(this,deltaMs);
    const counter=this.counter;
    if(!counter.paused){counter.updates=(counter.updates+1)>>>0;counter.elapsedMs=(counter.elapsedMs+deltaMs)>>>0;}
    if(counter.durationMs<counter.elapsedMs){counter.updates=0;counter.elapsedMs=0;manager.requestInput(0);}
   }});
  this.actor=actor;this.trackAttackTransform=trackAttackTransform;
  this.counter={updates:0,durationMs,elapsedMs:0,paused:false};
  this.directionNative={x:0,y:0,z:0};
 }
 setDuration(durationMs){if(!u32(durationMs))throw Error('Explicit native monster attack duration required');Object.assign(this.counter,{updates:0,durationMs,elapsedMs:0});}
 setAttackDirection(direction){this.directionNative=conquestNativeMoveVector(direction);}
}

const f=Math.fround;
const counter=(durationMs=0)=>({updates:0,durationMs,elapsedMs:0,paused:false});
const advance=(value,delta)=>{if(!value.paused){value.updates=(value.updates+1)>>>0;value.elapsedMs=(value.elapsedMs+delta)>>>0;}};
const reset=value=>{value.updates=0;value.elapsedMs=0;};
// FE6050 returns an integer64; the state retains EAX (low DWORD). Inputs
// and multiplication use float32. Nonfinite/out-of-int64 results return EAX0.
export function conquestMonsterDamageDuration({durationRaw,rate}={}){
 if(!u32(durationRaw)||!Number.isFinite(rate)||!Number.isFinite(f(rate)))throw Error('Explicit native damage timing record/rate required');
 const product=f(f(durationRaw)*f(rate));
 if(!Number.isFinite(product)||Math.abs(product)>=2**63)return 0;
 return Number(BigInt.asUintN(32,BigInt(Math.trunc(product))));
}

// Damage A29DB0/A29EF0/A2A040. A missing timing producer preserves the
// previous counter, including on reentry; no clip duration is substituted.
export class ConquestMonsterDamageState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  const p=required(ports,[...basePorts,'readDamageTiming']);
  super({stateId:2,transitions:identity([4,0,3]),
   enter(manager){p.baseEnter(this);const timing=p.readDamageTiming(this);
    if(timing===undefined)throw Error('Native damage timing must be explicit or null');
    if(timing!==null){const durationMs=conquestMonsterDamageDuration(timing);Object.assign(this.counter,{updates:0,durationMs,elapsedMs:0});}
    p.animationEnter(this,{transitionSerial:manager.transitionSerial});},
   exit(){p.baseExit(this);},
   tick(deltaMs,manager){p.baseTick(this,deltaMs);advance(this.counter,deltaMs);if(this.counter.elapsedMs>this.counter.durationMs)manager.requestInput(0);}});
  this.actor=actor;this.counter=counter();
 }
}

// Blow A29960/A29A60/A29B30/A29BB0: physical completion actor+114, not a
// timer or animation finish. Unknown actor operations retain explicit ports.
export class ConquestMonsterBlowState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  const p=required(ports,[...basePorts,'readActorField','writeActorField','blowExitAllowed','actorOperation']);
  super({stateId:3,transitions:identity([0,1,2,4]),
   enter(manager){p.baseEnter(this);p.writeActorField(this,0x114,1);p.animationEnter(this,{transitionSerial:manager.transitionSerial});
    this.savedFlag35C=byte(p.readActorField(this,0x35c));p.writeActorField(this,0x35c,0);},
   exit(){p.baseExit(this);const allowed=p.blowExitAllowed(this);if(typeof allowed!=='boolean')throw Error('Explicit native Blow exit predicate required');
    if(allowed){p.actorOperation(this,0xa04460);p.writeActorField(this,0x35c,this.savedFlag35C);p.writeActorField(this,0x35a,1);p.actorOperation(this,0xa045a0);}},
   tick(deltaMs,manager){p.baseTick(this,deltaMs);const phase=p.readActorField(this,0x114);if(!u32(phase))throw Error('Explicit native Blow phase required');if(phase===0)manager.requestInput(0);}});
  this.actor=actor;this.savedFlag35C=0;
 }
}

const lerp=(from,to,ratio)=>f(f(f(to-from)*ratio)+from);
// Death A2B400/A2B5D0/A2B9B0. Both counters begin at2000; Enter resets
// only the cleanup counter. The fade counter continues across forced reentry.
export class ConquestMonsterDeathState extends ConquestMonsterMappedState{
 constructor({actor,ports}={}){
  const p=required(ports,[...basePorts,'readActorField','writeActorField','actorOperation','prepareDeathEffect','writeDeathPresentation','applyDeathAlpha']);
  super({stateId:4,transitions:[],
   enter(manager){const field=p.readActorField(this,0x33c);if(!u32(field))throw Error('Explicit native Death actor field33C required');
    this.baseEffectsEnabled=field!==2;p.baseEnter(this);reset(this.counter);p.writeActorField(this,0x358,0);
    for(const address of [0xa04680,0xa04620,0xa048d0])p.actorOperation(this,address);
    const currentField=p.readActorField(this,0x33c);if(!u32(currentField))throw Error('Explicit current Death actor field33C required');
    if(currentField===2){this.requestedClip='BASE';this.targetScalar=5;this.targetColor=[5,5,5,0];}
    p.prepareDeathEffect(this,{enterBase:currentField===2,effectOverride:currentField===2?'Resources/Effects/enter_base.seq':null});
    p.animationEnter(this,{transitionSerial:manager.transitionSerial});},
   exit(){p.baseExit(this);},
   tick(deltaMs){p.baseTick(this,deltaMs);advance(this.counter,deltaMs);if(this.counter.elapsedMs>this.counter.durationMs)p.writeActorField(this,0x359,1);
    advance(this.fadeCounter,deltaMs);let scalar=this.targetScalar,color=[...this.targetColor];
    if(this.fadeCounter.elapsedMs<=this.fadeCounter.durationMs){const ratio=this.fadeCounter.durationMs===0?0:f(f(this.fadeCounter.elapsedMs)/f(this.fadeCounter.durationMs));
     scalar=lerp(1,this.targetScalar,ratio);color=this.targetColor.map(value=>lerp(1,value,ratio));}
    p.writeDeathPresentation(this,{scalar,color});p.applyDeathAlpha(this,color[3]);}});
  this.actor=actor;this.counter=counter(2000);this.fadeCounter=counter(2000);
  this.targetScalar=f(.5);this.targetColor=[f(.5),f(.5),f(.5),1];this.requestedClip='00001';this.baseEffectsEnabled=true;
 }
}
