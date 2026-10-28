import {readAsset} from './scene-assets.js';
import {loadCaptainCrown} from './captain-crown-scene.js';
import {loadCaptainCrownParticles} from './captain-crown-particles.js';

const BASE='/assets/mode-world-effects/';
export function captainCrownSelection({id,localId='local',team,localTeam,isCaptain}){
 if(typeof id!=='string'||!id||typeof localId!=='string'||!localId||!['alpha','beta'].includes(team)||!['alpha','beta'].includes(localTeam)||typeof isCaptain!=='boolean')throw Error('Explicit Captain actor identity and role required');
 if(!isCaptain)return null;
 const variant=id===localId?'self':team===localTeam?'atex':'etex';
 return 'model/character/captainmark/captain_crown_'+variant+'.scn';
}
export function createCaptainWorldEffects({records,team,scene=null,read=readAsset,load=loadCaptainCrown,loadParticles=loadCaptainCrownParticles}){
 if(typeof records!=='function'||!['alpha','beta'].includes(team))throw Error('Explicit Captain visual context required');
 const slots=new Map();let disposed=false;
 const release=effect=>{effect.group.removeFromParent();for(const mesh of effect.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}};
 function clear(slot){slot.pending=null;slot.particlesPending=null;slot.particles?.dispose();slot.particles=null;slot.particleError=null;slot.wanted=null;slot.failedSource=null;slot.error=null;slot.head=null;if(slot.current)release(slot.current);slot.current=null;}
 async function prepareParticles(slot,source,manifest){
  const token={};slot.particlesPending=token;
  try{
   const sequence=source.endsWith('_etex.scn')?'effects/captain_crown_bling_etex.seq':'effects/captain_crown_bling.seq',meta=manifest.assets.find(a=>a.source===sequence);if(!meta)throw Error('Captain particle sequence absent');
   const raw=await read(BASE+meta.file);if(raw.source!==sequence)throw Error('Captain particle sequence identity mismatch');
   if(disposed||slot.particlesPending!==token)return;
   const effect=await loadParticles({scene,raw,manifest,readAnchor:()=>slot.head?(slot.current?.particleAnchor??slot.current?.group):null});
   if(disposed||slot.particlesPending!==token){effect.dispose();return;}
   slot.particles=effect;slot.particlesPending=null;slot.particleError=null;effect.update(0,{visible:slot.visible&&!!slot.head});
  }catch(error){if(!disposed&&slot.particlesPending===token){slot.particlesPending=null;slot.particleError=error.message;}}
 }
 async function prepare(slot,source){
  const token={};slot.pending=token;
  try{
   const manifest=await read(BASE+'manifest.json'),meta=manifest.assets.find(r=>r.source===source);if(!meta)throw Error('Captain crown source absent: '+source);
   const data=await read(BASE+meta.file);if(data.source!==source)throw Error('Captain crown source mismatch');
   if(disposed||slot.pending!==token)return;
   const effect=await load(data);
   if(disposed||slot.pending!==token){release(effect);return;}
   if(slot.current)release(slot.current);slot.current=effect;slot.pending=null;slot.error=null;
   // Head already inherits avatar.rig's .006*1.3 scale. add() preserves the
   // source local transform; attach() would incorrectly preserve world space.
   slot.head?.add(effect.group);effect.group.visible=slot.visible;
   if(scene&&loadParticles)void prepareParticles(slot,source,manifest);
  }catch(error){if(!disposed&&slot.pending===token){slot.pending=null;slot.failedSource=source;slot.error=error.message;}}
 }
 return {
  update(dt,state,{visible=true}={}){
   if(disposed)return;if(!Number.isFinite(dt)||dt<0||state.mode!=='captain')throw Error('Valid Captain visual update required');
   const live=new Set();
   for(const record of records()){
    live.add(record.id);let slot=slots.get(record.id);if(!slot){slot={current:null,pending:null,wanted:null,failedSource:null,error:null,head:null,visible:false};slots.set(record.id,slot);}
    const person=state.players.get(record.id),source=person?captainCrownSelection({id:record.id,team:person.team,localTeam:team,isCaptain:person.isCaptain}):null;
    if(!source){clear(slot);continue;}
    if(source!==slot.wanted){clear(slot);slot.wanted=source;}
    slot.visible=visible;
    const head=record.avatar?.bones?.get('Bip01 Head');slot.head=head??null;
    if(!head){slot.current?.group.removeFromParent();slot.particles?.update(0,{visible:false});slot.error='Captain Head node unavailable';continue;}
    if(slot.error==='Captain Head node unavailable')slot.error=null;
    if(slot.current){if(slot.current.group.parent!==head)head.add(slot.current.group);slot.current.group.visible=visible;}
    else if(!slot.pending&&slot.failedSource!==source)void prepare(slot,source);
    slot.particles?.update(dt,{visible});
   }
   for(const [id,slot]of slots)if(!live.has(id)){clear(slot);slots.delete(id);}
  },
  reset(){for(const slot of slots.values())clear(slot);},
  snapshot(){return {disposed,nativeCompared:false,nativeRoleProjectionVerified:false,particlesIncluded:[...slots.values()].some(s=>!!s.particles),actors:[...slots].map(([id,s])=>({id,wanted:s.wanted,loaded:s.current?.source??null,pending:!!s.pending,error:s.error,headAttached:!!s.current&&!!s.head&&s.current.group.parent===s.head,visible:!!s.current&&s.current.group.visible&&!!s.head,staticTracksVerified:s.current?.staticTracksVerified===true,particles:s.particles?.snapshot()??null,particlesPending:!!s.particlesPending,particleError:s.particleError??null}))};},
  dispose(){if(disposed)return;disposed=true;for(const slot of slots.values())clear(slot);slots.clear();},
 };
}
