// Classic Breaker item2000013, current copied XS sources authenticated in
// work/melee-batch-2/breaker/source-contract.json (2026-10-03).
export const BREAKER_ABILITY=Object.freeze({itemKey:2000013,nativeType:33,power:24,range:500,moveSpeedRate:1,attackMoveSpeedRate:.95,chargePowerRate:2});
const sourceUpper={front:'HM008',leftFront:'HM009',left:'HM010',leftBack:'HM014',rightFront:'HM011',right:'HM012',rightBack:'HM015',back:'HM013'};
const sourceLower={front:'00008',leftFront:'00009',left:'00010',leftBack:'00014',rightFront:'00011',right:'00012',rightBack:'00015',back:'00013'};
const presentationOrder=['front','leftFront','left','leftBack','back','rightBack','right','rightFront'];
export const BREAKER_LOCOMOTION=Object.freeze({idle:'HM000',idleBlendTicks:300,runBlendTicks:1000,loop:true,speed:1,reset:false,
  sourceNormal:'NormalState_Breaker',sourceRun:'RunState_Breaker',sourceUpper:Object.freeze(sourceUpper),sourceLower:Object.freeze(sourceLower),
  // Existing validated imported-rig presentation boundary; no input changes.
  run:Object.freeze(presentationOrder.map(d=>sourceUpper[d])),runLower:Object.freeze(presentationOrder.map(d=>sourceLower[d]))});

// Source declarations only: not a replacement for the current S5 timings.
// InitLua's 40 is an interval for scene updates in the proven CAttackState
// path, not an automatically added dwell. The heavy overload is distinct.
export const BREAKER_SOURCE_STATES=Object.freeze({
  light:{function:'StandardBreakerAfterDash1',animationFunction:'SwordAtkAfterDash1State_Breaker',clips:['HM001','HM002'],speeds:[1,1],durationParameters:[0,0],initLua:[600,500,40,true],moveBoxMultiplier:1,hitStop:[220,320]},
  strong:{function:'StandardBreakerStandAttack_Strong',animationFunction:'SwordAtkStrongState_Breaker',clips:['HM001','HM002'],speeds:[1,1],durationParameters:[0,0],initLua:[600,500,40,true],moveBoxMultiplier:1,hitStop:[220,320]},
  heavy:{function:'StandardBreakerAfterDash4',animationFunction:'SwordAtkAfterDash4State_Breaker',clips:['HM004','HM005'],speeds:[1,1],durationParameters:[0,0],initLua:['','',800,1000,40,false,2000],moveBoxMultiplier:1,hitStop:[600,700],drop:{timeMs:400,vector:[0,-10000,0]},checkChargeAttack:true,settingChargeTime:true,spRecoveryChargeAttack:true},
  air:{function:'StandardBreakerJumpDash',animationFunction:'SwordJumpAtkState_Breaker',clips:['HM016','HM017'],speeds:[.85,1],durationParameters:[300,1000],initLua:[300,600,40,false],coolTimeMs:600,drop:{timeMs:200,vector:[0,-20000,0]}},
  charge:{function:'StandardBreakerAfterDash5',animationFunction:'UseWeapon2State_Breaker',clips:[''],lowerIdle:'HM006',lowerRunSource:{front:'SG018',leftFront:'SG019',left:'SG020',leftBack:'SG024',rightFront:'SG021',right:'SG022',rightBack:'SG025',back:'SG023'},initLua:[40,0,0,false,true,3],initLuaInputSecond:[0,0,0,'',''],moveSpeedRate:1,moveBoxMultiplier:2,chargeTimer:false,stateMinSp:0},
  gather:{function:'StandardBreakerGatherGuage',animationFunction:'SwordAtkAfterDash5State_Breaker',clips:['',''],lowerIdle:'HM007',initLua:[40,0,0,false,true,2],initLuaInputSecond:[0,0,0,'',''],moveSpeedRate:1,moveBoxMultiplier:2,chargeTimer:false}
});

