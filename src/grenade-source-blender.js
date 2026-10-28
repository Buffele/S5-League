import {GRENADE_SOURCE_BLENDER_DATA as source} from './grenade-source-blender-data.js';
const f=Math.fround;
const origin=p=>{if(!['source-port','s5-explicit-adaptation','source-initialization-model'].includes(p?.kind)||typeof p.source!=='string'||!p.source.trim())throw Error('Explicit Grenade custom context provenance required');};
export function createGrenadeCustomBlendInitialization({provenance}={}){
 origin(provenance);if(provenance.kind!=='source-initialization-model')throw Error('Select compiled initialization explicitly');
 return Object.freeze({float47:1,positiveLimit:90,negativeLimit:-90,indices:Object.freeze([47,94,95]),provenance:Object.freeze({...provenance}),currentRuntimeObserved:false,nativeReady:false});
}
export function selectGrenadeCustomBlend({rawAngle,positiveLimit,negativeLimit,float47,child,groundPhase,provenance}={}){
 origin(provenance);
 if(![rawAngle,positiveLimit,negativeLimit,float47].every(v=>Number.isFinite(v)&&Number.isFinite(f(v)))||f(positiveLimit)<=0||f(negativeLimit)>=0)throw Error('Explicit finite signed float32 limits/angle/Float47 required');
 if(!['ground','air','special'].includes(child))throw Error('Qualified current lower child required');
 const angle=f(Math.min(f(positiveLimit),Math.max(f(negativeLimit),f(rawAngle)))),positive=angle>0;
 const denominator=f(positive?positiveLimit:negativeLimit),weight=f(f(float47)-f(angle/denominator));
 if(!Number.isFinite(weight))throw Error('Custom weight overflow');
 let record,index=null;
 if(child==='ground'){
  if(!Number.isInteger(groundPhase)||groundPhase<0)throw Error('Explicit nonnegative native ground phase required');index=groundPhase<9?groundPhase:0;
  record=(positive?source.records.walkUpper:source.records.walkLower)[index];
 }else record=child==='air'?(positive?source.records.jumpUpper:source.records.jumpLower):(positive?source.records.flyUpper:source.records.flyLower);
 return {record,groundIndex:index,angle,weight,branch:positive?'Upper':'Lower',sourceSelection:'0xf6d630',sourceClamp:'0xf6d500',sourceBeforeLaunchTimer:true,
  naming:source.naming,rawAngleProducerNativeVerified:false,currentRuntimeValuesObserved:false,nativeCompared:false,nativeReady:false};
}
export function createGrenadeCustomBlenderState(){return {lastRecord:null,sourceFunctionSha256:source.sourceFunctionSha256,nativeReady:false};}
export function enterGrenadeCustomBlender(state){state.lastRecord=null;return state;}
export function tickGrenadeCustomBlender(state,context){
 if(state?.sourceFunctionSha256!==source.sourceFunctionSha256)throw Error('Authenticated Grenade custom blender state required');
 if(typeof context?.allChannels3c!=='boolean'||!Number.isInteger(context.animationArgument38)||context.animationArgument38<0||context.animationArgument38>0xffffffff)throw Error('Explicit raw custom3C boolean and38 uint32 argument required');
 const selection=selectGrenadeCustomBlend(context),previous=state.lastRecord,record=selection.record;
 //B78910 compares only the two animation-name strings at param+8 and+20.
 const equal=previous&&previous.clips[0]===record.clips[0]&&previous.clips[1]===record.clips[1];
 const commands=equal?[{method:'97F480',channel:0,weight:selection.weight,source:'F6D926'}]:
  (context.allChannels3c?[0,3,4,5]:[0]).map(channel=>({method:'B77CB0',channel,record,animationIndex:record.index,argument:context.animationArgument38,weight:channel===0?selection.weight:1,extra:0,source:'F6D938..DA1A'}));
 if(!equal)state.lastRecord=record;
 return {...selection,commands,sourceRecordEquality:'0xb78910',sourceEntryCacheReset:'0xf6d600',sourceTickBeforeTimer:'0x5eef7c before0x5eef84',
  lowerChannel1Commands:[],lowerAirDeclared:false,lowerSpecialDeclared:false,rendererMaskNativeVerified:false,callbackTruthVerified:false};
}
