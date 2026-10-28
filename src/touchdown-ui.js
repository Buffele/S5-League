import {TD_POINTS_SCOPE} from './touchdown-statistics.js';
const clock=value=>`${Math.floor(Math.max(0,value)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,value)%60).toString().padStart(2,'0')}`;
const recordedFields=[['picks','Fumbi pickups'],['objectivePoints','Objective points (pickups + goals)'],['eliminations','Eliminations'],['deaths','Deaths'],['combatHpDealt','Combat HP dealt'],['combatHpTaken','Combat HP taken']];
const statisticKeys=[...recordedFields.map(([key])=>key),'offenses','defenses','assists','unverifiedAssistTies','unclassifiedEliminations','combatPoints','recordedPoints'];
const rosterDisclosures=new WeakMap();

// score.xui: 598x238 on a 2880x2160 canvas. Message source uses 1024x768.
// Score proportions and native resources are retained; viewport sizing, local
// objective detail and accessible participant tables are S5 adaptations.
export const S4_TEAM_UI_SOURCE=Object.freeze({score:'xui2/layout/ingame/hud/score.xui',messages:'gui/new/gamemessage_ingame.xui',scoreboard:'xui2/layout/ingame/hud/scoreboard.xui',resultGlyphs:'work/chaser-visuals/prepare-global-ui.py: win crop(208,116,256,256), defeat crop(208,0,256,256), rotate90',limits:'TD/DM scoreboard includes are authenticated in work. Goal and win/lose SCN fragments have an optional renderer port; halftime/death scenes and complete SEQ compositions are not published. Local table omits unavailable native fields; no network statistics or rewards are synthesized.'});

