// PE ff7e60/ff7ed0/ff7f30 -> 1191270 -> 118cbb0/118cc50.
// readMilliseconds supplies the selected native uint32 clock reading, not dt.
// 102e570: shared InterruptTime/10000 for mode 0, timeGetTime otherwise.
const uint32=value=>{
 if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError('Expected uint32 clock milliseconds');
 return value;
};
function read(clock){
 if(typeof clock!=='function')throw new TypeError('Explicit millisecond clock required');
 return uint32(clock());
}
export function createNativeSceneTimer(readMilliseconds){
 const initial=read(readMilliseconds);
 return {initial,previous:initial,delta:0,scale:0};
}
export function setNativeSceneTimerScale(state,scale){
 const stored=Math.fround(scale);
 if(!Number.isFinite(stored))throw new RangeError('Finite native float scale required');
 state.scale=stored;
}
export function resetNativeSceneTimer(state,readMilliseconds){
 const now=read(readMilliseconds);
 state.delta=0;state.initial=now;state.previous=now;
}
export function nativeSceneTimerDelta(state){
 // 1191270 sets the x87 rounding mode to truncate, FISTP int64, returns EAX.
 // Reject the unverified invalid-conversion domain instead of clamping it.
 const value=Math.trunc(state.delta);
 if(!Number.isFinite(value)||value<-(2**63)||value>=2**63)throw new RangeError('Native int64 conversion domain exceeded');
 return Number(BigInt.asUintN(32,BigInt(value)));
}
export function advanceNativeSceneTimer(state,readMilliseconds){
 const now=read(readMilliseconds);
 const difference=now-state.previous;
 // ff7f30 casts the double difference to float before MULSS, then back to
 // double. Zero (including -0) bypasses scaling; it does not pause the clock.
 state.delta=state.scale===0?difference:Math.fround(Math.fround(difference)*state.scale);
 state.previous=now;
 // Wrap/backward read below the initial reading causes a new clock read.
 // No unsigned subtraction, no guessed wrap compensation, no fractional carry.
 if(now<state.initial)resetNativeSceneTimer(state,readMilliseconds);
 return nativeSceneTimerDelta(state);
}
