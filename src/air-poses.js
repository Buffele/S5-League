import * as THREE from 'three';

// The extracted GamePlay Lua distinguishes standing / moving rise and fall,
// but contains no eight-way jump table. These are explicit adaptations: apply
// the directional leg-rotation difference between the original run clips to
// the original airborne pose. Keep root translation and the aiming torso.
// Never label these generated variants as newly discovered original clips.
import {RUN_CLIPS as RUN} from './direction-clips.js';
export function buildDirectionalAirClips(source,bones){
  const clips=new Map(source.map(c=>[c.name,c]));
  const legNames=['Bip01 Pelvis',...['L','R'].flatMap(side=>['Thigh','Calf','Foot'].map(part=>`Bip01 ${side} ${part}`))];
  const legTracks=new Set(legNames.map(name=>`${bones.get(name).uuid}.quaternion`));
  function sampleRotation(clip,name,time){
    const track=clip.tracks.find(t=>t.name===name);
    if(!track)throw Error(`Missing airborne adaptation track ${name}`);
    return new THREE.Quaternion().fromArray(track.createInterpolant().evaluate(time)).normalize();
  }
  const generated=[];
  for(const [direction,run] of Object.entries(RUN)){
    const deltas=new Map();
    for(const name of legTracks){
      const front=sampleRotation(clips.get(RUN.front),name,.12);
      const target=sampleRotation(clips.get(run),name,.12);
      const delta=front.invert().multiply(target);
      deltas.set(name,new THREE.Quaternion().slerp(delta,.55));
    }
    for(const [phase,base] of [['RISE','00004'],['STAND','00001'],['FALL','00002']]){
      const original=clips.get(base),tracks=original.tracks.map(track=>{
        if(!legTracks.has(track.name)||direction==='front')return track.clone();
        const times=[],values=[],interpolant=track.createInterpolant();
        const steps=Math.ceil(original.duration*30);
        for(let i=0;i<=steps;i++){
          const time=i/steps*original.duration;
          const q=new THREE.Quaternion().fromArray(interpolant.evaluate(time)).normalize().multiply(deltas.get(track.name)).normalize();
          times.push(time);values.push(...q.toArray());
        }
        return new THREE.QuaternionKeyframeTrack(track.name,times,values);
      });
      generated.push(new THREE.AnimationClip(`AIR_${phase}_${direction}`,original.duration,tracks));
    }
  }
  return generated;
}
