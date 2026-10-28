import * as THREE from 'three';
import {CaptainState} from './captain-state.js';
import {createCaptainUI} from './captain-ui.js';
import {createCaptainWorldEffects} from './captain-world-effects.js';

// Dedicated adapter, ready for main routing without borrowing Chaser modifiers
// or team-DM halftime rules. UI is supplied by the main-game integrator.
export function createCaptainMatch({combat,team='alpha',rules={},onReset=()=>{},uiFactory=createCaptainUI,effectsFactory=createCaptainWorldEffects}){
 const records=()=>combat.records(),participants=records().map((r,i)=>({id:r.id,team:i===0?team:team==='alpha'?'beta':'alpha'}));
 const state=new CaptainState({participants,...rules}),health=combat.playerState;
 combat.modeState=state;let preparedRound=0;
 const ui=uiFactory({mode:'captain',team,onRestart:()=>api.reset()});
 const worldEffects=effectsFactory?.({records,team,scene:combat.scene});
 // Current health belongs to combat actors. CaptainState.maxHealth is the
 // round allocation, not a damage/health observation; never synthesize HP from it.
 const healthSnapshot=()=>records().flatMap(record=>{
  const person=state.players.get(record.id);if(!person)return [];
  return [{id:record.id,team:person.team,
   name:typeof person.name==='string'&&person.name.trim()?person.name:record.id==='local'?'You':record.id==='bot'?'Bot 1':record.id==='bot2'?'Bot 2':record.id,
   hp:Number.isFinite(record.health?.hp)?record.health.hp:null,
   maxHp:Number.isFinite(record.health?.maxHp)&&record.health.maxHp>0?record.health.maxHp:null,
   dead:record.health?.dead===true,isCaptain:person.isCaptain===true}];
 });
 const record=actor=>combat.actorRecord(actor),base={...(combat.world.spawn||combat.player.position)};
 for(const [index,bot] of combat.bots.entries()){
  const p=new THREE.Vector3(base.x+(index+1)*2,base.y+3,base.z-6-index*2),ray=new THREE.Raycaster(p,new THREE.Vector3(0,-1,0),0,20);
  const hit=ray.intersectObjects(combat.world.meshes||[],false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.65);
  bot.home={x:p.x,y:hit?hit.point.y+.02:base.y,z:p.z};
 }
 const prepare=()=>{
  worldEffects?.reset();
  combat.player.reset();combat.reset();combat.setMode('attack');combat.autoRespawn=true;
  for(const r of records()){
   combat.cancel(r.actor);r.actor.fireball=null;r.actor.modeModifiers=null;r.health.effect?.clear();r.health.reset();
   const p=state.players.get(r.id);r.health.maxHp=p.maxHealth;r.health.hp=p.maxHealth;
  }
  preparedRound=state.round;onReset();
 };
 combat.onDefeat=(victim,source)=>{
  const target=record(victim),killer=source?record(source):null;
  if(state.eliminate(target?.id,killer?.id??null)){combat.cancel(victim);ui.feed(`${killer?.id??'Fall'} → ${target.id}`);}
 };
 combat.onRespawn=actor=>{
  const r=record(actor);if(!r||!state.respawn(r.id))return;
  r.health.maxHp=state.players.get(r.id).maxHealth;r.health.hp=r.health.maxHp;
  if(r.id==='local')onReset();
 };
 combat.onFall=actor=>{
  const r=record(actor);if(state.phase!=='playing'||!r||r.health.dead)return;
  r.health.invincible=false;r.health.receive({damage:r.health.hp});combat.cancel(actor);combat.onDefeat(actor,null);
 };
 combat.onDamage=null;
 combat.damagePolicy=({source,victim,profile})=>{
  const a=record(source),b=record(victim);
  return state.phase==='playing'&&a&&b&&!a.health.dead&&state.players.get(a.id).team!==state.players.get(b.id).team?profile:null;
 };
 for(const bot of combat.bots)if(bot.view!==combat){bot.view.damagePolicy=data=>combat.damagePolicy?.(data);bot.view.onDefeat=(...args)=>combat.onDefeat?.(...args);bot.view.onDamage=null;}
 const api={state,health,team,combat,ui,worldEffects,get locked(){return health.dead||state.phase!=='playing';},
  reset(){state.reset();ui.reset?.();prepare();},
  manualRespawn(){if(!api.locked)combat.onFall(combat.player);},
  step(dt,input){
   if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Captain combat requires fixed simulation steps at most1/30s');
   state.tick(dt);const newRound=state.round!==preparedRound;if(newRound)prepare();
   if(state.phase!=='playing'){combat.pauseTick(dt);return [];}
   const events=state.playingDelta>0?combat.tick(state.playingDelta,input):[];return newRound?['respawn',...events]:events;
  },
  render(dt,{visible=true}={}){worldEffects?.update(dt,state,{visible});for(const [i,bot] of combat.bots.entries())bot.view.label.querySelector('span').textContent=`BOT ${i+1}${state.players.get(bot.id).isCaptain?' · CAPTAIN':''}`;ui.update(state,{health,participants:healthSnapshot(),visible,dt});},
  dispose(){worldEffects?.dispose();ui.dispose();for(const view of new Set([combat,...combat.bots.map(b=>b.view)])){view.damagePolicy=null;view.onDefeat=null;view.onDamage=null;}combat.onRespawn=null;combat.onFall=null;combat.autoRespawn=true;if(combat.modeState===state)combat.modeState=null;for(const r of records())r.actor.modeModifiers=null;}
 };
 prepare();return api;
}
