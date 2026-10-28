import * as THREE from 'three';
import {sceneAsset} from './scene-assets.js';
import {bindNativeShapes,readNativeShapeEndpoints} from './native-shape.js';
import {NativeShapeNode} from './native-shape-node.js';
import {nativeSingleShapeRoot} from './native-shape-root.js';
import {prepareRocketEffectHierarchy,prepareSourceEffectHierarchy} from './rocket-launcher-effect-hierarchy.js';
import {prepareBatEffectHierarchy} from './bat-effect-hierarchy.js';
import {prepareMeleeEffectHierarchy} from './melee-effect-hierarchy.js';
import {prepareTwinChainHierarchy} from './twin-chain-hierarchy.js';
import {MODEL_ALPHA_DRAW_THRESHOLD} from './model-alpha.js';

// SCN transform, alpha and sparse vertex/UV tracks use 4800 ticks/second.
// VertexMorph/UVMorph start with an integer vertex index, not a float vector.
export function keyInterval(keys,t,time=k=>k[0]){
 let end=keys.findIndex(k=>time(k)>=t);
 if(end<=0){const k=keys[end<0?keys.length-1:0];return [k,k,0];}
 const a=keys[end-1],b=keys[end];return [a,b,(t-time(a))/(time(b)-time(a))];
}
export function scalarKey(keys,t,fallback=1){
 if(!keys?.length)return fallback;
 const [a,b,f]=keyInterval(keys,t);return a[1]+(b[1]-a[1])*f;
}
function sample(target,keys,single,t,quaternion=false){
 if(!keys?.length){if(single)target.fromArray(single);return;}
 const [a,b,f]=keyInterval(keys,t);
 if(quaternion){qa.fromArray(a,1);qb.fromArray(b,1);target.slerpQuaternions(qa,qb,f);}
 else target.set(a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f);
}
const qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),cameraQ=new THREE.Quaternion();
function denseMorph(base,keys,field,width){
 if(!keys.some(k=>k[field]?.length))return [];
 let previous=Float32Array.from(base);
 return keys.map(k=>{
  const values=previous.slice();
  for(const row of k[field]){
   const index=row[0];if(!Number.isInteger(index)||index<0||(index+1)*width>values.length)throw Error('Invalid SCN morph index');
   for(let c=0;c<width;c++)values[index*width+c]=row[c+1];
  }
  previous=values;return {time:k.time,values};
 });
}
export function applyMorph(attribute,keys,t){
 if(!keys.length)return;
 const [a,b,f]=keyInterval(keys,t,k=>k.time),out=attribute.array;
 for(let i=0;i<out.length;i++)out[i]=a.values[i]+(b.values[i]-a.values[i])*f;
 attribute.needsUpdate=true;
}
export function prepareEffectScene(data,group,meshes,{animation='',loop=false,nativeHierarchy=false,sourceTransformTracks=false,sourceEffectTracks=null,sourceHierarchy=null}={}){
 data=normalizeEffectData(data);
 const twin=nativeHierarchy==='twin-chain'?prepareTwinChainHierarchy(data,group,meshes,{animation,loop,sourceHierarchy}):null;
 if(twin)meshes=twin.meshes;
 // Effect SCN files may expose attachment dummies without a render mesh.  A
 // sequence particle can legally name one of those dummies, so resolve names
 // from the complete evaluated effect tree rather than from meshes alone.
 // Preserve the established model source-index precedence (including its
 // duplicate-name case) and add only the explicit non-rendered source
 // dummies. A full traversal would pick hierarchy order instead and can turn
 // a valid duplicate-name source fixture into a parent cycle.
 const byName=twin?.byName??new Map(meshes.map(m=>[m.name,m])),entries=[];
 group.traverse(object=>{if(object.userData.effectSourceBone&&object.name&&!byName.has(object.name))byName.set(object.name,object);});
 const shapes=bindNativeShapes(data.nodes);
 const shapeNodes=new Map([...shapes].map(([name,binding])=>[name,new NativeShapeNode(binding)]));
 const nativeShapeRoot=nativeSingleShapeRoot(data,shapeNodes);
 group.updateMatrixWorld(true);
 for(const mesh of meshes){
  const model=data.models[mesh.userData.sourceModelIndex],state=model.renderState||0;
  // Qualified melee scenes restore all parents below from source indices.
  // The legacy name-only prepass can attach a root-named mesh to its own
  // dummy ancestor before the authoritative hierarchy has a chance to run.
  const parent=nativeHierarchy==='melee-polish'||twin?null:byName.get(model.parent);if(parent&&parent!==mesh)parent.attach(mesh);
  const source=model.effectAnimation||{};
  let track=source[animation]||Object.values(source)[0];
  if(sourceEffectTracks){
   const capture=sourceEffectTracks.models[mesh.userData.sourceModelIndex];
   if(capture?.name!==model.name||!capture.tracks?.[animation])throw Error('Captured effect model/clip mismatch');
   track=capture.tracks[animation];
  }
  if(sourceTransformTracks&&!track){
   const transform=model.animations?.[animation];
   if(!transform)throw Error(`Missing explicit effect model animation ${animation}/${model.name}`);
   track={durationTicks:transform.durationTicks,transform,floatKeys:transform.effect?.floatKeys??[],morphKeys:transform.effect?.morphKeys??[]};
  }
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of materials){
   material.blending=state&32?THREE.AdditiveBlending:THREE.NormalBlending;
   material.transparent=true;material.depthWrite=!(state&64);material.alphaTest=twin&&state&4?.45:0;
   material.toneMapped=false;
   if(material.map){material.map.wrapS=material.map.wrapT=THREE.RepeatWrapping;material.map.needsUpdate=true;}
  }
  mesh.frustumCulled=false;
  entries.push({mesh,track,materials,billboard:!!(state&16),sourceAlphaDrawGate:nativeHierarchy==='melee-polish'||!!twin,
   vertices:denseMorph(model.vertices,track?.morphKeys||[],'vertices',3),
   uv:denseMorph(model.uv,track?.morphKeys||[],'uv',2)});
 }
 let hierarchy=twin?.hierarchy??null;
 if(nativeHierarchy==='hmg'){
  if(data.source!=='effects/skill_gunner_hw_part1.scn'||animation!=='HW'||data.clips.length!==1||data.clips[0].name!=='HW')throw Error('Unqualified HMG effect hierarchy/clip');
  hierarchy=prepareSourceEffectHierarchy(data,group,byName,{animation,loop});
 }else if(nativeHierarchy==='bat')hierarchy=prepareBatEffectHierarchy(data,group,byName,{animation,loop});
 else if(nativeHierarchy==='melee-polish')hierarchy=prepareMeleeEffectHierarchy(data,group,byName,{animation,loop,meshes});
 else if(nativeHierarchy&&!twin)hierarchy=prepareRocketEffectHierarchy(data,group,byName,{animation,loop});
 return {group,meshes,byName,shapes,shapeNodes,nativeShapeRoot,
  evaluatedShapeMatrix(name){if(!hierarchy)throw Error('Evaluated source hierarchy is not enabled');return hierarchy.evaluatedShapeMatrix(name);},
  shapeEndpoints(name,evaluatedGhostMatrix){
   const shape=shapes.get(name);if(!shape)throw new Error('Missing native Shape '+name);
   return readNativeShapeEndpoints(shape,evaluatedGhostMatrix);
  },
  update(seconds,fade=1){
   for(const e of entries){
    const a=e.track;let ticks=seconds*4800;
    if(a?.durationTicks>0)ticks=loop?ticks%a.durationTicks:Math.min(ticks,a.durationTicks);
    const tr=a?.transform;
    if(tr){sample(e.mesh.position,tr.positions,tr.position,ticks);sample(e.mesh.quaternion,tr.rotations,tr.rotation,ticks,true);sample(e.mesh.scale,tr.scales,tr.scale,ticks);}
    const sourceAlpha=scalarKey(a?.floatKeys,ticks),alpha=THREE.MathUtils.clamp(sourceAlpha,0,1)*fade;
    for(const m of e.materials){
     m.opacity=alpha;
     // Apply the native finite-product draw threshold to the alpha currently
     // represented by this renderer (source curve times loader fade). Skip
     // only this model's draw, never its children or animated transform.
     // Native parent-alpha composition remains separately unqualified.
     if(e.sourceAlphaDrawGate)m.visible=alpha>=MODEL_ALPHA_DRAW_THRESHOLD;
    }
    applyMorph(e.mesh.geometry.attributes.position,e.vertices,ticks);
    applyMorph(e.mesh.geometry.attributes.uv,e.uv,ticks);
   }
   if(hierarchy)hierarchy.update(seconds);else group.updateMatrixWorld(true);
  },
  render(camera){
   camera.getWorldQuaternion(cameraQ);
   for(const e of entries)if(e.billboard){
    e.mesh.parent.getWorldQuaternion(parentQ);e.mesh.quaternion.copy(parentQ.invert()).multiply(cameraQ);e.mesh.updateMatrixWorld(true);
   }
  },
 };
}
export async function loadEffectScene(data,options){
 data=normalizeEffectData(data);
 const {group,meshes}=await sceneAsset(data,{effect:true});
 if(options?.includeSourceBones)installEffectBones(data,group,{keepFlat:options.nativeHierarchy==='melee-polish'});
 if(options?.sourceOrigin){
  const origin=options.sourceOrigin,definition=origin.bone?data.bones?.find(b=>b.name===origin.bone):data.models.find(m=>m.name===origin.model);
  if(!definition?.matrix)throw Error('Missing explicit source effect origin');
  // Preserve authored model axes/scale and animation tracks. Only subtract
  // the exported scene-space pivot before attaching to the weapon socket.
  const p=new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(definition.matrix));
  group.position.copy(p).negate();group.updateMatrixWorld(true);
 }
 return prepareEffectScene(data,group,meshes,options);
}

