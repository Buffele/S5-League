import {SIGMA_BLADE_SOURCE_STATES as STATES,SIGMA_BLADE_SOURCE_ATTRIBUTES as ATTRIBUTES} from './sigma-blade-source-data.js';
import {nativeCylinderShapeFromLua} from './native-cylinder-binding.js';
export {SIGMA_BLADE_SOURCE_STATES,SIGMA_BLADE_SOURCE_ATTRIBUTES} from './sigma-blade-source-data.js';
export const SIGMA_BLADE_ABILITY=Object.freeze({itemKey:2000017,nativeType:38,power:12.5,range:500,moveSpeedRate:1.1,attackMoveSpeedRate:1});
const directions=['FRONT','LEFT_FRONT','LEFT','LEFT_BACK','BACK','RIGHT_BACK','RIGHT','RIGHT_FRONT'];
function run(channel,transformed=false){const calls=STATES.RunState_SigmaBlade.animations;return directions.map(d=>calls.find(a=>a.slot===`ANIMPARAMLIST_${channel}_${d}${transformed?'_TRNAS':''}`).arguments[0]);}
export const SIGMA_BLADE_RUN=Object.freeze(run('UPPER'));
export const SIGMA_BLADE_RUN_TRANSFORMED=Object.freeze(run('UPPER',true));
export const SIGMA_BLADE_RUN_LOWER=Object.freeze(run('LOWER'));
export const SIGMA_BLADE_LOCOMOTION=Object.freeze({normal:{idle:'DC000',run:SIGMA_BLADE_RUN,runLower:SIGMA_BLADE_RUN_LOWER},transformed:{idle:'DC019',run:SIGMA_BLADE_RUN_TRANSFORMED,runLower:SIGMA_BLADE_RUN_LOWER},fade:1000/4800,loop:true,speed:1,presentationMapping:directions});
const names={air:'StandardSigmaBladeJumpDash',strong:'StandardSigmaBladeCounterAttack',heavy:'StandardSigmaBladeWeaponChange',transform:'StandardSigmaBladeWeaponChange'};
const animationNames={air:'SwordJumpAtkState_SigmaBlade',strong:'SwordAtkCounterAttack_SigmaBlade',heavy:'UseWeapon2State_SigmaBladeWeaponChange',transform:'UseWeapon2State_SigmaBladeWeaponChange'};
function stateName(kind,comboIndex=0){if(kind==='light'){if(!Number.isInteger(comboIndex)||comboIndex<0||comboIndex>3)throw new RangeError('Sigma combo index must be0..3');return 'StandardSigmaBladeAfterDash'+(comboIndex+1);}if(!names[kind])throw new RangeError('Unknown Sigma action '+kind);return names[kind];}
function evaluate(value,range){if(typeof value==='number')return value;if(value==='range')return range;const m=/^range\s*\*\s*([\d.]+)$/.exec(value);if(!m)throw Error('Unsupported Sigma range expression '+value);return range*Number(m[1]);}
export function sigmaBladeAttackContacts(kind,comboIndex=0,{transformed=false,range=500,power=12.5,additionalPower=0}={}){
 if(typeof transformed!=='boolean')throw new TypeError('Explicit Sigma transformed boolean required');
 if(!(Number.isFinite(range)&&range>0&&Number.isFinite(power)&&power>=0&&Number.isFinite(additionalPower)))throw new RangeError('Invalid Sigma ability');
 if(['guard','charge','gather'].includes(kind))return [];
 const name=stateName(kind,comboIndex),state=STATES[name],change=['heavy','transform'].includes(kind);
 // CAttackState Enter5e3660 selects flagfalse/true exclusively via5e6d80/e00.
 // Transformation class6583f0 instead enables every contact only when turning
 // ON (659e90); the aerial Spy class has neither of these entry selectors.
 const selected=change?(transformed?[]:state.contacts):state.contacts.filter(c=>kind==='air'||c.onlyUseInWeaponChange===transformed);
 return selected.map((c,index)=>{
  const a=ATTRIBUTES[c.attribute],{dimensionExpressions,argumentExpressions,...sourceShape}=c.shape;
  let shape=sourceShape;
  if(dimensionExpressions)shape.dimensions=dimensionExpressions.map(v=>evaluate(v,range));
  if(argumentExpressions)shape.arguments=argumentExpressions.map(v=>evaluate(v,range));
  if(shape.type==='cylinder')shape=nativeCylinderShapeFromLua(shape);
  return {...c,index,atMs:c.timeMs,damage:power*c.powerScale,additionalPowerIgnored:additionalPower,shape,
   geometrySupported:shape.type!=='cylinder'||shape.arguments.length===2,
   counterable:a.SetCounterAttack[0]==='COUNTERATTACK_ENABLE',
   condition:c.conditions.at(-1)??null,conditionPolicy:c.conditions.length>1?'arena-last-declared-condition':'source-single-condition',
   reaction:{sourceDamageData:a.SetDamageData,sourceGuardData:a.SetGuardData},
   effects:{damageSequence:a.SetDamageSequence?.[0]??null,damageObjectSequence:a.SetDamageSequence?.[1]??null,nativeDamageSound:a.SetDamageSequence?.[2]??null,nativeObjectDamageSound:a.SetDamageSequence?.[3]??null},
   criticalPolicy:'normal-only; source random critical parameters retained without roll',source:state.source,transformed};
 });
}
export function getSigmaBladeAttackProfile(kind,{comboIndex=0,transformed=false,airAnimationIndex=0}={}){
 const name=stateName(kind,comboIndex),state=STATES[name],p=state.parameters;
 const anim=STATES[kind==='light'?`SwordAtkAfterDash${comboIndex+1}State_SigmaBlade`:animationNames[kind]],calls=anim.animations;
 const change=['heavy','transform'].includes(kind),air=kind==='air';
 const prefix=change?(transformed?'CHANGE_DISABLE':'CHANGE_ENABLE'):transformed&&!air?'SHAPECHNAGE':'';
 const slot=part=>`ANIMPARAMLIST_${prefix?prefix+'_':''}${part}`;
 if(air&&![0,1].includes(airAnimationIndex))throw new RangeError('Sigma air animation index must be 0 or 1');
 const first=air?calls.find(a=>a.slot===`ANIMPARAMLIST_NORMAL_${airAnimationIndex===0?'FIRST':'SECOND'}`):calls.find(a=>a.slot===slot('NORMAL'));
 const delay=air?null:calls.find(a=>a.slot===slot('DELAY'));
 const init=(transformed?p.InitLuaInTrans:null)||p.InitLua;
 const contacts=sigmaBladeAttackContacts(kind,comboIndex,{transformed});
 return {clip:first.arguments[0],...(delay?{recoveryClip:delay.arguments[0]}:{}),actionMs:init[0],recoveryMs:init[1],hits:contacts.map(c=>c.timeMs),strictHits:true,
  multiplier:((transformed?p.SetMoveBoxMultiplierInTrans:null)||p.SetMoveBoxMultiplier||[0])[0],moveRate:p.SetMoveSpeedRate?.[0]??0,locked:!air,
  nativeAnimationSpeed:first.arguments[5],nativeRecoveryAnimationSpeed:delay?.arguments[5]??1,nativeMinimumSceneUpdateMs:init.length===4?init[2]:null,
  // CAttackState, transform659110 and aerial Spy5de490 pass their own
  // InitLua timers to b77cb0; SetAnim argument1 overrides duration.
  nativeRequestedAnimationDurationMs:init[0],nativeAnimationDurationOverrideMs:first.arguments[1],
  ...(!air?{nativeRecoveryRequestedAnimationDurationMs:init[1],nativeRecoveryAnimationDurationOverrideMs:delay?.arguments[1]??0}:{}),
  ...(air?{airAnimationIndex,alternateClip:airAnimationIndex===0?'SN014':'SN013',directAirInputMove:true,recoveryPhase:true,resetVelocityOnRecovery:true,preserveActionAnimationInRecovery:true,lowerIdle:'A0024',lowerWalk:['DD005','DD006','DD007','DD011','DD010','DD012','DD009','DD008']}:{}),
  ...(change?{transformAction:true,nextTransformed:!transformed,coolTimeMs:p.SetCoolTime[0],recoveryPhase:true,resetVelocityOnRecovery:true}:{}),
  stateMinSp:p.SetStateMinSp?.[0]??0,spendSp:p.SetSpendSp?.[0]??0,
  sourceAction:name,sourceParameters:p,transformed,contacts,
  timingLimit:change?'Native transform class659110 fits requested durations; zero-duration recovery exits on a subsequent positive tick; global scheduling remains unverified':air?'Native Spy phase5de490 requests action duration550; empty recovery AnimParam retains the existing clip; global scheduling remains unverified':'Native CAttackState requested-duration fitting applied to action/recovery; global blend/reset scheduling remains unverified'};
}
export function sigmaBladeDefinition({transformed=false}={}){
 const locomotion=SIGMA_BLADE_LOCOMOTION[transformed?'transformed':'normal'];
 // The native normal input map stops at the second strike. The third is
 // fully available via getSigmaBladeAttackProfile; do not invent its entry.
 return {...locomotion,light:Array.from({length:transformed?4:2},(_,comboIndex)=>getSigmaBladeAttackProfile('light',{comboIndex,transformed})),strong:getSigmaBladeAttackProfile('strong',{transformed}),heavy:getSigmaBladeAttackProfile('heavy',{transformed}),air:getSigmaBladeAttackProfile('air',{transformed})};
}
export const SIGMA_BLADE_DEFINITION=sigmaBladeDefinition();
export const SIGMA_BLADE_TRANSFORMED_DEFINITION=sigmaBladeDefinition({transformed:true});
export const SIGMA_BLADE_RESOURCES=Object.freeze({weapon:'/assets/s5runtime/sigma-blade/model.json',transformedWeapon:'/assets/s5runtime/sigma-blade/model-transformed.json',animationDelta:sex=>`/assets/s5runtime/sigma-blade/animations/${sex}.json`,effects:'/assets/s5runtime/sigma-blade/effects-runtime.json',icon:'/assets/s5runtime/sigma-blade/icon.png',attachment:'R_Hand_Dummy',alignment:'Sigma_Wea_Dummy',transformedAlignment:'Sigma2_Wea_Dummy'});
export const SIGMA_BLADE_UNCERTAINTIES=Object.freeze([
 'CAttackState contact mode selection is native-decoded; aerial Spy class keeps its separate, unchanged contact set.',
 'Normal combo3 geometry is decoded (Lua ignores its two extra scalars), but normal input map has no entry to it; source profile remains accessible.',
 'Transformation toggles at entry; min-SP20 only for enabling, cooldown1500 only for disabling. Sustained drain and mode persistence after weapon switches remain unverified.',
 'All InitAttack1 expressions omit AdditionalPower; no additional damage or critical multiplier is silently added.',
 'Attributes named COUNTER_CRITICAL are not SetAlwaysCritical; source chance SetCritical(1.5,10) is metadata only under normal-only arena policy.',
 'Local aerial SN013/SN014 alternation is decoded and consumed at accepted entry; remote packet phase selection and native actor recreation lifetime remain unverified.',
 'Multiple Push/Blow conditions are preserved; arena selects the last declared condition, not a proven native composition.',
]);
