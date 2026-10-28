import {AddEquation,BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,RepeatWrapping,Scene,SRGBColorSpace,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';

const SCALE=.006;
const SOURCE='model/weapon/deathscythe_normal.scn';
const MODEL='deathscythe_normal';
const SHAPE='Line01';
export const DEATH_SCYTHE_TRAIL_TEXTURE='/assets/s5runtime/death-scythe/textures/death_scythe.png';
// The actor GhostTrail controller is shared native code. These constructor
// values are from the qualified actor controller, while the type-42 XML row
// below independently selects the Death Scythe texture, Line01 and blend mode.
export const DEATH_SCYTHE_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100,fog:true,flag22:true,blendMode:1});
export const DEATH_SCYTHE_TRAIL_BINDING=Object.freeze({type:42,sceneIndex:0,source:SOURCE,model:MODEL,shape:SHAPE,name:'GhostTrail_Death_Scythe_01',sourceTexture:'image/death_scythe.dds',blendType:0});

export function deathScytheTrailTiming(attack){
 if(attack?.weapon!=='deathscythe')return null;
 if(attack.kind==='light'&&attack.comboIndex===2)return {delayMs:50,durationMs:600};
 // The explicit UpperCut actor state is entered from the heavy contact. It
 // remains a named Death Scythe actor trail presentation path in S5; the
 // native state-handoff lifetime still needs a live comparison.
 if(attack.kind==='heavy'||attack.kind==='uppercut')return {delayMs:50,durationMs:600};
 return null;
}

// Same unsigned threshold controller used by the qualified actor GhostTrail
// path: a delay becomes active only after crossing it, and duration starts on
// that activating tick. This does not reinterpret the Lua third argument as
// an absolute end timestamp.
export class DeathScytheTrailTimer {
 constructor(timing){this.delay=timing.delayMs;this.duration=timing.durationMs;this.startElapsed=0;this.endElapsed=0;this.emitting=false;this.stopped=false;}
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

function resolveShape(avatar,files){
 const file=files?.[0];
 if(file?.source!==SOURCE)throw Error('Exact Death Scythe scene 0 required');
 const shape=file.nodes?.find(node=>node.type==='Shape'&&node.name===SHAPE);
 const parent=file.nodes?.find(node=>node.type==='ModelData'&&node.name===shape?.parent);
 if(shape?.parent!==MODEL||!parent?.matrix)throw Error('Death Scythe Line01/animated parent required');
 const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===SOURCE&&mesh.name===MODEL);
 if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error('Exact evaluated Death Scythe model bone required');
 const local=new Matrix4().fromArray(parent.matrix).invert().multiply(new Matrix4().fromArray(shape.matrix));
 return {binding:bindNativeShape(shape),bone:meshes[0].parent,local};
}

export class DeathScytheTrails {
 constructor(avatar,{equipmentFiles,texture,capacity=8192}={}){
  if(!texture)throw Error('Authenticated Death Scythe trail texture required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Death Scythe trail capacity');
  Object.assign(this,resolveShape(avatar,equipmentFiles));this.capacity=capacity;this.matrix=new Matrix4();this.texture=texture;
  texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.geometry=new BufferGeometry();
  for(const [name,size] of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
  const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);this.geometry.setIndex(new BufferAttribute(indices,1));
  // XML blendType 0 maps the native type-42 trail to controller mode 1
  // (additive). It is deliberately not the Bat alpha blend configuration.
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:OneFactor,blendDst:OneFactor,blendEquation:AddEquation,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='death-scythe-actor-ghost-trail';this.mesh.frustumCulled=false;this.warmups=new WeakMap();this.disposed=false;this.clear();
 }
 endpoints(){
  this.bone.updateWorldMatrix(true,false);this.matrix.multiplyMatrices(this.bone.matrixWorld,this.local);
  for(let i=0;i<15;i++)this.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(this.binding,this.matrix);
 }
 clear(){
  this.clock=new NativeGhostTrail(DEATH_SCYTHE_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);this.clock.emitting=false;
  this.timer=null;this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;this.overflow=false;this.mesh.visible=false;this.geometry.setDrawRange(0,0);
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Death Scythe trail delta');
  if(this.disposed)return;
  if(cancel||(attack&&attack.weapon!=='deathscythe')){this.clear();return;}
  const timing=deathScytheTrailTiming(attack),time=attack?.timeMs??(attack?.time??0)*1000;
  const signature=timing?`${attack.kind}:${attack.comboIndex??0}`:null;
  if(attack!==this.lastAttack||signature!==this.signature||(attack&&time<this.lastTime)){
   this.timer?.stop();this.timer=timing?new DeathScytheTrailTimer(timing):null;
  }
  this.lastAttack=attack;this.signature=signature;this.lastTime=time;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0)this.clock.update(delta,this.endpoints(),{emitting:this.timer?.update(delta)??false});
 }
 render(){
  if(this.disposed)return;
  const vertices=this.clock.vertices();this.overflow=vertices.length>this.capacity;this.mesh.visible=vertices.length>=4&&!this.overflow;
  if(!this.mesh.visible){this.geometry.setDrawRange(0,0);return;}
  const attrs=this.geometry.attributes;
  for(let i=0;i<vertices.length;i++){const vertex=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=vertex.position[j]*SCALE;attrs.color.array.set(vertex.rgba,i*4);attrs.uv.array.set(vertex.uv,i*2);}
  for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}
  this.geometry.setDrawRange(0,(vertices.length-2)*3);
 }
 snapshot(){return {nativeReady:false,binding:DEATH_SCYTHE_TRAIL_BINDING,profile:DEATH_SCYTHE_TRAIL_PROFILE,emitting:this.clock.emitting,opacity:this.clock.opacity,samples:this.clock.samples.length,timer:this.timer?{startElapsed:this.timer.startElapsed,endElapsed:this.timer.endElapsed,stopped:this.timer.stopped}:null,overflow:this.overflow,additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Death Scythe trails disposed'));
  const key=sourceScene?.fog?(sourceScene.fog.isFogExp2?'exp2':'linear'):'none';let variants=this.warmups.get(renderer);if(!variants){variants=new Map();this.warmups.set(renderer,variants);}let task=variants.get(key);if(task)return task;
  task=(async()=>{renderer.initTexture?.(this.texture);const scene=new Scene();scene.fog=sourceScene?.fog??null;const proxy=new Mesh(this.geometry,this.material);proxy.frustumCulled=false;scene.add(proxy);try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}finally{scene.remove(proxy);}})();variants.set(key,task);task.catch(()=>variants.delete(key));return task;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}

export async function loadDeathScytheTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/death-scythe/model.json');
 const texture=options.texture??await new TextureLoader().loadAsync(DEATH_SCYTHE_TRAIL_TEXTURE);
 let trails;try{trails=new DeathScytheTrails(avatar,{...options,equipmentFiles,texture});}catch(error){if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};}
 return trails;
}

export const DEATH_SCYTHE_TRAIL_LIMITS=Object.freeze([
 'The type-42 XML binding, Line01 P/P+V geometry, authored texture, named state gates and additive mode are source-backed; native visual output is not yet compared frame by frame.',
 'The transition from the heavy state to ActorState_UpperCut is kept as an explicit S5 presentation path. Its native history handoff/remaining lifetime requires live comparison.',
 'Native flag22 also queues a second render-list pass. That additional GPU pass, evaluated shape matrix order, inherited alpha/depth state and colour space are not duplicated here.',
 'State exit stops new samples then lets existing samples fade; explicit switch/cancel clears them as an S5 lifecycle policy. Fixed GPU capacity reports overflow instead of silently clipping.'
]);
