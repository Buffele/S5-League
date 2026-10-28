import * as THREE from 'three';
import {conquestScnHierarchy} from './conquest-scn-binding.js';
import {buildAnimationClips} from './animation-data.js';

// The native sky is drawn independently of map distance culling. As for the
// Station 2 sky, fit this background inside S5's far plane and draw it first.
// This changes only the background presentation, never map geometry/collision.
export function configureConquestMapSky(asset){
 asset.group.scale.setScalar(.1);
 for(const mesh of asset.meshes){
  mesh.renderOrder=-1000;
  for(const material of [].concat(mesh.material)){
   material.depthTest=false;material.depthWrite=false;material.fog=false;
  }
 }
}

// Animated Conquest scenery uses the same local animation tracks as the SCN
// actors. Flattening its models discards the timer/sandglass/gear pivots and
// leaves their large geometry at the map origin. Keep source record identity:
// names can repeat and sceneAsset loads textures concurrently.
export function createConquestMapDecoration(asset,data){
 if(!data.bones?.length)return null;
 const hierarchy=conquestScnHierarchy(data),meshes=new Map(asset.meshes.map(m=>[m.userData.sourceModelIndex,m])),nodes=new Map(),definitions=[];
 for(const record of hierarchy.nodes){
  const node=record.modelIndex===null?new THREE.Group():meshes.get(record.modelIndex);
  if(!node)throw Error('Missing Conquest decoration model '+record.id);
  const parent=nodes.get(record.parentId),matrix=new THREE.Matrix4().fromArray(record.definition.matrix);
  // The serialized bind matrices are absolute; animation tracks are local.
  if(parent)matrix.premultiply(new THREE.Matrix4().fromArray(hierarchy.byId.get(record.parentId).definition.matrix).invert());
  node.name=record.name;node.matrixAutoUpdate=true;matrix.decompose(node.position,node.quaternion,node.scale);
  (parent||asset.group).add(node);nodes.set(record.id,node);
  definitions.push({...record.definition,name:'decoration:'+record.id,animations:record.type==='ModelData'?Object.fromEntries(Object.entries(record.definition.animations||{}).map(([key,value])=>[key,{data:value}])):record.definition.animations});
 }
 if(data.clips.length!==1||data.clips[0].name!=='WAVE_SQ_M')throw Error('Conquest decoration source clip unresolved');
 const clips=buildAnimationClips({clips:data.clips,bones:definitions},new Map(hierarchy.nodes.map(r=>['decoration:'+r.id,nodes.get(r.id)])));
 const mixer=new THREE.AnimationMixer(asset.group),action=mixer.clipAction(clips[0]);
 action.play();mixer.update(0);asset.group.updateMatrixWorld(true);
 let disposed=false;
 return {nodes,clip:clips[0],update(dt){if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Conquest scenery delta');mixer.update(dt);asset.group.updateMatrixWorld(true);},dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(asset.group);}};
}
