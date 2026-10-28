// Classic Katana item 2000018, current XS archives authenticated on 2026-10-03.
// Exact bodies/CRC/SHA: work/melee-batch-2/katana/source-contract.json.
// Combat declarations only: keep the established skin, grip and animation clocks.
import {KATANA_RUN,KATANA_RUN_LOWER,KATANA_CLIP_TICKS} from './katana-data.js';

export const KATANA_ABILITY=Object.freeze({itemKey:2000018,nativeType:39,power:10,range:500,moveSpeedRate:1.1,attackMoveSpeedRate:1,chargePowerRate:2});
export const KATANA_LOCOMOTION=Object.freeze({idle:'KT004',run:KATANA_RUN,runLower:KATANA_RUN_LOWER,clipTicks:KATANA_CLIP_TICKS,
  normal:{source:'NormalState_Katana_A_Sword',blendTicks:500,loop:true,speed:1,reset:false},
  walk:{source:'RunState_Katana_A_Sword',blendTicks:1000,loop:true,speed:1,reset:false},
  directionalMapping:{front:'FRONT',rightFront:'LEFT_FRONT',right:'LEFT',rightBack:'LEFT_BACK',back:'BACK',leftBack:'RIGHT_BACK',left:'RIGHT',leftFront:'RIGHT_FRONT'}});
export const KATANA_SOURCE_RUN=Object.freeze({
  upper:{FRONT:'KT016',LEFT_FRONT:'KT017',LEFT:'KT018',RIGHT_FRONT:'KT019',RIGHT:'KT020',BACK:'KT021',LEFT_BACK:'KT022',RIGHT_BACK:'KT023'},
  lower:{FRONT:'00008',LEFT_FRONT:'00009',LEFT:'00010',RIGHT_FRONT:'00011',RIGHT:'00012',BACK:'00013',LEFT_BACK:'00014',RIGHT_BACK:'00015'}});
export const KATANA_COMBAT_LIMITATIONS=Object.freeze([
  'CAttack dependencies/critical multiplier/defence are unresolved; caller must choose an explicit critical policy.',
  'InitAttack1 fourth argument includes AdditionalPower; the separate fifth AddtionalPower is misspelled and its binding remains unresolved.',
  'ChargePowerRate=2 is catalog data, not an extra damage multiplication proved here. fullCharge selects source object groups only.',
  'Multiple push/blow calls are all retained in conditions; condition exposes the last declaration only as an explicit arena policy.',
  'SetMaxAttackCount(1) and CoolTime(1600) on JumpDash are declarations, not proof that only one of its three CAttack objects should run.',
  'InitLua third argument40 is native scene-update timing; do not infer a new motion phase or alter the corrected backdash clock.',
  'Source full-charge impact sound katana_hit_slash.ogg still needs runtime routing verification; the local AddSequenceBySelf screen-line is rendered separately, without live native comparison.',
]);

const names={light:['StandardKatana_A_SwordAfterDash1','StandardKatana_A_SwordAfterDash2','StandardKatana_A_SwordAfterDash3'],
  strong:'StandardKatana_A_SwordStrong',air:'StandardKatana_A_SwordJumpDash',backdash:'StandardKatana_A_SwordAttack2BackDash',charge:'StandardKatana_A_SwordAttack2Charge',heavy:'StandardKatana_A_SwordAttack2Dash'};
function sourceName(kind,comboIndex){
  if(kind==='light'){if(!Number.isInteger(comboIndex)||comboIndex<0||comboIndex>2)throw new RangeError('Katana combo must be 0..2');return names.light[comboIndex];}
  if(!Object.hasOwn(names,kind))throw new RangeError('Unknown Katana action '+kind);return names[kind];
}
const attribute=name=>'ATTACKATTRIB_KATANA_A_'+name;
const box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
const push=(...args)=>({type:'push',arguments:args});
const blow=(...args)=>({type:'blow',arguments:args});
const contact=(id,timeMs,powerScale,attributeName,shape,conditions=[],extra={})=>({id,timeMs,powerScale,attribute:attribute(attributeName),shape,conditions,initAttack2:[1,1,false],alwaysCritical:false,dependsOn:null,...extra});
const critical=(id,parent,timeMs,powerScale,attributeName,shape,extra={})=>contact(id,timeMs,powerScale,attributeName,shape,[],{alwaysCritical:true,dependsOn:parent,...extra});
const shake=(factor1,factor2)=>({enable:[true,true,0],factor1,factor2,whenSuccess:true});

