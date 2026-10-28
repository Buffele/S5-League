import {renderS4BattleRoyalBoard} from './s4-br-native-board.js';
import {battleRoyalDisplayedScore,compareBattleRoyalParticipants} from './battle-royal-hud-score.js';
const participantName=id=>id==='local'?'You':id==='bot'?'Bot 1':id==='bot2'?'Bot 2':'—';
const participantLabel=person=>typeof person?.name==='string'&&person.name.trim()?person.name:participantName(person?.id);
const displayedScore=person=>person?String(battleRoyalDisplayedScore(person)):'—';
const clock=value=>`${Math.floor(Math.max(0,value)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,value)%60).toString().padStart(2,'0')}`;
// These aggregates are S5 presentation totals; raw native categories remain
// separate in the state and comparisons.
export const battleRoyalParticipantTotals=p=>({kills:p.kills+p.bonusKills+p.leaderKills,deaths:p.deaths+p.bonusDeaths+p.suicides+p.leaderSuicides,assists:p.killAssists+p.bonusKillAssists+p.leaderKillAssists});
export function createBattleRoyalUI({onRestart}){
 const root=document.createElement('section');root.id='match-ui';root.className='s4-secondary-mode-ui';root.dataset.s4ModeUi='battleroyal';root.setAttribute('aria-label','Battle Royal match');
 root.innerHTML='<div class="br-native-hud" role="group" aria-label="Battle Royal leading score and local points"><b class="br-first-place" aria-label="Leading score"><span data-br-leader-name>—</span><span aria-hidden="true"> : </span><span data-br-leader-score>—</span></b><div class="br-local-points"><span>My Points:</span><b data-left-score>—</b></div><span class="br-session-rule" data-period></span></div><b class="br-native-clock" data-clock aria-label="Remaining time"></b><div class="td-announcement" hidden role="status" aria-live="polite"><img class="s4-br-result-art" data-result-art hidden alt=""><small data-kicker></small><strong data-title></strong><p data-caption></p><div class="td-progress"><i></i></div><div data-result-board hidden></div><button type="button" hidden>Return to room</button></div><div class="match-roster" hidden><b>INDIVIDUAL RANKING</b><div data-roster></div><div class="td-objective"><span class="td-diamond">◆</span><div><small>FREE FOR ALL</small><b data-objective></b><span data-detail></span></div></div></div><div class="match-feed" aria-live="polite"></div>';
 document.body.append(root);const el=s=>root.querySelector(s),text=(s,value)=>{if(el(s).textContent!==value)el(s).textContent=value;};
 el('button').onclick=onRestart;let lastAnnouncement='';
 return {root,setRoster(show){el('.match-roster').hidden=!show;},reset(){el('.match-feed').replaceChildren();el('.match-roster').hidden=true;lastAnnouncement='';},
  feed(message){const p=document.createElement('p');p.textContent=message;el('.match-feed').prepend(p);while(el('.match-feed').children.length>4)el('.match-feed').lastChild.remove();setTimeout(()=>p.remove(),6000);},
  update(state,{health,visible=true}){
   root.hidden=!visible;const phase=health.dead&&state.phase==='playing'?'dead':state.phase;root.dataset.phase=phase;root.dataset.mode='battleroyal';root.dataset.leader=state.leader||'';
   const local=state.players.get('local'),ranked=[...state.players.values()].sort(compareBattleRoyalParticipants),first=ranked[0],totals=local?battleRoyalParticipantTotals(local):null;
   // Native008B40B0 takes the first refreshed briefing account, not the
   // designated bonus account. Local numeric ordering is documented in the
   // score helper; native metadata priority and exact ties remain unverified.
   text('[data-left-score]',displayedScore(local));text('[data-br-leader-name]',participantLabel(first));text('[data-br-leader-score]',displayedScore(first));
   text('[data-clock]',clock(state.remaining));text('[data-period]',`${state.rules.scoreLimit} POINTS`);
   text('[data-objective]',state.leader?`LEADER · ${participantName(state.leader)}`:'Take first place');
   text('[data-detail]',`Elimination +2 · Leader +5 · Suicide: match score −1${totals?` · ${totals.kills} kills · ${totals.deaths} deaths`:''} · Tab: ranking`);
   const victory=state.winner==='local';root.dataset.result=state.winner===null?'draw':victory?'win':'defeat';
   el('.td-announcement').hidden=phase==='playing';el('button').hidden=phase!=='result';
   el('[data-result-art]').hidden=phase!=='result'||state.winner===null;el('[data-result-art]').src='/assets/s5runtime/chaser/ui/'+(victory?'ingame_win.png':'ingame_lose.png');
   text('[data-kicker]',phase==='dead'?'RESPAWNING':'BATTLE ROYAL');
   text('[data-title]',phase==='dead'?'ELIMINATED':phase==='result-countdown'?'MATCH OVER':phase==='result'?(state.winner===null?'DRAW':victory?'VICTORY':'DEFEAT'):'');
   text('[data-caption]',phase==='dead'?`Respawning in ${Math.max(0,Math.ceil(4-health.age))} s`:phase==='result-countdown'?`Results in ${Math.ceil(state.pause)} s`:phase==='result'?'Press Enter to return to the waiting room':'');
   el('.td-progress i').style.transform=`scaleX(${phase==='dead'?Math.max(0,1-health.age/4):phase==='result-countdown'?state.pause/(state.rules.resultAnnouncementSeconds||1):0})`;
   const rows=ranked.map(p=>({id:p.id,name:participantLabel(p),score:battleRoyalDisplayedScore(p),state:p.alive?'Alive':'Eliminated',alive:p.alive,ping:'—',exp:'—',pen:'—'})),details=ranked.map(p=>{const counts=battleRoyalParticipantTotals(p);return {id:p.id,name:participantLabel(p),text:`${p.id===state.leader?'LEADER · ':''}${counts.kills} kills · ${counts.deaths} deaths · ${counts.assists} assists${p.alive?'':' · ELIMINATED'}`};});
   renderS4BattleRoyalBoard(el('[data-roster]'),rows,{details});el('[data-result-board]').hidden=phase!=='result';if(phase==='result')renderS4BattleRoyalBoard(el('[data-result-board]'),rows,{result:true,details});
   const key=phase==='playing'?'':phase+(phase==='dead'?health.serial:state.serial);if(key!==lastAnnouncement){lastAnnouncement=key;if(key)el('.td-announcement').animate?.([{opacity:0},{opacity:1}],{duration:250});}
  },dispose(){root.remove();}
 };
}
