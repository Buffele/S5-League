import * as THREE from 'three';
import {loadAvatar} from './avatar.js';
import {createNativeFusion} from './ai4animation-native-fusion.js';
import {trialRootPosition} from './ai4animation-controls.js';

// Geno and the imported SCN face opposite Z axes. The reflection preserves the
// native L/R bone assignments; the actor's normal pi yaw makes it face +Z.
const reflection=new THREE.Matrix4().makeScale(1,1,-1);
const forward=new THREE.Vector3(0,0,1),up=new THREE.Vector3(0,1,0);
const mappings=[
 ['Bip01','Hips','Bip01 Spine','Spine'],
 ['Bip01 Pelvis','Hips','Bip01 Spine','Spine'],
 ['Bip01 Spine','Spine','Bip01 Spine1','Spine2'],
 ['Bip01 Spine1','Spine2','Bip01 Spine2','Spine3'],
 ['Bip01 Spine2','Spine3','Bip01 Neck','Neck'],
 ['Bip01 Neck','Neck','Bip01 Head','Head'],
];
for(const [side,full]of [['L','Left'],['R','Right']]){
 for(const [bone,source,child,sourceChild]of [
  ['Clavicle','Shoulder','UpperArm','Arm'],['UpperArm','Arm','Forearm','ForeArm'],
  ['Forearm','ForeArm','Hand','Hand'],['Hand','Hand','Finger2','HandMiddle1'],
  ['Thigh','UpLeg','Calf','Leg'],['Calf','Leg','Foot','Foot'],['Foot','Foot','Toe0','ToeBase'],
 ])mappings.push([`Bip01 ${side} ${bone}`,full+source,`Bip01 ${side} ${child}`,full+sourceChild]);
}

function anatomicalFrame(direction,normal){
 const x=direction.clone().normalize();
 let y=new THREE.Vector3().crossVectors(normal,x);
 if(y.lengthSq()<1e-8)y.crossVectors(Math.abs(x.y)<.9?up:forward,x);
 y.normalize();const z=new THREE.Vector3().crossVectors(x,y).normalize();
 return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
}
const position=m=>new THREE.Vector3().setFromMatrixPosition(m);
const rotation=m=>new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(m)).normalize();
const mirror=v=>new THREE.Vector3(v.x,v.y,-v.z);

export async function createNeuralS5Runtime(sex,sourceRest){
 const reference=await fetch(`/assets/s5runtime/rig-${sex}.json`).then(r=>r.json());
 const actor=await loadAvatar({appearance:'s5runtime',sex,outfit:'01',weapon:'dagger',weaponSkin:'classic'});
 return retargetNeuralActor(actor,reference,sourceRest);
}

