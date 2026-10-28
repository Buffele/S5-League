import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,CustomBlending,SrcAlphaFactor,OneFactor,AddEquation,DoubleSide,RepeatWrapping,LinearFilter,LinearMipmapLinearFilter,SRGBColorSpace} from 'three';
import {createRocketGhostTrailClock} from './rocket-launcher-trail-initialization.js';
import {bindNativeShape,readNativeShapeEndpoints} from './native-shape.js';
import {isTrailTimeActive} from './native-ghost-trail-math.js';
const SCALE=.006;

export function rocketGhostTrailConfig(node,texture){
 if(node?.type!=='CActGhostTrail')throw Error('Rocket GhostTrail source required');
 const f=node.fields,b=f.base,w=f.fields10to1c;
 const result={id:node.index,parentType:b.field0c.int32,parent:b.field10.int32,bone:b.name.value,startMs:b.startTimeField.int32,endMs:b.endTimeField.int32,
  sampleLifetime:w[0].int32,spacing:w[1].float32,riseTime:w[2].int32,fallTime:w[3].int32,blendMode:f.versioned.field0c.int32,fog:f.flag20,texture,
  sourceNodeSha256:node.sha256,nativeGeometryCompared:false,nativeGpuCompared:false};
 if(result.parentType!==1||result.parent!==0||result.bone!=='Line01'||result.sampleLifetime!==700||result.spacing!==10||result.riseTime!==0||result.fallTime!==0||result.blendMode!==1||result.fog||f.versioned.flag21||f.versioned.flag22)throw Error('Unported Rocket GhostTrail profile');
 return result;
}

// Draws the existing source-backed NativeGhostTrail output. Evaluated matrix is
// mandatory and in scene units; convert to native units exactly once. Seeding
// histories with zero endpoint pairs and an identity Ghost-local transform
// follows the native constructors; subsequent evaluated matrices need comparison.
export class RocketLauncherTrail {
 constructor(config,source,texture){
  this.config=config;this.shape=bindNativeShape(source.nodes.find(n=>n.name===config.bone&&n.type==='Shape'));
  this.geometry=new BufferGeometry();texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.flipY=false;texture.colorSpace=SRGBColorSpace;
  this.material=new MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,blending:CustomBlending,blendSrc:SrcAlphaFactor,blendDst:OneFactor,blendEquation:AddEquation,depthTest:true,depthWrite:false,side:DoubleSide,fog:false,toneMapped:false});
  this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='Rocket Launcher source GhostTrail';this.mesh.frustumCulled=false;this.mesh.visible=false;this.clear();
 }
 clear(){this.clock=null;this.ageMs=0;this.remainderMs=0;this.mesh.visible=false;this.geometry.setDrawRange(0,0);}
 update(dt,evaluatedGhostMatrix,{active=true}={}){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Rocket trail delta');
  if(!evaluatedGhostMatrix?.isMatrix4)throw Error('Evaluated Rocket Ghost matrix required');
  const m=evaluatedGhostMatrix.clone();for(let i=0;i<12;i++)m.elements[i]/=SCALE;for(let i=12;i<15;i++)m.elements[i]/=SCALE;
  const endpoints=readNativeShapeEndpoints(this.shape,m);
  if(!this.clock)this.clock=createRocketGhostTrailClock(this.config);
  this.remainderMs+=dt*1000;const delta=Math.floor(this.remainderMs+1e-9);this.remainderMs-=delta;if(!delta)return;
  this.ageMs=(this.ageMs+delta)>>>0;
  this.clock.update(delta,endpoints,{emitting:active&&isTrailTimeActive(this.ageMs,this.config.startMs,this.config.endMs)});
 }
 render(){
  const vertices=this.clock?.vertices()??[];this.mesh.visible=vertices.length>=4;if(!this.mesh.visible){this.geometry.setDrawRange(0,0);return;}
  const positions=[],colors=[],uv=[],indices=[];
  for(const v of vertices){positions.push(...v.position.map(x=>x*SCALE));colors.push(...v.rgba);uv.push(...v.uv);}
  for(let i=0;i<vertices.length-2;i++)indices.push(...(i%2?[i+1,i,i+2]:[i,i+1,i+2]));
  this.geometry.setAttribute('position',new Float32BufferAttribute(positions,3));this.geometry.setAttribute('color',new Float32BufferAttribute(colors,4));this.geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));this.geometry.setIndex(indices);this.geometry.setDrawRange(0,indices.length);
 }
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
export const ROCKET_TRAIL_LIMITS=Object.freeze([
 'Source Shape first P,V pair and animated hierarchy retained; native evaluated Ghost matrix is not yet compared.',
 'Native constructors initialize zero endpoint histories and identity local pose; later reset/external-controller behavior remains unverified.',
 'S5 dt accumulation is not yet compared to native sequence clock; source emission interval is 0..2000ms inclusive.',
 'Native sampling formulas use JS intermediate precision; no universal x87 bit identity is claimed.',
 'Blend factors, texture modulation, sampler, depth flags and strip order traced; inherited blend equation, separate alpha, depth function and color space remain unverified.',
]);
