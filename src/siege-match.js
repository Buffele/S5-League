import * as THREE from 'three';
import {SiegeState} from './siege-state.js';
import {createSiegeUI} from './siege-ui.js';
import {siegePoint3ZonesAt,siegeZonePresence,siegeObbOverlap} from './siege-zone.js';
import {createSiegeZoneEffects} from './siege-zone-effects.js';
import {createSiegeRoleEffects} from './siege-role-effects.js';
import {createSiegeSupplyWorld} from './siege-supply-world.js';
import {createSiegePickupEffects} from './siege-pickup-effects.js';
import {createSiegeSupplyAudio} from './siege-supply-audio.js';

const floorAt=(world,p)=>{
 const ray=new THREE.Raycaster(new THREE.Vector3(p.x,p.y+4,p.z),new THREE.Vector3(0,-1,0),0,20);
 const hit=ray.intersectObjects(world.meshes||[],false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.65);
 return {...p,y:hit?hit.point.y+.02:p.y};
};
// Coordinates and round UI are explicitly local. IronHeart/native point
// volumes are not substituted with invented native IDs on another map.
export function createSiegeMatch({combat,scene,team='alpha',points=null,rules={},onReset=()=>{},uiFactory=createSiegeUI,showMarkers=true,effectsFactory=createSiegeZoneEffects,roleEffectsFactory=createSiegeRoleEffects,suppliesFactory=createSiegeSupplyWorld,pickupEffectsFactory=createSiegePickupEffects,getAudio=()=>null,getSfxGain=()=>0,supplyAudioFactory=createSiegeSupplyAudio}){
 const base={...(combat.world.spawn||combat.player.position)};
 const zones=(points||[floorAt(combat.world,{id:'local-center',...base,z:base.z-4})]).map(p=>p.core&&p.assist?p:siegePoint3ZonesAt(p));
 for(const p of zones){if(![p.x,p.y,p.z].every(Number.isFinite))throw Error('Explicit finite Siege point placement required');siegeObbOverlap(p.core,p.core);siegeObbOverlap(p.assist,p.assist);}
 const teamSpawns=typeof combat.world.spawnForTeam==='function',opposingTeam=team==='alpha'?'beta':'alpha';
 const readBotSpawns=()=>teamSpawns?combat.bots.map((bot,ordinal)=>{
  const spawn=combat.world.spawnForTeam(opposingTeam,ordinal);
  if(!spawn||!['x','y','z'].every(axis=>Number.isFinite(spawn.position?.[axis]))||!Number.isFinite(spawn.facing))throw Error('Explicit finite Siege team spawn required');
  return {bot,spawn};
 }):null;
 let botSpawns=readBotSpawns();
 const participants=combat.records().map((r,i)=>({id:r.id,team:i===0?team:team==='alpha'?'beta':'alpha'}));
 const state=new SiegeState({participants,pointIds:zones.map(p=>p.id),...rules}),health=combat.playerState;
 combat.modeState=state;combat.siegePoints=zones;
 const ui=uiFactory({team,onRestart:()=>api.reset()}),markers=zones.map(p=>{
  const [x,,z]=p.core.halfExtents,marker=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-x,0,-z),new THREE.Vector3(x,0,-z),new THREE.Vector3(x,0,z),new THREE.Vector3(-x,0,z)]),new THREE.LineBasicMaterial({color:0xffd871,transparent:true,opacity:.7,depthWrite:false}));
  marker.position.set(p.core.center[0],p.core.center[1]-p.core.halfExtents[1]+.04,p.core.center[2]);scene?.add(marker);return marker;
 });
 const worldEffects=effectsFactory?.({scene,zones,team})??null;
 const roleEffects=roleEffectsFactory?.({records:()=>combat.records(),team})??null;
 const pickupEffects=scene?pickupEffectsFactory?.({scene})??null:null;
 let supplyAudio=null,audioPending=null,audioEpoch=0,audioError=null,disposed=false;
 const supplies=suppliesFactory?.({scene,world:combat.world,zones,records:()=>combat.records(),onContact:()=>supplyAudio?.contact(),onCollect:event=>{pickupEffects?.collect(event);const {record,label}=event;if(record.id==='local')supplyAudio?.collect();ui.feed(`${record.id==='local'?'You':record.id==='bot'?'Bot 1':'Bot 2'} · ${label}`);}})??null;
 const ammoConsumers=new Map();
 function installAmmoConsumers(){
  for(const [actor,consumer]of ammoConsumers)if(actor.magazineRewardConsumer===consumer)actor.magazineRewardConsumer=null;
  ammoConsumers.clear();
  for(const record of combat.records()){
   const actor=record.actor,consumer=runtime=>{
    if(runtime.phase!=='reload')return false;
    const current=combat.actorRecord(actor);return current?supplies?.applyPendingMagazine?.(current,state,runtime)??false:false;
   };
   ammoConsumers.set(record.actor,consumer);record.actor.magazineRewardConsumer=consumer;
  }
 }
 async function enableAudio(){
  const context=getAudio()?.context;if(disposed||!context)return false;
  if(supplyAudio?.context===context)return true;if(audioPending?.context===context)return audioPending.promise;
  const epoch=++audioEpoch;supplyAudio?.dispose();supplyAudio=null;audioError=null;
  const pending={context,promise:null};pending.promise=supplyAudioFactory({context,getGain:getSfxGain}).then(audio=>{if(disposed||epoch!==audioEpoch){audio.dispose();return false;}supplyAudio=audio;return true;}).catch(error=>{if(!disposed&&epoch===audioEpoch)audioError=error.message;return false;}).finally(()=>{if(audioPending===pending)audioPending=null;});audioPending=pending;return pending.promise;
 }
 if(!teamSpawns)for(const [i,bot] of combat.bots.entries())bot.home=floorAt(combat.world,{x:base.x+(i?3:-3),y:base.y,z:base.z-8});
 const restoreBotSpawnPose=actor=>{
  const entry=botSpawns?.find(({bot})=>bot.actor===actor);if(!entry)return;
  actor.facing=entry.spawn.facing;actor.mapSpawn=entry.spawn;
  combat.pose?.(entry.bot.avatar,actor,entry.bot.health,0,entry.bot.graph);
 };
 const presence=()=>{
  for(const r of combat.records())for(const zone of zones){
   const inside=r.health.dead?{core:false,assist:false}:siegeZonePresence(r.actor,zone);
   state.setPresence(zone.id,r.id,inside);
  }
 };
 const prepare=()=>{
  // The map port already projects onto its real triangles. Prepare all homes
  // before ChaserCombat.reset (including TrainingCombat's first enemy reset).
  if(botSpawns){
   for(const {bot,spawn} of botSpawns)bot.home={...spawn.position};
   if(botSpawns.length)combat.enemyHome={...botSpawns[0].spawn.position};
  }
  combat.player.reset();combat.reset();combat.setMode('attack');combat.autoRespawn=true;
  for(const {bot} of botSpawns||[])restoreBotSpawnPose(bot.actor);
  for(const r of combat.records()){combat.cancel(r.actor);r.actor.fireball=null;r.actor.modeModifiers=null;r.health.effect?.clear();r.health.reset();r.health.maxHp=100;r.health.hp=100;}
  installAmmoConsumers();onReset();presence();
 };
 const record=actor=>combat.actorRecord(actor);
 combat.onDefeat=(victim,source)=>{
  supplies?.forgetActor?.(victim);const a=record(victim),b=source?record(source):null;
  if(state.eliminate(a?.id,b?.id??null)){combat.cancel(victim);ui.feed(`${b?.id??'Fall'} → ${a.id}`);}
 };
 combat.onRespawn=actor=>{supplies?.forgetActor?.(actor);const r=record(actor);if(r&&state.respawn(r.id)){restoreBotSpawnPose(actor);if(r.id==='local')onReset();}};
 combat.onFall=actor=>{const r=record(actor);if(state.phase!=='playing'||!r||r.health.dead)return;r.health.invincible=false;r.health.receive({damage:r.health.hp});combat.cancel(actor);combat.onDefeat(actor,null);};
 combat.onDamage=null;
 combat.damagePolicy=({source,victim,profile})=>{
  const a=record(source),b=record(victim);
  return state.phase==='playing'&&a&&b&&!a.health.dead&&state.players.get(a.id).team!==state.players.get(b.id).team?profile:null;
 };
 for(const bot of combat.bots)if(bot.view!==combat){bot.view.damagePolicy=data=>combat.damagePolicy?.(data);bot.view.onDefeat=(...args)=>combat.onDefeat?.(...args);bot.view.onDamage=null;}
 const api={state,health,team,combat,ui,zones,worldEffects,roleEffects,supplies,pickupEffects,enableAudio,audioSnapshot(){return {error:audioError,pending:!!audioPending,...supplyAudio?.snapshot()};},get locked(){return health.dead||state.phase!=='playing';},
  reset(){if(teamSpawns)botSpawns=readBotSpawns();state.reset();worldEffects?.reset();roleEffects?.reset();supplies?.reset();pickupEffects?.reset();supplyAudio?.reset();ui.reset?.();prepare();},
  manualRespawn(){if(!api.locked)combat.onFall(combat.player);},
  step(dt,input){
   if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Siege combat requires fixed simulation steps at most1/30s');
   presence();state.tick(dt);
   if(state.phase!=='playing'){supplies?.step(state);pickupEffects?.reset();supplyAudio?.reset();combat.pauseTick(dt);return [];}
   const events=state.playingDelta>0?combat.tick(state.playingDelta,input):[];presence();supplies?.step(state);if(state.phase==='playing')pickupEffects?.step(state.playingDelta);else pickupEffects?.reset();return events;
  },
  render(dt,{visible=true}={}){
   worldEffects?.update(dt,state,{visible:showMarkers&&visible});
   roleEffects?.update(dt,state,{visible});
   supplies?.render(dt,{visible:visible&&state.phase==='playing'});
   pickupEffects?.render({visible:visible&&state.phase==='playing'});supplyAudio?.updateGain();
   for(const [i,marker]of markers.entries()){const p=state.points.get(zones[i].id);marker.visible=showMarkers&&visible&&state.phase==='playing'&&!worldEffects?.hasModel(zones[i].id);marker.material.color.setHex(p.contested?0xff5c5c:p.owner==='alpha'?0x78d5ff:p.owner==='beta'?0xffa776:0xffd871);marker.material.opacity=p.progress>0?.5+.4*p.progress/state.rules.gaugeMaximum:.7;}
   for(const [i,bot]of combat.bots.entries())bot.view.label.querySelector('span').textContent=`BOT ${i+1}`;
   ui.update(state,{health,visible,dt});
  },
  dispose(){disposed=true;for(const [actor,consumer]of ammoConsumers)if(actor.magazineRewardConsumer===consumer)actor.magazineRewardConsumer=null;ammoConsumers.clear();audioEpoch++;supplyAudio?.dispose();pickupEffects?.dispose();worldEffects?.dispose();roleEffects?.dispose();supplies?.dispose();ui.dispose();for(const marker of markers){marker.removeFromParent();marker.geometry.dispose();marker.material.dispose();}for(const view of new Set([combat,...combat.bots.map(b=>b.view)])){view.damagePolicy=null;view.onDefeat=null;view.onDamage=null;}combat.onRespawn=null;combat.onFall=null;combat.siegePoints=null;combat.autoRespawn=true;if(combat.modeState===state)combat.modeState=null;for(const r of combat.records())r.actor.modeModifiers=null;}
 };
 prepare();return api;
}
