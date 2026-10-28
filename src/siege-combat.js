import {CaptainCombat} from './captain-combat.js';
import {blockedMeleeContact} from './melee-contact.js';

// Reuse opposing-team contacts, with an explicit S5 objective-seeking bot.
// Native pathfinding, point placement and contested-point arbitration remain
// unverified. The parent owns main routing; this class has no menu side effect.
export class SiegeCombat extends CaptainCombat{
 botInput(bot,dt){
  bot.cooldown-=dt;if(this.mode==='passive')return {facing:bot.actor.facing};
  const target=this.opponents(bot).sort((a,b)=>distance(bot.actor,a.actor)-distance(bot.actor,b.actor))[0];
  if(target&&distance(bot.actor,target.actor)<2.5&&!blockedMeleeContact(bot.actor,target.actor)){
   const dx=target.actor.position.x-bot.actor.position.x,dz=target.actor.position.z-bot.actor.position.z,swing=bot.cooldown<=0;
   if(swing)bot.cooldown=1.6;return {facing:Math.atan2(dx,dz),light:swing,lightShort:swing};
  }
  const team=this.modeState?.players.get(bot.id)?.team;
  const points=(this.siegePoints||[]).filter(p=>this.modeState?.points.get(p.id)?.owner!==team).sort((a,b)=>distance(bot.actor,{position:a})-distance(bot.actor,{position:b}));
  const objective=points[0];if(!objective)return {facing:bot.actor.facing};
  const dx=objective.x-bot.actor.position.x,dz=objective.z-bot.actor.position.z,n=Math.hypot(dx,dz);
  return {facing:n>.1?Math.atan2(dx,dz):bot.actor.facing,x:n>.3?dx/n:0,z:n>.3?dz/n:0};
 }
}
const distance=(a,b)=>Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
