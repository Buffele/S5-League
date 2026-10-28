import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadAvatar} from './avatar.js';
import {MIND_ENERGY_QA_LANE as LANE} from './mind-energy-qa-lane.js';
import './breaker-preview.css';

const $=id=>document.getElementById(id),panels=[];
let ready=false,playing=true,previous=performance.now(),state=LANE.runtime.createState(),moving=false,direction='front';
for(const id of LANE.directions){const option=new Option(id,id);$('direction').append(option);}

function panel(sex){
  const host=$(sex),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#102631');scene.add(new THREE.HemisphereLight(0xe9fbff,0x23323b,2.6));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,5,-4);scene.add(key,new THREE.GridHelper(7,14,0x3d8290,0x274550));
  const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,1.3,-7.5);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.05,0);orbit.enableDamping=true;orbit.update();
  const value={sex,host,renderer,scene,camera,orbit,avatar:null,weapons:[]};panels.push(value);new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}).observe(host);
}
LANE.sexes.forEach(panel);

function proof(value,sample){
  value.avatar.group.updateMatrixWorld(true);const forearm=value.avatar.bones.get(LANE.assertions.activeAttachment);
  const attached=value.weapons.filter(mesh=>{for(let node=mesh;node;node=node.parent)if(node===forearm)return true;return false;});
  if(attached.length!==LANE.assertions.weaponMeshes)throw Error(`${value.sex}: attache post-mixer invalide`);
  const finite=attached.every(mesh=>forearm.matrixWorld.clone().invert().multiply(mesh.matrixWorld).elements.every(Number.isFinite));if(!finite)throw Error(`${value.sex}: transform non fini`);
  $(`${value.sex}-proof`).textContent=`${LANE.assertions.activeAttachment} post-mixer ✓ · ${sample.clip}`;
}
function applyMotion(){
  if(!ready)return;const sample=LANE.runtime.motionSample(state,direction,moving);
  for(const value of panels){if(sample.lower)value.avatar.motion({...sample,fade:.08,lowerSpeed:sample.speed});else value.avatar.play(sample.clip,{loop:sample.loop,fade:.08,speed:sample.speed});value.avatar.mixer.update(0);proof(value,sample);}
  $('status').textContent=`Prêt · ${state.phase} · munitions ${state.ammo}/${state.profile.capacity}`;
}
$('moving').onchange=event=>{moving=event.target.checked;applyMotion();};$('direction').onchange=event=>{direction=event.target.value;applyMotion();};
$('attack').onpointerdown=event=>{$('attack').setPointerCapture?.(event.pointerId);$('attack').dataset.held='1';};
const release=()=>{$('attack').dataset.held='0';};$('attack').onpointerup=release;$('attack').onpointercancel=release;$('attack').onpointerleave=release;
$('reset').onclick=()=>{state=LANE.runtime.createState();applyMotion();};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause':'Lire';};

try{
  for(const value of panels){value.avatar=await loadAvatar({sex:value.sex,weapon:LANE.weapon,weaponAssetPath:LANE.assets.model,animationDelta:LANE.animationEvidence(value.sex),initialClip:LANE.profile.idle,diagnosticMaterial:LANE.assertions.diagnosticMaterial});value.scene.add(value.avatar.group,value.avatar.helper);value.weapons=value.avatar.meshes.filter(mesh=>mesh.userData.weapon);if(!value.avatar.bones.has(LANE.assertions.activeAttachment)||value.weapons.length!==LANE.assertions.weaponMeshes)throw Error(`${value.sex}: modèle ou socket absent`);}
  ready=true;applyMotion();
}catch(error){$('status').textContent=`Échec : ${error.message}`;$('status').style.color='#ff9a86';console.error(error);}

function render(now){
  const dt=Math.min(now-previous,50);previous=now;
  if(ready&&playing){const before=state.phase;LANE.runtime.advance(state,dt,{attackHeld:$('attack').dataset.held==='1'});if(before!==state.phase)applyMotion();for(const value of panels){value.avatar.update(dt/1000);proof(value,LANE.runtime.motionSample(state,direction,moving));}$('status').textContent=`Prêt · ${state.phase} · munitions ${state.ammo}/${state.profile.capacity}`;}
  for(const value of panels){value.orbit.update();value.renderer.render(value.scene,value.camera);}requestAnimationFrame(render);
}
requestAnimationFrame(render);
