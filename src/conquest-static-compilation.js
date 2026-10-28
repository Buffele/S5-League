import {createNativeLoadedMapGeometryBinding} from './native-world-runtime-bindings.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {isConquestSourceCollisionDescriptor} from './conquest-collision-source.js';
import {nativeStaticAdmission53,buildNativeStaticTree} from './native-static-tree-builder.js';
import {createNativeCollisionRuntimeWorlds} from './native-collision-runtime-world.js';
import {compileNativeStaticSourcePose} from './native-static-source-pose.js';
import {nativeCollisionWorldDescriptor} from './native-collision-world-ports.js';
import {NATIVE_STATIC_COLLISION_REGISTRATION,nativeStaticCollisionRegistration} from './native-collision-registration.js';
import {nativeStaticInitialRoot,nativeStaticHeightTree} from './native-static-tree-builder.js';
import {nativeStaticContactTree,createNativeStaticContactKeyedEnableReader} from './native-static-contact-query.js';
import {assertNativeStaticContactPreparation} from './native-static-contact-prepared.js';
import {CONQUEST_MOVEMENT_WORLD_MATH_PROFILE} from './conquest-movement-world-queries.js';
import {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE} from './conquest-navigation-world-queries.js';
import {CONQUEST_ATTACK_WORLD_MATH_PROFILE} from './conquest-attack-world-queries.js';
// BEGIN private deferred Conquest contact views
// Only the existing authenticated compiler context admits these private views.
const deferredViews = new WeakSet();
const writeContact = function(value) {
 Object.defineProperty(this, 'contactTree', {value, writable: true, enumerable: true, configurable: true});
};

function createDeferredConquestContactView({build, options, fields, onMaterialized} = {}) {
 const {geometryQualified, readEnabled, contactPreparation} = options ?? {};
 if (contactPreparation !== undefined || geometryQualified !== true || typeof readEnabled !== 'function') throw TypeError('Private unprepared qualified source contact view required');
 const retainedOptions = {geometryQualified, readEnabled, contactPreparation}, tree = build.tree;
 // The original packet converter visits every node before publishing anything.
 // For the compiler-private frozen plain builder output it checks all contact
 // converter static prerequisites (node.valid, children/records, source bounds),
 // and additionally validates ordered bounds. It does not read current raw34.
 const packetTree = nativeStaticHeightTree(tree, retainedOptions);
 let contactTree, materialized = false;
 const compiled = {build, contactTree: undefined, packetTree, ...fields};
 Object.defineProperty(compiled, 'contactTree', {enumerable: true, configurable: true, set: writeContact, get() {
  if (!materialized) {
   // Do not gate this on current lifetime: a first read of a retired descriptor
   // must still produce its original geometry with its retired raw34 reader.
   contactTree = nativeStaticContactTree(tree, retainedOptions);
   materialized = true;
   onMaterialized?.();
  }
  // Freezing a retained public descriptor must not make a read throw merely
  // because the optional accessor-to-data representation update is forbidden.
  if (Object.getOwnPropertyDescriptor(compiled, 'contactTree')?.configurable) writeContact.call(compiled, contactTree);
  return contactTree;
 }});
 deferredViews.add(compiled);
 return compiled;
}

function conquestPrivateCollisionWorldDescriptor({compiled, children, complete} = {}) {
 // All ordinary descriptors keep the original constructor and eager reads.
 if (!deferredViews.has(compiled)) return nativeCollisionWorldDescriptor({compiled, children, complete});
 if (complete !== true || !Array.isArray(children) || !Object.hasOwn(compiled, 'contactTree') || !Object.hasOwn(compiled, 'packetTree')) throw TypeError('Complete source views and explicit current world90 children required');
 const descriptor = {complete: true, treesComplete: true, contactTree: undefined, packetTree: compiled.packetTree, children};
 Object.defineProperty(descriptor, 'contactTree', {enumerable: true, configurable: true, set: writeContact, get() {
  const contactTree = compiled.contactTree;
  if (Object.getOwnPropertyDescriptor(descriptor, 'contactTree')?.configurable) writeContact.call(descriptor, contactTree);
  return contactTree;
 }});
 return descriptor;
}
// END private deferred Conquest contact views

