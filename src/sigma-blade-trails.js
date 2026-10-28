import {BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,Group,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,OneMinusSrcAlphaFactor,RepeatWrapping,SRGBColorSpace,SrcAlphaFactor,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {createTrailMeshWarmup} from './trail-mesh-warmup.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {SIGMA_BLADE_SOURCE_STATES as STATES} from './sigma-blade-source-data.js';

const SCALE=.006;
export const SIGMA_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100});
export const SIGMA_TRAIL_BINDINGS=Object.freeze([
 Object.freeze({transformed:false,source:'model/weapon/sigmablade.scn',model:'sigmabalde',parent:'Sigma_Wea_Dummy',name:'GhostTrail_sigma_blade_01',texture:'/assets/s5runtime/sigma-blade/textures/sigma.png',blendType:0,controllerMode:1}),
 Object.freeze({transformed:true,source:'model/weapon/sigmablade_change.scn',model:'sigma_blade',parent:'sigma_blade',name:'GhostTrail_sigma_blade_02',texture:'/assets/s5runtime/sigma-blade/textures/sigma_change.png',blendType:1,controllerMode:0}),
]);

export function sigmaTrailTiming(attack,transformed){
 if(attack?.weapon!=='sigmablade')return null;
 const state=attack.kind==='light'?`SwordAtkAfterDash${(attack.comboIndex??0)+1}State_SigmaBlade`:
  attack.kind==='air'?'SwordJumpAtkState_SigmaBlade':attack.kind==='strong'?'SwordAtkCounterAttack_SigmaBlade':null;
 const name=SIGMA_TRAIL_BINDINGS[Number(transformed)].name;
 const event=STATES[state]?.events.find(event=>event.method==='AddGhostTrail'&&event.arguments[0]===name);
 return event?{delayMs:event.arguments[1],durationMs:event.arguments[2]}:null;
}

export class SigmaTrailTimer{
 constructor({delayMs,durationMs}){this.delay=delayMs;this.duration=durationMs;this.startElapsed=0;this.endElapsed=0;this.emitting=false;this.stopped=false;}
 update(delta){
  if(!Number.isInteger(delta)||delta<0||delta>0xffffffff)throw new RangeError('Expected native uint32 delta');
  if(this.stopped)return false;
  const old=this.startElapsed;this.startElapsed=(old+delta)>>>0;
  if((this.delay>=old)!==(this.delay>=this.startElapsed))this.emitting=true;
  if(this.emitting){const oldEnd=this.endElapsed;this.endElapsed=(oldEnd+delta)>>>0;
   if((this.duration>=oldEnd)!==(this.duration>=this.endElapsed)){this.emitting=false;this.stopped=true;}
  }
  return this.emitting;
 }
 stop(){this.emitting=false;this.stopped=true;}
}

