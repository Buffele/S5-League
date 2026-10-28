import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';

export const S5RUNTIME_FLYING_ASSET_ROOT='/assets/s5runtime/skill-runtime/flying';
export const S5RUNTIME_FLYING_AUDIO=Object.freeze({s5runtimeSkillFly:S5RUNTIME_FLYING_ASSET_ROOT+'/sounds/fly.ogg'});
export function s5runtimeFlyingAnimationCommand(state,{sex='male',availableClips=[]}={}){
 if(!['male','female'].includes(sex))throw Error('Unknown native rig sex');
 // Body: authenticated actorstates_gameplay.lua Skill_Fly params0..3.
 // Tick644930 applies645B20 only for active CSkillFlyState and actorByte6c==0.
 // Require the actual CSkillFlyState substate explicitly, independently of CFly.
 // CFly uses a distinct channel2 registry; its equipped target binding is pending.
 if(!Number.isInteger(state.bodySubstate)||state.bodySubstate<0||state.bodySubstate>3)return null;
 const clip=['M0000','M0001','M0002','M0001'][state.bodySubstate];
 const available=availableClips.some(c=>(typeof c==='string'?c:c.name)===clip);
 return {clip,sex,bodySubstate:state.bodySubstate,transitionVerified:false,channels:[0,1,3,4,5],speed:1,blendMs:clip==='M0002'?200:500,loop:clip==='M0001',available,nativeReady:false,
  ...(available?{}:{blocker:'native-clip-not-in-loaded-carrier'})};
}
export function s5runtimeFlyingWingAnimationCommand(state,{availableClips=[]}={}){
 // This command targets distinct native channel2. The
 // caller must establish the actual equipped wing model from native sources.
 const clips=['M0016','M0000','M0001',state.animationIndex===1?'M0003':'M0002','M0014','M0015'];
 const clip=clips[state.flyState];if(!clip)return null;
 return {clip,channel:2,targetBindingVerified:false,speed:state.flyState===1?.5:1,loop:[0,2].includes(state.flyState)||(state.flyState===3&&state.animationIndex===1),available:availableClips.some(c=>(typeof c==='string'?c:c.name)===clip),nativeReady:false};
}
export async function loadS5RuntimeFlyingAnimationDelta(sex,{reader=readAsset}={}){
 if(!['male','female'].includes(sex))throw Error('Unknown native rig sex');
 return reader(S5RUNTIME_FLYING_ASSET_ROOT+'/animations/'+sex+'.json');
}
export async function preloadS5RuntimeFlyingAudio(audio,{fetcher=fetch}={}){
 if(!audio?.context||!audio?.buffers)return {loaded:false,reason:'existing-game-audio-context-required'};
 Object.assign(audio.files,S5RUNTIME_FLYING_AUDIO);
 if(audio.buffers.has('s5runtimeSkillFly'))return {loaded:true};
 const response=await fetcher(S5RUNTIME_FLYING_AUDIO.s5runtimeSkillFly);if(!response.ok)throw Error('Missing authentic Flying audio');
 const buffer=await audio.context.decodeAudioData(await response.arrayBuffer());audio.buffers.set('s5runtimeSkillFly',buffer);return {loaded:true};
}

export async function loadS5RuntimeFlyingPresentation(scene,{reader=readAsset,effectFactory=loadEffectRuntime}={}){
 const manifest=await reader(S5RUNTIME_FLYING_ASSET_ROOT+'/manifest.json'),definitions=await reader(manifest.effectsRuntime.path);
 // Per-sequence resources use the authenticated CParticleTexture DDS lookup.
 // Resource readiness remains separate from native/render comparison gates.
 const ready=Object.fromEntries(Object.entries(definitions).filter(([name])=>manifest.sequences[name]?.resourceReady));
 const effects=await effectFactory(scene,ready);let owner=null,avatarOwner=null,ownerReset=null,ownerItem=null,lastFlyState=0,seen=new WeakSet();
 function clear(){effects.clear();owner=null;avatarOwner=null;ownerReset=null;ownerItem=null;lastFlyState=0;seen=new WeakSet();}
 return {manifest,nativeReady:false,clear,render:camera=>effects.render(camera),warmup:(renderer,camera)=>effects.warmup(renderer,camera),
  update(dt,controller,avatar,{audio=null,disabled=false}={}){
   if(owner!==controller||avatarOwner!==avatar||ownerReset!==controller.resetSerial||ownerItem!==controller.s5runtimeSkill?.itemKey){clear();owner=controller;avatarOwner=avatar;ownerReset=controller.resetSerial;ownerItem=controller.s5runtimeSkill?.itemKey;}
   if(disabled){clear();return {played:[],blocked:[]};}
   if(lastFlyState!==0&&controller.s5runtimeSkill?.flyState===0)effects.clearForAvatar?.(avatar);
   lastFlyState=controller.s5runtimeSkill?.flyState??0;const played=[],blocked=[];
   for(const event of controller.events??[]){
    if(!event||typeof event!=='object'||seen.has(event))continue;seen.add(event);
    if(event.type==='s5runtime-skill-activated'&&[3020001,3020002,3020004].includes(event.itemKey)){
     const skill=s5runtimeSkillDefinition(event.itemKey),name=skill?.action?.Seq?.Seq_Value1?.split('/').at(-1).replace(/\.seq$/i,'').toLowerCase();
     audio?.play('s5runtimeSkillFly');
     if(ready[name]){effects.play(name,controller.position,avatar,{follow:true,facing:controller.facing});played.push(name);}
     else blocked.push({itemKey:event.itemKey,reason:'sequence-resource-resolution-unverified',name});
    }
    if(event.type==='s5runtime-skill-ended')effects.clearForAvatar?.(avatar);
   }
   effects.update(dt);return {played,blocked};
  },
 };
}
