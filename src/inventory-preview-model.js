import * as THREE from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

// Main-game source poses only. This is not the native lobby pose contract.
export function cloneInventoryPreviewSource(source){
 if(!source?.isObject3D)throw Error('Inventory preview requires an avatar Object3D');
 const root=cloneSkeleton(source),pairs=[],materials=new Map(),geometries=new Map(),geometryVersions=new Map();
 function pair(from,to,isRoot=false){
  pairs.push({from,to,isRoot});
  if(from.geometry){if(!geometries.has(from.geometry))geometries.set(from.geometry,from.geometry.clone());to.geometry=geometries.get(from.geometry);}
  if(from.material){
   const own=material=>{if(!materials.has(material))materials.set(material,material.clone());return materials.get(material);};
   to.material=Array.isArray(from.material)?from.material.map(own):own(from.material);
  }
  from.children.forEach((child,i)=>pair(child,to.children[i]));
 }
 pair(source,root,true);root.position.set(0,0,0);root.rotation.set(0,Math.PI,0);root.scale.copy(source.scale);
 let disposed=false;
 function sync(){
  if(disposed)return false;
  if(pairs.some(({from,to})=>from.children.length!==to.children.length))return false;
  for(const {from,to,isRoot} of pairs){
   if(!isRoot){to.position.copy(from.position);to.quaternion.copy(from.quaternion);to.scale.copy(from.scale);}
   to.visible=from.visible;
   if(from.morphTargetInfluences&&to.morphTargetInfluences)to.morphTargetInfluences.splice(0,to.morphTargetInfluences.length,...from.morphTargetInfluences);
   to.matrixAutoUpdate=from.matrixAutoUpdate;
   if(isRoot||from.matrixAutoUpdate)to.updateMatrix();else to.matrix.copy(from.matrix);
  }
  // Material values can be animated by equipment without sharing mutable instances.
  for(const [from,to] of materials){to.opacity=from.opacity;to.visible=from.visible;to.transparent=from.transparent;if(from.color&&to.color)to.color.copy(from.color);}
  // Surface fitting may update coordinates without replacing the avatar or
  // geometry object. Copy only changed attributes; keep the preview independent.
  for(const [from,to]of geometries){
   const previous=geometryVersions.get(from)||{};
   for(const name of ['position','normal']){
    const input=from.getAttribute(name),output=to.getAttribute(name);if(!input)continue;
    if(!output||input.array.length!==output.array.length)return false;
    if(previous[name]!==input.version){output.array.set(input.array);output.needsUpdate=true;previous[name]=input.version;to.boundingBox=null;to.boundingSphere=null;}
   }
   geometryVersions.set(from,previous);
  }
  root.updateMatrixWorld(true);
  root.traverse(node=>{if(node.isSkinnedMesh)node.skeleton.update();});
  return true;
 }
 function bounds(){
  const result=new THREE.Box3(),meshBounds=new THREE.Box3();
  function visit(node,parentVisible=true){
   const visible=parentVisible&&node.visible;if(!visible)return;
   // Frame the body, not hidden equipment/proxies or a transformed giant blade.
   if(node.isMesh&&!node.userData.weapon){
    if(node.isSkinnedMesh){node.computeBoundingBox();meshBounds.copy(node.boundingBox);}
    else {if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();meshBounds.copy(node.geometry.boundingBox);}
    meshBounds.applyMatrix4(node.matrixWorld);result.union(meshBounds);
   }
   for(const child of node.children)visit(child,visible);
  }
  visit(root);return result.isEmpty()?new THREE.Box3().setFromObject(root):result;
 }
 sync();
 return {root,source,sync,bounds,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const geometry of geometries.values())geometry.dispose();for(const material of materials.values())material.dispose();}};
}
