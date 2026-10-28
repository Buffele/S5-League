import {siegeSourcePointSlot,SIEGE_SOURCE_POINT_SLOTS} from './s4-siege-native-layout.js';
// Authenticated S4 League images, with S5 state-driven layout and English labels.
// Source rects are intentionally retained in their XUI2 2880x2160 system.
// Content margins31/40 remove overlapping three-part header caps.
export const S4_MODE_UI_ASSETS=Object.freeze({
 captainMark:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/captainmark.png',
 pingLocal:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/ping_local.png',
 siegeFlags:'/assets/s5runtime/modes-ui/gui/new/siege_ui_dummy.png',
 alphaBanner:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/alpha_blue.png',
 betaBanner:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/beta_red.png',
 alphaBackdrop:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/backdrop_blue.png',
 betaBackdrop:'/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/backdrop_red.png',
 font:'/assets/s5runtime/ui/2002.ttf',
});
export const NATIVE_MODE_COLUMNS=Object.freeze({
 captain:Object.freeze([{key:'emblem',label:'BADGE',left:4,right:207},{key:'name',label:'PLAYER',left:174,right:542},{key:'score',label:'SCORE',left:509,right:669},{key:'kills',label:'KILLS',left:636,right:839},{key:'deaths',label:'DEATHS',left:806,right:1009},{key:'state',label:'STATE',left:976,right:1155},{key:'ping',label:'PING',left:1122,right:1285}]),
 siege:Object.freeze([{key:'emblem',label:'BADGE',left:4,right:207},{key:'name',label:'PLAYER',left:174,right:563},{key:'score',label:'SCORE',left:530,right:711},{key:'kills',label:'KILLS',left:678,right:847},{key:'captures',label:'CAPTURES',left:813,right:1009},{key:'state',label:'STATE',left:976,right:1155},{key:'ping',label:'PING',left:1122,right:1285}]),
});
export function nativeModeColumnGeometry(mode,key,{header=false}={}){
 const column=NATIVE_MODE_COLUMNS[mode]?.find(c=>c.key===key);if(!column)throw Error('Unknown native scoreboard column');
 const margin=header||key==='emblem'?{left:0,right:0}:{left:31,right:40};
 return {left:(column.left+margin.left)/1287*100,width:(column.right-column.left-margin.left-margin.right)/1287*100};
}
// Exact source atlas rectangles; displayed without changing the source image.
export const SIEGE_FLAG_REGIONS=Object.freeze({
 alpha:{node:'alpha_l_Image',line:9098,uv:[.007813,.015625,.265625,.531250],pixels:[8,8,264,264]},
 neutral:{node:'gamma_l_Image',line:9113,uv:[.273438,.015625,.531250,.531250],pixels:[280,8,264,264]},
 beta:{node:'beta_l_Image',line:9131,uv:[.539063,.015625,.796875,.531250],pixels:[552,8,264,264]},
});
export const NATIVE_MODE_UI_STYLE=`
#match-ui[data-native-mode-ui] .native-mode-roster{width:min(1440px,calc(100vw - 32px));min-width:0;max-height:76vh;box-sizing:border-box;overflow:auto;padding:18px;pointer-events:auto;background:transparent url("/assets/s5runtime/modes-ui/gui/new/black.png") repeat;color:#c1ccdd;border:0;box-shadow:none;top:53%;font-family:var(--s4-secondary-font,sans-serif)}
#match-ui[data-native-mode-ui] .native-mode-roster>header{position:static;inset:auto;width:auto;margin:0 0 12px;padding:0;pointer-events:auto;font:20px var(--s4-secondary-font,sans-serif);letter-spacing:.04em;color:#d1d9e6;display:flex;justify-content:space-between}
#match-ui[data-native-mode-ui] .native-mode-roster>header small{font:12px var(--s4-secondary-font,sans-serif);color:#a5b4cc}
#match-ui[data-native-mode-ui] .native-mode-teams{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px}
#match-ui[data-native-mode-ui] .native-team-panel{min-width:0;background:linear-gradient(145deg,var(--team-wash),#111b2bea);border:1px solid var(--team-edge);border-radius:12px;overflow:hidden}
#match-ui[data-native-mode-ui] .native-team-panel[data-team=alpha]{--team-accent:#73d6ff;--team-edge:#73d6ff55;--team-wash:#17445caa}
#match-ui[data-native-mode-ui] .native-team-panel[data-team=beta]{--team-accent:#ff9eab;--team-edge:#ff9eab55;--team-wash:#522a3daa}
#match-ui[data-native-mode-ui] .native-team-title{display:flex;align-items:center;justify-content:space-between;height:43px;font:24px var(--s4-secondary-font,sans-serif);color:#d1d9e6;padding:0 12px;border-bottom:1px solid #a5b4cc44}
#match-ui[data-native-mode-ui] .native-team-title span{background:linear-gradient(120deg,var(--team-wash),transparent);color:var(--team-accent);border-left:3px solid var(--team-accent);border-radius:3px;min-width:140px;text-align:center;padding:6px 12px;text-shadow:0 1px 4px #000}
#match-ui[data-native-mode-ui] .native-team-title strong{font:24px var(--s4-secondary-font,sans-serif)}
#match-ui[data-native-mode-ui] .native-team-meta{font:12px var(--s4-secondary-font,sans-serif);color:#b9cae5;padding:8px 12px;min-height:14px}
#match-ui[data-native-mode-ui] .native-team-scroll{overflow-x:auto;overscroll-behavior:contain}
#match-ui[data-native-mode-ui] .native-mode-table{display:block;border-collapse:collapse;width:100%;min-width:640px;color:#c1ccdd;container-type:inline-size}
#match-ui[data-native-mode-ui] .native-mode-table thead,#match-ui[data-native-mode-ui] .native-mode-table tbody{display:block}
#match-ui[data-native-mode-ui] .native-mode-table tr{display:block;position:relative;height:44px}
#match-ui[data-native-mode-ui] .native-mode-table thead tr{height:31px}
#match-ui[data-native-mode-ui] .native-mode-table th{position:absolute;top:0;height:31px;box-sizing:border-box;padding:0 0 0 .2331%;text-align:center;font-family:var(--s4-secondary-font,sans-serif);font-weight:400;font-size:clamp(11px,1.554cqw,20px);color:#d1d9e6;background:linear-gradient(180deg,#ffffff12,#ffffff04);border-bottom:2px solid var(--team-edge);line-height:31px;text-shadow:0 1px 4px #000}
#match-ui[data-native-mode-ui] .native-mode-table td{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--s4-secondary-font,sans-serif);font-size:clamp(12px,1.7094cqw,22px);box-sizing:border-box;padding:4px 0;border-bottom:1px solid #c1ccdd12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#match-ui[data-native-mode-ui] .native-mode-table tr[data-local=true] td{color:#ffc64d;text-shadow:0 0 4px #ffc64d44}
#match-ui[data-native-mode-ui] .native-mode-table tr[data-alive=false] td{opacity:.55}
#match-ui[data-native-mode-ui] .native-captain-mark{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;margin-right:4px;border:1px solid var(--team-accent);border-radius:4px;color:var(--team-accent);font:700 11px/1 var(--s4-secondary-font,sans-serif);vertical-align:middle}
#match-ui[data-native-mode-ui] th[data-field=kills] .native-captain-mark+span{padding-left:0}
#match-ui[data-native-mode-ui] .native-ping-local{padding:3px 6px;border:1px solid #8fddb666;border-radius:5px;background:#194b3833;color:#a6efc6;font:600 10px/1.2 var(--s4-secondary-font,sans-serif);letter-spacing:.04em}
#match-ui[data-native-mode-ui] .native-mode-details{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-top:18px;border-top:1px solid #a5b4cc55;padding-top:12px}
#match-ui[data-native-mode-ui] .native-mode-details details{min-width:0;font:14px var(--s4-secondary-font,sans-serif)}
#match-ui[data-native-mode-ui] .native-mode-details summary{cursor:pointer;font:16px var(--s4-secondary-font,sans-serif);color:#d6dde9;padding:6px 0}
#match-ui[data-native-mode-ui] .native-mode-details p{font:13px/1.55 var(--s4-secondary-font,sans-serif);white-space:pre-line;margin:0;padding:6px 0;border:0;overflow-wrap:anywhere;color:inherit}
#match-ui[data-native-mode-ui] .native-mode-metrics{display:flex;gap:16px;flex-wrap:wrap;font:13px var(--s4-secondary-font,sans-serif);color:#a5b4cc;margin-top:5px}
#match-ui[data-native-mode-ui] .td-clock b,#match-ui[data-native-mode-ui] .td-team strong{font-family:var(--s4-secondary-font,sans-serif);font-weight:400}
#match-ui[data-native-mode-ui] .td-clock small,#match-ui[data-native-mode-ui] .td-clock span,#match-ui[data-native-mode-ui] .td-announcement{font-family:var(--s4-secondary-font,sans-serif)}
#match-ui[data-native-mode-ui] .td-announcement{animation:none}
#match-ui[data-native-mode-ui] .td-announcement button{font-family:var(--s4-secondary-font,sans-serif)}
#match-ui[data-native-mode-ui] .native-siege-points{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
#match-ui[data-native-mode-ui] .native-siege-point{display:grid;grid-template-columns:44px auto;gap:8px;align-items:center}
#match-ui[data-native-mode-ui] .native-siege-point-icon{display:grid;place-items:center;width:40px;height:40px;box-sizing:border-box;border:2px solid #a5b4cc;border-radius:12px;background:linear-gradient(135deg,#68788b44,#182333);color:#d1d9e6;font:700 16px/1 var(--s4-secondary-font,sans-serif);font-style:normal;transform:rotate(-5deg)}
#match-ui[data-native-mode-ui] .native-siege-point-icon[data-owner=alpha]{border-color:#73d6ff;color:#73d6ff;background:linear-gradient(135deg,#17445c,#182333)}
#match-ui[data-native-mode-ui] .native-siege-point-icon[data-owner=beta]{border-color:#ff9eab;color:#ff9eab;background:linear-gradient(135deg,#522a3d,#182333)}
#match-ui[data-native-mode-ui] .native-siege-point-icon[data-contested=true]{border-style:dashed}
#match-ui[data-native-mode-ui] .native-siege-point-text{font:14px var(--s4-secondary-font,sans-serif);text-align:left;white-space:nowrap}
@media(max-width:1100px){#match-ui[data-native-mode-ui] .native-mode-teams{grid-template-columns:1fr;gap:16px}#match-ui[data-native-mode-ui] .native-mode-details{grid-template-columns:1fr}}
@media(max-width:650px){#match-ui[data-native-mode-ui] .native-mode-roster{padding:12px;width:calc(100vw - 20px);max-height:72vh}#match-ui[data-native-mode-ui] .native-mode-roster>header{font-size:17px;gap:8px}#match-ui[data-native-mode-ui] .native-mode-roster>header small{font-size:10px}#match-ui[data-native-mode-ui] .native-siege-point-text{font-size:12px}}

#match-ui[data-native-mode-ui] .native-team-panel{border-radius:0;border:0;background:transparent url("${S4_MODE_UI_ASSETS.alphaBackdrop}") center top/100% auto repeat-y}
#match-ui[data-native-mode-ui] .native-team-panel[data-team=beta]{background-image:url("${S4_MODE_UI_ASSETS.betaBackdrop}")}
#match-ui[data-native-mode-ui] .native-team-title span{background:transparent url("${S4_MODE_UI_ASSETS.alphaBanner}") center/contain no-repeat;border:0;border-radius:0;color:transparent;text-shadow:none;min-width:140px;min-height:30px;padding:0}
#match-ui[data-native-mode-ui] [data-team=beta] .native-team-title span{background-image:url("${S4_MODE_UI_ASSETS.betaBanner}")}
#match-ui[data-native-mode-ui] .native-mode-table th{background:transparent url("/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/alpha_line_blue_mid.png") center/100% 100% no-repeat;border:0}
#match-ui[data-native-mode-ui] [data-team=beta] .native-mode-table th{background-image:url("/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/beta_line_red_mid.png")}
#match-ui[data-native-mode-ui] .native-captain-mark{background:transparent url("${S4_MODE_UI_ASSETS.captainMark}") center/contain no-repeat;border:0;border-radius:0;font-size:0;width:24px;height:24px}
#match-ui[data-native-mode-ui] .native-ping-local{background:transparent url("${S4_MODE_UI_ASSETS.pingLocal}") left center/14px 18px no-repeat;padding-left:18px;border:0;border-radius:0}
#match-ui[data-native-mode-ui] .native-siege-point-icon{display:block;transform:none;border:0;border-radius:0;background-color:transparent;background-image:url("${S4_MODE_UI_ASSETS.siegeFlags}");font-size:0;width:40px;height:40px}
#match-ui[data-native-mode-ui] .native-siege-point-icon[data-owner]{background-image:url("${S4_MODE_UI_ASSETS.siegeFlags}");background-color:transparent;border:0}
#match-ui[data-native-mode-ui] .native-siege-point-icon[data-contested=true]{outline:1px dashed white;outline-offset:2px}
`;
function acquireStyle(){
 let node=document.querySelector('style[data-native-mode-scoreboard]');
 if(!node){node=document.createElement('style');node.dataset.nativeModeScoreboard='true';node.dataset.references='0';node.textContent=NATIVE_MODE_UI_STYLE;document.head.append(node);}
 node.dataset.references=String(Number(node.dataset.references||0)+1);let released=false;
 return ()=>{if(released)return;released=true;const count=Math.max(0,Number(node.dataset.references||0)-1);node.dataset.references=String(count);if(count===0)node.remove();};
}
const element=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
export function createNativeModeRoster({container,mode,playerCells,playerDetails,playerName}){
 if(!NATIVE_MODE_COLUMNS[mode])throw Error('Unsupported native mode roster');
 const releaseStyle=acquireStyle();container.classList.add('native-mode-roster','s4-source-mode-roster');container.setAttribute('aria-label',`Scoreboard ${mode==='captain'?'Captain':'Siege'}`);
 const header=element('header',null,'SCOREBOARD'),hint=element('small',null,'TAB · LOCAL MATCH');header.append(hint);
 const teams=element('div','native-mode-teams'),details=element('div','native-mode-details'),panels=new Map(),detailNodes=new Map();teams.dataset.roster='';
 for(const team of ['alpha','beta']){
  const panel=element('section','native-team-panel');panel.dataset.team=team;panel.setAttribute('aria-label',`Team ${team.toUpperCase()}`);
  const title=element('div','native-team-title'),banner=element('span',null,team.toUpperCase()),score=element('strong',null,'—');title.append(banner,score);
  const meta=element('div','native-team-meta'),scroll=element('div','native-team-scroll');scroll.setAttribute('tabindex','0');scroll.setAttribute('aria-label',`Scrollable ${team.toUpperCase()} table`);
  const table=element('table','native-mode-table'),head=element('thead'),headRow=element('tr'),body=element('tbody');
  const sourceColumns=NATIVE_MODE_COLUMNS[mode];
  for(const column of sourceColumns){
   const cell=element('th');cell.dataset.field=column.key;cell.dataset.sourceRect=`${column.left},0,${column.right},62`;
   const art=element('span','s4-source-header-art');art.setAttribute('aria-hidden','true');for(const part of ['left','mid','right']){const image=element('i','s4-source-header-'+part);image.style.backgroundImage=`url("/assets/s5runtime/modes-ui/xui2/sprites/ingame/hud/scoreboard/${team}_panel_${part}.png")`;art.append(image);}cell.append(art);cell.setAttribute('scope','col');const geometry=nativeModeColumnGeometry(mode,column.key,{header:true});cell.style.left=`${geometry.left}%`;cell.style.width=`${geometry.width}%`;
   if(mode==='captain'&&column.key==='kills'){const badge=element('span','native-captain-mark','C');badge.setAttribute('aria-label','Captain');cell.append(badge);}
   const label=element('span','s4-source-header-label',column.label);label.dataset.sourceLabel=column.key==='name'?'NAME':column.key==='emblem'?'EMBLEM':column.label;cell.append(label);
   headRow.append(cell);
  }
  head.append(headRow);table.append(head,body);scroll.append(table);panel.append(title,meta,scroll);teams.append(panel);panels.set(team,{body,score,meta,rows:new Map()});
 }
 container.replaceChildren(header,teams,details);
 let viewKey=null;
 const api={
  update(state){
   const key=JSON.stringify({players:[...state.players.values()],scores:state.scores,round:state.round,limit:state.rules.scoreLimit,roundLimit:state.rules.roundLimit,ledgers:state.teamLedgers});
   if(key===viewKey)return;viewKey=key;
   const players=[...state.players.values()].sort((a,b)=>b.score-a.score),active=new Set(players.map(p=>p.id));
   for(const [team,panel]of panels){panel.score.textContent=String(state.scores[team]);panel.meta.textContent=mode==='captain'?`ROUND ${state.round}/${state.rules.roundLimit} · ${state.rules.scoreLimit} WINS`:`${state.rules.scoreLimit} POINTS · OBJECTIVE ${state.teamLedgers[team].objective} / HELD ${state.holdingScores?.[team]??0} / COMBAT ${state.teamLedgers[team].combat}`;
    const sorted=[];
    for(const player of players.filter(p=>p.team===team)){
     let row=panel.rows.get(player.id);
     if(!row){row=element('tr');row.dataset.player=player.id;for(const column of NATIVE_MODE_COLUMNS[mode]){const td=element('td');td.dataset.field=column.key;const geometry=nativeModeColumnGeometry(mode,column.key);td.style.left=`${geometry.left}%`;td.style.width=`${geometry.width}%`;row.append(td);}panel.rows.set(player.id,row);}
     row.dataset.local=String(player.id==='local');row.dataset.alive=String(player.alive);const values=playerCells(player);
     for(const cell of row.children){const key=cell.dataset.field;if(key==='emblem'&&mode==='captain'&&player.isCaptain){if(!cell.firstChild){cell.textContent='';const badge=element('span','native-captain-mark');badge.setAttribute('aria-label','Captain');cell.append(badge);}}else if(key==='ping'&&player.id==='local'){if(!cell.firstChild){const badge=element('span','native-ping-local','LOCAL');badge.setAttribute('aria-label','Local session');cell.append(badge);}}else cell.textContent=String(values[key]??'—');}
     sorted.push(row);
    }
    for(const [id,row]of panel.rows)if(!active.has(id)){row.remove();panel.rows.delete(id);}
    panel.body.replaceChildren(...sorted);
   }
   const orderedDetails=[];
   for(const player of players){
    let node=detailNodes.get(player.id);if(!node){const root=element('details'),summary=element('summary'),text=element('p'),metrics=element('div','native-mode-metrics');root.open=player.id==='local';root.dataset.playerDetail=player.id;root.append(summary,metrics,text);node={root,summary,text,metrics};detailNodes.set(player.id,node);}
    node.summary.textContent=`${playerName(player.id)} · ${player.score} pts`;node.text.textContent=playerDetails(player);
    const values=playerCells(player),deaths=mode==='captain'?values.deaths:player.localDeaths;node.metrics.textContent=`Damage dealt — · Damage taken — · K/D ${deaths>0?(Number(values.kills)/deaths).toFixed(2):'—'} · Assists ${player.killAssists}`;
    orderedDetails.push(node.root);
   }
   for(const [id,node]of detailNodes)if(!active.has(id)){node.root.remove();detailNodes.delete(id);}details.replaceChildren(...orderedDetails);
  },
  reset(){viewKey=null;for(const panel of panels.values()){panel.body.replaceChildren();panel.rows.clear();}details.replaceChildren();detailNodes.clear();},
  dispose(){releaseStyle();api.reset();container.replaceChildren();}
 };
 return api;
}
export function siegePointLabel(point,index){return typeof point.label==='string'&&point.label.trim()?point.label:`Point ${index+1}`;}
export function renderNativeSiegePoints(container,state,{compact=false}={}){
 container.classList.add('native-siege-points');if(compact)container.classList.add('native-siege-hud-points');
 const points=[...state.points.values()],key=JSON.stringify([compact,points.map((p,i)=>[siegePointLabel(p,i),p.sourceUiSlot,p.owner,p.contested,Math.floor(p.progress/state.rules.gaugeMaximum*100)])]);
 if(container.dataset.pointsView===key)return;container.dataset.pointsView=key;
 container.replaceChildren(...points.map((point,index)=>{
  const slot=siegeSourcePointSlot(point),row=element('span','native-siege-point'),icon=element('i','native-siege-point-icon',point.owner==='alpha'?'A':point.owner==='beta'?'B':'◇');
  if(slot&&!compact){row.dataset.sourceUiSlot=slot;row.dataset.sourceRect=SIEGE_SOURCE_POINT_SLOTS[slot].rect.join(',');}
  icon.dataset.owner=point.owner==='alpha'||point.owner==='beta'?point.owner:'neutral';icon.dataset.contested=String(point.contested);icon.setAttribute('aria-hidden','true');
  const [x,y,w]=SIEGE_FLAG_REGIONS[icon.dataset.owner].pixels,scale=(compact?66:40)/w;icon.style.backgroundSize=`${1024*scale}px ${512*scale}px`;icon.style.backgroundPosition=`${-x*scale}px ${-y*scale}px`;
  const percent=Math.floor(point.progress/state.rules.gaugeMaximum*100),description=`${siegePointLabel(point,index)} : ${point.contested?'CONTESTED':point.owner?.toUpperCase()??'NEUTRAL'}${point.progress?` ${percent} %`:''}`;
  const text=element('span','native-siege-point-text',description);row.append(icon,text);
  if(compact){
   // Display ordinals describe actual S5 points; they are not native map IDs.
   const number=element('span','native-siege-point-number',index+1),status=element('span','native-siege-point-status',point.contested?'CONTESTED':point.progress?`${percent} %`:'');
   number.setAttribute('aria-hidden','true');status.setAttribute('aria-hidden','true');status.hidden=!status.textContent;
   row.dataset.contested=String(point.contested);row.setAttribute('role','img');row.setAttribute('aria-label',description);row.append(number,status);
  }
  return row;
 }));
}
