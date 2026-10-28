import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';

const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=v=>{if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(Math.fround(v[k]))))throw Error('Finite source Pawn Explode XYZ required');return {...v};};
const requests=new WeakMap();
const script='script/monsterai_pawn_explode.lua';
export const CONQUEST_PAWN_EXPLODE_SOURCE=Object.freeze({monsterKey:1013,script,
 scriptSha256:'990eb81461e66825c503bd4e45e4155f57ef6a264480f309b9841b45e020803b',
 attackMaxDistance:100,selfBombTimeMs:3000,deathStateDurationMs:2000,
 timerEffect:'Effects/set_num3.seq',timerNode:'',timerEffectArgumentMs:1500,
 timerSound:'Sound/challenge_arcade/unique_pawn_countdown.ogg',
 explosion:Object.freeze({weaponType:55,attackAttribute:74,rawPower:30,rawAdditionalPower:0,
  collisionDelayMs:3000,center:Object.freeze([0,0,0]),radius:800,
  initAttack2:Object.freeze([1,1]),collisionRangeAdjust:Object.freeze([false,false]),
  push:Object.freeze([300,2000,-5000]),friendlyDamage:Object.freeze([.5,.2]),damageApplyType:2,
  damageRates:Object.freeze([.75,.5,.25]),explosionRanges:Object.freeze([.4,.6,.8])}),
 deathStateInput:4,deathStateHasAddedExplosion:false,nativeReady:false});

function actual(actor){
 if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||actor.model.monsterKey!==1013||actor.aiScriptLiteral.toLowerCase()!==script)throw Error('Actual source Pawn Explode1013 required');
 return actor;
}
export function assertConquestPawnExplodeSelfBombRequest(request,{actor}={}){
 if(requests.get(request)!==actual(actor)||request.kind!=='self-bomb')throw Error('Actual owned Pawn Explode self-bomb request required');
 return request;
}
// Original A04A40 uses signed IDIV100 followed by IDIV10; source keys here
// are positive XML keys. 1013 is unique, so authored Run selects00000.
export function conquestPawnExplodeIsUniqueUnit(monsterKey){
 if(!Number.isInteger(monsterKey)||monsterKey<0||monsterKey>0x7fffffff)throw Error('Source positive signed monster key required');
 return Math.trunc((monsterKey%100)/10)===1;
}

// Literal authenticated Lua Update/Func* order. Required bindings own real
// perception, path and area state; this kernel never supplies a free route.
export class ConquestPawnExplodeAI{
 constructor({mainPattern,spawnBase}={}){
  if(![0,1,2,3].includes(mainPattern)||typeof spawnBase!=='string'||!spawnBase)throw Error('Explicit Pawn Explode MainPattern/SpawnBase required');
  Object.assign(this,{mainPattern,spawnBase,targetBase:'beta_safezone_00',areaDistance:2000,pattern:0});
 }
 reset(){this.pattern=0;}
 update({actor,gameTime,addTime,intervalUpdateTime,bindings,actorPorts,setWaitTime}={}){
  actual(actor);if(![gameTime,addTime,intervalUpdateTime].every(u32)||typeof setWaitTime!=='function')throw Error('Explicit source Pawn Explode clocks and wait owner required');
  const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('Pawn Explode binding unresolved: '+name);const value=bindings[name](...args);if(value&&typeof value.then==='function')throw Error('Synchronous Pawn Explode binding required: '+name);return value;};
  const result={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeReady:false},time=(gameTime+addTime)>>>0;
  const wait=ms=>{setWaitTime(ms);result.waitMs=ms;};
  const moveType=value=>{if(typeof actorPorts?.applyMoveType!=='function')throw Error('Current Pawn Explode move-type owner required');actorPorts.applyMoveType(actor,value);result.moveType=value;};
  const position=()=>vector(actor.positionNative);
  // GetTargetActor is read even though findUserDistance is not consumed by
  // GetActorByMinDist. Preserve this call without inventing its50000 range.
  call('targetActor',actor);
  const near=call('nearestActor',{monster:actor,firstFlag:true,minDistance:0,maxDistance:this.mainPattern===2?10000:3000,requireVisible:false,partVisible:false});
  if(near===undefined)throw Error('Explicit nearest Pawn Explode actor or null required');
  const original=this.pattern;
  const outside=()=>{const distance=call('distanceToArea',actor,this.spawnBase);if(!Number.isFinite(distance))throw Error('Finite Pawn Explode area distance required');return distance>this.areaDistance;};
  const movePath=(end,rate)=>{
   vector(end);moveType(0);const found=call('findPath',actor,{x:0,y:0,z:0},end);
   if(typeof found!=='boolean')throw Error('Explicit source FindPath boolean required');
   if(!found){wait(500);return;}
   wait(intervalUpdateTime);const goal=vector(call('goalPosition',actor));
   result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(goal),speedMultiplier:rate,source:'CreateMoveToCommand'}));
  };
  const actorCheck=()=>{
   moveType(1);if(typeof actorPorts?.applyTargetActorId!=='function')throw Error('Current Pawn Explode target owner required');actorPorts.applyTargetActorId(actor,near.id);result.targetActorId=near.id;
   const distance=call('distanceToActor',actor,near);if(!Number.isFinite(distance))throw Error('Finite Pawn Explode target distance required');
   if(100>distance){
    wait(670);const request=Object.freeze({kind:'self-bomb',gameTime:time,actorId:actor.id,bombTimeMs:3000,source:'CreateSelfBombCommand'});requests.set(request,actor);result.commands.push(request);
   }else{
    wait(100);const goal=vector(call('goalPosition',actor)),rate=call('rakeMoveSpeedRate',actor);
    if(!Number.isFinite(rate))throw Error('Finite Pawn Explode rake speed rate required');
    result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:Object.freeze(position()),end:Object.freeze(goal),speedMultiplier:rate,source:'CreateMoveToCommand'}));
   }
  };
  if(original===0){if(this.mainPattern!==0){if(near!==null)this.pattern=1;else if(this.mainPattern!==1)this.pattern=2;}}
  else if(original===1){if(near!==null)actorCheck();else this.pattern=2;if(this.mainPattern===1&&outside())this.pattern=2;}
  else if(original===2){
   if(this.mainPattern===1){if(!outside()&&near!==null)this.pattern=1;movePath(call('areaPosition',this.spawnBase),4);}
   else{if(near!==null)this.pattern=1;const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Explicit source safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',this.targetBase);call('distanceToSafeArea',actor,this.targetBase);movePath(end,1);}}
  }
  result.pattern=this.pattern;return result;
 }
}

