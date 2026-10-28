import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadAvatar} from './avatar.js';
import {SPY_DAGGER_LOCOMOTION as source} from './spy-dagger-data.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
$('sex').value='male';$('cadence').value=['32','40','48'].includes(params.get('cadence'))?params.get('cadence'):'40';
const renderer=new T.WebGLRenderer({canvas:$('comparison'),antialias:true});renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio,1.5)));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;
const camera=new T.PerspectiveCamera(36,1,.05,100),orbit=new OrbitControls(camera,$('comparison'));orbit.enableDamping=true;orbit.enablePan=false;orbit.target.set(0,1,0);
const grids=[];
const scenes=[0,1].map(()=>{const s=new T.Scene();s.background=new T.Color('#b6cbd9');s.add(new T.HemisphereLight(0xe9f5ff,0x938772,2.5));const l=new T.DirectionalLight(0xfff3df,2.8);l.position.set(4,8,3);s.add(l);const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xc6bcaa,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;s.add(floor);const grid=new T.GridHelper(100,100,0x8b9c9e,0xaab4ac);s.add(grid);grids.push(grid);return s;});
let actors=[],mixers=[],actions=[],bundle,time=0,paused=false,loading=true,last=performance.now(),revision=0;
const views={side:[6,1.5,0],front:[0,1.6,6],back:[0,1.6,-6]};
function setView(v){camera.position.set(...views[v]);orbit.target.set(0,1,0);orbit.update();}setView('side');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function renderPose(){
 if(loading||!bundle)return;
 const t=((time%bundle.duration)+bundle.duration)%bundle.duration;
 actions.forEach((a,i)=>{a.time=t;mixers[i].update(0);actors[i].group.updateMatrixWorld(true);});
 const near=bundle.anchors.some(a=>Math.abs(a-t)<.008);
 $('phase-label').textContent=near?'Pose S5Runtime imposée':'Pose intermédiaire reconstruite';
 $('pose-label').textContent=`Cycle ${(t/bundle.duration*100).toFixed(0)} % · ${near?'repère imposé':'entre deux repères'}`;
 $('timeline').value=Math.round(t/bundle.duration*1000);
 grids.forEach(g=>g.position.z=-(time*(bundle.timing?.estimatedTravelSpeed??0))%1);
 const diagnostic={sex:$('sex').value,time:t,phase:t/bundle.duration,paused,source:bundle.source,model:bundle.model,timing:bundle.timing,anchors:bundle.anchors,generatedSamples:bundle.times.length,nearAnchor:near};
 $('diagnostics').textContent=JSON.stringify(diagnostic,null,2);$('diagnostics').dataset.comparison=JSON.stringify(diagnostic);
}
async function load(){
 const id=++revision;loading=true;$('status').textContent='Chargement des personnages et de la reconstruction…';
 try{
  const sex=$('sex').value,response=await fetch(`/assets/animations/phasebetweener-trial/${sex}-${$('cadence').value}.json`);if(!response.ok)throw Error(`Cette cadence est en cours de préparation. Choisir 1,33 s en attendant.`);const data=await response.json();
  const results=await Promise.all([loadAvatar({appearance:'s5runtime',sex,outfit:'01',weapon:'dagger'}),loadAvatar({appearance:'s5runtime',sex,outfit:'01',weapon:'dagger'})]);
  if(id!==revision){results.forEach(a=>a.dispose());return;}
  actors.forEach((a,i)=>{scenes[i].remove(a.group);a.dispose();});actors=results;bundle=data;mixers=[];actions=[];
  actors.forEach((a,i)=>{a.prepareSwitch();a.mixer.stopAllAction();a.group.rotation.y=Math.PI;for(const m of a.meshes)if(m.userData.weapon)m.visible=false;scenes[i].add(a.group);
   const upper=a.actions.get(source.run.front+':upper').getClip(),lower=a.actions.get(source.runLower.front+':lower').getClip();
   const original=new T.AnimationClip('NATIVE_FORWARD',data.duration,[...upper.tracks,...lower.tracks].map(t=>t.clone().scale(data.duration/data.nativeDuration)));
   const tracks=i===0?original.tracks:[...Object.entries(data.bones).flatMap(([n,p])=>{const b=a.bones.get(n);if(!b)throw Error(`Missing target ${n}`);return[new T.VectorKeyframeTrack(`${b.uuid}.position`,data.times,p.position),new T.QuaternionKeyframeTrack(`${b.uuid}.quaternion`,data.times,p.quaternion)];}),...original.tracks.filter(t=>t.name.endsWith('.scale'))];
   const clip=new T.AnimationClip(i?'CONDITIONED_FORWARD':'NATIVE_FORWARD',data.duration,tracks),mixer=new T.AnimationMixer(a.rig),action=mixer.clipAction(clip).setLoop(T.LoopRepeat,Infinity).play();mixers.push(mixer);actions.push(action);
  });
  time=0;loading=false;renderPose();$('status').classList.remove('error');$('status').textContent=`Essai de cadence : ${data.duration.toFixed(2)} s par cycle, contre ${data.nativeDuration.toFixed(2)} s à l’origine. Sol défilant estimé à ${data.timing.estimatedTravelSpeed.toFixed(2)} unités/s ; aucun réglage du jeu principal.`;
  const url=new URL(location.href);url.searchParams.set('sex',sex);url.searchParams.set('cadence',$('cadence').value);history.replaceState(null,'',url);
 }catch(e){loading=true;$('status').textContent=e.message;$('status').classList.add('error');console.error(e);}
}
$('sex').onchange=load;$('cadence').onchange=load;$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Reprendre':'Pause';};$('restart').onclick=()=>{time=0;renderPose();};
$('timeline').oninput=()=>{if(loading||!bundle)return;paused=true;$('pause').textContent='Reprendre';time=Number($('timeline').value)/1000*bundle.duration;renderPose();};
function anchor(step){if(!bundle)return;paused=true;$('pause').textContent='Reprendre';const t=((time%bundle.duration)+bundle.duration)%bundle.duration,anchors=bundle.anchors.slice(0,-1);time=step>0?(anchors.find(a=>a>t+.001)??bundle.duration):(anchors.filter(a=>a<t-.001).at(-1)??anchors.at(-1));renderPose();}
$('previous-anchor').onclick=()=>anchor(-1);$('next-anchor').onclick=()=>anchor(1);
$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
let viewportWidth=0,viewportHeight=0;
renderer.setAnimationLoop(now=>{const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused&&!loading)time+=dt*Number($('speed').value);renderPose();orbit.update();const w=$('comparison').clientWidth,h=$('comparison').clientHeight;if(w!==viewportWidth||h!==viewportHeight){renderer.setSize(w,h,false);viewportWidth=w;viewportHeight=h;}const half=Math.floor(w/2);renderer.setScissorTest(true);for(let i=0;i<2;i++){const width=i?w-half:half;camera.aspect=width/h;camera.updateProjectionMatrix();renderer.setViewport(i*half,0,width,h);renderer.setScissor(i*half,0,width,h);renderer.render(scenes[i],camera);}renderer.setScissorTest(false);});
load();
