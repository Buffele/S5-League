import * as THREE from 'three';

export const NATIVE_RADAR_MARKER_ASSETS=Object.freeze({white:'/assets/ui/native-radar/marker-white.png',me:'/assets/ui/native-radar/marker-me.png',skin:'/assets/ui/native-radar/frame-skin.png',direction:'/assets/ui/native-radar/marker-direction.png',star:'/assets/ui/native-radar/marker-star.png'});
const vertexShader=`
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 sourceOrigin;
uniform vec2 sourceExtent;
uniform vec2 sampleCenterOffset;
varying vec2 spriteCoord;
void main(){
 vec2 p=(position.xy+sampleCenterOffset-sourceOrigin)/sourceExtent;
 spriteCoord=uv;gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
}`;
const fragmentShader=`
precision highp float;
uniform sampler2D sprite;
uniform vec4 diffuse;
varying vec2 spriteCoord;
void main(){gl_FragColor=texture2D(sprite,spriteCoord)*diffuse;}
`;
const number=(v,label)=>{if(!Number.isFinite(v)||!Number.isFinite(Math.fround(v)))throw TypeError('Finite float32 '+label+' required');return Math.fround(v);};
// D3D9 raster centers are integers; GL centers are half-integers. Add half a
// DEVICE pixel (right/down), not half a CSS/source pixel. getCurrentViewport
// supplies the actual device extent after DPR, render-target and rounding.
export function nativeRadarSampleCenterTranslation(sourceRect,deviceViewport){
 if(!sourceRect||!deviceViewport||!['width','height'].every(key=>Number.isFinite(sourceRect[key])&&sourceRect[key]>0)||!['z','w'].every(key=>Number.isFinite(deviceViewport[key])&&deviceViewport[key]>0))throw TypeError('Positive source and physical viewport extents required');
 return [Math.fround(.5*sourceRect.width/deviceViewport.z),Math.fround(.5*sourceRect.height/deviceViewport.w)];
}
function textureCopy(texture){
 const copy=texture.clone();copy.wrapS=copy.wrapT=THREE.ClampToEdgeWrapping;copy.magFilter=THREE.LinearFilter;copy.minFilter=THREE.LinearMipmapLinearFilter;copy.generateMipmaps=true;copy.flipY=false;copy.colorSpace=THREE.NoColorSpace;copy.needsUpdate=true;return copy;
}
function checkedDraw(draw){
 if(!draw||!Object.hasOwn(NATIVE_RADAR_MARKER_ASSETS,draw.texture))throw TypeError('An explicit source sprite key required');
 const pairs=(values,label)=>{if(!Array.isArray(values)||values.length!==4||values.some(pair=>!Array.isArray(pair)||pair.length!==2))throw TypeError('Four source '+label+' pairs required');return values.flatMap(pair=>pair.map(v=>number(v,label)));};
 if(!Array.isArray(draw.color)||draw.color.length!==4)throw TypeError('Explicit source diffuse RGBA required');
 return {texture:draw.texture,positions:pairs(draw.corners,'screen corners'),uv:pairs(draw.uv,'UV'),color:draw.color.map(v=>number(v,'diffuse'))};
}

/** Real GPU sprite sub-draw, separate from map/projection/visibility ownership.
 * Screen corners retain D3D9 source values. Raster-center translation is
 * derived from the actual physical viewport, including DPR/target scaling.
 */
