import {BufferAttribute,Group,Matrix4,LoadingManager} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {configureReconstructionShadows} from './native-map-reconstruction-lighting.js';
import {shareReconstructionTextureSources} from './native-map-reconstruction-textures.js';
import {applyReconstructionOpticalContracts} from './native-map-reconstruction-optics.js';
import {installAzitArtistEffects} from './azit-artist-effects.js';
import {configureNativePracticalLights} from './azit-practical-lights.js';
import {createBioLabArtistAtmosphere} from './bio-lab-artist-atmosphere.js';

// Art-only replacement. Native source buffers, collision streams, helpers and
// object state remain owned by the original world. Source triangle ordinals
// are used before masking; the filtered render indices are never an authority.
export function compileReconstructionPlan(world,manifest){
 const legacy=world?.nativeMapId===15&&manifest?.schema==='azit-blender-reconstruction-runtime-v1'&&manifest.nativeMapId===15;
 const bio=world?.nativeMapId===19&&world.sourceData?.key==='MAPNAME_BIO_LAB'&&manifest?.schema==='s5runtime-blender-reconstruction-runtime-v1'&&manifest.nativeMapId===19&&manifest.mapKey==='bio-lab'&&manifest.key===world.sourceData.key&&/^[a-f0-9]{64}$/.test(world.sourceAuthoritySha256??'')&&manifest.sourceSha256===world.sourceAuthoritySha256;
 if((!legacy&&!bio)||!Array.isArray(manifest.assets)||!manifest.assets.length)throw Error('Explicit Azit or source-authenticated Bio Lab reconstruction manifest required');
 const assetRoot=bio?'/assets/maps/bio-lab/reconstruction/':'/assets/maps/azit/reconstruction/';
 const models=new Map(),modules=new Map(),assets=[];
 const protectedRefs=new Set([...world.sourceContract.movementCandidates,...world.sourceContract.weaponCandidates].map(r=>`${r.sceneIndex}:${r.modelIndex}`));
 for(const asset of manifest.assets){
  if(typeof asset.url!=='string'||!asset.url.startsWith(assetRoot)||!/^[a-z0-9-]+\.glb$/.test(asset.url.slice(assetRoot.length))||!Array.isArray(asset.replacements)||!asset.replacements.length)throw Error('Invalid reconstructed asset');
  const own=[];
  for(const row of asset.replacements){
   const {sourceSceneIndex:si,sourceModelIndex:mi,moduleId,faceRanges}=row,ref=`${si}:${mi}`,model=world.sourceData.scenes[si]?.models[mi];
   if(!Number.isInteger(si)||!Number.isInteger(mi)||!model||protectedRefs.has(ref)||/^oct_|occlusion|sector/i.test(model.name)||!world.sourceContract.scenes.some(s=>s.sceneIndex===si&&s.render))throw Error('Cannot replace a source gameplay/hidden model');
   if(typeof moduleId!=='string'||!moduleId||modules.has(moduleId)||!Array.isArray(faceRanges)||!faceRanges.length)throw Error('Unique replacement module and exact face ranges required');
   const mesh=world.sourceMeshes.find(m=>m.userData.sourceSceneIndex===si&&m.userData.sourceModelIndex===mi);if(!mesh?.visible)throw Error('Visible source replacement missing');
   let entry=models.get(ref);if(!entry){entry={ref,mesh,faces:new Set(),sourceTriangles:model.indices.length/3};models.set(ref,entry);}
   let faces=0;
   for(const range of faceRanges){
    if(!Array.isArray(range)||range.length!==2)throw Error('Exact source face interval required');
    const [start,count]=range;if(!Number.isInteger(start)||!Number.isInteger(count)||start<0||count<=0||start+count>entry.sourceTriangles)throw Error('Source face interval out of bounds');
    for(let i=start;i<start+count;i++){if(entry.faces.has(i))throw Error('Overlapping source replacement');entry.faces.add(i);faces++;}
   }
   const record={...row,ref,mesh,sourceFaces:faces};modules.set(moduleId,record);own.push(record);
  }assets.push({...asset,modules:own});
 }
 return {assets,models,modules,replacedFaces:[...models.values()].reduce((n,m)=>n+m.faces.size,0)};
}

