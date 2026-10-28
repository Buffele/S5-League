import {assertConquestBishopActor} from './conquest-bishop-ai.js';
import {CONQUEST_BISHOP_SOURCE} from './conquest-bishop-source.js';
import {assertConquestBishopRayDistanceCapture} from './conquest-bishop-ray-distance.js';
import {nativeBoxAabbIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const localShapes=new WeakMap(),worldShapes=new WeakMap(),f=Math.fround;
const vector=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit native '+name+' vec3 required');return v.map(f);};
const bool=(v,name)=>{if(typeof v!=='boolean')throw Error('Explicit source '+name+' boolean required');return v;};
const positive=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v))||f(v)<=0)throw Error('Positive native '+name+' required');return f(v);};
const dimension=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v))||v<0)throw Error('Nonnegative native '+name+' required');return f(v);};
// Original100E660 /100E5D0 plus DLL29 scalar rotation; separate from renderer
// matrices. The full5435A0 decomposition is CPU-tested with explicit numeric
// bounds; universal x87/DLL boundary parity is not claimed by this scalar port.
function rotation(d){
 let axis,angle;
 if(d[2]>.9998999834060669){axis=[0,1,0];angle=3.1415927410125732;}
 else {const len=f(Math.sqrt(f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]))));angle=f(Math.acos(f(f(-d[2])/len)));if(Number.isNaN(angle))angle=0;const raw=[d[1],f(-d[0]),0],square=f(raw[0]*raw[0]+raw[1]*raw[1]);axis=square>1.1754943508222875e-38?raw.map(v=>f(v/Math.sqrt(square))):[0,0,0];}
 const half=f(angle*.5),s=f(Math.sin(half)),[x,y,z]=axis.map(v=>f(v*s)),w=f(Math.cos(half));
 return [f(1-2*y*y-2*z*z),f(2*x*y+2*z*w),f(2*x*z-2*y*w),f(2*x*y-2*z*w),f(1-2*x*x-2*z*z),f(2*y*z+2*x*w),f(2*x*z+2*y*w),f(2*y*z-2*x*w),f(1-2*x*x-2*y*y)];
}
const rotate=(v,m)=>[0,1,2].map(i=>f(f(f(v[0]*m[i])+f(v[1]*m[3+i]))+f(v[2]*m[6+i])));
const normalize=v=>{const len=f(Math.sqrt(f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]))));if(!(len>0))throw Error('Nonzero source attack direction required');return v.map(n=>f(n/len));};
const length=v=>f(Math.sqrt(f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]))));
function between(a,b){
 const cross=[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))],dot=f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
 let angle=f(Math.acos(f(dot/f(length(a)*length(b)))));if(Number.isNaN(angle))angle=0;
 const squared=f(f(f(cross[0]*cross[0])+f(cross[1]*cross[1]))+f(cross[2]*cross[2])),axis=squared>1.1754943508222875e-38?cross.map(n=>f(n/Math.sqrt(squared))):[0,0,0],half=f(angle*.5),sin=f(Math.sin(half)),[x,y,z]=axis.map(n=>f(n*sin)),w=f(Math.cos(half));
 return [f(1-2*y*y-2*z*z),f(2*x*y+2*z*w),f(2*x*z-2*y*w),f(2*x*y-2*z*w),f(1-2*x*x-2*z*z),f(2*y*z+2*x*w),f(2*x*z+2*y*w),f(2*y*z-2*x*w),f(1-2*x*x-2*y*y)];
}

