// Static source 0x115caf0 (scene owner), not a conversion to seconds/MS.
// Culling/scene flags are explicit caller inputs, not inferred here.
const uint32=v=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new RangeError('Expected native uint32');return v;};
export function createNativeSceneClock({resetPeriod,minimumStep,pending=0,periodElapsed=0,updateCount=0}){
 [resetPeriod,minimumStep,pending,periodElapsed,updateCount].forEach(uint32);
 return {resetPeriod,minimumStep,pending,periodElapsed,updateCount};
}
// The owner accumulates time when active even if visibility later rejects it.
// Returning dispatches lets the integration preserve callback/pose update order.
export function advanceNativeSceneClock(state,delta,{active,eligible,stepped,validScene}={}){
 uint32(delta);
 if([active,eligible,stepped,validScene].some(v=>typeof v!=='boolean'))throw new TypeError('Scene gates must be explicit booleans');
 state.periodElapsed=(state.periodElapsed+delta)>>>0;
 if(state.resetPeriod<state.periodElapsed)state.periodElapsed=0;
 state.updateCount=(state.updateCount+1)>>>0;
 if(!active)return [];
 state.pending=(state.pending+delta)>>>0;
 if(!eligible)return [];
 const dispatches=[];
 if(!stepped)dispatches.push({delta:state.pending,childSlot:0xd8,updateOwner:false});
 else {
  // Strict comparison, and skip subdivision when >=2*minimum. This is the
  // actual branch, not a conventional catch-up scheduler.
  if(state.minimumStep!==0&&validScene&&state.pending<((state.minimumStep<<1)>>>0)){
   while(state.minimumStep<state.pending){
    dispatches.push({delta:state.minimumStep,childSlot:0xd4,updateOwner:true});
    state.pending-=state.minimumStep;
   }
  }
  dispatches.push({delta:state.pending,childSlot:0xd4,updateOwner:true});
 }
 state.pending=0;
 return dispatches;
}
