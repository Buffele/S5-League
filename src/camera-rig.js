import {Vector3} from 'three';
import {CameraClearance,CameraMeshQuery,CAMERA_BODY_ANCHOR,cameraNearExtent} from './camera-clearance.js';
import {refreshCameraQueryReadPhase,runCameraQueryReadPhase} from './camera-query-cache.js';
// S5Runtime CFPSCamera, read-only observation of PID 30244: side=50,
// height=350, depth=500. Convert native distances using SCN scale .006.
export const CAMERA_FRAMING=Object.freeze({shoulder:.30,aimHeight:2.10,distance:3.00});

// Obstacles may shorten or shift the camera offset, but must not rotate the
// view selected by mouse yaw/pitch. Preserve that direction before both sweeps.
export class ThirdPersonCamera {
  constructor(options){this.target=new Vector3();this.desired=new Vector3();this.direction=new Vector3();this.viewDirection=new Vector3();this.anchor=new Vector3();this.bodyAnchor=new Vector3();this.query=new CameraMeshQuery(options);this.clearance=new CameraClearance();}
  update(camera,player,yaw,pitch,distance,obstacles=[]){
    this.query.prepare(obstacles);
    return runCameraQueryReadPhase(this.query,()=>this.#updatePrepared(camera,player,yaw,pitch,distance),{camera,player,inputs:['update',yaw,pitch,distance]});
  }
  #updatePrepared(camera,player,yaw,pitch,distance){
    this.bodyAnchor.set(player.x,player.y+CAMERA_BODY_ANCHOR,player.z);
    const shoulderX=Math.cos(yaw)*CAMERA_FRAMING.shoulder,shoulderZ=-Math.sin(yaw)*CAMERA_FRAMING.shoulder;
    this.anchor.set(player.x,player.y+CAMERA_FRAMING.aimHeight,player.z);
    this.clearance.clip(this.query,this.bodyAnchor,this.anchor);
    this.target.copy(this.anchor).add(new Vector3(shoulderX,0,shoulderZ));
    this.clearance.clip(this.query,this.anchor,this.target);
    const shoulderFraction=Math.max(.02,this.target.distanceTo(this.anchor)/CAMERA_FRAMING.shoulder);
    this.direction.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    this.viewDirection.copy(this.direction).negate();
    this.desired.copy(this.target).addScaledVector(this.direction,distance*shoulderFraction);
    this.clearance.clip(this.query,this.target,this.desired);
    // The lower unshifted probe also catches low cover that would obscure the
    // player. Its hit shortens the offset; it is not the camera's framing anchor.
    this.anchor.set(player.x,player.y+1.35,player.z);
    this.direction.copy(this.desired).sub(this.anchor);
    const shoulderHit=this.query.raycast(this.anchor,this.direction);
    if(shoulderHit){
      const fraction=Math.max(.02,shoulderHit.distance-.18)/this.direction.length();
      // Keep the probe's horizontal clearance, but interpolate from the same
      // source height as the unobstructed camera rather than into the torso.
      this.anchor.y=this.target.y;
      this.desired.lerpVectors(this.anchor,this.desired,fraction);
    }
    camera.position.copy(this.desired);
    // Preserve the selected orbit through the poles instead of lookAt's
    // world-up singularity, which flips the camera beyond a vertical view.
    camera.rotation.set(-pitch,yaw,0,'YXZ');
    refreshCameraQueryReadPhase(this.query);
    this.clearance.detectCeiling(this.query,this.bodyAnchor,Math.max(player.y+CAMERA_FRAMING.aimHeight,camera.position.y)+cameraNearExtent(camera));
    this.clearance.constrain(camera,this.query,this.bodyAnchor);
  }
  // Also constrain after cinematic interpolation or shake. These presentation
  // offsets must not undo collision clearance computed by update().
  constrain(camera,player,obstacles=[]){
    if(this.query.meshes!==obstacles)this.query.prepare(obstacles);
    return runCameraQueryReadPhase(this.query,()=>this.#constrainPrepared(camera,player),{camera,player,inputs:['constrain',...camera.position.toArray(),...camera.quaternion.toArray()]});
  }
  #constrainPrepared(camera,player){
    this.bodyAnchor.set(player.x,player.y+CAMERA_BODY_ANCHOR,player.z);
    this.clearance.detectCeiling(this.query,this.bodyAnchor,Math.max(player.y+CAMERA_FRAMING.aimHeight,camera.position.y)+cameraNearExtent(camera));
    this.clearance.constrain(camera,this.query,this.bodyAnchor);
  }
}
