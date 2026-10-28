// Source72B1F0 ->730710 ->733CF0 ->734E70. A collider prefix is consulted
// ONLY after authenticated BLASTINFO/profile/visual-child ownership, never as
// a universal oct_ collision category. Runtime alive state remains a port.
import {nativeMainStaticCollisionOwner,nativeCollisionOwnerId} from './native-collision-registration.js';
import {nativeMapParentIndices} from './native-map-source-geometry.js';
import {nativeBlast2FactoryOrder} from './native-static-collision-order.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const invoke=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous registration ownership ports required');return value;};

export function compileNativeBlast2RegistrationProfile({bundle,nativeMapId,evidence}={}){
 if(!Array.isArray(bundle?.scenes)||!Array.isArray(bundle.variants)||typeof evidence!=='string'||!evidence.trim())throw TypeError('Complete verified map bundle and evidence required');
 const variants=bundle.variants.filter(value=>value.id===nativeMapId);
 if(variants.length!==1)throw TypeError('Unique explicit map variant required');
 const variant=variants[0],configs=variant.configs?.filter(value=>value.path===variant.bginfo&&value.status==='verified');
 if(configs?.length!==1||!Array.isArray(configs[0].entries))throw TypeError('Authenticated bginfo entries required');
 const entries=configs[0].entries,sections=[],seenSections=new Set();
 for(const entry of entries){
  if(!/^BLASTINFO_\d+$/.test(entry.section)||entry.key!=='name')continue;
  if(seenSections.has(entry.section)||typeof entry.value!=='string'||!entry.value||entry.value.includes('\0'))throw TypeError('Unique source BLASTINFO names required');
  seenSections.add(entry.section);sections.push({section:entry.section,name:entry.value});
 }
 // Only verified contiguous STATIC object resources can contribute profile
 // nodes. Keep their configured load order, independent of bundle JSON order.
 const sceneBindings=[];
 for(let index=1;;index++){
  const row=entries.filter(value=>value.section==='STATIC'&&value.key===`object_${index}`);
  if(!row.length||row.length===1&&!row[0].value)break;
  if(row.length!==1)throw TypeError('Unique contiguous STATIC entries required');
  const identity=`model/background/${row[0].value}`,scenes=bundle.scenes.filter(value=>value.source===identity);
  if(scenes.length!==1||nativeMainStaticCollisionOwner(bundle,nativeMapId,identity)!=='main-static-root1A0')throw TypeError('Qualified main static scene identity required');
  const source=scenes[0],parentIndices=nativeMapParentIndices(source),children=Array.from({length:source.nodes.length},()=>[]),models=new Map();
  for(const [nodeIndex,parent]of parentIndices.entries())if(parent>=0)children[parent].push(nodeIndex);
  for(const [modelIndex,model]of source.models.entries()){
   if(!Number.isInteger(model.sourceNodeIndex)||models.has(model.sourceNodeIndex))throw TypeError('Unique original model/node identity required');
   const node=source.nodes[model.sourceNodeIndex];if(!node||node.type!=='ModelData'||node.name!==model.name||node.parent!==model.parent)throw TypeError('Authenticated model/node identity required');
   models.set(model.sourceNodeIndex,{modelIndex,model});
  }
  sceneBindings.push({source,parentIndices,children,models});
 }
 const profileChildren=new Map(),bySection=new Map(sections.map(value=>[value.section,value]));
 const consumed=[];for(let index=1;;index++){const section=bySection.get(`BLASTINFO_${String(index).padStart(2,'0')}`);if(!section)break;consumed.push(section);}
 for(const section of consumed){
  const matches=sceneBindings.flatMap(binding=>binding.source.nodes.flatMap((node,index)=>node.name===section.name?[{binding,index}]:[]));
  if(matches.length>1)throw TypeError('Ambiguous profile node needs explicit full-scene DFS qualification');
  if(!matches.length)continue; // Native manager skips a missing profile node.
  const {binding,index}=matches[0];
  profileChildren.set(section.name,binding.children[index].filter(nodeIndex=>binding.source.nodes[nodeIndex].type==='ModelData').map(nodeIndex=>({binding,nodeIndex,name:binding.source.nodes[nodeIndex].name})));
 }
 const order=nativeBlast2FactoryOrder({sections,profileChildren});
 if(!order.qualified)throw TypeError('Only authenticated blast2 factories supported by this source profile');
 const instances=[],bindings=new Map(),ids=new Set();
 for(const factory of order.factories){
  const {binding,nodeIndex,name}=factory.child,source=binding.source,ownerId=nativeCollisionOwnerId(name);
  if(ownerId===null||ids.has(ownerId))throw TypeError('Unambiguous ASCII owner-name CRC32 required');ids.add(ownerId);
  const raw14=factory.profile.includes('_wire')?1:0; //72BDFC string find, literal13C1100.
  const instance={source:source.source,sourceNodeIndex:nodeIndex,name,ownerId,profile:factory.profile,section:factory.section,raw14,
   instanceKey:`${source.source}#node-${nodeIndex}`,colliders:[]};
  for(const colliderNodeIndex of binding.children[nodeIndex]){
   const node=source.nodes[colliderNodeIndex];if(node.type!=='ModelData'||!node.name.startsWith('oct_'))continue;
   const entity=binding.models.get(colliderNodeIndex);if(!entity)throw TypeError('Original direct child collider model required');
   const indices=entity.model.indicesUnsigned??entity.model.indices;
   if(!Array.isArray(indices)||indices.length%3)throw TypeError('Complete source collider triangles required');
   const key=`${source.source}/${entity.modelIndex}`;if(bindings.has(key))throw TypeError('Collider has multiple native factory owners');
   const collider=Object.freeze({source:source.source,sourceModelIndex:entity.modelIndex,sourceNodeIndex:colliderNodeIndex,name:node.name,triangles:indices.length/3,
    ownerId,ownerSourceName:name,ownerSourceNodeIndex:nodeIndex,instanceKey:instance.instanceKey,profile:factory.profile,section:factory.section,
    raw10:0x80,raw14,raw18:ownerId,builderArgument:0,raw34Initial:1,partition:'world8',owner:'destructible-piece734E70'});
   bindings.set(key,collider);instance.colliders.push(collider);
  }
  instances.push(Object.freeze({...instance,colliders:Object.freeze(instance.colliders)}));
 }
 return {schema:'native-blast2-registration-profile-v1',bundle,nativeMapId,evidence,sceneBindings,instances:Object.freeze(instances),bindings,
  factoryOwnerOrder:Object.freeze(instances.map(value=>value.ownerId)),firstMissingSection:order.firstMissingSection,
  qualification:{nativeRegistrationSourceClosed:true,currentEnableProvided:false,nativeMovementCompared:false,nativeReady:false}};
}

