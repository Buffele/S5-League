import {NeutralToneMapping,SRGBColorSpace,Vector4} from 'three';

// The room owns its presentation independently of the prepared match map.
// This is the S5 neutral policy, not a certification of native room lighting.
export function renderWaitingRoom(renderer,scene,camera,width,height){
 const saved={target:renderer.getRenderTarget(),cubeFace:renderer.getActiveCubeFace(),mipmapLevel:renderer.getActiveMipmapLevel(),viewport:renderer.getViewport(new Vector4()),scissor:renderer.getScissor(new Vector4()),scissorTest:renderer.getScissorTest(),autoClear:renderer.autoClear,toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure,colorSpace:renderer.outputColorSpace};
 try{
  renderer.toneMapping=NeutralToneMapping;renderer.toneMappingExposure=1;renderer.outputColorSpace=SRGBColorSpace;renderer.autoClear=true;
  renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);renderer.render(scene,camera);
 }finally{
  renderer.toneMapping=saved.toneMapping;renderer.toneMappingExposure=saved.exposure;renderer.outputColorSpace=saved.colorSpace;renderer.autoClear=saved.autoClear;
  renderer.setRenderTarget(saved.target,saved.cubeFace,saved.mipmapLevel);renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);
 }
}
