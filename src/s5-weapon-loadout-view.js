import {createInventoryNativeIcon} from './inventory-native-icon.js';
/** Three confirmed weapon slots. Requests never replace snapshot data locally. */
export function installS5WeaponLoadoutView(host,{document:doc=host?.ownerDocument,readLoadout,onAssign,onActivate,onRemove,busy=()=>false,canEdit=()=>true,canRemove=(slot,snapshot)=>!!snapshot.slots[slot]&&snapshot.slots.filter(Boolean).length>1,canAssign=()=>true,weaponLabel=weapon=>weapon,weaponIcon=()=>null,renderedIcons=false,onTargetChange=()=>{},onInspect=()=>{},onSettled=()=>{}}={}){
 if(!host||!doc||[readLoadout,onAssign,onActivate,onRemove].some(fn=>typeof fn!=='function'))throw new TypeError('A document and complete weapon loadout port are required');
 const read=()=>{const value=readLoadout();if(!Array.isArray(value?.slots)||value.slots.length!==3||!value.slots.every(weapon=>weapon===null||typeof weapon==='string')||!Number.isInteger(value.activeSlot)||value.activeSlot<0||value.activeSlot>2)throw new TypeError('Three confirmed slots and an active slot are required');return value;};
 let targetSlot=read().activeSlot,disposed=false,inFlight=false,feedback='';
 const make=(tag,className,text)=>{const node=doc.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
 const element=make('section','s5-weapon-loadout');element.setAttribute('aria-label','Three-weapon loadout');
 element.append(make('h3','s5-weapon-loadout-heading','Weapon loadout'));
 const help=make('p','s5-weapon-loadout-help','Click an equipped weapon to display it. Use × to remove it.');element.append(help);
 const slots=make('div','s5-weapon-loadout-slots');element.append(slots);const bindings=[],rows=[];
 const bind=(node,type,handler)=>{node.addEventListener(type,handler);bindings.push([node,type,handler]);};
 const blocked=(snapshot,reason='assign')=>disposed||inFlight||busy()||!canEdit(reason,snapshot)||snapshot.pending===true;
 function allowedAssign(weapon,slot=targetSlot){const snapshot=read();return Number.isInteger(slot)&&slot>=0&&slot<3&&!blocked(snapshot)&&typeof weapon==='string'&&!!weapon&&!snapshot.slots.includes(weapon)&&canAssign(weapon,slot,snapshot)!==false;}
 function finish(result,error){inFlight=false;feedback=error||result?.accepted===false?'Loadout update rejected.':'';if(!disposed){sync();onSettled(result,error);}}
 function request(action,reason='assign'){
  if(disposed)return false;const snapshot=read();if(blocked(snapshot,reason)){sync();return false;}
  inFlight=true;feedback='';sync();
  try{const result=action(snapshot);if(result&&typeof result.then==='function')return Promise.resolve(result).then(value=>{finish(value);return value;},error=>{finish(null,error);return {accepted:false};});finish(result);return result;}catch(error){finish(null,error);return {accepted:false};}
 }
 function display(slot){if(!Number.isInteger(slot)||slot<0||slot>2)throw new RangeError('Weapon slot must be 0, 1 or 2');const snapshot=read();if(!snapshot.slots[slot]||blocked(snapshot,'select'))return false;targetSlot=slot;onTargetChange(slot);sync();return snapshot.activeSlot===slot?true:request(()=>onActivate(slot),'select');}
 function removeSlot(slot){const snapshot=read();if(!Number.isInteger(slot)||slot<0||slot>2||!snapshot.slots[slot]||canRemove(slot,snapshot)===false)return false;return request(()=>onRemove(slot),'remove');}
 for(let slot=0;slot<3;slot++){
  const card=make('article','s5-weapon-loadout-slot');card.dataset.slot=String(slot);const title=make('h4','s5-weapon-loadout-title',`Weapon slot ${slot+1}`),name=make('b','s5-weapon-loadout-name'),state=make('span','s5-weapon-loadout-state');
  const target=make('button','s5-weapon-loadout-target',`Use slot ${slot+1}`),remove=make('button','s5-weapon-loadout-remove','×');
  for(const button of [target,remove]){button.type='button';button.dataset.slot=String(slot);}
  target.setAttribute('aria-label',`Choose weapon slot ${slot+1}`);remove.setAttribute('aria-label',`Remove weapon from slot ${slot+1}`);
  bind(target,'click',()=>{const snapshot=read(),weapon=snapshot.slots[slot];if(blocked(snapshot,weapon?'select':'assign'))return;onInspect(weapon);return weapon?display(slot):setTarget(slot);});
  bind(remove,'click',event=>{event.stopPropagation();return removeSlot(slot);});
  card.append(title,name,state,target,remove);const icon=createInventoryNativeIcon(card,{document:doc,className:'s5-weapon-loadout-icon',allowRenderedPreview:renderedIcons});slots.append(card);rows.push({slot,card,name,state,target,remove,icon});
 }
 const status=make('p','s5-weapon-loadout-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');element.append(status);host.append(element);
 function setTarget(slot){if(!Number.isInteger(slot)||slot<0||slot>2)throw new RangeError('Weapon slot must be 0, 1 or 2');if(blocked(read())){sync();return false;}targetSlot=slot;sync();onTargetChange(slot);return true;}
 function sync(){
  if(disposed)return;const snapshot=read(),locked=blocked(snapshot);element.setAttribute('aria-busy',String(inFlight||busy()||snapshot.pending===true));element.dataset.revision=String(snapshot.revision??0);
  for(const row of rows){const weapon=snapshot.slots[row.slot],active=weapon!==null&&snapshot.activeSlot===row.slot,target=row.slot===targetSlot;row.card.dataset.active=String(active);row.card.dataset.target=String(target);row.name.textContent=weapon?weaponLabel(weapon):'Empty';row.name.title=row.name.textContent;row.icon.update(weapon?weaponIcon(weapon,row.slot,snapshot):null,row.name.textContent);row.state.textContent=active?'In hand':weapon?'Click to display':'Choose a weapon';row.target.disabled=blocked(snapshot,weapon?'select':'assign');row.target.setAttribute('aria-pressed',String(weapon?active:target));row.target.textContent=target?`Target: slot ${row.slot+1}`:`Use slot ${row.slot+1}`;row.target.title=weapon?'Display '+row.name.textContent+' · Slot '+(row.slot+1):'Choose a weapon for slot '+(row.slot+1);row.remove.disabled=blocked(snapshot,'remove')||!weapon||canRemove(row.slot,snapshot)===false;}
  for(const row of rows){row.remove.hidden=!snapshot.slots[row.slot];row.remove.title=canRemove(row.slot,snapshot)===false?'Keep at least one equipped weapon':`Remove weapon from slot ${row.slot+1}`;}
  status.textContent=snapshot.pending||inFlight?'Loadout update pending…':snapshot.error?.reason==='weapon-already-equipped'?'This weapon is already assigned to another slot.':snapshot.status==='rejected'||feedback?snapshot.error?.message||feedback||'Loadout update rejected.':'';
 }
 sync();
 return {element,sync,setTarget,display,remove:removeSlot,get targetSlot(){return targetSlot;},snapshot:read,canAssign:allowedAssign,assign(weapon,skin,slot=targetSlot){if(!allowedAssign(weapon,slot)){sync();return false;}targetSlot=slot;return request(()=>skin===undefined?onAssign(slot,weapon):onAssign(slot,weapon,skin));},changeSkin(weapon,skin){const snapshot=read(),slot=snapshot.slots.indexOf(weapon);if(slot<0||blocked(snapshot)||canAssign(weapon,slot,snapshot)===false)return false;return request(()=>onAssign(slot,weapon,skin));},dispose(){if(disposed)return;disposed=true;for(const row of rows)row.icon.dispose();for(const [node,type,handler] of bindings)node.removeEventListener(type,handler);element.remove();}};
}