export function maskSourceRenderFaces(original,faces){
 if(!original?.index||original.index.count%3)throw Error('Indexed native render source required');
 const geometry=original.clone(),indices=[],groups=[];
 for(const group of original.groups){
  const start=indices.length;
  for(let i=group.start;i<group.start+group.count;i+=3)if(!faces.has(i/3))indices.push(original.index.getX(i),original.index.getX(i+1),original.index.getX(i+2));
  if(indices.length>start)groups.push({start,count:indices.length-start,materialIndex:group.materialIndex});
 }
 geometry.setIndex(new BufferAttribute(new Uint32Array(indices),1));geometry.clearGroups();for(const g of groups)geometry.addGroup(g.start,g.count,g.materialIndex);
 return geometry;
}

const moduleKey=node=>node.userData.moduleId??node.userData.s5ModuleId;
function ownedResources(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
 return {geometries,materials,textures};
}

async function loadReconstructionAsset(url){
 // GLTFLoader's host-relative URI resolution requires an absolute base path.
 // Otherwise /assets/... PNGs are prefixed by the relative GLB directory.
 const absolute=globalThis.location?.href?new URL(url,globalThis.location.href).href:url,manager=new LoadingManager(),loadErrors=[];
 manager.onError=failed=>loadErrors.push(failed);
 const gltf=await new GLTFLoader(manager).loadAsync(absolute);
 return{...gltf,loadErrors};
}
export async function installNativeReconstruction(world,manifest,{loadAsset=loadReconstructionAsset}={}){
 if(world.reconstructionArt)throw Error('Reconstructed art is already installed on this world');
 const plan=compileReconstructionPlan(world,manifest),root=new Group(),loaded=[],masked=[],dynamic=[],resources={geometries:new Set(),materials:new Set(),textures:new Set()};
 root.name=(world.nativeMapId===15?'Azit':'Bio Lab')+' / Blender reconstructed art';let disposed=false,installed=false;
 const priorUpdate=world.update,priorRender=world.renderMapObjects;let lighting=null,textureSharing=null,optics=null,effects=null,practicalLights=null;
 function release(){
  if(disposed)return;disposed=true;
  practicalLights?.dispose();effects?.dispose();lighting?.dispose();for(const entry of dynamic)entry.node.removeFromParent();root.removeFromParent();
  for(const entry of masked){if(entry.mesh.geometry===entry.masked)entry.mesh.geometry=entry.original;entry.masked.dispose();}
  for(const set of Object.values(resources))for(const object of set)object.dispose();
  if(world.update===update)world.update=priorUpdate;
  if(world.renderMapObjects===render){if(priorRender)world.renderMapObjects=priorRender;else delete world.renderMapObjects;}
  if(world.reconstructionArt===api)delete world.reconstructionArt;
 }
 function update(...args){
  priorUpdate?.apply(world,args);
  effects?.update(args[0]??0);
  practicalLights?.update(args[0]??0);
  for(const entry of dynamic){
   const current=Array.isArray(entry.owner.material)?entry.owner.material:[entry.owner.material];
   const baseline=Array.isArray(entry.binding.originalMaterial)?entry.binding.originalMaterial:[entry.binding.originalMaterial];
   const opacity=Math.max(0,Math.min(1,...current.map((m,i)=>m.opacity/(baseline[i]?.opacity||1))));
   for(const [material,original]of entry.materials){
    const transparent=original.transparent||opacity<1;
    // The glTF opaque shader can force alpha=1. Recompile at fade boundaries;
    // intermediate opacity remains a cheap uniform update.
    if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}
    material.opacity=original.opacity*opacity;material.depthWrite=original.depthWrite&&opacity===1;
   }
  }
 }
 function render(camera){priorRender?.call(world,camera);effects?.render(camera);practicalLights?.render(camera);}
 const api={root,manifest,dispose:release,clearPresentation:()=>{effects?.clear();practicalLights?.clear();},snapshot:()=>({installed,disposed,assets:loaded.length,modules:plan.modules.size,replacedSourceFaces:plan.replacedFaces,sourceModels:masked.length,dynamicOwners:dynamic.length,shadows:lighting?.snapshot()??{enabled:false},textureSharing,optics,effects:effects?.snapshot()??{enabled:false},practicalLights:practicalLights?.snapshot()??{enabled:false},sourceBuffersChanged:false,gameplayChanged:false,gameplayReady:false})};
 try{
  // Keep all successful loads reachable for deterministic cleanup after a
  // partial failure. Never mask any source until every asset has loaded.
  const results=await Promise.allSettled(plan.assets.map(async asset=>{const gltf=await loadAsset(asset.url),entry={asset,scene:gltf.scene,parser:gltf.parser};loaded.push(entry);const own=ownedResources(entry.scene);for(const key of Object.keys(resources))for(const value of own[key])resources[key].add(value);if(gltf.loadErrors?.length)throw Error('Reconstructed texture failed to load: '+gltf.loadErrors.join(', '));return entry;}));
  const fail=results.find(r=>r.status==='rejected');if(fail)throw fail.reason;
  optics=applyReconstructionOpticalContracts(world,loaded,manifest);
  textureSharing=shareReconstructionTextureSources(loaded,{mapKey:world.nativeMapId===19?'bio-lab':'azit'});
  const matched=new Map();
  for(const {asset,scene}of loaded){
   const allowed=new Set(asset.modules.map(m=>m.moduleId));
   scene.traverse(node=>{
    const id=moduleKey(node);if(id&&allowed.has(id)){if(!matched.has(id))matched.set(id,[]);matched.get(id).push(node);}
    if(!node.isMesh)return;
    let parent=node,owner=null;while(parent){if(allowed.has(moduleKey(parent))){owner=moduleKey(parent);break;}parent=parent.parent;}
    if(!owner)throw Error('Unmapped reconstructed visual mesh: '+node.name);
   });root.add(scene);
  }
  for(const id of plan.modules.keys())if(!matched.has(id))throw Error('Reconstructed module not present in GLB: '+id);
  world.root.add(root);world.root.updateMatrixWorld(true);
  for(const [id,record]of plan.modules){
   const binding=[...world.mapObjects?.instances?.values()??[]].find(b=>b.mesh===record.mesh);if(!binding)continue;
   const nodes=matched.get(id),candidates=nodes.filter(n=>{for(let p=n.parent;p;p=p.parent)if(nodes.includes(p))return false;return true;});
   for(const node of candidates){
    const relative=new Matrix4().copy(record.mesh.matrixWorld).invert().multiply(node.matrixWorld),copies=new Map(),materials=[];
    node.removeFromParent();record.mesh.add(node);node.matrixAutoUpdate=false;node.matrix.copy(relative);
    dynamic.push({node,owner:record.mesh,binding,materials});
    node.traverse(o=>{if(!o.isMesh)return;const clone=m=>{if(!copies.has(m)){const c=m.clone();copies.set(m,c);resources.materials.add(c);materials.push([c,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}]);}return copies.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
   }
  }
  for(const row of plan.models.values()){const original=row.mesh.geometry,geometry=maskSourceRenderFaces(original,row.faces);masked.push({mesh:row.mesh,original,masked:geometry});row.mesh.geometry=geometry;}
  const rebuiltMeshes=[];for(const entry of loaded)entry.scene.traverse(o=>{if(o.isMesh)rebuiltMeshes.push(o);});for(const entry of dynamic)entry.node.traverse(o=>{if(o.isMesh)rebuiltMeshes.push(o);});
  lighting=configureReconstructionShadows(world,rebuiltMeshes,world.artistConfig?.reconstruction?.shadows);
  effects=world.nativeMapId===19?createBioLabArtistAtmosphere(world,rebuiltMeshes,world.artistConfig?.reconstruction?.atmosphere):await installAzitArtistEffects(world,world.artistConfig?.reconstruction?.effects);
  practicalLights=configureNativePracticalLights(world,world.artistConfig?.reconstruction?.practicalLights);
  world.update=update;world.renderMapObjects=render;world.reconstructionArt=api;installed=true;update(0);return api;
 }catch(error){release();throw error;}
}
