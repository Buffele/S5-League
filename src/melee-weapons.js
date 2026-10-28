import {katanaNativeGroundAnimation,katanaNativeBackdashAnimation,katanaNativeReleaseAnimation,katanaNativeStandingChargeAnimation,katanaNativeAirAnimation} from './katana-native-animation.js';
import {S5RUNTIME_MOTION} from './s5runtime-motion-data.js';
import {COUNTER_DEFINITION} from './counter-sword-data.js';
import {SPY_DAGGER_LOCOMOTION} from './spy-dagger-data.js';
import {BREAKER_LOCOMOTION} from './breaker-combat-data.js';
import {TWIN_BLADE_DEFINITION,TWIN_BLADE_TICKS,TWIN_BLADE_MOVEBOX,twinBladeChargeSample} from './twin-blade-data.js';
import {BAT_DEFINITION,BAT_ABILITY} from './bat-data.js';
import {batInputTransition} from './bat-input.js';
import {IRON_BOOTS_DEFINITION,IRON_BOOTS_TICKS,IRON_BOOTS_MOVEBOX} from './iron-boots-data.js';
import {ironBootsBoostInputTransition} from './iron-boots-native-input.js';
import {SIGMA_BLADE_DEFINITION,SIGMA_BLADE_TRANSFORMED_DEFINITION,getSigmaBladeAttackProfile} from './sigma-blade-data.js';
import {SIGMA_BLADE_TICKS,SIGMA_BLADE_MOVEBOX} from './sigma-blade-motion-data.js';
import {sigmaBladeInputTransition} from './sigma-blade-input.js';
import {VITAL_SHOCK_DEFINITION,VITAL_SHOCK_ATTACK_LOWER,VITAL_SHOCK_TICKS,VITAL_SHOCK_MOVEBOX} from './vital-shock-data.js';
import {vitalShockInputTransition} from './vital-shock-input.js';
import {DEMONIC_KNUCKLE_DEFINITION,DEMONIC_KNUCKLE_ABILITY,demonicKnuckleAttackProfile} from './demonic-knuckle-data.js';
import {DEMONIC_KNUCKLE_TICKS,DEMONIC_KNUCKLE_MOVEBOX} from './demonic-knuckle-motion-data.js';
import {advanceDemonicKnuckleLight} from './demonic-knuckle-moving-state.js';
import {nativeAttackLowerWalkSpeed} from './native-lower-animation-speed.js';
import {nativeRequestedAnimationSpeed} from './native-animation-duration-speed.js';
import {DEATH_SCYTHE_DEFINITION,DEATH_SCYTHE_LOCOMOTION,DEATH_SCYTHE_TICKS,DEATH_SCYTHE_MOVEBOX,deathScytheStateParameters} from './death-scythe-data.js';
import {deathScytheInputTransition} from './death-scythe-input.js';
import {createDeathScytheUppercut,advanceDeathScytheUppercut} from './death-scythe-uppercut.js';
import {createDeathScytheSecondImpact,consumeDeathScytheSecondImpact} from './death-scythe-second-impact.js';
import {createDeathScytheSpecialState,advanceDeathScytheSpecialState,sampleDeathScytheSpecialState} from './death-scythe-special-state.js';
import {BAT_TICKS,BAT_MOVEBOX} from './bat-motion-data.js';
import {ASSASSIN_CLAW_DEFINITION,ASSASSIN_CLAW_TICKS,ASSASSIN_CLAW_MOVEBOX,ASSASSIN_CLAW_ATTACK_LOWER} from './assassin-claw-data.js';
import {emitMeleeActivation} from './melee-activations.js';
import {twinBladeLightTransition} from './twin-blade-input.js';
import {advanceMeleeClock} from './native-melee.js';
import {fittedClipSpeed} from './spy-dagger-timing.js';
import {sampleMoveBox,SCN_SCENE_SCALE} from './root-motion.js';
import {BREAKER_MOVEBOX} from './breaker-movebox-data.js';
import {KATANA_RUN,KATANA_RUN_LOWER,KATANA_CLIP_TICKS,KATANA_MOVEBOX} from './katana-data.js';
import {PLASMA_IDLE,PLASMA_RUN,PLASMA_RUN_LOWER} from './plasma-locomotion-data.js';
import {sigmaBladeLowerWalkSpeed} from './sigma-blade-lower-motion.js';

