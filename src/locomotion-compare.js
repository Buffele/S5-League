import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadAvatar} from './avatar.js';
import {Controller,TUNING} from './controller.js';
import {MotionGraph,localDirection} from './motion-graph.js';
import {setAvatarFacing} from './view-orientation.js';
import {PoseBuffer} from './pose-buffer.js';
import {SimulationClock} from './simulation-clock.js';
import {comparisonCircle,comparisonDirection,COMPARISON_DIRECTIONS,COMPARISON_DIRECTION_LABELS} from './locomotion-comparison-path.js';
import './locomotion-compare.css';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
$('sex').value=params.get('sex')==='female'?'female':'male';
$('variant').value=['blenderBold','blenderTrial','smooth'].includes(params.get('variant'))?params.get('variant'):'blenderBold';
$('speed').value=['0.25','0.5','1'].includes(params.get('speed'))?params.get('speed'):'1';
const renderer=new THREE.WebGLRenderer({canvas:$('comparison'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.NeutralToneMapping;
const camera=new THREE.PerspectiveCamera(36,1,.05,240),orbit=new OrbitControls(camera,$('comparison'));
orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=3;orbit.maxDistance=14;orbit.maxPolarAngle=Math.PI*.49;
const scenes=[0,1].map(()=>{
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b6d0df');scene.fog=new THREE.Fog('#b6d0df',32,100);
 scene.add(new THREE.HemisphereLight(0xe5f3ff,0x9f9278,2.4));
 const key=new THREE.DirectionalLight(0xfff3df,2.8);key.position.set(7,14,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
 Object.assign(key.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:70});key.shadow.normalBias=.025;scene.add(key);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xd0c7ae,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(160,160,0x8b9c9e,0xaab4ac);grid.position.y=-.01;scene.add(grid);
 const radius=TUNING.walk*12/(Math.PI*2),points=Array.from({length:129},(_,i)=>new THREE.Vector3(Math.cos(i/128*Math.PI*2)*radius,.005,Math.sin(i/128*Math.PI*2)*radius));
 scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x749d94,transparent:true,opacity:.7})));
 return scene;
});
const controller=new Controller(undefined,{weapon:'dagger',sex:$('sex').value});
const graphs=[new MotionGraph(),new MotionGraph()],clock=new SimulationClock();graphs[1].runStyle=$('variant').value;
let actors=[],buffers=[],mode=COMPARISON_DIRECTIONS.includes(params.get('direction'))?'fixed':'circle',fixedDirection=COMPARISON_DIRECTIONS.includes(params.get('direction'))?params.get('direction'):'front',elapsed=0,paused=false,loading=true,loadRevision=0,last=performance.now(),lastDirection='',lastInfo=0;
const follow=new THREE.Vector3();
const views={threeQuarter:[3.4,2.1,5.4],front:[0,1.7,6],side:[6,1.7,0],back:[0,1.7,-6]};
let currentView=Object.hasOwn(views,params.get('view'))?params.get('view'):'threeQuarter';
function cameraView(view){currentView=view;const p=actors[0]?.group.position||new THREE.Vector3();follow.copy(p);orbit.target.copy(p).add(new THREE.Vector3(0,1,0));camera.position.copy(p).add(new THREE.Vector3(...views[view]));orbit.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
cameraView(currentView);
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function syncLabels(direction){
 const trial=$('variant').value==='blenderTrial',bold=$('variant').value==='blenderBold';
 $('variant-title').textContent=bold?'V2 athlétique':trial?'V1 · retouche légère':'Courbes lissées';
 $('scope').textContent=bold?'Blender V2 : nouvelle posture, bras et récupération des jambes sur les huit directions. Essai réversible.':trial?'V1 : seule la marche avant est légèrement retravaillée. Les sept autres directions restent classiques.':'Lissage : les courbes des huit directions sont adoucies ; les poses sources sont conservées.';
 $('variant-active').textContent=mode==='idle'?'Même pose de repos':bold?'Nouvelles poses · 8 directions':trial&&direction!=='front'?'Direction classique conservée':trial?'Poses légèrement retravaillées':'Lissage actif';
 $('direction').textContent=mode==='idle'?'Repos':COMPARISON_DIRECTION_LABELS[direction];
 $('mode-hint').textContent=mode==='circle'?'Un tour en 12 secondes à vitesse normale.':mode==='idle'?'Les deux personnages restent au repos.':'Direction maintenue · animation sur place.';
 $('circle').setAttribute('aria-pressed',String(mode==='circle'));$('idle').setAttribute('aria-pressed',String(mode==='idle'));
 document.querySelectorAll('[data-direction]').forEach(b=>{b.classList.toggle('is-current',mode!=='idle'&&b.dataset.direction===direction);b.setAttribute('aria-pressed',String(mode==='fixed'&&b.dataset.direction===fixedDirection));});
}
function samplePath(){return mode==='circle'?comparisonCircle(elapsed,TUNING.walk):mode==='fixed'?comparisonDirection(fixedDirection,TUNING.walk):{position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},facing:0};}
function tick(dt){
 if(loading||!actors.length)return;
 elapsed+=dt;const path=samplePath();
 Object.assign(controller,{position:path.position,velocity:path.velocity,facing:0,grounded:true,state:mode==='idle'?'idle':'run'});
 const direction=localDirection(path.velocity.x,path.velocity.z,0);
 for(let i=0;i<actors.length;i++){
  buffers[i].beginTick();actors[i].group.position.set(path.position.x,0,path.position.z);setAvatarFacing(actors[i].group,0);
  actors[i].motion(graphs[i].sample(controller,dt));actors[i].update(dt);buffers[i].endTick();
 }
 if(direction!==lastDirection){lastDirection=direction;syncLabels(direction);}
}
function updateDiagnostics(){if(!actors.length)return;const info={mode,sex:controller.sex,direction:mode==='idle'?'idle':localDirection(controller.velocity.x,controller.velocity.z,0),facing:0,elapsed,paused,original:actors[0].clip,experiment:actors[1].clip,originalTimes:actors[0].playbackTimes(),experimentTimes:actors[1].playbackTimes(),position:{...controller.position},orientations:actors.map(a=>a.group.quaternion.toArray())};$('diagnostics').textContent=JSON.stringify(info,null,2);$('diagnostics').dataset.comparison=JSON.stringify(info);}
function reset(){elapsed=0;clock.clear();lastDirection='';for(const g of graphs)g.reset();for(const a of actors)a.prepareSwitch();for(const b of buffers)b.reset();tick(0);for(const b of buffers)b.reset();cameraView(currentView);syncLabels(localDirection(controller.velocity.x,controller.velocity.z,0));updateDiagnostics();}
async function loadActors(){
 const revision=++loadRevision;loading=true;clock.clear();$('pause').disabled=$('restart').disabled=true;status('Chargement des deux personnages…');
 const sex=$('sex').value;
 const results=await Promise.allSettled([0,1].map(()=>loadAvatar({appearance:'s5runtime',sex,outfit:'01',weapon:'dagger',weaponSkin:'classic'})));
 const fulfilled=results.filter(r=>r.status==='fulfilled').map(r=>r.value),failure=results.find(r=>r.status==='rejected');
 if(revision!==loadRevision){fulfilled.forEach(a=>a.dispose());return;}
 if(failure){fulfilled.forEach(a=>a.dispose());loading=false;status('Chargement impossible : '+failure.reason.message,true);return;}
 actors.forEach(a=>a.dispose());actors=fulfilled;
 actors.forEach((actor,i)=>scenes[i].add(actor.group));buffers=actors.map(a=>new PoseBuffer([a.group,a.rig,...a.bones.values()]));
 controller.sex=sex;controller.reset();graphs[0].runStyle='classic';graphs[1].runStyle=$('variant').value;loading=false;reset();
 $('pause').disabled=$('restart').disabled=false;status('Prêt · mêmes personnages, même horloge et même orientation. Essai visuel, validation en cours.');
 const url=new URL(location.href);url.searchParams.set('sex',sex);url.searchParams.set('variant',$('variant').value);history.replaceState(null,'',url);
 $('game-link').href=`/?character=s5runtime&weapon=dagger&sex=${sex}&runStyle=${$('variant').value}`;
}
$('pause').onclick=()=>{paused=!paused;clock.clear();$('pause').textContent=paused?'Reprendre':'Pause';updateDiagnostics();};
$('restart').onclick=reset;$('sex').onchange=loadActors;
$('variant').onchange=()=>{graphs[1].runStyle=$('variant').value;reset();const url=new URL(location.href);url.searchParams.set('variant',$('variant').value);history.replaceState(null,'',url);$('game-link').href=`/?character=s5runtime&weapon=dagger&sex=${$('sex').value}&runStyle=${$('variant').value}`;};
$('circle').onclick=()=>{mode='circle';reset();};$('idle').onclick=()=>{mode='idle';reset();};
document.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>{mode='fixed';fixedDirection=b.dataset.direction;reset();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>cameraView(b.dataset.view));
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();};
function resize(){const rect=$('comparison').getBoundingClientRect();renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);}
const observer=new ResizeObserver(resize);observer.observe($('comparison'));resize();
function render(now){
 const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(!loading&&!paused){const alpha=clock.advance(dt*Number($('speed').value)*1000,tick);buffers.forEach(b=>b.render(alpha));}
 if(actors.length){const p=actors[0].group.position,delta=p.clone().sub(follow);camera.position.add(delta);orbit.target.add(delta);follow.copy(p);}
 orbit.update();
 const width=$('comparison').clientWidth,height=$('comparison').clientHeight,half=Math.floor(width/2);
 renderer.setScissorTest(true);
 for(let i=0;i<2;i++){const x=i*half,w=i?width-half:half;camera.aspect=w/height;camera.updateProjectionMatrix();renderer.setViewport(x,0,w,height);renderer.setScissor(x,0,w,height);renderer.render(scenes[i],camera);}
 renderer.setScissorTest(false);
 if(actors.length&&now-lastInfo>100){lastInfo=now;updateDiagnostics();}
 requestAnimationFrame(render);
}
requestAnimationFrame(render);loadActors();
window.addEventListener('pagehide',()=>{loadRevision++;observer.disconnect();orbit.dispose();actors.forEach(a=>a.dispose());renderer.dispose();},{once:true});
