// Explicit loaded-world/actor lifecycle. Native source fields are never
// synthesized from an arbitrary combat object, visual mesh or unknown list.
import {nativeMapPoint} from './s5runtime-coordinates.js';
import {createNativeBlast2RuntimeState} from './native-blast2-runtime-state.js';
import {nativeStaticAdmission53} from './native-static-tree-builder.js';
import {createNativeCellTriangleClipper} from './native-cell-triangle-clipping.js';
const f=Math.fround;
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const text=value=>typeof value==='string'&&value.trim().length>0;
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const identity=value=>text(value)||uint(value);
const vector=value=>{if(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite source XYZ required');return value.map(f);};
const call=(fn,...args)=>{if(!sync(fn))throw TypeError('Explicit synchronous current-world reader required');const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Deferred current-world result refused');return value;};

// Actual loaded BioLab/artist-map source geometry. Host explicitly supplies
// numeric execution policy and live child topology; none is guessed per map.
export function createNativeLoadedMapGeometryBinding({world,sourceWorld,factoryOwnerOrder,mathProfile,readChildren,emptyPartitionEvidence,revision,source}={}){
 if(!world||!sourceWorld||!Array.isArray(sourceWorld.nativeCollisionSources)||!Array.isArray(factoryOwnerOrder)||!identity(revision)||!text(source)||!sync(readChildren)||
  mathProfile?.qualified!==true||!text(mathProfile.source)||!mathProfile.transformPorts||!Number.isFinite(mathProfile.reciprocalOneEstimate))throw TypeError('Explicit loaded source world, topology and numeric policy required');
 const bundle=world.sourceData,variants=bundle?.variants?.filter(value=>value.id===world.nativeMapId);
 if(variants?.length!==1)throw TypeError('Unique actual loaded BGINFO variant required');
 const configs=variants[0].configs?.filter(value=>value.path===variants[0].bginfo&&value.status==='verified');
 if(configs?.length!==1||!Array.isArray(configs[0].entries))throw TypeError('Actual verified BGINFO root required');
 function rootValue(key){const rows=configs[0].entries.filter(value=>value.section==='OCTREE'&&value.key===key);if(rows.length!==1||!/^\d+$/.test(rows[0].value))throw TypeError('Explicit source OCTREE '+key+' required');return Number(rows[0].value);}
 const root={size:['OctreeSizeX','OctreeSizeY','OctreeSizeZ'].map(rootValue),depth:rootValue('OctreeDepth')};
 const groups=new Map([['worldC',[]],['world8',[]]]),poseProfiles=new Map(),staticEnabled=new Map();
 for(const descriptor of sourceWorld.nativeCollisionSources){
  if(call(descriptor.active)!==true)throw Error('Loaded source descriptor inactive');const records=call(descriptor.readRecords);
  if(!Array.isArray(records))throw TypeError('Complete loaded source records required');if(!records.length){if(descriptor.requiredModelIndices?.length)throw TypeError('Loaded source geometry missing');continue;}
  const partitions=new Set();for(const record of records){const metadata=record.nativeCollision;
   if(metadata?.registrationRuleVerified!==true||metadata.partitionConfirmed!==true||!groups.has(metadata.partition)||!metadata.registration)throw TypeError('Every loaded source face needs authenticated partition/registration');
   partitions.add(metadata.partition);
   if(metadata.owner!=='destructible-piece734E70'){
    const registration=metadata.registration;if(registration.raw34Initial!==1)throw TypeError('Authenticated source initial static enable required');
    staticEnabled.set(registration.name,true);
   }
  }
  if(partitions.size!==1)throw TypeError('Mixed source descriptor partitions require explicit split ownership');groups.get([...partitions][0]).push(descriptor);
  const names=new Set([...descriptor.source.models,...descriptor.source.bones].flatMap(entity=>Object.keys(entity.animations??{})));
  if(names.size!==1)throw TypeError('Dynamic/unknown source pose needs actual source animator binding');const selectedName=[...names][0];
  poseProfiles.set(descriptor.source.source,{selectedName,initialState:{fresh:true,controllerIndex:0,transitionActive:false,destinationPresent:true,evidence:source+'; mono-name source initial KeyData selection'},transformPorts:mathProfile.transformPorts,reciprocalOneEstimate:mathProfile.reciprocalOneEstimate});
 }
 const readStaticEnabled=metadata=>staticEnabled.get(metadata?.registration?.name);
 const clipTriangle=createNativeCellTriangleClipper({precisionBits:mathProfile.precisionBits,roundingMode:mathProfile.roundingMode,source:mathProfile.source});
 const parts={};
 for(const [partition,descriptors]of groups){
  if(!descriptors.length){if(!text(emptyPartitionEvidence?.[partition]))throw TypeError('Explicit current empty-partition evidence required: '+partition);parts[partition]={id:partition,kind:'empty',sourceWorlds:[],evidence:emptyPartitionEvidence[partition],children:[]};}
  else parts[partition]={id:partition,kind:'source',evidence:source,sourceWorlds:[{nativeCollisionSources:descriptors}],poseProfiles,root,
   owners:[...new Set(descriptors.flatMap(descriptor=>call(descriptor.readRecords).map(record=>record.nativeCollision.owner)))],factoryOwnerOrder,
   sourceProfile:{branch:'source-rebuild',geometry:'complete-source-triangles',sources:descriptors.map(value=>value.source.source),evidence:source},admitTriangle:nativeStaticAdmission53,clipTriangle,readStaticEnabled,children:[]};
 }
 return Object.freeze({
  read(){const children=call(readChildren);if(children?.qualified!==true||!text(children.evidence)||!Array.isArray(children.worldC)||!Array.isArray(children.world8))throw TypeError('Explicit complete current world90 topology required');
   parts.worldC.children=children.worldC;parts.world8.children=children.world8;return {qualified:true,revision,evidence:source,worldC:parts.worldC,world8:parts.world8};},
  setStaticEnabled(name,enabled){if(!staticEnabled.has(name)||typeof enabled!=='boolean')throw TypeError('Known source static registration and explicit enable required');staticEnabled.set(name,enabled);},
  readStaticEnabled,qualification:{sourceGeometryBound:true,currentStaticEnableLedger:true,numericPolicy:mathProfile.source,nativeReady:false,nativeMovementCompared:false},
 });
}

// Bound only to the authenticated player body observed in the handed-off
// capture. 678 is OFFSET,684 is WORLD POSITION,690 is RADII. Eligibility and
// source list membership remain explicit current implementations.
export function createNativeCapturedPlayerBodyReader({solverId,bodyProfile,mirrorZ,readEligibility,readSourceMembership}={}){
 if(!identity(solverId)||typeof mirrorZ!=='boolean'||bodyProfile?.schema!=='native-captured-player-body-v1'||!text(bodyProfile.evidence)||!sync(readEligibility)||!sync(readSourceMembership)||
  JSON.stringify(bodyProfile.offset678)!=='[0,160,0]'||JSON.stringify(bodyProfile.radii690)!=='[100,160,100]')throw TypeError('Explicit captured player body, source membership/eligibility and coordinate boundary required');
 const reader=actor=>{
  const eligible=call(readEligibility,actor),membership=call(readSourceMembership,actor);
  if(eligible?.qualified!==true||typeof eligible.value!=='boolean'||membership?.qualified!==true||membership.branch!==0x1000||!identity(membership.teamId)||typeof membership.teamEnabled!=='boolean')return {qualified:false,reason:'current-player-source-eligibility-or-membership-unqualified'};
  const position=actor?.position;
  if(!position||![position.x,position.y,position.z].every(Number.isFinite))return {qualified:false,reason:'current-controller-position-unqualified'};
  const native=nativeMapPoint(position,mirrorZ);
  return {qualified:true,solverId,eligible:eligible.value,branch:membership.branch,teamId:membership.teamId,teamEnabled:membership.teamEnabled,
   raw678:[0,160,0],raw684:vector([native.x,native.y,native.z]),raw690:[100,160,100],
   qualification:{bodySource:bodyProfile.evidence,coordinateBoundary:'Current Controller.position through documented SCN .006 scale/mirror boundary',identityAuthority:'Explicit local S5 namespace; not a native pointer',nativeReady:false}};
 };
 Object.defineProperty(reader,'sourceBranch',{value:0x1000});return reader;
}

export function createNativeWorldRuntimeBindings({world,generation,source,readCurrentActors,readCurrentCollections,readManagerContext,readGeometryBindings,blast2}={}){
 if(!world||!Array.isArray(world.nativeCollisionSources)||!world.nativeCollisionSources.length||!identity(generation)||!text(source)||
  ![readManagerContext,readGeometryBindings].every(sync))throw TypeError('Loaded complete source world, generation and current source manager/geometry readers required');
 const descriptors=world.nativeCollisionSources.slice(),registrations=new Map();let disposed=false,reading=false,ledger=null,sourceWorld=world;
 function active(){
  if(disposed||world.nativeCollisionSources.length!==descriptors.length||!descriptors.every((value,index)=>world.nativeCollisionSources[index]===value&&call(value.active)===true))throw Error('Native world binding owner unavailable');
 }
 function read(action){
  if(reading)throw Error('Native current-world lifecycle reader cannot reenter');reading=true;
  try{active();const result=action();active();return result;}finally{reading=false;}
 }
 function actorCollections(requestedBranch){
  const current=call(readCurrentActors,{world,generation});
  if(current?.qualified!==true||current.complete!==true||!Array.isArray(current.actors)||new Set(current.actors).size!==current.actors.length)throw Error('Complete actual current actor roster unavailable');
  if(current.actors.length!==registrations.size||current.actors.some(actor=>!registrations.has(actor)))throw Error('Current actor roster has unregistered or retired actors');
  const teams=new Map(),other10000=[],other200000=[],solverIds=new Set(),actorOrder=current.actors.slice();
  for(const actor of current.actors){
   if(actor?.world!==world)throw Error('Actor belongs to another loaded world');
   const reader=registrations.get(actor);
   if(requestedBranch!==undefined&&[0x1000,0x10000,0x200000].includes(reader.sourceBranch)&&reader.sourceBranch!==requestedBranch)continue;
   const state=call(reader,actor,{world,generation});
   if(requestedBranch!==undefined&&state?.qualified===true&&[0x1000,0x10000,0x200000].includes(state.branch)&&state.branch!==requestedBranch)continue;
   if(state?.qualified!==true||typeof state.eligible!=='boolean'||!identity(state.solverId)||![0x1000,0x10000,0x200000].includes(state.branch))throw Error('Current source actor identity, eligibility or branch unavailable');
   if(solverIds.has(state.solverId))throw Error('Different current actors alias one source solver identity');solverIds.add(state.solverId);
   const row={qualified:true,eligible:state.eligible,solverId:state.solverId,raw684:vector(state.raw684)};
   if(state.branch===0x1000){
    if(!identity(state.teamId)||typeof state.teamEnabled!=='boolean')throw Error('Current source team membership unavailable');
    row.raw678=vector(state.raw678);row.raw690=vector(state.raw690);
    if(!teams.has(state.teamId))teams.set(state.teamId,{enabled:state.teamEnabled,actorsComplete:true,actors:[]});
    const team=teams.get(state.teamId);if(team.enabled!==state.teamEnabled)throw Error('Current source team enable differs within one team');team.actors.push(row);
   }else{
    if(!Number.isFinite(state.virtual60)||!Number.isFinite(state.virtual64))throw Error('Actual source virtual60/64 body returns unavailable');
    row.virtual60=f(state.virtual60);row.virtual64=f(state.virtual64);(state.branch===0x10000?other10000:other200000).push(row);
   }
  }
  const after=call(readCurrentActors,{world,generation});
  if(after?.qualified!==true||after.complete!==true||!Array.isArray(after.actors)||after.actors.length!==actorOrder.length||!actorOrder.every((actor,index)=>after.actors[index]===actor))throw Error('Current actor roster changed during source body read');
  return {[0x1000]:{complete:true,teams:[...teams.values()]},[0x10000]:{complete:true,actors:other10000},[0x200000]:{complete:true,actors:other200000}};
 }
 if(blast2!==undefined){
  if(blast2?.profile?.bundle!==world.sourceData||blast2.profile.nativeMapId!==world.nativeMapId)throw TypeError('BLAST2 profile must own this exact loaded source bundle/map');
  ledger=createNativeBlast2RuntimeState({...blast2,source,readAuthority:()=>{active();return call(blast2.readAuthority);}});
  try{sourceWorld=ledger.bindWorld(world);}catch(error){ledger.dispose();throw error;}
 }
 const binding={
  world,generation,source,sourceWorld,blast2:ledger,
  registerActor(actor,reader){
   if(reading)throw Error('Actor lifecycle cannot mutate during current-world read');
   return read(()=>{
    if(actor?.world!==world||!sync(reader)||registrations.has(actor))throw TypeError('Unique current loaded actor and explicit source reader required');registrations.set(actor,reader);
    return ()=>{if(reading)throw Error('Actor lifecycle cannot mutate during current-world read');return read(()=>{if(registrations.get(actor)===reader)registrations.delete(actor);});};
   });
  },
  readWorldBindings(){return read(()=>{
   const value=call(readGeometryBindings,{world,sourceWorld,generation});
   if(value?.qualified!==true)throw Error('Current source geometry/topology binding unavailable');return value;
  });},
  readCollisionContext(kind,input,state){return read(()=>{
   const context=call(readManagerContext,{kind,input,state,world,generation});
   if(context?.qualified!==true||typeof context.managerFlag20!=='boolean')throw Error('Current source manager policy unavailable');
   let collections;
   const currentCollections=()=>{if(collections===undefined){const candidate=call(readCurrentCollections,{kind,input,state,world,generation});if(candidate?.qualified!==true)throw Error('Current special-category lifecycle unavailable');collections=candidate;}return collections;};
   // Preserve unavailable special lists as unavailable: reached consumers
   // enforce completeness. Empty lists here come only from actual host data.
   const value={},actors={};
   for(const branch of [0x1000,0x10000,0x200000])Object.defineProperty(actors,branch,{enumerable:true,get:()=>read(()=>actorCollections(branch)[branch])});
   const specialKeys=['category400','category800','category8000','category400Bindings','category800Bindings','treeProfile','dispatch85'];
   for(const key of Object.keys(context).filter(key=>!specialKeys.includes(key)&&key!=='actorCollections'))Object.defineProperty(value,key,{enumerable:true,get:()=>read(()=>context[key])});
   for(const key of specialKeys)Object.defineProperty(value,key,{enumerable:true,get:()=>read(()=>['treeProfile','dispatch85'].includes(key)&&Object.hasOwn(context,key)?context[key]:currentCollections()[key])});
   Object.defineProperty(value,'actorCollections',{enumerable:true,value:actors});return value;
  });},
  readActorCollections(){return read(actorCollections);},
  dispose(){
   if(disposed)return;if(reading)throw Error('Native world lifecycle cannot dispose during a read');
   ledger?.dispose();sourceWorld!==world&&sourceWorld.dispose();registrations.clear();disposed=true;
  },
  diagnostics(){return {disposed,registeredActors:registrations.size,generation,blast2Bound:ledger!==null,nativeReady:false,defaultGameplayActivated:false};},
 };
 return Object.freeze(binding);
}
