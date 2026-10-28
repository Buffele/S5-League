import {LoopOnce} from 'three';
import {capturePose,newProject} from './animation-project.js';

// Sampling is independent of storage/UI. It never edits source clip tracks.
export function projectFromClip(avatar,clip,{name=clip.name,outfit='01',fps=15}={}){
 const duration=Math.max(.1,clip.duration);
 if(duration>60)throw Error('Cette animation dépasse 60 secondes.');
 const count=Math.min(900,Math.max(1,Math.ceil(duration*fps)));
 const project=newProject(capturePose(avatar.bones),{name,sex:avatar.sex,outfit,duration});project.keys=[];
 avatar.mixer.stopAllAction();
 const action=avatar.mixer.clipAction(clip);action.reset().setLoop(LoopOnce,1);
 action.clampWhenFinished=true;action.setEffectiveWeight(1);action.play();
 try{
  for(let i=0;i<=count;i++){
   action.time=i*duration/count;avatar.mixer.update(0);
   project.keys.push({time:i*duration/count,ease:'linear',pose:capturePose(avatar.bones)});
  }
 }finally{avatar.mixer.stopAllAction();}
 return project;
}
