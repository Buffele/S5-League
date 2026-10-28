// Lua MAKEBOX dimensions at explicit range=500, converted by .006.
// World yaw and victim body are S5 adaptations, not proven native shape flags.
export const BREAKER_TRAINING_PROFILE=Object.freeze({range:500,power:24,channel:'melee',additionalPower:0});
export function breakerBox(attack){
  const kind=attack?.kind;
  if(!['light','strong','air','heavy'].includes(kind))return null;
  const air=kind==='air',heavy=kind==='heavy',r=BREAKER_TRAINING_PROFILE.range*.006;
  const width=r*(air?1:1.5),height=r*(air||heavy?1.2:.7),depth=r*(heavy?1.7:air?1.2:1);
  return {centerY:air?0:1.2,centerForward:((air||heavy)?.6:0)+depth/2,halfWidth:width/2,halfHeight:height/2,halfDepth:depth/2};
}
export function breakerContact(attacker,victim){
  const box=breakerBox(attacker.attack);if(!box)return false;
  const s=Math.sin(attacker.attack.facing??attacker.facing),c=Math.cos(attacker.attack.facing??attacker.facing);
  const dx=victim.position.x-attacker.position.x-s*box.centerForward;
  const dz=victim.position.z-attacker.position.z-c*box.centerForward;
  // Training body: upright AABB, radius .6, height 1.8. SAT on all five
  // distinct face normals (the remaining cross axes duplicate these).
  const radius=.6,dy=victim.position.y+.9-attacker.position.y-box.centerY;
  if(Math.abs(dy)>box.halfHeight+.9)return false;
  if(Math.abs(dx*c-dz*s)>box.halfWidth+radius*(Math.abs(c)+Math.abs(s)))return false;
  if(Math.abs(dx*s+dz*c)>box.halfDepth+radius*(Math.abs(c)+Math.abs(s)))return false;
  return Math.abs(dx)<=radius+Math.abs(c)*box.halfWidth+Math.abs(s)*box.halfDepth&&
    Math.abs(dz)<=radius+Math.abs(s)*box.halfWidth+Math.abs(c)*box.halfDepth;
}
