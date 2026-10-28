import {Vector3,Triangle} from 'three';
import {TUNING} from './movement-profile.js';
import {createMapDestructibleState,toNativeDestructibleDamage,resolveNativeBlastDamage} from './map-destructible-state.js';
import {createMapWeaponQuery} from './map-weapon-query.js';
import {queryMapWeaponVolume} from './map-weapon-volume-query.js';
import {nativeDestructibleCollisionMetadata} from './native-collision-registration.js';
import {classifyRestorationContainment} from './map-restoration-containment.js';

// Bind source instances to derived query/visual state. Native buffers, UVs,
// transforms and the shared material definitions remain unchanged.
export function installAliceHouseDestructibles(world,data,{effects=null}={}){
 if(data?.schema!=='alice-house-source-destructibles-v1'||data.nativeMapId!==225||data.instances?.length!==27)throw Error('Alice destructible contract mismatch');
 const meshes=new Map(world.sourceMeshes.map(mesh=>[mesh.userData.sourceModelIndex,mesh]));
 const byKey=new Map(),colliderOwners=new Map(),fadeMaterials=new Set(),actors=new Set(),views=new WeakMap(),presenceReaders=new WeakMap();
 const history=[];let audioGain=()=>1,millisecondRemainder=0,disposed=false;
 const sounds=new Set();
 for(const instance of data.instances){
  const mesh=meshes.get(instance.sourceModelIndex);
  if(!mesh||mesh.name!==instance.name||mesh.userData.sourceNodeIndex!==instance.sourceNodeIndex||byKey.has(instance.key))throw Error('Alice destructible visual identity mismatch');
  const originalMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const entry={...instance,mesh,originalMaterial:mesh.material,originalMaterials,faded:null,visible:mesh.visible,records:[]};
  byKey.set(instance.key,entry);
  for(const collider of instance.colliders){
   const object=meshes.get(collider.sourceModelIndex);
   if(!object||object.name!==collider.name||object.userData.sourceNodeIndex!==collider.sourceNodeIndex||colliderOwners.has(collider.sourceModelIndex))throw Error('Alice destructible collision identity mismatch');
   colliderOwners.set(collider.sourceModelIndex,entry);
  }
 }
 const state=createMapDestructibleState({profiles:data.profiles,instances:data.instances.map(instance=>({instanceKey:instance.key,profileKey:instance.profileKey,
  sourceRecord:{sourceModelIndex:instance.sourceModelIndex,sourceNodeIndex:instance.sourceNodeIndex,name:instance.name}}))});
 const rawTriangles=world.triangles,rawRecords=world.queryTriangleRecords,rawMeshes=world.meshes;
 const recordForTriangle=new Map(rawTriangles.map((triangle,index)=>[triangle,rawRecords[index]]));
 const brokenRecords=rawRecords.filter(record=>colliderOwners.has(record.sourceModelIndex)).map(record=>{
  const instance=colliderOwners.get(record.sourceModelIndex),bound={...record,instanceKey:instance.key};instance.records.push(bound);return bound;
 });
 const expectedBrokenRecords=world.runtimeCollisionAdaptations?
  [...colliderOwners.keys()].reduce((total,id)=>total+(world.runtimeCollisionAdaptations.recordsCountsByModel[id]??0),0):406;
 if(brokenRecords.length!==expectedBrokenRecords||byKey.size!==27)throw Error('Alice destructible triangle binding changed');
 const weaponRecords=world.weaponTriangleRecords;
 if(!Array.isArray(weaponRecords)||weaponRecords.length!==1047)throw Error('Alice source weapon records missing');
 const query=createMapWeaponQuery({staticRecords:weaponRecords,brokenRecords,readVersion:()=>state.collisionRevision,readInstanceState:key=>state.readInstanceState(key)});
 const originalFactory=world.collisionWorldForActor.bind(world),originalRole=world.setActorCollisionRole.bind(world);
 const ownedWorldProperties=['collisionWorldForActor','setActorCollisionRole','meshes','mapObjects','mapWeaponQuery','advanceMapObjects','resetMapObjects','setMapObjectAudioSettings','warmMapObjects'];
 const originalWorldDescriptors=new Map(ownedWorldProperties.map(key=>[key,Object.getOwnPropertyDescriptor(world,key)]));
 const metadataDescriptors=new Map(),ownedMetadata=new Map();
 //734E70 registers piece colliders as80/world+8; enable34 follows ownerID.
 // Stage every metadata object before allocating or publishing the adapter.
 // Keep the original unfiltered source stream bound too. A visual collision
 // adaptation may replace query records while the native backend still needs
 // the original faces and the SAME current owner enable state.
 const sourceAndQueryRecords=new Set([...rawRecords,...(world.movementTriangleRecords??[])]);
 for(const record of sourceAndQueryRecords){
  const owner=colliderOwners.get(record.sourceModelIndex);if(!owner)continue;
  const collider=owner.colliders.find(entry=>entry.sourceModelIndex===record.sourceModelIndex);
  metadataDescriptors.set(record,Object.getOwnPropertyDescriptor(record,'nativeCollision'));
  ownedMetadata.set(record,nativeDestructibleCollisionMetadata({name:collider.name,instanceKey:owner.key,ownerSourceName:owner.name,
   readEnabled:()=>state.readInstanceState(owner.key).alive,sourceGeometry:!record.collisionAdaptation}));
 }
 // Validate all source bindings before allocating GPU resources or changing the
 // world. A failed clone also releases everything already allocated here.
 try{
  for(const entry of byKey.values()){
   const clones=new Map();entry.faded=entry.originalMaterials.map(material=>{
    if(!clones.has(material)){const clone=material.clone();fadeMaterials.add(clone);clone.transparent=true;clones.set(material,clone);}
    return clones.get(material);
   });
  }
 }catch(error){for(const material of fadeMaterials)material.dispose();throw error;}
 // S5 instanceKey identifies the existing ledger, not the numeric native ID.
 for(const [record,metadata] of ownedMetadata)record.nativeCollision=metadata;
 world.collisionWorldForActor=actor=>{
  // A collision consumer is a physical occupant independently of its Chaser
  // mask. Default/training and Deathmatch actors legitimately have a null role.
  if(views.has(actor)){actors.add(actor);return views.get(actor);}
  const sourceView=originalFactory(actor),view=Object.create(sourceView);let cached=null;actors.add(actor);
  const current=()=>{
   const source=sourceView.triangles,version=disposed?'disposed':state.collisionRevision;
   if(cached&&cached.source===source&&cached.version===version)return cached;
   const records=[],triangles=[];
   for(const triangle of source){const record=recordForTriangle.get(triangle),owner=colliderOwners.get(record.sourceModelIndex);
    if(!disposed&&owner&&!state.readInstanceState(owner.key).alive)continue;
    records.push(record);triangles.push(triangle);
   }
   cached={source,version,records,triangles};return cached;
  };
  Object.defineProperties(view,{triangles:{get:()=>current().triangles},queryTriangleRecords:{get:()=>current().records}});views.set(actor,view);return view;
 };
 world.setActorCollisionRole=(actor,role)=>{originalRole(actor,role);return world.collisionWorldForActor(actor);};
 let cameraCache=null;
 Object.defineProperty(world,'meshes',{configurable:true,get(){
  if(cameraCache?.version!==state.collisionRevision)cameraCache={version:state.collisionRevision,meshes:rawMeshes.filter(mesh=>{const owner=colliderOwners.get(mesh.userData.sourceModelIndex);return !owner||state.readInstanceState(owner.key).alive;})};
  return cameraCache.meshes;
 }});
 function syncVisuals(){
  for(const [key,entry] of byKey){
   const visual=state.readVisualState(key);entry.mesh.visible=entry.visible&&visual.alive;
   if(visual.phase==='restoring'){
    entry.mesh.material=Array.isArray(entry.originalMaterial)?entry.faded:entry.faded[0];
    entry.faded.forEach((material,index)=>{material.opacity=entry.originalMaterials[index].opacity*visual.opacity;});
   }else entry.mesh.material=entry.originalMaterial;
  }
 }
 function playSound(url){
  if(typeof Audio!=='function')return;
  const sound=new Audio(url);sound.volume=Math.max(0,Math.min(1,Number(audioGain())||0));sounds.add(sound);
  const release=()=>sounds.delete(sound);sound.addEventListener('ended',release,{once:true});sound.addEventListener('error',release,{once:true});
  sound.play().catch(release);
 }
 function drain(){
  const events=state.drainEvents();history.push(...events);if(history.length>200)history.splice(0,history.length-200);
  for(const event of events)if(event.type==='destroyed'){
   const instance=byKey.get(event.instanceKey),profile=data.profiles.find(profile=>profile.key===instance.profileKey);
   const position=instance.mesh.getWorldPosition(new Vector3());effects?.playDestruction({sequence:profile.effect,sound:profile.sound,position,facing:0,playSound});
  }
  syncVisuals();return events;
 }
 function canRestore(snapshot){
  const entry=byKey.get(snapshot.instanceKey),radii=new Vector3(TUNING.radius,TUNING.height/2,TUNING.radius),closest=new Vector3();
  for(const actor of actors){
   if(!actor.position||actor.world!==world)continue;
   const presence=presenceReaders.get(actor);
   if(presence){const present=presence.readPresent();if(typeof present!=='boolean')throw TypeError('Current map actor presence must be synchronous boolean');if(!present)continue;}
   const centre=new Vector3(actor.position.x,actor.position.y+radii.y,actor.position.z).divide(radii);
   for(const record of entry.records){const triangle=new Triangle(...record.points.map(point=>point.clone().divide(radii)));
    if(triangle.closestPointToPoint(centre,closest).distanceToSquared(centre)<=1+1e-6)return false;
   }
   if(classifyRestorationContainment(entry.records,{x:actor.position.x,y:actor.position.y+radii.y,z:actor.position.z}).inside)return false;
  }
  return true;
 }
 const runtime={state,query,bindings:data,instances:byKey,playSound,
  // Role clearing changes a collision mask; retiring a body is a separate
  // lifecycle action. A reused Controller re-enrols through its world factory.
  releaseActor(actor){return actors.delete(actor);},
  bindActorPresence(actor,readPresent){
   if(!actor||!['object','function'].includes(typeof actor)||typeof readPresent!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(readPresent.constructor?.name))throw TypeError('Explicit actor and synchronous current-presence reader required');
   const binding={readPresent};presenceReaders.set(actor,binding);
   return ()=>{if(presenceReaders.get(actor)===binding)presenceReaders.delete(actor);};
  },
  commit(hit,context){
   if(!hit?.token?.instanceKey)return {accepted:false,reason:'no-destructible-contact'};
   if(context?.enableBlast===false)return {accepted:false,reason:'source-disabled-S5-conservative'};
   if(!Number.isInteger(context?.damageEnum)||context.damageEnum<0||context.damageEnum>11)return {accepted:false,reason:'unverified-source-attribute'};
   if(context.damageEnum===1)return {accepted:false,reason:'native-impossible'};
   if(!['normal-character','native-ai-kind4'].includes(context.ownerKind))return {accepted:false,reason:'unverified-owner-kind'};
   const power=context.ownerKind==='native-ai-kind4'?resolveNativeBlastDamage(context.damageEnum):context.rawPower;
   if(!Number.isFinite(power)||power<0)return {accepted:false,reason:'unverified-source-power'};
   const result=state.applyDamage(hit.token,toNativeDestructibleDamage(Math.fround(power)),{attackId:context.attackId??null,
    damageSource:{ownerKind:context.ownerKind,attribute:context.attribute,rawInitAttack1Power:context.rawPower,damageEnum:context.damageEnum,equipmentOverridesApplied:false}});
   drain();return result;
  },
  queryVolume(shape,actor,options){return queryMapWeaponVolume(query,shape,actor,options);},
  advance(dt){
   if(!Number.isFinite(dt)||dt<0)throw RangeError('Finite map-object simulation delta required');
   const total=millisecondRemainder+dt*1000,ms=Math.floor(total+1e-9);millisecondRemainder=total-ms;
   if(ms)state.advance(ms,{canRestore});drain();
  },
  reset(reason='new-local-match'){millisecondRemainder=0;state.reset({reason});drain();effects?.clear();},
  clearPresentation(){effects?.clear();for(const sound of sounds){sound.pause();sound.src='';}sounds.clear();},
  updateEffects(dt,camera){for(const sound of sounds)sound.volume=Math.max(0,Math.min(1,Number(audioGain())||0));effects?.update(dt);if(camera)effects?.render(camera);},
  render(camera){effects?.render(camera);},
  setAudioGain(getGain){if(typeof getGain!=='function')throw TypeError('Map sound gain reader required');audioGain=getGain;},
  snapshot(){return {...state.snapshot(),recentEvents:[...history],nativeRuntimeParity:false,sourceBuffersChanged:false};},
  async warm(renderer,camera,scene){
   const saved=[...byKey.values()].map(entry=>[entry,entry.mesh.material,entry.mesh.visible]);
   try{for(const entry of byKey.values()){entry.mesh.material=Array.isArray(entry.originalMaterial)?entry.faded:entry.faded[0];entry.mesh.visible=entry.visible;}await renderer.compileAsync(scene,camera);await effects?.warmup?.(renderer,camera);}
   finally{for(const [entry,material,visible] of saved){entry.mesh.material=material;entry.mesh.visible=visible;}syncVisuals();}
  },
  dispose(){
   if(disposed)return;disposed=true;runtime.clearPresentation();effects?.dispose();actors.clear();
   for(const entry of byKey.values()){entry.mesh.material=entry.originalMaterial;entry.mesh.visible=entry.visible;}
   for(const material of fadeMaterials)material.dispose();
   for(const [record,descriptor] of metadataDescriptors){
    if(record.nativeCollision!==ownedMetadata.get(record))continue;
    if(descriptor)Object.defineProperty(record,'nativeCollision',descriptor);else delete record.nativeCollision;
   }
   if(world.mapObjects===runtime)for(const [key,descriptor] of originalWorldDescriptors){
    if(descriptor)Object.defineProperty(world,key,descriptor);else delete world[key];
   }
  },
  qualification:{nativeBindingsVerified:true,nativeDamageLedgerVerified:true,nativeRebirthBoundsVerified:true,
   sourceWeaponMaskSeparate:true,restorationSafety:'S5 controller ellipsoid against exact instance faces plus containment in unambiguous closed horizontal source sections; native guard algorithm parity not certified',
   authority:'Local S5 match; no native network authority claim',clock:'S5 simulation milliseconds, not emulation of native previous-frame-delta ordering',
   reset:'Explicit new local match only; no forced repair on every Chaser round',owner:'Explicit normal character raw InitAttack1 power; native-AI kind4 enum path only when explicitly requested',
   sourceFalseFlag:'Conservative S5 disable; native EnableBalstObjectDamage consumer remains unverified',equipmentOverridesApplied:false,nativeRuntimeParity:false},
 };
 world.mapObjects=runtime;world.mapWeaponQuery=query;world.advanceMapObjects=dt=>runtime.advance(dt);world.resetMapObjects=reason=>runtime.reset(reason);
 world.setMapObjectAudioSettings=({getGain})=>runtime.setAudioGain(getGain);world.warmMapObjects=(renderer,camera,scene)=>runtime.warm(renderer,camera,scene);
 syncVisuals();return runtime;
}
