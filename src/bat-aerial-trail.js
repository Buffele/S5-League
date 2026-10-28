import {BufferAttribute,BufferGeometry,CustomBlending,DoubleSide,DynamicDrawUsage,LinearFilter,LinearMipmapLinearFilter,Matrix4,Mesh,MeshBasicMaterial,OneFactor,RepeatWrapping,SRGBColorSpace,SrcAlphaFactor,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {NativeGhostTrail} from './native-ghost-trail.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {nativeRecordedShapePose} from './native-shape-pose.js';

const SCALE=.006;
export const BAT_AERIAL_TRAIL_PROFILE=Object.freeze({sampleLifetime:500,spacing:100,riseTime:0,fallTime:400});
export const BAT_AERIAL_TRAIL_TEXTURE='/assets/s5runtime/demonic-knuckle/textures/gi.png';
// Active native observations establish Bat -> identity a0015.scn container ->
// loaded Line01 pose -> identity Ghost. The loaded Shape itself is not reset.
// Source fields and observed topology: bat-active-sequence-native/observation-3.
export class BatAerialTrail {
 constructor(avatar,{source,pose,texture,capacity=8192}){
  const shape=source?.nodes?.[0],meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source==='model/weapon/bat.scn'&&mesh.name==='Bat');
  if(source.source!=='effects/a0015.scn'||source.nodes.length!==1||shape.type!=='Shape'||shape.name!=='Line01'||source.models.length||source.bones.length)throw Error('Exact Bat aerial source Shape required');
  if(meshes.length!==1||!meshes[0].parent?.isBone)throw Error('Exact evaluated Bat model owner required');
  if(!texture||!Number.isInteger(capacity)||capacity<4||capacity>65536)throw Error('Prepared Bat aerial texture and bounded capacity required');
  this.binding=bindNativeShape(shape);this.local=new Matrix4().fromArray(nativeRecordedShapePose(this.binding,pose).localMatrix);this.owner=meshes[0].parent;
  this.capacity=capacity;this.texture=texture;this.matrix=new Matrix4();this.geometry=new BufferGeometry();
  for(const [name,size]of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new BufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));
  const indices=new Uint16Array((capacity-2)*3);for(let i=0;i<capacity-2;i++)indices.set(i%2?[i+1,i,i+2]:[i,i+1,i+2],i*3);this.geometry.setIndex(new BufferAttribute(indices,1));
  texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneFactor,depthTest:true,depthWrite:false,side:DoubleSide,fog:false,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='bat-aerial-sequence-ghost-trail';this.mesh.frustumCulled=false;this.disposed=false;this.clear();
 }
 endpoints(){this.owner.updateWorldMatrix(true,false);this.matrix.multiplyMatrices(this.owner.matrixWorld,this.local);for(let i=0;i<15;i++)this.matrix.elements[i]/=SCALE;return readNativeShapeEndpoints(this.binding,this.matrix);}
 clear(){this.clock=new NativeGhostTrail(BAT_AERIAL_TRAIL_PROFILE,[[0,0,0],[0,0,0]]);this.clock.emitting=false;this.lastAir=null;this.lastTime=null;this.remainderMs=0;this.overflow=false;this.mesh.visible=false;this.geometry.setDrawRange(0,0);}
 update(dt,attack){
  if(this.disposed||dt===0)return;
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Bat aerial trail delta');
  const air=attack?.weapon==='bat'&&attack.kind==='air'?attack:null,time=air?.timeMs??(air?.time??0)*1000;
  if(air&&(air!==this.lastAir||time<this.lastTime))this.clear();
  if(air){this.lastAir=air;this.lastTime=time;}
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;
  if(delta>0)this.clock.update(delta,this.endpoints(),{emitting:!!air&&time>=200&&time<=500});
 }
 render(){
  if(this.disposed)return;const vertices=this.clock.vertices();this.overflow=vertices.length>this.capacity;this.mesh.visible=vertices.length>=4&&!this.overflow;
  if(!this.mesh.visible){this.geometry.setDrawRange(0,0);return;}
  const attrs=this.geometry.attributes;for(let i=0;i<vertices.length;i++){const v=vertices[i];for(let j=0;j<3;j++)attrs.position.array[i*3+j]=v.position[j]*SCALE;attrs.color.array.set(v.rgba,i*4);attrs.uv.array.set(v.uv,i*2);}
  for(const attr of Object.values(attrs)){attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*attr.itemSize);attr.needsUpdate=true;}this.geometry.setDrawRange(0,(vertices.length-2)*3);
 }
 snapshot(){return {nativeReady:false,source:'skill_bat_strike / action1',emitting:this.clock.emitting,samples:this.clock.samples.length,visible:this.mesh.visible,overflow:this.overflow,additionalNativePassPorted:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
export async function loadBatAerialTrail(avatar){
 const [source,pose]=await Promise.all([readAsset('/assets/s5runtime/bat/models/a0015.json'),readAsset('/assets/s5runtime/bat/models/a0015-native-pose.json')]);
 const texture=await new TextureLoader().loadAsync(BAT_AERIAL_TRAIL_TEXTURE);let trail;
 try{trail=new BatAerialTrail(avatar,{source,pose,texture});}catch(error){texture.dispose();throw error;}
 const dispose=trail.dispose.bind(trail);let done=false;trail.dispose=()=>{if(done)return;done=true;dispose();texture.dispose();};return trail;
}
