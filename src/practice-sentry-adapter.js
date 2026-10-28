import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {createPracticeSentryProjectileGeometry} from './practice-sentry-projectile-geometry.js';
import {createPracticeSentryModel} from './practice-sentry-model.js';
import {createPracticeSentryActorDriver} from './practice-sentry-behavior.js';
import {practiceSentryProfile} from './practice-sentry-profiles.js';
import {createPracticeSentryPorts} from './practice-sentry-ports.js';
import {practiceMissionPlan,resolvePracticeSpawnNotification} from './practice-mission-plan.js';
import {practiceSentryLocation} from './practice-spawn-location.js';
import {PracticeNativeAlarm,PracticeSpawnCount,practiceRandomNotification} from './practice-trigger-timing.js';
import {PracticeState} from './practice-state.js';
import {meleeActivations,claimMeleeActivation} from './melee-activations.js';
import {meleeRuntimeContact} from './melee-runtime.js';

// Main integration seam. Geometry and source timer/quota primitives are real;
// the dispatcher order, diagnostic pose clock and optional destroy->point bridge
// are explicit LOCAL policies. Never calls a native score/ACK/winner stub.
export async function createPracticeSentryAdapter({scene,player,mapId,scoreOption=254,assetRoot='/assets/s5runtime/practice',randomSample,scorePolicy='none',meleePolicy,onNotification=()=>{},createSentryPorts,onSentryCue,stateFactory=options=>new PracticeState(options),onPlayerContact=()=>{}}){
 if(typeof randomSample!=='function')throw Error('Explicit random sample provider required; native RNG stream is not established');
 if(!['none','local-destroy'].includes(scorePolicy))throw Error('Unknown Practice scoring policy');
 if(!meleePolicy||!Number.isFinite(meleePolicy.range)||meleePolicy.range<=0||!Number.isFinite(meleePolicy.originHeight)||!Number.isFinite(meleePolicy.halfAngle)||meleePolicy.halfAngle<=0||meleePolicy.halfAngle>Math.PI)throw Error('Explicit local Sentry melee geometry policy required');
 const cueConsumerStatus=onSentryCue===undefined?'unbound-intents-only':'supplied-unverified';
 if(createSentryPorts!==undefined&&typeof createSentryPorts!=='function'||onSentryCue!==undefined&&typeof onSentryCue!=='function')throw Error('Invalid Sentry port/cue consumer');
 onSentryCue??=()=>{};
 const plan=practiceMissionPlan({mapId,scoreOption}),profile=practiceSentryProfile(scoreOption),data=await readAsset(assetRoot+'/sentry/model.json'),pool=[],sentryEvents=[];
 const state=stateFactory({scoreLimit:scoreOption});if(!state||typeof state.tick!=='function'||typeof state.reset!=='function'||scorePolicy==='local-destroy'&&typeof state.receiveMission!=='function')throw Error('Actual Practice state consumer required');
 const issuedContacts=new WeakSet();let alarms,count,used,serial=0,sentrySerial=0,disposed=false,actorMsCarry=0,alarmMsCarry=0,inStep=false,stepSerial=0;
 const projectileGeometry=createPracticeSentryProjectileGeometry({pool,valid:(target,generation)=>!disposed&&state.phase==='playing'&&state.alive&&pool.includes(target)&&!target.dead&&!target.released&&target.generation===generation,issue:(target,generation,hit)=>{const contact={target,generation,...hit};issuedContacts.add(contact);return contact;}});
 function allocate(model){const r={id:'practice-sentry-'+pool.length,model,hp:0,maxHp:profile.hp,dead:true,released:true,generation:0,notification:null,claimed:new Set(),driver:null,ports:null,skipTickSerial:null};model.group.visible=false;scene.add(model.group);pool.push(r);return r;}
 try{const template=await createPracticeSentryModel(data);allocate(template);while(pool.length<plan.spawnLimit)allocate(template.clone());}catch(error){pool.forEach(r=>r.model.dispose());throw error;}
 function recordSentry(target,generation,event){const row={...event,serial:++sentrySerial,actorId:target.id,actorGeneration:generation,nativeScoreProduced:false,serverAccepted:false};sentryEvents.push(row);if(sentryEvents.length>128)sentryEvents.shift();return row;}
 function createDriver(target){
  const generation=target.generation,provided=createSentryPorts?createSentryPorts({target,profile}):{};
  target.ports=createPracticeSentryPorts({target,provided,onMissing:event=>onSentryCue(recordSentry(target,generation,{type:'port-unproven',...event}))});
  target.driver=createPracticeSentryActorDriver({model:target.model,profile,bindings:target.ports.bindings,poseClockPolicy:target.ports.poseClockPolicy,afterPose:target.ports.afterPose,
   onCue:event=>onSentryCue(recordSentry(target,generation,event)),
   onRemove:event=>{if(target.generation!==generation||target.released)return;const driver=target.driver;recordSentry(target,generation,event);driver.dispose();target.ports.dispose();if(target.generation===generation)target.released=true;}});
  recordDriverEvents(target,target.driver.reset({gate6c:target.ports.readActorGate6c()}));
 }
 function recordDriverEvents(target,events){for(const event of events)if(['state','animation'].includes(event.type))recordSentry(target,target.generation,event);}
 function drive(target,deltaMs){if(target.released||!target.driver)return;const inputs={hp:target.hp,gate6c:target.ports.readActorGate6c(),...target.ports.readAudioStatus()};recordDriverEvents(target,target.driver.tick(deltaMs,inputs));}
 function notify(id,detail={}){count.notify(id);for(const alarm of alarms)alarm.notify(id);onNotification({serial:++serial,id,...detail,nativeScoreProduced:false,serverAccepted:false});}
 function spawn(id){const registration=resolvePracticeSpawnNotification(plan,id);if(!registration||used.has(id)||!count.available)return null;let slot=pool.find(r=>r.released);
  if(!slot){if(pool.length>=plan.triggerRegistrations.length)throw Error('Practice actor allocation exceeds authenticated helpers');slot=allocate(pool[0].model.clone());}
  const location=practiceSentryLocation(mapId,registration.sceneNode,{randX:randomSample(),randZ:randomSample()});
  if(slot.driver)slot.driver.dispose();slot.ports?.dispose();slot.driver=null;slot.ports=null;
  Object.assign(slot,{hp:slot.maxHp,dead:false,released:false,generation:slot.generation+1,notification:id,location,skipTickSerial:inStep?stepSerial:null});slot.claimed.clear();slot.model.restoreBind();slot.model.setNativePosition(location.nativePosition);
  try{createDriver(slot);}catch(error){slot.dead=true;slot.released=true;slot.model.group.visible=false;slot.driver?.dispose();slot.ports?.dispose();throw error;}
  used.add(id);
  notify(registration.createdNotification,{actorId:slot.id,generation:slot.generation,sceneNode:registration.sceneNode});return slot;
 }
 function dispatch(id){notify(id);if(id===24){const selected=practiceRandomNotification(randomSample());notify(selected);spawn(selected);}}
 function markDestroyed(r){if(r.dead||r.hp!==0)return;r.dead=true;r.skipTickSerial=inStep?stepSerial:null;drive(r,0);notify(26,{actorId:r.id,generation:r.generation});if(scorePolicy==='local-destroy')state.receiveMission({id:r.id+':'+r.generation});}
 function reset(){projectileGeometry.reset();state.reset();count=new PracticeSpawnCount();used=new Set();alarms=plan.alarms.map(row=>new PracticeNativeAlarm(row));serial=0;actorMsCarry=0;alarmMsCarry=0;for(const r of pool){r.driver?.dispose();r.ports?.dispose();r.driver=null;r.ports=null;r.hp=0;r.dead=true;r.released=true;r.notification=null;r.claimed.clear();r.skipTickSerial=null;r.model.restoreBind();r.model.group.visible=false;}for(const r of pool.splice(plan.spawnLimit))r.model.dispose();for(const a of alarms)a.begin();}
 const api={plan,state,pool,scorePolicy,sentryEvents,cueConsumerStatus,nativeReady:false,renderPolicy:'source SGState clips/timers; source seconds/actor gate diagnostic policies remain unproven; destruction visible until delayed actor removal',dispatcherPolicy:'source registration order; nested callbacks immediate; fractional milliseconds carried locally; not yet native-observed',
  get activeTargets(){return pool.filter(r=>!r.dead&&!r.released);},get destroyingTargets(){return pool.filter(r=>r.dead&&!r.released);},get spawnCount(){return count.count;},
  spawnNotification(id){if(disposed||state.phase!=='playing')return null;return spawn(id);},
  contactRay({origin,direction,range}){if(disposed||state.phase!=='playing'||!Number.isFinite(range)||range<=0)return null;const dir=direction.clone().normalize(),wall=player.collision?.raycast(origin,dir.clone().multiplyScalar(range));const wallDistance=wall?origin.distanceTo(wall.point):range;let found=null;
   for(const target of api.activeTargets){const hit=target.model.intersectRay(origin,dir,range);if(hit&&hit.distance<=wallDistance&&(!found||hit.distance<found.distance))found={target,generation:target.generation,point:hit.point,distance:hit.distance,sourceMesh:hit.object.name,geometryPolicy:'render triangles; native NPC hit volume unverified'};}
   if(found)issuedContacts.add(found);return found;
  },
  projectileTargets:()=>projectileGeometry.targets(),
  applyContact(contact,{damage,id}){if(disposed||state.phase!=='playing'||!state.alive||!issuedContacts.has(contact)||!Number.isFinite(damage)||damage<0||typeof id!=='string'||!id)return false;const r=contact.target;if(r.dead||r.generation!==contact.generation||r.claimed.has(id))return false;r.claimed.add(id);r.hp=Math.max(0,r.hp-damage);
   markDestroyed(r);onPlayerContact({contact,target:r,damage,id,nativeReady:false,damagePolicy:'local flat incoming contact; source typed-record API separate'});return true;
  },
  //Typed source-record entry is separate from the legacy local ray-damage
  //policy above. The provided receiver must perform source type/gate checks.
  receiveSourceDamageRecord({target,generation,record}){if(disposed||state.phase!=='playing'||!state.alive||!pool.includes(target)||target.dead||target.released||target.generation!==generation||!record||typeof record!=='object')return null;
   const before=target.hp,result=target.ports.receiveDamageRecord(record);if(result===null)return null;if(typeof result?.accepted!=='boolean')throw Error('Actual Sentry damage receiver result required');
   if(result.accepted){if(!Number.isFinite(target.hp)||target.hp<0||target.hp!==result.hpAfter)throw Error('Sentry source receiver must write its actual accepted HP');markDestroyed(target);}else if(target.hp!==before)throw Error('Rejected Sentry record changed actual HP');
   return result;
  },
  resolveMelee(events){for(const activation of meleeActivations(events,player.attack)){const declaration=meleeRuntimeContact(activation.attack,activation.index);if(!declaration||!Number.isFinite(declaration.damage))continue;const origin=new THREE.Vector3(player.position.x,player.position.y+meleePolicy.originHeight,player.position.z);
    for(const r of api.activeTargets){const center=r.model.closestSurfacePoint(origin);if(!center)continue;const direction=center.sub(origin),distance=direction.length();if(distance<1e-9)continue;direction.divideScalar(distance);const facing=activation.attack.facing??player.facing;if(direction.x*Math.sin(facing)+direction.z*Math.cos(facing)<Math.cos(meleePolicy.halfAngle))continue;
     const contact=api.contactRay({origin,direction,range:meleePolicy.range});if(contact?.target===r&&claimMeleeActivation(activation.attack,activation.index,r))api.applyContact(contact,{damage:declaration.damage,id:'melee:'+activation.index+':'+(activation.attack.id??activation.attack.startedAt??player.time)});
    }
   }},
  step(dt,input={}){
   if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Practice requires fixed steps at most1/30s');if(disposed)return [];
   actorMsCarry+=dt*1000;const actorMs=Math.floor(actorMsCarry+1e-9);actorMsCarry-=actorMs;stepSerial++;inStep=true;
   try{state.tick(dt);let events=[];
    if(state.phase==='playing'){events=player.step(state.playingDelta,input);api.resolveMelee(events);}
    for(const r of pool)if(!r.released&&(state.phase==='playing'||r.dead)&&r.skipTickSerial!==stepSerial)drive(r,actorMs);
    if(state.phase==='playing'){alarmMsCarry+=state.playingDelta*1000;const alarmMs=Math.floor(alarmMsCarry+1e-9);alarmMsCarry-=alarmMs;for(const alarm of alarms)alarm.tick(alarmMs,dispatch);}
    return events;
   }finally{inStep=false;}
  },
  reset(){if(disposed)throw Error('Practice adapter disposed');player.reset();reset();},
  dispose(){if(disposed)return;disposed=true;projectileGeometry.dispose();pool.forEach(r=>{r.driver?.dispose();r.ports?.dispose();r.driver=null;r.ports=null;r.dead=true;r.released=true;r.model.dispose();});}
 };
 reset();return api;
}

