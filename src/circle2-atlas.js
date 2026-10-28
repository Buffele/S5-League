import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readAsset} from './scene-assets.js';
import {createCircle2Atmosphere} from './circle2-atmosphere.js';

export const CIRCLE2_COLLISION_SETTINGS=Object.freeze({stepHeight:.28,groundSnap:.3});

export function configureCircle2Material(material){
 material.roughness=.85;material.metalness=0;
 if(material.name.startsWith('Azure probe / ')){
  material.roughness=material.name.endsWith('hull')||material.name.endsWith('glass')?.32:.5;
 }
 if(/^Imported \/ (Leaves|Flowers)/.test(material.name)){
  material.transparent=false;material.alphaTest=.45;
  material.depthWrite=true;material.side=THREE.DoubleSide;
 }
 return material;
}

export function validateCircle2World(data){
 if(!data||data.schema!==1||!Array.isArray(data.triangles)||data.triangles.length<100)throw Error('Circle 2 : collisions absentes');
 for(const triangle of data.triangles)if(!Array.isArray(triangle)||triangle.length!==3||triangle.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v))))throw Error('Circle 2 : triangle invalide');
 for(const p of [data.spawn,data.target])if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))throw Error('Circle 2 : point de départ invalide');
 if(data.asset!=='/assets/circle2-atlas/circle2-azure-atrium.glb'||!Number.isFinite(data.deathY))throw Error('Circle 2 : manifeste invalide');
 if(data.detailRevision!==5||data.sky!=='/assets/circle2-atlas/azure-sky-anime-4k.png')throw Error('Circle 2 : panorama absent');
 return data;
}

export async function createCircle2Atlas(scene){
 const data=validateCircle2World(await readAsset('/assets/circle2-atlas/world.json'));
 const gltf=await new GLTFLoader().loadAsync(data.asset),group=gltf.scene;
 group.name=data.name;
 group.traverse(o=>{
  if(!o.isMesh)return;
  let backdrop=false;
  for(let parent=o;parent;parent=parent.parent)if(/^(90|91)/.test(parent.name))backdrop=true;
  o.castShadow=!backdrop;o.receiveShadow=!backdrop;
  for(const m of [].concat(o.material))configureCircle2Material(m);
 });
 scene.add(group);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.triangles.flat(2),3));
 geometry.computeVertexNormals();
 const collision=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 collision.name='Circle 2 / authored collisions';collision.visible=false;collision.userData.collision=true;scene.add(collision);
 const target=new THREE.Group();target.position.set(data.target.x,data.target.y,data.target.z);scene.add(target);
 const dummy=new THREE.Mesh(new THREE.CapsuleGeometry(.3,1,4,8),new THREE.MeshLambertMaterial({color:0xed9273}));dummy.position.y=.9;target.add(dummy);
 const atmosphere=await createCircle2Atmosphere(scene,group,data.sky);
 scene.background=new THREE.Color(0x9ddcf2);scene.fog=new THREE.Fog(0xcfe8ed,110,290);
 return {nativeMapId:93,name:data.name,group,triangles:data.triangles,colliders:[],meshes:[collision],target,
  spawn:{...data.spawn},cameraFar:550,...CIRCLE2_COLLISION_SETTINGS,deathY:data.deathY,
  update:atmosphere.update,atmosphere,manifest:data};
}
