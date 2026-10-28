// F67F60 category400 consumer. This path has its own SSE triangle arithmetic,
// Float registry ID64 discriminant multiplier and current identity gates.
import {nativeContactPointInside} from './native-static-contact-query.js';
const f=Math.fround,uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=p=>{if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');return p.map(f);};
const sub=(a,b)=>a.map((n,i)=>f(n-b[i])),add=(a,b)=>a.map((n,i)=>f(n+b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
const length=a=>f(Math.sqrt(dot(a,a))),normalize=a=>{const n=length(a);return n===0?a.slice():a.map(v=>f(v*f(1/n)));};
const overlaps=(a,b)=>[0,2,1].every(i=>a.min[i]<=b.max[i]&&b.min[i]<=a.max[i]);
const sseProfile={roundX87:f,source:'F6B6B0 SSE arithmetic; every multiply/add/sub stores f32'};

// Raw values returned by the qualified identity reader, not account/name
// heuristics. Unknown fields are irrelevant only when an earlier gate rejects.
export function nativeCategory400IdentityExclusion({flagB4,objectIdentity,localIdentity,controlledActorId,localActorId}={}){
 if(typeof flagB4!=='boolean')return {qualified:false,reason:'flagB4-unqualified'};
 if(!flagB4)return {qualified:true,excluded:false};
 const pair=value=>Array.isArray(value)&&value.length===2&&value.every(uint);
 if(!pair(objectIdentity)||!pair(localIdentity))return {qualified:false,reason:'identity-pair-unqualified'};
 if(objectIdentity.some((n,i)=>n!==localIdentity[i]))return {qualified:true,excluded:false};
 const id=value=>uint(value)||typeof value==='string'&&value.length>0;
 if(!id(controlledActorId)||!id(localActorId))return {qualified:false,reason:'controlled-actor-unqualified'};
 return {qualified:true,excluded:controlledActorId===0||controlledActorId==='0x0'||controlledActorId===localActorId};
}

export function nativeCategory400LowestRoot(a,b,c,limit,float64){
 if(!Number.isFinite(float64)||!Number.isFinite(f(float64)))throw TypeError('Explicit Float registry ID64 required');
 a=f(a);b=f(b);c=f(c);limit=f(limit);
 const determinant=f(f(b*b)-f(f(f(float64)*a)*c));if(determinant<0)return null;
 const root=f(Math.sqrt(determinant));let first=f(f(-b-root)/f(2*a)),second=f(f(-b+root)/f(2*a));
 if(first>second)[first,second]=[second,first];
 if(first>0&&first<limit)return first;if(second>0&&second<limit)return second;return null;
}

export function nativeCategory400TriangleContact({triangle,origin,displacement,radii,float64}={}){
 origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
 if(radii.some(n=>n<=0)||!Array.isArray(triangle)||triangle.length!==3)throw TypeError('Positive radii and original category400 triangle required');
 if(!Number.isFinite(float64)||!Number.isFinite(f(float64)))throw TypeError('Explicit Float registry ID64 required');
 const vertices=triangle.map(vector).map(p=>p.map((n,i)=>f(n/radii[i])));
 let normal=normalize(cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0])));
 let distance=f(dot(normal,origin)-dot(normal,vertices[0]));
 if(distance<0){normal=normal.map(n=>f(-n));distance=f(-distance);}
 let time=1,point=null,feature=null;
 if(Math.abs(distance)>=1){
  const denominator=dot(normal,displacement);let begin=f(f(-1-distance)/denominator),end=f(f(1-distance)/denominator);
  if(begin>end)[begin,end]=[end,begin];if(begin>1||end<0)return {hit:false};
  if(begin<0)begin=0;if(end<0)end=0;if(begin>1)begin=1;if(end>1)end=1;
  const candidate=add(sub(origin,normal),displacement.map(n=>f(n*begin)));
  if(candidate.every(Number.isFinite)&&nativeContactPointInside(candidate,vertices,sseProfile)){time=begin;point=candidate;feature={kind:'face'};}
 }
 if(point===null){
  const travelSquared=dot(displacement,displacement);
  for(let index=0;index<3;index++){
   const b=f(2*dot(displacement,sub(origin,vertices[index]))),offset=sub(vertices[index],origin),c=f(dot(offset,offset)-1);
   const root=nativeCategory400LowestRoot(travelSquared,b,c,time,float64);
   if(root!==null){time=root;point=vertices[index].slice();feature={kind:'vertex',index};}
  }
  for(let index=0;index<3;index++){
   const edge=sub(vertices[(index+1)%3],vertices[index]),offset=sub(vertices[index],origin);
   const edgeSquared=dot(edge,edge),edgeTravel=dot(edge,displacement),edgeOffset=dot(edge,offset);
   const a=f(f(-travelSquared*edgeSquared)+f(edgeTravel*edgeTravel));
   const b=f(f(f(2*dot(displacement,offset))*edgeSquared)-f(f(2*edgeTravel)*edgeOffset));
   const c=f(f(f(1-dot(offset,offset))*edgeSquared)+f(edgeOffset*edgeOffset));
   const root=nativeCategory400LowestRoot(a,b,c,time,float64);if(root===null)continue;
   const fraction=f(f(f(edgeTravel*root)-edgeOffset)/edgeSquared);
   if(fraction>=0&&fraction<=1){time=root;point=add(vertices[index],edge.map(n=>f(n*fraction)));feature={kind:'edge',index,fraction};}
  }
 }
 return point===null?{hit:false}:{hit:true,time,distance:f(time*length(displacement)),point,normal,feature};
}

