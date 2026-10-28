// gui/new/maingame_ingame.xui:9889 ListBox_captain_HpBar and its20px row.
// Membership, positioning and native fill timing belong to their own callers.
export const CAPTAIN_HEALTH_ASSETS=Object.freeze({
 background:'/assets/captain-health/gauge-background.png',
 fill:'/assets/captain-health/gauge-fill.png',
});

/** Renders only supplied health snapshots. No simulation or membership rules. */
export function createCaptainHealthUI({document:doc=globalThis.document,container=doc?.body}={}){
 if(!doc?.createElement||!container?.append)throw new TypeError('Captain health UI requires a DOM container');
 const root=doc.createElement('div');root.className='captain-health-list';root.hidden=true;
 root.dataset.s4Ui='ListBox_captain_HpBar';root.setAttribute('aria-label','Captain health');
 container.append(root);const rows=new Map();let disposed=false,lastOrder=[],lastHidden=true;
 const write=(entry,key,value,apply)=>{if(entry.values.get(key)===value&&entry.values.has(key))return;entry.values.set(key,value);apply(value);};
 function createRow(id){
  const row=doc.createElement('div'),name=doc.createElement('span'),bar=doc.createElement('div'),fill=doc.createElement('i');
  row.className='captain-health-row';row.dataset.player=id;row.dataset.s4Ui='GroupBox_Captain_HpBar';
  name.className='captain-health-name';bar.className='captain-health-bar';fill.className='captain-health-fill';
  bar.style.backgroundImage=`url("${CAPTAIN_HEALTH_ASSETS.background}")`;
  fill.style.backgroundImage=`url("${CAPTAIN_HEALTH_ASSETS.fill}")`;
  bar.setAttribute('aria-hidden','true');bar.append(fill);row.append(name,bar);
  return {row,name,bar,fill,values:new Map()};
 }
 function update(snapshot,{visible=true}={}){
  if(disposed)return false;
  const retained=new Set(),ordered=[];
  for(const player of Array.isArray(snapshot)?snapshot:[]){
   if(!player||typeof player.id!=='string'||!player.id||retained.has(player.id))continue;
   retained.add(player.id);
   let entry=rows.get(player.id);if(!entry){entry=createRow(player.id);rows.set(player.id,entry);}
   const label=String(player.name??'');write(entry,'name',label,value=>{entry.name.textContent=value;});
   write(entry,'team',String(player.team??''),value=>{entry.row.dataset.team=value;});
   write(entry,'dead',typeof player.dead==='boolean'?String(player.dead):'unknown',value=>{entry.row.dataset.dead=value;});
   const known=Number.isFinite(player.hp)&&Number.isFinite(player.maxHp)&&player.maxHp>0;
   write(entry,'known',known,value=>{entry.row.dataset.healthKnown=String(value);entry.fill.hidden=!value;});
   write(entry,'ratio',known?Math.min(1,Math.max(0,player.hp/player.maxHp)):0,value=>{entry.fill.style.transform=`scaleX(${value})`;});
   write(entry,'aria',known?`${label||'Player'}: ${player.hp} / ${player.maxHp} HP`:`${label||'Player'}: health unavailable`,value=>entry.row.setAttribute('aria-label',value));
   ordered.push(entry.row);
  }
  for(const [id,entry] of rows)if(!retained.has(id)){entry.row.remove();rows.delete(id);}
  if(ordered.length!==lastOrder.length||ordered.some((row,index)=>row!==lastOrder[index])){root.replaceChildren(...ordered);lastOrder=ordered;}
  const hidden=!visible||ordered.length===0;if(hidden!==lastHidden){root.hidden=hidden;lastHidden=hidden;}
  return !root.hidden;
 }
 function reset(){if(disposed)return;rows.clear();lastOrder=[];root.replaceChildren();root.hidden=true;lastHidden=true;}
 function dispose(){if(disposed)return;disposed=true;rows.clear();root.replaceChildren();root.remove();}
 return {root,update,reset,dispose};
}
