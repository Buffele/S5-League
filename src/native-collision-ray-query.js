// Source7B5F10 manager and world virtual204=11FF390. Primitive ray queries
// remain explicit source contracts; a swept-contact query is not equivalent.
const f=Math.fround;
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite native XYZ required');return v.map(f);};
const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
function call(fn,...args){const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Native ray ports must complete synchronously');return value;}
function validateRay(ray){if(!ray||typeof ray!=='object')throw TypeError('Explicit mutable native ray required');ray.origin=xyz(ray.origin);ray.direction=xyz(ray.direction);return ray;}
function output(value,ray,label){
 if(value?.qualified!==true)return refuse(value?.reason??`${label}-unqualified`);
 if(typeof value.hit!=='boolean'||!Object.hasOwn(value,'point'))return refuse(`${label}-output-unqualified`);
 try{validateRay(ray);return {...value,point:xyz(value.point)};}catch{return refuse(`${label}-vector-unqualified`);}
}

// readCurrent supplies a coherent CURRENT manager topology. Only enabled
// category lists are read; their known empty state still requires complete[].
// Primitive callbacks receive the SAME mutable ray and must retain source
// direction shortening, category/id writes and other output effects.
export function createNativeCollisionRayQuery(p={}){
 const names=['readCurrent','queryWorld204','queryCategory400','queryCategory800','queryCategory8000'];
 if(typeof p.source!=='string'||!p.source.trim()||!names.every(n=>sync(p[n])))throw TypeError(`Explicit synchronous source ray ports required: ${names.join(', ')}`);
 return input=>{
  const mask=uint(input?.mask,'ray mask'),argumentZero=uint(input?.argumentZero,'ray byte');if(argumentZero>255)throw TypeError('Explicit byte ray argument required');
  const start=xyz(input?.start),end=xyz(input?.end),ray={origin:start,direction:end.map((v,i)=>f(v-start[i]))};validateRay(ray);
  const snapshot=call(p.readCurrent,input);if(snapshot?.qualified!==true||typeof snapshot.managerFlag20!=='boolean')return refuse(snapshot?.reason??'current-ray-world-unqualified');
  let point=end,hit=false;const calls=[];
  const run=(label,fn,record)=>{
   calls.push(label);if(record==null)return refuse(`${label}-record-unqualified`);
   const result=output(call(fn,record,{mask,argumentZero,ray,point:point.slice(),outputs:input.outputs}),ray,label);
   if(result.qualified!==true)return result;
   point=result.point;hit=result.hit||hit;return result;
  };
  let result=run('worldC',p.queryWorld204,snapshot.worldC);if(result.qualified!==true)return {...result,calls};
  if(!snapshot.managerFlag20&&!result.hit){result=run('world8',p.queryWorld204,snapshot.world8);if(result.qualified!==true)return {...result,calls};}
  for(const [category,flag,fn]of [['category400',0x400,p.queryCategory400],['category800',0x800,p.queryCategory800],['category8000',0x8000,p.queryCategory8000]]){
   if((mask&flag)===0)continue;
   const collection=snapshot[category];if(collection?.complete!==true||!Array.isArray(collection.records))return {...refuse(`${category}-collection-unqualified`),calls};
   // Native vector end is read on every iteration, so appended live records
   // remain visible. There is no excludedIds filter on this manager route.
   for(let index=0;index<collection.records.length;index++){
    result=run(`${category}[${index}]`,fn,collection.records[index]);if(result.qualified!==true)return {...result,calls};
   }
  }
  return {qualified:true,hit,point,ray,calls,outputs:input.outputs,nativeReady:false,primitiveConsumersCertified:false,nativeRayExecuted:false};
 };
}

// Each recursive world initializes a local endpoint from its CURRENT shared
// ray, queries tree50 and all children, and only publishes point on a hit.
// Primitives may shorten ray.direction; retain it through the entire union.
export function queryNativeWorldRay({world,mask,argumentZero,ray,point,queryTree50,outputs}={}){
 mask=uint(mask,'ray mask');argumentZero=uint(argumentZero,'ray byte');if(argumentZero>255||!sync(queryTree50))throw TypeError('Explicit synchronous tree50 ray consumer and byte required');
 validateRay(ray);point=xyz(point);const active=new Set();let visited=0;
 function query(current,callerPoint,label){
  if(current?.complete!==true||!Object.hasOwn(current,'tree')||!Array.isArray(current.children)||active.has(current)||++visited>10000)return refuse(`${label}-world-unqualified`);
  active.add(current);let local=ray.origin.map((v,i)=>f(v+ray.direction[i])),hit=false;
  if(local.some(v=>!Number.isFinite(v))){active.delete(current);return refuse(`${label}-endpoint-unqualified`);}
  if(current.tree!==null){
   const result=output(call(queryTree50,current.tree,{mask,argumentZero,ray,point:local.slice(),outputs}),ray,`${label}.tree50`);
   if(result.qualified!==true){active.delete(current);return result;}local=result.point;hit=result.hit;
  }
  for(let index=0;index<current.children.length;index++){
   const result=query(current.children[index],local.slice(),`${label}.world90[${index}]`);
   if(result.qualified!==true){active.delete(current);return result;}
   if(result.hit){local=result.point;hit=true;}
  }
  active.delete(current);return {qualified:true,hit,point:hit?local:callerPoint,ray,outputs,nativeReady:false};
 }
 return query(world,point,'world');
}
