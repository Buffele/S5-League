// Source7387F0 actor-list ray branch. Raw source fields, no S5 body inference.
import {s5runtimeShieldSourceBroadphase,intersectS5RuntimeShieldTriangle} from './s5runtime-skill-shield-triangle.js';
const f=Math.fround;
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite native XYZ required');return v.map(f);};
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const sq=v=>f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]));
export function queryNativeCategory8000Ray(record,q){
 const origin=xyz(q?.ray?.origin),direction=xyz(q?.ray?.direction);let point=xyz(q?.point),hit=false;
 const result=()=>({qualified:true,hit,point,nativeReady:false,nativeGeometryVerified:false,x87BitwiseParityVerified:false,nativeCompared:false});
 if(typeof record?.raw98!=='boolean')throw TypeError('Explicit source raw98 required');if(!record.raw98)return result();
 if(typeof record.raw60!=='boolean')throw TypeError('Explicit source raw60 required');if(record.raw60)return result();
 if(record.geometryQualified!==true)throw TypeError('Explicit qualified category8000 geometry required');
 const sphere=record.sphereA0,relativeSphere={center:sub(xyz(sphere?.center),origin),radius:sphere?.radius};
 if(!s5runtimeShieldSourceBroadphase({from:[0,0,0],to:direction,sphere:relativeSphere}).intersects)return result();
 if(!Array.isArray(record.verticesA8))throw TypeError('Explicit source verticesA8 required');
 const vertices=record.verticesA8.map(xyz);let limit=sq(direction);const length=f(Math.sqrt(limit)),normalized=length===0?direction:direction.map(v=>f(v*f(1/length)));
 for(let index=0;index<Math.floor(vertices.length/3);index++){
  const triangle=intersectS5RuntimeShieldTriangle({from:origin,direction:normalized,triangle:vertices.slice(index*3,index*3+3)});if(!triangle.hit)continue;
  const candidate=xyz(triangle.point),delta=sub(candidate,origin),distanceSquared=sq(delta);if(!(distanceSquared<limit))continue;
  const id=record.raw5c;if(!Number.isInteger(id)||id<0||id>0xffffffff)throw TypeError('Explicit uint32 source raw5C required');
  if(!q.outputs||typeof q.outputs!=='object'||!Object.hasOwn(q.outputs,'outputType')||!Object.hasOwn(q.outputs,'outputObject'))throw TypeError('Explicit caller-owned raw ray output cells required');
  q.ray.direction=delta;point=candidate;limit=distanceSquared;q.outputs.outputType=0x8000;q.outputs.outputObject=id;hit=true;
 }
 return result();
}
