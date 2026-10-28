import {nativeCategory400RayBroadphase} from './native-category400-ray.js';
import {nativeBooleanSegmentTriangleDistance} from './native-collision-bool-distance.js';
const f=Math.fround;
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error('Finite native boolean-segment XYZ required');return v.map(f);};
const uint=n=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw Error('Native uint32 boolean query mask required');return n;};
const byte=n=>{if(typeof n==='boolean')return Number(n);if(!Number.isInteger(n)||n<0||n>255)throw Error('Native raw query byte required');return n;};
const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
export const NATIVE_BOOL_QUERY_TYPES=Object.freeze({worldVtable:0x14a004c,worldTreeOffset:0xe0,worldVirtual1f4:0x11feef0,treeVtable:0x14aca50,treeVirtual38:0x1279310,rayVtable:0x149e5a0,rayType:5,boundsVtable:0x13f617c,boundsType:8,triangleVtable:0x149fe64,triangleType:7,boundsDispatch:0x126d650,triangleDispatch:0x126d610});

//126D650 produces the axis-aligned OBB then11B6F10 finite-segment SAT.
// The existing source SAT primitive is shared; the closest-ray dispatcher,
// nearest selection, raw14 filter and direction shortening are not used.
function boundsHit(bounds,origin,direction){
 const min=xyz(bounds?.min),max=xyz(bounds?.max);if(min.some((n,i)=>n>max[i]))throw Error('Ordered source boolean bounds required');
 const center=min.map((n,i)=>f(n+f(f(max[i]-n)*f(.5)))),extents=max.map((n,i)=>f((n-min[i])/2));
 return nativeCategory400RayBroadphase({origin,direction,shapeAc:{center,extents,axes:[[1,0,0],[0,1,0],[0,0,1]]}}).intersects;
}

//1279310 on the actual source-constructed E0 packet tree. All branch and
// record/triangle order is retained; stop on the first hit and do not shorten
// the segment. raw34 is compared EXACTLY with the incoming byte; raw14 is
// not consumed at all. This differs materially from tree.virtual50.
export function queryNativeCollisionBoolTree({tree,mask,rawQueryFlag,origin,direction,arithmeticProfile}={}){
 mask=uint(mask);const flag=byte(rawQueryFlag);origin=xyz(origin);direction=xyz(direction);
 const active=new Set();let nodes=0,triangles=0;
 function visit(node){
  if(!node||active.has(node)||++nodes>100000)throw Error('Bounded acyclic complete native bool tree required');active.add(node);
  try{
   if(!boundsHit(node.bounds,origin,direction))return false;
   if(typeof node.branch!=='boolean')throw Error('Explicit source raw30 branch required');
   if(node.branch){const children=node.children;if(!Array.isArray(children)||children.length!==8)throw Error('Eight ordered source bool children required');for(let i=0;i<8;i++)if(children[i]!==null&&visit(children[i]))return true;return false;}
   if(!Array.isArray(node.records))throw Error('Complete source leaf records required');
   for(const record of node.records){
    if((uint(record?.raw10)&mask)===0)continue;
    if(byte(record.raw34)!==flag)continue;
    if(record.qualified!==true||!Array.isArray(record.packets))throw Error('Complete original triangle packet stream required');
    for(const packet of record.packets){triangles++;const result=nativeBooleanSegmentTriangleDistance({origin,direction,packet,arithmeticProfile});if(result.qualified!==true)throw Error('Finite qualified source segment/triangle distance required');if(result.hit)return true;}
   }
   return false;
  }finally{active.delete(node);}
 }
 try{return {qualified:true,hit:tree===null?false:visit(tree),nodes,triangles,nativeReady:false,x87BitwiseParityVerified:false};}catch(error){return {...refuse(error.message),nodes,triangles};}
}

//11FEEF0: tree+E0.virtual38 first, then each live world90 child. A hit
// returns immediately, so unrelated later branches need not be readable.
export function queryNativeWorldBool({world,mask,rawQueryFlag,origin,direction,arithmeticProfile}={}){
 const active=new Set();let visited=0,treeNodes=0,triangles=0;
 function visit(current){
  if(current?.complete!==true||current.treesComplete!==true||!Object.hasOwn(current,'packetTree')||active.has(current)||++visited>10000)throw Error('Complete live source bool world required');active.add(current);
  try{
   const tree=queryNativeCollisionBoolTree({tree:current.packetTree,mask,rawQueryFlag,origin,direction,arithmeticProfile});treeNodes+=tree.nodes??0;triangles+=tree.triangles??0;
   if(tree.qualified!==true)throw Error(tree.reason);if(tree.hit)return true;
   const children=current.children;if(!Array.isArray(children))throw Error('Complete current world90 order required');for(let i=0;i<children.length;i++)if(visit(children[i]))return true;return false;
  }finally{active.delete(current);}
 }
 try{return {qualified:true,hit:visit(world),worlds:visited,treeNodes,triangles,nativeReady:false};}catch(error){return {...refuse(error.message),worlds:visited,treeNodes,triangles};}
}

//7B57A0 boolean manager. No closest hit point or inferred empty category.
export function createNativeCollisionBoolQuery({readCurrent,queryCategory400,arithmeticProfile}={}){
 if(typeof readCurrent!=='function'||typeof arithmeticProfile?.roundX87!=='function'||!arithmeticProfile.source?.trim())throw Error('Explicit current bool world reader and arithmetic profile required');
 let running=false;
 const call=(fn,...args)=>{if(typeof fn!=='function')throw Error('Native boolean producer unavailable');const value=fn(...args);if(value&&typeof value.then==='function')throw Error('Synchronous native boolean producer required');return value;};
 return input=>{
  if(running)return refuse('Native boolean query reentered');running=true;const calls=[];
  try{
   const mask=uint(input?.mask),rawQueryFlag=byte(input?.rawQueryFlag),origin=xyz(input?.start),end=xyz(input?.end),direction=end.map((n,i)=>f(n-origin[i]));
   const snapshot=call(readCurrent,input);if(snapshot?.qualified!==true||typeof snapshot.managerFlag20!=='boolean')throw Error('Current source manager/topology unqualified');
   const query=world=>queryNativeWorldBool({world,mask,rawQueryFlag,origin,direction,arithmeticProfile});
   calls.push('worldC');let result=query(snapshot.worldC);if(result.qualified!==true)throw Error(result.reason);if(result.hit)return {...result,calls};
   if(!snapshot.managerFlag20){calls.push('world8');result=query(snapshot.world8);if(result.qualified!==true)throw Error(result.reason);if(result.hit)return {...result,calls};}
   if(rawQueryFlag!==0&&(mask&0x400)!==0){
    const collection=snapshot.category400;if(collection?.complete!==true||!Array.isArray(collection.records))throw Error('Current category400 bool collection unqualified');
    for(let i=0;i<collection.records.length;i++){
     calls.push('category400['+i+']');const value=call(queryCategory400,collection.records[i],{origin,direction,rawQueryFlag});if(value?.qualified!==true||typeof value.hit!=='boolean')throw Error('Current category400 bool result unqualified');if(value.hit)return {...value,calls,nativeReady:false};
    }
   }
   return {qualified:true,hit:false,calls,nativeReady:false};
  }catch(error){return {...refuse(error.message),calls};}finally{running=false;}
 };
}
