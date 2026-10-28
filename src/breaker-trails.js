import {BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,RepeatWrapping,Scene,SRGBColorSpace,SrcAlphaFactor,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';

const SCALE=.006;
const SOURCE='model/weapon/breaker.scn';
const MODEL='breaker';
const SHAPE='Line01';
export const BREAKER_TRAIL_TEXTURE='/assets/s5runtime/textures/d9726737c5a5b072.png';
// B94D60 -> 982170 is the generic weapon-type/XML actor producer, not a
// profile borrowed from another weapon family.
export const BREAKER_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100});
export const BREAKER_TRAIL_BINDING=Object.freeze({type:33,sceneIndex:0,source:SOURCE,model:MODEL,shape:SHAPE,name:'GhostTrail_Breaker_01',sourceTexture:'image/hm.dds',blendType:0,controllerMode:1});

const windows=Object.freeze({light:[50,600],strong:[50,600],heavy:[100,900],air:[50,350]});
export function breakerTrailTiming(attack){
 if(attack?.weapon!=='breaker')return null;
 const range=windows[attack.kind];return range?{delayMs:range[0],durationMs:range[1]}:null;
}

// Actor wrapper threshold crossings are strict. The duration clock starts on
// the activating tick and progresses only while the actor is emitting.
export class BreakerTrailTimer {
 constructor(timing){this.delay=timing.delayMs;this.duration=timing.durationMs;this.startElapsed=0;this.endElapsed=0;this.emitting=false;this.stopped=false;}
 update(delta){
  if(!Number.isInteger(delta)||delta<0||delta>0xffffffff)throw new RangeError('Expected native uint32 delta');
  if(this.stopped)return false;
  const old=this.startElapsed;this.startElapsed=(old+delta)>>>0;
  if((this.delay>=old)!==(this.delay>=this.startElapsed))this.emitting=true;
  if(this.emitting){const before=this.endElapsed;this.endElapsed=(before+delta)>>>0;if((this.duration>=before)!==(this.duration>=this.endElapsed)){this.emitting=false;this.stopped=true;}}
  return this.emitting;
 }
 stop(){this.emitting=false;this.stopped=true;}
}

function resolveShape(avatar,files){
 const file=files?.[0];
 if(file?.source!==SOURCE)throw Error('Exact Breaker scene 0 required');
 const shape=file.nodes?.find(node=>node.type==='Shape'&&node.name===SHAPE);
 const parent=file.nodes?.find(node=>node.type==='ModelData'&&node.name===shape?.parent);
 if(shape?.parent!==MODEL||!parent?.matrix||!Array.isArray(shape.serializedPairs?.[0]))throw Error('Breaker Line01/authenticated pair required');
 const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===SOURCE&&mesh.name===MODEL);
 if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error('Exact evaluated Breaker model bone required');
 // The serialized pair is in the visible hammer's model space: its X/Z
 // coordinates and Y endpoints match the head edge vertices. Applying the
 // exported Shape placement again displaces it onto the shaft. Use the
 // evaluated visible mesh frame (including equipment animation/fitting).
 return {binding:bindNativeShape(shape),bone:meshes[0].parent,model:meshes[0]};
}

export class BreakerTrails {
 constructor(avatar,{equipmentFiles,texture,capacity=8192}={}){
  if(!texture)throw Error('Authenticated Breaker trail texture required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Breaker trail capacity');
  Object.assign(this,resolveShape(avatar,equipmentFiles));this.capacity=capacity;this.matrix=new Matrix4();this.texture=texture;
  texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.geometry=new BufferGeometry();
  for(const [name,size] of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
  const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);this.geometry.setIndex(new BufferAttribute(indices,1));
  // Type33 blendType0 -> controller mode1 -> D3D SRCALPHA/ONE. No claim is
  // made about blend equation, separate-alpha or the other native passes.
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneFactor,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='breaker-actor-ghost-trail';this.mesh.frustumCulled=false;this.warmups=new WeakMap();this.disposed=false;this.clear();
 }
 endpoints(){
  this.model.updateWorldMatrix(true,false);this.matrix.copy(this.model.matrixWorld);
  for(let i=0;i<15;i++)this.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(this.binding,this.matrix);
 }
 clear(){
  this.clock=new NativeGhostTrail(BREAKER_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);this.clock.emitting=false;
  this.timer=null;this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;this.overflow=false;this.mesh.visible=false;this.geometry.setDrawRange(0,0);
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Breaker trail delta');
  if(this.disposed)return;
  if(cancel||(attack&&attack.weapon!=='breaker')){this.clear();return;}
  const timing=breakerTrailTiming(attack),time=attack?.timeMs??(attack?.time??0)*1000,signature=timing?attack.kind:null;
  if(attack!==this.lastAttack||signature!==this.signature||(attack&&time<this.lastTime)){this.timer?.stop();this.timer=timing?new BreakerTrailTimer(timing):null;}
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
 snapshot(){return {nativeReady:false,binding:BREAKER_TRAIL_BINDING,profile:BREAKER_TRAIL_PROFILE,emitting:this.clock.emitting,opacity:this.clock.opacity,samples:this.clock.samples.length,timer:this.timer?{startElapsed:this.timer.startElapsed,endElapsed:this.timer.endElapsed,stopped:this.timer.stopped}:null,overflow:this.overflow,blendFactors:{src:'SRCALPHA',dst:'ONE'},additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Breaker trails disposed'));
  const key=sourceScene?.fog?(sourceScene.fog.isFogExp2?'exp2':'linear'):'none';let variants=this.warmups.get(renderer);if(!variants){variants=new Map();this.warmups.set(renderer,variants);}let task=variants.get(key);if(task)return task;
  task=(async()=>{renderer.initTexture?.(this.texture);const scene=new Scene();scene.fog=sourceScene?.fog??null;const proxy=new Mesh(this.geometry,this.material);proxy.frustumCulled=false;scene.add(proxy);try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}finally{scene.remove(proxy);}})();variants.set(key,task);task.catch(()=>variants.delete(key));return task;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}

export async function loadBreakerTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/weapon-breaker-classic.json');
 const texture=options.texture??await new TextureLoader().loadAsync(BREAKER_TRAIL_TEXTURE);
 let trails;try{trails=new BreakerTrails(avatar,{...options,equipmentFiles,texture});}catch(error){if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};}
 return trails;
}

export const BREAKER_TRAIL_LIMITS=Object.freeze([
 'The XML/type33 binding, Line01 P/P+V, texture, controller profile, action gates and SRCALPHA/ONE factors are statically sourced; native pixels and both-rig in-game visual comparison remain open.',
 'The native blend equation, separate alpha state, fog/flag21 binding, inherited colour/depth settings and post-mixer matrix order are not claimed from the factor trace.',
 'flag22 schedules an additional native render-list pass. This adapter keeps one world pass and reports that limit rather than duplicating an unqualified pass.',
 'State exit stops emission and lets samples fade; explicit switch/cancel clears history as an S5 lifecycle policy. Fixed capacity reports overflow rather than clipping.'
]);
