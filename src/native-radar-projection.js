// Decoded source math from pinned PE6bea9d8c…:008EC630/008EC960,
// 008EF740/008EF7F0 and0100B040/0100B100/0100B180/0100E660.
import {nativeMapPoint} from './s5runtime-coordinates.js';
// This module does not own native visibility, subject selection or composition.
// Axis/angle is the actual input to D3DXQuaternionRotationAxis, not a yaw guess.
const f=Math.fround;
function scalar(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`Finite float32 ${label} required`);return f(value);}
function vector(value,label){if(!Array.isArray(value)||value.length!==3)throw TypeError(`Explicit ${label} XYZ required`);return value.map((x,i)=>scalar(x,`${label}[${i}]`));}
function squared(v){return f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]));}

export const NATIVE_RADAR_ROTATION_SOURCE=Object.freeze({
 thresholdZ:f(.9999),pi:f(Math.PI),
 quaternionAxisThunk:0x12a8d72,quaternionAxisIat:0x139ab90,
 matrixQuaternionThunk:0x12a8d36,matrixQuaternionIat:0x139ab40,
 transformCoordThunk:0x12a8d00,transformCoordIat:0x139ab64,
});

// 008EC630 zeros Y before0100B100; zero-length vectors are retained.
export function nativeRadarDirection(raw){
 const v=vector(raw,'direction');v[1]=0;
 const length=f(Math.sqrt(squared(v)));
 if(length!==0){const inverse=f(1/length);return v.map(x=>f(x*inverse));}
 return v;
}

// 0100E660: cross(direction,target), then0100B180's acos(dot/(len*len)).
// That helper returns0 on NaN; it does not clamp cosine to[-1,1]. JS libm
// transcendental rounding has not been compared with the native CRT/D3DX.
export function nativeRadarRotationAxisAngle(direction){
 const d=vector(direction,'prepared direction');
 if(d[2]>NATIVE_RADAR_ROTATION_SOURCE.thresholdZ)return {axis:[0,1,0],angle:NATIVE_RADAR_ROTATION_SOURCE.pi,branch:'antiparallel'};
 const t=[0,0,-1];
 const axis=[f(f(d[1]*t[2])-f(d[2]*t[1])),f(f(d[2]*t[0])-f(d[0]*t[2])),f(f(d[0]*t[1])-f(d[1]*t[0]))];
 const dot=f(f(f(d[0]*t[0])+f(d[1]*t[1]))+f(d[2]*t[2]));
 const denominator=f(f(Math.sqrt(squared(d)))*f(Math.sqrt(squared(t))));
 const angle=f(Math.acos(f(dot/denominator)));
 return {axis,angle:Number.isNaN(angle)?0:angle,branch:'between-vectors'};
}

//008EF740 excludes strictly outside a 3D sphere. Equality is inside, and
// altitude contributes; no clamping to a circle or nearest map boundary.
export function nativeRadarRangeExcludes({center,point,radius}){
 const c=vector(center,'center'),p=vector(point,'point'),r=scalar(radius,'radius');
 if(r<0)throw RangeError('Nonnegative source radius required');
 const delta=c.map((x,i)=>f(x-p[i]));
 return squared(delta)>f(r*r);
}

//008EC960 before quaternion rotation: full-image UV center and half-crop.
export function nativeRadarUvWindow({center,bounds,radius}){
 const c=vector(center,'center'),r=scalar(radius,'radius');
 if(!bounds||r<=0)throw TypeError('Explicit bounds and positive source radius required');
 const left=scalar(bounds.left,'left'),right=scalar(bounds.right,'right'),top=scalar(bounds.top,'top'),bottom=scalar(bounds.bottom,'bottom');
 const width=f(right-left),height=f(top-bottom);
 if(width<=0||height<=0)throw RangeError('Ordered source map bounds required');
 return {center:[f(f(c[0]-left)/width),f(f(-c[2]+top)/height)],halfExtent:[f(r/width),f(r/height)]};
}

// Local d3dx9_29 scalar table610170: QuaternionRotationAxis=442597,
// Vec3Normalize=4438C4, MatrixRotationQuaternion=441700 and
// Vec3TransformCoord=443AA8. D0 is flattened, so cross(D0,-Z) has only Y.
// Preserve its quaternion/matrix route, including float stores and the
// normalizer's near-unit shortcut. JS libm/x87/SIMD bit parity is not certified.
function sourceRadarYRotation(rawDirection){
 const prepared=nativeRadarDirection(rawDirection),{axis,angle}=nativeRadarRotationAxisAngle(prepared);
 const lengthSquared=f(axis[0]*axis[0]+axis[1]*axis[1]+axis[2]*axis[2]);
 const epsilon=2**-23,minimumNormal=2**-126;
 let axisY=axis[1];
 if(Math.abs(lengthSquared-1)>epsilon)axisY=lengthSquared>minimumNormal?f(axisY/Math.sqrt(lengthSquared)):0;
 const half=f(angle*.5),qy=f(axisY*f(Math.sin(half))),qw=f(Math.cos(half));
 const twiceY=f(2*qy),yy=f(twiceY*qy);
 return {cosine:f(1-yy),sine:f(twiceY*qw)};
}

