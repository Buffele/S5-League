import {conquestPawnParticleSequence,conquestPawnParticleSourceNode} from './conquest-pawn-particle-source.js';
import {assertConquestPawnDeathFrame} from './conquest-pawn-death-frame.js';
import {assertConquestPawnParticleAction} from './conquest-pawn-particle-action.js';
const owners=new WeakMap(),receipts=new WeakMap();
const boolean=value=>{if(typeof value!=='boolean')throw Error('Explicit native action flag required');return value;};
const uint=value=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Explicit native uint32 action time required');return value;};
function window(source,nodeIndex){
 conquestPawnParticleSourceNode(source,nodeIndex);
 const sequence=conquestPawnParticleSequence(source),action=sequence.actions[nodeIndex];
 if(sequence.headerByte!==0||sequence.durationMs!==1000||action.index!==nodeIndex||action.parentType!==0||action.parentIndex!==0||action.boneName!=='')throw Error('Exact owned Pawn Death sequence action required');
 return action;
}
// Original12019A0 -> data14AD05C.virtual54=1282C80. This stage controls
// emission44/burst38 and action-active18; it never performs a simulation tick.
// Ports are explicit low-level source boundaries, not a typed lifetime owner.
export function applyConquestPawnParticleActionControl({source,nodeIndex,emitting,previous,current,rootPresent=true,particlePresent=true}={},ports={}){
 const action=window(source,nodeIndex);boolean(emitting);uint(previous);uint(current);boolean(rootPresent);boolean(particlePresent);
 const calls=[];
 if(!rootPresent||!particlePresent)return Object.freeze({applied:false,calls:Object.freeze(calls),nativeReady:false});
 for(const name of ['readEmitting44','setEmitting1282F20','readActive18','setActive18','readFinished1136050'])if(typeof ports[name]!=='function')throw Error('Explicit action port '+name+' required');
 let inside=false;
 if(emitting){calls.push('window');inside=action.startTimeMs<=current&&current<=action.endTimeMs;}
 if(inside){
  if(!boolean(ports.readEmitting44())){calls.push('set44:1');ports.setEmitting1282F20(true);}
  if(!boolean(ports.readActive18())){calls.push('set18:1');ports.setActive18(true);}
 }else{
  if(boolean(ports.readEmitting44())){calls.push('set44:0');ports.setEmitting1282F20(false);}
  if(boolean(ports.readActive18())){
   calls.push('finished');
   if(boolean(ports.readFinished1136050())){calls.push('set18:0');ports.setActive18(false);}
  }
 }
 return Object.freeze({applied:true,calls:Object.freeze(calls),nativeReady:false});
}

export function createConquestPawnParticleActionController({source,nodeIndex,particleAction,frameOwner,actor,world,scene}={}){
 const action=window(source,nodeIndex),retained={actor,world,scene};let active18=false,revision=0,disposed=false;
 function live(){
  if(disposed)throw Error('Pawn particle action controller disposed');
  assertConquestPawnDeathFrame(frameOwner,retained);assertConquestPawnParticleAction(particleAction,{source,nodeIndex,frameOwner});
  const frame=frameOwner.readFrame();if(frame.enterBase||frame.sequencePath!=='Effects/pawn_death.seq')throw Error('Actual Pawn Death particle sequence frame required');
 }
 live();
 function snapshot(calls=[]){
  live();const receipt=Object.freeze({kind:'conquest-owned-pawn-particle-action-control',nodeIndex,revision,active18,emitting44:particleAction.readEmitting44(),
   startTimeMs:action.startTimeMs,endTimeMs:action.endTimeMs,calls:Object.freeze([...calls]),sourceWindowPredicateQualified:true,sourceActionControlQualified:true,
   rootTickQualified:false,admissionQualified:false,lifetimeQualified:false,nativeReady:false});receipts.set(receipt,{owner:api,revision});return receipt;
 }
 const api=Object.freeze({nodeIndex,
  readActive18(){live();return active18;},
  tick({emitting,previous,current}={}){
   live();const result=applyConquestPawnParticleActionControl({source,nodeIndex,emitting,previous,current},{
    readEmitting44:()=>particleAction.readEmitting44(),setEmitting1282F20:value=>particleAction.setEmitting1282F20(value),
    readActive18:()=>active18,setActive18:value=>{active18=value;},readFinished1136050:()=>particleAction.readFinished1136050()});
   revision++;return snapshot(result.calls);
  },
  // These are separate source stages. The parent owns pose reset/detach
  // between12016F0's initial18 clear and its data.virtual40 particle reset.
  resetActive18(){live();active18=false;revision++;return snapshot();},
  resetParticle1282B80(){live();particleAction.reset();particleAction.setEmitting1282F20(false);revision++;return snapshot();},
  snapshot,
  dispose(){if(disposed)return;disposed=true;revision++;},
 });
 owners.set(api,{source,nodeIndex,particleAction,frameOwner,actor,world,scene,live,revision:()=>revision});return api;
}
export function assertConquestPawnParticleActionController(owner,{source,nodeIndex,particleAction,frameOwner}={}){
 const r=owners.get(owner);if(!r||r.source!==source||r.nodeIndex!==nodeIndex||r.particleAction!==particleAction||r.frameOwner!==frameOwner)throw Error('Typed original Pawn particle action controller required');r.live();return owner;
}
export function assertConquestPawnParticleActionControlReceipt(receipt,{owner}={}){
 const r=owners.get(owner),stored=receipts.get(receipt);if(!r||stored?.owner!==owner||stored.revision!==r.revision())throw Error('Current typed Pawn particle action control receipt required');r.live();return receipt;
}
