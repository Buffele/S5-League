import * as THREE from 'three';
import {createCollisionTestMapGeometry as createHostCollisionTestMapGeometry} from './collision-v2-test-world.js';
import {buildMapEntry} from './map-session.js';
import {createCollisionTestGeometry,COLLISION_TEST_SCENARIOS} from './collision-test-world.js';

export const COLLISION_TEST_MAPS=Object.freeze({
 test:'Parcours de test',station2:'Station 2 · Classic',circle2:'Circle-2 · Classic',
 'azit':'Azit','bio-lab':'Bio Lab','blade-city':'Blade City','alice-house':'Alice House',ironheart:'Iron Heart',
});
const unit=.006;

export function collisionTestMapStarts(key,world){
 const {spawn}=world;
 const scenarios={spawn:{label:key==='alice-house'?'Pièce fermée · départ Chaser':'Départ de la carte',spawn:[spawn.x,spawn.y,spawn.z]}};
 if(key==='alice-house'){
  const training=world.trainingSpawn;
  if(training?.qualified&&training.position&&['x','y','z'].every(axis=>Number.isFinite(training.position[axis]))){
   const {x,y,z}=training.position;
   scenarios.training={label:'Extérieur · départ entraînement',spawn:[x,y,z]};
  }
 }
 return scenarios;
}

// Preserve the isolated preview's existing complete-map/spawn contract.
// TEST V2 in the game imports the independent helper directly.
export function createCollisionTestMapGeometry(world,options){
 if(!world||!Array.isArray(world.triangles)||!Array.isArray(world.colliders)||!world.spawn||!['x','y','z'].every(axis=>Number.isFinite(world.spawn[axis])))throw TypeError('Complete loaded S5 collision arrays and explicit spawn required');
 return createHostCollisionTestMapGeometry(world,options);
}

export async function loadCollisionTestMap(key){
 if(!Object.hasOwn(COLLISION_TEST_MAPS,key))throw Error('Carte de test inconnue : '+key);
 if(key==='test'){
  const geometry=createCollisionTestGeometry();
  const entry=await buildMapEntry(stage=>{
   stage.background=new THREE.Color(0x101824);stage.fog=new THREE.Fog(0x101824,40,95);
   for(const surface of geometry.surfaces){const mesh=new THREE.Mesh(surface.geometry,new THREE.MeshStandardMaterial({color:surface.color,roughness:.85,side:THREE.DoubleSide}));mesh.castShadow=mesh.receiveShadow=true;stage.add(mesh);}
   const grid=new THREE.GridHelper(34,34,0x68859b,0x3a5064);grid.position.y=.003;stage.add(grid);
   return {name:COLLISION_TEST_MAPS.test};
  });
  return {...entry,geometry,scenarios:COLLISION_TEST_SCENARIOS,deathY:-10,cameraFar:130};
 }
 const entry=await buildMapEntry(async stage=>{
  if(key==='station2'||key==='circle2'){const {createImportedMap}=await import('./imported-map.js');return createImportedMap(stage,key);}
  if(key==='azit'||key==='bio-lab'||key==='blade-city'){const {loadNativeArtistMap}=await import('./native-artist-map.js');return loadNativeArtistMap(stage,key);}
  if(key==='alice-house'){const {loadAliceHouseWorld}=await import('./alice-house-world.js');return loadAliceHouseWorld(stage);}
  const {loadIronHeartWorld}=await import('./ironheart-world.js');return loadIronHeartWorld(stage);
 });
 try{
  const geometry=createCollisionTestMapGeometry(entry.world);
  entry.world.target.visible=false;
  return {...entry,geometry,scenarios:collisionTestMapStarts(key,entry.world),
   deathY:Number.isFinite(entry.world.deathY)?entry.world.deathY:geometry.world.tree.bounds.min[1]*unit-10,
   cameraFar:entry.world.cameraFar??1200};
 }catch(error){entry.world.dispose?.();entry.root.removeFromParent();throw error;}
}
