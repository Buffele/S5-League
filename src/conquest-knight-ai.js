import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_KNIGHT_SOURCE} from './conquest-knight-source.js';
import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,owners=new WeakMap();
const vec=v=>{if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(Math.fround(v[k]))))throw Error('Finite actual Knight source XYZ required');return {...v};};
export function assertConquestKnightActor(actor){
 const source=CONQUEST_SOURCE_DATA.monsters[1203],model=actor?.model,stats=actor?.spawnStats;
 if(!(actor instanceof ConquestMonsterActor)||stats?.monsterKey!==1203||model?.monsterKey!==1203||model.source!=='model/monster/pve_mon_knight.scn'||model.nativeSize!==stats.size||actor.aiScriptLiteral!==source.Resources.ai_lua||actor.aiScriptLiteral!=='Script/MonsterAI_Knight_Normal.lua'||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated Knight1203 model/stats/script required');
 const r=owners.get(actor);if(r&&(r.model!==model||r.stats!==stats||r.id!==actor.id))throw Error('Stale/relabelled Knight source owner');if(!r)owners.set(actor,{model,stats,id:actor.id});return actor;
}
// Literal MonsterAI_Knight_Normal Update/Func* order. This does not inherit
//Pawn attack5/670ms, Explode100/3000ms, or a geometric substitute for utilities.
export class ConquestKnightAI{
 constructor({mainPattern,spawnBase}={}){if(![0,1,2,3].includes(mainPattern)||typeof spawnBase!=='string'||!spawnBase)throw Error('Explicit Knight MainPattern/SpawnBase required');Object.assign(this,{mainPattern,spawnBase,targetBase:'beta_safezone_00',areaDistance:2000,pattern:0});}
 reset(){this.pattern=0;}
 update({actor,gameTime,addTime,intervalUpdateTime,bindings,actorPorts,setWaitTime}={}){
  assertConquestKnightActor(actor);if(![gameTime,addTime,intervalUpdateTime].every(u32)||typeof setWaitTime!=='function')throw Error('Explicit source Knight clock/wait owner required');
  const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('Knight source binding unresolved: '+name);const value=bindings[name](...args);if(value?.then)throw Error('Synchronous Knight source binding required');return value;};
  const result={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeReady:false},time=(gameTime+addTime)>>>0,position=()=>vec(actor.positionNative);
  const wait=ms=>{setWaitTime(ms);result.waitMs=ms;},moveType=value=>{if(typeof actorPorts?.applyMoveType!=='function')throw Error('Actual Knight move-type owner required');actorPorts.applyMoveType(actor,value);result.moveType=value;};
  const near=call('nearestActor',{monster:actor,firstFlag:true,minDistance:0,maxDistance:this.mainPattern===2?10000:3000,requireVisible:false,partVisible:false});if(near===undefined)throw Error('Explicit nearest source actor or null required');
  const outside=()=>{const d=call('distanceToArea',actor,this.spawnBase);if(!Number.isFinite(d))throw Error('Finite source Knight area distance required');return d>this.areaDistance;};
  const path=(end,rate)=>{vec(end);moveType(0);const found=call('findPath',actor,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Actual FindPath boolean required');if(!found){wait(500);return;}wait(intervalUpdateTime);result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(vec(call('goalPosition',actor))),speedMultiplier:rate,source:'CreateMoveToCommand'}));};
  const actorCheck=()=>{
   moveType(1);if(typeof actorPorts?.applyTargetActorId!=='function')throw Error('Current Knight target identity owner required');actorPorts.applyTargetActorId(actor,near.id);result.targetActorId=near.id;
   const distance=call('distanceToActor',actor,near);if(!Number.isFinite(distance))throw Error('Finite source Knight target distance required');
   if(CONQUEST_KNIGHT_SOURCE.attackMaxDistance>distance){wait(820);const direction=vec(call('direction2To1',near,actor));result.commands.push(Object.freeze({kind:'attack',gameTime:time,actorId:actor.id,input:6,position:Object.freeze(position()),direction:Object.freeze(direction),source:'CreateAttackCommand'}));}
   else{wait(100);const goal=vec(call('goalPosition',actor)),rate=call('rakeMoveSpeedRate',actor);if(!Number.isFinite(rate))throw Error('Finite source Knight rake move rate required');result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(goal),speedMultiplier:rate,source:'CreateMoveToCommand'}));}
  };
  const original=this.pattern;
  if(original===0){if(this.mainPattern!==0){if(near!==null)this.pattern=1;else if(this.mainPattern!==1)this.pattern=2;}}
  else if(original===1){if(near!==null)actorCheck();else this.pattern=2;if(this.mainPattern===1&&outside())this.pattern=2;}
  else if(original===2){if(this.mainPattern===1){if(!outside()&&near!==null)this.pattern=1;path(call('areaPosition',this.spawnBase),4);}else{if(near!==null)this.pattern=1;const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Actual Knight safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',this.targetBase);call('distanceToSafeArea',actor,this.targetBase);path(end,1);}}}
  result.pattern=this.pattern;return result;
 }
}
// Same proven CMonster host/wait source functions, with an independent Knight
//Lua kernel and a mandatory current-identity owner. One update per host tick.
export class ConquestKnightAIRuntime{
 constructor({actor,spawnBase,bindings,actorPorts,readCurrentActor}={}){
  assertConquestKnightActor(actor);if(typeof readCurrentActor!=='function'||!bindings||!['applyMoveType','applyTargetActorId'].every(k=>typeof actorPorts?.[k]==='function'))throw Error('Knight current actor, actual bindings and move/target ports required');
  Object.assign(this,{actor,bindings,actorPorts,readCurrentActor,disposed:false,fault:null,busy:false,updates:0});this.ai=new ConquestKnightAI({mainPattern:Number(CONQUEST_SOURCE_DATA.monsters[1203].base.monster_main_pattern),spawnBase});this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();
 }
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Current owned Knight AI required');assertConquestKnightActor(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Source uint32 Knight wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(v){this.assertLive();if(typeof v!=='boolean')throw Error('Explicit Knight pause flag required');this.counter.paused=v;}
 tick(deltaMs,{gameTime,isHost}={}){this.assertLive();if(this.busy||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Nonreentrant source Knight tick/host/clock required');this.busy=true;try{
  if(!isHost||!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:!isHost?'not-host':'nonpositive-health',commands:[]};
  const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};
  const result=this.ai.update({actor:this.actor,gameTime,addTime:CONQUEST_PAWN_AI_CLOCKS.addTimeMs,intervalUpdateTime:CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs,bindings:this.bindings,actorPorts:this.actorPorts,setWaitTime:ms=>this.setWaitTime(ms)});this.assertLive();this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,commands:result.commands,result};
 }catch(error){this.fault=error.message;throw error;}finally{this.busy=false;}}
 snapshot(){return {actorId:this.actor.id,monsterKey:1203,pattern:this.ai.pattern,counter:{...this.counter},updates:this.updates,disposed:this.disposed,luaKernelQualified:true,nativeReady:false};}
 dispose(){this.disposed=true;this.bindings=null;this.actorPorts=null;}
}
