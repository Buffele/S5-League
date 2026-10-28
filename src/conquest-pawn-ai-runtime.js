import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestPawnAI} from './conquest-pawn-ai.js';
import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';
export {CONQUEST_PAWN_AI_CLOCKS,CONQUEST_PAWN_SOURCE_ATTACK_ENUMS} from './conquest-pawn-ai-runtime-constants.js';
const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;

// A22930 + actor constructor/9FEFC0: one actor-owned wait counter. Native
// manager host/health gates precede counter advancement. No render-time PRNG,
// inferred target/path, HP write or extra catch-up AI iteration is supplied.
export class ConquestPawnAIRuntime{
 constructor({actor,mainPattern,spawnBase,bindings,actorPorts}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1003||actor.aiScriptLiteral.toLowerCase()!=='script/monsterai_pawn_normal.lua')throw Error('Actual normal Pawn actor required');
  if(!bindings||typeof bindings!=='object')throw Error('Explicit native Pawn perception/navigation bindings required');
  if(!['applyMoveType','applyTargetActorId'].every(name=>typeof actorPorts?.[name]==='function'))throw Error('Explicit native Pawn move-type/target actor ports required');
  this.actor=actor;this.bindings=bindings;this.actorPorts=actorPorts;this.ai=new ConquestPawnAI({mainPattern,spawnBase});
  this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.disposed=false;this.stepping=false;this.updates=0;this.lastResult=null;
 }
 assertLive(){if(this.disposed)throw Error('Live owned Pawn AI runtime required');}
 setWaitTime(durationMs){
  this.assertLive();if(!u32(durationMs))throw Error('Exact native uint32 Pawn wait required');
  this.counter.frames=0;this.counter.elapsedMs=0;
  // Native SetWaitTime(0) resets counting but preserves its existing deadline.
  if(durationMs!==0)this.counter.durationMs=durationMs;
 }
 setPaused(paused){this.assertLive();if(typeof paused!=='boolean')throw Error('Explicit native wait pause flag required');this.counter.paused=paused;}
 tick(deltaMs,{gameTime,isHost}={}){
  this.assertLive();if(this.stepping||!u32(deltaMs)||!u32(gameTime)||typeof isHost!=='boolean')throw Error('Non-reentrant Pawn AI tick, uint32 clocks and explicit host flag required');
  this.stepping=true;
  try{
   if(!isHost)return {...this.snapshot(),updated:false,reason:'not-host',commands:[]};
   if(!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:'nonpositive-health',commands:[]};
   const counter=this.counter;if(!counter.paused){counter.frames=(counter.frames+1)>>>0;counter.elapsedMs=(counter.elapsedMs+deltaMs)>>>0;}
   if(counter.elapsedMs<=counter.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};
   const result=this.#updatePattern(gameTime);
   this.updates=(this.updates+1)>>>0;this.lastResult=result;
   return {...this.snapshot(),updated:true,reason:'updated',commands:result.commands,result};
  }finally{this.stepping=false;}
 }
 #updatePattern(gameTime){
  const actor=this.actor,ai=this.ai,monster=actor,result={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeReady:false};
  const call=(name,...args)=>{if(typeof this.bindings[name]!=='function')throw Error('Native Pawn binding unresolved: '+name);return this.bindings[name](...args);};
  const position=()=>({...actor.positionNative}),vector=value=>value&&['x','y','z'].every(key=>Number.isFinite(value[key])),commandTime=(gameTime+CONQUEST_PAWN_AI_CLOCKS.addTimeMs)>>>0;
  const setWait=value=>{this.setWaitTime(value);result.waitMs=value;};
  const setMove=value=>{this.actorPorts.applyMoveType(actor,value);result.moveType=value;};
  const outside=()=>{const distance=call('distanceToArea',monster,ai.spawnBase);if(!Number.isFinite(distance))throw Error('Invalid native Pawn area distance');return distance>ai.areaDistance;};
  const near=call('nearestActor',{monster,firstFlag:true,minDistance:0,maxDistance:ai.mainPattern===2?10000:3000,requireVisible:false,partVisible:false}),originalPattern=ai.pattern;
  const movePath=(end,multiplier)=>{
   if(!vector(end))throw Error('Invalid native Pawn endpoint');setMove(0);
   const found=call('findPath',monster,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Native FindPath boolean required');
   if(!found){setWait(500);return;}
   setWait(CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs);const goal=call('goalPosition',monster);if(!vector(goal))throw Error('Invalid native Pawn goal');
   result.commands.push({kind:'move',gameTime:commandTime,actorId:actor.id,start:position(),end:{...goal},speedMultiplier:multiplier,source:'CreateMoveToCommand'});
  };
  const actorCheck=()=>{
   if(near==null)return;setMove(1);this.actorPorts.applyTargetActorId(actor,near.id);result.targetActorId=near.id;
   const distance=call('distanceToActor',monster,near);if(!Number.isFinite(distance))throw Error('Invalid native Pawn actor distance');
   if(distance<400){setWait(670);const direction=call('direction2To1',near,monster);if(!vector(direction))throw Error('Invalid native Pawn attack direction');result.commands.push({kind:'attack',gameTime:commandTime,actorId:actor.id,input:5,position:position(),direction:{...direction},source:'CreateAttackCommand'});}
   else{setWait(100);const goal=call('goalPosition',monster),rate=call('rakeMoveSpeedRate',monster);if(!vector(goal)||!Number.isFinite(rate))throw Error('Invalid native Pawn actor move');result.commands.push({kind:'move',gameTime:commandTime,actorId:actor.id,start:position(),end:{...goal},speedMultiplier:rate,source:'CreateMoveToCommand'});}
  };
  if(originalPattern===0){if(ai.mainPattern!==0){if(near!=null)ai.pattern=1;else if(ai.mainPattern!==1)ai.pattern=2;}}
  else if(originalPattern===1){if(near!=null)actorCheck();else ai.pattern=2;if(ai.mainPattern===1&&outside())ai.pattern=2;}
  else if(originalPattern===2){if(ai.mainPattern===1){if(!outside()&&near!=null)ai.pattern=1;movePath(call('areaPosition',ai.spawnBase),4);}
   else{if(near!=null)ai.pattern=1;const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Native safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',ai.targetBase);call('distanceToSafeArea',monster,ai.targetBase);movePath(end,1);}}}
  result.pattern=ai.pattern;return result;
 }
 snapshot(){return {actorId:this.actor.id,counter:{...this.counter},pattern:this.ai.pattern,updates:this.updates,disposed:this.disposed,nativeReady:false,serverAccepted:false,perceptionProducersQualified:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.bindings=null;this.actorPorts=null;this.lastResult=null;}
}

// 7EF870 low DWORD. Clock-service sampling/epoch ownership stays explicit.
export function conquestPawnGameTime({clockSample,originLow}){
 if(!u32(clockSample)||!u32(originLow))throw Error('Exact sampled native clock and origin DWORD required');
 return (clockSample-originLow)>>>0;
}
