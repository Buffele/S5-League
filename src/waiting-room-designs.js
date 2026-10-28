import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const WAITING_ROOM_DESIGNS=Object.freeze([
 Object.freeze({key:'native',label:'Original room'}),
 Object.freeze({key:'cloud-disk',label:'Cloud Disk'}),
 Object.freeze({key:'contemporary-dojo',label:'Contemporary Dojo'})
]);
export function waitingRoomDesignKey(value){return WAITING_ROOM_DESIGNS.some(d=>d.key===value)?value:'native';}

export function validateAuthoredWaitingRoom(data,key){
 const point=p=>p&&['x','y','z'].every(a=>Number.isFinite(p[a]));
 if(!['cloud-disk','contemporary-dojo'].includes(key)||data?.schema!==1||data.key!==key||
  data.asset!==`/assets/waiting-rooms/${key}.glb`||!/^\/assets\/waiting-rooms\/[a-z0-9-]+\.png$/.test(data.sky)||
  !point(data.spawn)||!Number.isFinite(data.facing)||!Number.isFinite(data.deathY)||!Array.isArray(data.triangles)||data.triangles.length<100||
  data.triangles.some(t=>!Array.isArray(t)||t.length!==3||t.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))||
  !Array.isArray(data.markers)||data.markers.length!==24||new Set(data.markers.map(m=>m.name)).size!==24||
  data.markers.some(m=>! /^(alpha|beta)_standby_pos(0[1-9]|1[0-2])$/.test(m.name)||!point(m.position)||!Number.isFinite(m.facing))||
  !data.lighting||!Number.isFinite(data.lighting.hemisphere)||!Number.isFinite(data.lighting.key)||!Array.isArray(data.lighting.keyPosition)||data.lighting.keyPosition.length!==3||!data.lighting.keyPosition.every(Number.isFinite))throw Error('Invalid authored waiting-room manifest: '+key);
 return data;
}

function disposeModel(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material??[])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
}

/** Artist-authored rooms are independent additions; no native source certification. */
export async function loadAuthoredWaitingRoom(stage,key,{renderer=null}={}){
 const response=await fetch(`/assets/waiting-rooms/${key}.json`);if(!response.ok)throw Error('Waiting-room design unavailable: '+key);
 const data=validateAuthoredWaitingRoom(await response.json(),key),root=new THREE.Group();root.name=data.name;root.userData={source:`S5 / Blender MCP / ${key}`,authoredRoom:true};
 let model=null,sky=null,environment=null,collision=null,disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;root.removeFromParent();disposeModel(model);sky?.dispose();environment?.dispose();collision?.geometry.dispose();collision?.material.dispose();root.traverse(o=>{if(o.isLight)o.shadow?.dispose();});};
 try{
  const resources=await Promise.allSettled([new GLTFLoader().loadAsync(data.asset),new THREE.TextureLoader().loadAsync(data.sky)]);
  if(resources[0].status==='fulfilled')model=resources[0].value.scene;
  if(resources[1].status==='fulfilled')sky=resources[1].value;
  const failed=resources.find(r=>r.status==='rejected');if(failed)throw failed.reason;
  sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;
  sky.wrapS=THREE.RepeatWrapping;sky.wrapT=THREE.ClampToEdgeWrapping;
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;for(const m of [].concat(o.material)){if(m.transparent){o.castShadow=false;m.depthWrite=false;m.side=THREE.DoubleSide;}for(const v of Object.values(m))if(v?.isTexture)v.anisotropy=Math.min(8,renderer?.capabilities.getMaxAnisotropy()??1);}});
  root.add(model);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.triangles.flat(2),3));geometry.computeVertexNormals();
  collision=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));collision.name=data.name+' / collision proxy';collision.visible=false;root.add(collision);
  const markers=data.markers.map(m=>{const object=new THREE.Object3D();object.name=m.name;object.position.copy(m.position);object.rotation.y=m.facing;root.add(object);object.updateMatrix();return {...m,object,matrix:[...object.matrix.elements]};});
  const l=data.lighting,hemi=new THREE.HemisphereLight(0xe6efff,0x8a7968,l.hemisphere);root.add(hemi);
  const sun=new THREE.DirectionalLight(l.keyColor,l.key);sun.position.set(...l.keyPosition);sun.target.position.set(0,0,0);root.add(sun,sun.target);sun.castShadow=!!l.shadow;
  const shadowExtent=l.shadowExtent??7,shadowMapSize=l.shadowMapSize??1024;
  Object.assign(sun.shadow.camera,{left:-shadowExtent,right:shadowExtent,top:shadowExtent,bottom:-shadowExtent,near:.1,far:l.shadowFar??35});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(shadowMapSize,shadowMapSize);sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;
  const fill=new THREE.DirectionalLight(0xe4ecff,l.fill??.4),scale=data.authoringScale??[1,1,1];fill.position.set(-3*scale[0],3*scale[1],-4*scale[2]);root.add(fill);
  for(const p of l.points??[]){const lamp=new THREE.PointLight(p.color,p.intensity,p.distance,p.decay);lamp.position.set(...p.position);root.add(lamp);}
  // Roughness-prefiltered environment is independent of the full-resolution
  // visible sky. Local diffuse lights keep toon characters readable indoors.
  if(renderer){const pmrem=new THREE.PMREMGenerator(renderer);try{environment=pmrem.fromEquirectangular(sky);}finally{pmrem.dispose();}}
  stage.add(root);root.updateMatrixWorld(true);
  return {name:data.name,designKey:key,root,group:root,spawn:{...data.spawn},facing:data.facing,deathY:data.deathY,triangles:data.triangles,colliders:[],meshes:[collision],collisionMeshes:[collision],markers,
   background:sky,environment:environment?.texture??null,authoredLighting:true,manifest:data,nativeMapId:null,nativeReady:false,readyForController:true,
   dispose};
 }catch(error){dispose();throw error;}
}
