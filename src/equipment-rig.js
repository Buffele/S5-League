import * as THREE from 'three';
import {needsEquipmentHierarchy,prepareEquipmentHierarchy} from './equipment-hierarchy.js';

const ALIGNMENT_NODES=new Map([
  ['model/weapon/smg_02.scn','Smg_02_Wea_Dummy'],
  // Air Gun's Revolver_Wea_Dummy01 is the authored grip origin. Leaving its
  // bind transform below R_Hand_Dummy applies a second ~57-unit offset.
  ['model/weapon/airgun.scn','Revolver_Wea_Dummy01'],
  // Classic Revolver uses Revolver_Wea_Dummy as the native link origin.
  // Keeping that authored scene transform below R_Hand_Dummy rotates the
  // barrel sideways and applies the grip offset a second time.
  ['model/weapon/revolver.scn','Revolver_Wea_Dummy'],
  // Semi Rifle authors its grip in Smg_02_Wea_Dummy. Keeping that world-space
  // matrix below R_Hand_Dummy rotates and offsets the gun a second time.
  ['model/weapon/smg_02.scn','Smg_02_Wea_Dummy'],
  // The Breaker scene has no BoneChunk named after either rigid ModelData.
  // Native linking aligns its Sword_Wea_Dummy with weapon_attach.x7's
  // L_Hand_Dummy; parenting the scene beneath both matrices grips the head.
  ['model/weapon/breaker.scn','Sword_Wea_Dummy'],
  // Smash Rifle carries the same equipment-local alignment dummy. Remove it
  // before parenting the rigid dualgun scene beneath R_Hand_Dummy.
  ['model/weapon/dualgun.scn','Dual_Wea_Dummy'],
  // Twin Blade is two independently authored scenes. Native attachment aligns
  // each scene's Cs_Wea_Dummy to its matching hand socket.
  ['model/weapon/twinsword_r.scn','Cs_Wea_Dummy'],
  ['model/weapon/twinsword_l.scn','Cs_Wea_Dummy'],
]);

// A former Q0001-only Revolver correction broke the other aim states.
// Keep the authored grip basis; no pose-specific constant rotation.
const ATTACHMENT_ROTATIONS=new Map();

// Unlike the other alignment dummies, Dual_Wea_Dummy also authors the gun's
// facing direction. Its translation is a scene-space grip offset and must be
// removed, but erasing its rotation turns the Smash Rifle sideways in-hand.
const ROTATION_PRESERVING_ALIGNMENT_SOURCES=new Set(['model/weapon/dualgun.scn']);
// These scenes keep Cs_Wea_Dummy below BONESYSTEM. The inverse alignment is
// folded into that parent, so the dummy's authored local pose must remain intact.
const PARENT_ALIGNED_ANIMATION_SOURCES=new Set(['model/weapon/twinsword_r.scn','model/weapon/twinsword_l.scn']);

// Cannonade's eight child meshes are authored beneath AreaRailgun_Parts03,
// which carries the weapon-wide ~0.23 scale. Runtime meshes are flattened onto
// the attachment bone, so their ancestor transform must be folded into each
// child or every part except the root renders roughly four times too large.
const HIERARCHICAL_MODEL_SOURCES=new Set(['model/weapon/area_rail_gun.scn']);
const MODEL_PARENTED_BONE_SOURCES=new Set(['model/weapon/revolver.scn']);
const RIGID_MODEL_NODE_SOURCES=new Set(['model/weapon/revolver.scn']);

export function equipmentAlignmentNode(file){return file.attachmentNode||ALIGNMENT_NODES.get(file.source)||null;}

function equipmentModelAlignmentMatrix(file,node){
  const authored=new THREE.Matrix4().fromArray(node.matrix),inverse=authored.clone().invert();
  if(!ROTATION_PRESERVING_ALIGNMENT_SOURCES.has(file.source))return inverse;
  const rotation=new THREE.Quaternion();
  authored.decompose(new THREE.Vector3(),rotation,new THREE.Vector3());
  return new THREE.Matrix4().makeRotationFromQuaternion(rotation).multiply(inverse);
}

function equipmentAlignmentMatrix(file,node){
  const base=equipmentModelAlignmentMatrix(file,node),correction=ATTACHMENT_ROTATIONS.get(file.source);
  return correction?new THREE.Matrix4().makeRotationFromQuaternion(correction).multiply(base):base;
}

export function equipmentModelMatrix(file,model){
  const local=new THREE.Matrix4().fromArray(model.matrix),alignmentName=equipmentAlignmentNode(file);
  if(HIERARCHICAL_MODEL_SOURCES.has(file.source)){
    const models=new Map(file.models.map(candidate=>[candidate.name,candidate])),visited=new Set([model.name]);
    for(let parent=models.get(model.parent);parent&&!visited.has(parent.name);parent=models.get(parent.parent)){
      visited.add(parent.name);
      local.premultiply(new THREE.Matrix4().fromArray(parent.matrix));
    }
  }
  if(!alignmentName)return local;
  const node=file.bones.find(bone=>bone.name===alignmentName);
  if(!node)throw Error(`Missing equipment alignment node: ${alignmentName}`);
  // The rigid mesh lives below the aligned dummy. Keep only its authored
  // dummy-relative transform here so Dual_Wea_Dummy's rotation is applied once.
  return local.premultiply(new THREE.Matrix4().fromArray(node.matrix).invert());
}

