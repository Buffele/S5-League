import {S5RUNTIME_MOTION} from './s5runtime-motion-data.js';
import {SCN_SCENE_SCALE,sourceActorVector} from './s5runtime-coordinates.js';
export {SCN_SCENE_SCALE};
const SPY_STAB_MOVEBOX=S5RUNTIME_MOTION.male.curves.SN001;

export const SCN_TICKS_PER_SECOND=4800;
// Existing scene scale, shared by the visible rig and its extracted motion.
// This is NOT a claim that S4's physical unit was 1/0.006 metres. A complete
// centimetre-space controller/arena calibration remains a separate step.
// Weapon_spydagger.lua / StandardSpyDaggerAttack2 explicitly sets this to 2.
export const SPY_STAB_MULTIPLIER=2;

export function sampleMoveBox(timeMs,curve=SPY_STAB_MOVEBOX){
  if(!Number.isFinite(timeMs))throw Error('MoveBox time must be finite');
  const keys=curve.positions;
  if(!keys?.length)throw Error('Missing MoveBox position keys');
  // 16 ms = 76.8 Max ticks. Do not round each step to 77 ticks and drift.
  const tick=Math.max(0,Math.min(curve.durationTicks,timeMs*SCN_TICKS_PER_SECOND/1000));
  let lo=0,hi=keys.length-1;
  while(lo+1<hi){const mid=(lo+hi)>>1;if(keys[mid][0]<=tick)lo=mid;else hi=mid;}
  const a=keys[lo],b=keys[hi],t=Math.max(0,Math.min(1,(tick-a[0])/(b[0]-a[0]||1)));
  return {x:a[1]+(b[1]-a[1])*t,y:a[2]+(b[2]-a[2])*t,z:a[3]+(b[3]-a[3])*t};
}

export function spyStabDelta(fromMs,toMs,facing,scale=SCN_SCENE_SCALE,sex='male'){
  const curve=S5RUNTIME_MOTION[sex].curves.SN001;
  const a=sampleMoveBox(fromMs,curve),b=sampleMoveBox(toMs,curve),factor=scale*SPY_STAB_MULTIPLIER;
  // Same orientation as the rendered source rig (facing + PI). Source forward
  // is -Z; controller forward is (sin(facing), cos(facing)). Runtime verification
  // of S4's exact actor-basis transformation is still outstanding.
  const result=sourceActorVector({x:b.x-a.x,y:0,z:b.z-a.z},facing,factor);
  return {x:result.x||0,y:0,z:result.z||0};
}
