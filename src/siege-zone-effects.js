import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadSiegeIndicator} from './siege-indicator-scene.js';
import {loadSiegeBase} from './siege-base-scene.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {siegeIndicatorSelection,siegeIndicatorAnchor} from './siege-indicator-policy.js';

const BASE='/assets/mode-world-effects/';
export function createSiegeZoneEffects({scene,zones,team,read=readAsset,load=loadSiegeIndicator,loadBase=loadSiegeBase}){
 if(!scene||!Array.isArray(zones)||!['alpha','beta'].includes(team))throw Error('Explicit Siege visual context required');
 const root=new THREE.Group();root.name='siege-zone-effects';scene.add(root);
 const slots=new Map(zones.map(zone=>{const wrapper=new THREE.Group(),p=siegeIndicatorAnchor(zone.core);wrapper.position.set(p.x,p.y,p.z);wrapper.scale.setScalar(SCN_SCENE_SCALE);root.add(wrapper);return [zone.id,{wrapper,current:null,wanted:null,pending:null,age:0,error:null,bases:null,basePending:null,baseError:null,baseWanted:null,baseStage:null}];}));
 let disposed=false;
 const disposeEffect=effect=>{effect.group.removeFromParent();for(const mesh of effect.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}};
 const bindCamera=effect=>{let frame=-1;for(const mesh of effect.meshes)mesh.onBeforeRender=(renderer,_scene,camera)=>{if(renderer.info.render.frame!==frame){frame=renderer.info.render.frame;effect.render(camera);}};};
 async function prepareBases(slot){
  const token={};slot.basePending=token;const bases=new Map();
  try{
   const manifest=await read(BASE+'manifest.json');
   for(const colour of ['red','green']){
    if(disposed||slot.basePending!==token)break;
    const source='model/background/indicator_base_'+colour+'.scn',meta=manifest.assets.find(r=>r.source===source);if(!meta)throw Error('Missing Siege auxiliary source '+source);
    const data=await read(BASE+meta.file);if(data.source!==source)throw Error('Siege auxiliary source mismatch');
    const effect=await loadBase(data);effect.group.name='siege-base-'+colour;effect.group.visible=false;bindCamera(effect);bases.set(colour,{effect,age:0});
   }
   if(disposed||slot.basePending!==token){for(const {effect}of bases.values())disposeEffect(effect);return;}
   slot.bases=bases;for(const {effect}of bases.values())slot.wrapper.add(effect.group);slot.basePending=null;slot.baseError=null;
  }catch(error){for(const {effect}of bases.values())disposeEffect(effect);if(!disposed&&slot.basePending===token){slot.basePending=null;slot.baseError=error.message;}}
 }
 async function select(slot,selection){
  slot.wanted=selection.name;const token={};slot.pending=token;
  try{
   const manifest=await read(BASE+'manifest.json'),meta=manifest.assets.find(r=>r.source===selection.source);
   // green0/red0 are absent in the source index; retain the prior observed
   // resource instead of substituting a fabricated coloured zero model.
   if(!meta){if(slot.pending===token){slot.pending=null;slot.error='Source model absent: '+selection.source;}return;}
   const data=await read(BASE+meta.file);if(data.source!==selection.source)throw Error('Siege scene identity mismatch');
   if(disposed||slot.pending!==token)return;
   const effect=await load(data,{animation:selection.clip,loop:selection.loop});
   if(disposed||slot.pending!==token){disposeEffect(effect);return;}
   if(slot.current)disposeEffect(slot.current.effect);
   // The main scene renderer supplies the actual camera. Update billboards
   // once per renderer frame, without another render pass or main.js hook.
   bindCamera(effect);
   effect.group.name=selection.name;
   slot.current={name:selection.name,effect};slot.wrapper.add(effect.group);slot.age=0;effect.update(0);slot.pending=null;slot.error=null;
  }catch(error){if(!disposed&&slot.pending===token){slot.pending=null;slot.error=error.message;}}
 }
 return {
  update(dt,state,{visible=true}={}){
   if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Siege visual delta');
   root.visible=visible&&state.phase==='playing';
   for(const [id,slot]of slots){
    const point=state.points.get(id);if(!point)throw Error('Missing Siege visual point '+id);
    const captureTeam=point.core?state.players.get(point.core)?.team:point.owner;
    // Existing S5 state clears its partial gauge when capturing completes.
    // Its owned idle state is explicitly projected as a full native gauge.
    const gauge=point.progress>0?point.progress:point.owner?state.rules.gaugeMaximum:0;
    const selection=siegeIndicatorSelection({gauge,maximum:state.rules.gaugeMaximum,captureTeam:captureTeam??null,owner:point.owner,localTeam:team});
    // AEE448..AEE473 returns on an unchanged cached stage, before changing
    // auxiliary visibility or restarting its named animation.
    if(slot.baseStage!==selection.stage){slot.baseWanted=selection.base;slot.baseStage=selection.stage;}
    if(!slot.bases&&!slot.basePending&&!slot.baseError)void prepareBases(slot);
    if(slot.bases)for(const [colour,base]of slot.bases){base.effect.group.visible=colour===slot.baseWanted.colour;if(root.visible)base.age+=dt;base.effect.setClip(slot.baseWanted.clip,base.age);if(root.visible)base.effect.update(base.age);}
    if(selection.name!==slot.wanted)void select(slot,selection);
    if(root.visible&&slot.current){slot.age+=dt;slot.current.effect.update(slot.age);}
   }
  },
  render(camera){if(!disposed&&root.visible)for(const slot of slots.values()){slot.current?.effect.render(camera);for(const base of slot.bases?.values()??[])if(base.effect.group.visible)base.effect.render(camera);}},
  hasModel(id){return !!slots.get(id)?.current;},
  reset(){for(const slot of slots.values()){slot.pending=null;slot.wanted=null;slot.age=0;slot.error=null;slot.basePending=null;slot.baseError=null;slot.baseWanted=null;slot.baseStage=null;if(slot.current){disposeEffect(slot.current.effect);slot.current=null;}for(const {effect}of slot.bases?.values()??[])disposeEffect(effect);slot.bases=null;}},
  snapshot(){return {disposed,visible:root.visible,nativeStateProjectionVerified:false,nativeCompared:false,baseOverlayIncluded:[...slots.values()].every(s=>s.bases?.size===2),points:[...slots].map(([id,s])=>({id,wanted:s.wanted,loaded:s.current?.name??null,pending:!!s.pending,error:s.error,bases:{requested:s.baseWanted,pending:!!s.basePending,error:s.baseError,loaded:s.bases?[...s.bases].map(([colour,b])=>({colour,visible:b.effect.group.visible,clip:b.effect.snapshot().selected})):[]}}))};},
  dispose(){if(disposed)return;disposed=true;for(const slot of slots.values()){slot.pending=null;slot.basePending=null;if(slot.current)disposeEffect(slot.current.effect);for(const {effect}of slot.bases?.values()??[])disposeEffect(effect);}root.removeFromParent();slots.clear();},
 };
}
