import {TUNING} from './movement-profile.js';

// Reflect the supplied horizontal direction. Initial entry supplies facing;
// chained entry supplies pre-collision travel, following the user correction.
// Native force constants are verified; chained direction mapping remains an
// observation-based correction pending an original-client trajectory capture.
export function wallJumpVelocity(facing,normal){
  const incoming={x:Math.sin(facing),z:Math.cos(facing)};
  const dot=incoming.x*normal.x+incoming.z*normal.z;
  const x=incoming.x-2*dot*normal.x,z=incoming.z-2*dot*normal.z;
  const length=Math.hypot(x,z)||1;
  return {x:x/length*TUNING.wallHorizontal,y:TUNING.wallJump,z:z/length*TUNING.wallHorizontal};
}

// Native float registry index 26, captured from the running Melee client.
export const WALL_REBOUND_MIN_DOT=0.20000000298023224;
