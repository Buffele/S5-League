import {conquestPawnParticleSourceNode} from './conquest-pawn-particle-source.js';
const plans=new WeakSet(),f=Math.fround;
const bool=v=>{if(typeof v!=='boolean')throw Error('Explicit source root/scene boolean required');return v;};
const scalar=v=>{if(typeof v!=='number')throw Error('Explicit source float32 fade required');return f(v);};
export const CONQUEST_PAWN_PARTICLE_PRESENTATION_MODE='s5-direct-visible-pawn-death';
export const CONQUEST_PAWN_PARTICLE_FADE_THRESHOLD=0.009999999776482582;

// 12210E0's decision prefix. Visibility results are explicit source boundaries,
// not qualified producers of scene+1B8, frustum vectors or scene+1C0.
// Registration is decided AFTER11361B0, using its resulting finished state.
export function planConquestPawnParticleRootTick({rootActiveA0,particlePresent,actionBoundAC,sceneEnabled1B8,rootVisibleC8,sceneBoundsAccepted118CA20,batchPresent1C0,fadeC8,fadeC4}={}){
 for(const v of [rootActiveA0,particlePresent,actionBoundAC,sceneEnabled1B8,rootVisibleC8,sceneBoundsAccepted118CA20,batchPresent1C0])bool(v);
 fadeC8=scalar(fadeC8);fadeC4=scalar(fadeC4);
 const calls=[];let admission=null,route='none',instanceAlpha=null;
 if(rootActiveA0){
  calls.push('matrix104');if(actionBoundAC)calls.push('action1201B40');
  if(particlePresent){
   calls.push('sceneEnabled');admission=true;
   if(sceneEnabled1B8){calls.push('rootVisible');if(rootVisibleC8){calls.push('frustum');if(sceneBoundsAccepted118CA20)admission=false;}}
   calls.push('readBatch');
   if(batchPresent1C0&&!admission){instanceAlpha=f(fadeC8*fadeC4);if(instanceAlpha>CONQUEST_PAWN_PARTICLE_FADE_THRESHOLD){route='batch1268F30';calls.push('readBatch','batch');}}
   else{route='direct11361B0';calls.push('tick','finished');}
  }
 }
 const plan=Object.freeze({kind:'conquest-pawn-particle-root-source-plan',mode:'source-inputs',rootActiveA0,particlePresent,admission,route,instanceAlpha,
  traverseChildren:rootActiveA0,calls:Object.freeze(calls),sourceBranchesQualified:true,sceneProducersQualified:false,rootMatrixProducerQualified:false,nativeReady:false});
 plans.add(plan);return plan;
}
export function completeConquestPawnParticleRootTick(plan,{finished1136050}={}){
 if(!plans.has(plan))throw Error('Actual source root tick plan required');bool(finished1136050);
 const registerRoot=plan.route==='direct11361B0'&&!finished1136050&&!plan.admission;
 return Object.freeze({registerRoot,category:registerRoot?0x1a:null,calls:Object.freeze([...plan.calls,...(registerRoot?['registerC0','registerRoot']:[]),...(plan.traverseChildren?['children']:[])]),nativeReady:false});
}

// Deliberate S5 scene presentation. This selects direct visible ticking and
// alpha1; it does not claim native scene/frustum/batch production or A0 state.
// The caller must first run all ordered12019A0 action controls, then tick the
// source particle owner and finally readFinished1136050 for registration.
export function planConquestPawnParticlePresentationTick({source,nodeIndex,mode}={}){
 conquestPawnParticleSourceNode(source,nodeIndex);
 if(mode!==CONQUEST_PAWN_PARTICLE_PRESENTATION_MODE)throw Error('Explicit S5 Pawn particle presentation mode required');
 return Object.freeze({kind:'conquest-pawn-particle-presentation-plan',mode,route:'direct11361B0',admission:false,instanceAlpha:1,
  sourceBranchesQualified:false,sceneProducersQualified:false,rootMatrixProducerQualified:false,nativeReady:false});
}
