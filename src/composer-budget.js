import {DepthTexture,UnsignedIntType} from 'three';
import {RENDER_QUALITY,normalizeRenderQuality} from './render-quality.js';

export function attachPresentationDepth(composer){
 for(const target of [composer.renderTarget1,composer.renderTarget2])target.depthTexture=new DepthTexture(target.width,target.height,UnsignedIntType);
}
export function applyComposerBudget(composer,renderer,quality){
 quality=normalizeRenderQuality(quality);
 const samples=Math.min(quality==='performance'?0:quality==='high'?4:2,renderer.capabilities.maxSamples??0);
 for(const target of [composer.renderTarget1,composer.renderTarget2])if(target.samples!==samples){target.dispose();target.samples=samples;}
 composer.setPixelRatio(renderer.getPixelRatio());
 return RENDER_QUALITY[quality];
}
