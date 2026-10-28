import {compareMovementTraces} from './movement-comparison.js';
// Reaction comparisons additionally require the pre-impact physical state and
// HP. A changed spawn height/velocity must not masquerade as a reaction error.
export function compareReactionTraces(reference,candidate,tolerances){
 for(const trace of [reference,candidate]){
  const initial=trace.metadata?.initialConditions;
  if(!Number.isFinite(initial?.hp)||!['position','velocity'].every(key=>['x','y','z'].every(axis=>Number.isFinite(initial[key]?.[axis]))))throw Error('Missing pre-impact physical state/HP');
 }
 for(const key of ['position','velocity'])for(const axis of ['x','y','z'])if(reference.metadata.initialConditions[key][axis]!==candidate.metadata.initialConditions[key][axis])throw Error(`Non-equivalent initial ${key}.${axis}`);
 if(reference.metadata.initialConditions.hp!==candidate.metadata.initialConditions.hp)throw Error('Non-equivalent initial HP');
 return compareMovementTraces(reference,candidate,tolerances);
}
