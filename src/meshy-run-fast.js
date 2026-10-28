import {readAsset} from './scene-assets.js';
import {buildMixamoClip} from './mixamo-locomotion.js';

export const MESHY_RUN_FAST_CLIP='MESHY_RUN_FAST';
const sources=new Map();
export async function loadMeshyRunFast(sex,bones,nativeSprint){
 if(!sources.has(sex))sources.set(sex,readAsset(`/assets/animations/meshy-run-fast-${sex}.json`));
 // The shared builder retains native scales, fingers and equipment channels.
 return buildMixamoClip(await sources.get(sex),bones,nativeSprint);
}