export function breakerAttackContacts(kind,comboIndex=0,{range=BREAKER_ABILITY.range,power=BREAKER_ABILITY.power,additionalPower=0}={}){
  if(!Number.isFinite(range)||range<=0||![power,additionalPower].every(Number.isFinite))throw new TypeError('Invalid Breaker combat parameters');
  if(['charge','gather','guard'].includes(kind))return [];
  if(!['light','strong','heavy','air'].includes(kind))throw new RangeError('Unknown Breaker attack '+kind);
  if(comboIndex!==0)throw new RangeError('Breaker has one light stage');
  const heavy=kind==='heavy',air=kind==='air',state=BREAKER_SOURCE_STATES[kind];
  const attribute='ATTACKATTRIB_BREAKER_SWORD_'+(heavy?'ATTACK4':air?'JUMPDASH':'ATTACK1');
  return [{id:air?'Attack':'Attack1',timeMs:heavy?500:air?250:200,powerScale:heavy?.85:1,damage:power*(heavy?.85:1)+additionalPower,
    shape:{type:'box',anchor:air?[0,0,-100]:heavy?[0,200,-100]:[0,200,0],direction:[0,0,-1],dimensions:(air?[1,1.2,1.2]:heavy?[1.5,1.2,1.7]:[1.5,.7,1]).map(v=>v*range)},
    initAttack2:[1,1,false],condition:{type:air?'push':'blow',arguments:air?[100,4000,-5000]:heavy?[0,0]:[2000,3000]},
    counterable:!heavy&&!air,fullCharge:heavy?false:undefined,
    effects:{damageSequence:'effects/backattack_sword_s.seq',damageSound:'lightHit',nativeDamageSound:'sound/breaker_hit.ogg',attackSequence:'effects/blank_1sec.seq',nativeAttackSound:heavy?'':air?'sound/breaker_jump.ogg':'sound/breaker_smash.ogg'},
    reaction:{sourceDamageData:[heavy?1000:200,'DAMAGEMOVING_ENABLE','DAMAGEBYPART_DISABLE'],sourceGuardData:[heavy||air?1000:0,heavy||air?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']},
    source:{path:'script/weapon_breakersword.lua',function:state.function,branch:'CHANNEL_MELEE',attributePath:'script/attackattribindexer.lua',attribute},
    damageMeaning:'InitAttack1 raw power; charge modifier, critical, equipment and defence pipeline not applied'}];
}

export const BREAKER_SOURCE_EFFECTS=Object.freeze({
  light:{trail:{name:'GhostTrail_Breaker_01',startMs:50,endMs:600},voice:{male:2,female:2},sequences:[]},
  strong:{trail:{name:'GhostTrail_Breaker_01',startMs:50,endMs:600},voice:{male:2,female:2},sequences:[]},
  heavy:{trail:{name:'GhostTrail_Breaker_01',startMs:100,endMs:900},voice:{male:1,female:1},sequences:[{path:'Effects/weapon_breaker_chargeattcack.seq',sound:'',startMs:500,endParameter:5000},{path:'',sound:'Sound/breaker_big_smash.ogg',startMs:0,endParameter:0}]},
  air:{trail:{name:'GhostTrail_Breaker_01',startMs:50,endMs:350},voice:{male:3,female:1},sequences:[{path:'Effects/skill_bat_strike.seq',sound:'',startMs:0,endParameter:5000},{path:'Effects/skill_bat_strike1.seq',sound:'Sound/sword_power.ogg',startMs:300,endParameter:5000},{path:'Effects/hm_jumpattack.seq',sound:'',startMs:0,endParameter:5000}]},
  charge:{trail:null,voice:null,sequences:[],reason:'Charge AddSequence and voice are commented out in the current classic actorstates source.'},
  gather:{trail:null,voice:null,sequences:[],reason:'Gather AddSequence and voice are commented out in the current classic actorstates source.'}
});
export const BREAKER_UNCERTAINTIES=Object.freeze([
  'Source SetAnim multipliers do not by themselves prove effective CAnimParam playback; existing S5 profiles are retained.',
  'Existing minimumMs40 is not certified as an extra dwell. Heavy InitLua overload and charge state require their own native dispatch evidence.',
  'S5 heavy release approximates native waitInput3; upper charge clip is empty in source, ordinary locomotion is separately HM000/HM008..015.',
  'Heavy SetFullCharge(false), SetCheckChargeAttack/SetSettingChargeTime and chargePowerRate2 require a native charge pipeline. No second hit or automatic x2 is invented.',
  'Heavy blow[0,0] must not silently become a nonzero generic knockback; reaction and physical impulse are distinct.',
  'Source VFX/audio declarations and staged files do not prove playback in the main game or native fidelity.',
  'No AlwaysCritical or DependOn in these active attack bodies; indexed critical attributes alone do not create critical contacts.'
]);
