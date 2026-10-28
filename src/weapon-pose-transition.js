import {Quaternion,Vector3,LoopRepeat} from 'three';

// S5Runtime 0x7C9826 and capture 22:09:15: 1000 SCN ticks, linear weight.
export const WEAPON_TRANSITION_SECONDS=1000/4800;
const poseProperties=['position','quaternion','scale'];
const trackSamplers=new WeakMap();
function samplerFor(track){
  let cached=trackSamplers.get(track);
  if(!cached||cached.times!==track.times||cached.values!==track.values||cached.factory!==track.createInterpolant){
    cached={times:track.times,values:track.values,factory:track.createInterpolant,interpolant:track.createInterpolant()};
    trackSamplers.set(track,cached);
  }
  return cached.interpolant;
}
// Full and split clips share immutable tracks. Warm only the active tracks
// during loading, rather than allocating interpolants on the first slot key.
export function prepareAnimationPoseSampling(channels){
  for(const action of channels.values())for(const track of action.getClip().tracks)samplerFor(track);
}
const copyPose=bone=>({position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()});
const blend=(to,from,w)=>{
  to.position.lerpVectors(from.position,to.position,w);
  // slerpQuaternions copies its first argument before reading the second;
  // using `to.quaternion` as that second argument destroys the target pose.
  to.quaternion.slerp(from.quaternion,1-w);
  to.scale.lerpVectors(from.scale,to.scale,w);
};

// Evaluate immutable animation tracks directly. No duplicate scene graph,
// PropertyBindings or AnimationMixer are built on the input/render thread.
// sample() owns a reusable pose map; callers may blend it until the next sample.
export function captureAnimationPose(bones,channels,retiring=new Map()){
  const poses=new Map(),names=new Map(),keys=new Map(),entries=[],layers=[];
  for(const [name,bone] of bones){
    if(name.startsWith('equipment'))continue;
    const pose=copyPose(bone),entry={pose,base:copyPose(bone),position:0,quaternion:0,scale:0,frozen:false};
    poses.set(name,pose);names.set(bone.uuid,entry);entries.push(entry);
    entry.name=name;
  }
  const current=new Set(channels.values());
  for(const action of new Set([...current,...retiring.keys()])){
    const clip=action.getClip(),tracks=[];
    for(const track of clip.tracks){
      const dot=track.name.lastIndexOf('.'),entry=names.get(track.name.slice(0,dot)),property=track.name.slice(dot+1);
      if(entry&&poseProperties.includes(property)){
        // evaluate() has a shared scratch result, copied immediately below;
        // each capture still owns its independent base pose and sample map.
        tracks.push({entry,property,interpolant:samplerFor(track)});
        // S5Runtime 0x7C9EC0: interrupting an existing blend snapshots its result,
        // not a weighted pair of clips that continue to move indefinitely.
        if(retiring.has(action))entry.frozen=true;
      }
      if(entry&&current.has(action))keys.set(entry.name,clip.name);
    }
    layers.push({tracks,time:action.time,duration:clip.duration,loop:action.loop===LoopRepeat,weight:action.getEffectiveWeight()});
  }
  for(const e of entries)if(e.frozen)keys.set(e.name,Symbol('mixed'));
  const vector=new Vector3(),quaternion=new Quaternion();
  return {keys,sample(elapsed){
    for(const e of entries)e.position=e.quaternion=e.scale=0;
    for(const layer of layers){
      if(layer.weight<=0)continue;
      const clock=layer.time+Math.max(0,elapsed);
      const time=layer.loop&&layer.duration>0?clock%layer.duration:Math.min(clock,layer.duration);
      for(const {entry,property,interpolant} of layer.tracks){
        const value=interpolant.evaluate(time),out=entry.pose[property],previous=entry[property];
        const total=previous+layer.weight;
        if(!previous)out.fromArray(value);
        else if(property==='quaternion')out.slerp(quaternion.fromArray(value),layer.weight/total);
        else out.lerp(vector.fromArray(value),layer.weight/total);
        entry[property]=total;
      }
    }
    for(const e of entries)for(const property of poseProperties){
      const weight=e[property];
      if(e.frozen||!weight)e.pose[property].copy(e.base[property]);
      else if(weight<1){
        if(property==='quaternion')e.pose[property].slerp(e.base[property],1-weight);
        else e.pose[property].lerp(e.base[property],1-weight);
      }
    }
    return poses;
  }};
}

export class WeaponPoseTransition {
  constructor(source,target,duration=WEAPON_TRANSITION_SECONDS){
    this.source=source;this.duration=duration;this.elapsed=0;
    this.changed=new Map([...target.keys].filter(([name,key])=>source.keys.get(name)!==key));
  }
  // Native 0x7C9EC0 stores the current mixed transforms as the next source.
  // Unchanged bones (e.g. walking legs) retain their ordinary moving sampler.
  captureSource(target){
    const source=this.source,offset=this.elapsed,w=this.weight(),changed=new Map(this.changed);
    if(w>=1)return target;
    const initial=target.sample(0),from=source.sample(offset),frozen=new Map();
    for(const [name] of changed)if(initial.has(name)&&from.has(name)){
      const pose=copyPose(initial.get(name));blend(pose,from.get(name),w);frozen.set(name,pose);
    }
    return {keys:new Map([...target.keys].map(([name,key])=>[name,changed.has(name)?Symbol('mixed'):key])),sample(elapsed){
      const pose=target.sample(elapsed);
      for(const [name,snapshot] of frozen)if(pose.has(name)){
        const bone=pose.get(name);bone.position.copy(snapshot.position);bone.quaternion.copy(snapshot.quaternion);bone.scale.copy(snapshot.scale);
      }
      return pose;
    }};
  }
  weight(){return this.duration>0?Math.min(1,this.elapsed/this.duration):1;}
  render(bones,dt,currentKeys){
    this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,dt));
    const weight=this.weight();if(weight>=1||!this.changed.size)return true;
    const source=this.source.sample(this.elapsed);
    for(const [name,key] of this.changed){
      // A new attack or movement state owns its new transition immediately.
      if(currentKeys&&currentKeys.get(name)!==key){this.changed.delete(name);continue;}
      const bone=bones.get(name),from=source.get(name);if(bone&&from)blend(bone,from,weight);
    }
    return !this.changed.size;
  }
}
