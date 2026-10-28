import {Vector3,Triangle} from 'three';
import {compileNativeBlast2RegistrationProfile} from './native-registration-profile-blast2.js';
import {compileNativeBlast2StateProfiles} from './native-blast2-runtime-state.js';
import {TUNING} from './movement-profile.js';
import {createMapDestructibleState,toNativeDestructibleDamage,resolveNativeBlastDamage} from './map-destructible-state.js';
import {createMapWeaponQuery} from './map-weapon-query.js';
import {queryMapWeaponVolume} from './map-weapon-volume-query.js';
import {nativeDestructibleCollisionMetadata} from './native-collision-registration.js';
import {classifyRestorationContainment} from './map-restoration-containment.js';

export function compileAzitDestructibleContract(bundle){
 if(bundle?.key!=='MAPNAME_AZIT')throw Error('Azit source identity required');
 const profile=compileNativeBlast2RegistrationProfile({bundle,nativeMapId:15,evidence:'Azit15 original BGINFO and native source BLAST2 child ownership'}),compiled=compileNativeBlast2StateProfiles({profile});
 if(profile.instances.length!==7||profile.bindings.size!==7)throw Error('Azit source BLAST2 owner count changed');
 const instances=profile.instances.map(instance=>{
  const sourceSceneIndex=bundle.scenes.findIndex(s=>s.source===instance.source),source=bundle.scenes[sourceSceneIndex],sourceModelIndex=source.models.findIndex(m=>m.sourceNodeIndex===instance.sourceNodeIndex),model=source.models[sourceModelIndex];
  if(!model||model.name!==instance.name)throw Error('Azit visual owner identity changed');
  return {key:instance.instanceKey,source:instance.source,sourceSceneIndex,sourceModelIndex,sourceNodeIndex:instance.sourceNodeIndex,name:instance.name,ownerId:instance.ownerId,profileKey:instance.section,colliders:instance.colliders.map(c=>({sourceSceneIndex,sourceModelIndex:c.sourceModelIndex,sourceNodeIndex:c.sourceNodeIndex,name:c.name,triangles:c.triangles}))};
 });
 const profiles=compiled.profiles.map(p=>{const e=compiled.effects.get(p.key);return {...p,material:e.material,effect:e.sequence.value,sound:e.sound.value,sourceEffects:e};});
 const colliderTriangles=instances.flatMap(i=>i.colliders).reduce((n,c)=>n+c.triangles,0);if(colliderTriangles!==84)throw Error('Azit source piece triangles changed');
 return {schema:'azit-source-destructibles-v1',key:'MAPNAME_AZIT',nativeMapId:15,profiles,instances,colliderTriangles,qualification:{nativeOwnerBindings:true,sourceReaderValues:true,localS5Authority:true,nativeRuntimeParity:false,gameplayReady:false,jumpStationBehaviorImplemented:false,effectsRendererImplemented:false,audioPlaybackImplemented:false}};
}
const sourceRef=value=>value.sourceSceneIndex+':'+value.sourceModelIndex;

