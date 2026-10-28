// Source127AA70 tree50, typed8/5 broadphase126D650 and raw40byte packets.
import {nativeCategory400RayBroadphase} from './native-category400-ray.js';
import {intersectS5RuntimeTrianglePacket} from './s5runtime-skill-shield-triangle.js';
const f=Math.fround;
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite native XYZ required');return v.map(f);};
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const sq=v=>f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]));
const flags={nativeReady:false,nativeGeometryVerified:false,currentRuntimeBindingsVerified:false,x87BitwiseParityVerified:false,nativeCompared:false};
export function nativeRayBounds8Broadphase({bounds48,ray,dispatch85}={}){
 if(dispatch85?.qualified!==true||dispatch85.boundsType!==8||dispatch85.rayType!==5||dispatch85.handler!==0x119d7b0)throw TypeError('Explicit current source8/5 dispatch119D7B0 required');
 if(bounds48?.vtable!==0x13f617c)throw TypeError('Explicit source bounds13F617C required');
 const min=xyz(bounds48.min),max=xyz(bounds48.max);if(min.some((v,i)=>v>max[i]))throw TypeError('Ordered native bounds required');
 // Center uses rounded SSE delta; extents use x87 subtract/divide double2
 // then f32. Host arithmetic limitations remain explicit in result flags.
 const delta=sub(max,min),center=min.map((v,i)=>f(v+f(delta[i]*.5))),extents=max.map((v,i)=>f((v-min[i])/2));
 return nativeCategory400RayBroadphase({origin:ray.origin,direction:ray.direction,shapeAc:{center,axes:[[1,0,0],[0,1,0],[0,0,1]],extents}});
}
export function queryNativeCollisionRayTree(node,q){
 const mask=uint(q?.mask,'mask'),flag=uint(q?.argumentZero,'query byte');if(flag>255)throw TypeError('Explicit byte query flag required');
 const ray=q?.ray;if(!ray||typeof ray!=='object')throw TypeError('Explicit mutable source ray required');
 const origin=xyz(ray.origin);ray.direction=xyz(ray.direction);let point=xyz(q.point),hit=false,visited=0;const path=new Set(),accepted=[];
 function visit(current){
  if(current?.vtable!==0x14aca50||path.has(current)||++visited>10000)throw TypeError('Explicit acyclic source tree14ACA50 required');path.add(current);
  try{
   if(!nativeRayBounds8Broadphase({bounds48:current.bounds48,ray,dispatch85:q.dispatch85}).intersects)return;
   if(typeof current.raw30!=='boolean')throw TypeError('Explicit tree raw30 required');
   if(current.raw30){if(!Array.isArray(current.children10)||current.children10.length!==8)throw TypeError('Explicit eight source children required');for(let i=0;i<8;i++)if(current.children10[i]!==null)visit(current.children10[i]);return;}
   if(!Array.isArray(current.records8))throw TypeError('Explicit complete ordered leaf records8 required');
   const initial=xyz(ray.direction);let limit=sq(initial);const length=f(Math.sqrt(limit)),normalized=length===0?initial:initial.map(v=>f(v*f(1/length)));
   for(const record of current.records8){
    const type=uint(record?.raw10,'record10');if((type&mask)===0)continue;
    if(typeof record.raw34!=='boolean')throw TypeError('Explicit record34 required');if(!record.raw34)continue;
    if(typeof record.raw14!=='boolean')throw TypeError('Explicit record14 required');if(record.raw14&&flag!==0)continue;
    if(typeof record.meshC?.beginEndEqual!=='boolean')throw TypeError('Explicit source mesh emptiness required');if(record.meshC.beginEndEqual)continue;
    const packets=record.meshC.trianglePackets;if(!Array.isArray(packets)||packets.length===0)throw TypeError('Explicit nonempty source mesh triangle packets required');
    for(const packet of packets){
     const triangle=intersectS5RuntimeTrianglePacket({from:origin,direction:normalized,packet});if(!triangle.hit)continue;
     const candidate=xyz(triangle.point),delta=sub(candidate,origin),distanceSquared=sq(delta);if(!(distanceSquared<limit))continue;
     const object=uint(record.raw18,'record18');
     if(!q.outputs||typeof q.outputs!=='object'||!Object.hasOwn(q.outputs,'outputType')||!Object.hasOwn(q.outputs,'outputObject'))throw TypeError('Explicit caller-owned raw ray output cells required');
     ray.direction=delta;point=candidate;limit=distanceSquared;q.outputs.outputType=type;q.outputs.outputObject=object;hit=true;accepted.push(object);
    }
   }
  }finally{path.delete(current);}
 }
 visit(node);return {qualified:true,hit,point,accepted,...flags};
}
