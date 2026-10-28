// Native signal latch: 570890 -> 637150 -> 64ff30. The callback is invoked
// at the START of a subsequent state tick, not on input or phase entry.
// Exact boundaries/remaining arena mapping: work/death-scythe-native/second-impact.md.
// 6e990e..6e9974: float32(cos(float32((180 - 90 * .5) * radians))).
// This is only the angular branch of damage-record classification. The caller
// must supply the dot of the two native normalized horizontal vectors, after
// validating them; descriptor/missing-direction fallbacks are not inferred.
export const DEATH_SCYTHE_CATEGORY_THRESHOLD = Math.fround(Math.cos(Math.fround(135 * 0.017453292521994)));
export function deathScytheAngularCategory(normalizedHorizontalDot){
 if(!Number.isFinite(normalizedHorizontalDot)||normalizedHorizontalDot < -1.000001||normalizedHorizontalDot > 1.000001)
  throw new TypeError('Finite dot of valid normalized horizontal vectors required');
 return Math.fround(normalizedHorizontalDot) < DEATH_SCYTHE_CATEGORY_THRESHOLD ? 1 : 2;
}
// 97ec00 -> 982080 maps native local -Z to actor+a8. sourceActorYaw in
// s5runtime-coordinates.js maps the same axis to this S5 sin/cos heading.
// Positions must share one world coordinate system, with its scale applied
// equally to both actors. Height is deliberately excluded by 6e9820..9835.
export function deathScytheContactCategory(sourcePosition,targetPosition,targetFacing){
 if(!Number.isFinite(targetFacing)||![sourcePosition?.x,sourcePosition?.z,targetPosition?.x,targetPosition?.z].every(Number.isFinite))
  throw new TypeError('Finite world XZ positions and target facing required');
 const x=Math.fround(sourcePosition.x-targetPosition.x),z=Math.fround(sourcePosition.z-targetPosition.z);
 const length=Math.hypot(x,z);
 // 6e9b63 clears category when the source-target horizontal direction is zero.
 if(length===0)return 0;
 const directionX=Math.fround(x/length),directionZ=Math.fround(z/length);
 const facingX=Math.fround(Math.sin(targetFacing)),facingZ=Math.fround(Math.cos(targetFacing));
 const dot=Math.fround(Math.fround(facingX*directionX)+Math.fround(facingZ*directionZ));
 return deathScytheAngularCategory(dot);
}
export function signalDeathScytheSecondImpactContact(state,{sourcePosition,targetPosition,targetFacing,targetInvincible,weaponType,attributeId}={}){
 // TutorialSystem2:SetInvincibility -> b61fd0 -> 980cd0 -> property15f458c.
 // Require an explicit boolean, so absent state cannot silently enable finish.
 if(typeof targetInvincible!=='boolean')return false;
 return signalDeathScytheSecondImpact(state,{weaponType,attributeId,targetFlag128:targetInvincible,
  damageRecordType:deathScytheContactCategory(sourcePosition,targetPosition,targetFacing)});
}
export function createDeathScytheSecondImpact(){return {active:true,requested:false,invoked:false,originMs:null};}
export function signalDeathScytheSecondImpact(state,{weaponType,attributeId,damageRecordType,targetFlag128}={}){
 // Raw-field compatibility API; targetFlag128 is SetInvincibility's property.
 if(!state?.active||weaponType!==42||attributeId!==172||damageRecordType!==1||targetFlag128!==false)return false;
 state.requested=true;return true;
}
export function consumeDeathScytheSecondImpact(state,nowMs){
 if(!Number.isFinite(nowMs)||nowMs<0)throw new TypeError('Nonnegative state clock required');
 if(!state?.active||!state.requested||state.invoked)return null;
 state.invoked=true;state.originMs=nowMs;
 return {callback:'SpecialAttackByDeathScythe_SECOND_IMPACT',originMs:nowMs,
  contacts:[{index:0,afterMs:350,atMs:nowMs+350},{index:1,afterMs:450,atMs:nowMs+450}],
  // Contact clocks start in Lua EnterState(ACTOR) now. This does not restart
  // the main state clock nor jump immediately to the finish animation.
  mainStateClockUnchanged:true};
}
export function cancelDeathScytheSecondImpact(state){if(state){state.active=false;state.requested=false;state.invoked=false;state.originMs=null;}}
