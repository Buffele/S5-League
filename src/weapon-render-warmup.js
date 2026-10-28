import {Vector3} from 'three';

// compileAsync prepares beauty programs but does not upload every geometry,
// bone texture or prepare the shadow/outline draws. Exercise the real game's
// presentation while its loading/menu cover is up, never on a slot key press.
export function createWeaponRenderWarmup(){
 const warmed=new WeakMap();let renders=0;
 return {
  prepare({renderer,scene,camera,presentation,bundle,activeAvatar,hiddenRoots=[],position=new Vector3()}={}){
   const root=bundle.avatar.group;let views=warmed.get(root);
   if(views?.has(presentation))return false;
   const parent=root.parent,order=parent?.children.indexOf(root),location=root.position.clone(),visible=root.visible,cameraState=camera.clone(false);
   const feedback=[bundle.dash?.group,bundle.trail?.mesh].filter(Boolean).map(node=>({node,parent:node.parent,order:node.parent?.children.indexOf(node)}));
   const hidden=[...new Set(hiddenRoots.filter(node=>node&&node!==root&&!feedback.some(entry=>entry.node===node)))].map(node=>({node,visible:node.visible}));
   const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
   try{
    for(const entry of hidden)entry.node.visible=false;
    if(root.parent!==scene)scene.add(root);root.visible=true;root.position.copy(position);root.updateMatrixWorld(true);
    for(const entry of feedback)if(entry.node.parent!==scene)scene.add(entry.node);
    camera.position.copy(position).add(new Vector3(2,1.5,4));camera.lookAt(position.x,position.y+1,position.z);camera.updateMatrixWorld(true);
    presentation.outline.setAvatar(root);presentation.render();renders++;
    if(!views){views=new WeakSet();warmed.set(root,views);}views.add(presentation);return true;
   }finally{
    root.visible=visible;root.position.copy(location);
    if(root.parent!==parent){root.removeFromParent();if(parent){parent.add(root);parent.children.splice(parent.children.indexOf(root),1);parent.children.splice(order,0,root);}}
    for(const entry of feedback)if(entry.node.parent!==entry.parent){entry.node.removeFromParent();if(entry.parent){entry.parent.add(entry.node);entry.parent.children.splice(entry.parent.children.indexOf(entry.node),1);entry.parent.children.splice(entry.order,0,entry.node);}}
    root.updateMatrixWorld(true);for(const entry of hidden)entry.node.visible=entry.visible;
    camera.copy(cameraState,false);camera.updateMatrixWorld(true);presentation.outline.setAvatar(activeAvatar?.group??null);
    renderer.setRenderTarget(target,face,mip);renderer.shadowMap.needsUpdate=true;
   }
  },
  report(){return {renders};},
 };
}
