import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {BLENDER_WALK_ENABLED} from './blender-walk-experiment.js';

export const RUN_STYLES={classic:'Classic',smooth:'Marche lissée · TEST Spy Dagger · 8 directions',...(BLENDER_WALK_ENABLED?{blenderBold:'V2 athlétique · Blender TEST · 8 directions · Spy Dagger',blenderTrial:'V1 légère · Blender TEST · avant · Spy Dagger'}:{}),athletic:'Athletic · forward / backward',meshy:'Meshy · Run Fast (forward)'};
export const IDLE_STYLES={classic:'Classic',ninja:'Ninja · calm idle',ninjaExpressive:'Ninja · expressive idle'};
export const IDLE_CLIPS={ninja:'MIXAMO_NINJA_IDLE_ALT',ninjaExpressive:'MIXAMO_NINJA_IDLE'};
export const idleStyle=value=>Object.hasOwn(IDLE_STYLES,value)?value:'classic';
export const MIXAMO_CLIP_LABELS={
 BLENDER_WALK_FORWARD:'Marche retravaillée · Blender TEST · avant',
 MESHY_RUN_FAST:'Meshy · Run Fast',
 MIXAMO_NINJA_RUN:'Ninja · sprint',
 MIXAMO_NINJA_IDLE:'Ninja · expressive idle',
 MIXAMO_NINJA_IDLE_ALT:'Ninja · calm idle',
 MIXAMO_NINJA_SNEAK:'Ninja · sneak walk',
 MIXAMO_ATHLETIC_RUN:'Athletic · forward run',
 MIXAMO_ATHLETIC_BACK:'Athletic · backward run',
};
export const runStyle=value=>Object.hasOwn(RUN_STYLES,value)?value:'classic';
const sources=new Map();
export async function loadMixamoLocomotion(sex,bones,nativeSprint){
 if(!sources.has(sex))sources.set(sex,readAsset(`/assets/animations/mixamo-locomotion-${sex}.json`));
 const data=await sources.get(sex);
 return data.clips.map(clip=>buildMixamoClip(clip,bones,nativeSprint));
}

export function buildMixamoClip(data,bones,nativeSprint){
 if(!Number.isFinite(data.duration)||data.duration<=0||!data.times?.length||!data.times.every((t,i)=>Number.isFinite(t)&&t>=0&&(!i||t>data.times[i-1])))throw Error(`Invalid Mixamo timing: ${data.name}`);
 // Preserve native scale, finger grip and equipment attachment tracks. Their
 // time axes follow the new cycle, while body motion comes from Blender.
 const ratio=data.duration/nativeSprint.duration;
 const tracks=new Map(nativeSprint.tracks.map(t=>{
  const track=t.clone();track.scale(ratio);return [track.name,track];
 }));
 for(const [name,pose] of Object.entries(data.bones)){
  const bone=bones.get(name);if(!bone)throw Error(`Missing Mixamo target bone: ${name}`);
  for(const [property,Track,width] of [['position',THREE.VectorKeyframeTrack,3],['quaternion',THREE.QuaternionKeyframeTrack,4]]){
   if(pose[property].length!==data.times.length*width||!pose[property].every(Number.isFinite))throw Error(`Invalid Mixamo track: ${data.name}/${name}/${property}`);
   const key=`${bone.uuid}.${property}`;
   tracks.set(key,new Track(key,data.times,pose[property]));
  }
 }
 return new THREE.AnimationClip(data.name,data.duration,[...tracks.values()]);
}