// Literal local MAKETHICKRAY from Bishop CreateAttack1.569180 stores type7,
// copies origin/direction and normalizes the source unit -Z. The actual
// A22410 Lua global publication captures current15F4404 at script creation.
// No default limit, world transform, mobile projectile or hit is supplied here.
export function createConquestBishopLocalAttackShape({actor,rayDistanceLimit,rangeCapture}={}){
 assertConquestBishopActor(actor);
 if(rangeCapture!==undefined){assertConquestBishopRayDistanceCapture(rangeCapture,{actor});if(rayDistanceLimit!==undefined&&f(rayDistanceLimit)!==rangeCapture.rayDistanceLimit)throw Error('Captured Bishop range cannot be replaced');rayDistanceLimit=rangeCapture.rayDistanceLimit;}
 if(!Number.isFinite(rayDistanceLimit)||!(Math.fround(rayDistanceLimit)>0)||!Number.isFinite(Math.fround(rayDistanceLimit)))throw Error('Explicit captured source RayDistanceLimit required');
 const shape=Object.freeze({type:7,origin:Object.freeze([0,0,0]),direction:Object.freeze([0,0,-1]),width:CONQUEST_BISHOP_SOURCE.rayWidth,length:Math.fround(rayDistanceLimit),
  coordinateSpace:'native-local',sourceConstructor:0x569180,sourceDispatch:0x5435a0,
  collisionRangeAdjust:false,adjustedQueryRequired:false,sourceLocalConstructorQualified:true,sourceRangeCaptureQualified:rangeCapture!==undefined,worldTransformQualified:false,geometryConsumerQualified:false,nativeReady:false});
 localShapes.set(shape,{actor,model:actor.model,rangeCapture});return shape;
}

// 5F5790 type7 follows the same native transform wrapper but its local origin
// is exactly zero. Bishop_Fire_Dummy is an FX attachment, never a ray origin.
export function conquestBishopWorldAttackShape({actor,localShape,position7c,direction8c,orientDirection280,placeOrigin281}={}){
 assertConquestBishopActor(actor);const r=localShapes.get(localShape);if(!r||r.actor!==actor||r.model!==actor.model)throw Error('Actual owned Bishop local attack shape required');if(r.rangeCapture)assertConquestBishopRayDistanceCapture(r.rangeCapture,{actor});
 const p=vector(position7c,'actor position7C'),d=vector(direction8c,'actor direction8C');bool(orientDirection280,'attack280');bool(placeOrigin281,'attack281');
 if(d[1]!==0||Math.abs(Math.hypot(...d)-1)>1e-5)throw Error('Source-normalized horizontal Bishop direction8C required');
 const m=rotation(d),origin=placeOrigin281?rotate(localShape.origin,m).map((v,i)=>f(v+p[i])):[...localShape.origin],direction=orientDirection280?normalize(rotate(localShape.direction,m)):[...localShape.direction];
 const shape=Object.freeze({...localShape,origin:Object.freeze(origin),direction:Object.freeze(direction),coordinateSpace:'native',orientDirection280,placeOrigin281,sourceWorldTransform:0x5f5790,worldTransformQualified:true,geometryConsumerQualified:true});worldShapes.set(shape,{actor,localShape});return shape;
}
export function assertConquestBishopWorldAttackShape(shape,{actor}={}){const r=worldShapes.get(shape);if(!r||r.actor!==actor)throw Error('Typed Bishop world attack shape required');assertConquestBishopActor(actor);const local=localShapes.get(r.localShape);if(local.model!==actor.model)throw Error('Current Bishop world shape required');if(local.rangeCapture)assertConquestBishopRayDistanceCapture(local.rangeCapture,{actor});return shape;}