// Returns independent CAttack objects in AddAttack order, with dependent criticals.
// Only heavy selects full/partial charge groups; no automatic threshold guessing.
export function katanaAttackContacts(kind,comboIndex=0,{channel='melee',range=KATANA_ABILITY.range,power=KATANA_ABILITY.power,additionalPower=0,fullCharge=false}={}){
  const functionName=sourceName(kind,comboIndex);
  if(!['melee','unlimited'].includes(channel))throw new RangeError('Unknown Katana balance channel '+channel);
  if(!Number.isFinite(range)||range<=0||![power,additionalPower].every(Number.isFinite)||power<0||typeof fullCharge!=='boolean')throw new TypeError('Invalid Katana combat parameters');
  const melee=channel==='melee',standard=()=>box([0,250,0],[range*.75,range*.6,range*.9]);
  const narrow=()=>box([0,250,0],[1,50,range*.6]);
  const commonShake=shake([100,50,20],[50,0,2000,3000]);
  let out=[];
  if(kind==='light'){
    if(comboIndex===0)out=[contact('Attack1',225,melee?.7:.9,'SWORD_ATTACK1',standard(),[push(100,2000,-5000)],{successCondition:'CONDITION_ACTOR',checkBodyPartsByThickray:false,cameraShake:commonShake})];
    if(comboIndex===1)out=[300,700].map((timeMs,i)=>contact('Attack'+(i+1),timeMs,melee?.45:.9,'SWORD_ATTACK2',standard(),[push(100,2500,-5000)],{cameraShake:commonShake}));
    if(comboIndex===2)out=[contact('Attack1',350,melee?.7:.9,'SWORD_ATTACK3',standard(),[blow(3000,2000)],{cameraShake:shake([200,50,50],[0,75,2000,3000])}),
      critical('Attack2','Attack1',350,melee?.5:.9,'SWORD_CRITICAL_REVENGE',narrow())];
  }else if(kind==='strong'){
    const timeMs=melee?300:400;
    out=[contact('Attack2',timeMs,melee?1.7:1.8,'SWORD_ATTACK4',box([0,250,-100],[range*.6,range*.9,range*1.2]),[blow(3000,2500)],{playSound:false,cameraShake:shake([200,50,50],[60,0,2000,3000])}),
      critical('Attack1','Attack2',timeMs,melee?.75:1.8,'SWORD_CRITICAL',box([0,250,-100],[1,50,range*.8]))];
  }else if(kind==='air'){
    out=[200,300,650].map((timeMs,i)=>contact('Attack'+(i+1),timeMs,i===2?(melee?.6:.9):(melee?.35:.45),i===2?'SWORD_JUMPDASH_STAGGER':'SWORD_JUMPDASH',box([0,250,0],[range*.2,range*1.2,range]),
      [i===2?push(100,2500,-5000):push(50,2000,-5000)],{...(i?{playSound:false}:{}),cameraShake:i===2?shake([200,50,50],[60,0,2000,3000]):shake([100,30,50],[30,0,2000,3000])}));
  }else if(kind==='heavy'){
    const shape=()=>box([0,250,0],[range,range*.4,range*(fullCharge?1:.8)]),attr=fullCharge?'ATTACK2_FULL_CHARGE':'ATTACK2_CHARGE';
    const extra={fullCharge,successCondition:'CONDITION_ACTOR',playSound:fullCharge,cameraShake:{...shake([200,50,50],[0,75,2000,3000]),reiteration:false}};
    if(melee){
      const first=fullCharge?'Attack7':'Attack3',second=fullCharge?'Attack8':'Attack4';
      out=[contact(first,250,.7,attr,shape(),[push(150,fullCharge?2500:1750,-5000),blow(-1500,fullCharge?4000:3500)],extra),
        contact(second,400,1.2,attr,shape(),[...(fullCharge?[push(150,2500,-5000)]:[]),blow(-1500,fullCharge?4000:3500)],extra),
        critical(fullCharge?'Attack9':'Attack2',second,400,.5,'SWORD_CRITICAL_REVENGE',fullCharge?box([0,250,0],[1,200,range*.8]):narrow(),{fullCharge,playSound:fullCharge})];
    }else{
      const ids=fullCharge?['Attack6','Attack7','Attack8']:['Attack1','Attack2','Attack3'];
      out=[250,350,450].map((timeMs,i)=>contact(ids[i],timeMs,i===1?.45:.9,attr,shape(),fullCharge?[push(150,2500,-5000),blow(-1500,4000)]:i===2?[push(150,2500,-5000)]:[],extra));
      out.push(critical(fullCharge?'Attack9':'Attack4',ids[2],450,.9,'SWORD_CRITICAL_REVENGE',fullCharge?box([0,250,0],[1,200,range*.8]):narrow(),{fullCharge,playSound:fullCharge,...(!fullCharge?{successCondition:'CONDITION_ACTOR'}:{})}));
    }
  }
  return out.map(c=>({...c,...katanaContactAttributes(c.attribute),
    condition:c.conditions.at(-1)||null,conditionPolicy:c.conditions.length>1?'arena-last-declared-condition':'single-or-none',
    damage:power*c.powerScale+additionalPower,damageMeaning:'InitAttack1 fourth argument only; no critical/charge multiplier or defence applied',
    additionalPowerExpression:'AdditionalPower',fifthArgumentExpression:'AddtionalPower',
    source:{path:'script/weapon_katana_a_sword.lua',function:functionName,branch:melee?'CHANNEL_MELEE':'else (commented CHANNEL_UNLIMITED)'}}));
}

