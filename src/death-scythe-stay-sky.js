// CAttackState 5e83e0 / 5e3660 / 5e4cc1..5e4df1. Command-level port.
// The command gates actor physics through 97df40/97dfd0; it is not a new
// impulse or an interpolation of the native timer across a frame.
// Evidence: work/death-scythe-native/stay-sky.md.
export const DEATH_SCYTHE_JUMP_ATTRIBUTE=0xab;
export function createDeathScytheStaySky({durationMs=500}={}){
 if(!Number.isFinite(durationMs)||durationMs<0)throw new TypeError('Nonnegative duration required');
 return {durationMs,elapsedMs:0,ticks:0};
}
export function advanceDeathScytheStaySky(state,dtMs,{weaponType,attackAttributeIds,actorMode,paused=false}={}){
 if(!Number.isFinite(dtMs)||dtMs<0)throw new TypeError('Nonnegative dtMs required');
 if(!state||![state.durationMs,state.elapsedMs,state.ticks].every(Number.isFinite)||state.durationMs<0||state.elapsedMs<0)throw new TypeError('Valid StaySky state required');
 if(weaponType!==42||!attackAttributeIds?.includes(DEATH_SCYTHE_JUMP_ATTRIBUTE))return {physicsEnabled:null,eligible:false};
 // Native branch tests elapsed BEFORE incrementing. Crossing this tick still
 // sends disable; re-enable happens on the subsequent tick.
 if(state.elapsedMs<=state.durationMs){
  if(!paused){state.elapsedMs+=dtMs;state.ticks++;}
  return {physicsEnabled:actorMode===1?null:false,eligible:true};
 }
 return {physicsEnabled:true,eligible:true};
}
