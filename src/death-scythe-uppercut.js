import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// Current553200 applies this condition to the local attacker, not the victim.
// Setup80dfa0 binds only7 -> weapon1 jump, and timeout s32[88]=1000.
// Tick656110 holds its timeout clock at s32[57]=500 while airborne.
// ActorState_UpperCut supplies GR005/GR006 at speed1, with no duration fit.
export const DEATH_SCYTHE_UPPERCUT=Object.freeze({contactMs:320,verticalSpeed:2500,
 timeoutMs:1000,airClockMs:500,airClip:'GR005',landClip:'GR006',primaryStateId:45});
export function deathScytheUppercutVelocity(){return {x:0,y:DEATH_SCYTHE_UPPERCUT.verticalSpeed*SCN_SCENE_SCALE,z:0};}
export function createDeathScytheUppercut(){return {clockMs:0,phase:'air',phaseTimeMs:0};}
export function advanceDeathScytheUppercut(state,dtMs,{grounded=false}={}){
 if(!Number.isFinite(dtMs)||dtMs<0)throw new RangeError('Nonnegative uppercut tick required');
 state.clockMs+=dtMs;state.phaseTimeMs+=dtMs;
 if(!grounded)state.clockMs=DEATH_SCYTHE_UPPERCUT.airClockMs;
 else if(state.phase==='air'){state.phase='land';state.phaseTimeMs=0;}
 return {phase:state.phase==='air'?'action':'recovery',phaseTimeMs:state.phaseTimeMs,
  complete:grounded&&state.clockMs>DEATH_SCYTHE_UPPERCUT.timeoutMs};
}
