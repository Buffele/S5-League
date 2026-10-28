import {applyConquestEnterBaseParticleActionControl} from './conquest-enter-base-particle-control.js';
import {conquestEnterBaseParticleSequence,conquestEnterBaseParticleSourceNode} from './conquest-enter-base-particle-source.js';
import {assertConquestPawnDeathFrame} from './conquest-pawn-death-frame.js';
import {assertConquestEnterBaseParticleAction} from './conquest-enter-base-particle-action.js';
const owners=new WeakMap(),receipts=new WeakMap();
const boolean=value=>{if(typeof value!=='boolean')throw Error('Explicit native action flag required');return value;};
const uint=value=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Explicit native uint32 action time required');return value;};
function window(source,nodeIndex){
 conquestEnterBaseParticleSourceNode(source,nodeIndex);
 const sequence=conquestEnterBaseParticleSequence(source),action=sequence.actions[nodeIndex];
 if(sequence.headerByte!==0||sequence.durationMs!==2500||action.index!==nodeIndex||action.parentType!==0||action.parentIndex!==0||action.boneName!=='')throw Error('Exact owned Pawn Death sequence action required');
 return action;
}
export function createConquestEnterBaseParticleActionController({source,nodeIndex,particleAction,frameOwner,actor,world,scene}={}){
 const action=window(source,nodeIndex),retained={actor,world,scene};let active18=false,revision=0,disposed=false;
 function live(){
  if(disposed)throw Error('Pawn particle action controller disposed');
  assertConquestPawnDeathFrame(frameOwner,retained);assertConquestEnterBaseParticleAction(particleAction,{source,nodeIndex,frameOwner});
  const frame=frameOwner.readFrame();if(!frame.enterBase||frame.sequencePath!=='Resources/Effects/enter_base.seq')throw Error('Actual Pawn Death particle sequence frame required');
 }
 live();
 function snapshot(calls=[]){
  live();const receipt=Object.freeze({kind:'conquest-owned-enter-base-particle-action-control',nodeIndex,revision,active18,emitting44:particleAction.readEmitting44(),
   startTimeMs:action.startTimeMs,endTimeMs:action.endTimeMs,calls:Object.freeze([...calls]),sourceWindowPredicateQualified:true,sourceActionControlQualified:true,
   rootTickQualified:false,admissionQualified:false,lifetimeQualified:false,nativeReady:false});receipts.set(receipt,{owner:api,revision});return receipt;
 }
 const api=Object.freeze({nodeIndex,
  readActive18(){live();return active18;},
  tick({emitting,previous,current}={}){
   live();const result=applyConquestEnterBaseParticleActionControl({source,nodeIndex,emitting,previous,current},{
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
export function assertConquestEnterBaseParticleActionController(owner,{source,nodeIndex,particleAction,frameOwner}={}){
 const r=owners.get(owner);if(!r||r.source!==source||r.nodeIndex!==nodeIndex||r.particleAction!==particleAction||r.frameOwner!==frameOwner)throw Error('Typed original Pawn particle action controller required');r.live();return owner;
}
export function assertConquestEnterBaseParticleActionControlReceipt(receipt,{owner}={}){
 const r=owners.get(owner),stored=receipts.get(receipt);if(!r||stored?.owner!==owner||stored.revision!==r.revision())throw Error('Current typed Pawn particle action control receipt required');r.live();return receipt;
}
