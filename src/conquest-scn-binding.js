// Native115DB80/1156010/1155CF0 source loading order. Identity is the SCN
// record ordinal; names remain literal and need not be unique. Parent lookup
// sees only earlier nodes, depth-first/self-first in insertion order, with
// fallback to the current scene group. No guessed aliases or nearest-parent.
export function conquestScnHierarchy(scene){
 if(!Array.isArray(scene?.nodes)||!Array.isArray(scene.models)||!Array.isArray(scene.bones)||typeof scene._meta?.headerName!=='string')throw Error('Complete parsed native SCN records/header required');
 const root={id:-1,name:scene._meta.headerName,parentId:null,children:[]},nodes=[],byId=new Map([[-1,root]]);let modelIndex=0,boneIndex=0;
 const find=(name,start=root)=>{if(start.name===name)return start;for(const id of start.children){const result=find(name,byId.get(id));if(result)return result;}return null;};
 for(const [id,record]of scene.nodes.entries()){
  let definition,index;if(record.type==='ModelData'){index=modelIndex++;definition=scene.models[index];}else if(['Bone','BoneSystem'].includes(record.type)){index=boneIndex++;definition=scene.bones[index];}else throw Error('Conquest model hierarchy contains unsupported source node '+record.type);
  if(!definition||definition.name!==record.name||definition.parent!==record.parent||JSON.stringify(definition.matrix)!==JSON.stringify(record.matrix))throw Error('Native SCN source ordering mismatch at'+id);
  const parent=find(record.parent)||root,node={id,name:record.name,parentName:record.parent,parentId:parent.id,type:record.type,definition,modelIndex:record.type==='ModelData'?index:null,children:[]};byId.set(id,node);nodes.push(node);parent.children.push(id);
 }
 if(modelIndex!==scene.models.length||boneIndex!==scene.bones.length)throw Error('Native SCN arrays have unmatched records');
 return {root,nodes,byId,find,source:'115DB80 parent find before append;1156010 self-first recursive children; children insertion order',nativeExecuted:false};
}
// Native lookup1135110 consumes exact map key and returns failure/null for an
// absent key. This exposes source data only; caller-state fallback is separate.
export function conquestScnAnimationEntry(hierarchy,nodeId,clipName){
 const node=hierarchy.byId.get(nodeId);if(!node||nodeId<0||typeof clipName!=='string')throw Error('Explicit native SCN node ordinal/clip name required');
 return Object.hasOwn(node.definition.animations||{},clipName)?node.definition.animations[clipName]:null;
}

// Source1134E00/7C8CC0/7C8D70: an absent requested key reports failure;
// it can apply the animator's explicit internal fallback key. Its initial
// producer is NOT inferred here. No missing-name alias is inserted into data.
export function conquestScnAnimationRequest(hierarchy,{nodeId,requestedName,fallbackName}={}){
 if(typeof requestedName!=='string'||!(fallbackName===null||typeof fallbackName==='string'))throw Error('Explicit requested and native fallback key (or null) required');
 const requested=conquestScnAnimationEntry(hierarchy,nodeId,requestedName),fallback=requested||fallbackName===null?null:conquestScnAnimationEntry(hierarchy,nodeId,fallbackName);
 return {nodeId,requestedName,accepted:requested!==null,appliedName:requested?requestedName:fallback?fallbackName:null,entry:requested||fallback||null,nativeFallback:requested===null&&fallback!==null,fallbackProducerEstablished:false};
}
