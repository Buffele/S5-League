import {SOURCE_MOVEMENT,TUNING} from './movement-profile.js';
import {fittedClipSpeed} from './spy-dagger-timing.js';
import {S5RUNTIME_MOTION} from './s5runtime-motion-data.js';

// Legacy reference-client CDodgeState::Tick 0x553680 (NOT a S5Runtime address):
// move at constant speed in phase 0;
// in phase 1, subtract deceleration BEFORE moving. Each phase owns a timer,
// exits only when elapsed > limit, and discards its overshoot on transition.
// Reconstructed arithmetic in scene units, not bit-identical x87 emulation.
export function createDashMotion(){
  return {phase:'evade',phaseTimeMs:0,elapsedMs:0,speed:TUNING.dashSpeed};
}

export function advanceDashMotion(motion,dtMs){
  if(!Number.isFinite(dtMs)||dtMs<=0||dtMs>1000/30)throw Error('Invalid dash step');
  if(motion.phase===null)return {speed:0,gravitySeconds:0,finished:true,remainingMs:0};
  const recovering=motion.phase==='recovery',dt=dtMs/1000;
  if(recovering)motion.speed=Math.max(0,motion.speed-TUNING.dashDecel*dt);
  const speed=motion.speed;
  motion.elapsedMs+=dtMs;
  motion.phaseTimeMs+=dtMs;
  const limit=recovering?SOURCE_MOVEMENT.dashRecoveryMs:SOURCE_MOVEMENT.dashActiveMs;
  if(motion.phaseTimeMs>limit+1e-8){
    motion.phase=recovering?null:'recovery';
    motion.phaseTimeMs=0;
  }
  const finished=motion.phase===null;
  const remainingMs=finished?0:Math.max(dtMs,
    (motion.phase==='evade'?SOURCE_MOVEMENT.dashActiveMs+SOURCE_MOVEMENT.dashRecoveryMs:SOURCE_MOVEMENT.dashRecoveryMs)-motion.phaseTimeMs);
  // S5Runtime CDodgeState moves laterally; actor gravity is integrated separately.
  // An evade tick must not suspend vertical integration.
  return {speed,gravitySeconds:dt,finished,remainingMs};
}

// Legacy reference-client animation selector 0x554110, lateral cases 2/3: request the
// nominal active+recovery duration for ONE clip; never restart at recovery.
// Both selected male SCN clips have 7200 ticks. SetAnim duration override=0.
export const DASH_CLIP_SPEED=fittedClipSpeed(7200,SOURCE_MOVEMENT.dashActiveMs+SOURCE_MOVEMENT.dashRecoveryMs);
export function dashClipSample(side,elapsedMs,sex='male'){
  // The female source pair is mirrored relative to the male pair.
  const left=side<0;
  const clip=(sex==='female'?!left:left)?'00005':'00056';
  const speed=fittedClipSpeed(S5RUNTIME_MOTION[sex].durations[clip],SOURCE_MOVEMENT.dashActiveMs+SOURCE_MOVEMENT.dashRecoveryMs);
  return {clip,time:Math.max(0,elapsedMs)/1000*speed};
}
