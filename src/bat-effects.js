import {readAsset} from './scene-assets.js';
export const BAT_EFFECT_RUNTIME='/assets/s5runtime/bat/effects-runtime.json';
export const BAT_NATIVE_SHAPE_POSE='/assets/s5runtime/bat/models/a0015-native-pose.json';
export const loadBatNativeShapePose=()=>readAsset(BAT_NATIVE_SHAPE_POSE);
export async function loadBatEffectDefinitions(){
 const source=await readAsset(BAT_EFFECT_RUNTIME);
 return Object.fromEntries(Object.entries(source).map(([name,definition])=>[name,{...definition,
  ...(['bat_jumpattack','bat_whirlwind1'].includes(name)?{strictNamedParents:true}:{}),nodes:definition.nodes.map(node=>{
  if(node.type==='CActParticle')return {...node,anchorRotation:true};
  if(name==='bat_jumpattack'&&node.id===7){
   if(node.asset!=='/assets/s5runtime/bat/models/eff_bat_jumpattack.json')throw Error('Bat aerial source loader changed');
   return {...node,loader:{...node.loader,animation:'JUMP_ATTACK',includeSourceBones:true,nativeHierarchy:'bat'}};
  }
  if(name==='bat_whirlwind1'&&node.id===2){
   if(node.asset!=='/assets/s5runtime/bat/models/eff_bat_wind.json')throw Error('Bat whirlwind source loader changed');
   return {...node,loader:{...node.loader,animation:'WIND EFF3',includeSourceBones:true,nativeHierarchy:'bat'}};
  }
  return node;
 })}]));
}
export async function loadBatEffects(scene){const {loadEffectRuntime}=await import('./combat-effects.js');return loadEffectRuntime(scene,await loadBatEffectDefinitions());}
const AIR=Object.freeze([{name:'skill_bat_strike',at:0,sourceClock:'actor-state',sourceEndMs:5000,follow:false},{name:'bat_jumpattack',at:0,sourceClock:'actor-state',sourceEndMs:5000,follow:false}]);
const WHIRL=Object.freeze([{name:'bat_whirlwind1',at:0,sourceClock:'actor-state',sourceEndMs:5000,follow:false}]);
export function batStateCues(attack){return attack?.weapon!=='bat'?[]:attack.kind==='air'?AIR:['spin4','spin5'].includes(attack.kind)?WHIRL:[];}
export function batSoundCues(attack){
 if(attack?.weapon!=='bat')return [];
 if(attack.kind==='air')return [{key:'air',timeMs:300,sourceMethod:'AddSequence',sourceEndMs:5000}];
 if(['heavy','spin2','spin3','spin4','spin5'].includes(attack.kind))return [{key:'rush',timeMs:0,sourceMethod:'AddSequence',sourceEndMs:5000}];
 return [];
}
export const BAT_MISSING_EFFECTS=Object.freeze([{name:'skill_bat_strike1',at:.3,sourceEndMs:5000,reason:'Absent from current archive index; authored sound sword_power is available separately'}]);
// follow:false is S5 placement policy; native parent/follow fidelity is unverified.
