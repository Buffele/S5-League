import * as THREE from 'three';
import {keyInterval} from './effect-scene.js';

const TICKS_PER_MS=Math.fround(4.800000190734863),BLEND_TICKS=2000;
const pose=()=>({position:new THREE.Vector3(),scale:new THREE.Vector3(1,1,1),rotation:new THREE.Quaternion()});
function sampleVector(out,keys,single,ticks){
 if(!keys.length){out.fromArray(single);return;}
 const [a,b,f]=keyInterval(keys,ticks);out.set(...a.slice(1).map((v,i)=>v+(b[i+1]-v)*f));
}
function sample(out,track,ticks){
 sampleVector(out.position,track.positions,track.position,ticks);
 sampleVector(out.scale,track.scales,track.scale,ticks);
 if(!track.rotations.length)out.rotation.fromArray(track.rotation);
 else{const [a,b,f]=keyInterval(track.rotations,ticks);out.rotation.fromArray(a,1).slerp(new THREE.Quaternion().fromArray(b,1),f);}
 return out;
}
function mix(out,old,current,weight){
 out.position.lerpVectors(old.position,current.position,weight);out.scale.lerpVectors(old.scale,current.scale,weight);
 out.rotation.slerpQuaternions(old.rotation,current.rotation,weight);return out;
}
const constantTrack=p=>({position:p.position.toArray(),scale:p.scale.toArray(),rotation:p.rotation.toArray(),positions:[],scales:[],rotations:[]});

// Supported Siege bases only. Native 7C8CC0 ->7C9BA0 selects a new track,
// retaining an independently advancing old track. 7C97E0 uses MULSS and
// truncates integer wall milliseconds; this differs from the root clock's
// x87 product. Interrupted transitions synthesize a constant old SRT via
// 7C9EC0, rather than freezing the last rendered mesh or nesting blends.
export function createSiegeBaseTransformTransition(tracks){
 const initial=tracks.in00;if(!initial)throw Error('Initial Siege transform track required');
 let current=initial,previous=null,nodeTicks=0,oldTicks=0,oldDuration=0,elapsed=0,lastMilliseconds=0,wallMilliseconds=0;
 const a=pose(),b=pose(),result=pose();
 function checkTime(milliseconds){
  if(!Number.isSafeInteger(milliseconds)||milliseconds<wallMilliseconds)throw Error('Monotonic integer transform milliseconds required');
  wallMilliseconds=milliseconds;
 }
 function advanceBlend(milliseconds){
  const delta=Math.trunc(Math.fround(Math.fround((milliseconds-lastMilliseconds)>>>0)*TICKS_PER_MS));lastMilliseconds=milliseconds;
  oldTicks=(oldTicks+delta)>>>0;elapsed=Math.min(BLEND_TICKS,(elapsed+delta)>>>0);
  if(oldTicks>oldDuration){oldDuration=oldDuration||1;oldTicks%=oldDuration;}
  return Math.fround(elapsed/BLEND_TICKS);
 }
 return {
  select(name,milliseconds){
   checkTime(milliseconds);
   if(previous&&elapsed>0&&elapsed<BLEND_TICKS){
    // 7C9EC0 samples current at the *prior* old-track time before advancing
    // that old clock. Preserve this ordering when selection occurs between
    // evaluations; a last-rendered-pose snapshot is not the native source.
    sample(a,current,oldTicks);const weight=advanceBlend(milliseconds);sample(b,previous,oldTicks);
    previous=constantTrack(mix(result,b,a,weight));
   }else previous=current;
   oldDuration=current.durationTicks;oldTicks=nodeTicks;elapsed=0;lastMilliseconds=milliseconds;
   current=tracks[name]||initial;
  },
  apply(mesh,ticks,milliseconds){
   checkTime(milliseconds);sample(a,current,ticks);
   if(previous&&elapsed<BLEND_TICKS){
    const weight=advanceBlend(milliseconds);sample(b,previous,oldTicks);mix(result,b,a,weight);
    if(elapsed===BLEND_TICKS)previous=null;
   }else{result.position.copy(a.position);result.scale.copy(a.scale);result.rotation.copy(a.rotation);}
   mesh.position.copy(result.position);mesh.scale.copy(result.scale);mesh.quaternion.copy(result.rotation);nodeTicks=ticks;
  },
  snapshot(){return {active:!!previous,elapsedTicks:elapsed,durationTicks:BLEND_TICKS,oldTicks,nodeTicks,syntheticOldTrack:!!previous&&!('durationTicks' in previous)};},
 };
}
