import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
export const SPRINT_STYLES={anime:'R0024 · run',classic:'Classic',ninja:'Ninja · manga',athletic:'Athletic · Mixamo',meshy:'Meshy · Run Fast'};
export const sprintStyle=value=>Object.hasOwn(SPRINT_STYLES,value)?value:'anime';
const sources=new Map();
export async function loadAnimeSprint(sex,bones,nativeSprint){
 if(!sources.has(sex))sources.set(sex,readAsset(`/assets/animations/anime-sprint-${sex}.json`));
 return buildAnimeSprint(await sources.get(sex),bones,nativeSprint);
}
export function buildAnimeSprint(data,bones,nativeSprint){
 // The native cycle owns feet, dimensions, costume attachments and weapon grip.
 // Blender contributes only the authored torso / head / arm pose channels.
 const tracks=new Map(nativeSprint.tracks.map(t=>[t.name,t.clone()]));
 for(const [name,pose] of Object.entries(data.bones)){
  const bone=bones.get(name);if(!bone)throw Error(`Missing anime sprint bone: ${name}`);
  for(const [property,Track] of [['position',THREE.VectorKeyframeTrack],['quaternion',THREE.QuaternionKeyframeTrack]]){
   const key=`${bone.uuid}.${property}`;tracks.set(key,new Track(key,data.times,pose[property]));
  }
 }
 return new THREE.AnimationClip('ANIME_SPRINT',nativeSprint.duration,[...tracks.values()]);
}
