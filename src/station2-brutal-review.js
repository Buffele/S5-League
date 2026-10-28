import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createStation2Modular} from './station2-modular.js';
import {loadBrutalTextures,loadBrutalProps,applyBrutalArchitecture} from './station2-brutal.js';
import {createStationPresentation} from './station2-visuals.js';
const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true});document.body.prepend(renderer.domElement);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,1200),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.minDistance=3;orbit.maxDistance=180;
scene.add(new THREE.HemisphereLight(0xc5e4ff,0x34425f,.85));const sun=new THREE.DirectionalLight(0xffffff,2);sun.castShadow=true;scene.add(sun);
const views={overall:[[49,49,-64],[0,10,0]],train:[[29,14,-19],[4,8,0]],base:[[28,45,-58],[0,16,-33]]};
function view(id){camera.position.fromArray(views[id][0]);orbit.target.fromArray(views[id][1]);orbit.update();for(const key of Object.keys(views))document.getElementById(key).setAttribute('aria-pressed',String(key===id));}
for(const key of Object.keys(views))document.getElementById(key).onclick=()=>view(key);view('overall');
try{
 const [world,textures,props]=await Promise.all([createStation2Modular(scene),loadBrutalTextures(),loadBrutalProps()]);world.target.visible=false;
 const before=world.triangles;applyBrutalArchitecture(scene,world,textures,props);const presentation=createStationPresentation(renderer,scene,camera,world,sun);
 if(before!==world.triangles)throw Error('Les collisions ont été modifiées');
 renderer.info.autoReset=false;let last=performance.now(),frames=0,elapsed=0;
 const frame=now=>{const dt=Math.min((now-last)/1000,.1);last=now;world.update(dt);orbit.update();renderer.info.reset();presentation.render();frames++;elapsed+=dt;
  if(elapsed>.7){document.getElementById('stats').textContent=`${Math.round(frames/elapsed)} images/s · ${renderer.info.render.calls} appels de rendu · ${Math.round(renderer.info.render.triangles/1000)} k triangles (ombres incluses) · collisions d’origine`;frames=0;elapsed=0;}
  requestAnimationFrame(frame);
 };requestAnimationFrame(frame);
 window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();presentation.resize(innerWidth,innerHeight);});
 window.stationReview={world,renderer,scene,camera};
}catch(error){document.getElementById('stats').textContent='Erreur : '+error.message;console.error(error);}
