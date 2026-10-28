import {Matrix4,Quaternion,Vector3,Triangle} from 'three';
import {compileNativeBlast2RegistrationProfile} from './native-registration-profile-blast2.js';
import {compileNativeBlast2StateProfiles} from './native-blast2-runtime-state.js';
import {nativeMapParentIndices} from './native-map-source-geometry.js';
import {TUNING} from './movement-profile.js';
import {createMapDestructibleState,toNativeDestructibleDamage,resolveNativeBlastDamage} from './map-destructible-state.js';
import {createMapWeaponQuery} from './map-weapon-query.js';
import {queryMapWeaponVolume} from './map-weapon-volume-query.js';
import {nativeDestructibleCollisionMetadata} from './native-collision-registration.js';
import {classifyRestorationContainment} from './map-restoration-containment.js';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const sourceRef=value=>value.sourceSceneIndex+':'+value.sourceModelIndex;
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const invoke=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous Bio Lab session owner required');return value;};
const matrix=(value,label)=>{if(!Array.isArray(value)||value.length!==16||!value.every(Number.isFinite))throw TypeError('Finite source '+label+' matrix required');return new Matrix4().fromArray(value);};

function sourceWorldMatrices(bundle){
 return bundle.scenes.map(scene=>{const parents=nativeMapParentIndices(scene),worlds=[];for(const [i,node]of scene.nodes.entries()){
  const parent=parents[i];if(parent>=i)throw Error('Bio Lab source parent must already exist');
  worlds.push((parent<0?new Matrix4().makeScale(.006,.006,.006).multiply(matrix(scene.root.matrix,'root')):worlds[parent].clone()).multiply(matrix(node.matrix,'node')));
 }return worlds;});
}

