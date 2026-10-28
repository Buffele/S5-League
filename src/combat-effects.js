import * as THREE from 'three';
import {replaceNativeAttackModels} from './melee-art-catalog.js';
import {bindNodeLoaderTextures,randomTextureSample} from './node-loader-texture-clock.js';
import {readAsset} from './scene-assets.js';
import {loadEffectScene,createEffectSceneFactory} from './effect-scene.js';
import {SprintEffect,appearanceAt,createParticleSize,advanceParticleSize} from './sprint-effect.js';
import {weaponStateCue,weaponStateCues} from './weapon-cues.js';
import {loadTwinBladeEffectDefinitions} from './twin-blade-effects.js';
import {loadSpyDaggerEffectDefinitions,prepareSpyDaggerSequence} from './spy-dagger-effects.js';
import {loadBatEffectDefinitions} from './bat-effects.js';
import {loadSigmaBladeEffectDefinitions} from './sigma-blade-effects.js';
import {loadDeathScytheEffectDefinitions} from './death-scythe-effects.js';
import {loadDemonicKnuckleEffectDefinitions} from './demonic-knuckle-effects.js';
import {loadIronBootsEffectDefinitions} from './iron-boots-effects.js';
import {loadVitalShockEffectDefinitions} from './vital-shock-effects.js';
import {loadBreakerEffectDefinitions} from './breaker-effects.js';
import {resolveWeaponEffectSocket,weaponSurfaceImpactMatrix} from './weapon-effect-anchor.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import {LightningEffect} from './lightning-effect.js';
import {createResourceCache} from './resource-cache.js';
import {nodeLoaderOpacity} from './node-loader-opacity.js';
import {PlasmaRushEffect} from './plasma-rush-effect.js';
import {createMeleeArtRuntime} from './melee-art-runtime.js';
const SCALE=.006,point=new THREE.Vector3();
// A pooled instance can be cleared/reused while an earlier actor still keeps
// an exit record. Cancellation belongs to a particular play, not the object.
const effectActivations=new WeakMap();

