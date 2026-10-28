import {MotionGraph} from './motion-graph.js';

// RunState_WeaponUnused names directions in source actor coordinates. With
// the imported rig facing local -Z (setAvatarFacing adds pi), S5 side +1
// travels toward source LEFT. Use the same presentation boundary as the
// other original 00008–00015 locomotions; never reverse input or physics.
const RUN=Object.freeze({front:'00008',leftFront:'00011',left:'00012',rightFront:'00009',right:'00010',back:'00013',leftBack:'00015',rightBack:'00014'});
// NormalState/RunState_WeaponUnused are authenticated. Their selection by the
// native standby-room actor is still unverified; no weapon attack clips used.
export function waitingRoomPose(input){
 const f=input.forward||0,s=input.side||0;
 return !f&&!s?'00074':f>0?s<0?RUN.leftFront:s>0?RUN.rightFront:RUN.front:f<0?s<0?RUN.leftBack:s>0?RUN.rightBack:RUN.back:s<0?RUN.left:RUN.right;
}

// The room already simulates jumping with Controller. Present that same flight
// and landing through the game's shared graph, instead of displaying idle/run
// in mid-air. Native standby jump eligibility/timing is not newly certified.
export class WaitingRoomMotion {
 constructor(){this.flight=new MotionGraph();}
 reset(){this.flight.reset();}
 events(events){this.flight.events(events);}
 sample(controller,dt,input={}){
  const flight=this.flight.sample(controller,dt);
  if(!controller.grounded||controller.dash>0||controller.wallAction||this.flight.phase==='land')return flight;
  return {clip:waitingRoomPose(input),loop:true,speed:1,fade:.12,restartKey:0};
 }
}
