// Source initialization model only; no runtime registry read/default injection.
const fromBits=bits=>{const b=new ArrayBuffer(4),v=new DataView(b);v.setUint32(0,bits,true);return v.getFloat32(0,true);};
export const GRENADE_STEP_INITIALIZATION_ID='grenade-global-float-step-current-pe-v1';
export function createGrenadeStepInitializationProfile({provenance}={}){
 if(provenance?.kind!=='source-initialization-model'||typeof provenance.source!=='string'||!provenance.source.trim())throw new Error('Explicit source-initialization-model selection and provenance required');
 return Object.freeze({schema:GRENADE_STEP_INITIALIZATION_ID,physicsCoefficientPerMs:fromBits(0x3a83126f),physicsStepCap:fromBits(0x3dcccccd),
  registry:Object.freeze({managerAddress:'0x1642f30',vectorPointerOffset:8,elementStrideBytes:12,getter:'1053900',logicalDecoder:'4AD540',coefficientFloatIndex:3,capFloatIndex:23,initializer:'10501A0',bootCaller:'49B0EB'}),
  units:'source-integration-step per engine millisecond; cap in source-integration-step',selection:'compiled-default-current-PE; explicitly selected model',
  peSha256:'6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017',
  provenance:Object.freeze({...provenance}),sourceInitializationVerified:true,currentRuntimeObserved:false,nativeRuntimeValueObserved:false,nativeReady:false});
}