// TD XUI provides these six header names and two team panels. Its dynamic player
// template is not recovered here: table geometry/row status text are S5 adapters.
function touchdownRosterSnapshot(participants,scores){
 return {available:Array.isArray(participants),scores:{alpha:scores.alpha,beta:scores.beta},
  participants:(Array.isArray(participants)?participants:[]).filter(person=>person&&['alpha','beta'].includes(person.team)).map(person=>({
   id:typeof person.id==='string'?person.id:'',team:person.team,
   name:typeof person.name==='string'&&person.name.trim()?person.name:'—',local:person.local===true,
   goals:Number.isInteger(person.goals)&&person.goals>=0?person.goals:'—',
   statistics:person.statistics&&typeof person.statistics==='object'?Object.fromEntries(statisticKeys.map(key=>[key,Number.isFinite(person.statistics[key])&&person.statistics[key]>=0?person.statistics[key]:'—'])):null,
   status:person.dead===true?'Out':person.carrying===true?'Carrying Fumbi':person.dead===false?'Alive':'—',
  }))};
}
function renderTouchdownRoster(host,snapshot){
 const disclosureState=new Map((rosterDisclosures.get(host)??[]).map(node=>[node.dataset.participantStatistics,node.open])),disclosures=[];rosterDisclosures.set(host,disclosures);
 host.replaceChildren();host.className='td-participant-board';
 if(!snapshot.available||!snapshot.participants.length){const empty=document.createElement('p');empty.className='td-participants-empty';empty.textContent=snapshot.available?'No participants recorded':'Participant data unavailable';host.append(empty);}
 for(const team of ['alpha','beta']){
  const group=document.createElement('section');group.className='td-roster-team';group.dataset.team=team;group.setAttribute('aria-label',`${team.toUpperCase()} participants`);
  const heading=document.createElement('h3'),title=document.createElement('span'),total=document.createElement('span');
  title.textContent=team.toUpperCase();total.dataset.teamTotal=team;const score=snapshot.scores[team];total.textContent=`Team touchdowns: ${Number.isInteger(score)&&score>=0?score:'—'}`;heading.append(title,total);group.append(heading);
  const table=document.createElement('table'),head=document.createElement('thead'),labels=document.createElement('tr'),body=document.createElement('tbody');
  for(const name of ['Emblem','Name','Recorded points','Goals','State','Ping']){const th=document.createElement('th');th.setAttribute('scope','col');th.textContent=name;labels.append(th);}head.append(labels);
  for(const person of snapshot.participants.filter(person=>person.team===team)){
   const row=document.createElement('tr');row.dataset.team=team;row.dataset.local=String(person.local);row.dataset.participantId=person.id;
   for(const [field,value]of [['emblem','—'],['name',person.name],['score',person.statistics?.recordedPoints??'—'],['goals',person.goals],['state',person.status],['ping','—']]){const cell=document.createElement('td');cell.dataset.field=field;cell.textContent=String(value);row.append(cell);}body.append(row);
  }
  table.append(head,body);group.append(table);host.append(group);
 }
 const recorded=snapshot.participants.filter(person=>person.statistics);
 if(recorded.length){
  const extra=document.createElement('section');extra.className='td-recorded-statistics';extra.setAttribute('aria-label','Recorded S5 statistics');
  for(const person of recorded){
   const detail=document.createElement('details'),heading=document.createElement('summary'),metrics=document.createElement('dl');detail.dataset.participantStatistics=person.id;detail.open=disclosureState.get(person.id)??(recorded.length<=2||person.local);
   heading.textContent=`${person.name} · Recorded S5 statistics`;detail.append(heading);disclosures.push(detail);
   for(const [field,label]of recordedFields){const term=document.createElement('dt'),value=document.createElement('dd');term.textContent=label;value.dataset.statistic=field;value.textContent=String(person.statistics[field]);metrics.append(term,value);}detail.append(metrics);
   if(Number.isFinite(person.statistics.combatPoints)){
    const breakdown=document.createElement('p');breakdown.className='td-combat-breakdown';breakdown.dataset.combatBreakdown=person.id;
    breakdown.textContent=`Combat points: ${person.statistics.combatPoints} · Attack: ${person.statistics.offenses} · Defense: ${person.statistics.defenses} · Assists: ${person.statistics.assists}`;
    if(person.statistics.unverifiedAssistTies>0)breakdown.textContent+=` · Unresolved assists: ${person.statistics.unverifiedAssistTies}`;
    if(person.statistics.unclassifiedEliminations>0)breakdown.textContent+=` · Pending kill credits: ${person.statistics.unclassifiedEliminations}`;detail.append(breakdown);
   }extra.append(detail);
  }host.append(extra);
 }
}

