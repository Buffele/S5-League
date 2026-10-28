import {createNativeModeRoster,renderNativeSiegePoints,siegePointLabel} from './mode-native-scoreboard.js';
const name=id=>id==='local'?'You':id==='bot'?'Bot 1':id==='bot2'?'Bot 2':id;
const clock=value=>`${Math.floor(Math.max(0,value)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,value)%60).toString().padStart(2,'0')}`;
export function siegeRosterText(p){return `${name(p.id)} · ${p.team.toUpperCase()} · ${p.score} pts${p.alive?'':' · ELIMINATED'}\nCaptures ${p.captures} (${p.captureScore} pts) · Assists ${p.captureAssists} (${p.captureAssistScore} pts) · Bonus ${p.buffScore} pts\nEliminations ${p.kills} · Assists ${p.killAssists} · Heals received ${p.healAssists} · Deaths ${p.localDeaths}`;}
export function createSiegeUI({team,onRestart}){
 const root=document.createElement('section');root.id='match-ui';root.dataset.nativeModeUi='siege';root.classList.add('s4-secondary-mode-ui');root.dataset.s4ModeUi='siege';root.dataset.s4Presentation='authenticated-assets-s5-layout';root.setAttribute('aria-label','Siege match');
 root.innerHTML='<div class="td-scoreboard"><div class="td-team td-alpha"><span>ALPHA</span><strong data-alpha>0</strong></div><div class="td-clock"><small>TIME LEFT</small><b data-clock></b><span data-period></span></div><div class="td-team td-beta"><strong data-beta>0</strong><span>BETA</span></div></div><div data-siege-hud-points role="group" aria-label="Capture points"></div><div class="td-objective"><span class="td-diamond" aria-hidden="true"></span><div><small>CAPTURE THE POINTS</small><b data-objective></b><span data-detail></span></div></div><div class="td-announcement" hidden role="status" aria-live="polite"><small>SIEGE</small><strong data-title></strong><p data-caption></p><div class="td-progress"><i></i></div><button type="button" hidden>Return to room</button></div><div class="match-roster" hidden><b>SCOREBOARD</b><div data-roster></div></div><div class="match-feed" aria-live="polite"></div>';
 document.body.append(root);const el=s=>root.querySelector(s),text=(s,v)=>{if(el(s).textContent!==v)el(s).textContent=v;};el('button').onclick=onRestart;
 const roster=createNativeModeRoster({container:el('.match-roster'),mode:'siege',playerName:name,playerDetails:siegeRosterText,
  playerCells:p=>({name:name(p.id),score:p.score,kills:p.kills,captures:p.captures,state:p.alive?'ACTIVE':'OUT'})});
 el('.match-roster').prepend(el('.td-objective'));
 const feedTimers=new Map();let observedState=null,eventSerial=0;
 const removeMessage=p=>{clearTimeout(feedTimers.get(p));feedTimers.delete(p);p.remove();};
 const clearFeed=()=>{for(const p of feedTimers.keys())removeMessage(p);};
 function feed(message){
  const p=document.createElement('p');p.textContent=message;el('.match-feed').prepend(p);
  feedTimers.set(p,setTimeout(()=>removeMessage(p),6000));
  while(el('.match-feed').children.length>4)removeMessage(el('.match-feed').lastChild);
 }
 function objectiveEvents(state,visible){
  // Render may repeat or skip simulation ticks. Consume real match events once,
  // without replaying old announcements when a room/result surface is hidden.
  if(observedState!==state||state.serial<eventSerial){clearFeed();observedState=state;eventSerial=state.serial;return;}
  if(visible&&state.phase==='playing')for(const event of state.events){
   if(event.serial<=eventSerial)continue;
   const index=state.pointIds.indexOf(event.point),point=state.points.get(event.point);
   if(index<0||!point)continue;
   const label=siegePointLabel(point,index);
   if(event.type==='capture')feed(`${event.owner.toUpperCase()} captured ${label}`);
   else if(event.type==='holding-score')feed(`${event.team.toUpperCase()} +${event.points} team points · ${label} held`);
  }
  eventSerial=state.serial;
 }
 return {root,setRoster(show){el('.match-roster').hidden=!show;},reset(){roster.reset();clearFeed();eventSerial=0;el('.match-roster').hidden=true;},
  feed,
  update(state,{health,visible=true}){
   root.hidden=!visible;root.dataset.mode='siege';root.dataset.team=team;
   objectiveEvents(state,visible);
   const phase=health.dead&&state.phase==='playing'?'dead':state.phase,local=state.players.get('local');root.dataset.phase=phase;
   text('[data-alpha]',String(state.scores.alpha));text('[data-beta]',String(state.scores.beta));text('[data-clock]',clock(state.remaining));text('[data-period]',`${state.rules.scoreLimit} POINTS · NO HALFTIME`);
   renderNativeSiegePoints(el('[data-objective]'),state);
   const pointsHud=el('[data-siege-hud-points]');pointsHud.hidden=state.phase!=='playing';renderNativeSiegePoints(pointsHud,state,{compact:true});
   text('[data-detail]',`${local.score} pts · Captures ${local.captures} · Objectives ${state.teamLedgers[team].objective} / Held zones ${state.holdingScores[team]} / Combat ${state.teamLedgers[team].combat} · Tab : scoreboard`);
   const victory=state.winner===team;root.dataset.result=state.winner===null?'draw':victory?'win':'defeat';
   el('.td-announcement').hidden=phase==='playing';el('button').hidden=phase!=='result';
   text('[data-title]',phase==='dead'?'OUT':phase==='result-countdown'?'MATCH OVER':phase==='result'?(state.winner===null?'DRAW':victory?'VICTORY':'DEFEAT'):'');
   text('[data-caption]',phase==='dead'?`Return in ${Math.max(0,Math.ceil(4-health.age))} s`:phase==='result-countdown'?`Results in ${Math.ceil(state.pause)} s`:phase==='result'?'Press Enter to return to the waiting room':'');
   el('.td-progress i').style.transform=`scaleX(${phase==='dead'?Math.max(0,1-health.age/4):phase==='result-countdown'?state.pause/(state.rules.resultAnnouncementSeconds||1):0})`;
   roster.update(state);
  },dispose(){clearFeed();roster.dispose();root.remove();}
 };
}
