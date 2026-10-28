import {readAsset} from './scene-assets.js';
import {VITAL_SHOCK_SOURCE_EVENTS} from './vital-shock-data.js';
import {withMeleeEffectHierarchies} from './melee-effect-hierarchy.js';

export const VITAL_SHOCK_EFFECT_RUNTIME='/assets/s5runtime/vital-shock/effects-runtime.json';
export const loadVitalShockEffectDefinitions=async()=>withMeleeEffectHierarchies(await readAsset(VITAL_SHOCK_EFFECT_RUNTIME));

// AddSequence's last Lua argument is not a proved SEQ playback duration.
// Preserve it without stretching/cutting authored SEQ nodes. Following remains
// the explicit existing arena policy, not a native attachment claim.
export function vitalShockStateCues(attack){
 if(attack?.weapon!=='vitalshock')return [];
 return (VITAL_SHOCK_SOURCE_EVENTS[attack.kind]??[]).flatMap((event,sourceIndex)=>
  event.sequence?[{name:event.sequence,at:event.timeMs/1000,follow:false,
   sourceIndex,sourceMethod:'AddSequence',sourceSlot:event.slot,
   sourceEndMs:event.durationArgumentMs,sourceClock:'actor-state',
   spatialPolicy:'arena follow:false; native sequence attachment unverified'}]:[]);
}

export const VITAL_SHOCK_EFFECT_LIMITS=Object.freeze([
 'Native AddSequence fifth-argument semantics are unverified; sourceEndMs is metadata, never used to change authored SEQ duration.',
 'Actor/bone following and native effect cancellation remain unverified; follow:false preserves the existing arena presentation policy.',
]);
