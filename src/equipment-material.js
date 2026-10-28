import {MeshBasicMaterial,MeshToonMaterial,FrontSide,DoubleSide,AdditiveBlending,NormalBlending} from 'three';

// SCN renderState bits are already used by scene-assets/effect-scene. Keep
// weapon light overlays out of the opaque, shadow-casting character material.
export function katanaMaterial(model,map,gradientMap){
 const state=model.renderState||0;
 const options={map,side:state&8?DoubleSide:FrontSide,transparent:!!(state&34),
  alphaTest:state&4?.45:0,depthWrite:!(state&64),blending:state&32?AdditiveBlending:NormalBlending};
 return state&33?new MeshBasicMaterial({...options,toneMapped:false}):new MeshToonMaterial({...options,gradientMap});
}
export function applyKatanaRenderFlags(mesh,model){
 const overlay=!!((model.renderState||0)&34);
 mesh.castShadow=!overlay;mesh.userData.excludeInkOutline=overlay;
}
