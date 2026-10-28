import {createConquestStaticGeometryBinding,createConquestOwnedStaticGeometryBinding,createConquestStaticRuntimeWorlds} from './conquest-static-compilation.js';
import {createNativeCollisionWorldPorts} from './native-collision-world-ports.js';
import {createConquestStaticSrtPorts} from './conquest-static-srt-ports.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {createNativeStaticContactPreparation,nativeStaticContactPreparationSnapshot} from './native-static-contact-prepared.js';

export const CONQUEST_MOVEMENT_WORLD_MATH_PROFILE=Object.freeze({qualified:true,
 source:'Explicit analytical JS53/SRT baseline with float24 nearest construction and reciprocal .999755859375; native tree construction and x87 control word unobserved',
 transformPorts:createConquestStaticSrtPorts(),reciprocalOneEstimate:.999755859375,precisionBits:24,roundingMode:'nearest',roundX87:value=>value});
// Authenticated constant_info.x7 b7117d79... and original registry consumers.
export const CONQUEST_MOVEMENT_WORLD_CONSTANTS=Object.freeze({float47:1,float33:.5,float48:-1,integer3:3,float64:4});
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const call=(fn,arg)=>{if(!sync(fn))throw Error('Synchronous current movement-world owner required');const result=fn(arg);if(result&&typeof result.then==='function')throw Error('Current movement-world producer returned a promise');return result;};
const owners=new WeakMap();
export function auditConquestMovementWorldQueries(provider,{world}={}){const entry=owners.get(provider);if(!entry||entry.world!==world)throw Error('Prepared actual map46 movement-world provider required');return entry.audit();}
export function assertConquestMovementWorldQueries(provider,expected={}){if(!auditConquestMovementWorldQueries(provider,expected))throw Error('Prepared actual map46 movement-world provider required');return provider;}

