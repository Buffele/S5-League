import {Matrix4,Vector3,Quaternion} from 'three';
import {resolveTransform} from './animation-data.js';

const matrix=values=>new Matrix4().fromArray(values);
const pose=data=>new Matrix4().compose(new Vector3().fromArray(data.position),new Quaternion().fromArray(data.rotation),new Vector3().fromArray(data.scale));

// Authenticated Sigma ModelData leaves share an export name but keep distinct
// local poses. Only these two layouts use object identity for their lookup;
// named parents and skin bindings must still resolve to one unique source node.
const INDEXED_SIGMA_LEAVES=new Map([
  ['model/weapon/sigmablade.scn',{models:8,indices:[6,7],parent:'Sigma_Wea_Dummy'}],
  ['model/weapon/sigmablade_change.scn',{models:21,indices:Array.from({length:10},(_,i)=>11+i),parent:'Sigma2_Wea_Dummy'}],
]);
function indexedSigmaLeaves(file){
  const profile=INDEXED_SIGMA_LEAVES.get(file.source);if(!profile)return new Map();
  const counts=new Map();for(const node of [...file.bones,...file.models])counts.set(node.name,(counts.get(node.name)||0)+1);
  const indices=file.models.flatMap((model,index)=>counts.get(model.name)>1?[index]:[]);
  if(file.models.length!==profile.models||indices.join(',')!==profile.indices.join(',')||counts.get(profile.parent)!==1)
    throw Error('Unqualified indexed Sigma equipment layout: '+file.source);
  const names=new Set(indices.map(i=>file.models[i].name));
  if(file.bones.some(bone=>names.has(bone.name))||[...file.bones,...file.models].some(node=>names.has(node.parent))
    ||file.models.some(model=>model.weights.some(weight=>names.has(weight.bone))))
    throw Error('Ambiguous indexed Sigma equipment parent/weight: '+file.source);
  const indexed=new Map();
  for(const index of indices){const model=file.models[index];
    if(model.parent!==profile.parent||model.weights.length||counts.has('source_model_'+index))
      throw Error('Unqualified indexed Sigma equipment leaf: '+file.source+'/'+index);
    indexed.set(model,'source_model_'+index);
  }
  return indexed;
}

// Raw SCN exports separate Bone and ModelData records. Both are animation
// nodes. Flattening ModelData loses recoil, folding parts, and child sockets.
// Older avatar exports already materialized ModelData as bones; leave those
// capture-verified exports on their existing path.
export function needsEquipmentHierarchy(file){
  return !!file.attachment&&file.models.some(model=>!file.bones.some(bone=>bone.name===model.name));
}

