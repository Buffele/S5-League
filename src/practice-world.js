import * as THREE from 'three';
import {readAsset,sceneAsset,collisionTriangles} from './scene-assets.js';
import {configureMapAsset,findMapSpawn} from './imported-map.js';
import {createMapAnimation} from './map-animation.js';
import {sourceMapScale} from './s5runtime-coordinates.js';

// The source map id stays 51..55, never aliases map66. Partial loading is an
// explicit diagnostic choice; missing INI scenes cannot pass readiness.
export async function createPracticeWorld(scene,{mapId,assetRoot='/assets/s5runtime/practice',allowPartial=false,spawnNode}={}){
 if(![52,54,55].includes(mapId))throw Error('Practice scene unresolved for native map'+mapId);
 if(typeof spawnNode!=='string'||!spawnNode)throw Error('Explicit source spawn node required; player spawn producer unverified');
 const data=await readAsset(assetRoot+'/maps/'+mapId+'.json');
 if(data.nativeMapId!==mapId||!Array.isArray(data.missing)||!Array.isArray(data.scenes))throw Error('Practice map contract mismatch');
 if((!data.complete||data.missing.length)&&!allowPartial)throw Error('Practice map'+mapId+' has unresolved INI scenes: '+data.missing.map(r=>r.literal).join(', '));
 const group=new THREE.Group();group.name='Practice map'+mapId;group.scale.set(...sourceMapScale(false));
 const assets=[];
 try{
  for(const source of data.scenes){const asset=await sceneAsset(source,{sky:source.sourceSection==='SKY'});configureMapAsset(asset,source);assets.push(asset);group.add(asset.group);for(const mesh of asset.meshes)for(const material of [].concat(mesh.material))if(material.map){material.map.wrapS=material.map.wrapT=THREE.RepeatWrapping;}}
  scene.add(group);group.updateMatrixWorld(true);
  const meshes=assets.flatMap(a=>a.meshes).filter(m=>m.userData.collision),triangles=collisionTriangles(meshes);
  if(!triangles.length)throw Error('Practice map'+mapId+' has no recovered collision geometry');
  if(!data.scenes.some(s=>s.nodes.some(n=>n.name===spawnNode)))throw Error('Practice source spawn node missing '+spawnNode);
  const spawn=findMapSpawn(data,meshes,{name:group.name,spawnNode,mirrorZ:false}),animations=assets.map((a,i)=>createMapAnimation(a,data.scenes[i]));
  const bounds=new THREE.Box3().setFromObject(group),world={nativeMapId:mapId,name:group.name,group,meshes,triangles,colliders:[],spawn,cameraFar:1200,stepHeight:0,groundSnap:0,deathY:bounds.min.y-10,
   complete:data.complete&&data.missing.length===0,missingScenes:data.missing,nativeReady:false,spawnPolicy:'explicit scene node, projected onto recovered collision floor; native player spawn producer unverified',deathPolicy:'local minimum recovered geometry y minus10',
   update(dt){animations.forEach(a=>a.update(dt));},
   dispose(){group.removeFromParent();for(const asset of assets)for(const mesh of asset.meshes){mesh.geometry.dispose();for(const material of [].concat(mesh.material))material.dispose();}}
  };return world;
 }catch(error){group.removeFromParent();for(const asset of assets)for(const mesh of asset.meshes){mesh.geometry.dispose();for(const material of [].concat(mesh.material))material.dispose();}throw error;}
}
