import {waitingRoomMapPreview} from './waiting-room-map-previews.js';
import {MAP_INTERIOR_SCENES} from './map-interior-previews.js';
import {s5MapLabel} from './s5-lobby-labels.js';
export function installRoomMenuView(shell,{document:doc=document,Observer=MutationObserver}={}){
 const existing=shell.querySelector('[data-panel="room"]');if(existing)return existing.roomMenu;
 let disposed=false;const play=doc.getElementById('play'),status=doc.getElementById('load-status');
 const controls=[['game-mode','Mode'],['scene-select','Map'],['team-select','Team']].map(([id,label])=>({id,source:doc.getElementById(id),label}));
 const practice=doc.getElementById('practice-option');
 if(practice)controls.push({id:'practice-option',source:practice,label:'Practice · target and duration',visibilitySource:practice.closest?.('label')??practice});
 const matchOption=doc.getElementById('match-option');
 if(matchOption)controls.push({id:'match-option',source:matchOption,label:'Score and duration',dynamicLabel:true,visibilitySource:matchOption.closest?.('label')??matchOption});
 if(!play||controls.some(control=>!control.source))return null;
 const make=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
 const tab=make('button','','Local match');tab.type='button';tab.dataset.tab='room';shell.querySelector('.menu-tabs').append(tab);
 const panel=make('section','menu-panel s5runtime-room-menu');panel.dataset.panel='room';panel.hidden=true;
 const settings=make('div','s5runtime-room-settings');panel.append(settings);const title=make('h2','','Match settings');title.tabIndex=-1;settings.append(make('span','s5runtime-room-eyebrow','PLAY / LOCAL SESSION'),title);
 const preview=make('div','s5runtime-room-preview'),previewImage=make('img'),previewFallback=make('span','','Map preview unavailable');previewImage.alt='Selected map preview';previewImage.hidden=true;preview.append(previewImage,previewFallback);settings.append(preview);
 const local=make('div','s5runtime-room-local');local.append(make('h3','','Local match'));
 const mode=make('b'),map=make('b');local.append(mode,map,make('p','','Choose your mode, map, team and available options. This match uses your current equipment.'),make('p','','Network rooms and invitations are unavailable in this version.'));settings.append(local);
 const fields=make('div','s5runtime-room-controls');settings.append(fields);
 for(const control of controls){
  const field=make('div','s5runtime-room-field'),caption=make('span','',control.label),proxy=make('select');proxy.setAttribute('aria-label',control.label);proxy.dataset.sourceControl=control.id;control.proxy=proxy;control.field=field;control.caption=caption;
  proxy.addEventListener('change',control.onChange=()=>{
   const option=[...control.source.options].find(option=>option.value===proxy.value);
   if(proxy.disabled||control.source.disabled||play.disabled||control.visibilitySource?.hidden||!option||option.disabled){sync();return;}
   control.source.value=proxy.value;const EventClass=doc.defaultView?.Event??Event;
   try{control.source.dispatchEvent(new EventClass('change',{bubbles:true}));}finally{sync();}
  });field.append(caption,proxy);fields.append(field);
 }
 const liveStatus=make('p','s5runtime-room-status');liveStatus.setAttribute('role','status');settings.append(liveStatus);
 const start=make('button','s5runtime-room-start','Enter room');start.type='button';const onStart=()=>{if(!play.disabled&&!start.disabled)play.click();sync();};start.addEventListener('click',onStart);settings.append(start);
 function sync(){
  if(disposed)return;
  panel.setAttribute('aria-busy',String(play.disabled));start.disabled=play.disabled;
  start.textContent=doc.body?.classList?.contains?.('in-waiting-room')?'Return to room':'Enter room';
  liveStatus.textContent=status?.textContent|| (play.disabled?'Preparing match…':'Ready');
  for(const control of controls){
   const {source,proxy}=control,signature=[...source.options].map(option=>`${option.value}:${option.textContent}:${option.disabled}`).join('|');
   if(control.dynamicLabel){const label=source.getAttribute('aria-label')||control.label;control.caption.textContent=label;proxy.setAttribute('aria-label',label);}
   if(control.signature!==signature){proxy.replaceChildren();for(const option of source.options){const copy=make('option','',control.id==='scene-select'?s5MapLabel(option.textContent):option.textContent);copy.value=option.value;copy.disabled=option.disabled;proxy.append(copy);}control.signature=signature;}
   const hidden=control.visibilitySource?.hidden===true;control.field.hidden=hidden;
   proxy.value=source.value;proxy.disabled=hidden||source.disabled||play.disabled;
   proxy.setAttribute('aria-disabled',String(proxy.disabled));
  }
  fields.dataset.practiceVisible=String(controls.some(control=>control.id==='practice-option'&&!control.field.hidden));
  mode.textContent=[...controls[0].source.options].find(option=>option.value===controls[0].source.value)?.textContent||'';
  map.textContent=s5MapLabel([...controls[1].source.options].find(option=>option.value===controls[1].source.value)?.textContent||'');
  const sceneKey=controls[1].source.value,art=waitingRoomMapPreview(MAP_INTERIOR_SCENES[sceneKey]??null,sceneKey);previewImage.hidden=!art;previewFallback.hidden=!!art;if(art&&previewImage.getAttribute?.('src')!==art.image)previewImage.src=art.image;
 }
 const observer=new Observer(sync);for(const node of [play,status,...controls.map(control=>control.source)])if(node)observer.observe(node,{attributes:true,attributeFilter:['disabled','hidden','aria-label'],childList:true,subtree:true,characterData:true});
 for(const {visibilitySource} of controls)if(visibilitySource)observer.observe(visibilitySource,{attributes:true,attributeFilter:['hidden']});
 for(const {source} of controls)source.addEventListener('change',sync);
 const roomMenu={sync,dispose(){if(disposed)return;disposed=true;observer.disconnect();for(const {source,proxy,onChange} of controls){source.removeEventListener('change',sync);proxy.removeEventListener('change',onChange);}start.removeEventListener('click',onStart);tab.remove();panel.remove();}};
 panel.roomMenu=roomMenu;shell.querySelector('.menu-panels').append(panel);sync();return roomMenu;
}
