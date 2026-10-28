import {AdditiveBlending,BufferAttribute,BufferGeometry,DoubleSide,DynamicDrawUsage,Group,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,RepeatWrapping,SRGBColorSpace,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {demonicKnuckleTrailWindows} from './demonic-knuckle-effects.js';
import {nominalActorTrailWindow} from './actor-trail-window.js';
import {TwinBladeActorTrailTimer} from './twin-blade-actor-trails.js';
import {createTrailMeshWarmup} from './trail-mesh-warmup.js';

const SCALE=.006;
export const DEMONIC_KNUCKLE_TRAIL_PROFILE=Object.freeze({sampleLifetime:200,spacing:50,riseTime:50,fallTime:100});
export const DEMONIC_KNUCKLE_TRAIL_BINDINGS=Object.freeze(['right','left'].map((side,sceneIndex)=>Object.freeze({
 side,sceneIndex,source:`model/weapon/demonic_knuckle_${side==='right'?'r':'l'}_01.scn`,
 shape:'Line01',parent:'demonic_knuckle_body_Dummy',model:'demonic_knuckle_body',
 name:`GhostTrail_Demonic_Knuckle_${side==='right'?'Right':'Left'}`,sourceTexture:'image/gi.dds',blendType:0,
})));
export const DEMONIC_KNUCKLE_TRAIL_TEXTURE='/assets/s5runtime/demonic-knuckle/textures/gi.png';
export function demonicKnuckleTrailWindow(attack,side){
 const binding=DEMONIC_KNUCKLE_TRAIL_BINDINGS.find(b=>b.side===side);
 if(!binding)throw new RangeError('Unknown Demonic Knuckle trail side');
 const timeMs=attack?.timeMs??(attack?.time??0)*1000;
 return demonicKnuckleTrailWindows(attack).some(w=>w.name===binding.name&&nominalActorTrailWindow(timeMs,w));
}

function resolveLine(avatar,files,binding){
 const file=files?.[binding.sceneIndex];
 if(file?.source!==binding.source)throw Error(`Missing Demonic Knuckle scene${binding.sceneIndex}: ${binding.source}`);
 const shape=file.nodes?.find(n=>n.name===binding.shape&&n.type==='Shape'),parent=file.bones?.find(b=>b.name===binding.parent);
 if(!shape||shape.parent!==binding.parent||!parent)throw Error(`Missing native Demonic Knuckle ${binding.side} Line01/parent`);
 const nativeShape=bindNativeShape(shape);
 if(!parent.matrix?.every(Number.isFinite)||parent.matrix.length!==16)throw Error('Native Line01 bind matrices required');
 const meshes=avatar.meshes.filter(m=>m.userData.weapon&&m.userData.source===binding.source&&m.name===binding.model);
 if(meshes.length!==1)throw Error(`Expected exact Demonic Knuckle ${binding.side} body mesh`);
 let bone=meshes[0].parent;
 while(bone&&!bone.name.endsWith('_'+binding.parent))bone=bone.parent;
 if(!bone?.isBone)throw Error(`Missing animated Demonic Knuckle ${binding.side} body parent`);
 const local=new Matrix4().fromArray(parent.matrix).invert().multiply(new Matrix4().fromArray(shape.matrix));
 return {binding,bone,local,nativeShape,matrix:new Matrix4()};
}
function geometry(capacity){
 const result=new BufferGeometry();
 for(const [name,size] of [['position',3],['color',4],['uv',2]])result.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
 const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);
 result.setIndex(new BufferAttribute(indices,1));return result;
}
export class DemonicKnuckleTrails {
 constructor(avatar,{equipmentFiles,texture,capacity=8192}={}){
  if(!texture)throw Error('Demonic Knuckle requires its authenticated image/gi.dds texture; use loadDemonicKnuckleTrails');
  if(!Number.isInteger(capacity)||capacity<4||capacity>65536)throw new RangeError('Invalid Demonic Knuckle trail capacity');
  const lines=DEMONIC_KNUCKLE_TRAIL_BINDINGS.map(binding=>resolveLine(avatar,equipmentFiles,binding));
  this.mesh=new Group();this.mesh.name='demonic-knuckle-motion-trails';this.capacity=capacity;this.texture=texture;this.disposed=false;this.warmupMeshes=createTrailMeshWarmup(this.mesh);
  texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.trails=lines.map(line=>{
   const g=geometry(capacity),material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:AdditiveBlending,depthTest:true,depthWrite:false,side:DoubleSide,fog:true,toneMapped:false});
   const mesh=new Mesh(g,material);mesh.name=`demonic-knuckle-${line.binding.side}-trail`;mesh.frustumCulled=false;this.mesh.add(mesh);
   return {...line,geometry:g,material,mesh,get samples(){return this.clock.samples;}};
  });
  this.clear();
 }
 endpoints(trail){
  trail.bone.updateWorldMatrix(true,false);trail.matrix.multiplyMatrices(trail.bone.matrixWorld,trail.local);
  for(let i=0;i<15;i++)trail.matrix.elements[i]/=SCALE;
  return readNativeShapeEndpoints(trail.nativeShape,trail.matrix);
 }
 clear(){
  for(const t of this.trails){t.clock=new NativeGhostTrail(DEMONIC_KNUCKLE_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);t.clock.emitting=false;t.seeded=false;t.timer=null;t.overflow=false;t.mesh.visible=false;t.geometry.setDrawRange(0,0);}
  this.lastAttack=null;this.lastTimeMs=null;this.signature=null;this.remainderMs=0;
 }
 update(dt,attack,{cancel=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid Demonic Knuckle trail delta');
  if(this.disposed)return;
  if(cancel||(attack&&attack.weapon!=='demonicknuckle')){this.clear();return;}
  const time=attack?.timeMs??(attack?.time??0)*1000,signature=attack?`${attack.kind}:${attack.hand??attack.profile?.hand??''}`:null;
  if(attack&&attack===this.lastAttack&&(time<this.lastTimeMs||signature!==this.signature))this.clear();
  if(attack!==this.lastAttack||signature!==this.signature){
   const windows=demonicKnuckleTrailWindows(attack);
   for(const t of this.trails){t.timer?.stop();const w=windows.find(w=>w.name===t.binding.name);t.timer=w?new TwinBladeActorTrailTimer({delayMs:w.beginMs,durationMs:w.endMs}):null;}
  }
  this.lastAttack=attack;this.lastTimeMs=time;this.signature=signature;
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0)for(const t of this.trails){
   const points=this.endpoints(t);if(!t.seeded){t.clock.update(0,points,{emitting:false,reset:true});t.seeded=true;}
   t.clock.update(delta,points,{emitting:t.timer?.update(delta)??false});
  }
 }
 render(){
  if(this.disposed)return;
  for(const t of this.trails){
   const vertices=t.clock.vertices();t.overflow=vertices.length>this.capacity;t.mesh.visible=vertices.length>=4&&!t.overflow;
   if(!t.mesh.visible){t.geometry.setDrawRange(0,0);continue;}
   const attrs=t.geometry.attributes;
   for(let i=0;i<vertices.length;i++){const v=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=v.position[j]*SCALE;attrs.color.array.set(v.rgba,i*4);attrs.uv.array.set(v.uv,i*2);}
   for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}
   t.geometry.setDrawRange(0,(vertices.length-2)*3);
  }
 }
 snapshot(){return {nativeReady:false,profile:DEMONIC_KNUCKLE_TRAIL_PROFILE,trails:this.trails.map(t=>({side:t.binding.side,emitting:t.clock.emitting,samples:t.clock.samples.length,opacity:t.clock.opacity,overflow:t.overflow})),additionalNativePassPorted:false};}
 warmup(renderer,camera,sourceScene=null){
  if(this.disposed)return Promise.reject(Error('Demonic Knuckle trails disposed'));
  return this.warmupMeshes(renderer,camera,sourceScene);
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();for(const t of this.trails){t.geometry.dispose();t.material.dispose();}}
}
export async function loadDemonicKnuckleTrails(avatar,options={}){
 const equipmentFiles=options.equipmentFiles??await readAsset('/assets/s5runtime/demonic-knuckle/model.json');
 const texture=options.texture??await new TextureLoader().loadAsync(DEMONIC_KNUCKLE_TRAIL_TEXTURE);
 let result;try{result=new DemonicKnuckleTrails(avatar,{...options,equipmentFiles,texture});}catch(error){if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=result.dispose.bind(result);let done=false;result.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};}
 return result;
}
export const DEMONIC_KNUCKLE_TRAIL_LIMITS=Object.freeze([
 'Native Line01 parent and generic actor XML profile are sourced; exact post-mixer matrix order and visual grip still need comparison.',
 'Independent per-hand wrapper timers use the common strict crossing semantics; native handoff cadence and actor-state lifetime remain unverified.',
 'Type47 blendType0 selects SRCALPHA/ONE; the generic XML producer enables fog. Native fog parameters, inherited GPU states and the additional flag22 render pass remain unverified.',
 'Switch/cancel and mutable-action rewind clear histories as an S5 lifecycle policy; ordinary state exit stops emission and preserves fade.',
]);
