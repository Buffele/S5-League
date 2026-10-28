import * as THREE from 'three';
import {CombatModeState} from './combat-mode-state.js';
import {BattleRoyalState} from './battle-royal-state.js';
import {createMatchUI} from './match-ui.js';
import {chaserRoleModifiers,chaserDamage} from './chaser-attributes.js';
import {createChaserAudio} from './chaser-audio.js';
import {chaserSpawn} from './chaser-spawn.js';

// S5's normalized 100 HP baseline; effective toughness comes from the native
// received-damage constants, rather than stacking an artificial 1000 HP pool.
export const S5_CHASER_COMBAT={health:100};
export const chaserVictoryMovement=(state,id='local')=>state.mode==='chaser'&&state.phase==='intermission'&&!!state.players.get(id)?.alive&&
 (state.outcome==='chaser-victory'?state.chaser===id:state.initial.includes(id));
export function createCombatMatch({mode,team='alpha',combat,scene,onReset=()=>{},uiFactory=createMatchUI,rules={},showMarker=true,nativeEffects=null}){
 const bots=combat.bots||[{id:'bot',actor:combat.enemy,health:combat.enemyState,view:combat}],participants=['local',...bots.map(b=>b.id)];
 const state=mode==='battleroyal'?new BattleRoyalState({participants,...rules}):new CombatModeState(mode,{team,participants,...rules}),health=combat.playerState;
 combat.modeState=state;
 const id=actor=>actor===combat.player?'local':bots.find(b=>b.actor===actor)?.id;
 const actor=participant=>participant==='local'?combat.player:bots.find(b=>b.id===participant)?.actor;
 const healthFor=participant=>participant==='local'?combat.playerState:bots.find(b=>b.id===participant)?.health;
 const ui=uiFactory({mode,team,onRestart:()=>api.reset(),nativeEffects});
 const audio=mode==='chaser'?createChaserAudio(()=>combat.getAudio?.()):null;
 let audioVisible=false;
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,40),new THREE.MeshBasicMaterial({color:0xffae79,transparent:true,opacity:.9,depthWrite:false}));halo.rotation.x=Math.PI/2;scene.add(halo);
 const sourceRoleSpawns=mode==='chaser'&&typeof combat.world.spawnForRole==='function';
 const sourceMatchSpawns=mode==='deathmatch'&&combat.world.nativeMapId===19&&combat.world.sourceData?.key==='MAPNAME_BIO_LAB'&&typeof combat.world.spawnForMatch==='function';
 const spawnDescriptors=new Map();
 if(sourceMatchSpawns){
  const remember=(owner,key)=>{if(!spawnDescriptors.has(owner))spawnDescriptors.set(owner,new Map());spawnDescriptors.get(owner).set(key,Object.getOwnPropertyDescriptor(owner,key));};
  remember(combat,'enemyHome');
  for(const bot of bots){remember(bot,'home');if(bot.view&&bot.view!==combat)remember(bot.view,'enemyHome');}
  for(const a of [combat.player,...bots.map(bot=>bot.actor)])remember(a,'mapSpawn');
 }
 const readMatchSpawn=(a,index,occupied)=>{
  const spawn=combat.world.spawnForMatch({mode,team:state.players.get(id(a))?.team,participantIndex:index,participantId:id(a),occupied,setDefault:a===combat.player});
  if(spawn?.qualified!==true||!['x','y','z'].every(axis=>Number.isFinite(spawn.position?.[axis])&&Number.isFinite(spawn.direction?.[axis]))||Math.hypot(spawn.direction.x,spawn.direction.z)<1e-8)throw Error('Bio Lab match spawn is not qualified');
  return spawn;
 };
 const setMatchHome=(a,spawn)=>{const bot=bots.find(bot=>bot.actor===a);if(!bot)return;bot.home={...spawn.position};if(bot.view)bot.view.enemyHome={...spawn.position};if(bot===bots[0])combat.enemyHome={...spawn.position};};
 const applyMatchSpawn=(a,spawn)=>{
  a.position={...spawn.position};a.velocity={x:0,y:0,z:0};a.grounded=spawn.grounded===true;a.coyote=a.grounded ? .1 : 0;a.facing=Math.atan2(spawn.direction.x,spawn.direction.z);a.mapSpawn=spawn;
  const bot=bots.find(bot=>bot.actor===a);if(bot)combat.pose?.(bot.avatar??combat.avatar,a,bot.health,0,bot.graph??combat.graph);
 };
 const baseSpawn={...(combat.world.spawn||combat.player.position)},enemySpawn=()=>{
  const p=new THREE.Vector3(baseSpawn.x+1,baseSpawn.y+2,baseSpawn.z-6),ray=new THREE.Raycaster(p,new THREE.Vector3(0,-1,0),0,20),hit=ray.intersectObjects(combat.world.meshes,false)[0];if(hit)p.y=hit.point.y+.02;else p.y=baseSpawn.y;return {x:p.x,y:p.y,z:p.z};
 };
 if(!sourceRoleSpawns&&!sourceMatchSpawns){
 combat.enemyHome=enemySpawn();
 for(const [i,bot] of bots.entries()){
  const candidate={...combat.enemyHome,x:combat.enemyHome.x+i*3,z:combat.enemyHome.z+i*2};
  const ray=new THREE.Raycaster(new THREE.Vector3(candidate.x,baseSpawn.y+4,candidate.z),new THREE.Vector3(0,-1,0),0,12);
  const hit=ray.intersectObjects(combat.world.meshes,false).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.65);
  bot.home=hit?{x:candidate.x,y:hit.point.y+.02,z:candidate.z}:{...baseSpawn,x:baseSpawn.x+i*1.3};
 }
 }
 const centre=mode==='chaser'&&!sourceRoleSpawns?chaserSpawn(combat.world):null;
 let victoryFreeRound=0;
 const prepare=()=>{
  victoryFreeRound=0;
  let matchSpawns=null;
  if(sourceMatchSpawns){
   combat.world.clearMatchSpawns?.('local-match-prepare');matchSpawns=[];
   for(const [index,a]of [combat.player,...bots.map(bot=>bot.actor)].entries())matchSpawns.push({actor:a,spawn:readMatchSpawn(a,index,matchSpawns.map(row=>row.spawn.position))});
   // The first TrainingCombat reset already poses the enemy. Give it real
   // source homes before resetting, then restore the authenticated facing.
   for(const row of matchSpawns)setMatchHome(row.actor,row.spawn);
  }
  combat.player.reset();combat.reset();combat.setMode('attack');combat.autoRespawn=mode==='deathmatch'||mode==='battleroyal';
  for(const h of [health,...bots.map(b=>b.health)]){h.maxHp=100;h.hp=100;}
  for(const a of [combat.player,...bots.map(b=>b.actor)])a.modeModifiers=null;
  // Optional map query port: explicit match role, never inferred from modifiers.
  let survivorIndex=0;
  for(const a of [combat.player,...bots.map(b=>b.actor)]){
   const role=mode==='chaser'?(id(a)===state.chaser?'chaser':'survivor'):null;
   combat.world.setActorCollisionRole?.(a,role);
   if(sourceRoleSpawns){
    // Native role groups and marker poses; local participant ordering is an
    // explicit S5 allocation policy, not a claim about the native +118 writer.
    const spawn=combat.world.spawnForRole(role,{index:role==='chaser'?0:survivorIndex++,placement:'source'});
    if(!spawn||!['x','y','z'].every(axis=>Number.isFinite(spawn.position?.[axis])&&Number.isFinite(spawn.direction?.[axis])))throw Error('Map role spawn is not qualified');
    a.position={...spawn.position};a.velocity={x:0,y:0,z:0};a.grounded=false;a.coyote=0;
    a.facing=Math.atan2(spawn.direction.x,spawn.direction.z);a.mapSpawn=spawn;
    const bot=bots.find(bot=>bot.actor===a);if(bot)bot.home={...spawn.position};
   }
   if(matchSpawns)applyMatchSpawn(a,matchSpawns.find(row=>row.actor===a).spawn);
  }
  if(mode==='chaser'){const h=healthFor(state.chaser);h.hp=S5_CHASER_COMBAT.health;h.maxHp=h.hp;actor(state.chaser).modeModifiers=chaserRoleModifiers(state.initial.length);}
  for(const a of [combat.player,...bots.map(b=>b.actor)]){combat.cancel(a);a.fireball=null;}
  if(centre)actor(state.chaser).position={...centre};
  onReset();
 };
 const defeated=(victim,source)=>{
  const victimId=id(victim),killerId=source?id(source):null;
  const name=participant=>participant==='local'?'You':participant==='bot'?'Bot 1':participant==='bot2'?'Bot 2':'Fall';
  if(state.eliminate(victimId,killerId))ui.feed(`${name(killerId)} → ${name(victimId)}`);
 };
 combat.onDefeat=defeated;combat.onRespawn=a=>{
  const respawned=state.respawn(id(a));
  if(sourceMatchSpawns&&respawned){
   const actors=[combat.player,...bots.map(bot=>bot.actor)],index=actors.indexOf(a),occupied=actors.filter(other=>other!==a&&state.players.get(id(other))?.alive&&!healthFor(id(other))?.dead).map(other=>other.position);
   const spawn=readMatchSpawn(a,index,occupied);setMatchHome(a,spawn);applyMatchSpawn(a,spawn);
  }
  if(a===combat.player)onReset();
 };
 combat.onDamage=(victim,source,amount)=>state.recordDamage?.(id(source),id(victim),amount);
 combat.onFall=a=>{
  if(state.phase!=='playing')return;const h=healthFor(id(a));if(h.dead)return;
  h.invincible=false;h.receive({damage:h.hp});combat.cancel(a);defeated(a,null);
 };
 combat.damagePolicy=({source,victim,profile})=>{
  if(state.phase!=='playing'||mode==='chaser'&&id(source)!==state.chaser&&id(victim)!==state.chaser)return null;
  return mode==='chaser'?chaserDamage(profile,{attacking:id(source)===state.chaser,receiving:id(victim)===state.chaser,initialChased:state.initial.length}):profile;
 };
 for(const bot of bots)if(bot.view!==combat){bot.view.damagePolicy=data=>combat.damagePolicy?.(data);bot.view.onDefeat=defeated;bot.view.onDamage=combat.onDamage;}
 combat.enemyInput=({dx,dz,distance,facing,swing,move})=>{
  if(mode==='chaser'&&state.chaser==='local'){
   // Local survivor AI: flee while on the arena floor, fight when cornered.
   // Clamping its objective to arena bounds avoids walking off the training map.
   const p=combat.enemy.position,away={x:Math.max(-17,Math.min(17,p.x-dx/(distance||1)*4)),z:Math.max(-16,Math.min(16,p.z-dz/(distance||1)*4))},vx=away.x-p.x,vz=away.z-p.z,n=Math.hypot(vx,vz)||1;
   return {facing:distance<2.5?facing:Math.atan2(vx,vz),x:distance<7?vx/n:0,z:distance<7?vz/n:0,light:swing&&distance<2.5,lightShort:swing&&distance<2.5};
  }
  return {facing,x:move?dx/(distance||1):0,z:move?dz/(distance||1):0,light:swing,lightShort:swing};
 };
 const api={state,health,team,ui,combat,get locked(){return health.dead||state.phase!=='playing'&&!chaserVictoryMovement(state);},
  reset(){audio?.reset();combat.world.resetMapObjects?.('local-match-reset');state.reset();ui.reset?.();prepare();},
  manualRespawn(){if(api.locked)return;combat.onFall(combat.player);},
  step(dt,input){
   // One local simulation-clock advance, including preparation/intermission.
   // Native uses a stored integer previous-frame delta; this S5 clock differs.
   combat.world.advanceMapObjects?.(dt);
   const transition=state.tick(dt);
   const restarted=transition==='restart'||transition==='new-round';
   if(restarted){prepare();if(state.phase!=='playing')return ['respawn'];}
   if(state.phase!=='playing'){
    // Source role markers may start above their floor. Let the existing S5
    // controller settle without accepting movement during preparation.
    if(sourceRoleSpawns&&state.phase==='preparation')for(const a of [combat.player,...bots.map(b=>b.actor)])a.step(dt,{facing:a.facing});
    if(combat.pauseTick)combat.pauseTick(dt);
    else{combat.effects.update(dt);combat.playerState.tick(dt);combat.enemyState.tick(dt);combat.pose(combat.avatar,combat.enemy,combat.enemyState,dt,combat.graph);combat.trail?.clear();}
    if(chaserVictoryMovement(state)&&!health.dead){
     if(victoryFreeRound!==state.round){victoryFreeRound=state.round;combat.cancel(combat.player);combat.player.fireball=null;}
     const {x,z,facing,jump,rapidJump,sprint,side,forward,forwardHeld,backwardHeld,forwardPressed}=input;return combat.player.step(dt,{x,z,facing,jump,rapidJump,sprint,side,forward,forwardHeld,backwardHeld,forwardPressed});
    }
    return [];
   }
   const combatDelta=state.playingDelta;
   const events=combatDelta>0?combat.tick(combatDelta,input):[];
   return restarted?['respawn',...events]:events;
  },
  render(dt,{visible=true}={}){
   if(visible)audio?.update(state);else if(audioVisible)audio?.stop();audioVisible=visible;
   const marked=mode==='chaser'?state.chaser:mode==='battleroyal'?state.leader:null;
   halo.visible=showMarker&&!!marked&&visible&&(mode==='chaser'?state.phase!=='result':state.phase==='playing'&&state.players.get(marked)?.alive);if(halo.visible){const a=actor(marked);halo.position.set(a.position.x,a.position.y+2.4,a.position.z);halo.rotation.z+=dt;}
   for(const [i,bot] of bots.entries()){bot.view.label.querySelector('span').textContent=mode==='chaser'||mode==='battleroyal'?`BOT ${i+1}`:'RIVAL';if(bot.view.label.dataset)bot.view.label.dataset.bonus=String(mode==='chaser'?state.bonus===bot.id:mode==='battleroyal'&&state.leader===bot.id);}
   ui.update(state,{health,chaserHealth:mode==='chaser'?healthFor(state.chaser):null,visible,dt});
  },dispose(){audio?.dispose();halo.geometry.dispose();halo.material.dispose();halo.removeFromParent();ui.dispose();for(const a of [combat.player,...bots.map(b=>b.actor)]){a.modeModifiers=null;combat.world.setActorCollisionRole?.(a,null);}for(const view of new Set([combat,...bots.map(b=>b.view)])){view.onDamage=null;view.damagePolicy=null;view.onDefeat=null;}combat.onRespawn=null;combat.onFall=null;combat.enemyInput=null;combat.autoRespawn=true;if(combat.modeState===state)combat.modeState=null;
   if(sourceMatchSpawns){combat.world.clearMatchSpawns?.('local-match-dispose');for(const [owner,fields]of spawnDescriptors)for(const [key,descriptor]of fields){if(descriptor)Object.defineProperty(owner,key,descriptor);else delete owner[key];}}
  }
 };
 combat.world.resetMapObjects?.('new-local-match');prepare();return api;
}
