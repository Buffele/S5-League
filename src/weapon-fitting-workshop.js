import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {loadAvatar} from './avatar.js';
import {WEAPON_CHOICES} from './loadout.js';
import {FIT_COMPONENTS,normalizeWeaponFit,readWeaponFit,saveWeaponFit} from './weapon-fitting.js';
import {weaponFittingPoses} from './weapon-fitting-poses.js';
import './weapon-fitting-workshop.css';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
$('weapon').value=Object.hasOwn(FIT_COMPONENTS,params.get('weapon'))?params.get('weapon'):'plasma';
$('sex').value=params.get('sex')==='female'?'female':'male';
$('character').value=params.get('character')==='meshy'?'meshy':'s5runtime';
for(const option of $('weapon').options)if(!WEAPON_CHOICES[option.value].skins.meshy){option.disabled=true;option.textContent+=' · import en cours';}
const drafts=new Map(),histories=new Map();
let activeWeapon=$('weapon').value,ready=false,loading=0,playing=false,elapsed=.3,duration=1,poses=[],part=null,proxy=null,syncing=false;
const current=()=>drafts.get(activeWeapon),history=()=>histories.get(activeWeapon);
const status=text=>$('status').textContent=text;
const notice=text=>$('save-status').textContent=text;
function ensureDraft(weapon){if(!drafts.has(weapon)){
 let profile=readWeaponFit(weapon);
 try{const draft=sessionStorage.getItem('s5.weapon-fitting.draft.v1.'+weapon);if(draft)profile=normalizeWeaponFit(weapon,JSON.parse(draft));}catch{}
 drafts.set(weapon,profile);histories.set(weapon,{past:[],future:[]});
}}
function pushHistory(){const h=history();h.past.push(structuredClone(current()));if(h.past.length>80)h.past.shift();h.future=[];}
function updateHistoryButtons(){$('undo').disabled=!history()?.past.length;$('redo').disabled=!history()?.future.length;}
function updateLink(){
 const q=new URLSearchParams({weapon:activeWeapon,weaponSkin:'meshy',sex:$('sex').value});
 if($('character').value==='meshy')q.set('character','meshy');
 $('game-link').href='/?'+q;
 const editor=new URLSearchParams({weapon:activeWeapon,sex:$('sex').value,character:$('character').value});
 window.history.replaceState(null,'','?'+editor);
}

