import {NativeGhostTrail} from './native-ghost-trail.js';

// PE SHA6bea9d8c…; controller11A4F30 -> array12707F0 -> two
// vec100AD10 constructors. Both endpoint vectors explicitly become zero.
// The supplied first evaluated world position is NOT the constructor seed.
// Evidence: work/rocket-launcher-recovery/trail-agent/native-initialization/.
export function createRocketGhostTrailClock(config){
 return new NativeGhostTrail(config,[[0,0,0],[0,0,0]]);
}
export const ROCKET_GHOST_CONSTRUCTOR=Object.freeze({
 translation:Object.freeze([0,0,0]),rotation:Object.freeze([0,0,0,1]),scale:Object.freeze([1,1,1]),
 localMatrix:Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
 historyPairs:3,historyStride:0x1c,historyOffset:0x14,initialOpacity:0,controllerInitialEmission:true,
 // Creation action1282260 disables emission after configuration. The action
 // window enables it later; this is separate from controller construction.
 actionCreationEmission:false,
});
