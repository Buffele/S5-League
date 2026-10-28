// Phase5 active branch only: 63A79A..63AA3A. The scheduler owns the timer.
// Native math ports are mandatory: no Three.js/JS quaternion substitute.
const names=Object.freeze(['readActorSlot8c','readCamera1fc','normalize100b100','fromTo100e660','quaternionSlerp','matrixRotationQuaternion','transformCoord','writeActorSlot88']);
const reference=()=>[0,0,-1];
function vector(value,length,label){
 if(!Array.isArray(value)&&!ArrayBuffer.isView(value))throw Error('Native float vector required: '+label);
 const copy=Array.from(value);
 if(copy.length!==length||copy.some(v=>!Number.isFinite(v)||Math.fround(v)!==v))throw Error('Finite float32 vector required: '+label);
 return copy;
}
function sync(fn,label){if(typeof fn!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name))throw Error('Synchronous source port required: '+label);}
function call(consumer,name,args){const value=consumer.ports[name](args);if(value&&typeof value.then==='function')throw Error('Thenable source port forbidden: '+name);if(value&&typeof value.next==='function')throw Error('Iterator source port forbidden: '+name);return value;}

export function createS5RuntimeAnchoringPhase5Orientation({actorId,bodyEntrySerial,ports,provenance}={}){
 if(typeof actorId!=='string'||!actorId.trim()||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<0)throw Error('Explicit actor and body entry identity required');
 for(const name of names){
  sync(ports?.[name],name);
  const p=provenance?.[name];
  if(!p||!['source-port','s5-explicit-adaptation'].includes(p.kind)||typeof p.source!=='string'||!p.source.trim())throw Error('Qualified source/adaptation provenance required: '+name);
 }
 return {actorId,bodyEntrySerial,ports:{...ports},provenance:Object.fromEntries(names.map(name=>[name,{...provenance[name]}])),nativeReady:false,nativeMathBitExact:false,runtimeMathDispatchObserved:false};
}

export function runS5RuntimeAnchoringPhase5Orientation(consumer,{state,ratio,nativeContext}={}){
 if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||nativeContext.bodyEntrySerial!==consumer.bodyEntrySerial||nativeContext.actorSlot3c!==false||state?.bodyEntrySerial!==consumer.bodyEntrySerial||state?.primaryPhase!==5||![3010001,3010002].includes(state?.itemKey))return {accepted:false,reason:'matching-local-active-phase5-required',nativeReady:false};
 // uint32 elapsed/duration conversion has already happened in the scheduler.
 // Zero-duration ratio0 and values above1 are preserved, without recomputing time.
 if(!Number.isFinite(ratio)||ratio<0||Math.fround(ratio)!==ratio)throw Error('Scheduler float32 ratio required');
 const identity={actorId:consumer.actorId,bodyEntrySerial:consumer.bodyEntrySerial};
 const facing=vector(call(consumer,'readActorSlot8c',identity),3,'actor8C'); //5300E0, protected actor+A8
 const camera=vector(call(consumer,'readCamera1fc',identity),3,'camera1FC');
 camera[1]=0;
 const cameraFlat=vector(call(consumer,'normalize100b100',{vector:camera}),3,'normalized camera');
 // Do not normalize actor8C or use actorEC here. FromTo has its own axis/angle path.
 const qFacing=vector(call(consumer,'fromTo100e660',{from:reference(),to:facing}),4,'facing quaternion');
 const qCamera=vector(call(consumer,'fromTo100e660',{from:reference(),to:cameraFlat}),4,'camera quaternion');
 const q=vector(call(consumer,'quaternionSlerp',{from:qFacing,to:qCamera,ratio}),4,'Slerp quaternion');
 const matrix=vector(call(consumer,'matrixRotationQuaternion',{quaternion:q}),16,'rotation matrix');
 const direction=vector(call(consumer,'transformCoord',{vector:reference(),matrix}),3,'transformed direction');
 direction[1]=0;
 const horizontal=vector(call(consumer,'normalize100b100',{vector:direction}),3,'horizontal direction');
 const receipt=call(consumer,'writeActorSlot88',{...identity,vector:horizontal}); //97ED10
 if(receipt?.executedSourceBranch!==true)throw Error('Actual actor88 execution receipt required');
 return {accepted:true,executedSourceBranch:true,direction:horizontal,ratio,sourceCallOrderVerified:true,mathImplementedByExplicitPorts:true,nativeMathBitExact:false,runtimeMathDispatchObserved:false,nativeReady:false,nativeCompared:false};
}