export function createS4TeamModeShell({mode,team,onRestart,nativeEffects=null}){
 if(nativeEffects!==null&&['sync','step','render','hide','reset','dispose','snapshot'].some(name=>typeof nativeEffects?.[name]!=='function'))throw Error('Invalid S4 team effects port');
 const root=document.createElement('section');root.id=mode==='touchdown'?'touchdown-ui':'match-ui';root.className='s4-team-mode';root.dataset.mode=mode;root.dataset.team=team;root.setAttribute('aria-label',`${mode==='touchdown'?'Touchdown':'Deathmatch'} match`);
 root.innerHTML=`<div class="td-scoreboard"><div class="td-team td-alpha"><span data-left-name>ALPHA</span><strong data-score="alpha" data-left-score>0</strong></div><div class="td-clock"><small data-mode>FIRST HALF</small><b data-clock>10:00</b><span data-period></span></div><div class="td-team td-beta"><strong data-score="beta" data-right-score>0</strong><span data-right-name>BETA</span></div><i class="s4-time-bar" aria-hidden="true"></i></div><div class="td-objective"><div><small data-team data-role></small><b data-objective></b><span data-detail></span></div></div><div class="td-announcement" hidden role="status" aria-live="polite"><small data-kicker></small><strong data-title></strong><p data-caption></p><div class="td-progress"><i></i></div><div data-result-roster hidden></div><button type="button" hidden>Return to room</button></div><div class="match-roster" hidden aria-label="Match scoreboard"><b>SCOREBOARD</b><p data-roster-summary></p><div data-roster></div><small class="s4-roster-scope">Local session · Only recorded match statistics are shown</small></div><div class="match-feed" aria-live="polite"></div><div class="td-local">LOCAL SESSION <span></span></div>`;
 document.body.append(root);const el=s=>root.querySelector(s),text=(s,value)=>{if(el(s).textContent!==value)el(s).textContent=value;};
 if(mode==='touchdown')el('.s4-roster-scope').textContent=TD_POINTS_SCOPE;
 let disposed=false,lastRows='',lastAnnouncement='',animation=null,effects=null;const timers=new Set();
 const setNativeEffects=value=>{if(value!==null&&['sync','step','render','hide','reset','dispose','snapshot'].some(name=>typeof value?.[name]!=='function'))throw Error('Invalid S4 team effects port');if(disposed)throw Error('Disposed team UI');if(effects===value)return;effects?.dispose();effects=value;root.dataset.nativeScene='none';};setNativeEffects(nativeEffects);
 const replay=el('button');replay.onclick=()=>{if(!disposed&&!root.hidden&&!replay.hidden&&root.dataset.phase==='result')onRestart?.();};
 const renderTable=(host,headers,rows)=>{host.replaceChildren();const table=document.createElement('table'),head=document.createElement('thead'),heading=document.createElement('tr'),body=document.createElement('tbody');for(const label of headers){const cell=document.createElement('th');cell.setAttribute('scope','col');cell.textContent=label;heading.append(cell);}head.append(heading);for(const row of rows){const tr=document.createElement('tr');tr.dataset.team=row.team;tr.dataset.local=String(row.local===true);for(const value of row.values){const cell=document.createElement('td');cell.textContent=String(value);tr.append(cell);}body.append(tr);}table.append(head,body);host.append(table);};
 return {root,el,text,setNativeEffects,get disposed(){return disposed;},
  clock(state){text('[data-score="alpha"]',String(state.scores.alpha));text('[data-score="beta"]',String(state.scores.beta));text('[data-clock]',clock(state.remaining));text('[data-mode]',state.half===1?'FIRST HALF':'SECOND HALF');text('[data-period]',`${state.half===1?'1ST':'2ND'} HALF · ${state.rules.scoreLimit} POINTS`);text('[data-team]',`TEAM ${team.toUpperCase()}`);},
  rows(headers,rows,summary){const key=JSON.stringify([headers,rows,summary]);if(key===lastRows)return;lastRows=key;text('[data-roster-summary]',summary);renderTable(el('[data-roster]'),headers,rows);renderTable(el('[data-result-roster]'),headers,rows);},
  participants(participants,scores,summary){const snapshot=touchdownRosterSnapshot(participants,scores),key=JSON.stringify(['participants',snapshot,summary]);if(key===lastRows)return;lastRows=key;text('[data-roster-summary]',summary);renderTouchdownRoster(el('[data-roster]'),snapshot);renderTouchdownRoster(el('[data-result-roster]'),snapshot);},
  announce(phase,serial,result,state){effects?.sync(state,{phase,visible:!root.hidden});root.dataset.nativeScene=effects?.snapshot().scenes.some(e=>e.visible)?'active':'none';root.dataset.phase=phase;root.dataset.result=result;el('.td-announcement').hidden=phase==='playing';replay.hidden=phase!=='result';el('[data-result-roster]').hidden=phase!=='result';if(phase==='result')el('.match-roster').hidden=true;const key=phase==='playing'?'':phase+serial;if(key!==lastAnnouncement){lastAnnouncement=key;animation?.cancel?.();if(key&&!globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)animation=el('.td-announcement').animate?.([{opacity:0},{opacity:1}],{duration:200,easing:'linear'});}},
  setRoster(show){if(!disposed)el('.match-roster').hidden=!show||root.hidden||root.dataset.phase==='result';},
  feed(message){if(disposed)return;const item=document.createElement('p');item.textContent=message;el('.match-feed').prepend(item);while(el('.match-feed').children.length>4)el('.match-feed').lastChild.remove();const timer=setTimeout(()=>{timers.delete(timer);item.remove();},6000);timers.add(timer);},
  reset(){effects?.reset();for(const timer of timers)clearTimeout(timer);timers.clear();el('.match-feed').replaceChildren();el('.match-roster').hidden=true;if(mode==='touchdown'){el('[data-roster]').replaceChildren();el('[data-result-roster]').replaceChildren();}lastAnnouncement='';lastRows='';animation?.cancel?.();},
  dispose(){if(disposed)return;this.reset();disposed=true;effects?.dispose();effects=null;replay.onclick=null;root.remove();}
 };
}

