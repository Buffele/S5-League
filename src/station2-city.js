import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const BASE='/assets/station2-city/';
export async function loadStationCity(){
 const response=await fetch(BASE+'layout.json');
 if(!response.ok)throw Error('Disposition de la cité introuvable');
 const layout=await response.json(),loader=new GLTFLoader();
 const ids=[...new Set(layout.instances.map(i=>i.model))];
 const models=new Map(await Promise.all(ids.map(async id=>[id,(await loader.loadAsync(BASE+id+'.glb')).scene])));
 return {layout,models};
}

function cityMaterial(original){
 const material=original.clone();material.name='S5 • façade importée / Kenney';
 material.roughness=.64;material.metalness=.12;material.envMapIntensity=.55;
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nfloat s5CityGlass=0.0;')
   .replace('#include <map_fragment>',`#include <map_fragment>
    vec3 source=diffuseColor.rgb;
    float luminance=dot(source,vec3(.2126,.7152,.0722));
    s5CityGlass=step(.085,source.b-source.r)*step(source.g,source.b);
    float accent=step(.08,source.g-source.b)+step(.09,source.r-source.b);
    vec3 neutral=mix(vec3(.07,.105,.16),vec3(.80,.79,.73),smoothstep(.12,.65,luminance));
    vec3 glazing=mix(vec3(.035,.13,.26),vec3(.23,.47,.66),clamp(luminance*2.0,0.0,1.0));
    diffuseColor.rgb=mix(neutral,glazing,s5CityGlass);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.79,.12,.085),min(1.0,accent));
   `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.23,s5CityGlass);')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.42,s5CityGlass);');
 };
 material.customProgramCacheKey=()=> 's5-imported-city-v1';
 return material;
}

// Separate, editable render-only module. All clones of one imported mesh share
// geometry and one draw call. Imported proportions are preserved by uniform scale.
export function createStationCity({layout,models}){
 const group=new THREE.Group();group.name='S5 • Cité blanche importée';
 group.userData={presentationOnly:true,source:'Kenney / City Kit Commercial 2.1',license:'CC0-1.0',instances:layout.instances};
 const stats={buildings:layout.instances.length,models:models.size,drawCalls:0,triangles:0};
 const dummy=new THREE.Object3D(),materialCache=new Map();
 for(const [id,root] of models){
  const instances=layout.instances.filter(i=>i.model===id);if(!instances.length)continue;
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(!(size.y>0))throw Error('Hauteur du bâtiment invalide : '+id);
  root.traverse(object=>{
   if(!object.isMesh)return;
   const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
   geometry.translate(-center.x,-bounds.min.y,-center.z);
   const convert=original=>{if(!materialCache.has(original))materialCache.set(original,cityMaterial(original));return materialCache.get(original);};
   const material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
   const mesh=new THREE.InstancedMesh(geometry,material,instances.length);
   mesh.name=id;mesh.userData.presentationOnly=true;mesh.castShadow=false;mesh.receiveShadow=false;
   instances.forEach((instance,index)=>{
    dummy.position.fromArray(instance.position);dummy.rotation.set(0,instance.rotation,0);
    dummy.scale.setScalar(instance.height/size.y);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);
   });
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
   stats.drawCalls+=Array.isArray(material)?geometry.groups.length:1;
   stats.triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*instances.length;
  });
 }
 group.userData.stats=stats;return group;
}

export function applyStationCity(world,assets){
 const previous=world.blenderSlice.groups.find(g=>g.userData.moduleId==='backdrop');
 const module=world.modules.get('backdrop');
 if(!previous||!module)throw Error('Module de décor lointain absent');
 const city=createStationCity(assets);
 module.group.add(city);previous.visible=false;
 return city;
}
