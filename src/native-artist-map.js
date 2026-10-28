import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {createNativeSourceMapWorld} from './native-source-map-world.js';
import {createNativeMapPanorama} from './native-map-panorama.js';

export const NATIVE_ARTIST_MAPS=Object.freeze({'azit':{key:'MAPNAME_AZIT',nativeMapId:15},'bio-lab':{key:'MAPNAME_BIO_LAB',nativeMapId:19},'blade-city':{key:'MAPNAME_BLADE_CITY',nativeMapId:158}});
const color=value=>new THREE.Color().fromArray(value);
function lightsFor(root,config){
 const group=new THREE.Group();group.name='Blender artist lighting';root.add(group);
 if(config.ambient)group.add(new THREE.AmbientLight(color(config.ambient.color),config.ambient.intensity));
 if(config.hemisphere)group.add(new THREE.HemisphereLight(color(config.hemisphere.skyColor),color(config.hemisphere.groundColor),config.hemisphere.intensity));
 for(const entry of config.directional??[]){const light=new THREE.DirectionalLight(color(entry.color),entry.intensity);light.name=entry.name;light.position.fromArray(entry.position);light.target.position.fromArray(entry.target);group.add(light.target,light);}
 if(config.area?.length)RectAreaLightUniformsLib.init();
 for(const entry of config.area??[]){const light=new THREE.RectAreaLight(color(entry.color),entry.intensity,entry.width,entry.height);light.name=entry.name;light.position.fromArray(entry.position);light.lookAt(new THREE.Vector3().fromArray(entry.target));group.add(light);}
 return group;
}

