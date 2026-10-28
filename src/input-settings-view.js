// UI layout/localization is an S5 adaptation. Defaults/labels carry provenance.
export function installInputSettings(host,{bindings,document:doc=host.ownerDocument,activeIds=[],onCaptureChange=()=>{}}={}){
 const active=new Set(activeIds),make=(tag,cls='',text='')=>{const node=doc.createElement(tag);node.className=cls;node.textContent=text;return node;};
 const root=make('section','s5-input-settings'),title=make('h3','','Controls'),list=make('div','s5-input-settings-list'),other=make('details','s5-input-settings-other'),summary=make('summary','','Other controls'),otherList=make('div','s5-input-settings-list'),status=make('p','s5-input-settings-status'),reset=make('button','','Reset available controls');
 other.append(summary,otherList);status.setAttribute('role','status');status.setAttribute('aria-live','polite');reset.type='button';root.append(title,list,other,status,reset);host.append(root);
 const rows=[];let capturing=null,disposed=false;
 function finish(){if(capturing===null)return;capturing=null;onCaptureChange(false);sync();}
 function sync(){
  if(disposed)return;
  for(const {id,row,key,button,restore,note} of rows){const entry=bindings.get(id),destination=active.has(id)?list:otherList;if(row.parentNode!==destination)destination.append(row);note.textContent=active.has(id)?'':'Unavailable';note.hidden=active.has(id);key.textContent=entry.bindingLabel;key.setAttribute('aria-invalid',String(entry.conflicted&&active.has(id)));button.textContent=capturing===id?'Choose…':'Change';button.disabled=!active.has(id)||capturing!==null&&capturing!==id;restore.disabled=!active.has(id)||capturing!==null||entry.code===entry.defaultCode;button.setAttribute('aria-pressed',String(capturing===id));}
  other.hidden=rows.every(({id})=>active.has(id));
  reset.disabled=capturing!==null||active.size===0;
 }
 function describe(result){
  if(result.accepted)return result.persisted===false?'Binding changed for this session; storage is unavailable.':result.remainingCollisions?.some(row=>active.has(row.id))?'Binding changed; other keys still have conflicts.':'Binding changed.';
  if(result.reason==='collision'){const conflicts=result.collisions.flatMap(row=>row.conflicts.map(item=>item.label));return `Key already in use: ${[...new Set(conflicts)].join(', ')}.`;}
  if(result.reason==='hold-requires-key-or-button')return 'This command requires a key or button that can be held.';
  return 'This key cannot be used.';
 }
 function assign(code){const result=bindings.set(capturing,code);status.textContent=describe(result);if(result.accepted)finish();else sync();return result;}
 function onKey(event){
  if(capturing===null)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  if(event.repeat)return;
  if(event.code==='Escape'){status.textContent='Change canceled.';finish();return;}
  if((event.ctrlKey&&!event.code.startsWith('Control'))||(event.altKey&&!event.code.startsWith('Alt'))||(event.metaKey)){status.textContent='Choose a single key.';return;}
  assign(event.code);
 }
 function onMouse(event){if(capturing===null||root.contains(event.target))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();assign(`MouseButton${event.button}`);}
 function onWheel(event){if(capturing===null||event.deltaY===0)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();assign(event.deltaY<0?'WheelUp':'WheelDown');}
 for(const entry of bindings.definitions){
  const row=make('div','s5-input-settings-row'),label=make('span','',entry.label),key=make('kbd'),button=make('button','','Change'),restore=make('button','','Reset');button.type=restore.type='button';
  button.setAttribute('aria-label',`Change ${entry.label}`);restore.setAttribute('aria-label',`Restore ${entry.label}`);
  const note=make('small');row.append(note);
  button.addEventListener('click',()=>{if(button.disabled||disposed)return;if(capturing===entry.id){status.textContent='Change canceled.';finish();return;}capturing=entry.id;onCaptureChange(true);status.textContent='Choose a key, or click outside the panel. Escape cancels capture.';sync();});
  restore.addEventListener('click',()=>{if(restore.disabled)return;status.textContent=describe(bindings.reset(entry.id));sync();});
  row.append(label,key,button,restore);list.append(row);rows.push({id:entry.id,row,key,button,restore,note});
 }
 reset.addEventListener('click',()=>{if(reset.disabled)return;status.textContent=describe(bindings.replace(Object.fromEntries([...active].map(id=>[id,bindings.get(id).defaultCode]))));sync();});
 const unsubscribe=bindings.subscribe(sync);doc.addEventListener('keydown',onKey,true);doc.addEventListener('mousedown',onMouse,true);doc.addEventListener('wheel',onWheel,{capture:true,passive:false});if(bindings.collisions().some(row=>active.has(row.id)))status.textContent='Some commands share a key. Change them before use.';sync();
 return Object.freeze({sync,setActive(ids){active.clear();for(const id of ids)active.add(id);if(capturing!==null&&!active.has(capturing))finish();sync();},
  cancel(){finish();},dispose(){if(disposed)return;finish();disposed=true;unsubscribe();doc.removeEventListener('keydown',onKey,true);doc.removeEventListener('mousedown',onMouse,true);doc.removeEventListener('wheel',onWheel,true);root.remove();},
 });
}
