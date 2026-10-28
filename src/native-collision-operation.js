// Source7B0180, PE6bea9d8c...; one already-batched native target update.
// The query callbacks must cover the CURRENT complete worlds/lists. This
// module does not choose frame cadence, world construction arithmetic or a
// collision fallback when a required query refuses qualification.
import {nativeCollisionResponse} from './native-collision-response.js';
const f=Math.fround;
const vector=value=>{
 if(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite native XYZ required');
 return value.map(f);
};
// 660 is raw retained output storage.7B082F..08AD multiplies it even when
// no query ran or the query missed; repeated source multiplications can
// overflow to IEEE infinity.650 can also remain true on below-skin returns.
// New contact hits still require a FINITE query point below. This storage
// never supplies the origin/target/radii of a geometric query.
const retainedPoint=value=>{
 if(!Array.isArray(value)||value.length!==3||value.some(n=>typeof n!=='number'))throw TypeError('Explicit raw float32 contact storage required');
 return value.map(f);
};
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const add=(a,b)=>a.map((n,i)=>f(n+b[i])),sub=(a,b)=>a.map((n,i)=>f(n-b[i]));
const multiply=(a,b)=>a.map((n,i)=>f(n*b[i])),divide=(a,b)=>a.map((n,i)=>f(n/b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const normalize=a=>{const n=f(Math.sqrt(dot(a,a)));return n===0?a.slice():a.map(v=>f(v*f(1/n)));};
function history(value){
 if(!Array.isArray(value)||value.length>200)throw TypeError('Explicit native category/ID history required');
 return value.map(row=>({category:uint(row.category,'history category'),ownerId:uint(row.ownerId,'history owner')}));
}
function copyState(state){
 if(!state||typeof state.grounded6b4!=='boolean'||typeof state.found650!=='boolean'||!Number.isFinite(state.nearest658))throw TypeError('Explicit native solver state required');
 const result={...state};
 for(const name of ['offset678','anchor684','radii690','lastSafe69c','normal66c'])result[name]=vector(state[name]);
 result.contactPoint660=retainedPoint(state.contactPoint660);
 if(result.radii690.some(n=>n<=0))throw RangeError('Positive native radii required');
 result.history=history(state.history);result.accumulatedCategoriesC=uint(state.accumulatedCategoriesC,'accumulated categories');
 return result;
}

export function nativeCollisionOperation({state,target,mode,context,queryContact,queryLowerSupport,queryAdjustedPosition}={}){
 const next=copyState(state);target=vector(target);mode=uint(mode,'movement mode');next.mode6b8=mode;
 //7B01A2..0219: mode is written even when target equals current anchor. No
 // history/distance reset, coordinate roundtrip or query happens on equality.
 if(target.every((n,i)=>n===next.anchor684[i]))return {qualified:true,position:next.anchor684.slice(),state:next,reason:'same-target',response:null};
 const refuse=reason=>({qualified:false,position:null,state:null,reason});
 if(!context||typeof queryContact!=='function')throw TypeError('Explicit movement context and complete contact query required');
 const oldAnchor=next.anchor684.slice(),offset=next.offset678,radii=next.radii690;
 next.history=[];next.accumulatedCategoriesC=0;next.nearest658=-1;
 const centeredOrigin=add(oldAnchor,offset),centeredTarget=add(target,offset);
 const origin=divide(centeredOrigin,radii),displacement=divide(sub(centeredTarget,centeredOrigin),radii);
 let queryRefusalReason=null;
 const response=nativeCollisionResponse({...context,origin,displacement,radii,initialIterations:0,
  descending:mode===1,grounded:next.grounded6b4,queryLowerSupport,
  queryContact:args=>{
   const result=queryContact({...args,solverMask:context.solverMask,globalMask:context.globalMask,
    initialHistory:history(next.history),initialCategories:next.accumulatedCategoriesC});
   if(result?.qualified!==true){queryRefusalReason=result?.reason??'contact-query-unqualified';return result;}
   if(result.completeUnion!==true){queryRefusalReason='contact-union-unqualified';return {qualified:false};}
   next.history=history(result.history);next.accumulatedCategoriesC=uint(result.accumulatedHitCategories,'query accumulated categories');
   if(typeof result.hit!=='boolean')throw TypeError('Explicit contact hit flag required');
   next.found650=result.hit;
   if(result.hit){
    next.contactPoint660=vector(result.point);next.normal66c=vector(result.normal);
    if(!next.history.length||next.history.at(-1).category!==result.activeTableCategory)throw TypeError('Contact active table category must match preserved history');
   }
   return result;
  }});
 if(response.qualified!==true)return refuse(queryRefusalReason??response.reason);
 next.grounded6b4=response.grounded;
 // Below-skin/iteration-limit return before resetting the query's distance;
 // the outer entry has already set it to-1. Later recursive misses reset it
 // to-1 but retain the latest hit point/normal/history, as in the source.
 next.nearest658=response.nearestDistance??next.nearest658;
 next.anchor684=sub(multiply(response.position,radii),offset);
 let validation=null;
 if(next.nearest658===0){
  if(mode===1)next.anchor684[1]=f(next.anchor684[1]+f(radii[1]*f(context.skin)));
  else{
   //7B0662 uses the ALREADY offset target arguments minus the saved OLD
   // uncentered anchor. Do not substitute the normalized sweep delta here.
   const backoff=normalize(sub(centeredTarget,oldAnchor)).map(n=>f(n*f(context.skin)));
   next.anchor684=sub(next.anchor684,backoff);
  }
  if(!Number.isInteger(context.validationGlobalMask)||context.validationGlobalMask<0||context.validationGlobalMask>0xffffffff)return refuse('validation-mask-unqualified');
  if(typeof queryAdjustedPosition!=='function')return refuse('adjusted-position-query-missing');
  //7B0F30 adds offset IN PLACE before validation, then subtracts it again.
  // This float32 roundtrip is retained even when validation reports clear.
  const centerWorld=add(next.anchor684,offset);
  const input={centerWorld:centerWorld.slice(),centerNormalized:divide(centerWorld,radii),radii:radii.slice(),
   bounds:{min:sub(centerWorld,radii),max:add(centerWorld,radii)},
   mask:(context.solverMask&context.validationGlobalMask)>>>0,initialCount:0};
  validation=queryAdjustedPosition(input);
  if(validation?.qualified!==true)return refuse('adjusted-position-query-unqualified');
  uint(validation.count,'adjusted-position hit count');
  next.anchor684=sub(centerWorld,offset);
  if(validation.count!==0)next.anchor684=next.lastSafe69c.slice();
  else next.lastSafe69c=next.anchor684.slice();
 }else next.lastSafe69c=next.anchor684.slice();
 //7B082F..0941 scales fields even if the latest query missed. Their initial
 // caller-provided values are preserved rather than fabricated on free travel.
 next.contactPoint660=multiply(next.contactPoint660,radii);
 next.normal66c=normalize(multiply(next.normal66c,radii));
 return {qualified:true,position:next.anchor684.slice(),state:next,response,validation,
  reason:validation?.count?'last-safe-restored':response.reason};
}
