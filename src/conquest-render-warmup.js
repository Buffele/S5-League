import * as THREE from 'three';

export const CONQUEST_PARTICLE_VERTEX_SHADER='attribute vec4 color; varying vec4 vColor; varying vec2 vUv; void main(){vColor=color;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
export const CONQUEST_PARTICLE_FRAGMENT_SHADER='uniform sampler2D map; varying vec4 vColor; varying vec2 vUv; void main(){gl_FragColor=texture2D(map,vUv)*vColor;}';

// The effect renderer and its detached warmup templates must use the same
// material recipe. This does not construct an actor or run a particle action.
export function createConquestParticleMaterial({texture,depthFlag64,blendMode}={}){
 if(!texture?.isTexture)throw Error('Actual prepared particle texture required');
 return new THREE.ShaderMaterial({uniforms:{map:{value:texture}},vertexShader:CONQUEST_PARTICLE_VERTEX_SHADER,fragmentShader:CONQUEST_PARTICLE_FRAGMENT_SHADER,
  transparent:true,depthWrite:false,depthTest:!depthFlag64,blending:blendMode===1?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide,toneMapped:false});
}

export function createConquestParticleGpuTemplates(entries){
 if(!Array.isArray(entries))throw Error('Prepared authored material entries required');
 const root=new THREE.Group(),geometry=new THREE.BufferGeometry(),materials=[],textures=new Set();
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));
 geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(6),2));
 geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(12),4));
 geometry.setDrawRange(0,0);
 let disposed=false;
 try{for(const entry of entries){
  const material=createConquestParticleMaterial(entry),mesh=new THREE.Mesh(geometry,material);
  materials.push(material);textures.add(entry.texture);mesh.name='Conquest detached GPU compile template';mesh.frustumCulled=false;root.add(mesh);
 }}catch(error){for(const material of materials)material.dispose();geometry.dispose();throw error;}
 return Object.freeze({root,textures:Object.freeze([...textures]),
  assertCurrent(){if(disposed)throw Error('Particle GPU templates disposed');},
  dispose(){if(disposed)return;disposed=true;root.clear();geometry.dispose();for(const material of materials)material.dispose();},
 });
}

// Rigid model compile views borrow the bank's real geometry and textures.
// Only the added final-shape material clones belong to this template lease.
export function createConquestModelGpuTemplates(entries){
 if(!Array.isArray(entries))throw Error('Prepared model material entries required');
 const root=new THREE.Group(),materials=[];let disposed=false;
 try{for(const {geometry,material}of entries){
  if(!geometry?.isBufferGeometry||![].concat(material).every(m=>m?.isMaterial))throw Error('Actual model geometry and final materials required');
  materials.push(...[].concat(material));root.add(new THREE.Mesh(geometry,material));
 }}catch(error){for(const material of new Set(materials))material.dispose();throw error;}
 return Object.freeze({root,
  assertCurrent(){if(disposed)throw Error('Model GPU templates disposed');},
  dispose(){if(disposed)return;disposed=true;root.clear();for(const material of new Set(materials))material.dispose();},
 });
}

function materialTextures(material,output){
 for(const value of Object.values(material))if(value?.isTexture)output.add(value);
 const visit=value=>{
  if(value?.isTexture){output.add(value);return;}
  if(Array.isArray(value))for(const entry of value)visit(entry);
 };
 // ShaderMaterial keeps sampler textures in uniforms, including sampler arrays.
 for(const uniform of Object.values(material.uniforms??{}))visit(uniform?.value);
}

// The bank keeps this lease until its own disposal. Disposing its last template
// material immediately after compile could release the cached GPU program.
// Textures are borrowed from that bank and are never disposed by this helper.
export function createConquestEffectGpuWarmup({root,textures=[],assertCurrent,disposeTemplates=()=>{}}={}){
 if(!root?.isObject3D||root.parent!==null||!Array.isArray(textures)||textures.some(t=>!t?.isTexture)||typeof assertCurrent!=='function'||typeof disposeTemplates!=='function')throw Error('Detached bank-owned template root, actual textures and lifecycle required');
 let disposed=false;
 const live=()=>{
  if(disposed)throw Error('Conquest GPU warmup lease disposed');
  const value=assertCurrent();if(value&&typeof value.then==='function')throw Error('Synchronous GPU bank lifecycle required');
  if(disposed||root.parent!==null)throw Error('Current detached GPU templates required');
 };
 return Object.freeze({
  async warm(renderer,camera,targetScene){
   live();if(typeof renderer?.compileAsync!=='function'||renderer.initTexture!==undefined&&typeof renderer.initTexture!=='function'||!camera?.isCamera||!targetScene?.isScene)throw Error('Actual compiler renderer, camera and target scene required');
   const selected=new Set(textures),materials=new Set();let objects=0;
   root.traverse(object=>{
    if(!(object.isMesh||object.isPoints||object.isLine||object.isSprite))return;
    objects++;for(const material of [].concat(object.material??[])){materials.add(material);materialTextures(material,selected);}
   });
   const textureUploadSupported=typeof renderer.initTexture==='function';let uploaded=0;
   if(textureUploadSupported)for(const texture of selected){live();if(texture.isRenderTargetTexture)continue;renderer.initTexture(texture);uploaded++;}
   live();await renderer.compileAsync(root,camera,targetScene);live();
   return Object.freeze({textureUploadSupported,texturesInitialized:uploaded,templateObjects:objects,templateMaterials:materials.size,
    shaderCompilationRequested:true,futureInstanceBuffersUploaded:false,gameplayAdvanced:false,nativeGPUQualified:false});
  },
  dispose(){if(disposed)return;disposed=true;disposeTemplates();},
 });
}
