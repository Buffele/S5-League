import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStation2Modular} from './station2-modular.js';
import {loadBrutalTextures,loadBrutalProps,applyBrutalArchitecture} from './station2-brutal.js';
import {createStationPresentation} from './station2-visuals.js';
import {loadBlenderSlice,applyBlenderSlice} from './station2-blender.js';
import {loadBlenderEnvironment,applyBlenderAtmosphere} from './station2-atmosphere.js';
const params=new URLSearchParams(location.search),before=params.has('before');
const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true});document.body.prepend(renderer.domElement);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,1200),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;
const sun=new THREE.DirectionalLight(0xffffff,2);sun.castShadow=true;scene.add(sun);
const views={train:[[31,16,-24],[3,8,0]],stairs:[[22,14,-6],[9.8,11,-16]],pillar:[[-16,19,-22],[0,10,-12]],overall:[[62,38,-38],[0,12,0]],interior:[[10,8.1,0],[-10,7,0]],base:[[-12,25,-17],[6,20,-39]],beta:[[12,25,17],[-6,20,39]],bridge:[[1.4,25,-13],[-8,22,-32]]};
views.city=[[62,38,-38],[210,8,-205]];
views.bridge=[[9,23,-6],[0,17.5,-11]];
const cityButton=document.createElement('button');cityButton.id='city';cityButton.textContent='Cité';document.querySelector('nav[aria-label="Points de vue"]').append(cityButton);
views.screens=[[6.37,20.3,-39.87],[8.28,20.14,-44.49]];
const screensButton=document.createElement('button');screensButton.id='screens';screensButton.textContent='Écrans';document.querySelector('nav[aria-label="Points de vue"]').append(screensButton);
views.betaScreens=[[-6.37,20.3,39.87],[-8.28,20.14,44.49]];
const betaScreensButton=document.createElement('button');betaScreensButton.id='betaScreens';betaScreensButton.textContent='Écrans Bêta';document.querySelector('nav[aria-label="Points de vue"]').append(betaScreensButton);
let current=params.get('view') in views?params.get('view'):'overall';
function view(id){current=id;camera.position.fromArray(views[id][0]);orbit.target.fromArray(views[id][1]);orbit.update();for(const key of Object.keys(views))document.getElementById(key).setAttribute('aria-pressed',String(key===id));}
for(const id of Object.keys(views))document.getElementById(id).onclick=()=>view(id);view(current);
const compare=document.getElementById('compare');compare.textContent=before?'Voir les modèles Blender':'Voir la version précédente';compare.onclick=()=>{location.href='/station2-blender.html?view='+current+(before?'':'&before=1');};
try{
 const [world,textures,props,slice]=await Promise.all([createStation2Modular(scene),before?loadBrutalTextures():loadBlenderEnvironment(),before?loadBrutalProps():{},before?null:loadBlenderSlice()]);
 world.target.visible=false;const triangles=world.triangles,colliders=[...world.meshes],layout=JSON.stringify(world.exportLayout());
 if(slice)applyBlenderSlice(world,slice);
 // New art is already hidden from legacy rebuilding; no double roof units.
 if(before)applyBrutalArchitecture(scene,world,textures,props);else applyBlenderAtmosphere(scene,world,textures);
 if(triangles!==world.triangles||colliders.some((m,i)=>world.meshes[i]!==m)||layout!==JSON.stringify(world.exportLayout()))throw Error('Les gabarits physiques ont changé');
 const presentation=createStationPresentation(renderer,scene,camera,world,sun);
 const gauges=new THREE.Group();gauges.visible=false;scene.add(gauges);
 for(const [id,module] of world.modules)for(const source of module.collisions){
  source.updateWorldMatrix(true,false);const lines=new THREE.LineSegments(new THREE.EdgesGeometry(source.geometry,25),new THREE.LineBasicMaterial({color:0xd6ff4c,depthTest:false,transparent:true,opacity:.5}));
  lines.applyMatrix4(source.matrixWorld);lines.renderOrder=20;gauges.add(lines);
 }
 document.getElementById('gauge').onclick=()=>{gauges.visible=!gauges.visible;document.getElementById('gauge').setAttribute('aria-pressed',String(gauges.visible));};
 document.getElementById('status').textContent=before?'Version précédente':'Station 2 · Anime bleu / corail · collisions conservées';
 let last=performance.now(),frames=0,elapsed=0;renderer.info.autoReset=false;
 const animate=now=>{const dt=Math.min((now-last)/1000,.1);last=now;world.update(dt);orbit.update();renderer.info.reset();presentation.render();frames++;elapsed+=dt;
  if(elapsed>.8){document.getElementById('status').textContent=(before?'Version précédente':'Anime bleu / corail')+' · '+Math.round(frames/elapsed)+' images/s · collisions conservées';frames=0;elapsed=0;}
  requestAnimationFrame(animate);
 };requestAnimationFrame(animate);
 addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();presentation.resize(innerWidth,innerHeight);});
 window.blenderReview={world,scene,camera,renderer,orbit,view,gauges,physicsUnchanged:true};
}catch(error){document.getElementById('status').textContent='Erreur : '+error.message;console.error(error);}
