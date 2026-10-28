import * as THREE from 'three';
import {SPY_DAGGER_LOCOMOTION as source} from './spy-dagger-data.js';

const directionNames=['front','rightFront','right','rightBack','back','leftBack','left','leftFront'];
const legNames=new Set(['Bip01','Bip01 Pelvis',...['L','R'].flatMap(s=>['Thigh','Calf','Foot'].map(n=>`Bip01 ${s} ${n}`))]);
const wrap=v=>((v+.5)%1+1)%1-.5;
const point=m=>new THREE.Vector3().setFromMatrixPosition(m);

// A conventional phase matcher aligns the original leg cycle with the neural
// stride before pose mixing. This does not train or change the neural network.
export function createNativeFusion(reference,actor,local,rest){
 const names=new Map([...actor.bones].map(([n,b])=>[b.uuid,n]));
 const restPose=new Map([...local].map(([n,m])=>{const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();m.decompose(p,q,s);return[n,{position:p,quaternion:q,scale:s}];}));
 const clipCache=new Map(),banks=new Map();
 const legHeight=point(rest.get('Bip01')).y;
 const restDifference=point(rest.get('Bip01 L Foot')).sub(point(rest.get('Bip01 R Foot')));
 function tracks(name){
  if(clipCache.has(name))return clipCache.get(name);
  const clip=actor.actions.get(name)?.getClip();if(!clip)throw Error(`Missing original S5Runtime clip ${name}`);
  const result={name,duration:clip.duration,tracks:clip.tracks.flatMap(t=>{const [id,property]=t.name.split('.'),bone=names.get(id);return restPose.has(bone)?[{bone,property,evaluate:t.createInterpolant()}]:[];})};
  clipCache.set(name,result);return result;
 }
 function pose(clips,phase,legsOnly=false){
  const result=new Map([...restPose].filter(([n])=>!legsOnly||legNames.has(n)).map(([n,p])=>[n,{position:p.position.clone(),quaternion:p.quaternion.clone(),scale:p.scale.clone()}]));
  for(const clip of clips)for(const t of clip.tracks){const p=result.get(t.bone);if(p)p[t.property].fromArray(t.evaluate.evaluate(phase*clip.duration));}
  return result;
 }
 function feature(worlds,direction){
  const difference=point(worlds.get('Bip01 L Foot')).sub(point(worlds.get('Bip01 R Foot')));
  return [difference.clone().sub(restDifference).dot(direction)/legHeight,(difference.y-restDifference.y)/legHeight];
 }
 function worldPose(pose){
  const worlds=new Map();
  for(const d of reference.bones){const p=pose.get(d.name);if(!p)continue;const m=new THREE.Matrix4().compose(p.position,p.quaternion,p.scale);if(worlds.has(d.parent))m.premultiply(worlds.get(d.parent));worlds.set(d.name,m);}
  return worlds;
 }
 function bank(direction){
  if(banks.has(direction))return banks.get(direction);
  const clips=[tracks(source.run[direction]+':upper'),tracks(source.runLower[direction]+':lower')];
  const angle=directionNames.indexOf(direction)*Math.PI/4;
  const vector=new THREE.Vector3(Math.sin(angle),0,-Math.cos(angle));
  const samples=Array.from({length:64},(_,i)=>({phase:i/64,feature:feature(worldPose(pose(clips,i/64,true)),vector)}));
  const result={clips,vector,samples};banks.set(direction,result);return result;
 }
 let phase=0,lastFrame=null,lastDirection=null;
 return {sample(current,frame,{side=0,forward=0,weight=1}={}){
  const moving=Math.hypot(side,forward)>.05;
  const direction=directionNames[(Math.round(Math.atan2(side,forward)/(Math.PI/4))+8)%8];
  if(!moving){const idle=tracks(source.idle),idlePhase=((frame/30)/idle.duration)%1;lastFrame=frame;lastDirection=null;return {pose:pose([idle],idlePhase),phase:idlePhase,direction:'idle',clips:[source.idle]};}
  const b=bank(direction),target=feature(current,b.vector);
  const targetAngle=Math.atan2(target[1]*2,target[0]);
  const dt=lastFrame===null?1/30:Math.min(.1,Math.max(0,(frame-lastFrame)/30));
  const expected=(phase+dt/b.clips[1].duration)%1;
  let best=null,bestScore=Infinity;
  for(const s of b.samples){
   const angle=Math.atan2(s.feature[1]*2,s.feature[0]);
   const diff=Math.atan2(Math.sin(angle-targetAngle),Math.cos(angle-targetAngle));
   const continuity=lastDirection===direction?wrap(s.phase-expected):0;
   const score=diff*diff+continuity*continuity*.8;
   if(score<bestScore){best=s;bestScore=score;}
  }
  if(lastFrame!==frame||lastDirection!==direction){
   if(weight===0)phase=expected;
   else phase=(phase+Math.max(-.075,Math.min(.12,wrap(best.phase-phase)))+1)%1;
  }
  lastFrame=frame;lastDirection=direction;
  return {pose:pose(b.clips,phase),phase,direction,clips:b.clips.map(c=>c.name)};
 }};
}