const bindings=new WeakMap(),contexts=new WeakMap(),worlds=new WeakMap();
const sourcePins=Object.freeze([
 ['model/background/wave_d.scn','5b811d778067015f2232b1409157e74731843ee20575cb24a0d4458185858f86'],
 ['model/background/wave_d_01.scn','4be038c9eba7212cef9e956eaf68b53ab9cdf7e7baed1069d5f6a5960032e45a'],
 ['model/background/wave_d_oct.scn','66d4b16283d18272d9eedef5f547eba67bb1121654f81d061a1197f400e18989'],
 ['model/background/wave_d_sp.scn','7d8a1ad01b1224c5a19d7a7747b80e0ae9d33a96d51f35e26b36a2532898cd26'],
]);
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
function sourceFrame(world){
 const bundle=world?.sourceData,descriptors=world?.nativeCollisionSources;if(!hasSealedConquestStaticSource(world,bundle)||world.nativeMapId!==46||!Array.isArray(descriptors)||descriptors.length!==4||!Array.isArray(bundle.sources)||bundle.sources.length!==4)throw Error('Privately sealed current Conquest STATIC4 source required');
 let triangles=0;const rows=descriptors.map((descriptor,i)=>{const source=bundle.scenes[i],proof=bundle.sources[i],records=descriptor.readRecords();if(source!==descriptor.source||proof.path!==sourcePins[i][0]||proof.sha256!==sourcePins[i][1]||source.source!==proof.path||!isConquestSourceCollisionDescriptor(descriptor,{source,records})||descriptor.active()!==true||!Object.isFrozen(records)||!Object.isFrozen(source))throw Error('Authenticated immutable current Conquest descriptor/order/hash required');triangles+=records.length;return{descriptor,source,records,parentIndices:descriptor.parentIndices,required:descriptor.requiredModelIndices,active:descriptor.active,readRecords:descriptor.readRecords};});
 if(triangles!==1601)throw Error('Complete1601 source faces required for shared static compilation');return{world,bundle,descriptors,rows};
}
function frameCurrent(frame){try{return hasSealedConquestStaticSource(frame.world,frame.bundle)&&frame.world.sourceData===frame.bundle&&frame.world.nativeCollisionSources===frame.descriptors&&frame.descriptors.length===frame.rows.length&&frame.rows.every((r,i)=>{const d=frame.descriptors[i];return d===r.descriptor&&d.source===r.source&&d.parentIndices===r.parentIndices&&d.requiredModelIndices===r.required&&d.active===r.active&&d.readRecords===r.readRecords&&d.active()===true&&d.readRecords()===r.records;});}catch{return false;}}
function profileAllowed(profile){return [CONQUEST_MOVEMENT_WORLD_MATH_PROFILE,CONQUEST_NAVIGATION_WORLD_MATH_PROFILE,CONQUEST_ATTACK_WORLD_MATH_PROFILE].includes(profile)&&Object.isFrozen(profile)&&profile.precisionBits===24&&profile.roundingMode==='nearest'&&profile.reciprocalOneEstimate===.999755859375;}
function bindingSignature(value){const p=value.world8,poses=p?.poseProfiles;if(value.worldC?.kind!=='empty'||value.worldC.children.length||p?.kind!=='source'||p.children.length||p.owners.length!==1||p.owners[0]!=='main-static-root1A0'||p.factoryOwnerOrder.length||p.sourceWorlds.length!==1||p.admitTriangle!==nativeStaticAdmission53)throw Error('Exact STATIC-only Conquest partition required');const result=[value.revision,value.evidence,value.worldC,value.world8,p.root,p.root.depth,...p.root.size,p.sourceProfile,p.sourceProfile.branch,p.sourceProfile.geometry,...p.sourceProfile.sources,p.admitTriangle,p.clipTriangle,p.readStaticEnabled,poses,p.sourceWorlds,p.sourceWorlds[0],p.sourceWorlds[0].nativeCollisionSources,...p.sourceWorlds[0].nativeCollisionSources];for(const[source,pose]of poses){const t=pose.transformPorts,i=pose.initialState;result.push(source,pose,pose.selectedName,pose.reciprocalOneEstimate,i,i.fresh,i.controllerIndex,i.transitionActive,i.destinationPresent,i.evidence,t,t.policy,t.quaternionSlerp,t.quaternionSlerp.tick,t.matrixTransformation,t.matrixTransformation.tick);}return result;}
// Only this factory produces a cache-capable binding. Unsealed callers retain
// the original per-consumer compiler path; no public boolean grants a cache.
export function createConquestStaticGeometryBinding(config){
 const binding=createNativeLoadedMapGeometryBinding(config),{world,mathProfile}=config;
 const shared=hasSealedConquestStaticSource(world,world.sourceData);if(shared&&(!profileAllowed(mathProfile)||config.sourceWorld!==world))throw Error('Exact retained Conquest construction profile and world required');
 const frame=shared?sourceFrame(world):null,initial=binding.read(),signature=shared?bindingSignature(initial):null;
 if(shared){const expected=frame.rows.filter(r=>r.records.length).map(r=>r.descriptor),actual=initial.world8.sourceWorlds[0].nativeCollisionSources;if(!same(expected,actual)||initial.world8.root.depth!==9||!same(initial.world8.root.size,[70000,70000,70000]))throw Error('Source Conquest BGINFO root/registration order differs');for(const[source,pose]of initial.world8.poseProfiles){if(pose.transformPorts!==mathProfile.transformPorts||pose.reciprocalOneEstimate!==mathProfile.reciprocalOneEstimate||!frame.rows.some(r=>r.source.source===source))throw Error('Current source transform profile required');}}
 const record={binding,world,mathProfile,shared,frame,clipTriangle:initial.world8.clipTriangle,
  current(){if(!shared)return true;try{return profileAllowed(mathProfile)&&frameCurrent(frame)&&same(signature,bindingSignature(binding.read()));}catch{return false;}},
  ownerActive(){if(!shared||frameCurrent(frame))return true;const entry=worlds.get(world);if(entry)entry.revoked=true;worlds.delete(world);return false;},
  read(){if(shared&&!record.current())throw Error('Shared Conquest source/profile binding revoked');return binding.read();},
 };bindings.set(binding,record);return binding;
}

