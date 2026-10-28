import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
const f=Math.fround;
export const CONQUEST_CURRENT_PLAYER_BODY_POLICY=Object.freeze({id:'s5-conquest-current-player-collision-body',source:'7B24A0 nonzero player team pools; current S5 collider dimensions and position',nativeBodySelectionQualified:false,nativeReady:false});

// The1000 collection contains players. Monster bodies do not become members
// merely because they also own a solver. This local match has one real player.
export function createConquestPlayerBodyCollection({controller,combatState,playerActors,playerId,world,playerTeamSelectors,teamEntries,solverId,policy}={}){
 const record=playerActors?.get(playerId),collision=controller?.collision;
 if(!(controller instanceof Controller)||!(combatState instanceof CombatState)||record?.controller!==controller||record.combatState!==combatState||controller.world!==world||!(playerActors instanceof Map)||!(playerTeamSelectors instanceof Map)||!(teamEntries instanceof Map)||typeof solverId!=='string'||!solverId||policy!==CONQUEST_CURRENT_PLAYER_BODY_POLICY||!collision)throw Error('Actual local Conquest player/collider/team owners and explicit body policy required');
 const position=controller.position,entries=new Map(teamEntries);
 return Object.freeze({
  read(){
   if(playerActors.size!==1||playerActors.get(playerId)!==record||record.controller!==controller||record.combatState!==combatState||controller.world!==world||controller.position!==position||controller.collision!==collision||[1,2].some(key=>!entries.has(key)||teamEntries.get(key)!==entries.get(key)))throw Error('Complete unchanged current Conquest player body roster required');
   if(controller.s5runtimeShieldBodyState||controller.s5runtimeAnchoringBodyState||controller.nativeActorFrameConfiguration||controller.nativeJumpDiagnosticContext?.enabled)throw Error('Current player body route needs its own source collection reader');
   const team=playerTeamSelectors.get(playerId),r=collision.radii;
   if(![1,2].includes(team)||!['x','y','z'].every(key=>Number.isFinite(position[key])&&Number.isFinite(r?.[key])&&r[key]>0))throw Error('Current actual player team, position and collider radii required');
   const radii=['x','y','z'].map(key=>f(r[key]/SCN_SCENE_SCALE)),anchor=['x','y','z'].map(key=>f(position[key]/SCN_SCENE_SCALE));
   const row={qualified:true,solverId,eligible:!combatState.dead,raw678:[0,radii[1],0],raw684:anchor,raw690:radii};
   return {complete:true,teams:[1,2].map(key=>({enabled:true,actorsComplete:true,actors:key===team?[row]:[]})),policy,nativeReady:false};
  },
 });
}
