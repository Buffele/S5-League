// Source7B0180 centers its ellipsoid at P+offset and scales by radii. The
// bottom point follows geometry, without reading OBB/model-root coordinates.
// This helper does not authenticate pointers, getters or live body settings.
export function nativeEllipsoidFeet({positionNative,offsetNative,radiiNative}={}){
 const f=Math.fround,valid=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Number.isFinite(f(n)));
 if(![positionNative,offsetNative,radiiNative].every(valid)||!radiiNative.every(n=>f(n)>0))throw new TypeError('Explicit finite source position/offset and positive radii required');
 const p=positionNative.map(f),o=offsetNative.map(f),r=radiiNative.map(f),centerNative=p.map((v,i)=>f(v+o[i]));
 if(!centerNative.every(Number.isFinite))throw new RangeError('Native ellipsoid center overflows');
 const rawPositionIsBaseAnchor=o[0]===0&&o[2]===0&&o[1]===r[1];
 const feetNative=rawPositionIsBaseAnchor?[...p]:[centerNative[0],f(centerNative[1]-r[1]),centerNative[2]];
 if(!feetNative.every(Number.isFinite))throw new RangeError('Native foot point overflows');
 return {feetNative,centerNative,rawPositionIsBaseAnchor,nativeReady:false,qualification:'Source geometry only; live position/offset/radii and coordinate transform must be independently verified'};
}
