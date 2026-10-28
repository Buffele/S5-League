import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {loadAvatar} from './avatar.js';
import {MIXAMO_CLIP_LABELS} from './mixamo-locomotion.js';
import {projectFromClip} from './animation-authoring.js';
import {jointGroups,jointLabel,isPrimaryJoint,jointFromIntersection} from './animation-joints.js';
import {capturePose,applyPose,captureLocalRotation,applyLocalRotation,newProject,validateProject,sampleProject,putKey,resizeProject,ProjectHistory,copy} from './animation-project.js';
import './animation-workshop.css';

const $=id=>document.getElementById(id),storageKey='s5-animation-workshop-v1';
const canvas=$('studio'),stage=document.querySelector('.stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NeutralToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color('#182231');
scene.fog=new THREE.Fog('#182231',10,28);
const camera=new THREE.PerspectiveCamera(38,1,.01,100);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,1.05,0);orbit.enableDamping=true;orbit.minDistance=.6;orbit.maxDistance=12;
scene.add(new THREE.HemisphereLight(0xd2eaff,0x4a4549,2));
const keyLight=new THREE.DirectionalLight(0xffefd9,3);keyLight.position.set(-3,6,-4);keyLight.castShadow=true;
keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.normalBias=.025;scene.add(keyLight);
const rim=new THREE.DirectionalLight(0x7caeff,2);rim.position.set(3,3,3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x1e2a3b,roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(12,24,0x536174,0x2c394d);grid.position.y=-.02;scene.add(grid);
const gizmo=new TransformControls(camera,canvas);gizmo.setMode('rotate');gizmo.setSpace('local');gizmo.setSize(.85);scene.add(gizmo.getHelper());
let avatar=null,neutral=null,project=null,time=0,playing=false,selectedKey=-1,selectedBone=null,clipboardPose=null,history=new ProjectHistory(),unsaved=false;
let clipboardRotation=null;
const dots=[],dotGeometry=new THREE.SphereGeometry(.028,10,8),dotMaterial=new THREE.MeshBasicMaterial({color:0xa3b9cb,depthTest:false});
const dotSelectedMaterial=new THREE.MeshBasicMaterial({color:0xd9fa7a,depthTest:false});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null,wasDragging=false,editSnapshot=null;
let directSelection=false,altHeld=false;
const selectionActive=()=>directSelection||altHeld;
function syncSelectionMode(){
 const active=selectionActive();
 orbit.enabled=!active&&!gizmo.dragging;gizmo.enabled=!active;gizmo.getHelper().visible=!active&&!!selectedBone;
 canvas.style.cursor=active?'crosshair':'';
 $('direct-select').setAttribute('aria-pressed',String(directSelection));
 $('selection-hint').textContent=active
  ?'Clique sur le corps pour choisir une articulation · '+(directSelection?'Désactive le bouton pour manipuler.':'Relâche Alt pour manipuler.')
  :'Alt + clic sur le corps : sélectionner · Glisser : orbite · Molette : zoom';
}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function refreshJointList(){
 if(!avatar)return;
 const groups=jointGroups(avatar.bones.keys(),$('advanced-joints').checked),allowed=new Set(groups.flatMap(g=>g.joints.map(j=>j.name)));
 $('bone-select').replaceChildren();
 for(const group of groups){
  const optgroup=document.createElement('optgroup');optgroup.label=group.label;
  for(const joint of group.joints){const option=new Option(joint.label,joint.name);option.title=joint.name;optgroup.append(option);}
  $('bone-select').append(optgroup);
 }
 let bone=avatar.bones.get(selectedBone);
 while(bone&&!allowed.has(bone.name))bone=bone.parent;
 chooseBone(bone?.name||'Bip01 Spine');
}
function pause(){playing=false;$('play-animation').textContent='▶ Lire';}
function selected(){return selectedKey>=0?project.keys[selectedKey]:null;}
function save(){
 try{localStorage.setItem(storageKey,JSON.stringify(project));unsaved=false;status('Brouillon sauvegardé sur cet appareil · '+project.keys.length+' poses.');}
 catch{unsaved=true;status('Stockage local indisponible ou plein. Exporte ton projet JSON pour le conserver.',true);}
}
function record(){pause();history.push(project);}
function changed(){drawTimeline();syncFields();save();}
function seek(value){
 pause();time=Math.max(0,Math.min(project.duration,Number(value)||0));
 applyPose(avatar.bones,sampleProject(project,time));avatar.group.updateMatrixWorld(true);
 selectedKey=project.keys.findIndex(k=>Math.abs(k.time-time)<.00001);drawTimeline();syncFields();
}
function commitPose(before=project){
 if(before!==project)history.push(before);
 selectedKey=putKey(project,time,capturePose(avatar.bones),selected()?.ease||$('key-ease').value);
 changed();
}
function updateTime(){
 $('scrubber').value=time;$('playhead-time').value=time.toFixed(3);
 $('time-readout').textContent=time.toFixed(2)+' / '+project.duration.toFixed(2)+' s';
}
function drawTimeline(){
 if(!project)return;
 $('scrubber').max=project.duration;$('playhead-time').max=project.duration;$('key-time').max=project.duration;
 const fragment=document.createDocumentFragment();
 project.keys.forEach((k,i)=>{
  const b=document.createElement('button');b.className='key-dot'+(i===selectedKey?' active':'');b.style.left=(k.time/project.duration*100)+'%';
  b.title='Pose '+(i+1)+' · '+k.time.toFixed(3)+' s';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(i===selectedKey));
  b.onclick=()=>seek(k.time);fragment.append(b);
 });
 $('key-track').replaceChildren(fragment);$('key-count').textContent=project.keys.length+' poses';
 const key=selected();$('key-time').disabled=!key;$('delete-key').disabled=!key||project.keys.length<2;
 $('key-time').value=key?key.time.toFixed(4):'';if(key)$('key-ease').value=key.ease;
 $('undo').disabled=!history.undoStack.length;$('redo').disabled=!history.redoStack.length;updateTime();
}
function syncFields(){
 if(!avatar||!selectedBone)return;
 const b=avatar.bones.get(selectedBone);
 $('paste-rotation').disabled=!clipboardRotation;
 $('rotation-clipboard-hint').textContent=clipboardRotation
  ?'Copiée : '+jointLabel(clipboardRotation.source)+'. Coller agit sur '+jointLabel(selectedBone)+' au temps courant.'
  :'Copie la rotation X/Y/Z, avance avec +1 image, puis colle-la. La position reste inchangée.';
 for(const [i,axis] of ['x','y','z'].entries()){
  $('r'+axis).value=THREE.MathUtils.radToDeg(b.rotation[axis]).toFixed(1);
  $('p'+axis).value=b.position[axis].toFixed(3);
 }
}
function chooseBone(name){
 if(!avatar.bones.has(name))return;pause();selectedBone=name;
 $('bone-select').value=name;$('bone-badge').textContent=jointLabel(name,$('advanced-joints').checked);gizmo.attach(avatar.bones.get(name));syncFields();
 for(const d of dots)d.material=d.userData.bone===name?dotSelectedMaterial:dotMaterial;
 syncSelectionMode();
}
function disposeAvatar(){
 if(!avatar)return;gizmo.detach();scene.remove(avatar.group,avatar.helper);
 const geometries=new Set(),materials=new Set(),textures=new Set();
 avatar.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 avatar.helper.geometry.dispose();avatar.helper.material.dispose();
 for(const dot of dots)scene.remove(dot);dots.length=0;
}
async function loadActor(sex,outfit){
 pause();document.body.classList.add('busy');status('Chargement du personnage…');
 try{
  const next=await loadAvatar({sex,outfit});disposeAvatar();avatar=next;
  avatar.mixer.stopAllAction();neutral=capturePose(avatar.bones);
  scene.add(avatar.group,avatar.helper);avatar.helper.visible=$('show-skeleton').checked;
  avatar.group.updateMatrixWorld(true);
  $('bone-select').replaceChildren();$('source-clip').replaceChildren();
  for(const name of avatar.bones.keys()){
   if(/^Bip01(?:$| (?:Pelvis|Spine\d?|Neck|Head|[LR] (?:Clavicle|UpperArm|Forearm|Hand|Thigh|Calf|Foot|Toe0))$)/.test(name)){
    const dot=new THREE.Mesh(dotGeometry,dotMaterial);dot.userData.bone=name;dot.renderOrder=10;scene.add(dot);dots.push(dot);
   }
  }
  const clips=[...avatar.clips].sort((a,b)=>Number(b.name.startsWith('MIXAMO'))-Number(a.name.startsWith('MIXAMO'))||a.name.localeCompare(b.name));
  for(const c of clips)$('source-clip').add(new Option((MIXAMO_CLIP_LABELS[c.name]||c.name)+' · '+c.duration.toFixed(2)+' s',c.name));
  $('actor-sex').value=sex;$('actor-outfit').value=outfit;
  for(const mesh of avatar.meshes)if(mesh.userData.weapon)mesh.visible=$('show-weapon').checked;
  refreshJointList();
 }finally{document.body.classList.remove('busy');}
}
function syncProject(){
 $('project-name').value=project.name;$('duration').value=project.duration.toFixed(3);$('loop-animation').checked=project.loop;seek(0);
}
function checkBones(candidate){
 for(const name of Object.keys(candidate.keys[0].pose))if(!avatar.bones.has(name))throw Error('Articulation absente de ce personnage : '+name);
 // Complete skeletons prevent stale transforms after loading another project.
 for(const name of avatar.bones.keys())if(!Object.hasOwn(candidate.keys[0].pose,name))throw Error('Squelette incomplet : '+name);
}
async function installProject(candidate){
 const valid=validateProject(candidate);
 const old=project,needsActor=!avatar||avatar.sex!==valid.sex||$('actor-outfit').value!==valid.outfit;
 try{
  if(needsActor)await loadActor(valid.sex,valid.outfit);
  checkBones(valid);project=valid;history=new ProjectHistory();clipboardPose=null;syncProject();save();
 }catch(error){
  if(needsActor&&old){await loadActor(old.sex,old.outfit);project=old;syncProject();}
  throw error;
 }
}
function replaceConfirmed(){return !project||confirm('Remplacer le projet actuel ? Le brouillon sera remplacé. Exporte-le d’abord si tu veux conserver cette création.');}
function handleError(e){status(e.message||String(e),true);}

