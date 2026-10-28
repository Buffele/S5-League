import{selectAnchoringControllerDuration}from'./anchoring-model-duration.js';
export function createAnchoringPostLoadControllerProfile({modelFile,sourceSha256,selectedName,constructorEntry,provenance}){
 if(!['0x11528a0','0x7c7a90'].includes(constructorEntry))throw Error('Explicit authenticated controller constructor required');
 const duration=selectAnchoringControllerDuration({modelFile,sourceSha256,selectedName,provenance});
 return Object.freeze({...duration,clock:0,duration:duration.nativeDurationTicks,raw38:true,raw39:true,rate:1,constructorEntry,sourceConstructorFlagsVerified:true,sourceNamedSelectionPreservesFlagsVerified:true,sourceClockResetPreservesFlagsVerified:true,selectorArg1Field:'0x50',nativeRuntimeConstructorBindingVerified:false,nativeCompared:false,x87Parity:false});
}
export function describeAnchoringSceneEnterFlags({bodyField}){
 if(!['0x190','0x194','0x198'].includes(bodyField))throw Error('Unknown source body field');
 return Object.freeze({bodyField,sceneD0:bodyField==='0x198'?1:5,args115c9a0:Object.freeze([true,false,bodyField!=='0x198']),call115c8e0:bodyField!=='0x198',value115c8e0:bodyField!=='0x198'?true:null,changesController38:false,changesController39:false,changesControllerRate:false,clockSchedulingEligibleNotGuaranteed:true,nativeCompared:false});
}
