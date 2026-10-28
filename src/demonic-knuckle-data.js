// Active item2000036, type47. Current archive proof and source contract:
// work/melee-batch-5/demonic-knuckle/. No atk_2.lua parameters are used.
import {DEMONIC_KNUCKLE_MOVING_CONTRACT} from './demonic-knuckle-moving-state.js';
export const DEMONIC_KNUCKLE_ABILITY=Object.freeze({itemKey:2000036,name:"Demon's Fist",nativeType:47,power:10,range:500,moveSpeedRate:1.1,attackMoveSpeedRate:1,legacyEuPower:15});
export const DEMONIC_KNUCKLE_LOCOMOTION=Object.freeze({idle:'KN000',run:['KN001','KN002','KN003','KN007','KN006','KN008','KN005','KN004'],runLower:['KN001','KN002','KN003','KN007','KN006','KN008','KN005','KN004'],source:'script/_weapon_demonicknuckle_ani.lua:NormalState_DemonicKnuckle/RunState_DemonicKnuckle',loop:true,speed:1,blendTicks:1000,reset:false});
export const DEMONIC_KNUCKLE_LOWER=Object.freeze({light:['E0008','E0009','E0010','E0014','E0013','E0015','E0012','E0011'],light2:['DD005','DD006','DD007','DD011','DD010','DD012','DD009','DD008'],idle:'A0024'});
const functions={light:'LeftAttack_DemonicKnuckle',light2:'LeftAttack2_DemonicKnuckle',air:'LeftJump_DemonicKnuckle',heavy:'RightAttack_DemonicKnuckle'};
export function demonicKnuckleStateParameters(kind){
 if(!functions[kind])throw new RangeError('Unknown Demonic Knuckle action '+kind);
 const common={source:{file:'script/_weapon_demonicknuckle_atk.lua',function:functions[kind]},stealthCancel:true};
 if(kind==='light'||kind==='light2')return {...common,initLua:[800,50,0,false],stateClass:'CAttackMovingState',moveBoxMultiplier:2,moveStopWhenDamage:false,moveSpeedRate:1.2,...(kind==='light2'?{sourceCommentUnused:true}:{} )};
 if(kind==='air')return {...common,initLua:[550,550,40,false],stateClass:'CAttackState',drop:{atMs:400,vector:[0,-4000,0]},cooldownMs:1500,moveBoxMultiplier:0,hitStop:[550,750]};
 return {...common,initLua:[700,800,40,true],stateClass:'CAttackState',moveBoxMultiplier:2,moveStopWhenDamage:true,cooldownMs:4000,immuneMs:1500,spCost:40,minSp:40,plusDefensePowerRate:.2,localPowerMultiplier:1.8,localRangeSubtract:200};
}
export function demonicKnuckleAttackContacts(kind,comboIndex=0,{power=10,range=500,additionalPower=0,includeDeclaredCritical=false}={}){
 if(![power,range,additionalPower].every(Number.isFinite)||power<0||range<=200)throw new RangeError('Invalid Demonic Knuckle ability');
 if(kind==='light'&&comboIndex!==0)throw new RangeError('Light1 alternates hands in its native state; no light2 combo is inferred');
 const p=demonicKnuckleStateParameters(kind),box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
 let result=[];
 if(kind==='light'||kind==='light2')result=[{id:'Attack1',timeMs:kind==='light'?240:180,damage:power*.9,shape:box([0,kind==='light'?200:180,-50],[range,range*.8,range]),condition:null}];
 else if(kind==='air')result=[{id:'Attack2',timeMs:550,damage:power*.8,shape:{type:'fan',anchor:[0,80,0],direction:[0,-1],parameters:[range*.8,range*.7,range*1.7,60]},condition:{type:'stun',arguments:[1200,1600,0,500]}}];
 else{
  const r=range-200,localPower=power*1.8;
  if(includeDeclaredCritical)result.push({id:'Attack1',timeMs:700,damage:localPower,alwaysCritical:true,shape:{type:'ray',anchor:[0,250,-60],direction:[0,0,-1],length:r*1.4},condition:null,geometrySupported:false,criticalPolicy:'declared flag; multiplier and ray arbitration unverified'});
  result.push({id:'Attack2',timeMs:700,damage:localPower*1.6+additionalPower,shape:box([0,220,-60],[r,r*1.2,r*1.9]),condition:{type:'blow',arguments:[3400,2400]},attackSuccessCondition:'CONDITION_ACTOR'});
 }
 const attr=kind==='light'?'LEFT_ATTACK':kind==='light2'?'LEFT_ATTACK2':kind==='air'?'JUMP_ATTACK':'RIGHT_ATTACK';
 return result.map((c,index)=>({alwaysCritical:false,dependsOn:null,geometrySupported:true,...c,index,attribute:'ATTACKATTRIB_DEMONIC_KNUCKLE_'+attr,
  counterable:kind!=='heavy',reaction:{sourceDamageData:[kind==='heavy'?1200:kind==='air'?1000:300,kind==='air'?'DAMAGEMOVING_DISABLE':'DAMAGEMOVING_ENABLE','DAMAGEBYPART_DISABLE'],sourceGuardData:[kind==='heavy'?1000:0,kind==='heavy'?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']},
  effects:{damageSequence:'effects/backattack_sword_s.seq',damageSound:kind==='air'?'powerHit':'hit',nativeDamageSound:kind==='air'?'sound/bsword_power.ogg':'sound/bsword_attack.ogg',nativeAttackSound:kind==='air'?null:'sound/bsword_s.ogg'},
  source:p.source,fifthArgumentExpression:'AddtionalPower',initAttack2:[1,1,false]}));
}
export function demonicKnuckleAttackProfile(kind,{hand='left'}={}){
 const p=demonicKnuckleStateParameters(kind),contacts=demonicKnuckleAttackContacts(kind);
 if(!['left','right'].includes(hand))throw new TypeError('Hand must be left or right');
 const moving=kind==='light'||kind==='light2';
 return {clip:moving?(kind==='light2'?'KN012':hand==='right'?'KN012':'KN011'):kind==='air'?'KN013':'KN014',
  ...(moving?{lowerIdle:'A0024',lowerWalk:DEMONIC_KNUCKLE_LOWER[kind],lowerBeginMs:50,lowerPhaseComparison:'strict-post-increment',recoveryMs:0,hand:kind==='light2'?'right':hand,requiresNativeHandSelection:kind==='light',
    nativeSceneParameterMs:p.initLua[0],...(kind==='light'?{nativeRequestedAnimationDurationMs:DEMONIC_KNUCKLE_MOVING_CONTRACT.actionMs}:{}),
    sourceAnimationArguments:{upper:[0,50,0,false,1,true],lowerWalk:kind==='light'?[800,500,500,true,1,false]:[0,500,0,true,1,false],lowerIdle:[0,500,300,true,1,true]},
    lifetimePolicy:kind==='light'?'native factory82a4a0 ->800870 duration500; base tick5617f0 requests exit strictly after500; Lua800 is a distinct scene field':'Unused light2 lifetime not promoted from the verified light1 factory'}:{recoveryClip:kind==='air'?'KN023':'KN024',recoveryMs:p.initLua[1],sceneUpdateMs:40,
    nativeRequestedAnimationDurationMs:p.initLua[0],nativeRecoveryRequestedAnimationDurationMs:p.initLua[1],nativeRecoveryAnimationDurationOverrideMs:kind==='heavy'?800:0}),
  actionMs:kind==='light'?DEMONIC_KNUCKLE_MOVING_CONTRACT.actionMs:p.initLua[0],nativeAnimationSpeed:1,nativeRecoveryAnimationSpeed:1,hits:contacts.map(c=>c.timeMs),strictHits:true,locked:!moving,moveRate:p.moveSpeedRate??0,multiplier:p.moveBoxMultiplier,
  spCost:p.spCost??0,minSp:p.minSp??0,cooldownMs:p.cooldownMs??0,...(p.drop?{dropMs:p.drop.atMs,dropVector:p.drop.vector}:{}),sourceParameters:p,contacts};
}
// One light profile is exposed. KN011/KN012 selection is explicit through the
// profile helper; native first entry is left. The caller must keep the hand
// state across exits/switches and pass beginDemonicKnuckleLight(...).hand on
// every subsequent entry. Never promote light2 to a combo.
export const DEMONIC_KNUCKLE_DEFINITION=Object.freeze({...DEMONIC_KNUCKLE_LOCOMOTION,light:[demonicKnuckleAttackProfile('light')],heavy:demonicKnuckleAttackProfile('heavy'),air:demonicKnuckleAttackProfile('air')});
export const DEMONIC_KNUCKLE_RESOURCES=Object.freeze({root:'/assets/s5runtime/demonic-knuckle',model:'/assets/s5runtime/demonic-knuckle/model.json',animations:{male:'/assets/s5runtime/demonic-knuckle/animations/male.json',female:'/assets/s5runtime/demonic-knuckle/animations/female.json'},icon:'/assets/s5runtime/demonic-knuckle/icon.png',effects:'/assets/s5runtime/demonic-knuckle/effects-runtime.json',attachments:[{sceneIndex:0,bone:'Bip01 R Forearm',link:0},{sceneIndex:1,bone:'Bip01 L Forearm',link:1}]});
export const DEMONIC_KNUCKLE_LIMITATIONS=Object.freeze(['Native active family is proven by current item/XBN/bindings/attach/require chain; live behavior is not certified.','Light1 first entry is leftKN011, then rightKN012; native hand state must persist across exits and switching. Light2 is explicitly called unused; no combo is inferred.','SP40, cooldown4000 and immunity1500 condition-add gate are connected. Native cooldown origin, ordinary reaction mapping and defense components-to-HP mapping remain unverified. Defense20% helper is not applied arbitrarily to arena HP.','Heavy AlwaysCritical ray is preserved only with includeDeclaredCritical:true; ray collision, critical scaling and relation to concurrent box remain unverified.','Light1 factory lifetime500 is separate from InitLua scene parameter800. Primary, air and heavy animation fitting is connected from native requested durations; global scene scheduling, blend and reset remain unverified. No minimum40 phase is added.','Fifth AddtionalPower spelling/value is preserved; ordinary damage fourth argument omits it. Heavy box explicitly adds AdditionalPower.']);
