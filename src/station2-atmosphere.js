import * as THREE from 'three';
import {applyFloorPatina} from './station2-surface-finish.js';
import {loadStationCity,applyStationCity} from './station2-city.js';
import {applyStationDetails} from './station2-detail-kit.js';
import {applyStationScreens} from './station2-screens.js';

export async function loadBlenderEnvironment(){
 const [sky,city]=await Promise.all([new THREE.TextureLoader().loadAsync('/assets/station2-blender/sky-anime.png'),loadStationCity()]);
 sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;
 return {sky,city};
}

// All cloud geometry is below the original reset plane. It is never a collider.
export function applyBlenderAtmosphere(scene,world,{sky,city}){
 scene.background=sky;scene.backgroundIntensity=1;scene.backgroundRotation.y=.35;
 scene.fog=new THREE.Fog(0xb5d6ff,150,620);
 const materials=new Set();let triangles=0,draws=0;
 for(const group of world.blenderSlice.groups)group.traverse(o=>{
  if(!o.isMesh)return;draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
  if(group.userData.moduleId==='backdrop')o.castShadow=false;
  const m=o.material;if(materials.has(m))return;materials.add(m);m.envMapIntensity=.55;
  if(/Dallage ivoire/.test(m.name)){m.color.setRGB(.76,.65,.49);m.roughness=.56;applyFloorPatina(m);}
  else if(/Composite ivoire/.test(m.name))m.color.setRGB(.76,.71,.61);
  else if(/Bordure céramique/.test(m.name))m.color.setRGB(.86,.80,.69);
  for(const map of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap])if(map)map.anisotropy=8;
  if(m.map&&!m.normalMap&&group.userData.moduleId==='train'){
   const bump=m.map.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
   m.bumpMap=bump;m.bumpScale=/Béton/.test(m.name)?.035:.009;m.needsUpdate=true;
  }
 });
 const clouds=new THREE.Group();clouds.name='S5 • mer de nuages';clouds.userData.presentationOnly=true;
 const uniforms={...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:{value:0},tint:{value:new THREE.Color(0xe0eaff)}};
 const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}`;
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,
  vertexShader:`varying vec2 vUv;varying vec2 vWorld;\n#include <fog_pars_vertex>\nvoid main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}`,
  fragmentShader:`uniform float time;uniform vec3 tint;varying vec2 vUv;varying vec2 vWorld;\n#include <fog_pars_fragment>\n${noise}\nvoid main(){vec2 q=vWorld*.022+vec2(time*.004,0.0);float n=fbm(q);float edge=1.0-smoothstep(.25,.5,length(vUv-.5));float alpha=smoothstep(.32,.7,n)*edge*.67;gl_FragColor=vec4(tint*(.76+.35*n),alpha);\n#include <fog_fragment>\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
 });
 for(let i=0;i<3;i++){
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),material);plane.rotation.x=-Math.PI/2;
  plane.position.set(i*13,-32-i*17,-i*23);plane.renderOrder=1;clouds.add(plane);
 }
 scene.add(clouds);
 // Preserve the native animated beams and goals; add only the cloud clock.
 const update=world.update;world.update=dt=>{update(dt);uniforms.time.value+=Math.min(dt,.1);};
 world.brutal={stats:{shells:draws,addedTriangles:triangles,drawGroups:draws},skyline:null};
 const skyline=applyStationCity(world,city);
 applyStationDetails(world);
 applyStationScreens(world);
 world.atmosphere={clouds,skyline};world.name='Station 2 · Anime blue / coral';
 return world.atmosphere;
}
