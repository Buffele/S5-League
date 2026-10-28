import {BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,Group,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,RepeatWrapping,SRGBColorSpace,SrcAlphaFactor,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {createTrailMeshWarmup} from './trail-mesh-warmup.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';

const SCALE=.006;
const SHAPE='Line01';
export const TWIN_BLADE_ACTOR_TRAIL_TEXTURES=Object.freeze({
 right:'/assets/s5runtime/twin-blade/textures/di.png',
 left:'/assets/s5runtime/twin-blade/textures/di2.png',
});
export const TWIN_BLADE_ACTOR_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100});
export const TWIN_BLADE_ACTOR_TRAIL_BINDINGS=Object.freeze([
 Object.freeze({side:'right',type:26,sceneIndex:0,source:'model/weapon/twinsword_r.scn',model:'twinsword_r',shape:SHAPE,name:'GhostTrail_Double_sword_01',sourceTexture:'image/di.dds',texture:TWIN_BLADE_ACTOR_TRAIL_TEXTURES.right,blendType:0,controllerMode:1}),
 Object.freeze({side:'left',type:26,sceneIndex:1,source:'model/weapon/twinsword_l.scn',model:'twinsword_l',shape:SHAPE,name:'GhostTrail_Double_sword_02',sourceTexture:'image/di2.dds',texture:TWIN_BLADE_ACTOR_TRAIL_TEXTURES.left,blendType:0,controllerMode:1}),
]);

// Both named actor states add the two trails together.  The nearby Twin Blade
// states (heavy, air, charge and gather) do not declare AddGhostTrail.
export function twinBladeActorTrailTiming(attack){
 if(attack?.weapon!=='twinblade'||attack.kind!=='light'||!([0,2].includes(attack.comboIndex??0)))return null;
 return {delayMs:50,durationMs:600};
}

// The actor controller uses strict unsigned crossings: a sample starts only
// after its delay, and its duration starts on that activating tick.
export class TwinBladeActorTrailTimer {
 constructor(timing){this.delay=timing.delayMs;this.duration=timing.durationMs;this.startElapsed=0;this.endElapsed=0;this.emitting=false;this.stopped=false;}
 update(delta){
  if(!Number.isInteger(delta)||delta<0||delta>0xffffffff)throw new RangeError('Expected native uint32 delta');
  if(this.stopped)return false;
  const old=this.startElapsed;this.startElapsed=(old+delta)>>>0;
  if((this.delay>=old)!==(this.delay>=this.startElapsed))this.emitting=true;
  if(this.emitting){const oldEnd=this.endElapsed;this.endElapsed=(oldEnd+delta)>>>0;if((this.duration>=oldEnd)!==(this.duration>=this.endElapsed)){this.emitting=false;this.stopped=true;}}
  return this.emitting;
 }
 stop(){this.emitting=false;this.stopped=true;}
}

function resolveBinding(avatar,files,binding){
 const file=files?.[binding.sceneIndex];
 if(file?.source!==binding.source)throw Error(`Exact Twin Blade ${binding.side} scene ${binding.sceneIndex} required`);
 const shape=file.nodes?.find(node=>node.type==='Shape'&&node.name===binding.shape);
 const parent=file.nodes?.find(node=>node.type==='ModelData'&&node.name===shape?.parent);
 if(shape?.parent!==binding.model||!parent?.matrix||!Array.isArray(shape.serializedPairs?.[0]))throw Error(`Twin Blade ${binding.side} Line01/authenticated pair required`);
 const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===binding.source&&mesh.name===binding.model);
 if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error(`Exact evaluated Twin Blade ${binding.side} model bone required`);
 const local=new Matrix4().fromArray(parent.matrix).invert().multiply(new Matrix4().fromArray(shape.matrix));
 return {binding,nativeShape:bindNativeShape(shape),bone:meshes[0].parent,local};
}

function makeGeometry(capacity){
 const geometry=new BufferGeometry();
 for(const [name,size] of [['position',3],['color',4],['uv',2]])geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
 const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);geometry.setIndex(new BufferAttribute(indices,1));
 return geometry;
}

function configureTexture(texture){
 texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
}

