import * as THREE from 'three';

// 4800 is consistent with SN001=4800 ticks / 1000 ms in weapon_spydagger.lua.
// This is a measured data correspondence, not yet a running-client comparison.
import {SCN_TICKS_PER_SECOND} from './root-motion.js';
export {SCN_TICKS_PER_SECOND};

export function resolveTransform(definition,name,chain=[]) {
  if(chain.includes(name))throw Error(`Cyclic animation alias: ${[...chain,name].join(' -> ')}`);
  const animation=definition.animations?.[name];
  if(!animation)return null;
  if(animation.data)return animation.data;
  if(animation.copy){
    const resolved=resolveTransform(definition,animation.copy,[...chain,name]);
    // S5Runtime's female rig contains 120 links to absent DD tracks on end/helper
    // nodes. Only explicitly audited nodes may retain their BASE transform.
    if(!resolved&&definition.missingAliasFallback==='BASE')return resolveTransform(definition,'BASE',[...chain,name]);
    if(!resolved)throw Error(`Missing animation alias ${definition.name}: ${name} -> ${animation.copy}`);
    return resolved;
  }
  return null;
}

export function buildAnimationClips(reference,bones) {
  return reference.clips.map(info=>{
    const tracks=[];let duration=0;
    for(const definition of reference.bones){
      const bone=bones.get(definition.name);
      if(!bone)throw Error('Missing bone '+definition.name);
      const animated=resolveTransform(definition,info.name);
      const data=animated||resolveTransform(definition,'BASE');
      const controlsDuration=animated&&definition.controlsClipDuration!==false;
      // Alias-only clips have duration=0 in the raw index. Use their resolved
      // data duration, otherwise their entire walking cycle loops in 10 ms.
      // BASE supplies a missing node pose, not the character clip's clock.
      // Weapon/hair BASE tracks can last 2–2.5 s while walking lasts 2/3 s.
      // Explicit equipment clips also have their own lengths. The character
      // skeleton remains authoritative for the shared playback clock.
      if(controlsDuration)duration=Math.max(duration,animated.durationTicks||0);
      for(const [property,key,single,Track] of [
        ['position','positions','position',THREE.VectorKeyframeTrack],
        ['quaternion','rotations','rotation',THREE.QuaternionKeyframeTrack],
        ['scale','scales','scale',THREE.VectorKeyframeTrack],
      ]){
        const frames=data?.[key]||[],value=data?.[single]||bone[property].toArray();
        const times=frames.length?frames.map(k=>k[0]/SCN_TICKS_PER_SECOND):[0];
        const values=frames.length?frames.flatMap(k=>k.slice(1)):value;
        if(!times.every(Number.isFinite)||!values.every(Number.isFinite))throw Error('Non-finite animation '+info.name);
        for(let i=1;i<times.length;i++)if(times[i]<times[i-1])throw Error('Unsorted animation keys '+info.name);
        if(controlsDuration&&frames.length)duration=Math.max(duration,frames.at(-1)[0]);
        tracks.push(new Track(`${bone.uuid}.${property}`,times,values));
      }
    }
    return new THREE.AnimationClip(info.name,Math.max(duration/SCN_TICKS_PER_SECOND,1/SCN_TICKS_PER_SECOND),tracks);
  });
}

export function lowerBodyBoneNames(reference){
  const lower=new Set(['Bip01','Bip01 Pelvis','Bip01 Footsteps']);
  for(const side of ['L','R'])lower.add(`Bip01 ${side} Thigh`);
  let changed=true;
  while(changed){changed=false;for(const bone of reference.bones){
    if(lower.has(bone.parent)&&bone.parent!=='Bip01'&&!lower.has(bone.name)){lower.add(bone.name);changed=true;}
  }}
  return lower;
}

// Two non-overlapping track sets let the legs continue their cycle while the
// torso plays a knife strike, matching GetLowerPartStateSet in the source Lua.
export function splitClips(clips,reference,bones){
  const lower=lowerBodyBoneNames(reference),ids=new Set([...lower].map(n=>bones.get(n)?.uuid));
  const result=[];
  for(const clip of clips)for(const mask of ['upper','lower']){
    const tracks=clip.tracks.filter(t=>ids.has(t.name.split('.')[0])===(mask==='lower'));
    result.push(new THREE.AnimationClip(`${clip.name}:${mask}`,clip.duration,tracks));
  }
  return result;
}
