// Twin weak setup82c000, input7 INPUT_USE_WEAPON1_END_SHORT.
// constant_info s32[4b]=750, [4c]=751. Early range623720 queues
// target state48 until strict elapsed>750; late range623640 submits it
// immediately. Actor setup7fed10 +c0 ->810950 ->82cc40 confirms SG002.
export const TWIN_LIGHT_SHORT_INPUT=Object.freeze({fromMs:0,toMs:750,afterMs:750,lateFromMs:751,targetState:48,kind:'light',combo:1});
export const TWIN_LIGHT_LONG_INPUT=Object.freeze({fromMs:0,toMs:750,afterMs:750,lateFromMs:751,targetState:44});
const handlers=[['short','lightShort',7,TWIN_LIGHT_SHORT_INPUT],['long','lightLong',8,TWIN_LIGHT_LONG_INPUT]];
// Both handlers have independent clocks/acceptance. Requests are consumed by
// an owner that checks native CanEnter before writing the pending actor state.
// State44 has a real child, but no Twin Lua setup; do not invent its clip.
export function twinBladeNativeInputRequests(attack,input,dtMs){
 if(attack?.weapon!=='twinblade'||attack.kind!=='light'||attack.comboIndex!==0)return [];
 if(!Number.isInteger(attack.timeMs)||attack.timeMs<0||attack.timeMs>0xffffffff||!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw new RangeError('Native Twin input uint32 clock required');
 const states=attack.twinInputHandlers??=Object.create(null),requests=[];
 // Input event callbacks precede the old state's tick. Emit immediate
 // requests from all handlers before ticking any delayed request.
 for(const [name,key,inputId,range] of handlers){
  const state=states[name]??={accepted:false,queued:false,dispatched:false};
  const signaled=name==='short'?(input.lightShort??input.light):input[key];
  if(signaled&&!state.accepted){
   state.accepted=true;state.queued=true;
   if(attack.timeMs>=range.lateFromMs){
    state.queued=false;state.dispatched=true;
    requests.push({inputId,targetState:range.targetState,dispatch:'immediate'});
   }
  }
 }
 for(const [name,_key,inputId,range] of handlers){
  const state=states[name];
  if(state.queued&&((attack.timeMs+dtMs)>>>0)>range.afterMs){
   state.queued=false;state.dispatched=true;
   requests.push({inputId,targetState:range.targetState,dispatch:'delayed'});
  }
 }
 return requests;
}
// Native actor518b20 checks CanEnter before storing pendingState; a rejected
// later request must not replace an earlier accepted one. The owner provides
// actual state objects and permission behavior, including state44.
export function dispatchTwinBladeNativeRequests(requests,{canEnter,requestState}={}){
 if(!Array.isArray(requests)||typeof canEnter!=='function'||typeof requestState!=='function')throw new TypeError('Native Twin permission and state owner required');
 let pending=null;
 for(const request of requests){
  if(![44,48].includes(request.targetState))throw new RangeError('Unknown native Twin target');
  const allowed=canEnter(request.targetState,request);
  if(typeof allowed!=='boolean')throw new TypeError('Explicit native CanEnter result required');
  if(allowed){requestState(request.targetState,request);pending=request.targetState;}
 }
 return pending;
}
export function twinBladeLightTransition(attack,input,dtMs){
 let transition=null;
 for(const request of twinBladeNativeInputRequests(attack,input,dtMs)){
  if(request.targetState===48)transition={kind:'light',combo:1};
  else{
   // Preserve the actual request for an owner capable of resolving state44.
   // This S5 adapter still cannot play its unconfigured native state.
   (attack.twinUnresolvedRequests??=[]).push(request);
  }
 }
 return transition;
}
