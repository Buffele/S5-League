import {conquestEnterBaseParticleSourceNode} from './conquest-enter-base-particle-source.js';
// Same CParticleNode table14A3CA8 and12210E0 source decision; this shared
// low-level kernel has no source-bank admission or effect-lifetime claims.
export {planConquestPawnParticleRootTick as planConquestEnterBaseParticleRootTick,completeConquestPawnParticleRootTick as completeConquestEnterBaseParticleRootTick} from './conquest-pawn-particle-root-plan.js';
export const CONQUEST_ENTER_BASE_PARTICLE_PRESENTATION_MODE='s5-direct-visible-enter-base';
export function planConquestEnterBaseParticlePresentationTick({source,nodeIndex,mode}={}){
 conquestEnterBaseParticleSourceNode(source,nodeIndex);
 if(mode!==CONQUEST_ENTER_BASE_PARTICLE_PRESENTATION_MODE)throw Error('Explicit S5 Enter Base particle presentation mode required');
 return Object.freeze({kind:'conquest-enter-base-particle-presentation-plan',mode,route:'direct11361B0',admission:false,instanceAlpha:1,
  sourceBranchesQualified:false,sceneProducersQualified:false,rootMatrixProducerQualified:false,nativeReady:false});
}
