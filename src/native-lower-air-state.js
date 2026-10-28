// CLowerPartJumpState628570/628af0/628be0/629880.
// Explicit native actor modes:0 grounded,1 rising,2 falling. The caller owns
// their mapping and physics. This adapter does not infer modes from velocity.
// Parameter fitting/renderer application and actor callbacks remain external.
const CLIPS=Object.freeze(['00000','00001','00002','00003']);
function mode(value){if(![0,1,2].includes(value))throw new RangeError('Native actor mode must be0..2');}
function select(state,phase,events){
 state.phase=phase;
 if(state.active){state.animationIndex=phase;state.animationRevision++;events.push({type:'animation',index:phase,clip:CLIPS[phase]});}
 if(phase===1){state.flightElapsedMs=0;events.push({type:'native-phase1-callback'});}
 if(phase===3)events.push({type:'native-phase3-callback'});
}
export function createNativeLowerAirState({flightMs,predelayMs,landingMs}){
 for(const duration of [flightMs,predelayMs,landingMs])if(!Number.isFinite(duration)||duration<0)throw new RangeError('Invalid lower-state duration');
 return {active:false,phase:0,animationIndex:null,animationRevision:0,flightMs,predelayMs,landingMs,flightElapsedMs:0,predelayElapsedMs:0,landingElapsedMs:0};
}
export function enterNativeLowerAirState(state,actorMode){
 mode(actorMode);state.active=true;const events=[];
 if(actorMode===1||actorMode===2)select(state,actorMode,events);
 else if(state.predelayMs===0)state.phase=0;
 else {select(state,0,events);state.predelayElapsedMs=0;}
 return events;
}
export function exitNativeLowerAirState(state){state.active=false;}
export function advanceNativeLowerAirState(state,dtMs,actorMode){
 mode(actorMode);if(!Number.isFinite(dtMs)||dtMs<0)throw new RangeError('Invalid lower-state delta');
 const events=[];
 if(!state.active)return events;
 if(state.phase===0){
  state.predelayElapsedMs+=dtMs;
  if(state.predelayElapsedMs>state.predelayMs){events.push({type:'native-takeoff-callback'});select(state,1,events);}
 }else if(state.phase===3){
  state.landingElapsedMs+=dtMs;
  if(state.landingElapsedMs>state.landingMs)events.push({type:'request-parent-exit'});
 }else{
  if(actorMode===0||(state.phase!==1&&actorMode!==2)){
   if(state.landingMs===0)events.push({type:'request-parent-exit'});
   else {select(state,3,events);state.landingElapsedMs=0;}
   return events;
  }
  if(state.phase===1&&actorMode===2){select(state,2,events);return events;}
  if(state.flightElapsedMs<=state.flightMs){
   state.flightElapsedMs+=dtMs;
   if(state.flightElapsedMs>state.flightMs){
    // Native changes the animation parameter without changing phase+0c.
    state.animationIndex=2;state.animationRevision++;
    events.push({type:'animation',index:2,clip:CLIPS[2]});
   }
  }
 }
 return events;
}
