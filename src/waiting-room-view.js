import * as THREE from 'three';
import {Controller} from './controller.js';
import {loadAvatar} from './avatar.js';
import {setAvatarFacing} from './view-orientation.js';
import {installWaitingRoomInput} from './waiting-room-input.js';
import {projectWaitingRoomMarker} from './waiting-room-placement.js';
import {waitingRoomMapPreview} from './waiting-room-map-previews.js';
import {s5MapLabel} from './s5-lobby-labels.js';
import {renderWaitingRoom} from './waiting-room-render.js';
import {WaitingRoomCamera} from './waiting-room-camera.js';
import {WaitingRoomMotion} from './waiting-room-motion.js';
import {WAITING_ROOM_DESIGNS,waitingRoomDesignKey} from './waiting-room-designs.js';
export {waitingRoomPose} from './waiting-room-motion.js';
export class RoomController extends Controller{
 // Unarmed base movement, separate from every equipped weapon's multiplier.
 // Native room speed/eligibility remains a separate comparison requirement.
 get weaponMoveRate(){return 1;}
}
function disposeAvatar(actor){
 if(!actor)return;actor.mixer.stopAllAction();actor.mixer.uncacheRoot(actor.rig);actor.group.removeFromParent();actor.helper.removeFromParent();
 for(const geometry of new Set(actor.meshes.map(mesh=>mesh.geometry)))geometry.dispose();
 for(const material of new Set(actor.meshes.flatMap(mesh=>[].concat(mesh.material))))material.dispose();
}
export function createWaitingRoomView({renderer,canvas,bindings,mouseLook,gamepad=null,loadWorld,initialDesign='native',onDesignChange=()=>{},onStart,onMenu,onLeave,document:doc=canvas.ownerDocument,loadActor=loadAvatar,createController=(world,options)=>new RoomController(world,options)}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x071422);
 const ambient=new THREE.AmbientLight(0xffffff,2);scene.add(ambient);const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,10,6);scene.add(light);
 const camera=new THREE.PerspectiveCamera(60,1,.01,1000),cameraRig=new WaitingRoomCamera();
 const root=doc.createElement('section');root.id='waiting-room';root.hidden=true;root.setAttribute('aria-label','Waiting room');
 root.innerHTML='<nav class="waiting-room-menu" aria-label="Room menu"><b>S5 LEAGUE</b><button type="button" data-room-menu="inventory">Inventory</button><button type="button" data-room-menu="settings">Settings</button><button type="button" data-room-leave>Leave room</button></nav><section class="waiting-room-info" aria-label="Room details"><img data-room-preview hidden><div class="waiting-room-info-body"><b data-room-map-name>WAITING ROOM</b><span data-room-description></span><small data-room-options></small><small data-room-count></small></div><button type="button" class="waiting-room-map-settings" data-room-menu="room" aria-label="Match settings" title="Match settings"><img src="/assets/ui/waiting-room/room-settings-icon.png" alt=""></button></section><div class="waiting-room-members" aria-label="Room participants"></div><footer><div class="waiting-room-actions"><button type="button" data-room-menu="inventory">Change items</button><button type="button" data-room-start>Start</button></div><p data-room-status role="status">Move with your movement keys · Hold right click to rotate the camera</p></footer>';
 doc.body.append(root);const start=root.querySelector('[data-room-start]'),status=root.querySelector('[data-room-status]');
 const designLabel=doc.createElement('label');designLabel.className='waiting-room-design';designLabel.textContent='Room decor';
 const designSelect=doc.createElement('select');designSelect.setAttribute('data-room-design','');designSelect.setAttribute('aria-label','Room decor');
 for(const d of WAITING_ROOM_DESIGNS){const option=doc.createElement('option');option.value=d.key;option.textContent=d.label;designSelect.append(option);}
 designLabel.append(designSelect);root.querySelector('.waiting-room-menu').append(designLabel);
 // Initial heading is the observed protected native actor+A8. The front-facing
 // room composition is fitted in S5; native camera projection is not certified.
 let visible=false,menuOpen=false,busy=false,disposed=false,world=null,worldRequest=null,controller=null,actor=null,identity='',entryRequest=0,yaw=-1.587898807270484,pitch=.17,accumulator=0,lastInput={};
 const members3d=new Map(),motion=new WaitingRoomMotion();
 let designKey=waitingRoomDesignKey(initialDesign),localTeam='alpha',designRequest=0;
 designSelect.value=designKey;
 let observedAlphaSpawn=null;
 const listeners=[],bind=(node,type,fn)=>{node.addEventListener(type,fn);listeners.push([node,type,fn]);};
 const info=root.querySelector('.waiting-room-info'),mapPreview=root.querySelector('[data-room-preview]');
 bind(mapPreview,'error',()=>{mapPreview.hidden=true;info.classList.remove('has-map-preview');info.dataset.preview='unavailable';});
 bind(mapPreview,'load',()=>{info.dataset.preview='ready';});
 const roomControls=[start,root.querySelector('[data-room-leave]'),...root.querySelectorAll('[data-room-menu]'),designSelect];
 bind(designSelect,'change',()=>{changeDesign(designSelect.value).catch(error=>{status.textContent='Could not load room decor: '+error.message;});});
 for(const node of root.querySelectorAll('[data-room-menu]'))bind(node,'click',()=>{if(busy||disposed||!visible||menuOpen)return;input.clear();onMenu(node.dataset.roomMenu);});
 bind(root.querySelector('[data-room-leave]'),'click',()=>{if(busy||disposed||!visible||menuOpen)return;input.clear();onLeave();});
 bind(start,'click',async()=>{if(busy||!visible||menuOpen)return;setBusy(true);input.clear();try{const result=await onStart();if(result?.accepted===false)status.textContent=result.reason||'Could not start the match.';}catch(error){status.textContent=error.message;}finally{setBusy(false);}});
 const input=installWaitingRoomInput({canvas,document:doc,bindings,isActive:()=>visible&&!busy&&!disposed,isMenuOpen:()=>menuOpen,
  onLook:event=>{const delta=mouseLook.map(event);if(delta.accepted){yaw+=delta.deltaYaw;pitch+=delta.deltaPitch;}},onMenu:()=>onMenu('room')});
 function setBusy(value){busy=value;for(const node of roomControls)node.disabled=value;root.setAttribute('aria-busy',String(value));}
 function show(){if(disposed)return false;visible=true;menuOpen=false;root.hidden=false;doc.body.classList.add('in-waiting-room');input.clear();return true;}
 function hide(){entryRequest++;designRequest++;visible=false;root.hidden=true;doc.body.classList.remove('in-waiting-room');input.clear();}
 function presentWorld(next){
  ambient.intensity=next.authoredLighting?0:2;light.intensity=next.authoredLighting?0:2;
  scene.background=next.background??new THREE.Color(0x071422);scene.environment=next.environment??null;scene.environmentIntensity=.45;
  root.dataset.roomDesign=designKey;designSelect.value=designKey;
 }
 async function changeDesign(value){
  const key=waitingRoomDesignKey(value);if(key!==value||busy||disposed||!visible||menuOpen){designSelect.value=designKey;return false;}
  if(key===designKey)return true;
  const token=++designRequest,entryToken=entryRequest,stage=new THREE.Group();let next=null;
  setBusy(true);input.clear();status.textContent='Loading room decor…';
  try{
   next=await loadWorld(stage,key);
   if(disposed||token!==designRequest||entryToken!==entryRequest||!visible){next?.dispose?.();next=null;return false;}
   if(!next?.spawn||!Object.values(next.spawn).every(Number.isFinite))throw Error('Room decor has no valid spawn');
   const placements=[...members3d].map(([id,m])=>[id,projectWaitingRoomMarker(next,m.placement.marker)]);
   const alpha={...next.spawn},localPlacement=localTeam==='beta'?projectWaitingRoomMarker(next,'beta_standby_pos01'):null;
   if(localPlacement)next.spawn={...localPlacement.position};
   const nextController=createController(next,{weapon:'unarmed',sex:controller.sex});
   nextController.facing=localPlacement?.facing??next.facing??-1.587898807270484;
   const previous=world;world=next;next=null;controller=nextController;observedAlphaSpawn=alpha;designKey=key;
   scene.add(world.root);presentWorld(world);previous.dispose?.();
   for(const [id,placement] of placements){const m=members3d.get(id);m.placement=placement;m.actor.group.position.copy(placement.position);setAvatarFacing(m.actor.group,placement.facing);}
   yaw=controller.facing;pitch=.17;motion.reset();accumulator=0;
   actor.group.position.copy(controller.position);setAvatarFacing(actor.group,controller.facing);
   status.textContent='Move with your movement keys · Hold right click to rotate the camera';
   try{onDesignChange(key);}catch{}return true;
  }catch(error){next?.dispose?.();designSelect.value=designKey;throw error;}
  finally{setBusy(false);if(!disposed)designSelect.value=designKey;}
 }
 async function ensureWorld(){
  if(world)return world;
  // Entries share one room load. A late completion after disposal still owns
  // resources and must release them instead of resurrecting a hidden room.
  if(!worldRequest)worldRequest=(async()=>{
   const next=await loadWorld(scene,designKey);
   if(disposed){next?.dispose?.();return null;}
   if(!next.spawn||!Object.values(next.spawn).every(Number.isFinite)){next?.dispose?.();throw Error('Waiting room requires an observed source-qualified actor placement');}
   world=next;observedAlphaSpawn={...world.spawn};presentWorld(world);return world;
  })();
  const request=worldRequest;
  try{return await request;}finally{if(worldRequest===request)worldRequest=null;}
 }
 async function enter({appearance='s5runtime',sex='male',outfit='01',description='',nativeMapId=null,sceneKey=null,mapLabel='Waiting room',modeLabel='',rosterKind='teams',optionLabel='',participants=[],resetPosition=true}={}){
  if(disposed)throw Error('Waiting room disposed');
  mapLabel=s5MapLabel(mapLabel);
  const token=++entryRequest,pending=new Set(),current=()=>!disposed&&token===entryRequest;
  try{
   if(!await ensureWorld()||!current())return false;
   if(!controller)controller=createController(world,{weapon:'unarmed',sex});
   const key=JSON.stringify({appearance,sex,outfit});let nextActor=actor;
   if(key!==identity){nextActor=await loadActor({appearance,sex,outfit,weapon:'dagger',weaponSkin:'classic',initialClip:'00074'});pending.add(nextActor);if(!current())return false;for(const mesh of nextActor.meshes)if(mesh.userData.weapon)mesh.visible=false;}
   // Stage every participant before changing the displayed roster or avatar.
   // An older load cannot replace a newer selection or re-open a room after
   // Leave/Start hid it. Rejected and superseded loads keep the current room.
   const nextMembers=new Map(),teamSlots={alpha:0,beta:0};
   for(const person of participants){
    const ordinal=++teamSlots[person.team];if(person.id==='local')continue;
    const id=person.id||person.name,options={appearance:person.appearance||appearance,sex:person.sex||sex,outfit:person.outfit||outfit};
    const memberKey=JSON.stringify(options),placement=projectWaitingRoomMarker(world,`${person.team}_standby_pos${String(ordinal).padStart(2,'0')}`);
    let member=members3d.get(id)?.identity===memberKey?members3d.get(id).actor:null;
    if(!member){member=await loadActor({...options,weapon:'dagger',weaponSkin:'classic',initialClip:'00074'});pending.add(member);if(!current())return false;for(const mesh of member.meshes)if(mesh.userData.weapon)mesh.visible=false;member.play('00074',{loop:true});}
    nextMembers.set(id,{actor:member,identity:memberKey,placement});
   }
   if(!current())return false;
   const local=participants.find(p=>p.id==='local'),localPlacement=resetPosition&&local?.team==='beta'?projectWaitingRoomMarker(world,'beta_standby_pos01'):null;
   localTeam=local?.team??'alpha';
   if(nextActor!==actor){disposeAvatar(actor);actor=nextActor;identity=key;scene.add(actor.group);controller.sex=sex;motion.reset();}
   for(const [id,member]of members3d)if(nextMembers.get(id)?.actor!==member.actor)disposeAvatar(member.actor);
   members3d.clear();
   for(const [id,entry]of nextMembers){members3d.set(id,entry);scene.add(entry.actor.group);entry.actor.group.position.set(entry.placement.position.x,entry.placement.position.y,entry.placement.position.z);setAvatarFacing(entry.actor.group,entry.placement.facing);}
   pending.clear();
  const preview=waitingRoomMapPreview(nativeMapId,sceneKey);
  info.classList.toggle('has-map-preview',!!preview);info.dataset.preview=preview?'loading':'none';info.dataset.nativeMapId=nativeMapId??'';
  mapPreview.hidden=!preview;
  if(preview){mapPreview.src=preview.image;mapPreview.alt=`${mapLabel} map preview`;mapPreview.width=preview.width;mapPreview.height=preview.height;}
  else{mapPreview.removeAttribute('src');mapPreview.alt='';}
  root.querySelector('[data-room-map-name]').textContent=mapLabel;
  root.querySelector('[data-room-description]').textContent=modeLabel||description;
  const options=root.querySelector('[data-room-options]');options.textContent=optionLabel;options.hidden=!optionLabel;
  root.querySelector('[data-room-count]').textContent=`Local room · ${participants.length} ${participants.length===1?'player':'players'}`;
  const members=root.querySelector('.waiting-room-members');members.replaceChildren();
  // This controls the roster presentation only. Source-marker placement above
  // continues to use the retained room slots, including in individual matches.
  const individual=rosterKind==='individual';members.dataset.rosterKind=individual?'individual':'teams';
  for(const team of individual?[null]:['alpha','beta']){
   const panel=doc.createElement('section');if(team)panel.dataset.team=team;
   const title=doc.createElement('b');title.textContent=individual?'Participants':team.toUpperCase();panel.append(title);
   if(individual){const rule=doc.createElement('small');rule.textContent='Free for all';panel.append(rule);}
   const roster=doc.createElement('div');roster.className='waiting-room-roster';roster.setAttribute('role','list');roster.setAttribute('aria-label',individual?'Participants · Free for all':`${team.toUpperCase()} players`);roster.tabIndex=0;
   for(const person of participants.filter(p=>individual||p.team===team)){const name=doc.createElement('p');name.setAttribute('role','listitem');name.textContent=person.name;roster.append(name);}
   panel.append(roster);members.append(panel);
  }
  if(resetPosition){
   motion.reset();
   if(localPlacement){world.spawn=localPlacement.position;controller.reset();controller.facing=localPlacement.facing;yaw=localPlacement.facing;}
   else{world.spawn={...observedAlphaSpawn};controller.reset();controller.facing=world.facing??-1.587898807270484;yaw=controller.facing;}
  }accumulator=0;status.textContent='Move with your movement keys · Hold right click to rotate the camera';show();return true;
  }finally{for(const next of pending)disposeAvatar(next);}
 }
 function frame(dt){
  if(!visible||!actor||!controller)return;
  if(!menuOpen&&!busy&&gamepad?.context==='room'){yaw+=gamepad.look.deltaYaw;pitch=Math.max(-1.15,Math.min(1.15,pitch+gamepad.look.deltaPitch));}
  accumulator+=Math.max(0,Math.min(dt,.25));while(accumulator>=.008){lastInput=input.sample(yaw+Math.PI);if(!menuOpen&&!busy&&gamepad?.context==='room')lastInput=gamepad.merge(lastInput,yaw+Math.PI);if(!lastInput.forward&&!lastInput.side)lastInput.facing=controller.facing;motion.events(controller.step(.008,lastInput));actor.motion(motion.sample(controller,.008,lastInput));actor.update(.008);accumulator-=.008;}
  const p=controller.position;actor.group.position.set(p.x,p.y,p.z);setAvatarFacing(actor.group,controller.facing);
  camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();
  cameraRig.update(camera,p,yaw,pitch,controller.collision);world.update?.(dt);
  for(const member of members3d.values())member.actor.update(dt);
  renderWaitingRoom(renderer,scene,camera,canvas.clientWidth,canvas.clientHeight);
 }
 return {enter,show,hide,frame,changeDesign,gamepadMenu(){if(visible&&!menuOpen&&!busy){input.clear();onMenu('room');}},gamepadStart(){if(visible&&!menuOpen&&!busy)start.click();},get visible(){return visible;},get menuOpen(){return menuOpen;},setMenuOpen(value){menuOpen=!!value;root.hidden=!visible||menuOpen;input.clear();},
  snapshot(){return {visible,menuOpen,busy,designKey,position:controller?{...controller.position}:null,velocity:controller?{...controller.velocity}:null,grounded:controller?.grounded,state:controller?.state,yaw,pitch,camera:cameraRig.snapshot(camera),clip:actor?.clip,input:input.snapshot(),members:[...members3d].map(([id,m])=>({id,...m.placement,clip:m.actor.clip})),roomSource:world?.root?.userData.source??null,nativeRoomMovementCompared:false};},
  dispose(){if(disposed)return;disposed=true;hide();input.dispose();for(const [node,type,fn]of listeners)node.removeEventListener(type,fn);disposeAvatar(actor);for(const member of members3d.values())disposeAvatar(member.actor);members3d.clear();world?.dispose?.();root.remove();}};
}
