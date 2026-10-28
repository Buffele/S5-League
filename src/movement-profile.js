import {SCN_SCENE_SCALE} from './root-motion.js';
import {RUSH_ACTION_MS,RUSH_RECOVERY_MS} from './spy-dagger-timing.js';
import {S5RUNTIME_PHYSICS} from './s5runtime-physics-data.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
const g=S5RUNTIME_NATIVE_PHYSICS.values,a=g;
const nativeFloat=index=>S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===index).value;
export const WEAPON_MOVE_RATES=Object.freeze({
 ...Object.fromEntries(Object.entries(S5RUNTIME_PHYSICS.weapons).map(([k,v])=>[k,Number(v.move_speed_rate)])),
 // Breaker production attack states explicitly use MoveSpeedRate(1). Its
 // equipment entry is absent from this physics export, so gameplay uses the
 // neutral S5 rate instead of leaking NaN into locomotion.
 breaker:1,
 twinblade:1.1, // Current classic item2000010, authenticated XBN.
 bat:1.1,
 ironboots:1.2,
 sigmablade:1.1,
 assassinclaw:1.1,
 vitalshock:1.1,
 deathscythe:1.1,
 demonicknuckle:1.1,
 katana:1.1, // _eu_weapon.x7 item 2000018, classic Katana A Sword.
 smashrifle:1,
 semirifle:1,
 cannonade:.9, // Current _eu_weapon.x7 item2030002, type7.
 rocketlauncher:.8, // Current XBN item2020010, verified native type45.
 submachinegun:1.05, // Current reference item2010001, equipment and attack rates.
 revolver:1,
 airgun:.9, // xbn/weapon.xml 2010016; precedence over weapon_ref.xml unverified.
});

// Base parameters decoded from the running S5Runtime client's active FREE registry.
// Numeric strings and protected float32 values were independently cross-checked.
// This validates the parameters, not the entire simulation or equipment effects.
export const SOURCE_MOVEMENT=Object.freeze({
  profile:'GAMETEMPO_FREE',move:g.actor_default_move_speed,animationMove:g.actor_default_animation_move_speed,gravity:-g.gravity,terminal:-g.max_gravity_velocity,
  jump:g.jump_force,sideRate:g.side_speed_rate,backRate:g.back_speed_rate,sprintRate:a.fastrun_speed_rate,sprintDrain:a.fastrun_decrement_mp,
  dashSpeed:a.dodge_speed,dashDecel:a.dodge_decel,dashActiveMs:a.dodge_dodge_time*1000,dashRecoveryMs:a.dodge_delay*1000,dashCost:a.dodge_required_mp,
  wallForce:a.walljump_jump_force,wallPrepareMs:a.walljump_delay_before_jump*1000,wallFlightMs:a.walljump_jump_time*1000,wallCost:a.walljump_required_mp,
  daggerMoveRate:WEAPON_MOVE_RATES.dagger,
  baseEnergy:g.actor_default_mp_max,jumpMoveRate:g.jump_move_rate,
  landMoveRate:g.land_move_rate,landDelayMs:g.jump_landdelay,
});
const s=SOURCE_MOVEMENT,u=SCN_SCENE_SCALE;
// Equipped player in all nine September 23 captures. Keep the unmodified
// native baseEnergy (100) above distinct from this reproduced loadout (140).
export const CAPTURED_PLAYER=Object.freeze({maxEnergy:140});
// Still reconstructed: same physical/SCN scale; weapon rate multiplied by base movement.
// Base sprint rate is now confirmed by the live registry.
// CDodgeState::Tick (0x553680) applies constant speed in phase 0 and subtracts
// dodge_decel only in phase 1. Wall coefficients .75/1 are constant_info.x7
// float indices 0x26/0x2f read by CBoundJumpState::SetSubState (0x54c100).
// Attack acceleration, residual air steering and some resource eligibility gates remain
// reconstruction parameters. Player ellipsoid dimensions were captured natively.
export const TUNING=Object.freeze({
  maxEnergy:CAPTURED_PLAYER.maxEnergy,
  // Actor initializer 0x515249/0x515378; recovery formula 0x52B5DC.
  energyRecoveryRate:nativeFloat(69)*nativeFloat(8),
  walk:s.move*u*s.daggerMoveRate,sprint:s.move*u*s.daggerMoveRate*s.sprintRate,
  animationWalk:s.animationMove*u,sideRate:s.sideRate,backRate:s.backRate,
  acceleration:48,airAcceleration:17,gravity:s.gravity*u,terminal:s.terminal*u,
  // Ten sprint entries in capture 19:32:59 lose ~1 SP before steady drain.
  // Nominal measured cost; exact sub-tick resource scheduling is not reproduced.
  jump:s.jump*u,sprintDrain:s.sprintDrain,sprintEntryCost:1,
  wallJump:s.wallForce*u,wallHorizontal:s.wallForce*u*.75,
  wallPrepareMs:s.wallPrepareMs,wallFlightMs:s.wallFlightMs,wallCost:s.wallCost,
  dashSpeed:s.dashSpeed*u,dashDecel:s.dashDecel*u,dashActiveMs:s.dashActiveMs,
  dashDuration:(s.dashActiveMs+s.dashRecoveryMs)/1000,dashCost:s.dashCost,
  // Native player capture: properties 12/16 = width 200, height 320; solver radii = (100,160,100).
  rushAction:RUSH_ACTION_MS/1000,rushRecovery:RUSH_RECOVERY_MS/1000,radius:100*SCN_SCENE_SCALE,height:320*SCN_SCENE_SCALE,
});

export function locomotionTarget(x,z,facing,speed){
  const sin=Math.sin(facing),cos=Math.cos(facing);
  const forward=x*sin+z*cos,right=-x*cos+z*sin;
  const f=forward*speed*(forward<0?TUNING.backRate:1),r=right*speed*TUNING.sideRate;
  return {x:f*sin-r*cos,z:f*cos+r*sin};
}

// CRunState::Tick 0x634EE0 / 0x634FDB: strict front test, inclusive rear test.
// Float constants 24 and 41 are fractions of native float32 pi.
const floatConstant=index=>S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===index).value;
export const RUN_ANGLES=Object.freeze({
  front:Math.fround(floatConstant(24)*Math.fround(Math.PI)),
  back:Math.fround(floatConstant(41)*Math.fround(Math.PI)),
});
export function groundRunRate(angle){
  return angle<RUN_ANGLES.front?g.front_speed_rate:angle>=RUN_ANGLES.back?g.back_speed_rate:g.side_speed_rate;
}
export function groundRunTarget(x,z,facing,speed){
  const length=Math.hypot(x,z);if(!length)return {x:0,z:0};
  const forward=(x*Math.sin(facing)+z*Math.cos(facing))/length;
  const angle=Math.acos(Math.max(-1,Math.min(1,forward)));
  const rate=groundRunRate(angle);
  return {x:x*speed*rate,z:z*speed*rate};
}