const stage=$('stage'),renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Personnages équipés, originale à gauche et Meshy à droite');stage.prepend(renderer.domElement);
function panel(id){
 const host=$(id),scene=new THREE.Scene();scene.background=new THREE.Color('#263345');
 scene.add(new THREE.HemisphereLight(0xedf5ff,0x62616d,2));
 const light=new THREE.DirectionalLight(0xffffff,2.8);light.position.set(-3,5,-4);scene.add(light);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(5,64),new THREE.MeshLambertMaterial({color:0x253040}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
 scene.add(new THREE.GridHelper(10,20,0x536278,0x344054));
 const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,1.4,-6.3);
 const orbit=new OrbitControls(camera,host);orbit.target.set(0,1.1,0);orbit.minDistance=.35;orbit.maxDistance=15;orbit.update();
 return {host,scene,camera,orbit,avatar:null,actions:[]};
}
const panels=[panel('classic-view'),panel('meshy-view')],right=panels[1];
for(const p of panels)p.orbit.addEventListener('change',()=>{
 if(syncing)return;syncing=true;
 for(const other of panels)if(other!==p){other.camera.position.copy(p.camera.position);other.camera.quaternion.copy(p.camera.quaternion);other.orbit.target.copy(p.orbit.target);other.orbit.update();}
 syncing=false;
});
const transform=new TransformControls(right.camera,right.host);transform.setSpace('local');transform.setSize(.8);right.scene.add(transform.getHelper());
transform.addEventListener('dragging-changed',event=>{for(const p of panels)p.orbit.enabled=!event.value;if(event.value){playing=false;updatePlay();pushHistory();}});
transform.addEventListener('objectChange',()=>{
 if(!part||!proxy||!ready)return;
 const next=structuredClone(current()),data=next.components[part.name];
 data.position=proxy.position.clone().sub(part.pivot).multiply(part.cmPerUnit).toArray().map(v=>+v.toFixed(5));
 data.rotation=[proxy.rotation.x,proxy.rotation.y,proxy.rotation.z].map(v=>+THREE.MathUtils.radToDeg(v).toFixed(5));
 try{drafts.set(activeWeapon,normalizeWeaponFit(activeWeapon,next));right.avatar.weaponFitting.apply(current());showFields();dirty();}catch(error){notice(error.message);syncProxy();}
});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);for(const p of panels){p.camera.aspect=p.host.clientWidth/p.host.clientHeight;p.camera.updateProjectionMatrix();}}
new ResizeObserver(resize).observe(stage);resize();
function disposeAvatar(avatar){
 if(!avatar)return;avatar.prepareSwitch();avatar.group.removeFromParent();avatar.helper.removeFromParent();avatar.mixer.uncacheRoot(avatar.rig);
 for(const mesh of avatar.meshes){mesh.geometry.dispose();mesh.skeleton?.dispose();for(const material of [].concat(mesh.material))material.dispose();}
}
function clearProxy(){transform.detach();proxy?.removeFromParent();proxy=null;part=null;}
function syncProxy(){
 if(!part||!proxy)return;
 const data=current().components[part.name];
 proxy.position.copy(part.pivot).add(new THREE.Vector3().fromArray(data.position).divide(part.cmPerUnit));
 proxy.rotation.set(...data.rotation.map(THREE.MathUtils.degToRad),'XYZ');proxy.scale.setScalar(1);proxy.updateWorldMatrix(true,false);
}
function selectPart(){
 clearProxy();if(!ready)return;
 part=right.avatar.weaponFitting.parts.find(p=>p.name===$('component').value);if(!part)return;
 proxy=new THREE.Group();proxy.name='weapon-fitting-handle';part.mesh.add(proxy);syncProxy();
 if($('gizmo').checked)transform.attach(proxy);
 $('part-badge').textContent=part.label+' · réglable';showFields();
}
function dirty(){
 try{sessionStorage.setItem('s5.weapon-fitting.draft.v1.'+activeWeapon,JSON.stringify(current()));}catch{}
 notice('Modifications en aperçu · clique sur Enregistrer pour S5 pour les appliquer au jeu.');updateHistoryButtons();
}
function applyDraft(){right.avatar.weaponFitting.apply(current());syncProxy();showFields();updateHistoryButtons();}
const fields=[];
for(const [key,title,range,step] of [['position','Position · cm',100,.1],['rotation','Rotation · °',180,.5],['scale','Taille uniforme',3,.01]]){
 const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=title;fieldset.append(legend);
 for(const [index,axis] of (key==='scale'?[[0,'×']]:[[0,'X'],[1,'Y'],[2,'Z']])){
  const row=document.createElement('div');row.className='transform-row';
  const letter=document.createElement('span');letter.className='axis axis-'+axis.toLowerCase();letter.textContent=axis;
  const slider=document.createElement('input'),number=document.createElement('input');slider.type='range';number.type='number';
  slider.min=key==='scale'?.05:-range;slider.max=range;slider.step=step;number.min=key==='scale'?.05:key==='position'?-200:-3600;number.max=key==='scale'?5:key==='position'?200:3600;number.step=step;
  const label=key==='scale'?'Taille uniforme':`${key==='position'?'Position':'Rotation'} ${axis} (${key==='position'?'cm':'degrés'})`;
  number.setAttribute('aria-label',label);slider.setAttribute('aria-label',label+' curseur');
  for(const input of [slider,number])input.addEventListener('input',()=>{
   if(!ready||!part||input.value==='')return;
   const value=Number(input.value);if(!Number.isFinite(value))return;
   const next=structuredClone(current());if(key==='scale')next.components[part.name].scale=value;else next.components[part.name][key][index]=value;
   try{const normalized=normalizeWeaponFit(activeWeapon,next);pushHistory();drafts.set(activeWeapon,normalized);applyDraft();dirty();}catch(error){notice(error.message);}
  });
  row.append(letter,slider,number);fieldset.append(row);fields.push({key,index,slider,number});
 }
 $('transform-fields').append(fieldset);
}
function showFields(){
 if(!part)return;const data=current().components[part.name];
 for(const {key,index,slider,number} of fields){const value=key==='scale'?data.scale:data[key][index];slider.value=value;if(document.activeElement!==number)number.value=+value.toFixed(4);}
}
function sample(time){
 if(!ready)return;elapsed=Math.max(0,Math.min(duration,time));
 for(const p of panels){for(const action of p.actions)action.time=Math.min(elapsed,action.getClip().duration);p.avatar.mixer.update(0);p.avatar.group.updateMatrixWorld(true);}
 $('time').value=elapsed;$('clock').textContent=elapsed.toFixed(3)+' / '+duration.toFixed(2)+' s';
}
function selectPose(){
 if(!ready)return;
 const pose=poses.find(p=>p.id===$('pose').value)||poses[0];
 for(const p of panels){
  p.avatar.prepareSwitch();p.avatar.motion({...pose,loop:true,speed:1,lowerSpeed:1,fade:0,time:0,restartKey:'fitting-'+pose.id});p.avatar.update(0);
  p.actions=[p.avatar.actions.get(pose.clip+':upper'),...(pose.lower?[p.avatar.actions.get(pose.lower+':lower')]:[])];
  if(p.actions.some(action=>!action))throw Error('Clip absent : '+pose.clip);
 }
 duration=Math.max(...panels.flatMap(p=>p.actions.map(a=>a.getClip().duration)));$('time').max=duration;sample(Math.min(.3,duration));
 status(`Prêt · ${WEAPON_CHOICES[activeWeapon].name} · ${pose.clip}${pose.lower?' + '+pose.lower:''} · pose synchronisée`);
}
function updatePlay(){$('play').textContent=playing?'Pause':'Lire l’animation';}
function view(side,close=false){
 const target=close&&proxy?proxy.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(0,1.1,0),distance=close?1.6:6.3;
 for(const p of panels){p.orbit.target.copy(target);p.camera.position.copy(target).add(new THREE.Vector3(...({front:[0,.2,-distance],back:[0,.2,distance],left:[distance,.2,0],right:[-distance,.2,0]}[side])));p.orbit.update();}
}
async function load(){
 const token=++loading;ready=false;playing=false;updatePlay();clearProxy();activeWeapon=$('weapon').value;ensureDraft(activeWeapon);updateLink();
 for(const p of panels)if(p.avatar)p.avatar.group.visible=false;
 for(const button of [$('save'),$('export'),$('import'),$('reset')])button.disabled=true;
 status('Chargement de l’originale et de la version Meshy…');
 try{
  const avatars=await Promise.allSettled(['classic','meshy'].map(weaponSkin=>loadAvatar({sex:$('sex').value,appearance:$('character').value,weapon:activeWeapon,weaponSkin,weaponFit:weaponSkin==='meshy'?current():undefined})));
  const loaded=avatars.filter(a=>a.status==='fulfilled').map(a=>a.value),failure=avatars.find(a=>a.status==='rejected');
  if(token!==loading||failure){loaded.forEach(disposeAvatar);if(failure)throw failure.reason;return;}
  panels.forEach((p,i)=>{disposeAvatar(p.avatar);p.avatar=avatars[i].value;p.scene.add(p.avatar.group);});
  if(!right.avatar.weaponFitting?.parts.length)throw Error('Aucune pièce Meshy réglable');
  $('component').replaceChildren(...right.avatar.weaponFitting.parts.map(p=>new Option(p.label,p.name)));
  poses=weaponFittingPoses(activeWeapon);$('pose').replaceChildren(...poses.map(p=>new Option(p.label+' · '+p.clip,p.id)));
  ready=true;selectPose();selectPart();updateHistoryButtons();
  notice(JSON.stringify(current())===JSON.stringify(readWeaponFit(activeWeapon))?'Réglages enregistrés chargés · les modifications restent en aperçu jusqu’à l’enregistrement.':'Brouillon récupéré · Enregistrer pour S5 pour l’appliquer au jeu.');
  for(const button of [$('save'),$('export'),$('import'),$('reset')])button.disabled=false;
 }catch(error){if(token===loading){status('Chargement impossible : '+error.message);notice('Le skin doit être présent dans S5 pour être réglé ici.');}}
}
for(const id of ['weapon','sex','character'])$(id).addEventListener('change',load);
$('component').onchange=selectPart;$('pose').onchange=()=>{playing=false;updatePlay();selectPose();};
$('play').onclick=()=>{if(ready){playing=!playing;updatePlay();}};
$('time').oninput=()=>{playing=false;updatePlay();sample(Number($('time').value));};
for(const mode of ['translate','rotate'])$(mode).onclick=()=>{transform.setMode(mode);for(const name of ['translate','rotate'])$(name).setAttribute('aria-pressed',String(name===mode));};
$('gizmo').onchange=()=>{transform.detach();if($('gizmo').checked&&proxy)transform.attach(proxy);};
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>view(button.dataset.view);
$('grip-view').onclick=()=>{if(ready)view('front',true);};$('full-view').onclick=()=>view('front');
$('reset').onclick=()=>{if(!ready||!part)return;pushHistory();current().components[part.name]=normalizeWeaponFit(activeWeapon).components[part.name];applyDraft();dirty();};
for(const [id,from,to] of [['undo','past','future'],['redo','future','past']])$(id).onclick=()=>{if(!ready||!history()[from].length)return;history()[to].push(structuredClone(current()));drafts.set(activeWeapon,history()[from].pop());applyDraft();dirty();};
$('save').onclick=()=>{if(!ready)return;try{saveWeaponFit(activeWeapon,current());notice('Enregistré pour S5 · '+WEAPON_CHOICES[activeWeapon].name+'. Les parties ouvertes vont récupérer ce réglage.');}catch(error){notice('Échec de l’enregistrement : '+error.message);}};
$('export').onclick=()=>{
 if(!ready)return;const url=URL.createObjectURL(new Blob([JSON.stringify(current(),null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`s5-${activeWeapon}-meshy-reglages.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 notice('JSON exporté · tu peux me transmettre ce fichier pour intégrer ton réglage.');
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{
 const weapon=activeWeapon,file=$('file').files[0];if(!file)return;
 try{if(file.size>100000)throw Error('Fichier trop volumineux');const value=normalizeWeaponFit(weapon,JSON.parse(await file.text()));if(weapon!==activeWeapon)throw Error('Arme changée pendant la lecture');pushHistory();drafts.set(weapon,value);applyDraft();dirty();notice('JSON importé en aperçu · Enregistrer pour S5 pour l’appliquer.');}catch(error){notice('Import refusé : '+error.message);}finally{$('file').value='';}
};
let previous=performance.now();
function render(now){
 const dt=Math.min(.05,(now-previous)/1000);previous=now;
 if(ready&&playing&&!transform.dragging)sample((elapsed+dt)%duration);
 const box=stage.getBoundingClientRect();renderer.setScissorTest(true);
 for(const p of panels){const rect=p.host.getBoundingClientRect();renderer.setViewport(rect.left-box.left,box.bottom-rect.bottom,rect.width,rect.height);renderer.setScissor(rect.left-box.left,box.bottom-rect.bottom,rect.width,rect.height);renderer.render(p.scene,p.camera);}
 requestAnimationFrame(render);
}
requestAnimationFrame(render);load();
