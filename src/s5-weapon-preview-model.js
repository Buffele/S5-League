import * as THREE from 'three';

const invalid=()=>new Error('Weapon preview requires finite, positive weapon bounds');
const drawable=node=>node.isMesh&&node.userData.weapon===true;

/** Capture an already evaluated idle pose without cloning the avatar hierarchy.
 * Only weapon resources are copied. Texture images/samplers remain read-only,
 * source-owned resources; neither this capture nor a model disposes them.
 */
export function captureS5WeaponPreviewPose(source){
 if(!source?.isObject3D)throw new TypeError('Weapon preview requires an avatar Object3D');
 const records=[],indices=new Map(),geometries=new Map(),materials=new Map();
 let disposed=false;
 const ownGeometry=value=>{if(!geometries.has(value))geometries.set(value,value.clone());return geometries.get(value);};
 const ownMaterial=value=>{if(!value?.isMaterial)throw invalid();if(!materials.has(value))materials.set(value,value.clone());return materials.get(value);};
 const release=()=>{for(const value of geometries.values())value.dispose();for(const value of materials.values())value.dispose();};
 function visit(node,parent=-1,parentVisible=true){
  const index=records.length,visible=parentVisible&&node.visible;
  indices.set(node,index);
  const matrix=node.matrixAutoUpdate?new THREE.Matrix4().compose(node.position,node.quaternion,node.scale):node.matrix.clone();
  const record={parent,name:node.name,bone:!!node.isBone,group:!!node.isGroup,renderable:!!(node.isMesh||node.isLine||node.isPoints||node.isSprite||node.isLight),
   position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone(),matrix,
   visible:node.visible,layers:node.layers.mask,renderOrder:node.renderOrder,weapon:false};
  records.push(record);
  if(drawable(node)&&visible){
   if(node.isInstancedMesh||!node.geometry?.getAttribute('position'))throw invalid();
   record.weapon=true;record.geometry=ownGeometry(node.geometry);
   record.material=Array.isArray(node.material)?node.material.map(ownMaterial):ownMaterial(node.material);
   record.morph=node.morphTargetInfluences?.slice();
   if(node.isSkinnedMesh){
    record.skin={source:node.skeleton,bindMode:node.bindMode,bindMatrix:node.bindMatrix.clone(),
     inverses:node.skeleton.boneInverses.map(matrix=>matrix.clone())};
   }
  }
  for(const child of node.children)visit(child,index,visible);
 }
 try{
  visit(source);
  if(!records.some(record=>record.weapon))throw invalid();
  for(const record of records)if(record.skin){
   record.skin.bones=record.skin.source.bones.map(bone=>{
    const index=indices.get(bone);if(index===undefined)throw Error('Weapon preview bones must belong to the avatar hierarchy');return index;
   });
   delete record.skin.source;
  }
 }catch(error){release();throw error;}

 function createModel(){
  if(disposed)throw Error('Weapon preview capture has been disposed');
  const ownedGeometries=new Map(),ownedMaterials=new Map(),skeletons=new Set(),weapons=[];
  const geometry=value=>{if(!ownedGeometries.has(value))ownedGeometries.set(value,value.clone());return ownedGeometries.get(value);};
  const material=value=>{if(!ownedMaterials.has(value))ownedMaterials.set(value,value.clone());return ownedMaterials.get(value);};
  let root,modelDisposed=false;
  const dispose=()=>{if(modelDisposed)return;modelDisposed=true;root?.removeFromParent();for(const value of skeletons)value.dispose();for(const value of ownedGeometries.values())value.dispose();for(const value of ownedMaterials.values())value.dispose();};
  try{
   const nodes=records.map(record=>{
    const node=record.weapon?(record.skin?new THREE.SkinnedMesh(geometry(record.geometry),Array.isArray(record.material)?record.material.map(material):material(record.material)):new THREE.Mesh(geometry(record.geometry),Array.isArray(record.material)?record.material.map(material):material(record.material))):record.bone?new THREE.Bone():record.group?new THREE.Group():new THREE.Object3D();
    node.name=record.name;node.position.copy(record.position);node.quaternion.copy(record.quaternion);node.scale.copy(record.scale);node.matrix.copy(record.matrix);node.matrixAutoUpdate=false;
    // Non-rendering placeholders retain the rig ancestry without body, FX or helper geometry.
    node.visible=record.weapon||!record.renderable?record.visible:false;
    node.layers.mask=record.layers;node.renderOrder=record.renderOrder;
    if(record.weapon){node.userData.weapon=true;node.frustumCulled=false;if(record.morph)node.morphTargetInfluences.splice(0,node.morphTargetInfluences.length,...record.morph);weapons.push(node);}
    return node;
   });
   root=nodes[0];root.visible=true;root.position.set(0,0,0);root.quaternion.identity();root.updateMatrix();
   records.forEach((record,index)=>{if(record.parent>=0)nodes[record.parent].add(nodes[index]);});
   records.forEach((record,index)=>{if(record.skin){
    const skeleton=new THREE.Skeleton(record.skin.bones.map(index=>nodes[index]),record.skin.inverses.map(matrix=>matrix.clone()));skeletons.add(skeleton);
    const mesh=nodes[index];mesh.skeleton=skeleton;mesh.bindMode=record.skin.bindMode;mesh.bindMatrix.copy(record.skin.bindMatrix);
   }});
   root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();
   const box=new THREE.Box3(),vertex=new THREE.Vector3();
   for(const mesh of weapons){
    // Evaluate vertices, not the body's bounds or the unposed skin geometry.
    // This also includes morphs and does not populate any source bounds cache.
    const count=mesh.geometry.getAttribute('position').count;
    for(let index=0;index<count;index++){
     mesh.getVertexPosition(index,vertex).applyMatrix4(mesh.matrixWorld);
     if(!Number.isFinite(vertex.x)||!Number.isFinite(vertex.y)||!Number.isFinite(vertex.z))throw invalid();box.expandByPoint(vertex);
    }
   }
   const size=box.getSize(new THREE.Vector3());
   if(box.isEmpty()||!box.min.toArray().every(Number.isFinite)||!box.max.toArray().every(Number.isFinite)||!size.toArray().every(Number.isFinite)||!(size.lengthSq()>0))throw invalid();
   return {root,bounds(){if(modelDisposed)throw Error('Weapon preview model has been disposed');return box.clone();},dispose};
  }catch(error){dispose();throw error;}
 }
 return Object.freeze({createModel,dispose(){if(disposed)return;disposed=true;release();records.length=0;indices.clear();geometries.clear();materials.clear();},
  counts:Object.freeze({poseNodes:records.length,weaponMeshes:records.filter(record=>record.weapon).length,geometries:geometries.size,materials:materials.size})});
}

/** An independent, static model of the source's current evaluated weapon pose. */
export function createS5WeaponPreviewModel(source){
 const capture=captureS5WeaponPreviewPose(source);
 try{return capture.createModel();}finally{capture.dispose();}
}
