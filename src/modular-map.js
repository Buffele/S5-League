import * as THREE from 'three';
import {sceneAsset,collisionTriangles} from './scene-assets.js';
import {createMapAnimation} from './map-animation.js';
import {rampGeometry} from './collision.js';

const clone=value=>structuredClone(value);
const vector=(value,fallback)=>value??fallback;
function validate(definition){
 if(!definition.id||typeof definition.id!=='string')throw Error('Module sans identifiant');
 if(!['prefab','box','ramp','stairs'].includes(definition.kind))throw Error('Type de module inconnu : '+definition.kind);
 for(const key of ['position','rotation','scale'])if(definition[key]&&(!Array.isArray(definition[key])||definition[key].length!==3||definition[key].some(v=>!Number.isFinite(v))))throw Error('Vecteur invalide : '+key);
 if(definition.scale?.some(v=>v<=0))throw Error('Les dimensions doivent être positives');
 if(definition.kind==='box'&&(!Array.isArray(definition.size)||definition.size.length!==3||definition.size.some(v=>!Number.isFinite(v)||v<=0)))throw Error('Dimensions de plateforme invalides');
 if(['ramp','stairs'].includes(definition.kind)){
  for(const key of ['width','height','length'])if(!Number.isFinite(definition[key])||definition[key]<=0)throw Error('Dimension invalide : '+key);
  if(definition.kind==='stairs'&&(!Number.isInteger(definition.steps)||definition.steps<1||definition.steps>200))throw Error('Nombre de marches invalide');
 }
}
function collider(triangles){
 const geometry=new THREE.BufferGeometry(),vertices=triangles.flat(2);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(Array.from({length:vertices.length/3},(_,i)=>i));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 mesh.visible=false;mesh.userData.collision=true;return mesh;
}
function dispose(group){group.traverse(object=>{object.geometry?.dispose();for(const material of [].concat(object.material||[]))material.dispose();});}

export function proceduralModule(definition){
 validate(definition);
 const group=new THREE.Group(),meshes=[],collisions=[];
 const material=new THREE.MeshLambertMaterial({color:definition.color??0x75859d});
 const addBox=(size,position,solid)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...position);mesh.receiveShadow=true;group.add(mesh);meshes.push(mesh);
  if(solid){const collision=mesh.clone();collision.material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});collision.visible=false;collision.userData.collision=true;group.add(collision);collisions.push(collision);}
 };
 if(definition.kind==='box')addBox(definition.size,[0,0,0],true);
 else{
  const {width,height,length}=definition;
  const shape=rampGeometry({minX:-width/2,maxX:width/2,minZ:-length,maxZ:0,bottom:0,top:height});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(shape.vertices,3));geometry.setIndex(shape.indices);geometry.computeVertexNormals();
  const physics=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));physics.visible=false;physics.userData.collision=true;group.add(physics);collisions.push(physics);
  if(definition.kind==='ramp'){const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);meshes.push(mesh);}
  else for(let i=0;i<definition.steps;i++){
   const h=height*(i+1)/definition.steps,depth=length/definition.steps;
   addBox([width,h,depth],[0,h/2,-depth*(i+.5)],false);
  }
 }
 return {group,meshes,collisions,update:()=>{}};
}

