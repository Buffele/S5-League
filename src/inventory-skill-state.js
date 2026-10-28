// Authenticated skill catalogue; capabilities and equipment acknowledgments belong to main.
export const SKILL_EQUIPMENT_EVENT='s5:skill-equipment-changed';
export const SKILL_CAPABILITIES_EVENT='s5:skill-capabilities-changed';
export function createSkillEquipmentState(catalog){
 return {keys:new Set(catalog.skills.map(entry=>entry.itemKey)),revision:-1,confirmedItemKey:null,pending:false,pendingItemKey:null,lastStatus:'uninitialized'};
}
export function applySkillEquipmentResult(state,detail){
 if(!detail||!Number.isSafeInteger(detail.revision)||detail.revision<=state.revision||!['equipped','pending','rejected'].includes(detail.status))return false;
 const valid=key=>key===null||Number.isSafeInteger(key)&&state.keys.has(key);
 if(!valid(detail.confirmedItemKey)||!valid(detail.requestedItemKey))return false;
 state.revision=detail.revision;state.confirmedItemKey=detail.confirmedItemKey;
 state.pending=detail.status==='pending';state.pendingItemKey=state.pending?detail.requestedItemKey:null;state.lastStatus=detail.status;return true;
}
export function skillPage(catalog,page=0){
 const pages=Math.max(1,Math.ceil(catalog.skills.length/12)),current=Math.min(pages-1,Math.max(0,Math.trunc(page)||0));
 return {entries:catalog.skills.slice(current*12,current*12+12),page:current,pages,count:catalog.skills.length};
}
export function skillCardState(entry,{select,capabilities={},state,busy=false,surface='main',diagnosticOptIn=false,allowedItemKeys=null}={}){
 const key=entry.itemKey,choice=Object.hasOwn(capabilities,key)?capabilities[key]:null;
 const actionType=Number(entry.actionSource?.resources?.type),passive=[9,10].includes(actionType);
 const option=select?[...select.options].find(option=>option.value===String(key)):null;
 const identity=choice?.itemKey===key&&Number.isInteger(actionType)&&choice?.actionType===actionType&&choice?.kind===(passive?'passive':'active');
 const contextAllowed=choice?.diagnosticOnly!==true||(surface==='diagnostic'&&diagnosticOptIn===true);
 const routeAllowed=allowedItemKeys===null||allowedItemKeys.includes(key);
 const available=routeAllowed&&identity&&contextAllowed&&choice.equipmentReady===true&&choice.behaviorReady===true&&(passive||choice.inputReady===true)&&!!option&&!option.disabled;
 const selected=state?.confirmedItemKey===key,pending=state?.pending===true&&state.pendingItemKey===key;
 return {itemKey:key,available,selected,pending,disabled:!available||!!select?.disabled||busy||selected||state?.pending===true,
  experimental:available&&choice.experimental===true,label:pending?'Pending':selected?'Equipped':!available?'Unavailable':choice.experimental?'Experimental':'Available'};
}
export function requestSkillEquip(entry,options){
 const status=skillCardState(entry,options);if(status.disabled)return false;
 const select=options.select;select.value=String(entry.itemKey);
 const EventClass=select.ownerDocument?.defaultView?.Event??Event;select.dispatchEvent(new EventClass('change',{bubbles:true}));return true;
}
export function requestSkillUnequip({select,capabilities={},state,busy=false}={}){
 const option=select?[...select.options].find(option=>option.value===''):null;
 if(!select||select.disabled||!option||option.disabled||busy||state?.pending||state?.confirmedItemKey==null||capabilities.unequipReady!==true)return false;
 select.value='';const EventClass=select.ownerDocument?.defaultView?.Event??Event;select.dispatchEvent(new EventClass('change',{bubbles:true}));return true;
}
export function skillHudState(snapshot,equipmentState){
 const matching=snapshot?.itemKey===equipmentState.confirmedItemKey&&snapshot?.equipmentRevision===equipmentState.revision;
 const activity=matching&&['inactive','starting','active','ending'].includes(snapshot.activity)?snapshot.activity:'unavailable';
 return {visible:snapshot?.visible===true&&equipmentState.confirmedItemKey!==null,itemKey:equipmentState.confirmedItemKey,activity,
  // Hint text comes from the actual main input adapter; no native key guessed.
  hints:matching&&snapshot.inputReady===true&&Array.isArray(snapshot.bindingLabels)?snapshot.bindingLabels.filter(label=>typeof label==='string'&&label.length):[],
  allowedActions:matching&&snapshot.contextReady===true&&snapshot.inputReady===true?{activate:snapshot.allowedActions?.activate===true,end:snapshot.allowedActions?.end===true}:{activate:false,end:false}};
}
