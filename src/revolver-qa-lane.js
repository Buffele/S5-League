import {advanceRevolverState,createRevolverState,revolverMotionSample,REVOLVER_DIRECTIONS,REVOLVER_PROFILE} from './revolver-runtime.js';

export const REVOLVER_QA_LANE=Object.freeze({
  id:'revolver-classic',label:'REVOLVER CLASSIQUE · EXPÉRIMENTAL',group:'arsenal-third-qa',order:1,
  isolated:true,enabled:true,experimental:true,runtimeReady:true,visualReady:true,
  registeredInQaMatrix:false,registeredInQaMatrix2:false,registeredInLoadout:true,
  profile:REVOLVER_PROFILE,sexes:Object.freeze(['male','female']),directions:REVOLVER_DIRECTIONS,
  assets:Object.freeze({model:'/assets/s5runtime/weapons/revolver/model.json',animations:'/assets/s5runtime/animations/revolver/manifest.json',contract:'/assets/s5runtime/weapons/revolver/contract.json',runtime:'/assets/s5runtime/weapons/revolver/runtime-manifest.json'}),
  animationEvidence:sex=>`/assets/s5runtime/animations/revolver/${sex}.json`,
  runtime:Object.freeze({createState:createRevolverState,advance:advanceRevolverState,motionSample:revolverMotionSample}),
  assertions:Object.freeze({weaponMeshes:4,activeAttachment:'R_Hand_Dummy',idleAttachmentPending:'Gun_Dummy',postMixer:true,antialias:true,diagnosticMaterial:null}),
  audio:Object.freeze({active:true,shot:'/assets/s5runtime/weapons/revolver/sounds/revo_blast.ogg',reload:'/assets/s5runtime/weapons/revolver/sounds/revo_reload.ogg',reason:'Authentic assets restored'}),
  effects:Object.freeze({active:true,source:'/assets/s5runtime/effects/revolver/sequences/weapon_revolver_fire.json',reason:'Native sequences rendered in main game; exhaustive S5Runtime comparison pending'}),
  blockers:Object.freeze(['Native equip/stow, relink timing, aerial states and push-condition semantics are not certified.']),
  gate:'EXPERIMENTAL · MAIN GAME',
});
