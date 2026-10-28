//7B0F30/7B51D0 post-move overlap query. The operation owns in-place anchor
// conversions and lastSafe; this module owns only the complete query result.
import {nativeStaticHeightTree} from './native-static-tree-builder.js';
import {nativeCategory400IdentityExclusion} from './native-category400-contact.js';
const f=Math.fround,uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=p=>{if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');return p.map(f);};
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const sub=(a,b)=>a.map((n,i)=>f(n-b[i]));
const qFor=profile=>{if(typeof profile?.roundX87!=='function'||!profile.source?.trim())throw TypeError('Explicit x87 arithmetic profile required');return profile.roundX87;};
const box=value=>{const min=vector(value?.min),max=vector(value?.max);if(min.some((n,i)=>n>max[i]))throw TypeError('Ordered native bounds required');return {min,max};};
const overlaps=(a,b)=>[0,2,1].every(i=>a.min[i]<=b.max[i]&&b.min[i]<=a.max[i]);

//119C440: seven-region squared distance to packet(origin,edge1,edge2).
// Retain source float stores and x87 operation order; no degenerate epsilon,
// segment fallback or clamp-to-zero is added. Final result uses source ABS.
export function nativePointTriangleDistanceSquared({point,packet,arithmeticProfile}={}){
 const q=qFor(arithmeticProfile),origin=vector(packet?.origin),edge1=vector(packet?.edge1),edge2=vector(packet?.edge2);
 point=vector(point);const diff=sub(origin,point),a00=dot(edge1,edge1),a01=dot(edge1,edge2),a11=dot(edge2,edge2),b0=dot(diff,edge1),b1=dot(diff,edge2),c=dot(diff,diff);
 const determinant=f(Math.abs(q(q(a00*a11)-q(a01*a01))));
 let s=f(q(q(a01*b1)-q(a11*b0))),t=f(q(q(a01*b0)-q(a00*b1))),distance,region;
 const endpoint=(a,b)=>f(q(q(q(2*b)+a)+c));
 const quadratic=()=>f(q(q(q(q(q(q(a00*s)+q(a01*t))+q(2*b0))*s)+q(q(q(q(a01*s)+q(a11*t))+q(2*b1))*t))+c));
 function axis0(){t=0;if(b0>=0){s=0;distance=c;}else if(-b0>=a00){s=1;distance=endpoint(a00,b0);}else{s=f(q(-b0/a00));distance=f(q(q(b0*s)+c));}}
 function axis1(){s=0;if(b1>=0){t=0;distance=c;}else if(-b1>=a11){t=1;distance=endpoint(a11,b1);}else{t=f(q(-b1/a11));distance=f(q(q(b1*t)+c));}}
 if(q(s+t)<=determinant){
  if(s<0){if(t<0){region=4;if(b0<0)axis0();else axis1();}else{region=3;axis1();}}
  else if(t<0){region=5;axis0();}
  else{region=0;const inverse=f(q(1/determinant));s=f(q(s*inverse));t=f(q(t*inverse));distance=quadratic();}
 }else{
  if(s<0){
   region=2;const tmp0=f(q(a01+b0)),tmp1=f(q(a11+b1));
   if(tmp1>tmp0){const numerator=f(q(tmp1-tmp0)),denominator=f(q(q(a00-q(2*a01))+a11));
    if(numerator>=denominator){s=1;t=0;distance=endpoint(a00,b0);}else{s=f(q(numerator/denominator));t=f(q(1-s));distance=quadratic();}}
   else{s=0;if(tmp1<=0){t=1;distance=endpoint(a11,b1);}else if(b1>=0){t=0;distance=c;}else{t=f(q(-b1/a11));distance=f(q(q(b1*t)+c));}}
  }else if(t<0){
   region=6;const tmp0=f(q(a01+b1)),tmp1=f(q(a00+b0));
   if(tmp1>tmp0){const numerator=f(q(tmp1-tmp0)),denominator=f(q(q(a00-q(2*a01))+a11));
    if(numerator>=denominator){t=1;s=0;distance=endpoint(a11,b1);}else{t=f(q(numerator/denominator));s=f(q(1-t));distance=quadratic();}}
   else{t=0;if(tmp1<=0){s=1;distance=endpoint(a00,b0);}else if(b0>=0){s=0;distance=c;}else{s=f(q(-b0/a00));distance=f(q(q(b0*s)+c));}}
  }else{
   region=1;const numerator=f(q(q(q(a11+b1)-a01)-b0));
   if(numerator<=0){s=0;t=1;distance=endpoint(a11,b1);}
   else{const denominator=f(q(q(a00-q(2*a01))+a11));if(numerator>=denominator){s=1;t=0;distance=endpoint(a00,b0);}else{s=f(q(numerator/denominator));t=f(q(1-s));distance=quadratic();}}
  }
 }
 return {distanceSquared:distance<0?f(-distance):distance,s,t,region};
}

//127C1C0 divides EACH packet vector, rather than reconstructing B and C.
export function nativeStaticPacketOverlap({packet,center,radii,arithmeticProfile}={}){
 const q=qFor(arithmeticProfile);center=vector(center);radii=vector(radii);if(radii.some(n=>n<=0))throw TypeError('Positive native radii required');
 const normalized=Object.fromEntries(['origin','edge1','edge2'].map(key=>[key,vector(packet?.[key]).map((n,i)=>f(q(n/radii[i])))]));
 const result=nativePointTriangleDistanceSquared({point:center,packet:normalized,arithmeticProfile});
 return {...result,hit:1>result.distanceSquared}; // strict sphere radius² comparison
}
export const nativeStaticOverlapTree=nativeStaticHeightTree;
function stateFrom(history,categories){
 if(!Array.isArray(history)||history.length>200||history.some(row=>!uint(row.category)||!uint(row.ownerId))||!uint(categories))throw TypeError('Explicit native overlap accumulator required');
 return {history:history.map(row=>({...row})),count:history.length,accumulatedCategories:categories};
}
function append(state,category,ownerId,selected){
 state.accumulatedCategories=(state.accumulatedCategories|category)>>>0;
 if(state.count<200){state.history.push({category,ownerId});state.count++;}
 state.overlaps.push(selected);
}

export function queryNativePostMoveOverlap({center,radii,bounds,solverMask,overlapGlobalMask,managerFlag20,worldC,world8,category400,
 arithmeticProfile,initialHistory=[],initialCategories=0}={}){
 qFor(arithmeticProfile);center=vector(center);radii=vector(radii);bounds=box(bounds);
 if(radii.some(n=>n<=0)||!uint(solverMask)||!uint(overlapGlobalMask)||typeof managerFlag20!=='boolean')throw TypeError('Explicit overlap mask4214, solver mask, radii and manager flag required');
 const mask=(solverMask&overlapGlobalMask)>>>0,state={...stateFrom(initialHistory,initialCategories),overlaps:[]},calls=[];
 const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
 const active=new Set();let reason=null,visited=0;
 function tree(node,path='',worldLabel=''){
  if(node===null)return;if(!node||active.has(node)||++visited>100000){reason='tree-unqualified';return;}
  let nodeBounds;try{nodeBounds=box(node.bounds);}catch{reason='bounds-unqualified';return;}if(!overlaps(nodeBounds,bounds))return;
  active.add(node);
  if(node.branch===true){if(!Array.isArray(node.children)||node.children.length!==8)reason='children-unqualified';else for(let i=0;i<8;i++){tree(node.children[i],path+i,worldLabel);if(reason)break;}}
  else if(node.branch===false){
   if(!Array.isArray(node.records))reason='records-unqualified';
   else for(const record of node.records){
    if(!uint(record?.raw10)){reason='record-mask-unqualified';break;}if(!(record.raw10&mask))continue;
    const enabled=record.raw34;if(!(typeof enabled==='boolean'||Number.isInteger(enabled)&&enabled>=0&&enabled<=255)){reason='record-enable-unqualified';break;}if(!enabled)continue;
    if(record.qualified!==true||!uint(record.raw18)||!Array.isArray(record.packets)||!Array.isArray(record.triangleBounds)||record.packets.length!==record.triangleBounds.length){reason='record-geometry-unqualified';break;}
    for(let i=0;i<record.packets.length;i++){
     let triangleBounds;try{triangleBounds=box(record.triangleBounds[i]);}catch{reason='triangle-bounds-unqualified';break;}if(!overlaps(triangleBounds,bounds))continue;
     const result=nativeStaticPacketOverlap({packet:record.packets[i],center,radii,arithmeticProfile});
     if(result.hit)append(state,record.raw10,record.raw18,{world:worldLabel,path,triangleIndex:i,key:record.key,distanceSquared:result.distanceSquared});
    }if(reason)break;
   }
  }else reason='branch-unqualified';active.delete(node);
 }
 const worldActive=new Set();
 function world(value,label){
  if(value?.complete!==true||value.treeComplete!==true||!Object.hasOwn(value,'tree')||!Array.isArray(value.children)||worldActive.has(value)){reason='world-unqualified';return;}
  worldActive.add(value);calls.push(`${label}.tree`);tree(value.tree,'',label);
  if(!reason)for(let i=0;i<value.children.length;i++){world(value.children[i],`${label}.world90[${i}]`);if(reason)break;}
  worldActive.delete(value);
 }
 if(mask){
  world(worldC,'worldC');if(!reason&&!managerFlag20)world(world8,'world8');if(reason)return refuse(reason);
  if(mask&0x400){
   if(category400?.complete!==true||!Array.isArray(category400.records))return refuse('category400-unqualified');
   if(category400.records.length){
    if(category400.excludedIdsComplete!==true||!Array.isArray(category400.excludedIds)||category400.excludedIds.some(id=>!uint(id)))return refuse('category400-filter-unqualified');
    for(const [index,record]of category400.records.entries()){
     if(!uint(record?.id08)||record.id08>0xffff)return refuse('category400-id-unqualified');if(category400.excludedIds.includes(record.id08))continue;
     if(!uint(record.state1C))return refuse('category400-state-unqualified');if(record.state1C!==1)continue;
     if(typeof record.flagB4!=='boolean')return refuse('category400-identity-unqualified');
     if(record.flagB4){const identity=record.identityState?nativeCategory400IdentityExclusion({...record.identityState,flagB4:true}):{qualified:typeof record.selfExcluded==='boolean',excluded:record.selfExcluded};if(!identity.qualified)return refuse('category400-identity-unqualified');if(identity.excluded)continue;}
     if(record.boundsQualified!==true&&record.qualified!==true)return refuse('category400-bounds-unqualified');
     if(!overlaps(box(record.boundsA8),bounds))continue;
     if(record.qualified!==true||!Array.isArray(record.verticesB0))return refuse('category400-geometry-unqualified');
     for(let i=0;i<Math.floor(record.verticesB0.length/3);i++){
      const points=record.verticesB0.slice(i*3,i*3+3).map(vector).map(p=>p.map((n,axis)=>f(n/radii[axis])));
      const result=nativePointTriangleDistanceSquared({point:center,packet:{origin:points[0],edge1:sub(points[1],points[0]),edge2:sub(points[2],points[0])},arithmeticProfile});
      if(result.distanceSquared<1)append(state,0x400,record.id08,{world:'category400',recordIndex:index,triangleIndex:i,distanceSquared:result.distanceSquared});
     }
    }
   }calls.push('category400');
  }
 }
 return {qualified:true,hit:state.count!==0,...state,effectiveMask:mask,calls,nativeReady:false,nativeOverlapExecuted:false};
}