// A separate owned STATIC4 API: no public read() or public topology/profile
// objects are returned. The original public mutable binding factory above is
// unchanged. Neither a caller flag nor a frozen arbitrary object grants this.
export function createConquestOwnedStaticGeometryBinding({world,revision,mathProfile,source,emptyWorldEvidence}={}){
 if(!hasSealedConquestStaticSource(world,world?.sourceData)||!profileAllowed(mathProfile)||
  !Object.isFrozen(mathProfile.transformPorts)||!Object.isFrozen(mathProfile.transformPorts.quaternionSlerp)||
  !Object.isFrozen(mathProfile.transformPorts.matrixTransformation)||!Object.isFrozen(mathProfile.transformPorts.provenance)||
  !Object.isFrozen(mathProfile.transformPorts.qualification))throw Error('Privately sealed source and deeply immutable canonical Conquest math required');
 const bundle=world.sourceData,variant=bundle.variants?.find(row=>row.id===46);
 if(bundle.scenes?.length!==4||bundle.sources?.length!==4||variant?.scenes?.length!==4||variant.scenes.some(row=>row.section!=='STATIC')||
  !Array.isArray(bundle.nonStatic)||!bundle.nonStatic.length||bundle.nonStatic.some(row=>row.registeredModels!==0))throw Error('Authenticated complete STATIC4 and zero registered non-STATIC topology required');
 const readChildren=()=>({qualified:true,evidence:'Authenticated map46 non-STATIC streams all contain zero registered collision models; complete world90 topology',worldC:[],world8:[]});
 // This constructor/read may mutate its own temporary parts. Never retain its
 // read method after snapshotting: owned frozen parts must not be overwritten.
 const original=createNativeLoadedMapGeometryBinding({world,sourceWorld:world,factoryOwnerOrder:[],mathProfile,revision,source,readChildren,
  emptyPartitionEvidence:{worldC:emptyWorldEvidence}}),frame=sourceFrame(world),initial=original.read();
 bindingSignature(initial);
 const expected=frame.rows.filter(r=>r.records.length).map(r=>r.descriptor),actual=initial.world8.sourceWorlds[0].nativeCollisionSources;
 if(!same(expected,actual)||initial.world8.root.depth!==9||!same(initial.world8.root.size,[70000,70000,70000]))throw Error('Source Conquest BGINFO root/registration order differs');
 for(const [key,pose]of initial.world8.poseProfiles){
  if(pose.transformPorts!==mathProfile.transformPorts||pose.reciprocalOneEstimate!==mathProfile.reciprocalOneEstimate||!frame.rows.some(r=>r.source.source===key))throw Error('Current source transform profile required');
 }
 // Map is immutable through exclusive ownership, not Object.freeze(Map).
 // None of these references escape via the opaque binding or query results.
 const p=initial.world8,poseProfiles=new Map([...p.poseProfiles].map(([key,pose])=>[key,Object.freeze({...pose,initialState:Object.freeze({...pose.initialState})})]));
 const sourceWorlds=Object.freeze(p.sourceWorlds.map(owner=>Object.freeze({nativeCollisionSources:Object.freeze([...owner.nativeCollisionSources])})));
 const worldC=Object.freeze({...initial.worldC,sourceWorlds:Object.freeze([]),children:Object.freeze([])});
 const world8=Object.freeze({...p,poseProfiles,sourceWorlds,children:Object.freeze([]),root:Object.freeze({...p.root,size:Object.freeze([...p.root.size])}),
  owners:Object.freeze([...p.owners]),factoryOwnerOrder:Object.freeze([...p.factoryOwnerOrder]),
  sourceProfile:Object.freeze({...p.sourceProfile,sources:Object.freeze([...p.sourceProfile.sources])})});
 const value=Object.freeze({...initial,worldC,world8});
 const nodes=Object.freeze([worldC,world8]),sources=Object.freeze(sourceWorlds.flatMap(owner=>owner.nativeCollisionSources.map(descriptor=>
  Object.freeze({owner,descriptor,source:descriptor.source,parentIndices:descriptor.parentIndices,active:descriptor.active,readRecords:descriptor.readRecords}))));
 // This is owned product provenance, not a remembered signature of public
 // mutable data. No generic object memo, DFS table or frame cache exists.
 const receipt=Object.freeze({nodes,sources,trace:Object.freeze([Object.freeze({})])});
 const binding=Object.freeze({setStaticEnabled:original.setStaticEnabled,readStaticEnabled:original.readStaticEnabled,qualification:Object.freeze({...original.qualification})});
 const readOwned=()=>{if(!sync(readChildren))throw TypeError('Explicit synchronous current-world reader required');invoke(readChildren);return value;};
 const record={binding,world,mathProfile,shared:true,frame,clipTriangle:world8.clipTriangle,owned:receipt,
  current(){try{if(!profileAllowed(mathProfile)||!frameCurrent(frame))return false;readOwned();return true;}catch{return false;}},
  ownerActive(){if(frameCurrent(frame))return true;const entry=worlds.get(world);if(entry)entry.revoked=true;worlds.delete(world);return false;},
  read(){if(!record.current())throw Error('Shared Conquest source/profile binding revoked');return readOwned();},
 };
 bindings.set(binding,record);return binding;
}

