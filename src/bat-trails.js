import {BufferGeometry,BufferAttribute,DynamicDrawUsage,Group,Matrix4,Mesh,MeshBasicMaterial,Scene,TextureLoader,CustomBlending,SrcAlphaFactor,OneMinusSrcAlphaFactor,AddEquation,DoubleSide,RepeatWrapping,LinearFilter,LinearMipmapLinearFilter,SRGBColorSpace} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {loadBatAerialTrail} from './bat-aerial-trail.js';

const SCALE=.006;
export const BAT_TRAIL_TEXTURE='/assets/s5runtime/bat/textures/bi_atex.png';
// B94D60 -> 982170, constructor 112AEA0. XML blendType 1 is REMAPPED to
// controller mode 0 (alpha), not mode 1 (additive). These are actor-model
// defaults, independent of CActGhostTrail sequence profiles.
export const BAT_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100,blendMode:0,fog:true,flag22:true});
const windows=Object.freeze({light:[50,350],strong:[50,350],strong2:[50,350],air:[50,350],heavy:[0,700],spin2:[0,650],spin3:[0,600],spin4:[0,550],spin5:[0,500]});
export function batTrailTiming(attack){
 if(attack?.weapon!=='bat')return null;
 const w=windows[attack.kind];return w?{delayMs:w[0],durationMs:w[1]}:null;
}

// Actor wrapper 8856C0 uses strict unsigned threshold crossings, advances the
// duration timer ONLY while emitting (including the activation tick), and
// 885690 stops emission on exit. This is not the inclusive SEQ time gate.
export class BatTrailTimer {
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
 const file=files?.[0];if(file?.source!=='model/weapon/bat.scn')throw Error('Exact Bat scene 0 required');
 const shape=file.nodes?.find(n=>n.type==='Shape'&&n.name==='Line01');
 const parent=file.nodes?.find(n=>n.name===shape?.parent&&n.type==='ModelData');
 if(shape?.parent!=='Bat'||!parent?.matrix)throw Error('Bat Line01/animated parent required');
 const meshes=avatar.meshes.filter(m=>m.userData.weapon&&m.userData.source===file.source&&m.name==='Bat');
 if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error('Exact evaluated Bat model bone required');
 const local=new Matrix4().fromArray(parent.matrix).invert().multiply(new Matrix4().fromArray(shape.matrix));
 return {binding:bindNativeShape(shape),bone:meshes[0].parent,local};
}