// Shares only the recovered CMonster host/wait semantics, not1003's attack
// or its runtime. The production factory must bind actual1013 state owners.
export class ConquestPawnExplodeAIRuntime{
 constructor({actor,spawnBase,mainPattern,bindings,actorPorts,readCurrentActor}={}){
  actual(actor);const authored=Number(CONQUEST_SOURCE_DATA.monsters[1013].base.monster_main_pattern);
  if(mainPattern!==undefined&&mainPattern!==authored||typeof readCurrentActor!=='function'||!bindings||!['applyMoveType','applyTargetActorId'].every(k=>typeof actorPorts?.[k]==='function'))throw Error('Authored1013 pattern and current actor/bindings/ports required');
  Object.assign(this,{actor,bindings,actorPorts,readCurrentActor,disposed:false,stepping:false,updates:0,fault:null});
  this.ai=new ConquestPawnExplodeAI({mainPattern:authored,spawnBase});
  this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();
 }
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Live current Pawn Explode AI owner required');actual(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Source uint32 Pawn Explode wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(value){this.assertLive();if(typeof value!=='boolean')throw Error('Explicit Pawn Explode wait pause required');this.counter.paused=value;}
 tick(deltaMs,{gameTime,isHost}={}){
  this.assertLive();if(this.stepping||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Exact nonreentrant Pawn Explode clocks/host flag required');
  this.stepping=true;
  try{
   if(!isHost)return {...this.snapshot(),updated:false,reason:'not-host',commands:[]};
   if(!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:'nonpositive-health',commands:[]};
   const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}
   if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};
   const result=this.ai.update({actor:this.actor,gameTime,addTime:CONQUEST_PAWN_AI_CLOCKS.addTimeMs,intervalUpdateTime:CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs,
    bindings:this.bindings,actorPorts:this.actorPorts,setWaitTime:ms=>this.setWaitTime(ms)});
   this.assertLive();this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,reason:'updated',commands:result.commands,result};
  }catch(error){this.fault=error.message;throw error;}finally{this.stepping=false;}
 }
 snapshot(){return {actorId:this.actor.id,monsterKey:1013,pattern:this.ai.pattern,counter:{...this.counter},updates:this.updates,disposed:this.disposed,
  luaKernelQualified:true,timerExecutionQualified:false,nativeReady:false,mainModeIntegrated:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.bindings=null;this.actorPorts=null;}
}
