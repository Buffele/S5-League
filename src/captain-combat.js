import {BattleRoyalCombat} from './battle-royal-combat.js';

// Shared multi-actor contacts; ordinary team opponents replace FFA targeting.
// Direct pursuit and four-second non-captain respawn remain S5 adaptations.
export class CaptainCombat extends BattleRoyalCombat{
 opponents(record){
  if(record.health.dead)return [];
  const team=this.modeState?.players.get(record.id)?.team;
  return this.records().filter(other=>other.actor!==record.actor&&!other.health.dead&&this.modeState?.players.get(other.id)?.team!==team);
 }
}
