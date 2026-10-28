import {waitingRoomMapPreview} from './waiting-room-map-previews.js';
import {s5LobbyIcon} from './s5-lobby-icons.js';
import {s5MapLabel} from './s5-lobby-labels.js';
/** Presentation only. Runtime ports own equipment, readiness and session transitions. */
export const S5_LOBBY_SECTIONS=Object.freeze(['lobby','inventory','loadout','room','settings','motion']);
export const S5_LOBBY_GEOMETRY=Object.freeze({width:1672,height:941,avatar:[304,78,690,676],rooms:[1024,86,624,658]});
export function mountS5Lobby({host,onNavigate=()=>{},onPlay=()=>{},onRemoveWeapon=()=>{},onSound=()=>{},document:doc=globalThis.document}={}){
 if(!host||!doc)throw new TypeError('mountS5Lobby requires a host and document');
 const make=(tag,cls='',text)=>{const n=doc.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const bindings=[],bind=(n,type,fn)=>{n.addEventListener(type,fn);bindings.push([n,type,fn]);};
 const icon=name=>{const n=make('span','s5-lobby-icon');n.setAttribute('aria-hidden','true');n.innerHTML=s5LobbyIcon(name);return n;};
 const button=(label,route,cls='s5-lobby-nav-button')=>{const n=make('button',cls,label);n.type='button';if(route){n.dataset.route=route;bind(n,'click',()=>{if(!n.disabled){if(!n.dataset.interfaceLobbyButton)onSound('click');onNavigate(route,n.dataset.slot!==undefined?{slot:Number(n.dataset.slot)}:undefined);}});}bind(n,'pointerenter',()=>{if(!n.disabled&&!n.dataset.interfaceLobbyButton)onSound('hover');});return n;};
 const locked=(label,cls='s5-lobby-locked',symbol)=>{const n=button('',null,cls);n.disabled=true;n.dataset.locked='true';n.title=(label||'Account service')+' · Not available in this build';n.setAttribute('aria-label',(label||'Account service')+' · Unavailable in this build');if(symbol)n.append(icon(symbol));if(label)n.append(make('span','s5-lobby-lock-label',label));n.append(icon('lock'));return n;};
 const element=make('section','s5-lobby');element.dataset.section='lobby';element.dataset.textSize='standard';element.setAttribute('aria-label','S5 League lobby');
 const stage=make('div','s5-lobby-stage');element.append(stage);
 const nav=make('nav','s5-lobby-navigation');nav.setAttribute('aria-label','Main navigation');stage.append(nav);
 const logo=button('','lobby','s5-lobby-logo');logo.setAttribute('aria-label','S5 League · Home');logo.append(make('span','s5-lobby-wordmark','S5'),make('span','s5-lobby-wordmark-sub','LEAGUE'));nav.append(logo);
 const tabs=make('div','s5-lobby-tabs');nav.append(tabs);
 const tabButtons=[['Play','lobby'],['Inventory','inventory']].map(([label,route])=>{const n=button(label,route);tabs.append(n);return n;});
 tabs.append(locked('Shop','s5-lobby-nav-button'),locked('Clan','s5-lobby-nav-button'),locked('Social','s5-lobby-nav-button'));
 const tools=make('div','s5-lobby-tools');nav.append(tools);tools.append(locked('Mail','s5-lobby-tool','mail'),locked('Friends','s5-lobby-tool','group'));
 const textSize=button('Aa',null,'s5-lobby-text-size');textSize.title='Interface text size';textSize.setAttribute('aria-label','Interface text size: standard');
 const sizes=['standard','large','extra-large'];let sizeIndex=0;
 try{const stored=doc.defaultView?.localStorage?.getItem('s5-lobby-text-size');if(sizes.includes(stored))sizeIndex=sizes.indexOf(stored);}catch{}
 function applySize(){element.dataset.textSize=sizes[sizeIndex];textSize.setAttribute('aria-label','Interface text size: '+sizes[sizeIndex].replace('-',' '));textSize.title='Interface text size: '+sizes[sizeIndex].replace('-',' ')+' · Click to change';}
 applySize();bind(textSize,'click',()=>{sizeIndex=(sizeIndex+1)%sizes.length;applySize();try{doc.defaultView?.localStorage?.setItem('s5-lobby-text-size',sizes[sizeIndex]);}catch{}});tools.append(textSize);
 const settings=button('','settings','s5-lobby-settings');settings.append(icon('settings'));settings.dataset.interfaceLobbyButton='settings';settings.title='Settings';settings.setAttribute('aria-label','Settings');tools.append(settings);
 const back=button('','lobby','s5-lobby-back');back.append(icon('back'));back.dataset.interfaceLobbyButton='back';back.setAttribute('aria-label','Back to lobby');back.hidden=true;tools.append(back);
 const home=make('div','s5-lobby-home');stage.append(home);
 const avatar=make('section','s5-lobby-avatar');avatar.setAttribute('aria-label','Equipped character');home.append(avatar);
 const shadow=make('div','s5-lobby-contact-shadow');shadow.setAttribute('aria-hidden','true');avatar.append(shadow);
 const avatarSlot=make('div','s5-lobby-avatar-slot');avatar.append(avatarSlot);
 const sceneLabel=make('div','s5-lobby-scene-label');sceneLabel.append(make('span','s5-lobby-eyebrow','YOUR CHARACTER'),make('span','','Equipped for the next match'));home.append(sceneLabel);
 const squad=make('aside','s5-lobby-squad');squad.setAttribute('aria-label','Local squad');home.append(squad);
 const squadHeading=make('div','s5-lobby-squad-heading');squadHeading.append(icon('group'),make('span','','Squad'),make('span','s5-lobby-squad-count','1 / 4'));squad.append(squadHeading);
 const me=make('div','s5-lobby-squad-self'),smallPortrait=make('div','s5-lobby-small-portrait');smallPortrait.append(icon('person'));
 const identity=make('div','s5-lobby-squad-identity');identity.append(make('b','','Local player'),make('span','s5-lobby-muted','Solo session'));me.append(smallPortrait,identity);squad.append(me);
 const invite=locked('Invite players','s5-lobby-invite','plus');squad.append(invite,make('p','s5-lobby-unavailable-note','Squads unlock with online services.'));
 const rooms=make('section','s5-lobby-rooms');rooms.setAttribute('aria-label','Local match preparation');home.append(rooms);
 const roomHeader=make('div','s5-lobby-room-header');roomHeader.append(make('span','s5-lobby-eyebrow','PLAY / LOCAL SESSION'),make('span','s5-lobby-session-badge','LOCAL'));rooms.append(roomHeader);
 const activityBody=make('div','s5-lobby-activity-body');rooms.append(activityBody);
 const mapCard=make('div','s5-lobby-map-card'),mapImage=make('img','s5-lobby-map-image');mapImage.alt='Selected map preview';mapImage.hidden=true;
 const mapFallback=make('span','s5-lobby-map-fallback','Map preview unavailable'),modeChip=make('span','s5-lobby-mode-chip','Local');mapCard.append(mapImage,make('div','s5-lobby-map-shade'),mapFallback,modeChip);activityBody.append(mapCard);
 const mapTitle=make('h2','s5-lobby-map-title','Prepare a match');mapTitle.tabIndex=-1;activityBody.append(mapTitle);
 const description=make('p','s5-lobby-mode-description','Choose a mode and prepare your equipment.');activityBody.append(description);
 const details=make('dl','s5-lobby-match-details');
 const detail=(label,initial,term=make('dt','',label))=>{const row=make('div');const value=make('dd','',initial);row.append(term,value);details.append(row);return value;};
 const teamTerm=make('dt','','Team');const localMap=detail('Map','—'),rules=detail('Rules','Default rules'),team=detail('Team','—',teamTerm);activityBody.append(details);
 const create=button('Match settings','room','s5-lobby-create');create.append(icon('settings'),icon('next'));create.dataset.interfaceLobbyButton='create-room';activityBody.append(create);
 const status=make('p','s5-lobby-status','Preparing…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');rooms.append(status);
 const actions=make('div','s5-lobby-room-actions');rooms.append(actions);const plays=[];
 const playButton=()=>{const n=button('Play',null,'s5-lobby-play');n.disabled=true;bind(n,'click',()=>{if(!n.disabled){onSound('click');onPlay();}});plays.push(n);return n;};actions.append(playButton());
 const entryHint=make('p','s5-lobby-entry-hint','Review teams and equipment in the waiting room.');rooms.append(entryHint);
 const network=make('div','s5-lobby-network-locked');network.append(icon('lock'),make('b','','Online rooms'),make('span','','Unavailable in this build'));activityBody.append(network);
 const content=make('div','s5-lobby-content');content.hidden=true;stage.append(content);
 const dock=make('footer','s5-lobby-dock');stage.append(dock);
 const balance=kind=>{const n=locked('','s5-lobby-balance');n.setAttribute('aria-label',(kind==='P'?'PEN':'Premium currency')+' · Unavailable');n.append(make('span','s5-lobby-coin s5-lobby-coin-'+kind,kind),make('span','s5-lobby-balance-value','—'));return n;};
 const profile=make('div','s5-lobby-profile'),portraitSlot=make('div','s5-lobby-profile-portrait');portraitSlot.append(icon('person'));profile.append(portraitSlot);
 const profileInfo=make('div','s5-lobby-profile-info');profileInfo.append(make('b','s5-lobby-profile-name','Local player'),make('span','s5-lobby-profile-meta','Local profile'));
 const exp=make('div','s5-lobby-exp');exp.title='Account progression is unavailable in this build';exp.append(make('span','s5-lobby-exp-track'),make('span','s5-lobby-exp-label','PROGRESSION'),icon('lock'));profileInfo.append(exp);profile.append(profileInfo);
 const profileMoney=make('div','s5-lobby-profile-money');profileMoney.append(balance('P'),balance('S'));profile.append(profileMoney);dock.append(profile);
 const equipment=make('section','s5-lobby-equipment');equipment.setAttribute('aria-label','Active equipment');dock.append(equipment);
 const config=make('div','s5-lobby-config');config.append(make('span','s5-lobby-config-title','Your loadout'),locked('Presets','s5-lobby-presets'));equipment.append(config);
 const weapons=make('div','s5-lobby-weapons');equipment.append(weapons);const weaponSlots=[];
 for(let i=0;i<3;i++){const n=button('','inventory','s5-lobby-weapon');n.dataset.slot=String(i);n.setAttribute('aria-label','Edit weapon '+(i+1));const image=make('img','s5-lobby-weapon-image');image.alt='';image.hidden=true;
 const empty=make('span','s5-lobby-empty-weapon');empty.append(icon('plus'));const name=make('span','s5-lobby-weapon-name','Empty slot'),key=make('span','s5-lobby-weapon-key',String(i+1)),state=make('span','s5-lobby-weapon-state');n.append(image,empty,key,name,state);
 const wrap=make('div','s5-lobby-weapon-wrap'),remove=button('×',null,'s5-lobby-weapon-remove');remove.hidden=true;remove.disabled=true;remove.setAttribute('aria-label','Remove weapon from lobby slot '+(i+1));bind(remove,'click',()=>{if(!remove.disabled)onRemoveWeapon(i);});wrap.append(n,remove);weapons.append(wrap);weaponSlots.push({node:n,image,name,empty,key,state,remove});}
 const customize=button('','inventory','s5-lobby-customize');customize.append(icon('shirt'),make('span','','Customize'),make('span','s5-lobby-muted','Weapons & outfits'),icon('next'));dock.append(customize);
 const social=make('section','s5-lobby-social');social.setAttribute('aria-label','Social services unavailable');dock.append(social);
 const socialHead=make('div','s5-lobby-social-heading');socialHead.append(icon('chat'),make('span','','Clan & chat'),icon('lock'));social.append(socialHead,make('p','s5-lobby-unavailable-note','Online services are not available in this build.'));
 const footer=make('div','s5-lobby-footer');footer.hidden=true;footer.append(button('Back to lobby','lobby','s5-lobby-return'),button('Animations','motion','s5-lobby-motion'),playButton());stage.append(footer);host.append(element);
 function show(section='lobby'){if(!S5_LOBBY_SECTIONS.includes(section))throw new RangeError('Unknown lobby section: '+section);element.dataset.section=section;home.hidden=section!=='lobby';content.hidden=section==='lobby';dock.hidden=section!=='lobby';footer.hidden=section==='lobby';back.hidden=section==='lobby';
 for(const tab of tabButtons){const active=tab.dataset.route===section;tab.classList.toggle('is-active',active);if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}return content;}
 show();
 const descriptions={Touchdown:'Carry the ball into the opposing goal. Movement and teamwork make the difference.',Deathmatch:'Take down opponents and reach the score limit.',Chaser:'Outlast the Chaser, or hunt down the remaining players.',Captain:'Protect your captain and take down the opposing team.',Siege:'Capture and hold objectives to control the arena.','Battle Royal':'Every player for themselves. Fight for the highest score.','Free training':'Explore the map and practise with your current equipment.',Practice:'Practise your aim with the selected targets and duration.'};
 descriptions['Conquest · 8 waves']='Defend the base through eight enemy waves and defeat the final boss.';
 return {element,content,avatarSlot,portraitSlot,show,
 focusWeaponSlot(slot){weaponSlots[slot]?.node.focus?.({preventScroll:true});},
 setStatus(text){const next=String(text??'');if(status.textContent!==next)status.textContent=next;},
 setPlayLabel(label){const value=String(label??'').trim()||'Play';for(const play of plays)if(play.textContent!==value)play.textContent=value;},
 setReady(ready){for(const play of plays)play.disabled=!ready;element.dataset.ready=String(!!ready);element.setAttribute('aria-busy',String(!ready));},
 setSession({mode='Local',map='Map',rules:ruleLabel='Default rules',team:teamLabel='—',rosterKind='teams',nativeMapId=null,sceneKey=null}={}){const displayMap=s5MapLabel(map),shortMap=displayMap.split(' · ')[0];if(mapTitle.textContent!==shortMap)mapTitle.textContent=shortMap;modeChip.textContent=mode;description.textContent=descriptions[mode]??'Prepare your local match and current equipment.';localMap.textContent=displayMap;rules.textContent=ruleLabel;const individual=rosterKind==='individual';teamTerm.textContent=individual?'Players':'Team';team.textContent=individual?'Free for all':teamLabel;entryHint.textContent=individual?'Review participants and equipment in the waiting room.':'Review teams and equipment in the waiting room.';const art=waitingRoomMapPreview(nativeMapId,sceneKey);mapImage.hidden=!art;mapFallback.hidden=!!art;if(art&&mapImage.getAttribute?.('src')!==art.image)mapImage.src=art.image;},
 setControlLabels(labels=[]){for(let i=0;i<3;i++){weaponSlots[i].key.textContent=labels[i]||String(i+1);weaponSlots[i].key.title=labels[i]?'In-match weapon binding':'Weapon slot '+(i+1);}},
 setLoadout({slots=[],activeSlot=0,pending=false}={},describe=weapon=>({name:weapon})){for(let i=0;i<3;i++){const view=weaponSlots[i],weapon=slots[i],data=weapon?describe(weapon):null;view.name.textContent=data?.name??'Empty slot';view.image.hidden=!data?.image;view.empty.hidden=!!data?.image;if(data?.image&&view.image.getAttribute?.('src')!==data.image)view.image.src=data.image;view.node.dataset.active=String(!!weapon&&activeSlot===i);view.state.textContent=pending?'Updating…':!!weapon&&activeSlot===i?'ACTIVE':weapon?'EQUIPPED':'ADD WEAPON';view.node.disabled=!!pending;view.node.title=weapon?(data?.name??weapon)+' · Edit slot '+(i+1):'Equip weapon in slot '+(i+1);view.remove.hidden=!weapon;view.remove.disabled=!!pending||slots.filter(Boolean).length<2;view.remove.title=slots.filter(Boolean).length<2?'Keep at least one weapon to enter a match':'Remove '+(data?.name??weapon);}},
 destroy(){for(const [n,type,fn] of bindings)n.removeEventListener(type,fn);element.remove();}
 };
}