export class TwinBladeActorTrails {
 constructor(avatar,{equipmentFiles,textures,capacity=8192}={}){
  if(!Array.isArray(textures)||textures.length!==2||!textures[0]||!textures[1]||textures[0]===textures[1])throw Error('Two distinct authenticated Twin Blade trail textures required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Twin Blade trail capacity');
  this.capacity=capacity;this.mesh=new Group();this.mesh.name='twin-blade-actor-ghost-trails';this.warmupMeshes=createTrailMeshWarmup(this.mesh);this.disposed=false;
  this.trails=TWIN_BLADE_ACTOR_TRAIL_BINDINGS.map((binding,index)=>{
   const state=resolveBinding(avatar,equipmentFiles,binding),texture=textures[index];configureTexture(texture);
   const geometry=makeGeometry(capacity);
   // Type26/blendType0 is statically traced to controller mode1: SRCALPHA/ONE,
   // depth test enabled and writes disabled. Equation/fog/additional pass stay
   // intentionally unqualified rather than copied from another weapon family.
   const material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneFactor,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
   const mesh=new Mesh(geometry,material);mesh.name=`twin-blade-${binding.side}-actor-ghost-trail`;mesh.frustumCulled=false;
   Object.assign(state,{texture,geometry,material,mesh,matrix:new Matrix4()});this.mesh.add(mesh);return state;
  });
  this.clear();
 }
 endpoints(trail){
  trail.bone.updateWorldMatrix(true,false);trail.matrix.multiplyMatrices(trail.bone.matrixWorld,trail.local);
  for(let i=0;i<15;i++)trail.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(trail.nativeShape,trail.matrix);
 }
 clear(){
  for(const trail of this.trails){trail.clock=new NativeGhostTrail(TWIN_BLADE_ACTOR_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);trail.clock.emitting=false;trail.overflow=false;trail.mesh.visible=false;trail.geometry.setDrawRange(0,0);}
  this.timer=null;this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Twin Blade trail delta');
  if(this.disposed)return;
  if(cancel||(attack&&attack.weapon!=='twinblade')){this.clear();return;}
  const timing=twinBladeActorTrailTiming(attack),time=attack?.timeMs??(attack?.time??0)*1000;
  const signature=timing?`${attack.kind}:${attack.comboIndex??0}`:null;
  if(attack!==this.lastAttack||signature!==this.signature||(attack&&time<this.lastTime)){this.timer?.stop();this.timer=timing?new TwinBladeActorTrailTimer(timing):null;}
  this.lastAttack=attack;this.signature=signature;this.lastTime=time;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0){const emitting=this.timer?.update(delta)??false;for(const trail of this.trails)trail.clock.update(delta,this.endpoints(trail),{emitting});}
 }
 render(){
  if(this.disposed)return;
  for(const trail of this.trails){
   const vertices=trail.clock.vertices();trail.overflow=vertices.length>this.capacity;trail.mesh.visible=vertices.length>=4&&!trail.overflow;
   if(!trail.mesh.visible){trail.geometry.setDrawRange(0,0);continue;}
   const attrs=trail.geometry.attributes;
   for(let i=0;i<vertices.length;i++){const vertex=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=vertex.position[j]*SCALE;attrs.color.array.set(vertex.rgba,i*4);attrs.uv.array.set(vertex.uv,i*2);}
   for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}
   trail.geometry.setDrawRange(0,(vertices.length-2)*3);
  }
 }
 snapshot(){return {nativeReady:false,bindings:TWIN_BLADE_ACTOR_TRAIL_BINDINGS,profile:TWIN_BLADE_ACTOR_TRAIL_PROFILE,emitting:this.trails.some(trail=>trail.clock.emitting),trails:this.trails.map(trail=>({side:trail.binding.side,samples:trail.clock.samples.length,opacity:trail.clock.opacity,overflow:trail.overflow})),timer:this.timer?{startElapsed:this.timer.startElapsed,endElapsed:this.timer.endElapsed,stopped:this.timer.stopped}:null,blendFactors:{src:'SRCALPHA',dst:'ONE'},additionalNativePassPorted:false,fogSourceState:'enabled by generic XML actor producer; native fog parameters unverified'};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Twin Blade trails disposed'));
  return this.warmupMeshes(renderer,camera,sourceScene);
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();
  for(const trail of this.trails){trail.geometry.dispose();trail.material.dispose();}
 }
}

export async function loadTwinBladeActorTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/twin-blade/model.json');
 const ownsTextures=!options.textures;
 const textures=options.textures??await Promise.all([TWIN_BLADE_ACTOR_TRAIL_TEXTURES.right,TWIN_BLADE_ACTOR_TRAIL_TEXTURES.left].map(path=>new TextureLoader().loadAsync(path)));
 let trails;try{trails=new TwinBladeActorTrails(avatar,{...options,equipmentFiles,textures});}catch(error){if(ownsTextures)for(const texture of textures)texture.dispose();throw error;}
 if(ownsTextures){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();for(const texture of textures)texture.dispose();};}
 return trails;
}

export const TWIN_BLADE_ACTOR_TRAIL_LIMITS=Object.freeze([
 'The type-26 Line01 bindings, pair geometry, two textures, profile, gates and SRCALPHA/ONE factors are statically sourced; visual equivalence remains unverified.',
 'The generic XML actor producer enables fog. Blend equation, separate alpha, depth comparison, native fog parameters, extra passes and exact post-mixer matrix order remain unverified.',
 'State exit stops emission and lets existing samples fade; switch/cancel clears history as an S5 lifecycle policy. Fixed capacity reports overflow rather than clipping.'
]);
