import * as THREE from 'three';
import {modelGeometry} from './scene-assets.js';
import {scalarKey,applyMorph} from './effect-scene.js';

const matrix=values=>new THREE.Matrix4().fromArray(values);

// The Touchdown ball is a small skinned character, not a sphere prop. Keep its
// original bind skeleton so the body and head occupy their source positions.
export async function createFumbi(data,{name='Fumbi'}={}){
 const group=new THREE.Group();group.name=name;
 const definitions=new Map(data.nodes.filter(n=>n.type==='Bone'||n.type==='BoneSystem').map(n=>[n.name,n]));
 const bones=new Map([...definitions].map(([name])=>[name,new THREE.Bone()]));
 for(const [name,definition] of definitions){
  const bone=bones.get(name),parent=bones.get(definition.parent);
  bone.name=name;(parent||group).add(bone);
  const local=matrix(definition.matrix);
  if(parent)local.premultiply(matrix(definitions.get(definition.parent).matrix).invert());
  local.decompose(bone.position,bone.quaternion,bone.scale);
 }
 group.updateMatrixWorld(true);
 const loader=new THREE.TextureLoader(),textures=new Map(),meshes=new Map();
 await Promise.all([...new Set(data.models.flatMap(m=>m.textures.map(t=>t.name)).filter(Boolean))].map(async url=>{
  const texture=await loader.loadAsync(url);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
  textures.set(url,texture);
 }));
 for(const model of data.models){
  if(!model.vertices.length)continue;
  const geometry=modelGeometry(model),state=model.renderState||0;
  const materials=model.textures.map(t=>{
   const options={map:textures.get(t.name),side:THREE.DoubleSide,transparent:!!(state&34),alphaTest:(state&34)!==0?0.015:0,depthWrite:!(state&64),fog:!(state&128)};
   options.blending=state&32?THREE.AdditiveBlending:THREE.NormalBlending;
   return state&1?new THREE.MeshBasicMaterial(options):new THREE.MeshLambertMaterial(options);
  });
  let mesh;
  if(model.weights.length){
   const influences=Array.from({length:model.vertices.length/3},()=>[]);
   model.weights.forEach((weight,boneIndex)=>weight.values.forEach(([index,value])=>{
    if(value>0&&influences[index])influences[index].push([boneIndex,value]);
   }));
   const indices=[],weights=[];
   for(const list of influences){
    list.sort((a,b)=>b[1]-a[1]);const top=list.slice(0,4),sum=top.reduce((total,item)=>total+item[1],0);
    if(!sum)throw Error('Fumbi : sommet sans os dans '+model.name);
    for(let i=0;i<4;i++){indices.push(top[i]?.[0]??0);weights.push((top[i]?.[1]??0)/sum);}
   }
   geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
   geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
   mesh=new THREE.SkinnedMesh(geometry,materials);
   const skeleton=new THREE.Skeleton(model.weights.map(w=>{
    const bone=bones.get(w.bone);if(!bone)throw Error('Fumbi : os absent '+w.bone);return bone;
   }),model.weights.map(w=>matrix(w.matrix)));
   mesh.bind(skeleton,new THREE.Matrix4());mesh.frustumCulled=false;
  }else{
   mesh=new THREE.Mesh(geometry,materials);
   const parent=bones.get(model.parent),local=matrix(model.matrix);
   if(parent)local.premultiply(matrix(definitions.get(model.parent).matrix).invert());
   local.decompose(mesh.position,mesh.quaternion,mesh.scale);
  }
  mesh.name=model.name;(model.weights.length?group:bones.get(model.parent)||group).add(mesh);meshes.set(model.name,mesh);
 }
 group.animation=createFumbiAnimation(group,data,bones,meshes);
 return group;
}

