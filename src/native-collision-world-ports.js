// Current-world adapters for the source contact, lower-support and overlap
// consumers. No map names, guessed empty lists or shared-tree substitutions.
import {queryNativeStaticHeight} from './native-static-height-query.js';
import {nativePrioritizedSupportHeight} from './native-lower-support.js';
import {queryNativeCompleteContact} from './native-special-contact-query.js';
import {nativeCategory400QueryDescriptor,nativeCategory400IdentityExclusion} from './native-category400-contact.js';
import {queryNativePostMoveOverlap} from './native-post-move-query.js';
import {intersectS5RuntimeShieldTriangle} from './s5runtime-skill-shield-triangle.js';
import {createNativeCollisionRayPorts} from './native-collision-ray-ports.js';
const f=Math.fround,uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
const xyz=p=>{if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit native float32 XYZ required');return p.map(f);};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,args)=>{const value=fn(args);if(value&&typeof value.then==='function')throw TypeError('Synchronous current-world reader required');return value;};

// A world descriptor owns BOTH source views. contactTree retains original
// vertices; packetTree retains the rounded A/edge packets and original bounds.
// compileNativeCollisionSourceTree already produces these two views. children
// is the CURRENT complete world+90 order, explicitly [] when proven empty.
export function nativeCollisionWorldDescriptor({compiled,children,complete}={}){
 if(complete!==true||!Array.isArray(children)||!compiled||!Object.hasOwn(compiled,'contactTree')||!Object.hasOwn(compiled,'packetTree'))throw TypeError('Complete source views and explicit current world90 children required');
 return {complete:true,treesComplete:true,contactTree:compiled.contactTree,packetTree:compiled.packetTree,children};
}

function worldView(world,kind){
 const active=new Set();let visited=0;
 function convert(value){
  if(value?.complete!==true||value.treesComplete!==true||!Array.isArray(value.children)||!Object.hasOwn(value,kind)||active.has(value)||++visited>10000)return null;
  active.add(value);const children=[];
  for(const child of value.children){const converted=convert(child);if(converted===null){active.delete(value);return null;}children.push(converted);}
  active.delete(value);return {complete:true,treeComplete:true,tree:value[kind],children};
 }
 return convert(world);
}

// 11FF0A0 owns a NEW -100000 local in every recursive child. A hit child
// writes that local even if its height is below an earlier tree/child hit.
// Therefore this is deliberately not a max reduction over flattened worlds.
export function queryNativeWorldHeight({position,mask,world}={}){
 position=xyz(position);if(!uint(mask))throw TypeError('Explicit uint32 support mask required');
 const active=new Set(),calls=[];let visited=0;
 function query(value,label){
  if(value?.complete!==true||value.treesComplete!==true||!Object.hasOwn(value,'packetTree')||!Array.isArray(value.children)||active.has(value)||++visited>10000)return refuse(`${label}-world-unqualified`);
  active.add(value);let height=f(-100000),hit=false;calls.push(`${label}.tree`);
  const tree=queryNativeStaticHeight({position,mask,tree:value.packetTree,complete:true,initialHeight:height});
  if(tree.qualified!==true){active.delete(value);return refuse(`${label}:${tree.reason}`);}
  if(tree.hit){hit=true;height=f(tree.height);}
  for(let index=0;index<value.children.length;index++){
   const child=query(value.children[index],`${label}.world90[${index}]`);
   if(child.qualified!==true){active.delete(value);return child;}
   if(child.hit){hit=true;height=f(child.height);}
  }
  active.delete(value);return {qualified:true,hit,height};
 }
 const result=query(world,'world');return {...result,calls,nativeReady:false,nativeHeightExecuted:false,x87BitwiseParityVerified:false};
}

// 7B5C30 -> F69D30. Unlike contact/post-move, this manager path iterates
// list+10 directly: it does NOT apply the contact manager's excludedIds list.
// F69D30 only raises its caller's height; its bounds gate ignores maxY.
export function queryNativeCategory400Height({collection,position,initialHeight}={}){
 position=xyz(position);if(!Number.isFinite(initialHeight)||!Number.isFinite(f(initialHeight)))throw TypeError('Explicit initial height required');
 if(collection?.complete!==true||!Array.isArray(collection.records))return refuse('category400-list-unqualified');
 let height=f(initialHeight),hit=false,selected=null;
 for(const [recordIndex,record]of collection.records.entries()){
  if(!uint(record?.state1C))return refuse('category400-state-unqualified');if(record.state1C!==1)continue;
  if(typeof record.flagB4!=='boolean')return refuse('category400-identity-unqualified');
  if(record.flagB4){
   const identity=record.identityState?nativeCategory400IdentityExclusion({...record.identityState,flagB4:true}):{qualified:typeof record.selfExcluded==='boolean',excluded:record.selfExcluded};
   if(identity.qualified!==true)return refuse('category400-identity-unqualified');if(identity.excluded)continue;
  }
  if(record.boundsQualified!==true&&record.qualified!==true)return refuse('category400-bounds-unqualified');
  const min=xyz(record.boundsA8?.min),max=xyz(record.boundsA8?.max);if(min.some((n,i)=>n>max[i]))return refuse('category400-bounds-unqualified');
  if(position[0]<min[0]||max[0]<position[0]||position[2]<min[2]||max[2]<position[2]||position[1]<min[1])continue;
  if(record.qualified!==true||!Array.isArray(record.verticesB0))return refuse('category400-geometry-unqualified');
  for(let triangleIndex=0;triangleIndex<Math.floor(record.verticesB0.length/3);triangleIndex++){
   const result=intersectS5RuntimeShieldTriangle({from:position,direction:[0,-1,0],triangle:record.verticesB0.slice(triangleIndex*3,triangleIndex*3+3)});
   if(result.hit&&result.point[1]>height){height=f(result.point[1]);hit=true;selected={recordIndex,triangleIndex,point:result.point};}
  }
 }
 return {qualified:true,hit,height,selected,nativeReady:false,nativeHeightExecuted:false,x87BitwiseParityVerified:false};
}

// readCurrent(kind,input) supplies CURRENT topology/collections and properties.
// One read per query prevents the contact branches seeing different collection
// snapshots. Getter-backed record enables are intentionally retained. The host
// owns snapshot coherence/lifecycle: these ports do not read native memory.
export function createNativeCollisionWorldPorts({readCurrent,arithmeticProfile}={}){
 if(!sync(readCurrent)||typeof arithmeticProfile?.roundX87!=='function'||!arithmeticProfile.source?.trim())throw TypeError('Synchronous current-world reader and explicit arithmetic profile required');
 function current(kind,input){
  const value=call(args=>readCurrent(kind,args),input);
  return value?.qualified===true&&typeof value.managerFlag20==='boolean'?value:null;
 }
 function ordinaryWorlds(snapshot,mask,kind){
  if(!mask)return {worldC:undefined,world8:undefined};
  const worldC=worldView(snapshot.worldC,kind);if(worldC===null)return null;
  const world8=snapshot.managerFlag20?undefined:worldView(snapshot.world8,kind);
  return !snapshot.managerFlag20&&world8===null?null:{worldC,world8};
 }
 const queryRay=createNativeCollisionRayPorts({readCurrent:input=>current('ray',input)});
 return {
  queryRay,
  queryContact(input){
   const snapshot=current('contact',input);if(snapshot===null)return refuse('current-world-unqualified');
   if(!uint(input.solverMask)||!uint(input.globalMask))throw TypeError('Explicit solver and swept global masks required');
   const mask=(input.solverMask&input.globalMask)>>>0,worlds=ordinaryWorlds(snapshot,mask,'contactTree');
   if(worlds===null)return refuse('current-contact-world-unqualified');
   return queryNativeCompleteContact({...input,...worlds,managerFlag20:snapshot.managerFlag20,arithmeticProfile,
    float47:snapshot.float47,float33:snapshot.float33,float48:snapshot.float48,integer3:snapshot.integer3,
    sourceSolverId:snapshot.sourceSolverId,actorCollections:snapshot.actorCollections,readActorCollection:undefined,
    category400:nativeCategory400QueryDescriptor({collection:snapshot.category400,float64:snapshot.float64})});
  },
  queryLowerSupport(input){
   const snapshot=current('height',input);if(snapshot===null)return refuse('current-world-unqualified');
   const collection=snapshot.category400;
   const category400=collection?.complete===true&&Array.isArray(collection.records)?{complete:true,queries:collection.records.length?[args=>queryNativeCategory400Height({...args,collection})]:[]}:undefined;
   return nativePrioritizedSupportHeight({...input,managerFlag20:snapshot.managerFlag20,
    worldC:{complete:true,query:args=>queryNativeWorldHeight({...args,world:snapshot.worldC})},
    world8:{complete:true,query:args=>queryNativeWorldHeight({...args,world:snapshot.world8})},category400});
  },
  queryAdjustedPosition(input){
   const snapshot=current('overlap',input);if(snapshot===null)return refuse('current-world-unqualified');
   if(!uint(snapshot.solverMask)||!uint(snapshot.overlapGlobalMask)||!uint(input.mask))return refuse('current-overlap-mask-unqualified');
   const mask=(snapshot.solverMask&snapshot.overlapGlobalMask)>>>0;
   if(mask!==input.mask)return refuse('current-overlap-mask-mismatch');
   const worlds=ordinaryWorlds(snapshot,mask,'packetTree');if(worlds===null)return refuse('current-overlap-world-unqualified');
   return queryNativePostMoveOverlap({center:input.centerNormalized,radii:input.radii,bounds:input.bounds,
    solverMask:snapshot.solverMask,overlapGlobalMask:snapshot.overlapGlobalMask,managerFlag20:snapshot.managerFlag20,
    ...worlds,category400:snapshot.category400,arithmeticProfile,initialHistory:[],initialCategories:0});
  },
  qualification:{currentWorldPortsOnly:true,defaultRuntimeActivated:false,nativeReady:false,nativeMovementCompared:false}
 };
}