function readConquestStaticGeometryBinding(binding){const record=bindings.get(binding);if(!record)throw Error('Typed actual Conquest geometry binding required');if(!record.current())throw Error('Current Conquest geometry binding required');return record;}
function createConquestStaticCompilationContext(binding){const record=readConquestStaticGeometryBinding(binding);if(!record.shared)return null;const token=Object.freeze({kind:'conquest-private-static-compilation-context'});contexts.set(token,record);return token;}
function geometrySignature(root,groups,profile){const values=[root.level,...root.bounds.min,...root.bounds.max,profile.branch,profile.geometry,...profile.sources];for(const g of groups){values.push(g.key,g.rank,g.raw10,g.raw14,g.raw18,g.builderArgument,...g.sources,g.triangles.length);for(const t of g.triangles)for(const p of t)values.push(...p.map(Math.fround));}return values;}
// Private builder output is plain objects/arrays. Freeze before descending so
// aliases are visited once, without retaining a second million-entry Set.
function freezeTree(value){if(value===null||typeof value!=='object'||Object.isFrozen(value))return 0;Object.freeze(value);let count=1;for(const key in value)count+=freezeTree(value[key]);return count;}
// Only pure geometry is shared. raw34, complete, source-live gates, contact
// preparation, manager flags and actor/category collections remain per view.
function reuseConquestStaticBuild(context,{root,groups,sourceProfile,admitTriangle,clipTriangle}={}){
 const record=contexts.get(context);if(!record||!record.current()||admitTriangle!==nativeStaticAdmission53||clipTriangle!==record.clipTriangle)throw Error('Current original Conquest compilation context required');
 const signature=geometrySignature(root,groups,sourceProfile);let entry=worlds.get(record.world);
 if(entry&&(!frameCurrent(entry.frame)||entry.bundle!==record.frame.bundle)){entry.revoked=true;worlds.delete(record.world);entry=null;}
 if(entry){if(!same(entry.signature,signature))throw Error('Source transforms/order/geometry differ from shared Conquest compilation');entry.hits++;return entry.build;}
 const build=buildNativeStaticTree({root,groups,sourceProfile,admitTriangle,clipTriangle});if(!build.processed||!build.tree)throw Error('Complete processed source tree required');
 const frozenObjects=freezeTree(build.tree);entry={frame:record.frame,bundle:record.frame.bundle,signature,build,hits:0,compilations:1,frozenObjects,revoked:false};worlds.set(record.world,entry);return build;
}
export function conquestStaticCompilationSnapshot(world){const entry=worlds.get(world);return{present:!!entry,current:!!entry&&!entry.revoked&&frameCurrent(entry.frame),sourceTriangles:entry?1601:0,compilations:entry?.compilations??0,reuses:entry?.hits??0,frozenObjects:entry?.frozenObjects??0,sharedEnableReaders:false,sharedRuntimeLifecycle:false,nativeReady:false};}
// BEGIN exact scoped source compiler (source grouping, coverage and views unchanged)
const compilerUint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const knownEnable=n=>typeof n==='boolean'||Number.isInteger(n)&&n>=0&&n<=255;

