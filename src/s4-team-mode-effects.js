import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectScene} from './effect-scene.js';

const BASE='/assets/s5runtime/ui-mode-completion/team-modes/';
export const S4_TEAM_EFFECT_POLICY=Object.freeze({
 source:'Authenticated touch_red/green.scn and existing win/lose.scn tracks; SCN ticks/4800',
 binding:'S5 goal: own team green, opponent red; S5 result: win/lose; draw has no inferred scene',
 placement:'S5 orthographic 1024×768 fit, 800 source-screen pixels wide; source meshes/tracks retained',
 textures:'Explicit English-edition DDS basename bindings; original TGA/locale loader not established',
 sequence:'touch_goal.seq unresolved; SCN fragment only, not complete native SEQ',
 clock:'UI sync selects events only; main calls step(dt) exactly once per presentation frame',
 nativeBindingVerified:false,nativeCompared:false
});
export function s4TeamEffectEvent(state,{mode,team,phase=state.phase}={}){
 if(!['touchdown','deathmatch'].includes(mode)||!['alpha','beta'].includes(team))throw Error('Invalid S4 team effect context');
 if(mode==='touchdown'&&phase==='goal'){
  if(!['alpha','beta'].includes(state.scorer))throw Error('Touchdown goal requires actual scorer team');
  return state.scorer===team?'touch_green':'touch_red';
 }
 if(phase==='result'){
  if(state.winner===null)return null;
  if(!['alpha','beta'].includes(state.winner))throw Error('Result requires actual winner team or null');
  return state.winner===team?'win':'lose';
 }
 return null;
}

// Uses the existing effect-scene renderer: no independent canvas/context.
export async function loadS4TeamModeEffects({mode,team}){
 s4TeamEffectEvent({phase:'playing'},{mode,team});
 const manifest=await readAsset(BASE+'manifest.json');
 if(manifest.format!=='s4-team-mode-ui-effects-v1')throw Error('Invalid team effects manifest');
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-512,512,384,-384,.1,20000);camera.position.z=10000;
 const entries=new Map();let disposed=false,visible=false,lastPhase='',lastEvent=null;
 const cleanup=()=>{for(const e of entries.values()){e.wrapper.removeFromParent();for(const mesh of e.effect.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}}entries.clear();};
 try{
  for(const name of mode==='touchdown'?['touch_green','touch_red','win','lose']:['win','lose']){
   const meta=manifest.scenes.find(e=>e.name===name);if(!meta)throw Error('Missing team source scene '+name);
   const data=await readAsset(BASE+meta.output);
   if(data.source!==meta.source||data.models.length!==meta.models||!data.clips.some(c=>c.name===meta.clip&&c.durationTicks/4800===meta.duration))throw Error('Team source scene mismatch '+name);
   const effect=await loadEffectScene(data,{animation:meta.clip,loop:false}),wrapper=new THREE.Group();wrapper.name=name;wrapper.add(effect.group);scene.add(wrapper);
   const e={name,effect,wrapper,age:Infinity,duration:meta.duration,evaluations:0};entries.set(name,e);
   effect.update(Math.min(.25,e.duration/2));const box=new THREE.Box3().setFromObject(effect.group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   if(!Number.isFinite(size.x)||size.x<=0)throw Error('Invalid source scene bounds '+name);
   const scale=800/size.x;wrapper.scale.setScalar(scale);wrapper.position.copy(center).multiplyScalar(-scale);
   for(const mesh of effect.meshes)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){m.depthTest=false;m.depthWrite=false;}
   effect.update(0);wrapper.visible=false;
  }
 }catch(error){cleanup();throw error;}
 const conceal=()=>{visible=false;for(const e of entries.values()){e.wrapper.visible=false;e.age=Infinity;}};
 const reset=()=>{lastPhase='';lastEvent=null;for(const e of entries.values())e.age=Infinity;conceal();};
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),size=new THREE.Vector2();
 return {
  policy:S4_TEAM_EFFECT_POLICY,
  sync(state,{phase=state.phase,visible:show=true}={}){
   if(disposed)return;const event=s4TeamEffectEvent(state,{mode,team,phase});
   // Suppress hidden events rather than replaying them upon reopening menus.
   if(!show){lastPhase=phase;lastEvent=event;conceal();return;}
   visible=true;
   if(phase!==lastPhase||event!==lastEvent){for(const e of entries.values()){e.age=Infinity;e.wrapper.visible=false;}if(event){const e=entries.get(event);e.age=0;e.effect.update(0);e.evaluations++;e.wrapper.visible=true;}}
   lastPhase=phase;lastEvent=event;
  },
  step(dt){
   if(!Number.isFinite(dt)||dt<0)throw Error('Invalid team presentation delta');
   if(disposed||!visible)return;
   for(const e of entries.values()){e.age+=dt;e.wrapper.visible=e.age<e.duration;if(e.wrapper.visible&&dt>0){e.effect.update(e.age);e.evaluations++;}}
  },
  render(renderer){
   if(disposed||!visible||![...entries.values()].some(e=>e.wrapper.visible))return;
   const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getSize(size);
   try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.setScissorTest(false);const scale=Math.min(size.x/1024,size.y/768);renderer.setViewport((size.x-1024*scale)/2,(size.y-768*scale)/2,1024*scale,768*scale);for(const e of entries.values())if(e.wrapper.visible)e.effect.render(camera);renderer.render(scene,camera);}
   finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=autoClear;}
  },
  hide:conceal,reset,
  snapshot(){return {visible,disposed,policy:S4_TEAM_EFFECT_POLICY,scenes:[...entries.values()].map(e=>({name:e.name,age:e.age,duration:e.duration,visible:e.wrapper.visible,evaluations:e.evaluations,group:e.wrapper}))};},
  dispose(){if(disposed)return;reset();disposed=true;cleanup();}
 };
}
