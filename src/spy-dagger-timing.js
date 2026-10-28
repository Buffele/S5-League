// Read-only static analysis of the local S4Client.exe (SHA-256 recorded in
// outputs/S4-CLIENT-TIMING.md). No original client code is executed here.
// InitLua 0x5370f0 -> Begin 0x5372e0 -> Tick 0x5378d0:
// distinct action/recovery timers; strictly greater than their limits;
// the recovery timer starts at zero, with no action-time overshoot carried in.
import {S5RUNTIME_MOTION} from './s5runtime-motion-data.js';
export const RUSH_ACTION_MS=1000;
export const RUSH_RECOVERY_MS=1500;
// S5Runtime 0x85A698–0x85A7BD: INPUT_MOVE, integer constants 99/100.
// The loaded transition table also contains [0,1450] queued, [1451,UINT_MAX] immediate.
export const RUSH_MOVE_CANCEL_MS=1451;
export const CUT_ACTION_MS=550;
// S5 input adapter, not a fixed native timer. Copied S5Runtime trials22Oct:
// +8ms6/6, +16ms2/6, +24ms0/6. Use physical edge timestamps so two
// nearby edges are not rejected merely for straddling a16ms simulation tick.
export const CUT_JUMP_INPUT_WINDOW_MS=16;
export const CUT_MOVE_RATE=.5;

// S5Runtime 0x5DDF33 -> 0x5DE816: even the zero-ms cut recovery is a separate
// substate, consumed on the following tick. Do not carry action overshoot in.
export function advanceCutPhase(attack,dtMs){
  attack.phase??='action';
  attack.phaseTimeMs=(attack.phaseTimeMs??0)+dtMs;
  if(attack.phase==='action'){
    if(attack.phaseTimeMs>CUT_ACTION_MS+1e-8){
      attack.phase='recovery';attack.phaseTimeMs=0;
    }
    return false;
  }
  return attack.phaseTimeMs>0;
}

// CAnimParam::SetAnim 0x7e8510, playback 0x7e8830 / 0x7e8a9c.
// The stored double is the promoted float 4.8; clip ticks / this constant are
// truncated to whole milliseconds before dividing by the requested duration.
// This reproduces that local calculation, NOT all x87 runtime arithmetic.
export const CLIENT_TICKS_PER_MS=4.800000190734863;
export function fittedClipSpeed(durationTicks,requestedMs,speed=1){
  if(!Number.isFinite(durationTicks)||durationTicks<=0||!Number.isFinite(requestedMs)||requestedMs<0||!Number.isFinite(speed)||speed<=0)throw Error('Invalid animation timing');
  return requestedMs===0?speed:Math.fround(Math.trunc(durationTicks/CLIENT_TICKS_PER_MS)*speed/requestedMs);
}
export const RUSH_CLIP_SPEED=fittedClipSpeed(4800,RUSH_ACTION_MS);
export const RECOVERY_CLIP_SPEED=fittedClipSpeed(6960,RUSH_RECOVERY_MS);

export function advanceRushPhase(attack,dtMs,moving=false){
  attack.moveCancelRequested ||= moving;
  attack.transitionTimeMs=(attack.transitionTimeMs||0)+dtMs;
  if(attack.moveCancelRequested&&attack.transitionTimeMs>=RUSH_MOVE_CANCEL_MS)return true;
  attack.phaseTimeMs+=dtMs;
  if(attack.phase==='action'){
    if(attack.phaseTimeMs>RUSH_ACTION_MS+1e-8){
      attack.phase='recovery';attack.phaseTimeMs=0;
    }
    return false;
  }
  return attack.phaseTimeMs>RUSH_RECOVERY_MS+1e-8;
}

export function cutClipSample(attack,combo,sex='male'){
  const clip=combo?'SN013':'SN014';
  return {clip,time:attack.time*fittedClipSpeed(S5RUNTIME_MOTION[sex].durations[clip],CUT_ACTION_MS)};
}

export function rushClipSample(attack,sex='male'){
  const recovering=attack.phase==='recovery';
  const clip=recovering?'SN012':'SN001';
  return {clip,time:(attack.phaseTimeMs??attack.time*1000)/1000*fittedClipSpeed(S5RUNTIME_MOTION[sex].durations[clip],recovering?RUSH_RECOVERY_MS:RUSH_ACTION_MS)};
}
