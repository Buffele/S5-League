// Standby has no weapon/jump handlers. MOVE requests Run/Fall; STOP requests
// Normal. Airborne Normal then requests Jump in its own Tick, overriding any
// attack request made on that tick. See ORDRE-ENTREES-PLASMA.md.
export function advancePlasmaDashExit(state,input,grounded){
  if(!state)return {blocked:false,next:null};
  if(state==='normal')return {blocked:!grounded,next:null};
  // Input manager registrations stop after jump, button begin/end and sprint
  // edges. A held-click threshold (8) does not stop the subsequent MOVE/STOP.
  // Direct simulation callers express a short release with lightShort alone.
  const short=input.lightShort??input.light;
  const consumesFrame=input.jump||input.lightPressed||input.lightReleased||short||
    input.heavy||input.heavyReleased||input.sprintPressed||input.sprintReleased;
  const moving=Math.hypot(input.x||0,input.z||0)>.01;
  return {blocked:true,next:consumesFrame?'standby':!moving&&!grounded?'normal':null};
}