function applyParentMatrix(data,parentMatrix){
  if(!data)return data;
  const parentPosition=new THREE.Vector3(),parentRotation=new THREE.Quaternion(),parentScale=new THREE.Vector3();
  parentMatrix.decompose(parentPosition,parentRotation,parentScale);
  const position=new THREE.Vector3().fromArray(data.position).applyMatrix4(parentMatrix);
  const rotation=parentRotation.clone().multiply(new THREE.Quaternion().fromArray(data.rotation));
  const scale=parentScale.clone().multiply(new THREE.Vector3().fromArray(data.scale));
  return {...data,position:position.toArray(),rotation:rotation.toArray(),scale:scale.toArray(),
    positions:(data.positions||[]).map(([time,x,y,z])=>{const value=new THREE.Vector3(x,y,z).applyMatrix4(parentMatrix);return [time,...value.toArray()];}),
    rotations:(data.rotations||[]).map(([time,x,y,z,w])=>[time,...parentRotation.clone().multiply(new THREE.Quaternion(x,y,z,w)).toArray()]),
    scales:(data.scales||[]).map(([time,x,y,z])=>[time,x*parentScale.x,y*parentScale.y,z*parentScale.z])};
}

// Equipment has its own world-bind space. Preserve its hierarchy beneath the
// attachment named by weapon_attach.x7, including animated hair and gauntlets.
export function prepareEquipmentRig(reference,files){
  const definitions=new Map(reference.bones.map(b=>[b.name,b]));
  const equipment=new Map();
  for(const [index,file] of files.entries()){
    const local=file.attachment||/\/(hair|face)\//.test(file.source);
    if(!local)continue;
    const attachment=file.attachment||'Bip01 Head';
    const parent=definitions.get(attachment);
    if(!parent)throw Error(`Missing equipment attachment: ${attachment}`);
    if(needsEquipmentHierarchy(file)){
      const alignmentName=equipmentAlignmentNode(file),node=alignmentName&&file.bones.find(bone=>bone.name===alignmentName);
      if(alignmentName&&!node)throw Error(`Missing equipment alignment node: ${alignmentName}`);
      equipment.set(file,prepareEquipmentHierarchy(reference,file,`equipment${index}_`,attachment,node?equipmentAlignmentMatrix(file,node):null));
      continue;
    }
    const prefix=`equipment${index}_`,modelNodes=RIGID_MODEL_NODE_SOURCES.has(file.source);
    const mappedNodes=modelNodes?[...file.bones,...file.models]:file.bones;
    const mapping=new Map(mappedNodes.map(node=>[node.name,prefix+node.name]));
    const attachMatrix=new THREE.Matrix4().fromArray(parent.matrix);
    const sourceBones=new Map(file.bones.map(b=>[b.name,b])),worldMatrices=new Map();
    const alignmentName=equipmentAlignmentNode(file),alignmentNode=alignmentName&&sourceBones.get(alignmentName);
    if(alignmentName&&!alignmentNode)throw Error(`Missing equipment alignment node: ${alignmentName}`);
    const alignment=alignmentNode?equipmentAlignmentMatrix(file,alignmentNode):null;
    const headPart=/\/(hair|face)\//.test(file.source);
    function worldMatrix(b){
      if(worldMatrices.has(b.name))return worldMatrices.get(b.name);
      const rigidModel=headPart&&file.models.some(m=>m.name===b.name&&!m.weights.length);
      // BoneChunks hold bind-space matrices; rigid ModelChunks hold a transform
      // relative to their parent. Applying the head matrix directly loses the
      // Hair_Bone_Dummy transform (and its axis conversion).
      const sourceParent=sourceBones.get(b.parent);
      const basis=rigidModel&&sourceParent?worldMatrix(sourceParent):attachMatrix;
      const world=basis.clone().multiply(new THREE.Matrix4().fromArray(b.matrix));
      worldMatrices.set(b.name,world);return world;
    }
    for(const b of file.bones){
      const model=file.models.find(m=>m.name===b.name);
      const animations={...(b.animations||{})};
      if(file.alignmentTrackPolicy==='rocket-launcher-native-link-zero'&&b.name===alignmentName){
        if(file.source!=='model/weapon/rocket launcher_n.scn'||attachment!=='R_Hand_Dummy'||alignmentName!=='rocket_gun_Wea_Dummy')throw Error('Rocket Launcher link0 source/attachment differs');
        // Native equipment link0 keeps this alignment carrier at the hand.
        // Preserve its source RL tracks in the public asset; omit them only
        // from the evaluated linked carrier so actor movement is not doubled.
        for(const name of Object.keys(animations))if(name!=='BASE')delete animations[name];
      }
      const parentModel=!modelNodes&&MODEL_PARENTED_BONE_SOURCES.has(file.source)&&file.models.find(candidate=>candidate.name===b.parent);
      if(parentModel){
        const parentMatrix=equipmentModelMatrix(file,parentModel);
        for(const [name,entry] of Object.entries(animations))if(entry.data)animations[name]={...entry,data:applyParentMatrix(entry.data,parentMatrix)};
      }
      // The alignment node's bind transform is removed below. Its animation
      // fallback must use that SAME space: otherwise BASE reintroduces the
      // original rotation/offset on the very first animated frame.
      if(alignment&&b.name===alignmentName&&!PARENT_ALIGNED_ANIMATION_SOURCES.has(file.source)){
        for(const [name,entry] of Object.entries(animations)){
          if(!entry.data)continue;
          const data=entry.data;
          if(['positions','rotations','scales'].some(key=>data[key]?.length))
            throw Error('Animated equipment alignment requires key conversion: '+file.source+'/'+name);
          const pose=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(data.position),
            new THREE.Quaternion().fromArray(data.rotation),new THREE.Vector3().fromArray(data.scale));
          const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
          pose.premultiply(alignment).decompose(position,rotation,scale);
          animations[name]={...entry,data:{...data,position:position.toArray(),rotation:rotation.toArray(),scale:scale.toArray()}};
        }
      }
      for(const [name,data] of Object.entries(model?.animations||{}))if(data)animations[name.toLowerCase()==='base'?'BASE':name]={data,copy:''};
      if(!animations.BASE&&animations[file.defaultAnimation])animations.BASE={copy:file.defaultAnimation,data:null};
      // Native Plasma attaches the model directly to R_Hand_Dummy. Its SWORD
      // pose is already attachment-local; retaining Sword_Wea_Dummy adds the
      // sheathed offset (~61 source units) to the grip a second time.
      const direct=file.attachmentMode==='model'&&model&&!model.weights.length;
      const pose=direct&&model.animations?.[file.defaultAnimation];
      const bind=pose?attachMatrix.clone().multiply(new THREE.Matrix4().compose(
        new THREE.Vector3().fromArray(pose.position),new THREE.Quaternion().fromArray(pose.rotation),new THREE.Vector3().fromArray(pose.scale))):worldMatrix(b);
      const alignedBind=alignment?attachMatrix.clone().multiply(alignment).multiply(new THREE.Matrix4().fromArray(b.matrix)):bind;
      const modelCarrier=parentModel&&(mapping.get(alignmentName)||attachment);
      const definition={...b,name:mapping.get(b.name),parent:direct?attachment:modelCarrier||mapping.get(b.parent)||attachment,
        matrix:alignedBind.toArray(),animations,controlsClipDuration:false};
      reference.bones.push(definition);definitions.set(definition.name,definition);
    }
    if(modelNodes)for(const model of file.models){
      const parentName=mapping.get(model.parent)||attachment,parent=definitions.get(parentName);
      if(!parent)throw Error(`Missing equipment model parent: ${file.source}/${model.name}/${model.parent}`);
      const animations={};for(const [name,data] of Object.entries(model.animations||{}))if(data)animations[name.toLowerCase()==='base'?'BASE':name]={data,copy:''};
      const pose=model.animations?.[file.defaultAnimation],local=pose?new THREE.Matrix4().compose(
        new THREE.Vector3().fromArray(pose.position),new THREE.Quaternion().fromArray(pose.rotation),new THREE.Vector3().fromArray(pose.scale)):
        new THREE.Matrix4().fromArray(model.matrix);
      const definition={name:mapping.get(model.name),parent:parentName,matrix:new THREE.Matrix4().fromArray(parent.matrix).multiply(local).toArray(),animations,controlsClipDuration:false};
      reference.bones.push(definition);definitions.set(definition.name,definition);
    }
    equipment.set(file,mapping);
  }
  return equipment;
}

export function resolveEquipmentAttachment(equipmentMap,file,model){
  const mapping=equipmentMap.get(file);
  if(!mapping)return null;
  // Qualified homonymous rigid leaves are keyed by their source ModelData
  // object, keeping names available only for unambiguous parent/skin lookup.
  if(mapping.has(model))return mapping.get(model);
  let name=model.name;
  const models=new Map(file.models.map(candidate=>[candidate.name,candidate]));
  const visited=new Set();
  while(name&&!visited.has(name)){
    visited.add(name);
    if(mapping.has(name))return mapping.get(name);
    name=models.get(name)?.parent||model.parent;
    model=models.get(name)||{parent:null};
  }
  return null;
}
