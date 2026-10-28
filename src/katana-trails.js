import {BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,RepeatWrapping,Scene,SRGBColorSpace,SrcAlphaFactor,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {KATANA_ACTION_EVENTS} from './katana-combat-data.js';

const SCALE=.006;
export const KATANA_TRAIL_BINDING=Object.freeze({type:39,sceneIndex:1,source:'model/weapon/katana_a.scn',model:'katana_body',shape:'Line01',name:'GhostTrail_katana_a_sword_01',sourceTexture:'image/slash01.dds',texture:'/assets/s5runtime/weapons/katana/trail/slash01.png',blendType:0,controllerMode:1});
// Shared XML actor producer B94D60 -> 982170, not a guessed per-weapon lifetime.
export const KATANA_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100});
export function katanaTrailTiming(attack){
 if(attack?.weapon!=='katana')return null;
 const action=attack.kind==='light'?KATANA_ACTION_EVENTS.light[attack.comboIndex??0]:KATANA_ACTION_EVENTS[attack.kind];
 const event=action?.trail;
 // The source's second integer is a duration after activation, not an end date.
 return event?{delayMs:event.beginMs,durationMs:event.endMs}:null;
}
export class KatanaTrailTimer{
 constructor({delayMs,durationMs}){this.delay=delayMs;this.duration=durationMs;this.startElapsed=0;this.endElapsed=0;this.emitting=false;this.stopped=false;}
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
function resolve(avatar,files){
 const b=KATANA_TRAIL_BINDING,file=files?.find(file=>file.source===b.source),shape=file?.nodes?.find(node=>node.type==='Shape'&&node.name===b.shape);
 if(shape?.parent!==b.model||!shape.serializedPairs?.length)throw Error('Exact Katana blade Line01/pair required');
 const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===b.source&&mesh.name===b.model);
 if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error('Exact evaluated Katana blade required; no scabbard/bounds fallback');
 return {model:meshes[0],binding:bindNativeShape(shape),local:new Matrix4().fromArray(shape.matrix)};
}
export class KatanaTrails{
 constructor(avatar,{equipmentFiles,texture,capacity=8192}={}){
  if(!texture)throw Error('Authenticated Katana trail texture required');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Katana trail capacity');
  Object.assign(this,resolve(avatar,equipmentFiles));this.texture=texture;this.capacity=capacity;this.matrix=new Matrix4();
  texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.geometry=new BufferGeometry();
  for(const [name,size]of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
  const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);this.geometry.setIndex(new BufferAttribute(indices,1));
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneFactor,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name=KATANA_TRAIL_BINDING.name;this.mesh.frustumCulled=false;this.warmups=new WeakMap();this.disposed=false;this.clear();
 }
 endpoints(){
  // Unlike Breaker, Katana's authored Shape placement maps P/P+V onto its
  // actual blade vertices. Do not cancel it with inverse(ModelData.matrix).
  this.model.updateWorldMatrix(true,false);this.matrix.multiplyMatrices(this.model.matrixWorld,this.local);
  for(let i=0;i<15;i++)this.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(this.binding,this.matrix);
 }
 clear(){
  // S5 lifecycle seed is the evaluated weapon, not the world origin. Native
  // initial history construction is outside the proven producer contract.
  this.clock=new NativeGhostTrail(KATANA_TRAIL_PROFILE,this.endpoints());this.clock.emitting=false;
  this.timer=null;this.lastAttack=null;this.signature=null;this.lastTime=null;this.remainderMs=0;this.overflow=false;this.mesh.visible=false;this.geometry.setDrawRange(0,0);
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Katana trail delta');
  if(this.disposed)return;
  if(cancel||attack&&attack.weapon!=='katana'){this.clear();return;}
  const timing=katanaTrailTiming(attack),time=attack?.timeMs??(attack?.time??0)*1000,signature=timing?`${attack.kind}:${attack.comboIndex??0}`:null;
  if(attack!==this.lastAttack||signature!==this.signature||attack&&time<this.lastTime){this.timer?.stop();this.timer=timing?new KatanaTrailTimer(timing):null;}
  this.lastAttack=attack;this.signature=signature;this.lastTime=time;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0){const endpoints=this.endpoints();if(this.clock.inactive)this.clock.update(0,endpoints,{reset:true});this.clock.update(delta,endpoints,{emitting:this.timer?.update(delta)??false});}
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
 snapshot(){return {nativeReady:false,binding:KATANA_TRAIL_BINDING,profile:KATANA_TRAIL_PROFILE,emitting:this.clock.emitting,samples:this.clock.samples.length,visible:this.mesh.visible,overflow:this.overflow,additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Katana trails disposed'));
  const key=sourceScene?.fog?(sourceScene.fog.isFogExp2?'exp2':'linear'):'none';let variants=this.warmups.get(renderer);if(!variants){variants=new Map();this.warmups.set(renderer,variants);}let task=variants.get(key);if(task)return task;
  task=(async()=>{renderer.initTexture?.(this.texture);const scene=new Scene();scene.fog=sourceScene?.fog??null;const proxy=new Mesh(this.geometry,this.material);proxy.frustumCulled=false;scene.add(proxy);try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}finally{scene.remove(proxy);}})();variants.set(key,task);task.catch(()=>variants.delete(key));return task;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
export async function loadKatanaTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/weapon-katana-classic.json');
 const texture=options.texture??await new TextureLoader().loadAsync(KATANA_TRAIL_BINDING.texture);
 let trails;try{trails=new KatanaTrails(avatar,{...options,equipmentFiles,texture});}catch(error){if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=trails.dispose.bind(trails);let done=false;trails.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};}
 return trails;
}
export const KATANA_TRAIL_LIMITS=Object.freeze([
 'Classic scene1 only. Authored Shape placement is checked against real blade vertices; native runtime matrix order remains unverified.',
 'Generic XML producer timing/spacing and blend factors are sourced; additional pass, inherited alpha/depth/fog state and full native visual equivalence remain open.',
 'Action exit retains fade; explicit cancel/switch clears history. Seed at the evaluated blade is an S5 lifecycle policy, not a claim about native initialization.'
]);