// The real1601-face source trees feed the already sourced contact, lower-
// support and post-move overlap consumers. This adapter owns neither the
// monster's retained solver state nor its mask/phase/collection lifecycle.
export function createConquestMovementWorldQueries({world,revision,mathProfile,readCurrentContext,readCurrentCollections,prepareStaticContacts=false}={}){
 if(typeof prepareStaticContacts!=='boolean')throw Error('Explicit static-contact preparation boolean required');
 let phase='idle',runtime=null,bundle=null,descriptors=null,lastReason=null,lastResult=null,contactPreparation;
 const counts={contact:0,height:0,overlap:0};
 function active(){return phase==='prepared'&&world?.nativeMapId===46&&world.sourceData===bundle&&Array.isArray(world.nativeCollisionSources)&&world.nativeCollisionSources.length===descriptors.length&&descriptors.every((item,i)=>world.nativeCollisionSources[i]===item.descriptor&&item.descriptor.source===item.source&&item.descriptor.parentIndices===item.parentIndices&&item.descriptor.requiredModelIndices===item.requiredModelIndices&&item.descriptor.active===item.active&&item.descriptor.readRecords===item.readRecords&&call(item.active)===true);}
 const refusal=reason=>{lastReason=reason;lastResult=null;return {qualified:false,hit:false,reason,nativeReady:false};};
 const revoke=reason=>{phase='revoked';runtime?.dispose();return refusal(reason);};
 function audit(){if(phase==='prepared'){try{if(!active())throw Error('Current source movement world owner revoked');}catch(error){revoke(error.message);}}return phase==='prepared';}
 const ports=createNativeCollisionWorldPorts({arithmeticProfile:mathProfile,readCurrent(kind,input){
  if(!active())return {qualified:false};
  const current=runtime.read();if(current.qualified!==true)throw Error(current.detail??current.reason);
  const request={kind,input,world,generation:revision},context=call(readCurrentContext,request);
  if(context?.qualified!==true||typeof context.managerFlag20!=='boolean'||!uint(context.solverMask)||!uint(context.overlapGlobalMask))throw Error('Current native manager/solver/overlap context unqualified');
  if(kind==='contact'&&input.solverMask!==context.solverMask)throw Error('Current source solver mask mismatch');
  let collections;
  const collectionOwner=()=>{if(collections===undefined){collections=call(readCurrentCollections,request);if(collections?.qualified!==true)throw Error('Current native movement collections unqualified');}return collections;};
  const effectiveMask=kind==='contact'?(input.solverMask&input.globalMask)>>>0:kind==='height'?input.mask:input.mask;
  if(!active())throw Error('Source movement world revoked during current context read');
  return {qualified:true,...CONQUEST_MOVEMENT_WORLD_CONSTANTS,worldC:current.worldC,world8:current.world8,
   managerFlag20:context.managerFlag20,solverMask:context.solverMask,overlapGlobalMask:context.overlapGlobalMask,sourceSolverId:context.sourceSolverId,
   // Unknown collections are irrelevant only when the source's actual mask
   // skips their branch. Raw actor bits are independent of globalMask.
   get category400(){return effectiveMask&0x400?collectionOwner().category400:undefined;},
   get actorCollections(){return kind==='contact'&&(input.solverMask&0x211000)?collectionOwner().actorCollections:undefined;}};
 }});
 function execute(kind,input){
  counts[kind]++;
  try{
   if(phase!=='prepared')return refusal('Movement source world unprepared or revoked');
   try{if(!active())return revoke('Current source movement world owner revoked');}catch(error){return revoke(error.message);}
   const result=kind==='contact'?ports.queryContact(input):kind==='height'?ports.queryLowerSupport(input):ports.queryAdjustedPosition(input);
   try{if(!active())return revoke('Source movement world revoked during query');}catch(error){return revoke(error.message);}
   if(result.qualified!==true)return refusal(result.reason??'Complete source movement query required');
   lastReason=null;lastResult={kind,result};return result;
  }catch(error){return refusal(error.message);}
 }
 const api={
  prepare(){
   if(phase==='prepared'){try{if(!active())throw Error('Current source movement world owner revoked');}catch(error){revoke(error.message);}return api.snapshot();}
   if(phase!=='idle')return api.snapshot();
   try{
    if(world?.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||!Array.isArray(world.nativeCollisionSources))throw Error('Actual loaded complete map46 source world required');
    if(!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0)||mathProfile?.qualified!==true||!sync(readCurrentContext)||!sync(readCurrentCollections))throw Error('Explicit generation, analytical math and current movement owners required');
    bundle=world.sourceData;const variant=bundle.variants?.find(row=>row.id===46);
    if(bundle.scenes?.length!==4||bundle.sources?.length!==4||variant?.scenes?.length!==4||variant.scenes.some(row=>row.section!=='STATIC')||!Array.isArray(bundle.nonStatic)||!bundle.nonStatic.length||bundle.nonStatic.some(row=>row.registeredModels!==0))throw Error('Complete STATIC4 and explicit zero non-STATIC source topology required');
    descriptors=world.nativeCollisionSources.map(descriptor=>({descriptor,source:descriptor.source,parentIndices:descriptor.parentIndices,requiredModelIndices:descriptor.requiredModelIndices,active:descriptor.active,readRecords:descriptor.readRecords}));
    if(descriptors.length!==4||descriptors.some(item=>!bundle.scenes.includes(item.source)||call(item.active)!==true))throw Error('Exact current four source scene descriptors required');
    const records=descriptors.flatMap(item=>{const value=call(item.readRecords);if(!Array.isArray(value))throw Error('Complete source face streams required');return value;});
    if(records.length!==1601||records.some(row=>row.nativeCollision?.partition!=='world8'||row.nativeCollision.owner!=='main-static-root1A0'))throw Error('All1601 original map46 STATIC faces required');
    const binding=hasSealedConquestStaticSource(world,world.sourceData)&&mathProfile===CONQUEST_MOVEMENT_WORLD_MATH_PROFILE?createConquestOwnedStaticGeometryBinding({world,revision,mathProfile,source:'Actual map46 STATIC4 contact/packet views for source movement; explicit JS numeric reconstruction',emptyWorldEvidence:'All1601 original map46 STATIC registrations own world8; non-STATIC streams contain zero registered models'}):createConquestStaticGeometryBinding({world,sourceWorld:world,revision,mathProfile,factoryOwnerOrder:[],source:'Actual map46 STATIC4 contact/packet views for source movement; explicit JS numeric reconstruction',
     readChildren:()=>({qualified:true,evidence:'Authenticated map46 non-STATIC streams all contain zero registered collision models; complete world90 topology',worldC:[],world8:[]}),
     emptyPartitionEvidence:{worldC:'All1601 original map46 STATIC faces register in world8; non-STATIC source streams have zero registered models'}});
    if(prepareStaticContacts){if(!hasSealedConquestStaticSource(world,bundle)||mathProfile!==CONQUEST_MOVEMENT_WORLD_MATH_PROFILE)throw Error('Static contact preparation requires privately sealed map46 source and exact immutable movement math profile');contactPreparation=createNativeStaticContactPreparation({arithmeticProfile:mathProfile,pureArithmetic:true});}
    runtime=createConquestStaticRuntimeWorlds({binding,contactPreparation});const current=runtime.read();if(current.qualified!==true||current.diagnostics.sourceTriangles!==1601)throw Error(current.detail??current.reason??'Complete map46 source contact/packet geometry unavailable');
    phase='prepared';lastReason=null;
   }catch(error){phase='blocked';lastReason=error.message;runtime?.dispose();}
   return api.snapshot();
  },
  queryContact:input=>execute('contact',input),queryLowerSupport:input=>execute('height',input),queryAdjustedPosition:input=>execute('overlap',input),
  readContactPreparation(){const state=api.snapshot();return {enabled:prepareStaticContacts,active:state.prepared&&contactPreparation!==undefined,
   ...(contactPreparation?nativeStaticContactPreparationSnapshot(contactPreparation):{preparedRecords:0,preparedTriangles:0,preparedCalls:0,sizeFallbacks:0,maxRadiiVariants:32,nativeReady:false})};},
  snapshot(){audit();
   return {phase,prepared:phase==='prepared',lastReason,queryCounts:{...counts},lastKind:lastResult?.kind??null,lastHit:lastResult?.result.hit??null,
    totalCompilations:runtime?.diagnostics().totalCompilations??0,sourceTriangles:runtime?.diagnostics().active?1601:null,numericProfile:mathProfile?.source??null,
    nativeReady:false,nativeTreeObserved:false,nativeConstructionArithmeticObserved:false,nativeMovementCompared:false,x87BitwiseParityVerified:false,
    limits:['Full actual map46 geometry, with analytical tree/SRT reconstruction; native final tree order and numeric parity unobserved','Current manager, solver mask, overlap mask and collections require their actual owner producers','No solver-state resets, actor writes, navigation queries, cadence or free-hit fallback supplied']};},
  dispose(){if(phase==='disposed')return;phase='disposed';runtime?.dispose();lastResult=null;lastReason='Movement source world disposed';},
 };
 owners.set(api,{world,audit});return Object.freeze(api);
}