export function createFumbiAnimation(group,data,bones,meshes){
 const light=[...meshes.values()].find(mesh=>mesh.name.startsWith('ball_gidung ')),lightAxis=new THREE.Vector3(0,1,0),lightDirection=new THREE.Vector3(),inverseParent=new THREE.Matrix4();
 const mixer=new THREE.AnimationMixer(group),clips=new Map(),effects=new Map(),stationaryRoots=new Map();
 const names=new Set(data.clips.map(c=>c.name));
 for(const name of names){
  const tracks=[],visual=[];let duration=0;
  for(const [source,target,isBone] of [...data.bones.map(b=>[b,bones.get(b.name),true]),...data.models.map(m=>[m,meshes.get(m.name),false])]){
   if(!target)continue;
   const entry=source.animations?.[name],a=isBone?(entry?.data||source.animations?.[entry?.copy]?.data):entry;if(!a)continue;
   duration=Math.max(duration,a.durationTicks/4800);
   // Skinned vertices already use the source inverse-bind matrices. Applying
   // the model's static transform again would offset the body from its bones.
   if(isBone||!source.weights?.length)for(const [prop,key,single,Type] of [['position','positions','position',THREE.VectorKeyframeTrack],['quaternion','rotations','rotation',THREE.QuaternionKeyframeTrack],['scale','scales','scale',THREE.VectorKeyframeTrack]]){
    const keys=a[key]||[],value=a[single];if(!keys.length&&!value)continue;
    tracks.push(new Type(`${target.uuid}.${prop}`,keys.length?keys.map(k=>k[0]/4800):[0],keys.length?keys.flatMap(k=>k.slice(1)):value));
   }
   if(!isBone&&a.effect){
    const morph=(base,field,width)=>{let values=Array.from(base);return a.effect.morphKeys.map(k=>{values=values.slice();for(const row of k[field]||[])for(let c=0;c<width;c++)values[row[0]*width+c]=row[c+1];return {time:k.time,values};});};
    visual.push({target,alpha:a.effect.floatKeys,vertices:morph(source.vertices,'vertices',3),uv:morph(source.uv,'uv',2),duration:a.durationTicks});
   }
  }
  if(tracks.length)clips.set(name,mixer.clipAction(new THREE.AnimationClip(name,duration,tracks)));
  effects.set(name,visual);
  // Carried mascot keeps its gestures, but its top-level jump/turn tracks
  // must not launch the whole body into/out of the carrier on every loop.
  stationaryRoots.set(name,data.bones.filter(b=>data.nodes.some(n=>n.name===b.parent&&n.type==='BoneSystem')).flatMap(b=>{
   const entry=b.animations?.[name],a=entry?.data||b.animations?.[entry?.copy]?.data,target=bones.get(b.name);return a&&target?[{target,position:a.position||a.positions?.[0]?.slice(1),rotation:a.rotation||a.rotations?.[0]?.slice(1)}]:[];
  }));
 }
 let current=null,elapsed=0,loop=true;
 const api={get clip(){return current;},get finished(){return !loop&&elapsed>=clips.get(current)?.getClip().duration;},clips:[...clips.keys()],play(name,{repeat=true,restart=false}={}){if(name===current&&!restart)return;const next=clips.get(name);if(!next)throw Error('Fumbi animation missing: '+name);mixer.stopAllAction();next.reset().setLoop(repeat?THREE.LoopRepeat:THREE.LoopOnce,repeat?Infinity:1);next.clampWhenFinished=true;next.play();current=name;elapsed=0;loop=repeat;},update(dt,{stationary=false,upwardLight=false}={}){
  elapsed+=dt;mixer.update(dt);
  if(stationary)for(const root of stationaryRoots.get(current)||[]){if(root.position)root.target.position.fromArray(root.position);if(root.rotation)root.target.quaternion.fromArray(root.rotation);}
  for(const e of effects.get(current)||[]){const t=loop&&e.duration?elapsed*4800%e.duration:Math.min(elapsed*4800,e.duration);for(const material of [].concat(e.target.material))material.opacity=scalarKey(e.alpha,t,1);applyMorph(e.target.geometry.attributes.position,e.vertices,t);if(e.target.geometry.attributes.uv)applyMorph(e.target.geometry.attributes.uv,e.uv,t);}
  if(upwardLight&&light?.parent){
   // Keep native morph/UV/alpha and emitter position, but orient only the
   // light column vertically after the skeleton/mixer pose, including -Z scale.
   light.parent.updateWorldMatrix(true,false);
   lightDirection.set(0,1,0).transformDirection(inverseParent.copy(light.parent.matrixWorld).invert());
   light.quaternion.setFromUnitVectors(lightAxis,lightDirection);light.frustumCulled=false;
  }
 },dispose(){mixer.stopAllAction();mixer.uncacheRoot(group);}};
 if(clips.has('mas_000'))api.play('mas_000');return api;
}
