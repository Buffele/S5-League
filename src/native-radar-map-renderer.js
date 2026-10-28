import * as THREE from 'three';

// Map sub-draw only, PE 008EC960/008EF210. This deliberately does not select
// an S5 subject/camera or visibility state. UVs must be the four outputs of
// the source quaternion/matrix transform, in TL, BL, BR, TR order.
export const NATIVE_RADAR_MAP_ASSETS=Object.freeze({
 image:'/assets/ui/native-radar/station02.png',
 enemyImage:'/assets/ui/native-radar/station02-re.png',
 alpha:'/assets/ui/native-radar/map-alpha.png',
});

const vertexShader=`
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec2 maskUv;
varying vec2 mapCoord;
varying vec2 maskCoord;
void main(){mapCoord=uv;maskCoord=maskUv;gl_Position=vec4(position,1.0);}
`;
const fragmentShader=`
precision highp float;
uniform sampler2D mapImage;
uniform sampler2D alphaImage;
uniform vec4 diffuse;
varying vec2 mapCoord;
varying vec2 maskCoord;
void main(){
 vec4 pixel=texture2D(mapImage,mapCoord)*diffuse;
 pixel.a*=texture2D(alphaImage,maskCoord).a;
 gl_FragColor=pixel;
}
`;

function configuredCopy(texture){
 if(!texture?.isTexture)throw TypeError('An actual loaded radar texture is required');
 const copy=texture.clone();
 copy.wrapS=copy.wrapT=THREE.ClampToEdgeWrapping;
 copy.magFilter=THREE.LinearFilter;copy.minFilter=THREE.LinearMipmapLinearFilter;
 copy.generateMipmaps=true;copy.flipY=false;copy.colorSpace=THREE.NoColorSpace;
 copy.needsUpdate=true;return copy;
}

// ASM 008ECCB8..008ECD84. The byte is NOT a ruleId/mapId or an inferred team.
export function nativeRadarImageKey(actorByte,flag71A650){
 if(!Number.isInteger(actorByte)||actorByte<0||actorByte>255||typeof flag71A650!=='boolean')throw TypeError('Explicit raw actor byte and source flag required');
 return (actorByte===2)===flag71A650?'image':'enemyImage';
}

export class NativeRadarMapRenderer{
 constructor({image,enemyImage,alpha}){
  const source={image,enemyImage,alpha};
  if(Object.values(source).some(texture=>!texture?.isTexture))throw TypeError('Three actual loaded radar textures are required');
  this.textures={};
  try{for(const [key,texture] of Object.entries(source))this.textures[key]=configuredCopy(texture);}
  catch(error){Object.values(this.textures).forEach(texture=>texture.dispose());throw error;}
  this.geometry=new THREE.BufferGeometry();
  this.geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,1,0,-1,-1,0,1,-1,0,1,1,0],3));
  this.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(8),2));
  this.geometry.setAttribute('maskUv',new THREE.Float32BufferAttribute([0,0,0,1,1,1,1,0],2));
  this.geometry.setIndex([0,1,2,0,2,3]);
  this.material=new THREE.RawShaderMaterial({vertexShader,fragmentShader,
   uniforms:{mapImage:{value:this.textures.image},alphaImage:{value:this.textures.alpha},diffuse:{value:new THREE.Vector4(1,1,1,1)}},
   depthTest:false,depthWrite:false,transparent:true,toneMapped:false,
   blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,
   blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
   blendEquationAlpha:THREE.AddEquation,blendSrcAlpha:THREE.SrcAlphaFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
  });
  this.scene=new THREE.Scene();this.camera=new THREE.Camera();
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;this.scene.add(this.mesh);
  this.ready=false;this.disposed=false;
 }
 setFrame({uvCorners,actorByte,flag71A650}){
  if(this.disposed)throw Error('Radar map renderer disposed');
  if(!Array.isArray(uvCorners)||uvCorners.length!==4||uvCorners.some(v=>!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x)||!Number.isFinite(Math.fround(x)))))throw TypeError('Four finite source-transformed UV pairs are required');
  const key=nativeRadarImageKey(actorByte,flag71A650);
  this.geometry.attributes.uv.array.set(uvCorners.flat());this.geometry.attributes.uv.needsUpdate=true;
  this.material.uniforms.mapImage.value=this.textures[key];this.ready=true;
 }
 // Caller owns gates and the render target. viewport uses the renderer's own
 // logical bottom-left units. Restore every state changed by this sub-draw.
 render(renderer,viewport){
  if(this.disposed||!this.ready)throw Error('A source-qualified radar frame is required before rendering');
  if(!viewport||!['x','y','width','height'].every(k=>Number.isFinite(viewport[k]))||viewport.width<=0||viewport.height<=0)throw TypeError('Explicit positive radar viewport required');
  const oldViewport=renderer.getViewport(new THREE.Vector4()),oldScissor=renderer.getScissor(new THREE.Vector4());
  const oldScissorTest=renderer.getScissorTest(),oldAutoClear=renderer.autoClear;
  try{
   renderer.autoClear=false;renderer.setViewport(viewport.x,viewport.y,viewport.width,viewport.height);
   renderer.setScissor(viewport.x,viewport.y,viewport.width,viewport.height);renderer.setScissorTest(true);
   renderer.render(this.scene,this.camera);
  }finally{
   renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldScissorTest);renderer.autoClear=oldAutoClear;
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.ready=false;this.geometry.dispose();this.material.dispose();Object.values(this.textures).forEach(texture=>texture.dispose());this.scene.clear();}
}

// Loader caches genuine source assets, not a replacement collision-terrain map.
// A rejected load is evicted so a later request can recover.
let assetsPromise;
export function loadNativeRadarMapRenderer({loader}={}){
 if(!assetsPromise){
  const sourceLoader=loader??new THREE.TextureLoader();
  assetsPromise=(async()=>{
   const entries=Object.entries(NATIVE_RADAR_MAP_ASSETS);
   const results=await Promise.allSettled(entries.map(([,url])=>Promise.resolve().then(()=>sourceLoader.loadAsync(url))));
   const errors=results.filter(result=>result.status==='rejected');
   if(errors.length){
    for(const result of results)if(result.status==='fulfilled')result.value.dispose();
    throw errors[0].reason;
   }
   return Object.fromEntries(results.map((result,i)=>[entries[i][0],result.value]));
  })().catch(error=>{assetsPromise=undefined;throw error;});
 }
 return assetsPromise.then(textures=>new NativeRadarMapRenderer(textures));
}
