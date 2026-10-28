// Current item2000018, CHANNEL_MELEE. Ground factories bind CAttackState
// through5e3240; phase5e50b0 requests action/recovery durations from InitLua.
// SetAnim duration overrides in actorstates_katana_a_sword.lua are milliseconds.
const ground=Object.freeze({
 KT000:{sourceAction:'StandardKatana_A_SwordAfterDash1',sourceAnimation:'SwordAtkAfterDash1State_Katana_A_Sword',actionMs:350,recoveryMs:350,recoveryOverrideMs:0},
 KT001:{sourceAction:'StandardKatana_A_SwordAfterDash2',sourceAnimation:'SwordAtkAfterDash2State_Katana_A_Sword',actionMs:800,recoveryMs:800,recoveryOverrideMs:1000},
 KT002:{sourceAction:'StandardKatana_A_SwordAfterDash3',sourceAnimation:'SwordAtkAfterDash3State_Katana_A_Sword',actionMs:500,recoveryMs:500,recoveryOverrideMs:100},
 KT009:{sourceAction:'StandardKatana_A_SwordStrong',sourceAnimation:'SwordAtkStrongState_Katana_A_Sword',actionMs:500,recoveryMs:550,recoveryOverrideMs:0},
});
export function katanaNativeGroundAnimation(profile){
 const source=ground[profile.clip];if(!source)return profile;
 if(profile.actionMs!==source.actionMs||profile.recoveryMs!==source.recoveryMs)throw new Error('Katana ground profile differs from authenticated MELEE source');
 return {...profile,sourceAction:source.sourceAction,sourceAnimation:source.sourceAnimation,
  animationSpeed:1,recoveryAnimationSpeed:1,
  nativeRequestedAnimationDurationMs:source.actionMs,nativeAnimationDurationOverrideMs:0,
  nativeRecoveryRequestedAnimationDurationMs:source.recoveryMs,nativeRecoveryAnimationDurationOverrideMs:source.recoveryOverrideMs};
}

// CAttackStateEx Init5e91c0/Enter5e94e0/phase5eaf10: requested action300ms.
// Current BackDash DELAY SetAnim is commented; no recovery is invented.
export function katanaNativeBackdashAnimation(profile){
 if(profile.clip!=='KT006_1'||profile.actionMs!==300)throw new Error('Katana backdash differs from authenticated MELEE source');
 return {...profile,sourceAction:'StandardKatana_A_SwordAttack2BackDash',sourceAnimation:'UseWeapon2BackDash_Katana_A_Sword',animationSpeed:1,
  nativeRequestedAnimationDurationMs:300,nativeAnimationDurationOverrideMs:0};
}

// Release factory84fa90 also binds CAttackStateEx via5e9030. Enter reads
// +37c/+388 into action/recovery timers; phase5eaf10 requests +2f8/+308.
// MELEE disables SetIncreaseDelayChargeTime, so recovery remains900ms.
export function katanaNativeReleaseAnimation(profile){
 if(profile.clip!=='KT007'||profile.recoveryClip!=='KT008'||profile.actionMs!==700||profile.recoveryMs!==900)throw new Error('Katana release differs from authenticated MELEE source');
 // InitLua's40 is stored at+2d4. Tick5ea0c0 changes directly from phase0
 // to phase1 after action timer>700; it does not append a40ms phase.
 return {...profile,minimumMs:0,nativeMinimumParameterMs:40,nativeFullChargeThresholdMs:900,resetVelocityOnRecovery:true,sourceAction:'StandardKatana_A_SwordAttack2Dash',sourceAnimation:'UseWeapon2Dash_Katana_A_Sword',animationSpeed:1,recoveryAnimationSpeed:1,
  nativeRequestedAnimationDurationMs:700,nativeAnimationDurationOverrideMs:0,
  nativeRecoveryRequestedAnimationDurationMs:900,nativeRecoveryAnimationDurationOverrideMs:1000};
}

// CAttackChargeMovingState: SetStandingWait(true) writes+4c9. Entry59a8f0
// dispatches phase5, requesting base+60 (constructor560fd0 initializes0).
// This establishes initial waiting playback only, not later input phases.
export function katanaNativeStandingChargeAnimation(profile){
 if(profile.clip!=='KT006_2')throw new Error('Katana standing charge differs from authenticated animation source');
 return {...profile,minimumChargeMs:0,nativeMinimumChargeParameterMs:40,sourceAction:'StandardKatana_A_SwordAttack2Charge',sourceAnimation:'UseWeapon2Charge_Katana_A_Sword',animationSpeed:1,
  nativeStandingWait:true,nativeChargeInputPhasesVerified:false,
  nativeStandingReleaseDelayVerified:true,
  nativeRequestedAnimationDurationMs:0,nativeAnimationDurationOverrideMs:0};
}

// CAttackStateKatanaJumpState: Enter5b8920 loads +32c/+338 into
// timers +2b8/+2c8; phase5b9ea0 requests their +4 durations on all channels.
// Tick5b8eb0 switches directly to phase1 after action>400 (5b964d).
export function katanaNativeAirAnimation(profile){
 if(profile.clip!=='KT029'||profile.recoveryClip!=='KT033'||profile.actionMs!==400||profile.recoveryMs!==450)throw new Error('Katana air differs from authenticated MELEE source');
 return {...profile,minimumMs:0,nativeMinimumParameterMs:40,
  sourceAction:'StandardKatana_A_SwordJumpDash',sourceAnimation:'SwordJumpAtkState_Katana_A_Sword',
  animationSpeed:1,recoveryAnimationSpeed:1,
  nativeRequestedAnimationDurationMs:400,nativeAnimationDurationOverrideMs:0,
  nativeRecoveryRequestedAnimationDurationMs:450,nativeRecoveryAnimationDurationOverrideMs:0};
}
