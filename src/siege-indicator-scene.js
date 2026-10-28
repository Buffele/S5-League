import * as THREE from 'three';
import {sceneAsset} from './scene-assets.js';
import {prepareEffectScene,keyInterval} from './effect-scene.js';

function sample(target,keys,single,t,quaternion=false){
 if(!keys?.length){target.fromArray(single);return;}
 const [a,b,f]=keyInterval(keys,t);
 if(quaternion)target.fromArray(a,1).slerp(new THREE.Quaternion().fromArray(b,1),f);
 else target.set(...a.slice(1).map((v,i)=>v+(b[i+1]-v)*f));
}

// Dedicated source-index hierarchy. A source root name can also name a mesh;
// it denotes the container before child-name resolution. Duplicate mesh names
// remain distinct instances. No global renderer/hierarchy policy is changed.
export function prepareSiegeIndicator(data,{group,meshes},{animation,loop=false}){
 if(!/^(model\/background\/(indicator_seize_[a-z0-9_]+|indicator_base_(red|green))|effects\/seize_flag_(in|out)_(atex|etex))\.scn$/.test(data.source)||data.rootNode?.name!==data._meta?.headerName)throw Error('Authenticated Siege indicator root required');
 if(!data.clips.some(c=>c.name===animation))throw Error('Exact Siege indicator clip required');
 const effect=prepareEffectScene(data,group,meshes,{animation,loop});
 const byIndex=new Map(meshes.map(m=>[m.userData.sourceModelIndex,m])),objects=[],names=new Map(),bones=[];let modelIndex=0;
 for(const node of data.nodes){
  if(node.type==='Shape')continue; // Source Shape metadata retained; no trail emitter inferred.
  if(!['ModelData','Bone','BoneSystem'].includes(node.type))throw Error('Unsupported Siege visual node '+node.type);
  const object=node.type==='ModelData'?(byIndex.get(modelIndex++)??new THREE.Object3D()):new THREE.Object3D();
  object.name=node.name;object.removeFromParent();new THREE.Matrix4().fromArray(node.matrix).decompose(object.position,object.quaternion,object.scale);
  const entry={node,object};objects.push(entry);names.set(node.name,[...(names.get(node.name)||[]),entry]);
 }
 new THREE.Matrix4().fromArray(data.rootNode.matrix).decompose(group.position,group.quaternion,group.scale);
 const visiting=new Set(),done=new Set();
 function attach(entry){
  if(done.has(entry))return;
  if(visiting.has(entry))throw Error('Cyclic Siege source hierarchy');visiting.add(entry);
  if(!entry.node.parent||entry.node.parent===data.rootNode.name)group.add(entry.object);
  else{const parents=names.get(entry.node.parent);if(parents?.length!==1)throw Error('Ambiguous Siege visual parent '+entry.node.parent);attach(parents[0]);parents[0].object.add(entry.object);}
  visiting.delete(entry);done.add(entry);
 }
 for(const entry of objects)attach(entry);
 for(const bone of data.bones){
  const candidates=names.get(bone.name);if(candidates?.length!==1)throw Error('Ambiguous Siege animation bone');
  const track=bone.animations?.[animation];if(track?.copy)throw Error('Unresolved Siege bone clip alias');
  if(track?.data)bones.push({object:candidates[0].object,track:track.data});
 }
 group.updateMatrixWorld(true);
 const update=effect.update.bind(effect);
 return {...effect,
  update(seconds){
   update(seconds);
   for(const {object,track} of bones){const ticks=loop&&track.durationTicks>0?seconds*4800%track.durationTicks:Math.min(seconds*4800,track.durationTicks);sample(object.position,track.positions,track.position,ticks);sample(object.quaternion,track.rotations,track.rotation,ticks,true);sample(object.scale,track.scales,track.scale,ticks);}
   group.updateMatrixWorld(true);
  },
  hierarchy:{sourceRoot:data.rootNode.name,modelInstances:objects.filter(e=>e.node.type==='ModelData').length,bones:bones.length,shapeEmissionVerified:false},
 };
}
export async function loadSiegeIndicator(data,options){
 const scene=await sceneAsset(data,{effect:true});
 try{return prepareSiegeIndicator(data,scene,options);}
 catch(error){for(const mesh of scene.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}throw error;}
}
