import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectScene} from './effect-scene.js';

const BASE='/assets/s5runtime/chaser/ui/effects/';
const scenes={VICTORY:'inter_winner_result',DEFEAT:'inter_lose_result'};
export const ROOM_RESULT_ART_POLICY=Object.freeze({
 source:'Original inter_winner_result/inter_lose_result SCN meshes, UVs and tracks',
 reference:'work/waiting-room-result-ui-20261017/native-followup/native-after-result-1.png',
 projection:'Source 1024x768 coordinates; centered fit on desktop, top-aligned on compact screens with a readable DOM outcome title',
 playback:'Original five-second animation, then hold its final pose until the room deadline',
 draw:'No unverified winner/loser scene selected for a draw',
 limits:'S5 event timing and table data remain adaptations; not a full native result-sequence certification'
});
function release(entry){
 entry.effect.group.removeFromParent();
 for(const mesh of entry.effect.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}
}
export async function loadRoomResultScene(outcome){
 const name=scenes[outcome];if(!name)throw new Error('No authenticated result artwork for this outcome');
 const manifest=await readAsset(BASE+'manifest.json'),record=manifest.find(r=>r.source===`uieffect/${name}.scn`);
 if(!record||record.duration!==5)throw new Error('Original result scene manifest differs');
 const data=await readAsset(BASE+name+'.json');
 if(data.source!==record.source||data.models.length!==record.models||!data.clips.some(c=>c.name===record.clip&&c.durationTicks===record.duration*4800))throw new Error('Original result scene differs');
 const effect=await loadEffectScene(data,{animation:record.clip,loop:false});
 // The native screen draws its image strips in source order. A transparent
 // distance sort would put their brighter backing strips over the foreground.
 for(const [index,mesh]of effect.meshes.entries()){
  mesh.renderOrder=mesh.userData.sourceModelIndex??index;
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.depthTest=false;material.depthWrite=false;}
 }
 return {effect,duration:record.duration,source:record.source};
}

export function createRoomResultArtwork({load=loadRoomResultScene}={}){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-512,512,384,-384,.1,20000);camera.position.z=10000;
 const cache=new Map(),viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),size=new THREE.Vector2(),clearColor=new THREE.Color();
 let visible=false,disposed=false,outcome=null,active=null,elapsed=0,status='hidden',serial=0,error=null;
 const hide=()=>{if(!visible)return;visible=false;active=null;outcome=null;status='hidden';serial++;};
 return {
  policy:ROOM_RESULT_ART_POLICY,
  show(next,age){
   if(disposed)return;
   if(!Number.isFinite(age)||age<0)throw new RangeError('Finite result age required');
   visible=true;elapsed=age;
   if(next===outcome)return;
   outcome=next;active=null;error=null;const token=++serial;
   if(!Object.hasOwn(scenes,next)){status='unsupported';return;}
   status='loading';
   let promise=cache.get(next);
   if(!promise){
    promise=Promise.resolve().then(()=>load(next)).then(entry=>{
     if(disposed){release(entry);return null;}scene.add(entry.effect.group);return entry;
    }).catch(reason=>{if(cache.get(next)===promise)cache.delete(next);throw reason;});
    cache.set(next,promise);
   }
   promise.then(entry=>{if(!disposed&&visible&&serial===token&&entry){active=entry;status='ready';}},reason=>{
    if(!disposed&&visible&&serial===token){status='error';error=String(reason?.message??reason);}
   });
  },
  hide,
  render(renderer){
   if(disposed||!visible||!active)return false;
   const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest(),alpha=renderer.getClearAlpha();
   renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getSize(size);renderer.getClearColor(clearColor);
   try{
    const compact=size.x<=640||size.y<=480;
    active.effect.update(Math.min(elapsed,active.duration));active.effect.render(camera);
    for(const mesh of active.effect.meshes)if(mesh.name.startsWith('Winner '))mesh.visible=!compact;
    for(const child of scene.children)child.visible=child===active.effect.group;
    renderer.setRenderTarget(null);renderer.autoClear=false;renderer.setScissorTest(false);renderer.setClearColor(0x000000,1);renderer.clear(true,false,false);
    const scale=Math.min(size.x/1024,size.y/768);renderer.setViewport((size.x-1024*scale)/2,compact?size.y-768*scale:(size.y-768*scale)/2,1024*scale,768*scale);
    renderer.render(scene,camera);
   }catch(reason){
    status='error';error=String(reason?.message??reason);active=null;return false;
   }finally{
    renderer.setRenderTarget(target);renderer.setClearColor(clearColor,alpha);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=autoClear;
   }
   return true;
  },
  snapshot(){return {visible,disposed,outcome,status,error,elapsed,source:active?.source??null,cachedOutcomes:cache.size,nativeSequenceCertified:false};},
  dispose(){if(disposed)return;hide();disposed=true;for(const promise of cache.values())promise.then(entry=>{if(entry)release(entry);},()=>{});cache.clear();}
 };
}
