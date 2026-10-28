// Current item 2000065, distinct from old item 2000005 Assassin Claw.
// Exact CRC/SHA-authenticated Lua/XML: work/melee-batch-3/vital-shock/source-contract.json.
export {VITAL_SHOCK_TICKS,VITAL_SHOCK_MOVEBOX} from './vital-shock-motion-data.js';
export const VITAL_SHOCK_ABILITY=Object.freeze({itemKey:2000065,nativeType:20,scriptWeaponType:54,power:5,range:250,moveSpeedRate:1.1,attackMoveSpeedRate:1,typeConflict:true});
export const VITAL_SHOCK_LOCOMOTION=Object.freeze({idle:'C0011',run:['C0012','C0013','C0014','C0018','C0017','C0019','C0016','C0015'],runLower:['00008','00009','00010','00014','00013','00015','00012','00011'],normalSource:'NormalState_VitalShock',runSource:'RunState_VitalShock',normal:{blendTicks:1000,loop:true,reset:false,speed:1},walk:{blendTicks:1000,loop:true,reset:false,speed:1}});
export const VITAL_SHOCK_ATTACK_LOWER=Object.freeze({normal:'C0001',run:['DD005','DD006','DD007','DD011','DD010','DD012','DD009','DD008'],kinds:['light','air'],blendTicks:500,loop:true,speed:1});
export const VITAL_SHOCK_HIT_TIMES=Object.freeze({light:[250],air:[200],rush:[200,300,400,500],strong:[350,550],strongFollow:[250,...Array.from({length:27},(_,i)=>300+i*35),1240]});
export const VITAL_SHOCK_DEFINITION=Object.freeze({idle:VITAL_SHOCK_LOCOMOTION.idle,run:VITAL_SHOCK_LOCOMOTION.run,runLower:VITAL_SHOCK_LOCOMOTION.runLower,supportsAir:true,supportsSecondary:true,supportsStrong:true,
 light:[{clip:'C0001',clipMs:600,actionMs:600,animationSpeed:1,hits:VITAL_SHOCK_HIT_TIMES.light,moveRate:1.1,sceneUpdateMs:40,lowerBeginMs:0,allowJump:false,durationPolicy:'arena 600ms from SetAnim override; native dispatcher unverified'}],
 air:{clip:'DC001',clipMs:650,actionMs:650,animationSpeed:1,hits:VITAL_SHOCK_HIT_TIMES.air,sceneUpdateMs:40,lowerBeginMs:0,allowJump:false,spCost:10,minSp:10,durationPolicy:'arena source DC001 duration 3120 ticks/4800; native state exit unverified; no staySky declaration'},
 rush:{clip:'R0001',recoveryClip:'R0026',actionMs:650,recoveryMs:1000,animationSpeed:1,recoveryAnimationSpeed:1,hits:VITAL_SHOCK_HIT_TIMES.rush,moveBoxScale:2.5,sceneUpdateMs:40,moveStopWhenDamage:true},
 strong:{clip:'C0000',recoveryClip:'C0021_1',actionMs:550,recoveryMs:150,animationSpeed:1,hits:VITAL_SHOCK_HIT_TIMES.strong,sceneUpdateMs:40,spCost:15,minSp:15,resetMoveBoxAtSubStateChange:true},
 strongFollow:{clip:'C0000',recoveryClip:'C0021',actionMs:1300,recoveryMs:300,animationSpeed:1,hits:VITAL_SHOCK_HIT_TIMES.strongFollow,sceneUpdateMs:40},
 automaticStrongFollow:false,nativeInputGraphVerified:false});
