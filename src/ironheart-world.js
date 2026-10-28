import * as THREE from 'three';
import {DDSLoader} from 'three/addons/loaders/DDSLoader.js';
import {readAsset} from './scene-assets.js';
import {createNativeSourceMapWorld} from './native-source-map-world.js';
import {verticalFloor,previewClearance} from './native-map-source-geometry.js';
import {COLLISION_SETTINGS} from './collision.js';
import {createMapWeaponQuery} from './map-weapon-query.js';
import {bindIronHeartBillboards} from './ironheart-billboards.js';

export const IRONHEART_MAP='ironheart';
const ASSET_ROOT='/assets/maps/ironheart/';
const FORGE_PREVIEW_FILES=Object.freeze({
 'ironheart_ground01_mj.tga':'ironheart_ground01_mj.png',
 'ironheart_ground02_mj.tga':'ironheart_ground02_mj.png',
 'ironheart_ground04_jg.tga':'ironheart_ground04_jg.png',
 'ironheart_ground11_jg.tga':'ironheart_ground11_jg.png',
 'ironheart_ground13_wy.tga':'ironheart_ground13_wy.png',
});

// Original scenes, DDS and separately classified collision geometry. Source
// animation scheduling, native shader parity and full Siege rules stay open.
export async function loadIronHeartWorld(scene,{readJSON=readAsset,loadTexture=file=>new DDSLoader().loadAsync(ASSET_ROOT+file),forgePreview=new URLSearchParams(globalThis.location?.search||'').get('ironheartArt')==='forge',loadForgeTexture=file=>new THREE.TextureLoader().loadAsync(ASSET_ROOT+'forge-preview/'+file)}={}){
 if(!scene?.isObject3D)throw Error('Actual Iron Heart scene required');
 const manifest=await readJSON(ASSET_ROOT+'manifest.json');
 if(manifest.schema!=='ironheart-source-runtime-v1'||manifest.nativeMapId!==151||manifest.key!==IRONHEART_MAP||manifest.scene!=='scene.json'||manifest.contract!=='runtime-contract.json')throw Error('Iron Heart resource identity differs');
 const [bundle,contract]=await Promise.all([readJSON(ASSET_ROOT+manifest.scene),readJSON(ASSET_ROOT+manifest.contract)]);
 if(bundle.schema!=='ironheart-source-scenes-v1'||bundle.key!==IRONHEART_MAP||contract.nativeMapId!==151||contract.key!==IRONHEART_MAP||bundle.siegePoints?.length!==3||!contract.nativeLayoutProof?.threePointsObserved)throw Error('Source scenes and observed native objectives required');
 const slots=new Map(),textures=new Map(),samplers=new Map(),materials=new Map(),forgeTextures=new Map();let world=null,billboards=null,disposed=false,savedPresentation=null;
 for(const binding of manifest.bindings){
  if(!/^textures\/[^/]+\.dds$/.test(binding.file))throw Error('Unexpected Iron Heart texture path');
  const key=[binding.sceneIndex,binding.modelIndex,binding.slotIndex,binding.field].join(':');
  if(slots.has(key))throw Error('Duplicate Iron Heart material binding');slots.set(key,binding);
 }
 function restore(){if(!savedPresentation)return;const {scene:target,background,fog}=savedPresentation;target.background=background;target.fog=fog;savedPresentation=null;}
 function dispose(){if(disposed)return;disposed=true;restore();billboards?.dispose();world?.disposeSourceGeometry?.();for(const material of materials.values())material.dispose();for(const sampler of samplers.values())sampler.dispose();for(const texture of textures.values())texture.dispose();for(const texture of forgeTextures.values())texture.dispose();}
 try{
  const results=await Promise.allSettled([...new Set(manifest.bindings.map(b=>b.file))].map(async file=>{const texture=await loadTexture(file);if(!texture?.isTexture)throw Error('Actual source DDS texture required');textures.set(file,texture);}));
  const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  if(forgePreview){
   const results=await Promise.allSettled(Object.entries(FORGE_PREVIEW_FILES).map(async ([literal,file])=>{
    const texture=await loadForgeTexture(file);if(!texture?.isTexture)throw Error('Iron Heart forge preview texture required');
    texture.flipY=false;texture.channel=0;texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;forgeTextures.set(literal,texture);
   }));
   const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  }
  function sampler(sceneIndex,modelIndex,slotIndex,field,literal){
   if(!literal)return null;
   const binding=slots.get([sceneIndex,modelIndex,slotIndex,field].join(':'));
   if(binding?.literal!==literal||!textures.has(binding.file))throw Error('Iron Heart source texture binding differs');
   const key=binding.file+':'+field;if(!samplers.has(key)){
    const texture=textures.get(binding.file).clone();texture.flipY=false;texture.channel=field==='lightmap'?1:0;
    texture.colorSpace=field==='lightmap'?THREE.NoColorSpace:THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;samplers.set(key,texture);
   }return samplers.get(key);
  }
  function materialsForModel(model,modelIndex,sceneIndex){
   const sky=sceneIndex===0,state=model.renderState??0;
   return (model.textures.length?model.textures:[null]).map((slot,slotIndex)=>{
    const nativeMap=sampler(sceneIndex,modelIndex,slotIndex,'source',slot?.source),lightMap=sampler(sceneIndex,modelIndex,slotIndex,'lightmap',slot?.lightmap);
    // These five atlases occur only on opaque source models. Keep the source
    // DDS and all native lightmaps; never substitute alpha-tested surfaces.
    const map=sceneIndex===4&&!(state&38)?forgeTextures.get(slot?.source?.toLowerCase())||nativeMap:nativeMap,key=[state,map?.uuid,lightMap?.uuid,sky].join(':');
    if(!materials.has(key)){
     const transparent=!!(state&34),options={map,lightMap,color:0xffffff,side:sky||state&8?THREE.DoubleSide:THREE.FrontSide,transparent,alphaTest:state&4?.5:transparent?.015:0,
      depthWrite:!sky&&!(state&64),depthTest:!sky,fog:!sky&&!(state&512),blending:state&32?THREE.AdditiveBlending:THREE.NormalBlending};
     if(state&8192)Object.assign(options,{polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
     const material=sky||state&1?new THREE.MeshBasicMaterial(options):new THREE.MeshLambertMaterial(options);
     material.name='Iron Heart source / '+key;material.userData.nativeRenderState=state;materials.set(key,material);
    }return materials.get(key);
   });
  }
  world=createNativeSourceMapWorld(bundle,contract,{materialsForModel});world.disposeSourceGeometry=world.dispose;
  world.forgePreview=!!forgePreview;
  billboards=bindIronHeartBillboards(world);world.billboardCount=billboards.count;world.renderMapObjects=camera=>billboards.update(camera);
  for(const mesh of world.sourceMeshes)if(mesh.userData.sourceSceneIndex===0){mesh.renderOrder=-1000;mesh.frustumCulled=false;}
  world.siegePoints=bundle.siegePoints.map(point=>({...point,id:String(point.id),nativePointId:point.id,
   core:{center:[...point.core.center],halfExtents:[...point.core.halfExtents],axes:point.core.axes.map(a=>[...a])},
   assist:{center:[...point.assist.center],halfExtents:[...point.assist.halfExtents],axes:point.assist.axes.map(a=>[...a])}})).sort((a,b)=>a.nativePointId-b.nativePointId);
  // BGINFO SEIZE_01/02/03 declare seize_slot3/1/2. The shared HUD displays
  // ordinals, so feed it slot order rather than the native manager's3/1/2 order.
  world.mapWeaponQuery=createMapWeaponQuery({staticRecords:world.weaponTriangleRecords});
  const teamSpawns={};
  for(const team of ['alpha','beta'])teamSpawns[team]=['02','03','04','07'].map(suffix=>{
   const marker=world.markers.find(m=>m.sourceSceneIndex===1&&m.name===team+'_spawn_pos_'+suffix);if(!marker)throw Error('Iron Heart source team spawn missing');
   const source=marker.object.getWorldPosition(new THREE.Vector3()),floor=verticalFloor(source,world.queryTriangleRecords);if(!floor)throw Error('Iron Heart source team spawn has no floor');
   const position={...floor.point,y:floor.point.y+COLLISION_SETTINGS.snapBase};if(!previewClearance(position,world.queryTriangleRecords).passed)throw Error('Iron Heart team spawn has insufficient actor clearance');
   const direction=new THREE.Vector3().setFromMatrixColumn(marker.object.matrixWorld,2);if(direction.x*direction.x+direction.z*direction.z<1e-12)throw Error('Iron Heart source spawn heading missing');
   return {position,facing:Math.atan2(direction.x,direction.z),marker:marker.name,nativeSelectionVerified:false};
  });
  world.spawnForTeam=(team,ordinal=0)=>{const entry=teamSpawns[team]?.[ordinal];if(!Number.isInteger(ordinal)||!entry)throw Error('Explicit Iron Heart team/spawn slot required');return {...entry,position:{...entry.position}};};
  world.cameraFar=Math.max(world.cameraFar,900);
  world.applyPresentation=({scene:target=scene}={})=>{
   restore();savedPresentation={scene:target,background:target.background,fog:target.fog};
   const r=bundle.rendererSource,color=new THREE.Color(Number(r.FogColorR),Number(r.FogColorG),Number(r.FogColorB)),near=Number(r.FogMinDist)*.006,far=Number(r.FogMaxDist)*.006;
   if(![color.r,color.g,color.b,near,far].every(Number.isFinite)||near<0||far<=near)throw Error('Source Iron Heart fog parameters invalid');
   target.background=color;target.fog=new THREE.Fog(color,near,far);
  };
  world.restorePresentation=restore;world.dispose=dispose;
  world.qualification={...world.qualification,nativePointObbLayoutObserved:true,nativeSpawnSelectionCertified:false,nativeRendererParityCertified:false,nativeSourceScenePlaybackCertified:false,sourceBillboardFlagsApplied:true,nativeBillboardMathCompared:false};
  scene.add(world.root);world.root.updateMatrixWorld(true);return world;
 }catch(error){dispose();throw error;}
}

// A cached world must be reconfigured when the selected team changes. Source
// Box-Z facing and floor projection remain an explicit S5 spawn policy.
export function applyIronHeartTeamSpawn(world,mode,team='alpha'){
 if(world?.nativeMapId!==151||typeof world.spawnForTeam!=='function')return false;
 const placement=world.spawnForTeam(mode==='siege'?team:'alpha',0);
 world.spawn={...placement.position};world.previewFacing=placement.facing;return true;
}
