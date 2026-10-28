import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_KING_SOURCE} from './conquest-king-source.js';
const owners=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vec=v=>{if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(Math.fround(v[k]))))throw Error('Finite actual King source XYZ required');return {x:v.x,y:v.y,z:v.z};};
export function assertConquestKingActor(actor){
 const source=CONQUEST_SOURCE_DATA.monsters[1500],model=actor?.model,stats=actor?.spawnStats;
 if(!(actor instanceof ConquestMonsterActor)||stats?.monsterKey!==1500||model?.monsterKey!==1500||model.source!=='model/monster/pve_mon_king.scn'||model.nativeSize!==stats.size||actor.aiScriptLiteral!==source.Resources.ai_lua||actor.aiScriptLiteral!=='Script/MonsterAI_King.lua'||source.base.monster_main_pattern!=='0'||CONQUEST_SOURCE_DATA.sourceHashes[CONQUEST_KING_SOURCE.script]!==CONQUEST_KING_SOURCE.scriptSha256||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated King1500 model/stats/script required');
 const r=owners.get(actor);if(r&&(r.model!==model||r.stats!==stats||r.id!==actor.id))throw Error('Stale/relabelled King source owner');if(!r)owners.set(actor,{model,stats,id:actor.id});return actor;
}
// Unchanged King Lua Update call order. Control/rate/probability producers
// remain mandatory explicit ports; no timer, last-attack or native RNG is guessed.
export class ConquestKingAI{
 update({actor,gameTime,addTime,intervalUpdateTime,bindings,actorPorts,setWaitTime}={}){
  assertConquestKingActor(actor);if(![gameTime,addTime,intervalUpdateTime].every(u32)||typeof setWaitTime!=='function')throw Error('Explicit source King clock/wait owner required');
  const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('King source binding unresolved: '+name);const v=bindings[name](...args);if(v?.then)throw Error('Synchronous King source binding required');return v;};
  const bool=(name,...args)=>{const v=call(name,...args);if(typeof v!=='boolean')throw Error('Actual source King boolean required: '+name);return v;};
  const unsigned=(name,...args)=>{const v=call(name,...args);if(!u32(v))throw Error('Actual source King DWORD required: '+name);return v;};
  const out={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeControlProducersQualified:false,nativeReady:false},time=(gameTime+addTime)>>>0;
  const wait=ms=>{setWaitTime(ms);out.waitMs=ms;};
  const moveType=value=>{if(typeof actorPorts?.applyMoveType!=='function')throw Error('Actual King move-type owner required');actorPorts.applyMoveType(actor,value);out.moveType=value;};
  const move=rate=>{out.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(vec(actor.positionNative)),end:Object.freeze(vec(call('goalPosition',actor))),speedMultiplier:rate,source:'CreateMoveToCommand'}));};
  if(!bool('isCreateNewCommand',actor))return out;
  if(unsigned('readAccumTime',actor)>10000){call('resetAccumTime',actor);wait(300);out.commands.push(Object.freeze({kind:'pre-fast-run',gameTime:time,actorId:actor.id,source:'CreatePreFastRunCommand'}));}
  const distance=call('distanceToSafeArea',actor,'beta_safezone_00');if(!Number.isFinite(distance))throw Error('Finite source King base distance required');
  const end=vec(call('safeAreaPosition','beta_safezone_00'));
  const path=()=>{moveType(0);const found=call('findPath',actor,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Actual King FindPath boolean required');if(found){wait(intervalUpdateTime);move(1);}else wait(2000);};
  if(distance<2000){path();return out;}
  if(bool('isOnlyToGoal',actor)){path();return out;}
  const near=call('nearestActor',{monster:actor,firstFlag:true,minDistance:0,maxDistance:1800,requireVisible:true,partVisible:false});if(near===undefined)throw Error('Explicit nearest source actor or null required');
  if(near===null){path();return out;}
  moveType(1);if(typeof actorPorts?.applyTargetActorId!=='function')throw Error('Actual King target identity owner required');actorPorts.applyTargetActorId(actor,near.id);out.targetActorId=near.id;
  const targetDistance=call('distanceToActor',actor,near);if(!Number.isFinite(targetDistance))throw Error('Finite source King target distance required');
  let last=unsigned('readLastAttackStateId',actor);
  if(!bool('isRateOfFire',actor,last)){last=bool('isProbOn',actor,30)?5:6;call('writeLastAttackStateId',actor,last);call('resetRateOfFire',actor,last);}
  if(last===5){if(targetDistance<1200){wait(3100);out.commands.push(Object.freeze({kind:'attack',gameTime:time,actorId:actor.id,input:5,position:Object.freeze(vec(actor.positionNative)),direction:Object.freeze(vec(call('direction2To1',near,actor))),source:'CreateAttackCommand'}));}else{wait(300);const start=Object.freeze(vec(actor.positionNative)),goal=Object.freeze(vec(call('goalPosition',actor))),rate=call('rakeMoveSpeedRate',actor);if(!Number.isFinite(rate))throw Error('Finite source King rake rate required');out.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start,end:goal,speedMultiplier:rate,source:'CreateMoveToCommand'}));}}
  else path();
  return out;
 }
}

// Shared original host/wait/HP gate, with King's own Lua body and mandatory
// current controls. Actor clocksA06A90 advance in the physical/runtime prefix,
// not here in the earlier AI scheduling phase.
export class ConquestKingAIRuntime{
 constructor({actor,bindings,actorPorts,readCurrentActor}={}){
  assertConquestKingActor(actor);if(typeof readCurrentActor!=='function'||!bindings||!['applyMoveType','applyTargetActorId'].every(k=>typeof actorPorts?.[k]==='function'))throw Error('King current actor, actual bindings and move/target ports required');
  Object.assign(this,{actor,bindings,actorPorts,readCurrentActor,disposed:false,fault:null,busy:false,updates:0});this.ai=new ConquestKingAI();this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();
 }
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Current owned King AI required');assertConquestKingActor(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Source uint32 King wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(v){this.assertLive();if(typeof v!=='boolean')throw Error('Explicit King pause flag required');this.counter.paused=v;}
 tick(deltaMs,{gameTime,isHost}={}){this.assertLive();if(this.busy||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Nonreentrant source King tick/host/clock required');this.busy=true;try{
  if(!isHost||!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:!isHost?'not-host':'nonpositive-health',commands:[]};
  const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};
  const result=this.ai.update({actor:this.actor,gameTime,addTime:CONQUEST_PAWN_AI_CLOCKS.addTimeMs,intervalUpdateTime:CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs,bindings:this.bindings,actorPorts:this.actorPorts,setWaitTime:ms=>this.setWaitTime(ms)});this.assertLive();this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,commands:result.commands,result};
 }catch(error){this.fault=error.message;throw error;}finally{this.busy=false;}}
 snapshot(){return {actorId:this.actor.id,monsterKey:1500,counter:{...this.counter},updates:this.updates,disposed:this.disposed,luaKernelQualified:true,nativeReady:false};}
 dispose(){this.disposed=true;this.bindings=null;this.actorPorts=null;}
}