function compileConquestCachedSourceTree({sources,poses,root,owners,factoryOwnerOrder,sourceProfile,
 admitTriangle,clipTriangle,readStaticEnabled,contactPreparation,sharedCompilation,contactViewCounts}={}){
 if(!Array.isArray(sources)||!sources.length||!(poses instanceof Map)||!Array.isArray(owners)||!owners.length||
  !Array.isArray(factoryOwnerOrder)||factoryOwnerOrder.some(id=>!compilerUint(id))||new Set(factoryOwnerOrder).size!==factoryOwnerOrder.length||
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
    !owners.includes(metadata.owner)||!r||!compilerUint(r.raw10)||!compilerUint(r.raw18)||![0,1].includes(r.builderArgument))throw TypeError('Original geometry with qualified registration and selected owner required');
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
 const build=reuseConquestStaticBuild(sharedCompilation,{root:nativeStaticInitialRoot(root),groups:ordered,sourceProfile,admitTriangle,clipTriangle});
 if(!build.processed||!build.tree)throw TypeError('Processed nonempty source tree required');
 const readEnabled=createNativeStaticContactKeyedEnableReader(key=>{
  const group=groups.get(key);if(!group)return undefined;
  let value;
  for(const binding of group.bindings){
   if(binding.descriptor.active()!==true||binding.record.nativeCollision!==binding.metadata)return undefined;
   const enabled=binding.metadata.owner==='destructible-piece734E70'?binding.metadata.runtimeEnabled:readStaticEnabled(binding.metadata);
   if(!knownEnable(enabled)||value!==undefined&&!!value!==!!enabled)return undefined;
   value=enabled;
  }
  return value;
 });
 const options={geometryQualified:true,readEnabled,contactPreparation};
 const privateOwner=contexts.get(sharedCompilation);
 const deferContact=contactPreparation===undefined&&(privateOwner?.mathProfile===CONQUEST_NAVIGATION_WORLD_MATH_PROFILE||privateOwner?.mathProfile===CONQUEST_ATTACK_WORLD_MATH_PROFILE);
 if(deferContact){
  const fields={groups:ordered.map(({bindings,bindingMetadata,...group})=>group),sourceTriangles,
   qualification:{completeSourceTriangleCoverage:true,currentEnableReadersBound:true,staticPartitionOnly:true,
    nativeConstructionArithmeticObserved:false,nativeMovementCompared:false,nativeReady:false}};
  const compiled=createDeferredConquestContactView({build,options,fields,onMaterialized:()=>{contactViewCounts.materialized++;}});
  contactViewCounts.deferred++;return compiled;
 }
 const compiled={build,contactTree:nativeStaticContactTree(build.tree,options),packetTree:nativeStaticHeightTree(build.tree,options),
  groups:ordered.map(({bindings,bindingMetadata,...group})=>group),sourceTriangles,
  qualification:{completeSourceTriangleCoverage:true,currentEnableReadersBound:true,staticPartitionOnly:true,
   nativeConstructionArithmeticObserved:false,nativeMovementCompared:false,nativeReady:false}};
 contactViewCounts.eager++;contactViewCounts.materialized++;return compiled;
}

