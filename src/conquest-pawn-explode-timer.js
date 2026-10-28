import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
import {CONQUEST_PAWN_EXPLODE_SOURCE} from './conquest-pawn-explode-ai.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const components=new WeakMap(),events=new WeakMap(),owners=new WeakMap();
const writeHealth=ConquestMonsterActor.prototype.setEffectiveHealth;
const counter=durationMs=>({updates:0,durationMs,elapsedMs:0,paused:false});
const reset=(c,durationMs)=>Object.assign(c,{updates:0,durationMs,elapsedMs:0});
const advance=(c,ms)=>{if(!c.paused){c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+ms)>>>0;}};
const call=(fn,args,label)=>{if(typeof fn!=='function')throw Error('Source Pawn Explode consumer unresolved: '+label);const result=fn(...args);if(result?.then)throw Error('Synchronous Pawn Explode consumer required: '+label);return result;};
function current(record){
 if(record.disposed||record.fault||components.get(record.actor)!==record.api||record.authority.lookupFullIdentity(record.peer)!==record.actor||record.actor.model!==record.model)throw Error('Current owned Pawn Explode timer component required');
 return record;
}
export function readConquestPawnExplodeTimerOwner(actor){const owner=components.get(actor);if(!owner)return null;current(owners.get(owner));return owner;}
export function assertConquestPawnExplodeExplosionEvent(event,{owner,actor}={}){
 const record=owners.get(owner),receipt=events.get(event);if(!record||receipt?.record!==record||actor!==record.actor)throw Error('Actual retained source explosion event required');current(record);return event;
}
// Original B8A9F0 / A2A5C0 use float33 and height6C, then position Y.
// No native room row or orientation is inferred from the current mesh pose.
export function readConquestPawnExplodeAttackTransform(actor,{readTempoHeightFactor33,readOrientation8C}={}){
 const position=conquestNativeMoveVector(actor.positionNative),height=f(actor.height),factor=call(readTempoHeightFactor33,[actor],'GameTempo float33');
 if(!Number.isFinite(height)||!Number.isFinite(factor)||!Number.isFinite(f(factor)))throw Error('Current finite source height/tempo33 factor required');
 position.y=f(position.y+f(height*f(factor)));
 const orientation=conquestNativeMoveVector(call(readOrientation8C,[actor],'actor virtual8C'));
 return Object.freeze({position:Object.freeze(position),orientation:Object.freeze(orientation),heightFactor33:f(factor),nativeReady:false});
}

