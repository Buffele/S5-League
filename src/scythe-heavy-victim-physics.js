// Death Scythe received attribute170, after the native entry selector admits
// sourceActor.currentWeaponType42. This module does not infer that selector,
// execute collisions, change another actor, or simulate the grounded branch.
// Source:6054E0 refresh; constructor51401C..51408F;526D00 airborne branch.
const f=Math.fround;
const uint=(value,name)=>{
 if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError(`Explicit unsigned ${name} required`);
 return value;
};
const scalar=(value,name)=>{
 if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw new TypeError(`Explicit finite native ${name} required`);
 return f(value);
};
function timer(state){
 if(!state||typeof state.paused!=='boolean')throw new TypeError('Explicit actor timer and pause flag required');
 return {configuredDurationMs:uint(state.configuredDurationMs,'configured duration'),
  count:uint(state.count,'timer count'),limitMs:uint(state.limitMs,'timer limit'),
  elapsedMs:uint(state.elapsedMs,'timer elapsed'),paused:state.paused,nativeReady:false};
}

// Source constructor zeros are state initialization, not substituted registry
// values. configuredDurationMs is actor+228, copied from S32[28] at creation.
// An existing actor must instead provide its observed current timer fields.
export function createScytheHeavyVictimPhysics({configuredDurationMs}={}){
 return {configuredDurationMs:uint(configuredDurationMs,'configured duration'),
  count:0,limitMs:0,elapsedMs:0,paused:false,nativeReady:false};
}

//605536..6055B6 compares UNSIGNED old limit to S32[0]'s bit pattern. With
// the observed zero threshold this keeps any positive existing limit, even
// when expired, and resets only count/elapsed. The pause flag is preserved.
export function refreshScytheHeavyVictimPhysics(state,{resetThreshold}={}){
 const next=timer(state);resetThreshold=uint(resetThreshold,'S32[0] bit pattern');
 if(next.limitMs<=resetThreshold)next.limitMs=next.configuredDurationMs;
 next.count=0;next.elapsedMs=0;
 return next;
}

//FE6050 converts finite float input to a truncating signed64 result; callers
// here store its low32 bits. Exceptional conversion paths are not simulated.
function clockIncrement(value){
 if(!Number.isFinite(value)||value<-(2**63)||value>=2**63)throw new RangeError('Native timer conversion outside qualified finite range');
 return Math.trunc(value)>>>0;
}

export function advanceScytheHeavyVictimPhysics(state,dtMs,{
 actorMode114,velocityNative,gravityNative,terminalLowerBoundNative,
 timeFactor,normalRate,heavyGravityRate,heavyDisplacementRate,timerMillisecondsFactor,
}={}){
 const next=timer(state);dtMs=uint(dtMs,'engine delta milliseconds');actorMode114=uint(actorMode114,'actor mode114');
 //526DF2 takes a different move/support/fall-initialization path for mode0.
 // It does not advance the heavy timer. No grounded proxy is invented here.
 if(actorMode114===0)return {handled:false,state:next,nativeReady:false,reason:'Native grounded movement/support branch required'};
 const seconds=f(f(dtMs)*scalar(timeFactor,'Float[3]'));
 const normal=scalar(normalRate,'Float[47]');
 const heavyGravity=scalar(heavyGravityRate,'Float[60]');
 const heavyDisplacement=scalar(heavyDisplacementRate,'Float[82]');
 const milliseconds=scalar(timerMillisecondsFactor,'Float[128]');
 const gravity=scalar(gravityNative,'actor virtualB4 gravity');
 const lower=scalar(terminalLowerBoundNative,'actor virtualB0 lower bound');
 const velocity={x:scalar(velocityNative?.x,'F0.X'),y:scalar(velocityNative?.y,'F0.Y'),z:scalar(velocityNative?.z,'F0.Z')};
 if(!Number.isFinite(seconds))throw new RangeError('Native seconds conversion overflow');

 //52719F..5271BD selects both rates BEFORE ticking. The crossing frame stays
 // boosted. A zero limit with zero elapsed is active for this pre-tick test.
 const activeAtEntry=next.limitMs>=next.elapsedMs;
 const gravityRate=activeAtEntry?heavyGravity:normal;
 const displacementRate=activeAtEntry?heavyDisplacement:normal;
 let clockAdvanceMs=0;
 if(activeAtEntry){
  const converted=clockIncrement(f(milliseconds*seconds));
  if(!next.paused){
   clockAdvanceMs=converted;next.count=(next.count+1)>>>0;
   next.elapsedMs=(next.elapsedMs+converted)>>>0;
  }
 }

 //5272F1..5273AC: F0.Y is the protected scalar at actor+FC, not a separate
 // acceleration channel. Add B4*(seconds*rate), then clamp to B0 BEFORE move.
 //52DA80 uses ADDSS, hence one float32 rounding for the addition itself.
 const gravityDeltaNative=f(gravity*f(seconds*gravityRate));
 const afterGravity=f(velocity.y+gravityDeltaNative);
 const clamped=lower>afterGravity;
 const updatedVelocity={x:velocity.x,y:clamped?lower:afterGravity,z:velocity.z};
 const moveFactor=f(seconds*displacementRate);
 const displacementNative={x:f(updatedVelocity.x*moveFactor),y:f(updatedVelocity.y*moveFactor),z:f(updatedVelocity.z*moveFactor)};
 if(![gravityDeltaNative,afterGravity,moveFactor,...Object.values(displacementNative)].every(Number.isFinite))throw new RangeError('Native airborne arithmetic overflow');
 //527467..527559 updates modes from realized displacement/support AFTER
 // actor.virtual70. Those collision outputs belong to the caller, not here.
 return {handled:true,state:next,seconds,activeAtEntry,gravityRate,displacementRate,
  clockAdvanceMs,gravityDeltaNative,clamped,velocityNative:updatedVelocity,
  displacementNative,nativeReady:false};
}
