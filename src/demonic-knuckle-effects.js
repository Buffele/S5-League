import {readAsset} from './scene-assets.js';
import {withMeleeEffectHierarchies} from './melee-effect-hierarchy.js';
export const DEMONIC_KNUCKLE_EFFECT_RUNTIME='/assets/s5runtime/demonic-knuckle/effects-runtime.json';
export const loadDemonicKnuckleEffectDefinitions=async()=>withMeleeEffectHierarchies(await readAsset(DEMONIC_KNUCKLE_EFFECT_RUNTIME));
export async function loadDemonicKnuckleEffects(scene){const {loadEffectRuntime}=await import('./combat-effects.js');return loadEffectRuntime(scene,await loadDemonicKnuckleEffectDefinitions());}
const handOf=a=>a.hand??a.profile?.hand;
export function demonicKnuckleStateCues(attack){
 if(attack?.weapon!=='demonicknuckle')return [];
 let name,at=0,end=5000;
 if(attack.kind==='light'){
  const hand=handOf(attack);if(!['left','right'].includes(hand))throw new TypeError('Light effect needs explicit native hand selection');
  name=hand==='right'?'demonic_claw_02':'demonic_claw_01';
 }else if(attack.kind==='air'){name='demonic_kn013_eff_01';at=.5;}
 else if(attack.kind==='heavy'){name='demonic_kn014_eff_01';end=2000;}
 else return [];
 // Active loader/particle roots for both claws and the aerial carrier inherit
 // the local actor scene. Aerial children retain their declared dummy parent.
 const actorSceneRoot=attack.kind==='light'||attack.kind==='air';
 return [{name,at,follow:actorSceneRoot,...(actorSceneRoot?{actorSceneRoot:true}:{followBones:true}),sourceEndMs:end,sourceClock:'actor-state',sourceMethod:attack.kind==='light'?'SetOnlyOneSequence':'AddSequence',spatialPolicy:actorSceneRoot?'evaluated actor scene; declared internal dummy parents retained':'fixed sequence root; named actor bones follow the evaluated pose'}];
}
export function demonicKnuckleSoundCues(attack,{sex=attack?.sex??'male'}={}){
 if(attack?.weapon!=='demonicknuckle'||!['light','light2','air','heavy'].includes(attack.kind))return [];
 const light=attack.kind==='light'||attack.kind==='light2';
 return [{name:`voice_${sex==='female'?'girl':'man'}_attack_${light?2:3}`,at:0,bone:'Bip01',sourceMethod:'AddSoundBySex',sourceEndMs:light?5000:2500},...(attack.kind==='air'?[{name:'bsword_counter',at:.5,sourceMethod:'AddSequence',sourceEndMs:5000}]:[])];
}
export function demonicKnuckleTrailWindows(attack){
 if(attack?.weapon!=='demonicknuckle')return [];
 const row=(side,beginMs,endMs)=>({name:`GhostTrail_Demonic_Knuckle_${side}`,beginMs,endMs});
 if(attack.kind==='light'){
  const hand=handOf(attack);if(!['left','right'].includes(hand))throw new TypeError('Light trail needs explicit hand');return [row(hand==='right'?'Right':'Left',0,150)];
 }
 if(attack.kind==='light2')return [row('Right',50,300)];
 if(attack.kind==='air')return [row('Left',50,400),row('Right',50,1000)];
 if(attack.kind==='heavy')return [row('Left',0,100),row('Right',0,100)];
 return [];
}
export const DEMONIC_KNUCKLE_SOUND_FILES=Object.freeze(Object.fromEntries(['voice_man_attack_2','voice_girl_attack_2','voice_man_attack_3','voice_girl_attack_3','bsword_counter','bsword_attack','bsword_power'].map(n=>[n,'/assets/s5runtime/demonic-knuckle/sounds/'+n+'.ogg'])));
