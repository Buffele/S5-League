import {Bone,Object3D,SkinnedMesh,Skeleton,Matrix4,Uint16BufferAttribute,Float32BufferAttribute} from 'three';
import {nativeFindNamedNode} from './native-node-lookup.js';
import {prepareSourceEffectHierarchy} from './rocket-launcher-effect-hierarchy.js';

export const TWIN_CHAIN_ASSET='/assets/s5runtime/twin-blade/models/chain_test.json';
export const TWIN_CHAIN_HELPERS='/assets/s5runtime/twin-blade/models/chain_test-hierarchy.json';
export const TWIN_AIR_CHAIN_ASSET='/assets/s5runtime/twin-blade/models/chain_12.json';
export const TWIN_AIR_CHAIN_HELPERS='/assets/s5runtime/twin-blade/models/chain_12-hierarchy.json';
const profiles={
 'effects/chain_test.scn':{root:'chain_test.scn',animation:'BASE',helpers:'Box02|Box06'},
 'effects/chain_12.scn':{root:'chain_12.scn',animation:'base',helpers:'Box02|Box01'},
};

// Qualified Twin chain scenes only: construction, then resolution on the complete
// clone. The second pass moves three children to the first final Bone09.
// Both passes and child order are checked against the positive-clock graphs.
export function twinChainParents(nodes,rootName='chain_test.scn'){
 if(nodes.length!==113||!Object.values(profiles).some(p=>p.root===rootName))throw Error('Unqualified Twin chain node count/root');
 const root={name:rootName,index:-1,children:[]},objects=nodes.map((n,index)=>({name:n.name,index,children:[]}));
 const find=name=>nativeFindNamedNode(root,name,{readName:n=>n.name,readChildren:n=>n.children});
 function attach(object,parent){
  if(!parent||object===parent)throw Error('Unresolved Twin chain parent');
  for(let p=parent;p;p=p.parent)if(p===object)throw Error('Cyclic Twin chain parent');
  if(object.parent){const siblings=object.parent.children;siblings.splice(siblings.indexOf(object),1);}
  object.parent=parent;parent.children.push(object);
 }
 for(const [i,node]of nodes.entries())attach(objects[i],node.parent?find(node.parent):root);
 for(const [i,node]of nodes.entries()){
  const parent=node.parent?find(node.parent):root;if(parent!==objects[i].parent)attach(objects[i],parent);
 }
 return {parents:objects.map(n=>n.parent.index),children:[root,...objects].map(n=>n.children.map(c=>c.index))};
}

