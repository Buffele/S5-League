import {OutlinePass} from 'three/addons/postprocessing/OutlinePass.js';
import {NearestFilter} from 'three';

// OutlinePass normally outlines the UNION of its selection. Give each selected
// root a mask ID so a character in front of a selected train keeps its silhouette.
export class SeparatedOutlinePass extends OutlinePass{
 constructor(...args){
  super(...args);this.selectionIds=new Map();
  const material=this.prepareMaskMaterial;
  material.uniforms.selectionId={value:0};
  material.uniforms.useBeautyDepth={value:false};
  material.fragmentShader='uniform float selectionId;\n'+material.fragmentShader.replace('vec4(0.0, depthTest, 1.0, 1.0)','vec4(0.0, depthTest, selectionId, 1.0)');
  material.fragmentShader='uniform bool useBeautyDepth;\n'+material.fragmentShader
   .replace('unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ))','(useBeautyDepth ? texture2DProj(depthTexture,projTexCoord).r : unpackRGBAToDepth(texture2DProj(depthTexture,projTexCoord)))')
   .replace('(-vPosition.z > viewZ)', '(-vPosition.z > viewZ + (useBeautyDepth ? max(.002,viewZ*.00002) : 0.0))');
  material.onBeforeRender=(_renderer,_scene,_camera,_geometry,object)=>{
   material.uniforms.selectionId.value=this.selectionIds.get(object)??0;
   material.uniformsNeedUpdate=true;
  };
  // ID samples must not interpolate into other IDs along a boundary.
  for(const target of [this.renderTargetMaskBuffer,this.renderTargetMaskDownSampleBuffer]){
   target.texture.minFilter=NearestFilter;target.texture.magFilter=NearestFilter;
  }
  this.edgeDetectionMaterial.fragmentShader=this.edgeDetectionMaterial.fragmentShader.replace(
   'float d = length( vec2(diff1, diff2) );',
   `float idEdge=step(.001,max(abs(c1.b-c2.b),abs(c3.b-c4.b)))*.5;
    float d=max(length(vec2(diff1,diff2)),idEdge);`);
  this.downSampleRatio=1;
 }
 _updateSelectionCache(){
  super._updateSelectionCache();this.selectionIds.clear();
  for(const object of this._selectionCache)if(object.userData.excludeInkOutline)this._selectionCache.delete(object);
  this.selectedObjects.forEach((root,index)=>root.traverse(object=>{
   if(object.isMesh&&!object.userData.excludeInkOutline)this.selectionIds.set(object,(index+1)/(this.selectedObjects.length+1));
  }));
 }
 // The game's ink shader reads edgeTexture1 only: no glow, pulse or pattern.
 // Keep full-resolution IDs and occlusion, but omit the redundant mask copy
 // and both glow blurs. Do not change the stock path for other consumers.
 setSize(width,height){
  if(!this.inkOnly){super.setSize(width,height);return;}
  const scale=Math.min(1,(this.maxResolution||Infinity)/Math.max(width,height));
  const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
  for(const target of [this.renderTargetMaskBuffer,this.renderTargetDepthBuffer,this.renderTargetBlurBuffer1,this.renderTargetEdgeBuffer1])target.setSize(w,h);
  this.separableBlurMaterial1.uniforms.texSize.value.set(w,h);
 }
 renderInk(renderer,readBuffer,maskActive){
  if(!this.selectedObjects.length)return;
  const scene=this.renderScene,background=scene.background,override=scene.overrideMaterial;
  const autoClear=renderer.autoClear,alpha=renderer.getClearAlpha();
  renderer.getClearColor(this._oldClearColor);
  try{
   renderer.autoClear=false;if(maskActive)renderer.state.buffers.stencil.setTest(false);
   renderer.setClearColor(0xffffff,1);this._updateSelectionCache();
   // A depth texture attached to the beauty target includes real cutouts and
   // the evaluated pose. Reuse it instead of redrawing every non-selected mesh.
   const beautyDepth=this.inkOnly&&readBuffer.depthTexture;
   scene.background=null;
   if(!beautyDepth){
    this._changeVisibilityOfSelectedObjects(false);scene.overrideMaterial=this.depthMaterial;
    renderer.setRenderTarget(this.renderTargetDepthBuffer);renderer.clear();renderer.render(scene,this.renderCamera);
    this._changeVisibilityOfSelectedObjects(true);this._visibilityCache.clear();
   }
   this._updateTextureMatrix();
   this._changeVisibilityOfNonSelectedObjects(false);scene.overrideMaterial=this.prepareMaskMaterial;
   const mask=this.prepareMaskMaterial.uniforms;
   mask.cameraNearFar.value.set(this.renderCamera.near,this.renderCamera.far);
   mask.useBeautyDepth.value=!!beautyDepth;mask.depthTexture.value=beautyDepth||this.renderTargetDepthBuffer.texture;mask.textureMatrix.value=this.textureMatrix;
   renderer.setRenderTarget(this.renderTargetMaskBuffer);renderer.clear();renderer.render(scene,this.renderCamera);
   this._changeVisibilityOfNonSelectedObjects(true);this._visibilityCache.clear();
   scene.background=background;scene.overrideMaterial=override;
   const edge=this.edgeDetectionMaterial.uniforms;
   edge.maskTexture.value=this.renderTargetMaskBuffer.texture;
   edge.texSize.value.set(this.renderTargetMaskBuffer.width,this.renderTargetMaskBuffer.height);
   edge.visibleEdgeColor.value=this.visibleEdgeColor;edge.hiddenEdgeColor.value=this.hiddenEdgeColor;
   this._fsQuad.material=this.edgeDetectionMaterial;
   renderer.setRenderTarget(this.renderTargetEdgeBuffer1);renderer.clear();this._fsQuad.render(renderer);
   this._fsQuad.material=this.separableBlurMaterial1;
   const blur=this.separableBlurMaterial1.uniforms;
   blur.kernelRadius.value=this.edgeThickness;blur.direction.value=OutlinePass.BlurDirectionX;
   blur.colorTexture.value=this.renderTargetEdgeBuffer1.texture;
   renderer.setRenderTarget(this.renderTargetBlurBuffer1);renderer.clear();this._fsQuad.render(renderer);
   blur.direction.value=OutlinePass.BlurDirectionY;blur.colorTexture.value=this.renderTargetBlurBuffer1.texture;
   renderer.setRenderTarget(this.renderTargetEdgeBuffer1);renderer.clear();this._fsQuad.render(renderer);
   this._fsQuad.material=this.overlayMaterial;
   this.overlayMaterial.uniforms.edgeTexture1.value=this.renderTargetEdgeBuffer1.texture;
   this.overlayMaterial.uniforms.edgeStrength.value=this.edgeStrength;
   if(maskActive)renderer.state.buffers.stencil.setTest(true);
   renderer.setRenderTarget(readBuffer);this._fsQuad.render(renderer);
  }finally{
   // Both selection phases can fail (context loss, shader errors). Restore only
   // cached objects, including objects that were hidden before this pass.
   for(const [object,visible]of this._visibilityCache)object.visible=visible;
   this._visibilityCache.clear();this._selectionCache.clear();
   scene.background=background;scene.overrideMaterial=override;
   renderer.setClearColor(this._oldClearColor,alpha);renderer.autoClear=autoClear;
   if(maskActive)renderer.state.buffers.stencil.setTest(true);
  }
 }
 render(...args){
  // The stock depth override treats glass, additive beams and cloud quads as
  // opaque. Exclude those visual layers, retaining depth occlusion by solid walls.
  const selected=new Set(),hidden=[];
  for(const root of this.selectedObjects)root.traverse(object=>{if(object.isMesh)selected.add(object);});
  this.renderScene.traverse(object=>{
   if(!object.isMesh||!object.visible)return;
   // Selected character roots include weapon light quads. The mask's override
   // material ignores their additive texture and outlines the whole rectangle.
   if(object.userData.excludeInkOutline){hidden.push(object);object.visible=false;return;}
   if(selected.has(object))return;
   const materials=[].concat(object.material);
   if(materials.every(m=>m.transparent||m.opacity<1||m.depthWrite===false)){
    hidden.push(object);object.visible=false;
   }
  });
  const renderer=args[0],shadows=renderer.shadowMap.autoUpdate,shadowDirty=renderer.shadowMap.needsUpdate,matrices=this.renderScene.matrixWorldAutoUpdate;
  // Beauty already evaluated matrices and shadows. Never regenerate a shadow
  // map with the temporarily hidden outline selection (also caused flicker).
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;this.renderScene.matrixWorldAutoUpdate=false;
  try{
   if(!this.inkOnly)return super.render(...args);
   this.renderInk(renderer,args[2],args[4]);
   if(this.renderToScreen){this._fsQuad.material=this.materialCopy;this.copyUniforms.tDiffuse.value=args[2].texture;renderer.setRenderTarget(null);this._fsQuad.render(renderer);}
  }finally{
   for(const object of hidden)object.visible=true;
   renderer.shadowMap.autoUpdate=shadows;renderer.shadowMap.needsUpdate=shadowDirty;this.renderScene.matrixWorldAutoUpdate=matrices;
  }
 }
}