// Melee branches in script/attack/weapon_{plasma,counter}sword_attack.lua.
// The training target still uses the arena's simplified contact test.
export const MELEE={
 demonicknuckle:DEMONIC_KNUCKLE_DEFINITION,
 deathscythe:DEATH_SCYTHE_DEFINITION,
 vitalshock:VITAL_SHOCK_DEFINITION,
 sigmablade:SIGMA_BLADE_DEFINITION,
 ironboots:IRON_BOOTS_DEFINITION,
 bat:BAT_DEFINITION,
 assassinclaw:ASSASSIN_CLAW_DEFINITION,
 twinblade:TWIN_BLADE_DEFINITION,
 // Classic Katana A Sword, item 2000018. These windows are taken from
 // weapon_katana_a_sword.lua. Native combo timing/effects remain under review.
 katana:{idle:'KT004',run:KATANA_RUN,runLower:KATANA_RUN_LOWER,
  light:[
   {clip:'KT000',recoveryClip:'KT025',actionMs:350,recoveryMs:350,hits:[225],moveRate:2},
   // AfterDash2/3: MoveBox replaces keyboard travel, but mouse heading stays free.
   {clip:'KT001',recoveryClip:'KT026',actionMs:800,recoveryMs:800,hits:[300,700],locked:true,multiplier:1,allowMouseRotation:true,animationSpeed:1,recoveryAnimationSpeed:1},
   {clip:'KT002',recoveryClip:'KT027',actionMs:500,recoveryMs:500,hits:[350],locked:true,multiplier:1,allowMouseRotation:true,animationSpeed:1,recoveryAnimationSpeed:1},
  ],
  strong:{clip:'KT009',recoveryClip:'KT010',actionMs:500,recoveryMs:550,hits:[300],locked:true,multiplier:1,allowMouseRotation:true,animationSpeed:1,recoveryAnimationSpeed:1},
  // JumpDash: SetDrop's 1 ms is NOT the 200 ms contact delay. SetDelayDrop
  // replaces the forward impulse with a faster vertical fall during recovery.
  air:{clip:'KT029',recoveryClip:'KT033',actionMs:400,minimumMs:40,recoveryMs:450,hits:[200,300,650],locked:true,dropMs:1,dropVector:[0,-1000,-3000],delayDropMs:1,delayDropVector:[0,-5000,0],animationSpeed:1,recoveryAnimationSpeed:1},
  // StandardKatana_A_SwordAttack2BackDash/Charge/Dash, CHANNEL_MELEE.
  // CAttackStateEx requests300ms; native fit consumes the named clip with
  // the same clock as its MoveBox. Lua speed1 is a factor before fitting.
  backdash:{clip:'KT006_1',actionMs:300,hits:[],locked:true,multiplier:1,animationSpeed:1},
  charge:{clip:'KT006_2',actionMs:1000,minimumChargeMs:40,hits:[],locked:true,persistentCharge:true,animationSpeed:1},
  heavy:{clip:'KT007',recoveryClip:'KT008',actionMs:700,minimumMs:40,recoveryMs:900,hits:[250,400],strictHits:true,locked:true,multiplier:1,animationSpeed:1,allowMouseRotation:true}},
 plasma:{idle:PLASMA_IDLE,run:PLASMA_RUN,runLower:PLASMA_RUN_LOWER,
  // State lifetimes measured in capture-20260923-192932; preserve the source
  // animation fit separately from the state exit timer.
  // The moving-state factory requests500ms; Lua's600 is an animation
  // duration override. B77CB0 therefore uses speed600/500, independently
  // of the natural clip length and of input admission between strikes.
  light:['A0002','A0003','A0004'].map(clip=>({clip,clipMs:600,actionMs:500,nativeRequestedAnimationDurationMs:500,nativeAnimationDurationOverrideMs:600,hits:[200],moveRate:.8})),
  // plasmasword2/3: A0000 playback speed is .9 for STRONG and STRONG1;
  // state lifetime stays ~1000 ms, independent of the full 1500 ms asset.
  strong:{clip:'A0000',clipMs:900,animationSpeed:.9,actionMs:1000,hits:[400],moveRate:.8,lowerBeginMs:500},
  // STRONG1 after an aerial strike or rush uses CAttackState, unlike the ordinary
  // strong's freely moving sword state. Its empty delay animation keeps pose.
  strongFollow:{clip:'A0000',clipMs:900,animationSpeed:.9,actionMs:1000,recoveryMs:40,holdRecovery:true,hits:[400],locked:true},
  heavy:{clip:'B0000',recoveryClip:'B0001',actionMs:750,recoveryMs:1250,hits:[200,266,332,400,450,500],multiplier:2,locked:true},
  // CAttackState13B1E88 takes the SetDrop branch before evaluating recovery
  // on its next tick. Preserve that physical step before the phase1 reset.
  // SetAnim b77990 stores its FIRST numeric argument at+4c (duration).
  // The third goes to+3c (outgoing blend padding), not playback duration.
  air:{clip:'A0018',recoveryClip:'A0019',actionMs:400,recoveryMs:1000,hits:[500],locked:true,dropMs:400,dropVector:[0,-50000,0],dropBeforeRecovery:true,resetVelocityOnRecovery:true,
   animationSpeed:.85,recoveryAnimationSpeed:1,nativeRequestedAnimationDurationMs:400,nativeAnimationDurationOverrideMs:300,nativeRecoveryRequestedAnimationDurationMs:1000,nativeRecoveryAnimationDurationOverrideMs:1000}},
 counter:COUNTER_DEFINITION,
 // actorstates_normalstates.lua NormalState_Breaker, actorstates_runstates.lua
 // RunState_Breaker. HM006/SG018–025 belong to charge, NOT locomotion.
 // Native left/right mapped into the same presentation convention as Plasma.
 breaker:{idle:BREAKER_LOCOMOTION.idle,run:BREAKER_LOCOMOTION.run,
  runLower:BREAKER_LOCOMOTION.runLower,
  light:[{clip:'HM001',recoveryClip:'HM002',actionMs:600,minimumMs:40,recoveryMs:500,hits:[200],strictHits:true,multiplier:1,locked:true}],
  strong:{clip:'HM001',recoveryClip:'HM002',actionMs:600,minimumMs:40,recoveryMs:500,hits:[200],strictHits:true,multiplier:1,locked:true},
  air:{clip:'HM016',recoveryClip:'HM017',animationSpeed:.85,actionMs:300,minimumMs:40,recoveryMs:600,hits:[250],strictHits:true,locked:true,dropMs:200,dropVector:[0,-20000,0]},
  // Controller right entry traverses the two observed40ms charge facades.
  // Raw externally constructed charge objects retain the release fallback.
  charge:{clip:'HM006',actionMs:2500,hits:[],locked:true,chargeApproximation:true},
  heavy:{clip:'HM004',recoveryClip:'HM005',actionMs:800,minimumMs:40,recoveryMs:1000,hits:[500],strictHits:true,multiplier:1,locked:true,dropMs:400,dropVector:[0,-10000,0]}},
};
MELEE.katana.light=MELEE.katana.light.map(katanaNativeGroundAnimation);
MELEE.katana.strong=katanaNativeGroundAnimation(MELEE.katana.strong);
MELEE.katana.backdash=katanaNativeBackdashAnimation(MELEE.katana.backdash);
MELEE.katana.heavy=katanaNativeReleaseAnimation(MELEE.katana.heavy);
MELEE.katana.charge=katanaNativeStandingChargeAnimation(MELEE.katana.charge);
MELEE.katana.air=katanaNativeAirAnimation(MELEE.katana.air);
const directions=['front','rightFront','right','rightBack','back','leftBack','left','leftFront'];
const BREAKER_TICKS={HM001:3200,HM002:3200,HM004:6400,HM005:6400,HM006:12000,HM007:8000,HM016:1520,HM017:4880};
const durationTicks=(sex,clip,weapon)=>({demonicknuckle:DEMONIC_KNUCKLE_TICKS,deathscythe:DEATH_SCYTHE_TICKS,vitalshock:VITAL_SHOCK_TICKS,sigmablade:SIGMA_BLADE_TICKS,ironboots:IRON_BOOTS_TICKS,twinblade:TWIN_BLADE_TICKS,bat:BAT_TICKS,assassinclaw:ASSASSIN_CLAW_TICKS}[weapon]?.[sex]?.[clip])||KATANA_CLIP_TICKS[sex]?.[clip]||S5RUNTIME_MOTION[sex].durations[clip]||BREAKER_TICKS[clip];
export function meleeDefinition(weapon,transformed=false,sex='male'){
 if(weapon==='deathscythe')return {...DEATH_SCYTHE_DEFINITION,idle:DEATH_SCYTHE_LOCOMOTION.idleBySex[sex]};
 return weapon==='sigmablade'&&transformed?SIGMA_BLADE_TRANSFORMED_DEFINITION:MELEE[weapon];
}
// GetLowerPartStateSet(0), converted from source left/right to the imported
// rig's presentation directions, including both forward/back diagonal pairs.
const LOWER_PARTS={
 plasma:{idle:'A0024',walk:['E0008','E0009','E0010','E0014','E0013','E0015','E0012','E0011']},
 counter:{idle:'R0005',walk:['R0008','R0009','R0010','R0014','R0013','R0015','R0012','R0011']},
};
export function meleeLowerSample(attack,direction,moving,controller){
 if(attack.sigmaAirLowerPose)return {...attack.sigmaAirLowerPose};
 if(attack.demonicLight?.phase===1){
  // Ground command62b710 selects from actor input, including when a wall
  // blocks translation. A residual physical velocity does not select a walk.
  const intent=controller?.moveIntent;
  if(intent){
   moving=intent.x!==0||intent.z!==0;
   const facing=controller.facing,forward=intent.x*Math.sin(facing)+intent.z*Math.cos(facing),side=-intent.x*Math.cos(facing)+intent.z*Math.sin(facing);
   direction=directions[(Math.round(Math.atan2(side,forward)/(Math.PI/4))+8)%8];
  }
  return {lower:moving?attack.profile.lowerWalk[directions.indexOf(direction)]:attack.profile.lowerIdle,lowerSpeed:moving?nativeAttackLowerWalkSpeed({attackMoveSpeedRate:DEMONIC_KNUCKLE_ABILITY.attackMoveSpeedRate,moveFactor:controller?.modeModifiers?.moveFactor??1}):1};
 }
 if(attack.demonicLight)return null;
 if(attack.weapon==='vitalshock'&&VITAL_SHOCK_ATTACK_LOWER.kinds.includes(attack.kind))return {lower:moving?VITAL_SHOCK_ATTACK_LOWER.run[directions.indexOf(direction)]:VITAL_SHOCK_ATTACK_LOWER.normal,lowerSpeed:1};
 if(attack.weapon==='assassinclaw')return {lower:moving?ASSASSIN_CLAW_ATTACK_LOWER.run[directions.indexOf(direction)]:ASSASSIN_CLAW_ATTACK_LOWER.normal,lowerSpeed:1};
 if(attack.weapon==='twinblade'&&attack.kind==='charge')return moving?{lower:attack.profile.chargeWalk[directions.indexOf(direction)],lowerSpeed:1}:null;
 const set=LOWER_PARTS[attack.weapon]||(attack.profile.lowerIdle?{idle:attack.profile.lowerIdle,walk:attack.profile.lowerWalk}:null);
 // CSwordAtkState changes its animation phase only after the strict timer
 // comparison; the existing lower movement can tick before this visual change.
 const delay=attack.profile.lowerBeginMs||0;
 // Lower channel changes to 00001 on Space while the torso keeps attacking.
 // STRONG's scheduled change at 500 ms supersedes an earlier jump animation
 // (capture 2, 1.990 -> 2.190 s), even while the physical jump continues.
 const lowerJump=attack.lowerJump;
 if(lowerJump&&!controller?.grounded&&(!delay||attack.timeMs<=delay||lowerJump.startMs>delay))
  return {lower:controller?.velocity.y>0?'00001':'00002',lowerSpeed:controller?.velocity.y>0?11/14:1};
 if(!set||attack.locked||(delay>0&&attack.timeMs<=delay))return null;
 if(attack.weapon==='bat'&&['light','strong'].includes(attack.kind)){
  // Same CAttackMovingState ground child as Demonic: select the command
  // from actor input and use attack ability speed, not physical moveRate.8.
  const intent=controller?.moveIntent;
  if(intent){
   moving=intent.x!==0||intent.z!==0;
   const facing=controller.facing,forward=intent.x*Math.sin(facing)+intent.z*Math.cos(facing),side=-intent.x*Math.cos(facing)+intent.z*Math.sin(facing);
   direction=directions[(Math.round(Math.atan2(side,forward)/(Math.PI/4))+8)%8];
  }
  return {lower:moving?set.walk[directions.indexOf(direction)]:set.idle,lowerSpeed:moving?nativeAttackLowerWalkSpeed({attackMoveSpeedRate:BAT_ABILITY.attackMoveSpeedRate,moveFactor:controller?.modeModifiers?.moveFactor??1}):1};
 }
 const lower=moving?set.walk[directions.indexOf(direction)]:set.idle;
 if(!lower)throw Error('Unknown lower-body direction '+direction);
 return {lower,lowerSpeed:moving?(attack.weapon==='sigmablade'?sigmaBladeLowerWalkSpeed(controller?.modeModifiers?.moveFactor??1):fittedClipSpeed(S5RUNTIME_MOTION[attack.sex].durations[lower],800)):1};
}
export function weaponRunClip(weapon,direction,transformed=false){return weapon==='dagger'?SPY_DAGGER_LOCOMOTION.run[direction]:meleeDefinition(weapon,transformed)?.run[directions.indexOf(direction)];}
export function weaponRunLowerClip(weapon,direction,transformed=false){return weapon==='dagger'?SPY_DAGGER_LOCOMOTION.runLower[direction]:meleeDefinition(weapon,transformed)?.runLower?.[directions.indexOf(direction)];}
export function createMeleeAttack(weapon,kind,combo,sex,facing,{transformed=false,demonicLight=null,sigmaAirAnimationIndex=0}={}){
 const definition=meleeDefinition(weapon,transformed,sex);if(!definition)throw Error('Unknown melee weapon '+weapon);
 let profile=kind==='light'?definition.light[combo%definition.light.length]:definition[kind];
 if(!profile)throw Error('Missing melee profile '+weapon+' '+kind);
 if(weapon==='sigmablade'&&kind==='air')profile=getSigmaBladeAttackProfile('air',{transformed,airAnimationIndex:sigmaAirAnimationIndex});
 if(weapon==='demonicknuckle')profile={...demonicKnuckleAttackProfile(kind,{hand:demonicLight?.hand??'left'}),animationSpeed:1,recoveryAnimationSpeed:1,moveStopWhenDamage:kind==='heavy',resetVelocityOnRecovery:kind!=='light'};
 if(weapon==='deathscythe')profile={...profile,moveStopWhenDamage:!!deathScytheStateParameters(kind,combo).moveStopWhenDamage};
 // Arena input policy until the native Vital Shock dispatcher is established.
 if(weapon==='vitalshock'&&['rush','strong','strongFollow'].includes(kind))profile={...profile,locked:true,recoveryAnimationSpeed:1,...(kind==='rush'?{multiplier:profile.moveBoxScale}:{})};
 if(weapon==='ironboots')profile={...profile,animationSpeed:profile.nativeAnimationSpeed,recoveryAnimationSpeed:profile.nativeRecoveryAnimationSpeed,suspendVerticalUntilDrop:!!profile.dropVector,
  ...(kind==='strong'?{dropTerminalInRecovery:false}:{} )}; // Arena recovery policy; native restoration still unresolved.
 return {weapon,sex,kind,comboIndex:combo%definition.light.length,profile,...(weapon==='sigmablade'?{transformed}:{}),
  ...(demonicLight?{demonicLight,hand:demonicLight.hand}:{}),
  ...(weapon==='deathscythe'&&kind==='strong'?{scytheSecondImpact:createDeathScytheSecondImpact(),scytheSpecial:createDeathScytheSpecialState({clockMode:'arena-fractional-ms'})}:{}),
  ...(weapon==='deathscythe'&&kind==='uppercut'?{scytheUppercut:createDeathScytheUppercut()}:{}),
  type:kind==='guard'?'guard':kind==='air'?'air':profile.locked?'rush':'light',
  locked:!!profile.locked,time:0,timeMs:0,hits:0,phase:profile.guard?'guard':'action',phaseTimeMs:0,
  facing,duration:((profile.actionMs||0)+(profile.minimumMs||0)+(profile.recoveryMs||0))/1000};
}
// Captured temporal input handlers and weapon-indexed destinations:
// outputs/analyse-s5runtime/physique-native/{tables-entrees,destinations}-attaques.json.
// These delays use the whole state clock, including recovery.
export function meleeTransition(attack,input,dtMs){
 if(attack.weapon==='ironboots'&&attack.kind==='boost')return ironBootsBoostInputTransition(attack,input);
 if(attack.weapon==='demonicknuckle')return null; // No unused light2 combo inferred.
 if(attack.weapon==='deathscythe')return deathScytheInputTransition(attack,input,dtMs);
 if(attack.weapon==='vitalshock')return vitalShockInputTransition(attack,input,dtMs);
 if(attack.weapon==='sigmablade')return sigmaBladeInputTransition(attack,input,dtMs);
 if(attack.weapon==='bat')return batInputTransition(attack,input,dtMs);
 const short=input.lightShort??input.light,long=!!input.lightLong;
 // ATTACK_2_PLASMA_SWORD inputs 7/8 use direct handler 0x13A8454:
 // submit STRONG1 on the input tick, without the aerial state's delay.
 if(attack.secondaryChargeStage&&attack.kind==='charge'&&attack.timeMs+dtMs>40)
  return attack.secondaryChargeStage===1?{kind:'charge',combo:0,secondaryChargeStage:2}:{kind:'heavy',combo:0,chargeMs:attack.timeMs};
 if(attack.dodgeSecondaryCharge&&attack.kind==='charge'&&attack.timeMs+dtMs>40)
  // Right's native InitLua(40,...,true,3) enters the charge facade, then
  // automatically leaves it in the air even while held (both rigs captured).
  // Raw charge objects without a Controller entry stage keep the release fallback.
  return {kind:'heavy',combo:0,chargeMs:attack.timeMs};
 if(attack.weapon==='breaker'&&attack.kind==='charge'&&input.heavyReleased)return {kind:'heavy',combo:0};
 // Air/charge routes remain experimental; light short follows native ranges.
 if(attack.weapon==='twinblade'){
  if(attack.kind==='air'&&input.heavy)return {kind:'heavy',combo:0};
  if(attack.kind==='charge'&&(input.heavyReleased||!input.heavyHeld))return {kind:'heavy',combo:0,chargeMs:attack.timeMs,fullCharge:attack.timeMs>=2000};
  const transition=twinBladeLightTransition(attack,input,dtMs);if(transition)return transition;
 }
 if(attack.weapon==='ironboots'&&attack.kind==='light'&&attack.comboIndex<2&&short)
  attack.queuedMelee={kind:'light',combo:attack.comboIndex+1,afterMs:attack.profile.actionMs};
 if(attack.weapon==='katana'){
  if(attack.kind==='backdash'&&attack.timeMs+dtMs>attack.profile.actionMs)return {kind:'charge',combo:0};
  // Standing phase5: event11 sets+4c7; mode3 in59d3d0 requests+448
  // without testing InitLua40 (+240). Other input phases/SP remain open.
  if(attack.kind==='charge'&&(input.heavyReleased||!input.heavyHeld))
   // AttackEx InitLua's final900 is stored as float at+3c4.5ebae0
   // compares charge elapsed>=that threshold; InputSecond1000 is separate.
   return {kind:'heavy',combo:0,chargeMs:attack.timeMs,fullCharge:Math.fround(attack.timeMs)>=MELEE.katana.heavy.nativeFullChargeThresholdMs};
 }
 if(attack.weapon==='katana'&&attack.kind==='light'&&attack.comboIndex<2&&short)
  attack.queuedMelee={kind:'light',combo:attack.comboIndex+1,afterMs:attack.profile.actionMs};
 if(attack.weapon==='plasma'&&attack.kind==='heavy'&&(short||long))return {kind:'strongFollow',combo:0};
 let request;
 // Native AFTERDASH4_DOUBLE / AFTERDASH3_BREAKER bind input4 (held
 // primary), not only classified7/8. Both buffer WEAK until strict>1200.
 if(['twinblade','breaker'].includes(attack.weapon)&&attack.kind==='heavy'&&input.light)
  request={kind:'light',combo:0,afterMs:1200};
 else if(attack.weapon==='counter'&&(short||long)){
  if(attack.kind==='light'&&attack.comboIndex<3)request={kind:long?'heavy':'light',combo:attack.comboIndex+1,afterMs:650};
  else if(attack.kind==='heavy')request={kind:'light',combo:0,afterMs:800};
  else if(attack.kind==='air')request={kind:'heavy',combo:0,afterMs:700};
 }else if(attack.weapon==='plasma'&&attack.kind==='air'){
  if(short||long)request={kind:'strongFollow',combo:0,afterMs:1000};
  if(input.heavyHeld??input.heavy)request={kind:'heavy',combo:0,afterMs:1200};
 }
 if(request)attack.queuedMelee=request;
 const queued=attack.queuedMelee;
 return queued&&attack.timeMs+dtMs>queued.afterMs?queued:null;
}
export function advanceMeleeAttack(attack,dtMs,input,events){
 if(attack.scytheUppercut){
  attack.previousTimeMs=attack.timeMs;attack.previousPhase=attack.phase;attack.previousPhaseTimeMs=attack.phaseTimeMs;
  const sample=advanceDeathScytheUppercut(attack.scytheUppercut,dtMs,{grounded:!!attack.scytheUppercutGrounded});
  attack.timeMs+=dtMs;attack.time=attack.timeMs/1000;attack.phase=sample.phase;attack.phaseTimeMs=sample.phaseTimeMs;
  return sample.complete;
 }
 if(attack.demonicLight){
  attack.previousTimeMs=attack.timeMs;attack.previousPhaseTimeMs=attack.phaseTimeMs;attack.previousPhase=attack.phase;
  const tick=advanceDemonicKnuckleLight(attack.demonicLight,dtMs);
  attack.timeMs=tick.elapsedMs;attack.time=attack.timeMs/1000;attack.phaseTimeMs=attack.timeMs;
  while(attack.hits<attack.profile.hits.length&&attack.timeMs>attack.profile.hits[attack.hits]){
   const index=attack.hits++;emitMeleeActivation(events,attack,index,attack.profile.hits[index]);
  }
  return tick.exitRequested;
 }
 if(attack.scytheSpecial){
  // The native callback runs before the state clock advances. Its contacts
  // have their own origin; finish animation starts on the later phase switch.
  const callback=consumeDeathScytheSecondImpact(attack.scytheSecondImpact,attack.timeMs);
  if(callback){
   const child=createMeleeAttack('deathscythe','strongFollow',0,attack.sex,attack.facing);
   child.scytheParent=attack;child.originMs=callback.originMs;attack.scytheCallbackAttack=child;
  }
  attack.previousTimeMs=attack.timeMs;attack.previousPhaseTimeMs=attack.phaseTimeMs;attack.previousPhase=attack.phase;
  attack.timeMs+=dtMs;attack.time=attack.timeMs/1000;
  while(attack.hits<attack.profile.hits.length&&attack.timeMs>attack.profile.hits[attack.hits]){
   const index=attack.hits++;emitMeleeActivation(events,attack,index,attack.profile.hits[index]);
  }
  const child=attack.scytheCallbackAttack;
  if(child){
   child.previousTimeMs=child.timeMs;child.timeMs=attack.timeMs-child.originMs;child.time=child.timeMs/1000;
   while(child.hits<child.profile.hits.length&&child.timeMs>child.profile.hits[child.hits]){
    const index=child.hits++;emitMeleeActivation(events,child,index,child.originMs+child.profile.hits[index]);
   }
  }
  const sample=advanceDeathScytheSpecialState(attack.scytheSpecial,dtMs,{secondImpact:attack.scytheSecondImpact});
  attack.scytheSpecialSample=sample;attack.phase=sample.phase;attack.phaseTimeMs=sample.phaseTimeMs;
  return sample.exitRequested;
 }
 const p=attack.profile;attack.previousTimeMs=attack.timeMs;attack.previousPhaseTimeMs=attack.phaseTimeMs;
 attack.previousPhase=attack.phase;attack.timeMs+=dtMs;attack.time=attack.timeMs/1000;attack.phaseTimeMs+=dtMs;
 if(p.guard){
  if(attack.phase==='guard'&&!input.heavyHeld){attack.phase='recovery';attack.phaseTimeMs=0;}
  return attack.phase==='recovery'&&attack.phaseTimeMs>S5RUNTIME_MOTION[attack.sex].durations.R0032/4.8;
 }
 if(p.chargeApproximation||p.persistentCharge)return false;
 while(attack.hits<p.hits.length&&(p.strictHits?attack.previousTimeMs<=p.hits[attack.hits]&&attack.timeMs>p.hits[attack.hits]:attack.timeMs>=p.hits[attack.hits])){const index=attack.hits++;emitMeleeActivation(events,attack,index,p.hits[index]);}
 const phases=[{id:'action',durationMs:p.actionMs},
  ...(p.minimumMs?[{id:'minimum',durationMs:p.minimumMs}]:[]),
  ...(p.recoveryMs||p.recoveryPhase?[{id:'recovery',durationMs:p.recoveryMs}]:[])];
 // 5e4020 first advances SetDrop while its OLD clock is <= its limit.
 // Only the following tick takes488f and can enter recovery. Plasma has
 // equal400ms action/drop limits; merging these branches erased its descent.
 if(p.dropBeforeRecovery&&attack.previousPhase==='action'&&attack.previousTimeMs<=p.dropMs)return false;
 const clock=advanceMeleeClock({timeMs:attack.previousTimeMs,phaseTimeMs:attack.previousPhaseTimeMs,
  phaseIndex:phases.findIndex(phase=>phase.id===attack.previousPhase)},dtMs,phases);
 attack.phase=clock.phase;attack.phaseTimeMs=clock.phaseTimeMs;
 return clock.complete;
}
function requestedPhaseAnimationSpeed(attack,recovery,ticks,playbackSpeed){
 const p=attack.profile,requestedMs=recovery?p.nativeRecoveryRequestedAnimationDurationMs:p.nativeRequestedAnimationDurationMs;
 if(requestedMs===undefined)return playbackSpeed;
 return nativeRequestedAnimationSpeed({durationTicks:ticks,requestedMs,luaAnimationSpeed:playbackSpeed??(recovery?p.nativeRecoveryAnimationSpeed:p.nativeAnimationSpeed)??1,
  durationOverrideMs:(recovery?p.nativeRecoveryAnimationDurationOverrideMs:p.nativeAnimationDurationOverrideMs)??0});
}
export function meleeClipSample(attack){
 if(attack.scytheSpecial){const sample=sampleDeathScytheSpecialState(attack.scytheSpecial);return {clip:sample.clip,time:sample.phaseTimeMs/1000,loop:false};}
 if(attack.weapon==='twinblade'&&attack.kind==='charge')return twinBladeChargeSample(attack.secondaryChargeStage===2?{...attack,kind:'gather'}:attack);
 const p=attack.profile;
 // Native default AnimParam has an empty name (+18=0). Apply b77cb0
 // returns before changing the channel. Its existing clip keeps playing;
 // the state clock still enters recovery, including when its duration is0.
 if(attack.phase==='recovery'&&p.preserveActionAnimationInRecovery)
  return meleeClipSample({...attack,phase:'action',phaseTimeMs:attack.timeMs});
 const recovery=attack.phase==='recovery',hold=recovery&&p.holdRecovery,clip=recovery&&!hold?p.recoveryClip:p.clip;
 const actionWindow=p.actionMs+(p.minimumMs||0);
 const requested=p.guard?0:hold?p.clipMs:recovery?p.recoveryMs:(p.clipMs??actionWindow);
 const ticks=durationTicks(attack.sex,clip,attack.weapon);
 if(!ticks)throw Error(`Missing ${attack.sex} clip ${clip}`);
 const phaseCursor=attack.phase==='minimum'?p.actionMs+attack.phaseTimeMs:attack.phaseTimeMs;
 const playbackSpeed=requestedPhaseAnimationSpeed(attack,recovery&&!hold,ticks,recovery&&!hold?p.recoveryAnimationSpeed:p.animationSpeed);
 if(playbackSpeed!==undefined)return {clip,time:(hold?p.actionMs:phaseCursor)/1000*playbackSpeed,loop:!!p.loop};
 const timeMs=hold?p.clipMs:p.clipMs?Math.min(phaseCursor,p.clipMs):phaseCursor;
 return {clip,time:timeMs/1000*fittedClipSpeed(ticks,attack.phase==='minimum'?actionWindow:requested),loop:attack.phase==='guard'||!!p.chargeApproximation};
}
export function meleeRootDelta(attack){
 const movement=attack.scytheSpecialSample?.movement;
 const p=attack.profile,phase=attack.previousPhase,continued=phase==='recovery'&&p.preserveActionAnimationInRecovery,clip=movement?.clip??(phase==='recovery'&&!continued?p.recoveryClip:p.clip),phaseMs=continued?p.actionMs+p.recoveryMs:phase==='recovery'?p.recoveryMs:p.actionMs,curve=({demonicknuckle:DEMONIC_KNUCKLE_MOVEBOX,deathscythe:DEATH_SCYTHE_MOVEBOX,vitalshock:VITAL_SHOCK_MOVEBOX,sigmablade:SIGMA_BLADE_MOVEBOX,ironboots:IRON_BOOTS_MOVEBOX}[attack.weapon]?.[attack.sex]?.[clip])||TWIN_BLADE_MOVEBOX[attack.sex]?.[clip]||S5RUNTIME_MOTION[attack.sex].curves[clip]||BREAKER_MOVEBOX[attack.sex]?.[clip]||KATANA_MOVEBOX[attack.sex]?.[clip];
 if((['demonicknuckle','vitalshock','deathscythe','sigmablade'].includes(attack.weapon)&&!curve?.positions?.length)||!curve||!p.multiplier||(!movement&&!['action','recovery'].includes(phase)))return {x:0,y:0,z:0};
 const playbackSpeed=movement?.animationSpeed??requestedPhaseAnimationSpeed(attack,phase==='recovery'&&!continued,durationTicks(attack.sex,clip,attack.weapon),phase==='recovery'&&!continued?p.recoveryAnimationSpeed:p.animationSpeed);
 const speed=playbackSpeed??fittedClipSpeed(durationTicks(attack.sex,clip,attack.weapon),phaseMs);
 const fromMs=continued?attack.previousTimeMs:attack.previousPhaseTimeMs;
 const a=sampleMoveBox((movement?.fromMs??fromMs)*speed,curve);
 const b=sampleMoveBox((movement?.toMs??Math.min(phaseMs,fromMs+(attack.timeMs-attack.previousTimeMs)))*speed,curve);
 const x=(b.x-a.x)*SCN_SCENE_SCALE*p.multiplier,z=(b.z-a.z)*SCN_SCENE_SCALE*p.multiplier,angle=attack.facing+Math.PI;
 return {x:x*Math.cos(angle)+z*Math.sin(angle),y:0,z:-x*Math.sin(angle)+z*Math.cos(angle)};
}

// SetDrop transforms source-local -Z into actor forward at activation.
export function meleeDropVelocity(attack,facing){
 const v=attack.delayDropApplied?attack.profile?.delayDropVector:attack.profile?.dropVector;if(!v)return null;
 const sin=Math.sin(facing),cos=Math.cos(facing),[x,y,z]=v;
 return {x:(-x*cos-z*sin)*SCN_SCENE_SCALE,y:y*SCN_SCENE_SCALE,z:(x*sin-z*cos)*SCN_SCENE_SCALE};
}
