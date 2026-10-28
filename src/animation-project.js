import {Quaternion} from 'three';

export const PROJECT_FORMAT='s5-animation';
export const PROJECT_VERSION=1;
export const copy=value=>JSON.parse(JSON.stringify(value));
const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6);

export function capturePose(bones){
 return Object.fromEntries([...bones].map(([name,b])=>[name,{p:b.position.toArray(),q:b.quaternion.toArray(),s:b.scale.toArray()}]));
}
export function captureLocalRotation(bone){return bone.quaternion.toArray();}
export function applyLocalRotation(bone,rotation){
 if(!finiteArray(rotation,4)||Math.abs(Math.hypot(...rotation)-1)>.01)throw Error('Rotation copiée invalide.');
 bone.quaternion.fromArray(rotation);
}
export function applyPose(bones,pose){
 for(const [name,v] of Object.entries(pose)){
  const b=bones.get(name);if(!b)continue;
  b.position.fromArray(v.p);b.quaternion.fromArray(v.q);b.scale.fromArray(v.s);
 }
}
export function newProject(pose,{name='Mon animation',sex='male',outfit='01',duration=2}={}){
 return {format:PROJECT_FORMAT,version:PROJECT_VERSION,name,sex,outfit,duration,loop:true,keys:[
  {time:0,ease:'smooth',pose:copy(pose)},{time:duration,ease:'smooth',pose:copy(pose)},
 ]};
}
export function validateProject(input){
 if(!input||input.format!==PROJECT_FORMAT||input.version!==PROJECT_VERSION)throw Error('Format de projet non reconnu (S5 Animation v1 attendu).');
 if(typeof input.name!=='string'||input.name.length>100)throw Error('Nom de projet invalide.');
 if(!['male','female'].includes(input.sex)||!['01','02'].includes(input.outfit))throw Error('Personnage non reconnu.');
 if(!Number.isFinite(input.duration)||input.duration<.1||input.duration>60)throw Error('Durée autorisée : 0,1 à 60 secondes.');
 if(!Array.isArray(input.keys)||input.keys.length<1||input.keys.length>2000)throw Error('Le projet doit contenir 1 à 2 000 poses clés.');
 let previous=-1,names=null;
 for(const k of input.keys){
  if(!Number.isFinite(k.time)||k.time<0||k.time>input.duration+1e-8||k.time<=previous)throw Error('Les poses doivent avoir des temps distincts, triés dans la durée du projet.');
  previous=k.time;
  if(!['linear','smooth','step'].includes(k.ease)||!k.pose||typeof k.pose!=='object'||Array.isArray(k.pose))throw Error('Pose ou interpolation invalide.');
  const entries=Object.entries(k.pose),current=entries.map(([n])=>n).sort().join('|');
  if(!entries.length||entries.length>300||names!==null&&names!==current)throw Error('Le squelette doit rester identique entre les poses.');
  names=current;
  for(const [n,v] of entries){
   if(!n||n.length>120||['__proto__','constructor','prototype'].includes(n)||!v||!finiteArray(v.p,3)||!finiteArray(v.q,4)||!finiteArray(v.s,3)||v.s.some(x=>x<=0)||Math.abs(Math.hypot(...v.q)-1)>.01)throw Error('Transformation invalide : '+n);
  }
 }
 return {...copy(input),loop:!!input.loop};
}
export function sampleProject(project,time){
 const keys=project.keys,t=Math.max(0,Math.min(project.duration,time));
 if(t<=keys[0].time)return copy(keys[0].pose);
 if(t>=keys.at(-1).time)return copy(keys.at(-1).pose);
 let i=0;while(i+1<keys.length&&keys[i+1].time<=t)i++;
 const a=keys[i],b=keys[i+1];let f=(t-a.time)/(b.time-a.time);
 if(a.ease==='step')f=0;else if(a.ease==='smooth')f=f*f*(3-2*f);
 const qa=new Quaternion(),qb=new Quaternion();
 return Object.fromEntries(Object.entries(a.pose).map(([name,v])=>{
  const w=b.pose[name];qa.fromArray(v.q);qb.fromArray(w.q);qa.slerp(qb,f).normalize();
  return [name,{p:v.p.map((x,j)=>x+(w.p[j]-x)*f),q:qa.toArray(),s:v.s.map((x,j)=>x+(w.s[j]-x)*f)}];
 }));
}
export function putKey(project,time,pose,ease='smooth'){
 const t=Math.max(0,Math.min(project.duration,time));
 const existing=project.keys.findIndex(k=>Math.abs(k.time-t)<1e-5);
 const key={time:t,ease,pose:copy(pose)};
 if(existing>=0)project.keys[existing]=key;else project.keys.push(key);
 project.keys.sort((a,b)=>a.time-b.time);
 return project.keys.indexOf(key);
}
export function resizeProject(project,duration){
 if(!Number.isFinite(duration)||duration<.1||duration>60)throw Error('Durée autorisée : 0,1 à 60 secondes.');
 const ratio=duration/project.duration;
 project.keys.forEach(k=>k.time*=ratio);project.duration=duration;
}
export class ProjectHistory{
 constructor(limit=30){this.limit=limit;this.undoStack=[];this.redoStack=[];}
 push(project){this.undoStack.push(copy(project));if(this.undoStack.length>this.limit)this.undoStack.shift();this.redoStack=[];}
 undo(project){if(!this.undoStack.length)return null;this.redoStack.push(copy(project));return this.undoStack.pop();}
 redo(project){if(!this.redoStack.length)return null;this.undoStack.push(copy(project));return this.redoStack.pop();}
}
