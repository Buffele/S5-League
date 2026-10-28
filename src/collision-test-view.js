import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createCollisionTestBody} from './collision-test-world.js';
import {COLLISION_TEST_MAPS,loadCollisionTestMap} from './collision-test-maps.js';
import {MapSession} from './map-session.js';
import {loadAvatar} from './avatar.js';
import {MotionGraph} from './motion-graph.js';
import {PoseBuffer} from './pose-buffer.js';
import {setAvatarFacing} from './view-orientation.js';
import {createNativeLocomotionParameterBank} from './native-locomotion-runtime.js';
const canvas=document.querySelector('#view'),status=document.querySelector('#status'),error=document.querySelector('#error');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101824);scene.fog=new THREE.Fog(0x101824,40,95);
scene.add(new THREE.HemisphereLight(0xc1e4ff,0x273241,2.6));
const sun=new THREE.DirectionalLight(0xffeccb,3);sun.position.set(-8,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:65});scene.add(sun);
const camera=new THREE.PerspectiveCamera(52,1,.05,130);camera.position.set(5,4.5,14);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,1.2,7);orbit.enablePan=false;orbit.maxPolarAngle=Math.PI*.47;orbit.minDistance=3.5;orbit.maxDistance=45;orbit.update();
let savedOptions={};try{savedOptions=JSON.parse(sessionStorage.getItem('collision-test-options'))??{};}catch{}
if(!savedOptions||typeof savedOptions!=='object')savedOptions={};
const maps=new MapSession(loadCollisionTestMap);let mapKey=Object.hasOwn(COLLISION_TEST_MAPS,savedOptions.map)?savedOptions.map:'test',entry;
try{entry=await maps.activate(mapKey,scene);}catch(e){console.error(e);mapKey='test';entry=await maps.activate(mapKey,scene);}
const mapScales=new Map();let characterScale=[1,1.25,1.5,1.75,2].includes(savedOptions.scale)?savedOptions.scale:(mapKey==='alice-house'?1.5:1);
mapScales.set(mapKey,characterScale);
let body=createCollisionTestBody({geometry:entry.geometry,scenarios:entry.scenarios,scenario:Object.hasOwn(entry.scenarios,savedOptions.start)?savedOptions.start:Object.keys(entry.scenarios)[0],characterScale});
let surfaceMeshes=[];
function collectMapMeshes(){surfaceMeshes=[];entry.root.traverse(mesh=>{if(!mesh.isMesh)return;for(let parent=mesh;parent;parent=parent.parent)if(!parent.visible)return;surfaceMeshes.push(mesh);});entry.fadeMaterials??=new Map();}
collectMapMeshes();
const sightRay=new THREE.Raycaster(),sightDirection=new THREE.Vector3(),occluded=new Set();
const ball=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0xff8956,wireframe:true,transparent:true,opacity:.3,depthWrite:false}));ball.scale.set(.6,.96,.6);ball.visible=false;scene.add(ball);
const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.7,48),new THREE.MeshBasicMaterial({color:0x7ce4ce,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);
const selector=document.querySelector('#scenario'),mapSelector=document.querySelector('#map');
for(const [key,label]of Object.entries(COLLISION_TEST_MAPS)){const option=document.createElement('option');option.value=key;option.textContent=label;mapSelector.append(option);}
mapSelector.value=mapKey;
function mapStarts(){selector.replaceChildren();for(const [key,value]of Object.entries(entry.scenarios)){const option=document.createElement('option');option.value=key;option.textContent=value.label;selector.append(option);}}
mapStarts();
if(Object.hasOwn(entry.scenarios,savedOptions.start))selector.value=savedOptions.start;
const character=document.querySelector('#character'),scaleSelector=document.querySelector('#character-scale'),avatars=new Map(),graph=new MotionGraph();
if(['male','female'].includes(savedOptions.sex))character.value=savedOptions.sex;
scaleSelector.value=String(characterScale);camera.far=entry.cameraFar;camera.updateProjectionMatrix();entry.world.applyPresentation?.({renderer,scene,camera,sun});
const held=new Set();let jump=false,failed=false,accumulator=0,last=performance.now(),frame=0,ready=false,loadingMap=false,avatar=null,pose=null,lastSample=null;
const look=new THREE.Vector3(),right=new THREE.Vector3(),follow=new THREE.Vector3(),followDelta=new THREE.Vector3();
function animate(dt){
 const c=body.controller,p=c.position;avatar.group.position.set(p.x,p.y,p.z);avatar.group.scale.setScalar(characterScale);setAvatarFacing(avatar.group,c.facing);
 lastSample=graph.sample(c,dt);
 if(!avatar.actions.has(lastSample.clip+':upper')||!avatar.actions.has((lastSample.lower??lastSample.clip)+':lower'))throw Error('Animation du personnage absente : '+lastSample.clip);
 avatar.motion(lastSample);avatar.update(dt);
 if(c.grounded&&Math.hypot(c.velocity.x,c.velocity.z)>.25){canvas.dataset.lastRunClip=avatar.clip;canvas.dataset.lastRunLower=lastSample.lower??lastSample.clip;}
}
function reset(){body.reset(selector.value);held.clear();jump=false;failed=false;error.textContent='';status.textContent='Placement du personnage…';accumulator=0;if(avatar){graph.reset();avatar.prepareSwitch();animate(0);pose.reset();}try{sessionStorage.setItem('collision-test-options',JSON.stringify({map:mapKey,start:selector.value,sex:character.value,scale:characterScale}));}catch{}canvas.focus();}
document.querySelector('#collider').addEventListener('change',event=>{ball.visible=event.target.checked;canvas.focus();});
function enableControls(){for(const control of [mapSelector,character,scaleSelector,selector,document.querySelector('#reset')])control.disabled=!ready||loadingMap;}
function restoreFades(target){for(const [mesh,materials]of target.fadeMaterials??[])mesh.material=materials.original;}
mapSelector.addEventListener('change',async()=>{
 if(!ready||loadingMap)return;const nextKey=mapSelector.value,previous={key:mapKey,entry,body,failed,characterScale};
 loadingMap=true;enableControls();held.clear();jump=false;accumulator=0;error.textContent='';status.textContent='Chargement de '+COLLISION_TEST_MAPS[nextKey]+'…';
 try{
  const next=await maps.get(nextKey),nextScale=mapScales.get(nextKey)??(nextKey==='alice-house'?1.5:1),nextBody=createCollisionTestBody({geometry:next.geometry,scenarios:next.scenarios,scenario:Object.keys(next.scenarios)[0],characterScale:nextScale});nextBody.controller.sex=character.value;
  restoreFades(entry);await maps.activate(nextKey,scene);next.world.applyPresentation?.({renderer,scene,camera,sun});
  entry=next;body=nextBody;mapKey=nextKey;characterScale=nextScale;scaleSelector.value=String(characterScale);collectMapMeshes();occluded.clear();mapStarts();camera.far=entry.cameraFar;camera.updateProjectionMatrix();reset();
 }catch(e){
  if(maps.current!==previous.entry){await maps.activate(previous.key,scene);previous.entry.world.applyPresentation?.({renderer,scene,camera,sun});}
  entry=previous.entry;body=previous.body;mapKey=previous.key;characterScale=previous.characterScale;scaleSelector.value=String(characterScale);mapSelector.value=mapKey;failed=previous.failed;collectMapMeshes();occluded.clear();
  status.textContent='Carte précédente conservée';error.textContent='Chargement impossible : '+e.message;console.error(e);
 }finally{loadingMap=false;enableControls();canvas.focus();}
});
character.addEventListener('change',()=>{if(!ready)return;for(const [sex,item]of avatars)item.avatar.group.visible=sex===character.value;const selected=avatars.get(character.value);avatar=selected.avatar;pose=selected.pose;body.controller.sex=character.value;reset();});
scaleSelector.addEventListener('change',()=>{
 if(!ready||loadingMap)return;
 const nextScale=Number(scaleSelector.value),next=createCollisionTestBody({geometry:entry.geometry,scenarios:entry.scenarios,scenario:selector.value,characterScale:nextScale});
 next.controller.sex=character.value;body=next;characterScale=nextScale;mapScales.set(mapKey,nextScale);reset();
});
selector.addEventListener('change',reset);document.querySelector('#reset').addEventListener('click',reset);
document.querySelector('#toggle').addEventListener('click',event=>{const panel=document.querySelector('#panel'),hidden=!panel.hidden;panel.hidden=hidden;event.currentTarget.textContent=hidden?'Afficher l’aide':'Masquer l’aide';event.currentTarget.setAttribute('aria-expanded',String(!hidden));canvas.focus();});
addEventListener('keydown',event=>{if(event.target.matches('select,button'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();held.add(event.code);if(event.code==='Space'&&!event.repeat)jump=true;if(event.code==='KeyR'&&!event.repeat)reset();});
addEventListener('keyup',event=>held.delete(event.code));addEventListener('blur',()=>{held.clear();jump=false;});document.addEventListener('visibilitychange',()=>{held.clear();jump=false;accumulator=0;last=performance.now();});canvas.addEventListener('pointerdown',()=>canvas.focus());
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function advance(){
 const forward=Number(held.has('KeyW')||held.has('ArrowUp'))-Number(held.has('KeyS')||held.has('ArrowDown')),side=Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'));
 camera.getWorldDirection(look);look.y=0;look.normalize();right.set(-look.z,0,look.x);body.controller.facing=Math.atan2(look.x,look.z);
 pose.beginTick();const result=body.step({x:look.x*forward+right.x*side,z:look.z*forward+right.z*side,jump});jump=false;
 graph.events(result.events);animate(.016);pose.endTick();
 if(body.controller.position.y<entry.deathY)reset();
}
function draw(now){requestAnimationFrame(draw);const elapsed=Math.min((now-last)/1000,.1);last=now;if(ready&&!loadingMap&&!document.hidden&&!failed){accumulator+=elapsed;try{let count=0;while(accumulator>=.016&&count++<6){advance();accumulator-=.016;}pose.render(accumulator/.016);}catch(e){failed=true;error.textContent='Test arrêté : '+e.message;console.error(e);}}
 const s=body.snapshot(),p=s.position;ball.scale.set(s.radius,s.height/2,s.radius);ball.position.set(p.x,p.y+s.height/2,p.z);ring.scale.setScalar(characterScale);ring.position.set(p.x,Math.max(.008,p.y+.008),p.z);ring.material.color.setHex(s.grounded?0x7ce4ce:0xffcb79);
 follow.set(p.x,p.y+1.2*characterScale,p.z);followDelta.subVectors(follow,orbit.target);camera.position.add(followDelta);orbit.target.copy(follow);
 if(ready&&!loadingMap&&frame++%8===0){status.textContent=`${s.grounded?'AU SOL':'EN L’AIR'} · hauteur ${p.y.toFixed(2)} m · ${s.jumps} saut(s)`;
  Object.assign(canvas.dataset,{map:mapKey,sex:avatar.sex,characterScale:String(characterScale),bodyHeight:String(s.height),clip:avatar.clip,lower:lastSample?.lower??lastSample?.clip,grounded:String(s.grounded),x:String(p.x),z:String(p.z),failed:String(failed)});
 }
 orbit.update();
 // Presentation only: keep the real character visible behind a test wall or
 // below the roof. Physical source triangles and solver enables stay intact.
 sightDirection.subVectors(follow,camera.position);sightRay.far=sightDirection.length();sightRay.set(camera.position,sightDirection.normalize());occluded.clear();
 for(const hit of sightRay.intersectObjects(surfaceMeshes,false))occluded.add(hit.object);
 for(const mesh of surfaceMeshes){
  let materials=entry.fadeMaterials.get(mesh);
  if(occluded.has(mesh)){
   if(!materials){const original=mesh.material,clones=[].concat(original).map(material=>{const clone=material.clone();clone.transparent=true;clone.opacity=material.opacity*.2;clone.depthWrite=false;return clone;});materials={original,faded:Array.isArray(original)?clones:clones[0]};entry.fadeMaterials.set(mesh,materials);}
   mesh.material=materials.faded;
  }else if(materials)mesh.material=materials.original;
 }
 renderer.render(scene,camera);
}
// Read-only diagnostics for the isolated test; no main-game/native process.
Object.defineProperty(window,'collisionTest',{value:{snapshot:()=>({...body.snapshot(),map:mapKey,loadingMap,character:avatar?{sex:avatar.sex,clip:lastSample?.clip,lower:lastSample?.lower??lastSample?.clip,ready,visible:avatar.group.visible}:null,failed}),scenario:key=>{selector.value=key;reset();}}});
status.textContent='Chargement des personnages…';enableControls();
requestAnimationFrame(draw);
try{
 const loaded=await Promise.all(['male','female'].map(async sex=>({sex,avatar:await loadAvatar({appearance:'s5runtime',sex,weapon:'dagger',weaponSkin:'classic'})})));
 createNativeLocomotionParameterBank({normalFunction:'NormalState_SpyDagger',runFunction:'RunState_SpyDagger',clipsBySex:Object.fromEntries(loaded.map(({sex,avatar})=>[sex,avatar.clips.map(clip=>clip.name)]))});
 for(const item of loaded){scene.add(item.avatar.group);item.avatar.group.visible=item.sex===character.value;avatars.set(item.sex,{avatar:item.avatar,pose:new PoseBuffer([item.avatar.group,item.avatar.rig,...item.avatar.bones.values()])});}
 avatar=avatars.get(character.value).avatar;pose=avatars.get(character.value).pose;ready=true;enableControls();reset();
}catch(e){failed=true;status.textContent='Chargement interrompu';error.textContent=e.message;console.error(e);}