export function createTouchdownUI({team,onRestart,nativeEffects=null}){
 const shell=createS4TeamModeShell({mode:'touchdown',team,onRestart,nativeEffects}),{root,el,text}=shell;
 return {root,setNativeEffects:shell.setNativeEffects,setRoster:show=>shell.setRoster(show),reset:()=>shell.reset(),update(state,{dead,deathIn,deathReason='laser',distance,visible=true,opponent=false,participants}={}){
  if(shell.disposed)return;root.hidden=!visible;shell.clock(state);
  const carrying=state.owner?.id==='local',enemyCarrier=state.owner&&state.owner.id!=='local';text('[data-objective]',carrying?'You have the Fumbi':enemyCarrier?'The opponent has the Fumbi':state.ball==='dropped'?'Fumbi dropped':'Pick up the Fumbi');text('[data-detail]',carrying?`Reach the goal for ${team==='alpha'?'Beta':'Alpha'}${Number.isFinite(distance)?` · ${Math.round(distance)} m`:''}`:enemyCarrier?'Intercept them before they reach your goal':state.ball==='dropped'?`Returning to midfield in ${Math.ceil(state.returnIn)} s`:'At midfield');text('.td-local span',opponent?'Station 2 · Local opponent · Tab: scoreboard':'Station 2 · Tab: scoreboard');
  if(state.phase!=='playing'){text('[data-objective]',state.phase==='goal'?'Point scored':state.phase==='halftime'?'Match break':'Match over');text('[data-detail]',state.phase==='goal'?'The Fumbi returns to midfield':state.phase==='halftime'?'Get ready for the second half':'View the result');}
  const phase=dead&&state.phase==='playing'?'dead':state.phase,result=state.winner===null?'draw':state.winner===team?'win':'defeat';
  text('[data-title]',phase==='goal'?'TOUCHDOWN':phase==='dead'?'ELIMINATED':phase==='halftime'?'HALFTIME':state.winner===null?'DRAW':state.winner===team?'VICTORY':'DEFEAT');
  text('[data-kicker]',phase==='goal'?`POINT FOR ${state.scorer.toUpperCase()}`:phase==='dead'?(deathReason==='laser'?'ENEMY LASER':'ELIMINATED'):phase==='halftime'?'HALFTIME BREAK':'MATCH OVER');
  text('[data-caption]',phase==='goal'?`Restarting in ${Math.ceil(state.pause)} s`:phase==='dead'?`Respawning at base in ${Math.ceil(deathIn)} s`:phase==='halftime'?`Resuming in ${Math.ceil(state.pause)} s`:`ALPHA ${state.scores.alpha} — ${state.scores.beta} BETA · Press Enter to return to the waiting room`);
  el('.td-progress i').style.transform=`scaleX(${Math.max(0,Math.min(1,phase==='dead'?deathIn/state.rules.respawnSeconds:phase==='goal'?state.pause/state.rules.goalPause:phase==='halftime'?state.pause/state.rules.halfPause:0))})`;
  shell.participants(participants,state.scores,`${state.half===1?'1st':'2nd'} half · ${state.rules.scoreLimit} point limit · ${state.owner?`${state.owner.team.toUpperCase()} possession`:state.ball==='dropped'?'Fumbi dropped':state.ball==='scored'?'Touchdown scored':'Fumbi at midfield'}`);shell.announce(phase,state.serial,result,state);
 },dispose:()=>shell.dispose()};
}
