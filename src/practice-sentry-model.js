import * as THREE from 'three';
import {sceneAsset} from './scene-assets.js';
import {buildAnimationClips} from './animation-data.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// Rigid source hierarchy, not a humanoid rig. Clip names are exposed literally;
// no S1/S2/... semantic state is inferred by this renderer.
export async function createPracticeSentryModel(data){
 if(data.source?.toLowerCase()!=='model/weapon/sentrygun.scn'||data.models.some(m=>m.weights?.length))throw Error('Expected authenticated rigid SentryGun scene');
 return buildPracticeSentryInstance(data,await sceneAsset(data));
}
function buildPracticeSentryInstance(data,asset){
 const nativeRoot=asset.group,group=new THREE.Group();group.name='Practice Sentry';nativeRoot.name='Sentry native coordinates';nativeRoot.scale.setScalar(SCN_SCENE_SCALE);group.add(nativeRoot);
 const meshes=new Map(asset.meshes.map(m=>[m.userData.sourceModelIndex,m])),nodes=new Map(),definitions=[...data.bones,...data.models.map(m=>({...m,animations:Object.fromEntries(Object.entries(m.animations||{}).map(([name,entry])=>[name,{data:entry}]))}))];
 for(const definition of definitions){if(nodes.has(definition.name))throw Error('Ambiguous Sentry hierarchy '+definition.name);const modelIndex=data.models.findIndex(m=>m===definition||m.name===definition.name),node=modelIndex>=0?meshes.get(modelIndex):new THREE.Group();if(!node)throw Error('Missing Sentry geometry '+definition.name);node.name=definition.name;nodes.set(definition.name,node);}
 const bind=new Map();
 for(const definition of definitions){const node=nodes.get(definition.name),parent=nodes.get(definition.parent),matrix=new THREE.Matrix4().fromArray(definition.matrix);if(parent){const parentDefinition=definitions.find(d=>d.name===definition.parent);matrix.premultiply(new THREE.Matrix4().fromArray(parentDefinition.matrix).invert());parent.add(node);}else nativeRoot.add(node);matrix.decompose(node.position,node.quaternion,node.scale);bind.set(node,{position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()});}
 const clips=buildAnimationClips({clips:data.clips,bones:definitions},nodes),mixer=new THREE.AnimationMixer(nativeRoot),byName=new Map(clips.map(c=>[c.name,c]));
 let disposed=false;
 function restoreBind(){mixer.stopAllAction();for(const [node,pose] of bind){node.position.copy(pose.position);node.quaternion.copy(pose.quaternion);node.scale.copy(pose.scale);}group.updateMatrixWorld(true);}
 const api={group,nativeRoot,nodes,meshes:asset.meshes,clips,mixer,semanticClipMappingVerified:false,
  restoreBind,
  clone(){
   if(disposed)throw Error('Sentry model disposed');
   const meshes=asset.meshes.map(source=>{const mesh=source.clone(false);mesh.geometry=source.geometry.clone();mesh.material=Array.isArray(source.material)?source.material.map(m=>m.clone()):source.material.clone();return mesh;});
   // Rebuild literal source bind matrices and new track UUIDs, independently
   // of the template's current animated pose. Textures stay in the shared cache.
   return buildPracticeSentryInstance(data,{group:new THREE.Group(),meshes});
  },
  sampleClip(name,seconds=0){if(disposed||!byName.has(name)||!Number.isFinite(seconds)||seconds<0)throw Error('Invalid Sentry clip sample');restoreBind();const action=mixer.clipAction(byName.get(name));action.reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.setTime(seconds);group.updateMatrixWorld(true);return action;},
  setNativePosition(position){if(!['x','y','z'].every(k=>Number.isFinite(position?.[k])))throw Error('Native Sentry position required');group.position.set(position.x*SCN_SCENE_SCALE,position.y*SCN_SCENE_SCALE,position.z*SCN_SCENE_SCALE);group.updateMatrixWorld(true);},
  bounds(){group.updateMatrixWorld(true);return new THREE.Box3().setFromObject(group);},
  closestSurfacePoint(origin){group.updateMatrixWorld(true);let point=null,distance=Infinity;const triangle=new THREE.Triangle(),candidate=new THREE.Vector3(),center=new THREE.Vector3();for(const mesh of asset.meshes){const p=mesh.geometry.attributes.position,index=mesh.geometry.index;for(let i=0;i<index.count;i+=3){for(const [j,v] of [triangle.a,triangle.b,triangle.c].entries())v.fromBufferAttribute(p,index.getX(i+j)).applyMatrix4(mesh.matrixWorld);triangle.closestPointToPoint(origin,candidate);const d=candidate.distanceToSquared(origin);if(d<distance){distance=d;triangle.getMidpoint(center);point=candidate.clone().lerp(center,.001);}}}return point;},
  intersectRay(origin,direction,range=Infinity){if(disposed||!Number.isFinite(direction.lengthSq())||direction.lengthSq()<1e-12||range<=0)return null;group.updateMatrixWorld(true);return new THREE.Raycaster(origin,direction.clone().normalize(),0,range).intersectObjects(asset.meshes,false)[0]||null;},
  dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(nativeRoot);group.removeFromParent();for(const mesh of asset.meshes){mesh.geometry.dispose();for(const material of [].concat(mesh.material))material.dispose();}}
 };
 restoreBind();return api;
}

