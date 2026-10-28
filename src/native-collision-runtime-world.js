// Source geometry lifecycle only. The host supplies authenticated topology,
// selection and numeric profiles; no map-to-precision or empty-list policy.
import {compileNativeStaticSourcePose} from './native-static-source-pose.js';
import {compileNativeCollisionSourceTree} from './native-collision-source-tree.js';
import {nativeCollisionWorldDescriptor} from './native-collision-world-ports.js';
import {nativeStaticCollisionRegistration} from './native-collision-registration.js';
import {assertNativeStaticContactPreparation} from './native-static-contact-prepared.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const token=value=>typeof value==='string'&&value.trim().length>0||Number.isSafeInteger(value)&&value>=0;
const refuse=reason=>({qualified:false,reason,worldC:null,world8:null,nativeReady:false});
const invoke=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous runtime world ports required');return value;};
// Small profile signature, not a hash over geometry on every actor operation.
// Source assets are immutable for a generation; geometry edits require a new
// explicit host revision. Functions stay identity-compared, never stringified.
function signature(value,result=[],active=new Set()){
 if(value===null||typeof value!=='object'){result.push(value);return result;}
 if(active.has(value))throw TypeError('Acyclic explicit runtime profiles required');active.add(value);
 if(value instanceof Map){result.push('Map',value.size);for(const [key,item]of value){signature(key,result,active);signature(item,result,active);}}
 else if(Array.isArray(value)){result.push('Array',value.length);for(const item of value)signature(item,result,active);}
 else{const keys=Object.keys(value);result.push('Object',keys.length);for(const key of keys){result.push(key);signature(value[key],result,active);}}
 active.delete(value);if(result.length>50000)throw TypeError('Bounded runtime profile required');return result;
}
const same=(a,b)=>a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));

