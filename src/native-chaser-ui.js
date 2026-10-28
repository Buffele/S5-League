import {renderS4SourceBoard,S4_RESULT_BOARD_LAYOUT} from './s4-chaser-native-board.js';
const fallbackName=id=>id==='local'?'You':id==='bot'?'Bot 1':id==='bot2'?'Bot 2':String(id);
const playerName=p=>p?.name||p?.nickname||fallbackName(p?.id);
export function nativeChaserModel(state,dead=false){
 const players=[...state.players.values()].sort((a,b)=>b.score-a.score);
 return {seconds:Math.ceil(state.roundRemaining),chaser:playerName(state.players.get(state.chaser)),target:state.bonus?playerName(state.players.get(state.bonus)):'—',targeted:state.bonus==='local',local:state.players.get('local'),leader:players[0],players,phase:dead&&state.phase==='playing'?'dead':state.phase};
}
export function chaserResultDetails(state){
 const players=[...state.players.values()].sort((a,b)=>b.score-a.score),local=state.players.get('local');
 return {total:local.score,categories:[['Eliminations',local.normalPoints],['Bonus targets',local.bonusPoints],['Victory',local.winPoints],['Survival',local.survivalPoints]],players:players.map(p=>({id:p.id,name:playerName(p),score:p.score,kills:p.kills,deaths:p.deaths,damage:Math.round(p.damage),healing:Math.round(p.healing),wins:p.wins}))};
}
export function createNativeChaserUI({onRestart,nativeEffects}){
 const root=document.createElement('section');root.id='match-ui';root.className='native-chaser-ui s4-chaser-ui';root.dataset.s4ModeUi='chaser';root.setAttribute('aria-label','Chaser match');document.body.append(root);
 const make=(tag,className,parent=root,value='')=>{const el=document.createElement(tag);el.className=className;el.textContent=value;parent.append(el);return el;};
 // Authenticated per-digit PNGs; sizing/layout are S5 bindings to native art.
 const nativeNumber=(host,value,color='green')=>{const text=String(value);if(host.dataset.value===text)return;host.dataset.value=text;host.setAttribute('aria-label',text);host.replaceChildren();make('span','ch-readable-number',host,text);for(const digit of text){if(!/^[0-9]$/.test(digit)){make('span','',host,digit);continue;}const img=make('img','ch-native-digit',host);img.src=`/assets/s5runtime/chaser/ui/ingame_score_number_${color}_${digit}.png`;img.alt='';img.setAttribute('aria-hidden','true');}};
 const scorePanel=make('div','ch-score-panel');
 const scoreRow=(label,kind)=>{const row=make('div','ch-score-row '+kind,scorePanel);make('span','ch-score-label',row,label);const name=make('strong','ch-score-name',row),score=make('b','ch-score-value',row);return {name,score};};
 const best=scoreRow('1st','ch-score-best'),mine=scoreRow('My score','ch-score-mine');
 const top=make('div','ch-round-panel'),roundLabel=make('span','ch-eyebrow',top),clock=make('b','ch-round-clock',top);
 const hunter=make('div','ch-hunter',top);make('span','',hunter,'CHASER');const hunterName=make('strong','',hunter);
 const survivorPanel=make('div','ch-survivors',top),pips=make('div','ch-survivor-pips',survivorPanel);
 survivorPanel.setAttribute('aria-label','Survivors');
 const target=make('div','ch-target');target.hidden=true;make('span','',target,'TARGET');const targetName=make('b','',target);
 const notice=make('div','ch-notice'),noticeKicker=make('span','ch-eyebrow',notice),noticeTitle=make('strong','',notice),noticeDetail=make('span','ch-notice-detail',notice);
 const feed=make('div','ch-point-feed');feed.setAttribute('aria-live','polite');
 const roster=make('div','ch-roster');roster.hidden=true;
 const results=make('div','ch-results');results.hidden=true;
 const resultCard=make('div','ch-result-card',results);make('span','ch-eyebrow',resultCard,'CHASER / RESULTS');
 const resultTitle=make('h2','',resultCard),resultTotal=make('div','ch-result-total',resultCard),resultBreakdown=make('div','ch-result-breakdown',resultCard),resultTable=make('div','ch-result-table',resultCard);
 const replay=make('button','ch-replay',resultCard,'Return to room');replay.onclick=onRestart;
 const table=(host,players,result=false)=>renderS4SourceBoard(host,players.map(p=>({id:p.id,name:result?p.name:playerName(p),score:p.score,alive:p.alive,state:p.alive===undefined?'—':p.alive?'Alive':'Eliminated',damage:p.damage===undefined?'—':Math.round(p.damage),chaser:'—',ping:'—',exp:'—',pen:'—'})),{...(result?{layout:S4_RESULT_BOARD_LAYOUT}:{}),kind:result?'result':'ranking',details:result?players.map(p=>({id:p.id,name:p.name,text:`${p.kills} kills · ${p.deaths} deaths · ${p.damage} damage · ${p.healing} healing · ${p.wins} rounds won` })):[]});
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const pulse=(el,color='#8bfff1')=>{if(!reducedMotion.matches)el?.animate?.([{filter:`drop-shadow(0 0 12px ${color})`,translate:'0 -2px'},{filter:'none',translate:'0 0'}],{duration:650,easing:'ease-out'});};
 let cursor=0,eventList=null,resultSerial=-1,survivorKey='',previousScore=null,previousLeader='',previousPhase='',previousTarget='',previousHp=null,huntingTarget=null;
 const living=new Map();
 return {root,reset(){cursor=0;eventList=null;resultSerial=-1;survivorKey='';previousScore=null;previousLeader='';previousPhase='';previousTarget='';previousHp=null;huntingTarget=null;living.clear();pips.replaceChildren();feed.replaceChildren();roster.hidden=true;target.hidden=true;nativeEffects?.reset();},setRoster(show){roster.hidden=!show;},feed(){},
  setTargetPosition(position,camera,visible,id){
   const eligible=!!visible&&!!id&&id===huntingTarget&&id!=='local'&&!root.hidden;
   nativeEffects?.setTargetPosition?.(position,camera,eligible,id);
   target.hidden=true;if(!eligible||!position||!camera||root.dataset.phase==='result')return;
   const p=position.clone().project(camera);if(![p.x,p.y,p.z].every(Number.isFinite)||p.z< -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return;
   target.style.left=((p.x+1)*50)+'%';target.style.top=((1-p.y)*50)+'%';target.dataset.player=id;target.hidden=false;
  },
  update(state,{health,chaserHealth,visible=true,dt=0}){
   // Native event-layer consumer is owned by the host; preserve its state/dt route.
   nativeEffects?.update(dt,state,visible);
   root.hidden=!visible;const m=nativeChaserModel(state,health.dead);root.dataset.phase=m.phase;root.dataset.result=state.winner===null?'draw':state.winner==='local'?'win':'defeat';
   const nextTarget=state.chaser==='local'&&!health.dead&&['preparation','playing'].includes(state.phase)&&state.bonus!=='local'&&state.players.get(state.bonus)?.alive?state.bonus:null;
   if(nextTarget!==huntingTarget||!visible)target.hidden=true;huntingTarget=nextTarget;
   if(eventList!==state.events||state.eventSerial<cursor){eventList=state.events;cursor=0;feed.replaceChildren();}
   for(const event of state.events)if(event.serial>cursor&&event.type==='points'&&event.id==='local'){
    const toast=make('div','ch-point-toast',feed);const plus=make('img','ch-native-plus',toast);plus.src='/assets/s5runtime/chaser/ui/ingame_etc_exp_plus.png';plus.alt='+';const amount=make('b','',toast);nativeNumber(amount,event.points);make('span','ch-point-label',toast,' points');setTimeout(()=>toast.remove(),2000);while(feed.children.length>3)feed.firstChild.remove();
   }cursor=state.eventSerial;
   if(previousScore!==null&&previousScore!==m.local.score){pulse(mine.score.parentElement);const toast=feed.lastElementChild;if(toast&&!reducedMotion.matches)for(let i=0;i<6;i++){const shard=make('i','ch-score-shard',toast);shard.style.setProperty('--dx',`${25+i*13}px`);shard.style.setProperty('--dy',`${-32+i*11}px`);}}
   if(previousLeader&&previousLeader!==m.leader.id)pulse(best.score.parentElement,'#d9ff69');previousScore=m.local.score;previousLeader=m.leader.id;
   best.name.textContent=playerName(m.leader);nativeNumber(best.score,m.leader.score,'white');mine.name.textContent=playerName(m.local);nativeNumber(mine.score,m.local.score);
   roundLabel.textContent=`ROUND ${state.round}`;nativeNumber(clock,String(m.seconds).padStart(3,'0'),'white');top.classList.toggle('is-urgent',m.seconds<=10&&m.phase==='playing');
   hunterName.textContent=m.chaser;
   const nextSurvivorKey=JSON.stringify([state.bonus,...state.initial.map(id=>[id,state.players.get(id)?.alive,playerName(state.players.get(id))])]);
   if(survivorKey!==nextSurvivorKey){
    survivorKey=nextSurvivorKey;
    const existing=new Map([...pips.children].map(pip=>[pip.dataset.player,pip]));
    for(const id of state.initial){
     const alive=!!state.players.get(id)?.alive,pip=existing.get(id)||make('span','ch-survivor',pips);
     pip.dataset.player=id;pip.title=playerName(state.players.get(id));pip.setAttribute('aria-label',`${pip.title} : ${alive?'alive':'dead'}`);
     pip.classList.toggle('is-out',!alive);pip.classList.toggle('is-bonus',id===state.bonus);
     if(living.get(id)===true&&!alive&&!reducedMotion.matches)pip.animate?.([{scale:'1',opacity:1},{scale:'1.35',opacity:.6},{scale:'1',opacity:1}],{duration:700,easing:'ease-out'});
     living.set(id,alive);existing.delete(id);
    }
    for(const pip of existing.values())pip.remove();
   }
   if(previousTarget!==state.bonus&&state.bonus)pulse(target,'#ffe58b');previousTarget=state.bonus;
   if(previousHp!==null&&health.hp!==previousHp)pulse(document.querySelector('#hud .health'),health.hp<previousHp?'#ff7d86':'#72ffe4');previousHp=health.hp;
   root.classList.toggle('is-low-hp',!health.dead&&health.hp<(health.maxHp||100)*.25);
   targetName.textContent=m.target;if(!huntingTarget||m.phase==='result')target.hidden=true;
   notice.hidden=!['preparation','intermission','dead'].includes(m.phase);notice.classList.toggle('ch-native-scene-notice',!!nativeEffects&&['preparation','intermission'].includes(m.phase));
   notice.dataset.outcome='neutral';
   if(m.phase==='preparation'){noticeKicker.textContent=m.targeted?'YOU ARE THE TARGET':state.chaser==='local'?'YOU ARE THE CHASER':'SURVIVE THE CHASER';noticeTitle.textContent=`Starting in ${Math.ceil(state.pause)} s`;noticeDetail.textContent=state.chaser==='local'?'Hunt down every survivor':'Keep moving. Survive until the end.';}
   else if(m.phase==='dead'){noticeKicker.textContent='SPECTATING';noticeTitle.textContent='Eliminated';noticeDetail.textContent=`Following ${m.chaser}`;}
   else if(m.phase==='intermission'){
    const won=state.chaser==='local'?state.outcome==='chaser-victory':state.outcome!=='chaser-victory'&&m.local.alive;
    notice.dataset.outcome=won?'win':'defeat';noticeKicker.textContent='ROUND OVER';noticeTitle.textContent=won?'Victory':'Defeat';const reward=state.lastRound?.players.find(p=>p.id==='local')?.points??0;noticeDetail.textContent=`${reward?`+${reward} points · `:''}Next round in ${Math.ceil(state.pause)} s`;
   }
   for(const panel of [scorePanel,top,survivorPanel])panel.hidden=m.phase==='result';results.hidden=m.phase!=='result';
   if(results.hidden)resultSerial=-1;
   else if(resultSerial!==state.serial){resultSerial=state.serial;const detail=chaserResultDetails(state);resultTitle.textContent=state.winner===null?'Draw':state.winner==='local'?'You win the match':`${playerName(state.players.get(state.winner))} wins the match`;resultTotal.textContent=`${detail.total} points`;resultBreakdown.textContent=detail.categories.map(([label,n])=>`${label} ${n}`).join(' · ');table(resultTable,detail.players,true);}
   if(previousPhase!==m.phase){if(!notice.hidden)pulse(notice,notice.dataset.outcome==='win'?'#ffe394':'#8cddff');if(m.phase==='result')pulse(resultCard);previousPhase=m.phase;}
   if(!roster.hidden)table(roster,m.players);
  },dispose(){nativeEffects?.hide();root.remove();},
 };
}
