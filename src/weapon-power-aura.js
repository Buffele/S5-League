import {AdditiveBlending,BackSide,Color,DoubleSide,Float32BufferAttribute,ShaderMaterial} from 'three';
import {WeaponFlameVolume} from './weapon-flame-volume.js';

function burningSurface(outer,noiseMap){return new ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:outer?BackSide:DoubleSide,blending:AdditiveBlending,toneMapped:false,
 defaultAttributeValues:{color:[1,1,1],uv:[0,0],uv1:[0,0],flameMask:[1]},
 uniforms:{color:{value:new Color()},alpha:{value:0},time:{value:0},width:{value:.065},extent:{value:0},noiseMap:{value:noiseMap}},
 vertexShader:`#include <common>
 #include <skinning_pars_vertex>
 attribute float flameMask;uniform float extent;varying vec3 vP;varying vec3 vN;varying float vMask;
 void main(){
 #include <beginnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <defaultnormal_vertex>
 #include <begin_vertex>
 #include <skinning_vertex>
 vec4 world=modelMatrix*vec4(transformed,1.);vec3 n=normalize(mat3(modelMatrix)*objectNormal);
 world.xyz+=n*extent;vP=world.xyz;vN=n;vMask=flameMask;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`precision highp sampler3D;uniform sampler3D noiseMap;uniform vec3 color;uniform float alpha,time,width;varying vec3 vP;varying vec3 vN;varying float vMask;
 void main(){if(vMask<.05)discard;vec3 p=vP*(.06/max(width,.01))*vec3(1.,.32,1.)-vec3(0.,time*.7,0.);
 float noise=texture(noiseMap,p).r*.57+texture(noiseMap,p*2.03+vec3(.31)).r*.29+texture(noiseMap,p*4.11+vec3(.71)).r*.14;
 float rim=pow(1.-abs(dot(normalize(vN),normalize(cameraPosition-vP))),1.8);
 float heat=smoothstep(.25,.8,noise);vec3 fire=mix(color*.4,color*1.7+vec3(.13),heat);
 gl_FragColor=vec4(fire,alpha*vMask*${outer?'rim*(.35+.65*heat)':'(.72+.28*heat)'});
 #include <colorspace_fragment>
 }`});}

// The held weapon itself burns: a continuous incandescent surface and a 3D
// density envelope derived from its triangles. No billboards or flame cards.
export class WeaponPowerAura{
 constructor({avatar,group,copy,capture,sources=avatar.meshes.filter(mesh=>mesh.userData.weapon&&!mesh.isSkinnedMesh),surfaceMeshes=sources,surfaceMasks=new Map()}){
  this.avatar=avatar;this.capture=capture;
  this.surfaceMeshes=new Set(surfaceMeshes);this.volumes=sources.map(source=>new WeaponFlameVolume(source,group));
  if(!this.volumes.length)throw Error('Weapon fire requires actual rigid weapon geometry');
  const noiseMap=this.volumes[0].mesh.material.uniforms.noiseMap.value;
  this.copies=Array.from({length:2},(_,index)=>{const c=copy(),material=burningSurface(index===1,noiseMap);c.material.dispose();c.material=material;c.maskedGeometries=[];for(const [source,node]of c.pairs)if(node.isMesh){node.material=material;const mask=surfaceMasks.get(source);if(mask){node.geometry=source.geometry.clone();node.geometry.setAttribute('flameMask',new Float32BufferAttribute(mask,1));c.maskedGeometries.push(node.geometry);}}return c;});
  this.meshes=this.volumes.map(volume=>volume.mesh);this.color=new Color();this.clear();
 }
 clear(){this.intensity=0;for(const c of this.copies)c.root.visible=false;for(const mesh of this.meshes)mesh.visible=false;}
 sample(effect){
  const p=effect.profile;if(!p.powerAura){this.clear();return;}
  this.mode=p.auraMode;this.style=p.style;this.age=effect.age;
  const tuning=this.avatar.group.userData.weaponEffectSettings?.getAura()??{size:1,intensity:1};this.size=tuning.size;this.gain=tuning.intensity;
  const release=effect.releaseAge===null?1:1-Math.min(1,Math.max(0,(effect.age-effect.releaseAge)/.55));
  this.intensity=Math.min(1,Math.max(0,(effect.age-effect.startAge)/.10))*release;
  this.color.set(tuning.color??(p.weapon==='counter'?(p.style==='A'?0x47bfff:p.style==='B'?0x397dff:0x18cfff):(p.style==='A'?0x287fff:p.style==='B'?0x426aff:0x17bfff)));
  for(const [i,c]of this.copies.entries()){
   this.capture(c);c.root.visible=this.avatar.group.visible&&this.intensity*this.gain>.002;
   for(const [source,target]of c.pairs)if(target.isMesh)target.visible=target.visible&&this.surfaceMeshes.has(source)&&(Array.isArray(source.material)?source.material:[source.material]).some(material=>material.opacity>.002);
   const u=c.material.uniforms;u.color.value.copy(this.color);u.alpha.value=Math.min(1,this.intensity*this.gain)*(i?.16:.55);u.time.value=effect.age;
   u.width.value=(this.mode==='edge'?.032:this.mode==='flame'?.065:.05)*this.size;u.extent.value=this.size*(i?.018:.004);
  }
  for(const volume of this.volumes)volume.sample(this);
 }
 render(){}
 snapshot(){return {representation:'surface-distance-volume',mode:this.mode,style:this.style,intensity:this.intensity,tuning:{size:this.size,gain:this.gain,color:'#'+this.color.getHexString()},scale:1,layers:this.copies.filter(c=>c.root.visible).length,sources:[...new Set(this.volumes.filter(v=>v.mesh.visible).map(v=>v.source.userData.source))],volumes:this.volumes.filter(v=>v.mesh.visible).length,particles:0};}
 dispose(){this.clear();for(const c of this.copies){for(const skeleton of c.skeletons)skeleton.dispose();for(const geometry of c.maskedGeometries)geometry.dispose();c.material.dispose();c.root.removeFromParent();}for(const volume of this.volumes)volume.dispose();}
}