export function createNativeCollisionRuntimeWorlds({readBindings,contactPreparation}={}){
 if(!sync(readBindings))throw TypeError('Explicit synchronous runtime bindings reader required');
 if(contactPreparation!==undefined)assertNativeStaticContactPreparation(contactPreparation);
 let disposed=false,current=null,generation=0,compilations=0,rejectedRevision=null;
 function retire(){if(current)current.active=false;current=null;}
 function collect(binding){
  if(binding?.qualified!==true||!token(binding.revision)||typeof binding.evidence!=='string'||!binding.evidence.trim())throw TypeError('Qualified host revision and binding evidence required');
  const nodes=[],byId=new Map(),active=new Set(),sources=[],trace=[];
  function visit(spec){
   if(!spec||!token(spec.id)||!['source','empty'].includes(spec.kind)||typeof spec.evidence!=='string'||!spec.evidence.trim()||!Array.isArray(spec.children)||active.has(spec))throw TypeError('Explicit acyclic world topology, IDs and evidence required');
   if(byId.has(spec.id)){if(byId.get(spec.id)!==spec)throw TypeError('World ID belongs to a different descriptor');return;}
   if(nodes.length>=10000)throw TypeError('Bounded world topology required');
   byId.set(spec.id,spec);active.add(spec);nodes.push(spec);trace.push(spec.id,spec.kind,spec.evidence,spec.children.length,...spec.children.map(child=>child?.id));
   if(spec.kind==='empty'){
    if(!Array.isArray(spec.sourceWorlds)||spec.sourceWorlds.length!==0)throw TypeError('Known empty tree requires an explicit empty sourceWorlds array');
   }else{
    if(!Array.isArray(spec.sourceWorlds)||!spec.sourceWorlds.length||!(spec.poseProfiles instanceof Map)||!sync(spec.admitTriangle)||!sync(spec.clipTriangle)||!sync(spec.readStaticEnabled))throw TypeError('Source worlds, pose map, admission, clipping and enable ports required');
    signature({poseProfiles:spec.poseProfiles,root:spec.root,owners:spec.owners,factoryOwnerOrder:spec.factoryOwnerOrder,
     sourceProfile:spec.sourceProfile,admitTriangle:spec.admitTriangle,clipTriangle:spec.clipTriangle,readStaticEnabled:spec.readStaticEnabled},trace);
    for(const owner of spec.sourceWorlds){
     if(!Array.isArray(owner?.nativeCollisionSources)||!owner.nativeCollisionSources.length)throw TypeError('Loaded map exposes no complete nativeCollisionSources');
     trace.push(owner,owner.nativeCollisionSources.length);
     for(const descriptor of owner.nativeCollisionSources){
      if(!descriptor||!sync(descriptor.active)||!sync(descriptor.readRecords)||invoke(descriptor.active)!==true)throw TypeError('Active runtime source descriptor required');
      trace.push(descriptor,descriptor.source,...signature(descriptor.parentIndices),...signature(descriptor.requiredModelIndices));
      const bound={owner,descriptor,source:descriptor.source,parentIndices:descriptor.parentIndices,active:descriptor.active,readRecords:descriptor.readRecords};
      sources.push(bound);trace.push(bound.active,bound.readRecords);
     }
    }
   }
   for(const child of spec.children)visit(child);active.delete(spec);
  }
  visit(binding.worldC);visit(binding.world8);
  return {nodes,sources,trace};
 }
 function ownersActive(entry){return entry.active&&entry.sources.every(({owner,descriptor,source,parentIndices,active,readRecords})=>
  owner.nativeCollisionSources?.includes(descriptor)&&descriptor.source===source&&descriptor.parentIndices===parentIndices&&descriptor.active===active&&descriptor.readRecords===readRecords&&invoke(active)===true);}
 function build(binding,collected){
  const entry={active:true,revision:binding.revision,evidence:binding.evidence,trace:collected.trace,sources:collected.sources,generation:++generation,nodes:new Map(),compiled:new Map()};
  // Every retained enable getter is tied to this generation, so stale query
  // objects cannot certify geometry after a map change or adapter disposal.
  const live=()=>ownersActive(entry);
  function node(spec){
   if(entry.nodes.has(spec.id))return entry.nodes.get(spec.id);
   let compiled;
   if(spec.kind==='empty')compiled={contactTree:null,packetTree:null};
   else{
    const selected=spec.sourceWorlds.flatMap(owner=>owner.nativeCollisionSources).filter(descriptor=>{
     if(!Array.isArray(descriptor.requiredModelIndices))throw TypeError('Explicit required source models required');
     if(descriptor.requiredModelIndices.length)return true;
     const records=invoke(descriptor.readRecords);
     if(!Array.isArray(records)||records.length||!Array.isArray(descriptor.source?.models)||descriptor.source.models.some(model=>nativeStaticCollisionRegistration(model.name)&&model.vertices?.length))throw TypeError('Empty source descriptor omits registered geometry');
     return false; // Proven zero collision stream, e.g. a render-only scene.
    });
    if(!selected.length)throw TypeError('Source partition has no contributing geometry; use an explicitly qualified empty tree');
    const sources=selected.map(descriptor=>({
     ...descriptor,active:()=>live()&&invoke(descriptor.active)===true,
     readRecords:()=>live()?invoke(descriptor.readRecords):null}));
    const poses=new Map();
    for(const descriptor of sources){
     const source=descriptor.source,profile=spec.poseProfiles.get(source?.source);
     if(!profile)throw TypeError('Explicit authenticated pose profile missing for source');
     if(poses.has(source.source))throw TypeError('Duplicate source identity in one world partition');
     poses.set(source.source,compileNativeStaticSourcePose({...profile,source,parentIndices:descriptor.parentIndices}));
    }
    compiled=compileNativeCollisionSourceTree({sources,poses,root:spec.root,owners:spec.owners,factoryOwnerOrder:spec.factoryOwnerOrder,
     sourceProfile:spec.sourceProfile,admitTriangle:spec.admitTriangle,clipTriangle:spec.clipTriangle,
     readStaticEnabled:metadata=>live()?invoke(spec.readStaticEnabled,metadata):undefined,contactPreparation});
    compilations++;entry.compiled.set(spec.id,compiled);
   }
   const children=spec.children.map(node),descriptor=nativeCollisionWorldDescriptor({compiled,children,complete:true});
   Object.defineProperty(descriptor,'complete',{enumerable:true,get:live});
   Object.defineProperty(descriptor,'treesComplete',{enumerable:true,get:live});
   entry.nodes.set(spec.id,descriptor);return descriptor;
  }
  try{entry.worldC=node(binding.worldC);entry.world8=node(binding.world8);return entry;}
  catch(error){entry.active=false;throw error;}
 }
 return {
  read(){
   if(disposed)return refuse('runtime-worlds-disposed');
   let binding;
   try{
    binding=invoke(readBindings);
    if(rejectedRevision!==null&&Object.is(binding?.revision,rejectedRevision))return refuse('runtime-world-revision-rejected');
    const collected=collect(binding);
    if(current&&Object.is(binding.revision,current.revision)){
     if(binding.evidence!==current.evidence||!same(collected.trace,current.trace)||!ownersActive(current)){rejectedRevision=binding.revision;retire();return refuse('runtime-world-bindings-changed-without-revision');}
    }else{retire();current=build(binding,collected);rejectedRevision=null;}
    if(!ownersActive(current)){rejectedRevision=binding.revision;retire();return refuse('runtime-world-owner-inactive');}
    return {qualified:true,revision:current.revision,generation:current.generation,worldC:current.worldC,world8:current.world8,
     diagnostics:{compiledPartitions:current.compiled.size,totalCompilations:compilations,sourceTriangles:[...current.compiled.values()].reduce((n,value)=>n+value.sourceTriangles,0)},
     qualification:{currentSourceGeometryOnly:true,actorCollectionsProvided:false,category400Provided:false,
      nativeConstructionArithmeticObserved:false,nativeMovementCompared:false,defaultRuntimeActivated:false,nativeReady:false}};
   }catch(error){if(token(binding?.revision))rejectedRevision=binding.revision;retire();return {...refuse('runtime-world-binding-unqualified'),detail:error.message};}
  },
  invalidate(){retire();rejectedRevision=null;},
  dispose(){retire();disposed=true;},
  diagnostics(){return {disposed,generation,totalCompilations:compilations,active:current!==null&&ownersActive(current)};}
 };
}
