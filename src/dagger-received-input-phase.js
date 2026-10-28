// The standard local Damage18 state does not map held weapon input4; its
// standard lower callbacks are empty for this input. GUI input precedes the
// actor's state tick/commit. The manager may test a still-held input4 again
// on a later poll, so do not clear the held button or require a new press.
// Scope: selected source-backed positive ordinary Damage18 only. The native
// manager, dynamic callbacks, state substitutions and live admission remain
// conditional; this is not a DamageMoving or native-minimum qualification.
export function daggerReceivedInputPhase(previous,{frameId,serial,damageActive,sourceDurationMs,weapon}){
 const eligible=weapon==='dagger'&&Number.isInteger(sourceDurationMs)&&sourceDurationMs>0;
 const blocked=eligible&&damageActive;
 if(frameId===null||previous?.frameId!==frameId||previous?.serial!==serial||previous?.weapon!==weapon||!eligible)
  return {frameId,serial,weapon,blocked};
 return {frameId,serial,weapon,blocked:previous.blocked||blocked};
}