export function katanaContactAttributes(name){
  const key=name.replace('ATTACKATTRIB_KATANA_A_','');
  // delayMs, damageMoving, counterable, guardMs, guardCrush, object damage.
  const entries={SWORD_ATTACK1:[300,true,true,0,false,10],SWORD_ATTACK2:[300,true,true,0,false,5],SWORD_ATTACK3:[750,false,true,0,false,30],
    SWORD_ATTACK4:[750,true,false,1000,true,20],SWORD_JUMPDASH:[250,true,true,0,false,20],SWORD_JUMPDASH_STAGGER:[500,false,true,0,false,20],
    ATTACK2_CHARGE:[1000,false,true,0,false,50],ATTACK2_FULL_CHARGE:[1000,false,true,1000,true,50],SWORD_CRITICAL:[0,true,false,0,false,null],SWORD_CRITICAL_REVENGE:[0,true,true,0,false,null]};
  const data=entries[key];if(!data)throw new RangeError('Unknown Katana attack attribute '+name);
  const [delayMs,moving,counterable,guardMs,guardCrush,objectDamage]=data,crit=key.includes('CRITICAL'),charged=key==='ATTACK2_FULL_CHARGE',secondary=key.startsWith('ATTACK2_');
  return {counterable,reaction:{sourceDirection:['DIR_FRONT','PART_MIDDLE'],sourcePower:['POWER_STRONG',objectDamage===null?'DESTROY_BLASTOBJECT_IMPOSSIBLE':'DESTROY_BLASTOBJECT_DAMAGE_'+objectDamage],
    sourceDamageData:[delayMs,moving?'DAMAGEMOVING_ENABLE':'DAMAGEMOVING_DISABLE','DAMAGEBYPART_DISABLE'],sourceGuardData:[guardMs,guardCrush?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']},
    effects:{damageSequence:crit?null:'effects/katana_damege.seq',damageObjectSequence:crit?null:'effects/katana_damege_obj.seq',
      damageSound:crit?null:charged?'fullChargeHit':'lightHit',nativeDamageSound:crit?null:charged?'sound/katana_hit_slash.ogg':'sound/spydagger_cut_hit.ogg',
      nativeObjectSound:crit?null:'sound/burstshotgun_wall_hit.ogg',attackSequence:crit?null:'effects/blank_1sec.seq',
      targetSequence:secondary?'effects/katanaA_s_atk02_line01.seq':null},attributeSource:'script/attackattribindexer.lua'};
}

// Native state declarations, deliberately not a replacement for the movement
// implementation corrected with the user (especially KT006_1 at speed1).
export function katanaStateParameters(kind,comboIndex=0,{channel='melee'}={}){
  const source=sourceName(kind,comboIndex);if(!['melee','unlimited'].includes(channel))throw new RangeError('Unknown Katana channel');
  const melee=channel==='melee',boost=melee?1:1.09;
  const common={source,stealthCancel:true};
  if(kind==='light')return {...common,initLua:[[350,350,40,true],[800,800,40,true],[500,500,40,true]][comboIndex],moveBoxMultiplier:comboIndex?boost:0,
    ...(comboIndex===0?{moveSpeedRate:2*boost,moveStopWhenDamage:true}:{}),...(comboIndex===2?{hitStop:[300,450]}:{}),resetMoveBoxAtSubStateChange:true};
  if(kind==='strong')return {...common,initLua:[500,melee?550:600,40,false],moveBoxMultiplier:boost,resetMoveBoxAtSubStateChange:true};
  if(kind==='air')return {...common,initLua:[400,melee?450:400,40,false],moveBoxMultiplier:0,maxAttackCount:1,coolTimeMs:1600,
    drop:{timeMs:1,vector:[0,-1000,melee?-3000:-2943]},delayDrop:{timeMs:1,vector:[0,-5000,0]}};
  if(kind==='backdash')return {...common,initLua:['','',300,0,0,false,0],moveBoxMultiplier:boost,moveStopWhenDamage:false,animationSpeed:1};
  if(kind==='charge')return {...common,initLua:[40,0,1000,false,false,3],initLuaInputSecond:[1000,8000,0,'Bip01 L Hand',''],moveSpeedRate:0,moveBoxMultiplier:2*boost,persistDecrementMaxSp:20,spendSp:20,chargeTimer:true,standingWait:true};
  return {...common,initLua:['','',melee?700:750,900,40,false,900],moveBoxMultiplier:boost,moveStopWhenDamage:false,checkChargeAttack:true,settingChargeTime:true,
    resetMoveBoxAtSubStateChange:true,increaseDelayChargeTime:false,maxIncreaseDelayTime:0,spRecoveryChargeAttack:false,enableMouseSensitivityRotate:true,normalMouseSensitivityRotate:1,
    fpsCameraInfoNewCam:[true,false],fpsCameraInfoNewCamHori:[.4,.05,2],fpsCameraInfoNewCamVert:[.95,.98,.5]};
}

export const KATANA_ANIMATIONS=Object.freeze({
  light:[{source:'SwordAtkAfterDash1State_Katana_A_Sword',clip:'KT000',recoveryClip:'KT025',blendTicks:200,recoveryBlendTicks:100,recoveryPaddingTicks:0},
    {source:'SwordAtkAfterDash2State_Katana_A_Sword',clip:'KT001',recoveryClip:'KT026',blendTicks:200,recoveryBlendTicks:1000,recoveryPaddingTicks:1000},
    {source:'SwordAtkAfterDash3State_Katana_A_Sword',clip:'KT002',recoveryClip:'KT027',blendTicks:200,recoveryBlendTicks:50,recoveryPaddingTicks:100}],
  strong:{source:'SwordAtkStrongState_Katana_A_Sword',clip:'KT009',recoveryClip:'KT010',blendTicks:100,recoveryBlendTicks:50,recoveryPaddingTicks:0},
  air:{source:'SwordJumpAtkState_Katana_A_Sword',clip:'KT029',recoveryClip:'KT033',blendTicks:50,recoveryBlendTicks:0,recoveryPaddingTicks:0},
  backdash:{source:'UseWeapon2BackDash_Katana_A_Sword',clip:'KT006_1',blendTicks:200},
  charge:{source:'UseWeapon2Charge_Katana_A_Sword',clip:'KT006_2',blendTicks:200},
  heavy:{source:'UseWeapon2Dash_Katana_A_Sword',clip:'KT007',recoveryClip:'KT008',blendTicks:200,recoveryBlendTicks:0,recoveryPaddingTicks:1000},
  sourceSpeed:1,loop:false,reset:true,
});
const sound=(path,beginMs)=>({path,socket:'Bip01',beginMs,endMs:5000});
const voice=(male,female=male)=>({male:`Sound/voice_man_attack_${male}.ogg`,female:`Sound/voice_girl_attack_${female}.ogg`,socket:'Bip01',beginMs:0,endMs:2500});
const sequence=(path,endMs,bySelf=false)=>({path,beginMs:0,endMs,bySelf});
const trail=(beginMs,endMs)=>({name:'GhostTrail_katana_a_sword_01',beginMs,endMs});
export const KATANA_ACTION_EVENTS={
  light:[{voice:voice(1),sounds:[sound('Sound/katana_cut.ogg',200),sound('Sound/katana_cut_finish.ogg',700)],trail:trail(300,600),sequences:[sequence('Effects/katanaA_atk01.seq',500)]},
    {voice:voice(5),sounds:[sound('Sound/katana_cut.ogg',300),sound('Sound/katana_cut.ogg',700),sound('Sound/katana_cut_finish.ogg',1600)],trail:trail(50,3000),sequences:[sequence('Effects/katanaA_atk02.seq',3000)]},
    {voice:voice(3),sounds:[sound('Sound/katana_cut.ogg',350),sound('Sound/katana_cut_finish.ogg',1000)],trail:trail(500,1000),sequences:[sequence('Effects/katanaA_atk03.seq',2000)]}],
  strong:{voice:voice(3),sounds:[sound('Sound/katana_cut_power.ogg',1),sound('Sound/katana_cut_finish.ogg',800)],trail:trail(0,900),sequences:[sequence('Effects/katanaa_strong.seq',2000)]},
  air:{voice:null,sounds:[sound('Sound/katana_cut_air.ogg',1)],trail:trail(100,1200),sequences:[sequence('Effects/katanaA_jump.seq',400)]},
  backdash:{voice:voice(1,3),sounds:[],trail:null,sequences:[]},charge:{voice:null,sounds:[],trail:null,sequences:[]},
  heavy:{voice:null,sounds:[sound('Sound/katana_cut_slash.ogg',1),sound('Sound/katana_cut_finish.ogg',1100)],trail:trail(50,500),sequences:[sequence('Effects/katanaA_s_atk.seq',1500),sequence('Effects/katanaA_s_atk02_line01.seq',1500,true)]},
  catalogCharge:{sequence:'effects/katana_charge2.seq',sound:'sound/katana_charge.ogg',timing:'native charge timer, exact routing unresolved'},
};
