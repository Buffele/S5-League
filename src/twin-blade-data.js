// Current archive declarations, CRC/SHA proofs and exact Lua bodies:
// work/melee-batch-2/twin-blade/{source-manifest,source-contract}.json.
import {TWIN_BLADE_TICKS,TWIN_BLADE_MOVEBOX} from './twin-blade-motion-data.js';
export {TWIN_BLADE_TICKS,TWIN_BLADE_MOVEBOX};
export const TWIN_BLADE_ABILITY=Object.freeze({itemKey:2000010,nativeType:26,power:15,range:500,moveSpeedRate:1.1,attackMoveSpeedRate:1,chargePowerRate:3});
export const TWIN_BLADE_DIRECTIONS=Object.freeze(['front','rightFront','right','rightBack','back','leftBack','left','leftFront']);
export const TWIN_BLADE_SOURCE_RUN=Object.freeze({front:'SG004',leftFront:'SG005',left:'SG006',leftBack:'SG010',rightFront:'SG007',right:'SG008',rightBack:'SG011',back:'SG009'});
export const TWIN_BLADE_SOURCE_LOWER=Object.freeze({front:'00008',leftFront:'00009',left:'00010',leftBack:'00014',rightFront:'00011',right:'00012',rightBack:'00015',back:'00013'});
export const TWIN_BLADE_SOURCE_CHARGE_LOWER=Object.freeze({front:'SG018',leftFront:'SG019',left:'SG020',leftBack:'SG024',rightFront:'SG021',right:'SG022',rightBack:'SG025',back:'SG023'});
// Same source-to-presentation boundary as current Counter's standard leg clips.
// This mapping still requires Twin-specific visual checks in the main game.
const presentation={front:'front',rightFront:'leftFront',right:'left',rightBack:'leftBack',back:'back',leftBack:'rightBack',left:'right',leftFront:'rightFront'};
const directionalMapping=source=>Object.freeze(TWIN_BLADE_DIRECTIONS.map(d=>source[presentation[d]]));
export const TWIN_BLADE_RUN=directionalMapping(TWIN_BLADE_SOURCE_RUN);
export const TWIN_BLADE_RUN_LOWER=directionalMapping(TWIN_BLADE_SOURCE_LOWER);
export const TWIN_BLADE_CHARGE_RUN_LOWER=directionalMapping(TWIN_BLADE_SOURCE_CHARGE_LOWER);
const attack=p=>({...p,nativeAnimationSpeed:1,nativeRecoveryAnimationSpeed:1,nativeMinimumSceneUpdateMs:40,strictHits:true});
export const TWIN_BLADE_DEFINITION={
  idle:'SG003',run:TWIN_BLADE_RUN,runLower:TWIN_BLADE_RUN_LOWER,
  light:[
    attack({clip:'SG000',recoveryClip:'SG026',actionMs:800,recoveryMs:150,hits:[100,350],multiplier:1.7,locked:true,moveStopWhenDamage:true,sourceAction:'StandardDoubleSwordAfterDash1'}),
    // Native short-release destination state48: setup810950 ->82cc40.
    // Long-release targets state44; its unconfigured child remains unresolved.
    attack({clip:'SG002',recoveryClip:'SG028',actionMs:800,recoveryMs:300,hits:[50,400],multiplier:1,locked:true,sourceAction:'StandardDoubleSwordAfterDash3'}),
  ],
  air:attack({clip:'SG012',recoveryClip:'SG013',actionMs:600,recoveryMs:600,hits:[210],multiplier:1,locked:true,dropMs:500,dropVector:[0,-10000,0],suspendVerticalUntilDrop:true,resetVelocityOnRecovery:true}),
  heavy:attack({clip:'SG014',recoveryClip:'SG015',actionMs:800,recoveryMs:600,hits:[600],multiplier:1,locked:true,dropMs:400,dropVector:[0,-10000,0],suspendVerticalUntilDrop:true,resetVelocityOnRecovery:true}),
  // SG016 is the declared lower-body stationary charge. Whole-body playback
  // is an explicit fallback if the caller cannot retain the empty upper slot.
  charge:{clip:'SG016',actionMs:40,hits:[],persistentCharge:true,minimumChargeMs:0,moveRate:1,chargeIdle:'SG016',chargeWalk:TWIN_BLADE_CHARGE_RUN_LOWER,chargeApproximation:true},
};
TWIN_BLADE_DEFINITION.strong=TWIN_BLADE_DEFINITION.light[0];

