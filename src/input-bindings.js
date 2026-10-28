import {NATIVE_BINDING_DEFINITIONS} from './input-binding-data.js';
const displayDefinitions=Object.freeze(NATIVE_BINDING_DEFINITIONS.map(entry=>Object.freeze({...entry,label:entry.nativeLabel})));
// Shared configuration; authenticated defaults and route provenance live in data.
export const INPUT_BINDING_STORAGE_KEY='s5.input-bindings.v1';
export function bindingCodeLabel(code){
 const names={ShiftLeft:'Left Shift',ShiftRight:'Right Shift',ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',AltLeft:'Left Alt',AltRight:'Right Alt',Space:'Space',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',WheelUp:'Wheel Up',WheelDown:'Wheel Down',MouseButton0:'Left Click',MouseButton1:'Middle Click',MouseButton2:'Right Click',MouseButton3:'Mouse Button 4',MouseButton4:'Mouse Button 5'};
 return names[code]??code.replace(/^Key|^Digit/,'');
}
export function validBindingCode(code){
 return typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|F(?:[1-9]|1[0-2])|Space|Tab|Enter|Backquote|Backspace|Escape|Shift(?:Left|Right)|Control(?:Left|Right)|Alt(?:Left|Right)|Arrow(?:Up|Down|Left|Right)|Home|End|PageUp|PageDown|Insert|Delete|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Numpad[0-9]|MouseButton[0-4]|WheelUp|WheelDown)$/.test(code);
}
export function createInputBindings({initial=null,storage=null,storageKey=INPUT_BINDING_STORAGE_KEY,externalBindings=[{id:'menu',label:'Menu',code:'Escape'}],formatCodeLabel=bindingCodeLabel}={}){
 const definitions=new Map(displayDefinitions.map(entry=>[entry.id,entry]));
 const defaults=Object.fromEntries(NATIVE_BINDING_DEFINITIONS.map(entry=>[entry.id,entry.defaultCode]));
 let codes={...defaults},revision=0,storageError=null;const listeners=new Set();
 const external=externalBindings.map(entry=>Object.freeze({...entry}));
 if(new Set(external.map(entry=>entry.id)).size!==external.length||external.some(entry=>definitions.has(entry.id)))throw Error('External binding IDs must be unique and separate from native commands');
 function collisions(mapping){
  const all=[...Object.entries(mapping).map(([id,code])=>({id,label:definitions.get(id).label,code})),...external];const result=[];
  for(const [id,code] of Object.entries(mapping)){
   const conflicts=all.filter(entry=>entry.code===code&&entry.id!==id);
   if(conflicts.length)result.push({id,code,conflicts:conflicts.map(entry=>({id:entry.id,label:entry.label,external:!definitions.has(entry.id)}))});
  }return result;
 }
 function validate(mapping,{restore=false}={}){
  if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))return {accepted:false,reason:'invalid-bindings'};
  if(Object.keys(mapping).some(id=>!definitions.has(id)))return {accepted:false,reason:'unknown-command'};
  const next={...codes,...mapping};
  for(const [id,code] of Object.entries(next)){
   if(!validBindingCode(code))return {accepted:false,reason:'invalid-code',id,code};
   if(definitions.get(id).requiresHold&&code.startsWith('Wheel'))return {accepted:false,reason:'hold-requires-key-or-button',id,code};
  }
  const conflicts=collisions(next).filter(row=>Object.hasOwn(mapping,row.id)||row.conflicts.some(item=>Object.hasOwn(mapping,item.id)));
  // A new external reservation must block routing, not erase a saved layout.
  // Existing unrelated conflicts can be repaired one command at a time.
  const rejected=restore?conflicts.filter(row=>row.conflicts.some(item=>!item.external)):conflicts;
  if(rejected.length)return {accepted:false,reason:'collision',collisions:rejected};
  return {accepted:true,codes:next};
 }
 function snapshot(){return Object.freeze({version:1,revision,bindings:Object.freeze({...codes})});}
 function labelFor(code){try{const label=formatCodeLabel(code);if(typeof label==='string'&&label.length)return label;}catch{}return bindingCodeLabel(code);}
 function apply(mapping,{persist=true,restore=false}={}){
  const result=validate(mapping,{restore});if(!result.accepted)return result;
  const changes=Object.keys(codes).filter(id=>codes[id]!==result.codes[id]);if(!changes.length)return {accepted:true,changed:false,revision,persisted:storageError===null};
  const previous=snapshot();codes=result.codes;revision++;let persisted=true;storageError=null;
  if(persist&&storage)try{storage.setItem(storageKey,JSON.stringify({version:1,bindings:codes}));}catch(error){persisted=false;storageError=String(error);}
  const detail=Object.freeze({type:'bindings-changed',previous,current:snapshot(),changes:Object.freeze(changes)});
  const listenerErrors=[];for(const listener of [...listeners])try{listener(detail);}catch(error){listenerErrors.push(String(error));}
  return {accepted:true,changed:true,revision,persisted,storageError,listenerErrors,remainingCollisions:collisions(codes)};
 }
 function restore(value){
  if(!value||value.version!==1||!value.bindings)return {accepted:false,reason:'invalid-stored-schema'};
  return apply(value.bindings,{persist:false,restore:true});
 }
 let restored={accepted:true,changed:false};
 if(initial)restored=restore(initial);
 else if(storage)try{const saved=storage.getItem(storageKey);if(saved)restored=restore(JSON.parse(saved));}catch(error){restored={accepted:false,reason:'storage-unavailable'};storageError=String(error);}
 return Object.freeze({
  definitions:displayDefinitions,restored,
  get(id){const entry=definitions.get(id);if(!entry)return null;return Object.freeze({...entry,code:codes[id],bindingLabel:labelFor(codes[id]),conflicted:collisions(codes).some(row=>row.id===id),revision});},
  snapshot,collisions(){return collisions(codes);},
  commandsFor(code){return Object.keys(codes).filter(id=>codes[id]===code&&!collisions(codes).some(c=>c.id===id));},
  set(id,code){return apply({[id]:code});},
  replace(mapping){return apply(mapping);},
  reset(id=null){return id===null?apply(defaults):definitions.has(id)?apply({[id]:defaults[id]}):{accepted:false,reason:'unknown-command'};},
  export(){return {version:1,bindings:{...codes}};},
  subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
 });
}
