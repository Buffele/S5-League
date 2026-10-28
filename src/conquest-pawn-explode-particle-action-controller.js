// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import {applyConquestPawnExplodeParticleActionControl} from './conquest-pawn-explode-particle-control.js';
import {conquestPawnExplodeParticleSequence,conquestPawnExplodeParticleSourceNode} from './conquest-pawn-explode-particle-source.js';
import {assertConquestPawnExplodeFrame} from './conquest-pawn-explode-frame.js';
import {assertConquestPawnExplodeParticleAction} from './conquest-pawn-explode-particle-action.js';
const owners=new WeakMap(),receipts=new WeakMap();
const boolean=value=>{if(typeof value!=='boolean')throw Error('Explicit native action flag required');return value;};
const uint=value=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Explicit native uint32 action time required');return value;};
function window(source,nodeIndex){
 conquestPawnExplodeParticleSourceNode(source,nodeIndex);
 const sequence=conquestPawnExplodeParticleSequence(source),action=sequence.actions[nodeIndex];
 if(sequence.headerByte!==1||sequence.durationMs!==1700||action.index!==nodeIndex||action.parentType!==0||action.parentIndex!==0||action.boneName!=='')throw Error('Exact owned Pawn Death sequence action required');
 return action;
}
export function createConquestPawnExplodeParticleActionController({source,nodeIndex,particleAction,frameOwner,actor,world,scene}={}){
 const action=window(source,nodeIndex),retained={actor,world,scene};let active18=false,revision=0,disposed=false;
 function live(){
  if(disposed)throw Error('Pawn particle action controller disposed');
  assertConquestPawnExplodeFrame(frameOwner,retained);assertConquestPawnExplodeParticleAction(particleAction,{source,nodeIndex,frameOwner});
  const frame=frameOwner.readFrame();if(frame.sequencePath!=='Effects/pve_mon_pawn_red_eff3.seq')throw Error('Actual Pawn Death particle sequence frame required');
 }
 live();
 function snapshot(calls=[]){
  live();const receipt=Object.freeze({kind:'conquest-owned-pawn-explode-particle-action-control',nodeIndex,revision,active18,emitting44:particleAction.readEmitting44(),
   startTimeMs:action.startTimeMs,endTimeMs:action.endTimeMs,calls:Object.freeze([...calls]),sourceWindowPredicateQualified:true,sourceActionControlQualified:true,
   rootTickQualified:false,admissionQualified:false,lifetimeQualified:false,nativeReady:false});receipts.set(receipt,{owner:api,revision});return receipt;
 }
 const api=Object.freeze({nodeIndex,
  readActive18(){live();return active18;},
  tick({emitting,previous,current}={}){
   live();const result=applyConquestPawnExplodeParticleActionControl({source,nodeIndex,emitting,previous,current},{
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
export function assertConquestPawnExplodeParticleActionController(owner,{source,nodeIndex,particleAction,frameOwner}={}){
 const r=owners.get(owner);if(!r||r.source!==source||r.nodeIndex!==nodeIndex||r.particleAction!==particleAction||r.frameOwner!==frameOwner)throw Error('Typed original Pawn particle action controller required');r.live();return owner;
}
export function assertConquestPawnExplodeParticleActionControlReceipt(receipt,{owner}={}){
 const r=owners.get(owner),stored=receipts.get(receipt);if(!r||stored?.owner!==owner||stored.revision!==r.revision())throw Error('Current typed Pawn particle action control receipt required');r.live();return receipt;
}
