import * as THREE from 'three';

// Apply the explicit SCN billboard flag only to Iron Heart's render meshes.
// Its plates are authored in XZ with a -90deg X transform: retain that basis
// in camera space rather than discarding it as if their vertices were XY.
export function bindIronHeartBillboards(world){
 if(world?.nativeMapId!==151||!Array.isArray(world.sourceMeshes))throw Error('Actual Iron Heart world required');
 const collision=new Set([...world.movementMeshes,...world.weaponCollisionMeshes]);
 const entries=[],ownedMaterials=new Map();
 for(const mesh of world.sourceMeshes){
  const source=world.sourceData.scenes[mesh.userData.sourceSceneIndex]?.models[mesh.userData.sourceModelIndex];
  if(!(source?.renderState&16)||!mesh.visible)continue;
  if(collision.has(mesh))throw Error('Iron Heart billboard cannot own static collision');
  const originalMaterials=mesh.material;
  // The source has clockwise front faces and separately authored reverse-U
  // back glyphs. With the retained XZ basis Three must draw the original face,
  // otherwise the camera-facing plate displays the reversed back glyph.
  const materialFor=original=>{
   if(!ownedMaterials.has(original)){const material=original.clone();material.side=THREE.BackSide;ownedMaterials.set(original,material);}
   return ownedMaterials.get(original);
  };
  mesh.material=Array.isArray(originalMaterials)?originalMaterials.map(materialFor):materialFor(originalMaterials);
  entries.push({mesh,initialMatrix:mesh.matrix.clone(),originalMaterials});
 }
 const cameraQ=new THREE.Quaternion(),sourceQ=new THREE.Quaternion(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),billboardWorld=new THREE.Matrix4(),inverseParent=new THREE.Matrix4();
 let disposed=false;
 return {count:entries.length,
  update(camera){
   if(disposed)return false;if(!camera?.isCamera)throw Error('Actual render camera required for Iron Heart billboards');
   camera.getWorldQuaternion(cameraQ);
   for(const {mesh}of entries){
    mesh.parent.updateWorldMatrix(true,false);
    mesh.parent.matrixWorld.decompose(position,sourceQ,scale);
    rotation.copy(cameraQ).multiply(sourceQ);
    billboardWorld.compose(position,rotation,scale);
    mesh.matrix.copy(inverseParent.copy(mesh.parent.matrixWorld).invert()).multiply(billboardWorld);
    mesh.updateWorldMatrix(false,false);
   }
   return true;
  },
  dispose(){if(disposed)return;disposed=true;for(const {mesh,initialMatrix,originalMaterials}of entries){mesh.matrix.copy(initialMatrix);mesh.material=originalMaterials;mesh.updateWorldMatrix(false,false);}for(const material of ownedMaterials.values())material.dispose();}
 };
}
