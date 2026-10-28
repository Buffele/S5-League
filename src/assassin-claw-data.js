// Current item2000005 (Vital Shock), native Assassin Claw family/type20.
// CRC/SHA and exact declarations: work/melee-batch-3/assassin-claw/source-contract.json.
import {ASSASSIN_CLAW_TICKS,ASSASSIN_CLAW_MOVEBOX} from './assassin-claw-motion-data.js';
import {nominalActorTrailWindow} from './actor-trail-window.js';
export {ASSASSIN_CLAW_TICKS,ASSASSIN_CLAW_MOVEBOX};
export const ASSASSIN_CLAW_ABILITY=Object.freeze({itemKey:2000005,nativeType:20,power:5,range:250,moveSpeedRate:1.1,attackMoveSpeedRate:1});
export const ASSASSIN_CLAW_SOURCE_DIRECTIONS=Object.freeze({FRONT:'C0012',LEFT_FRONT:'C0013',LEFT:'C0014',RIGHT_FRONT:'C0015',RIGHT:'C0016',BACK:'C0017',LEFT_BACK:'C0018',RIGHT_BACK:'C0019'});
// Same native-left -> presentation-right boundary as the existing converted rigs.
export const ASSASSIN_CLAW_DIRECTION_KEYS=Object.freeze(['FRONT','LEFT_FRONT','LEFT','LEFT_BACK','BACK','RIGHT_BACK','RIGHT','RIGHT_FRONT']);
const lower={FRONT:'00008',LEFT_FRONT:'00009',LEFT:'00010',RIGHT_FRONT:'00011',RIGHT:'00012',BACK:'00013',LEFT_BACK:'00014',RIGHT_BACK:'00015'};
const attackLower={FRONT:'C0003',LEFT_FRONT:'C0004',LEFT:'C0005',RIGHT_FRONT:'C0006',RIGHT:'C0007',BACK:'C0008',LEFT_BACK:'C0009',RIGHT_BACK:'C0010'};
export const ASSASSIN_CLAW_LOCOMOTION=Object.freeze({idle:'C0011',run:ASSASSIN_CLAW_DIRECTION_KEYS.map(k=>ASSASSIN_CLAW_SOURCE_DIRECTIONS[k]),runLower:ASSASSIN_CLAW_DIRECTION_KEYS.map(k=>lower[k]),
 normalSource:'NormalState_AssassinClaw',runSource:'RunState_AssassinClaw',normal:{blendTicks:1000,loop:true,reset:false,speed:1},walk:{blendTicks:1000,loop:true,reset:false,speed:1}});
export const ASSASSIN_CLAW_ATTACK_LOWER=Object.freeze({normal:'C0000',run:ASSASSIN_CLAW_DIRECTION_KEYS.map(k=>attackLower[k]),source:'UseWeapon1State_AssassinClaw',blendTicks:500,loop:true,speed:1,normalEndBlendTicks:300});
export const ASSASSIN_CLAW_HIT_TIMES=Object.freeze([400,...Array.from({length:8},(_,i)=>500+i*125)]);
export const ASSASSIN_CLAW_DEFINITION=Object.freeze({idle:ASSASSIN_CLAW_LOCOMOTION.idle,run:ASSASSIN_CLAW_LOCOMOTION.run,runLower:ASSASSIN_CLAW_LOCOMOTION.runLower,
 supportsAir:false,supportsSecondary:false,supportsStrong:false,
 // No source duration is declared by InitLua: two seconds is the C0000 clip
 // duration at native speed1 on BOTH rigs, an explicit arena lifetime policy.
 light:[{clip:'C0000',clipMs:2000,actionMs:2000,animationSpeed:1,hits:ASSASSIN_CLAW_HIT_TIMES,moveRate:1,allowJump:true,lowerBeginMs:0}],
 lifetimePolicy:'arena-source-clip-duration; native state exit unverified'});
export const ASSASSIN_CLAW_STATE=Object.freeze({source:'StandardAssassinclaw',initLua:[40,0,false,true],moveSpeedRate:1,stealthCancel:true,
 animations:['FIRST','SECOND','THIRD'].map(slot=>({slot,clip:'C0000',blendTicks:200,endBlendTicks:300,loop:false,speed:1,reset:true})),
 attachment:{name:'ber_arm_R',link:1,sceneIndex:0,idleAttachment:null},inputBindings:['left_attack']});
