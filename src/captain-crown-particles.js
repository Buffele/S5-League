import * as THREE from 'three';
import {Particles} from './combat-effects.js';
import {createParticleSize} from './sprint-effect.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import {advanceNativeSequenceClock,resetNativeSequenceClock} from './native-sequence-clock.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {createResourceCache} from './resource-cache.js';

const BASE='/assets/mode-world-effects/',identity=new THREE.Matrix4(),zero=new THREE.Vector3();
const texture=createResourceCache(url=>new THREE.TextureLoader().loadAsync(url));
const sources={
 'effects/captain_crown_bling.seq':['effects/captain_crown_bling.dds','effects/levelup5_nomipmap.dds'],
 'effects/captain_crown_bling_etex.seq':['effects/captain_crown_bling_etax.dds','effects/captain_crown_line_etex.dds'],
};
export const CAPTAIN_PARTICLE_RENDER_POLICY=Object.freeze({
 name:'captain-source-emitters-native-half-extents-v4',
 sourceMotion:'1136c50 emitter+30 speed, emitter+48/4c/50 acceleration; 1135880 direction multiplication',
 sizeVariation:'1240320 versioned control+30; 1136c50/1137c50 common width/height target offset',
 motionIntegration:'1168f90 advances position with old velocity, then velocity with acceleration; floating-point parity unverified',
 attachment:'983e90 crown bling Dummy; exact local-space particle branch',
 billboardSize:'1240600 mode0 uses source half-extents times0.006; 123fd80 control+5c=false excludes parent size scaling for these sources',
 frameTime:'S5 visible-time fractional carry feeds integer milliseconds to the unchanged native clock; hidden time pauses',
 emissionWindow:'start inclusive, end inclusive; native action boundary comparison remains open',
 nativeParticleParityVerified:false,
});
export function captainParticleDefinition(raw,manifest){
 const expected=sources[raw.source];if(!expected||raw.header.byteField!==1||raw.header.durationField!==2000||raw.nodes.length!==2)throw Error('Exact Captain particle sequence required');
 const converted=convertParticleSequence(raw,BASE);
 const nodes=converted.nodes.map((node,i)=>{
  const key=node.emitterKeys[0];
  if(node.parentType!==0||node.parent!==0||node.bone!=='captain_crown_bling_Dummy'||node.start!==0||node.end!==2||node.emitterKeys.length!==1||node.emitterLoop!==1||key['object+10']!==1||key['object+34']!==0||node.native['54']!==1||node.native['18']!==0||node.native['1c']!==0||node.native['20']!==1||node.lifeVariationMs!==0||node.widthVariation!==0||node.heightVariation!==0||node.speedVariation!==0||key['object+2c']!==0||node.textures.length!==1)throw Error('Unsupported Captain particle branch');
  const literal=raw.nodes[i].fields.textures.entries[0].path.value.split(/[\\/]/).at(-1).toLowerCase().replace(/\.(tga|dds)$/i,'.dds');
  if('effects/'+literal!==expected[i])throw Error('Captain particle texture literal mismatch');
  const meta=manifest.assets.find(a=>a.source===expected[i]);if(!meta||!meta.file.endsWith('.png'))throw Error('Authenticated Captain particle texture absent');
  const control=raw.nodes[i].fields.control,versioned=control.versioned;
  if(control.versionField!==.5||versioned.flags50to53.some(Boolean)||versioned.field68.int32!==0||versioned.flag24||versioned.flag25||control.primaryWords.slice(3).some(w=>w.float32!==0))throw Error('Unsupported Captain particle control branch');
  const commonSizeVariation=versioned.field30.float32;
  if(!Number.isFinite(commonSizeVariation)||commonSizeVariation<0)throw Error('Invalid Captain common size variation');
  // Do not use shared converter's speed/acceleration projections here: the
  // actual birth routine reads these values from the current emitter key.
  return {...node,speed:key['object+30'],acceleration:['48','4c','50'].map(k=>key['object+'+k]),commonSizeVariation,widthVariation:commonSizeVariation,heightVariation:commonSizeVariation,textures:[BASE+meta.file]};
 });
 return {source:raw.source,durationMs:2000,loop:true,nodes};
}
class CrownEmitter extends Particles{
 constructor(node,maps,{random}){
  // Shared size helpers request two differences, one per axis. Native uses a
  // single common difference for both axes. Replay the same pair for height;
  // only two underlying samples are consumed per initial/key target.
  let phase=0,pair=[];
  const sizeRandom=()=>{if(phase===0)pair=[random(),random()];const value=pair[phase%2];phase=(phase+1)%4;return value;};
  super(node,maps,{random:sizeRandom});this.birthRandom=random;this.mesh.material=this.materials[0];
 }
 spawn(){
  const c=this.config,k=c.emitterKeys[0],random=this.birthRandom;
  const radius=k['object+38']===k['object+3c']?k['object+3c']:k['object+38']+random()*(k['object+3c']-k['object+38']);
  const height=k['object+40']===k['object+44']?k['object+44']:k['object+40']+random()*(k['object+44']-k['object+40']);
  const azimuth=random()*Math.PI*2,polar=random()*Math.PI*2;
  const position=new THREE.Vector3(radius*Math.sin(polar)*Math.cos(azimuth),height*Math.cos(polar),radius*Math.sin(polar)*Math.sin(azimuth)).add(new THREE.Vector3(k['object+14'],k['object+18'],k['object+1c'])).multiplyScalar(SCN_SCENE_SCALE);
  this.particles.push({age:0,life:c.lifeMs/1000,size:createParticleSize(c,c.lifeMs/1000,this.random),position,
   velocity:new THREE.Vector3(k['object+20'],k['object+24'],k['object+28']).multiplyScalar(c.speed*SCN_SCENE_SCALE),
   acceleration:new THREE.Vector3(...c.acceleration).multiplyScalar(SCN_SCENE_SCALE),localSpace:true,texture:0,textureStep:0,initialTexture:0});
 }
}
export function createCaptainCrownParticles({scene,definition,textures,readAnchor,random=Math.random}){
 if(!scene?.isObject3D||typeof readAnchor!=='function'||typeof random!=='function')throw Error('Explicit Captain particle scene and anchor required');
 const emitters=[],maps=[];let disposed=false,visible=false,fractionalMs=0,deliveredMs=0,elapsedSeconds=0,elapsedError=0;
 // With rate1 and delta<=1000, all native x87 precision modes produce the
 // same exact integer clock increment. This does not assume the FPU mode.
 const clock=resetNativeSequenceClock({looping:definition.loop,precisionBits:24,roundingMode:'nearest'},definition.durationMs);
 try{
  for(const node of definition.nodes){
   const prepared=textures.get(node.textures[0]);if(!prepared?.isTexture)throw Error('Prepared Captain texture required');
   const map=prepared.clone();maps.push(map);const emitter=new CrownEmitter(node,[map],{random});emitter.mesh.name='captain-crown-particles-'+node.id;emitters.push(emitter);scene.add(emitter.mesh);
  }
 }catch(error){for(const e of emitters){e.mesh.removeFromParent();e.geometry.dispose();e.materials.forEach(m=>m.dispose());}maps.forEach(m=>m.dispose());throw error;}
 const api={
  update(dt,{visible:show=true}={}){
   if(disposed)return;if(!Number.isFinite(dt)||dt<0||dt>.25)throw Error('Bounded Captain particle delta required');visible=show;
   if(show){
    // Adapt browser seconds before entering the integer-time source kernel.
    // Dropping each frame's fraction made a144Hz second advance only864ms.
    // Compensated host-time summation avoids accumulating rounding error at
    // high frame rates. The small ULP allowance only resolves integer-boundary
    // noise; it does not round every frame's delta up or alter the native kernel.
    const corrected=dt-elapsedError,next=elapsedSeconds+corrected;
    elapsedError=(next-elapsedSeconds)-corrected;elapsedSeconds=next;
    const elapsed=elapsedSeconds*1000,whole=Math.floor(elapsed+Number.EPSILON*Math.max(1,elapsed)*4),delta=whole-deliveredMs;
    fractionalMs=Math.max(0,elapsed-whole);deliveredMs=whole;
    const timing=advanceNativeSequenceClock(clock,delta);
    for(const e of emitters)e.update(delta/1000,{matrix:identity,position:zero,sprinting:timing.dispatch&&clock.current>=e.config.start*1000&&clock.current<=e.config.end*1000});
   }
   for(const e of emitters)e.mesh.visible=show&&e.particles.length>0;
  },
  render(camera){
   if(disposed||!visible)return;const anchor=readAnchor();if(!anchor?.isObject3D){for(const e of emitters)e.mesh.visible=false;return;}anchor.updateWorldMatrix(true,false);
   for(const e of emitters){
    const saved=[];
    try{
     for(const p of e.particles){
      saved.push({p,position:p.position.clone(),localSpace:p.localSpace,width:p.size.width,height:p.size.height});
      p.position.divideScalar(SCN_SCENE_SCALE).applyMatrix4(anchor.matrixWorld);p.localSpace=false;
      // Native1240600 builds corners at +/-current+48/4c. The shared
      // renderer expects full widths and halves them; adapt only Captain's
      // draw input, retaining source simulation/key targets and other weapons.
      p.size.width*=2;p.size.height*=2;
     }
     e.render(camera);
    }finally{for(const s of saved){s.p.position.copy(s.position);s.p.localSpace=s.localSpace;s.p.size.width=s.width;s.p.size.height=s.height;}}
   }
  },
  snapshot(){return {disposed,visible,currentMs:clock.current,bridge:{elapsedSeconds,deliveredMs,fractionalMs},source:definition.source,policy:CAPTAIN_PARTICLE_RENDER_POLICY,emitters:emitters.map(e=>({id:e.config.id,particles:e.particles.length,rate:e.config.rate,speed:e.config.speed,acceleration:e.config.acceleration}))};},
  dispose(){if(disposed)return;disposed=true;for(const e of emitters){e.clear();e.mesh.removeFromParent();e.geometry.dispose();e.materials.forEach(m=>m.dispose());}maps.forEach(m=>m.dispose());},
 };
 let frame=-1;for(const e of emitters)e.mesh.onBeforeRender=(renderer,_scene,camera)=>{if(frame!==renderer.info.render.frame){frame=renderer.info.render.frame;api.render(camera);}};
 return api;
}
export async function loadCaptainCrownParticles({scene,raw,manifest,readAnchor}){
 const definition=captainParticleDefinition(raw,manifest),paths=[...new Set(definition.nodes.flatMap(n=>n.textures))],textures=new Map(await Promise.all(paths.map(async path=>[path,await texture(path)])));
 return createCaptainCrownParticles({scene,definition,textures,readAnchor});
}
