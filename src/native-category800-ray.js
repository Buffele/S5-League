// Source7FDAC0, manager category800. Raw slot1C4 BYTE inequality is required;
// mode6/7 owner-entry writes are source effects, never silently omitted.
import {intersectS5RuntimeShieldTriangle} from './s5runtime-skill-shield-triangle.js';
const f=Math.fround,uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const flags={nativeReady:false,nativeGeometryVerified:false,x87BitwiseParityVerified:false,nativeCompared:false};
const finite=v=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError('Finite source float32 required');return f(v);};
const xyz=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit finite source XYZ required');return v.map(finite);};
const sub=(a,b)=>a.map((v,i)=>finite(f(v-b[i]))),dot=(a,b)=>finite(f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2])));
const number=(v,label)=>{if(!uint(v))throw TypeError('Explicit uint32 '+label+' required');return v;};
const byte=(v,label)=>{if(!uint(v)||v>255)throw TypeError('Explicit byte '+label+' required');return v;};
const pointer=(v,label)=>{if(v!==null&&!(typeof v==='object'||typeof v==='string'&&v.length>0||uint(v)&&v!==0))throw TypeError('Explicit nullable source '+label+' required');return v;};

export function nativeCategory800RayBroadphase({origin,direction,sphere}={}){
 origin=xyz(origin);direction=xyz(direction);const center=xyz(sphere?.center),radius=finite(sphere?.radius);
 if(radius<0)throw TypeError('Nonnegative source sphere radius required');
 let residual=sub(center,origin);const projection=dot(residual,direction),lengthSquared=dot(direction,direction);
 if(projection>0){const projected=projection>=lengthSquared?direction:direction.map(v=>finite(f(v*f(projection/lengthSquared))));residual=sub(residual,projected);}
 const distanceSquared=dot(residual,residual),radiusSquared=finite(f(radius*radius));
 return {qualified:true,intersects:distanceSquared<=radiusSquared,distanceSquared,radiusSquared,...flags};
}

// SourceB62080: find FIRST existing owner key and write three DWORDs0,arg2,0.
// entries/payload must be owned by the enclosing source frame for rollback.
export function nativeCategory800WriteOwnerEntry({entries,owner,value=10000}={}){
 if(!Array.isArray(entries)||owner===null||owner===undefined)throw TypeError('Explicit complete source owner-entry list required');number(value,'entry value');
 for(const entry of entries){
  if(!entry||!Object.hasOwn(entry,'owner'))throw TypeError('Explicit owner-entry key required');
  if(entry.owner!==owner)continue;
  if(!entry.payload||typeof entry.payload!=='object'||!['raw0','raw4','raw8'].every(key=>uint(entry.payload[key])))throw TypeError('Explicit owned three-DWORD payload required');
  entry.payload.raw0=0;entry.payload.raw4=value;entry.payload.raw8=0;return {qualified:true,changed:true};
 }
 return {qualified:true,changed:false};
}

export function createNativeCategory800Ray(p={}){
 if(typeof p.source!=='string'||!p.source.trim()||p.maxTriangles!==undefined&&(!Number.isSafeInteger(p.maxTriangles)||p.maxTriangles<0))throw TypeError('Explicit category800 source and triangle budget required');let busy=false;
 function call(name,...args){if(!sync(p[name]))throw TypeError('Current category800 source port '+name+' required');const value=p[name](...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous category800 source result required');return value;}
 return (record,q)=>{
  if(busy)throw Error('Native category800 ray cannot reenter');busy=true;
  try{
   const ray=q?.ray,origin=xyz(ray?.origin),direction=xyz(ray?.direction);let point=xyz(q?.point),hit=false;
   const result=()=>({qualified:true,hit,point,...flags});
   const owner=pointer(call('resolveOwner7EDA30',record,q),'owner'),requester=pointer(call('readRequesterAA4Actor8',record,q),'requester');
   if(owner===null||requester===null)return result();
   const ownerFlag=byte(call('readActorSlot1c4',owner,record,q),'owner1C4'),requesterFlag=byte(call('readActorSlot1c4',requester,record,q),'requester1C4');
   if(ownerFlag===requesterFlag)return result();
   if(!nativeCategory800RayBroadphase({origin,direction,sphere:call('readSphere34',record,q)}).intersects)return result();
   let limit=dot(direction,direction);const length=finite(f(Math.sqrt(limit))),normalized=length===0?direction:direction.map(v=>finite(f(v*f(1/length))));
   const vertexCount=number(call('readVertexCount3c',record,q),'vertexCount3C'),triangleCount=Math.floor(vertexCount/3);
   if(triangleCount>(p.maxTriangles??100000))throw TypeError('category800 source triangle budget exceeded');
   for(let index=0;index<triangleCount;index++){
    const triangle=[];for(let corner=0;corner<3;corner++){
     const at=index*3+corner,entry=call('readVertex3c',record,at,q);
     if(!uint(entry?.currentCount)||entry.currentCount<=at)throw TypeError('Current source vertex3C index unavailable');triangle.push(xyz(entry.value));
    }
    const contact=intersectS5RuntimeShieldTriangle({from:origin,direction:normalized,triangle});if(!contact.hit)continue;
    const candidate=xyz(contact.point),delta=sub(candidate,origin),distanceSquared=dot(delta,delta);if(!(distanceSquared<limit))continue;
    if(!q.outputs||typeof q.outputs!=='object'||!Object.hasOwn(q.outputs,'outputType')||!Object.hasOwn(q.outputs,'outputObject'))throw TypeError('Explicit caller-owned ray output cells required');
    ray.direction=delta;point=candidate;limit=distanceSquared;
    for(let axis=0;axis<3;axis++)q.point[axis]=candidate[axis];
    q.outputs.outputType=0x800;q.outputs.outputObject=number(call('readId08',record,q),'Shield id08');
    // Source publishes shortened segment/category/ID BEFORE these effects,
    // and executes this branch again for EACH strictly closer triangle.
    let slot=null;
    if(byte(call('readMode7ECB60',6,record,q),'mode6')!==0)slot=0x5c;
    else if(byte(call('readMode7ECB60',7,record,q),'mode7')!==0)slot=0x60;
    if(slot!==null){
     const component=pointer(call('readModeFC',record,q),'modeFC');
     if(component!==null){
      const present=pointer(call('readModeComponent',component,slot,record,q),'mode component');
      if(present!==null){
       const current=pointer(call('readModeComponent',component,slot,record,q),'current mode component');
       if(current===null)throw TypeError('Mode component disappeared before source owner write');
       const written=call('writeOwnerEntryB62080',current,owner,10000,record,q);
       if(written?.qualified!==true)throw TypeError('Current source B62080 owner write unqualified');
      }
     }
    }
    hit=true;
   }
   return result();
  }finally{busy=false;}
 };
}

