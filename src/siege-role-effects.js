import {readAsset} from './scene-assets.js';
import {loadSiegeIndicator} from './siege-indicator-scene.js';
import {createDefaultScnControllerClock} from './scn-controller-clock.js';
export {createDefaultScnControllerClock as createSiegeRoleClock} from './scn-controller-clock.js';

const BASE='/assets/mode-world-effects/';

// AED920 uses the selected core peer, its team's roster, then core/assist
// OBB membership. These sets come from real S5 occupancy, not a new radius.
// Arbitration of that core and placement of the points remain S5 policies.
export function siegeRoleSelection(state,id,localTeam){
 if(state.mode!=='siege'||!['alpha','beta'].includes(localTeam))throw Error('Explicit Siege role context required');
 const person=state.players.get(id);if(state.phase!=='playing'||!person?.alive)return null;
 for(const point of state.points.values()){
  const core=state.players.get(point.core);if(!core?.alive||core.team!==person.team)continue;
  const role=id===point.core?(point.coreInside.has(id)?'in':null):(point.assistInside.has(id)?'out':null);
  if(role)return {point:point.id,role,source:`effects/seize_flag_${role}_${person.team===localTeam?'atex':'etex'}.scn`};
 }
 return null;
}

export function createSiegeRoleEffects({records,team,read=readAsset,load=loadSiegeIndicator}){
 if(typeof records!=='function'||!['alpha','beta'].includes(team))throw Error('Explicit Siege actor records and team required');
 const slots=new Map();let disposed=false;
 const release=effect=>{effect.group.removeFromParent();for(const mesh of effect.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}};
 function clear(slot){slot.pending=null;slot.rig=null;slot.wanted=null;slot.selection=null;slot.error=null;slot.failedSource=null;slot.clock=null;if(slot.current)release(slot.current);slot.current=null;}
 async function prepare(slot,source){
  const token={};slot.pending=token;
  try{
   const manifest=await read(BASE+'manifest.json'),meta=manifest.assets.find(a=>a.source===source);
   if(!meta)throw Error('Siege role source absent: '+source);
   const data=await read(BASE+meta.file),clip=source.split('/').at(-1).replace('.scn','');
   if(data.source!==source||data.clips.length!==1||data.clips[0].name!==clip)throw Error('Siege role source/first clip mismatch');
   const clock=createDefaultScnControllerClock(data.clips[0].durationTicks);
   if(disposed||slot.pending!==token)return;
   // The dedicated clock supplies a wrapped tick time. Do not modulo a
   // second time in the evaluator: the native endpoint must stay visible.
   const effect=await load(data,{animation:clip,loop:false});
   if(disposed||slot.pending!==token){release(effect);return;}
   slot.current=effect;slot.clock=clock;slot.pending=null;slot.error=null;
   effect.group.name=clip;effect.group.visible=slot.visible;effect.update(0);
   // actor+70 is the actor scene, not a guessed bone. avatar.rig already
   // carries .006*CHARACTER_MODEL_SCALE; add() retains source-local SRT.
   slot.rig?.add(effect.group);
   let frame=-1;for(const mesh of effect.meshes)mesh.onBeforeRender=(renderer,_scene,camera)=>{if(renderer.info.render.frame!==frame){frame=renderer.info.render.frame;effect.render(camera);}};
  }catch(error){if(!disposed&&slot.pending===token){slot.pending=null;slot.failedSource=source;slot.error=error.message;}}
 }
 return {
  update(dt,state,{visible=true}={}){
   if(disposed)return;
   if(!Number.isFinite(dt)||dt<0||state.mode!=='siege')throw Error('Valid Siege role update required');
   const live=new Set();
   for(const record of records()){
    live.add(record.id);let slot=slots.get(record.id);
    if(!slot){slot={current:null,pending:null,wanted:null,rig:null,visible:false,selection:null,error:null,failedSource:null,clock:null};slots.set(record.id,slot);}
    const selection=record.health?.dead?null:siegeRoleSelection(state,record.id,team);
    if(!selection){clear(slot);continue;}
    if(selection.source!==slot.wanted){clear(slot);slot.wanted=selection.source;}
    slot.selection=selection;slot.visible=visible;
    const rig=record.avatar?.rig;slot.rig=rig??null;
    if(!rig){slot.current?.group.removeFromParent();slot.error='Siege actor rig unavailable';continue;}
    if(slot.error==='Siege actor rig unavailable')slot.error=null;
    if(slot.current){if(slot.current.group.parent!==rig)rig.add(slot.current.group);slot.current.group.visible=visible;if(visible)slot.current.update(slot.clock.advance(dt));}
    else if(!slot.pending&&slot.failedSource!==slot.wanted)void prepare(slot,slot.wanted);
   }
   for(const [id,slot]of slots)if(!live.has(id)){clear(slot);slots.delete(id);}
  },
  reset(){for(const slot of slots.values())clear(slot);},
  snapshot(){return {disposed,nativeRolePlaybackObserved:false,nativeStateProjectionVerified:false,defaultPlaybackSourceVerified:true,actors:[...slots].map(([id,s])=>({id,selection:s.selection,wanted:s.wanted,loaded:s.current?s.wanted:null,pending:!!s.pending,error:s.error,rigAttached:!!s.current&&!!s.rig&&s.current.group.parent===s.rig,visible:!!s.current&&!!s.rig&&s.current.group.visible,clock:s.clock?.snapshot()??null}))};},
  dispose(){if(disposed)return;disposed=true;for(const slot of slots.values())clear(slot);slots.clear();},
 };
}
