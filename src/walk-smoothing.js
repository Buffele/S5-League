import * as THREE from 'three';
import {SPY_DAGGER_LOCOMOTION} from './spy-dagger-data.js';

// Presentation experiment only. RunState/NormalState mappings, native assets,
// controller clocks, displacement and attack clips remain authoritative.
export const SMOOTH_WALK_PREFIX='SMOOTH_WALK_';
export const smoothWalkName=name=>SMOOTH_WALK_PREFIX+name;
export const isSmoothWalk=name=>name?.startsWith(SMOOTH_WALK_PREFIX)===true;
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const normalize=v=>{const length=Math.hypot(...v);return v.map(x=>x/length);};
const align=(v,to)=>dot(v,to)<0?v.map(x=>-x):v;

// Normalized quaternion Hermite interpolation removes angular-velocity corners
// between sparse slerp segments. Positions use monotone Hermite tangents to
// avoid overshooting the authored stride. Keep every original sample time.
export function smoothWalkTrack(track,duration,{fps=120}={}){
  const quaternion=track.ValueTypeName==='quaternion',width=track.getValueSize();
  if(!Number.isFinite(fps)||fps<1||!Number.isFinite(duration)||duration<=0)throw Error('Invalid walk sampling');
  const times=Array.from(track.times),count=times.length;
  if(count<3||times.some((t,i)=>i&&t<=times[i-1]))return track;
  const values=times.map((_,i)=>Array.from(track.values.slice(i*width,(i+1)*width)));
  if(quaternion){
    for(let i=0;i<count;i++){
      values[i]=normalize(values[i]);
      if(i)values[i]=align(values[i],values[i-1]);
    }
  }
  const sameEnds=quaternion?Math.abs(dot(values[0],values.at(-1)))>1-1e-6:
    values[0].every((v,j)=>Math.abs(v-values.at(-1)[j])<1e-4);
  const cyclic=sameEnds&&Math.abs(times[0])<1e-6&&Math.abs(times.at(-1)-duration)<1e-6;
  const slopes=values.map((v,i)=>{
    let prev=i-1,next=i+1,tPrev=times[prev],tNext=times[next];
    if(cyclic&&(i===0||i===count-1)){prev=count-2;next=1;tPrev=times[prev]+(i===0?-duration:0);tNext=times[next]+(i===0?0:duration);}
    if(prev<0)return v.map((x,j)=>(values[1][j]-x)/(times[1]-times[0]));
    if(next>=count)return v.map((x,j)=>(x-values[i-1][j])/(times[i]-times[i-1]));
    const p=quaternion?align(values[prev],v):values[prev],n=quaternion?align(values[next],v):values[next];
    const before=times[i]-tPrev,after=tNext-times[i];
    let tangent=v.map((x,j)=>{
      const left=(x-p[j])/before,right=(n[j]-x)/after;
      if(quaternion)return (left*after+right*before)/(before+after);
      if(left*right<=0)return 0;
      const w1=2*after+before,w2=after+2*before;
      return (w1+w2)/(w1/left+w2/right);
    });
    // Quaternion derivatives must lie on the tangent plane of the unit sphere.
    if(quaternion){const radial=dot(tangent,v);tangent=tangent.map((x,j)=>x-radial*v[j]);}
    return tangent;
  });
  const end=Math.min(duration,times.at(-1));
  const samples=new Set(times);
  for(let frame=0;frame<=Math.ceil(end*fps);frame++)samples.add(Math.fround(Math.min(frame/fps,end)));
  const bakedTimes=[...samples].sort((a,b)=>a-b),baked=[];
  let segment=0;
  for(const t of bakedTimes){
    while(segment<count-2&&times[segment+1]<t)segment++;
    if(t<=times[0]){baked.push(...values[0]);continue;}
    if(t>=times.at(-1)){baked.push(...values.at(-1));continue;}
    const span=times[segment+1]-times[segment],u=(t-times[segment])/span,u2=u*u,u3=u2*u;
    const p=values[segment],n=values[segment+1];
    let value=p.map((x,j)=>(2*u3-3*u2+1)*x+(u3-2*u2+u)*span*slopes[segment][j]+
      (-2*u3+3*u2)*n[j]+(u3-u2)*span*slopes[segment+1][j]);
    if(quaternion)value=normalize(value);
    baked.push(...value);
  }
  return new track.constructor(track.name,bakedTimes,baked);
}

export function buildSmoothWalkClips(clips,bones){
  const ids=new Set([...bones].filter(([name])=>/^Bip01(?: |$)/.test(name)&&!/(Dummy|Footsteps|Nub)/i.test(name)).map(([,bone])=>bone.uuid));
  const sourceIds=new Set([...Object.values(SPY_DAGGER_LOCOMOTION.run),...Object.values(SPY_DAGGER_LOCOMOTION.runLower)]);
  return [...sourceIds].map(name=>{
    const clip=clips.find(c=>c.name===name);
    if(!clip)throw Error('Missing walk experiment source '+name);
    const tracks=clip.tracks.map(track=>{
      const [id,property]=track.name.split('.');
      return ids.has(id)&&['position','quaternion'].includes(property)?smoothWalkTrack(track,clip.duration):track;
    });
    return new THREE.AnimationClip(smoothWalkName(name),clip.duration,tracks,clip.blendMode);
  });
}

// Share gait phase when changing direction, including an A/B switch in place.
// Other states use the ordinary restart policy and source clocks.
export function withSmoothWalkPhase(sample,previous){
  const oldName=previous?.getClip().name;
  if(!oldName||(!isSmoothWalk(sample.clip)&&!isSmoothWalk(oldName))||oldName===sample.clip+':upper')return sample;
  const source=oldName.replace(SMOOTH_WALK_PREFIX,'').replace(/:upper$/,'');
  const ids=Object.values(SPY_DAGGER_LOCOMOTION.run);
  if(!ids.includes(source)||!ids.includes(sample.clip.replace(SMOOTH_WALK_PREFIX,'')))return sample;
  return {...sample,phase:previous.time/previous.getClip().duration};
}
