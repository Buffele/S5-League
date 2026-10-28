import layout from '../public/assets/s5runtime/chaser/ui/result-layout.json' with {type:'json'};

// Geometry and crops come from the authenticated XUI. Values remain the local
// match's values until original counter/reward producers are established.
export function createChaserResultBoard({onRestart}){
 const root=document.createElement('div');root.className='native-chaser-result-board';
 const place=(el,r,parent=root)=>{Object.assign(el.style,{left:r.left+'px',top:r.top+'px',width:(r.right-r.left)+'px',height:(r.bottom-r.top)+'px'});parent.append(el);return el;};
 const text=(record,value,parent=root)=>{const el=document.createElement('span');el.className='native-result-cell';el.textContent=value;el.style.fontSize=(parseInt(record.font.split('_')[1])||12)+'px';el.style.color='#'+(Number(record.color||4294967295)&0xffffff).toString(16).padStart(6,'0');return place(el,record.rect,parent);};
 const lists=layout.lists.map((list,i)=>{
  for(const bg of list.backgrounds){const surface=document.createElement('span');surface.className='native-result-background';surface.setAttribute('aria-hidden','true');surface.style.background='linear-gradient(180deg,#1b3448,#102232)';surface.style.border='1px solid #3d6377';place(surface,bg.rect);}
  for(const header of list.headers)text(header,header.text).classList.add('native-result-header');
  const rows=document.createElement('div');rows.className='native-result-rows';rows.setAttribute('role','table');rows.setAttribute('aria-label',i?'Results, players 9 to 16':'Results, players 1 to 8');place(rows,list.rect);return rows;
 });
 const footer=document.createElement('div');footer.className='native-result-footer';root.append(footer);
 const detailToggle=document.createElement('details'),detailTitle=document.createElement('summary'),details=document.createElement('div');detailTitle.textContent='Match details';detailToggle.append(detailTitle,details);footer.append(detailToggle);
 const replay=document.createElement('button');replay.textContent='Play again';replay.className='native-replay';replay.onclick=onRestart;footer.append(replay);
 return {root,update(result){
  for(const rows of lists)rows.replaceChildren();
  for(const [index,p] of result.players.slice(0,layout.rowsPerList*lists.length).entries()){
   const row=document.createElement('div');row.className='native-result-row';row.setAttribute('role','row');place(row,{left:0,top:index%layout.rowsPerList*layout.rowHeight,right:512,bottom:(index%layout.rowsPerList+1)*layout.rowHeight},lists[Math.floor(index/layout.rowsPerList)]);
   if(p.id==='local'){const highlight=document.createElement('span');highlight.className='native-result-background';highlight.setAttribute('aria-hidden','true');highlight.style.background='linear-gradient(90deg,#3db8d344,#3db8d30a)';highlight.style.borderLeft='2px solid #70e4ec';place(highlight,layout.localHighlight.rect,row);}
   for(const [key,value] of [['name',p.name],['score',p.score],['exp','—'],['pen','—']]){
    const cell=text(layout.fields[key],String(value),row);cell.setAttribute('role','cell');cell.setAttribute('aria-label',`${key==='name'?'Player':key==='score'?'Points':key.toUpperCase()} : ${value}`);
    if(key==='exp'||key==='pen')cell.title='Unavailable in this match';
   }
  }
  details.replaceChildren();const total=document.createElement('strong');total.textContent=`Your score: ${result.total}`;details.append(total);
  const breakdown=document.createElement('p');breakdown.textContent=result.categories.map(([label,value])=>`${label} ${value}`).join(' · ');details.append(breakdown);
  for(const p of result.players){const line=document.createElement('p');line.textContent=`${p.name} · Kills ${p.kills} · Deaths ${p.deaths} · Damage ${p.damage} · Healing ${p.healing}`;details.append(line);}
 },reset(){detailToggle.open=false;}};
}
