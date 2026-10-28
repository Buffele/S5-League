// Source11FACA0: plane gate11FABE0 -> line intersection119B6A0 ->
// angle-sum inside11FB430. JavaScript does not emulate x87 extended precision.
const f=Math.fround;
export const S5RUNTIME_SHIELD_TRIANGLE_SOURCE=Object.freeze({farPlaneGate:1e10,angleFactor:0.9999,angleFullTurn:6.2831854820251465,nativeTriangleAlgorithmVerified:true,x87BitwiseParityVerified:false,nativeModeSideEffectsApplied:false,nativeCompared:false,nativeReady:false});
const add=(a,b)=>a.map((v,i)=>f(v+b[i]));
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const scale=(a,s)=>a.map(v=>f(v*s));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const x87dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const magnitude=a=>f(Math.sqrt(dot(a,a)));
const squared=a=>dot(a,a);
const normalize=a=>{const length=magnitude(a);return length===0?a:scale(a,f(1/length));};
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
function vector(value,label){if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw Error(`Explicit finite ${label} required`);const out=value.map(f);if(!out.every(Number.isFinite))throw Error('Native float32 vector overflow');return out;}
function angle(a,b){
  //100B180: float32 dot/length product/division, acos then float32;
  // _isnan of the rounded result maps invalid/zero-length angles to0.
  const value=f(Math.acos(f(dot(a,b)/f(magnitude(a)*magnitude(b)))));
  return Number.isNaN(value)?0:value;
}

export function intersectS5RuntimeShieldTriangle({from,direction,triangle}={}){
  if(!Array.isArray(triangle)||triangle.length!==3)throw Error('Explicit Shield triangle required');
  const [a,b,c]=triangle.map(v=>vector(v,'triangle vertex'));
  return intersectS5RuntimeTrianglePacket({from,direction,packet:{origin:a,edge1:sub(b,a),edge2:sub(c,a)}});
}

// Native40-byte packets store A and the two rounded edges. Preserve those
// edges directly: reconstructingB then subtractingA is not a lossless roundtrip.
export function intersectS5RuntimeTrianglePacket({from,direction,packet}={}){
  const origin=vector(from,'ray origin'),ray=vector(direction,'ray direction');
  const a=vector(packet?.origin,'packet origin'),edge1=vector(packet?.edge1,'packet edge1'),edge2=vector(packet?.edge2,'packet edge2');
  // Native triangle packet stores origin and two edge vectors, then rebuilds
  // the other two vertices for the three angle calls.
  const normal=normalize(cross(edge2,edge1));
  const planeD=f(-x87dot(normal,a));
  const far=add(origin,scale(ray,S5RUNTIME_SHIELD_TRIANGLE_SOURCE.farPlaneGate));
  const signedOrigin=f(x87dot(normal,origin)+planeD),signedFar=f(x87dot(normal,far)+planeD);
  const reject=reason=>({hit:false,reason,...S5RUNTIME_SHIELD_TRIANGLE_SOURCE});
  if(!(signedOrigin*signedFar<0))return reject('strict-plane-crossing-required');
  const numerator=-(x87dot(normal,origin)+planeD),denominator=dot(normal,ray);
  const point=denominator===0?origin:origin.map((v,i)=>f(v+ray[i]*(numerator/denominator)));
  const vertices=[a,add(a,edge1),add(a,edge2)],vectors=vertices.map(v=>sub(v,point));
  const angleSum=angle(vectors[0],vectors[1])+angle(vectors[1],vectors[2])+angle(vectors[2],vectors[0]);
  if(!(angleSum>=S5RUNTIME_SHIELD_TRIANGLE_SOURCE.angleFactor*S5RUNTIME_SHIELD_TRIANGLE_SOURCE.angleFullTurn))return {...reject('angle-sum-outside'),angleSum};
  return {hit:true,point,angleSum,...S5RUNTIME_SHIELD_TRIANGLE_SOURCE};
}

export function queryS5RuntimeShieldSourceTriangles({from,to,triangles}={}){
  const origin=vector(from,'segment origin'),endpoint=vector(to,'segment endpoint');
  if(!Array.isArray(triangles))throw Error('Explicit Shield triangle collection required');
  const delta=sub(endpoint,origin),direction=normalize(delta);
  let nearestSquared=squared(delta),hit=null;
  for(const triangle of triangles){const result=intersectS5RuntimeShieldTriangle({from:origin,direction,triangle});if(result.hit){const distanceSquared=squared(sub(result.point,origin));if(distanceSquared<nearestSquared){nearestSquared=distanceSquared;hit={...result,distanceSquared,distance:Math.sqrt(distanceSquared)};}}}
  // This entry point implements triangle selection only. Native sphere
  // broadphase11FA770/119C230 must be supplied separately by its owner.
  return hit?{...hit,broadphaseApplied:false}:{hit:false,broadphaseApplied:false,...S5RUNTIME_SHIELD_TRIANGLE_SOURCE};
}

export function s5runtimeShieldSourceBroadphase({from,to,sphere}={}){
  const origin=vector(from,'segment origin'),endpoint=vector(to,'segment endpoint'),center=vector(sphere?.center,'native sphere center');
  if(!Number.isFinite(sphere?.radius)||sphere.radius<0||!Number.isFinite(f(sphere.radius)))throw Error('Explicit finite native sphere radius required');
  //119C230 uses the original finite displacement, before7FDBE9 normalizes
  // its separate ray copy for triangle tests. Projection is clamped0..1.
  const delta=sub(endpoint,origin);let residual=sub(center,origin);
  const projection=dot(residual,delta),lengthSquared=squared(delta);
  if(projection>0){residual=sub(residual,projection>=lengthSquared?delta:scale(delta,f(projection/lengthSquared)));}
  const distanceSquared=squared(residual),radiusSquared=f(f(sphere.radius)*f(sphere.radius));
  return {intersects:distanceSquared<=radiusSquared,distanceSquared,radiusSquared,...S5RUNTIME_SHIELD_TRIANGLE_SOURCE};
}

export function queryS5RuntimeShieldSourceContact({from,to,triangles,sphere,queryMask,ownerSlot1c4,requesterSlot1c4,shieldId,nativeContext}={}){
  const reject=reason=>({hit:false,reason,...S5RUNTIME_SHIELD_TRIANGLE_SOURCE});
  if(nativeContext?.enabled!==true)return reject('native-context-required');
  if(!Number.isInteger(queryMask)||typeof ownerSlot1c4!=='boolean'||typeof requesterSlot1c4!=='boolean')return reject('raw-shield-query-predicates-required');
  if(!(queryMask&0x800)||ownerSlot1c4===requesterSlot1c4)return reject('native-shield-query-filtered');
  const broadphase=s5runtimeShieldSourceBroadphase({from,to,sphere});
  if(!broadphase.intersects)return {...reject('native-sphere-broadphase-filtered'),broadphaseApplied:true,broadphase};
  const result=queryS5RuntimeShieldSourceTriangles({from,to,triangles});
  return {...result,broadphaseApplied:true,broadphase,...(result.hit?{hitMask:0x800,shieldId}:{})};
}
