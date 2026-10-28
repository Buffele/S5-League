import {renderS4PracticeBoard} from './s4-practice-native-board.js';
const time=value=>{const seconds=Math.max(0,Math.ceil(value));return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;};
export function createPracticeSessionUI({onRestart,onExit,mount=true}){
 const root=document.createElement('section');root.id='practice-session';root.className='s4-secondary-mode-ui s4-practice-session-ui';root.dataset.s4ModeUi='practice-session';root.setAttribute('aria-label','Practice — source diagnostics');
 // Common S4 assets adapt to the partial Practice session; no mission or result producer is invented.
 root.innerHTML='<div class="s4-practice-board"><img class="s4-practice-frame" src="/assets/s5runtime/ui/scoreboard_bg_alphablue.png" alt="" aria-hidden="true"><div class="s4-practice-session-clock"><small>PRACTICE · DIAGNOSTIC — PARTIAL MAP</small><b data-time></b><span data-option></span></div></div><div class="s4-practice-session-objective"><img class="s4-practice-objective-icon" src="/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/roominfo_icon_forward.png" alt="" aria-hidden="true"><p data-targets></p></div><div class="s4-practice-session-status" role="status" aria-live="polite"><img src="/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/roominfo_icon_timeleft.png" alt="" aria-hidden="true"><p data-clock></p></div><details class="s4-practice-limits"><summary>Partial map · Native limits</summary><p data-limits></p><div class="s4-practice-result"><h4>Unverified actor fields</h4><p class="s4-practice-health">HP <b data-health>—</b></p><div data-native-result></div></div></details><div class="s4-practice-actions"><button type="button" data-replay>Replay</button><button type="button" data-exit>Exit</button></div>';
 const el=s=>root.querySelector(s),text=(s,value)=>{if(el(s).textContent!==value)el(s).textContent=value;};
 el('[data-replay]').onclick=onRestart;el('[data-exit]').onclick=onExit;if(mount)document.body.append(root);
 return {mount(){document.body.append(root);},setRoster(show){el('.s4-practice-limits').open=!!show;},update(status,{visible=true}={}){
  root.hidden=!visible;root.dataset.status=JSON.stringify(status);root.dataset.phase=status.deadlineExpired?'deadline':'playing';
  text('[data-time]',time(status.remaining));text('[data-option]',status.option?.label??'Practice option unavailable');
  text('[data-clock]',status.deadlineExpired?'Time expired · native result unverified':`Time remaining ${Math.ceil(status.remaining)} s`);
  text('[data-targets]',`Sentries alive ${status.living} · destroying ${status.destroying} · native score unverified`);
  text('[data-limits]',status.visibleLimitations.join(' · '));renderS4PracticeBoard(el('[data-native-result]'));text('[data-health]','—');
 },reset(){el('.s4-practice-limits').open=false;},dispose(){root.remove();}};
}
