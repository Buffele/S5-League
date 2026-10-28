import {fitDirectionalShadow,applyDirectionalShadowFit} from './alice-house-shadow.js';

function visible(mesh){for(let node=mesh;node;node=node.parent)if(!node.visible)return false;return true;}

// S5 depth-map policy, not a native renderer/blending reconstruction. Keep all
// SCN materials/lightmaps and shadow-surface geometry. In particular bit8192
// alone does not distinguish a decal from unique visible opaque scenery.
export function conquestMapShadowPolicy(mesh,source){
 const model=source?.models?.[mesh?.userData?.sourceModelIndex];
 if(!model||mesh.userData.source!==source.source)throw Error('Conquest shadow source identity mismatch');
 if(!mesh.isMesh||!mesh.geometry?.attributes.position||!visible(mesh))return {castShadow:false,receiveShadow:false,reason:'hidden-or-empty'};
 if(source.source.includes('sky_'))return {castShadow:false,receiveShadow:false,reason:'sky'};
 if(mesh.userData.collision||/^oct_|occlusion|sector/i.test(model.name))return {castShadow:false,receiveShadow:false,reason:'collision-or-helper'};
 const state=model.renderState||0;
 if(state& (2|32|64))return {castShadow:false,receiveShadow:false,reason:'transparent-or-light-overlay'};
 return {castShadow:true,receiveShadow:true,reason:state&4?'source-alpha-cutout':'opaque-source'};
}

export function createConquestMapShadows({assets,sources}){
 if(!Array.isArray(assets)||assets.length!==sources?.length)throw Error('Conquest shadow assets/source pairing required');
 const entries=assets.flatMap((asset,i)=>asset.meshes.map(mesh=>({mesh,source:sources[i]})));
 const policies=entries.map(({mesh,source})=>({mesh,source,policy:conquestMapShadowPolicy(mesh,source)}));
 for(const {mesh,policy} of policies){mesh.castShadow=policy.castShadow;mesh.receiveShadow=policy.receiveShadow;}
 const fitMeshes=policies.filter(p=>p.policy.castShadow||p.policy.receiveShadow).map(p=>p.mesh);
 let receipt=null;
 return {
  applyPresentation({renderer,sun}={}){
   if(!renderer?.shadowMap)throw Error('Conquest shadows require the active renderer');
   // Preserve global quality selection. Fitting changes only map-owned framing;
   // applyShadowBudget continues to choose resolution and enable/disable shadows.
   // The full-map depth span is about232 world units, far beyond the arena's
   //90. Zero depth bias produces diagonal acne across the retained floor.
   // Explicit local raster calibration; keep source/material rules unchanged.
   // Three PCF adds bias to receiver depth. Ordinary depth therefore needs a
   // negative offset (reversed-depth comparison needs the opposite sign).
   const bias=renderer.capabilities?.reversedDepthBuffer===true?.0004:-.0004;
   const fit=fitDirectionalShadow(fitMeshes,sun,{padding:3,depthPadding:6,mapSize:sun.shadow.mapSize.x,bias,normalBias:.06});
   applyDirectionalShadowFit(sun,fit);renderer.shadowMap.needsUpdate=true;
   receipt={schema:'conquest-map-shadows-v1',nativeRenderingQualified:false,fit,
    models:policies.map(({mesh,source,policy})=>({source:source.source,sourceModelIndex:mesh.userData.sourceModelIndex,name:mesh.name,...policy})),
    materialRulesChanged:false,sourceGeometryChanged:false};
   return receipt;
  },
  snapshot(){return receipt;},
 };
}
