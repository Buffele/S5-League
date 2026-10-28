import {readAsset} from './scene-assets.js';

export const SPY_DAGGER_EFFECT_RUNTIME='/assets/s5runtime/effects/spy-dagger/runtime.json';
// AddSequence begins at zero. Keep the authored 1500 ms sequence duration;
// the source's 5000 ms state-event end is not an emitter stretch instruction.
// Copied S5Runtime observed22Oct: the delayed ghost appears at the advancing
// actor, not the departure point. Keep node200ms + SCN alpha166ms intact.
export const SPY_DAGGER_RUSH_CUE=Object.freeze({name:'shortknife01',at:0,follow:true});
export function prepareSpyDaggerSequence(sequence){
 // S5 presentation: keep the rush wind and final sparks in the actor frame.
 // Positions are already in game units, so apply rotation/translation once,
 // without reapplying the source scale or changing authored emitter clocks.
 for(const node of sequence.nodes)if(node.particles)node.particles.followActor=true;
 // Re-evaluate the model anchor after mixer/position without advancing the
 // authored clock or emitting particles a second time.
 sequence.sample=()=>{if(sequence.follow&&Number.isFinite(sequence.age))sequence.update(0);};
 const render=sequence.render.bind(sequence);
 sequence.render=camera=>{sequence.sample();render(camera);};
 return sequence;
}
export async function loadSpyDaggerEffectDefinitions(){return readAsset(SPY_DAGGER_EFFECT_RUNTIME);}
export async function loadSpyDaggerEffects(scene){
  const {loadEffectRuntime}=await import('./combat-effects.js');
  return loadEffectRuntime(scene,await loadSpyDaggerEffectDefinitions());
}