//008EC960: transform the four source offsets with the quaternion matrix whose
// native translation slots12/14 contain UV center. Its triangle strip emits
// BL,TL,BR,TR; return the renderer's TL,BL,BR,TR order after matching each UV
// to the actual position and mask UV emitted in that source vertex.
export function nativeRadarUvCorners({center,bounds,radius,direction}){
 const window=nativeRadarUvWindow({center,bounds,radius}),{cosine:c,sine:s}=sourceRadarYRotation(direction);
 const [u,v]=window.center,[du,dv]=window.halfExtent;
 return [[du,dv],[du,-dv],[-du,-dv],[-du,dv]].map(([x,z])=>[
  f(x*c+z*s+u),f(x*(-s)+z*c+v),
 ]);
}

// Canonical map66, bginfo-station-2.ini. This is the original Station2 world,
// not station2-modular (which also advertises66 despite editable transforms).
export const NATIVE_RADAR_STATION2_CLASSIC=Object.freeze({
 bounds:Object.freeze({left:-10000,right:10000,top:10000,bottom:-10000}),radius:4000,
});

// Native11FD570 publishes D0 as the view-Z covector; its projection100DDF0
// imports D3DXMatrixPerspectiveFovLH (positive view Z is forward). Three's
// actual camera looks along negative local Z. Inverting the Classic world
// scale(.006,.006,-.006) therefore gives [-back.x,-back.y,+back.z].
// Call AFTER this frame's camera update/director/clearance. Refresh its world
// matrix here: sampling a stale matrix or the desired yaw would differ under
// cinematic slerp, free camera or QA lookAt. No native frame-lag is invented.
export function nativeRadarStation2ClassicFrame({sceneKey,camera,centerS5}){
 if(sceneKey!=='station2')throw TypeError('The canonical Station2 Classic scene is required');
 if(!camera?.isPerspectiveCamera||camera.parent||typeof camera.updateWorldMatrix!=='function'||camera.scale?.x!==1||camera.scale?.y!==1||camera.scale?.z!==1)throw TypeError('The actual unparented, unscaled S5 perspective camera is required');
 if(!Array.isArray(centerS5)||centerS5.length!==3||!centerS5.every(Number.isFinite))throw TypeError('Explicit finite S5 subject XYZ required');
 const p=centerS5;
 camera.updateWorldMatrix(true,false);
 const elements=camera.matrixWorld?.elements;
 if(!elements||elements.length!==16||![...elements].every(Number.isFinite))throw TypeError('Finite actual camera world matrix required');
 const centerPoint=nativeMapPoint({x:p[0],y:p[1],z:p[2]},true);
 const centerNative=vector([centerPoint.x,centerPoint.y,centerPoint.z],'native subject position');
 const directionNative=[scalar(-elements[8],'native direction.x'),scalar(-elements[9],'native direction.y'),scalar(elements[10],'native direction.z')];
 return {centerNative,directionNative,uvCorners:nativeRadarUvCorners({center:centerNative,direction:directionNative,...NATIVE_RADAR_STATION2_CLASSIC})};
}

//008EF7F0 input to the source quaternion/matrix transform.
export function nativeRadarRelativePoint({center,point,radius}){
 const c=vector(center,'center'),p=vector(point,'point'),r=scalar(radius,'radius');
 if(r<=0)throw RangeError('Positive source radius required');
 const inverse=f(1/r);return c.map((x,i)=>f(f(x-p[i])*inverse));
}

//008EF7F0 screen stage AFTER the source D3DX transform. Requiring the actual
// transformed XYZ explicitly avoids manufacturing a direction or matrix.
export function nativeRadarScreenPoint({transformed,rect}){
 const q=vector(transformed,'transformed point');if(!rect)throw TypeError('Explicit screen rectangle required');
 const left=scalar(rect.left,'rect.left'),top=scalar(rect.top,'rect.top'),width=scalar(rect.width,'rect.width'),height=scalar(rect.height,'rect.height');
 if(width<=0||height<=0)throw RangeError('Positive source screen dimensions required');
 return [f(f(f(f(q[0]*width)*.5)+left)+f(width*.5)),f(f(f(f(-q[2]*height)*.5)+top)+f(height*.5))];
}

//008EF740 then008EF7F0: the same source axis/quaternion rotation used by the
// map crop also transforms center-point before projecting the marker. The
// range gate includes altitude; an excluded point is not clamped to an edge.
export function nativeRadarProjectPoint({center,point,direction,radius,rect}){
 if(nativeRadarRangeExcludes({center,point,radius}))return {rangeExcluded:true,screen:null};
 const q=nativeRadarRelativePoint({center,point,radius}),{cosine:c,sine:s}=sourceRadarYRotation(direction);
 const transformed=[f(q[0]*c+q[2]*s),q[1],f(-q[0]*s+q[2]*c)];
 return {rangeExcluded:false,screen:nativeRadarScreenPoint({transformed,rect})};
}