gizmo.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value&&!selectionActive();wasDragging=true;});
gizmo.addEventListener('mouseDown',()=>{pause();editSnapshot=copy(project);});
gizmo.addEventListener('objectChange',()=>{avatar?.group.updateMatrixWorld(true);syncFields();});
gizmo.addEventListener('mouseUp',()=>{if(editSnapshot){commitPose(editSnapshot);editSnapshot=null;}});
// Capture before OrbitControls/TransformControls can handle the same click.
canvas.addEventListener('pointerdown',e=>{
 if(!gizmo.dragging){altHeld=e.altKey;syncSelectionMode();}
 pointerStart={x:e.clientX,y:e.clientY,direct:selectionActive()};wasDragging=false;
},true);
canvas.addEventListener('pointerup',e=>{
 const start=pointerStart;pointerStart=null;
 if(!avatar||!start||e.button!==0||Math.hypot(e.clientX-start.x,e.clientY-start.y)>4)return;
 if(!start.direct&&(wasDragging||gizmo.axis))return;
 const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
 if(start.direct){
  avatar.group.updateMatrixWorld(true);
  const meshes=avatar.meshes.filter(m=>m.visible&&!m.userData.weapon);
  for(const mesh of meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();mesh.computeBoundingSphere();if(mesh.boundingBox)mesh.computeBoundingBox();}
  const hit=raycaster.intersectObjects(meshes,false)[0];
  const advanced=$('advanced-joints').checked;
  const name=jointFromIntersection(hit,n=>isPrimaryJoint(n)||(advanced&&/^Bip01 (?:Spine1$|[LR] (?:Finger\d+$|Toe0$))/.test(n)));
  if(name){chooseBone(name);status('Articulation sélectionnée : '+jointLabel(name)+'.');}
  else status('Clique sur une partie visible du personnage pour sélectionner son articulation.');
  return;
 }
 const hit=raycaster.intersectObjects(dots.filter(d=>d.visible))[0];if(hit)chooseBone(hit.object.userData.bone);
});
canvas.addEventListener('pointercancel',()=>{pointerStart=null;});
// Recover a missed key-up after tab switching or browser modifier shortcuts.
canvas.addEventListener('pointermove',e=>{
 if(altHeld!==e.altKey&&!gizmo.dragging){altHeld=e.altKey;syncSelectionMode();}
},true);
$('direct-select').onclick=()=>{directSelection=!directSelection;syncSelectionMode();};
$('bone-select').onchange=e=>chooseBone(e.target.value);
$('advanced-joints').onchange=refreshJointList;
for(const mode of ['rotate','move'])$(mode+'-mode').onclick=()=>{
 pause();gizmo.setMode(mode==='rotate'?'rotate':'translate');
 $('rotate-mode').setAttribute('aria-pressed',String(mode==='rotate'));$('move-mode').setAttribute('aria-pressed',String(mode==='move'));
 $('transform-hint').textContent=mode==='rotate'?'Rotations locales. Les longueurs des membres sont conservées.':'Déplacement local libre. Utilise Bip01 pour déplacer tout le corps ; déplacer un membre peut l’étirer.';
};
for(const property of ['r','p'])for(const axis of ['x','y','z'])$(property+axis).onchange=e=>{
 const value=Number(e.target.value);if(!Number.isFinite(value)||Math.abs(value)>100000){syncFields();return;}
 record();const bone=avatar.bones.get(selectedBone);
 if(property==='r')bone.rotation[axis]=THREE.MathUtils.degToRad(value);else bone.position[axis]=value;
 commitPose();
};
$('reset-bone').onclick=()=>{record();applyPose(avatar.bones,{[selectedBone]:neutral[selectedBone]});commitPose();};
$('copy-rotation').onclick=()=>{
 if(!project||!selectedBone)return;
 pause();clipboardRotation={source:selectedBone,q:captureLocalRotation(avatar.bones.get(selectedBone))};syncFields();
 status('Rotation locale copiée : '+jointLabel(selectedBone)+'. Avance avec +1 image, puis clique sur Coller la rotation.');
};
$('paste-rotation').onclick=()=>{
 if(!project||!selectedBone||!clipboardRotation)return;
 record();applyLocalRotation(avatar.bones.get(selectedBone),clipboardRotation.q);commitPose();
};
$('copy-pose').onclick=()=>{clipboardPose=capturePose(avatar.bones);status('Pose copiée. Déplace la tête de lecture puis colle-la.');};
$('paste-pose').onclick=()=>{
 if(!clipboardPose){status('Copie d’abord une pose.');return;}
 record();applyPose(avatar.bones,clipboardPose);commitPose();
};
$('play-animation').onclick=()=>{
 if(playing){pause();syncFields();return;}
 if(time>=project.duration)time=0;playing=true;selectedKey=-1;drawTimeline();$('play-animation').textContent='Ⅱ Pause';
};
$('scrubber').oninput=e=>seek(e.target.value);$('playhead-time').onchange=e=>seek(e.target.value);
$('previous-frame').onclick=()=>seek(Math.round(time*30-1)/30);$('next-frame').onclick=()=>seek(Math.round(time*30+1)/30);
$('add-key').onclick=()=>{record();commitPose();};
$('delete-key').onclick=()=>{if(selectedKey<0||project.keys.length<2)return;record();project.keys.splice(selectedKey,1);seek(time);changed();};
$('key-time').onchange=e=>{
 if(!selected())return;const value=Number(e.target.value);
 if(!Number.isFinite(value)||value<0||value>project.duration||project.keys.some((k,i)=>i!==selectedKey&&Math.abs(k.time-value)<1e-5)){status('Choisis un temps libre dans la durée du projet.',true);drawTimeline();return;}
 record();selected().time=value;project.keys.sort((a,b)=>a.time-b.time);seek(value);changed();
};
$('key-ease').onchange=e=>{if(!selected())return;record();selected().ease=e.target.value;changed();};
$('close-loop').onclick=()=>{record();putKey(project,project.duration,project.keys[0].pose,project.keys[0].ease);seek(project.duration);changed();};
$('duration').onchange=e=>{try{const value=Number(e.target.value);if(!Number.isFinite(value)||value<.1||value>60)throw Error('Durée : 0,1 à 60 secondes.');record();resizeProject(project,value);seek(Math.min(time,value));changed();}catch(error){handleError(error);$('duration').value=project.duration;}};
$('project-name').onchange=e=>{record();project.name=e.target.value.trim()||'Mon animation';changed();};
$('loop-animation').onchange=e=>{record();project.loop=e.target.checked;changed();};
for(const direction of ['undo','redo'])$(direction).onclick=()=>{
 pause();const next=history[direction](project);if(!next)return;project=next;syncProject();save();
};
$('new-project').onclick=()=>{if(!replaceConfirmed())return;history=new ProjectHistory();project=newProject(neutral,{sex:avatar.sex,outfit:$('actor-outfit').value});syncProject();save();};
$('clone-source').onclick=()=>{
 if(!replaceConfirmed())return;
 try{
  pause();const clip=avatar.clips.find(c=>c.name===$('source-clip').value);if(!clip)throw Error('Animation source absente.');
  project=projectFromClip(avatar,clip,{name:(MIXAMO_CLIP_LABELS[clip.name]||clip.name)+' · ma version',outfit:$('actor-outfit').value});
  history=new ProjectHistory();syncProject();save();
 }catch(error){handleError(error);}
};
async function changeActor(){
 const sex=$('actor-sex').value,outfit=$('actor-outfit').value;
 if(!replaceConfirmed()){$('actor-sex').value=project.sex;$('actor-outfit').value=project.outfit;return;}
 try{await loadActor(sex,outfit);clipboardPose=null;history=new ProjectHistory();project=newProject(neutral,{sex,outfit});syncProject();save();}catch(error){handleError(error);}
}
$('actor-sex').onchange=changeActor;$('actor-outfit').onchange=changeActor;
$('save-project').onclick=save;
$('export-project').onclick=()=>{
 const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=(project.name.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-').slice(0,80)||'animation')+'.s5-animation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Export JSON demandé. Vérifie les téléchargements du navigateur.');
};
$('import-project').onclick=()=>$('project-file').click();
$('project-file').onchange=async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{if(file.size>12_000_000)throw Error('Fichier trop volumineux (12 Mo maximum).');const data=validateProject(JSON.parse(await file.text()));if(!replaceConfirmed())return;await installProject(data);}catch(error){handleError(error);}
};
$('show-skeleton').onchange=e=>{if(avatar)avatar.helper.visible=e.target.checked;};
$('show-weapon').onchange=e=>{for(const m of avatar.meshes)if(m.userData.weapon)m.visible=e.target.checked;};
function view(position){camera.position.set(...position);orbit.target.set(0,1.05,0);orbit.update();}
$('view-front').onclick=()=>view([0,1.5,-5]);$('view-back').onclick=()=>view([0,1.5,5]);$('view-side').onclick=()=>view([5,1.5,0]);$('view-reset').onclick=()=>view([3,2.1,-4.4]);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch(error){handleError(error);}};
document.addEventListener('keydown',e=>{
 if(!project)return;
 if(e.key==='Alt'&&!gizmo.dragging){e.preventDefault();altHeld=true;syncSelectionMode();return;}
 if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'){e.preventDefault();save();return;}
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}
 else if(e.code==='Space'){e.preventDefault();$('play-animation').click();}
 else if(e.code==='ArrowLeft'){e.preventDefault();$('previous-frame').click();}
 else if(e.code==='ArrowRight'){e.preventDefault();$('next-frame').click();}
});
document.addEventListener('keyup',e=>{if(e.key==='Alt'){e.preventDefault();altHeld=false;syncSelectionMode();}});
window.addEventListener('blur',()=>{altHeld=false;pointerStart=null;syncSelectionMode();});
window.addEventListener('beforeunload',e=>{if(unsaved){e.preventDefault();e.returnValue='';}});
new ResizeObserver(()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(stage);
view([3,2.1,-4.4]);
let previous=performance.now();
renderer.setAnimationLoop(now=>{
 const dt=Math.min((now-previous)/1000,.1);previous=now;
 if(project&&avatar){
  if(playing){time+=dt*Number($('playback-rate').value);if(time>project.duration){if(project.loop)time%=project.duration;else{time=project.duration;pause();}}
   applyPose(avatar.bones,sampleProject(project,time));updateTime();
  }
  avatar.group.updateMatrixWorld(true);
  for(const d of dots){d.visible=$('show-joints').checked&&($('advanced-joints').checked||isPrimaryJoint(d.userData.bone));avatar.bones.get(d.userData.bone).getWorldPosition(d.position);}
 }
 orbit.update();renderer.render(scene,camera);
});
try{
 let draft=null;
 try{const raw=localStorage.getItem(storageKey);if(raw)draft=validateProject(JSON.parse(raw));}catch{status('Le brouillon précédent est illisible. Un projet neuf sera ouvert.',true);}
 await loadActor(draft?.sex||'male',draft?.outfit||'01');
 if(draft){try{checkBones(draft);project=draft;}catch{draft=null;project=newProject(neutral,{sex:avatar.sex,outfit:$('actor-outfit').value});}}
 else project=newProject(neutral);
 syncProject();status(draft?'Brouillon restauré. Tu peux reprendre ton animation.':'Prêt. Pars de zéro ou copie une animation existante.');
}catch(error){handleError(error);}
