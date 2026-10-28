// Presentation only: the encounter owns HP, births, deaths and respawn time.
export function createConquestEncounterHud(parent=document.body){
 const doc=parent.ownerDocument;if(!doc||typeof parent.append!=='function')throw Error('Conquest HUD DOM parent required');
 const root=doc.createElement('section');root.className='conquest-encounter-hud';root.hidden=true;root.setAttribute('aria-label','Défense de la base');
 const style=doc.createElement('style');style.textContent=`
 .conquest-encounter-hud{position:fixed;top:108px;left:50%;transform:translateX(-50%);z-index:12;box-sizing:border-box;width:min(332px,calc(100vw - 32px));padding:10px 14px 9px;color:var(--s5-ink,#f4f8ff);font:600 12px/1.3 'S4 HUD Condensed','Segoe UI',sans-serif;font-variant-numeric:tabular-nums;pointer-events:none;user-select:none;background:linear-gradient(115deg,#11283be6,#081622df);border:1px solid #9ac9e637;border-top:2px solid var(--s5-cyan,#43d9ed);border-radius:2px 2px 7px 7px;box-shadow:0 6px 22px #0003;text-shadow:0 1px 2px #0008}
 .conquest-encounter-hud[hidden]{display:none}
 .conquest-encounter-hud .ceh-heading,.conquest-encounter-hud .ceh-base,.conquest-encounter-hud .ceh-counts,.conquest-encounter-hud .ceh-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
 .conquest-encounter-hud .ceh-heading{margin-bottom:8px;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#b6c9d8}
 .conquest-encounter-hud .ceh-round{color:var(--s5-cyan,#43d9ed);letter-spacing:.06em}
 .conquest-encounter-hud .ceh-base strong{font-size:14px;font-weight:650;letter-spacing:.025em}
 .conquest-encounter-hud .ceh-base span{color:#d5e3ee;font-size:12px}
 .conquest-encounter-hud .ceh-track{height:5px;margin:6px 0 9px;overflow:hidden;background:#0005;border:1px solid #cbeaff1a;border-radius:1px}
 .conquest-encounter-hud .ceh-fill{display:block;width:0;height:100%;background:linear-gradient(90deg,#2699b4,#6de4e9);transition:width .12s linear}
 .conquest-encounter-hud[data-danger=true] .ceh-fill{background:linear-gradient(90deg,#bd4c65,#ff8b9c)}
 .conquest-encounter-hud .ceh-counts{font-size:11px;color:#9fb6c8}
 .conquest-encounter-hud .ceh-counts strong{font-size:16px;color:#f2f8ff;font-weight:650;margin-right:4px}
 .conquest-encounter-hud .ceh-footer{margin-top:7px;padding-top:6px;border-top:1px solid #b2d8ee17;align-items:flex-start;font-size:10px;color:#b7cedd;min-height:13px}
 .conquest-encounter-hud .ceh-player{white-space:nowrap;color:#91afc3}
 .conquest-encounter-hud[data-dead=true] .ceh-player{color:#ff91a5}
 @media(max-width:700px){.conquest-encounter-hud{top:96px;width:min(300px,calc(100vw - 24px));padding:8px 12px}.conquest-encounter-hud .ceh-heading{margin-bottom:5px}}
 @media(max-height:500px){.conquest-encounter-hud{top:72px;padding:6px 12px}.conquest-encounter-hud .ceh-heading{margin-bottom:3px}.conquest-encounter-hud .ceh-footer{margin-top:4px;padding-top:4px}}
 @media(prefers-reduced-motion:reduce){.conquest-encounter-hud .ceh-fill{transition:none}}
 `;
 const make=(tag,className,text='')=>{const node=doc.createElement(tag);node.className=className;node.textContent=text;return node;};
 const heading=make('div','ceh-heading'),title=make('span','','Conquest · Défense'),round=make('span','ceh-round');heading.append(title,round);
 const baseRow=make('div','ceh-base'),baseName=make('strong','','Base'),baseValue=make('span','');baseRow.append(baseName,baseValue);
 const track=make('div','ceh-track'),fill=make('i','ceh-fill');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Intégrité de la base');track.append(fill);
 const counts=make('div','ceh-counts'),enemy=make('span',''),enemyValue=make('strong',''),enemyLabel=make('span','','ennemis présents'),births=make('span','');enemy.append(enemyValue,enemyLabel);counts.append(enemy,births);
 const footer=make('div','ceh-footer'),message=make('span',''),player=make('span','ceh-player');message.setAttribute('role','status');message.setAttribute('aria-live','polite');footer.append(message,player);
 root.append(style,heading,baseRow,track,counts,footer);parent.append(root);let disposed=false;
 const number=n=>Number.isFinite(n)?Math.max(0,Math.ceil(n)):null,label=n=>n===null?'—':String(n);
 const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 function update(snapshot={}){
  if(disposed)return;root.hidden=snapshot.visible===false;
  const hp=number(snapshot.baseHp),max=number(snapshot.baseMaxHp),alive=number(snapshot.alive),born=number(snapshot.born),total=number(snapshot.total),wave=number(snapshot.round),playerHp=number(snapshot.playerHp),dead=snapshot.dead===true;
  text(round,'Vague '+label(wave)+' / 8');text(baseValue,label(hp)+' / '+label(max));text(enemyValue,label(alive));text(enemyLabel,alive===1?'ennemi présent':'ennemis présents');text(births,'Entrés '+label(born)+' / '+label(total));
  const ratio=hp!==null&&max!==null&&max>0?Math.min(1,hp/max):0;fill.style.width=(ratio*100)+'%';root.dataset.danger=String(hp!==null&&max!==null&&max>0&&ratio<=.25);root.dataset.dead=String(dead);
  if(hp!==null&&max!==null&&max>0){track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(max));track.setAttribute('aria-valuenow',String(Math.min(hp,max)));}else{track.removeAttribute('aria-valuenow');track.removeAttribute('aria-valuemax');}
  let status='Protégez la base';
  if(['idle','loading','preparing','prepared','ready'].includes(snapshot.status))status='Préparation de la défense…';
  else if(['paused','waiting','resuming','blocked','faulted','error','stopped'].includes(snapshot.status))status='Défense en attente de reprise';
  else if(alive===0&&born!==null&&total!==null&&born<total)status='Les renforts ennemis approchent';
  else if(alive===0&&born!==null&&total!==null&&born>=total)status='Aucun ennemi présent';
  if(snapshot.status==='round-cleared')status=snapshot.nextRoundReady?'Vague terminée':wave===8?'Défense terminée':'Vague terminée · suite en préparation';
  if(snapshot.weaponSupported===false)status='Arme non raccordée : équipez Dagger, Handgun, SMG, Semi Rifle ou Assault Rifle';
  else if(snapshot.weaponPrimaryOnly===true&&snapshot.status==='playing')status='Dagger · attaque principale uniquement';
  if(dead){const remaining=number(snapshot.respawnRemainingMs);status=remaining!==null&&remaining>0?'Retour dans '+Math.ceil(remaining/1000)+' s':'Reprise en préparation…';}
  if(hp===0)status='La base est hors service';
  if(snapshot.fault){status='Défense interrompue — '+snapshot.fault;}
  text(message,status);text(player,dead?'Hors combat':playerHp!==null?'HP '+playerHp:'');
 }
 return Object.freeze({update,dispose(){if(disposed)return;disposed=true;root.remove();}});
}
