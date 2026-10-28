import {OPTIONS_NATIVE_DATA as data} from './options-native-data.js';
import {advanceButtonInteraction,selectWidgetSkin} from './options-widget-state.js';
import {installAudioHScroll} from './options-hscroll-view.js';
import {installMouseOptionsView} from './mouse-options-view.js';
import {JUKEBOX_DATA} from './options-jukebox-data.js';
import {installOptionsJukeboxView} from './options-jukebox-view.js';
import {s5LobbyIcon} from './s5-lobby-icons.js';
const ROOT='Option_Window/Option_GroupBox';
const node=path=>data.nodes[path]??data.nodes[ROOT+'/'+path]??JUKEBOX_DATA.nodes[path];
const mountedControls=new WeakSet();
const mountedGraphics=new WeakSet();
let optionsViewId=0;
// Native Button/Tab/Check draw indices are pinned; DOM events and asset readiness are S5 projections.
export function installNativeOptionsView(host,{transaction,audioSettings,bindings,activeIds=[],onCaptureChange=()=>{},canAct=()=>true,
 volumeControl=null,mouseOptions=null,jukeboxOptions=null,graphicsContent=null,initialSection=graphicsContent?'graphic':'audio',visualTheme='s5',document:doc=host.ownerDocument,labels={}}={}){
 if(visualTheme!=='s5')throw TypeError('Only the S5 visual theme is supported');
 if(!transaction||!audioSettings?.get||!bindings?.set)throw TypeError('Real transaction audio and draft binding ports required');
 if(volumeControl&&mountedControls.has(volumeControl))throw Error('Authoritative audio volume control already mounted');
 if(graphicsContent&&(mountedGraphics.has(graphicsContent)||graphicsContent===host||graphicsContent.contains?.(host)))throw Error('Visual controls already mounted or invalid host');
 if(volumeControl)mountedControls.add(volumeControl);
 const root=doc.createElement('section'),plane=doc.createElement('div'),status=doc.createElement('p'),scope=doc.createElement('p'),retry=doc.createElement('button');
 root.className='s5runtime-options-view';root.dataset.visualTheme=visualTheme;plane.className='s5runtime-options-plane';plane.style.width='512px';plane.style.height='450px';
 root.dataset.menuLayout='lobby';const viewId='s5-options-'+(++optionsViewId);
 const heading=doc.createElement('h2'),description=doc.createElement('p'),badge=doc.createElement('span');
 heading.className='s5-settings-heading';description.className='s5-settings-description';badge.className='s5-settings-badge';
 const sectionCopy={graphic:['Graphics','Adjust visual quality, character appearance and camera behaviour.','Applied immediately'],audio:['Audio','Balance game audio and organise your Station2 playlist.','Live audio preview'],input:['Controls','Set your keyboard bindings and mouse preferences.','Apply to save']};
 status.className='s5runtime-options-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 scope.textContent='Audio and controls: audio changes are previewed immediately. Cancel discards new bindings. S5 visual settings apply separately and immediately.';
 retry.type='button';retry.textContent='Retry audio';retry.className='s5runtime-options-retry';retry.hidden=true;
 retry.addEventListener('click',()=>{for(const id of ['sfx','bgm'])if(audioSettings.get(id).delivery==='error')audioSettings.apply(id);sync();});
 if(mouseOptions)scope.textContent='Audio, controls and mouse: audio changes are previewed immediately. Apply saves bindings and mouse settings. Mouse settings affect local gameplay. S5 visual settings apply separately and immediately.';
 if(jukeboxOptions)scope.textContent+=' Station2 Jukebox: preview is immediate; Apply saves the playlist for gameplay. Other maps, personal files and shuffle are unavailable.';
 root.append(plane,scope,status,retry);host.append(root);
 const active=new Set(activeIds),rows=[],audioRows=[],actionRows=[],tabs=[],sections=new Map(),cleanups=[];
 let capturing=null,section=initialSection,disposed=false,mouseView=null,mouseSelected=false,jukeboxView=null,jukeboxSelected=false;const inputTabs=[],audioTabs=[];
 function paint(element,source,index){
  element.dataset.skinIndex=String(index);element.dataset.skinProjection='s5-css-source-state';element.style.backgroundImage='none';
 }
 function place(element,source,origin=[0,0]){
  const p=source.properties,r=p.global;element.className+=' s5runtime-options-node';element.dataset.xuiPath=source.path;element.dataset.widgetType=source.type;
  element.style.left=Number(r.left)-origin[0]+'px';element.style.top=Number(r.top)-origin[1]+'px';element.style.width=Number(r.right)-Number(r.left)+'px';element.style.height=Number(r.bottom)-Number(r.top)+'px';
  element.style.textAlign=({'1':'left','2':'right',CENTER:'center'})[p.text_align?.value]??'center';
  paint(element,source,0);
 }
 function make(path,tag='div',parent=plane,origin){const source=node(path);if(!source)throw Error('Missing authenticated XUI node '+path);const element=doc.createElement(tag);place(element,source,origin);parent.append(element);return element;}
 function decorate(button,path,selected=()=>false){const source=node(path);let interaction=0;
  const disabledIndex=source.type==='CGUI_Button'?3:6;
  const refresh=()=>{const skin=source.properties['gui_skin_'+disabledIndex],available=Boolean(skin?.texture&&data.atlases[skin.texture]);
   const index=selectWidgetSkin({type:source.type,interaction,selected:selected(),disabled:button.disabled,disabledSkinAvailable:available});
   paint(button,source,index);button.dataset.nativeInteraction=String(interaction);button.dataset.selected=String(selected());
  };
  for(const [event,phase]of [['pointerenter','enter'],['pointerleave','leave'],['pointerdown','down'],['pointerup','up'],['pointercancel','reset']])button.addEventListener(event,event=>{interaction=advanceButtonInteraction(interaction,phase,{enabled:!button.disabled,button:event.button??0});refresh();});
  return refresh;
 }
 function image(path,parent){const source=node(path);if(!source.properties.gui_skin_0?.texture)return;const image=make(path,'span',parent);image.setAttribute('aria-hidden','true');image.className+=' s5runtime-options-image';}
 image('bg_Image',plane);
 const title=make('title_Label','h3');title.textContent=labels.title??'S5 · Settings';
 function endCapture({keepStatus=false}={}){if(capturing===null)return;capturing=null;if(!keepStatus)status.textContent='Key capture cancelled.';onCaptureChange(false);sync();}
 function message(result){status.textContent=result.accepted?'Binding prepared. Apply to save it.':result.reason==='collision'?'This key is already reserved.':result.reason==='hold-requires-key-or-button'?'This command requires a key or button that can be held.':'This key cannot be used.';}
 function assign(code){if(capturing===null)return;const result=bindings.set(capturing,code);message(result);if(result.accepted)endCapture({keepStatus:true});else sync();}
 function makeAction(path,action,text){const button=make(path,'button');button.type='button';button.textContent=text;const skin=decorate(button,path);
  const actionScope=jukeboxOptions?(mouseOptions?'audio, controls, mouse settings and playlist':'audio, controls and playlist'):mouseOptions?'audio, controls and mouse settings':'audio and controls';button.setAttribute('aria-label',action==='cancel'?`Close settings for ${actionScope}`:`${text} ${actionScope}`);
  button.addEventListener('pointerdown',endCapture);button.addEventListener('click',()=>{if(button.disabled||!canAct())return;endCapture();mouseView?.cancel();if(action==='confirm'||action==='cancel')jukeboxView?.cancel();const result=transaction[action]();status.textContent=result.accepted?(action==='cancel'?(jukeboxOptions?(mouseOptions?'New bindings, mouse settings and playlist discarded; volumes remain applied.':'New bindings and playlist discarded; volumes remain applied.'):mouseOptions?'New bindings and mouse settings discarded; audio keeps its preview.':'New bindings discarded; audio keeps its preview.'):action==='reset'?'Default values restored for each setting.':jukeboxOptions?(mouseOptions?'Audio, controls, mouse settings and playlist saved.':'Audio, controls and playlist saved.'):mouseOptions?'Audio, controls and mouse settings saved.':'Audio and controls saved.'):'Settings could not be saved.';sync();});
  actionRows.push({button,skin});return button;
 }
 const reset=makeAction('Re_Button','reset',labels.reset??'Reset'),confirm=makeAction('Ok_Button','confirm',labels.confirm??'Confirm'),apply=makeAction('Apply_Button','apply',labels.apply??'Apply');
 // Native Cancel_Button is show=false and overlaps Ok_Button. The source x_Button is the actual cancel/close callback.
 const close=makeAction('x_Button','cancel','×');
 const definitions=[['graphic','Graphic_TabButton',Boolean(graphicsContent)],['audio','Sound_TabButton',true],['input','KeySetting_TabButton',true],['social','Community_TabButton',false]];
 for(const [id,path,available] of definitions){const button=make(path,'button');button.type='button';button.textContent=labels[id]??({graphic:'Graphics',audio:'Audio',input:'Controls',social:'Social'})[id];button.disabled=!available;button.setAttribute('role','tab');
  if(!available)button.title='This panel is unavailable.';button.addEventListener('click',()=>{if(!button.disabled){endCapture();showSection(id);}});const skin=decorate(button,path,()=>section===id);tabs.push({id,path,button,available,skin});
  button.id=viewId+'-tab-'+id;button.setAttribute('aria-controls',viewId+'-panel-'+id);button.dataset.settingsCategory=id;
  if(available){const container=doc.createElement('div');container.className='s5runtime-options-section';container.id=viewId+'-panel-'+id;container.setAttribute('role','tabpanel');container.setAttribute('aria-labelledby',button.id);container.dataset.settingsSection=id;plane.append(container);sections.set(id,container);}
 }
 if(graphicsContent){
  // Borrow the live S5 controls, retaining their handlers, values and owner.
  // This enables the source-positioned tab; it is not a native video-setting port.
  const oldParent=graphicsContent.parentNode,oldNext=graphicsContent.nextSibling;
  const content=make('Graphic_GroupBox','div',sections.get('graphic'));content.className+=' s5-options-graphics-content';
  content.setAttribute('role','region');content.setAttribute('aria-label','Visual and camera settings');content.tabIndex=0;
  content.append(graphicsContent);mountedGraphics.add(graphicsContent);root.dataset.graphicsPanel='true';
  cleanups.push(()=>{if(oldParent)oldParent.insertBefore(graphicsContent,oldNext?.parentNode===oldParent?oldNext:null);else graphicsContent.remove();mountedGraphics.delete(graphicsContent);});
 }
 const sound=sections.get('audio'),input=sections.get('input'),keyboardPane=doc.createElement('div'),mousePane=doc.createElement('div'),settingPane=doc.createElement('div'),jukeboxPane=doc.createElement('div');
 for(const pane of [settingPane,jukeboxPane]){pane.className='s5runtime-options-section';pane.style.zIndex='0';sound.append(pane);}jukeboxPane.hidden=true;
 for(const pane of [keyboardPane,mousePane]){pane.className='s5runtime-options-section';pane.style.zIndex='0';input.append(pane);}mousePane.hidden=true;
 for(const [pane,name]of [[settingPane,'volumes'],[jukeboxPane,'playlist'],[keyboardPane,'keyboard'],[mousePane,'mouse']])pane.dataset.settingsPane=name;
 for(const [path,parent] of [['Sound_GroupBox/Setting_GroupBox',settingPane],['KeySetting_GroupBox/ControlKey_GroupBox',keyboardPane]]){
  for(const source of Object.values(data.nodes))if(source.path.startsWith(ROOT+'/'+path+'/')&&source.type==='CGUI_Image')image(source.path,parent);
 }
 for(const [path,parent,available] of [['Sound_GroupBox/Setting_TabButton',sound,true],['Sound_GroupBox/JukeBox_TabButton',sound,Boolean(jukeboxOptions?.get().available)],['KeySetting_GroupBox/ControlKey_TabButton',input,true],['KeySetting_GroupBox/Mouse_TabButton',input,Boolean(mouseOptions?.get().available)],['KeySetting_GroupBox/Camera_TabButton',input,false]]){
  const button=make(path,'button',parent);button.type='button';button.textContent=({'Setting_TabButton':'Volumes','JukeBox_TabButton':'Playlist','ControlKey_TabButton':'Keyboard','Mouse_TabButton':'Mouse','Camera_TabButton':'Camera'})[path.split('/').at(-1)];button.disabled=!available;button.style.zIndex='1';
  const kind=path.endsWith('/Mouse_TabButton')?'mouse':path.endsWith('/ControlKey_TabButton')?'keyboard':null;
  const audioKind=path.endsWith('/JukeBox_TabButton')?'jukebox':path.endsWith('/Setting_TabButton')?'settings':null;
  const selected=()=>audioKind?audioKind==='jukebox'?jukeboxSelected:!jukeboxSelected:kind==='mouse'?mouseSelected:kind==='keyboard'?!mouseSelected:available;
  const skin=decorate(button,path,selected);button.setAttribute('aria-selected',String(selected()));skin();
  if(kind){inputTabs.push({kind,button,skin});button.addEventListener('click',()=>{if(button.disabled)return;endCapture();mouseView?.cancel();mouseSelected=kind==='mouse';keyboardPane.hidden=mouseSelected;mousePane.hidden=!mouseSelected;sync();});}
  if(audioKind){audioTabs.push({kind:audioKind,button,skin});button.addEventListener('click',()=>{if(button.disabled)return;endCapture();jukeboxView?.cancel();jukeboxSelected=audioKind==='jukebox';settingPane.hidden=jukeboxSelected;jukeboxPane.hidden=!jukeboxSelected;sync();});}
  if(!available)button.title='This control is unavailable.';
 }
 if(mouseOptions){mouseView=installMouseOptionsView(mousePane,{data,make,place,decorate,image,mouseOptions,transaction,canAct,visualTheme,document:doc});cleanups.push(()=>mouseView.dispose());cleanups.push(mouseOptions.subscribe(sync));}
 if(jukeboxOptions){jukeboxView=installOptionsJukeboxView(jukeboxPane,{make,place,decorate,image,jukebox:jukeboxOptions,transaction,canAct,onStatus:text=>{status.textContent=text;},document:doc});cleanups.push(()=>jukeboxView.dispose());cleanups.push(jukeboxOptions.subscribe(sync));}
 for(const [index,id] of [[1,'sfx'],[2,'bgm']]){
  const prefix='Sound_GroupBox/Setting_GroupBox/',label=make(prefix+index+'_Label','label',settingPane);label.textContent=labels[id]??node(prefix+index+'_Label').englishText[0];
  const slider=id==='sfx'&&volumeControl?volumeControl:doc.createElement('input');
  if(slider===volumeControl){const oldParent=slider.parentNode,oldNext=slider.nextSibling,oldInput=slider.oninput,oldClass=slider.className,oldStyle='cssText' in slider.style?slider.style.cssText:{...slider.style};slider.oninput=null;const parentHidden=oldParent?.hidden,parentDisplay=oldParent?.style.display,isLabel=oldParent?.tagName?.toLowerCase()==='label';if(isLabel){oldParent.hidden=true;oldParent.style.display='none';}
   cleanups.push(()=>{if(oldParent)oldParent.insertBefore(slider,oldNext?.parentNode===oldParent?oldNext:null);slider.className=oldClass;if(typeof oldStyle==='string')slider.style.cssText=oldStyle;else{for(const key of Object.keys(slider.style))delete slider.style[key];Object.assign(slider.style,oldStyle);}if(slider.oninput===null)slider.oninput=oldInput;if(isLabel){oldParent.hidden=parentHidden;oldParent.style.display=parentDisplay;}mountedControls.delete(slider);});}
  place(slider,node(prefix+index+'_HScrollBar'));slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.className+=' s5runtime-options-range';slider.setAttribute('aria-label',audioSettings.get(id).label);settingPane.append(slider);
  const mute=make(prefix+index+'_OnOff_CheckButton','input',settingPane);mute.type='checkbox';mute.className+=' s5runtime-options-mute';mute.setAttribute('aria-label','Mute '+audioSettings.get(id).label);
  const bar=installAudioHScroll(settingPane,{control:slider,source:node(prefix+index+'_HScrollBar'),visualTheme,getValue:()=>audioSettings.get(id).percent,setValue:value=>audioSettings.setPercent(id,value),document:doc});place(bar.root,node(prefix+index+'_HScrollBar'));bar.root.style.backgroundImage='none';bar.root.style.position='absolute';
  const onMute=()=>{if(!mute.disabled){audioSettings.setMuted(id,mute.checked);sync();}};
  mute.addEventListener('change',onMute);cleanups.push(()=>{bar.dispose();mute.removeEventListener('change',onMute);});const skin=decorate(mute,prefix+index+'_OnOff_CheckButton',()=>mute.checked);audioRows.push({id,slider,mute,skin,bar,source:prefix+index+'_OnOff_CheckButton'});
  const row=doc.createElement('div'),muteLabel=doc.createElement('label'),muteText=doc.createElement('span'),value=doc.createElement('output');
  row.className='s5-settings-volume-row';muteLabel.className='s5-settings-mute-label';muteText.textContent='Mute';value.className='s5-settings-volume-value';
  muteLabel.append(mute,muteText);row.append(label,bar.root,value,muteLabel);settingPane.append(row);audioRows.at(-1).value=value;
 }
 const listSource=node('KeySetting_GroupBox/ControlKey_GroupBox/Control_KeySetting_ListBox'),list=doc.createElement('div');place(list,listSource);list.className+=' s5runtime-options-bindings';keyboardPane.append(list);
 const templatePath='Item_Window/Game_Key_GroupBox/',firstButton=node(templatePath+'Text'),firstLabel=node(templatePath+'Title_Label'),firstGuide=node(templatePath+'Input_guide');
 // C70720/C70920 clones this exact item template. Local coordinates belong to the cloned row.
 const itemSource=source=>({...source,properties:{...source.properties,global:source.properties.local}});
 for(const [index,entry] of [...bindings.definitions].sort((a,b)=>a.nativeHotkeyId-b.nativeHotkeyId).entries()){
  const row=doc.createElement('div');row.className='s5runtime-options-binding-row';row.style.height=listSource.properties.item_height.value+'px';row.style.position='relative';list.append(row);
  const label=doc.createElement('span'),button=doc.createElement('button'),guide=doc.createElement('span');place(label,itemSource(firstLabel));place(button,itemSource(firstButton));place(guide,itemSource(firstGuide));guide.textContent=firstGuide.englishText[0];guide.hidden=true;guide.style.pointerEvents='none';row.append(label,button,guide);
  label.textContent=entry.label;button.type='button';button.setAttribute('aria-label','Change '+entry.label);const skin=decorate(button,firstButton.path);
  button.addEventListener('click',()=>{if(button.disabled)return;if(capturing===entry.id){endCapture();return;}endCapture();capturing=entry.id;onCaptureChange(true);status.textContent='Choose a key. Escape cancels capture.';sync();});
  rows.push({id:entry.id,button,label,guide,skin});
 }
 function showSection(id){if(!sections.has(id))return false;section=id;if(id!=='input')mouseView?.cancel();if(id!=='audio')jukeboxView?.cancel();for(const [key,element] of sections)element.hidden=key!==id;
  const copy=sectionCopy[id];heading.textContent=copy[0];description.textContent=copy[1];badge.textContent=copy[2];root.dataset.settingsSection=id;
 for(const tab of tabs){tab.button.setAttribute('aria-selected',String(tab.id===id));tab.button.tabIndex=tab.id===id?0:-1;tab.skin();}return true;}
 function sync(){if(disposed)return;const enabled=transaction.snapshot().phase==='open'&&canAct();jukeboxView?.sync();for(const tab of audioTabs){if(tab.kind==='jukebox')tab.button.disabled=!jukeboxOptions?.get().available;tab.button.setAttribute('aria-selected',String(tab.kind==='jukebox'?jukeboxSelected:!jukeboxSelected));tab.skin();}mouseView?.sync();for(const tab of inputTabs){if(tab.kind==='mouse')tab.button.disabled=!mouseOptions?.get().available;tab.button.setAttribute('aria-selected',String(tab.kind==='mouse'?mouseSelected:!mouseSelected));tab.skin();}
  for(const {button,skin} of actionRows){button.disabled=!enabled;skin();}
  for(const row of audioRows){const value=audioSettings.get(row.id);row.slider.value=String(value.percent);row.value.textContent=value.percent+' %';row.slider.disabled=row.mute.disabled=!enabled||!value.available;row.slider.setAttribute('aria-valuetext',value.percent+' %');row.slider.title=value.percent+' %';row.mute.checked=value.muted;row.skin();row.bar.sync();}
  for(const row of rows){const entry=bindings.get(row.id);row.button.disabled=!enabled||!active.has(row.id)||capturing!==null&&capturing!==row.id;row.button.textContent=entry.bindingLabel;row.button.style.visibility=capturing===row.id?'hidden':'visible';row.guide.hidden=capturing!==row.id;row.button.title=active.has(row.id)?entry.label:'Unavailable';row.button.setAttribute('aria-pressed',String(capturing===row.id));row.button.setAttribute('aria-invalid',String(entry.conflicted));row.skin();}
  const audioError=['sfx','bgm'].some(id=>audioSettings.get(id).delivery==='error'),wasError=!retry.hidden;retry.hidden=!audioError;retry.disabled=!enabled;if(audioError)status.textContent='The volume change could not be applied. Try again.';else if(wasError)status.textContent='Volume applied.';
 }
 // Source rectangles remain metadata; the lobby theme lays out live controls in flow.
 for(const id of ['audio','input']){const container=sections.get(id),stage=doc.createElement('div');stage.className='s5-options-responsive-stage';stage.append(...Array.from(container.children));container.append(stage);}
 const sidebar=doc.createElement('aside'),nav=doc.createElement('nav'),intro=doc.createElement('p'),body=doc.createElement('div'),header=doc.createElement('header'),footer=doc.createElement('footer'),actions=doc.createElement('div'),notes=doc.createElement('div');
 sidebar.className='s5-settings-sidebar';nav.className='s5-settings-categories';intro.className='s5-settings-intro';intro.textContent='Adjust your game experience.';
 nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Settings categories');nav.setAttribute('aria-orientation','vertical');
 sidebar.append(title,intro,nav);for(const tab of tabs){
  const icon=doc.createElement('span'),label=doc.createElement('span'),arrow=doc.createElement('span');
  icon.className='s5-settings-category-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=s5LobbyIcon(({graphic:'display',audio:'audio',input:'gamepad',social:'group'})[tab.id]);
  label.textContent=tab.button.textContent;arrow.className='s5-settings-category-arrow';arrow.textContent=tab.available?'›':'—';arrow.setAttribute('aria-hidden','true');
  tab.button.textContent='';tab.button.append(icon,label,arrow);nav.append(tab.button);
 }
 nav.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const available=tabs.filter(tab=>tab.available),current=available.findIndex(tab=>tab.id===section),sign=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
  const next=event.key==='Home'?0:event.key==='End'?available.length-1:(current+sign+available.length)%available.length;
  event.preventDefault();endCapture();showSection(available[next].id);available[next].button.focus?.();
 });
 body.className='s5-settings-body';header.className='s5-settings-header';header.append(heading,description,badge,close);body.append(header,...sections.values());
 footer.className='s5-settings-footer';actions.className='s5-settings-actions';notes.className='s5-settings-notes';actions.append(reset,apply,confirm);
 scope.className='s5-settings-save-note';scope.textContent='Graphics and controller settings save immediately. Audio previews immediately. Apply saves audio and control changes.'+(jukeboxOptions?' Station2 Jukebox: Apply saves the playlist.':'');
 notes.append(scope,status,retry);footer.append(actions,notes);plane.append(sidebar,body,footer);
 function onKey(event){if(capturing===null)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();if(event.repeat)return;if(event.code==='Escape'){endCapture();return;}if(event.metaKey||event.ctrlKey&&!event.code.startsWith('Control')||event.altKey&&!event.code.startsWith('Alt'))return;assign(event.code);}
 function onMouse(event){if(capturing===null||root.contains(event.target))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();assign('MouseButton'+event.button);}
 function onWheel(event){if(capturing===null||!event.deltaY)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();assign(event.deltaY<0?'WheelUp':'WheelDown');}
 doc.addEventListener('keydown',onKey,true);doc.addEventListener('mousedown',onMouse,true);doc.addEventListener('wheel',onWheel,{capture:true,passive:false});
 const offAudio=audioSettings.subscribe(sync),offInput=bindings.subscribe(sync),offTransaction=transaction.subscribe(sync);showSection(section);sync();
 return {root,plane,sync,showSection,setActive(ids){active.clear();for(const id of ids)active.add(id);if(capturing&&!active.has(capturing))endCapture();sync();},cancel(){endCapture();mouseView?.cancel();jukeboxView?.cancel();},
  dispose(){if(disposed)return;endCapture();disposed=true;offAudio();offInput();offTransaction();doc.removeEventListener('keydown',onKey,true);doc.removeEventListener('mousedown',onMouse,true);doc.removeEventListener('wheel',onWheel,true);for(const cleanup of cleanups.reverse())cleanup();root.remove();}};
}
