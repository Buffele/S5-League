import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadAvatar} from './avatar.js';
import {catalogEntry,filterCatalog} from './animation-catalog-data.js';
import './animation-catalog.css';

const $=id=>document.getElementById(id),panels=[];
let entries=[],playing=false,loading=false;
const message=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
function pause(){playing=false;$('play').textContent='Lire les deux';}
function detail(panel,entry){
  const target=$(`details-${panel.id}`);target.replaceChildren();
  const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;target.append(el);};
  add('strong',entry.label);add('p',`Geste : ${entry.gestureStatus} · Usage : ${entry.usageStatus}`);
  add('p',entry.usage);if(entry.notes)add('p',entry.notes);
  add('p',`Source : ${entry.source} · ${entry.tracks} pistes · ${entry.aliases.length} alias d’os`);
  add('p',`Disponible : ${entries.filter(e=>e.clip===entry.clip).map(e=>e.sex==='male'?'masculin':'féminin').join(', ')}`);
  if(entry.rootRange)add('p',`Amplitude locale Bip01 (unités source, pas mètres) : ${entry.rootRange.map(n=>n.toFixed(2)).join(' / ')}`);
  if(entry.evidence.length)add('pre','Indices / observations :\n'+entry.evidence.join('\n'));
  if(entry.nativeReferences.length)add('pre','Paramètres natifs chargés (pas une trace vidéo synchronisée ; pas une validation visuelle par sexe) :\n'+entry.nativeReferences.map(r=>
    `${r.context} — paramètre ${r.parameterIndex}\nFondu entrant de base : ${r.blendMs.toFixed(1)} ms ; supplément au prochain fondu : ${r.nextBlendExtraMs.toFixed(1)} ms\nVitesse stockée : ${r.baseSpeed} ; durée imposée : ${r.durationArgument}\nBoucle : ${r.loop?'oui':'non'} ; redémarrage demandé : ${r.reset?'oui':'non'}\n${r.source} · sélection ${r.selectionAddress} → lecture ${r.playAddress}`
  ).join('\n\n'));
  if(entry.references.length)add('pre','Références de script (paramètres bruts, unités non déduites) :\n'+entry.references.map(r=>`${r.source}:${r.line}\n${r.context} — ${r.parameter}\nSetAnim(${entry.clip}, ${r.arguments})`).join('\n\n'));
  if(entry.aliases.length)add('pre','Alias par os :\n'+entry.aliases.map(a=>`${a.bone} → ${a.target}`).join('\n'));
}
function sample(panel,time){
  if(!panel.action)return;
  panel.time=THREE.MathUtils.clamp(time,0,panel.clip.duration);
  panel.action.time=panel.time;panel.avatar.mixer.update(0);panel.avatar.group.updateMatrixWorld(true);
  $(`time-${panel.id}`).value=panel.time;
  $(`clock-${panel.id}`).textContent=`${panel.time.toFixed(3)} / ${panel.clip.duration.toFixed(3)} s`;
}
function select(panel,entry){
  if(loading||!panel.avatar)return;pause();
  const clip=panel.avatar.clips.find(c=>c.name===entry.clip);
  if(!clip){message(`Clip absent du personnage : ${entry.id}`,true);return;}
  panel.avatar.mixer.stopAllAction();panel.clip=clip;panel.entry=entry;
  panel.action=panel.avatar.mixer.clipAction(clip);panel.action.reset().setLoop(THREE.LoopOnce,1);
  panel.action.clampWhenFinished=true;panel.action.setEffectiveWeight(1).play();
  $(`title-${panel.id}`).textContent=entry.clip;
  $(`time-${panel.id}`).max=clip.duration;sample(panel,0);detail(panel,entry);
}
function list(){
  const filtered=filterCatalog(entries,{sex:$('sex').value,query:$('search').value,category:$('category').value,status:$('status-filter').value});
  $('count').textContent=`${filtered.length} clips affichés / ${entries.filter(e=>e.sex===$('sex').value).length} pour ce personnage`;
  $('library').replaceChildren();
  for(const entry of filtered){
    const row=document.createElement('div');row.className='entry';
    const title=document.createElement('div');title.textContent=entry.clip+' · '+entry.label;
    const info=document.createElement('small');info.textContent=`${entry.duration.toFixed(3)} s · geste ${entry.gestureStatus}`;
    row.append(title,info);
    for(const panel of panels){const b=document.createElement('button');b.textContent=panel.id.toUpperCase();b.disabled=loading;b.setAttribute('aria-label',`${entry.clip} dans ${panel.id.toUpperCase()}`);b.onclick=()=>select(panel,entry);row.append(b);}
    $('library').append(row);
  }
}
function makePanel(id){
  const host=$(`view-${id}`),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#1b293c');
  scene.add(new THREE.HemisphereLight(0xe4efff,0x565064,2.5));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,6,4);scene.add(light);
  scene.add(new THREE.GridHelper(8,16,0x90abc7,0x3e5067));
  const camera=new THREE.PerspectiveCamera(38,1,.01,100);camera.position.set(0,1.4,-5.5);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.05,0);orbit.update();
  new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}).observe(host);
  const panel={id,renderer,scene,camera,orbit,time:0};panels.push(panel);
  $(`time-${id}`).oninput=e=>{pause();sample(panel,+e.target.value);};
}
function dispose(panel){
  if(!panel.avatar)return;
  panel.avatar.mixer.stopAllAction();panel.avatar.mixer.uncacheRoot(panel.avatar.rig);
  panel.scene.remove(panel.avatar.group,panel.avatar.helper);
  const geometries=new Set(),materials=new Set(),textures=new Set();
  panel.avatar.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
  panel.avatar.helper.dispose();panel.avatar=null;panel.action=null;
}
async function loadSex(){
  loading=true;pause();$('sex').disabled=true;list();message('Chargement des deux aperçus originaux…');
  try{
    for(const panel of panels){
      const avatar=await loadAvatar({sex:$('sex').value});dispose(panel);panel.avatar=avatar;
      panel.scene.add(avatar.group,avatar.helper);avatar.helper.visible=$('skeleton').checked;
      for(const mesh of avatar.meshes)if(mesh.userData.weapon)mesh.visible=false;
    }
    loading=false;
    for(const panel of panels){const name=panel.entry?.clip||(panel.id==='a'?'00000':'00003');
      select(panel,entries.find(e=>e.sex===$('sex').value&&e.clip===name)||entries.find(e=>e.sex===$('sex').value));}
    message('Prêt · lecture directe des pistes originales, sans fondu ni copie simplifiée.');
  }catch(e){message('Chargement impossible : '+e.message,true);for(const p of panels)dispose(p);}
  finally{loading=false;$('sex').disabled=false;list();}
}
for(const id of ['a','b'])makePanel(id);
$('sex').onchange=loadSex;
for(const id of ['search','category','status-filter'])$(id).oninput=list;
$('play').onclick=()=>{if(loading||panels.some(p=>!p.action))return;playing=!playing;$('play').textContent=playing?'Pause':'Lire les deux';};
$('first').onclick=()=>{pause();panels.forEach(p=>sample(p,0));};
$('last').onclick=()=>{pause();sample(panels[0],panels[0].clip?.duration||0);sample(panels[1],0);};
for(const [id,step] of [['previous',-1/60],['next',1/60]])$(id).onclick=()=>{pause();panels.forEach(p=>sample(p,p.time+step));};
$('skeleton').onchange=()=>panels.forEach(p=>{if(p.avatar)p.avatar.helper.visible=$('skeleton').checked;});
for(const id of ['front','side'])$(id).onclick=()=>panels.forEach(p=>{p.camera.position.set(id==='side'?5.5:0,1.4,id==='side'?0:-5.5);p.orbit.target.set(0,1.05,0);p.orbit.update();});
let previous=performance.now();
function render(now){const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(playing){for(const p of panels){let t=p.time+dt*+$('rate').value;if($('loop').checked)t%=p.clip.duration;sample(p,t);}if(!$('loop').checked&&panels.every(p=>p.time>=p.clip.duration))pause();}
  for(const p of panels){p.orbit.update();p.renderer.render(p.scene,p.camera);}requestAnimationFrame(render);
}requestAnimationFrame(render);
try{
  const responses=await Promise.all(['/assets/animation-catalog.json','/assets/animation-catalog-annotations.json'].map(url=>fetch(url)));
  if(responses.some(r=>!r.ok))throw Error('Inventaire absent ; lancer npm run catalog:build.');
  const [catalog,annotations]=await Promise.all(responses.map(r=>r.json()));
  entries=catalog.entries.map(e=>catalogEntry(e,annotations));await loadSex();
}catch(e){message(e.message,true);}
