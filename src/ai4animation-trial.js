import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {trialNeuralInput} from './ai4animation-controls.js';

const endpoint='http://127.0.0.1:5176';
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#scene'),antialias:true});
renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio,2)));
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#192332');
scene.add(new THREE.HemisphereLight(0xe3f1ff,0x68705e,2.5));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,6,4);scene.add(light);
const grid=new THREE.GridHelper(80,80,0x57708d,0x344354);scene.add(grid);
const camera=new THREE.PerspectiveCamera(42,1,.01,200);camera.position.set(4,2.4,-4.5);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;
const status=document.querySelector('#status');
const style=document.querySelector('#style');
const character=document.querySelector('#character');
const fusion=document.querySelector('#fusion');
fusion.oninput=()=>{document.querySelector('#fusion-value').value=`${fusion.value} % IA`;frames=-1;};
const params=new URLSearchParams(location.search);
character.value=params.get('character')==='s5runtime'?(params.get('sex')==='female'?'female':'male'):'geno';
let sourceRest,s5runtime,s5runtimeRevision=0,s5runtimeLoading=false;
let model,nodes=new Map(),latest,frames=0,busy=false,auto=false,paused=false,button=[0,0],lastRoot=new THREE.Vector3(),lastTime=performance.now(),lastSeen=0;
const keys=new Set();
const world=new THREE.Matrix4(),parentInv=new THREE.Matrix4(),root=new THREE.Vector3();
const down=e=>{if(e.target.matches('select,input'))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);auto=false;button=[0,0];};
addEventListener('keydown',down);addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>{keys.clear();button=[0,0];auto=false;});
for(const b of document.querySelectorAll('[data-x]'))b.onclick=()=>{button=[Number(b.dataset.x),Number(b.dataset.z)];auto=false;};
document.querySelector('#circle').onclick=()=>{auto=!auto;button=[0,0];};
document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Reprendre':'Pause';};
function movement(){
 if(auto){const t=performance.now()*.0005;return [Math.sin(t),Math.cos(t)];}
 if(keys.size)return [Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('q')||keys.has('arrowleft')),Number(keys.has('w')||keys.has('z')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))];
 return button;
}
async function connect(){
 try{
  const info=await fetch(`${endpoint}/info`).then(r=>{if(!r.ok)throw Error('Modèle indisponible');return r.json();});
  style.replaceChildren(...info.styles.map(s=>new Option(s,s,s==='Neutral',s==='Neutral')));
  const gltf=await new GLTFLoader().loadAsync(`${endpoint}/model.glb`);model=gltf.scene;
  model.traverse(o=>{if(o.name)nodes.set(o.name,o);if(o.isMesh){o.frustumCulled=false;if(o.material)o.material.side=THREE.DoubleSide;}});scene.add(model);
  model.updateMatrixWorld(true);sourceRest=new Map([...nodes].map(([name,node])=>[name,node.matrixWorld.clone()]));
  if(character.value!=='geno')await changeCharacter();
  status.textContent='Modèle prêt · tu peux tester';
 }catch(e){status.textContent=`Démarrage du moteur local… ${e.message}`;setTimeout(connect,2000);}
}
async function changeCharacter(){
 const revision=++s5runtimeRevision,sex=character.value;
 document.querySelector('#fusion-row').hidden=sex==='geno';
 if(sex==='geno'){s5runtimeLoading=false;model.visible=true;if(s5runtime)s5runtime.actor.group.visible=false;frames=-1;return;}
 s5runtimeLoading=true;status.textContent='Chargement de S5Runtime…';
 try{
  const {createNeuralS5Runtime}=await import('./ai4animation-s5runtime.js');
  const next=await createNeuralS5Runtime(sex,sourceRest);
  if(revision!==s5runtimeRevision){next.actor.dispose();return;}
  s5runtime?.actor.dispose();s5runtime=next;scene.add(s5runtime.actor.group);model.visible=false;frames=-1;
  controls.target.y=1.2;
  document.querySelector('#description').textContent='Fusion des poses S5Runtime d’origine et du mouvement généré. 0 % : S5Runtime ; 100 % : IA. Essai sans arme.';
 }catch(e){status.textContent=`Chargement S5Runtime impossible : ${e.message}`;character.value='geno';model.visible=true;console.error(e);}
 finally{if(revision===s5runtimeRevision)s5runtimeLoading=false;}
}
character.onchange=()=>{const url=new URL(location.href);url.searchParams.set('character',character.value==='geno'?'geno':'s5runtime');url.searchParams.set('sex',character.value==='female'?'female':'male');history.replaceState(null,'',url);if(sourceRest)changeCharacter();};
async function tick(){
 if(busy||!model)return;busy=true;
 try{
  const [side,forward]=movement(),{x,z}=trialNeuralInput(side,forward,character.value!=='geno');
  const r=await fetch(`${endpoint}/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x,z,style:style.value,fixed:document.querySelector('#fixed').checked,sprint:keys.has('shift'),paused})});
  if(!r.ok)throw Error(await r.text());latest=await r.json();lastSeen=performance.now();
 }catch(e){status.textContent=`Connexion interrompue : ${e.message}`;}
 finally{busy=false;}
}
function applyPose(p){
 if(!p||frames===p.frame)return;frames=p.frame;
 model.updateMatrixWorld(true);
 // Actor exports world matrices in row-major order. GLTF nodes need local transforms.
 const transforms=new Map(p.names.map((name,i)=>[name,new THREE.Matrix4().fromArray(p.transforms[i].flat()).transpose()]));
 for(const [name,m]of transforms){const node=nodes.get(name);if(!node)continue;
  const parent=transforms.get(node.parent?.name)||node.parent?.matrixWorld||new THREE.Matrix4();
  parentInv.copy(parent).invert();world.multiplyMatrices(parentInv,m);world.decompose(node.position,node.quaternion,node.scale);
 }
 model.updateMatrixWorld(true);
 if(character.value!=='geno'&&s5runtime&&!s5runtimeLoading){const [side,forward]=movement();root.copy(s5runtime.apply(p,transforms,{side,forward,weight:Number(fusion.value)/100}));root.y=0;}else root.set(...p.root);
 const delta=root.clone().sub(lastRoot);camera.position.add(delta);controls.target.add(delta);lastRoot.copy(root);
 grid.position.set(Math.round(root.x),0,Math.round(root.z));
 if(!s5runtimeLoading)status.textContent=`${character.value==='geno'?'Geno':character.value==='male'?'S5Runtime homme':'S5Runtime femme'} · ${p.style} · ${p.inferenceMs.toFixed(0)} ms/prédiction`;
 document.body.dataset.character=character.value;
 document.body.dataset.neural=JSON.stringify({genoVisible:model.visible,s5runtimeVisible:s5runtime?.actor.group.visible,s5runtimeSex:s5runtime?.actor.sex,mappedBones:s5runtime?.mappedBones,meshCount:s5runtime?.actor.meshes.length,fusion:s5runtime?.diagnostics,root:root.toArray()});
 document.body.dataset.frame=String(p.frame);
}
renderer.setAnimationLoop(()=>{
 const w=renderer.domElement.clientWidth,h=renderer.domElement.clientHeight;if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 applyPose(latest);controls.update();renderer.render(scene,camera);
 const now=performance.now();if(now-lastTime>33){lastTime=now;tick();}
 if(lastSeen&&now-lastSeen>2500)status.textContent='Le moteur ne répond plus…';
});
connect();
