import {createConquestStaticGeometryBinding,createConquestOwnedStaticGeometryBinding,createConquestStaticRuntimeWorlds} from './conquest-static-compilation.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {createNativeCollisionRayPorts,nativePacketRayTreeView} from './native-collision-ray-ports.js';
import {createConquestStaticSrtPorts} from './conquest-static-srt-ports.js';

export const CONQUEST_PAWN_WORLD_SEGMENT=Object.freeze({queryMask:0x2107c0,rawQueryFlag:false,coordinateSpace:'native'});
export const CONQUEST_ATTACK_WORLD_MATH_PROFILE=Object.freeze({qualified:true,
 source:'Explicit analytical JS53/SRT baseline, float24 nearest cell construction and reciprocal estimate .999755859375; native construction arithmetic not observed',
 transformPorts:createConquestStaticSrtPorts(),reciprocalOneEstimate:.999755859375,precisionBits:24,roundingMode:'nearest'});
const treeProfile=Object.freeze({qualified:true,nodeVtable:0x14aca50,boundsVtable:0x13f617c,lazyChildren:true,source:'Source packet-tree constructor layout; analytical reconstruction of actual map46 source geometry'});
const dispatch85=Object.freeze({qualified:true,boundsType:8,rayType:5,handler:0x119d7b0});
const sync=value=>typeof value==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(value.constructor?.name);
const call=(fn,arg)=>{if(!sync(fn))throw Error('Explicit synchronous current world producer required');const value=fn(arg);if(value&&typeof value.then==='function')throw Error('Current world producer returned a promise');return value;};
const xyz=value=>Array.isArray(value)&&value.length===3&&value.every(n=>Number.isFinite(n)&&Number.isFinite(Math.fround(n)));
const owners=new WeakMap();
export function assertConquestAttackWorldQueries(provider,{world}={}){
 const owner=owners.get(provider);
 if(!owner||owner.world!==world||provider.snapshot().prepared!==true)throw Error('Prepared actual Conquest segment provider owned by this loaded world required');
 return provider;
}

