import {Vector3,Vector4,Matrix4,Mesh} from 'three';

// Portable edition's support placement, restored after user feedback about
// the starting position. Sample after the mixer evaluates the current pose.
// Presentation-only correction for the prototype's collider/rig mismatch.
// Not recovered S4 logic, not IK, and never fed into controller or camera.
export const WALL_POSE_SETTINGS=Object.freeze({clearance:.015,maxOffset:.75,releaseSeconds:.045,effectContactDepth:.04});
export class WallPoseContact {
  constructor(root,rig){
    this.root=root;this.rig=rig;this.base=rig.position.clone();this.offset=new Vector3();
    this.vertex=new Vector3();this.normal=new Vector3();this.local=new Vector3();this.inverse=new Matrix4();
    this.bindVertex=new Vector4();this.weightedVertex=new Vector4();
    this.samples=[];this.effectVertices=[];
    rig.traverse(mesh=>{
      if(!mesh.isSkinnedMesh||!mesh.visible)return;
      const {skinIndex,skinWeight}=mesh.geometry.attributes;
      if(!skinIndex||!skinWeight)return;
      const feet=new Set(mesh.skeleton.bones.flatMap((bone,i)=>/Bip01 [LR] (Foot|Toe)/.test(bone.name)?[i]:[]));
      const indices=[];
      for(let i=0;i<skinIndex.count;i++){
        let weight=0;
        for(let j=0;j<4;j++)if(feet.has(skinIndex.getComponent(i,j)))weight+=skinWeight.getComponent(i,j);
        if(weight>=.5)indices.push(i);
      }
      if(indices.length){
        // Three's per-vertex skinning multiplies boneWorld * boneInverse for
        // every influence. Dense shoes repeat those same matrix products
        // thousands of times per wall-contact tick. Retain scratch palettes,
        // refreshed from the evaluated pose before each sampling pass.
        const palette=mesh.skeleton.bones.map(()=>new Matrix4());
        this.samples.push({mesh,indices,palette});for(const i of indices)this.effectVertices.push(new Vector3());
      }
    });
  }
  clear(){this.offset.set(0,0,0);this.rig.position.copy(this.base);}
  preparePalette({mesh,palette}){
    const {bones,boneInverses}=mesh.skeleton;
    for(let i=0;i<bones.length;i++)palette[i].multiplyMatrices(bones[i].matrixWorld,boneInverses[i]);
  }
  sampleVertex({mesh,palette},index,target){
    // Keep Three's morph-target evaluation and exact four-weight/bind-space
    // order. Only the repeated matrix products and spread allocations move
    // out of the vertex loop; no shoe vertices are dropped or approximated.
    Mesh.prototype.getVertexPosition.call(mesh,index,target);
    const base=this.bindVertex.set(target.x,target.y,target.z,1).applyMatrix4(mesh.bindMatrix);
    const {skinIndex,skinWeight}=mesh.geometry.attributes;target.set(0,0,0);
    for(let j=0;j<4;j++){
      const weight=skinWeight.getComponent(index,j);
      if(weight!==0)target.addScaledVector(this.weightedVertex.copy(base).applyMatrix4(palette[skinIndex.getComponent(index,j)]),weight);
    }
    return target.applyMatrix4(mesh.bindMatrixInverse).applyMatrix4(mesh.matrixWorld);
  }
  clearance(point,normal){
    this.root.updateMatrixWorld(true);
    let minimum=Infinity;
    for(const sample of this.samples){
      this.preparePalette(sample);
      for(const i of sample.indices){
        this.sampleVertex(sample,i,this.vertex);
        minimum=Math.min(minimum,this.vertex.sub(point).dot(normal));
      }
    }
    return minimum;
  }
  effectContact(contact){
    if(!contact||!this.samples.length)return contact;
    // The ellipsoid hit is clamped to the mesh edge, not to the animated feet.
    // Project the contacting part of the shoes onto that wall's plane without
    // clamping back to the edge. Never mutate the physics/pose contact.
    this.root.updateMatrixWorld(true);
    const normal=new Vector3().copy(contact.normal).normalize();
    const plane=normal.dot(contact.point);let minimum=Infinity,index=0;
    for(const sample of this.samples){
      this.preparePalette(sample);
      for(const i of sample.indices){
        const p=this.sampleVertex(sample,i,this.effectVertices[index++]);
        minimum=Math.min(minimum,p.dot(normal)-plane);
      }
    }
    const point=new Vector3();let count=0;
    for(const p of this.effectVertices)if(p.dot(normal)-plane<=minimum+WALL_POSE_SETTINGS.effectContactDepth){point.add(p);count++;}
    point.multiplyScalar(1/count);
    point.addScaledVector(normal,plane-point.dot(normal));
    return {point,normal};
  }
  update(dt,controller){
    if(controller.events?.includes('respawn'))this.clear();
    // Sample the uncorrected authoritative pose, never last frame's offset.
    this.rig.position.copy(this.base);
    const contact=controller.wallContact;
    if(controller.wallAction?.phase!=='prepare'&&this.offset.lengthSq()===0)return;
    if(controller.wallAction?.phase==='prepare'&&contact&&this.samples.length){
      this.normal.copy(contact.normal).normalize();
      const distance=this.clearance(contact.point,this.normal);
      const amount=Math.min(WALL_POSE_SETTINGS.maxOffset,Math.max(0,WALL_POSE_SETTINGS.clearance-distance));
      this.offset.copy(this.normal).multiplyScalar(amount);
    }else if(dt>0){
      this.offset.multiplyScalar(Math.exp(-dt/WALL_POSE_SETTINGS.releaseSeconds));
      if(this.offset.lengthSq()<1e-10)this.offset.set(0,0,0);
    }
    // Keep the release direction in world space even if the mouse turns 360°.
    // Matrix conversion also preserves correctness for a scaled avatar parent.
    this.root.updateMatrixWorld(true);
    this.inverse.copy(this.root.matrixWorld).invert();
    this.local.copy(this.offset).add(this.root.getWorldPosition(this.vertex)).applyMatrix4(this.inverse);
    this.rig.position.copy(this.base).add(this.local);
    this.root.updateMatrixWorld(true);
  }
}