/** Imported geometry plus its saved Blender appearance; free exploration only. */
export async function loadNativeArtistMap(scene,key,{reconstruction=true,bioAdditivePreview=false}={}){
 const identity=NATIVE_ARTIST_MAPS[key];if(!scene?.isObject3D||!identity)throw Error('Unknown native artist map');
 const assetRoot=`/assets/maps/${key}/`;
 async function read(file){if(!/^[a-z0-9-]+\.json$/.test(file))throw Error('Unexpected native artist data path');const response=await fetch(assetRoot+file);if(!response.ok)throw Error('Native artist map asset unavailable: '+file);return response.json();}
 const manifest=await read('geometry-manifest.json');
 if(manifest.schema!=='s5runtime-native-map-source-runtime-v1'||manifest.key!==identity.key||manifest.nativeMapId!==identity.nativeMapId)throw Error('Native artist map identity mismatch');
 const [bundle,contract,artist]=await Promise.all([read(manifest.scene),read(manifest.contract),read(manifest.artistConfig)]);
 if(artist.schema!=='s5runtime-artist-map-runtime-v1'||artist.key!==identity.key||contract.key!==identity.key||contract.nativeMapId!==identity.nativeMapId)throw Error('Native artist configuration mismatch');
 const entries=new Map(),textures=new Map(),materials=new Map(),slots=new Map();let world=null,presentation=null,disposed=false,mapObjectsAddon=null,mapJumpAddon=null,mapSessionAddon=null,mapReconstructionAddon=null,mapNativeEffectsAddon=null,mapMatchSpawnsAddon=null,bladeCityArtAddon=null,bioLabAdditiveAddon=null,panorama=null;
 function textureRef(url,role,flipY){
  if(!url)return null;if(!url.startsWith(assetRoot+'textures/')||!url.endsWith('.png')||url.includes('..'))throw Error('Unexpected native artist texture URL');
  const ref=[url,role,flipY].join('|');entries.set(ref,{url,role,flipY});return ref;
 }
 for(const entry of artist.materials){const ref=`${entry.sourceSceneIndex}:${entry.sourceModelIndex}:${entry.slot}`;if(slots.has(ref))throw Error('Duplicate native artist slot');slots.set(ref,{...entry,colorRef:textureRef(entry.colorTexture,'color',entry.textureFlipY!==false),alphaRef:textureRef(entry.alphaTexture,'alpha',entry.alphaTextureFlipY!==false)});}
 const backgroundRef=textureRef(artist.background?.url,'background',true);
 const towerConfig=artist.background?.towerIllusion;
 const {textureUrl:towerTextureUrl,...towerOptions}=towerConfig??{};
 if(towerConfig?.enabled===true&&(key!=='azit'||artist.background.directResolution!==true))throw Error('Tower illusion requires the explicit Azit direct panorama');
 const towerRef=towerConfig?.enabled===true?textureRef(towerTextureUrl,'tower-illusion',true):null;
 function restore(){
  mapReconstructionAddon?.clearPresentation?.();mapObjectsAddon?.clearPresentation?.();
  mapNativeEffectsAddon?.clear('presentation-cleared');
  mapMatchSpawnsAddon?.clear('presentation-cleared');
  if(panorama)panorama.mesh.visible=false;
  if(!presentation)return;const saved=presentation;presentation=null;
  for(const [light,intensity] of saved.lights)light.intensity=intensity;
  saved.renderer.toneMapping=saved.toneMapping;saved.renderer.toneMappingExposure=saved.exposure;
  for(const field of ['background','environment','fog','backgroundIntensity','environmentIntensity'])saved.scene[field]=saved[field];
  saved.scene.backgroundRotation.copy(saved.backgroundRotation);saved.scene.environmentRotation.copy(saved.environmentRotation);
 }
 function dispose(){if(disposed)return;disposed=true;restore();panorama?.dispose();bioLabAdditiveAddon?.dispose();bladeCityArtAddon?.dispose();mapReconstructionAddon?.dispose();mapNativeEffectsAddon?.dispose();mapMatchSpawnsAddon?.dispose();mapSessionAddon?.dispose();mapJumpAddon?.dispose();mapObjectsAddon?.dispose();world?.disposeSourceGeometry();for(const material of materials.values())material.dispose();for(const texture of textures.values())texture.dispose();}
 try{
  const loader=new THREE.TextureLoader(),results=await Promise.allSettled([...entries].map(async([ref,entry])=>{
   const texture=await loader.loadAsync(entry.url);textures.set(ref,texture);texture.flipY=entry.flipY;texture.colorSpace=entry.role==='alpha'?THREE.NoColorSpace:THREE.SRGBColorSpace;
   if(entry.role==='background')texture.mapping=THREE.EquirectangularReflectionMapping;else texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  }));const failed=results.find(result=>result.status==='rejected');if(failed)throw failed.reason;
  function materialsForModel(model,index,sceneIndex){return model.textures.map((native,slot)=>{
   const entry=slots.get(`${sceneIndex}:${index}:${slot}`);if(!entry||entry.renderState!==model.renderState||!entry.colorRef)throw Error('Native artist slot missing or source mismatch');
   const signature=JSON.stringify([entry.signature,entry.renderState,entry.colorRef,entry.alphaRef,entry.roughness,entry.metallic,entry.opacity,entry.side,entry.transparent,entry.alphaTest,entry.depthWrite,entry.emissiveColor,entry.emissiveIntensity,entry.emissiveUsesColorTile,entry.flatShading===true]);
   if(materials.has(signature))return materials.get(signature);
   const nativeOptics=key==='bio-lab'&&artist.reconstruction?.preserveNativeOptics===true&&model.renderState!==0,state=model.renderState;
   const options={map:textures.get(entry.colorRef),alphaMap:entry.alphaRef?textures.get(entry.alphaRef):null,
    opacity:entry.opacity??1,transparent:entry.transparent===true,alphaTest:entry.alphaTest??0,depthWrite:entry.depthWrite!==false,side:entry.side==='double'?THREE.DoubleSide:THREE.FrontSide};
   const material=nativeOptics&&(state&1)?new THREE.MeshBasicMaterial(options):new THREE.MeshStandardMaterial({...options,roughness:entry.roughness,metalness:entry.metallic,flatShading:entry.flatShading===true,
    emissive:color(entry.emissiveColor??[0,0,0]),emissiveIntensity:entry.emissiveIntensity??0,emissiveMap:entry.emissiveUsesColorTile?textures.get(entry.colorRef):null});
   if(nativeOptics){material.transparent=options.transparent||!!(state&34);material.blending=state&32?THREE.AdditiveBlending:THREE.NormalBlending;material.depthWrite=!(state&64);material.depthTest=!(state&128);material.fog=!(state&512);if(state&1)material.toneMapped=false;}
   material.name=entry.materialName??'Native Blender appearance';material.userData={sourceSceneIndex:sceneIndex,sourceModelIndex:index,sourceSlot:slot,artistSignature:entry.signature,...(nativeOptics?{sourceOpticalState:state,sourceOpticalUnmappedBits:state&~(1|2|32|64|128|512)}:{}),qualification:'Saved Blender appearance adapted to Three; physical renderer calibration is approximate.'};materials.set(signature,material);return material;
  });}
  world=createNativeSourceMapWorld(bundle,contract,{materialsForModel});world.disposeSourceGeometry=world.dispose;world.artistConfig=artist;
  const sourceAuthority=manifest.authorities?.find(a=>a.kind==='bundle');
  world.sourceAuthoritySha256=sourceAuthority?.sourceSha256??sourceAuthority?.sha256;
  world.localLights=lightsFor(world.root,artist.lighting??{});
  for(const ref of artist.hiddenSourceModelRefs??[]){const mesh=world.sourceMeshes.find(mesh=>mesh.userData.sourceSceneIndex===ref.sourceSceneIndex&&mesh.userData.sourceModelIndex===ref.sourceModelIndex);if(mesh)mesh.visible=false;}
  if(key==='blade-city' && artist.visualModules?.enabled===true){
   const {installBladeCityArtModules}=await import('./blade-city-art-modules.js');
   bladeCityArtAddon=await installBladeCityArtModules(world,artist.visualModules);world.bladeCityArtModules=bladeCityArtAddon;
  }
  if(key==='azit'){
   const data=await read('destructibles.json');
   const {installAzitDestructibles}=await import('./azit-destructibles.js');
   mapObjectsAddon=installAzitDestructibles(world,data);
  }
  if(key==='bio-lab'&&artist.mapObjects?.enabled===true){
   const data=await read(artist.mapObjects.contract);
   const {installBioLabMapObjects}=await import('./bio-lab-map-objects.js');
   mapObjectsAddon=installBioLabMapObjects(world,data);
  }
  if(key==='bio-lab'&&artist.matchSpawns?.enabled===true){
   const data=await read(artist.matchSpawns.contract),{installBioLabMatchSpawns}=await import('./bio-lab-match-spawns.js');
   mapMatchSpawnsAddon=installBioLabMatchSpawns(world,data);
  }
  if(key==='bio-lab'&&artist.nativeEffects?.enabled===true){
   if(!mapObjectsAddon)throw Error('Bio Lab native effects require their map-object owner');
   const data=await read(artist.nativeEffects.contract),{loadBioLabNativeEffects}=await import('./bio-lab-native-effects.js'),{readRenderQuality}=await import('./render-quality.js');
   mapNativeEffectsAddon=await loadBioLabNativeEffects(world,data,{readQuality:readRenderQuality});world.bioLabNativeEffects=mapNativeEffectsAddon;
   const update=world.update,render=world.renderMapObjects,warm=world.warmMapObjects;
   world.update=function(...args){update?.apply(world,args);mapNativeEffectsAddon.update(args[0]??0);};
   world.renderMapObjects=function(camera){render?.call(world,camera);mapNativeEffectsAddon.render(camera);};
   world.warmMapObjects=async function(...args){await warm?.apply(world,args);await mapNativeEffectsAddon.warm(...args);};
  }
  if(backgroundRef&&artist.background.directResolution===true){
   panorama=createNativeMapPanorama(textures.get(backgroundRef),{rotationY:artist.background.rotationY??0,intensity:artist.background.displayIntensity??1,seamBlend:artist.background.seamBlend??0,
    towerIllusion:towerRef?{...towerOptions,texture:textures.get(towerRef)}:undefined});
   world.root.add(panorama.mesh);
  }
  world.applyPresentation=({renderer,scene:targetScene=scene,sun}={})=>{
   if(!renderer)throw Error('Native artist presentation requires renderer');restore();const lights=[];
   targetScene.traverse(light=>{if(!light.isHemisphereLight)return;for(let parent=light;parent;parent=parent.parent)if(parent===world.root)return;lights.push([light,light.intensity]);light.intensity=0;});
   if(sun?.isLight&&!lights.some(([light])=>light===sun)){lights.push([sun,sun.intensity]);sun.intensity=0;}
   presentation={renderer,scene:targetScene,lights,toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure,background:targetScene.background,environment:targetScene.environment,fog:targetScene.fog,
    backgroundIntensity:targetScene.backgroundIntensity,environmentIntensity:targetScene.environmentIntensity,backgroundRotation:targetScene.backgroundRotation.clone(),environmentRotation:targetScene.environmentRotation.clone()};
   if(artist.presentation?.toneMapping==='AgX')renderer.toneMapping=THREE.AgXToneMapping;
   if(Number.isFinite(artist.presentation?.exposure))renderer.toneMappingExposure=artist.presentation.exposure;targetScene.fog=null;
   if(backgroundRef){targetScene.background=panorama?null:textures.get(backgroundRef);targetScene.environment=textures.get(backgroundRef);if(panorama)panorama.mesh.visible=true;targetScene.backgroundIntensity=artist.background.displayIntensity??artist.background.intensity??1;targetScene.environmentIntensity=artist.background.environmentIntensity??artist.background.intensity??1;targetScene.backgroundRotation.set(0,artist.background.rotationY??0,0);targetScene.environmentRotation.copy(targetScene.backgroundRotation);}
   mapNativeEffectsAddon?.resume();
   return restore;
  };
  // Main restores the cached surface/light snapshot without rebuilding the
  // presentation. Its optional resume hook must also restore owned sky meshes.
  world.resumePresentation=()=>{if(disposed)throw Error('Native map disposed');if(panorama)panorama.mesh.visible=true;mapNativeEffectsAddon?.resume();};
  world.restorePresentation=restore;world.dispose=dispose;
  if(key==='azit'){
   const {installAzitJumpRuntime}=await import('./azit-jump-runtime.js');
   mapJumpAddon=installAzitJumpRuntime(world);
   const {installAzitSessionRuntime}=await import('./azit-session-runtime.js');
   mapSessionAddon=installAzitSessionRuntime(world);
  }
  if((key==='azit'||key==='bio-lab')&&reconstruction&&artist.reconstruction?.enabled===true){
    const manifest=await read(artist.reconstruction.manifest);
    const {installNativeReconstruction}=await import('./native-map-reconstruction.js');
    mapReconstructionAddon=await installNativeReconstruction(world,manifest);
  }
  // Explicit Bio Lab visual preview only; default sessions never load it.
  // Additive art does not register collisions or mask native render faces.
  const bioPreviewRequested=bioAdditivePreview===true||new URLSearchParams(globalThis.location?.search??'').get('bio3d')==='preview';
  if(key==='bio-lab'&&bioPreviewRequested){
   const {installBioLabAdditivePreview}=await import('./bio-lab-additive-modules.js');
   bioLabAdditiveAddon=await installBioLabAdditivePreview(world);
  }
  scene.add(world.root);world.root.updateMatrixWorld(true);return world;
 }catch(error){dispose();throw error;}
}
