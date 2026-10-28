import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyStationTeamColors} from './station2-team-colors.js';

async function loadRuntimeSlice(){
 const response=await fetch('/assets/station2-blender/station2-runtime.glb.gz');
 if(!response.ok)throw Error('Modèles Station 2 introuvables');
 // Accept servers that already advertise Content-Encoding as well as plain
 // static hosting. Every texture remains embedded and byte-for-byte intact.
 const compressed=await response.arrayBuffer();
 const bytes=new DataView(compressed).getUint32(0,true)===0x46546c67?compressed:
  await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 return new GLTFLoader().parseAsync(bytes,'/assets/station2-blender/');
}

export async function loadBlenderSlice(){
 const started=performance.now();
 const baseline=typeof location!=='undefined'&&new URLSearchParams(location.search).get('station2Optimize')==='0';
 const [asset,response,glass]=await Promise.all([
  baseline?new GLTFLoader().loadAsync('/assets/station2-blender/station2-slice.glb'):loadRuntimeSlice(),
  fetch('/assets/station2-blender/manifest.json'),
  new GLTFLoader().loadAsync('/assets/station2-blender/train-glass.glb'),
 ]);
 if(!response.ok)throw Error('Manifest Blender introuvable');
 return {...attachTrainGlass(asset.scene,glass.scene,await response.json()),loadMs:performance.now()-started};
}

// Separate editable Blender asset: preserve the large environment export and
// replace only the ten reference panes, never their existing colliders/sills.
export function attachTrainGlass(asset,glass,manifest){
 let train,glazing;asset.traverse(o=>{if(o.userData.moduleId==='train')train=o;});
 glass.traverse(o=>{if(o.userData.s5TrainWindows)glazing=o;});
 const indices=glazing?.userData.replacedModelIndices;
 if(!train||!glazing||!Array.isArray(indices)||indices.length!==10||new Set(indices).size!==10||!indices.every(Number.isInteger)||!manifest.modules.some(m=>m.id==='train'))throw Error('Vitrage du train incompatible');
 const merged=structuredClone(manifest),definition=merged.modules.find(m=>m.id==='train');
 definition.replacedModelIndices=[...new Set([...definition.replacedModelIndices,...indices])];
  train.add(train.userData.s5RuntimeBatched?batchBlenderModule(glazing):glazing);
 return {asset,manifest:merged};
}

// Authoring keeps separate editable components. Runtime combines static pieces
// by material within each module; no render mesh enters the collision arrays.
export function batchBlenderModule(root){
 if(root.userData.s5RuntimeBatched){const group=root.clone(true);group.name='S5 • Blender';group.userData.presentationOnly=true;group.traverse(o=>{if(o.isMesh){if(o.userData.s5FlatShading!==undefined&&o.material.flatShading!==o.userData.s5FlatShading){o.material=o.material.clone();o.material.flatShading=o.userData.s5FlatShading;}o.castShadow=!o.material.userData.s5TrainGlass;o.receiveShadow=true;o.userData.presentationOnly=true;}});return group;}
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),batches=new Map(),group=new THREE.Group();
 group.name='S5 • Blender';group.userData.presentationOnly=true;group.userData.brandingBounds=[];
 root.traverse(object=>{
  if(!object.isMesh)return;
  const matrix=new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld);
  const source=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
  source.applyMatrix4(matrix);
  if(/marquage|emblème/i.test(object.name)){
   source.computeBoundingBox();group.userData.brandingBounds.push({min:source.boundingBox.min.toArray(),max:source.boundingBox.max.toArray()});
  }
  const materials=[].concat(object.material);
  const ranges=Array.isArray(object.material)&&source.groups.length?source.groups:[{start:0,count:source.attributes.position.count,materialIndex:0}];
  for(const range of ranges){
  const material=materials[range.materialIndex??0],g=new THREE.BufferGeometry();
  if(!material)throw Error('Matériau Blender manquant');
   if(material.userData.s5TrainGlass)material.depthWrite=false;
   const count=Math.min(range.count,source.attributes.position.count-range.start);
   for(const key of ['position','normal','uv']){
    const attribute=source.getAttribute(key),size=key==='uv'?2:3;
    g.setAttribute(key,new THREE.BufferAttribute(attribute?attribute.array.slice(range.start*size,(range.start+count)*size):new Float32Array(count*size),size));
   }
   if(!batches.has(material))batches.set(material,[]);batches.get(material).push(g);
  }
  source.dispose();
 });
 for(const [material,parts] of batches){
  const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
  const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;
  mesh.castShadow=!material.userData.s5TrainGlass;mesh.receiveShadow=true;mesh.userData.presentationOnly=true;group.add(mesh);
 }
 return group;
}

export function applyBlenderSlice(world,{asset,manifest,loadMs}){
 const started=performance.now();
 if(world.blenderSlice)throw Error('Modèles Blender déjà chargés');
 // Validate the whole replacement set before touching source visibility.
 const prepared=manifest.modules.map(definition=>{
  const module=world.modules.get(definition.id);
  let root;asset.traverse(o=>{if(o.userData.moduleId===definition.id)root=o;});
  if(!module||!root)throw Error('Module Blender absent : '+definition.id);
  const indices=new Set(definition.replacedModelIndices);
  const originals=module.meshes.filter(m=>indices.has(m.userData.sourceModelIndex)&&!m.userData.collision);
  if(new Set(originals.map(m=>m.userData.sourceModelIndex)).size!==indices.size)throw Error('Gabarit Blender incompatible : '+definition.id);
  const group=batchBlenderModule(root);group.userData.moduleId=definition.id;
  return {module,originals,group};
 });
 for(const {module,originals,group} of prepared){
  originals.forEach(mesh=>{mesh.visible=false;mesh.userData.blenderReplaced=true;});
  module.group.add(group);
 }
 world.blenderSlice={groups:prepared.map(p=>p.group),manifest};
 world.blenderSlice.teamColors=applyStationTeamColors(world.blenderSlice.groups);
 world.station2Performance={...world.station2Performance,artLoadMs:loadMs,artAssemblyMs:performance.now()-started,runtimeBatched:!!asset.children.find(o=>o.userData.s5RuntimeBatched)};
 return world.blenderSlice;
}
