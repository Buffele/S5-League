import * as THREE from 'three';
import {Controller} from './controller.js';
import {MotionGraph} from './motion-graph.js';
import {presentationFacing,setAvatarFacing} from './view-orientation.js';
import {createPracticeWorld} from './practice-world.js';
import {createPracticeSentryAdapter} from './practice-sentry-adapter.js';
import {createPracticeSentryGameplay} from './practice-sentry-gameplay.js';
import {createPracticeSessionAudio} from './practice-session-audio.js';
import {PracticeSessionState} from './practice-session-state.js';
import {practiceSourceOption} from './practice-session-options.js';
import {createPracticeSessionUI} from './practice-session-ui.js';
import {impactSoundKey} from './game-audio.js';
import {createPracticeProjectileConsumer} from './practice-session-projectiles.js';
import {createPracticeRangedResolver,PRACTICE_RANGED_DIAGNOSTIC_POLICY} from './practice-session-ranged.js';
import {createPracticeSessionEffects,PRACTICE_SENTRY_EFFECTS_RENDER_POLICY} from './practice-session-effects.js';

// Reuse the host's actual Controller/rig/GameAudio. The host can retain pose,
// audio and world ticks by setting presentationOwner:'host' (main integration).
export async function createPracticeSession({scene,mapId=52,world:providedWorld,player:providedPlayer,sex='male',weapon='dagger',getAvatar,getAudio,getCamera,motionGraph=new MotionGraph(),presentationOwner='session',prepareOnly=false,diagnostic,assetRoot='/assets/s5runtime/practice',getSfxGain,sourceServices,createSentryPorts,staticFrustumDiagnostic=null,effectsLoadJson,exitOwner='session',onReset=()=>{},onExit=()=>{},onNotification=()=>{},uiFactory=createPracticeSessionUI}={}){
 if(!scene?.isScene||typeof getAvatar!=='function'||typeof getAudio!=='function'||!['host','session'].includes(presentationOwner))throw Error('Actual scene, avatar/audio services and presentation owner required');
 if(getCamera!==undefined&&typeof getCamera!=='function')throw Error('Actual camera reader required');
 if(!['session','host'].includes(exitOwner)||typeof onExit!=='function')throw Error('Explicit Practice exit owner and callback required');
 if(diagnostic?.allowPartial!==true||typeof diagnostic.spawnNode!=='string'||typeof diagnostic.randomSample!=='function'||!diagnostic.meleePolicy)throw Error('Explicit diagnostic partial-map, source spawn, random and contact policies required');
 if(![52,54].includes(mapId))throw Error('Practice session only accepts recovered native maps52/54');
 if(sourceServices!==undefined&&typeof sourceServices!=='function'||createSentryPorts!==undefined&&typeof createSentryPorts!=='function')throw Error('Actual per-actor source service factory required');
 let world=providedWorld,player=providedPlayer,adapter,ranged,projectiles,audioConsumer,audioPending,effects,effectCarry=0,ui,disposed=false,active=false;const stage=new THREE.Scene(),effectsRoot=new THREE.Group(),state=new PracticeSessionState({scoreLimit:diagnostic.scoreOption??254}),unknown=new Set(),ownedWorld=!world;effectsRoot.name='Practice source effects';stage.add(effectsRoot);
 const sourceStatus=sourceServices?'injected source services; producers unverified':'unbound actor registry/raw gates/effective attack producer';
 try{
  if(world&&(world.nativeMapId!==mapId||!Array.isArray(world.missingScenes)||!world.triangles?.length))throw Error('Actual matching Practice world required');
  world??=await createPracticeWorld(stage,{mapId,assetRoot,allowPartial:true,spawnNode:diagnostic.spawnNode});
  player??=new Controller(world,{sex,weapon});
  // Original sounds reuse the shared context. An unavailable context is
  // reported visibly; no synthetic audio or fake playing status is supplied.
  const audio=getAudio();if(audio?.context&&typeof getSfxGain==='function')audioConsumer=await createPracticeSessionAudio({context:audio.context,getGain:getSfxGain,assetRoot,onUnknown:e=>unknown.add(e.port+':'+e.resource)});else unknown.add('Sentry audio context/gain unbound');
  effects=await createPracticeSessionEffects({scene:effectsRoot,resolveActor:(id,generation)=>adapter?.pool.find(r=>r.id===id&&r.generation===generation),random:()=>{const sample=diagnostic.randomSample();if(!Number.isInteger(sample)||sample<0||sample>32767)throw Error('Explicit rand15 particle sample required');return sample/32768;},policy:PRACTICE_SENTRY_EFFECTS_RENDER_POLICY,assetRoot,staticFrustumDiagnostic,...(effectsLoadJson?{loadJson:effectsLoadJson}:{})});
  adapter=await createPracticeSentryAdapter({scene:stage,player,mapId,scoreOption:state.rules.scoreLimit,assetRoot,randomSample:diagnostic.randomSample,meleePolicy:diagnostic.meleePolicy,scorePolicy:'none',stateFactory:()=>state,onNotification,onPlayerContact:()=>{const key=impactSoundKey(player.attack);if(key)getAudio()?.play(key);},
   createSentryPorts:({target,profile})=>{const provided=createSentryPorts?.({target,profile,player,world})??{},services=sourceServices?.({target,profile,player,world,probeSegment});let gameplay;
    if(services)gameplay=createPracticeSentryGameplay({...services,probeSegment:services.probeSegment??(request=>probeSegment(request)?.blocked??null),onUnknown:e=>unknown.add(e.port)});
    const disposeProvided=provided.dispose;return {...provided,...(gameplay?{bindings:{...provided.bindings,...gameplay.bindings},afterPose:gameplay.afterPose,sourceConsumerStatus:gameplay.sourceConsumerStatus}:{}),readAudioStatus:()=>audioConsumer?.readStatus(target.id,target.generation)??provided.readAudioStatus?.()??{normalSoundPlaying:null,attackSoundPlaying:null},dispose(){gameplay?.dispose();disposeProvided?.();audioConsumer?.stopActor(target.id,target.generation);}};
   },onSentryCue:event=>{if(event.type==='port-unproven')unknown.add(event.port);const effect=effects.cue(event);if(effect.status.startsWith('unknown'))unknown.add(effect.status+':'+event.resource);audioConsumer?.cue(event);}});
  ranged=createPracticeRangedResolver({player,adapter,getAudio,policy:PRACTICE_RANGED_DIAGNOSTIC_POLICY});
  projectiles=createPracticeProjectileConsumer({adapter});
  // Prepare detached UI/models and decode assets without changing the live
  // Controller, rig, graph, scene, active UI or currently playing audio.
  ui=uiFactory({onRestart:()=>api.reset(),onExit:()=>api.exit(),mount:false});
 }catch(error){projectiles?.dispose();ranged?.dispose();adapter?.dispose();effects?.dispose();effectsRoot.removeFromParent();audioConsumer?.dispose();ui?.dispose();if(ownedWorld)world?.dispose();throw error;}
 function probeSegment(request){if(!request||request.coordinateSpace!=='native'||request.queryMask!==0x210fc0||request.rawQueryFlag!==true)throw Error('Actual source native query contract required');const from=new THREE.Vector3(...request.from).multiplyScalar(.006),to=new THREE.Vector3(...request.to).multiplyScalar(.006),hit=player.collision.raycast(from,to.sub(from));return {blocked:!!hit,point:hit?hit.point.toArray().map(v=>v/.006):null,classification:'actual recovered collision geometry; native dispatcher/Shield effects unverified'};}
 function resetPose(){motionGraph.reset();const avatar=getAvatar();if(!avatar)return;avatar.prepareSwitch?.();avatar.group.position.set(player.position.x,player.position.y,player.position.z);setAvatarFacing(avatar.group,presentationFacing(player,player.facing,false));avatar.motion(motionGraph.sample(player,0));avatar.update(0);}
 const api={world,player,state,adapter,ui,effects,motionGraph,presentationOwner,nativeReady:false,
  get locked(){return disposed||!active;},get active(){return active&&!disposed;},
  async warm(renderer,camera){if(disposed||active)throw Error('Only a prepared Practice session can warm');await renderer.compileAsync(world.group,camera,scene);await renderer.compileAsync(stage,camera,scene);await effects.warm(renderer,camera);},
  activate(){if(disposed)throw Error('Practice session disposed');if(active)return api;if(player.world!==world)player.setWorld(world);scene.add(...stage.children);resetPose();active=true;ui.mount?.();api.render(0);return api;},
  snapshot(){return {mode:'practice',option:practiceSourceOption(state.rules.scoreLimit),diagnostic:true,nativeReady:false,mapId,completeMap:world.complete,missingScenes:world.missingScenes.map(s=>s.literal),remaining:state.remaining,deadlineExpired:state.deadlineExpired,living:adapter.activeTargets.length,destroying:adapter.destroyingTargets.length,scoreNativeVerified:false,resultNativeVerified:false,sourceServices:sourceStatus,effects:effects.snapshot(),ranged:ranged.snapshot(),projectiles:projectiles.snapshot(),ports:[...new Set([...unknown,...adapter.pool.flatMap(r=>r.ports?.missingPorts??[])])],visibleLimitations:[`Partial map: ${world.missingScenes.length} missing scenes`,'Local melee contacts; Hand Gun/Assault/Burst/Revolver/SMG/Semi + Cannonade/Rocket: actual contacts and diagnostic HP; other shots unconnected','Native scoring/results unverified',sourceServices?'Injected actor services not compared':'Perception/attack: missing actor producers','Explicit player spawn, local RNG/order; gate/clock/SEQ unverified','Source Sentry SEQs connected: selection/attachments/clocks; diagnostic rendering and scheduling',...(audioConsumer?[]:['Sentry audio unconnected'])]};},
  step(dt,input={}){if(disposed||!active)return [];if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Practice requires fixed steps at most1/30s');const token=effects.beginTick();effectCarry+=dt*1000;const effectMs=Math.floor(effectCarry+1e-9);effectCarry-=effectMs;const events=adapter.step(dt,input);effects.endTick(token,effectMs);if(presentationOwner==='session'){motionGraph.events(events);getAudio()?.events(events,player.attack,player);const avatar=getAvatar();if(avatar){avatar.group.position.set(player.position.x,player.position.y,player.position.z);setAvatarFacing(avatar.group,presentationFacing(player,player.facing,false));avatar.motion(motionGraph.sample(player,dt));avatar.update(dt);ranged.resolve(avatar);}}if(ownedWorld)world.update(dt);return events;},
  render(dt,{visible=true,camera=getCamera?.()}={}){if(!disposed&&active){audioConsumer?.updateGain();if(camera){effects.render(camera);unknown.delete('FX camera unbound');}else unknown.add('FX camera unbound');ui.update(api.snapshot(),{visible,dt});}},
  async enableAudio(){if(disposed)return false;if(audioConsumer)return true;const context=getAudio()?.context;if(!context||typeof getSfxGain!=='function')return false;
   audioPending??=createPracticeSessionAudio({context,getGain:getSfxGain,assetRoot,onUnknown:e=>unknown.add(e.port+':'+e.resource)}).then(consumer=>{if(disposed){consumer.dispose();return false;}audioConsumer=consumer;unknown.delete('Sentry audio context/gain unbound');return true;}).catch(error=>{audioPending=null;unknown.add('Sentry audio decode/load failed');throw error;});return audioPending;},
  reset(){if(disposed)throw Error('Practice session disposed');if(!active)throw Error('Practice session not active');audioConsumer?.reset();getAudio()?.stop();unknown.clear();effects.reset();effectCarry=0;adapter.reset();ranged.reset();projectiles.reset();resetPose();ui.reset?.();onReset();api.render(0);},
  manualRespawn(){if(disposed||!active)return;player.reset();ranged.reset();projectiles.reset();resetPose();onReset();},
  stopAudio(){audioConsumer?.reset();},
  resolveRifleShots(avatar){return disposed||!active?[]:ranged.resolve(avatar);},rifleAimPoint(camera){return disposed||!active?null:ranged.aimPoint(camera);},
  projectileTargets(){return disposed||!active?[]:projectiles.targets();},receiveProjectileContact(contact,item,options){return disposed||!active?{accepted:false,pushAccepted:false,nativeReady:false}:projectiles.receive(contact,item,options);},
  contactRay:args=>adapter.contactRay(args),applyContact:(contact,args)=>adapter.applyContact(contact,args),receiveSourceDamageRecord:args=>adapter.receiveSourceDamageRecord(args),probeSegment,
  // A host-owned switch prepares its destination before detach/dispose.
  // Failed or busy requests therefore leave this live session recoverable.
  exit(){if(disposed)return;if(exitOwner==='session')api.dispose();return onExit();},
  dispose(){if(disposed)return;disposed=true;projectiles.dispose();ranged.dispose();adapter.dispose();effects.dispose();effectsRoot.removeFromParent();audioConsumer?.dispose();if(active)getAudio()?.stop();ui.dispose();if(ownedWorld)world.dispose();}
 };if(!prepareOnly)api.activate();return api;
}
