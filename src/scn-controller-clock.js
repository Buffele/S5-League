// Concrete CAnimationController defaults (11528A0): enabled=1, loop=1,
// rate=1. 1153A30 truncates uint milliseconds * float(rate *4.800000190734863)
// before adding it, then wraps only on current > duration. Equality keeps
// the final authored key. This is used only by the supported Siege scenes.
export function createDefaultScnControllerClock(durationTicks){
 if(!Number.isSafeInteger(durationTicks)||durationTicks<=0||durationTicks>0xffffffff)throw Error('Positive SCN controller duration required');
 let current=0,elapsed=0,milliseconds=0;
 return {
  advance(dt){
   if(!Number.isFinite(dt)||dt<0)throw Error('Nonnegative SCN controller delta required');
   elapsed+=dt*1000;
   // Carry fractional browser milliseconds. The phase/cadence remains local,
   // rather than a replay of native frame timestamps.
   const now=Math.floor(elapsed+Number.EPSILON*Math.max(1,elapsed)*4),delta=now-milliseconds;milliseconds=now;
   current=(current+Math.trunc(Math.fround(delta)*Math.fround(4.800000190734863)))>>>0;
   if(current>durationTicks)current%=durationTicks;
   return current/4800;
  },
  snapshot(){return {durationTicks,currentTicks:current,loop:true,enabled:true,rate:1};},
 };
}
