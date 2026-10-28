// AddGhostTrail(name, delay, duration): the third argument is a duration,
// including when it equals the delay. This query is the nominal elapsed-time
// gate used by the reconstructed ribbon adapters, not the native uint32
// wrapper's cadence-dependent first/last activating tick.
export function nominalActorTrailWindow(timeMs,{beginMs,endMs}){
 return Number.isFinite(timeMs)&&endMs>0&&timeMs>beginMs&&timeMs<=beginMs+endMs;
}