export const ASSASSIN_CLAW_RESOURCES=Object.freeze({root:'/assets/s5runtime/assassin-claw',model:'/assets/s5runtime/assassin-claw/model.json',
 animations:{male:'/assets/s5runtime/assassin-claw/animations/male.json',female:'/assets/s5runtime/assassin-claw/animations/female.json'},
 effects:'/assets/s5runtime/assassin-claw/effects-runtime.json',icon:'/assets/s5runtime/assassin-claw/icon.png',
 sounds:{light:'/assets/s5runtime/assassin-claw/sounds/bmindenergy_enemy.ogg',lightHit:'/assets/s5runtime/assassin-claw/sounds/sword_attack.ogg'}});
export const ASSASSIN_CLAW_TRAIL=Object.freeze({name:'GhostTrail_two_hand_sword_01',startMs:50,durationMs:350,endMs:350,shape:'Line01',texture:'/assets/s5runtime/assassin-claw/textures/gi.png'});
export const ASSASSIN_CLAW_LIMITATIONS=Object.freeze([
 'Only left_attack is bound. No secondary, dedicated aerial attack, heavy alias or charge is invented; airborne left eligibility remains unverified.',
 'Two-second action duration is a clip-based arena policy, not proved native lifetime. Native InitLua fields remain separately retained.',
 'Attachment link1 and skinned hand need post-mixer main-game validation; source matrices/weights are preserved.',
 'No push/blow/stun condition is declared. Do not add generic physical push for these contacts.',
 'AdditionalPower is included in InitAttack1 fourth argument; separate fifth AddtionalPower binding remains unresolved.',
 'No dependent critical object is declared. DAMAGEBYPART_ENABLE is retained, not interpreted as a proved critical multiplier.',
 'Contact particle resources are restored; rendering/follow and trail Line01 shape require main-game observation.',
]);
export function assassinClawAttackContacts(kind,comboIndex=0,{range=ASSASSIN_CLAW_ABILITY.range,power=ASSASSIN_CLAW_ABILITY.power,additionalPower=0}={}){
 if(kind!=='light')return [];
 if(!Number.isInteger(comboIndex)||comboIndex<0||!Number.isFinite(range)||range<=0||![power,additionalPower].every(Number.isFinite)||power<0)throw new TypeError('Invalid Assassin Claw combat parameters');
 return ASSASSIN_CLAW_HIT_TIMES.map((timeMs,i)=>({id:'Attack#'+i,creationIndex:i,sourceVariable:'Attack',timeMs,powerScale:i?1:4,damage:power*(i?1:4)+additionalPower,
  damageMeaning:'InitAttack1 fourth argument; defence/body-part multipliers not applied',fifthArgumentExpression:'AddtionalPower',
  attribute:'ATTACKATTRIB_ASSASSIN_CLAW',shape:{type:'box',anchor:[0,250,-100],direction:[0,0,-1],dimensions:[100,100,range]},initAttack2:[1,1,false],
  alwaysCritical:false,dependsOn:null,condition:null,conditions:[],counterable:false,
  reaction:{sourceDirection:['DIR_FRONT','PART_MIDDLE'],sourcePower:['POWER_WEAK','DESTROY_BLASTOBJECT_DAMAGE_5'],sourceGuardData:[400,'GUARDCRUSH_ENABLE'],sourceDamageData:[400,'DAMAGEMOVING_DISABLE','DAMAGEBYPART_ENABLE']},
  cameraShake:{enable:[true,true,0],factor1:[50,25,5],factor2:[1,1,1000,1000],randomDirection:true},
  effects:{damageSequence:'effects/weapon_mindshock_body.seq',damageObjectSequence:'effects/weapon_mindshock_body.seq',damageSound:'lightHit',nativeDamageSound:'sound/sword_attack.ogg',nativeObjectSound:'sound/sword_attack.ogg',attackSequence:'effects/blank_1sec.seq',nativeAttackSound:'sound/bmindenergy_enemy.ogg'},
  source:{path:'script/weapon_assassinclaw.lua',function:'StandardAssassinclaw',branch:'unconditional',...(i?{loopIndex:i}:{})}}));
}
export function assassinClawTrailWindow(attack){return attack?.weapon==='assassinclaw'&&attack.kind==='light'&&nominalActorTrailWindow(attack.timeMs??(attack.time??0)*1000,{beginMs:ASSASSIN_CLAW_TRAIL.startMs,endMs:ASSASSIN_CLAW_TRAIL.durationMs});}