// Real actor-owned2F4 component. It emits the actual source contact boundary
// to the required consumer; it does not turn sphere/rates into record50.
export function createConquestPawnExplodeTimerOwner({actor,actorAuthority,attackPorts,readTempoHeightFactor33,readOrientation8C,presentation}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor)throw Error('Actual current1013 actor/authority required for timer component');
 if(!['prepareAttack','readTickGate','consumeExplosionEvent','exitAttack'].every(k=>typeof attackPorts?.[k]==='function')||!['startCountdown','playCountdownSound'].every(k=>typeof presentation?.[k]==='function')||![readTempoHeightFactor33,readOrientation8C].every(fn=>typeof fn==='function'))throw Error('Actual source timer attack/presentation/transform consumers required');
 if(components.has(actor))throw Error('Release previous owned timer component before replacement');
 const record={actor,model:actor.model,authority:actorAuthority,peer:Object.freeze(actorAuthority.identity(actor.id)),api:null,
  disposed:false,fault:null,busy:false,active:false,generation:0,prepared:null,groupActive:false,
  timer:counter(0),sound:counter(1500),attack:counter(3000),transform:null,lastEvent:null,lastResult:null,emitted:0};
 const source=CONQUEST_PAWN_EXPLODE_SOURCE;
 const retained=Object.freeze({...attackPorts}),visual=Object.freeze({...presentation});
 function execute(fn){current(record);if(record.busy)throw Error('Nonreentrant Pawn Explode timer operation required');record.busy=true;try{return fn();}catch(error){record.fault=error.message;throw error;}finally{record.busy=false;}}
 function exitAttack(){if(record.prepared!==null){call(retained.exitAttack,[{actor,prepared:record.prepared,source:source.explosion}],'5FD5A0 attack resource reset');record.groupActive=false;}}
 const api={
  actor,
  start(bombTimeMs){return execute(()=>{
   if(!u32(bombTimeMs))throw Error('Native uint32 self-bomb timer duration required');
   if(record.active)return {started:false,reason:'already-active',nativeReady:false};
   record.active=true;record.generation++;reset(record.timer,bombTimeMs);
   record.prepared=call(retained.prepareAttack,[{actor,source:source.explosion,generation:record.generation}],'5FD350/56D320 attack preparation');
   if(record.prepared===null||record.prepared===undefined)throw Error('Explicit actual prepared explosion context required');
   current(record);reset(record.attack,source.explosion.collisionDelayMs);record.groupActive=true;
   const receipt=call(visual.startCountdown,[{actor,effect:source.timerEffect,node:source.timerNode,sourceComponent:api,generation:record.generation}],'B8A720 countdown effect');
   if(typeof receipt?.accepted!=='boolean')throw Error('Explicit countdown effect application receipt required');
   current(record);return {started:true,presentation:receipt,timerExecutionQualified:true,explosionGeometryQualified:false,nativeReady:false};
  });},
  tick(deltaMs){return execute(()=>{
   if(!u32(deltaMs))throw Error('Native uint32 Pawn Explode timer delta required');
   if(!record.active)return {...api.snapshot(),updated:false,event:null};
   record.transform=readConquestPawnExplodeAttackTransform(actor,{readTempoHeightFactor33,readOrientation8C});current(record);
   let event=null;
   if(record.groupActive){
    const gate=call(retained.readTickGate,[{actor,prepared:record.prepared,source:source.explosion}],'56D890 current attack predicates');
    if(gate?.qualified!==true||typeof gate.enabled!=='boolean'||typeof gate.collisionAllowed!=='boolean')throw Error('Current qualified explosion attack tick predicates required');
    current(record);
    if(gate.enabled&&record.attack.elapsedMs<=record.attack.durationMs&&!record.attack.paused){
     advance(record.attack,deltaMs);
     if(record.attack.elapsedMs>record.attack.durationMs&&gate.collisionAllowed){
      event=Object.freeze({kind:'conquest-pawn-explode-source-contact',actorId:actor.id,monsterKey:1013,generation:record.generation,
       elapsedMs:record.attack.elapsedMs,transform:record.transform,source:source.explosion,prepared:record.prepared,
       timerExecutionQualified:true,explosionGeometryQualified:false,damageRecordQualified:false,nativeReady:false});
      events.set(event,{record});record.lastEvent=event;record.emitted++;
      record.lastResult=call(retained.consumeExplosionEvent,[event],'56E870 explosion geometry/record recipient');
      if(record.lastResult?.qualified!==true)throw Error('Explosion geometry/record consumer refused: '+(record.lastResult?.reason??'unqualified result'));
      current(record);
     }
    }
   }
   // Sound counter is independent. No catch-up sound loop is introduced.
   if(record.sound.durationMs!==0){advance(record.sound,deltaMs);if(!record.sound.paused&&record.sound.elapsedMs>record.sound.durationMs){
    call(visual.playCountdownSound,[{actor,sound:source.timerSound,firstFlag:false,lastFlag:true}],'7EFDE0 countdown sound');current(record);reset(record.sound,record.sound.durationMs);
   }}
   advance(record.timer,deltaMs);const expired=record.timer.elapsedMs>record.timer.durationMs;
   if(expired){
    // B8AC80 clears both counters, releases attack resources, then writes
    // the actual owner's HP property to zero. This is not a damage record.
    record.active=false;reset(record.timer,0);reset(record.sound,0);exitAttack();current(record);
    writeHealth.call(actor,0);
   }
   return {...api.snapshot(),updated:true,event,expired};
  });},
  snapshot(){return {actorId:actor.id,monsterKey:1013,active:record.active,generation:record.generation,disposed:record.disposed,fault:record.fault,
   timer:{...record.timer},sound:{...record.sound},attack:{...record.attack},transform:record.transform,emittedEvents:record.emitted,
   timerExecutionQualified:true,explosionGeometryQualified:false,damageRecordQualified:false,nativeRoomTempo33Qualified:false,nativeReady:false};},
  dispose(){if(record.disposed)return;if(record.busy)throw Error('Cannot dispose timer during a retained source callback');
   // Component destruction releases attack resources; it does not perform
   // B8AC80's suicide HP write or invent ownership of globally queued FX.
   try{exitAttack();}finally{record.disposed=true;record.active=false;if(components.get(actor)===api)components.delete(actor);}
  },
 };
 record.api=api;owners.set(api,record);components.set(actor,api);
 api.commandPorts=Object.freeze({readTimerBombOwner:target=>{if(target!==actor)throw Error('Timer belongs to a different1013');return readConquestPawnExplodeTimerOwner(target);},
  startTimerBomb:(owner,{actor:target,bombTimeMs})=>{if(owner!==api||target!==actor)throw Error('Actual owned self-bomb component required');return api.start(bombTimeMs);}});
 return Object.freeze(api);
}
