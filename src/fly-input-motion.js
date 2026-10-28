import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
const f=Math.fround,axes=['x','y','z'];
const valid=v=>v&&axes.every(k=>Number.isFinite(v[k]));
const dot=(a,b)=>f(f(f(a.x*b.x)+f(a.y*b.y))+f(a.z*b.z));
const cross=(a,b)=>({x:f(f(a.y*b.z)-f(a.z*b.y)),y:f(f(a.z*b.x)-f(a.x*b.z)),z:f(f(a.x*b.y)-f(a.y*b.x))});
const length=v=>Math.sqrt(dot(v,v));

// CFly B808D0, actorEC ->530160 -> actor+278/27c/280. These arguments
// are already native-world logical vectors, not keyboard/camera-local axes.
// accel==0 builds FromTo(cameraFlat,cameraFull) via100E660 then D3DX
// axis-angle/quaternion matrix/Vec3TransformCoord. Other acceleration uses the
// actor vector directly. Source: physique/wallrun-native/fly-direction/.
export function flyInputMotion({actorVector,cameraDirection,acceleration,actorMoveSpeedNative,movementScale,dtMs}){
 if(!valid(actorVector)||![acceleration,actorMoveSpeedNative,movementScale,dtMs].every(Number.isFinite)||dtMs<0)throw new TypeError('Explicit finite native flight vector, acceleration, actor speed, movement scale and delta required');
 let direction=Object.fromEntries(axes.map(k=>[k,f(actorVector[k])]));
 if(!axes.every(k=>Number.isFinite(direction[k]))||![acceleration,actorMoveSpeedNative,movementScale,dtMs].every(v=>Number.isFinite(f(v))))throw new RangeError('Native float32 flight inputs overflow');
 const cameraBranch=f(acceleration)===0;
 if(cameraBranch&&axes.some(k=>direction[k]!==0)){
  if(!valid(cameraDirection))throw new TypeError('Explicit native-world camera direction required in zero-acceleration flight');
  const camera=Object.fromEntries(axes.map(k=>[k,f(cameraDirection[k])])),flat={x:camera.x,y:0,z:camera.z};
  const flatLength=length(flat),cameraLength=length(camera);
  if(!Number.isFinite(flatLength)||!Number.isFinite(cameraLength)||flatLength<1e-8||cameraLength<1e-8)throw new RangeError('Degenerate native camera direction is unverified');
  const axis=cross(flat,camera),axisLength=length(axis);
  if(axisLength>1e-10){
   const cosine=Math.max(-1,Math.min(1,f(dot(flat,camera)/f(flatLength*cameraLength)))),angle=Math.acos(cosine);
   const half=angle/2,sine=f(Math.sin(half));
   const q={x:f(f(axis.x/axisLength)*sine),y:f(f(axis.y/axisLength)*sine),z:f(f(axis.z/axisLength)*sine),w:f(Math.cos(half))};
   // q*v*q^-1, matching the source row-vector quaternion matrix rather than
   // transposing/mirroring it a second time. Native D3DX rounding remains a
   // separate comparison; this is an arithmetic port, not bit certification.
   const twice=cross(q,direction);for(const k of axes)twice[k]=f(2*twice[k]);
   const second=cross(q,twice);
   direction=Object.fromEntries(axes.map(k=>[k,f(f(direction[k]+f(q.w*twice[k]))+second[k])]));
  }
 }
 const seconds=f(f(dtMs)*f(.001));
 const nativeDisplacement=Object.fromEntries(axes.map(k=>[k,f(f(f(direction[k]*f(actorMoveSpeedNative))*f(movementScale))*seconds)]));
 const displacement=Object.fromEntries(axes.map(k=>[k,nativeDisplacement[k]*SCN_SCENE_SCALE]));
 return {nativeDisplacement,displacement,direction,branch:cameraBranch?'camera-flat-to-full':'direct-actor-vector',nativeReady:false};
}
