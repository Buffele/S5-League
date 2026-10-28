import {renderS4PracticeBoard} from './s4-practice-native-board.js';
const clock=value=>`${Math.floor(Math.max(0,value)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,value)%60).toString().padStart(2,'0')}`;
export function createPracticeUI({onRestart}){
 const root=document.createElement('section');root.id='match-ui';root.className='s4-secondary-mode-ui s4-practice-ui';root.dataset.s4ModeUi='practice';root.setAttribute('aria-label','Practice · local trials');
 root.innerHTML='<div class="td-scoreboard s4-practice-board"><img class="s4-practice-frame" src="/assets/s5runtime/ui/scoreboard_bg_alphablue.png" alt="" aria-hidden="true"><div class="td-team td-alpha"><span>S5 MISSIONS</span><strong data-score>—</strong></div><div class="td-clock"><small>PRACTICE · TRIALS</small><b data-clock></b><span data-limit></span></div></div><div class="td-objective"><img class="s4-practice-objective-icon" src="/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/roominfo_icon_forward.png" alt="" aria-hidden="true"><div><small>SOLO TRAINING</small><b>Eliminate S5 targets</b><span data-detail></span></div></div><div class="td-announcement" hidden role="status" aria-live="polite"><small>PRACTICE · LOCAL TRIAL</small><strong data-title></strong><p data-caption></p><div class="td-progress"><i></i></div><button type="button" hidden>Replay</button></div><div class="match-roster" hidden><b>INDIVIDUAL RESULT · S5</b><div data-native-result></div><p data-roster></p></div><div class="match-feed" aria-live="polite"></div><div class="td-local">LOCAL TRIAL <span>S5 targets · Native missions and Practice maps unverified</span></div>';
 document.body.append(root);const el=s=>root.querySelector(s),text=(s,v)=>{if(el(s).textContent!==v)el(s).textContent=v;};el('button').onclick=onRestart;
 return {root,setRoster(show){el('.match-roster').hidden=!show;},reset(){el('.match-feed').replaceChildren();el('.match-roster').hidden=true;},feed(message){const p=document.createElement('p');p.textContent=message;el('.match-feed').prepend(p);while(el('.match-feed').children.length>4)el('.match-feed').lastChild.remove();},
  update(state,{health,visible=true}){
   root.hidden=!visible;root.dataset.mode='practice';const phase=health.dead&&state.phase==='playing'?'dead':state.phase;root.dataset.phase=phase;root.dataset.result=state.phase==='result'?(state.winner?'win':'finished'):'';
   text('[data-score]',String(state.score));text('[data-clock]',clock(state.remaining));text('[data-limit]',`${state.unlimited?'UNLIMITED POINTS':`${state.rules.scoreLimit} POINTS`} · NO HALFTIME`);
   text('[data-detail]',`${state.counter} points · ${state.deaths} deaths · Tab: results`);text('[data-roster]',`You · ${state.counter} points · Missions ${state.missions} · Reference eliminations ${state.referenceKills} · Local deaths ${state.deaths} · PEN/EXP —`);
   renderS4PracticeBoard(el('[data-native-result]'),{score:state.counter});
   el('.td-announcement').hidden=phase==='playing';el('button').hidden=phase!=='result';
   text('[data-title]',phase==='dead'?'ELIMINATED':phase==='result-countdown'?'SESSION OVER':phase==='result'?(state.winner?'S5 TARGET REACHED':'TIME EXPIRED'):'');
   text('[data-caption]',phase==='dead'?`Respawn in ${Math.max(0,Math.ceil(4-health.age))} s`:phase==='result-countdown'?`Results in ${Math.ceil(state.pause)} s`:phase==='result'?'Press Enter to replay':'');
   el('.td-progress i').style.transform=`scaleX(${phase==='dead'?Math.max(0,1-health.age/4):phase==='result-countdown'?state.pause/(state.rules.resultAnnouncementSeconds||1):0})`;
  },dispose(){root.remove();}
 };
}