export class NativeRadarMarkerRenderer{
 constructor(textures){
  if(!textures||Object.keys(NATIVE_RADAR_MARKER_ASSETS).some(key=>!textures[key]?.isTexture))throw TypeError('Complete loaded native radar sprite textures required');
  this.textures={};try{for(const key of Object.keys(NATIVE_RADAR_MARKER_ASSETS))this.textures[key]=textureCopy(textures[key]);}catch(error){Object.values(this.textures).forEach(texture=>texture.dispose());throw error;}
  this.scene=new THREE.Scene();this.camera=new THREE.Camera();this.pool=[];this.ready=false;this.disposed=false;
 }
 setFrame({draws,sourceRect}){
  if(this.disposed)throw Error('Radar marker renderer disposed');if(!Array.isArray(draws))throw TypeError('Ordered source marker draws required');
  if(!sourceRect)throw TypeError('Explicit source screen rectangle required');
  const rect=Object.fromEntries(['left','top','width','height'].map(key=>[key,number(sourceRect[key],'sourceRect '+key)]));if(rect.width<=0||rect.height<=0)throw RangeError('Positive source screen dimensions required');
  const checked=draws.map(checkedDraw);
  while(this.pool.length<checked.length){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(8),2));geometry.setIndex([0,1,2,0,2,3]);
   const material=new THREE.RawShaderMaterial({vertexShader,fragmentShader,uniforms:{sprite:{value:null},diffuse:{value:new THREE.Vector4()},sourceOrigin:{value:new THREE.Vector2()},sourceExtent:{value:new THREE.Vector2()},sampleCenterOffset:{value:new THREE.Vector2()}},depthTest:false,depthWrite:false,transparent:true,toneMapped:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendEquationAlpha:THREE.AddEquation,blendSrcAlpha:THREE.SrcAlphaFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
   const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=this.pool.length;this.scene.add(mesh);this.pool.push(mesh);
  }
  this.pool.forEach((mesh,index)=>{
   const draw=checked[index];mesh.visible=!!draw;if(!draw)return;
   mesh.geometry.attributes.position.array.set(draw.positions.flatMap((value,i)=>i%2===0?[value]:[value,0]));mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.attributes.uv.array.set(draw.uv);mesh.geometry.attributes.uv.needsUpdate=true;
   const uniforms=mesh.material.uniforms;uniforms.sprite.value=this.textures[draw.texture];uniforms.diffuse.value.fromArray(draw.color);uniforms.sourceOrigin.value.set(rect.left,rect.top);uniforms.sourceExtent.value.set(rect.width,rect.height);
  });this.sourceRect=rect;this.ready=true;
 }
 render(renderer,viewport){
  if(!this.ready||this.disposed)throw Error('A qualified source sprite frame required');if(!viewport||!['x','y','width','height'].every(key=>Number.isFinite(viewport[key]))||viewport.width<=0||viewport.height<=0)throw TypeError('Explicit positive viewport required');
  if(typeof renderer.getCurrentViewport!=='function')throw TypeError('Actual physical renderer viewport port required');
  const oldViewport=renderer.getViewport(new THREE.Vector4()),oldScissor=renderer.getScissor(new THREE.Vector4()),oldTest=renderer.getScissorTest(),oldClear=renderer.autoClear;
  try{renderer.autoClear=false;renderer.setViewport(viewport.x,viewport.y,viewport.width,viewport.height);renderer.setScissor(viewport.x,viewport.y,viewport.width,viewport.height);renderer.setScissorTest(true);const offset=nativeRadarSampleCenterTranslation(this.sourceRect,renderer.getCurrentViewport(new THREE.Vector4()));for(const mesh of this.pool)if(mesh.visible)mesh.material.uniforms.sampleCenterOffset.value.fromArray(offset);renderer.render(this.scene,this.camera);}
  finally{renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldTest);renderer.autoClear=oldClear;}
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.ready=false;for(const mesh of this.pool){mesh.geometry.dispose();mesh.material.dispose();}Object.values(this.textures).forEach(texture=>texture.dispose());this.scene.clear();}
}

let assetsPromise;
export function loadNativeRadarMarkerRenderer({loader}={}){
 if(!assetsPromise){const sourceLoader=loader??new THREE.TextureLoader();assetsPromise=(async()=>{const entries=Object.entries(NATIVE_RADAR_MARKER_ASSETS),results=await Promise.allSettled(entries.map(([,url])=>Promise.resolve().then(()=>sourceLoader.loadAsync(url))));if(results.some(result=>result.status==='rejected')){for(const result of results)if(result.status==='fulfilled')result.value.dispose();throw results.find(result=>result.status==='rejected').reason;}return Object.fromEntries(results.map((result,i)=>[entries[i][0],result.value]));})().catch(error=>{assetsPromise=undefined;throw error;});}
 return assetsPromise.then(textures=>new NativeRadarMarkerRenderer(textures));
}