function resolve(avatar,files,binding){
 const file=files.find(file=>file.source===binding.source);
 const shape=file?.nodes.find(node=>node.type==='Shape'&&node.name==='Line01');
 const parent=file?.nodes.find(node=>node.name===binding.parent);
 if(shape?.parent!==binding.parent||!parent?.matrix||!shape.serializedPairs?.length)throw Error('Missing exact Sigma Line01/parent/pair: '+binding.source);
 const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===binding.source&&mesh.name===binding.model);
 if(meshes.length!==1||!meshes[0].parent?.isBone||!meshes[0].parent.name.endsWith(binding.model))throw Error('Ambiguous evaluated Sigma model: '+binding.model);
 const model=meshes[0],name=model.parent.name.slice(0,-binding.model.length)+binding.parent,bone=avatar.bones.get(name);
 // Normal Line01 belongs to the grip bone; transformed Line01 belongs to an
 // animated ModelData. Do not assume these two scene hierarchies are equal.
 if(!bone||bone!==model.parent&&!bone.getObjectByName(model.parent.name))throw Error('Missing scoped Sigma trail parent: '+binding.parent);
 return {binding,model,bone,shape:bindNativeShape(shape),local:new Matrix4().fromArray(parent.matrix).invert().multiply(new Matrix4().fromArray(shape.matrix)),matrix:new Matrix4()};
}
function geometry(capacity){
 const g=new BufferGeometry();
 for(const [name,width]of [['position',3],['color',4],['uv',2]])g.setAttribute(name,new BufferAttribute(new Float32Array(capacity*width),width).setUsage(DynamicDrawUsage));
 const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);
 g.setIndex(new BufferAttribute(indices,1));return g;
}
export class SigmaBladeTrails{
 constructor(avatar,{equipmentFiles,textures,capacity=8192}={}){
  if(!textures?.[0]||!textures?.[1]||textures[0]===textures[1])throw Error('Two distinct authenticated Sigma textures required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Sigma trail capacity');
  const states=SIGMA_TRAIL_BINDINGS.map(binding=>resolve(avatar,equipmentFiles,binding));
  this.capacity=capacity;this.mesh=new Group();this.mesh.name='sigma-blade-actor-trails';this.warmupMeshes=createTrailMeshWarmup(this.mesh);this.disposed=false;
  this.trails=SIGMA_TRAIL_BINDINGS.map((binding,i)=>{
   const state=states[i],texture=textures[i];
   texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
   const g=geometry(capacity),material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:binding.controllerMode===1?OneFactor:OneMinusSrcAlphaFactor,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
   const mesh=new Mesh(g,material);mesh.name=binding.name;mesh.frustumCulled=false;this.mesh.add(mesh);
   return {...state,texture,geometry:g,material,mesh};
  });this.clear();
 }
 endpoints(trail){
  trail.bone.updateWorldMatrix(true,false);trail.matrix.multiplyMatrices(trail.bone.matrixWorld,trail.local);
  for(let i=0;i<15;i++)trail.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(trail.shape,trail.matrix);
 }
 clear(){
  for(const trail of this.trails){trail.clock=new NativeGhostTrail(SIGMA_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);trail.clock.emitting=false;trail.timer=null;trail.overflow=false;trail.mesh.visible=false;trail.geometry.setDrawRange(0,0);}
  this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Sigma trail delta');
  if(this.disposed)return;
  if(cancel||attack&&attack.weapon!=='sigmablade'){this.clear();return;}
  const time=attack?.timeMs??(attack?.time??0)*1000,signature=attack?`${attack.kind}:${attack.comboIndex??0}`:null;
  const fresh=attack!==this.lastAttack||signature!==this.signature||attack&&time<this.lastTime;
  for(const trail of this.trails){
   const timing=sigmaTrailTiming(attack,trail.binding.transformed);
   if(fresh){trail.timer?.stop();trail.timer=timing?new SigmaTrailTimer(timing):null;}
   // S5 already models the two forms as separate, mutually visible scenes.
   // Do not emit or keep history from the hidden equipment form.
   if(!trail.model.visible){trail.clock.samples=[];trail.clock.opacity=0;trail.mesh.visible=false;trail.geometry.setDrawRange(0,0);}
  }
  this.lastAttack=attack;this.signature=signature;this.lastTime=time;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0)for(const trail of this.trails){const enabled=trail.timer?.update(delta)??false;trail.clock.update(delta,this.endpoints(trail),{emitting:enabled&&trail.model.visible});}
 }
 render(){
  if(this.disposed)return;
  for(const trail of this.trails){
   const vertices=trail.clock.vertices();trail.overflow=vertices.length>this.capacity;trail.mesh.visible=trail.model.visible&&vertices.length>=4&&!trail.overflow;
   if(!trail.mesh.visible){trail.geometry.setDrawRange(0,0);continue;}
   const attrs=trail.geometry.attributes;
   for(let i=0;i<vertices.length;i++){const vertex=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=vertex.position[j]*SCALE;attrs.color.array.set(vertex.rgba,i*4);attrs.uv.array.set(vertex.uv,i*2);}
   for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}
   trail.geometry.setDrawRange(0,(vertices.length-2)*3);
  }
 }
 snapshot(){return {nativeReady:false,profile:SIGMA_TRAIL_PROFILE,trails:this.trails.map(trail=>({name:trail.binding.name,transformed:trail.binding.transformed,visible:trail.mesh.visible,samples:trail.clock.samples.length,emitting:trail.clock.emitting,overflow:trail.overflow})),additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Sigma trails disposed'));
  return this.warmupMeshes(renderer,camera,sourceScene);
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();for(const trail of this.trails){trail.geometry.dispose();trail.material.dispose();}}
}
export async function loadSigmaBladeTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??(await Promise.all(['/assets/s5runtime/sigma-blade/model.json','/assets/s5runtime/sigma-blade/model-transformed.json'].map(readAsset))).flat();
 const textures=options.textures??await Promise.all(SIGMA_TRAIL_BINDINGS.map(binding=>new TextureLoader().loadAsync(binding.texture)));
 let trails;try{trails=new SigmaBladeTrails(avatar,{...options,equipmentFiles,textures});}catch(error){if(!options.textures)for(const texture of textures)texture.dispose();throw error;}
 if(!options.textures){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();for(const texture of textures)texture.dispose();};}
 return trails;
}
export const SIGMA_TRAIL_LIMITS=Object.freeze([
 'The two exact type38 scene/shape/texture bindings and source action gates are restored. Equipment visibility selects the rendered form as an S5 lifecycle policy; native link2 propagation remains unverified.',
 'The shared XML actor producer establishes 200/50/50/100, fog enabled and blendType0/1 -> controller1/0. Extra render pass, inherited blend equation/alpha/depth comparison, native fog parameters and visual equivalence remain unverified.',
 'Normal source endpoints align with the visible blade in the static scene. Transformed source hierarchy/endpoints require visual comparison; no bounds-derived replacement or pivot correction is invented.'
]);
