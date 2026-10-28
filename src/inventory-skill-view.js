import {SKILL_EQUIPMENT_EVENT,SKILL_CAPABILITIES_EVENT,createSkillEquipmentState,applySkillEquipmentResult,skillPage,skillCardState,requestSkillEquip,requestSkillUnequip} from './inventory-skill-state.js';
import {createInventoryNativeIcon} from './inventory-native-icon.js';

const MAIN_ITEMS=Object.freeze([3050001,3050002]);
// Catalogue, real select and authoritative getters are injected by main.
// Native icon identity is presentation only and never grants runtime readiness.
const skillIconUrl=entry=>entry&&entry.iconUrl===`/assets/s5runtime/skills/${entry.itemKey}.png`&&/^[a-f\d]{64}$/i.test(entry.iconSource?.sha256??'')?entry.iconUrl:null;
export function installInventorySkillView(host,{catalog,document:doc=host.ownerDocument,select=doc.getElementById('skill-select'),readCapabilities=()=>({}),readEquipment=()=>null,summaryHost=host,busy=()=>false,Observer=globalThis.MutationObserver,surface='main',diagnosticOptIn=false}={}){
 if(host.inventorySkillView){host.inventorySkillView.sync();return host.inventorySkillView;}
 if(!catalog?.skills?.length)throw new TypeError('Authenticated skill catalogue required');
 const state=createSkillEquipmentState(catalog),make=(tag,className='',text='')=>{const node=doc.createElement(tag);node.className=className;node.textContent=text;return node;};
 const section=make('section','s5runtime-inventory-skills'),list=make('div','s5runtime-inventory-items'),status=make('p','s5runtime-inventory-status');status.setAttribute('role','status');
 const pagination=make('div','s5runtime-inventory-pagination'),previous=make('button','','‹'),label=make('output'),next=make('button','','›');
 previous.type=next.type='button';previous.setAttribute('aria-label','Previous skill page');next.setAttribute('aria-label','Next skill page');pagination.append(previous,label,next);section.append(list,status,pagination);host.append(section);
 const slot=make('div','s5runtime-inventory-skill-slot'),frame=make('div','s5runtime-skill-slot-frame'),slotMarker=make('span','s5-skill-marker','S'),copy=make('div','s5runtime-skill-slot-copy'),slotName=make('b','','Skill'),slotNote=make('small'),remove=make('button','s5runtime-skill-remove','Remove');
 slotMarker.setAttribute('aria-hidden','true');slotMarker.hidden=true;frame.append(slotMarker);remove.type='button';remove.hidden=true;copy.append(slotName,slotNote,remove);slot.append(frame,copy);summaryHost.append(slot);
 let page=0,cards=[],disposed=false,slotHasSkill=false;
 const slotIcon=createInventoryNativeIcon(frame,{document:doc,className:'s5-inventory-skill-image',onStateChange:state=>{slotMarker.hidden=!slotHasSkill||state==='ready';slotMarker.textContent=state==='loading'?'Loading icon…':'Icon unavailable';}});
 const capabilityOptions=()=>({select,capabilities:readCapabilities()??{},state,busy:busy(),surface,diagnosticOptIn,allowedItemKeys:surface==='main'?MAIN_ITEMS:null});
 function sync(){
  if(disposed)return;const options=capabilityOptions();
  status.textContent=state.pending?'Equipment pending.':state.lastStatus==='rejected'?'Equipment rejected.':'Only skills marked Experimental can be equipped.';
  const selected=catalog.skills.find(entry=>entry.itemKey===state.confirmedItemKey);frame.dataset.equipped=String(!!selected);slotHasSkill=!!selected;slotMarker.hidden=!selected||slotIcon.state==='ready';slotIcon.update(skillIconUrl(selected),selected?.name??'');
  slotName.textContent=selected?selected.name:'Skill';slotNote.textContent=state.pending?'Change pending':selected?'Experimental':state.lastStatus==='uninitialized'?'Equipment awaiting sync':'No skill equipped';
  const emptyOption=select?[...select.options].find(option=>option.value===''):null;
  remove.hidden=!selected||options.capabilities.unequipReady!==true||!emptyOption||emptyOption.disabled;
  remove.disabled=options.busy||!!select?.disabled||state.pending;
  for(const {entry,card,availability,actions} of cards){
   const current=skillCardState(entry,options);card.dataset.selected=String(current.selected);card.dataset.pending=String(current.pending);
   availability.textContent=current.pending?'Pending':current.selected?'Equipped · Experimental':current.available?'Experimental':'Unavailable';
   const signature=[current.available,current.disabled,current.selected,current.pending].join(':');if(actions.signature===signature)continue;actions.signature=signature;actions.replaceChildren();
   if(current.available&&!current.selected&&!current.pending){
    const equip=make('button','s5runtime-inventory-equip','Equip');equip.type='button';equip.disabled=current.disabled;equip.dataset.skill=String(entry.itemKey);
    equip.addEventListener('click',()=>{requestSkillEquip(entry,capabilityOptions());sync();});actions.append(equip);
   }
  }
 }
 function render(){
  const result=skillPage(catalog,page);page=result.page;for(const card of cards)card.icon.dispose();cards=[];list.replaceChildren();
  for(const entry of result.entries){
   const card=make('article','s5runtime-inventory-item'),marker=make('span','s5-inventory-marker s5-inventory-marker--skill','SKILL');card.dataset.skill=String(entry.itemKey);marker.setAttribute('aria-hidden','true');
   const iconFrame=make('div','s5-inventory-skill-icon');iconFrame.append(marker);
   const icon=createInventoryNativeIcon(iconFrame,{document:doc,className:'s5-inventory-skill-image',onStateChange:state=>{marker.hidden=state==='ready';marker.textContent=state==='loading'?'Loading icon…':'Icon unavailable';}});icon.update(skillIconUrl(entry),entry.name);
   const name=make('b','s5runtime-inventory-name',entry.name),availability=make('small','s5runtime-inventory-availability'),actions=make('div','s5runtime-skill-actions');card.append(iconFrame,name,availability,actions);list.append(card);cards.push({entry,card,availability,actions,icon});
  }
  previous.disabled=page===0;next.disabled=page===result.pages-1;label.textContent=`${page+1} / ${result.pages}`;sync();
 }
 const onEquipment=event=>{if(applySkillEquipmentResult(state,event.detail))sync();};
 remove.addEventListener('click',()=>{requestSkillUnequip(capabilityOptions());sync();});
 previous.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});
 doc.addEventListener(SKILL_EQUIPMENT_EVENT,onEquipment);doc.addEventListener(SKILL_CAPABILITIES_EVENT,sync);select?.addEventListener('change',sync);
 const observer=Observer?new Observer(sync):null;if(select)observer?.observe(select,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true});
 const initial=readEquipment();if(initial)applySkillEquipmentResult(state,initial);render();
 const view={state,section,slot,sync,setPage(value){page=value;render();},dispose(){if(disposed)return;disposed=true;slotIcon.dispose();for(const card of cards)card.icon.dispose();observer?.disconnect();doc.removeEventListener(SKILL_EQUIPMENT_EVENT,onEquipment);doc.removeEventListener(SKILL_CAPABILITIES_EVENT,sync);select?.removeEventListener('change',sync);section.remove();slot.remove();if(host.inventorySkillView===view)delete host.inventorySkillView;}};
 host.inventorySkillView=view;return view;
}