// SEQ readers and SCN alpha/morph evidence: outputs/analyse-s5runtime/effets-decodes.
// Particle branches still being ported are documented there explicitly.
const corners=[[-1,1],[1,1],[-1,-1],[-1,-1],[1,1],[1,-1]],uvCorners=[0,1,2,2,1,3];
const particleQ=new THREE.Quaternion(),particleEuler=new THREE.Euler(),v3=new THREE.Vector3(),p3=new THREE.Vector3(),s3=new THREE.Vector3();
export class Particles extends SprintEffect{
 constructor(config,textures,{random=Math.random}={}){
  super({...config,capacity:Math.max(1,config.capacity)},textures[0],{random});
  this.mesh.visible=false;this.emitterAge=0;this.burstDone=false;this.pendingEmissionCount=0;this.anchorMatrix=new THREE.Matrix4();
  this.materials=textures.map((texture,i)=>{const material=i?this.material.clone():this.material;texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;
   material.blending=config.native['20']===0?THREE.NormalBlending:THREE.AdditiveBlending;return material;});
  this.mesh.material=this.materials;
  this.buckets=textures.map(()=>[]);
 }
 clear(){super.clear();this.emitterAge=0;this.burstDone=false;this.pendingEmissionCount=0;}
 commitEmission(actor){
  const count=this.pendingEmissionCount;this.pendingEmissionCount=0;
  for(let i=0;i<count&&this.particles.length<this.config.capacity;i++)this.spawn(actor);
 }
 spawn(actor){
  const c=this.config,r=this.random,e=c.emitterKeys[0],get=k=>e['object+'+k];
  const life=(c.lifeMs+Math.trunc((r()-r())*c.lifeVariationMs))/1000;if(life<=0)return;
  const radius=get('38')+r()*(get('3c')-get('38')),height=get('40')+r()*(get('44')-get('40'));
  const azimuth=r()*Math.PI*2,polar=r()*Math.PI*2;
  const local=get('34')===1?new THREE.Vector3(radius*Math.cos(azimuth),height,radius*Math.sin(azimuth)):
   new THREE.Vector3(radius*Math.sin(polar)*Math.cos(azimuth),height*Math.cos(polar),radius*Math.sin(polar)*Math.sin(azimuth));
  const position=new THREE.Vector3(get('14'),get('18'),get('1c')).add(local).multiplyScalar(SCALE);
  const velocity=new THREE.Vector3(get('20'),get('24'),get('28')).multiplyScalar((c.speed+(r()-r())*c.speedVariation)*SCALE);
  // Native 113720b multiplies the stored direction (it need not be unit length)
  // then applies the emitter rotation and three independent spread rotations.
  const orientedLocal=!!c.anchorRotation&&(this.followActor||!!c.native['54']);
  actor.matrix.decompose(p3,particleQ,s3);if(!this.followActor&&!orientedLocal)velocity.applyQuaternion(particleQ);
  const spread=get('2c')*Math.PI/180;
  particleEuler.set((r()-r())*spread,(r()-r())*spread,(r()-r())*spread,'ZYX');velocity.applyEuler(particleEuler);
  const emissionDirection=this.followActor?new THREE.Vector3(get('20'),get('24'),get('28')).applyEuler(particleEuler):null;
  const localSpace=this.followActor||!!c.native['54'];
  if(!localSpace)position.applyQuaternion(particleQ).add(actor.position);
  const initial=get('60'),texture=initial<0?Math.floor(r()*c.textures.length):initial%c.textures.length;
  this.particles.push({age:0,life,size:createParticleSize(c,life,r),position,velocity,emissionDirection,
   acceleration:new THREE.Vector3(...c.acceleration).multiplyScalar(SCALE),localSpace,texture,textureStep:0,initialTexture:texture});
 }
 update(dt,actor){
  this.anchorMatrix.copy(actor.matrix);if(!(dt>0))return;this.pendingEmissionCount=0;const c=this.config,e=c.emitterKeys[0];
  for(const p of this.particles){
   p.age+=dt;p.position.addScaledVector(p.velocity,dt);p.velocity.addScaledVector(p.acceleration,dt);
   if(p.age<p.life)advanceParticleSize(p.size,c,p.life,p.age,dt,this.random);
   const mode=c.native['1c'],step=mode===1?Math.floor(p.age/p.life*c.textures.length):Math.floor(p.age*1000/Math.max(1,c.native['60']));
   if(mode&&step>p.textureStep){p.textureStep=step;p.texture=mode===3?Math.floor(this.random()*c.textures.length):(p.initialTexture+step)%c.textures.length;}
  }
  this.particles=this.particles.filter(p=>p.age<p.life);this.emitterAge+=dt;
  if(!actor.sprinting){this.remainder=0;return;}
  let count=0;
  if(e['object+10']){this.remainder+=Math.min(dt,.25)*c.rate;count=Math.floor(this.remainder);this.remainder-=count;}
  else if(!this.burstDone){count=c.rate;this.burstDone=true;}
  this.pendingEmissionCount=count;
  if(!actor.deferEmission)this.commitEmission(actor);
 }
 render(camera){
  this.mesh.visible=this.particles.length>0;if(!this.mesh.visible)return;
  if(this.followActor||this.config.anchorRotation)this.anchorMatrix.decompose(p3,particleQ,s3);
  for(const bucket of this.buckets)bucket.length=0;
  for(const p of this.particles)this.buckets[p.texture].push(p);
  this.geometry.clearGroups();let vertex=0;
  for(let texture=0;texture<this.buckets.length;texture++){
   const start=vertex,uv=this.config.textureUVs[texture];
   for(const p of this.buckets[texture]){
    const appearance=appearanceAt(this.config.appearance,p.age/p.life),[,,,r,g,b,a]=appearance;
    const center=v3.copy(p.position);
    if(p.localSpace){if(this.followActor||this.config.anchorRotation)center.applyQuaternion(particleQ);center.add(p3.setFromMatrixPosition(this.anchorMatrix));}
    const mode=this.config.native['18'];
    if(mode===3){this.right.set(1,0,0);this.axis.set(0,0,1);}
    else if(mode===1){
     this.axis.copy(p.velocity).normalize();
     // Stationary rush streaks still have an authored direction. Their radial
     // spawn position spreads them around the body; it must not aim the wind.
     if(this.followActor&&this.axis.lengthSq()<1e-8&&p.emissionDirection)this.axis.copy(p.emissionDirection).normalize();
     if(this.axis.lengthSq()<1e-8)this.axis.copy(p.position).normalize();
     if(this.axis.lengthSq()<1e-8)this.axis.set(0,1,0);
     if(this.followActor||this.config.anchorRotation&&p.localSpace)this.axis.applyQuaternion(particleQ);
     this.view.subVectors(camera.position,center).normalize();this.right.crossVectors(this.view,this.axis).normalize();
     if(this.right.lengthSq()<1e-8)this.right.setFromMatrixColumn(camera.matrixWorld,0);
    }else{this.right.setFromMatrixColumn(camera.matrixWorld,0);this.axis.setFromMatrixColumn(camera.matrixWorld,1);}
    const angle=appearance[7]*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
    for(let j=0;j<6;j++){
     const [x,y]=corners[j],dx=x*p.size.width*SCALE*.5,dy=y*p.size.height*SCALE*.5;
     point.copy(center).addScaledVector(this.right,dx*cos-dy*sin).addScaledVector(this.axis,dx*sin+dy*cos);
     point.toArray(this.positions,vertex*3);this.colors.set([r,g,b,a],vertex*4);
     const uvOut=this.geometry.attributes.uv.array,uvIndex=uvCorners[j]*2;uvOut[vertex*2]=uv[uvIndex];uvOut[vertex*2+1]=uv[uvIndex+1];vertex++;
    }
   }
   if(vertex>start)this.geometry.addGroup(start,vertex-start,texture);
  }
  this.geometry.setDrawRange(0,vertex);for(const name of ['position','color','uv'])this.geometry.attributes[name].needsUpdate=true;
 }
}
export function inheritEffectMatrix(parent,destination,modes,out){
 parent.decompose(inheritP[0],inheritQ[0],inheritS[0]);destination.decompose(inheritP[1],inheritQ[1],inheritS[1]);
 return out.compose(inheritP[modes.positionMode],inheritQ[modes.rotationMode],inheritS[modes.scaleMode]);
}
const inheritP=[new THREE.Vector3(),new THREE.Vector3()],inheritQ=[new THREE.Quaternion(),new THREE.Quaternion()],inheritS=[new THREE.Vector3(),new THREE.Vector3()];
const rootScale=new THREE.Vector3(SCALE,SCALE,SCALE),axisY=new THREE.Vector3(0,1,0);
export class Sequence{
 constructor(data,nodes,scene){
  this.data=data;this.nodes=nodes;this.age=Infinity;this.origin=new THREE.Vector3();this.anchor=new THREE.Vector3();
  this.rootMatrix=new THREE.Matrix4();this.rootQ=new THREE.Quaternion();this.byId=new Map(nodes.map(n=>[n.id,n]));
  this.controls=data.nodes.filter(n=>n.type==='CActNodeControl');this.snapshots=new Map();
  for(const n of nodes){n.matrix=new THREE.Matrix4();n.previousMatrix=new THREE.Matrix4();n.controls=this.controls.filter(c=>c.parentType===1&&c.parent===n.id);
   if(n.particles)scene.add(n.particles.mesh);else if(n.lightning)scene.add(n.lightning.mesh);else scene.add(n.group);if(n.group)n.group.visible=false;
  }
 }
 trigger(position,avatar=null,{follow=false,followBones=false,duration=null,facing=0,rootBone=null,anchorMatrix=null,actorSceneRoot=false,externalNodes=null,loop=false,postPoseEmission=false,hideModelNodes=false}={}){
  const resolvedDuration=duration??this.data.duration;
  if(typeof loop!=='boolean'||loop&&!(resolvedDuration>0&&Number.isFinite(resolvedDuration)))throw new RangeError('Explicit loop flag and positive finite loop duration required');
  if(typeof actorSceneRoot!=='boolean'||actorSceneRoot&&(!avatar?.rig||rootBone||anchorMatrix))throw Error('Explicit avatar scene root required, without another root override');
  this.clear();this.origin.copy(position);this.avatar=avatar;this.follow=follow;this.followBones=followBones;this.facing=facing;this.age=0;this.duration=resolvedDuration;this.postPoseEmission=postPoseEmission;
  this.loop=loop;this.clock=0;this.previousClock=0;this.hideModelNodes=hideModelNodes;
  this.rootQ.setFromAxisAngle(axisY,facing+Math.PI);this.rootMatrix.compose(this.origin,this.rootQ,rootScale);
  avatar?.group.updateWorldMatrix(true,true);
  this.rootBone=rootBone;this.actorSceneRoot=actorSceneRoot;
  this.rootSnapshot=actorSceneRoot?avatar.rig.matrixWorld.clone():anchorMatrix?.clone()??(rootBone?avatar?.bones.get(rootBone)?.matrixWorld.clone():null);
  if(rootBone&&!this.rootSnapshot)throw Error('Missing effect socket '+rootBone);
  if(this.rootSnapshot)this.rootMatrix.copy(this.rootSnapshot);
  this.externalNodes=externalNodes?[externalNodes[0]??this.rootMatrix,...externalNodes.slice(1)]:null;
  for(const n of this.nodes){n.started=false;n.loaderOpacity=0;n.matrix.copy(this.rootMatrix);n.previousMatrix.copy(this.rootMatrix);}
  // Detached effects retain their original bone pose instead of following later movement.
  if(avatar)for(const [name,bone] of avatar.bones)this.snapshots.set(name,bone.matrixWorld.clone());
 }
 clear(){this.age=Infinity;this.avatar=null;this.externalNodes=null;this.snapshots.clear();for(const n of this.nodes){n.textureAnimation?.clear();n.particles?.clear();n.lightning?.clear();if(n.group)n.group.visible=false;if(n.particles)n.particles.mesh.visible=false;}}
 sample({emitPending=false}={}){
  if(!Number.isFinite(this.age)||!(this.follow||this.followBones)||!this.avatar)return;
  // The mixer runs after the fixed combat tick for the local player. Refresh
  // socket placement again after that pose without advancing clocks, emitting
  // particles twice or moving previously detached world-space particles.
  this.avatar.group.updateWorldMatrix(true,true);
  if(this.follow){
   if(this.actorSceneRoot)this.rootMatrix.copy(this.avatar.rig.matrixWorld);
   else if(this.rootBone)this.rootMatrix.copy(this.avatar.bones.get(this.rootBone).matrixWorld);
   else{
    this.origin.copy(this.avatar.group.position);this.avatar.group.getWorldQuaternion(this.rootQ);
    this.rootMatrix.compose(this.origin,this.rootQ,rootScale);
   }
  }
  for(const n of this.nodes)n.placed=false;
  const visiting=new Set();for(const n of this.nodes)this.place(n,visiting);
  for(const n of this.nodes)if(n.particles){
   n.particles.anchorMatrix.copy(n.matrix);
   if(emitPending)n.particles.commitEmission({matrix:n.matrix,position:this.anchor.setFromMatrixPosition(n.matrix)});
  }
 }
 externalMatrix(id){const node=this.externalNodes?.[id];return node?.isObject3D?node.matrixWorld:node??null;}
 resolve(type,id,bone,visiting){
  if(type===0){
   if(this.externalNodes&&id!==0)return this.externalMatrix(id);
   if(bone){const b=this.follow||this.followBones?this.avatar?.bones.get(bone):null;if(b)return b.matrixWorld;const snapshot=this.snapshots.get(bone);if(snapshot)return snapshot;}
   return this.rootMatrix;
  }
  const parent=this.byId.get(id);if(!parent){if(this.data.strictNamedParents)throw Error(`Missing required effect action parent ${id}`);return null;}
  this.place(parent,visiting);
  const named=bone?parent.effect?.byName.get(bone):null;
  if(bone&&!named&&this.data.strictNamedParents)throw Error(`Missing required effect parent node ${id}/${bone}`);
  return bone?(named?.matrixWorld||parent.matrix):parent.matrix;
 }
 place(n,visiting){
  if(n.placed||visiting.has(n.id))return;
  visiting.add(n.id);
  const parent=this.resolve(n.parentType,n.parent,n.bone,visiting);
  n.matrix.copy(parent||this.rootMatrix);
  for(const c of n.controls){
   const end=this.duration>this.data.duration&&c.end===this.data.duration?this.duration:c.end;
   if(this.clock<c.start||this.clock>=end||!c.control.inherit)continue;
   const d=c.control,self=d.destType===1&&d.destId===n.id&&!d.destNode;
   const destination=self?n.previousMatrix:this.resolve(d.destType,d.destId,d.destNode,visiting);
   if(destination&&parent)inheritEffectMatrix(parent,destination,d,n.matrix);
  }
  if(n.group){n.matrix.decompose(n.group.position,n.group.quaternion,n.group.scale);n.group.updateMatrixWorld(true);}
  visiting.delete(n.id);n.placed=true;
 }
 update(dt,{deferAvatarEmissions=false}={}){
  if(!Number.isFinite(this.age))return;
  this.age+=dt;if(!this.loop&&this.age>this.duration+2.6){this.clear();return;}
  if((this.follow||this.followBones)&&this.avatar)this.avatar.group.updateWorldMatrix(true,true);
  if(this.follow&&this.avatar){if(this.loop)this.avatar.group.getWorldPosition(this.origin);else this.origin.copy(this.avatar.group.position);this.avatar.group.getWorldQuaternion(this.rootQ);}
  this.rootMatrix.compose(this.origin,this.rootQ,rootScale);
  if(this.rootSnapshot)this.rootMatrix.copy(this.follow?(this.actorSceneRoot?this.avatar.rig:this.avatar.bones.get(this.rootBone)).matrixWorld:this.rootSnapshot);
  this.previousClock=this.clock;
  let clock=this.loop?this.clock+dt:this.age;
  // Native119FAE0 wraps the existing controller only after current > end.
  // This renderer uses browser seconds, not a claimed native x87/FISTP clock.
  if(this.loop&&clock>this.duration)clock=(clock-this.duration)%this.duration;
  this.clock=clock;
  // Update authored mesh tracks before resolving attachments to their animated children.
  for(const n of this.nodes){
   n.placed=false;n.previousMatrix.copy(n.matrix);
   const end=this.duration>this.data.duration&&n.end===this.data.duration?this.duration:n.end;
   // Native CActParticle time gate1201490 includes both endpoints. Keep the
   // established one-shot rendering unchanged; opt-in loops use that gate.
   n.live=clock>=n.start&&(this.loop&&(n.particles||n.loader?.inclusiveEnd)?clock<=Math.min(end,this.duration):clock<Math.min(end,this.duration));
   if(n.effect){
    const local=Math.max(0,clock-n.start);
    n.loaderOpacity=nodeLoaderOpacity(n.loaderOpacity,clock*1000,n.start*1000,end*1000,n.loader.fadeInMs||0,n.loader.fadeOutMs||0);
    n.live=clock>=n.start&&clock<=end||n.loaderOpacity>0;
    n.group.visible=n.live&&!this.hideModelNodes;n.effect.update(local,n.loaderOpacity);if(n.live)n.textureAnimation?.update(local);
   }
  }
  const visiting=new Set();for(const n of this.nodes)this.place(n,visiting);
  for(const n of this.nodes)if(n.particles){
   this.anchor.setFromMatrixPosition(n.matrix);
   // Advance existing particles now, but birth new particles only once the
   // owning avatar's current pose has supplied the emitter matrix.
   const actor={position:this.anchor,facing:this.facing,sprinting:n.live,matrix:n.matrix,
    deferEmission:deferAvatarEmissions&&this.postPoseEmission&&!!this.avatar&&(this.follow||this.followBones)};
   n.particles.update(dt,actor);
  }
  for(const n of this.nodes)if(n.lightning){
   const d=n.destination,destination=d.type===0?this.externalMatrix(d.id):this.resolve(d.type,d.id,d.bone,new Set());
   const start=n.parentType===0?this.externalMatrix(n.parent):n.matrix;
   n.lightning.update(dt,n.live,start,destination);
  }
 }
 render(camera){if(Number.isFinite(this.age))for(const n of this.nodes){n.particles?.render(camera);n.lightning?.render(camera);if(n.live)n.effect?.render(camera);}}
}
const COMBAT_EFFECT_LOADERS={
 async plasma(){return {plasma_rush_spectral:{duration:1.3,nodes:[],presentation:'plasma-rush-spectral'}};},
 dagger:loadSpyDaggerEffectDefinitions,twinblade:loadTwinBladeEffectDefinitions,bat:loadBatEffectDefinitions,
 sigmablade:loadSigmaBladeEffectDefinitions,vitalshock:loadVitalShockEffectDefinitions,
 deathscythe:loadDeathScytheEffectDefinitions,demonicknuckle:loadDemonicKnuckleEffectDefinitions,
 breaker:loadBreakerEffectDefinitions,
 async assassinclaw(){const claw=await readAsset('/assets/s5runtime/assassin-claw/effects-runtime.json');return {assassin_claw_body:claw.weapon_mindshock_body};},
 async ironboots(){return Object.fromEntries(Object.entries(await loadIronBootsEffectDefinitions()).map(([name,data])=>['ironboots_'+name,data]));},
 async katana(){
  const names=['katanaa_atk01','katanaa_atk02','katanaa_atk03','katanaa_s_atk','katana_damege','katana_damege_obj'];
  const [extra,...sequences]=await Promise.all([readAsset('/assets/s5runtime/effects/katana/extra-runtime.json'),...names.map(name=>readAsset(`/assets/s5runtime/effects/katana/sequences/${name}.json`))]);
  return {...extra,...Object.fromEntries(names.map((name,index)=>{
   const converted=convertParticleSequence(sequences[index],'/assets/s5runtime/effects/katana');
   // Keep the existing exclusion of two authored nodes with no texture.
   return [name,{...converted,nodes:converted.nodes.filter(node=>node.textures.length>0)}];
  }))};
 },
};
export const COMBAT_EFFECT_WEAPONS=Object.freeze(Object.keys(COMBAT_EFFECT_LOADERS));
export async function loadCombatEffects(scene,{weapons=COMBAT_EFFECT_WEAPONS}={}){
 // Retain the established shared baseline (status, contacts, Plasma/Counter).
 // The old eager merge ended with Demonic's shared backattack definition.
 // Reading this small table preserves that precedence without constructing
 // the other Demonic effects or changing another weapon's contact rendering.
 const [base,demonic]=await Promise.all([readAsset('/assets/s5runtime/combat/sequences.json'),loadDemonicKnuckleEffectDefinitions()]);
 const runtime=await loadEffectRuntime(scene,{...base,backattack_sword_s:demonic.backattack_sword_s}),prepared=new Map();
 runtime.sharedSequences=Object.freeze(Object.keys(base));
 runtime.prepareWeapon=weapon=>{
  if(!Object.hasOwn(COMBAT_EFFECT_LOADERS,weapon))return Promise.resolve(null);
  if(!prepared.has(weapon)){
   const pending=Promise.resolve().then(()=>COMBAT_EFFECT_LOADERS[weapon]()).then(definitions=>{
    // Shared names were already resolved using the previous merge's priority.
    const own=Object.fromEntries(Object.entries(definitions).filter(([name])=>!Object.hasOwn(base,name)));
    return runtime.extend(own);
   });
   prepared.set(weapon,pending);pending.catch(()=>{if(prepared.get(weapon)===pending)prepared.delete(weapon);});
  }
  return prepared.get(weapon);
 };
 await Promise.all(weapons.map(weapon=>runtime.prepareWeapon(weapon)));
 return runtime;
}
export async function loadEffectRuntime(scene,definitions,{random15=randomTextureSample}={}){
 const pools=new Map(),factories=new Map(),pending=new Map(),uploadedTextures=new WeakMap();
 const art=createMeleeArtRuntime(scene);
 // Preserve the existing two overlapping plays, but reserve them per combat
 // participant before starting. Unusual bursts can still grow without dropping
 // or overwriting another actor's active effect.
 let participantCapacity=1;
 const reservedSlots=name=>Math.max(name==='backattack_sword_s'?4:2,participantCapacity*2);
 const texture=createResourceCache(url=>new THREE.TextureLoader().loadAsync(url)),asset=createResourceCache(readAsset);
 function prepare(name,data){
  if(pools.has(name))return Promise.resolve();
  if(pending.has(name))return pending.get(name);
  const task=Promise.resolve().then(async()=>{
  const pool=[];
  // Load once, then construct independent instances synchronously. No active
  // sequence is overwritten when more actors or contacts exceed warm capacity.
  const nodeFactories=await Promise.all(data.nodes.filter(n=>n.type!=='CActNodeControl').map(async n=>{
   if(n.type==='CActParticle'){
    const maps=await Promise.all(n.textures.map(texture));
    return ()=>({...n,particles:new Particles(n,maps)});
   }
   if(n.type==='CActLightning'){const map=await texture(n.texture);return ()=>({...n,lightning:new LightningEffect(n,map)});}
   const model=await asset(n.asset),options={animation:n.loader.animation,loop:!!n.loader.loop,nativeHierarchy:n.loader.nativeHierarchy??false,includeSourceBones:!!n.loader.includeSourceBones,sourceOrigin:n.loader.sourceOrigin,sourceTransformTracks:!!n.loader.sourceTransformTracks,sourceEffectTracks:n.loader.sourceEffectTracks,sourceHierarchy:n.loader.sourceHierarchy};
   const frameMaps=n.loader.textureAnimation?await Promise.all(n.loader.textureAnimation.frames.map(async url=>{
    const map=await texture(url);map.flipY=false;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;return map;
   })):null;
   const template=await loadEffectScene(model,options),instantiate=createEffectSceneFactory(model,template,options);
   return ()=>{
    const effect=instantiate(),group=new THREE.Group();group.add(effect.group);
    return {...n,group,effect,textureFrames:frameMaps,textureAnimation:frameMaps?bindNodeLoaderTextures(effect,n.loader.textureAnimation,frameMaps,random15):null};
   };
  }));
  const instantiate=()=>{
   if(data.presentation==='plasma-rush-spectral')return new PlasmaRushEffect(scene);
   const sequence=new Sequence(data,nodeFactories.map(create=>create()),scene);
   return name==='shortknife01'?prepareSpyDaggerSequence(sequence):sequence;
  };
  factories.set(name,instantiate);
  for(let i=0;i<reservedSlots(name);i++){
   pool.push(instantiate());
  }
  pools.set(name,pool);
  }).finally(()=>pending.delete(name));pending.set(name,task);return task;
 }
 const runtime={
  prepareArtAvatar:(avatar,owner,settings)=>art.prepareAvatar(avatar,owner,settings),
  releaseArtAvatar:avatar=>art.releaseAvatar(avatar),
  playArtAttack:(avatar,attack)=>art.select(avatar,attack),
  playArtImpact:(attack,position,options)=>art.impact(attack,position,options),
  artState:()=>art.snapshot(),
  clearArtAvatar:avatar=>art.clear(avatar),
  reserveForParticipants(count){
   if(!Number.isSafeInteger(count)||count<1||count>32)throw new RangeError('Effect participant capacity must be an integer from 1 to 32');
   if(count<=participantCapacity)return [];
   participantCapacity=count;const changed=[];
   for(const [name,pool]of pools){
    const target=reservedSlots(name);if(pool.length>=target)continue;
    while(pool.length<target)pool.push(factories.get(name)());
    changed.push(name);
   }
   return changed;
  },
  async extend(next){
   const names=Object.keys(next);await Promise.all(Object.entries(next).map(([name,data])=>prepare(name,data)));
   return {names,warmup:(renderer,camera)=>runtime.warmup(renderer,camera,names)};
  },
  sequenceNames(){return [...pools.keys()];},
  textureAnimationState(){return [...pools].flatMap(([sequence,pool])=>pool.filter(e=>Number.isFinite(e.age)).flatMap(e=>e.nodes.flatMap(n=>{const state=n.textureAnimation?.snapshot();return state?[{sequence,id:n.id,age:e.age,live:n.live,avatarId:e.avatar?.group.uuid,...state}]:[];})));},
  play(name,position,avatar,options){
   const pool=pools.get(name);if(!pool)return null;
   let effect=pool.find(e=>!Number.isFinite(e.age));
   if(!effect){
    effect=factories.get(name)();pool.push(effect);
   }
   effect.trigger(position,avatar,options);effectActivations.set(effect,{});return effect;
  },
  update(dt,options){art.update(dt);for(const pool of pools.values())for(const e of pool)e.update(dt,options);},
  sampleAvatar(avatar,options){art.sampleAvatar(avatar,options);for(const pool of pools.values())for(const e of pool)if(e.avatar===avatar)e.sample?.(options);},
  render(camera){art.render(camera);for(const pool of pools.values())for(const e of pool)e.render(camera);},
  clear(){art.clear();for(const pool of pools.values())for(const e of pool)e.clear();followingAttackEffects.delete(runtime);},
  clearForAvatar(avatar){if(!avatar)return;art.clear(avatar);for(const pool of pools.values())for(const e of pool)if(e.avatar===avatar)e.clear();followingAttackEffects.get(runtime)?.delete(avatar);},
  lightningState(){return [...pools].flatMap(([name,pool])=>pool.filter(e=>Number.isFinite(e.age)).flatMap(e=>e.nodes.filter(n=>n.lightning).map(n=>({sequence:name,id:n.id,age:e.age,visible:n.lightning.mesh.visible,opacity:n.lightning.clock.opacity,scroll:n.lightning.clock.scroll,start:n.lightning.start.toArray(),end:n.lightning.end.toArray(),positions:Array.from(n.lightning.geometry.attributes.position.array)}))));},
  async warmup(renderer,camera,names=pools.keys()){
   // Compile visible proxies instead of toggling live pooled instances. Two
   // concurrent preparations must not restore one another's visibility state.
   const stage=new THREE.Scene(),maps=new Set();stage.fog=scene.fog;stage.environment=scene.environment;
   for(const name of names)for(const e of pools.get(name)||[])for(const n of e.nodes){
    for(const map of n.textureFrames??[])maps.add(map);
    const root=n.group||n.particles?.mesh||n.lightning?.mesh;if(!root)continue;
    root.traverse(object=>{
     if(!object.isMesh)return;
     // Keep the mesh type and shared skeleton so skinning shaders are prepared
     // too; a plain Mesh proxy would compile only the rigid variant.
     const proxy=object.clone(false);proxy.visible=true;proxy.frustumCulled=false;stage.add(proxy);
     for(const material of Array.isArray(object.material)?object.material:[object.material])
      for(const value of Object.values(material))if(value?.isTexture)maps.add(value);
    });
   }
   try{
    if(renderer.initTexture){
     let uploaded=uploadedTextures.get(renderer);if(!uploaded){uploaded=new WeakSet();uploadedTextures.set(renderer,uploaded);}
     for(const map of maps)if(!uploaded.has(map)){renderer.initTexture(map);uploaded.add(map);}
    }
    await renderer.compileAsync(stage,camera,scene);
   }finally{stage.clear();}
  },
 };
 await runtime.extend(definitions);return runtime;
}

