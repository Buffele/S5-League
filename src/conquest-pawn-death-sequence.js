import * as THREE from 'three';
import {conquestPawnParticleSequence} from './conquest-pawn-particle-source.js';
import {assertConquestPawnDeathFrame} from './conquest-pawn-death-frame.js';
import {createConquestPawnParticleAction} from './conquest-pawn-particle-action.js';
import {createConquestPawnParticleActionController} from './conquest-pawn-particle-action-controller.js';
import {resetNativeSequenceController} from './native-sequence-manager.js';
import {tickNativeSequenceActions} from './native-sequence-clock.js';
import {nativeSequenceParent,attachNativeSequenceParent,detachNativeSequenceParent} from './native-sequence-parent.js';
import {planConquestPawnParticlePresentationTick} from './conquest-pawn-particle-root-plan.js';

const owners=new WeakMap(),receipts=new WeakMap();
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

// The controller phase owns119F460/119FAE0, not world12210E0. Keeping the
// phases separate matters: active18 is not the scene node's update flagA0,
// and the particle pool can still be populated after its emission window.
export function createConquestPawnDeathSequence({source,frameOwner,actor,world,scene,camera,
 renderBank,nextRandom15,numericalProfile,trigProfile,qualityProfile,clockProfile}={}){
 const spec=conquestPawnParticleSequence(source),retained={actor,world,scene};
 assertConquestPawnDeathFrame(frameOwner,retained);
 if(frameOwner.sequencePath!=='Effects/pawn_death.seq'||spec.loopingFlag||spec.durationMs!==1000||spec.actions.length!==5||spec.actions.some((a,i)=>a.index!==i||a.parentType!==0||a.parentIndex!==0||a.boneName!==''))throw Error('Exact ordinary five-action Pawn Death sequence required');
 if(!renderBank||![24,53,64].includes(clockProfile?.precisionBits)||clockProfile.roundingMode!=='nearest')throw Error('Prepared render bank and explicit native clock numerical profile required');
 const clock={looping:spec.loopingFlag,precisionBits:clockProfile.precisionBits,roundingMode:clockProfile.roundingMode},externalNodes=[],actions=[];
 let disposed=false,revision=0,lastDispatch=null,controllerEpoch=0,presentedEpoch=0,lastPresentationMode=null;
 const actionStamp=()=>JSON.stringify(actions.map(e=>[e.control.snapshot().revision,e.particle.snapshot()]));
 function live(){
  if(disposed)throw Error('Pawn Death sequence disposed');
  assertConquestPawnDeathFrame(frameOwner,retained);
  for(const entry of actions){
   entry.node.updateMatrix();
   if(!entry.node.matrix.elements.every((v,i)=>Object.is(v,identity[i]))||entry.node.children.length||entry.node.parent!==null&&entry.node.parent!==frameOwner.logicalRoot)throw Error('Owned identity Pawn action node changed');
   entry.control.readActive18();entry.particle.snapshot();
  }
 }
 function detach(entry){return detachNativeSequenceParent(entry.node,{
  readParent:n=>n.parent,removeChild:(p,n)=>p.remove(n),setParent:(n,p)=>{if(n.parent!==p)throw Error('Actual Pawn action detach failed');},
 });}
 function reset(){
  live();resetNativeSequenceController(clock,spec.durationMs,actions,{
   resetAction(entry){
    entry.control.resetActive18();
    //12016F0 resets the actual action pose before its data.virtual40 reset.
    entry.node.matrix.identity();entry.node.position.set(0,0,0);entry.node.scale.set(1,1,1);entry.node.quaternion.set(0,0,0,1);entry.node.updateMatrix();
    entry.control.resetParticle1282B80();detach(entry);
   },clearExternalNodes(){externalNodes.length=0;},
  });lastDispatch=null;controllerEpoch=0;presentedEpoch=0;lastPresentationMode=null;revision++;
 }
 function snapshot(){
  live();const receipt=Object.freeze({kind:'conquest-owned-pawn-death-sequence',revision,
   previous:clock.previous,current:clock.current,end:clock.end,emitting:clock.emitting,enabled:clock.enabled,
   sourceDurationMs:spec.durationMs,externalNodeCount:externalNodes.length,lastDispatch,
   actions:Object.freeze(actions.map(e=>Object.freeze({nodeIndex:e.index,parentBound:e.node.parent===frameOwner.logicalRoot,active18:e.control.readActive18(),...e.particle.snapshot()}))),
   sourceClockAlgorithmQualified:true,sourceOrderedActionControlQualified:true,sourceActionResetOrderQualified:true,
   presentationMode:lastPresentationMode,presentationApplied:presentedEpoch>0,
   nativeClockProfileObserved:false,sourceParentAttachPhaseQualified:true,sourceWorldTickQualified:false,
   sourceManagerRegistrationQualified:false,sourceWrapperReleaseQualified:false,nativeReady:false});
  receipts.set(receipt,{owner:api,revision,actionStamp:actionStamp()});return receipt;
 }
 const api=Object.freeze({
  reset(){reset();return snapshot();},
  bindCapturedRoot(){live();if(externalNodes.length)return false;externalNodes.push(frameOwner.logicalRoot);revision++;return true;},
  // AFE220 calls119F510/1201BF0 after successful wrapper initialization,
  // before retaining the wrapper in its manager's collection.
  attachActionParents(){
   live();for(const entry of actions)attachNativeSequenceParent(entry.node,{
    readParent:n=>n.parent,
    resolveParent:()=>nativeSequenceParent(spec.actions[entry.index],{externalNodes}),
    addChild:(p,n,flag)=>{if(flag!==0)throw Error('Native attach flag0 required');p.add(n);},
    setParent:(n,p)=>{if(n.parent!==p)throw Error('Actual Pawn action attach failed');},
   });revision++;return snapshot();
  },
  tickController(deltaMs){
   live();const active=tickNativeSequenceActions(clock,deltaMs,actions,{
    updateAction:(entry,timing)=>entry.control.tick(timing),readActive:entry=>entry.control.readActive18(),
   });lastDispatch=active;controllerEpoch++;revision++;return Object.freeze({active,receipt:snapshot()});
  },
  tickPresentation(deltaMs,{mode}={}){
   live();if(lastDispatch!==true||presentedEpoch===controllerEpoch)throw Error('One current successful controller phase required before Pawn presentation');
   if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Unsigned Pawn particle presentation delta required');
   const plans=actions.map(entry=>planConquestPawnParticlePresentationTick({source,nodeIndex:entry.index,mode}));
   if(actions.some(entry=>entry.node.parent!==frameOwner.logicalRoot))throw Error('Captured root must own all five action parents before presentation');
   const frameReceipt=frameOwner.readFrame(),draws=[];
   for(const [i,entry]of actions.entries()){
    const plan=plans[i];entry.particle.tick({previous:clock.previous,current:clock.current,deltaMs,admission:plan.admission,frameReceipt});
    draws.push(entry.particle.render({instanceAlpha:plan.instanceAlpha,frameReceipt}));
   }
   presentedEpoch=controllerEpoch;lastPresentationMode=mode;revision++;
   return Object.freeze({draws:Object.freeze(draws),renderedParticles:draws.reduce((sum,r)=>sum+r.renderedParticles,0),receipt:snapshot(),sourceSceneAdmissionProducerQualified:false,nativeReady:false});
  },
  readActions(){live();return Object.freeze(actions.map(e=>Object.freeze({nodeIndex:e.index,node:e.node,particleAction:e.particle,actionController:e.control})));},
  snapshot,
  dispose(){
   if(disposed)return;for(const entry of actions){entry.control.dispose();entry.particle.dispose();entry.node.removeFromParent();}
   externalNodes.length=0;disposed=true;revision++;
  },
 });
 try{
  for(const a of spec.actions){
   const node=new THREE.Group();node.name='Conquest Pawn Death action '+a.index;
   const particle=createConquestPawnParticleAction({source,nodeIndex:a.index,frameOwner,actor,world,scene,camera,renderBank,nextRandom15,numericalProfile,trigProfile,qualityProfile});
   try{const control=createConquestPawnParticleActionController({source,nodeIndex:a.index,particleAction:particle,frameOwner,actor,world,scene});actions.push({index:a.index,node,particle,control});}
   catch(error){particle.dispose();throw error;}
  }
  reset();
 }catch(error){api.dispose();throw error;}
 owners.set(api,{source,frameOwner,actor,world,scene,live,revision:()=>revision,actionStamp});return api;
}

export function assertConquestPawnDeathSequence(owner,{source,frameOwner,actor,world,scene}={}){
 const r=owners.get(owner);if(!r||r.source!==source||r.frameOwner!==frameOwner||r.actor!==actor||r.world!==world||r.scene!==scene)throw Error('Typed retained Pawn Death sequence required');r.live();return owner;
}
export function assertConquestPawnDeathSequenceReceipt(receipt,{owner}={}){
 const r=owners.get(owner),stored=receipts.get(receipt);if(!r||stored?.owner!==owner||stored.revision!==r.revision())throw Error('Current typed Pawn Death sequence receipt required');r.live();if(stored.actionStamp!==r.actionStamp())throw Error('Pawn Death sequence particle state changed');return receipt;
}
