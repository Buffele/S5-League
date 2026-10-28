// F6A350 ray primitive and SAT11B6F10, source native axes/units.
// Promoted from audited anchoring-world-ray/broadphase stage; no native claim.
import {intersectS5RuntimeShieldTriangle} from './s5runtime-skill-shield-triangle.js';
const f=Math.fround;
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite native XYZ required');return v.map(f);};
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const bool=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const sq=v=>dot(v,v);
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
function call(fn,...args){const r=fn(...args);if(r&&typeof r.then==='function')throw TypeError('Native category400 ray ports must complete synchronously');return r;}
const flags={nativeReady:false,nativeGeometryVerified:false,x87BitwiseParityVerified:false,nativeCompared:false};

// SAT finite segment vs explicit source oriented shape. Axes are retained as
// stored, never normalized or synthesized from a scene AABB.
export function nativeCategory400RayBroadphase({origin,direction,shapeAc}={}){
 origin=xyz(origin);direction=xyz(direction);const center=xyz(shapeAc?.center),extents=xyz(shapeAc?.extents);
 if(extents.some(n=>n<0)||!Array.isArray(shapeAc?.axes)||shapeAc.axes.length!==3)throw TypeError('Explicit source axes and nonnegative extents required');
 const axes=shapeAc.axes.map(xyz),half=direction.map(v=>f(v*.5)),mid=sub(origin.map((v,i)=>f(v+half[i])),center);
 const absHalf=axes.map(a=>Math.abs(dot(half,a))),absMid=axes.map(a=>Math.abs(dot(mid,a)));
 for(let i=0;i<3;i++)if(absMid[i]>f(extents[i]+absHalf[i]))return {qualified:true,intersects:false,separatingAxis:i,...flags};
 const c=cross(half,mid);
 for(let i=0;i<3;i++){const j=(i+1)%3,k=(i+2)%3;if(Math.abs(dot(c,axes[i]))>f(extents[j]*absHalf[k]+extents[k]*absHalf[j]))return {qualified:true,intersects:false,separatingAxis:3+i,...flags};}
 return {qualified:true,intersects:true,separatingAxis:null,...flags};
}

// Raw owner pair exactly matches the live actor110.slot2C output. Equality
// then needs a separate AA4+8 presence/read and live actor reread.
export function createNativeCategory400Ray(p={}){
 const names=['readState1c','readFlagB4','readActor110','readActorSlot2c','readRecordIdentity','readGlobalAa4Actor8','readShapeAc','readVerticesB0','readId08'];
 if(typeof p.source!=='string'||!p.source.trim()||!names.every(n=>sync(p[n])))throw TypeError(`Explicit synchronous source category400 ports required: ${names.join(', ')}`);
 let busy=false;
 return (record,q)=>{
  if(busy)throw Error('Native category400 ray query cannot reenter');busy=true;
  try{
   const ray=q?.ray,origin=xyz(ray?.origin),direction=xyz(ray?.direction);let point=xyz(q?.point),hit=false;
   const result=()=>({qualified:true,hit,point,...flags});
   if(uint(call(p.readState1c,record,q),'state1C')!==1)return result();
   if(bool(call(p.readFlagB4,record,q),'flagB4')){
    const actor=call(p.readActor110,record,q);if(actor==null)throw TypeError('Explicit live actor110 required');
    const pair=v=>{if(!Array.isArray(v)||v.length!==2)throw TypeError('Explicit raw identity DWORD pair required');return v.map(n=>uint(n,'identity'));};
    const identity=pair(call(p.readActorSlot2c,actor,record,q)),own=pair(call(p.readRecordIdentity,record,q));
    if(identity.every((v,i)=>v===own[i])){
     const controlled=call(p.readGlobalAa4Actor8,record,q);
     if(controlled===null)return result();if(controlled===undefined)throw TypeError('Explicit nullable controlled actor required');
     if(call(p.readActor110,record,q)===call(p.readGlobalAa4Actor8,record,q))return result();
    }
   }
   if(!nativeCategory400RayBroadphase({origin,direction,shapeAc:call(p.readShapeAc,record,q)}).intersects)return result();
   const rawVertices=call(p.readVerticesB0,record,q);if(!Array.isArray(rawVertices))throw TypeError('Explicit ordered source verticesB0 required');
   const vertices=rawVertices.map(xyz);let limit=sq(direction);const length=f(Math.sqrt(limit)),normalized=length===0?direction:direction.map(v=>f(v*f(1/length)));
   // Source floors vertex count/3; trailing vertices do not form a triangle.
   for(let index=0;index<Math.floor(vertices.length/3);index++){
    const triangle=intersectS5RuntimeShieldTriangle({from:origin,direction:normalized,triangle:vertices.slice(index*3,index*3+3)});
    if(!triangle.hit)continue;
    const candidate=xyz(triangle.point),delta=sub(candidate,origin),distanceSquared=sq(delta);if(!(distanceSquared<limit))continue;
    const id=uint(call(p.readId08,record,q),'id08');if(id>0xffff)throw TypeError('Explicit uint16 category400 id08 required');
    if(!q.outputs||typeof q.outputs!=='object'||!Object.hasOwn(q.outputs,'outputType')||!Object.hasOwn(q.outputs,'outputObject'))throw TypeError('Explicit caller-owned raw ray output cells required');
    ray.direction=delta;point=candidate;limit=distanceSquared;q.outputs.outputType=0x400;q.outputs.outputObject=id;hit=true;
   }
   return result();
  }finally{busy=false;}
 };
}
