import * as THREE from 'three';

// Cache the scenery's directional depth once, then seed that depth into the
// ordinary shadow pass with one draw. Three still renders moving casters each
// frame and all receivers keep the existing PCF shader/lighting unchanged.
// This is a load-time shadow bake, not a lightmap or frozen character shadow.
export function createStationStaticShadows({renderer,scene,world,sun,camera}={}){
 const captured=new Map(),depthMaterials=new Set();let target=null,key=null,triangles=null,bakes=0,disposed=false,error=null;
 const bakeScene=new THREE.Scene(),seedGeometry=new THREE.PlaneGeometry(2,2);
 seedGeometry.setDrawRange(0,0);
 const seedMaterial=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}),seedDepth=new THREE.RawShaderMaterial({
  glslVersion:THREE.GLSL3,colorWrite:false,depthWrite:true,depthTest:true,side:THREE.DoubleSide,
  uniforms:{staticDepth:{value:null}},
  vertexShader:'precision highp float; in vec3 position; out vec2 shadowUv; void main(){shadowUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:'precision highp float; uniform sampler2D staticDepth; in vec2 shadowUv; out vec4 outputColor; void main(){gl_FragDepth=texture(staticDepth,shadowUv).r;outputColor=vec4(1.0);}',
 });
 const seed=new THREE.Mesh(seedGeometry,seedMaterial);seed.name='Station 2 cached scenery shadow';seed.castShadow=true;seed.frustumCulled=false;seed.customDepthMaterial=seedDepth;seed.userData.presentationOnly=true;seed.userData.staticShadowSeed=true;
 seed.onBeforeShadow=(_renderer,_object,_camera,shadowCamera)=>seedGeometry.setDrawRange(0,target&&!error&&shadowCamera===sun.shadow.camera?6:0);
 seed.onAfterShadow=()=>seedGeometry.setDrawRange(0,0);
 seed.onBeforeRender=()=>seedGeometry.setDrawRange(0,0);
 world.group.add(seed);
 function visible(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
 function staticCaster(object){
  if(!object.isMesh||object===seed||object.isSkinnedMesh||object.morphTargetInfluences?.length||object.customDepthMaterial||!visible(object))return false;
  if(!(captured.get(object)??object.castShadow))return false;
  for(let parent=object;parent&&parent!==world.group;parent=parent.parent)if(/-(lasers|goal)$/.test(parent.userData.moduleId??''))return false;
  return [].concat(object.material).every(material=>material.visible&&!material.transparent&&material.blending===THREE.NormalBlending);
 }
 function depthMaterial(material){
  const depth=new THREE.MeshDepthMaterial();depth.colorWrite=false;depth.side=material.shadowSide??(material.side===THREE.FrontSide?THREE.BackSide:material.side===THREE.BackSide?THREE.FrontSide:THREE.DoubleSide);
  for(const property of ['map','alphaMap','alphaTest','displacementMap','displacementScale','displacementBias','wireframe','wireframeLinewidth','clipShadows','clippingPlanes','clipIntersection'])depth[property]=material[property];
  if(material.alphaToCoverage)depth.alphaTest=.5;
  depthMaterials.add(depth);return depth;
 }
 function releaseProxies(){bakeScene.clear();for(const material of depthMaterials)material.dispose();depthMaterials.clear();}
 function restoreCasters(){for(const [object,value]of captured)object.castShadow=value;captured.clear();}
 function signature(){
  sun.updateWorldMatrix(true,false);sun.target.updateWorldMatrix(true,false);
  const c=sun.shadow.camera;
  return JSON.stringify([renderer.shadowMap.type,sun.matrixWorld.elements,sun.target.matrixWorld.elements,[c.left,c.right,c.top,c.bottom,c.near,c.far,c.zoom],sun.shadow.mapSize.toArray(),camera.layers.mask,renderer.capabilities.reversedDepthBuffer===true]);
 }
 function bake(){
  if(renderer.shadowMap.type!==THREE.PCFShadowMap||renderer.capabilities.reversedDepthBuffer)throw Error('Station scenery cache requires the current PCF/non-reversed depth profile');
  const sources=[];world.group.updateWorldMatrix(true,true);world.group.traverse(object=>{if(staticCaster(object))sources.push(object);});
  for(const source of sources){
   const proxy=source.clone(false);proxy.material=Array.isArray(source.material)?source.material.map(depthMaterial):depthMaterial(source.material);
   proxy.matrixAutoUpdate=false;proxy.matrix.copy(source.matrixWorld);proxy.matrixWorld.copy(source.matrixWorld);proxy.castShadow=false;proxy.receiveShadow=false;bakeScene.add(proxy);
  }
  const size=sun.shadow.mapSize,next=new THREE.WebGLRenderTarget(size.x,size.y,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  next.depthTexture=new THREE.DepthTexture(size.x,size.y,THREE.UnsignedIntType);next.depthTexture.compareFunction=null;next.depthTexture.name='Station 2 baked scenery depth';
  const state={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),color:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),autoClear:renderer.autoClear,shadowAuto:renderer.shadowMap.autoUpdate,shadowDirty:renderer.shadowMap.needsUpdate};
  try{
   const shadowCamera=sun.shadow.camera;shadowCamera.updateProjectionMatrix();sun.shadow.updateMatrices(sun);shadowCamera.layers.mask=camera.layers.mask;
   renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.autoClear=false;
   renderer.setRenderTarget(next);renderer.setViewport(0,0,size.x,size.y);renderer.setScissorTest(false);renderer.setClearColor(0xffffff,1);renderer.clear(true,true,false);renderer.render(bakeScene,shadowCamera);
   restoreCasters();for(const source of sources){captured.set(source,source.castShadow);source.castShadow=false;}
   const previous=target;target=next;seedDepth.uniforms.staticDepth.value=target.depthTexture;previous?.depthTexture?.dispose();previous?.dispose();bakes++;
  }catch(failure){next.depthTexture.dispose();next.dispose();throw failure;}
  finally{
   renderer.setRenderTarget(state.target,state.face,state.mip);renderer.setViewport(state.viewport);renderer.setScissor(state.scissor);renderer.setScissorTest(state.scissorTest);renderer.setClearColor(state.color,state.alpha);renderer.autoClear=state.autoClear;renderer.shadowMap.autoUpdate=state.shadowAuto;renderer.shadowMap.needsUpdate=state.shadowDirty;releaseProxies();
  }
 }
 const api={
  prepare(){
   if(disposed)throw Error('Disposed Station 2 shadow cache');
   if(!renderer.shadowMap.enabled||!sun.castShadow)return api.snapshot();
   const current=signature();if(!error&&(key!==current||triangles!==world.triangles)){
    try{bake();key=current;triangles=world.triangles;}catch(failure){error=failure.message;restoreCasters();releaseProxies();seedDepth.uniforms.staticDepth.value=null;}
   }
   return api.snapshot();
  },
  invalidate(){key=null;error=null;},
  snapshot(){return {bakes,staticCasters:captured.size,ready:!!target&&!error&&!disposed,error,mode:'load-time-directional-depth-cache',dynamicShadowsLive:true};},
  dispose(){if(disposed)return;disposed=true;restoreCasters();seed.removeFromParent();seedGeometry.dispose();seedMaterial.dispose();seedDepth.dispose();target?.depthTexture?.dispose();target?.dispose();target=null;releaseProxies();},
 };
 const dispose=world.dispose;world.dispose=function(...args){api.dispose();return dispose.apply(this,args);};
 return api;
}
