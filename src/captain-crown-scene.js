import * as THREE from 'three';
import {sceneAsset} from './scene-assets.js';

const sourcePattern=/^model\/character\/captainmark\/captain_crown_(self|atex|etex)\.scn$/;
// All three authenticated crowns have constant tracks equal to their bind
// matrices. No SCN default animation/loop policy is assumed for this model.
export function prepareCaptainCrown(data,{group,meshes}){
 if(!sourcePattern.test(data.source)||data.rootNode?.name!==data._meta?.headerName)throw Error('Authenticated Captain crown source required');
 const clip=data.source.split('/').at(-1).replace('.scn','');
 if(data.clips.length!==1||data.clips[0].name!==clip)throw Error('Exact Captain crown clip required');
 const byIndex=new Map(meshes.map(m=>[m.userData.sourceModelIndex,m])),entries=[],byName=new Map();let index=0;
 for(const node of data.nodes){
  if(!['ModelData','Bone'].includes(node.type))throw Error('Unsupported Captain crown node');
  const model=node.type==='ModelData'?data.models[index]:null;
  const track=model?model.effectAnimation?.[clip]:data.bones.find(b=>b.name===node.name)?.animations?.[clip]?.data;
  const transform=model?track?.transform:track;
  if(!transform||['positions','rotations','scales'].some(key=>transform[key]?.length)||track.floatKeys?.length||track.morphKeys?.length)throw Error('Captain crown must retain its proven constant tracks');
  const constant=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(transform.position),new THREE.Quaternion().fromArray(transform.rotation),new THREE.Vector3().fromArray(transform.scale));
  if(!node.matrix?.every(Number.isFinite)||constant.elements.some((v,i)=>!Number.isFinite(v)||Math.abs(v-node.matrix[i])>1e-6))throw Error('Captain crown bind/constant track mismatch');
  const object=model?(byIndex.get(index++)??new THREE.Object3D()):new THREE.Object3D();
  if(byName.has(node.name))throw Error('Ambiguous Captain crown node');
  object.name=node.name;object.removeFromParent();new THREE.Matrix4().fromArray(node.matrix).decompose(object.position,object.quaternion,object.scale);
  const entry={node,object};entries.push(entry);byName.set(node.name,entry);
 }
 new THREE.Matrix4().fromArray(data.rootNode.matrix).decompose(group.position,group.quaternion,group.scale);
 const attached=new Set(),visiting=new Set();
 function attach(entry){
  if(attached.has(entry))return;if(visiting.has(entry))throw Error('Cyclic Captain crown hierarchy');visiting.add(entry);
  if(!entry.node.parent||entry.node.parent===data.rootNode.name)group.add(entry.object);
  else{const parent=byName.get(entry.node.parent);if(!parent)throw Error('Missing Captain crown parent');attach(parent);parent.object.add(entry.object);}
  visiting.delete(entry);attached.add(entry);
 }
 entries.forEach(attach);group.name=clip;group.updateMatrixWorld(true);
 return {group,meshes,source:data.source,staticTracksVerified:true,particleAnchor:byName.get('captain_crown_bling_Dummy')?.object??null};
}
export async function loadCaptainCrown(data){
 const scene=await sceneAsset(data);
 try{return prepareCaptainCrown(data,scene);}
 catch(error){for(const mesh of scene.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}throw error;}
}
