import {SOURCE_MOVEMENT} from './movement-profile.js';

// Ground lower animation62bd80 -> b78580 with attack-speed flag enabled.
// The caller must prove this branch for its native state. Lua's requested
// clip duration does not replace the movement/animation speed ratio here.
export function nativeAttackLowerWalkSpeed({attackMoveSpeedRate=1,moveFactor=1,luaAnimationSpeed=1}={}){
 if(![attackMoveSpeedRate,moveFactor,luaAnimationSpeed].every(x=>Number.isFinite(x)&&x>=0))throw new RangeError('Finite nonnegative lower animation rates required');
 return SOURCE_MOVEMENT.move*attackMoveSpeedRate*moveFactor/SOURCE_MOVEMENT.animationMove*luaAnimationSpeed;
}
