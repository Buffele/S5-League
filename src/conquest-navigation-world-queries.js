import {createConquestStaticGeometryBinding,createConquestOwnedStaticGeometryBinding,createConquestStaticRuntimeWorlds} from './conquest-static-compilation.js';
import {createNativeCollisionBoolQuery} from './native-collision-bool-query.js';
import {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE} from './conquest-navigation-math-profile.js';
export {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE} from './conquest-navigation-math-profile.js';
import {CONQUEST_PAWN_NAVIGATION_SEGMENT} from './conquest-pawn-navigation.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {isConquestSourceCollisionDescriptor} from './conquest-collision-source.js';

const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const xyz=v=>Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Number.isFinite(Math.fround(x)));
const owners=new WeakMap();
export function auditConquestNavigationWorldQueries(provider,{world}={}){const entry=owners.get(provider);if(!entry||entry.world!==world)throw Error('Prepared owned map46 boolean segment provider required');return entry.audit();}
export function assertConquestNavigationWorldQueries(provider,expected={}){if(!auditConquestNavigationWorldQueries(provider,expected))throw Error('Prepared owned map46 boolean segment provider required');return provider;}

// Source type/constructor provenance: world11FD9E0 allocates64-byte node,
// calls12760A0 (vtable14ACA50), stores it atE0. Both world1F4 and204 readE0;
// this adapter consumes virtual38, not virtual50 or a closest-ray result.
export function createConquestNavigationWorldQueries({world,revision,mathProfile,readManagerContext,cacheStaticSegments=false}={}){
 let phase='idle',runtime=null,bundle=null,descriptors=null,lastReason=null,queryCount=0,lastResult=null;
 let running=false,staged=null,cacheEnabled=false,cacheGeneration=null,computations=0,cacheHits=0,cacheMisses=0,cacheEvictions=0;
 const segmentCache=new Map(),cacheCapacity=2048,keyBits=new DataView(new ArrayBuffer(4));
 const call=(fn,arg)=>{if(!sync(fn))throw Error('Explicit synchronous current navigation producer required');const value=fn(arg);if(value&&typeof value.then==='function')throw Error('Synchronous navigation producer required');return value;};
 function active(){return phase==='prepared'&&world.nativeMapId===46&&world.sourceData===bundle&&world.nativeCollisionSources.length===descriptors.length&&descriptors.every((item,i)=>world.nativeCollisionSources[i]===item.descriptor&&item.descriptor.source===item.source&&item.descriptor.parentIndices===item.parentIndices&&item.descriptor.requiredModelIndices===item.requiredModelIndices&&item.descriptor.active===item.active&&item.descriptor.readRecords===item.readRecords&&call(item.active)===true);}
 function refuse(reason){lastReason=reason;lastResult=null;return null;}
 function revoke(reason){phase='revoked';segmentCache.clear();cacheEnabled=false;runtime?.dispose();return refuse(reason);}
 function audit(){if(phase==='prepared'){try{if(!active())throw Error('Current navigation source owner revoked');}catch(error){revoke(error.message);}}return phase==='prepared';}
 function cacheOwnersCurrent(){return hasSealedConquestStaticSource(world,bundle)&&mathProfile===CONQUEST_NAVIGATION_WORLD_MATH_PROFILE&&descriptors.every(item=>call(item.readRecords)===item.records&&isConquestSourceCollisionDescriptor(item.descriptor,{source:item.source,records:item.records}));}
 function segmentKey(input,context){
  // Preserve all six float32 bit patterns, including signed zero. No spatial
  // rounding, endpoint reordering or ray-direction approximation is allowed.
  let key=context.generation+':'+input.mask+':'+input.rawQueryFlag+':'+Number(context.managerFlag20);
  for(const point of [input.start,input.end])for(const value of point){keyBits.setFloat32(0,value,true);key+=':'+keyBits.getUint32(0,true);}
  return key;
 }
 let query=null;
 const readCurrent=input=>{
  if(staged){const current=staged;staged=null;return current;}
  if(!active())throw Error('Current navigation world owner revoked');
  const current=runtime.read();if(current.qualified!==true)throw Error(current.detail??current.reason);
  const context=call(readManagerContext,{world,generation:revision,kind:'navigation-bool',input});
  if(context?.qualified!==true||typeof context.managerFlag20!=='boolean')throw Error('Current navigation managerFlag20 producer unqualified');
  return {qualified:true,managerFlag20:context.managerFlag20,worldC:current.worldC,world8:current.world8,generation:current.generation};
 };
 const api={
  prepare(){
   if(phase==='prepared'){try{if(!active())throw Error('Current navigation world owner revoked');}catch(error){revoke(error.message);}return api.snapshot();}
   if(phase!=='idle')return api.snapshot();
   try{
    if(world?.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||!Array.isArray(world.nativeCollisionSources))throw Error('Actual loaded complete map46 source required');
    if(!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0)||!sync(readManagerContext)||mathProfile?.qualified!==true||typeof cacheStaticSegments!=='boolean')throw Error('Explicit generation, native manager producer, analytical math profile and boolean static-cache policy required');
    if(cacheStaticSegments&&(mathProfile!==CONQUEST_NAVIGATION_WORLD_MATH_PROFILE||!hasSealedConquestStaticSource(world,world.sourceData)))throw Error('Static segment cache requires privately sealed source and exact immutable navigation math profile');
    query=createNativeCollisionBoolQuery({arithmeticProfile:mathProfile,readCurrent});
    bundle=world.sourceData;const variant=bundle.variants?.find(row=>row.id===46);
    if(bundle.scenes?.length!==4||bundle.sources?.length!==4||variant?.scenes?.length!==4||variant.scenes.some(row=>row.section!=='STATIC')||!Array.isArray(bundle.nonStatic)||!bundle.nonStatic.length||bundle.nonStatic.some(row=>row.registeredModels!==0))throw Error('Complete STATIC4 and explicit zero non-STATIC source topology required');
    descriptors=world.nativeCollisionSources.map(descriptor=>({descriptor,source:descriptor.source,parentIndices:descriptor.parentIndices,requiredModelIndices:descriptor.requiredModelIndices,active:descriptor.active,readRecords:descriptor.readRecords}));
    if(descriptors.length!==4||descriptors.some(item=>!bundle.scenes.includes(item.source)||call(item.active)!==true))throw Error('Current exact four source scene descriptors required');
    const records=descriptors.flatMap(item=>{item.records=call(item.readRecords);return item.records;});if(records.length!==1601||records.some(row=>row.nativeCollision?.partition!=='world8'||row.nativeCollision.owner!=='main-static-root1A0'))throw Error('All1601 original map46 STATIC faces required');
    if(cacheStaticSegments&&!cacheOwnersCurrent())throw Error('Static segment cache requires current private immutable source face streams');
    const binding=hasSealedConquestStaticSource(world,world.sourceData)&&mathProfile===CONQUEST_NAVIGATION_WORLD_MATH_PROFILE?createConquestOwnedStaticGeometryBinding({world,revision,mathProfile,source:'Actual map46 STATIC4 E0 boolean source reconstruction with explicit JS numeric policy',emptyWorldEvidence:'All1601 original map46 STATIC registrations own world8; non-STATIC streams contain zero registered models'}):createConquestStaticGeometryBinding({world,sourceWorld:world,revision,mathProfile,factoryOwnerOrder:[],source:'Actual map46 STATIC4 E0 boolean source reconstruction with explicit JS numeric policy',
     readChildren:()=>({qualified:true,evidence:'Authenticated map46 non-STATIC streams all contain zero registered collision models; complete world90 topology',worldC:[],world8:[]}),emptyPartitionEvidence:{worldC:'All1601 original STATIC faces register to world8; non-STATIC streams have zero registered models'}});
    runtime=createConquestStaticRuntimeWorlds({binding});const current=runtime.read();if(current.qualified!==true||current.diagnostics.sourceTriangles!==1601)throw Error(current.detail??current.reason??'Complete source E0 reconstruction unavailable');
    cacheEnabled=cacheStaticSegments;phase='prepared';lastReason=null;
   }catch(error){phase='blocked';lastReason=error.message;runtime?.dispose();}
   return api.snapshot();
  },
  probeSegment(request){
   queryCount++;
   if(running)return refuse('Navigation segment provider reentered');running=true;
   try{
    if(phase!=='prepared')return refuse('Navigation world unprepared or revoked');
    try{if(!active())return revoke('Current navigation world owner revoked');}catch(error){return revoke(error.message);}
    // A065B0 pursuit uses4000BF; A14C20 nearest-visible graph selection
    // calls A165A0(true), adding bit40 (4000FF). Both reach the same
    // 7B57A0/virtual38 boolean tree; do not compile a second source world
    // or replace either mask with a closest-ray/attack query.
    if(![CONQUEST_PAWN_NAVIGATION_SEGMENT.queryMask,0x4000ff].includes(request?.queryMask)||request.rawQueryFlag!==true||request.coordinateSpace!=='native'||request.nativeEntry!==0x7b57a0||!xyz(request.from)||!xyz(request.to))return refuse('Exact Pawn7B57A0/mask4000BF or4000FF/flag1/native endpoints required');
    const input={mask:request.queryMask,rawQueryFlag:1,start:request.from,end:request.to};let result,key=null;
    if(cacheEnabled){
     if(!cacheOwnersCurrent())return revoke('Static segment source receipt revoked');
     // Match the original query's capture order: XYZ/flag/mask are retained
     // BEFORE the manager callback. A miss consumes its one staged snapshot;
     // the callback is never sampled twice and cannot reenter this provider.
     const capture=point=>{if(!xyz(point))throw Error('Finite native boolean-segment XYZ required');return point.map(Math.fround);};
     const canonical={mask:input.mask,rawQueryFlag:input.rawQueryFlag,start:capture(input.start),end:capture(input.end)},context=readCurrent(input);
     if(context?.qualified!==true||typeof context.managerFlag20!=='boolean')throw Error('Current navigation managerFlag20 producer unqualified');
     if(!active()||!cacheOwnersCurrent())return revoke('Static segment source revoked during manager read');
     if(cacheGeneration!==context.generation){segmentCache.clear();cacheGeneration=context.generation;}
     key=segmentKey(canonical,context);
     if(segmentCache.has(key)){const hit=segmentCache.get(key);segmentCache.delete(key);segmentCache.set(key,hit);cacheHits++;result={qualified:true,hit};}
     else{cacheMisses++;staged=context;computations++;try{result=query(canonical);}finally{staged=null;}}
    }else{computations++;result=query(input);}
    try{if(!active())return revoke('Navigation source owner revoked during query');}catch(error){return revoke(error.message);}
    if(result.qualified!==true||typeof result.hit!=='boolean')return refuse(result.reason??'Qualified source bool result required');
    if(cacheEnabled&&key!==null&&!segmentCache.has(key)){segmentCache.set(key,result.hit);if(segmentCache.size>cacheCapacity){segmentCache.delete(segmentCache.keys().next().value);cacheEvictions++;}}
    lastReason=null;lastResult=result;return {qualified:true,blocked:result.hit,queryMask:request.queryMask,nativeEntry:0x7b57a0,nativeReady:false,numericProfile:mathProfile.source};
   }catch(error){return refuse(error.message);}finally{running=false;staged=null;}
  },
  snapshot(){audit();
   return {phase,prepared:phase==='prepared',lastReason,queryCount,lastBlocked:lastResult?.hit??null,totalCompilations:runtime?.diagnostics().totalCompilations??0,sourceTriangles:runtime?.diagnostics().active?1601:null,staticSegments:{requested:cacheStaticSegments,enabled:cacheEnabled,capacity:cacheCapacity,entries:segmentCache.size,hits:cacheHits,misses:cacheMisses,computations,evictions:cacheEvictions},nativeReady:false,nativeTreeObserved:false,nativeConstructionArithmeticObserved:false,x87BitwiseParityVerified:false,numericProfile:mathProfile?.source??null,
    limits:['Analytical source tree/SRT reconstruction; native construction arithmetic and final tree order unobserved','Source bool flow retained with explicit JS53 x87 policy; boundary numeric parity not universal','Native managerFlag20 remains a current owner producer; graph/deque navigation not supplied']};},
  dispose(){if(phase==='disposed')return;phase='disposed';segmentCache.clear();cacheEnabled=false;staged=null;runtime?.dispose();lastResult=null;lastReason='Navigation world disposed';},
 };
 owners.set(api,{world,audit});return Object.freeze(api);
}
