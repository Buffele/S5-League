// Physics consumes mouse facing on its fixed tick. Presentation must not put
// the character one interpolated tick behind an immediately rotating camera.
// Simulation facing still drives input and contact eligibility. Walljump
// presentation uses the wall and stored impulse instead of the camera.
import {sourceActorYaw} from './s5runtime-coordinates.js';
export const WALL_JUMP_SUPPORT_DIAGONAL_WEIGHT=.7;
export function canFollowMouse(controller){
  if(controller.fireball)return false;
  // plasmasword3 records turning during B0000, B0001 and STRONG1. Movement
  // locking and mouse-facing are independent for these Plasma states.
  const canTurn=controller.attack?.weapon==='plasma'||controller.attack?.profile?.allowMouseRotation||(controller.weapon==='dagger'&&controller.attack?.type==='rush')||(controller.attack?.type!=='rush'&&!controller.attack?.locked);
  return canTurn&&(controller.dash===0||controller.grounded===false)&&controller.wallAction?.phase!=='prepare';
}
export function presentationFacing(controller,mouseFacing,live){
  const action=controller.wallAction,launch=action?.launch;
  // Keep the support closer to the wall normal; flight faces the full rebound.
  // Neither a camera turn nor collision-clipped velocity may rotate this pose.
  if((action?.phase==='prepare'||action?.phase==='flight')&&Number.isFinite(launch?.x)&&Number.isFinite(launch?.z)&&Math.hypot(launch.x,launch.z)>1e-8){
    const reboundFacing=Math.atan2(-launch.x,-launch.z),normal=action.normal;
    if(action.phase==='prepare'&&Number.isFinite(normal?.x)&&Number.isFinite(normal?.z)&&Math.hypot(normal.x,normal.z)>1e-8){
      const wallFacing=Math.atan2(-normal.x,-normal.z);
      const diagonal=Math.atan2(Math.sin(reboundFacing-wallFacing),Math.cos(reboundFacing-wallFacing));
      return wallFacing+diagonal*WALL_JUMP_SUPPORT_DIAGONAL_WEIGHT;
    }
    return reboundFacing;
  }
  return live&&canFollowMouse(controller)&&Number.isFinite(mouseFacing)?mouseFacing:controller.facing;
}

// PoseBuffer restores quaternions. Their XYZ Euler decomposition flips X and Z
// by pi once yaw passes +/-90 degrees; assigning rotation.y alone then preserves
// those flips and mirrors the requested heading (100 degrees becomes 80).
// Replace the entire quaternion, not one component of its Euler decomposition.
// The imported character faces local -Z, while controller facing zero is +Z.
export function setAvatarFacing(group,facing){
  const halfAngle=sourceActorYaw(facing)/2;
  group.quaternion.set(0,Math.sin(halfAngle),0,Math.cos(halfAngle));
}
