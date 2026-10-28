import {Object3D,Matrix4,Quaternion,Vector3} from 'three';

// Narrow source hierarchy adapter, deliberately opt-in. Source-local SCN
// matrices/TRS are retained; native D3DX recomposition and Ghost local-node
// initialization still require live comparison. No world/bind fallback.
const position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
function key(keys,t,single,width,quaternion=false){
 if(!keys?.length)return single;
 let hi=keys.findIndex(k=>k[0]>=t);if(hi<0)return keys.at(-1).slice(1);
 if(!hi)return keys[0].slice(1);
 const a=keys[hi-1],b=keys[hi],f=(t-a[0])/(b[0]-a[0]);
 if(quaternion)return new Quaternion().fromArray(a,1).slerp(new Quaternion().fromArray(b,1),f).toArray();
 return Array.from({length:width},(_,i)=>a[i+1]+(b[i+1]-a[i+1])*f);
}
export function prepareRocketEffectHierarchy(data,group,models,{animation='',loop=false}={}){
 if(data.source!=='effects/weapon_rocket_l_u_head_01.scn')throw Error('Rocket hierarchy source differs');
 return prepareSourceEffectHierarchy(data,group,models,{animation,loop});
}
// Geometry and source tracks remain unchanged. Callers qualify their own
// source and selected clip before opting into this hierarchy evaluator.
export function prepareSourceEffectHierarchy(data,group,models,{animation='',loop=false}={}){
 const nodes=new Map(),definitions=new Map(data.nodes.map(n=>[n.name,n]));
 if(definitions.size!==data.nodes.length)throw Error('Duplicate Rocket source node');
 for(const d of data.nodes){
  let object=models.get(d.name);
  if(!object){object=group.getObjectByName(d.name);if(object?.isMesh)throw Error('Unexpected Rocket model node');object??=new Object3D();object.name=d.name;}
  if(!['Bone','Shape','ModelData'].includes(d.type))throw Error('Unsupported Rocket source node '+d.type);
  new Matrix4().fromArray(d.matrix).decompose(object.position,object.quaternion,object.scale);
  nodes.set(d.name,object);
 }
 const visiting=new Set(),done=new Set();
 function attach(name){
  if(done.has(name))return;
  if(visiting.has(name))throw Error('Cyclic Rocket source hierarchy');visiting.add(name);
  const d=definitions.get(name),object=nodes.get(name),parent=nodes.get(d.parent);
  if(parent){attach(d.parent);parent.add(object);}
  else {if(d.parent!==data.source&&d.parent!==data.source.split('/').at(-1)&&d.parent!=='')throw Error('Missing Rocket source parent '+d.parent);group.add(object);}
  visiting.delete(name);done.add(name);
 }
 for(const name of nodes.keys())attach(name);
 const tracks=data.bones.map(b=>{
  const selected=b.animations[animation]??Object.values(b.animations)[0];
  if(selected?.copy)throw Error('Rocket effect bone alias requires explicit resolution');
  return {object:nodes.get(b.name),data:selected?.data};
 });
 return {nodes,update(seconds){
  for(const {object,data:d} of tracks){if(!d)continue;let t=seconds*4800;if(d.durationTicks>0)t=loop?t%d.durationTicks:Math.min(t,d.durationTicks);
   position.fromArray(key(d.positions,t,d.position,3));rotation.fromArray(key(d.rotations,t,d.rotation,4,true));scale.fromArray(key(d.scales,t,d.scale,3));
   object.position.copy(position);object.quaternion.copy(rotation);object.scale.copy(scale);
  }
  group.updateWorldMatrix(true,true);
 },evaluatedShapeMatrix(name){
  if(definitions.get(name)?.type!=='Shape')throw Error('Missing Rocket Shape '+name);
  const object=nodes.get(name);object.updateWorldMatrix(true,false);return object.matrixWorld;
 }};
}