// Capture a pristine template before its first animation update. Each effect
// owns transforms, morph buffers, opacity and native Shape runtime objects;
// immutable source tracks and loaded textures can be shared.
export function createEffectSceneFactory(data,effect,options){
 data=normalizeEffectData(data);
 const cloneGroup=source=>{
  const group=source.clone(true),meshes=[];
  group.traverse(object=>{
   if(!object.isMesh)return;
   object.geometry=object.geometry.clone();
   object.material=Array.isArray(object.material)?object.material.map(m=>m.clone()):object.material.clone();
   meshes.push(object);
  });
  // Traversal order differs from source order once models have been parented.
  // Duplicate native names must resolve to the same source-index instance as
  // the pristine flat scene, or an ancestor can be attached to its own child.
  meshes.sort((a,b)=>a.userData.sourceModelIndex-b.userData.sourceModelIndex);
  return {group,meshes};
 };
 const template=cloneGroup(effect.group).group;
 return ()=>{
  const {group,meshes}=cloneGroup(template);
  return prepareEffectScene(data,group,meshes,options);
 };
}

function normalizeEffectData(data){
 // Some source effects are exported as a one-scene array while ordinary
 // effects are an object.  Both are valid decoded resources; do not require
 // callers to create duplicate wrapper assets just for the renderer.
 const scene=Array.isArray(data)?data[0]:data;
 if(!scene?.models)throw Error('Effect scene has no decoded models');
 return scene;
}

function installEffectBones(data,group,{keepFlat=false}={}){
 const known=new Map();group.traverse(object=>{if(object.name&&!known.has(object.name))known.set(object.name,object);});
 const pending=[];
 for(const bone of data.bones||[]){
  if(!bone?.name||known.has(bone.name))continue;
  const dummy=new THREE.Object3D();dummy.name=bone.name;
  dummy.userData.effectSourceBone=true;
  new THREE.Matrix4().fromArray(bone.matrix).decompose(dummy.position,dummy.quaternion,dummy.scale);
  group.add(dummy);known.set(dummy.name,dummy);pending.push([dummy,bone.parent]);
 }
 // Source bone matrices are scene-space matrices.  `attach` retains that
 // transform while restoring the decoded parent relation for named children.
 group.updateMatrixWorld(true);
 for(const [dummy,parentName] of keepFlat?[]:pending){
  const parent=known.get(parentName);if(parent&&parent!==dummy)parent.attach(dummy);
 }
 group.updateMatrixWorld(true);
}
