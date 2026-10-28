import {mountS5Lobby} from './s5-lobby-view.js';
import {createS5EntryFlow} from './s5-entry-flow.js';
import {createInventoryAvatarPreview} from './inventory-avatar-preview.js';
import {createMatchLoadingArt} from './match-loading-art.js';
import {WEAPON_CHOICES} from './loadout.js';
import {s4EquipmentIcon} from './s4-equipment-ui.js';

// S5 presentation hosts the existing game panels and their real ports.
export function installS5EntryShell({host,menuLayout,onPlay,onSound,beforeNavigate,beforePlay,onRetry,getLoadingContext,getLobbyContext}={}){
 const doc=host?.ownerDocument??globalThis.document;
 const oldShell=host.querySelector('.menu-shell'),oldFooter=host.querySelector('.menu-footer');
 if(!oldShell||!oldFooter||typeof menuLayout?.show!=='function')throw Error('Actual preparation panels required');
 const originalShow=menuLayout.show;
 const originals=[...host.children].map(node=>({node,legacy:node.classList.contains('s5-entry-legacy')}));
 const panelState=[...oldShell.querySelectorAll('[data-panel]')].map(node=>({node,hidden:node.hidden}));
 const tabState=[...oldShell.querySelectorAll('[data-tab]')].map(node=>({node,selected:node.classList.contains('is-selected'),aria:node.getAttribute('aria-selected')}));
 const hadHostClass=host.classList.contains('s5-entry-host'),datasetState={};
 for(const key of ['entryRoute','entryTransition'])datasetState[key]={present:Object.hasOwn(host.dataset,key),value:host.dataset[key]};
 const shellAnchor=doc.createComment('S5 preparation position'),footerAnchor=doc.createComment('S5 footer position');
 oldShell.parentNode.insertBefore(shellAnchor,oldShell);oldFooter.parentNode.insertBefore(footerAnchor,oldFooter);
 let flow,disposed=false,lastOperationKind='session',transitionMode=null,savedFocus=null,retryPending=false,actionError='';
 const canRetryOperation=()=>['play','room-return'].includes(lastOperationKind);
 let returnWeaponSlot=null;
 const navigate=(section,context)=>{
  const result=flow.go(section);if(result.accepted===false)return result;
  if(section==='inventory'&&Number.isInteger(context?.slot)){
   returnWeaponSlot=context.slot;
   oldShell.querySelector('[data-panel="inventory"]')?.inventory?.editSlot(context.slot);
  }else if(section==='lobby'&&returnWeaponSlot!==null){lobby.focusWeaponSlot(returnWeaponSlot);returnWeaponSlot=null;}
  else if(result.changed){const panel=lobby.content.querySelector('[data-panel="'+section+'"]'),target=section==='inventory'?panel?.querySelector('.s5-inventory-search'):panel?.querySelector('h2');if(target){target.tabIndex=0;target.focus?.({preventScroll:true});}}
  return result;
 };
 const lobby=mountS5Lobby({host,document:doc,onNavigate:navigate,onPlay,onSound,onRemoveWeapon:slot=>{
  const request=oldShell.querySelector('[data-panel="inventory"]')?.inventory?.removeSlot(slot);
  Promise.resolve(request).then(result=>{if(!disposed&&result?.accepted===false)lobby.setStatus(result.error?.message??'Could not remove this weapon.');});
 }});
 host.classList.add('s5-entry-host');
 for(const {node} of originals)node.classList.add('s5-entry-legacy');
 lobby.content.append(oldShell,oldFooter);
 oldShell.classList.remove('s5-entry-legacy');oldFooter.classList.remove('s5-entry-legacy');
 const preview=createInventoryAvatarPreview(lobby.avatarSlot,{presentation:'lobby'});
 const portrait=createInventoryAvatarPreview(lobby.portraitSlot,{portrait:true});
 const onLoadout=event=>{const snapshot=event.detail;if(disposed||!Array.isArray(snapshot?.slots))return;lobby.setLoadout(snapshot,weapon=>({name:WEAPON_CHOICES[weapon]?.name??weapon,image:s4EquipmentIcon(weapon,snapshot.skins?.[snapshot.slots.indexOf(weapon)]??'classic')}));};
 doc.addEventListener?.('s5:weapon-loadout-changed',onLoadout);
 const stage=lobby.element.querySelector('.s5-lobby-stage'),stageState={hidden:stage.hidden,inert:stage.inert,aria:stage.getAttribute('aria-hidden')};
 const make=(tag,className,text)=>{const node=doc.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
 const transition=make('section','s5-entry-transition');transition.hidden=true;transition.setAttribute('role','dialog');transition.setAttribute('aria-modal','true');transition.setAttribute('aria-labelledby','s5-entry-transition-title');
 const artwork=createMatchLoadingArt(doc,{onUnavailable:()=>{delete transition.dataset.art;}});transition.append(artwork.element);
 const card=make('div','s5-entry-transition-card'),indicator=make('div','s5-entry-transition-indicator'),title=make('h2','s5-entry-transition-title');title.id='s5-entry-transition-title';title.tabIndex=-1;indicator.setAttribute('aria-hidden','true');
 const message=make('p','s5-entry-transition-message');message.id='s5-entry-transition-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');transition.setAttribute('aria-describedby',message.id);
 const actions=make('div','s5-entry-transition-actions'),recover=make('button','s5-entry-transition-recover','Return to lobby'),retry=make('button','s5-entry-transition-retry','Retry');recover.type=retry.type='button';actions.append(recover,retry);card.append(indicator,title,message,actions);transition.append(card);lobby.element.append(transition);
 const bindings=[],bind=(node,type,handler)=>{node.addEventListener(type,handler);bindings.push([node,type,handler]);};
 const focus=node=>node?.focus?.({preventScroll:true});
 const visible=node=>{if(!node||node.isConnected===false||node.disabled)return false;for(let current=node;current;current=current.parentElement??current.parentNode)if(current.hidden||current.inert)return false;return true;};
 function restoreStage(){stage.hidden=stageState.hidden;stage.inert=stageState.inert;if(stageState.aria===null)stage.removeAttribute('aria-hidden');else stage.setAttribute('aria-hidden',stageState.aria);}
 const apply=snapshot=>{
  if(disposed)return;
  lobby.setReady(snapshot.canPlay);lobby.setStatus(snapshot.status);
  if(snapshot.section==='lobby'&&getLobbyContext){const context=getLobbyContext();if(context){lobby.setSession({...context,mode:({conquest:'Conquest · 8 waves',training:'Free training',touchdown:'Touchdown',deathmatch:'Deathmatch',chaser:'Chaser',battleroyal:'Battle Royal',captain:'Captain',siege:'Siege',practice:'Practice'})[context.mode]??context.mode});lobby.setControlLabels(context.controlLabels);}}
  if(snapshot.operation?.kind)lastOperationKind=snapshot.operation.kind;
  const mode=['boot','loading'].includes(snapshot.route)?'loading':snapshot.route==='error'?'error':null,previousMode=transitionMode,previousRecover=recover.hidden;
  lobby.element.setAttribute('aria-busy',String(mode==='loading'||snapshot.busy===true));
  if(mode){
   if(!transitionMode)savedFocus=doc.activeElement;
   stage.hidden=true;stage.inert=true;stage.setAttribute('aria-hidden','true');transition.hidden=false;transition.dataset.mode=mode;host.dataset.entryTransition=mode;transition.setAttribute('aria-busy',String(mode==='loading'));
   indicator.hidden=mode!=='loading';actions.hidden=mode!=='error';
   const loadingContext=mode==='loading'&&lastOperationKind==='play'?getLoadingContext?.():null;
   const art=loadingContext?artwork.update(loadingContext):null;
   if(art)transition.dataset.art='true';else{delete transition.dataset.art;if(mode!=='loading'||lastOperationKind!=='play')artwork.hide();}
   title.textContent=lastOperationKind==='room-return'?(mode==='loading'?'Returning to the waiting room…':'Could not return to the waiting room.'):mode==='loading'?(art?`Entering ${art.label}…`:lastOperationKind==='play'?'Entering match…':'Preparing match…'):(lastOperationKind==='play'?'Could not enter match.':'Could not prepare match.');
   const status=String(snapshot.status??'');message.dataset.detail=status;
   message.textContent=mode==='error'?[snapshot.error||status||'Please try again.',actionError].filter(Boolean).join('\n'):lastOperationKind==='play'?(loadingContext?.destination==='match'?'Entering the match…':'Joining the waiting room…'):status&&!/^Ready\b/i.test(status)?status:'Please wait.';
   recover.hidden=mode!=='error'||!snapshot.ready;recover.disabled=!!snapshot.busy||retryPending;
   retry.hidden=mode!=='error'||!snapshot.ready||snapshot.busy||!canRetryOperation()||typeof onRetry!=='function';retry.disabled=retryPending;
  }else{
   actionError='';transition.hidden=true;artwork.hide();delete transition.dataset.art;delete host.dataset.entryTransition;restoreStage();
  }
  if(snapshot.section){
   lobby.show(snapshot.section);
   originalShow.call(menuLayout,snapshot.panel??'loadout');
   if(snapshot.section==='lobby')for(const panel of oldShell.querySelectorAll('[data-panel]'))panel.hidden=true;
  }
  host.dataset.entryRoute=snapshot.route;
  transitionMode=mode;
  if(mode&&(mode!==previousMode||recover.hidden!==previousRecover))focus(mode==='error'&&!recover.hidden?recover:title);
  else if(!mode&&previousMode){if(snapshot.route!=='playing'&&!snapshot.playing)focus(visible(savedFocus)?savedFocus:lobby.element.querySelector('[data-route="lobby"]'));savedFocus=null;}
 };
 bind(transition,'keydown',event=>{
  event.stopPropagation();if(event.key!=='Tab')return;
  event.preventDefault();const available=[recover,retry].filter(node=>visible(node));if(!available.length){focus(title);return;}
  const current=available.indexOf(doc.activeElement),next=event.shiftKey?(current<=0?available.length-1:current-1):(current+1)%available.length;focus(available[next]);
 });
 bind(lobby.element,'keydown',event=>{
  // Inner dialogs and binding capture keep first refusal on Escape.
  const snapshot=flow.snapshot();if(event.defaultPrevented||event.key!=='Escape'||event.repeat||snapshot.capturing||!snapshot.section||snapshot.section==='lobby'||transitionMode)return;
  event.preventDefault();event.stopPropagation();navigate('lobby');
 });
 bind(recover,'click',()=>{const snapshot=flow.snapshot();if(disposed||snapshot.route!=='error'||!snapshot.ready||snapshot.busy||retryPending)return;const result=flow.go('lobby');if(result.accepted===false){actionError='Returning to the lobby is currently unavailable.';apply(flow.snapshot());}});
 bind(retry,'click',()=>{
  const snapshot=flow.snapshot();if(disposed||snapshot.route!=='error'||!snapshot.ready||snapshot.busy||!canRetryOperation()||retryPending||typeof onRetry!=='function')return;
  retryPending=true;actionError='';apply(snapshot);
  const finish=(result,error)=>{retryPending=false;if(disposed)return;if(error||result?.accepted===false)actionError=error?'Retry failed: '+String(error.message??error):'Retry is currently unavailable.';apply(flow.snapshot());};
  try{const result=onRetry({snapshot,operationKind:lastOperationKind});if(result&&typeof result.then==='function')Promise.resolve(result).then(value=>finish(value),error=>finish(null,error));else finish(result);}catch(error){finish(null,error);}
 });
 flow=createS5EntryFlow({onChange:apply,beforeNavigate,beforePlay});
 function show(section){return flow.go(section);}
 menuLayout.show=show;
 apply(flow.snapshot());
 return {flow,lobby,sync:values=>flow.sync(values),dispose(){
  if(disposed)return;disposed=true;if(menuLayout.show===show)menuLayout.show=originalShow;
  doc.removeEventListener?.('s5:weapon-loadout-changed',onLoadout);
  for(const [node,type,handler] of bindings)node.removeEventListener(type,handler);
  artwork.dispose();preview.dispose();portrait.dispose();flow.dispose();restoreStage();
  shellAnchor.parentNode?.replaceChild(oldShell,shellAnchor);footerAnchor.parentNode?.replaceChild(oldFooter,footerAnchor);
  for(const {node,legacy} of originals)node.classList.toggle('s5-entry-legacy',legacy);
  for(const {node,hidden} of panelState)node.hidden=hidden;
  for(const {node,selected,aria} of tabState){node.classList.toggle('is-selected',selected);if(aria===null)node.removeAttribute('aria-selected');else node.setAttribute('aria-selected',aria);}
  lobby.destroy();if(!hadHostClass)host.classList.remove('s5-entry-host');
  for(const [key,state] of Object.entries(datasetState)){if(state.present)host.dataset[key]=state.value;else delete host.dataset[key];}
 }};
}
