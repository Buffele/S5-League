import * as THREE from 'three';
import {readAsset,sceneAsset,collisionTriangles} from './scene-assets.js';
import {createFumbi} from './fumbi.js';
import {createMapAnimation} from './map-animation.js';
import {sourceMapScale} from './s5runtime-coordinates.js';
import {createStation2ClassicTouchdownProfile} from './station2-classic-touchdown.js';
export const MAPS=Object.freeze({
 circle2:{name:'Circle-2',nativeMapId:93,asset:'circle2',spawnNode:'alpha_spawn_pos_01',fallback:[0,10,0]},
 station2:{name:'Station 2 · Classic',nativeMapId:66,asset:'station2-s5runtime',spawnNode:'alpha_spawn_pos_01',fallback:[0,10,0],mirrorZ:true},
});
export function findMapSpawn(data,meshes,config){
 const node=data.scenes.flatMap(s=>s.nodes).find(n=>n.name===config.spawnNode);
 const start=node?new THREE.Vector3().fromArray(node.matrix,12).multiply(new THREE.Vector3(...sourceMapScale(config.mirrorZ))).add(new THREE.Vector3(0,1,0)):new THREE.Vector3(...config.fallback);
 const ray=new THREE.Raycaster(start,new THREE.Vector3(0,-1,0),0,120);
 const hit=ray.intersectObjects(meshes,false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.5);
 if(!hit)throw Error(config.name+': no ground at spawn');
 return {x:hit.point.x,y:hit.point.y+.02,z:hit.point.z};
}
export function configureMapMesh(mesh,model){
 mesh.matrix.fromArray(model.matrix);mesh.matrixAutoUpdate=false;
 // Shadow-marked SCN models also contain unique visible scenery. Keep them;
 // a depth bias lets coincident base surfaces win without flickering.
 for(const material of [].concat(mesh.material)){
  if(model.renderState&4)material.alphaTest=.5;
  else if(!(model.renderState&34))material.alphaTest=0;
  if(model.renderState&8192){material.polygonOffset=true;material.polygonOffsetFactor=1;material.polygonOffsetUnits=1;}
  material.needsUpdate=true;
 }
}
export function configureMapAsset(asset,data){
 // SCN names are not unique, and asynchronous texture loads reorder meshes.
 // Use the source record index rather than a name or completion-order lookup.
 const nodes=new Map(data.nodes.map(node=>[node.name,node]));
 for(const mesh of asset.meshes){
  const model=data.models[mesh.userData.sourceModelIndex];
  if(!model)throw Error('Missing source record for map mesh '+mesh.name);
  configureMapMesh(mesh,model);
  // Station 2 winding agrees with the exported normals. Showing both sides
  // makes the underside of the walkway fill the holes of the grating above,
  // and draws glass twice. Preserve the native NoCull exception (bit 8).
  if(data.source.endsWith('/station2.scn')&&!mesh.userData.collision){
   for(const material of [].concat(mesh.material))material.side=model.renderState&8?THREE.DoubleSide:THREE.FrontSide;
  }
  // Model matrices are already in scene space. Only animation keys are local
  // to their parent; applying a bone matrix again lifts the intact bridge.
  // blast3 stores intact models under the root and damaged fragments beneath
  // those models. Render the intact state until destruction is implemented.
  const parent=nodes.get(model.parent),grandparent=parent&&nodes.get(parent.parent);
  if(parent?.type==='ModelData'&&grandparent?.name.startsWith('blast3_')&&!mesh.userData.collision)mesh.visible=false;
 }
}
export async function createImportedMap(scene,key){
 const config=MAPS[key];if(!config)throw Error('Carte inconnue : '+key);
 const data=await readAsset('/assets/s5runtime/maps/'+config.asset+'.json');
 const assets=await Promise.all(data.scenes.map(d=>sceneAsset(d,{sky:d.source.includes('sky_')})));
 // Keep the source affine matrices exactly (including nonuniform scale/shear).
 assets.forEach((asset,i)=>configureMapAsset(asset,data.scenes[i]));
 const animations=assets.map((asset,i)=>createMapAnimation(asset,data.scenes[i]));
 // S5Runtime renders its sky separately from the map's distance culling. Fit the
 // imported sky dome inside this renderer's far plane without moving the map.
 if(key==='station2')for(let i=0;i<data.scenes.length;i++)if(data.scenes[i].source.includes('sky_')){
  assets[i].group.scale.setScalar(.1);
  for(const mesh of assets[i].meshes)for(const material of [].concat(mesh.material)){
   material.depthTest=false;material.depthWrite=false;
  }
  for(const mesh of assets[i].meshes)mesh.renderOrder=-1000;
 }
 // SCN map diffuse UVs tile beyond [0,1]; lightmaps use their separate atlas.
 for(const asset of assets)for(const mesh of asset.meshes)for(const material of [].concat(mesh.material))if(material.map){material.map.wrapS=material.map.wrapT=THREE.RepeatWrapping;material.map.needsUpdate=true;}
 const group=new THREE.Group();group.name=config.name;group.scale.set(...sourceMapScale(config.mirrorZ));
 assets.forEach(a=>group.add(a.group));scene.add(group);group.updateMatrixWorld(true);
 let fumbi=null,touchdownProfile=null;
 if(key==='station2'){
  const marker=data.scenes.flatMap(s=>s.nodes).find(n=>n.name==='ball_spawn_pos');
  if(!marker)throw Error('Station 2 : point du Fumbi absent');
  fumbi=await createFumbi(await readAsset('/assets/s5runtime/maps/fumbi.json'));
  fumbi.position.fromArray(marker.matrix,12);group.add(fumbi);
  touchdownProfile=createStation2ClassicTouchdownProfile({data,assets,group,scene,fumbi});
 }
 const meshes=assets.flatMap(a=>a.meshes).filter(m=>m.userData.collision),triangles=collisionTriangles(meshes);
 if(!triangles.length)throw Error(config.name+' : collisions absentes');
 const spawn=findMapSpawn(data,meshes,config);
 const target=new THREE.Group();target.position.set(spawn.x+1,spawn.y,spawn.z-5);scene.add(target);
 const ray=new THREE.Raycaster(new THREE.Vector3(target.position.x,spawn.y+1,target.position.z),new THREE.Vector3(0,-1,0),0,120);
 const ground=ray.intersectObjects(meshes,false)[0];if(ground)target.position.y=ground.point.y;
 const dummy=new THREE.Mesh(new THREE.CapsuleGeometry(.3,1,4,8),new THREE.MeshLambertMaterial({color:0xff8855}));dummy.position.y=.9;target.add(dummy);
 scene.fog=key==='station2'?new THREE.Fog(0x001b80,36,90):new THREE.Fog(0x333380,65,160);
 scene.background=new THREE.Color(key==='station2'?0x001b80:0x8dc9ef);
 return {nativeMapId:config.nativeMapId,cameraFar:1200,name:config.name,group,triangles,colliders:[],meshes,target,spawn,fumbi,touchdownProfile,update:dt=>animations.forEach(a=>a.update(dt)),
  stepHeight:key==='station2'?0.52:0,groundSnap:key==='station2'?0.55:0,deathY:key==='station2'?-21.3:-25};
}
