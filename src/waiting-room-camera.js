import {Vector3} from 'three';
import {CameraClearance,CAMERA_BODY_ANCHOR,cameraNearExtent} from './camera-clearance.js';

// Preserve the room's existing free-view composition. Collision clearance is
// an S5 presentation policy; the native standby camera sweep is not certified.
export const ROOM_CAMERA=Object.freeze({height:1.2,closeHeight:2.1,distance:4.2,clearance:.18});

export class WaitingRoomCamera{
 constructor(){this.target=new Vector3();this.offset=new Vector3();this.lift=new Vector3();this.viewDirection=new Vector3();this.bodyAnchor=new Vector3();this.clearance=new CameraClearance();this.obstructed=false;this.distance=ROOM_CAMERA.distance;}
 update(camera,player,yaw,pitch,collision){
  this.bodyAnchor.set(player.x,player.y+CAMERA_BODY_ANCHOR,player.z);
  this.target.set(player.x,player.y+ROOM_CAMERA.height,player.z);
  this.clearance.clip(collision,this.bodyAnchor,this.target,ROOM_CAMERA.clearance);
  this.offset.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(ROOM_CAMERA.distance);
  this.viewDirection.copy(this.offset).normalize().negate();
  let hit=collision.raycast(this.target,this.offset);
  if(hit){
   // A close camera at the free-view waist anchor would enter the torso.
   // Lift toward the gameplay head framing as clearance shrinks, while
   // retaining yaw/pitch. Check the lift itself against a possible ceiling.
   const freeDistance=Math.max(0,this.target.distanceTo(hit.point)-ROOM_CAMERA.clearance);
   this.lift.set(0,(ROOM_CAMERA.closeHeight-ROOM_CAMERA.height)*Math.max(0,1-freeDistance/ROOM_CAMERA.distance),0);
   const ceiling=collision.raycast(this.target,this.lift);
   if(ceiling)this.lift.y=Math.max(0,this.target.distanceTo(ceiling.point)-ROOM_CAMERA.clearance);
   this.target.add(this.lift);
   hit=collision.raycast(this.target,this.offset);
  }
  this.distance=hit?Math.max(0,this.target.distanceTo(hit.point)-ROOM_CAMERA.clearance):ROOM_CAMERA.distance;
  this.obstructed=this.distance<ROOM_CAMERA.distance;
  if(this.obstructed)this.offset.setLength(this.distance);
  camera.position.copy(this.target).add(this.offset);
  camera.rotation.set(-pitch,yaw,0,'YXZ');
  this.clearance.detectCeiling(collision,this.bodyAnchor,Math.max(player.y+ROOM_CAMERA.closeHeight,camera.position.y)+cameraNearExtent(camera));
  this.clearance.constrain(camera,collision,this.bodyAnchor);
  this.distance=camera.position.distanceTo(this.target);
  this.obstructed=this.distance<ROOM_CAMERA.distance-1e-9;
 }
 snapshot(camera){return {position:camera.position.toArray(),target:this.target.toArray(),distance:this.distance,obstructed:this.obstructed,nativeCompared:false};}
}