// Non-mutating complete source view. Every original face remains present; only
// source-qualified BLASTINFO-owned records receive their native piece metadata.
export function bindNativeBlast2SourceWorld({world,profile,readEnabled,evidence}={}){
 if(!Array.isArray(world?.nativeCollisionSources)||!world.nativeCollisionSources.length||profile?.schema!=='native-blast2-registration-profile-v1'||!(profile.bindings instanceof Map)||
  !sync(readEnabled)||typeof evidence!=='string'||!evidence.trim())throw TypeError('Complete current source world, source profile and explicit alive reader required');
 let disposed=false;const original=world.nativeCollisionSources.slice(),views=new WeakMap();
 const live=()=>!disposed&&original.length===world.nativeCollisionSources?.length&&original.every((descriptor,index)=>world.nativeCollisionSources[index]===descriptor&&invoke(descriptor.active)===true);
 const nativeCollisionSources=original.map(descriptor=>{
  const scene=profile.sceneBindings.find(value=>value.source===descriptor.source);
  const isBound=[...profile.bindings.values()].some(value=>value.source===descriptor.source?.source);
  if(isBound&&(!scene||JSON.stringify(scene.parentIndices)!==JSON.stringify(descriptor.parentIndices)))throw TypeError('Profile source and current hierarchy identity differ');
  return {...descriptor,active:live,readRecords(){
   if(!live())return null;const records=invoke(descriptor.readRecords);if(!Array.isArray(records))return null;
   return records.map(record=>{
    const binding=profile.bindings.get(`${record.source}/${record.sourceModelIndex}`);if(!binding)return record;
    if(record.sourceNodeIndex!==binding.sourceNodeIndex||record.collisionAdaptation||record.nativeCollision?.sourceGeometry===false)throw TypeError('Only exact original source collider faces may receive piece registration');
    const previous=views.get(record);if(previous)return previous;
    const sourceMetadata=record.nativeCollision;
    const metadata=Object.freeze({registration:Object.freeze({name:binding.name,raw10:binding.raw10,raw14:binding.raw14,raw18:binding.raw18,builderArgument:binding.builderArgument,raw34Initial:1}),
     owner:binding.owner,partition:binding.partition,partitionConfirmed:true,registrationRuleVerified:true,nativeRecordIdVerified:true,sourceGeometry:true,
     instanceKey:binding.instanceKey,ownerSourceName:binding.ownerSourceName,nativeAdmissionVerified:true,
     get runtimeEnabled(){if(!live()||record.nativeCollision!==sourceMetadata)return undefined;const enabled=invoke(readEnabled,binding);return typeof enabled==='boolean'?enabled:undefined;}});
    const view={...record};Object.defineProperty(view,'nativeCollision',{enumerable:true,get:()=>live()&&record.nativeCollision===sourceMetadata?metadata:undefined});
    views.set(record,view);return view;
   });
  }};
 });
 return {nativeCollisionSources,profile,dispose(){disposed=true;},
  qualification:{sourceBuffersModified:false,registrationOnly:true,currentEnableReaderBound:true,defaultRuntimeActivated:false,nativeReady:false}};
}
