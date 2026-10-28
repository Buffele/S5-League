import {createNativeModeRoster} from './mode-native-scoreboard.js';
const name=id=>id==='local'?'You':id==='bot'?'Bot 1':id==='bot2'?'Bot 2':id;
const clock=value=>`${Math.floor(Math.max(0,value)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,value)%60).toString().padStart(2,'0')}`;
// Readability totals only. Native A4/B0/C0/C8/BC categories stay separate in
// CaptainState, including a suicide at score0. No category is rewritten here.
export const captainParticipantTotals=p=>({kills:p.kills+p.captainKills,deaths:p.deaths+p.captainDeaths+p.suicides});
export function captainRosterText(p){
 const total=captainParticipantTotals(p);
 return `${name(p.id)} · ${p.team.toUpperCase()} · ${p.score} pts · ${p.isCaptain?'CAPTAIN':p.alive?'FIGHTER':'ELIMINATED'}\nEliminations ${total.kills} : captains ${p.captainKills} · fighters ${p.kills} · Assists ${p.killAssists} · Heals received ${p.healAssists}\nDeaths ${total.deaths} : captains ${p.captainDeaths} · fighters ${p.deaths} · suicides ${p.suicides} · Rounds won ${p.roundsWon}`;
}
function validateNativeEffects(effects){if(effects!==null&&(!effects||['update','render','reset','dispose','snapshot'].some(key=>typeof effects[key]!=='function')||effects.snapshot().disposed))throw Error('Invalid Captain native effect port');}
export function createCaptainUI({team,onRestart,nativeEffects=null}){
 validateNativeEffects(nativeEffects);let disposed=false;
 const root=document.createElement('section');root.id='match-ui';root.dataset.nativeModeUi='captain';root.classList.add('s4-secondary-mode-ui');root.dataset.s4ModeUi='captain';root.dataset.s4Presentation='authenticated-assets-s5-layout';root.setAttribute('aria-label','Captain match');
 root.innerHTML='<div class="td-scoreboard"><span class="captain-time-bar" aria-hidden="true"><i></i></span><div class="td-team td-alpha"><span>ALPHA</span><strong data-alpha>0</strong></div><div class="td-clock"><small>CAPTAIN</small><b data-clock></b><span data-period></span></div><div class="td-team td-beta"><strong data-beta>0</strong><span>BETA</span></div></div><div class="td-objective"><span class="td-diamond" aria-hidden="true"></span><div><small data-role></small><b data-objective></b><span data-detail></span></div></div><div class="td-announcement" hidden role="status" aria-live="polite"><small>CAPTAIN</small><strong data-title></strong><p data-caption></p><div class="td-progress"><i></i></div><button type="button" hidden>Return to room</button></div><div class="match-roster" hidden><b>SCOREBOARD</b><div data-roster></div></div><div class="match-feed" aria-live="polite"></div>';
 document.body.append(root);const el=s=>root.querySelector(s),text=(s,value)=>{if(el(s).textContent!==value)el(s).textContent=value;};el('button').onclick=onRestart;
 const roster=createNativeModeRoster({container:el('.match-roster'),mode:'captain',playerName:name,playerDetails:captainRosterText,
  playerCells:p=>({name:name(p.id),score:p.score,...captainParticipantTotals(p),state:p.isCaptain?'CAPTAIN':p.alive?'ACTIVE':'OUT'})});
 // Keep role/count/category details available in Tab rather than overlaying
 // the combat view. The approved HUD already carries score, round and time.
 el('.match-roster').prepend(el('.td-objective'));
 return {root,setNativeEffects(effects){if(disposed)throw Error('Captain UI disposed');if(effects===nativeEffects)return;validateNativeEffects(effects);nativeEffects?.dispose();nativeEffects=effects;root.dataset.nativeScene='';root.dataset.nativeParticles=String(0);root.dataset.nativeCountdown='';},render(renderer){if(!disposed)nativeEffects?.render(renderer);},setRoster(show){el('.match-roster').hidden=!show;},reset(){if(disposed)return;root.dataset.nativeScene='';root.dataset.nativeParticles=String(0);root.dataset.nativeCountdown='';nativeEffects?.reset();roster.reset();el('.match-feed').replaceChildren();el('.match-roster').hidden=true;},
  feed(message){const p=document.createElement('p');p.textContent=message;el('.match-feed').prepend(p);while(el('.match-feed').children.length>4)el('.match-feed').lastChild.remove();setTimeout(()=>p.remove(),6000);},
  update(state,{health,visible=true,dt=0}){
   if(disposed)return;nativeEffects?.update(dt,state,visible,team);const effects=nativeEffects?.snapshot(),activeEffect=effects?.scenes?.find(s=>s.visible);root.dataset.nativeCountdown=String(effects?.countdown?.visible?effects.countdown.digit:'');root.dataset.nativeScene=activeEffect?.name??'';root.dataset.nativeParticles=String(activeEffect?.particles?.particles??0);root.hidden=!visible;root.dataset.mode='captain';root.dataset.team=team;const local=state.players.get('local'),phase=health.dead&&state.phase==='playing'?'dead':state.phase,counts=state.captainCounts();root.dataset.phase=phase;
   el('.captain-time-bar i').style.transform=`scaleX(${Math.max(0,Math.min(1,state.remaining/state.rules.roundSeconds))})`;
   const hudRound=state.round+(state.phase==='intermission'?1:0);
   text('[data-alpha]',String(state.scores.alpha));text('[data-beta]',String(state.scores.beta));text('[data-clock]',clock(state.remaining));text('[data-period]',`ROUND ${hudRound}/${state.rules.roundLimit} · ${state.rules.scoreLimit} WINS`);text('.td-clock small',`ROUND ${hudRound}`);
   text('[data-role]',`${team.toUpperCase()} · ${local.isCaptain?'CAPTAIN':'FIGHTER'}`);text('[data-objective]',`Captains Alpha ${counts.alpha} · Beta ${counts.beta}`);
   const totals=captainParticipantTotals(local);
   text('[data-detail]',`${local.score} pts · ${totals.kills} kills · ${totals.deaths} deaths · Tab : scoreboard`);
   const victory=state.winner===team;root.dataset.result=state.winner===null?'draw':victory?'win':'defeat';
   el('.td-announcement').hidden=phase==='playing';el('button').hidden=phase!=='result';
   text('[data-title]',phase==='dead'?'OUT':phase==='intermission'?'ROUND OVER':phase==='result-countdown'?'MATCH OVER':phase==='result'?(state.winner===null?'DRAW':victory?'VICTORY':'DEFEAT'):'');
   text('[data-caption]',phase==='dead'?`Return as a fighter in ${Math.max(0,Math.ceil(4-health.age))} s`:phase==='intermission'?`${state.outcome.winner?.toUpperCase()??'DRAW'} · Next round in ${Math.ceil(state.pause)} s`:phase==='result-countdown'?`Results in ${Math.ceil(state.pause)} s`:phase==='result'?'Press Enter to return to the waiting room':'');
   const progress=phase==='dead'?Math.max(0,1-health.age/4):phase==='intermission'?state.pause/state.rules.intermissionSeconds:phase==='result-countdown'?state.pause/(state.rules.resultAnnouncementSeconds||1):0;el('.td-progress i').style.transform=`scaleX(${progress})`;
   roster.update(state);
  },dispose(){if(disposed)return;disposed=true;nativeEffects?.dispose();roster.dispose();root.remove();}
 };
}