export class BatTrails {
 constructor(avatar,{equipmentFiles,texture,capacity=8192,aerial=null}={}){
  if(!texture)throw Error('Authenticated Bat trail texture required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw RangeError('Invalid Bat trail capacity');
  Object.assign(this,resolveShape(avatar,equipmentFiles));this.matrix=new Matrix4();this.capacity=capacity;
  this.texture=texture;texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.geometry=new BufferGeometry();
  for(const [name,size] of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
  const indices=new Uint16Array((capacity-2)*3);
  for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);
  this.geometry.setIndex(new BufferAttribute(indices,1));
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneMinusSrcAlphaFactor,blendEquation:AddEquation,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='bat-actor-ghost-trail';this.mesh.frustumCulled=false;
  this.actorMesh=this.mesh;this.aerial=aerial;
  if(aerial){this.mesh=new Group();this.mesh.name='bat-complete-trails';this.mesh.add(this.actorMesh,aerial.mesh);}
  this.warmups=new WeakMap();this.disposed=false;this.clear();
 }
 endpoints(){
  this.bone.updateWorldMatrix(true,false);this.matrix.multiplyMatrices(this.bone.matrixWorld,this.local);
  for(let i=0;i<15;i++)this.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(this.binding,this.matrix);
 }
 clear(){
  this.clock=new NativeGhostTrail(BAT_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);this.clock.emitting=false;
  this.timer=null;this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;this.overflow=false;
  this.mesh.visible=false;this.geometry.setDrawRange(0,0);
  this.actorMesh.visible=false;this.aerial?.clear();
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw RangeError('Invalid Bat trail delta');
  if(this.disposed)return;
  if(cancel||(attack&&attack.weapon!=='bat')){this.clear();return;}
  const timing=batTrailTiming(attack),time=attack?.timeMs??(attack?.time??0)*1000;
  const signature=timing?attack.kind:null;
  if(attack!==this.lastAttack||signature!==this.signature||(attack&&time<this.lastTime)){
   this.timer?.stop();this.timer=timing?new BatTrailTimer(timing):null;
  }
  this.lastAttack=attack;this.signature=signature;this.lastTime=time;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0)this.clock.update(delta,this.endpoints(),{emitting:this.timer?.update(delta)??false});
  this.aerial?.update(dt,attack);
 }
 render(){
  if(this.disposed)return;
  const vertices=this.clock.vertices();this.overflow=vertices.length>this.capacity;
  this.actorMesh.visible=vertices.length>=4&&!this.overflow;this.aerial?.render();
  this.mesh.visible=this.actorMesh.visible||!!this.aerial?.mesh.visible;
  if(!this.actorMesh.visible){this.geometry.setDrawRange(0,0);return;}
  const attrs=this.geometry.attributes;
  for(let i=0;i<vertices.length;i++){
   const v=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=v.position[j]*SCALE;
   attrs.color.array.set(v.rgba,i*4);attrs.uv.array.set(v.uv,i*2);
  }
  for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}
  this.geometry.setDrawRange(0,(vertices.length-2)*3);
 }
 snapshot(){return {nativeReady:false,profile:BAT_TRAIL_PROFILE,emitting:this.clock.emitting,opacity:this.clock.opacity,samples:this.clock.samples.length,timer:this.timer?{startElapsed:this.timer.startElapsed,endElapsed:this.timer.endElapsed,stopped:this.timer.stopped}:null,overflow:this.overflow,aerial:this.aerial?.snapshot()??null,additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Bat trails disposed'));
  // A startup compile without fog cannot warm the later fog shader variant.
  const key=sourceScene?.fog?(sourceScene.fog.isFogExp2?'exp2':'linear'):'none';
  let variants=this.warmups.get(renderer);if(!variants){variants=new Map();this.warmups.set(renderer,variants);}
  let task=variants.get(key);if(task)return task;
  task=(async()=>{
   renderer.initTexture?.(this.texture);
   const scene=new Scene();scene.fog=sourceScene?.fog??null;
   const proxy=new Mesh(this.geometry,this.material);proxy.frustumCulled=false;scene.add(proxy);
   if(this.aerial){renderer.initTexture?.(this.aerial.texture);scene.add(new Mesh(this.aerial.geometry,this.aerial.material));}
   try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}
   finally{scene.clear();}
  })();variants.set(key,task);task.catch(()=>variants.delete(key));return task;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();this.aerial?.dispose();}
}

export async function loadBatTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/bat/model.json');
 const texture=options.texture??await new TextureLoader().loadAsync(BAT_TRAIL_TEXTURE);
 let trails,aerial;try{aerial=await loadBatAerialTrail(avatar);trails=new BatTrails(avatar,{...options,equipmentFiles,texture,aerial});}
 catch(error){aerial?.dispose();if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};}
 return trails;
}

export const BAT_TRAIL_LIMITS=Object.freeze([
 'Single world pass only: flag22 additionally enqueues the native node in a second render list; that GPU pass is unqualified and is not duplicated here.',
 'Native evaluated Shape matrices, inherited GPU equation/separate alpha/depth function/color space and S5 integer-delta scheduling still need native visual comparison.',
 'State exit stops emission and fades existing samples; new-state history-reset ordering remains unverified. Explicit cancel/switch clear is an S5 lifecycle policy.',
 'Fixed GPU capacity is a resource guard: overflow hides the draw and is reported instead of silently clipping the native trajectory.',
]);