export const TWIN_BLADE_SOURCE_BINDINGS=Object.freeze({
  right_attack:{weapon:'StandardBreakerAfterDash5',animation:'UseWeapon2State_Double',moveRate:1,initLua:[40,0,0,false,true,3],secondInput:[0,0,0,'','']},
  left_attack5:{weapon:'StandardDoubleSwordGatherGuage',animation:'SwordAtkAfterDash5State_DoubleSword',moveRate:.7,initLua:[40,0,0,false,true,2],secondInput:[0,0,0,'R_Hand_Dummy','L_Hand_Dummy']},
  left_attack2:{weapon:'StandardDoubleSwordAfterDash2',animation:'SwordAtkAfterDash2State_DoubleSword',emptyWeaponFunction:true,animationFunctionMissing:true},
});
export const TWIN_BLADE_RESOURCES=Object.freeze({
  weapon:'/assets/s5runtime/twin-blade/model.json',animationDelta:sex=>`/assets/s5runtime/twin-blade/animations/${sex}.json`,
  effects:'/assets/s5runtime/twin-blade/effects-runtime.json',manifest:'/assets/s5runtime/twin-blade/manifest.json',
  sound:name=>`/assets/s5runtime/twin-blade/sounds/${name}.ogg`,
  attachments:[{scene:'model/weapon/twinsword_r.scn',socket:'R_Hand_Dummy',alignment:'Cs_Wea_Dummy'},{scene:'model/weapon/twinsword_l.scn',socket:'L_Hand_Dummy',alignment:'Cs_Wea_Dummy'}],
});
export const TWIN_BLADE_EFFECTS=Object.freeze({
  light:{voice:[5,1],trails:[{name:'GhostTrail_Double_sword_01',beginMs:50,endMs:600},{name:'GhostTrail_Double_sword_02',beginMs:50,endMs:600}],sounds:['twinsword_cut_2','twinsword_cut_3']},
  air:{voice:3,sequences:[{name:'chain_12',beginMs:0,endMs:800}],sound:'twinsword_jump'},
  heavy:{voice:1,sequences:[{name:'skill_doublesword_strike',beginMs:500,endMs:5000},{name:'chain',beginMs:0,endMs:800}],sound:'twinsword_wide'},
  charge:{sequences:['weapon_twinseord_charge','weapon_twinseord_charge_loop'],sounds:['twinsword_charge','twinsword_charge_full'],triggerTimingVerified:false},
});

