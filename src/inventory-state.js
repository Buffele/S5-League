import {IMPORTED_WEAPONS} from './weapon-inventory.js';
import {WEAPON_CHOICES} from './loadout.js';
import {NATIVE_INVENTORY_CATEGORIES} from './inventory-category-data.js';
// Labels/order: shop_ inven.xui/ArmsSkill_Tab_GroupBox.
export const INVENTORY_CATEGORIES=Object.freeze([
 ['all','All'],['melee','Melee'],['rifle','Rifle'],['guns','Guns'],
 ['heavy','Heavy Gun'],['snipe','Snipe'],['special','Special'],['throwing','Throwing'],['skill','Skill'],
]);
const CATEGORY_IDS={
 rifle:['homing-rifle'],heavy:['machine-gun-2'],throwing:['grenade'],
};
export function inventoryCategory(entry){
 if(NATIVE_INVENTORY_CATEGORIES[entry.id])return NATIVE_INVENTORY_CATEGORIES[entry.id].category;
 if(entry.nativeIdentity?.category)return entry.nativeIdentity.category;
 if(entry.category==='Corps à corps')return 'melee';
 return Object.keys(CATEGORY_IDS).find(key=>CATEGORY_IDS[key].includes(entry.id))??'special';
}
export function inventoryPage(category='all',page=0,entries=IMPORTED_WEAPONS,query=''){
 // The source inventory exposes ItemName_SearchBox. Match displayed names;
 // search never changes registry availability or the authoritative equip port.
 const term=String(query??'').trim().toLowerCase();
 const filtered=entries.filter(entry=>(category==='all'||inventoryCategory(entry)===category)&&(!term||String(entry.name??'').toLowerCase().includes(term)));
 const pages=Math.max(1,Math.ceil(filtered.length/12)),current=Math.min(pages-1,Math.max(0,Math.trunc(page)||0));
 return {entries:filtered.slice(current*12,current*12+12),count:filtered.length,page:current,pages};
}
export function inventoryEntryState(entry,select,{busy=false,choices=WEAPON_CHOICES}={}){
 const id=entry.loadoutId||entry.id,option=[...select.options].find(option=>option.value===id);
 const available=Object.hasOwn(choices,id)&&!!option&&!option.disabled;
 return {id,available,selected:available&&select.value===id,disabled:!available||select.disabled||busy,experimental:available&&!!choices[id].experimental};
}
export function requestInventoryEquip(entry,select,options={}){
 const state=inventoryEntryState(entry,select,options);if(state.disabled||state.selected)return false;
 select.value=state.id;const EventClass=select.ownerDocument?.defaultView?.Event??Event;
 select.dispatchEvent(new EventClass('change',{bubbles:true}));return true;
}
