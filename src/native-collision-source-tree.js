// Runtime source geometry compiler, shared across maps. It builds a static
// partition only; actor lists/world90/category400 remain explicit elsewhere.
import {NATIVE_STATIC_COLLISION_REGISTRATION,nativeStaticCollisionRegistration} from './native-collision-registration.js';
import {buildNativeStaticTree,nativeStaticInitialRoot,nativeStaticHeightTree} from './native-static-tree-builder.js';
import {nativeStaticContactTree} from './native-static-contact-query.js';
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const knownEnable=n=>typeof n==='boolean'||Number.isInteger(n)&&n>=0&&n<=255;

export function compileNativeCollisionSourceTree({sources,poses,root,owners,factoryOwnerOrder,sourceProfile,
 admitTriangle,clipTriangle,readStaticEnabled,contactPreparation}={}){
 if(!Array.isArray(sources)||!sources.length||!(poses instanceof Map)||!Array.isArray(owners)||!owners.length||
  !Array.isArray(factoryOwnerOrder)||factoryOwnerOrder.some(id=>!uint(id))||new Set(factoryOwnerOrder).size!==factoryOwnerOrder.length||
  typeof readStaticEnabled!=='function')throw TypeError('Explicit complete sources, poses, owners, factory order and current static enables required');
 const staticOrder=new Map(NATIVE_STATIC_COLLISION_REGISTRATION.map((entry,index)=>[entry.name,index]));
 const groups=new Map(),seenSources=new Set();let sourceTriangles=0;
 for(const descriptor of sources){
  const source=descriptor?.source,pose=poses.get(source?.source);
  if(!source||typeof source.source!=='string'||seenSources.has(source.source)||!Array.isArray(source.models)||
   !Array.isArray(descriptor.requiredModelIndices)||new Set(descriptor.requiredModelIndices).size!==descriptor.requiredModelIndices.length||
   typeof descriptor.readRecords!=='function'||typeof descriptor.active!=='function'||descriptor.active()!==true||
   typeof pose?.triangle!=='function'||pose.provenance?.source!==source.source)throw TypeError('Active complete source descriptor and matching source pose required');
  seenSources.add(source.source);
  const required=new Set(descriptor.requiredModelIndices);
  // A missing whole registered mesh must not pass a per-face completeness
  // check merely because the caller also omitted its required-model entry.
  source.models.forEach((model,index)=>{if(nativeStaticCollisionRegistration(model.name)&&model.vertices?.length&&!required.has(index))throw TypeError('Registered source model omitted from completeness contract');});
  const records=descriptor.readRecords();if(!Array.isArray(records))throw TypeError('Current full source records required');
  const perModel=new Map([...required].map(index=>{
   const model=source.models[index],indices=model?.indicesUnsigned??model?.indices;
   if(!Number.isInteger(index)||!model||!Array.isArray(indices)||indices.length%3)throw TypeError('Valid required source model required');
   return [index,{count:indices.length/3,seen:new Set()}];
  }));
  for(const record of records){
   const model=source.models[record?.sourceModelIndex],coverage=perModel.get(record?.sourceModelIndex),metadata=record?.nativeCollision,r=metadata?.registration;
   if(record?.source!==source.source||!coverage||!model||record.sourceNodeIndex!==model.sourceNodeIndex||
    !Number.isInteger(record.triangleIndex)||record.triangleIndex<0||record.triangleIndex>=coverage.count||coverage.seen.has(record.triangleIndex))throw TypeError('Unique complete original model/triangle identity required');
   coverage.seen.add(record.triangleIndex);
   if(record.collisionAdaptation||metadata?.sourceGeometry===false||metadata?.registrationRuleVerified!==true||metadata?.partitionConfirmed!==true||
    !owners.includes(metadata.owner)||!r||!uint(r.raw10)||!uint(r.raw18)||![0,1].includes(r.builderArgument))throw TypeError('Original geometry with qualified registration and selected owner required');
   let key,rank;
   if(metadata.owner==='destructible-piece734E70'){
    const order=factoryOwnerOrder.indexOf(r.raw18);
    if(order<0||metadata.nativeRecordIdVerified!==true)throw TypeError('Destructible owner absent from explicit native factory order');
    key=`piece:${r.raw18}`;rank=staticOrder.size+order;
   }else{
    const expected=nativeStaticCollisionRegistration(model.name);
    if(!expected||['raw10','raw14','raw18','builderArgument'].some(field=>r[field]!==expected[field]))throw TypeError('Static registration differs from original source node rule');
    key=`static:${expected.name}`;rank=staticOrder.get(expected.name);
   }
   if(!groups.has(key))groups.set(key,{key,rank,raw10:r.raw10,raw18:r.raw18,raw14:r.raw14,builderArgument:r.builderArgument,sources:[],triangles:[],bindings:[],bindingMetadata:new Set()});
   const group=groups.get(key);
   if(['raw10','raw18','raw14','builderArgument'].some(field=>group[field]!==r[field]))throw TypeError('Incompatible source registrations cannot share a native record');
   if(!group.sources.includes(source.source))group.sources.push(source.source);
   group.triangles.push(pose.triangle(record));
   if(!group.bindingMetadata.has(metadata)){group.bindingMetadata.add(metadata);group.bindings.push({record,metadata,descriptor});}
   sourceTriangles++;
  }
  for(const coverage of perModel.values())if(coverage.seen.size!==coverage.count)throw TypeError('Incomplete source triangle stream; filtered faces cannot qualify');
 }
 const ordered=[...groups.values()].sort((a,b)=>a.rank-b.rank);
 const build=buildNativeStaticTree({root:nativeStaticInitialRoot(root),groups:ordered,sourceProfile,admitTriangle,clipTriangle});
 if(!build.processed||!build.tree)throw TypeError('Processed nonempty source tree required');
 function readEnabled({key}){
  const group=groups.get(key);if(!group)return undefined;
  let value;
  for(const binding of group.bindings){
   if(binding.descriptor.active()!==true||binding.record.nativeCollision!==binding.metadata)return undefined;
   const enabled=binding.metadata.owner==='destructible-piece734E70'?binding.metadata.runtimeEnabled:readStaticEnabled(binding.metadata);
   if(!knownEnable(enabled)||value!==undefined&&!!value!==!!enabled)return undefined;
   value=enabled;
  }
  return value;
 }
 const options={geometryQualified:true,readEnabled,contactPreparation};
 return {build,contactTree:nativeStaticContactTree(build.tree,options),packetTree:nativeStaticHeightTree(build.tree,options),
  groups:ordered.map(({bindings,bindingMetadata,...group})=>group),sourceTriangles,
  qualification:{completeSourceTriangleCoverage:true,currentEnableReadersBound:true,staticPartitionOnly:true,
   nativeConstructionArithmeticObserved:false,nativeMovementCompared:false,nativeReady:false}};
}