// BEGIN exact scoped runtime lifecycle (source enables and generations stay consumer-owned)
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


export function createConquestStaticRuntimeWorlds({binding,contactPreparation}={}){
 const bindingOwner=readConquestStaticGeometryBinding(binding);if(!bindingOwner.shared)return createNativeCollisionRuntimeWorlds({readBindings:()=>bindingOwner.read(),contactPreparation});
 const readBindings=()=>bindingOwner.read(),sharedCompilation=createConquestStaticCompilationContext(binding);
 if(!sync(readBindings))throw TypeError('Explicit synchronous runtime bindings reader required');
 if(contactPreparation!==undefined)assertNativeStaticContactPreparation(contactPreparation);
 const contactViewCounts={deferred:0,eager:0,materialized:0};
 let disposed=false,current=null,generation=0,compilations=0,rejectedRevision=null;
 function retire(){if(current)current.active=false;current=null;}
 function collectOwned(){
  // Live descriptor checks retain the generic collect cadence and order. All
  // other collected fields belong exclusively to this immutable receipt.
  const spec=bindingOwner.owned.nodes[1];
  if(!sync(spec.admitTriangle)||!sync(spec.clipTriangle)||!sync(spec.readStaticEnabled))throw TypeError('Source worlds, pose map, admission, clipping and enable ports required');
  for(const {descriptor,source,parentIndices,active,readRecords}of bindingOwner.owned.sources){
   if(!descriptor||!sync(descriptor.active)||!sync(descriptor.readRecords)||invoke(descriptor.active)!==true)throw TypeError('Active runtime source descriptor required');
   // Same descriptor field-read order as generic collect: signature inputs,
   // then bound-row inputs. Only traversal of immutable numeric arrays goes.
   descriptor.source;descriptor.parentIndices;descriptor.requiredModelIndices;
   if(descriptor.source!==source||descriptor.parentIndices!==parentIndices||descriptor.active!==active||descriptor.readRecords!==readRecords)throw Error('Owned source descriptor identity changed');
  }
  return bindingOwner.owned;
 }
 function collect(binding){
  if(bindingOwner.owned)return collectOwned();
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
 function ownersActive(entry){return bindingOwner.ownerActive()&&entry.active&&entry.sources.every(({owner,descriptor,source,parentIndices,active,readRecords})=>
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
    compiled=compileConquestCachedSourceTree({sources,poses,root:spec.root,owners:spec.owners,factoryOwnerOrder:spec.factoryOwnerOrder,
     sourceProfile:spec.sourceProfile,admitTriangle:spec.admitTriangle,clipTriangle:spec.clipTriangle,
     readStaticEnabled:metadata=>live()?invoke(spec.readStaticEnabled,metadata):undefined,contactPreparation,sharedCompilation,contactViewCounts});
    compilations++;entry.compiled.set(spec.id,compiled);
   }
   const children=spec.children.map(node),descriptor=conquestPrivateCollisionWorldDescriptor({compiled,children,complete:true});
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
  diagnostics(){return {disposed,generation,totalCompilations:compilations,active:current!==null&&ownersActive(current),contactViews:{...contactViewCounts}};}
 };
}
