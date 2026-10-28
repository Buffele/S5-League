import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectScene} from './effect-scene.js';
import {captainInterfaceViewport} from './captain-interface-projection.js';
import {captainInterfaceParticleDefinition,createCaptainInterfaceParticles,loadCaptainInterfaceTexture} from './captain-interface-particles.js';
import {loadCaptainCountdownEffects} from './captain-countdown-effects.js';
const BASE='/assets/s5runtime/ui-mode-completion/captain-siege/captain/';
// Source geometry, placement and logical projection are retained. Browser
// viewport fitting/event dispatch are S5 adapters. The two source particle
// branches run here; native event/admission/numeric parity remain unverified.
export async function loadCaptainNativeEffects({read=readAsset,load=loadEffectScene,loadTexture=loadCaptainInterfaceTexture,randomInt}={}){
 const manifest=await read(BASE+'manifest.json'),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-512,512,384,-384,1,10000),entries=new Map();
 let countdown=null;
 const cleanup=()=>{countdown?.dispose();countdown=null;for(const e of entries.values()){e.particles?.dispose();e.wrapper.removeFromParent();for(const mesh of e.effect.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}}entries.clear();};
 try{for(const name of ['captain_win','captain_rose']){
  const record=manifest.scenes.find(s=>s.name===name),expectedClip=name==='captain_win'?'TOUCHDOWN_GREEN':'TOUCHDOWN';
  if(!record||record.clip!==expectedClip||record.durationTicks!==9600)throw Error('Captain scene contract mismatch');
  const data=await read(BASE+record.file);
  if(data.source!==record.source||data.models.length!==record.models||data.models.some(m=>!Object.hasOwn(m.effectAnimation||{},expectedClip)))throw Error('Captain exact clip missing');
  const effect=await load(data,{animation:expectedClip,loop:false}),wrapper=new THREE.Group();wrapper.add(effect.group);scene.add(wrapper);
  const entry={effect,wrapper,record,age:Infinity,ageError:0,deliveredMs:0,particles:null};entries.set(name,entry);
  const placement=record.interfacePlacement;
  if(!placement||placement.sequenceSource!==`uieffect/${name}.seq`||!/^[a-f0-9]{64}$/.test(placement.sequenceSha256)||!Array.isArray(placement.screenPosition)||placement.screenPosition.some((v,i)=>v!==[0,0,1000][i])||placement.screenPosition.length!==3)throw Error('Captain source interface placement missing');
  const timing=record.loaderTiming;
  if(!timing||timing.startMs!==0||timing.endMs!==2000||timing.fadeInMs!==500||timing.fadeOutMs!==500)throw Error('Captain source loader timing missing');
  // Native LH screen coordinates use+Z forward. Mirror only that axis for
  // Three's default-Z camera; preserve source XY, authored size and origin.
  wrapper.scale.set(1,1,-1);wrapper.position.set(placement.screenPosition[0],placement.screenPosition[1],-placement.screenPosition[2]);
  for(const mesh of effect.meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.depthTest=false;material.depthWrite=false;}
  effect.update(0,0);wrapper.visible=false;
  if(record.sequenceParticleIncluded){
   const particle=record.particleSequence;
   if(!particle||particle.file!==name+'.seq.json'||!/^[a-f0-9]{64}$/.test(particle.sha256))throw Error('Captain source particle sequence missing');
   const raw=await read(BASE+particle.file),definition=captainInterfaceParticleDefinition(raw);
   if(raw.sha256!==placement.sequenceSha256||raw.source!==placement.sequenceSource||particle.textureSource!==`uieffect/${definition.textureName}.dds`||particle.textureFile!==definition.textureName+'.png'||!/^[a-f0-9]{64}$/.test(particle.textureSha256))throw Error('Captain source particle binding mismatch');
   entry.particles=createCaptainInterfaceParticles(definition,await loadTexture(BASE+particle.textureFile),{randomInt});scene.add(entry.particles.mesh);
  }
 }if(manifest.countdownManifest){if(manifest.countdownManifest!=='countdown/manifest.json')throw Error('Captain countdown manifest path differs');countdown=await loadCaptainCountdownEffects({read,load});scene.add(countdown.group);}}catch(error){cleanup();throw error;}
 let disposed=false,visible=false,lastPhase='',eventList=null;
 const hide=()=>{visible=false;countdown?.hide();for(const e of entries.values()){e.wrapper.visible=false;if(e.particles)e.particles.mesh.visible=false;}};
 const reset=()=>{lastPhase='';eventList=null;countdown?.reset();for(const e of entries.values()){e.age=Infinity;e.ageError=0;e.deliveredMs=0;e.particles?.reset();}hide();};
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),size=new THREE.Vector2();
 return {hide,reset,
  update(dt,state,show,team){
   if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Captain UI delta');
   if(state.events!==eventList){reset();eventList=state.events;}
   if(!show){hide();lastPhase=state.phase;return;}visible=true;countdown?.update(state,show);
   if(state.phase!==lastPhase&&['intermission','result-countdown'].includes(state.phase)){
    const winner=state.outcome?.winner;
    if(winner==='alpha'||winner==='beta'){const e=entries.get(winner===team?'captain_win':'captain_rose');e.age=0;e.ageError=0;e.deliveredMs=0;e.particles?.reset();}
   }
   lastPhase=state.phase;
   for(const e of entries.values()){
    if(Number.isFinite(e.age)){const corrected=dt-e.ageError,next=e.age+corrected;e.ageError=(next-e.age)-corrected;e.age=next;}
    e.wrapper.visible=Number.isFinite(e.age)&&e.age<e.record.durationTicks/4800;
    // Native1160160 fades the loader's independent alpha from0 to1 over
    // field84; Geometry115B7B0 multiplies that channel by the SCN alpha.
    // The post-end field88 branch is not folded into the last500ms: the
    // existing S5 two-second display ends with the source SCN alpha at0.
    if(e.wrapper.visible)e.effect.update(e.age,Math.min(1,(e.age*1000-e.record.loaderTiming.startMs)/e.record.loaderTiming.fadeInMs));
    if(e.particles){
     //1282C80 switches emission using the current inclusive action gate;
     // instanceD4 then supplies the whole frame delta to11361B0. Do not
     // invent interpolated births when a frame crosses the100ms boundary.
     if(e.wrapper.visible){const elapsed=e.age*1000,whole=Math.floor(elapsed+Number.EPSILON*Math.max(1,elapsed)*4);e.particles.update(whole-e.deliveredMs,{emitting:whole>=100&&whole<=2000});e.deliveredMs=whole;}
     e.particles.mesh.visible=e.wrapper.visible&&e.particles.snapshot().particles>0;
    }
   }
  },
  render(renderer){
   if(disposed||!visible||!([...entries.values()].some(e=>e.wrapper.visible)||countdown?.snapshot().visible))return;
   const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getSize(size);
   // S5's final OutputPass writes a fullscreen depth0 surface. Start the
   // interface depth surface afresh, preserving color and native ZENABLE1.
   // Depth contents are intentionally not restored; renderer ports are.
 try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.setScissorTest(false);const view=captainInterfaceViewport(size.x,size.y);camera.left=-view.preset.width/2;camera.right=view.preset.width/2;camera.top=view.preset.height/2;camera.bottom=-view.preset.height/2;camera.updateProjectionMatrix();renderer.setViewport(view.x,view.y,view.width,view.height);renderer.clearDepth();for(const e of entries.values())if(e.wrapper.visible){e.effect.render(camera);e.particles?.render();}countdown?.render(camera);renderer.render(scene,camera);}
   finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=autoClear;}
  },
  snapshot(){return {visible,disposed,countdown:countdown?.snapshot()??null,nativeReady:false,nativeEventBindingVerified:false,sequenceParticleIncluded:entries.size===2&&[...entries.values()].every(e=>e.particles),fitting:'source XY/size/origin; native logical768 presets/scale1/near1/far10000; S5 closest-preset viewport fit',scenes:[...entries].map(([name,e])=>({name,age:e.age,visible:e.wrapper.visible,clip:e.record.clip,particles:e.particles?.snapshot()??null}))};},
  dispose(){if(disposed)return;disposed=true;hide();cleanup();}
 };
}
