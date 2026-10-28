import {prepareSourceEffectHierarchy} from './rocket-launcher-effect-hierarchy.js';

// These two decoded scenes have unique named bones and one authored clip.
// Qualify them here rather than enabling a new hierarchy on every effect.
const profiles=Object.freeze({
 'effects/eff_bat_jumpattack.scn':{animation:'JUMP_ATTACK',models:2,bones:['Dummy01','Dummy02']},
 'effects/eff_bat_wind.scn':{animation:'WIND EFF3',models:0,bones:['Dummy01','Dummy02']},
});
export function prepareBatEffectHierarchy(data,group,nodes,{animation,loop=false}={}){
 const profile=profiles[data.source];
 if(!profile||animation!==profile.animation||data.models.length!==profile.models||data.bones.map(b=>b.name).join('|')!==profile.bones.join('|')||data.clips.length!==1||data.clips[0].name!==animation)throw Error('Unqualified Bat effect hierarchy/clip');
 for(const bone of data.bones){
  if(!nodes.has(bone.name)||!bone.animations[animation]?.data||bone.animations[animation].copy)throw Error('Missing exact Bat effect dummy/track');
 }
 return prepareSourceEffectHierarchy(data,group,nodes,{animation,loop});
}
