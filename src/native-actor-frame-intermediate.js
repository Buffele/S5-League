// Decoded control flow51F379..51F4E8 between physics and current-state Tick.
// Opaque component/state routines remain mandatory synchronous source ports.
const f=Math.fround;
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const byte=(n,label)=>{uint(n,label);if(n>255)throw TypeError(`Explicit byte ${label} required`);return n;};
const scalar=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Finite float32 ${label} required`);return f(n);};
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
class Refusal extends Error{}
export const NATIVE_FRAME_INTERMEDIATE_SOURCE=Object.freeze({start:0x51f379,endExclusive:0x51f4e8});
export function nativeActorFrameIntermediate({state,dtMs,actorAcceptedPhysics,ports}={}){
 const next={field18c:uint(state?.field18c,'actor18C'),field190:uint(state?.field190,'actor190')};
 dtMs=uint(dtMs,'engine delta');if(typeof actorAcceptedPhysics!=='boolean')throw TypeError('Explicit resolved frame physics gate required');
 const trace=[];
 const invoke=(name,args={})=>{
  if(!synchronous(ports?.[name]))throw TypeError(`Explicit synchronous intermediate port ${name} required`);
  const value=ports[name]({...args,dtMs,state:{...next}});
  if(value&&typeof value.then==='function')throw TypeError(`Intermediate port ${name} must complete synchronously`);
  trace.push({name,...args});
  if(value?.qualified!==true)throw new Refusal(value?.reason??`${name}-unqualified`);
  return value;
 };
 const result=reason=>({qualified:true,state:next,reason,trace,sourceRange:NATIVE_FRAME_INTERMEDIATE_SOURCE,calledRoutinesVerified:false,nativeExecutionCompared:false,nativeReady:false});
 try{
  if(actorAcceptedPhysics){
   next.field190=uint(invoke('readActor118Support7B0CD0').value,'current actor118 support');
   if(next.field190!==0)next.field18c=next.field190;
   invoke('publishState',{value:{...next}});
  }
  // These three calls run even when the earlier physics gate is false.
  invoke('tickComponent',{field:0x290,target:0xb98e20});
  invoke('tickComponent',{field:0x294,target:0x513630});
  invoke('tickComponent',{field:0x298,target:0x7bf6f0});
  if(byte(invoke('readActorByte',{slot:0x3c}).value,'actor slot3C')!==0)return result('actor3c');
  const slot94=scalar(invoke('readActorFloat',{slot:0x94}).value,'actor slot94');
  if(byte(invoke('readActorByte',{slot:0x44}).value,'actor slot44')===0)return result('actor44');
  const threshold=scalar(invoke('readFloat',{index:3}).value,'Float3');
  if(threshold<slot94)return result('above-threshold');
  const mode=uint(invoke('readMode114').value,'current actor mode114');
  if(mode!==0&&byte(invoke('readFlyB81E00').value,'flyB81E00')===0)return result('fly-refused');
  invoke('invokeActor51B4A0');
  return result('actor51b4a0');
 }catch(error){if(error instanceof Refusal)return {qualified:false,state:null,reason:error.message,trace};throw error;}
}
// All query/setter/component implementations must mutate only the owning
// frame's physics/stateContainer or emit qualified deferred display commands.
export function createNativeActorFrameIntermediatePort({source,containerKey,ports}={}){
 if(typeof source!=='string'||!source.trim()||typeof containerKey!=='string'||!containerKey.trim())throw TypeError('Explicit intermediate source and owned key required');
 return (dtMs,api)=>{
  const container=api.readStateContainer();if(!Object.hasOwn(container,containerKey))throw TypeError('Owned intermediate state entry required');
  const gate=api.readActorAcceptedPhysics();
  const bound=Object.fromEntries(Object.entries(ports??{}).map(([name,fn])=>[name,synchronous(fn)?request=>fn({...request,api}):fn]));
  bound.publishState=({value})=>{const current=api.readStateContainer();api.writeStateContainer({...current,[containerKey]:value});return {qualified:true};};
  const result=nativeActorFrameIntermediate({state:container[containerKey],dtMs,actorAcceptedPhysics:gate,ports:bound});
  if(!result.qualified)throw Error(result.reason);
  return {...result,source};
 };
}
