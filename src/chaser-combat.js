import {TrainingCombat} from './training-combat.js';
import {resolveRifleShots} from './rifle-contact.js';
import {rifleImpactSoundKey} from './game-audio.js';
import {blockedMeleeContact,playSurfaceImpact} from './melee-contact.js';
import {bindCombatBodyContacts} from './actor-body-contact.js';

// One simulation clock and one player update, with independent bot controllers,
// health, attack claims and animation mixers. Survivors only fight the Chaser.
export class ChaserCombat extends TrainingCombat {
 constructor(options){
  super({...options,enemy:options.enemies[0]});
  const other=new TrainingCombat({...options,enemy:options.enemies[1]});
  other.playerState=this.playerState;
  this.bots=[{id:'bot',actor:this.enemy,health:this.enemyState,avatar:this.avatar,graph:this.graph,view:this},
   {id:'bot2',actor:other.enemy,health:other.enemyState,avatar:other.avatar,graph:other.graph,view:other}];
  this.modeState=null;
  for(const bot of this.bots){
   bot.cooldown=0;
   // The first bot shares this combat instance. Only delegate the other view:
   // replacing our own lookup with this closure makes Revenge recurse forever.
   if(bot.view!==this)bot.view.actorRecord=a=>this.actorRecord(a);
  }
 }
 records(){return [{id:'local',actor:this.player,health:this.playerState,avatar:this.getAvatar()},...this.bots];}
 actorRecord(actor){return this.records().find(record=>record.actor===actor);}
 playerTargets(){return this.opponents(this.records()[0]).map(record=>record.actor);}
 reset(){
  super.reset();if(!this.bots)return;
  for(const bot of this.bots){
   bot.health.reset();bot.actor.reset();bot.actor.position={...(bot.home||this.enemyHome)};bot.graph.reset();bot.cooldown=.5;bot.view.trail?.clear();bot.avatar.group.visible=true;
   // A replay can be rendered before another simulation tick (including QA
   // pause). Clear a clamped death action and evaluate the reset native pose
   // now, without advancing either the controller or the match clock.
   bot.avatar.prepareSwitch?.();bot.avatar.combatKey=null;
   this.pose(bot.avatar,bot.actor,bot.health,0,bot.graph);
  }
 }
 cancel(actor){const bot=this.bots?.find(b=>b.actor===actor);if(bot&&bot.view!==this)return bot.view.cancel(actor);return super.cancel(actor);}
 pauseTick(dt){
  this.effects.update(dt);this.tickReaction(this.playerState,this.player,dt);
  for(const bot of this.bots){this.tickReaction(bot.health,bot.actor,dt);this.pose(bot.avatar,bot.actor,bot.health,dt,bot.graph);bot.view.trail?.clear();}
 }
 opponents(record){return this.records().filter(other=>other!==record&&other.actor!==record.actor&&!other.health.dead&&
  (record.id===this.modeState?.chaser||other.id===this.modeState?.chaser));}
 botInput(bot,dt){
  bot.cooldown-=dt;
  const targets=this.opponents(bot).sort((a,b)=>distance(bot.actor,a.actor)-distance(bot.actor,b.actor)),target=targets[0];
  if(!target||this.mode==='passive')return {facing:bot.actor.facing};
  const p=bot.actor.position,q=target.actor.position,dx=q.x-p.x,dz=q.z-p.z,n=Math.hypot(dx,dz)||1,hunter=bot.id===this.modeState?.chaser;
  const swing=n<2.5&&bot.cooldown<=0&&!blockedMeleeContact(bot.actor,target.actor);
  const vx=hunter?dx:-dx,vz=hunter?dz:-dz,length=n;
  const move=hunter?n>2.1:n<10;
  if(swing)bot.cooldown=1.6;
  return {facing:swing?Math.atan2(dx,dz):Math.atan2(vx,vz),x:move?vx/length:0,z:move?vz/length:0,light:swing,lightShort:swing};
 }
 tick(dt,input){
  input=this.reactionInput(this.playerState,input);
  input=this.receivedInputBeforeTick(input);
  const recoveryInputs=new Map();
  for(const bot of this.bots)if(bot.health.blowReaction)recoveryInputs.set(bot.actor,this.reactionInput(bot.health,this.botInput(bot,dt)));
  bindCombatBodyContacts(this.records());
  this.effects.update(dt,{deferAvatarEmissions:this.pause<=0});this.shake=Math.max(0,this.shake-dt);
  for(const r of this.records())this.tickReaction(r.health,r.actor,dt);
  if(this.pause>0){
   for(const r of this.records())r.actor.advanceWeaponEffects?.(dt);
   this.pause=Math.max(0,this.pause-dt);this.advanceRangedPushes(dt);
   // Damage18's fitted cursor follows the already-advanced health age. Seek
   // only these bot poses; controls, physics and the other reactions stay paused.
   for(const bot of this.bots)if(bot.health.reaction==='damage'||bot.health.blowReaction)this.pose(bot.avatar,bot.actor,bot.health,0,bot.graph);
   return [];
  }
  const batches=[];
  for(const r of this.records()){
   let events=[];
   if(r.health.locked)this.stepReaction(r.actor,dt,r.health);
   else events=r.actor.step(dt,r.id==='local'?input:recoveryInputs.get(r.actor)??this.botInput(r,dt));
   if(events.includes('respawn'))this.onFall?.(r.actor);
   if(this.modeState?.phase==='playing'&&(events.includes('attack')||events.includes('shot')||events.includes('shotMax')))this.modeState.emit('attack',{id:r.id});
   playSurfaceImpact(r.actor,events,this.effects,this.getAudio(r.actor.weapon,r.actor.sex));
   if(r.id!=='local'){this.getAudio(r.actor.weapon,r.actor.sex).events(events,r.actor.attack,r.actor);r.graph.events(events);}
   batches.push({r,events});
  }
  for(const {r,events} of batches){
   this.resolveMapMeleeHits(r.actor,events);
   for(const target of this.opponents(r)){
    this.resolve(r.actor,target.actor,target.health,target.avatar,events);
    if(r.actor.airgun&&(events.includes('shot')||events.includes('shotMax'))){
     const dx=target.actor.position.x-r.actor.position.x,dz=target.actor.position.z-r.actor.position.z,n=Math.hypot(dx,dz),max=events.includes('shotMax');
     if(n<=(max?7.8:6)&&dx*Math.sin(r.actor.facing)+dz*Math.cos(r.actor.facing)>n*Math.cos(35*Math.PI/180)&&Math.abs(target.actor.position.y-r.actor.position.y)<1.8&&!blockedMeleeContact(r.actor,target.actor))
      this.receive(target.actor,target.health,target.avatar,r.actor,{weapon:'airgun',kind:max?'shotMax':'shot'});
    }
   }
  }
  this.advanceRangedPushes(dt);
  // Resolve each opponent's equipment and effect sockets after its own mixer.
  // The local player's pose and cues are evaluated later by animateAvatar.
  for(const bot of this.bots){this.pose(bot.avatar,bot.actor,bot.health,dt,bot.graph);this.cue(bot.actor,bot.avatar);bot.view.trail?.update(dt,bot.actor.attack);bot.view.bar.style.transform=`scaleX(${bot.health.hp/bot.health.maxHp})`;bot.view.number.textContent=`${Math.ceil(bot.health.hp)} / ${bot.health.maxHp}`;}
  return batches[0].events;
 }
 resolveRifleShots(avatar){
  // Every controller can queue a real rifle shot. Resolving only the local
  // actor dropped bot contacts even though their attack event reached the mode.
  for(const source of this.records()){
   const targets=this.opponents(source).map(record=>record.actor);
   resolveRifleShots(source.actor,source.id==='local'?avatar:source.avatar,targets,contact=>{
    const record=this.actorRecord(contact.target);
    if(contact.hit&&record){this.receiveRifleContact(record.actor,record.health,record.avatar,source.actor,contact);this.pause=0;const sound=rifleImpactSoundKey(contact);if(sound)this.getAudio(source.actor.weapon,source.actor.sex).play(sound);}
    else if(contact.wall)this.getAudio(source.actor.weapon,source.actor.sex).play('wallHit');
   });
  }
 }
 render(camera,visible){super.render(camera,visible);for(const bot of this.bots.slice(1))bot.view.render(camera,visible);}
 dispose(){for(const bot of this.bots.slice(1))bot.view.dispose();super.dispose();}
}
const distance=(a,b)=>Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
