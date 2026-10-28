import {SOURCE_MOVEMENT,TUNING,WEAPON_MOVE_RATES} from './movement-profile.js';

// CFastRunVerIronBoots::Tick 61a8ce..61aae0 builds local -Z from
// dt * GetMoveSpeed(51dae0) * FREE fastrun_speed_rate * property1.
// This is direct translation, independent of the optional MoveBox channel.
export function ironBootsBoostTranslation(attack,{moveFactor=1}={}){
 if(attack?.weapon!=='ironboots'||attack.kind!=='boost'||attack.previousPhase!=='action')return null;
 const speed=TUNING.walk*WEAPON_MOVE_RATES.ironboots/WEAPON_MOVE_RATES.dagger
  *SOURCE_MOVEMENT.sprintRate*attack.profile.runSpeedMultiplier*moveFactor;
 return {x:Math.sin(attack.facing)*speed,z:Math.cos(attack.facing)*speed};
}
