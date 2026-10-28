//1278620 first ordinary ellipsoid contact, through11FEC60/7B5030.
// Geometry and arithmetic contracts are explicit. This is not Controller or a
// complete solver: actor/special sweeps and the response policy remain separate.
import {assertNativeStaticContactPreparation,prepareNativeStaticContactBounds,prepareNativeStaticContactVertices,bindNativeStaticContactPreparation,nativeStaticContactPreparedQuery} from './native-static-contact-prepared.js';
const f=Math.fround;
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=p=>{
 if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');
 return p.map(f);
};
const sub=(a,b)=>a.map((n,i)=>f(n-b[i]));
const add=(a,b)=>a.map((n,i)=>f(n+b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
const length=a=>f(Math.sqrt(dot(a,a)));
const normalize=a=>{const n=length(a);return n===0?a.slice():a.map(x=>f(x*f(1/n)));};
const bitsView=new DataView(new ArrayBuffer(4));
const bits=n=>{bitsView.setFloat32(0,n,true);return bitsView.getUint32(0,true);};
function arithmetic(profile){
 if(!profile||typeof profile.roundX87!=='function'||typeof profile.source!=='string'||!profile.source.trim())throw TypeError('Explicit x87 arithmetic callback and source required');
 return profile.roundX87;
}

//127B0E0 uses the SIGN BITS of the three barycentric expressions. It is not
// the angle-sum ray kernel and does not add an edge tolerance or slope cutoff.
export function nativeContactPointInside(point,triangle,profile){
 const q=arithmetic(profile),[a,b,c]=triangle.map(vector),p=vector(point);
 const e0=sub(b,a),e1=sub(c,a),rel=sub(p,a),a00=dot(e0,e0),a01=dot(e0,e1),a11=dot(e1,e1),b0=dot(rel,e0),b1=dot(rel,e1);
 const determinant=f(q(q(a00*a11)-q(a01*a01)));
 const u=f(q(q(b0*a11)-q(b1*a01))),v=f(q(q(b1*a00)-q(b0*a01))),w=f(q(q(u+v)-determinant));
 return !!((~(bits(u)|bits(v)))&bits(w)&0x80000000);
}

//127B1D0: f32 discriminant/sqrt/roots; roots must be strictly >0 and <limit.
export function nativeContactLowestRoot(a,b,c,limit,profile){
 const q=arithmetic(profile);a=f(a);b=f(b);c=f(c);limit=f(limit);
 const determinant=f(q(q(b*b)-q(q(4*a)*c)));
 if(determinant<0)return null;
 const root=f(q(Math.sqrt(determinant)));
 let first=f(q(q(-b-root)/q(2*a))),second=f(q(q(-b+root)/q(2*a)));
 if(first>second)[first,second]=[second,first];
 if(first>0&&first<limit)return first;
 if(second>0&&second<limit)return second;
 return null;
}

// Inputs are the original record+0 triangle vertices, not reconstructed packets.
// Origin and delta are already in ellipsoid-normalized coordinates; radii are
// the explicit scale from those coordinates to the geometry's native units.
export function nativeStaticTriangleContact({triangle,origin,displacement,radii,arithmeticProfile}={}){
 const q=arithmetic(arithmeticProfile);origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
 if(radii.some(n=>n<=0)||!Array.isArray(triangle)||triangle.length!==3)throw TypeError('Positive native radii and original triangle required');
 const vertices=triangle.map(vector).map(p=>p.map((n,i)=>f(n/radii[i])));
 const travelLength=length(displacement),direction=normalize(displacement),travel=direction.map(n=>f(q(n*travelLength)));
 let normal=normalize(cross(sub(vertices[0],vertices[1]),sub(vertices[0],vertices[2])));
 let planeConstant=f(-dot(normal,vertices[0])),signedDistance=f(q(dot(normal,origin)+planeConstant));
 if(signedDistance<0){planeConstant=f(-planeConstant);signedDistance=f(-signedDistance);normal=normal.map(n=>f(-n));}
 let time=f(1),point=null,feature=null;
 if(Math.abs(signedDistance)>=1){
  const denominator=dot(normal,travel);
  let begin=f(q(q(-1-signedDistance)/denominator)),end=f(q(q(1-signedDistance)/denominator));
  if(begin>end)[begin,end]=[end,begin];
  if(begin>1||end<0)return {hit:false};
  if(begin<0)begin=0;if(end<0)end=0;if(begin>1)begin=1;if(end>1)end=1;
  const candidate=add(sub(origin,normal),travel.map(n=>f(q(n*begin))));
  // Preserve the slab's signed-zero/Infinity comparisons: a parallel touching
  // face can clamp -Infinity to0 while its other bound is NaN. A nonfinite
  // candidate itself cannot pass the native barycentric sign-bit expression.
  if(candidate.every(Number.isFinite)&&nativeContactPointInside(candidate,vertices,arithmeticProfile)){
   time=begin;point=candidate;feature={kind:'face'};
  }
 }
 if(point===null){
  const travelSquared=f(q(travelLength*travelLength));
  for(let index=0;index<3;index++){
   const b=f(q(dot(travel,sub(origin,vertices[index]))*2));
   const offset=sub(vertices[index],origin),c=f(q(dot(offset,offset)-1));
   const root=nativeContactLowestRoot(travelSquared,b,c,time,arithmeticProfile);
   if(root!==null){time=root;point=vertices[index].slice();feature={kind:'vertex',index};}
  }
  for(let index=0;index<3;index++){
   const edge=sub(vertices[(index+1)%3],vertices[index]),offset=sub(vertices[index],origin);
   const edgeSquared=dot(edge,edge),edgeTravel=dot(edge,travel),edgeOffset=dot(edge,offset);
   const a=f(q(q(-travelSquared*edgeSquared)+q(edgeTravel*edgeTravel)));
   const b=f(q(q(q(dot(travel,offset)*2)*edgeSquared)-q(q(edgeTravel*2)*edgeOffset)));
   const c=f(q(q(q(1-dot(offset,offset))*edgeSquared)+q(edgeOffset*edgeOffset)));
   const root=nativeContactLowestRoot(a,b,c,time,arithmeticProfile);
   if(root===null)continue;
   const edgeFraction=f(q(q(q(edgeTravel*root)-edgeOffset)/edgeSquared));
   if(edgeFraction>=0&&edgeFraction<=1){
    time=root;point=add(vertices[index],edge.map(n=>f(q(n*edgeFraction))));feature={kind:'edge',index,fraction:edgeFraction};
   }
  }
 }
 return point===null?{hit:false}:{hit:true,time,distance:f(q(time*travelLength)),point,normal,feature};
}

export function nativeStaticSweepBounds({origin,displacement,radii,float47}={}){
 origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
 if(radii.some(n=>n<=0)||!Number.isFinite(float47)||!Number.isFinite(f(float47))||float47<0)throw TypeError('Positive native radii and explicit Float47 required');
 const start=origin.map((n,i)=>f(n*radii[i])),end=add(origin,displacement).map((n,i)=>f(n*radii[i])),margin=f(float47);
 return {min:start.map((n,i)=>f(Math.min(f(n-radii[i]),f(end[i]-radii[i]))-margin)),
  max:start.map((n,i)=>f(Math.max(f(n+radii[i]),f(end[i]+radii[i]))+margin))};
}

// Only this factory authenticates a key-only callback; ordinary readers retain
// their fresh metadata object and sources array on every raw34 read.
const keyedEnableReaders=new WeakMap();
export function createNativeStaticContactKeyedEnableReader(readKey){
 if(typeof readKey!=='function')throw TypeError('Current key-only enable reader required');
 const readEnabled=metadata=>readKey(metadata.key);
 keyedEnableReaders.set(readEnabled,readKey);return readEnabled;
}

// Preserve original vertices and current enable ownership for the contact path.
export function nativeStaticContactTree(finalTree,{geometryQualified=false,readEnabled,contactPreparation}={}){
 if(!finalTree||typeof geometryQualified!=='boolean'||typeof readEnabled!=='function')throw TypeError('Processed source geometry and current enable reader required');
 if(contactPreparation!==undefined)assertNativeStaticContactPreparation(contactPreparation);
 const readKey=keyedEnableReaders.get(readEnabled);
 function convert(node,path=''){
  if(!node)return null;if(node.valid!==true)throw TypeError('Unprocessed/invalid source tree');
  return {bounds:contactPreparation===undefined?node.bounds:prepareNativeStaticContactBounds(contactPreparation,node.bounds),branch:node.level!==0,children:node.children.map((child,i)=>convert(child,path+i)),
   records:node.records.map(record=>{
    const value={key:record.key,qualified:geometryQualified,raw10:record.raw10,raw18:record.raw18,raw14:record.raw14,
     vertices:contactPreparation===undefined?record.vertices:prepareNativeStaticContactVertices(contactPreparation,record.vertices),triangleCount:record.packets.length};
    Object.defineProperty(value,'raw34',{get:readKey?()=>readKey(record.key):()=>readEnabled({path,fullPath:node.fullPath,key:record.key,raw10:record.raw10,raw18:record.raw18,
     source:record.source,sources:record.sources.slice()}),enumerable:true});return value;
   })};
 }
 const result=convert(finalTree);if(contactPreparation!==undefined)bindNativeStaticContactPreparation(result,contactPreparation);return result;
}

const validEnabled=value=>typeof value==='boolean'||Number.isInteger(value)&&value>=0&&value<=255;
// Preserve native axis/read/short-circuit order without a per-node array/callback.
const overlaps=(a,b)=>a.min[0]<=b.max[0]&&b.min[0]<=a.max[0]&&a.min[2]<=b.max[2]&&b.min[2]<=a.max[2]&&a.min[1]<=b.max[1]&&b.min[1]<=a.max[1];
function checkedBounds(bounds){
 const min=vector(bounds?.min),max=vector(bounds?.max);if(min.some((n,i)=>n>max[i]))throw TypeError('Ordered native bounds required');return {min,max};
}
const emptyState=({history=[],accumulatedHitCategories=0}={})=>{
 if(!Array.isArray(history)||history.length>200||history.some(row=>!uint(row.category)||!uint(row.ownerId))||!uint(accumulatedHitCategories))throw TypeError('Explicit native category/ID history required');
 return {hit:false,distance:-1,point:null,normal:null,history:history.map(row=>({...row})),accumulatedHitCategories,
  activeTableCategory:history.at(-1)?.category??null,hitRecordCategory:null,selected:null};
};
function contactState(input){
 if(input===undefined)return emptyState();
 if(input?.qualified!==true||typeof input.hit!=='boolean')throw TypeError('Qualified previous contact accumulator required');
 const state=emptyState(input);
 if(input.hit){
  if(!Number.isFinite(input.distance)||input.distance<0||!uint(input.hitRecordCategory)||!uint(input.activeTableCategory))throw TypeError('Explicit previous native hit fields required');
  Object.assign(state,{hit:true,distance:input.distance,point:vector(input.point),normal:vector(input.normal),
   hitRecordCategory:input.hitRecordCategory,activeTableCategory:input.activeTableCategory,selected:input.selected});
 }
 return state;
}
function accept(state,hit,record,location){
 if(!hit.hit||state.hit&&state.distance<=hit.distance)return;
 state.hit=true;state.distance=hit.distance;state.point=hit.point.slice();state.normal=hit.normal.slice();state.hitRecordCategory=record.raw10;
 state.accumulatedHitCategories=(state.accumulatedHitCategories|record.raw10)>>>0;
 state.selected={key:record.key,raw10:record.raw10,raw18:record.raw18,...location,feature:hit.feature};
 if(state.history.length<200){state.history.push({category:record.raw10,ownerId:record.raw18});state.activeTableCategory=record.raw10;}
}

// Static tree query only; world90 and category400 are composed separately below.
export function queryNativeStaticContact({origin,displacement,radii,bounds,mask,tree,complete,arithmeticProfile,initialHistory=[],initialCategories=0,initialContact}={}){
 arithmetic(arithmeticProfile);origin=vector(origin);displacement=vector(displacement);radii=vector(radii);bounds=checkedBounds(bounds);
 if(!uint(mask)||radii.some(n=>n<=0))throw TypeError('Explicit effective mask and positive radii required');
 const state=initialContact===undefined?emptyState({history:initialHistory,accumulatedHitCategories:initialCategories}):contactState(initialContact);
 const incomplete=reason=>({qualified:false,hit:false,reason,nativeReady:false});
 if(complete!==true)return incomplete('tree-unqualified');
 // A complete null root has no nodes or prepared owner. All input/state
 // validations above remain mandatory before returning the same accumulator.
 if(tree===null)return {qualified:true,...state,nativeReady:false,nativeMovementCompared:false};
 const active=new Set(),preparedQuery=nativeStaticContactPreparedQuery(tree,arithmeticProfile,{origin,displacement,radii});let visited=0,reason=null;
 function visit(node,path=''){
  if(node===null)return;
  if(!node||active.has(node)||++visited>100000){reason='invalid-tree';return;}
  let box;try{box=preparedQuery?.bounds(node.bounds)??checkedBounds(node.bounds);}catch{reason='node-bounds-unqualified';return;}
  if(!overlaps(box,bounds))return;
  active.add(node);
  if(node.branch===true){
   if(!Array.isArray(node.children)||node.children.length!==8)reason='children-unqualified';
   else for(let i=0;i<8;i++){visit(node.children[i],path+i);if(reason)break;}
  }else if(node.branch===false){
   if(!Array.isArray(node.records))reason='records-unqualified';
   else for(const record of node.records){
    if(!uint(record?.raw10)){reason='record-mask-unqualified';break;}
    if(!(record.raw10&mask))continue;
    const enabled=record.raw34;if(!validEnabled(enabled)){reason='record-enable-unqualified';break;}if(!enabled)continue;
    if(record.qualified!==true||!uint(record.raw18)||!Number.isInteger(record.triangleCount)||record.triangleCount<0||
     !Array.isArray(record.vertices)||record.vertices.length!==record.triangleCount*3){reason='record-geometry-unqualified';break;}
    const preparedContact=preparedQuery?.record(record.vertices);
    for(let index=0;index<record.triangleCount;index++){
     const hit=preparedContact?preparedContact(index):nativeStaticTriangleContact({origin,displacement,radii,triangle:record.vertices.slice(index*3,index*3+3),arithmeticProfile});
     accept(state,hit,record,{path,triangleIndex:index});
    }
   }
  }else reason='branch-unqualified';
  active.delete(node);
 }
 visit(tree);
 return reason?incomplete(reason):{qualified:true,...state,nativeReady:false,nativeMovementCompared:false};
}

//7B5030: C then8 share one accumulator. Unlike lower support, a hit in C does
// not skip8. Each world visits its own static tree followed by world90 children.
// Category400 executes after the worlds. Nonempty400 consumers must provide a
// qualified source port; this function never substitutes a guessed shape.
export function queryNativeOrdinaryContact({origin,displacement,radii,float47,solverMask,globalMask,managerFlag20,
 worldC,world8,category400,arithmeticProfile,initialHistory=[],initialCategories=0}={}){
 arithmetic(arithmeticProfile);origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
 if(!uint(solverMask)||!uint(globalMask)||typeof managerFlag20!=='boolean')throw TypeError('Explicit solver/global masks and manager flag required');
 const mask=(solverMask&globalMask)>>>0,bounds=nativeStaticSweepBounds({origin,displacement,radii,float47});
 const incomplete=reason=>({qualified:false,hit:false,reason,nativeReady:false});
 let state={qualified:true,...emptyState({history:initialHistory,accumulatedHitCategories:initialCategories})};
 const calls=[],active=new Set();let visited=0,reason=null;
 function worldQuery(world,label){
  if(!world||world.complete!==true||world.treeComplete!==true||!Array.isArray(world.children)||
   !Object.hasOwn(world,'tree')||active.has(world)||++visited>10000){reason=`${label}-world-unqualified`;return;}
  active.add(world);calls.push(`${label}.tree`);
  const result=queryNativeStaticContact({origin,displacement,radii,bounds,mask,tree:world.tree,complete:true,arithmeticProfile,initialContact:state});
  if(result.qualified!==true){reason=`${label}:${result.reason}`;active.delete(world);return;}
  state=result;
  for(let i=0;i<world.children.length;i++){worldQuery(world.children[i],`${label}.world90[${i}]`);if(reason)break;}
  active.delete(world);
 }
 if(mask){
  worldQuery(worldC,'worldC');if(reason)return incomplete(reason);
  if(!managerFlag20){worldQuery(world8,'world8');if(reason)return incomplete(reason);}
  if(mask&0x400){
   if(category400?.complete!==true||!Array.isArray(category400.queries))return incomplete('category400-unqualified');
   for(let i=0;i<category400.queries.length;i++){
    const query=category400.queries[i];if(typeof query!=='function')return incomplete('category400-consumer-unqualified');
    calls.push(`category400[${i}]`);
    const result=query({origin:origin.slice(),displacement:displacement.slice(),radii:radii.slice(),bounds,mask,initialContact:state});
    if(result?.qualified!==true)return incomplete('category400-query-unqualified');
    const next=contactState(result);
    if(state.hit&&(!next.hit||next.distance>state.distance))throw TypeError('Category400 must preserve the shared nearest-hit accumulator');
    state={qualified:true,...next};
   }
  }
 }
 return {qualified:true,...state,effectiveMask:mask,bounds,calls,nativeReady:false,nativeMovementCompared:false,
  responseMask6ACProvided:false,otherSolverBranchesRequired:(solverMask&0x211000)>>>0};
}
