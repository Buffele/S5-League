import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createInkOutline} from './ink-outline.js';
import {createChaserViewPass} from './chaser-presentation.js';
import {RENDER_QUALITY,normalizeRenderQuality,surfaceDetailSize} from './render-quality.js';
import {attachPresentationDepth,applyComposerBudget} from './composer-budget.js';
import {createStationStaticShadows} from './station2-static-shadows.js';

// Presentation only: never writes geometry, matrices, layout or collision data.
// Preserve animated alpha/effect materials: animation tracks retain their references.
export function modernizable(mesh,material){
 return mesh.visible&&!mesh.userData.collision&&mesh.renderOrder!==-1000&&
  material.depthTest&&material.depthWrite&&!material.transparent&&
  material.blending===THREE.NormalBlending&&!material.polygonOffset;
}

function surfaceMaps(source,cache){
 if(cache.has(source.image))return cache.get(source.image);
 const image=source.image,{width:w,height:h}=surfaceDetailSize(image.naturalWidth||image.width,image.naturalHeight||image.height);
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,w,h);
 const original=ctx.getImageData(0,0,w,h),rough=ctx.createImageData(w,h),height=ctx.createImageData(w,h),glow=ctx.createImageData(w,h);
 for(let i=0;i<original.data.length;i+=4){
  const [r,g,b,a]=original.data.subarray(i,i+4),l=(r*.2126+g*.7152+b*.0722)/255;
  // Small deterministic coating grain, not displacement or invented panel seams.
  const grain=((Math.imul(i/4+1,1597334677)>>>16)&255)/255-.5;
  const cyan=THREE.MathUtils.smoothstep(Math.min(g,b)-r,45,145)*THREE.MathUtils.smoothstep(Math.min(g,b),130,210);
  const v=Math.round(255*(.64+.19*(1-l)+grain*.035));
  rough.data.set([v,v,v,255],i);
  const bump=Math.round(128+(l-.5)*24+grain*7);
  height.data.set([bump,bump,bump,255],i);
  glow.data.set([Math.round(r*cyan),Math.round(g*cyan),Math.round(b*cyan),a],i);
 }
 const texture=(pixels,colorSpace)=>{
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(pixels,0,0);
  const t=new THREE.CanvasTexture(c);t.flipY=source.flipY;t.wrapS=source.wrapS;t.wrapT=source.wrapT;t.colorSpace=colorSpace;t.anisotropy=8;return t;
 };
 const maps={roughnessMap:texture(rough,THREE.NoColorSpace),bumpMap:texture(height,THREE.NoColorSpace),emissiveMap:texture(glow,THREE.SRGBColorSpace)};
 cache.set(source.image,maps);return maps;
}

export function enhanceStationMaterials(root,{anisotropy=8,mapsFor=surfaceMaps}={}){
 const maps=new Map();let count=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const convert=old=>{
   if(!modernizable(mesh,old))return old;
   const material=new THREE.MeshStandardMaterial();
   for(const key of ['map','alphaMap','alphaTest','opacity','side','depthTest','depthWrite','fog','vertexColors','lightMap','lightMapIntensity'])if(old[key]!==undefined)material[key]=old[key];
   material.color.copy(old.color);material.roughness=.88;material.metalness=.23;
   material.envMapIntensity=.28;
   // Existing baked shading is retained gently alongside real shadowing.
   if(material.lightMap)material.lightMapIntensity=.35;
   if(old.map){
    material.map=old.map.clone();material.map.anisotropy=anisotropy;material.map.needsUpdate=true;
    Object.assign(material,mapsFor(old.map,maps));material.bumpScale=.055;
    material.emissive.set(0xffffff);material.emissiveIntensity=.8;
   }
   mesh.castShadow=true;mesh.receiveShadow=true;count++;return material;
  };
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);
 });
 return count;
}

export function createStationPresentation(renderer,scene,camera,world,sun){
 const count=world.brutal?world.brutal.stats.shells:enhanceStationMaterials(world.group,{anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy())});
 const pmrem=new THREE.PMREMGenerator(renderer),room=world.brutal?null:new RoomEnvironment();
 const environment=world.brutal?pmrem.fromEquirectangular(scene.background):pmrem.fromScene(room,.04);scene.environment=environment.texture;room?.dispose();pmrem.dispose();
 renderer.shadowMap.type=THREE.PCFShadowMap;sun.shadow.radius=2;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=world.brutal?1.1:.95;
 scene.traverse(object=>{if(object.isHemisphereLight){object.color.set(0xc5e4ff);object.groundColor.set(0x34425f);object.intensity=world.brutal?1.45:.85;}});
 sun.color.set(0xffeddb);sun.intensity=2;sun.position.set(-30,65,-24);
 sun.target.position.set(0,5,0);scene.add(sun.target);
 sun.shadow.mapSize.set(2048,2048);sun.shadow.map?.dispose();sun.shadow.map=null;
 Object.assign(sun.shadow.camera,{left:-55,right:55,top:60,bottom:-60,near:1,far:150});sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.00008;sun.shadow.normalBias=.035;
 const fill=new THREE.DirectionalLight(0x91ccff,.35);fill.position.set(35,18,20);scene.add(fill);
 const staticShadows=createStationStaticShadows({renderer,scene,world,sun,camera});
 if(world.atmosphere){
  // A neutral warm key keeps cream architecture beige under the blue sky.
  renderer.toneMappingExposure=.96;sun.color.set(0xfff1d9);sun.intensity=2.1;
  fill.color.set(0xd2def2);fill.intensity=.18;
  scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0xfff5e9);o.groundColor.set(0x747e91);o.intensity=.7;}});
 }
 // Keep the original sky; atmospheric depth no longer obscures the far platform.
 if(scene.fog&&!world.brutal){scene.fog.near=65;scene.fog.far=160;}
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 attachPresentationDepth(composer);
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.18,.35,1.15);composer.addPass(bloom);
 const outline=createInkOutline(scene,camera,world),chaserView=createChaserViewPass(scene,camera,world);composer.addPass(outline.pass);composer.addPass(new OutputPass());composer.addPass(chaserView);
 let quality='balanced',width=innerWidth,height=innerHeight;
 const resize=(w,h)=>{width=w;height=h;applyComposerBudget(composer,renderer,quality);outline.pass.maxResolution=Math.max(w,h)*RENDER_QUALITY[quality].outlineRatio;composer.setSize(w,h);};resize(width,height);
 return {count,outline,staticShadows,setQuality:value=>{quality=normalizeRenderQuality(value);bloom.enabled=RENDER_QUALITY[quality].bloom;resize(width,height);},setChaser:(enabled,targets=[],excluded=[])=>{chaserView.enabled=!!enabled;chaserView.targets=targets;chaserView.excluded=excluded;},render:()=>{staticShadows.prepare();composer.render();},resize};
}
