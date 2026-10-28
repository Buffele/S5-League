// b77cb0: named animation applied successfully, requested duration nonzero.
// Source ticks / float32(4.8) -> truncating unsigned millisecond conversion,
// then float32 Lua speed multiplication and requested-duration division.
// Empty names, unsuccessful applications and global scheduling are callers'
// responsibilities; they must not infer a clip or request from this helper.
export function nativeRequestedAnimationSpeed({durationTicks,requestedMs,luaAnimationSpeed=1,durationOverrideMs=0}){
 if(!Number.isInteger(durationTicks)||durationTicks<0||durationTicks>0xffffffff||!Number.isInteger(requestedMs)||requestedMs<0||requestedMs>0xffffffff||!Number.isInteger(durationOverrideMs)||durationOverrideMs<0||durationOverrideMs>0xffffffff||!Number.isFinite(luaAnimationSpeed)||luaAnimationSpeed<0)throw new RangeError('Native unsigned animation durations and nonnegative Lua speed required');
 if(requestedMs===0)return Math.fround(luaAnimationSpeed);
 const milliseconds=durationOverrideMs||Math.trunc(Math.fround(Math.fround(durationTicks)/Math.fround(4.8)));
 return Math.fround(Math.fround(Math.fround(milliseconds)*Math.fround(luaAnimationSpeed))/Math.fround(requestedMs));
}
