import {ChaserCombat} from './chaser-combat.js';
import {blockedMeleeContact} from './melee-contact.js';

// Local FFA adapter over the existing multi-actor contact engine. Targeting,
// direct pursuit and four-second respawn are S5 policies, not native AI/spawns.
export class BattleRoyalCombat extends ChaserCombat{
 opponents(record){
  if(record.health.dead)return [];
  return this.records().filter(other=>other.actor!==record.actor&&!other.health.dead);
 }
 botInput(bot,dt){
  bot.cooldown-=dt;
  const target=this.opponents(bot).sort((a,b)=>distance(bot.actor,a.actor)-distance(bot.actor,b.actor))[0];
  if(!target||this.mode==='passive')return {facing:bot.actor.facing};
  const p=bot.actor.position,q=target.actor.position,dx=q.x-p.x,dz=q.z-p.z,n=Math.hypot(dx,dz)||1;
  const swing=n<2.5&&bot.cooldown<=0&&!blockedMeleeContact(bot.actor,target.actor);
  if(swing)bot.cooldown=1.6;
  return {facing:Math.atan2(dx,dz),x:n>2.1?dx/n:0,z:n>2.1?dz/n:0,light:swing,lightShort:swing};
 }
 tick(dt,input){
  const events=super.tick(dt,input);
  if(this.autoRespawn&&this.modeState?.phase==='playing')for(const record of this.records()){
   if(!record.health.dead||record.health.age<4)continue;
   this.cancel(record.actor);record.actor.fireball=null;record.health.effect?.clear();record.health.reset();record.actor.reset();
   record.actor.position={...(record.id==='local'?(this.world.spawn||record.actor.position):(record.home||this.enemyHome))};
   record.graph?.reset();record.view?.trail?.clear();record.cooldown=.5;
   this.onRespawn?.(record.actor);
   if(record.id==='local')events.push('respawn');
  }
  return events;
 }
}
const distance=(a,b)=>Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
