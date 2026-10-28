import {readAsset} from './scene-assets.js';
import {withMeleeEffectHierarchies} from './melee-effect-hierarchy.js';
import {SIGMA_BLADE_SOURCE_STATES as STATES} from './sigma-blade-source-data.js';
export const SIGMA_BLADE_EFFECT_RUNTIME='/assets/s5runtime/sigma-blade/effects-runtime.json';
export const loadSigmaBladeEffectDefinitions=async()=>withMeleeEffectHierarchies(await readAsset(SIGMA_BLADE_EFFECT_RUNTIME));
export async function loadSigmaBladeEffects(scene){const {loadEffectRuntime}=await import('./combat-effects.js');return loadEffectRuntime(scene,await loadSigmaBladeEffectDefinitions());}
const LEG=Object.freeze([{name:'sigmablade_leg_eff',at:0,sourceClock:'actor-state',follow:false,sourceEndMs:5000,sourceMethod:'AddSequenceBySex',sourceTrailingFlag:false}]);
const STRONG=Object.freeze([{name:'sigmablade_power_att',at:.6,sourceClock:'actor-state',follow:true,actorSceneRoot:true,sourceEndMs:5000,sourceTrailingFlag:true}]);
export function sigmaBladeStateCues(attack){
 if(attack?.weapon!=='sigmablade')return [];
 const transformed=attack.transformed??attack.profile?.transformed??false;
 // Native562220..56227B requires record+64 == actor virtual19C (form).
 // AddSequenceBySex's omitted last Lua argument converts to false (567A50).
 if(attack.kind==='light'&&attack.comboIndex===1&&!transformed)return LEG;
 if(attack.kind==='strong'&&transformed)return STRONG;
 return [];
}
// Historical presentation-only export. Runtime uses sigmaBladeSoundCues
// below; this table omits source voices and is not an exhaustive contract.
export const SIGMA_BLADE_SOUNDS=Object.freeze({
 normal:{light:[[{name:'sigmablade_cut',at:.18}],[{name:'sigmablade_cut_finish',at:.22}],[],[]],air:[{name:'sigmablade_cut',at:.3}],strong:[]},
 transformed:{light:[[{name:'sigmablade_cut_power',at:.4}],[{name:'sigmablade_cut_power',at:.39}],[{name:'sigmablade_cut_power',at:.3}],[{name:'sigmablade_cut_power',at:.2}]],air:[{name:'sigmablade_cut_power',at:.3}],strong:[{name:'sigmablade_cut_air',at:.002},{name:'sword_power',at:.6}]},
});
// 562640 dispatches normal/transformed vectors exclusively through actor
// virtual19c; 564510/5649a0 select the male/female sound from those vectors.
// Derive declarations from the authenticated Lua contract, including voices.
export function sigmaBladeSoundCues(attack,{sex=attack?.sex??'male',transformed=attack?.transformed??attack?.profile?.transformed??false}={}){
 if(attack?.weapon!=='sigmablade')return [];
 if(!['male','female'].includes(sex)||typeof transformed!=='boolean')throw new TypeError('Explicit Sigma sound sex and form required');
 const state=attack.kind==='light'?`SwordAtkAfterDash${attack.comboIndex+1}State_SigmaBlade`:
  attack.kind==='air'?'SwordJumpAtkState_SigmaBlade':attack.kind==='strong'?'SwordAtkCounterAttack_SigmaBlade':null;
 if(!state)return [];
 return STATES[state].events.flatMap((event,sourceIndex)=>{
  const {method,arguments:a}=event;
  if(!['AddSound','AddSoundBySex','AddSoundTransBySex'].includes(method))return [];
  if((method==='AddSoundTransBySex')!==transformed)return [];
  const paired=method!=='AddSound',sound=a[paired?(sex==='female'?1:0):0],name=sound.split('/').at(-1).replace(/\.ogg$/i,'');
  const voice=/^voice_(?:man|girl)_attack_(\d+)$/.exec(name);
  return [{name,key:voice?`voice${voice[1]}`:name,at:a[paired?3:2]/1000,timeMs:a[paired?3:2],bone:a[paired?2:1],sourceEndMs:a[paired?4:3],sourceMethod:method,sourceIndex}];
 }).concat(attack.kind==='strong'&&transformed?[{name:'sword_power',key:'sword_power',at:.6,timeMs:600,sourceIndex:'sequence-power',sourceMethod:'AddSequence',sourceTrailingFlag:true}]:[]);
}
// Event clocks and form selection are sourced. Actor following, source trail
// rendering and audio spatialization have not been compared in native play.
