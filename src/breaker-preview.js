import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { loadAvatar } from './avatar.js';
import { BreakerPreviewCombat } from './breaker-combat-preview.js';
import { BreakerPreviewMotion } from './breaker-preview-motion.js';
import './breaker-preview.css';

const CLIPS=['HM001','HM002','HM004','HM005','HM006','HM007','HM016','HM017','SG018','SG019','SG020','SG021','SG022','SG023','SG024','SG025'];
const $=id=>document.getElementById(id),panels=[];
let playing=true,ready=false,elapsed=0,duration=1;
let combatPaused=false;
const combat=new BreakerPreviewCombat();
const sounds=new Map(['breaker_smash','breaker_big_smash','breaker_jump','breaker_hit'].map(name=>[name,new Audio(`/assets/s5runtime/sound/${name}.ogg`)]));

for(const name of CLIPS){const option=document.createElement('option');option.value=option.textContent=name;$('clip').append(option);}

function panel(sex){
  const host=$(sex),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#122735');scene.add(new THREE.HemisphereLight(0xe9faff,0x26323b,2.6));
  const light=new THREE.DirectionalLight(0xffffff,3.2);light.position.set(-3,6,-4);scene.add(light);scene.add(new THREE.GridHelper(7,14,0x4b8590,0x274652));
  const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,1.3,-7.5);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.05,0);orbit.enableDamping=true;orbit.update();
  const obstacle=new THREE.Mesh(new THREE.BoxGeometry(8,3,.1),new THREE.MeshBasicMaterial({color:0xdba759,transparent:true,opacity:.25,depthWrite:false}));
  obstacle.position.set(0,1.5,-.7);obstacle.visible=false;scene.add(obstacle);
  const item={sex,host,renderer,scene,camera,orbit,avatar:null,obstacle,movement:new BreakerPreviewMotion({sex})};panels.push(item);
  new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}).observe(host);
}
panel('male');panel('female');

function selectClip(name){
  combat.reset();
  frameAir(false);
  elapsed=0;
  const mode=$('mode').value,lower=name.startsWith('SG')?name:'SG018',upper=mode==='right'?'HM006':'HM007';
  for(const p of panels){
    p.avatar.group.position.set(0,0,0);
    if(mode==='full'){
      p.avatar.play(name,{loop:true,fade:0,restart:true});
      p.previewActions=[p.avatar.actions.get(name)];
    }else{
      p.avatar.motion({clip:upper,lower,time:0,loop:true,fade:0,speed:1,lowerSpeed:1,restartKey:`preview-${mode}-${lower}`});
      p.previewActions=[p.avatar.actions.get(`${upper}:upper`),p.avatar.actions.get(`${lower}:lower`)];
    }
    p.avatar.mixer.update(0);
  }
  duration=Math.max(...panels[0].previewActions.map(action=>action.getClip().duration));
  $('time').max=duration;$('time').value=0;$('clock').textContent=`0.000 / ${duration.toFixed(3)} s`;
}
function sample(time){
  if(combat.action)combat.reset();
  elapsed=THREE.MathUtils.clamp(time,0,duration);
  for(const p of panels){for(const action of p.previewActions)action.time=elapsed%action.getClip().duration;p.avatar.mixer.update(0);p.avatar.group.updateMatrixWorld(true);}
  $('time').value=elapsed;$('clock').textContent=`${elapsed.toFixed(3)} / ${duration.toFixed(3)} s`;
}
function view(side){for(const p of panels){p.camera.position.set(side?7.5:0,1.3,side?0:-7.5);p.orbit.target.set(0,1.05,0);p.orbit.update();}}
function frameAir(active){for(const p of panels){p.camera.position.set(0,active?4.5:1.3,active?-18:-7.5);p.orbit.target.set(0,active?4.5:1.05,0);p.orbit.update();}}
function combatEvents(events){for(const event of events){
  if(event.clip){for(const p of panels){p.avatar.play(event.clip,{loop:false,fade:.04,restart:true,speed:event.speed||1});p.previewActions=[p.avatar.actions.get(event.clip)];}duration=Math.max(...panels.map(p=>p.avatar.actions.get(event.clip).getClip().duration));elapsed=0;}
  if(event.sound){const audio=sounds.get(event.sound);audio.currentTime=0;audio.play().catch(()=>{});}
  $('combat-status').textContent=event.type==='hit'?`${event.kind} · porte native > ${event.thresholdMs} ms, déclenchée à ${event.elapsedMs.toFixed(1)} ms`:event.type==='complete'?`${event.kind} · récupération terminée`:`${event.kind} · ${event.clip||event.type}`;
}}
function startCombat(kind){if(!ready)return;const events=combat.start(kind);if(events.length){
  // Each isolated trial starts from the attack's first evaluated pose, never
  // from an arbitrary looping inspector frame. Phase changes still crossfade.
  playing=false;$('play').textContent='Lire';for(const p of panels)p.avatar.prepareSwitch();combatEvents(events);frameAir(kind==='jump');
  for(const p of panels){p.avatar.update(0);p.movement.begin(kind,p.avatar.bones.get('MoveBox').position);p.avatar.group.position.copy(p.movement.controller.position);}
  $('time').max=duration;$('time').value=0;$('clock').textContent=`0.000 / ${duration.toFixed(3)} s`;
  if(kind==='jump')$('motion-status').textContent='Départ aérien de test : 5 unités S5 ; attente avant chute artificielle.';
  else $('motion-status').textContent='Départ au sol : x 0, y 0, z 0 · déplacement MoveBox · aucun canal de chute.';
}}

