import {Box3,Matrix4,Raycaster,Vector3} from 'three';
import {CameraTriangleIndex} from './camera-triangle-index.js';
import {configureCameraQueryCache,memoCameraRaycast,readCameraQueryCache} from './camera-query-cache.js';

// Camera collision is presentation policy. Use an origin inside the actor's
// body, rather than a framing target that can already be above a low ceiling.
export const CAMERA_BODY_ANCHOR=1;
export const CAMERA_CLEARANCE=.18;
export const cameraNearExtent=camera=>{
 const near=Math.max(0,camera.near??.1),halfHeight=near*Math.tan((camera.fov??50)*Math.PI/360)/(camera.zoom||1);
 return Math.hypot(near,halfHeight,halfHeight*(camera.aspect||1));
};

// Render meshes may use either face winding. Query both directions without
// modifying their materials; convert the reverse hits back to forward distance.
export class CameraMeshQuery{
 constructor({cacheCameraReads=true}={}){this.ray=new Raycaster();this.end=new Vector3();this.direction=new Vector3();this.boxPoint=new Vector3();this.bounds=new WeakMap();this.entries=[];this.triangleIndex=new CameraTriangleIndex();configureCameraQueryCache(this,cacheCameraReads);}
 prepare(meshes){
  this.meshes=meshes;this.entries.length=0;
  for(const mesh of meshes){
   mesh.updateWorldMatrix(true,false);
   let bounds=this.bounds.get(mesh);
   if(!bounds){bounds={matrix:new Matrix4(),box:new Box3(),ready:false};this.bounds.set(mesh,bounds);}
   const geometry=mesh.geometry;
   if(geometry&&!mesh.isSkinnedMesh){
    if(!geometry.boundingBox)geometry.computeBoundingBox();
    if(!bounds.ready||bounds.geometry!==geometry||!bounds.matrix.equals(mesh.matrixWorld)){
     bounds.box.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld);bounds.matrix.copy(mesh.matrixWorld);bounds.geometry=geometry;bounds.ready=true;
    }
   }else bounds.ready=false;
   this.entries.push({mesh,box:bounds.ready?bounds.box:null});
  }
 }
 readCacheStats(){return readCameraQueryCache(this);}
 raycast(origin,delta){return memoCameraRaycast(this,raycastCameraMesh,origin,delta);}
}
function raycastCameraMesh(origin,delta){
  const length=delta.length();if(length<1e-9||!this.meshes?.length)return null;
  this.direction.copy(delta).divideScalar(length);this.ray.set(origin,this.direction);this.ray.far=length;
  const candidates=[];
  for(const {mesh,box} of this.entries){
   if(!box||box.containsPoint(origin)||(this.ray.ray.intersectBox(box,this.boxPoint)&&this.boxPoint.distanceToSquared(origin)<=length*length+1e-8))candidates.push(mesh);
  }
  if(!candidates.length)return null;
  let best=this.triangleIndex.intersectObjects(this.ray,candidates)[0]??null;
  this.end.copy(origin).add(delta);this.ray.set(this.end,this.direction.negate());
  for(const hit of this.triangleIndex.intersectObjects(this.ray,candidates)){
   const distance=length-hit.distance;
   if(distance>1e-7&&(!best||distance<best.distance))best={...hit,distance};
  }
  if(best){best.normal=best.face.normal.clone().transformDirection(best.object.matrixWorld);if(best.normal.dot(delta)>0)best.normal.negate();}
  return best;
}

// The center ray retains a small collision skin. Four additional rays protect
// the actual near-plane corners, including a wide viewport or a pitched view.
// Their origins share the safe body anchor, so a roof cannot hide behind an
// already-penetrating framing target. No simulation position or view is changed.
export class CameraClearance{
 constructor(){this.delta=new Vector3();this.origin=new Vector3();this.forward=new Vector3();this.right=new Vector3();this.up=new Vector3();this.offset=new Vector3();this.ceiling=null;}
 detectCeiling(query,bodyOrigin,height){
  this.delta.set(0,Math.max(0,height-bodyOrigin.y),0);
  const hit=query.raycast(bodyOrigin,this.delta);
  this.ceiling=hit?.normal.y<-.5?{point:hit.point.clone(),normal:hit.normal.clone()}:null;
 }
 limitCeiling(destination){
  if(!this.ceiling)return;
  const {point,normal}=this.ceiling;
  let minimum=this.origin.copy(destination).sub(point).dot(normal);
  for(const x of [-1,1])for(const y of [-1,1]){
   this.origin.copy(destination).add(this.forward).addScaledVector(this.right,x).addScaledVector(this.up,y).sub(point);
   minimum=Math.min(minimum,this.origin.dot(normal));
  }
  if(minimum<.02)destination.addScaledVector(normal,.02-minimum);
 }
 clip(query,origin,destination,clearance=CAMERA_CLEARANCE){
  this.delta.copy(destination).sub(origin);const length=this.delta.length();if(length<1e-9)return destination;
  const hit=query.raycast(origin,this.delta);if(!hit)return destination;
  const distance=hit.point.distanceTo(origin);
  return destination.copy(origin).addScaledVector(this.delta,Math.max(0,distance-clearance)/length);
 }
 constrain(camera,query,bodyOrigin,destination=camera.position){
  const near=Math.max(0,camera.near??.1),halfHeight=near*Math.tan((camera.fov??50)*Math.PI/360)/(camera.zoom||1),halfWidth=halfHeight*(camera.aspect||1);
  this.forward.set(0,0,-1).applyQuaternion(camera.quaternion).multiplyScalar(near);
  this.right.set(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(halfWidth);
  this.up.set(0,1,0).applyQuaternion(camera.quaternion).multiplyScalar(halfHeight);
  // A finite roof can end before the orbit reaches its height. Keep the camera
  // on the body's side of its plane while that roof remains above the actor,
  // even if the boom endpoint lies beyond the roof's horizontal boundary.
  this.limitCeiling(destination);
  this.delta.copy(destination).sub(bodyOrigin);const length=this.delta.length();if(length<1e-9)return destination;
  let fraction=1;
  const center=query.raycast(bodyOrigin,this.delta);
  if(center)fraction=Math.min(fraction,Math.max(0,center.point.distanceTo(bodyOrigin)-CAMERA_CLEARANCE)/length);
  for(const x of [-1,1])for(const y of [-1,1]){
   this.offset.copy(this.forward).addScaledVector(this.right,x).addScaledVector(this.up,y);
   this.origin.copy(bodyOrigin).add(this.offset);
   const hit=query.raycast(this.origin,this.delta);
   if(hit)fraction=Math.min(fraction,Math.max(0,hit.point.distanceTo(this.origin)-.02)/length);
  }
  destination.copy(bodyOrigin).addScaledVector(this.delta,fraction);
  // At very close walls an offset ray can itself start beyond the surface.
  // Check the corners from the final camera center too, and move along the
  // contact normal so the near plane stays in the player's visible space.
  for(let pass=0;pass<3;pass++){
   let corrected=false;
   for(const x of [-1,1])for(const y of [-1,1]){
    this.offset.copy(this.forward).addScaledVector(this.right,x).addScaledVector(this.up,y);
    const hit=query.raycast(destination,this.offset);if(!hit)continue;
    this.origin.copy(destination).add(this.offset).sub(hit.point);
    const penetration=-this.origin.dot(hit.normal)+.02;
    if(penetration>0){destination.addScaledVector(hit.normal,penetration);corrected=true;}
   }
   this.limitCeiling(destination);
   if(!corrected)break;
  }
  return destination;
 }
}
