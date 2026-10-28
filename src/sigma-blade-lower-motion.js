import {SIGMA_BLADE_ABILITY} from './sigma-blade-data.js';
import {SOURCE_MOVEMENT,groundRunTarget} from './movement-profile.js';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {nativeAttackLowerWalkSpeed} from './native-lower-animation-speed.js';
// Standard actor, no native buff additions:51e090 uses key15f4698,
// proven by parse_string id17 and parser9c4a2f..9c4ae9.
export function sigmaBladeLowerMoveSpeed(moveFactor=1){
 return SOURCE_MOVEMENT.move*SCN_SCENE_SCALE*SIGMA_BLADE_ABILITY.attackMoveSpeedRate*moveFactor;
}
// Ground animation application62bd80 ->b78580, not duration/800ms.
// Profile MoveSpeedRate affects translation, not this animation ratio.
export function sigmaBladeLowerWalkSpeed(moveFactor=1){
 return nativeAttackLowerWalkSpeed({attackMoveSpeedRate:SIGMA_BLADE_ABILITY.attackMoveSpeedRate,moveFactor});
}
// 62B710 selects the lower phase from actor input (+EC), not velocity.
// 62B6F0 only clears active+10 on recovery; it keeps phase+0C and clip.
export function sigmaBladeAirLowerPose(profile,x,z,facing,moveFactor=1){
 if(x===0&&z===0)return {lower:profile.lowerIdle,lowerSpeed:1};
 const forward=x*Math.sin(facing)+z*Math.cos(facing);
 const side=-x*Math.cos(facing)+z*Math.sin(facing);
 const sector=(Math.round(Math.atan2(side,forward)/(Math.PI/4))+8)%8;
 return {lower:profile.lowerWalk[sector],lowerSpeed:sigmaBladeLowerWalkSpeed(moveFactor)};
}
export function sigmaBladeAirInputTarget(x,z,facing,upperSpeed,moveRate,moveFactor=1){
 // Spy command resélects ground child; its62b710 adds angularly scaled
 // lower movement after the direct upper contribution5dd7eb.
 const lower=groundRunTarget(x,z,facing,sigmaBladeLowerMoveSpeed(moveFactor)*moveRate);
 return {x:x*upperSpeed+lower.x,z:z*upperSpeed+lower.z};
}