export function attackEffectCue(attack){
 return weaponStateCue(attack);
}
const playedAttackCues=new WeakMap();
const followingAttackEffects=new WeakMap();
const attackCueExpired=(cue,attack)=>Number.isFinite(cue.stopAfterMs)&&(attack.timeMs??attack.time*1000)>cue.stopAfterMs;
const stopAttackEffect=entry=>{if(entry.activation!==undefined&&effectActivations.get(entry.effect)!==entry.activation)return;const effect=entry.effect;if(effect?.stop)effect.stop();else effect?.clear();};
export function playAttackEffects(runtime,attack,position,avatar,facing,{collision}={}){
 const artistic=runtime.playArtAttack?.(avatar,attack)===true;
 if(avatar){
  let actors=followingAttackEffects.get(runtime);if(!actors){actors=new WeakMap();followingAttackEffects.set(runtime,actors);}
  const previous=actors.get(avatar);
  if(previous&&previous.attack!==attack){for(const entry of previous.effects)stopAttackEffect(entry);actors.delete(avatar);}
  else if(previous){
   previous.effects=previous.effects.filter(entry=>{if(!attackCueExpired(entry,attack))return true;stopAttackEffect(entry);return false;});
   if(!previous.effects.length)actors.delete(avatar);
  }
 }
 if(!attack)return;
 const stateTimeMs=attack.timeMs??attack.time*1000;
 if(!Number.isFinite(stateTimeMs))return;
 let played=playedAttackCues.get(attack);if(!played){played=new Set();playedAttackCues.set(attack,played);}
 for(const [index,cue] of weaponStateCues(attack).entries()){
  // Qualified actor-state events cross strictly after their native threshold.
  // Presentation/contact cues retain their existing inclusive policy.
  if((cue.sourceClock==='actor-state'?stateTimeMs<=cue.at*1000:stateTimeMs<cue.at*1000)||played.has(index))continue;
  played.add(index);if(attackCueExpired(cue,attack))continue;
  const socket=cue.weaponSocket?resolveWeaponEffectSocket(avatar,cue.weaponSocket):undefined;
  const surface=cue.surfaceImpact?weaponSurfaceImpactMatrix(avatar,socket,collision,cue.surfaceImpact):null;
  if(cue.surfaceImpact&&!surface)continue;
  const effect=runtime.play(cue.name,position,avatar,{follow:cue.follow,duration:cue.duration,facing,
   ...(artistic&&replaceNativeAttackModels(attack)?{hideModelNodes:true}:{}),
   ...(!['plasma','dagger','counter'].includes(attack.weapon)?{postPoseEmission:true}:{}),
   ...(surface?{anchorMatrix:surface}:socket!==undefined?{rootBone:socket}:{}),
   ...(cue.rootBone!==undefined?{rootBone:cue.rootBone}:{}),...(cue.followBones!==undefined?{followBones:cue.followBones}:{}),
   ...(cue.actorSceneRoot!==undefined?{actorSceneRoot:cue.actorSceneRoot}:{}),
   ...(cue.loop!==undefined?{loop:cue.loop}:{}),...(cue.cancelOnExit?{attack}:{})});
  if(cue.cancelOnExit&&avatar){
   const actors=followingAttackEffects.get(runtime),current=actors.get(avatar)??{attack,effects:[]};
   current.effects.push({effect,stopAfterMs:cue.stopAfterMs,activation:effectActivations.get(effect)});actors.set(avatar,current);
  }
 }
}
