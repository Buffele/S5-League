// The beauty pass already updates every transform and renders the shadow map.
// Outline depth/mask passes use unlit override materials; they only need those
// matrices, not new shadow maps made from their temporarily hidden selection.
export function reuseStationOutlineState(pass){
 const render=pass.render;
 pass.render=function(renderer,...args){
  const scene=this.renderScene,shadows=renderer.shadowMap.autoUpdate,matrices=scene.matrixWorldAutoUpdate;
  renderer.shadowMap.autoUpdate=false;scene.matrixWorldAutoUpdate=false;
  try{return render.call(this,renderer,...args);}
  finally{renderer.shadowMap.autoUpdate=shadows;scene.matrixWorldAutoUpdate=matrices;}
 };
 return pass;
}

// Reflector is invoked during the beauty traversal, after scene matrices have
// been updated. Reuse them for the reflected view of this same instant.
export function reuseStationReflectionState(mirrors){
 for(const mirror of mirrors){
  const capture=mirror.onBeforeRender;
  mirror.onBeforeRender=function(renderer,scene,...args){
   const matrices=scene.matrixWorldAutoUpdate;scene.matrixWorldAutoUpdate=false;
   try{return capture.call(this,renderer,scene,...args);}
   finally{scene.matrixWorldAutoUpdate=matrices;}
  };
 }
}
