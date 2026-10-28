import {ROOM_RESULTS_SECONDS} from './waiting-room-lifecycle.js';
import {TD_POINTS_SCOPE} from './touchdown-statistics.js';
const pickupAmount=value=>Number.isSafeInteger(value)&&value>=0?value:null;
const rewardText=value=>pickupAmount(value)===null?'—':String(value);
// Rank the same admitted point ledger shown during play. TD remains partial;
// unavailable native reward categories are never filled in. Stable ties retain
// participant registration order, not an inferred native tie-break policy.
export function roomResultPlayers(state){
 if(state.players instanceof Map)return [...state.players.values()].map(p=>({id:p.id,name:p.name||p.nickname||(p.id==='local'?'You':p.id==='bot'?'Bot 1':p.id==='bot2'?'Bot 2':p.id),team:p.team??null,value:p.score,metric:'Points',...(state.mode==='siege'?{pickupRewards:{experience:pickupAmount(p.experienceGained),pen:pickupAmount(p.penGained)}}:{})})).filter(p=>Number.isFinite(p.value)).sort((a,b)=>b.value-a.value);
 return [...state.statistics.players].map(([id,p])=>({id,name:id==='local'?'You':id==='bot'?'Simulated opponent':id,team:p.team,value:state.participantStatistics(id).recordedPoints,metric:'Points'})).filter(p=>Number.isFinite(p.value)).sort((a,b)=>b.value-a.value);
}
export function createWaitingRoomResults({document:doc=globalThis.document,artwork=null}={}){
 const root=doc.createElement('section');root.id='room-results';root.hidden=true;root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');root.setAttribute('aria-label','Match results');root.setAttribute('aria-describedby','room-results-score');
 root.innerHTML='<div class="room-results-card"><div class="room-results-heading"><small data-mode></small><h1 data-outcome></h1><p id="room-results-score" data-score></p></div><div class="room-results-board"><div class="room-results-teams"><h2 data-team-alpha>ALPHA</h2><h2 data-team-beta>BETA</h2></div><div class="room-results-columns"><div data-columns-alpha><span>#</span><span>Name</span><span data-metric-alpha>Points</span><span>EXP</span><span>PEN</span></div><div data-columns-beta><span>#</span><span>Name</span><span data-metric-beta>Points</span><span>EXP</span><span>PEN</span></div></div><ol data-top-scorers aria-label="Top scorers"></ol><p class="room-results-rewards">EXP / PEN: —</p></div><p class="room-results-return" data-room-countdown role="timer" aria-live="off"></p></div>';
 const pointsScope=doc.createElement('p');pointsScope.id='room-results-scope';pointsScope.className='room-results-scope';pointsScope.hidden=true;root.querySelector('.room-results-heading').append(pointsScope);root.setAttribute('aria-describedby','room-results-score room-results-scope');
 doc.body.append(root);const scorers=root.querySelector('[data-top-scorers]');scorers.tabIndex=0;let lastResult=null,savedFocus=null,siblings=[],disposed=false;
 function keyEvent(event){
  if(root.hidden||disposed)return;
  // Results have no validation/replay action. Tab must not reach the menu
  // behind this modal and activate Play or Leave before automatic return.
  event.stopPropagation();
  if(event.type==='keydown'&&event.key==='Tab'){
   event.preventDefault();
   // A long roster scrolls inside its source-sized panel. Give that panel a
   // keyboard stop while it overflows, still keeping both Tab directions in
   // this modal; native ranking/capacity are not inferred from its row count.
   const target=doc.activeElement===root&&scorers.scrollHeight>scorers.clientHeight?scorers:root;
   target.focus({preventScroll:true});
  }
 }
 for(const type of ['keydown','keyup','keypress'])root.addEventListener(type,keyEvent);
 function hide(){const ownedFocus=doc.activeElement===root||root.contains(doc.activeElement);root.hidden=true;root.setAttribute('aria-hidden','true');artwork?.hide();doc.body.classList.remove('room-results-open');for(const {node,inert}of siblings){if(inert===null)node.removeAttribute('inert');else node.setAttribute('inert',inert);}siblings=[];if(ownedFocus&&savedFocus?.isConnected!==false&&!savedFocus?.closest?.('[inert]'))savedFocus?.focus?.({preventScroll:true});savedFocus=null;}
 return {update(result,remaining){
  if(disposed)return false;
  const opening=root.hidden;if(opening){savedFocus=doc.activeElement;siblings=Array.from(doc.body.children).filter(node=>node!==root).map(node=>({node,inert:node.getAttribute('inert')}));for(const {node}of siblings)node.setAttribute('inert','');}
  root.hidden=false;root.setAttribute('aria-hidden','false');doc.body.classList.add('room-results-open');
  if(result!==lastResult){lastResult=result;root.querySelector('[data-mode]').textContent=({battleroyal:'BATTLE ROYAL',deathmatch:'DEATHMATCH',touchdown:'TOUCHDOWN',captain:'CAPTAIN',siege:'SIEGE',chaser:'CHASER'})[result.mode]??result.mode.toUpperCase();root.querySelector('[data-outcome]').textContent=result.outcome;root.querySelector('[data-score]').textContent=result.score;
   pointsScope.hidden=!['touchdown','siege'].includes(result.mode);
   const localRewards=result.players.find(p=>p.id==='local')?.pickupRewards;
   pointsScope.textContent=result.mode==='touchdown'?TD_POINTS_SCOPE:result.mode==='siege'?`Holding points go to the team only. EXP / PEN show pickups only; match rewards are not calculated.${localRewards?` Your pickups: ${rewardText(localRewards.experience)} EXP · ${rewardText(localRewards.pen)} PEN.`:''}`:'';
   const split=!['chaser','battleroyal'].includes(result.mode)&&result.players.length>0&&result.players.every(p=>p.team==='alpha'||p.team==='beta');
   root.dataset.teams=split?'split':'single';root.querySelector('[data-team-alpha]').textContent=split?'ALPHA':'TOP SCORERS';root.querySelector('[data-team-beta]').hidden=!split;root.querySelector('[data-columns-beta]').hidden=!split;
   const metric=result.players[0]?.metric??'Points';root.querySelector('[data-metric-alpha]').textContent=metric;root.querySelector('[data-metric-beta]').textContent=metric;
   const rows=root.querySelector('[data-top-scorers]');rows.replaceChildren();
   const teamRows={alpha:0,beta:0};
   for(const [index,p]of result.players.entries()){
    const item=doc.createElement('li');item.dataset.local=String(p.id==='local');item.dataset.team=p.team??'';item.dataset.top=String(index<3);item.style.gridColumn=split&&p.team==='beta'?'2':'1';item.style.gridRow=String(split?++teamRows[p.team]:index+1);
    const rank=doc.createElement('span'),name=doc.createElement('b'),value=doc.createElement('strong'),metric=doc.createElement('small'),exp=doc.createElement('span'),pen=doc.createElement('span');
    const rewards=result.mode==='siege'?p.pickupRewards:null;
    rank.textContent=String(index+1).padStart(2,'0');name.textContent=p.name;value.textContent=String(p.value);metric.textContent=p.metric;metric.className='room-results-metric';exp.textContent=rewardText(rewards?.experience);exp.className='room-results-exp';pen.textContent=rewardText(rewards?.pen);pen.className='room-results-pen';item.append(rank,name,value,metric,exp,pen);rows.append(item);
   }
   // A new match must reveal its top scorers even when the browser retains
   // this reused scroller's old position after replacing its children.
   rows.scrollTop=0;
  }
  artwork?.show(result.outcome,Math.max(0,ROOM_RESULTS_SECONDS-remaining));root.dataset.art=artwork?.snapshot().status??'none';
  root.querySelector('[data-room-countdown]').textContent=`Returning to the waiting room in ${Math.max(0,Math.ceil(remaining))} s`;
  if(opening)root.focus({preventScroll:true});
 },hide,get opened(){return !root.hidden;},render(renderer){if(!root.hidden)return artwork?.render(renderer)??false;return false;},dispose(){if(disposed)return;hide();disposed=true;for(const type of ['keydown','keyup','keypress'])root.removeEventListener(type,keyEvent);artwork?.dispose();root.remove();}};
}