// Generic runtime: no Station 2 coordinates or source model names here.
export async function createModularWorld(scene,layout,prefabs,{loadAsset=sceneAsset}={}){
 if(layout.version!==1)throw Error('Version de niveau non prise en charge');
 const state=clone(layout),root=new THREE.Group(),modules=new Map();root.name=state.name;scene.add(root);
 const world={name:state.name,group:root,modules,triangles:[],colliders:[],meshes:[],spawn:{x:0,y:10,z:0},target:new THREE.Group(),cameraFar:1200,stepHeight:.52,groundSnap:.55,deathY:state.environment.deathY};
 scene.add(world.target);
 const targetMesh=new THREE.Mesh(new THREE.CapsuleGeometry(.3,1,4,8),new THREE.MeshLambertMaterial({color:0xff8855}));targetMesh.position.y=.9;world.target.add(targetMesh);
 const anchors=[];
 function applyTransform(module){
  const d=module.definition;module.group.position.fromArray(vector(d.position,[0,0,0]));
  module.group.rotation.set(...vector(d.rotation,[0,0,0]).map(THREE.MathUtils.degToRad));
  module.group.scale.fromArray(vector(d.scale,[1,1,1]));module.group.visible=d.enabled!==false;
  module.group.updateMatrixWorld(true);
 }
 function point(marker){
  const module=modules.get(marker.module);if(!module||module.definition.enabled===false)throw Error('Module du point de départ absent : '+marker.module);
  return module.group.localToWorld(new THREE.Vector3(...marker.local));
 }
 function rebuild(){
  root.updateMatrixWorld(true);
  world.meshes=[...modules.values()].filter(m=>m.definition.enabled!==false).flatMap(m=>m.collisions);
  world.triangles=collisionTriangles(world.meshes);
  const start=point(state.spawn),ray=new THREE.Raycaster(start.clone().add(new THREE.Vector3(0,1,0)),new THREE.Vector3(0,-1,0),0,120);
  const ground=ray.intersectObjects(world.meshes,false).find(h=>h.face&&Math.abs(h.face.normal.clone().transformDirection(h.object.matrixWorld).y)>.3);
  // New layouts may deliberately place a spawn in midair; preserve the marker
  // if there is no support rather than teleporting to an unrelated fallback.
  world.spawn={x:start.x,y:ground?ground.point.y+.02:start.y,z:start.z};
  world.target.position.set(world.spawn.x+1,world.spawn.y,world.spawn.z-5);
  for(const anchor of anchors){const owner=modules.get(anchor.marker.module);if(owner&&owner.definition.enabled!==false){owner.group.add(anchor.object);anchor.object.position.fromArray(anchor.marker.local);anchor.object.visible=true;}else{root.add(anchor.object);anchor.object.visible=false;}}
 }
 async function instantiate(definition){
  validate(definition);const d=clone(definition);let module;
  if(d.kind==='prefab'){
   const prefab=prefabs.get(d.prefab);if(!prefab)throw Error('Bloc absent : '+d.prefab);
   const data={source:'station2-kit/'+d.prefab,models:prefab.models};
   const asset=await loadAsset(data,{sky:d.prefab==='sky'});
   for(const mesh of asset.meshes){const model=data.models[mesh.userData.sourceModelIndex];
    for(const material of [].concat(mesh.material)){
     material.alphaTest=model.renderState&4?.5:model.renderState&34?.015:0;
     material.side=model.frontSide?THREE.FrontSide:THREE.DoubleSide;
     if(model.renderState&8192){material.polygonOffset=true;material.polygonOffsetFactor=1;material.polygonOffsetUnits=1;}
     if(model.sky){material.depthTest=false;material.depthWrite=false;material.fog=false;mesh.renderOrder=-1000;}
     if(material.map){material.map.wrapS=material.map.wrapT=THREE.RepeatWrapping;material.map.needsUpdate=true;}
     if(d.color!==undefined)material.color.set(d.color);
    }
   }
   const collision=prefab.collision.length?collider(prefab.collision):null;if(collision)asset.group.add(collision);
   const animation=createMapAnimation(asset,data);
   module={...asset,definition:d,collisions:collision?[collision]:[],update:animation.update};
  }else module={...proceduralModule(d),definition:d};
  module.group.name=d.id;module.group.userData.moduleId=d.id;module.meshes.forEach(mesh=>mesh.userData.moduleId=d.id);
  applyTransform(module);return module;
 }
 try{
  const ids=new Set();for(const d of state.modules){validate(d);if(ids.has(d.id))throw Error('Identifiant dupliqué : '+d.id);ids.add(d.id);}
  const built=await Promise.all(state.modules.map(instantiate));
  for(const module of built){modules.set(module.definition.id,module);root.add(module.group);}
  rebuild();
 }catch(error){dispose(root);scene.remove(root,world.target);throw error;}
 const assertSpawn=id=>{if(state.spawn.module===id)throw Error('Déplace le point de départ avant de retirer son module');};
 world.update=dt=>{for(const module of modules.values())if(module.definition.enabled!==false)module.update(dt);};
 world.updateModule=async(id,patch)=>{
  const old=modules.get(id);if(!old)throw Error('Module inconnu : '+id);
  if(patch.id&&patch.id!==id)throw Error('Utilise duplicateModule pour changer un identifiant');
  const next={...clone(old.definition),...clone(patch),id};validate(next);
  if(next.enabled===false)assertSpawn(id);
  // Build before replacing: invalid edits leave the current map intact.
  const replacement=await instantiate(next);root.add(replacement.group);root.remove(old.group);modules.set(id,replacement);
  state.modules[state.modules.findIndex(m=>m.id===id)]=next;rebuild();dispose(old.group);return replacement;
 };
 world.addModule=async definition=>{
  if(modules.has(definition.id))throw Error('Identifiant déjà utilisé : '+definition.id);
  const module=await instantiate(definition);modules.set(definition.id,module);state.modules.push(clone(definition));root.add(module.group);rebuild();return module;
 };
 world.duplicateModule=(id,newId,patch={})=>{const module=modules.get(id);if(!module)throw Error('Module inconnu : '+id);return world.addModule({...clone(module.definition),...clone(patch),id:newId});};
 world.removeModule=id=>{
  assertSpawn(id);const module=modules.get(id);if(!module)throw Error('Module inconnu : '+id);
  root.remove(module.group);modules.delete(id);state.modules=state.modules.filter(m=>m.id!==id);rebuild();dispose(module.group);
  if(state.ball?.module===id)state.ball=null;
 };
 world.attach=(object,marker)=>{if(!modules.has(marker.module))throw Error('Module absent : '+marker.module);anchors.push({object,marker:clone(marker)});rebuild();};
 world.setSpawn=marker=>{point(marker);state.spawn=clone(marker);rebuild();};
 world.exportLayout=()=>clone(state);
 world.dispose=()=>{dispose(root);dispose(world.target);scene.remove(root,world.target);};
 scene.background=new THREE.Color(state.environment.background);scene.fog=new THREE.Fog(state.environment.background,...state.environment.fog);
 return world;
}
