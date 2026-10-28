import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectScene} from './effect-scene.js';

const BASE='/assets/s5runtime/chaser/ui/effects/';
// Source scenes/tracks are unchanged. Event binding, orthographic fitting and
// overlay depth policy are explicit S5 presentation adaptations.
const PLACEMENTS={inter_bs_chaser_1:[860,0,100],inter_bs_chaser_2:[860,0,100],bs_bonus_target:[110,0,0],win:[800,0,0],lose:[800,0,0],'score_+5':[180,0,-120],'score_+15':[180,0,-120],inter_winner_result:[900,0,0],inter_lose_result:[900,0,0],inter_match_stop:[900,0,0]};
export async function loadChaserHudEffects(_scene=null){
 const manifest=await readAsset(BASE+'manifest.json'),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-512,512,384,-384,.1,20000),entries=new Map();camera.position.z=10000;
 const destroy=()=>{for(const e of entries.values()){e.wrapper.removeFromParent();for(const mesh of e.effect.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}}entries.clear();};
 try{
  for(const [name,placement]of Object.entries(PLACEMENTS)){
   const metadata=manifest.find(m=>m.source==='uieffect/'+name+'.scn');if(!metadata)throw Error('Missing authenticated Chaser scene '+name);
   const data=await readAsset(BASE+name+'.json');if(data.source!==metadata.source||data.models.length!==metadata.models||data.models.some(m=>Object.keys(m.effectAnimation||{}).length&&!Object.hasOwn(m.effectAnimation,metadata.clip)))throw Error('Chaser scene/manifest mismatch '+name);
   const effect=await loadEffectScene(data,{animation:metadata.clip,loop:false}),wrapper=new THREE.Group();wrapper.name=name;wrapper.add(effect.group);scene.add(wrapper);
   const entry={name,effect,wrapper,duration:metadata.duration,age:Infinity,loop:name==='bs_bonus_target',evaluations:0};entries.set(name,entry);
   effect.update(Math.min(.25,metadata.duration/2));const box=new THREE.Box3().setFromObject(effect.group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());if(!Number.isFinite(size.x)||size.x<=0)throw Error('Invalid Chaser HUD bounds '+name);
   const scale=placement[0]/size.x;wrapper.scale.setScalar(scale);wrapper.position.set(placement[1]-center.x*scale,placement[2]-center.y*scale,-center.z*scale);
   entry.origin=wrapper.position.clone();
   for(const mesh of effect.meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.depthTest=false;material.depthWrite=false;}
   effect.update(0);wrapper.visible=false;
  }
 }catch(error){destroy();throw error;}
 let visible=false,disposed=false,round=null,bonus=null,lastPhase='',cursor=0,eventList=null,targetPoint=null,targetId=null,hunting=false;
 const conceal=()=>{visible=false;targetPoint=null;targetId=null;for(const e of entries.values())e.wrapper.visible=false;};
 const play=name=>{const e=entries.get(name);e.age=0;};
 const reset=()=>{round=null;bonus=null;lastPhase='';cursor=0;eventList=null;for(const e of entries.values())e.age=Infinity;conceal();};
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),size=new THREE.Vector2();
 return {
  reset,hide:conceal,
  setTargetPosition(position,viewCamera,show,id){
   if(disposed)return;
   const point=show&&position&&viewCamera&&id&&id!=='local'?position.clone().project(viewCamera):null;
   const valid=point&&[point.x,point.y,point.z].every(Number.isFinite)&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1&&Math.abs(point.z)<=1;
   targetPoint=valid?point:null;targetId=valid?id:null;
   entries.get('bs_bonus_target').wrapper.visible=!!(visible&&hunting&&targetPoint&&targetId===bonus);
  },
  update(dt,state,show){
   if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Chaser HUD dt');
   if(eventList!==state.events||state.eventSerial<cursor){eventList=state.events;cursor=0;}
   if(!show){conceal();cursor=state.eventSerial;return;}
   visible=true;const active=['preparation','playing'].includes(state.phase);
   hunting=active&&state.chaser==='local'&&state.bonus!=='local'&&!!state.players.get(state.bonus)?.alive&&!!state.players.get('local')?.alive;
   if(active&&(state.round!==round||(state.phase==='preparation'&&lastPhase!=='preparation'))){entries.get('inter_bs_chaser_1').age=entries.get('inter_bs_chaser_2').age=Infinity;play(state.chaser==='local'?'inter_bs_chaser_1':'inter_bs_chaser_2');}round=state.round;
   if(state.bonus!==bonus){bonus=state.bonus;entries.get('bs_bonus_target').age=bonus?0:Infinity;}
   if(state.phase==='intermission'&&lastPhase!=='intermission'){
    const local=state.players.get('local'),won=state.chaser==='local'?state.outcome==='chaser-victory':state.outcome!=='chaser-victory'&&local.alive;play(won?'win':'lose');
   }
   if(state.phase==='result'&&lastPhase!=='result'){play('inter_match_stop');if(state.winner!==null)play(state.winner==='local'?'inter_winner_result':'inter_lose_result');}
   for(const event of state.events)if(event.serial>cursor&&event.type==='points'&&event.id==='local'&&(event.points===5||event.points===15))play('score_+'+event.points);
   cursor=state.eventSerial;lastPhase=state.phase;
   for(const e of entries.values()){
    e.age+=dt;const bonusScene=e.name==='bs_bonus_target',roleScene=e.name.startsWith('inter_bs_chaser_');e.wrapper.visible=Number.isFinite(e.age)&&(e.loop||e.age<e.duration)&&(!bonusScene||hunting&&!!targetPoint&&targetId===bonus)&&(!roleScene||active);
    if(!e.wrapper.visible)continue;e.effect.update(e.loop?e.age%e.duration:e.age);e.evaluations++;
   }
  },
  render(renderer){
   if(disposed||!visible||![...entries.values()].some(e=>e.wrapper.visible))return;
   const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getSize(size);
   try{
    renderer.setRenderTarget(null);renderer.autoClear=false;renderer.setScissorTest(false);const scale=Math.min(size.x/1024,size.y/768);
    renderer.setViewport((size.x-1024*scale)/2,(size.y-768*scale)/2,1024*scale,768*scale);
    const bonusEntry=entries.get('bs_bonus_target');
    // Undo the HUD's letterbox fitting so the animated target follows the same
    // full-canvas NDC point as the opponent, on wide and portrait screens.
    if(bonusEntry.wrapper.visible&&targetPoint)bonusEntry.wrapper.position.copy(bonusEntry.origin).add(new THREE.Vector3(targetPoint.x*size.x/(2*scale),targetPoint.y*size.y/(2*scale),0));
    for(const e of entries.values())if(e.wrapper.visible)e.effect.render(camera);renderer.render(scene,camera);
   }
   finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=autoClear;}
  },
  snapshot(){return {visible,disposed,nativeReady:false,scenes:[...entries.values()].map(e=>({name:e.name,visible:e.wrapper.visible,age:e.age,evaluations:e.evaluations,group:e.wrapper}))};},
  dispose(){if(disposed)return;disposed=true;conceal();destroy();}
 };
}
