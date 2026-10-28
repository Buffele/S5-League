import {AdditiveBlending,NormalBlending} from 'three';

const sourceSha='10145a6ec060f1a911a094ba754f1429ac3b98ea1711fa8f5c714d50836dd665';
const allowed=new Map([['indi_jumpbox.tga',608],['azit_etc.tga',33],['azit_s_atex.tga',513],['azit_spawn.tga',33]]);

// glTF has no SRC_ALPHA / ONE blend mode. Only the four source-qualified
// functional materials opt in; new Refuge solaire artwork keeps its own PBR.
// KHR_texture_transform already restores native direct-V sampling in the GLB.
export function applyReconstructionOpticalContracts(world,loaded,manifest){
 const qualified=new Map();
 for(const {scene}of loaded)scene.traverse(node=>{
  if(!node.isMesh)return;
  for(const material of Array.isArray(node.material)?node.material:[node.material]){
   const e=material.userData??{};
   if(e.nativeRenderState===undefined&&e.s5Blend===undefined)continue;
   const state=allowed.get(e.sourceTexture);
   if(manifest.sourceSha256!==sourceSha||e.nativeSourceSha256!==sourceSha||state===undefined||state!==e.nativeRenderState||!material.isMeshBasicMaterial||!material.map)throw Error('Unverified Azit optical material provenance');
   const additive=!!(state&32),depthWrite=!(state&64),fog=!(state&512);
   if(e.s5Blend!==(additive?'additive':'opaque')||e.s5DepthWrite!==depthWrite||e.s5Fog!==fog||e.artistOnly!==true||e.nativeVisualParity!==false)throw Error('Inconsistent Azit optical render state');
   let refs;try{refs=JSON.parse(e.sourceModelRefs);}catch{throw Error('Exact optical source model references required');}
   if(!Array.isArray(refs)||!refs.length||new Set(refs).size!==refs.length)throw Error('Exact optical source model references required');
   for(const ref of refs){
    const match=typeof ref==='string'&&ref.match(/^s(\d{2})_m(\d{3})$/),model=match&&world.sourceData?.scenes[Number(match[1])]?.models[Number(match[2])];
    if(!model||model.renderState!==state||model.textures?.[0]?.source!==e.sourceTexture)throw Error('Optical material differs from protected source');
   }
   for(let parent=node;parent;parent=parent.parent)if(parent.userData?.sourceModelId){if(!refs.includes(parent.userData.sourceModelId))throw Error('Optical material attached to an unqualified source owner');break;}
   qualified.set(material,{material,sourceTexture:e.sourceTexture,state,additive,depthWrite,fog});
  }
 });
 // Validate all contracts before changing any material. No map, sampler, UV,
 // geometry, source alpha or collision data is modified here.
 for(const {material,additive,depthWrite,fog}of qualified.values()){
  material.transparent=additive;material.blending=additive?AdditiveBlending:NormalBlending;
  material.depthWrite=depthWrite;material.fog=fog;material.alphaTest=0;material.opacity=1;material.toneMapped=false;material.needsUpdate=true;
 }
 return{materials:qualified.size,contracts:[...qualified.values()].map(({material,...row})=>({...row,name:material.name})),textureSamplingChanged:false,sourceBuffersChanged:false,nativeVisualParity:false};
}