export function retargetNeuralActor(actor,reference,sourceRest){
 actor.prepareSwitch();actor.mixer.stopAllAction();
 const rest=new Map(reference.bones.map(b=>[b.name,new THREE.Matrix4().fromArray(b.matrix)]));
 const local=new Map();
 for(const d of reference.bones){
  const m=rest.get(d.name).clone();if(rest.has(d.parent))m.premultiply(rest.get(d.parent).clone().invert());
  local.set(d.name,m);const bone=actor.bones.get(d.name);m.decompose(bone.position,bone.quaternion,bone.scale);
 }
 for(const mesh of actor.meshes)if(mesh.userData.weapon)mesh.visible=false;
 actor.group.rotation.y=Math.PI;
 actor.group.updateMatrixWorld(true);
 const scale=actor.rig.scale.y;
 const ratio=position(rest.get('Bip01')).y*scale/position(sourceRest.get('Hips')).y;
 const binds=new Map();
 for(const [target,source,child,sourceChild]of mappings){
  if(!sourceRest.has(source)||!sourceRest.has(sourceChild))throw Error(`Missing neural source joint ${sourceChild}`);
  const isFoot=target.endsWith(' Foot');
  const targetDir=position(rest.get(child)).sub(position(rest.get(target)));
  const targetNormal=isFoot?up:new THREE.Vector3(0,0,-1);
  const targetFrame=anatomicalFrame(targetDir,targetNormal);
  binds.set(target,{source,sourceChild,isFoot,sourceRestQ:rotation(sourceRest.get(source)),
   targetRestQ:rotation(rest.get(target)),offset:targetFrame.invert().multiply(rotation(rest.get(target)))});
 }
 // Cache actual low shoe vertices to keep different rig proportions grounded.
 const sole=[];
 for(const mesh of actor.meshes){
  if(!mesh.isSkinnedMesh||!mesh.visible)continue;
  const count=mesh.geometry.attributes.position.count,indices=[];
  for(let i=0;i<count;i++){
   const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
   if(p.y<.14)indices.push(i);
  }
  const stride=Math.max(1,Math.floor(indices.length/160));
  for(let i=0;i<indices.length;i+=stride)sole.push([mesh,indices[i]]);
 }
 const footNames=['LeftFoot','LeftToeBase','RightFoot','RightToeBase'];
 const sourceFloor=Math.min(...footNames.map(n=>position(sourceRest.get(n)).y));
 const fusion=createNativeFusion(reference,actor,local,rest);
 let lastFrame=-1,lastOptions='';
 const diagnostics={};
 return {actor,ratio,mappedBones:binds.size,diagnostics,apply(p,current,options={}){
  const optionsKey=JSON.stringify(options);
  if(p.frame===lastFrame&&optionsKey===lastOptions)return actor.group.position;lastFrame=p.frame;lastOptions=optionsKey;
  const worlds=new Map();
  for(const d of reference.bones){
   const inherited=local.get(d.name).clone();if(worlds.has(d.parent))inherited.premultiply(worlds.get(d.parent));
   const bind=binds.get(d.name);
   if(bind){
    const source=current.get(bind.source),sourceChild=current.get(bind.sourceChild);
    const direction=mirror(position(sourceChild).sub(position(source)));
    const delta=rotation(source).multiply(bind.sourceRestQ.clone().invert());
    const normal=mirror((bind.isFoot?up:forward).clone().applyQuaternion(delta));
    // An ankle-to-toe vector has a different downward slope on the two rigs.
    // Transfer foot rotation relative to its flat bind pose, rather than making
    // S5Runtime's shoe follow Geno's absolute ankle-to-toe slope (about 30deg off).
    const q=bind.isFoot?new THREE.Quaternion().setFromRotationMatrix(
     reflection.clone().multiply(new THREE.Matrix4().makeRotationFromQuaternion(delta)).multiply(reflection)
    ).multiply(bind.targetRestQ):anatomicalFrame(direction,normal).multiply(bind.offset);
    const point=position(inherited);inherited.compose(point,q,new THREE.Vector3(1,1,1));
   }
   if(d.name==='Bip01'){
    const hip=position(current.get('Hips')).sub(position(sourceRest.get('Hips'))).sub(new THREE.Vector3(...p.root));
    inherited.setPosition(position(rest.get('Bip01')).add(mirror(hip).multiplyScalar(ratio/scale)));
   }
   worlds.set(d.name,inherited);
   const relative=inherited.clone();if(worlds.has(d.parent))relative.premultiply(worlds.get(d.parent).clone().invert());
   const bone=actor.bones.get(d.name);relative.decompose(bone.position,bone.quaternion,bone.scale);
  }
  const weight=THREE.MathUtils.clamp(options.weight??1,0,1);
  const native=fusion.sample(worlds,p.frame,{...options,weight});
  for(const [name,pose]of native.pose){const bone=actor.bones.get(name);bone.position.lerpVectors(pose.position,bone.position,weight);bone.quaternion.slerp(pose.quaternion,1-weight);bone.scale.lerpVectors(pose.scale,bone.scale,weight);}
  Object.assign(diagnostics,{weight,phase:native.phase,direction:native.direction,clips:native.clips});
  const displayRoot=trialRootPosition(p.root,true,ratio);
  actor.group.position.set(displayRoot.x,0,displayRoot.z);
  actor.group.updateMatrixWorld(true);
  const clearance=Math.max(0,Math.min(...footNames.map(n=>position(current.get(n)).y))-sourceFloor)*ratio;
  let floor=Infinity;const v=new THREE.Vector3();
  for(const [mesh,index]of sole)floor=Math.min(floor,mesh.getVertexPosition(index,v).applyMatrix4(mesh.matrixWorld).y);
  if(Number.isFinite(floor))actor.group.position.y=clearance-floor;
  actor.group.updateMatrixWorld(true);
  return actor.group.position;
 }};
}