// Same caller-owned WebAudio/SFX bus pattern as siege-supply-audio. No new
// AudioContext, resume(), positional mix or synthetic sound is introduced.
export function createAzitMapObjectAudio({fetchAsset=globalThis.fetch}={}){
 const names={destroyed:'wall_destroy_steel.ogg',restored:'wall_create.ogg'};
 let getGain=()=>1,getAudioContext=()=>null,current=null,epoch=0,disposed=false,lastError=null;
 const played={destroyed:0,restored:0};let suppressed=0;
 function clear(){
  epoch++;
  if(!current)return;
  for(const pending of current.pending.values())pending.controller.abort();current.pending.clear();
  for(const source of current.sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}current.sources.clear();
 }
 function volume(entry){const level=getGain();if(!Number.isFinite(level)||level<0||level>1)throw RangeError('Authoritative SFX gain must be0..1');entry.bus.gain.value=level;return level;}
 function contextEntry(context){
  if(current?.context===context)return current;
  clear();if(current){current.bus.disconnect();current.buffers.clear();}
  const bus=context.createGain();bus.connect(context.destination);
  current={context,bus,buffers:new Map(),pending:new Map(),sources:new Set()};return current;
 }
 async function buffer(entry,name,token){
  if(entry.buffers.has(name))return entry.buffers.get(name);
  if(entry.pending.has(name))return entry.pending.get(name).promise;
  const record={controller:new AbortController(),promise:null};
  record.promise=(async()=>{
   const response=await fetchAsset('/assets/maps/azit/sounds/'+name,{signal:record.controller.signal});
   if(disposed||token!==epoch||current!==entry)return null;
   if(!response.ok)throw Error('Azit original audio unavailable: '+name);
   const bytes=await response.arrayBuffer();if(disposed||token!==epoch||current!==entry)return null;
   const decoded=await entry.context.decodeAudioData(bytes);
   if(disposed||token!==epoch||current!==entry)return null;
   if(!Number.isFinite(decoded?.duration)||decoded.duration<=0)throw Error('Invalid original Azit audio: '+name);
   entry.buffers.set(name,decoded);return decoded;
  })().finally(()=>{if(entry.pending.get(name)===record)entry.pending.delete(name);});
  entry.pending.set(name,record);return record.promise;
 }
 const api={
  configure(settings){
   if(disposed)return;
   if(typeof settings?.getGain!=='function'||settings.getAudioContext!==undefined&&typeof settings.getAudioContext!=='function')throw TypeError('SFX gain and optional shared audio-context readers required');
   getGain=settings.getGain;if(settings.getAudioContext)getAudioContext=settings.getAudioContext;api.updateGain();
  },
  async cue(type,literal){
   let entry=null,source=null,token=epoch;
   try{
    if(disposed)return false;
    if(!names[type]||literal!==names[type]){lastError='Unmapped exact source sound: '+String(literal);return false;}
    const context=getAudioContext();
    if(!context||context.state!=='running'){suppressed++;return false;}
    if(!context.createGain||!context.createBufferSource||!context.decodeAudioData)throw TypeError('Existing shared WebAudio context required');
    entry=contextEntry(context);token=epoch;
    if(volume(entry)===0){suppressed++;return false;}
    const decoded=await buffer(entry,literal,token);
    if(disposed||token!==epoch||current!==entry||getAudioContext()!==context||context.state!=='running'||!decoded)return false;
    if(volume(entry)===0){suppressed++;return false;}
    source=context.createBufferSource();source.buffer=decoded;source.loop=false;source.connect(entry.bus);entry.sources.add(source);
    source.onended=()=>{if(entry.sources.delete(source)){source.onended=null;source.disconnect();}};
    source.start();played[type]++;lastError=null;return true;
   }catch(error){
    if(source){entry?.sources.delete(source);source.onended=null;try{source.stop();}catch{}source.disconnect();}
    if(!disposed&&token===epoch)lastError=String(error?.message??error);return false;
   }
  },
  updateGain(){
   if(disposed||!current)return;
   try{if(getAudioContext()!==current.context){clear();current.bus.disconnect();current.buffers.clear();current=null;}else volume(current);}catch(error){lastError=String(error?.message??error);}
  },
  clear,
  snapshot(){return{disposed,activeSources:current?.sources.size??0,pendingLoads:current?.pending.size??0,cachedBuffers:current?.buffers.size??0,gain:current?.bus.gain.value??null,played:{...played},suppressed,lastError,resources:Object.values(names),nativeSpatialMixVerified:false};},
  dispose(){if(disposed)return;clear();disposed=true;if(current){current.bus.disconnect();current.buffers.clear();current=null;}},
 };
 return Object.freeze(api);
}