const box=(anchor,scale,range)=>({type:'box',anchor,direction:[0,0,-1],dimensions:scale.map(v=>v*range)});
function contact(id,atMs,factor,shape,attribute,additionalPower,power,extra={}){
  const critical=attribute==='CRITICAL',light=attribute==='ATTACK1',air=attribute==='JUMPDASH';
  return {id,atMs,powerScale:factor,damage:power*factor+additionalPower,shape,attribute:'ATTACKATTRIB_DOUBLE_SWORD_'+attribute,
    alwaysCritical:critical,dependsOn:null,initAttack2:[1,1,false],counterable:light||air,
    reaction:{sourceDamageData:[critical?0:light?200:air?500:1000,critical||light?'DAMAGEMOVING_ENABLE':'DAMAGEMOVING_DISABLE','DAMAGEBYPART_DISABLE'],sourceGuardData:[critical||light?0:air?500:1000,air?'GUARDCRUSH_DISENABLE':light||critical?'GUARDCRUSH_DISABLE':'GUARDCRUSH_ENABLE']},
    effects:{damageSequence:critical?null:'effects/backattack_sword_s.seq',damageObjectSequence:critical?null:'effects/backattack_sword_s.seq',damageSound:critical?null:'twinHit',nativeDamageSound:critical?null:'sound/spark_hit.ogg',nativeObjectSound:critical?null:'sound/spark_hit.ogg'},
    nativeWeaponType:critical?'WEAPONTYPE_KATANA_A_SWORD':'WEAPONTYPE_DOUBLE_SWORD',...extra};
}
export function getTwinBladeAttackProfile(kind,{comboIndex=0,range=500,power=15,additionalPower=0,fullCharge=false,criticalPolicy='normal-only'}={}){
  if(!Number.isFinite(range)||range<=0||!Number.isFinite(power)||power<0||!Number.isFinite(additionalPower))throw new RangeError('Invalid Twin Blade ability');
  if(!['normal-only','include-declared'].includes(criticalPolicy))throw new RangeError('Unknown critical policy');
  if(!['light','strong','air','heavy','charge','gather'].includes(kind))throw new RangeError('Unknown Twin Blade action');
  if(!Number.isInteger(comboIndex)||comboIndex<0||comboIndex>1)throw new RangeError('Twin Blade exposes only source attacks 1 and 3');
  if(typeof fullCharge!=='boolean')throw new TypeError('fullCharge must be explicit boolean');
  let profile,sourceAction,contacts=[];const c=(...args)=>contact(...args);
  if(kind==='charge'||kind==='gather'){
    const binding=TWIN_BLADE_SOURCE_BINDINGS[kind==='charge'?'right_attack':'left_attack5'];
    return {...TWIN_BLADE_DEFINITION.charge,moveRate:binding.moveRate,weapon:'twinblade',kind,sourceAction:binding.weapon,sourceBinding:binding,hits:[],contacts:[],sourceContacts:[],chargeIdle:kind==='gather'?'SG017':'SG016'};
  }
  if(kind==='light'||kind==='strong'){
    const second=kind==='light'&&comboIndex===1;profile=TWIN_BLADE_DEFINITION.light[second?1:0];sourceAction=profile.sourceAction;
    if(!second)contacts=[c('Attack1',100,.5,box([0,250,-100],[.8,.5,.7],range),'ATTACK1',additionalPower,power),c('Attack2',350,1,box([0,250,-100],[.8,.5,.7],range),'ATTACK1',additionalPower,power)];
    else contacts=[c('Attack1',50,.4,box([0,250,-100],[.8,.5,1],range),'ATTACK3',0,power),c('Attack2',400,.4,box([0,250,200],[.8,.5,1],range),'ATTACK3',0,power,{condition:{type:'push',arguments:[150,2000,-5000]}}),c('Attack3',400,.6,{type:'ray',anchor:[0,250,-100],direction:[0,0,-1],length:range-50},'CRITICAL',additionalPower,power)];
  }else if(kind==='air'){
    profile=TWIN_BLADE_DEFINITION.air;sourceAction='StandardDoubleSwordJumpDash';
    contacts=[c('Attack1',210,1,box([0,0,-100],[.6,1,1.3],range),'JUMPDASH',additionalPower,power,{condition:{type:'blow',arguments:[1500,2000]}})];
  }else{
    profile=TWIN_BLADE_DEFINITION.heavy;sourceAction='StandardDoubleSwordAfterDash4';
    contacts=[c('Attack1',600,.5,box([0,250,-100],[1.2,1,1.2],range),'ATTACK4',additionalPower,power,{fullCharge:false,condition:{type:'blow',arguments:[1400,1000]}}),c('Attack2',600,.5,box([0,300,-100],[1.6,1.4,1.8],range),'ATTACK4',additionalPower,power,{fullCharge:true,condition:{type:'blow',arguments:[1400,1000]}})];
  }
  const eligible=contacts.filter(c=>(c.fullCharge===undefined||c.fullCharge===fullCharge)&&(criticalPolicy==='include-declared'||!c.alwaysCritical));
  return {...profile,weapon:'twinblade',kind,comboIndex,sourceAction,sourceContacts:contacts,contacts:eligible.map((c,index)=>({...c,index})),hits:eligible.map(c=>c.atMs),fullCharge,criticalPolicy,power,range,
    hitStop:kind==='air'?[210,310]:kind==='heavy'?[600,700]:comboIndex===1?[510,610]:[300,500],
    source:'script/weapon_doublesword.lua',nativeFullChargeThresholdMs:kind==='heavy'?2000:null,
    // Charge magnitude is not inferred from catalog chargePowerRate=3.
    damageMeaning:'InitAttack1 expression only; no mitigation or critical multiplier'};
}
export const getTwinBladeContacts=(kind,options)=>getTwinBladeAttackProfile(kind,options).contacts;
// SG016 carries authored arm/torso tracks as well as the declared stationary
// lower pose. Using SG003 at time zero discarded that charge gesture entirely.
// Whole-body SG016 is an explicit presentation reconstruction: the source's
// empty upper parameter does not explain how native lower playback owns arms.
export function twinBladeChargeSample(attack){
  const sex=attack.sex??'male',clip=attack.kind==='gather'?'SG017':'SG016';
  const seconds=(attack.timeMs??0)/1000;
  return {clip,time:attack.kind==='gather'?seconds:Math.min(seconds,TWIN_BLADE_TICKS[sex][clip]/4800),loop:attack.kind==='gather',speed:1};
}
export function twinBladeLocomotionPose(direction='front',moving=false){
  const index=TWIN_BLADE_DIRECTIONS.indexOf(direction);if(index<0)throw new RangeError('Unknown Twin Blade direction');
  return {clip:moving?TWIN_BLADE_RUN[index]:'SG003',...(moving?{lower:TWIN_BLADE_RUN_LOWER[index]}:{}),loop:true,speed:1,fade:1000/4800,restartKey:0};
}
export function twinBladeAttackPose(attack,{sex='male',direction='front',moving=false}={}){
  if(!TWIN_BLADE_TICKS[sex])throw new RangeError('Unknown rig');
  const p=attack.profile??getTwinBladeAttackProfile(attack.kind,{comboIndex:attack.comboIndex??0}),recovery=attack.phase==='recovery';
  if(attack.kind==='charge'||attack.kind==='gather'){
    const i=TWIN_BLADE_DIRECTIONS.indexOf(direction);if(i<0)throw new RangeError('Unknown direction');
    return {...twinBladeChargeSample(attack),...(moving?{lower:TWIN_BLADE_CHARGE_RUN_LOWER[i],lowerLoop:true}:{}),fade:500/4800};
  }
  const clip=recovery?p.recoveryClip:p.clip;
  return {clip,time:(attack.phaseTimeMs??0)/1000,loop:false,speed:1,fade:(attack.kind==='air'?50:recovery?1000:200)/4800,nextFadePadding:attack.kind==='air'?0:recovery?1000/4800:0,nativeDurationTicks:TWIN_BLADE_TICKS[sex][clip],timingLimit:'Source speed 1; requested-duration fitting is not native-verified'};
}
export const TWIN_BLADE_UNCERTAINTIES=Object.freeze([
  'Attack1 short-release -> Attack3 is native: early0..750 dispatch strictly after750, late751..uint32max immediate. Native long-release requests are exposed for state44; its real Twin child has no explicit Lua setup and visible behavior remains unresolved.',
  'Right attack actually binds StandardBreakerAfterDash5(moveRate1,mode3); GatherGuage(.7,mode2) is left_attack5. They are not interchangeable.',
  'Charge upper animation slot is empty; full SG016 presentation restores authored arms but native ownership of lower tracks remains unverified. Charge SP, threshold routing and power multiplier remain unverified.',
  'InitLua third argument40 is preserved as scene-update interval; no unsupported extra phase is inserted.',
  'Critical ray is retained in sourceContacts and excluded by default: native MAKERAY, victim calibration and critical multiplier remain unresolved.',
  'Attack3 two normal contacts omit AdditionalPower; AddtionalPower misspelling is retained as a binding uncertainty.',
  'Full-charge/ordinary heavy volumes are alternatives selected by explicit fullCharge; native SetFullCharge gate and charge damage scaling remain to verify.',
  'JUMPDASH uses literal GUARDCRUSH_DISENABLE; its constant value is not silently changed to ENABLE or DISABLE.',
  'Main-game attachment and contacts were observed in the initial lot; comparison against native eight-direction presentation, effects and animation fitting remains unverified.',
]);