export const VITAL_SHOCK_STATE_PARAMETERS=Object.freeze({
 light:{source:'StandardVitalShock_Attack',binding:'left_weak',initLua:[40,0,false,false],hitStopMs:300,moveSpeedRate:1.1,setAnimOverride:600},
 air:{source:'StandardVitalShock_JumpAttack',binding:'left_jump',initLua:[40,0,false,false],hitStopMs:270,minSp:10,spCost:10},
 rush:{source:'StandardVitalShock_Dash',binding:'right_attack',initLua:[650,1000,40,true],moveBoxMultiplier:2.5,moveStopWhenDamage:true,actorFrontLock:false,camLimit:[false,10,10],recoverySetAnimOverride:800},
 strong:{source:'StandardVitalShock_Strong',binding:'left_strong1',initLua:[550,150,40,true],hitStopMs:550,minSp:15,spCost:15,mouseSensitivityRotate:.2,resetMoveBoxAtSubStateChange:true},
 strongFollow:{source:'StandardVitalShock_Strong1',binding:'left_strong2',initLua:[1300,300,40,false],hitStopMs:1300,mouseSensitivityRotate:.3,comboCountDynamic:false},
});
const root='/assets/s5runtime/vital-shock';
export const VITAL_SHOCK_RESOURCES=Object.freeze({root,model:root+'/model.json',animations:{male:root+'/animations/male.json',female:root+'/animations/female.json'},effects:root+'/effects-runtime.json',icon:root+'/icon.png',sounds:{strong:root+'/sounds/shockwave_hit.ogg',rush:root+'/sounds/shockwave_blast.ogg',male:root+'/sounds/voice_man_attack_3.ogg',female:root+'/sounds/voice_girl_attack_3.ogg'}});
// Active AddSequence declarations only. Attribute hit sequences are commented out
// in the current attackattribindexer.lua and are deliberately NOT resurrected.
export const VITAL_SHOCK_SOURCE_EVENTS=Object.freeze({
 light:[{timeMs:0,slot:0,sequence:'vital_claw_01',sound:null,durationArgumentMs:5000}],
 air:[{timeMs:0,slot:0,sequence:'vital_claw_02',sound:null,durationArgumentMs:5000}],
 rush:[{timeMs:0,slot:0,sequence:'vt_dashatk_01',sound:'shockwave_blast',durationArgumentMs:5000},{timeMs:0,method:'AddSoundBySex',bone:'Bip01',male:'voice_man_attack_3',female:'voice_girl_attack_3',durationArgumentMs:500}],
 strong:[{timeMs:300,slot:0,sequence:'weapon_vitalshock_strong_02',sound:'shockwave_hit',durationArgumentMs:0}],
 strongFollow:[{timeMs:700,slot:0,sequence:'weapon_vitalshock_strong_01',sound:null,durationArgumentMs:0},{timeMs:1200,slot:0,sequence:null,sound:'shockwave_hit',durationArgumentMs:0},{timeMs:0,slot:0,sequence:'weapon_vitalshock_strong_03',sound:null,durationArgumentMs:700}],
});
const box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
const fan=(parameters)=>({type:'fan',anchor:[0,250,0],direction:[0,-1],parameters});
export function vitalShockAttackContacts(kind,comboIndex=0,{range=250,power=5,additionalPower=0,includeUnverifiedRay=false}={}){
 if(!VITAL_SHOCK_HIT_TIMES[kind])return [];
 if(![range,power,additionalPower].every(Number.isFinite)||range<=0||power<0)throw new TypeError('Invalid Vital Shock combat parameters');
 const contacts=[];
 function add(id,timeMs,powerScale,attribute,shape,extra={}){const conditions=extra.conditions??[];contacts.push({id,timeMs,powerScale,damage:power*powerScale+additionalPower,attribute:'ATTACKATTRIB_VITAL_SHOCK'+attribute,shape,initAttack2:[1,1,false],alwaysCritical:false,dependsOn:null,condition:conditions.find(c=>c.type==='blow')??null,conditions,counterable:null,attributeVerified:false,attributeStatus:'current indexer declarations are commented out',effects:{damageSequence:null,damageObjectSequence:null,damageSound:null},fifthArgumentExpression:'AddtionalPower',source:{path:'script/weapon_vitalshock.lua',function:VITAL_SHOCK_STATE_PARAMETERS[kind].source},...extra});}
 if(kind==='light'){
  if(includeUnverifiedRay)add('Attack1',250,1,'_CRITICAL',{type:'ray',anchor:[0,250,-50],direction:[0,0,-1],length:range*.7},{alwaysCritical:true,geometryPolicy:'opt-in ray; no source DependOn; overlap damage policy unresolved'});
  add('Attack2',250,1,'_LEFT_WEAK_ATTACK',box([0,250,0],[range*.8,range*.55,range*.9]),{cameraShake:{factor1:[50,25,5],factor2:[1,1,1000,1000],randomDirection:false}});
 }else if(kind==='air')add('Attack1',200,1,'_LEFT_WEAK_ATTACK',box([0,130,0],[range*.8,range,range*.9]),{conditions:[{type:'blow',arguments:[0,-1500]}],cameraShake:{factor1:[230,40,30],factor2:[10,60,2000,3000],whenSuccess:true}});
 else if(kind==='rush')for(let i=0;i<4;i++)add('Attack'+(i+1),200+i*100,.5,'_DASH',box([0,200,100],[range*.6,250,range*.7]),{attackSuccessCondition:'CONDITION_ACTOR',...(i===3?{cameraShake:{factor1:[100,50,50],factor2:[0,50,2000,3000],whenSuccess:true}}:{})});
 else if(kind==='strong'){
  add('Attack1',350,.8,'_STRONG',fan([range*.1,range*.25,range*1.75,60]));
  add('Attack2',550,1.2,'_CRITICAL',fan([range*.1,range*.25,range*1.75,60]),{conditions:[{type:'pull',arguments:[200,0,825,5000,100]}],playSound:false,cameraShake:{factor1:[200,50,50],factor2:[60,0,2000,3000],whenSuccess:true}});
 }else if(kind==='strongFollow'){
  add('Attack1#first',250,1,'_STRONG1',box([0,250,0],[range*.3,range*.3,range*.7]));
  // Lua inclusive numeric loop 1..14 step .5: 27 objects, NOT 14 or 8.
  for(let i=0;i<27;i++)add('Attack1#loop'+i,300+i*35,.12,'',fan([range*.3,range*.4,range*.7,40]),{loopIndex:1+i*.5,conditions:[{type:'blow',arguments:[0,500]},{type:'pull',arguments:[200,0,275,500,100]}],cameraShake:{factor1:[100,25,5],factor2:[1,1,1000,1000],randomDirection:true,whenSuccess:true}});
  add('Attack2',1240,2,'_STRONG1',fan([range*.3,range*.6,range,60]),{conditions:[{type:'blow',arguments:[3500,1500]}],cameraShake:{factor1:[220,40,40],factor2:[10,40,2000,3000],whenSuccess:true}});
 }
 return contacts;
}
export const VITAL_SHOCK_LIMITATIONS=Object.freeze(['Current XBN item2000065 type20 conflicts with Lua WEAPONTYPE_VITAL_SHOCK54; native factory and item routing unresolved.','Current attackattribindexer VitalShock blocks are commented; critical multiplier, counterability and impact attributes unavailable.','Light and air native state lifetimes are unresolved; sceneUpdate40 is not an attack phase.','No native input windows or dash-success continuation graph proved; strongFollow is a separate explicit binding, never automatic.','Pull parameters are preserved; native force/time integration is not proved.','Ray is opt-in, with explicit AlwaysCritical and no DependOn; overlap/final damage is unverified.','Current Strong1 has fixed 27-loop contacts, unlike the wiki combo formula; do not substitute wiki numbers.']);
