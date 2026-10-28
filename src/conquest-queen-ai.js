import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_QUEEN_SOURCE} from './conquest-queen-source.js';
import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,owners=new WeakMap(),f=Math.fround;
const vec=v=>{if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(f(v[k]))))throw Error('Actual finite Queen native XYZ required');return {...v};};
export function assertConquestQueenActor(actor){const source=CONQUEST_SOURCE_DATA.monsters[1403],model=actor?.model,stats=actor?.spawnStats;
 if(!(actor instanceof ConquestMonsterActor)||stats?.monsterKey!==1403||model?.monsterKey!==1403||model.source!=='model/monster/pve_mon_queen.scn'||model.nativeSize!==stats.size||actor.aiScriptLiteral!==source.Resources.ai_lua||actor.aiScriptLiteral!=='Script/MonsterAI_Queen_Normal.lua'||source.base.monster_main_pattern!=='3'||CONQUEST_SOURCE_DATA.sourceHashes[CONQUEST_QUEEN_SOURCE.script]!==CONQUEST_QUEEN_SOURCE.scriptSha256||CONQUEST_SOURCE_DATA.sourceHashes['xml/monster_status.x7']!=='fdea488739068c968c098c2eb530272d04e92c94d36a2f9ca88d392f81755a7a')throw Error('Actual authenticated Queen1403 model/stats/script required');
 const r=owners.get(actor);if(r&&(r.model!==model||r.stats!==stats||r.id!==actor.id))throw Error('Stale/relabelled Queen source actor');if(!r)owners.set(actor,{model,stats,id:actor.id});return actor;
}
// Unchanged authored Lua control flow, including the two identical random
// branches, deferred StealthCommand effects and the extra chase after escape.
export class ConquestQueenAI{
 constructor({mainPattern,spawnBase}={}){if(![0,1,2,3].includes(mainPattern)||typeof spawnBase!=='string'||!spawnBase)throw Error('Explicit Queen MainPattern/SpawnBase required');Object.assign(this,{mainPattern,spawnBase,targetBase:'beta_safezone_00',areaDistance:2000,pattern:0});}
 reset(){this.pattern=0;}
 update({actor,gameTime,addTime,intervalUpdateTime,bindings,actorPorts,setWaitTime}={}){
  assertConquestQueenActor(actor);if(![gameTime,addTime,intervalUpdateTime].every(u32)||typeof setWaitTime!=='function')throw Error('Explicit source Queen clock/wait owners required');
  const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('Queen source binding unresolved: '+name);const result=bindings[name](...args);if(result?.then)throw Error('Synchronous Queen source binding required');return result;};
  const result={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeReady:false},time=(gameTime+addTime)>>>0,position=()=>vec(actor.positionNative),wait=ms=>{if(!u32(ms))throw Error('Actual Queen uint32 wait required');setWaitTime(ms);result.waitMs=ms;};
  const moveType=value=>{if(typeof actorPorts?.applyMoveType!=='function')throw Error('Actual Queen move-type owner required');actorPorts.applyMoveType(actor,value);result.moveType=value;};
  const near=call('nearestActor',{monster:actor,firstFlag:true,minDistance:0,maxDistance:this.mainPattern===2?10000:5000,requireVisible:false,partVisible:false});if(near===undefined)throw Error('Explicit nearest Queen source actor or null required');
  const outside=()=>{const d=call('distanceToArea',actor,this.spawnBase);if(!Number.isFinite(d))throw Error('Finite Queen source area distance required');return d>this.areaDistance;};
  const stealth=isOn=>{const current=call('isStealthOn',actor);if(typeof current!=='boolean')throw Error('Actual Queen stealth component flag required');if(current!==isOn)result.commands.push(Object.freeze({kind:'stealth',gameTime:time,actorId:actor.id,isOn,source:'CreateStealthCommand'}));};
  const move=rate=>{if(!Number.isFinite(rate)||!Number.isFinite(f(rate)))throw Error('Actual finite Queen move-rate getter required');result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(vec(call('goalPosition',actor))),speedMultiplier:rate,source:'CreateMoveToCommand'}));};
  const path=(end,rate)=>{vec(end);moveType(0);const found=call('findPath',actor,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Actual Queen FindPath boolean required');if(found){wait(intervalUpdateTime);move(rate);}else wait(500);stealth(false);};
  const actorCheck=()=>{
   moveType(1);if(typeof actorPorts?.applyTargetActorId!=='function')throw Error('Actual Queen target identity owner required');actorPorts.applyTargetActorId(actor,near.id);result.targetActorId=near.id;
   const distance=call('distanceToActor',actor,near);if(!Number.isFinite(distance))throw Error('Finite actual Queen target distance required');let input=call('getLastAttackStateId',actor);if(!u32(input))throw Error('Actual Queen retained attack-choice field required');
   if(input===CONQUEST_QUEEN_SOURCE.lastAttackInitialUnchosen){const draw=call('getRandom',actor,100000);if(!u32(draw)||draw>=100000)throw Error('Actual in-domain Queen random-choice getter required');input=draw<50000?6:6;call('resetRateOfFire',actor,input);call('setLastAttackStateId',actor,input);}
   let attacking=false;
   // Melee source ActorCheck block is commented out. Existing input5 does
   // not silently become a melee attack, nor is its random draw removed.
   if(input===6){stealth(false);if(CONQUEST_QUEEN_SOURCE.attackMinDistance>distance){const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Actual Queen safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',this.targetBase);call('distanceToSafeArea',actor,this.targetBase);path(end,call('escapeMoveSpeedRate',actor));}}
    else if(CONQUEST_QUEEN_SOURCE.attackMaxDistance>distance){wait(1500);result.commands.push(Object.freeze({kind:'attack',gameTime:time,actorId:actor.id,input:6,position:Object.freeze(position()),direction:Object.freeze(vec(call('direction2To1',near,actor))),source:'CreateAttackCommand'}));attacking=true;}}
   if(!attacking){wait(300);const end=vec(call('goalPosition',actor)),rate=call('rakeMoveSpeedRate',actor);if(!Number.isFinite(rate))throw Error('Actual Queen rake rate required');result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(end),speedMultiplier:rate,source:'CreateMoveToCommand'}));}
  };
  const original=this.pattern;
  if(original===0){if(this.mainPattern!==0){if(near!==null)this.pattern=1;else if(this.mainPattern!==1)this.pattern=2;}}
  else if(original===1){if(near!==null)actorCheck();else this.pattern=2;if(this.mainPattern===1&&outside())this.pattern=2;}
  else if(original===2){call('setLastAttackStateId',actor,CONQUEST_QUEEN_SOURCE.lastAttackInitialUnchosen);if(this.mainPattern===1){if(!outside()&&near!==null)this.pattern=1;path(call('areaPosition',this.spawnBase),4);}else{if(near!==null)this.pattern=1;const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Actual Queen safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',this.targetBase);call('distanceToSafeArea',actor,this.targetBase);path(end,1);}}}
  result.pattern=this.pattern;return result;
 }
}
export class ConquestQueenAIRuntime{
 constructor({actor,spawnBase,bindings,actorPorts,readCurrentActor}={}){assertConquestQueenActor(actor);if(typeof readCurrentActor!=='function'||!bindings||!['applyMoveType','applyTargetActorId'].every(k=>typeof actorPorts?.[k]==='function'))throw Error('Queen current actor, source bindings and actual move/target owners required');Object.assign(this,{actor,bindings,actorPorts,readCurrentActor,disposed:false,fault:null,busy:false,updates:0});this.ai=new ConquestQueenAI({mainPattern:Number(CONQUEST_SOURCE_DATA.monsters[1403].base.monster_main_pattern),spawnBase});this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();}
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Current owned Queen AI required');assertConquestQueenActor(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Source uint32 Queen wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(value){this.assertLive();if(typeof value!=='boolean')throw Error('Explicit Queen pause flag required');this.counter.paused=value;}
 tick(deltaMs,{gameTime,isHost}={}){this.assertLive();if(this.busy||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Nonreentrant source Queen tick/host/clock required');this.busy=true;try{if(!isHost||!(f(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:!isHost?'not-host':'nonpositive-health',commands:[]};const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};const result=this.ai.update({actor:this.actor,gameTime,addTime:CONQUEST_PAWN_AI_CLOCKS.addTimeMs,intervalUpdateTime:CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs,bindings:this.bindings,actorPorts:this.actorPorts,setWaitTime:ms=>this.setWaitTime(ms)});this.assertLive();this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,commands:result.commands,result};}catch(error){this.fault=error.message;throw error;}finally{this.busy=false;}}
 snapshot(){return {actorId:this.actor.id,monsterKey:1403,pattern:this.ai.pattern,counter:{...this.counter},updates:this.updates,disposed:this.disposed,luaKernelQualified:true,nativeReady:false};}
 dispose(){this.disposed=true;this.bindings=null;this.actorPorts=null;}
}