// BGINFO values and direct-child ownership come from the same generic source
// readers used by Azit. Timing below remains an explicit S5 host policy.
export function compileBioLabMapObjectContract(bundle){
 if(bundle?.key!=='MAPNAME_BIO_LAB')throw Error('Bio Lab source identity required');
 const profile=compileNativeBlast2RegistrationProfile({bundle,nativeMapId:19,evidence:'BioLab19 original BGINFO and exact source BLAST2 direct-child ownership'}),compiled=compileNativeBlast2StateProfiles({profile});
 if(profile.instances.length!==30||profile.bindings.size!==30)throw Error('Bio Lab source BLAST2 owner count changed');
 const instances=profile.instances.map(instance=>{
  const sourceSceneIndex=bundle.scenes.findIndex(s=>s.source===instance.source),scene=bundle.scenes[sourceSceneIndex],sourceModelIndex=scene.models.findIndex(m=>m.sourceNodeIndex===instance.sourceNodeIndex),model=scene.models[sourceModelIndex];
  if(!model||model.name!==instance.name)throw Error('Bio Lab visual owner identity changed');
  return {key:instance.instanceKey,source:instance.source,sourceSceneIndex,sourceModelIndex,sourceNodeIndex:instance.sourceNodeIndex,name:instance.name,ownerId:instance.ownerId,profileKey:instance.section,
   colliders:instance.colliders.map(c=>({sourceSceneIndex,sourceModelIndex:c.sourceModelIndex,sourceNodeIndex:c.sourceNodeIndex,name:c.name,triangles:c.triangles}))};
 });
 const profiles=compiled.profiles.map(p=>{const e=compiled.effects.get(p.key);return {...p,material:e.material,effect:e.sequence.value,sound:e.sound.value,sourceEffects:e};});
 const colliderTriangles=instances.flatMap(i=>i.colliders).reduce((n,c)=>n+c.triangles,0);
 if(colliderTriangles!==396||JSON.stringify(profiles.map(p=>[p.hp,p.hpRecoveryMs,p.rebirthMs]))!==JSON.stringify([[150,10000,10000],[200,10000,3000],[100,10000,3000]]))throw Error('Bio Lab source BLAST2 profiles changed');
 const variant=bundle.variants.find(v=>v.id===19),config=variant.configs.find(c=>c.path===variant.bginfo&&c.status==='verified'),entries=config.entries,worlds=sourceWorldMatrices(bundle);
 const field=(section,key)=>{const rows=entries.filter(r=>r.section===section&&r.key===key);if(rows.length!==1||typeof rows[0].value!=='string')throw Error('Unique Bio Lab source field required: '+section+'.'+key);return rows[0];};
 const uniqueNode=name=>{const matches=bundle.scenes.flatMap((s,si)=>s.nodes.flatMap((n,ni)=>n.name===name?[{node:n,sourceSceneIndex:si,sourceNodeIndex:ni,world:worlds[si][ni]}]:[]));if(matches.length!==1)throw Error('Unique Bio Lab source node required: '+name);return matches[0];};
 const nodeField=field('DOT_STATIC','object_1_node'),bound=uniqueNode(nodeField.value),node=bound.node;
 if(node.type!=='Box'||node.name!=='dot_limited_area01_10_500_!dead_eff'||node.serializedVectors?.length!==4)throw Error('Exact Bio Lab source poison Box required');
 const translation=new Vector3(),rotation=new Quaternion(),scale=new Vector3();bound.world.decompose(translation,rotation,scale);
 if(node.serializedVectors.some(v=>!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))||scale.toArray().some(v=>v<=0))throw Error('Qualified static source Box dimensions required');
 const box={center:translation.toArray(),axes:node.serializedVectors.slice(0,3).map(v=>new Vector3(...v).applyQuaternion(rotation).normalize().toArray()),halfExtents:node.serializedVectors[3].map((v,i)=>v*scale.getComponent(i))};nativeBoxIntersection(box,box);
 const literal=Object.fromEntries(['team','damage','timer','effect','hud'].map(k=>[k,field('DOT_STATIC','object_1_'+k)]));
 if(literal.team.value!=='all'||literal.damage.value!=='10'||literal.timer.value!=='500')throw Error('Bio Lab source poison profile changed');
 const poison={sourceSceneIndex:bound.sourceSceneIndex,sourceNodeIndex:bound.sourceNodeIndex,nodeName:node.name,box,damage:10,intervalMs:500,team:'all',effect:literal.effect.value,hud:literal.hud.value,
  sourceLines:{node:nodeField.line,...Object.fromEntries(Object.entries(literal).map(([k,v])=>[k,v.line]))},qualification:{sourceStaticBoxConvention:'Recovered11C1990 transform-origin/half-extents convention, reused from Azit',nativeBioLabTimerCompared:false,firstTickAndReentryVerified:false}};
 const sequences=[];for(let index=1;index<=8;index++){
  const seq=field('ADDON_SEQUENCE','object_'+index),dummy=field('ADDON_SEQUENCE','object_'+index+'_Dummy'),anchor=uniqueNode(dummy.value);
  if(anchor.sourceSceneIndex!==3||anchor.node.type!=='Bone'||!/^bg_biolab_poison_eff_0[12]\.seq$/.test(seq.value))throw Error('Exact Bio Lab poison effect anchor required');
  sequences.push({order:index,sequence:seq.value,dummy:dummy.value,sourceSceneIndex:anchor.sourceSceneIndex,sourceNodeIndex:anchor.sourceNodeIndex,worldRuntimeMatrix:anchor.world.toArray(),sourceLines:{sequence:seq.line,dummy:dummy.line},nativeParticleEmitterSpacesVerified:false,nativeSequencePlaybackImplemented:false});
 }
 if(entries.filter(r=>r.section==='ADDON_SEQUENCE'&&/^object_\d+$/.test(r.key)).length!==8)throw Error('Bio Lab source addon count changed');
 return {schema:'bio-lab-source-map-objects-v1',key:'MAPNAME_BIO_LAB',nativeMapId:19,profiles,instances,colliderTriangles,poison,sequences,
  qualification:{nativeOwnerBindings:true,sourceReaderValues:true,localS5Authority:true,nativeRuntimeParity:false,gameplayReady:false,effectsRendererImplemented:false,audioPlaybackImplemented:false,poisonTiming:'Explicit host policy: first tick after500ms continuous overlap, equality included, reset on exit/reset/inactive/death, at most one tick per actor per simulation call, no catch-up burst. Native first-tick phase/boundary/reentry/catch-up unverified.'}};
}

