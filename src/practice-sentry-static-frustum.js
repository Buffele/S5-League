import * as THREE from 'three';
export const STATIC_FRUSTUM_POLICY='s5-diagnostic-static-part7-conservative-sphere-v1';
const sources=new Map([
 ['effects/skill_hacker_centrygun_part7.scn',"f931d8ed29779f530dd1631df9e96e7c8e22ac98392089ad558c6f2b82085506"],
 ['effects/skill_hacker_centrygun_part7a.scn',"bd042f52f0176f15be3378575e5ec2f411a276cfe264ea85d021a30658162711"]
]);
export function finiteAffineWorld(matrix){const e=matrix?.elements;return !!e&&e.length===16&&e.every(Number.isFinite)&&e[3]===0&&e[7]===0&&e[11]===0&&e[15]===1;}
export function qualifyStaticFrustumMesh({data,mesh,index}){
 const reject=reason=>({eligible:false,index,reason});const model=data?.models?.[index],track=model?.animations?.['1'],effect=track?.effect;
 if(!sources.has(data?.source)||model?.renderState!==617||model.weights?.length||!track||Object.keys(model.animations).length!==1)return reject('exact-static-part7-source-required');
 if(!Array.isArray(effect?.morphKeys)||effect.morphKeys.length!==0)return reject('position-morph-or-unknown-frame');
 if([track.positions,track.rotations,track.scales].some(k=>!Array.isArray(k)||k.length))return reject('static-source-mesh-required');
 if(model.vertices?.length!==12||model.indices?.length!==6||model.textures?.length!==1||model.textures[0].start!==0||model.textures[0].count!==2||model.vertices.some(v=>!Number.isFinite(v)||!Object.is(Math.fround(v),v))||model.indices.some(i=>!Number.isInteger(i)||i<0||i>=4))return reject('exact-finite-source-geometry-required');
 if(!mesh?.isMesh||mesh.constructor!==THREE.Mesh||mesh.userData.sourceModelIndex!==index||mesh.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||mesh.onAfterRender!==THREE.Object3D.prototype.onAfterRender)return reject('plain-source-mesh-required');
 if(mesh.intersectsFrustum!==THREE.Mesh.prototype.intersectsFrustum)return reject('custom-frustum-method-override');
 if('boundingSphere' in mesh)return reject('object-level-bounding-sphere-override');
 const materials=[].concat(mesh.material),material=materials[0];
 if(materials.length!==1||material?.constructor!==THREE.MeshBasicMaterial||material.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile||material.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey||material.onBeforeRender!==THREE.Material.prototype.onBeforeRender||material.displacementMap||material.envMap||material.wireframe)return reject('plain-basic-no-vertex-shader-hook-required');
 const geometry=mesh.geometry,position=geometry?.getAttribute('position'),indices=geometry?.index,groups=geometry?.groups;
 if(!position||position.itemSize!==3||position.count!==4||position.isInterleavedBufferAttribute||position.normalized||!indices||indices.count!==6||Object.values(geometry.morphAttributes).some(a=>a.length)||geometry.drawRange.start!==0||geometry.drawRange.count!==Infinity||!Array.isArray(groups)||groups.length!==1||groups[0].start!==0||groups[0].count!==6||groups[0].materialIndex!==0)return reject('exact-render-geometry-required');
 if(model.vertices.some((v,i)=>!Object.is(position.array[i],v))||model.indices.some((v,i)=>indices.array[i]!==v))return reject('render-source-position-mismatch');
 return {eligible:true,index,reason:'authenticated-static-position-geometry'};
}
export function createStaticFrustumDiagnostic({data,meshes,diagnostic=null}={}){
 let enabled=false,records=[],results=[];
 const qualifiedContext=()=>diagnostic?.policy===STATIC_FRUSTUM_POLICY&&typeof diagnostic.source==='string'&&diagnostic.source.trim()&&diagnostic.publishedJsonSha256===sources.get(data?.source)&&sources.has(data?.source);
 function report(){return {enabled,qualified:records.length,results:[...results],active:records.filter(r=>r.mesh.frustumCulled).length,worldRejected:records.filter(r=>enabled&&!r.mesh.frustumCulled).length,sphereRadiusMultiplier:2,nativeReady:false,visualCompared:false};}
 function refreshWorldGuard(){let worldRejected=0;if(enabled)for(const r of records){const finite=finiteAffineWorld(r.mesh.matrixWorld);r.mesh.frustumCulled=finite;if(!finite)worldRejected++;}return worldRejected;}
 function setStaticFrustum(next){
  if(typeof next!=='boolean')throw TypeError('Explicit static-frustum boolean required');
  if(!next){for(const r of records){r.mesh.frustumCulled=r.originalCulled;r.mesh.geometry.boundingSphere=r.originalSphere;}enabled=false;records=[];results=[];return report();}
  if(!qualifiedContext())throw Error('Verified source receipt and explicit static-frustum diagnostic policy required');
  if(enabled){refreshWorldGuard();return report();}
  results=meshes.map(mesh=>qualifyStaticFrustumMesh({data,mesh,index:mesh.userData.sourceModelIndex}));
  for(let i=0;i<meshes.length;i++)if(results[i].eligible){
   const mesh=meshes[i],geometry=mesh.geometry,originalSphere=geometry.boundingSphere,originalCulled=mesh.frustumCulled;
   let sphere;geometry.boundingSphere=null;
   try{geometry.computeBoundingSphere();sphere=geometry.boundingSphere?.clone();}finally{geometry.boundingSphere=originalSphere;}
   if(!sphere||!sphere.center.toArray().every(Number.isFinite)||!Number.isFinite(sphere.radius)||sphere.radius<=0||!Number.isFinite(sphere.radius*2)){results[i]={eligible:false,index:mesh.userData.sourceModelIndex,reason:'nonfinite-or-degenerate-sphere'};continue;}
   if(originalSphere!=null&&['x','y','z'].some(axis=>!Object.is(originalSphere.center?.[axis],sphere.center[axis]))){results[i]={eligible:false,index:mesh.userData.sourceModelIndex,reason:'precomputed-center-differs-from-source-standard'};continue;}
   sphere.radius*=2;geometry.boundingSphere=sphere;records.push({mesh,originalSphere,originalCulled});
  }
  enabled=true;refreshWorldGuard();return report();
 }
 function restoreCloneBaseline(sourceMesh,ownMesh){
  const record=records.find(r=>r.mesh===sourceMesh);if(!record)return ownMesh;
  if(ownMesh===sourceMesh||ownMesh.geometry===sourceMesh.geometry)throw Error('Owned clone geometry required');
  ownMesh.geometry.boundingSphere=record.originalSphere?.clone()??null;ownMesh.frustumCulled=record.originalCulled;return ownMesh;
 }
 if(diagnostic?.enabled===true)setStaticFrustum(true);
 return Object.freeze({setStaticFrustum,refreshWorldGuard,restoreCloneBaseline,report});
}
