import {createNativeChaserUI} from './native-chaser-ui.js';
import {createBattleRoyalUI} from './battle-royal-ui.js';
import {createS4TeamModeShell} from './touchdown-ui.js';
export const participantName=id=>id==='local'?'You':id==='bot'?'Bot 1':id==='bot2'?'Bot 2':'—';
export function chaserHud(state){
 const local=state.players.get('local'),ranked=state.initial.map(id=>state.players.get(id)).sort((a,b)=>b.roundAttackDamage-a.roundAttackDamage),rank=ranked.findIndex(p=>p.id==='local')+1;
 return {target:state.bonus===null?'No active target':state.bonus==='local'?'YOU ARE THE BONUS TARGET':`BONUS TARGET · ${participantName(state.bonus)}`,
  hint:state.bonus==='local'?'Stay alive: your elimination gives the Chaser 4 points.':'Elimination: 2 pts · Bonus target: 4 pts',
  points:`Eliminations ${local.normalPoints} · Bonus ${local.bonusPoints} · Victory ${local.winPoints} · Survival ${local.survivalPoints}`,
  damage:`${Math.round(local.roundDamage)} damage this round${rank?` · Rank ${rank}/${ranked.length}`:''}`,
  summary:state.lastRound?state.lastRound.players.map(p=>`${participantName(p.id)} : +${p.points} pts · ${Math.round(p.damage)} damage`).join(' / '):'',
  damageRanking:'Damage to the Chaser : '+ranked.map((p,i)=>`${i+1}. ${participantName(p.id)} · ${Math.round(p.roundAttackDamage)}`).join(' / ')};
}
export function createMatchUI({mode,team,onRestart,nativeEffects}){
 if(mode==='battleroyal')return createBattleRoyalUI({onRestart});
 if(mode==='chaser')return createNativeChaserUI({onRestart,nativeEffects});
 const shell=createS4TeamModeShell({mode:'deathmatch',team,onRestart,nativeEffects:nativeEffects??null}),{root,el,text}=shell;
 return {root,setNativeEffects:shell.setNativeEffects,reset:()=>shell.reset(),setRoster:show=>shell.setRoster(show),feed:message=>shell.feed(message),update(state,{health,visible=true}){
  if(shell.disposed)return;root.hidden=!visible;shell.clock(state);
  const local=state.players.get('local'),dead=health.dead&&state.phase==='playing',phase=dead?'dead':state.phase;
  const victory=state.winner===team,result=state.winner===null?'draw':victory?'win':'defeat';
  text('.td-local span',`${state.players.size} participants · Tab: scoreboard`);text('[data-objective]','Increase your team score');text('[data-detail]',`${local.kills} elimination${local.kills===1?'':'s'} · ${local.deaths} death${local.deaths===1?'':'s'}`);
  text('[data-title]',phase==='dead'?'ELIMINATED':phase==='halftime'?'HALFTIME':phase==='result'?(state.winner===null?'DRAW':victory?'VICTORY':'DEFEAT'):'');text('[data-kicker]',phase==='result'?'MATCH OVER':phase==='halftime'?'HALFTIME BREAK':'DEATHMATCH');
  const respawn=state.rules.respawnSeconds;text('[data-caption]',dead?`Respawning at base in ${Math.max(0,Math.ceil(respawn-health.age))} s`:phase==='result'?`ALPHA ${state.scores.alpha} — ${state.scores.beta} BETA · Press Enter to return to the waiting room`:`Resuming in ${Math.ceil(state.pause)} s`);
  el('.td-progress i').style.transform=`scaleX(${Math.max(0,Math.min(1,dead?1-health.age/respawn:phase==='halftime'?state.pause/state.rules.halfPause:0))})`;
  const players=[...state.players.values()].sort((a,b)=>a.team.localeCompare(b.team)||b.score-a.score),teamCounters=players.some(p=>p.teamKills||p.teamDeaths);
  shell.rows(['Team','Player','Points','Kills','Deaths',...(teamCounters?['Team kills','Team deaths']:[])],players.map(p=>({team:p.team,local:p.id==='local',values:[p.team.toUpperCase(),p.name||p.nickname||(['local','bot','bot2'].includes(p.id)?participantName(p.id):String(p.id)),p.score,p.kills,p.deaths,...(teamCounters?[p.teamKills||0,p.teamDeaths||0]:[])]})),`ALPHA ${state.scores.alpha} — ${state.scores.beta} BETA · ${state.rules.scoreLimit} point limit`);
  shell.announce(phase,dead?health.serial:state.serial,result,state);
 },dispose:()=>shell.dispose()};
}
