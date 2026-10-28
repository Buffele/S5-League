import * as THREE from 'three';
import {readAsset,sceneAsset,collisionTriangles} from './scene-assets.js';
import {configureMapAsset,findMapSpawn} from './imported-map.js';
import {createMapAnimation} from './map-animation.js';
import {createConquestMapDecoration,configureConquestMapSky} from './conquest-map-decoration.js';
import {sourceMapScale} from './s5runtime-coordinates.js';
import {CONQUEST_BASE_SOURCE,CONQUEST_BASE_AUTHORED_OBB} from './conquest-base-data.js';
import {ConquestBaseGate,conquestSafeZoneSelectors} from './conquest-base-gate.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {createConquestSourceCollisionWorld} from './conquest-collision-source.js';
import {createConquestMapShadows} from './conquest-map-shadows.js';
export async function createConquestWorld(scene,{assetRoot='/assets/s5runtime/conquest',allowIncompleteTextures=false,spawnNode}={}){
 if(typeof spawnNode!=='string'||!spawnNode)throw Error('Explicit source Conquest player spawn required');
 const data=await readAsset(assetRoot+'/maps/46.json');if(data.nativeMapId!==46||!Array.isArray(data.scenes)||!Array.isArray(data.unresolvedTextures))throw Error('Conquest map source contract mismatch');
 const baseScenes=data.scenes.filter(s=>s.source===CONQUEST_BASE_SOURCE.source),baseNodes=baseScenes.flatMap(s=>s.nodes.filter(n=>n.name===CONQUEST_BASE_SOURCE.marker));
 if(baseScenes.length!==1||baseNodes.length!==1||baseNodes[0].type!=='Box'||baseNodes[0].parent!==''||
  !CONQUEST_BASE_AUTHORED_OBB.center.every((v,i)=>baseNodes[0].matrix[12+i]===v)||
  !CONQUEST_BASE_AUTHORED_OBB.axes.every((axis,i)=>axis.every((v,j)=>baseNodes[0].matrix[i*4+j]===v)))throw Error('Conquest authored base Box/source map mismatch');
 const scale=sourceMapScale(false),baseAuthoredBox={source:CONQUEST_BASE_SOURCE,
  native:{center:[...CONQUEST_BASE_AUTHORED_OBB.center],halfExtents:[...CONQUEST_BASE_AUTHORED_OBB.halfExtents],axes:CONQUEST_BASE_AUTHORED_OBB.axes.map(a=>[...a])},
  scene:{center:CONQUEST_BASE_AUTHORED_OBB.center.map((v,i)=>v*scale[i]),halfExtents:CONQUEST_BASE_AUTHORED_OBB.halfExtents.map((v,i)=>v*scale[i]),axes:CONQUEST_BASE_AUTHORED_OBB.axes.map(a=>[...a])}};
 if(CONQUEST_SOURCE_DATA.pveRule.base_object_1!==CONQUEST_BASE_SOURCE.marker)throw Error('Conquest INI/source base mismatch');
 const selectors=conquestSafeZoneSelectors(CONQUEST_BASE_SOURCE.marker);if(selectors.length!==1)throw Error('Conquest native base selector unresolved');
 const baseGate=new ConquestBaseGate({name:CONQUEST_BASE_SOURCE.marker,selector:selectors[0],obb:baseAuthoredBox.native});
 baseGate.loadHealth(Number(CONQUEST_SOURCE_DATA.pveRule.base_object_1_hp));
 if(data.unresolvedTextures.length&&!allowIncompleteTextures)throw Error('Conquest map textures unresolved: '+data.unresolvedTextures.map(r=>r.literal).join(', '));
 const collisionBundle=await readAsset(assetRoot+'/collision/46.json'),collisionSourceWorld=createConquestSourceCollisionWorld(collisionBundle,{renderSources:data.scenes});
 const group=new THREE.Group(),assets=[],decorations=[];group.name='Conquest native map46';group.scale.set(...sourceMapScale(false));
 try{for(const source of data.scenes){const asset=await sceneAsset(source,{sky:source.source.includes('sky_')});configureMapAsset(asset,source);const hidden=new Set(source.unresolvedTextures.map(r=>r.model));for(const mesh of asset.meshes){if(hidden.has(mesh.name))mesh.visible=false;for(const material of [].concat(mesh.material))if(material.map){material.map.wrapS=material.map.wrapT=THREE.RepeatWrapping;}}assets.push(asset);group.add(asset.group);}
  for(const [i,asset]of assets.entries()){if(data.scenes[i].source.includes('sky_'))configureConquestMapSky(asset);const decoration=createConquestMapDecoration(asset,data.scenes[i]);if(decoration)decorations.push(decoration);}
  scene.add(group);group.updateMatrixWorld(true);const shadows=createConquestMapShadows({assets,sources:data.scenes}),meshes=assets.flatMap(a=>a.meshes).filter(m=>m.userData.collision),triangles=collisionTriangles(meshes);if(!triangles.length)throw Error('Conquest recovered collision geometry absent');if(!data.scenes.some(s=>s.nodes.some(n=>n.name===spawnNode)))throw Error('Conquest spawn node unresolved');const spawn=findMapSpawn(data,meshes,{name:group.name,spawnNode,mirrorZ:false}),animations=assets.map((a,i)=>createMapAnimation(a,data.scenes[i]));
  return {name:group.name,nativeMapId:46,group,meshes,triangles,colliders:[],spawn,cameraFar:1200,stepHeight:0,groundSnap:0,deathY:new THREE.Box3().setFromObject(group).min.y-10,nativeReady:false,unresolvedTextures:data.unresolvedTextures,diagnosticHiddenModels:data.unresolvedTextures.map(r=>r.model),baseAuthoredBox,baseGates:[baseGate],baseGateStaticNameBindingEstablished:true,baseCollisionVolumeEstablished:false,
   sourceData:collisionBundle,nativeCollisionSources:collisionSourceWorld.nativeCollisionSources,collisionSourceWorld,
   applyPresentation:context=>shadows.applyPresentation(context),shadowSnapshot:()=>shadows.snapshot(),
   update(dt){decorations.forEach(a=>a.update(dt));animations.forEach(a=>a.update(dt));},dispose(){decorations.forEach(a=>a.dispose());collisionSourceWorld.dispose();group.removeFromParent();for(const a of assets)for(const m of a.meshes){m.geometry.dispose();for(const material of [].concat(m.material))material.dispose();}}};
 }catch(error){decorations.forEach(a=>a.dispose());collisionSourceWorld.dispose();group.removeFromParent();for(const a of assets)for(const m of a.meshes){m.geometry.dispose();for(const material of [].concat(m.material))material.dispose();}throw error;}
}
