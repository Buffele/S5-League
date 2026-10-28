import {IMPORTED_WEAPONS} from './weapon-inventory.js';
import {INVENTORY_CATEGORIES,inventoryPage,inventoryEntryState,requestInventoryEquip} from './inventory-state.js';
import {createInventoryAvatarPreview} from './inventory-avatar-preview.js';
import {installInventorySkillView} from './inventory-skill-view.js';
import {installS5WeaponLoadoutView} from './s5-weapon-loadout-view.js';
import {s4EquipmentIcon} from './s4-equipment-ui.js';
import {WEAPON_CHOICES} from './loadout.js';
import {s5LobbyIcon} from './s5-lobby-icons.js';
import {createInventoryNativeIcon} from './inventory-native-icon.js';
import {installInventoryWeaponEffects} from './inventory-weapon-effects.js';

export function installInventoryMenuView(shell,{document:doc=document,Observer=MutationObserver,createPreview=createInventoryAvatarPreview}={}){
 const existing=shell.querySelector('[data-panel="inventory"]');if(existing)return existing.inventory;
 const make=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
 const button=(className,text,action)=>{const node=make('button',className,text);node.type='button';if(action)node.addEventListener('click',action);return node;};
 const select=doc.getElementById('weapon-select'),play=doc.getElementById('play'),status=doc.getElementById('load-status');if(!select)return null;
 const tab=button('', 'Inventory');tab.dataset.tab='inventory';shell.querySelector('.menu-tabs').append(tab);
 const panel=make('section','menu-panel s5runtime-inventory');panel.dataset.panel='inventory';panel.hidden=true;panel.append(make('h2','','Inventory'));
 const loadoutHost=make('div','s5-weapon-loadout-host');loadoutHost.hidden=true;
 const layout=make('div','s5runtime-inventory-layout');panel.append(layout);
 const equipped=make('aside','s5runtime-equipment-summary');layout.append(equipped);equipped.append(make('h3','','My equipment'));
 const previewContainer=make('div','s5runtime-inventory-avatar');previewContainer.dataset.previewStatus='waiting';equipped.append(previewContainer);const preview=createPreview(previewContainer);
 // The native equipment column owns the three weapon slots below its avatar;
 // a full-width row before the layout pushes both the avatar and catalog away.
 equipped.append(loadoutHost);
 const active=make('div','s5runtime-active-equipment'),activeFrame=make('div','s5-inventory-weapon-preview s5-inventory-active-preview'),activeMarker=make('span','s5-equipment-marker','3D'),activeName=make('b');activeMarker.setAttribute('aria-hidden','true');activeFrame.append(activeMarker);active.append(activeFrame,activeName);equipped.append(active);
 const activePreview={frame:activeFrame,marker:activeMarker,card:active,token:0};
 const appearance=make('details','s5-inventory-appearance'),appearanceTitle=make('summary','','Weapon appearance'),proxies=make('div','s5runtime-equipment-controls');appearance.append(appearanceTitle,proxies);equipped.append(appearance);
 const compactAppearance=doc.defaultView?.matchMedia?.('(max-width: 500px)')??null;
 const syncAppearanceViewport=()=>{appearance.open=compactAppearance?.matches!==true;};syncAppearanceViewport();compactAppearance?.addEventListener?.('change',syncAppearanceViewport);
 const liveStatus=make('p','s5runtime-inventory-status');liveStatus.setAttribute('role','status');equipped.append(liveStatus);
 const catalog=make('div','s5runtime-inventory-catalog');layout.append(catalog);
 const sections=make('nav','s5-inventory-sections');sections.setAttribute('aria-label','Inventory sections');catalog.append(sections);
 let section='weapons';const sectionButtons=[];
 for(const [id,label] of [['weapons','Weapons'],['outfits','Outfits'],['skills','Skills']]){const item=button('',label,()=>{section=id;if(id==='skills')category='skill';else if(category==='skill')category='all';cancelEquip();render();});item.dataset.inventorySection=id;sections.append(item);sectionButtons.push(item);}
 const categoryTabs=make('nav','s5runtime-inventory-categories');categoryTabs.setAttribute('aria-label','Weapon categories');catalog.append(categoryTabs);
 let category='all',page=0,query='',confirmedWeapon=select.value,pendingWeapon=null,skillView=null,loadoutView=null,previewPort=null,effectView=null;const categoryButtons=[];
 for(const [id,label] of INVENTORY_CATEGORIES){const item=button('',label,()=>{category=id;section=id==='skill'?'skills':'weapons';page=0;cancelEquip(false);if(id==='skill')skillView?.setPage(0);render();});item.dataset.category=id;categoryTabs.append(item);categoryButtons.push(item);}
 const searchField=make('div','s5-inventory-search-field'),search=make('input','s5-inventory-search');search.type='search';search.placeholder='Search weapons…';search.setAttribute('aria-label','Search weapons');search.autocomplete='off';
 const onSearchInput=()=>{if(disposed)return;query=search.value;page=0;render();};search.addEventListener('input',onSearchInput);searchField.append(search);catalog.append(searchField);
 const slotIntent=make('p','s5-inventory-slot-intent');slotIntent.hidden=true;catalog.append(slotIntent);
 const list=make('div','s5runtime-inventory-items');catalog.append(list);
 const empty=make('p','s5runtime-inventory-empty');empty.hidden=true;catalog.append(empty);
 const pagination=make('div','s5runtime-inventory-pagination'),previous=button('','‹',()=>{page--;render();}),pageLabel=make('output'),next=button('','›',()=>{page++;render();});
 previous.setAttribute('aria-label','Previous page');next.setAttribute('aria-label','Next page');pagination.append(previous,pageLabel,next);catalog.append(pagination);
 const skillHost=make('div','s5runtime-inventory-skill-host');skillHost.hidden=true;catalog.append(skillHost);
 const outfitHost=make('div','s5-inventory-outfits');outfitHost.hidden=true;catalog.append(outfitHost);
 const skinLabel=make('span','','Weapon appearance'),skinSelect=make('select','s5-inventory-skin-select');skinSelect.setAttribute('aria-label','Weapon appearance');
 const inspectEquip=button('s5-inventory-inspector-equip','Equip',()=>beginEquip(inspectedEntry()));proxies.append(skinLabel,skinSelect,inspectEquip);
 const inspectedStatus=make('small','s5-inventory-inspected-status');active.append(inspectedStatus);
 const slotPicker=make('section','s5-inventory-slot-picker');slotPicker.hidden=true;slotPicker.setAttribute('role','dialog');slotPicker.setAttribute('aria-modal','true');slotPicker.setAttribute('aria-label','Equip weapon');
 const pickerDialog=make('div','s5-inventory-slot-dialog'),pickerTitle=make('h3','','Equip weapon'),pickerClose=button('s5-inventory-picker-close','×',()=>cancelEquip());pickerClose.setAttribute('aria-label','Close slot selection');
 const pickerWeapon=make('div','s5-inventory-picker-weapon'),pickerWeaponCopy=make('div'),pickerWeaponName=make('b'),pickerWeaponSkin=make('small');pickerWeaponCopy.append(pickerWeaponName,pickerWeaponSkin);pickerWeapon.append(pickerWeaponCopy);
 const pickerWeaponIcon=createInventoryNativeIcon(pickerWeapon,{document:doc,className:'s5-inventory-picker-weapon-image',allowRenderedPreview:true});
 const pickerSlots=make('div','s5-inventory-picker-slots'),pickerCancel=button('s5-inventory-picker-cancel','Cancel',()=>cancelEquip());pickerDialog.append(pickerTitle,pickerClose,pickerWeapon,make('p','s5-inventory-picker-hint','Select a slot'),pickerSlots,pickerCancel);slotPicker.append(pickerDialog);panel.append(slotPicker);
 let inspectedWeapon=null,equipRequest=null,pickerFocus=null;const stagedSkins=new Map(),previewUrls=new Map(),pickerButtons=[],pickerRows=[],inertNodes=[];
 for(let slot=0;slot<3;slot++){const item=button('','',()=>{if(!equipRequest||!loadoutView?.canAssign(equipRequest.weapon,slot))return;const request=equipRequest;cancelEquip(false);loadoutView.assign(request.weapon,request.skin,slot);sync();inspectEquip.focus?.();});item.dataset.equipSlot=String(slot);const number=make('span','s5-inventory-picker-slot-number',String(slot+1)),name=make('b'),note=make('small');item.append(number,name,note);const icon=createInventoryNativeIcon(item,{document:doc,className:'s5-inventory-picker-slot-image',allowRenderedPreview:true});pickerSlots.append(item);pickerButtons.push(item);pickerRows.push({item,name,note,icon});}
 const onBackdrop=event=>{if(event.target===slotPicker)cancelEquip();};slotPicker.addEventListener('click',onBackdrop);
 const inspectedEntry=()=>IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===(inspectedWeapon||confirmedWeapon));
 function inspect(entry){if(disposed||!entry)return;inspectedWeapon=entry.loadoutId||entry.id;appearance.open=true;cancelEquip(false);sync();}
 function inspectFromCatalog(entry){inspect(entry);const slot=loadoutView?.snapshot().slots.indexOf(entry.loadoutId||entry.id)??-1;if(slot>=0)loadoutView.display(slot);}
 function cancelEquip(restoreFocus=true){const wasOpen=!!equipRequest;equipRequest=null;slotPicker.hidden=true;for(const {node,inert}of inertNodes)node.inert=inert;inertNodes.length=0;if(wasOpen&&restoreFocus)(pickerFocus??inspectEquip).focus?.();pickerFocus=null;}
 function beginEquip(entry){
  if(disposed||!entry||inventoryEntryState(entry,select,{busy:!!play?.disabled}).disabled)return;
  inspect(entry);const weapon=entry.loadoutId||entry.id;
  if(!loadoutView){requestInventoryEquip(entry,select,{busy:!!play?.disabled});sync();return;}
  if(!loadoutView.canAssign(weapon))return;
  pickerFocus=doc.activeElement??inspectEquip;equipRequest={weapon,skin:skinSelect.value||'classic'};slotPicker.hidden=false;
  for(const node of [layout,...(shell.closest?.('.s5-lobby')?.querySelectorAll('.s5-lobby-navigation,.s5-lobby-footer')??[])]){inertNodes.push({node,inert:node.inert});node.inert=true;}
  sync();previewPort?.prepareEquipment([weapon,...loadoutView.snapshot().slots.filter(Boolean)]);(pickerButtons[loadoutView.targetSlot]?.disabled?pickerButtons.find(item=>!item.disabled):pickerButtons[loadoutView.targetSlot])?.focus?.();
 }
 const onSkinChange=()=>{const entry=inspectedEntry(),weapon=entry?.loadoutId||entry?.id,skin=skinSelect.value;if(disposed||!entry||skinSelect.disabled||!Object.hasOwn(WEAPON_CHOICES[weapon]?.skins??{},skin))return;cancelEquip(false);const snapshot=loadoutView?.snapshot();if(snapshot?.slots.includes(weapon))loadoutView.changeSkin(weapon,skin);else stagedSkins.set(weapon,skin);sync();};
 skinSelect.addEventListener('change',onSkinChange);
 const onPickerKey=event=>{if(!equipRequest)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancelEquip();}else if(event.key==='Tab'){const enabled=[pickerClose,...pickerButtons,pickerCancel].filter(node=>!node.disabled),first=enabled[0],last=enabled.at(-1);if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus?.();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus?.();}}};panel.addEventListener('keydown',onPickerKey);
 const outfitSource=doc.getElementById('outfit-select'),characterSource=doc.getElementById('appearance-select'),bodySource=doc.getElementById('sex-select');
 let outfitSignature='';
 function syncOutfits(){
  const skin=characterSource?.value||'meshy',signature=[skin,bodySource?.value,outfitSource?.value,outfitSource?.disabled,play?.disabled,...[...(outfitSource?.options??[])].map(item=>`${item.value}:${item.textContent}:${item.disabled}`)].join('|');if(signature===outfitSignature)return;outfitSignature=signature;outfitHost.replaceChildren();
  outfitHost.append(make('h3','','Outfits'));
  const choices=outfitSource&&!outfitSource.disabled?[...outfitSource.options]:[{value:outfitSource?.value||'01',textContent:skin==='meshy'?'Meshy outfit':skin==='urban'?'Urban outfit':'Current outfit',disabled:true}];
  const grid=make('div','s5-inventory-outfit-grid');outfitHost.append(grid);
  for(const option of choices){const card=make('article','s5-inventory-outfit'),selected=outfitSource?.value===option.value;card.dataset.selected=String(selected);const icon=make('span','s5-inventory-outfit-icon');icon.innerHTML=s5LobbyIcon('shirt');icon.setAttribute('aria-hidden','true');const action=button('',selected?'Equipped':'Equip',()=>{if(disposed||action.disabled||!outfitSource||outfitSource.disabled||play?.disabled)return;outfitSource.value=option.value;outfitSource.dispatchEvent(new (doc.defaultView?.Event??Event)('change',{bubbles:true}));sync();});action.disabled=selected||option.disabled||!!play?.disabled;card.append(icon,make('b','',option.textContent),make('small','',bodySource?.value==='female'?'Female':'Male'),action);grid.append(card);}
  if(outfitSource?.disabled)outfitHost.append(make('p','s5-inventory-outfit-note','This character has one outfit. Change skin type or body in Settings.'));
 }
 const limits=make('p','s5runtime-inventory-limits','Equipment marked Experimental is still being verified. Three-weapon loadouts are unavailable in this version.');panel.append(limits);
 let cards=[],cardGeneration=0;
 function render(){
  previewPort?.invalidateCards();cardGeneration++;
  const result=inventoryPage(category,page,IMPORTED_WEAPONS,category==='skill'?'':query);page=result.page;list.replaceChildren();cards=[];
  for(const entry of result.entries){
   const card=make('article','s5runtime-inventory-item');card.dataset.item=entry.id;
   const marker=make('span','s5-inventory-marker','WEAPON');marker.setAttribute('aria-hidden','true');
   const frame=make('div','s5-inventory-weapon-preview');frame.append(marker);
   const name=make('b','s5runtime-inventory-name',entry.name),availability=make('small','s5runtime-inventory-availability');
   const equip=button('s5runtime-inventory-equip','Equip',()=>beginEquip(entry));equip.dataset.weapon=entry.id;
   frame.setAttribute('role','button');frame.setAttribute('tabindex','0');frame.setAttribute('aria-label',`Inspect ${entry.name}`);frame.addEventListener('click',()=>inspectFromCatalog(entry));frame.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inspectFromCatalog(entry);}});name.addEventListener('click',()=>inspectFromCatalog(entry));
   card.append(frame,name,availability,equip);list.append(card);cards.push({entry,card,availability,equip,frame,marker,generation:cardGeneration,token:0});
  }
  const outfits=section==='outfits',showSkills=!outfits&&category==='skill'&&!!skillView;skillHost.hidden=!showSkills;outfitHost.hidden=!outfits;list.hidden=showSkills||outfits;pagination.hidden=showSkills||outfits;searchField.hidden=category==='skill'||outfits;categoryTabs.hidden=section!=='weapons';active.hidden=appearance.hidden=outfits||showSkills;
  for(const item of sectionButtons)item.setAttribute('aria-pressed',String(item.dataset.inventorySection===section));
  empty.hidden=outfits||showSkills||result.count>0;empty.textContent=category==='skill'?'Loading skill catalog.':query.trim()?'No weapons match your search.':'No weapons in this category.';
  pageLabel.textContent=`${page+1} / ${result.pages}`;previous.disabled=page===0;next.disabled=page===result.pages-1;
  for(const item of categoryButtons)item.setAttribute('aria-pressed',String(item.dataset.category===category));sync();
 }
 function onEquipment(event){
  if(event.detail?.loadout?.weapon)confirmedWeapon=event.detail.loadout.weapon;
  pendingWeapon=event.detail?.pendingWeapon??null;sync();
 }
 function sync(){
  if(disposed)return;
  // Authoritative equipment state is still collected by onEquipment. Its DOM
  // can wait while the containing game menu is hidden; main syncs on return.
  for(let node=panel.parentElement??panel.parentNode??panel.parent;node;node=node.parentElement??node.parentNode??node.parent)if(node.hidden)return;
  const busy=!!play?.disabled;panel.setAttribute('aria-busy',String(busy));
  const loadout=loadoutView?.snapshot();loadoutView?.sync();
  slotIntent.hidden=!loadout||section!=='weapons';if(loadout){const target=loadoutView.targetSlot,weapon=loadout.slots[target];slotIntent.textContent='Editing weapon slot '+(target+1)+' · '+(weapon?WEAPON_CHOICES[weapon]?.name??weapon:'Empty slot');}
  // switchWeapon emits authoritative results. A requested select value alone is not acceptance.
  const currentWeapon=loadout?loadout.slots[loadout.activeSlot]:confirmedWeapon;
  const current=IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===(inspectedWeapon||currentWeapon));
  activeName.textContent=current?.name||'Weapon';
  const inspectedId=current?.loadoutId||current?.id,assignedSlot=loadout?.slots.indexOf(inspectedId)??-1,skinOptions=Object.entries(WEAPON_CHOICES[inspectedId]?.skins??{}),skinSignature=JSON.stringify(skinOptions);
  effectView?.sync(section==='weapons'?inspectedId:null);
  if(skinSelect.dataset.signature!==skinSignature){skinSelect.replaceChildren();for(const [value,label]of skinOptions){const option=make('option','',label);option.value=value;skinSelect.append(option);}skinSelect.dataset.signature=skinSignature;}
  skinSelect.value=assignedSlot>=0?loadout.skins?.[assignedSlot]??'classic':stagedSkins.get(inspectedId)??'classic';
  const inspectedState=current?inventoryEntryState(current,select,{busy}):{disabled:true};skinSelect.disabled=inspectedState.disabled||loadout?.pending===true||skinOptions.length<2;
  inspectEquip.textContent=assignedSlot>=0?'Equipped':'Equip';inspectEquip.disabled=inspectedState.disabled||assignedSlot>=0||!!loadout&&!loadoutView.canAssign(inspectedId);
  inspectedStatus.textContent=assignedSlot>=0?`Equipped in slot ${assignedSlot+1}`:loadout?.pending||busy?'Updating equipment…':inspectedState.disabled?'Unavailable':'Choose an appearance, then equip';
  if(equipRequest){const {weapon:requested,skin}=equipRequest;pickerWeaponName.textContent=WEAPON_CHOICES[requested]?.name??requested;pickerWeaponSkin.textContent=WEAPON_CHOICES[requested]?.skins[skin]??skin;pickerWeaponIcon.update(previewUrls.get(requested)??s4EquipmentIcon(requested,skin),pickerWeaponName.textContent);for(let slot=0;slot<3;slot++){const weapon=loadout?.slots[slot],row=pickerRows[slot],name=weapon?WEAPON_CHOICES[weapon]?.name??weapon:'Empty slot';row.name.textContent=name;row.note.textContent=weapon?'Replace':'Assign';row.item.setAttribute('aria-label',`Slot ${slot+1} · ${weapon?'Replace '+name:'Empty slot'}`);row.item.disabled=!loadoutView?.canAssign(requested,slot);row.icon.update(weapon?(previewUrls.get(weapon)??s4EquipmentIcon(weapon,loadout.skins?.[slot]??'classic')):null,name);}}
  syncOutfits();
  liveStatus.textContent=pendingWeapon?`Change pending · ${pendingWeapon}`:status?.textContent||'';
  const feedback=pendingWeapon||loadout?.pending||busy?'pending':loadout?.status==='rejected'||loadout?.error||/\b(?:error|failed|failure|unable|rejected|unavailable)\b/i.test(liveStatus.textContent)?'error':'ready';
  liveStatus.dataset.feedback=feedback;loadoutHost.dataset.feedback=feedback;
  for(const {entry,card,availability,equip} of cards){
   const state=inventoryEntryState(entry,select,{busy}),selected=state.available&&state.id===confirmedWeapon,pending=state.id===pendingWeapon;
   card.dataset.inspected=String(state.id===inspectedWeapon);card.dataset.selected=String(selected);card.dataset.pending=String(pending);equip.disabled=state.disabled||selected||pending;equip.setAttribute('aria-pressed',String(selected));
   equip.textContent=selected?'Equipped':pending?'Pending':'Equip';availability.textContent=!state.available?'Unavailable':state.experimental?'Experimental':'Available';
   if(loadout){
    const assigned=loadout.slots.flatMap((weapon,slot)=>weapon===state.id?[slot]:[]),target=loadoutView.targetSlot;
    card.dataset.selected=String(state.available&&assigned.length>0);card.dataset.pending=String(loadout.pending===true&&loadout.proposal?.slots?.[target]===state.id);
    equip.disabled=!state.available||state.disabled||!loadoutView.canAssign(state.id);
    equip.setAttribute('aria-pressed',String(assigned.length>0));equip.textContent=assigned.length?'Equipped':'Equip';
    equip.title=assigned.length?`Assigned to weapon slot ${assigned.map(slot=>slot+1).join(', ')}.`:'Equip, then choose a weapon slot.';
    if(assigned.length)availability.textContent+=` · Slot ${assigned.map(slot=>slot+1).join(', ')}`;
   }
  }
  skillView?.sync();
  previewPort?.sync();
 }
 function createWeaponPreviews({getPreview,IntersectionObserverClass=doc.defaultView?.IntersectionObserver}){
  if(typeof getPreview!=='function')throw new TypeError('A weapon preview provider is required');
  let stopped=false,watched=[],wasVisible=false;const cache=new Map(),observedCards=new Map();
  // A visible panel can contain several screens of catalog cards. Do not
  // prepare a weapon's 3D preview until its actual card enters the viewport.
  // The equipped summary stays immediate; both surfaces share the same cache.
  const cardObserver=typeof IntersectionObserverClass==='function'?new IntersectionObserverClass(entries=>{
   if(stopped||disposed)return;
   for(const entry of entries){const record=observedCards.get(entry.target);if(!record)continue;record.inViewport=entry.isIntersecting===true;if(record.inViewport)update(record,record.entry);}
  },{threshold:0}):null;
  const ancestors=()=>{const nodes=[];for(let node=panel;node&&node.nodeType!==9;node=node.parentElement??node.parentNode??node.parent)nodes.push(node);return nodes;};
  const visible=()=>panel.isConnected!==false&&ancestors().every(node=>{const style=doc.defaultView?.getComputedStyle?.(node)??node.style;return !node.hidden&&!node.inert&&node.getAttribute?.('inert')==null&&style?.display!=='none'&&style?.visibility!=='hidden'&&style?.visibility!=='collapse';});
  const eligible=weapon=>{const entry=IMPORTED_WEAPONS.find(item=>(item.loadoutId||item.id)===weapon);return !!entry&&!select.disabled&&inventoryEntryState(entry,select,{busy:false}).available;};
  function requestImage(weapon){if(!cache.has(weapon)){let result;try{result=getPreview(weapon);}catch{result=null;}cache.set(weapon,Promise.resolve(result).catch(()=>null));}return cache.get(weapon);}
  function clearImage(record){if(!record.image)return;const {node,load,error}=record.image;node.removeEventListener('load',load);node.removeEventListener('error',error);node.remove();record.image=null;}
  function setState(record,state){record.state=state;record.frame.dataset.status=state;record.card.dataset.previewStatus=state;record.marker.hidden=state==='ready';record.marker.setAttribute('aria-hidden',String(state==='ready'));record.marker.textContent=state==='loading'?'Loading preview…':state==='unavailable'?'Preview unavailable':'Preview not loaded';}
  function reset(record){record.token++;clearImage(record);setState(record,'waiting');}
  const current=(record,token,weapon)=>!stopped&&!disposed&&record.token===token&&record.weapon===weapon&&(!record.entry||(record.generation===cardGeneration&&cards.includes(record)));
  function update(record,entry){
   const weapon=entry?(entry.loadoutId||entry.id):null;
   if(record.weapon!==weapon){reset(record);record.weapon=weapon;record.eligible=null;}
   if(!eligible(weapon)){if(record.eligible!==false||record.state!=='unavailable'){record.token++;clearImage(record);setState(record,'unavailable');}record.eligible=false;return;}
   if(record.eligible===false)reset(record);record.eligible=true;
   if(!visible()){if(record.state==='loading')reset(record);else if(!record.state)setState(record,'waiting');return;}
   if(record.entry&&cardObserver&&record.inViewport!==true){if(!record.state)setState(record,'waiting');return;}
   if(['loading','ready','unavailable'].includes(record.state))return;
   setState(record,'loading');const token=++record.token;
   requestImage(weapon).then(url=>{
    if(!current(record,token,weapon))return;
    if(!visible()){reset(record);return;}
    if(!eligible(weapon)){record.eligible=false;reset(record);setState(record,'unavailable');return;}
    if(typeof url!=='string'||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(url)){setState(record,'unavailable');return;}
    previewUrls.set(weapon,url);loadoutView?.sync();
    const image=doc.createElement('img');image.className='s5-inventory-weapon-preview-image';image.alt=entry.name+' · weapon preview';image.width=256;image.height=160;image.decoding='async';image.hidden=true;
    const load=()=>{if(!current(record,token,weapon))return;if(!visible()||!eligible(weapon)){reset(record);return;}image.hidden=false;setState(record,'ready');};
    const error=()=>{if(!current(record,token,weapon))return;clearImage(record);setState(record,'unavailable');};
    record.image={node:image,load,error};image.addEventListener('load',load);image.addEventListener('error',error);record.frame.append(image);image.src=url;
   });
  }
  const visibilityObserver=new Observer(()=>port.sync());
  const port={getPreview,prepareEquipment(weapons){
   if(stopped||disposed||!visible())return;
   // A modal can cover offscreen catalog cards. Its actual equipped slots
   // still need their confirmed appearance images, using the shared cache.
   for(const weapon of new Set(weapons)){if(!eligible(weapon))continue;const request=requestImage(weapon);request.then(url=>{if(stopped||disposed||cache.get(weapon)!==request||!visible()||!eligible(weapon)||typeof url!=='string'||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(url))return;previewUrls.set(weapon,url);loadoutView?.sync();if(equipRequest)sync();});}
  },sync(){
   if(stopped||disposed)return;const nodes=ancestors();if(nodes.length!==watched.length||nodes.some((node,index)=>node!==watched[index])){visibilityObserver.disconnect();watched=nodes;for(const node of nodes)visibilityObserver.observe(node,{attributes:true,attributeFilter:['hidden','inert','style','class'],childList:true});}
   const shown=visible();if(wasVisible&&!shown){for(const record of [...cards,activePreview])if(record.state==='loading')reset(record);}wasVisible=shown;
   if(cardObserver){
    const retained=new Set(cards);
    for(const [node,record]of observedCards)if(!retained.has(record)){cardObserver.unobserve(node);observedCards.delete(node);}
    for(const record of cards)if(!observedCards.has(record.card)){record.inViewport=false;observedCards.set(record.card,record);cardObserver.observe(record.card);}
   }
   for(const record of cards)update(record,record.entry);
   const loadout=loadoutView?.snapshot(),weapon=inspectedWeapon||(loadout?loadout.slots[loadout.activeSlot]:confirmedWeapon);update(activePreview,IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===weapon));
  },invalidate(weapon){cache.delete(weapon);previewUrls.delete(weapon);for(const record of [...cards,activePreview])if(record.weapon===weapon)reset(record);loadoutView?.sync();port.sync();},invalidateCards(){for(const record of cards){record.token++;clearImage(record);}for(const node of observedCards.keys())cardObserver?.unobserve(node);observedCards.clear();},dispose(){
   if(stopped)return;stopped=true;visibilityObserver.disconnect();cardObserver?.disconnect();observedCards.clear();cache.clear();previewUrls.clear();for(const record of [...cards,activePreview]){record.token++;clearImage(record);delete record.frame.dataset.status;delete record.card.dataset.previewStatus;record.marker.hidden=false;record.marker.setAttribute('aria-hidden','true');record.marker.textContent=record===activePreview?'3D':'WEAPON';record.state=null;record.weapon=null;record.eligible=null;}
   delete panel.dataset.weaponPreviews;if(previewPort===port)previewPort=null;
  }};
  return port;
 }
 const observer=new Observer(sync);
 for(const node of [select,play,status,outfitSource,characterSource,bodySource])if(node)observer.observe(node,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true,characterData:true});
 const appearanceSources=[outfitSource,characterSource,bodySource].filter(Boolean);
 select.addEventListener('change',sync);doc.addEventListener('s5:equipment-changed',onEquipment);for(const source of appearanceSources)source.addEventListener('change',sync);
 let disposed=false;
 const inventory={sync,removeSlot:slot=>loadoutView?.remove(slot)??false,editSlot(slot){
  if(disposed||!loadoutView||!loadoutView.setTarget(slot))return false;
  section='weapons';category='all';page=0;query='';search.value='';cancelEquip(false);
  const weapon=loadoutView.snapshot().slots[slot];inspectedWeapon=weapon||null;appearance.open=!!weapon;render();
  // An occupied slot displays its confirmed weapon; an empty slot stays empty.
  if(weapon)loadoutView.display(slot);
  const target=loadoutHost.querySelectorAll('.s5-weapon-loadout-target')[slot];(weapon?target:search)?.focus?.({preventScroll:true});return true;
 },showSection(value){if(!['weapons','outfits','skills'].includes(value))throw new RangeError('Unknown inventory section');section=value;category=value==='skills'?'skill':'all';cancelEquip(false);render();},installSkills(options){
  skillView=installInventorySkillView(skillHost,{document:doc,summaryHost:equipped,busy:()=>!!play?.disabled,...options});render();return skillView;
 },installWeaponEffects(settings){effectView?.dispose();effectView=installInventoryWeaponEffects(equipped,{document:doc,settings,busy:()=>!!play?.disabled||loadoutView?.snapshot().pending===true});
  // The entry shell reparents the menu after its original observer is set up.
  // Sync only after its hidden ancestors reveal the inventory, including a
  // normal header click after reload (no equipment event need occur then).
  for(let node=panel;node;node=node.parentElement??node.parentNode??node.parent)observer.observe(node,{attributes:true,attributeFilter:['hidden']});
  sync();return effectView;
 },installWeaponPreviews(options){
  if(disposed)return null;if(previewPort?.getPreview===options.getPreview)return previewPort;
  previewPort?.dispose();previewPort=createWeaponPreviews(options);panel.dataset.weaponPreviews='true';previewPort.sync();return previewPort;
 },installWeaponLoadout(options){
  if(loadoutView)return loadoutView;
  loadoutView=installS5WeaponLoadoutView(loadoutHost,{...options,document:doc,
   renderedIcons:true,weaponIcon:(weapon,slot,snapshot)=>previewUrls.get(weapon)??s4EquipmentIcon(weapon,snapshot.skins?.[slot]??'classic'),
   weaponLabel:weapon=>IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===weapon)?.name||weapon,
   busy:()=>!!play?.disabled||options.busy?.()===true,
   canAssign:(weapon,slot,snapshot)=>{const entry=IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===weapon);return !!entry&&!inventoryEntryState(entry,select,{busy:!!play?.disabled}).disabled&&options.canAssign?.(weapon,slot,snapshot)!==false;},
   onInspect:weapon=>{inspect(IMPORTED_WEAPONS.find(entry=>(entry.loadoutId||entry.id)===weapon));options.onInspect?.(weapon);},onTargetChange:slot=>{options.onTargetChange?.(slot);sync();},onSettled:(result,error)=>{options.onSettled?.(result,error);sync();}});
  loadoutHost.hidden=false;limits.textContent='Equipment marked Experimental is still being verified. Equip, then choose a slot. Each weapon can occupy one slot.';sync();return loadoutView;
 },dispose(){if(disposed)return;disposed=true;cancelEquip(false);pickerWeaponIcon.dispose();for(const row of pickerRows)row.icon.dispose();slotPicker.removeEventListener('click',onBackdrop);skinSelect.removeEventListener('change',onSkinChange);panel.removeEventListener('keydown',onPickerKey);compactAppearance?.removeEventListener?.('change',syncAppearanceViewport);search.removeEventListener('input',onSearchInput);effectView?.dispose();previewPort?.dispose();loadoutView?.dispose();skillView?.dispose();observer.disconnect();preview.dispose();select.removeEventListener('change',sync);doc.removeEventListener('s5:equipment-changed',onEquipment);for(const source of appearanceSources)source.removeEventListener('change',sync);tab.remove();panel.remove();}};
 panel.inventory=inventory;shell.querySelector('.menu-panels').append(panel);render();return inventory;
}
