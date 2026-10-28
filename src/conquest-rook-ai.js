import {assertConquestRookActor,CONQUEST_ROOK_SOURCE} from './conquest-rook-source.js';
import {CONQUEST_PAWN_AI_CLOCKS} from './conquest-pawn-ai-runtime-constants.js';
const u32=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
function vector(v){if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(Math.fround(v[k]))))throw Error('Current finite native Rook vector required');return Object.freeze({x:v.x,y:v.y,z:v.z});}

// Literal authenticated MonsterAI_Rook.Update. No nearest-player, pursuit,
// range/attack, SetMoveType or safe-zone-enabled call exists in this script.
export function updateConquestRookAI({actor,gameTime,bindings,setWaitTime}={}){
 assertConquestRookActor(actor);if(!u32(gameTime)||typeof setWaitTime!=='function')throw Error('Exact Rook clock/wait owner required');
 const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('Rook native binding unresolved: '+name);const value=bindings[name](...args);if(value?.then)throw Error('Synchronous actual Rook binding required');return value;};
 const destination=vector(call('safeAreaPosition',CONQUEST_ROOK_SOURCE.safeArea));
 const found=call('findPath',actor,{x:0,y:0,z:0},destination);if(typeof found!=='boolean')throw Error('Actual Rook FindPath boolean required');
 if(!found){setWaitTime(2000);return {commands:[],waitMs:2000,pathFound:false,offensiveAttackCount:0,source:CONQUEST_ROOK_SOURCE.script,nativeReady:false};}
 setWaitTime(CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs);
 const command=Object.freeze({kind:'move',gameTime:(gameTime+CONQUEST_PAWN_AI_CLOCKS.addTimeMs)>>>0,actorId:actor.id,start:vector(actor.positionNative),end:vector(call('goalPosition',actor)),speedMultiplier:1,source:'CreateMoveToCommand'});
 return {commands:[command],waitMs:CONQUEST_PAWN_AI_CLOCKS.intervalUpdateTimeMs,pathFound:true,offensiveAttackCount:0,source:CONQUEST_ROOK_SOURCE.script,nativeReady:false};
}

// The shared native CMonster host/wait prefix dispatches this Rook script,
// rather than reusing the Pawn's different pattern state machine.
export class ConquestRookAIRuntime{
 constructor({actor,bindings,readCurrentActor}={}){
  assertConquestRookActor(actor);if(typeof readCurrentActor!=='function'||!bindings)throw Error('Actual Rook registry/current native bindings required');
  Object.assign(this,{actor,bindings,readCurrentActor,disposed:false,stepping:false,fault:null,updates:0,lastResult:null});this.counter={frames:0,durationMs:CONQUEST_PAWN_AI_CLOCKS.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();
 }
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Current live Rook AI owner required'+(this.fault?': '+this.fault:''));assertConquestRookActor(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Source uint32 Rook wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(value){this.assertLive();if(typeof value!=='boolean')throw Error('Explicit source Rook wait pause required');this.counter.paused=value;}
 tick(deltaMs,{gameTime,isHost}={}){
  this.assertLive();if(this.stepping||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Nonreentrant Rook uint32 clock/host required');this.stepping=true;
  try{if(!isHost)return {...this.snapshot(),updated:false,reason:'not-host',commands:[]};if(!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,reason:'nonpositive-health',commands:[]};
   const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,reason:'waiting',commands:[]};
   const result=updateConquestRookAI({actor:this.actor,gameTime,bindings:this.bindings,setWaitTime:ms=>this.setWaitTime(ms)});this.assertLive();this.lastResult=result;this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,reason:'updated',commands:result.commands,result};
  }catch(error){this.fault=error.message;throw error;}finally{this.stepping=false;}
 }
 snapshot(){return {actorId:this.actor.id,monsterKey:1100,counter:{...this.counter},updates:this.updates,disposed:this.disposed,fault:this.fault,offensiveAttackCount:0,sourceLuaKernelQualified:true,nativeReady:false,mainModeIntegrated:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.bindings=null;this.lastResult=null;}
}
