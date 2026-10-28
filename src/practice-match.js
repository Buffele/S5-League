import {PracticeState} from './practice-state.js';
import {createPracticeUI} from './practice-ui.js';

// A runnable S5 practice fixture over authentic contact/HP controllers. Target
// avatars, their respawn4s and death->mission1 bridge are explicit local policy.
// No native mission/NPC map is claimed by this adapter.
export function createPracticeMatch({combat,rules={},onReset=()=>{},uiFactory=createPracticeUI}){
 const state=new PracticeState(rules),health=combat.playerState,team='alpha';combat.modeState=state;
 const ui=uiFactory({onRestart:()=>api.reset()}),generations=new Map();
 const record=actor=>combat.actorRecord(actor);
 const prepare=()=>{
  combat.enemyHome={...(combat.world.spawn||combat.player.position),z:(combat.world.spawn?.z||0)+5};
  for(const [i,b] of combat.bots.entries())b.home={...combat.enemyHome,x:combat.enemyHome.x+i*2};
  // ChaserCombat.reset samples idle at dt0. Install homes first so a replay
  // or first render cannot expose the previous target transform until tick1.
  combat.player.reset();combat.reset();combat.setMode('passive');combat.autoRespawn=true;generations.clear();
  for(const r of combat.records()){combat.cancel(r.actor);r.actor.fireball=null;r.actor.modeModifiers=null;r.health.effect?.clear();r.health.reset();r.health.maxHp=100;r.health.hp=100;}
  onReset();
 };
 combat.onDefeat=(victim,source)=>{
  const r=record(victim);if(!r||state.phase!=='playing')return;
  if(r.id==='local'){state.die();return;}
  if(source!==combat.player)return;
  const id=`target:${r.id}:${generations.get(r.id)||0}`;
  if(state.receiveMission({id}))ui.feed('S5 target eliminated · Mission +1');
 };
 combat.onRespawn=actor=>{const r=record(actor);if(!r)return;if(r.id==='local'){state.respawn();onReset();}else generations.set(r.id,(generations.get(r.id)||0)+1);};
 combat.onFall=actor=>{const r=record(actor);if(!r||r.health.dead||state.phase!=='playing')return;r.health.invincible=false;r.health.receive({damage:r.health.hp});combat.cancel(actor);combat.onDefeat(actor,null);};
 combat.onDamage=null;
 combat.damagePolicy=({source,victim,profile})=>state.phase==='playing'&&state.alive&&source===combat.player&&victim!==combat.player?profile:null;
 for(const b of combat.bots)if(b.view!==combat){b.view.damagePolicy=data=>combat.damagePolicy?.(data);b.view.onDefeat=(...args)=>combat.onDefeat?.(...args);b.view.onDamage=null;}
 const api={state,health,team,combat,ui,get locked(){return health.dead||state.phase!=='playing';},
  reset(){state.reset();ui.reset?.();prepare();},
  manualRespawn(){if(!api.locked)combat.onFall(combat.player);},
  step(dt,input){
   if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Practice combat requires fixed simulation steps at most1/30s');
   state.tick(dt);if(state.phase!=='playing'){combat.pauseTick(dt);return [];}
   return state.playingDelta>0?combat.tick(state.playingDelta,input):[];
  },
  render(dt,{visible=true}={}){for(const [i,b] of combat.bots.entries())b.view.label.querySelector('span').textContent=`S5 TARGET ${i+1}`;ui.update(state,{health,visible,dt});},
  dispose(){ui.dispose();for(const view of new Set([combat,...combat.bots.map(b=>b.view)])){view.damagePolicy=null;view.onDefeat=null;view.onDamage=null;}combat.onRespawn=null;combat.onFall=null;combat.autoRespawn=true;if(combat.modeState===state)combat.modeState=null;}
 };
 prepare();return api;
}
