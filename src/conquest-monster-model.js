import * as THREE from 'three';
import {sceneAsset} from './scene-assets.js';
import {buildAnimationClips} from './animation-data.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {CONQUEST_PAWN_ANIMATIONS} from './conquest-pawn-ai.js';
import {conquestScnHierarchy,conquestScnAnimationRequest} from './conquest-scn-binding.js';
import {conquestFacingQuaternion} from './conquest-monster-facing.js';
import {ConquestMonsterAnimationAdapter} from './conquest-monster-animation.js';
import {updateConquestSkinnedBounds} from './conquest-skinned-bounds.js';
import {conquestBishopSnipeMaterialData} from './conquest-bishop-snipe-material.js';

// Native rigid/weighted monster scenes, exact source hierarchy/inverse binds.
// No humanoid rig, extra scale1.3, weight truncation or clip alias is substituted.
export async function createConquestMonsterModel(data,{monsterKey,size}={}){
 const descriptor=CONQUEST_RENDER_DATA.monsters[monsterKey],nativeSize=Math.fround(size);
 if(!descriptor||data.source!==descriptor.scene||!Number.isFinite(size)||!Number.isFinite(nativeSize)||nativeSize<Math.fround(Number(descriptor.ability.size_min))||nativeSize>Math.fround(Number(descriptor.ability.size_max)))throw Error('Explicit native Conquest model and size required');
 const hierarchy=conquestScnHierarchy(data),asset=await sceneAsset(conquestBishopSnipeMaterialData(data,{monsterKey})),nativeRoot=asset.group,group=new THREE.Group();group.name='Conquest monster '+monsterKey;nativeRoot.name=hierarchy.root.name;nativeRoot.scale.setScalar(SCN_SCENE_SCALE*nativeSize);group.add(nativeRoot);
 const meshes=new Map(asset.meshes.map(m=>[m.userData.sourceModelIndex,m])),nodes=new Map(),bind=new Map(),definitions=[];
 for(const record of hierarchy.nodes){const definition=record.definition,index=record.modelIndex,node=index!==null?(definition.weights.length?new THREE.Group():(meshes.get(index)||new THREE.Group())):new THREE.Bone();node.name=record.name;nodes.set(record.id,node);const parent=nodes.get(record.parentId),matrix=new THREE.Matrix4().fromArray(definition.matrix);if(parent)matrix.premultiply(new THREE.Matrix4().fromArray(hierarchy.byId.get(record.parentId).definition.matrix).invert());(parent||nativeRoot).add(node);matrix.decompose(node.position,node.quaternion,node.scale);bind.set(node,{position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()});definitions.push({...definition,name:'source-node:'+record.id,animations:record.type==='ModelData'?Object.fromEntries(Object.entries(definition.animations||{}).map(([name,entry])=>[name,{data:entry}])):definition.animations});}
 const animationNodes=new Map(hierarchy.nodes.map(record=>['source-node:'+record.id,nodes.get(record.id)])),findSourceNode=name=>{const record=hierarchy.find(name);return record?.id>=0?nodes.get(record.id):null;};
 group.updateMatrixWorld(true);
 for(const [index,definition] of data.models.entries())if(definition.weights.length){
  const original=meshes.get(index),geometry=original.geometry,influences=Array.from({length:definition.vertices.length/3},()=>[]);
  definition.weights.forEach((weight,boneIndex)=>{if(!findSourceNode(weight.bone))throw Error('Missing native Conquest skin bone '+weight.bone);for(const [vertex,value] of weight.values){if(!Number.isInteger(vertex)||!influences[vertex]||!Number.isFinite(value)||value<0)throw Error('Invalid native Conquest skin influence');if(value>0)influences[vertex].push([boneIndex,value]);}});
  const skinIndices=[],skinWeights=[];for(const list of influences){const sum=list.reduce((n,pair)=>n+pair[1],0);if(!sum||list.length>4)throw Error('Unsupported native Conquest skin influence count');for(let i=0;i<4;i++){skinIndices.push(list[i]?.[0]??0);skinWeights.push((list[i]?.[1]??0)/sum);}}
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
  const mesh=new THREE.SkinnedMesh(geometry,original.material);mesh.name=original.name;mesh.userData={...original.userData};mesh.receiveShadow=true;mesh.castShadow=true;mesh.frustumCulled=false;original.removeFromParent();nativeRoot.add(mesh);
  mesh.bind(new THREE.Skeleton(definition.weights.map(w=>findSourceNode(w.bone)),definition.weights.map(w=>new THREE.Matrix4().fromArray(w.matrix))),new THREE.Matrix4());
  asset.meshes[asset.meshes.indexOf(original)]=mesh;meshes.set(index,mesh);
 }
 const clips=buildAnimationClips({clips:data.clips,bones:definitions},animationNodes),mixer=new THREE.AnimationMixer(nativeRoot),byName=new Map(clips.map(c=>[c.name,c]));
 let disposed=false,inspectionAnimation=null,inspectionTransition=0;
 function restoreBind(){mixer.stopAllAction();for(const [node,pose] of bind){node.position.copy(pose.position);node.quaternion.copy(pose.quaternion);node.scale.copy(pose.scale);}group.updateMatrixWorld(true);for(const mesh of asset.meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();updateConquestSkinnedBounds(mesh);}}
 const api={source:data.source,monsterKey,nativeSize,group,nativeRoot,nodes,hierarchy,findSourceNode,meshes:asset.meshes,clips,mixer,nativeReady:false,semanticClipMappingVerified:false,sourceStateMappingAvailable:monsterKey===1003,
  // Pool allocation may precede RNG. Apply the actual sampled size only at
  // actor creation, using the same source range and root scale as above.
  setNativeSize(value){const size=Math.fround(value);if(disposed||!Number.isFinite(value)||!Number.isFinite(size)||size<Math.fround(Number(descriptor.ability.size_min))||size>Math.fround(Number(descriptor.ability.size_max)))throw Error('Live source Conquest size required');api.nativeSize=size;nativeRoot.scale.setScalar(SCN_SCENE_SCALE*size);group.updateMatrixWorld(true);for(const mesh of asset.meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();updateConquestSkinnedBounds(mesh);}return size;},
  restoreBind,
  warmAnimationActions(){
   if(disposed)throw Error('Disposed Conquest model');
   const bindings=new Set();let interpolantCount=0;
   for(const clip of clips){
    const action=mixer.clipAction(clip);interpolantCount+=clip.tracks.length;
    // Three0.186 allocates actions/interpolants in clipAction, but resolves
    // property accessors lazily on first activation. Bind those accessors
    // without playing, sampling, or capturing their original pose early.
    for(const property of action._propertyBindings){
     const binding=property.binding;
     if(binding.getValue===binding._getValue_unbound)binding.bind();
     bindings.add(binding);
    }
   }
   return Object.freeze({clipCount:clips.length,actionCount:mixer.stats.actions.total,bindingCount:bindings.size,interpolantCount,
    activeActionCount:mixer.stats.actions.inUse,activeBindingCount:mixer.stats.bindings.inUse,nativeReady:false});
  },
  sourceStateRequest(stateName,{fallbackByNode}={}){if(monsterKey!==1003)throw Error('Pawn state mapping required');const state=CONQUEST_PAWN_ANIMATIONS[stateName];if(!state||!(fallbackByNode instanceof Map))throw Error('Explicit per-node native fallback keys required');const selections=hierarchy.nodes.map(record=>conquestScnAnimationRequest(hierarchy,{nodeId:record.id,requestedName:state.clip,fallbackName:fallbackByNode.get(record.id)}));return {stateName,requestedName:state.clip,accepted:selections.some(s=>s.accepted),selections,fallbackProducerEstablished:false};},
  // Inspection helper: every call is an explicit new state entry. Production
  // runtime supplies its own serial/rate through the same real adapter.
  playSourceState(stateName,{transitionSerial,playbackRate=1}={}){if(monsterKey!==1003)throw Error('This AI state mapping is authenticated only for normal Pawn1003');const info=CONQUEST_PAWN_ANIMATIONS[stateName];if(!info||!byName.has(info.clip))throw Error('Pawn source clip unavailable '+stateName);inspectionAnimation??=new ConquestMonsterAnimationAdapter(api,{previousRequestedName:''});const serial=transitionSerial??++inspectionTransition;inspectionTransition=Math.max(inspectionTransition,serial);inspectionAnimation.enter(info.stateId,{transitionSerial:serial,playbackRate});return inspectionAnimation.currentAction;},
  update(dt){if(disposed||!Number.isFinite(dt)||dt<0)throw Error('Invalid Conquest render delta');mixer.update(dt);group.updateMatrixWorld(true);for(const mesh of asset.meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();updateConquestSkinnedBounds(mesh);}},
  sampleClip(name,seconds=0){if(disposed||!byName.has(name)||!Number.isFinite(seconds)||seconds<0)throw Error('Invalid Conquest clip sample');restoreBind();const action=mixer.clipAction(byName.get(name));action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.setTime(seconds);group.updateMatrixWorld(true);for(const mesh of asset.meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();updateConquestSkinnedBounds(mesh);}return action;},
  setNativePosition(position){if(!['x','y','z'].every(k=>Number.isFinite(position?.[k])))throw Error('Native Conquest position required');group.position.set(position.x*SCN_SCENE_SCALE,position.y*SCN_SCENE_SCALE,position.z*SCN_SCENE_SCALE);group.updateMatrixWorld(true);},
  setNativeFacing(direction){if(disposed)throw Error('Disposed Conquest model');const quaternion=conquestFacingQuaternion(direction);group.quaternion.fromArray(quaternion);group.updateMatrixWorld(true);return quaternion;},
  bounds(){group.updateMatrixWorld(true);return new THREE.Box3().setFromObject(group);},
  closestSurfacePoint(origin){group.updateMatrixWorld(true);let point=null,distance=Infinity;const triangle=new THREE.Triangle(),candidate=new THREE.Vector3(),center=new THREE.Vector3();for(const mesh of asset.meshes){const p=mesh.geometry.attributes.position,index=mesh.geometry.index;for(let i=0;i<index.count;i+=3){for(const [j,v] of [triangle.a,triangle.b,triangle.c].entries())v.copy(mesh.getVertexPosition(index.getX(i+j),new THREE.Vector3())).applyMatrix4(mesh.matrixWorld);triangle.closestPointToPoint(origin,candidate);const d=candidate.distanceToSquared(origin);if(d<distance){distance=d;triangle.getMidpoint(center);point=candidate.clone().lerp(center,.001);}}}return point;},
  intersectRay(origin,direction,range=Infinity){if(disposed||!Number.isFinite(direction.lengthSq())||direction.lengthSq()<1e-12||range<=0)return null;group.updateMatrixWorld(true);return new THREE.Raycaster(origin,direction.clone().normalize(),0,range).intersectObjects(asset.meshes,false)[0]||null;},
  dispose(){if(disposed)return;disposed=true;inspectionAnimation?.dispose();mixer.stopAllAction();mixer.uncacheRoot(nativeRoot);group.removeFromParent();for(const mesh of asset.meshes){if(mesh.isSkinnedMesh)mesh.skeleton.dispose();mesh.geometry.dispose();for(const material of [].concat(mesh.material))material.dispose();}}
 };
 restoreBind();return api;
}


