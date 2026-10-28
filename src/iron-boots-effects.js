import {readAsset} from './scene-assets.js';
import {withMeleeEffectHierarchies} from './melee-effect-hierarchy.js';
export const IRON_BOOTS_EFFECT_RUNTIME='/assets/s5runtime/iron-boots/effects-runtime.json';
export const loadIronBootsEffectDefinitions=async()=>withMeleeEffectHierarchies(await readAsset(IRON_BOOTS_EFFECT_RUNTIME));
export async function loadIronBootsEffects(scene){const {loadEffectRuntime}=await import('./combat-effects.js');return loadEffectRuntime(scene,await loadIronBootsEffectDefinitions());}
// Source AddSequence windows; follow policy is explicit S5 presentation.
export function ironBootsStateCues(attack,{sex='male'}={}){
 if(attack?.weapon!=='ironboots')return [];
 if(attack.kind==='air')return [{name:'ironboots_2atk_01',at:.3,sourceClock:'actor-state',sourceEndMs:800,follow:false},{name:'weapon_counter_upper01',at:.5,sourceClock:'actor-state',sourceEndMs:5000,follow:false}];
 if(attack.kind==='strong')return [{name:sex==='female'?'weapon_ironboots_strong_01':'weapon_ironboots_n_strong_01',at:0,sourceClock:'actor-state',sourceEndMs:5000,follow:false}];
 if(attack.kind==='dash'||attack.kind==='heavy')return [{name:'ironboots_dashatk_01',at:0,sourceClock:'actor-state',sourceEndMs:5000,follow:false}];
 return [];
}
// Native instant effects need actual booster sockets; do not relocate to root.
export const IRON_BOOTS_BOOST_CUES=Object.freeze(['L','R'].flatMap(side=>[1,2].map(n=>({bone:side+'_boo_Dummy0'+n,name:'ironboots_n_booster_0'+(n===1?1:0),at:.05,sourceEndMs:2500,follow:true}))));
export function ironBootsSoundCues(attack){if(attack?.weapon!=='ironboots')return [];if(attack.kind==='light')return attack.comboIndex===2?[]:[{name:'bsword_counter',at:attack.comboIndex===1?.5:.45}];if(attack.kind==='strong')return [{name:'deathside_jump',at:0}];if(attack.kind==='air')return [{name:'deathside_jump',at:0},{name:'bsword_counter',at:.5}];return [];}
export const IRON_BOOTS_TRAIL_WINDOWS=Object.freeze({light:[[{name:'GhostTrail_IronBoots_1',beginMs:50,endMs:900},{name:'GhostTrail_IronBoots_2',beginMs:600,endMs:600}],[{name:'GhostTrail_IronBoots_1',beginMs:50,endMs:900},{name:'GhostTrail_IronBoots_2',beginMs:50,endMs:900}],[{name:'GhostTrail_IronBoots_1',beginMs:50,endMs:600},{name:'GhostTrail_IronBoots_2',beginMs:50,endMs:600}]],strong:[{name:'GhostTrail_IronBoots_1',beginMs:50,endMs:600},{name:'GhostTrail_IronBoots_2',beginMs:50,endMs:600}],air:[{name:'GhostTrail_IronBoots_Tachyon_1',beginMs:50,endMs:600},{name:'GhostTrail_IronBoots_Tachyon_2',beginMs:50,endMs:600}]});
