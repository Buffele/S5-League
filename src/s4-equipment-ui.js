import {S4_EQUIPMENT_ICONS} from './s4-equipment-ui-data.js';

export function s4EquipmentIcon(weapon,skin='classic'){
 const icon=S4_EQUIPMENT_ICONS[weapon];return icon?.skin===skin?icon.url:null;
}

/** Read actual runtime ammunition. Missing reserve means unknown, not infinity. */
export function readS4EquipmentAmmo(controller){
 const state=controller?.rifle??controller?.rocketLauncher??controller?.airgun??controller?.cannonade;
 if(!state||!Number.isFinite(state.ammo))return null;
 return {current:Math.max(0,state.ammo),reserve:Number.isFinite(state.reserve)?Math.max(0,state.reserve):state.reserve===Infinity?'∞':'—'};
}
const runtimeState=controller=>controller?.rifle??controller?.rocketLauncher??controller?.airgun??controller?.cannonade;
const ACTION_LABELS=Object.freeze({idle:'Ready',fire:'Fire',reload:'Reload',charge:'Charge',preload:'Preparing',begin:'Preparing',secondary:'Melee'});

/** Presentation only: never modifies a weapon, loadout, ammunition or selection. */
export function installS4EquipmentUi(host,{document:doc=host?.ownerDocument}={}){
 if(!host||!doc)throw new TypeError('An equipment host and document are required');
 const make=(tag,className)=>{const node=doc.createElement(tag);node.className=className;return node;};
 const ammo=make('div','s4-equipment-ammo'),current=make('b','s4-equipment-current'),separator=make('span','s4-equipment-separator'),reserve=make('span','s4-equipment-reserve');
 ammo.setAttribute('aria-label','Ammunition');separator.textContent='/';ammo.append(current,separator,reserve);ammo.hidden=true;
 const icon=make('img','s4-equipment-icon');icon.alt='';icon.setAttribute('aria-hidden','true');icon.hidden=true;const status=make('span','s4-equipment-status');status.hidden=true;host.append(ammo,icon,status);
 let disposed=false,lastIcon=null,iconAnimation=null;const slotIcons=new Map();
 const text=(node,value)=>{const string=String(value);if(node.textContent!==string)node.textContent=string;};
 function setIcon(node,url){if(url){if(node.getAttribute('src')!==url)node.setAttribute('src',url);if(node.hidden)node.hidden=false;}else{if(!node.hidden)node.hidden=true;if(node.getAttribute('src'))node.removeAttribute('src');}}
 function update({weapon,skin='classic',controller,keyLabel,experimental=false}={}){
  if(disposed)return;
  const values=readS4EquipmentAmmo(controller);if(ammo.hidden!==!values)ammo.hidden=!values;if(status.hidden!==!values)status.hidden=!values;
  const active=String(!!values);if(host.dataset.s4AmmoActive!==active)host.dataset.s4AmmoActive=active;
  if(values)text(status,(ACTION_LABELS[runtimeState(controller)?.phase]??'—')+(experimental?' · experimental':''));
  if(values){text(current,values.current);text(reserve,values.reserve);const label=`Ammunition: ${values.current}; reserve ${values.reserve==='—'?'unavailable':values.reserve==='∞'?'unlimited':values.reserve}`;if(ammo.getAttribute('aria-label')!==label)ammo.setAttribute('aria-label',label);}
  const url=s4EquipmentIcon(weapon,skin);if(url!==lastIcon){lastIcon=url;iconAnimation?.cancel();iconAnimation=null;setIcon(icon,url);
   // equipment.xui weapon/manual: 0 ms alpha0 scale1.25, 150 ms
   // alpha.75 scale1, 200 ms alpha1 scale1; no restart on unchanged frames.
   if(url&&typeof icon.animate==='function'&&!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)iconAnimation=icon.animate([{opacity:0,transform:'scale(1.25)',offset:0},{opacity:.75,transform:'scale(1)',offset:.75},{opacity:1,transform:'scale(1)',offset:1}],{duration:200,easing:'linear'});
  }
  if(host.dataset.s4Equipment!=='native')host.dataset.s4Equipment='native';const iconStatus=url?'authenticated':'unmapped';if(host.dataset.s4EquipmentIcon!==iconStatus)host.dataset.s4EquipmentIcon=iconStatus;
  if(keyLabel!==undefined){const key=host.querySelector(':scope > span');if(key)text(key,keyLabel);}
 }
 function syncSlots(picker,{slots=[],skins=[]}={}){
  if(disposed||!picker)return;
  const live=new Set();
  for(const [index,card]of [...picker.children].entries()){
   if(index>=3)break;live.add(card);const slot=String(index+1);if(card.dataset.s4Slot!==slot)card.dataset.s4Slot=slot;
   let node=slotIcons.get(card);if(!node){node=make('img','s4-equipment-slot-icon');node.alt='';node.setAttribute('aria-hidden','true');card.append(node);slotIcons.set(card,node);}
   setIcon(node,s4EquipmentIcon(slots[index],skins[index]??'classic'));
  }
  for(const [card,node]of slotIcons)if(!live.has(card)){node.remove();slotIcons.delete(card);}
 }
 return {ammo,icon,status,update,syncSlots,dispose(){if(disposed)return;disposed=true;iconAnimation?.cancel();ammo.remove();icon.remove();status.remove();delete host.dataset.s4Equipment;delete host.dataset.s4EquipmentIcon;delete host.dataset.s4AmmoActive;for(const [card,node]of slotIcons){node.remove();delete card.dataset.s4Slot;}slotIcons.clear();}};
}
