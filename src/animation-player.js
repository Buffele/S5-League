import * as THREE from 'three';
import {captureAnimationPose,prepareAnimationPoseSampling} from './weapon-pose-transition.js';
import {AnimationActionCache} from './animation-action-cache.js';

export class AnimationPlayer {
  constructor(root,clips,{eagerActions=false}={}){
    this.mixer=new THREE.AnimationMixer(root);
    this.actions=eagerActions?new Map(clips.map(c=>[c.name,this.mixer.clipAction(c)])):
      new AnimationActionCache(clips,clip=>this.mixer.clipAction(clip));
    this.channels=new Map();this.retiring=new Map();this.poseKeyCache=new WeakMap();this.channelRevision=0;
    this.root=root;this.transitions=new Map();this.bindings=new Map();this.nextFadePadding=new Map();
  }
  snapshot(old,next,duration,previous){
    // Capture before stopping/resetting any action: this includes interrupted
    // fades and same-clip retriggers, not just the outgoing clip's raw pose.
    const tracks=new Map([...(previous?.getClip().tracks||[]),...old.getClip().tracks,...next.getClip().tracks].map(t=>[t.name,t]));
    return new THREE.AnimationClip('pose-transition',duration,[...tracks.values()].map(track=>{
      let binding=this.bindings.get(track.name);
      if(!binding){binding=THREE.PropertyBinding.create(this.root,track.name);this.bindings.set(track.name,binding);}
      const value=new Array(track.getValueSize());binding.getValue(value,0);
      return new track.constructor(track.name,[0,duration],[...value,...value]);
    }));
  }
  clearTransition(channel){
    const action=this.transitions.get(channel);if(!action)return;
    action.stop();this.retiring.delete(action);this.transitions.delete(channel);
    this.mixer.uncacheAction(action.getClip());this.mixer.uncacheClip(action.getClip());
  }
  play(name,{channel='full',loop=true,fade=.1,restart=false,speed=1,phase=null,nextFadePadding=0}={}){
    const next=this.actions.get(name);if(!next)throw Error('Missing animation '+name);
    const old=this.channels.get(channel);
    if(old===next&&!restart){
      // Inspector can switch an already-clamped one-shot back to a live loop.
      if(loop&&next.loop!==THREE.LoopRepeat){next.reset().play();}
      next.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
      next.setEffectiveTimeScale(speed);this.nextFadePadding.set(channel,nextFadePadding);return next;
    }
    // CAnimationController1 +0x54 adds the previous parameter's extra ticks
    // to the incoming blend. It is not an offset into the animation file.
    if(old&&fade>0)fade+=this.nextFadePadding.get(channel)||0;
    this.nextFadePadding.set(channel,nextFadePadding);
    // S5Runtime 0x7C9BA0: ordinary fades retain an advancing source, while an
    // interrupted fade starts from the currently displayed mixed transform.
    // A separate clip identity permits two clocks even for a same-clip restart.
    // Tracks are immutable: share their arrays instead of copying every keyframe.
    const interrupted=this.transitions.has(channel);
    const oldClip=old?.getClip();
    const sourceClip=old&&fade>0?(interrupted?this.snapshot(old,next,fade,this.transitions.get(channel)):
      new THREE.AnimationClip('outgoing-'+oldClip.name,oldClip.duration,oldClip.tracks,oldClip.blendMode)):null;
    const sourceTime=interrupted?0:old?.time;
    const sourceLoop=interrupted?THREE.LoopOnce:old?.loop;
    this.clearTransition(channel);
    if(old)old.stop();
    next.stopFading();
    next.reset().setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
    next.clampWhenFinished=true;next.setEffectiveWeight(1).setEffectiveTimeScale(speed).play();
    if(phase!==null)next.time=phase*next.getClip().duration;
    if(sourceClip){
      const source=this.mixer.clipAction(sourceClip);
      source.setLoop(sourceLoop,sourceLoop===THREE.LoopRepeat?Infinity:1);source.clampWhenFinished=true;
      source.time=sourceTime;
      // Native outgoing clock is wall time, independent of the old clip speed.
      source.setEffectiveTimeScale(1);
      source.play().fadeOut(fade);next.fadeIn(fade);
      this.transitions.set(channel,source);this.retiring.set(source,fade);
    }
    this.channels.set(channel,next);this.channelRevision++;return next;
  }
  stopChannel(channel){this.clearTransition(channel);this.nextFadePadding.delete(channel);const action=this.channels.get(channel);if(action){action.stop();this.channels.delete(channel);this.channelRevision++;}}
  playbackTimes(){return Object.fromEntries([...this.channels].map(([channel,action])=>[channel,action.time]));}
  capturePose(bones){return captureAnimationPose(bones,this.channels,this.retiring);}
  preparePoseSampling(){prepareAnimationPoseSampling(this.channels);}
  poseKeys(bones){
    const cached=this.poseKeyCache.get(bones);
    if(cached?.revision===this.channelRevision)return cached.keys;
    const names=new Map([...bones].map(([name,bone])=>[bone.uuid,name])),keys=new Map();
    for(const action of this.channels.values())for(const track of action.getClip().tracks){
      const name=names.get(track.name.split('.')[0]);if(name)keys.set(name,action.getClip().name);
    }
    this.poseKeyCache.set(bones,{revision:this.channelRevision,keys});return keys;
  }
  inheritPlayback(times){
    for(const [channel,time] of Object.entries(times||{})){
      const action=this.channels.get(channel);
      if(action&&action.loop===THREE.LoopRepeat&&Number.isFinite(time))action.time=time%action.getClip().duration;
    }
    this.mixer.update(0);
  }
  stopAll(){for(const channel of [...this.transitions.keys()])this.clearTransition(channel);this.mixer.stopAllAction();this.channels.clear();this.retiring.clear();this.nextFadePadding.clear();this.channelRevision++;}
  update(dt,times={}){this.mixer.update(dt);for(const [channel,action] of this.transitions){
    const remaining=this.retiring.get(action);
    if(remaining<=dt)this.clearTransition(channel);else this.retiring.set(action,remaining-dt);
  }
    let seek=false;
    for(const [channel,time] of Object.entries(times)){
      const action=this.channels.get(channel);
      if(action&&Number.isFinite(time)){
        const duration=action.getClip().duration,positiveTime=Math.max(0,time);
        action.time=action.loop===THREE.LoopRepeat&&duration>0?positiveTime%duration:Math.min(positiveTime,duration);
        seek=true;
      }
    }
    if(seek)this.mixer.update(0);
  }
}