// Owned map46 segment adapter for575BA0(type1)->5F5AD0. Returns null rather
// than treating absent source collections, flags or revoked geometry as clear.
export function createConquestAttackWorldQueries({world,revision,mathProfile,readCurrentCollections,readManagerContext}={}){
 let phase='idle',geometry=null,runtime=null,sourceBundle=null,descriptors=null,lastReason=null,lastResult=null,queryCount=0,packetTreeNodes=0;
 function active(){
  return phase==='prepared'&&world?.nativeMapId===46&&world.sourceData===sourceBundle&&Array.isArray(world.nativeCollisionSources)&&
   world.nativeCollisionSources.length===descriptors.length&&descriptors.every(({descriptor,source,parentIndices,requiredModelIndices,active,readRecords},index)=>
    world.nativeCollisionSources[index]===descriptor&&descriptor.source===source&&descriptor.parentIndices===parentIndices&&descriptor.requiredModelIndices===requiredModelIndices&&descriptor.active===active&&descriptor.readRecords===readRecords&&call(active)===true);
 }
 function refusal(reason){lastReason=reason;lastResult=null;return null;}
 function revoke(reason){phase='revoked';runtime?.dispose();return refusal(reason);}
 const query=createNativeCollisionRayPorts({readCurrent(input){
  if(!active())return {qualified:false,reason:'Conquest source world owner revoked'};
  const current=runtime.read();if(current.qualified!==true)return current;
  const context={kind:'ray',input,world,generation:revision};
  const manager=call(readManagerContext,context);
  if(manager?.qualified!==true||typeof manager.managerFlag20!=='boolean')return {qualified:false,reason:'Current managerFlag20 producer unqualified'};
  let collections;
  const currentCollections=()=>{if(collections===undefined){collections=call(readCurrentCollections,context);if(collections?.qualified!==true)throw Error('Current category400 lifecycle unqualified');}return collections;};
  // Use the existing current-ray protocol. Category getters remain lazy;
  // complete[] is accepted only when supplied by the current collection owner.
  return {qualified:true,managerFlag20:manager.managerFlag20,worldC:current.worldC,world8:current.world8,treeProfile,dispatch85,
   get category400(){return currentCollections().category400;},get category400Bindings(){return currentCollections().category400Bindings;}};
 }});
 const api={
  prepare(){
   if(phase==='disposed')return api.snapshot();if(phase==='prepared'){try{if(!active())throw Error('Conquest source world owner revoked');}catch(error){lastReason=error.message;phase='revoked';runtime?.dispose();}return api.snapshot();}
   if(phase!=='idle')return api.snapshot();
   try{
    if(!world||world.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||!Array.isArray(world.nativeCollisionSources))throw Error('Actual complete loaded Conquest map46 source world required');
    if(!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0))throw Error('Explicit immutable Conquest source generation required');
    if(!sync(readCurrentCollections)||!sync(readManagerContext))throw Error('Current category400 collections and managerFlag20 producers required');
    if(mathProfile?.qualified!==true)throw Error('Explicit analytical or captured native math profile required');
    const bundle=world.sourceData,variant=bundle.variants?.find(row=>row.id===46);
    if(bundle.scenes?.length!==4||bundle.sources?.length!==4||variant?.scenes?.length!==4||variant.scenes.some(row=>row.section!=='STATIC')||
     !Array.isArray(bundle.nonStatic)||!bundle.nonStatic.length||bundle.nonStatic.some(row=>row.registeredModels!==0))throw Error('Complete STATIC4 and explicit zero non-STATIC collision topology required');
    descriptors=world.nativeCollisionSources.map(descriptor=>({descriptor,source:descriptor.source,parentIndices:descriptor.parentIndices,requiredModelIndices:descriptor.requiredModelIndices,active:descriptor.active,readRecords:descriptor.readRecords}));
    if(descriptors.length!==4||descriptors.some(item=>!bundle.scenes.includes(item.source)||call(item.active)!==true))throw Error('Owned exact four source scene descriptors required');
    const records=descriptors.flatMap(item=>{const rows=call(item.readRecords);if(!Array.isArray(rows))throw Error('Complete current source face stream required');return rows;});
    if(records.length!==1601||records.some(row=>row.nativeCollision?.partition!=='world8'||row.nativeCollision.owner!=='main-static-root1A0'))throw Error('Complete1601 original map46 STATIC faces required');
    sourceBundle=bundle;
    geometry=hasSealedConquestStaticSource(world,world.sourceData)&&mathProfile===CONQUEST_ATTACK_WORLD_MATH_PROFILE?createConquestOwnedStaticGeometryBinding({world,revision,mathProfile,source:'Actual Conquest map46 STATIC4 original geometry; explicit JS runtime topology and numeric policy',emptyWorldEvidence:'All1601 original map46 STATIC registrations own world8; non-STATIC streams contain zero registered models'}):createConquestStaticGeometryBinding({world,sourceWorld:world,factoryOwnerOrder:[],mathProfile,revision,
     source:'Actual Conquest map46 STATIC4 original geometry; explicit JS runtime topology and numeric policy',
     readChildren:()=>({qualified:true,evidence:'Current map46 STATIC4 source binding; every authored non-STATIC scene has zero registered collision models',worldC:[],world8:[]}),
     emptyPartitionEvidence:{worldC:'All1601 original map46 STATIC registrations explicitly own world8; non-STATIC source streams contain zero registered models'}});
    runtime=createConquestStaticRuntimeWorlds({binding:geometry});
    const result=runtime.read();if(result.qualified!==true||result.diagnostics.sourceTriangles!==1601)throw Error(result.detail??result.reason??'Full map46 reconstruction unavailable');
    const pending=[result.worldC.packetTree,result.world8.packetTree];packetTreeNodes=0;
    while(pending.length){const node=pending.pop();if(node===null)continue;packetTreeNodes++;if(node.branch)pending.push(...node.children);}
    // Preparation must certify the existing ray adapter can represent the
    // complete tree; compiling movement geometry alone is insufficient.
    nativePacketRayTreeView(result.worldC.packetTree,treeProfile);nativePacketRayTreeView(result.world8.packetTree,treeProfile);
    phase='prepared';lastReason=null;
   }catch(error){lastReason=error.message;phase='blocked';runtime?.dispose();}
   return api.snapshot();
  },
  probeSegment(request){
   queryCount++;
   try{
    if(phase!=='prepared')return refusal('Conquest segment geometry unprepared or revoked');
    try{if(!active())return revoke('Conquest source world owner revoked');}catch(error){return revoke(error.message);}
    if(request?.queryMask!==CONQUEST_PAWN_WORLD_SEGMENT.queryMask||request.rawQueryFlag!==false||request.coordinateSpace!=='native'||!xyz(request.from)||!xyz(request.to))return refusal('Exact native Pawn segment mask0x2107C0, false flag and finite native endpoints required');
    const result=query({mask:request.queryMask,argumentZero:0,start:request.from,end:request.to});
    try{if(!active())return revoke('Conquest source world revoked during segment query');}catch(error){return revoke(error.message);}
    if(result.qualified!==true)return refusal(result.reason??'Conquest source segment result unqualified');
    if(typeof result.hit!=='boolean'||!xyz(result.point))return refusal('Complete source segment result required');
    lastReason=null;lastResult=result;
    return {blocked:result.hit,point:result.hit?[...result.point]:null};
   }catch(error){return refusal(error.message);}
  },
  snapshot(){
   if(phase==='prepared'){try{if(!active())throw Error('Conquest source world owner revoked');}catch(error){phase='revoked';lastReason=error.message;lastResult=null;runtime?.dispose();}}
   return {phase,prepared:phase==='prepared',lastReason,queryCount,sourceTriangles:runtime?.diagnostics().active?1601:null,
   totalCompilations:runtime?.diagnostics().totalCompilations??0,packetTreeNodes,lastHit:lastResult?.hit??null,
   numericProfile:mathProfile?.source??null,nativeReady:false,nativeTreeObserved:false,nativeConstructionArithmeticObserved:false,
   limits:['Analytical reconstructed tree; native tree/leaf order not captured','Selected SRT, reciprocal and construction precision policy; native numeric parity unverified','Current category400 membership/gates and managerFlag20 require explicit owner producers']};},
  dispose(){if(phase==='disposed')return;phase='disposed';runtime?.dispose();lastResult=null;lastReason='Conquest segment adapter disposed';},
 };
 owners.set(api,{world});return Object.freeze(api);
}
