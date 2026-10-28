import {Group,Matrix4,LoadingManager} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Explicit opt-in visual preview only. Source meshes, faces, collision buffers,
// and mode state remain untouched; the module is never installed by itself.
const SOURCE_SHA='74c3e4875f32df813dcdb799aa8a8c1a10d210c5b6a0fbcf9c66a885f2da09cc';
const MODULE_URL='/assets/maps/bio-lab/reconstruction/bio-lab-additive-modules.glb';
const COUNTS=new Map([[0,20],[1,7]]);
async function defaultLoad(url){
 const manager=new LoadingManager(),errors=[];manager.onError=url=>errors.push(url);
 const absolute=globalThis.location?.href?new URL(url,globalThis.location.href).href:url;
 const gltf=await new GLTFLoader(manager).loadAsync(absolute);
 if(errors.length)throw Error('Bio Lab module asset load failure: '+errors.join(', '));
 return gltf;
}
function collectResources(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(node=>{if(!node.isMesh)return;geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material]){if(!material)continue;materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
 return {geometries,materials,textures};
}
export async function installBioLabAdditivePreview(world,{loadAsset=defaultLoad}={}){
 if(world?.nativeMapId!==19||world.sourceData?.key!=='MAPNAME_BIO_LAB'||world.sourceAuthoritySha256!==SOURCE_SHA||!world.root?.isObject3D||!Array.isArray(world.sourceMeshes))throw Error('Bio Lab additive preview requires authenticated source world');
 if(world.bioLabAdditivePreview)throw Error('Bio Lab additive preview already installed');
 const owners=new Map();for(const model of COUNTS.keys()){
  const matches=world.sourceMeshes.filter(m=>m.userData?.sourceSceneIndex===1&&m.userData?.sourceModelIndex===model);
  if(matches.length!==1||!matches[0].isMesh)throw Error('Bio Lab additive owner missing or ambiguous: '+model);owners.set(model,matches[0]);
 }
 const gltf=await loadAsset(MODULE_URL);if(!gltf?.scene?.isObject3D)throw Error('Bio Lab additive GLB missing scene');
 const staging=new Group(),resources=collectResources(gltf.scene),installed=[];let disposed=false;
 function release(){
  if(disposed)return;disposed=true;for(const node of installed)node.removeFromParent();staging.removeFromParent();
  for(const set of Object.values(resources))for(const item of set)item.dispose();
  if(world.bioLabAdditivePreview===api)delete world.bioLabAdditivePreview;
 }
 const api={dispose:release,snapshot:()=>({installed:!disposed,modules:installed.length,owners:[...COUNTS.keys()],sourceBuffersChanged:false,gameplayChanged:false,qualification:'Experimental visual preview; native animation, clearance, effects and performance not certified.'})};
 try{
  const modules=new Map(),counts=new Map([[0,0],[1,0]]);gltf.scene.traverse(n=>{
   if(!n.isMesh)return;
   const id=n.userData?.s5ModuleId,si=n.userData?.anchorScene,mi=n.userData?.anchorModel;
   if(!/^bio_module_\d{3}$/.test(id??'')||modules.has(id)||si!==1||!COUNTS.has(mi))throw Error('Unexpected Bio Lab visual module');
   modules.set(id,n);counts.set(mi,counts.get(mi)+1);
  });
  if(modules.size!==27||[...COUNTS].some(([k,v])=>counts.get(k)!==v))throw Error('Bio Lab module set incomplete');
  for(let i=0;i<27;i++)if(!modules.has('bio_module_'+String(i).padStart(3,'0')))throw Error('Bio Lab module ID missing');
  staging.name='Bio Lab / additive 3D preview';staging.add(gltf.scene);world.root.add(staging);world.root.updateMatrixWorld(true);
  for(const node of modules.values()){
   const owner=owners.get(node.userData.anchorModel),relative=new Matrix4().copy(owner.matrixWorld).invert().multiply(node.matrixWorld);
   node.removeFromParent();owner.add(node);node.matrixAutoUpdate=false;node.matrix.copy(relative);installed.push(node);
  }
  staging.removeFromParent();world.root.updateMatrixWorld(true);world.bioLabAdditivePreview=api;return api;
 }catch(error){release();throw error;}
}