export function prepareEquipmentHierarchy(reference,file,prefix,attachment,alignment){
  const definitions=new Map(reference.bones.map(bone=>[bone.name,bone]));
  const attach=definitions.get(attachment);
  if(!attach)throw Error(`Missing equipment attachment: ${attachment}`);
  const indexed=indexedSigmaLeaves(file);
  const source=new Map(file.bones.map(bone=>[bone.name,{...bone,animations:{...bone.animations}}]));
  for(const model of file.models){
    const key=indexed.has(model)?model:model.name;
    const node=source.get(key)||{...model,animations:{}};
    node.animations={...node.animations};
    for(const [name,data] of Object.entries(model.animations||{}))if(data)
      node.animations[name.toLowerCase()==='base'?'BASE':name]={data,copy:''};
    source.set(key,node);
  }
  for(const node of source.values()){
    if(node.animations.base&&!node.animations.BASE)node.animations.BASE=node.animations.base;
    if(!node.animations.BASE&&node.animations[file.defaultAnimation])
      node.animations.BASE={copy:file.defaultAnimation,data:null};
  }
  if(file.alignmentTrackPolicy==='rocket-launcher-native-link-zero'){
    if(file.source!=='model/weapon/rocket launcher_n.scn'||attachment!=='R_Hand_Dummy'||file.attachmentNode!=='rocket_gun_Wea_Dummy')throw Error('Rocket Launcher link0 hierarchy differs');
    const linked=source.get(file.attachmentNode);if(!linked?.animations.BASE)throw Error('Rocket Launcher link0 BASE missing');
    // Native link0 locks the grip carrier; authored child recoil/reload tracks
    // remain intact. Source curves remain present in the public SCN conversion.
    linked.animations={BASE:linked.animations.BASE};
  }
  // Air Gun BASE is a scene-space placement, but its explicit grip tracks
  // (AW001–3/AW007/E0001–3/SS000) are already attachment-local. Applying
  // inverse(BASE) to those tracks a second time rotates the charging weapon.
  // Normalize BASE only; retain the explicit source poses and child keys.
  const attachmentLocalRoot=file.source==='model/weapon/airgun.scn'?source.get('Revolver_Wea_Dummy01'):null;
  if(attachmentLocalRoot&&alignment){
    const data=resolveTransform(attachmentLocalRoot,'BASE');
    const position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
    pose(data).premultiply(alignment).decompose(position,rotation,scale);
    attachmentLocalRoot.animations.BASE={data:{...data,position:position.toArray(),rotation:rotation.toArray(),scale:scale.toArray()},copy:''};
  }
  const mapping=new Map([...source.keys()].map(key=>[key,prefix+(indexed.get(key)||key)]));
  // This static parent carries the change of attachment space. Never bake it
  // into animation keys: translations, quaternion interpolation and scales
  // must remain in the same source-local frame, including during crossfades.
  const carrierName=prefix+'attachment_basis';
  const carrier={name:carrierName,parent:attachment,
    matrix:matrix(attach.matrix).multiply(attachmentLocalRoot?new Matrix4():(alignment||new Matrix4())).toArray(),
    animations:{},controlsClipDuration:false};
  reference.bones.push(carrier);definitions.set(carrierName,carrier);
  // Captured type47 M/F links the right body node directly to R Forearm,
  // preserving its authored local pose. Retaining Cs_Wea_Dummy inserts an
  // extra quarter-turn. The left scene keeps its complete BONESYSTEM tree.
  // Evidence: native-type47-v6 / demonic-knuckle-link-v6 fixture. Scope this
  // observed topology to this exact scene; no source keys or skin binds change.
  const directKnuckleBody=file.source==='model/weapon/demonic_knuckle_r_01.scn'
    &&attachment==='Bip01 R Forearm'?'demonic_knuckle_body_Dummy':null;
  if(directKnuckleBody&&source.get(directKnuckleBody)?.parent!=='Cs_Wea_Dummy')
    throw Error('Demonic Knuckle native linked body hierarchy differs');
  const visiting=new Set();
  function build(name){
    const mapped=mapping.get(name);if(definitions.has(mapped))return definitions.get(mapped);
    if(visiting.has(name))throw Error(`Cyclic equipment hierarchy: ${file.source}/${name}`);
    visiting.add(name);
    const node=source.get(name);
    if(!source.has(node.parent)&&node.parent&&node.parent!==file.source&&node.parent!==file.source.split('/').at(-1))
      throw Error(`Missing equipment parent: ${file.source}/${name} -> ${node.parent}`);
    const parent=name===directKnuckleBody?carrier:source.has(node.parent)?build(node.parent):carrier;
    const data=resolveTransform(node,file.defaultAnimation)||resolveTransform(node,'BASE');
    // Bind matrices are scene-space; animation transforms are parent-local.
    // Use authored local poses when available, otherwise derive the local bind.
    const local=data?pose(data):matrix(node.matrix);
    if(!data&&source.has(node.parent))local.premultiply(matrix(source.get(node.parent).matrix).invert());
    const definition={name:mapped,parent:parent.name,
      matrix:matrix(parent.matrix).multiply(local).toArray(),
      animations:node.animations,controlsClipDuration:false};
    reference.bones.push(definition);definitions.set(mapped,definition);visiting.delete(name);
    return definition;
  }
  for(const name of source.keys())build(name);
  return mapping;
}