export function queryNativeCategory400Contact({collection,origin,displacement,radii,bounds,initialContact,float64}={}){
 const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
 if(collection?.complete!==true||!Array.isArray(collection.records))return refuse('category400-list-unqualified');
 if(initialContact?.qualified!==true||!Array.isArray(initialContact.history)||initialContact.history.length>200||!uint(initialContact.accumulatedHitCategories))throw TypeError('Qualified initial contact accumulator required');
 const state={...initialContact,history:initialContact.history.map(row=>({...row}))};
 if(!collection.records.length)return {...state,qualified:true,nativeReady:false};
 if(collection.excludedIdsComplete!==true||!Array.isArray(collection.excludedIds)||collection.excludedIds.some(id=>!uint(id)))return refuse('category400-manager-filter-unqualified');
 for(const [recordIndex,record]of collection.records.entries()){
  if(!uint(record?.id08)||record.id08>0xffff)return refuse('category400-id-unqualified');
  if(collection.excludedIds.includes(record.id08))continue;
  if(!uint(record.state1C))return refuse('category400-state-unqualified');if(record.state1C!==1)continue;
  if(typeof record.flagB4!=='boolean')return refuse('category400-identity-unqualified');
  if(record.flagB4){
   const identity=record.identityState?nativeCategory400IdentityExclusion({...record.identityState,flagB4:true}):{qualified:typeof record.selfExcluded==='boolean',excluded:record.selfExcluded};
   if(identity.qualified!==true)return refuse('category400-identity-unqualified');if(identity.excluded)continue;
  }
  if(record.boundsQualified!==true&&record.qualified!==true)return refuse('category400-bounds-unqualified');
  const min=vector(record.boundsA8?.min),max=vector(record.boundsA8?.max);if(min.some((n,i)=>n>max[i]))return refuse('category400-bounds-unqualified');
  if(!overlaps({min,max},bounds))continue;
  if(record.qualified!==true||!Array.isArray(record.verticesB0))return refuse('category400-geometry-unqualified');
  // Native floors vertexCount/3; trailing vertices are not a new triangle.
  for(let i=0;i<Math.floor(record.verticesB0.length/3);i++){
   const hit=nativeCategory400TriangleContact({triangle:record.verticesB0.slice(i*3,i*3+3),origin,displacement,radii,float64});
   if(!hit.hit||state.hit&&state.distance<=hit.distance)continue;
   Object.assign(state,{hit:true,distance:hit.distance,point:hit.point,normal:hit.normal,hitRecordCategory:0x400,
    selected:{kind:'category400',recordIndex,triangleIndex:i,raw18:record.id08,feature:hit.feature}});
   state.accumulatedHitCategories=(state.accumulatedHitCategories|0x400)>>>0;
   if(state.history.length<200){state.history.push({category:0x400,ownerId:record.id08});state.activeTableCategory=0x400;}
  }
 }
 return {...state,qualified:true,nativeReady:false,nativeMovementCompared:false};
}

// Adapter to the existing ordinary manager's explicit consumer contract. A
// reader can supply current records/identity/enabled state for each operation.
export function nativeCategory400QueryDescriptor({readCollection,collection,float64}={}){
 return {complete:true,queries:[args=>queryNativeCategory400Contact({...args,float64,collection:typeof readCollection==='function'?readCollection():collection})]};
}