export function prepareTwinChainHierarchy(data,group,meshes,{animation,loop=false,sourceHierarchy}={}){
 const profile=profiles[data.source];
 if(!profile||animation!==profile.animation||data.models.length!==10||data.bones.length!==99||data.clips.length!==1||data.clips[0].name!==animation||sourceHierarchy?.source!==data.source||sourceHierarchy.helpers?.map(m=>m.name).join('|')!==profile.helpers)throw Error('Unqualified Twin chain scene/helpers');
 const graph=twinChainParents(data.nodes,profile.root),objects=new Map();
 group.traverse(object=>{const index=object.userData.twinChainSourceIndex;if(index!==undefined){if(objects.has(index))throw Error('Duplicate Twin source index');objects.set(index,object);}});
 const modelByName=new Map(data.models.map((m,i)=>[m.name,i]));
 if(modelByName.size!==data.models.length)throw Error('Ambiguous Twin render model');
 for(const [i,node]of data.nodes.entries()){
  let object=objects.get(i);
  if(!object){
   const modelIndex=modelByName.get(node.name);
   object=node.type==='ModelData'&&modelIndex!==undefined&&data.models[modelIndex].vertices.length?meshes.find(m=>m.userData.sourceModelIndex===modelIndex):['Bone','BoneSystem'].includes(node.type)?new Bone():new Object3D();
   if(!object)throw Error('Missing Twin render model');object.name=node.name;object.userData.twinChainSourceIndex=i;objects.set(i,object);group.add(object);
  }
  if(object.name!==node.name)throw Error('Twin source node changed');
 }
 const actualMeshes=[...meshes].sort((a,b)=>a.userData.sourceModelIndex-b.userData.sourceModelIndex);
 for(const [modelIndex,model]of data.models.entries())if(model.weights.length){
  const sourceIndex=data.nodes.findIndex(n=>n.type==='ModelData'&&n.name===model.name);let mesh=objects.get(sourceIndex);
  if(!mesh.isSkinnedMesh){
   const skin=new SkinnedMesh(mesh.geometry,mesh.material);Object3D.prototype.copy.call(skin,mesh,false);
   const renderedIndex=actualMeshes.findIndex(m=>m.userData.sourceModelIndex===modelIndex);
   if(renderedIndex<0)throw Error('Missing Twin skinned render index');
   mesh.removeFromParent();mesh=skin;objects.set(sourceIndex,mesh);actualMeshes[renderedIndex]=mesh;group.add(mesh);
  }
  const influences=Array.from({length:model.vertices.length/3},()=>[]);
  for(const [boneIndex,weight]of model.weights.entries())for(const [vertex,value]of weight.values){if(!influences[vertex]||value<0)throw Error('Invalid Twin skin weight');if(value)influences[vertex].push([boneIndex,value]);}
  const indices=[],weights=[];
  for(const list of influences){
   if(!list.length||list.length>4)throw Error('Unqualified Twin skin influence count');
   const total=list.reduce((n,w)=>n+w[1],0);for(let i=0;i<4;i++){indices.push(list[i]?.[0]??0);weights.push((list[i]?.[1]??0)/total);}
  }
  mesh.geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4));mesh.geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));
  const bones=model.weights.map(weight=>{
   const matches=data.nodes.flatMap((node,i)=>node.name===weight.bone?[i]:[]);
   if(matches.length!==1)throw Error('Twin skin bone must be unique: '+weight.bone);return objects.get(matches[0]);
  });
  mesh.bind(new Skeleton(bones,model.weights.map(w=>new Matrix4().fromArray(w.matrix))),new Matrix4());mesh.frustumCulled=false;
 }
 const key=i=>'__twin_chain_'+i,scoped=new Map([...objects].map(([i,o])=>[key(i),o]));
 const virtualNodes=data.nodes.map((node,i)=>({...node,name:key(i),type:node.type==='BoneSystem'?'Bone':node.type,parent:graph.parents[i]<0?data.source:key(graph.parents[i])}));
 const virtualBones=[];let boneIndex=0;
 for(const [i,node]of data.nodes.entries())if(['Bone','BoneSystem'].includes(node.type)){
  const bone=data.bones[boneIndex++];if(bone.name!==node.name)throw Error('Twin bone source index mismatch');
  if(bone.animations?.[animation]?.copy)throw Error('Twin bone alias not qualified');
  if(bone.animations?.[animation]?.data)virtualBones.push({...bone,name:key(i)});
 }
 for(const helper of [...sourceHierarchy.helpers,...data.models.filter(m=>!m.vertices.length)]){
  const index=data.nodes.findIndex(n=>n.name===helper.name&&n.type==='ModelData');
  if(index<0||data.models.some(m=>m.name===helper.name&&m.vertices.length)||!helper.animations[animation])throw Error('Missing exact Twin helper animation');
  virtualBones.push({...helper,name:key(index),animations:{[animation]:{data:helper.animations[animation]}}});
 }
 const hierarchy=prepareSourceEffectHierarchy({...data,nodes:virtualNodes,bones:virtualBones},group,scoped,{animation,loop});
 // Restore observed native child order after the evaluator attaches by index.
 for(const [i,children]of graph.children.entries()){
  const parent=i===0?group:objects.get(i-1),ordered=children.map(index=>objects.get(index));
  parent.children.sort((a,b)=>ordered.indexOf(a)-ordered.indexOf(b));
 }
 const byName=new Map();group.traverse(object=>{if(object.name&&!byName.has(object.name))byName.set(object.name,object);});
 return {meshes:actualMeshes,byName,objects,hierarchy:{...hierarchy,evaluatedShapeMatrix(name){
  const indices=data.nodes.flatMap((node,i)=>node.type==='Shape'&&node.name===name?[i]:[]);
  if(indices.length!==1)throw Error('Missing unique Twin Shape '+name);return hierarchy.evaluatedShapeMatrix(key(indices[0]));
 }}};
}