// A28AE0, with E0=true: actor7C.y+actor6C*.5 ->5FDCB0, then raw
// stateD4 ->5FD640, before5FD1F0. Actor-facing A28D60 is a separate earlier
// write. Group mode30 remains the original ctor's zero (no spread writer).
// Preserve the source's degenerate opposite/zero-axis behavior: raw +Z can
// leave this group's -Z unchanged even though the actor faces +Z.
export function conquestBishopTrackedAttackShape({actor,localShape,position7c,height6c,attackDirectionD4}={}){
 assertConquestBishopActor(actor);const r=localShapes.get(localShape);if(!r||r.actor!==actor||r.model!==actor.model)throw Error('Actual owned Bishop local attack shape required');if(r.rangeCapture)assertConquestBishopRayDistanceCapture(r.rangeCapture,{actor});
 const p=vector(position7c,'tracking actor7C'),raw=vector(attackDirectionD4,'tracking stateD4'),height=positive(height6c,'tracking actor6C');if(height!==f(actor.height))throw Error('Actual Bishop actor6C height required');
 let horizontal=[raw[0],0,raw[2]],n=length(horizontal);if(n!==0)horizontal=horizontal.map(v=>f(v/n));
 const yaw=between([0,0,-1],horizontal),pitch=between(horizontal,raw),localRotation=rotation(localShape.direction);
 const direction=rotate(rotate(rotate([0,0,-1],localRotation),yaw),pitch),origin=[p[0],f(p[1]+f(height*.5)),p[2]];
 const shape=Object.freeze({...localShape,origin:Object.freeze(origin),direction:Object.freeze(direction),coordinateSpace:'native',sourceWorldTransform:0xa28ae0,sourceGroupPositionSetter:0x5fdcb0,sourceGroupDirectionSetter:0x5fd640,sourceGroupMode30:0,worldTransformQualified:true,sourceTrackingQualified:true,geometryConsumerQualified:true,nativeReady:false});worldShapes.set(shape,{actor,localShape});return shape;
}

// 5435A0 uses the full directionXYZ and center=origin+direction*(length*.5),
// followed by width/2,width/2,length/2. This is not the BOX rear-anchor kernel.
export function conquestBishopThickRayObb(shape){
 if(shape?.type!==7)throw Error('Source THICKRAY type7 required');const p=vector(shape.origin,'type7 origin'),d=vector(shape.direction,'type7 direction'),width=positive(shape.width,'type7 width'),length=positive(shape.length,'type7 length');if(Math.abs(Math.hypot(...d)-1)>1e-5)throw Error('Source-normalized type7 direction required');
 const half=f(length*.5),m=rotation(d);return {center:p.map((v,i)=>f(v+f(d[i]*half))),halfExtents:[f(width*.5),f(width*.5),half],axes:[[m[0],m[1],m[2]],[m[3],m[4],m[5]],[m[6],m[7],m[8]]]};
}
export function queryConquestBishopThickRayGeometry({shape,candidates}={}){
 if(!Array.isArray(candidates))throw Error('Explicit ordered source type7 candidates required');const obb=conquestBishopThickRayObb(shape),origin=vector(shape.origin,'type7 origin'),length=f(shape.length),contacts=[];
 for(const actor of candidates){if(!actor||actor.identity===undefined)throw Error('Actual source candidate identity required');if(!bool(actor.eligible44,'candidate44'))continue;
  const p=vector(actor.position80,'candidate80'),q=vector(actor.position7c,'candidate7C'),width=dimension(actor.width68,'candidate68'),height=dimension(actor.height6c,'candidate6C'),half=f(width*.5),min=[f(p[0]-half),p[1],f(p[2]-half)],max=[f(p[0]+half),f(p[1]+height),f(p[2]+half)];
  if(!nativeBoxAabbIntersection(obb,min,max).intersects)continue;
  const ratio=f(length/f(width+length)),point=[f(origin[0]+f(f(p[0]-origin[0])*ratio)),origin[1],f(origin[2]+f(f(p[2]-origin[2])*ratio))];point[1]=Math.max(q[1],Math.min(f(q[1]+height),point[1]));contacts.push({actor,point,flag16:0});
 }
 return {status:'thick-ray-geometry-explicit-candidates',contacts,shape,obb,primaryQueries:1,adjustedQueries:0,sourceDispatch:0x5435a0,satAndContactPointQualified:true,completeQueryWrapperQualified:true,candidateProducerQualified:false,worldObstructionQualified:false,obbDecompositionParity:false,numericParity:'float32 scalar; bounded original DLL29 comparison',nativeReady:false};
}