$('terrain').onchange=()=>{
  if(!ready)return;const wall=$('terrain').value==='wall';
  for(const p of panels){p.movement=new BreakerPreviewMotion({sex:p.sex,wall});p.obstacle.visible=wall;}
  selectClip($('clip').value);$('motion-status').textContent='Terrain changé · chaque attaque repart de l’origine.';
};

$('clip').onchange=()=>selectClip($('clip').value);
$('mode').onchange=()=>selectClip($('clip').value);
$('play').onclick=()=>{combat.reset();playing=!playing;$('play').textContent=playing?'Pause':'Lire';};
$('first').onclick=()=>{playing=false;$('play').textContent='Lire';sample(0);};
$('time').oninput=event=>{playing=false;$('play').textContent='Lire';sample(+event.target.value);};
$('skeleton').onchange=()=>panels.forEach(p=>p.avatar.helper.visible=$('skeleton').checked);
$('front').onclick=()=>view(false);$('side').onclick=()=>view(true);
$('attack-weak').onclick=()=>startCombat('weak');$('attack-strong').onclick=()=>startCombat('strong');$('attack-jump').onclick=()=>startCombat('jump');
$('combat-pause').onclick=()=>{combatPaused=!combatPaused;$('combat-pause').textContent=combatPaused?'Reprendre diagnostic':'Pause diagnostic';};
$('combat-step').onclick=()=>{combatPaused=true;$('combat-pause').textContent='Reprendre diagnostic';advanceCombat(.01);};

try{
  for(const p of panels){
    p.avatar=await loadAvatar({sex:p.sex,weapon:'breaker',weaponSkin:'classic',animationDelta:`/assets/s5runtime/animations/breaker/${p.sex}.json`,initialClip:'HM001'});
    p.scene.add(p.avatar.group,p.avatar.helper);
    const weapons=p.avatar.meshes.filter(mesh=>mesh.userData.weapon);
    if(!p.avatar.bones.has('L_Hand_Dummy')||!p.avatar.bones.has('MoveBox')||weapons.length===0)throw Error(`${p.sex}: attache, MoveBox ou modèle Breaker invalide`);
    $(`${p.sex}-proof`).textContent=`L_Hand_Dummy ✓ · poignée alignée par Sword_Wea_Dummy⁻¹ · ${weapons.length} maillages · ${CLIPS.length} clips`;
  }
  selectClip('HM001');ready=true;$('status').textContent='Prêt · même chargeur de rig, modèle, skinning et animation que le jeu.';
}catch(error){$('status').textContent=`Échec : ${error.message}`;$('status').style.color='#ff9a86';}

function advanceCombat(combatDt){
  if(!ready||!combat.action)return;
    // Preview-local ordering choice: evaluated animation + drop physics first,
    // then the combat-state clock. S5Runtime's global frame ordering is unproven.
    const labels=[];
    for(const p of panels){
      p.avatar.update(combatDt);
      const trace=p.movement.advance(combatDt,p.avatar.bones.get('MoveBox').position);
      p.avatar.group.position.copy(p.movement.controller.position);
      labels.push(`${p.sex} : x ${trace.position.x.toFixed(3)}, y ${trace.position.y.toFixed(3)}, z ${trace.position.z.toFixed(3)} · vy ${p.movement.controller.velocity.y.toFixed(2)}${trace.drop?` · chute ${trace.drop.active?'active':trace.drop.contactAdapted?'contact':'attente'} à ${trace.drop.elapsedMs.toFixed(1)} ms`:''} · ${p.movement.blockedSteps} pas limités`);
    }
    $('motion-status').textContent=labels.join(' / ');
    combatEvents(combat.step(combatDt));
    const action=panels[0].previewActions[0];
    duration=action.getClip().duration;elapsed=action.time;
    $('time').max=duration;$('time').value=elapsed;$('clock').textContent=`${elapsed.toFixed(3)} / ${duration.toFixed(3)} s`;
}
let previous=performance.now();
function render(now){
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(ready&&combat.action&&dt>0&&!combatPaused)advanceCombat(dt);
  else if(ready&&playing)sample((elapsed+dt)%duration);
  for(const p of panels){p.orbit.update();p.renderer.render(p.scene,p.camera);}requestAnimationFrame(render);
}
requestAnimationFrame(render);
