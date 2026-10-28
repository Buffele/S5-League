import * as THREE from 'three';
export {createChaserViewPass} from './chaser-vision.js';
import {readAsset} from './scene-assets.js';
import {createFumbi} from './fumbi.js';
import {loadEffectRuntime} from './combat-effects.js';
import {createChaserEntityEvents} from './chaser-entity-events.js';
import {createChaserAuraEvents} from './chaser-aura-events.js';

export function chaserVisualState(state,localDead=false,visible=true){
 const active=visible&&state?.mode==='chaser'&&['preparation','playing','intermission'].includes(state.phase);
 return {entity:!!active,monochrome:!!active&&state.chaser==='local'&&!localDead&&(state.phase!=='intermission'||state.outcome==='chaser-victory')};
}
// Chaser changes the image treatment, never the normal camera framing.
export function chaserCameraDistance(){return 0;}
// The hunting overlay belongs to an eligible opponent's animated torso, never
// to the local Chaser or to a fixed point on the screen.
export function chaserTargetAnchor(state,records){
 if(state?.mode!=='chaser'||state.chaser!=='local'||!['preparation','playing'].includes(state.phase)||!state.bonus||state.bonus===state.chaser)return null;
 const record=records.find(r=>r.id===state.bonus&&r.id!=='local'&&!r.health?.dead&&state.players.get(r.id)?.alive&&state.survivors.includes(r.id));
 if(!record)return null;
 const torso=record.avatar.bones?.get('Bip01 Spine2')??record.avatar.bones?.get('Bip01 Spine1');
 let position;
 if(torso){torso.updateWorldMatrix(true,false);position=torso.getWorldPosition(new THREE.Vector3());}
 else{position=record.avatar.group.getWorldPosition(new THREE.Vector3());position.y+=1.1;}
 return {id:record.id,position};
}
export function chaserSpectatorTarget(state,dead,combat){
 if(state?.mode!=='chaser'||!['playing','intermission'].includes(state.phase)||state.chaser==='local')return null;
 const lost=state.phase==='intermission'&&state.outcome==='chaser-victory';
 if(!dead&&!lost)return null;
 return combat?.bots?.find(b=>b.id===state.chaser)?.avatar.group.position??null;
}
export async function loadChaserPresentation(scene,{effects=true}={}){
 const data=await readAsset('/assets/s5runtime/chaser/grimreaper.json'),entity=await createFumbi(data,{name:'Chaser / native Grim Reaper'});
 const entityEvents=createChaserEntityEvents(entity.animation,Object.fromEntries(data.clips.map(c=>[c.name,c.durationTicks/4800])));
 const effectAvatar={group:entity,bones:new Map()};entity.traverse(o=>{if(o.name)effectAvatar.bones.set(o.name,o);});
 const anchor=new THREE.Group();anchor.name='Chaser entity attachment';anchor.add(entity);scene.add(anchor);anchor.visible=false;
 // The imported avatar faces local -Z; local +Z is behind its shoulders.
 entity.scale.setScalar(.006);entity.position.set(-.35,.12,1.65);
 // `base` leaves almost every bone static (the exported reference pose).
 // MD001 is the native normal state; event clips are selected by the dispatcher.
 entity.animation.play('MD001');entity.animation.update(0,{stationary:true});
 const effectGroup=new THREE.Group();effectGroup.name='Chaser native auras';scene.add(effectGroup);
 const runtime=effects?await loadEffectRuntime(effectGroup,{...await readAsset('/assets/s5runtime/chaser/effects.json'),...await readAsset('/assets/s5runtime/chaser/kill-effects.json')}):null;
 let killCursor=0,killRound=null,killState=null,killEvents=null;
 const auraEvents=createChaserAuraEvents(runtime);
 let effectKey='',presence=null;
 const materials=[];entity.traverse(o=>{if(o.isMesh)for(const material of [].concat(o.material)){materials.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});}});
 return {anchor,entity,excluded:[anchor,effectGroup],snapshot(){
  return Object.freeze({presence:presence?Object.freeze({age:presence.age,clock:presence.clock,loop:presence.loop===true,attachment:presence.avatar===effectAvatar?'grim-reaper':presence.avatar?'other':null,particleNodes:presence.nodes.filter(node=>node.particles).length}):null});
 },hide(){anchor.visible=false;effectGroup.visible=false;auraEvents.reset();runtime?.clear();presence=null;effectKey='';entityEvents.reset();killRound=killState=null;killCursor=0;},render(dt,{match,combat,avatar,camera,visible=true}){
  const state=match?.state,view=chaserVisualState(state,match?.health.dead,visible);
  const record=state?.chaser==='local'?{avatar,health:combat?.playerState}:combat?.bots?.find(b=>b.id===state?.chaser);
  anchor.visible=view.entity&&!!record&&(!record.health?.dead||state.phase==='intermission');
  if(view.entity)entityEvents.update(dt,state);else entityEvents.reset();
  if(anchor.visible){record.avatar.group.getWorldPosition(anchor.position);record.avatar.group.getWorldQuaternion(anchor.quaternion);entity.animation.update(dt,{stationary:true});anchor.updateWorldMatrix(true,true);}
  const active=view.entity&&!!state?.players;
  effectGroup.visible=active;
  const key=active?`${state.round}|${state.chaser}`:'';
  // A replay can keep both round and role while replacing the event stream.
  // Clear every effect owned by the previous session before consuming the new
  // stream; resetting only the kill cursor leaves its live sequences behind.
  const newSession=active&&(killState!==state||killEvents!==state.events||state.eventSerial<killCursor);
  if(key!==effectKey||newSession){auraEvents.reset();runtime?.clear();presence=null;effectKey=key;}
  if(active){
   if(killState!==state||killEvents!==state.events||killRound!==state.round||state.eventSerial<killCursor){killState=state;killEvents=state.events;killRound=state.round;killCursor=state.eventSerial??0;}
   for(const event of state.events||[]){
    if(event.serial<=killCursor)continue;killCursor=event.serial;
    if(event.type==='kill'&&event.victim!==state.chaser&&record)runtime?.play('ggrim_kill',entity.getWorldPosition(new THREE.Vector3()),effectAvatar,{follow:true});
   }
   const records=[{id:'local',avatar,health:combat?.playerState},...(combat?.bots||[])];
   auraEvents.update(dt,state,records);
   // Customary sequence: native B09A80 retains one instance at owner+274;
   // B07810 binds it to the Grim Reaper scene at owner+70. The SEQ header
   // enables its internal loop, including during the owner's result pose.
   if(anchor.visible&&!presence)presence=runtime?.play('ggrim',entity.getWorldPosition(new THREE.Vector3()),effectAvatar,{follow:true,loop:true});
   const target=chaserTargetAnchor(state,records);
   match?.ui?.setTargetPosition?.(target?.position,camera,!!target,target?.id);
   runtime?.update(dt);if(camera)runtime?.render(camera);
  }else{match?.ui?.setTargetPosition?.(null,camera,false);auraEvents.reset();runtime?.clear();presence=null;}
  if(anchor.visible){
   const preparation=state.phase==='preparation',duration=state.round===1?state.rules?.firstPreparation??7:state.rules?.preparation??4;
   const emergence=preparation?THREE.MathUtils.smoothstep(1-state.pause/duration,0,.85):1;
   entity.scale.setScalar(.006*(.35+.65*emergence));
   record.avatar.group.getWorldPosition(anchor.position);record.avatar.group.getWorldQuaternion(anchor.quaternion);
   for(const entry of materials){entry.previousTransparent=entry.material.transparent;entry.material.opacity=entry.opacity;entry.material.transparent=entry.transparent;entry.material.depthWrite=entry.depthWrite;}
   // Preserve the ordinary camera; fade surfaces if a wall pushes it close.
   const fade=(view.monochrome ? .5 : .75)*(.2+.8*emergence)*(view.monochrome&&camera?THREE.MathUtils.clamp((camera.position.distanceTo(anchor.position)-2)/3,.15,1):1);
   if(fade<1)for(const {material} of materials){material.opacity*=fade;material.transparent=true;material.depthWrite=false;}
   for(const entry of materials)if(entry.material.transparent!==entry.previousTransparent)entry.material.needsUpdate=true;
  }
  return view.monochrome;
 }};
}
