import {COUNTER_IDLE,COUNTER_RUN,COUNTER_RUN_LOWER} from './counter-sword-locomotion-data.js';
export * from './counter-sword-locomotion-data.js';

// Classic item 2000002, current copied XS xbn/weapon.xml (not _eu_weapon.x7).
// Source and exact function bodies: tests/fixtures/native/counter-source-contract.json.
export const COUNTER_ABILITY=Object.freeze({itemKey:2000002,nativeType:1,power:12.5,range:480,moveSpeedRate:1.1,attackMoveSpeedRate:1});
export const COUNTER_UNCERTAINTIES=Object.freeze([
  'CAttackState requested-duration fitting is connected with native float32/integer conversion; global scene scheduling, blend and reset remain unverified.',
  'InitLua third argument 40 is a scene-update interval, not an extra attack phase; exact animation-update scheduling remains unverified.',
  'DependOn, critical damage multiplier and AddtionalPower typo semantics are not certified. No implicit critical bonus is applied.',
  'MAKECYLINDER static geometry is ported; effective native target dimensions and contact point remain unverified.',
  'Push/blow values are source parameters; world impulse calibration and exact hit stop semantics remain unverified.',
  'Ghost trail and aerial sequence declarations do not prove current S5 effects match native resources.'
]);

const attack=(p)=>({...p,nativeAnimationSpeed:1,nativeRecoveryAnimationSpeed:1,nativeMinimumSceneUpdateMs:40,
 nativeRequestedAnimationDurationMs:p.actionMs,nativeRecoveryRequestedAnimationDurationMs:p.recoveryMs});
// CAttackState5e50b0 requests action/recovery durations from InitLua.
// All current Counter action AnimParams have override0 and Lua speed1.
export const COUNTER_DEFINITION={idle:COUNTER_IDLE,run:COUNTER_RUN,runLower:COUNTER_RUN_LOWER,
  light:[
    attack({clip:'R0000',recoveryClip:'R0025',actionMs:800,recoveryMs:250,hits:[100,350],multiplier:1.7,locked:true}),
    attack({clip:'R0001',recoveryClip:'R0026',actionMs:600,recoveryMs:400,hits:[100],multiplier:1,locked:true}),
    attack({clip:'R0002',recoveryClip:'R0027',actionMs:800,recoveryMs:300,hits:[300],multiplier:1,locked:true}),
    attack({clip:'R0003',recoveryClip:'R0028',actionMs:1150,recoveryMs:300,hits:[100,650],multiplier:1,locked:true})],
  heavy:attack({clip:'R0030',recoveryClip:'R0031',actionMs:1000,recoveryMs:500,hits:[350],locked:true}),
  air:attack({clip:'R0029',recoveryClip:'R0033',actionMs:600,recoveryMs:600,hits:[600],locked:true,dropMs:400,dropVector:[0,-3600,-6200],resetVelocityOnRecovery:true}),
  guard:{clip:'R0005',recoveryClip:'R0032',guard:true,hits:[],moveRate:.5,nativeAnimationSpeed:1,nativeRecoveryAnimationSpeed:1}
};

const box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
const scaledBox=(anchor,multipliers,range)=>box(anchor,multipliers.map(v=>v*range));
const criticalBox=()=>box([0,250,-100],[1,100,299.173785]);
const push={type:'push',arguments:[100,2000,-5000]};
const contact=(id,timeMs,powerScale,shape,condition=null,extra={})=>({id,timeMs,powerScale,shape,condition,initAttack2:[1,1,false],...extra});
const critical=(id,parent,timeMs,powerScale,shape)=>contact(id,timeMs,powerScale,shape,null,{alwaysCritical:true,dependsOn:parent});

