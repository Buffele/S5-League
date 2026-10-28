// User-confirmed Counter Sword behavior: sample the current reticle point at
// entry and throughout each strike, including a queued combo and aerial attack.
// Vertical drop remains authored by Lua; this is the horizontal trajectory.
export function counterReticleHeading(position,input,fallback){
 const target=input?.aimTarget;
 if(target&&[position?.x,position?.z,target.x,target.z].every(Number.isFinite)){
  const x=target.x-position.x,z=target.z-position.z;
  if(x!==0||z!==0)return Math.atan2(x,z);
 }
 return Number.isFinite(input?.facing)?input.facing:fallback;
}
