import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {CONQUEST_BASE_VOLUME_DATA as DATA} from './conquest-base-volume-data.js';
import {ConquestBaseGate} from './conquest-base-gate.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {conquestBaseDamageEvent,conquestBaseDamageSigned16} from './conquest-base-contact.js';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';
import {applyConquestDefenseBaseEvent,assertConquestDefenseBaseState} from './conquest-defense-base-state.js';
import {ConquestCommandQueue} from './conquest-command-queue.js';
const i32=v=>Number.isInteger(v)&&v>=-0x80000000&&v<=0x7fffffff;
const copy=value=>JSON.parse(JSON.stringify(value));
const sync=(fn,arg,label)=>{if(typeof fn!=='function')throw Error('Explicit '+label+' producer required');const value=fn(arg);if(value&&typeof value.then==='function')throw Error('Synchronous '+label+' producer required');return value;};
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const boxSignature=box=>JSON.stringify([box.center,box.axes,box.halfExtents]);
const owners=new WeakMap(),roundCommands=new WeakMap();
// Already-applied source kind12 commands remain active until manager cleanup.
// They own the base event, not a retired actor, and survive a wave transition.
export function assertConquestRetainedBaseCommands(commandQueue){
 if(!(commandQueue instanceof ConquestCommandQueue)||commandQueue.stepping||commandQueue.pending.length)throw Error('Current settled source base command queue required');
 for(const command of commandQueue.active){const record=roundCommands.get(command);if(!record||record.queue!==commandQueue||command.queueOwner!==commandQueue)throw Error('Only typed retained source base commands may cross a round');record.validate();}
 return commandQueue.active.length;
}
// Source A1DCF0 arithmetic only. Health/finished are mandatory current owner
// inputs: initialization belongs to the distinct retained defense-state owner.
export function conquestDefenseBaseDamage({health,finished},event){
 if(!i32(health)||typeof finished!=='boolean'||event?.kind!==6)throw Error('Current signed defense HP, finished flag and kind6 event required');
 const damageSigned16=conquestBaseDamageSigned16(event.damageRaw),next=finished?health:(health-damageSigned16)|0;
 return {health:next,finished,damageSigned16,failureRequested:!finished&&next<=0,sourceEntry:0xa1dcf0};
}
export function assertConquestBaseVolumeOwner(owner,{world}={}){if(owners.get(owner)!==world||owner?.snapshot().prepared!==true)throw Error('Prepared current native base volume owner required');return owner;}

