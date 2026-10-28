// Classic Storm Bat, current authenticated Lua; proof: work/melee-batch-3/bat.
export const BAT_ABILITY=Object.freeze({itemKey:2000003,nativeType:13,power:18.5,range:500,moveSpeedRate:1.1,attackMoveSpeedRate:1});
export const BAT_RUN=Object.freeze(['A0005','A0006','A0007','A0011','A0010','A0012','A0009','A0008']);
export const BAT_RUN_LOWER=Object.freeze(['00008','00009','00010','00014','00013','00015','00012','00011']);
export const BAT_ATTACK_RUN_LOWER=Object.freeze(['E0008','E0009','E0010','E0014','E0013','E0015','E0012','E0011']);
export const BAT_LOCOMOTION=Object.freeze({idle:'A0013',run:BAT_RUN,runLower:BAT_RUN_LOWER,fade:1000/4800,loop:true,speed:1,source:{idle:'NormalState_BatSword',run:'RunState_BatSword'},presentationMapping:['FRONT','LEFT_FRONT','LEFT','LEFT_BACK','BACK','RIGHT_BACK','RIGHT','RIGHT_FRONT']});
const base={nativeMinimumSceneUpdateMs:40,strictHits:true,nativeAnimationSpeed:1};
const light={...base,clip:'BB001',actionMs:1000,recoveryMs:0,hits:[400],moveRate:.8,locked:false,lowerBeginMs:300,lowerIdle:'A0024',lowerWalk:BAT_ATTACK_RUN_LOWER,sourceAction:'BatSwordStandAttack_Strong',initLua:[40,300,false,false],requestedAnimationDurationMs:900,nativeRequestedAnimationDurationMs:1000,nativeAnimationDurationOverrideMs:900,timingLimit:'Native factory requests1000ms; base timer exits strictly after1000. Lua override900 only sets animation fitting; global pause/hitstop scheduling remains separate'};
export const BAT_DEFINITION={idle:'A0013',run:BAT_RUN,runLower:BAT_RUN_LOWER,
 light:[light],strong:light,
 heavy:{...base,clip:'BB002',recoveryClip:'BB004',actionMs:700,recoveryMs:300,hits:[150,300],moveRate:1.5,recoveryMoveRate:0,locked:false,sourceAction:'BatSwordAttack2',initLua:[700,300,40,true],nativeRequestedAnimationDurationMs:700,nativeRecoveryRequestedAnimationDurationMs:300},
 air:{...base,clip:'A0015',recoveryClip:'A0016',actionMs:300,recoveryMs:1100,hits:[300],locked:true,dropMs:200,dropVector:[0,-20000,0],nativeAnimationSpeed:.85,nativeRecoveryAnimationSpeed:1,sourceAction:'BatSwordJumpAttack',initLua:[300,1100,40,false],nativeRequestedAnimationDurationMs:300,nativeAnimationDurationOverrideMs:300,nativeRecoveryRequestedAnimationDurationMs:1100,nativeRecoveryAnimationDurationOverrideMs:1000},
};
export const BAT_SOURCE_VARIANTS=Object.freeze({
 strong2:{clip:'BB001',recoveryClip:null,actionMs:1000,recoveryMs:40,initLua:[1000,40,0,false],multiplier:0,sourceAction:'BatSwordStandAttack_Strong1'},
 spin2:{clip:'BB002',recoveryClip:'BB003',actionMs:700,recoveryMs:1000,initLua:[700,1000,40,true]},
 spin3:{clip:'BB002',recoveryClip:'BB003',actionMs:700,recoveryMs:1300,initLua:[700,1300,40,true]},
 spin4:{clip:'BB002',recoveryClip:'BB003',actionMs:700,recoveryMs:1200,initLua:[700,1200,40,true]},
 spin5:{clip:'BB002',recoveryClip:'BB003',actionMs:700,recoveryMs:1600,initLua:[700,1600,40,true]},
});
// Named native states: the input graph selects normal or critical branches;
// these are not five successive levels. See bat-input.js and its native proof.
for(const kind of ['spin2','spin3','spin4','spin5']){
 const level=Number(kind.slice(-1));
 BAT_DEFINITION[kind]={...base,...BAT_SOURCE_VARIANTS[kind],hits:[150,300],moveRate:1.5,recoveryMoveRate:0,locked:false,
  nativeRequestedAnimationDurationMs:700,nativeRecoveryRequestedAnimationDurationMs:BAT_SOURCE_VARIANTS[kind].recoveryMs,
  sourceAction:`BatSwordAttack2_${level}`,nativeInputState:[null,null,47,48,49,50][level],
  declaredCritical:level>=4};
}
export const BAT_RESOURCES=Object.freeze({weapon:'/assets/s5runtime/bat/model.json',animationDelta:sex=>`/assets/s5runtime/bat/animations/${sex}.json`,effects:'/assets/s5runtime/bat/effects-runtime.json',manifest:'/assets/s5runtime/bat/manifest.json',attachment:'R_Hand_Dummy',alignment:'Sword_Wea_Dummy',sound:name=>`/assets/s5runtime/bat/sounds/${name}.ogg`});
const box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
function attrib(type){
 const air=type==='JUMP'||type==='JUMP_CRITICAL',critical=type.endsWith('CRITICAL'),spin=type==='ATTACK2';
 return {attribute:'ATTACKATTRIB_BAT_SWORD_'+type,counterable:!air,
  effects:{damageSequence:critical?null:air?'effects/skill_gunner_chargeshot_hit.seq':'effects/backattack_sword_s.seq',damageObjectSequence:critical?null:air?'effects/skill_gunner_chargeshot_hit.seq':'effects/backattack_sword_s.seq',damageSound:critical?null:air?'batHitAir':'batHit',damageObjectSound:critical?null:'batHit',nativeDamageSound:critical?null:air?'sound/bat_hit1.ogg':'sound/bat_hit.ogg',nativeObjectSound:critical?null:'sound/bat_hit.ogg'},
  reaction:{sourceDamageData:[critical||spin?0:air?1000:400,critical||spin?'DAMAGEMOVING_ENABLE':'DAMAGEMOVING_DISABLE',type==='CRITICAL'?'DAMAGEBYPART_ENABLE':'DAMAGEBYPART_DISABLE'],sourceGuardData:[critical||spin?0:air?1000:300,air&&!critical?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']}};
}
export function batAttackContacts(kind,comboIndex=0,{range=BAT_ABILITY.range,power=BAT_ABILITY.power,additionalPower=0,criticalPolicy='normal-only'}={}){
 if(!Number.isFinite(range)||range<=0||!Number.isFinite(power)||power<0||!Number.isFinite(additionalPower))throw new RangeError('Invalid Bat ability');
 if(!['normal-only','include-declared'].includes(criticalPolicy))throw new RangeError('Unknown Bat critical policy');
 if(!Number.isInteger(comboIndex)||comboIndex!==0)throw new RangeError('Bat exposes one initial light attack; use named source variants');
 const make=(id,timeMs,factor,shape,type,extra={})=>({id,timeMs,atMs:timeMs,powerScale:factor,damage:power*factor+additionalPower,shape,initAttack2:[1,1,false],dependsOn:null,alwaysCritical:type.endsWith('CRITICAL'),condition:null,...attrib(type),...extra});
 let out;
 if(['light','strong','strong2'].includes(kind)){
  const second=kind==='strong2';out=[make('Attack1',400,second?1.002:.689,box([0,225,0],[1,100,207]),'CRITICAL'),make('Attack2',400,second?1.002:.908,box([0,250,second?0:100],second?[range*.4,range*.4,range]:[500,100,range]),'STAND_STRONG',{condition:{type:'blow',arguments:second?[3000,2000]:[4000,2600]}})];
 }else if(kind==='air')out=[make('Attack1',300,1.096,box([0,55,0],[1,50,375]),'JUMP_CRITICAL'),make('Attack2',300,1.44,box([0,150,-50],[range*.4,range*1.2,range]),'JUMP')];
 else if(['heavy','spin2','spin3','spin4','spin5'].includes(kind)){
  const level=kind==='heavy'?0:Number(kind.slice(-1))-1,factor=[.188,.345,.501,.689,1.002][level];
  out=[150,300].map((time,i)=>make('Attack'+(i+1),time,factor,{type:'cylinder',anchor:[0,250,0],arguments:[100,range*.8]},'ATTACK2',{alwaysCritical:level>=3,...([2,4].includes(level)?{condition:{type:'blow',arguments:[2000,1400]}}:{})}));
 }else if(['charge','guard','gather'].includes(kind))return [];
 else throw new RangeError('Unknown Bat action '+kind);
 return out.filter(c=>criticalPolicy==='include-declared'||!c.alwaysCritical).map((c,index)=>({...c,index,source:{file:'script/attack/weapon_stormbat_attack.lua',channel:'melee',kind}}));
}
export const BAT_UNCERTAINTIES=Object.freeze([
 'Light and strong1 use the same current binding. Spin input ranges are reconstructed from current native initializers; strong2 remains a separate post-air state.',
 'Default normal-only policy excludes independent critical boxes and critical-only spin4/5; no unverified critical multiplier or DependOn is invented.',
 'Air/spin/light fitting is connected from native phase requests and Lua overrides/speeds. Light state exits strictly after its native1000ms timer; global pause/hitstop scheduling/blend/reset remain unverified.',
 'Air recovery uses SetAnim override1000 with state request1100: speed1000/1100, independently of clip duration. State lifetime remains1100.',
 'Current archive index lacks effects/skill_bat_strike1.seq. Its300ms cue is retained as missing, not replaced.',
 'Source AddtionalPower spelling and native damage modifiers remain unresolved; damage is only authored Power expression.',
]);
