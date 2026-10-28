import {advanceMindEnergyState,createMindEnergyState,mindEnergyMotionSample,MIND_ENERGY_DIRECTIONS,MIND_ENERGY_PROFILE} from './mind-energy-runtime.js';

export const MIND_ENERGY_QA_LANE=Object.freeze({
  id:'mind-energy-classic-isolated',title:'Mind Energy classique · aperçu isolé',url:'http://127.0.0.1:5173/mind-energy-preview.html',
  weapon:'mind-energy',skin:'classic',sexes:Object.freeze(['male','female']),directions:MIND_ENERGY_DIRECTIONS,profile:MIND_ENERGY_PROFILE,
  assets:Object.freeze({model:'/assets/s5runtime/weapons/mind-energy/model.json',animations:'/assets/s5runtime/animations/mind-energy/manifest.json',runtime:'/assets/s5runtime/weapons/mind-energy/runtime-manifest.json'}),
  animationEvidence:sex=>`/assets/s5runtime/animations/mind-energy/${sex}.json`,
  runtime:Object.freeze({createState:createMindEnergyState,advance:advanceMindEnergyState,motionSample:mindEnergyMotionSample}),
  assertions:Object.freeze({weaponMeshes:1,activeAttachment:'Bip01 R Forearm',postMixer:true,diagnosticMaterial:'#74e7ff'}),
  failClosed:Object.freeze({textures:true,sounds:true,effects:true,reload:true,secondaryAnimations:true}),
  isolated:true,registeredInQaMatrix:false,registeredInLoadout:false,gate:'APERÇU ISOLÉ · SECONDAIRE FERMÉ',
});