export function createConquestBaseVolumeOwner({world,revision,monsterActors,hasRegisteredAIResource}={}){
 let phase='idle',lastReason=null,bundle,source,node,gate,gateArray,descriptors,signature,gateSignature,sealedShape=false,sequence=0,consumed=0;const queue=[],publication=[],events=new WeakSet(),enqueued=new WeakSet();
 const shape=()=>JSON.stringify({root:source.root,node});
 const live=()=>{try{return phase==='prepared'&&world.nativeMapId===46&&world.sourceData===bundle&&bundle.scenes.includes(source)&&source.nodes.includes(node)&&(sealedShape||shape()===signature)&&world.baseGates===gateArray&&gateArray.length===1&&gateArray[0]===gate&&gate.name===DATA.marker&&gate.selector===2&&boxSignature(gate.obb)===gateSignature&&world.nativeCollisionSources.length===descriptors.length&&descriptors.every((d,i)=>world.nativeCollisionSources[i]===d&&d.active()===true);}catch{return false;}};
 const requireLive=()=>{if(!live()){phase='revoked';lastReason='Current native base volume owner revoked';throw Error(lastReason);}};
 const requireActor=actor=>{requireLive();if(!(actor instanceof ConquestMonsterActor)||monsterActors.get(actor.id)!==actor)throw Error('Current owned actual monster required for base contact');};
 function consume(event,{defenseState}={}){
  api.assertEvent(event);const index=queue.indexOf(event);if(index<0)throw Error('Base event was already consumed or removed');
  // Original9FF8D0 calls defense A1DCF0 before gate71EAE0.
  const defense=defenseState===undefined?null:applyConquestDefenseBaseEvent(defenseState,event,{world,baseVolumeOwner:api});
  const health=gate.receiveDamage(event);queue.splice(index,1);consumed++;
  return {qualified:true,event,gateHealth:health,gateActive:gate.active,defense,defenseDamageSigned16:event.damageSigned16,defenseCounterEstablished:defense!==null,sourceEntry:0x71eae0,serverAccepted:false};
 }
 const api={
  prepare(){
   if(phase!=='idle')return api.snapshot();
   try{
    if(world?.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||world.baseGateStaticNameBindingEstablished!==true||!(monsterActors instanceof Map)||!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0))throw Error('Actual map46 source/base registry, monster owner and generation required');
    bundle=world.sourceData;source=bundle.scenes.find(s=>s.source===DATA.source);const proof=bundle.sources.find(s=>s.path===DATA.source);
    if(!source||proof?.sha256!==DATA.sourceSha256||JSON.stringify(source.root?.matrix)!==JSON.stringify(identity))throw Error('Authenticated static source base scene required');
    const nodes=source.nodes.filter(n=>n.name===DATA.marker);node=nodes[0];
    if(nodes.length!==1||node.type!=='Box'||node.parent!==''||node.sourceNodeIndex!==DATA.sourceNodeIndex||JSON.stringify(node.matrix)!==JSON.stringify(DATA.matrix)||JSON.stringify(node.serializedVectors)!==JSON.stringify(DATA.serializedVectors))throw Error('Exact CPU-qualified source base Box required');
    gateArray=world.baseGates;gate=gateArray?.[0];if(gateArray?.length!==1||!(gate instanceof ConquestBaseGate)||gate.name!==DATA.marker||gate.selector!==2)throw Error('Actual unique source safe-zone gate required');
    // The equality to authored data is a measured result of original11992B0/
    // DLL29 on this exact marker, not the method used to establish the volume.
    if(boxSignature(gate.obb)!==boxSignature(DATA.nativeBox))throw Error('Current gate differs from original CPU evaluated/cloned base Box');
    descriptors=[...world.nativeCollisionSources];if(descriptors.length!==4||descriptors.some(d=>d.active()!==true))throw Error('Full current native map collision sources required');
    signature=shape();sealedShape=hasSealedConquestStaticSource(world,bundle);gateSignature=boxSignature(gate.obb);phase='prepared';
   }catch(error){phase='blocked';lastReason=error.message;}
   return api.snapshot();
  },
  readGate(){requireLive();return {qualified:true,gate,position:[...DATA.position71A550],direction:[...DATA.direction71A580],volume:copy(DATA.nativeBox),sourcePositionEntry:0x71a550,sourceDirectionEntry:0x71a580,sourceCloneEntry:0x1198e40};},
  contactActor(actor,{playing,isHost,timeTokenRaw,readTimeTokenRaw}={}){
   requireActor(actor);if(typeof playing!=='boolean'||typeof isHost!=='boolean')throw Error('Explicit current playing/host booleans required');
   if(!playing||!isHost||!gate.active)return null;
   if(typeof actor.eligibleVirtual44!=='boolean')throw Error('Current native virtual44 eligibility boolean required');
   if(!actor.eligibleVirtual44||actor.teamSelector!==gate.selector)return null;
   const monster=actor.contactState;
   if(!nativeBoxIntersection(DATA.nativeBox,monster.obb).intersects)return null;
   if(!Number.isFinite(monster.hp))throw Error('Current finite native monster HP required');if(monster.hp<=0)return null;
   // Source71EB00 writes HP0/33C2 before resource lookup. An absent lookup
   // producer is refused before mutation; no callback can supply a fake hit.
   if(typeof hasRegisteredAIResource!=='function')throw Error('Explicit current native AI resource registry required');
   actor.neutralizeForBase();
   const registered=sync(hasRegisteredAIResource,actor.aiScriptLiteral,'current native AI resource registry');requireActor(actor);
   if(typeof registered!=='boolean')throw Error('Current native AI registration boolean required');
   if(!registered)return {qualified:true,actor,event:null,neutralized:true,sourceEntry:0x71eb00};
   // kind6 is the established S5 local queue alias. Native vtable+0C/
   // 6E5300 returns12, authenticated separately from this local discriminator.
   // Original FF7E40 is sampled per admitted event, after resource lookup.
   // Its epoch is not silently assumed to equal the AI/manager game clock.
   const timestamp=timeTokenRaw===undefined?sync(readTimeTokenRaw,{actor,sourceEntry:0xff7e40},'current base event timestamp'):timeTokenRaw;
   const event=Object.freeze({...conquestBaseDamageEvent({gate:gate.snapshot(),monster,timeTokenRaw:timestamp}),nativeEventType:12});events.add(event);queue.push(event);publication.push(event);sequence++;
   return {qualified:true,actor,event,neutralized:true,sourceEntry:0x71eb00};
  },
  tick(context){requireLive();const contacts=[];for(const actor of monsterActors.values()){const result=api.contactActor(actor,context);if(result)contacts.push(result);}return contacts;},
  assertEvent(event){requireLive();if(!events.has(event)||event.kind!==6||event.nativeEventType!==12||event.baseName!==gate.name)throw Error('Owned actual source base event required');return event;},
  consumeNext({defenseState}={}){
   requireLive();return queue.length?consume(queue[0],{defenseState}):null;
  },
  enqueueEvent(event,{commandQueue,defenseState,mirrorEnabled,onDestroy}={}){
   api.assertEvent(event);assertConquestDefenseBaseState(defenseState,{world,baseVolumeOwner:api});
   if(!(commandQueue instanceof ConquestCommandQueue)||typeof mirrorEnabled!=='boolean'||typeof onDestroy!=='function'||enqueued.has(event)||!queue.includes(event))throw Error('Distinct owned base event, actual command queue and lifecycle required');
   let destroyed=false,entered=false;
   // Source vtable13EFD50: +14/9FF8D0 applies damage on pending admission,
   // +10/9FF8C0 tick and+18/9FFB00 exit are no-ops. Original common ctor
   // counter is0/0/0;9FCBE0 therefore remains true until manager cleanup.
   // Do not replace this with an invented one-shot expiration.
   const command={gameTime:event.timeTokenRaw,nativeType:12,event,
    enter(){if(destroyed||entered)throw Error('Base command replay refused');const result=consume(event,{defenseState});entered=true;return result;},
    tick(){},exit(){},isRunning:()=>true,
    destroy(){if(destroyed)return;destroyed=true;onDestroy(event);},
   };
   const methods=Object.fromEntries(['enter','tick','exit','isRunning','destroy'].map(key=>[key,command[key]]));
   roundCommands.set(command,{queue:commandQueue,validate(){requireLive();api.assertEvent(event);if(!entered||destroyed||command.nativeType!==12||command.event!==event||Object.entries(methods).some(([key,value])=>command[key]!==value))throw Error('Current unchanged applied base command required');}});
   commandQueue.enqueue(command,{mirrorEnabled});enqueued.add(event);return command;
  },
  snapshot(){if(phase==='prepared'&&!live()){phase='revoked';lastReason='Current native base volume owner revoked';}return {phase,prepared:phase==='prepared',lastReason,revision,baseCollisionVolumeEstablished:phase==='prepared',nativeVolumeSourceQualified:true,liveNativeVolumeObserved:false,defenseCounterEstablished:false,queued:queue.length,publicationQueued:publication.length,produced:sequence,consumed,gateHealth:gate?.health??null,nativeReady:false};},
  dispose(){if(phase==='disposed')return;phase='disposed';queue.length=0;publication.length=0;lastReason='Base volume owner disposed';},
 };
 owners.set(api,world);return Object.freeze(api);
}