// Source sounds remain exact committed cues. A renderer/audio owner must opt in;
// this adapter never manufactures sound or creates/resumes an AudioContext.
function createBioLabPresentationAudio(){
 let onSound=null,disposed=false;return {configure(settings){if(disposed)return;if(settings?.onMapObjectSound!==undefined&&!synchronous(settings.onMapObjectSound))throw TypeError('Synchronous map-object sound owner required');onSound=settings?.onMapObjectSound??null;},cue(type,literal){if(disposed||!onSound)return false;return invoke(onSound,{type,literal,nativeSpatialMixVerified:false})===true;},updateGain(){},clear(){},dispose(){disposed=true;onSound=null;},snapshot(){return {audioPlaybackImplemented:false,callerSoundOwnerBound:!!onSound,nativeSpatialMixVerified:false};}};
}

function createBioLabSessionRuntime(world,data,notify){
 let settings=null,disposed=false,generation=0,reason='unconfigured';const timers=new Map(),history=[],stats={queries:0,poisonTicks:0,acceptedDamage:0,refusals:0};
 const record=value=>{history.push(value);if(history.length>32)history.shift();};
 function reset(why='explicit-reset'){timers.clear();reason=why;}
 function configure(next){
  if(disposed)return false;
  settings=null;reset('unconfigured');generation++;if(next===null)return true;
  if(!next||!['training','deathmatch'].includes(next.mode)){reason='unsupported-mode';return false;}
  if(next.localActor?.world!==world||!synchronous(next.readSimulationEnabled)||!synchronous(next.getAvatar))throw TypeError('Current Bio Lab local actor and synchronous session readers required');
  if(next.mode==='deathmatch'&&(next.combat?.world!==world||next.combat?.player!==next.localActor||next.match?.state?.mode!=='deathmatch'||next.combat.modeState!==next.match.state||!synchronous(next.combat.cancel)||!synchronous(next.combat.onDefeat)))throw TypeError('Current Bio Lab Deathmatch health and defeat owner required');
  settings={...next};reason='configured';return true;
 }
 function rows(){
  if(settings.mode==='training')return [{id:'local',actor:settings.localActor,avatar:invoke(settings.getAvatar),health:null}];
  if(settings.combat.world!==world||settings.combat.player!==settings.localActor||settings.combat.modeState!==settings.match.state)return null;
  const combat=settings.combat,bots=combat.bots??[{id:'bot',actor:combat.enemy,health:combat.enemyState,avatar:combat.avatar}],result=[{id:'local',actor:settings.localActor,avatar:invoke(settings.getAvatar),health:combat.playerState},...bots.map(b=>({id:b.id,actor:b.actor,avatar:b.avatar??b.view?.avatar??combat.avatar,health:b.health}))];
  if(new Set(result.map(r=>r.actor)).size!==result.length||result.some(r=>!r.actor||!r.health||!synchronous(r.health.receive)||!settings.match.state.players.has(r.id)))return null;return result;
 }
 function advance(dt){
  if(disposed||!settings)return [];
  if(!Number.isFinite(dt)||dt<0)throw RangeError('Finite Bio Lab session delta required');
  if(invoke(settings.readSimulationEnabled)!==true||settings.mode==='deathmatch'&&settings.match.state.phase!=='playing'){reset('simulation-inactive');return [];}
  const current=rows();if(!current){reset('participant-lifecycle-unqualified');stats.refusals++;return [];}
  const present=new Set(current.map(r=>r.actor));for(const actor of timers.keys())if(!present.has(actor))timers.delete(actor);
  const events=[];for(const row of current){
   const actor=row.actor,participant=settings.mode==='deathmatch'?settings.match.state.players.get(row.id):null;
   if(actor.world!==world||!row.avatar||row.health&&(row.health.dead||!Number.isFinite(row.health.hp)||row.health.hp<=0||participant?.alive!==true)){timers.delete(actor);continue;}
   const p=actor.position;if(!p||![p.x,p.y,p.z].every(Number.isFinite)){timers.delete(actor);stats.refusals++;continue;}
   const actorBox={center:[p.x,p.y+TUNING.height/2,p.z],axes:[[1,0,0],[0,1,0],[0,0,1]],halfExtents:[TUNING.radius,TUNING.height/2,TUNING.radius]};
   const inside=nativeBoxIntersection(data.poison.box,actorBox).intersects;stats.queries++;
   if(!inside){timers.delete(actor);continue;}
   if(!row.health){timers.delete(actor);reason='free-training-has-no-health-owner';continue;}
   const resetSerial=actor.resetSerial??null,previous=timers.get(actor),same=previous&&previous.resetSerial===resetSerial&&previous.health===row.health;
   // A changed health serial may be ordinary combat damage; actor resetSerial
   // and health object identity, rather than every hit, define this host timer.
   const timer=same?previous:{elapsedMs:0,resetSerial,health:row.health};timer.elapsedMs+=dt*1000;timers.set(actor,timer);
   if(timer.elapsedMs+1e-7<data.poison.intervalMs)continue;timer.elapsedMs=0;
   const amount=data.poison.damage,before=row.health.hp;stats.poisonTicks++;
   // Existing CombatState owns HP, invincibility and lethal reaction. A poison
   // pulse has no invented weapon, source actor, stun, knockback or flinch.
   const accepted=invoke(row.health.receive.bind(row.health),{damage:amount,reaction:'none'})===true;
   if(accepted){stats.acceptedDamage+=before-row.health.hp;if(row.health.dead){invoke(settings.combat.cancel.bind(settings.combat),actor);invoke(settings.combat.onDefeat,actor,null);timers.delete(actor);}}
   const event={type:'bio-lab-poison-tick',actorId:row.id,generation,amount,accepted,hpBefore:before,hpAfter:row.health.hp,sourceSceneIndex:data.poison.sourceSceneIndex,sourceNodeIndex:data.poison.sourceNodeIndex,effect:data.poison.effect,hud:data.poison.hud,hostTimingApproximation:true};events.push(event);record(event);notify(event);reason='poison-source-overlap';
  }
  return events;
 }
 const api={configure,advance,reset,snapshot(){return {configured:!!settings,mode:settings?.mode??null,generation,reason,trackedActors:timers.size,stats:{...stats},recentEvents:[...history],poison:data.poison,sequences:data.sequences,poisonTimingNativeParity:false,nativeSequencePlaybackImplemented:false,trainingHealthOwner:false};},dispose(){if(disposed)return;disposed=true;settings=null;reset('disposed');}};
 world.setBioLabSessionContext=next=>configure(next);world.advanceBioLabSessionTriggers=dt=>advance(dt);world.resetBioLabSessionTriggers=why=>reset(why);world.bioLabSession=api;return api;
}
export function installBioLabMapObjects(world,data){
 if(world?.nativeMapId!==19||!Array.isArray(world.sourceMeshes)||world.mapObjects)throw Error('Fresh Bio Lab source world required');
 const expected=compileBioLabMapObjectContract(world.sourceData);
 if(JSON.stringify(data)!==JSON.stringify(expected))throw Error('Bio Lab destructible contract mismatch');
 data=expected;
 const meshes=new Map(world.sourceMeshes.map(mesh=>[sourceRef(mesh.userData),mesh]));
 const byKey=new Map(),colliderOwners=new Map(),fadeMaterials=new Set(),actors=new Set(),views=new WeakMap(),presenceReaders=new WeakMap();
 const history=[],presentationListeners=new Set(),presentationErrors=[];let millisecondRemainder=0,disposed=false;
 function notifyPresentation(event){for(const listener of presentationListeners)try{listener(event);}catch(error){presentationErrors.push(String(error));if(presentationErrors.length>8)presentationErrors.shift();}}
 const active=()=>{if(disposed)throw Error('Bio Lab destructibles disposed');};
 const audio=createBioLabPresentationAudio();let session=null;
 for(const instance of data.instances){
  const mesh=meshes.get(sourceRef(instance));
  if(!mesh||mesh.name!==instance.name||mesh.userData.sourceNodeIndex!==instance.sourceNodeIndex||byKey.has(instance.key))throw Error('Bio Lab destructible visual identity mismatch');
  const originalMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const entry={...instance,mesh,originalMaterial:mesh.material,originalMaterials,faded:null,visible:mesh.visible,records:[]};
  byKey.set(instance.key,entry);
  for(const collider of instance.colliders){
   const object=meshes.get(sourceRef(collider));
   if(!object||object.name!==collider.name||object.userData.sourceNodeIndex!==collider.sourceNodeIndex||colliderOwners.has(sourceRef(collider)))throw Error('Bio Lab destructible collision identity mismatch');
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
 if(brokenRecords.length!==data.colliderTriangles||byKey.size!==30)throw Error('Bio Lab destructible triangle binding changed');
 for(const entry of byKey.values())for(const collider of entry.colliders)if(entry.records.filter(r=>sourceRef(r)===sourceRef(collider)).length!==collider.triangles)throw Error('Bio Lab collider face count changed');
 const weaponRecords=world.weaponTriangleRecords;
 if(!Array.isArray(weaponRecords)||weaponRecords.length!==7217)throw Error('Bio Lab source weapon records missing');
 const staticWeaponRecords=weaponRecords.filter(record=>!colliderOwners.has(sourceRef(record)));
 if(staticWeaponRecords.length!==6821)throw Error('Bio Lab static weapon face count changed');
 const query=createMapWeaponQuery({staticRecords:staticWeaponRecords,brokenRecords,readVersion:()=>{active();return state.collisionRevision;},readInstanceState:key=>state.readInstanceState(key)});
 const sourceFactory=world.collisionWorldForActor;
 const originalFactory=actor=>sourceFactory?sourceFactory.call(world,actor):{triangles:rawTriangles,queryTriangleRecords:rawRecords,colliders:world.colliders};
 const ownedWorldProperties=['collisionWorldForActor','triangles','queryTriangleRecords','meshes','mapObjects','mapWeaponQuery','advanceMapObjects','resetMapObjects','setMapObjectAudioSettings','warmMapObjects','setBioLabSessionContext','advanceBioLabSessionTriggers','resetBioLabSessionTriggers','bioLabSession'];
 const originalWorldDescriptors=new Map(ownedWorldProperties.map(key=>[key,Object.getOwnPropertyDescriptor(world,key)]));
 if([...originalWorldDescriptors.values()].some(d=>d?.configurable===false))throw Error('Configurable Bio Lab world lifecycle ports required');
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
   for(const triangle of source){const record=recordForTriangle.get(triangle);if(!record)throw Error('Bio Lab actor source collision changed');const owner=colliderOwners.get(sourceRef(record));
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
  reset(reason='new-local-match'){active();state.reset({reason});millisecondRemainder=0;session?.reset(reason);audio.clear();drain();},
  clearPresentation(){session?.configure(null);audio.clear();notifyPresentation({type:'presentation-cleared',artistPresentation:true});},
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
   if(disposed)return;disposed=true;session?.dispose();audio.dispose();actors.clear();presentationListeners.clear();
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
   sourceWeaponMaskSeparate:true,effectsRendererImplemented:false,audioPlaybackImplemented:false,audioMix:'Exact source cue events exposed to caller; no implicit AudioContext or synthetic sounds',gameplayReady:false,restorationSafety:'S5 controller ellipsoid against exact instance faces plus containment in unambiguous closed horizontal source sections; native guard algorithm parity not certified',
   authority:'Local S5 match; no native network authority claim',clock:'S5 simulation milliseconds, not emulation of native previous-frame-delta ordering',
   reset:'Explicit new local match only; no forced repair on every Chaser round',owner:'Explicit normal character raw InitAttack1 power; native-AI kind4 enum path only when explicitly requested',
   sourceFalseFlag:'Conservative S5 disable; native EnableBalstObjectDamage consumer remains unverified',equipmentOverridesApplied:false,nativeRuntimeParity:false},
 };
 world.mapObjects=runtime;world.mapWeaponQuery=query;world.advanceMapObjects=dt=>runtime.advance(dt);world.resetMapObjects=reason=>runtime.reset(reason);
 world.setMapObjectAudioSettings=settings=>runtime.setAudioSettings(settings);world.warmMapObjects=(renderer,camera,scene)=>runtime.warm(renderer,camera,scene);
 session=createBioLabSessionRuntime(world,data,notifyPresentation);
 syncVisuals();return runtime;
}

