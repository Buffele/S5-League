// Native5556F0 classifies by the Fumbi holder at death;1103610/11038A0/
//1103B30 credit2/4/4;1103720/11039B0/1103C40 credit assists1/2/2.
// Combat HP is not a verified native Damage Done/Taken unit.
import {TouchdownContributions} from './touchdown-contributions.js';
export const TD_COMBAT_POINTS=Object.freeze({ordinary:2,offense:4,defense:4});
export const TD_ASSIST_POINTS=Object.freeze({ordinary:1,offense:2,defense:2});
export const TD_POINTS_SCOPE='Local points: goals, pickups, eliminations and combat assists · Goal/healing assists not counted';
export class TouchdownStatistics{
 constructor(){this.players=new Map();this.contributions=new TouchdownContributions();}
 advance(dt){this.contributions.advance(dt);}
 register(id,team){
  if(typeof id!=='string'||!id||!['alpha','beta'].includes(team))return false;
  const existing=this.players.get(id);if(existing)return existing.team===team;
  this.players.set(id,{team,picks:0,eliminations:0,offenses:0,defenses:0,assists:0,offenseAssists:0,defenseAssists:0,unverifiedAssistTies:0,unclassifiedEliminations:0,deaths:0,combatHpDealt:0,combatHpTaken:0,dead:false});return true;
 }
 pickup(id,team){if(!this.register(id,team))return false;this.players.get(id).picks++;return true;}
 damage(sourceId,victimId,amount){
  const source=this.players.get(sourceId),victim=this.players.get(victimId);
  if(!source||!victim||source===victim||source.team===victim.team||victim.dead||!Number.isFinite(amount)||!Number.isFinite(Math.fround(amount))||Math.fround(amount)<=0)return false;
  source.combatHpDealt+=amount;victim.combatHpTaken+=amount;this.contributions.record(sourceId,victimId,amount);return true;
 }
 defeat(victimId,sourceId=null,holderId=null){
  const victim=this.players.get(victimId);if(!victim||victim.dead)return false;
  victim.dead=true;victim.deaths++;
  const source=this.players.get(sourceId);if(source&&source!==victim&&source.team!==victim.team){
   const selection=this.contributions.select(victimId,sourceId,this.players),assistant=this.players.get(selection.assistantId);
   source.eliminations++;
   // Target comparison has priority in the native selector. Possession is
   // sampled before the world adapter drops/returns the defeated carrier.
   const category=holderId===victimId?'defense':holderId===sourceId||(assistant&&holderId===selection.assistantId)?'offense':selection.ambiguousIds?.includes(holderId)?'unverified':'ordinary';
   if(category==='defense')source.defenses++;
   else if(category==='offense')source.offenses++;
   else if(category==='unverified')source.unclassifiedEliminations++;
   if(assistant){assistant.assists++;if(category==='defense')assistant.defenseAssists++;else if(category==='offense')assistant.offenseAssists++;}
   if(selection.tieUnverified)source.unverifiedAssistTies++;
  }
  this.contributions.clear(victimId);
  return true;
 }
 respawn(id){const player=this.players.get(id);if(player)player.dead=false;this.contributions.clear(id);}
 snapshot(id){const player=this.players.get(id);if(!player)return null;const {dead,team,...counts}=player;
  const ordinary=counts.eliminations-counts.offenses-counts.defenses-counts.unclassifiedEliminations;
  const ordinaryAssists=counts.assists-counts.offenseAssists-counts.defenseAssists;
  return {...counts,combatPoints:ordinary*TD_COMBAT_POINTS.ordinary+counts.offenses*TD_COMBAT_POINTS.offense+counts.defenses*TD_COMBAT_POINTS.defense+ordinaryAssists*TD_ASSIST_POINTS.ordinary+counts.offenseAssists*TD_ASSIST_POINTS.offense+counts.defenseAssists*TD_ASSIST_POINTS.defense};}
}
