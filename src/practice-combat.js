import {BattleRoyalCombat} from './battle-royal-combat.js';
// One native room participant; these other actors are provisional S5 target
// avatars, not additional Practice players or recovered native NPCs.
export class PracticeCombat extends BattleRoyalCombat{
 opponents(record){return record.id==='local'&&!record.health.dead?this.bots.filter(b=>!b.health.dead):[];}
 botInput(bot){return {facing:bot.actor.facing};}
}