// These are separate CAttack objects, including same-time dependent criticals.
// Callers choose their explicitly documented dependence/damage policy.
export function counterAttackContacts(kind,comboIndex=0,{range=COUNTER_ABILITY.range,power=COUNTER_ABILITY.power,additionalPower=0}={}){
  if(!Number.isFinite(range)||range<=0||![power,additionalPower].every(Number.isFinite))throw new TypeError('Invalid Counter Sword combat parameters');
  let out;
  if(kind==='guard')return [];
  if(kind==='light')switch(comboIndex){
    case 0:out=[contact('Attack2',100,.441,scaledBox([0,250,-100],[.4,.6,.6],range),push),contact('Attack3',350,.441,scaledBox([0,250,-100],[.4,.7,.7],range),push),critical('Attack1','Attack3',350,.441,criticalBox())];break;
    case 1:out=[contact('Attack2',100,.88,scaledBox([0,190,-100],[.3,.52,.7],range),push),critical('Attack1','Attack2',100,.66,criticalBox())];break;
    case 2:out=[contact('Attack2',300,.88,scaledBox([0,190,-100],[.3,.52,.7],range),push),critical('Attack1','Attack2',300,.66,criticalBox())];break;
    case 3:out=[contact('Attack2',100,.715,scaledBox([0,190,-100],[.25,.4,.2],range)),contact('Attack3',650,.99,scaledBox([0,190,-100],[.3,.52,.7],range),{type:'blow',arguments:[3000,2000]}),critical('Attack1','Attack3',650,.99,criticalBox())];break;
    default:throw new RangeError('Counter Sword combo must be 0..3');
  }
  else if(kind==='heavy')out=[contact('Attack2',350,1.486,scaledBox([0,250,-100],[.6,1.2,1.2],range),{type:'blow',arguments:[3000,3000]}),critical('Attack1','Attack2',350,.991,box([0,225,-100],[1,70,225.173785]))];
  else if(kind==='air')out=[contact('Attack2',600,1.486,{type:'cylinder',anchor:[0,10,0],arguments:[295,range]},push),critical('Attack1','Attack2',600,.991,box([0,250,0],[1,35,299.173785]))];
  else throw new RangeError(`Unknown Counter Sword attack ${kind}`);
  const functionName=kind==='light'?`CounterSwordLight${comboIndex+1}`:kind==='heavy'?'CounterSwordHeavy':'CounterSwordJumpAttack';
  return out.map(c=>({...c,...counterContactAttributes(kind,!!c.alwaysCritical),condition:c.condition?{...c.condition,arguments:[...c.condition.arguments]}:null,damage:power*c.powerScale+additionalPower,source:{path:'script/attack/weapon_countersword_attack.lua',function:functionName,branch:'CHANNEL_MELEE'},damageMeaning:'InitAttack1 raw power; critical multiplier/defence not included'}));
}

export const COUNTER_STATE_PARAMETERS={
  light:[{hitStop:[300,500],moveStopWhenDamage:true,moveBoxMultiplier:1.7},{hitStop:[200,350],moveStopWhenDamage:false,moveBoxMultiplier:1},{hitStop:[300,450],moveStopWhenDamage:false,moveBoxMultiplier:1},{hitStop:[600,800],moveStopWhenDamage:false,moveBoxMultiplier:1}],
  heavy:{hitStop:[350,550],moveBoxMultiplier:null},
  air:{hitStop:[550,750],moveBoxMultiplier:0,coolTimeMs:0,drop:{timeMs:400,vector:[0,-3600,-6200]}}
};

// script/attackattribindexer.lua, authenticated alongside the attack contract.
// SetDamageData's first argument is retained in milliseconds. Conversion into
// arena reaction motion remains an explicitly separate runtime policy.
export function counterContactAttributes(kind,critical=false){
  const heavy=kind==='heavy',air=kind==='air';
  return {
    counterable:!heavy,
    effects:{damageSequence:critical?null:'effects/backattack_sword_s.seq',damageSound:critical?null:air?'airHit':'lightHit',nativeDamageSound:critical?null:air?'sound/bsword_power.ogg':'sound/bsword_attack.ogg'},
    reaction:{sourceDamageData:[critical?0:heavy?800:air?500:200,heavy||(air&&!critical)?'DAMAGEMOVING_DISABLE':'DAMAGEMOVING_ENABLE','DAMAGEBYPART_DISABLE'],sourceGuardData:[critical?0:heavy?1000:air?500:0,heavy||(air&&!critical)?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']},
    attributeSource:'script/attackattribindexer.lua'
  };
}

export const COUNTER_RESOURCES={
  model:'/assets/s5runtime/weapon-counter-classic.json',
  sourceScenes:['model/weapon/counter_sword_r.scn','model/weapon/counter_sword_l.scn'],
  attachments:['R_Hand_Dummy','Bip01 L Forearm'],
  // Source events, not a claim that the native sequences are fully staged.
  light:[0,1,2,3].map(i=>({trail:'GhostTrail_counter_sword_01',startMs:i===3?150:50,endMs:i===3?1100:600,voiceMale:[5,2,1,6][i],voiceFemale:[5,2,1,4][i]})),
  heavy:{trail:'GhostTrail_counter_sword_01',startMs:50,endMs:600,voiceMale:4,voiceFemale:3},
  air:{sequence:'Effects/weapon_counter_upper01.seq',sound:'Sound/bsword_counter.ogg',sourceArguments:[0,500,5000],voiceMale:3,voiceFemale:3},
  availableEffectModels:['/assets/s5runtime/combat/weapon_counter_up.json','/assets/s5runtime/combat/weapon_counter_bottom.json'],
  availableSound:'/assets/s5runtime/sound/bsword_counter.ogg'
};