// Bind source instances to derived query/visual state. Native buffers, UVs,
// transforms and the shared material definitions remain unchanged. Install
// before constructing Controllers so their actual bodies enrol in restore safety.
export function installAzitDestructibles(world,data){
 if(world?.nativeMapId!==15||!Array.isArray(world.sourceMeshes)||world.mapObjects)throw Error('Fresh Azit source world required');
 const expected=compileAzitDestructibleContract(world.sourceData);
 if(JSON.stringify(data)!==JSON.stringify(expected))throw Error('Azit destructible contract mismatch');
 const meshes=new Map(world.sourceMeshes.map(mesh=>[sourceRef(mesh.userData),mesh]));
 const byKey=new Map(),colliderOwners=new Map(),fadeMaterials=new Set(),actors=new Set(),views=new WeakMap(),presenceReaders=new WeakMap();
 const history=[],presentationListeners=new Set(),presentationErrors=[];let millisecondRemainder=0,disposed=false;
 function notifyPresentation(event){for(const listener of presentationListeners)try{listener(event);}catch(error){presentationErrors.push(String(error));if(presentationErrors.length>8)presentationErrors.shift();}}
 const active=()=>{if(disposed)throw Error('Azit destructibles disposed');};
 const audio=createAzitMapObjectAudio();
 for(const instance of data.instances){
  const mesh=meshes.get(sourceRef(instance));
  if(!mesh||mesh.name!==instance.name||mesh.userData.sourceNodeIndex!==instance.sourceNodeIndex||byKey.has(instance.key))throw Error('Azit destructible visual identity mismatch');
  const originalMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const entry={...instance,mesh,originalMaterial:mesh.material,originalMaterials,faded:null,visible:mesh.visible,records:[]};
  byKey.set(instance.key,entry);
  for(const collider of instance.colliders){
   const object=meshes.get(sourceRef(collider));
   if(!object||object.name!==collider.name||object.userData.sourceNodeIndex!==collider.sourceNodeIndex||colliderOwners.has(sourceRef(collider)))throw Error('Azit destructible collision identity mismatch');
   colliderOwners.set(sourceRef(collider),entry);
  }
 }
 const state=createMapDestructibleState({profiles:data.profiles,instances:data.instances.map(instance=>({instanceKey:instance.key,profileKey:instance.profileKey,
  sourceRecord:{source:instance.source,sourceSceneIndex:instance.sourceSceneIndex,sourceModelIndex:instance.sourceModelIndex,sourceNodeIndex:instance.sourceNodeIndex,name:instance.name,ownerId:instance.ownerId}}))});
 const rawTriangles=world.triangles,rawRecords=world.queryTriangleRecords,rawMeshes=world.meshes;
 const recordForTriangle=new Map(rawTriangles.map((triangle,index)=>[triangle,rawRecords[index]]));
 const brokenRecords=rawRecords.filter(record=>colliderOwners.has(sourceRef(record))).map(record=>{
  const instance=colliderOwners.get(sourceRef(record)),bound={...record,instanceKey:instance.key};instance.records.push(bound);return bound;
 });
 if(brokenRecords.length!==data.colliderTriangles||byKey.size!==7)throw Error('Azit destructible triangle binding changed');
 for(const entry of byKey.values())for(const collider of entry.colliders)if(entry.records.filter(r=>sourceRef(r)===sourceRef(collider)).length!==collider.triangles)throw Error('Azit collider face count changed');
 const weaponRecords=world.weaponTriangleRecords;
 if(!Array.isArray(weaponRecords)||weaponRecords.length!==6308)throw Error('Azit source weapon records missing');
 const staticWeaponRecords=weaponRecords.filter(record=>!colliderOwners.has(sourceRef(record)));
 if(staticWeaponRecords.length!==6224)throw Error('Azit static weapon face count changed');
 const query=createMapWeaponQuery({staticRecords:staticWeaponRecords,brokenRecords,readVersion:()=>{active();return state.collisionRevision;},readInstanceState:key=>state.readInstanceState(key)});
 const sourceFactory=world.collisionWorldForActor;
 const originalFactory=actor=>sourceFactory?sourceFactory.call(world,actor):{triangles:rawTriangles,queryTriangleRecords:rawRecords,colliders:world.colliders};
 const ownedWorldProperties=['collisionWorldForActor','triangles','queryTriangleRecords','meshes','mapObjects','mapWeaponQuery','advanceMapObjects','resetMapObjects','setMapObjectAudioSettings','warmMapObjects'];
 const originalWorldDescriptors=new Map(ownedWorldProperties.map(key=>[key,Object.getOwnPropertyDescriptor(world,key)]));
 const metadataDescriptors=new Map(),ownedMetadata=new Map();
 //734E70 registers piece colliders as80/world+8; enable34 follows ownerID.
 // Stage every metadata object before allocating or publishing the adapter.
 // Keep the original unfiltered source stream bound too. A visual collision
 // adaptation may replace query records while the native backend still needs
 // the original faces and the SAME current owner enable state.
 const sourceAndQueryRecords=new Set([...rawRecords,...(world.movementTriangleRecords??[]),...weaponRecords,...brokenRecords]);
 for(const record of sourceAndQueryRecords){
  const owner=colliderOwners.get(sourceRef(record));if(!owner)continue;
  const collider=owner.colliders.find(entry=>sourceRef(entry)===sourceRef(record));
  metadataDescriptors.set(record,Object.getOwnPropertyDescriptor(record,'nativeCollision'));
  ownedMetadata.set(record,nativeDestructibleCollisionMetadata({name:collider.name,instanceKey:owner.key,ownerSourceName:owner.name,
   readEnabled:()=>disposed?undefined:state.readInstanceState(owner.key).alive,sourceGeometry:!record.collisionAdaptation}));
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
  if(!actor||!['object','function'].includes(typeof actor))throw TypeError('Explicit actor required');
  // A collision consumer is a physical occupant independently of its Chaser
  // mask. Default/training and Deathmatch actors legitimately have a null role.
  if(views.has(actor)){actors.add(actor);return views.get(actor);}
  const sourceView=originalFactory(actor),view=Object.create(sourceView);let cached=null;actors.add(actor);
  const current=()=>{
   const source=sourceView.triangles,version=disposed?'disposed':state.collisionRevision;
   if(cached&&cached.source===source&&cached.version===version)return cached;
   const records=[],triangles=[];
   for(const triangle of source){const record=recordForTriangle.get(triangle);if(!record)throw Error('Azit actor source collision changed');const owner=colliderOwners.get(sourceRef(record));
    if(!disposed&&owner&&!state.readInstanceState(owner.key).alive)continue;
    records.push(record);triangles.push(triangle);
   }
   cached={source,version,records,triangles};return cached;
  };
  Object.defineProperties(view,{triangles:{get:()=>current().triangles},queryTriangleRecords:{get:()=>current().records}});views.set(actor,view);return view;
 };
 let currentCache=null;
 const current=()=>{
  const version=disposed?'disposed':state.collisionRevision;if(currentCache?.version===version)return currentCache;
  const records=[],triangles=[];for(let i=0;i<rawRecords.length;i++){const record=rawRecords[i],owner=colliderOwners.get(sourceRef(record));if(!disposed&&owner&&!state.readInstanceState(owner.key).alive)continue;records.push(record);triangles.push(rawTriangles[i]);}
  currentCache={version,records,triangles};return currentCache;
 };
 Object.defineProperties(world,{triangles:{configurable:true,get:()=>current().triangles},queryTriangleRecords:{configurable:true,get:()=>current().records}});
 let cameraCache=null;
 Object.defineProperty(world,'meshes',{configurable:true,get(){
  if(cameraCache?.version!==state.collisionRevision)cameraCache={version:state.collisionRevision,meshes:rawMeshes.filter(mesh=>{const owner=colliderOwners.get(sourceRef(mesh.userData));return !owner||state.readInstanceState(owner.key).alive;})};
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
 function drain({hit}={}){
  const events=state.drainEvents().map(event=>{const entry=byKey.get(event.instanceKey),profile=data.profiles.find(p=>p.key===entry.profileKey);return {...event,sourceEffects:profile.sourceEffects};});
  history.push(...events);if(history.length>200)history.splice(0,history.length-200);syncVisuals();
  for(const event of events)if(event.type==='destroyed'||event.type==='restored'){
   const literal=event.type==='destroyed'?event.sourceEffects.sound.value:event.sourceEffects.rebirthSound.value;
   void audio.cue(event.type,literal);
  }
  for(const event of events){
   // Optional artist contact derives from the actual contacted native face.
   // It is not written into the damage ledger, source history or collision.
   const face=hit?.sourceRecord,matching=hit?.token?.instanceKey===event.instanceKey;
   const artistContact=matching&&face?.points?.length===3&&face.normal?{point:face.points.reduce((sum,p)=>sum.add(p),new Vector3()).divideScalar(3).toArray(),normal:face.normal.toArray()}:null;
   notifyPresentation(artistContact?{...event,artistContact}:event);
  }
  return events;
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
 const runtime={state,query,bindings:data,instances:byKey,
  subscribeEvents(listener){active();if(typeof listener!=='function')throw TypeError('Map presentation listener required');presentationListeners.add(listener);return()=>presentationListeners.delete(listener);},
  // Role clearing changes a collision mask; retiring a body is a separate
  // lifecycle action. A reused Controller re-enrols through its world factory.
  releaseActor(actor){return actors.delete(actor);},
  bindActorPresence(actor,readPresent){
   active();
   if(!actor||!['object','function'].includes(typeof actor)||typeof readPresent!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(readPresent.constructor?.name))throw TypeError('Explicit actor and synchronous current-presence reader required');
   const binding={readPresent};presenceReaders.set(actor,binding);
   return ()=>{if(presenceReaders.get(actor)===binding)presenceReaders.delete(actor);};
  },
  commit(hit,context){
   if(disposed)return {accepted:false,reason:'disposed'};
   if(!hit?.token?.instanceKey)return {accepted:false,reason:'no-destructible-contact'};
   if(context?.enableBlast===false)return {accepted:false,reason:'source-disabled-S5-conservative'};
   if(!Number.isInteger(context?.damageEnum)||context.damageEnum<0||context.damageEnum>11)return {accepted:false,reason:'unverified-source-attribute'};
   if(context.damageEnum===1)return {accepted:false,reason:'native-impossible'};
   if(!['normal-character','native-ai-kind4'].includes(context.ownerKind))return {accepted:false,reason:'unverified-owner-kind'};
   const power=context.ownerKind==='native-ai-kind4'?resolveNativeBlastDamage(context.damageEnum):context.rawPower;
   if(!Number.isFinite(power)||power<0||Math.fround(power)>=0x100000000)return {accepted:false,reason:'unverified-source-power'};
   const result=state.applyDamage(hit.token,toNativeDestructibleDamage(Math.fround(power)),{attackId:context.attackId??null,
    damageSource:{ownerKind:context.ownerKind,attribute:context.attribute,rawInitAttack1Power:context.rawPower,damageEnum:context.damageEnum,equipmentOverridesApplied:false}});
   drain({hit});return result;
  },
  queryVolume(shape,actor,options){return queryMapWeaponVolume(query,shape,actor,options);},
  advance(dt){
   active();
   if(!Number.isFinite(dt)||dt<0)throw RangeError('Finite map-object simulation delta required');
   const total=millisecondRemainder+dt*1000,ms=Math.floor(total+1e-9);
   if(ms)state.advance(ms,{canRestore});millisecondRemainder=total-ms;drain();
  },
  reset(reason='new-local-match'){active();state.reset({reason});millisecondRemainder=0;audio.clear();drain();},
  clearPresentation(){audio.clear();notifyPresentation({type:'presentation-cleared',artistPresentation:true});},
  updateEffects(){audio.updateGain();},
  render(){},
  setAudioGain(getGain){active();audio.configure({getGain});},
  setAudioSettings(settings){active();audio.configure(settings);},
  snapshot(){return {...state.snapshot(),recentEvents:[...history],audio:audio.snapshot(),presentationErrors:[...presentationErrors],nativeRuntimeParity:false,sourceBuffersChanged:false};},
  async warm(renderer,camera,scene){
   active();
   const saved=[...byKey.values()].map(entry=>[entry,entry.mesh.material,entry.mesh.visible]);
   try{for(const entry of byKey.values()){entry.mesh.material=Array.isArray(entry.originalMaterial)?entry.faded:entry.faded[0];entry.mesh.visible=entry.visible;}await renderer.compileAsync(scene,camera);}
   finally{if(!disposed){for(const [entry,material,visible] of saved){entry.mesh.material=material;entry.mesh.visible=visible;}syncVisuals();}}
  },
  dispose(){
   if(disposed)return;disposed=true;audio.dispose();actors.clear();presentationListeners.clear();
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
   sourceWeaponMaskSeparate:true,effectsRendererImplemented:false,audioPlaybackImplemented:true,audioMix:'Exact source OGG one-shots on caller-owned running shared WebAudio context/SFX gain; native spatial attenuation/scheduling not certified',gameplayReady:false,restorationSafety:'S5 controller ellipsoid against exact instance faces plus containment in unambiguous closed horizontal source sections; native guard algorithm parity not certified',
   authority:'Local S5 match; no native network authority claim',clock:'S5 simulation milliseconds, not emulation of native previous-frame-delta ordering',
   reset:'Explicit new local match only; no forced repair on every Chaser round',owner:'Explicit normal character raw InitAttack1 power; native-AI kind4 enum path only when explicitly requested',
   sourceFalseFlag:'Conservative S5 disable; native EnableBalstObjectDamage consumer remains unverified',equipmentOverridesApplied:false,nativeRuntimeParity:false},
 };
 world.mapObjects=runtime;world.mapWeaponQuery=query;world.advanceMapObjects=dt=>runtime.advance(dt);world.resetMapObjects=reason=>runtime.reset(reason);
 world.setMapObjectAudioSettings=settings=>runtime.setAudioSettings(settings);world.warmMapObjects=(renderer,camera,scene)=>runtime.warm(renderer,camera,scene);
 syncVisuals();return runtime;
}
