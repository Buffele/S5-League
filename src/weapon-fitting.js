import * as THREE from 'three';

export const WEAPON_FIT_KEY='s5.weapon-fitting.v1.';
export const FIT_COMPONENTS={
 plasma:[{name:'sword',label:'Épée',socket:'R_Hand_Dummy'}],
 counter:[{name:'Counter_Sword_SwordParts',label:'Lame',socket:'R_Hand_Dummy'},{name:'Counter_Sword',label:'Gantelet',socket:'Bip01 L Forearm',followers:['Counter_Sword_Hand']}],
 dagger:[{name:'spydagger',label:'Dague',socket:'R_Hand_Dummy'}],
};
const identity=()=>({position:[0,0,0],rotation:[0,0,0],scale:1});
export function normalizeWeaponFit(weapon,value={}){
 if(!Object.hasOwn(FIT_COMPONENTS,weapon))throw Error('Arme non réglable');
 if(value.weapon!==undefined&&value.weapon!==weapon)throw Error('Ce fichier concerne une autre arme');
 if(value.version!==undefined&&value.version!==1)throw Error('Version de réglages inconnue');
 if(value.skin!==undefined&&value.skin!=='meshy')throw Error('Ces réglages concernent le skin Meshy');
 const source=value.components??{};
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Composants invalides');
 const known=FIT_COMPONENTS[weapon].map(part=>part.name);
 if(Object.keys(source).some(key=>!known.includes(key)))throw Error('Composant inconnu');
 const components={};
 for(const name of known){
  const part=source[name]??identity();
  for(const [key,limit] of [['position',200],['rotation',3600]]){
   if(!Array.isArray(part[key])||part[key].length!==3||!part[key].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=limit))throw Error(`${name} : ${key} invalide`);
  }
  if(typeof part.scale!=='number'||!Number.isFinite(part.scale)||part.scale<.05||part.scale>5)throw Error(`${name} : taille invalide (0,05 à 5)`);
  components[name]={position:[...part.position],rotation:[...part.rotation],scale:part.scale};
 }
 return {version:1,weapon,skin:'meshy',components};
}
export function weaponFitStorage(){try{return globalThis.localStorage;}catch{return null;}}
export function readWeaponFit(weapon,storage=weaponFitStorage()){
 try{return normalizeWeaponFit(weapon,JSON.parse(storage?.getItem(WEAPON_FIT_KEY+weapon)||'{}'));}
 catch{return normalizeWeaponFit(weapon);}
}
export function saveWeaponFit(weapon,value,storage=weaponFitStorage()){
 const profile=normalizeWeaponFit(weapon,value);
 if(!storage)throw Error('Enregistrement local indisponible');
 storage.setItem(WEAPON_FIT_KEY+weapon,JSON.stringify(profile));return profile;
}

// Only the replacement surface is corrected. Animated model carriers, sockets,
// source assets, skeletons, contact volumes and effect tracks remain untouched.
// Rebuild from immutable coordinates on each edit: never accumulate transforms.
export function createWeaponFitting({weapon,meshes,bones,profile,storage=weaponFitStorage()}){
 if(!Object.hasOwn(FIT_COMPONENTS,weapon))return null;
 const auto=profile===undefined,parts=[];
 for(const spec of FIT_COMPONENTS[weapon]){
  const mesh=meshes.find(mesh=>mesh.userData.weapon&&mesh.name===spec.name);
  if(!mesh)continue;
  if(mesh.isSkinnedMesh)throw Error('Réglage de surface rigide requis');
  mesh.updateWorldMatrix(true,false);
  const socket=bones.get(spec.socket);
  if(!socket)throw Error('Attache absente : '+spec.socket);
  const pivot=mesh.worldToLocal(socket.getWorldPosition(new THREE.Vector3()));
  const worldScale=new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
  const cmPerUnit=worldScale.multiplyScalar(100);
  if(cmPerUnit.toArray().some(v=>!Number.isFinite(v)||v<1e-8))throw Error('Échelle de réglage invalide');
  parts.push({...spec,mesh,pivot,cmPerUnit,delta:new THREE.Matrix4(),positions:mesh.geometry.attributes.position.array.slice(),normals:mesh.geometry.attributes.normal.array.slice()});
 }
 // A skinned hand follows the same visual edit as the rigid forearm, AFTER
 // native finger skinning. Use private render bones; leave animated source
 // bones and inverse binds unchanged. In column-vector convention the edit
 // premultiplies BoneWorld: (C * D * C^-1) * BoneWorld.
 for(const part of parts)for(const name of part.followers??[]){
  const follower=meshes.find(mesh=>mesh.name===name&&mesh.userData.weapon);
  if(!follower?.isSkinnedMesh)continue;
  const original=follower.skeleton,sourceBones=[...original.bones];
  const renderRig=new THREE.Group();renderRig.name='weapon-fitting-render-bones';follower.parent.add(renderRig);
  const renderBones=sourceBones.map(bone=>{const copy=new THREE.Bone();copy.name=bone.name+'__weapon_fit';copy.matrixAutoUpdate=false;renderRig.add(copy);return copy;});
  follower.skeleton=new THREE.Skeleton(renderBones,original.boneInverses.map(matrix=>matrix.clone()));
  original.dispose();
  const updateWorld=follower.updateMatrixWorld;
  follower.updateMatrixWorld=function(force){
   updateWorld.call(this,force);part.mesh.updateWorldMatrix(true,false);
   const frame=part.mesh.matrixWorld,correction=frame.clone().multiply(part.delta).multiply(frame.clone().invert());
   const inverseParent=follower.parent.matrixWorld.clone().invert();
   for(let i=0;i<sourceBones.length;i++){
    sourceBones[i].updateWorldMatrix(true,false);
    renderBones[i].matrixWorld.copy(sourceBones[i].matrixWorld).premultiply(correction);
    renderBones[i].matrix.copy(inverseParent).multiply(renderBones[i].matrixWorld);
   }
  };
  part.skinnedFollowers??=[];part.skinnedFollowers.push(follower);
 }
 let current=normalizeWeaponFit(weapon,profile??readWeaponFit(weapon,storage)),lastRaw,elapsed=0;
 const apply=value=>{
  const next=normalizeWeaponFit(weapon,value);
  for(const part of parts){
   const data=next.components[part.name],offset=new THREE.Vector3().fromArray(data.position).divide(part.cmPerUnit);
   const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(...data.rotation.map(THREE.MathUtils.degToRad),'XYZ'));
   const transform=new THREE.Matrix4().compose(part.pivot.clone().add(offset),rotation,new THREE.Vector3().setScalar(data.scale)).multiply(new THREE.Matrix4().makeTranslation(...part.pivot.clone().negate().toArray()));
   part.delta.copy(transform);
   const geometry=part.mesh.geometry;
   geometry.attributes.position.array.set(part.positions);geometry.attributes.normal.array.set(part.normals);
   geometry.applyMatrix4(transform);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  }
  current=next;return structuredClone(current);
 };
 apply(current);
 for(const part of parts)for(const follower of part.skinnedFollowers??[])follower.updateMatrixWorld(true);
 try{lastRaw=storage?.getItem(WEAPON_FIT_KEY+weapon);}catch{}
 return {parts,apply,get:()=>structuredClone(current),
  syncSaved(dt){
   if(!auto)return;elapsed+=dt;if(elapsed<.5)return;elapsed=0;
   try{const raw=storage?.getItem(WEAPON_FIT_KEY+weapon);if(raw!==lastRaw){apply(readWeaponFit(weapon,storage));lastRaw=raw;}}catch{}
  },
 };
}
