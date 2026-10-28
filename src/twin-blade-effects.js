import {readAsset} from './scene-assets.js';
import {TWIN_CHAIN_ASSET,TWIN_CHAIN_HELPERS,TWIN_AIR_CHAIN_ASSET,TWIN_AIR_CHAIN_HELPERS} from './twin-chain-hierarchy.js';

export const TWIN_BLADE_EFFECT_RUNTIME='/assets/s5runtime/twin-blade/effects-runtime.json';
export async function loadTwinBladeEffectDefinitions(){
 const [definitions,heavy,air]=await Promise.all([readAsset(TWIN_BLADE_EFFECT_RUNTIME),readAsset(TWIN_CHAIN_HELPERS),readAsset(TWIN_AIR_CHAIN_HELPERS)]);
 return Object.fromEntries(Object.entries(definitions).map(([name,data])=>[name,{...data,nodes:data.nodes.map(node=>{
  const profile=node.asset===TWIN_CHAIN_ASSET?{name:'chain',animation:'BASE',sourceHierarchy:heavy}:node.asset===TWIN_AIR_CHAIN_ASSET?{name:'chain_12',animation:'base',sourceHierarchy:air}:null;
  if(!profile)return node;
  if(name!==profile.name||node.type!=='CActNodeLoader'||node.loader.animation)throw Error('Twin chain source loader changed');
  return {...node,loader:{...node.loader,animation:profile.animation,nativeHierarchy:'twin-chain',sourceHierarchy:profile.sourceHierarchy}};
 })}]));
}
export async function loadTwinBladeEffects(scene){
  const {loadEffectRuntime}=await import('./combat-effects.js');
  return loadEffectRuntime(scene,await loadTwinBladeEffectDefinitions());
}

// Authenticated actorstates_doublesword.lua AddSequence entries only.
// Times below are seconds. sourceEndMs is preserved, not used to stretch SEQ.
// Both chain scenes have observed actor-scene parents and qualified internal
// hierarchies. The unobserved delayed strike retains its arena policy.
const AIR=Object.freeze([{name:'chain_12',at:0,sourceClock:'actor-state',sourceEndMs:800,follow:true,actorSceneRoot:true}]);
const HEAVY=Object.freeze([{name:'chain',at:0,sourceClock:'actor-state',sourceEndMs:800,follow:true,actorSceneRoot:true},{name:'skill_doublesword_strike',at:.5,sourceClock:'actor-state',sourceEndMs:5000,follow:false}]);
export function twinBladeStateCues(attack){
  if(attack?.weapon!=='twinblade')return [];
  return attack.kind==='air'?AIR:attack.kind==='heavy'?HEAVY:[];
}
// These sounds belong to AddSequence on state entry, not hit-volume clocks.
export function twinBladeSoundCues(attack){
 if(attack?.weapon!=='twinblade'||!['heavy','air'].includes(attack.kind))return [];
 return [{key:attack.kind==='air'?'air':'rush',timeMs:0,sourceMethod:'AddSequence',sourceEndMs:0}];
}
// Optional explicit reconstruction for integration: both sequence resources
// now exist, but their charge-entry/full/loop native triggering is unverified.
export const TWIN_BLADE_CHARGE_EFFECT_POLICY=Object.freeze({
  verified:false,entry:'weapon_twinseord_charge',loop:'weapon_twinseord_charge_loop',
  reason:'Do not infer event timing or actor following merely from resource names',
});
