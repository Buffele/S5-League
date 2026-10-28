import {assertConquestRookExplodeActor,CONQUEST_ROOK_EXPLODE_SOURCE as source} from './conquest-rook-explode-source.js';
import {CONQUEST_PAWN_AI_CLOCKS as clocks} from './conquest-pawn-ai-runtime-constants.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vec=v=>{if(!['x','y','z'].every(k=>Number.isFinite(v?.[k])&&Number.isFinite(Math.fround(v[k]))))throw Error('Finite native RookExplode vector required');return Object.freeze({...v});};
// Literal Update order. In particular this script never switches to ACTOR
// movement: even the out-of-range player branch follows the safe-area path.
export function updateConquestRookExplodeAI({actor,gameTime,bindings,actorPorts,setWaitTime}={}){
 assertConquestRookExplodeActor(actor);if(!u32(gameTime)||typeof setWaitTime!=='function')throw Error('Actual RookExplode uint32 clock/wait owner required');
 const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('RookExplode source binding unresolved: '+name);const result=bindings[name](...args);if(result?.then)throw Error('Synchronous actual RookExplode binding required');return result;};
 const apply=(name,...args)=>{if(typeof actorPorts?.[name]!=='function')throw Error('Actual RookExplode actor writer required: '+name);return actorPorts[name](...args);};
 const result={commands:[],waitMs:null,targetActorId:null,moveType:null,nativeReady:false},time=(gameTime+clocks.addTimeMs)>>>0;
 const wait=ms=>{setWaitTime(ms);result.waitMs=ms;};
 const distanceToBase=call('distanceToSafeArea',actor,source.safeArea);if(!Number.isFinite(distanceToBase))throw Error('Finite source safe-area distance required');
 const end=vec(call('safeAreaPosition',source.safeArea)),near=call('nearestActor',{monster:actor,firstFlag:true,minDistance:0,maxDistance:1000,requireVisible:true,partVisible:false});if(near===undefined)throw Error('Actual nearest actor or explicit null required');
 const path=()=>{apply('applyMoveType',actor,0);result.moveType=0;const found=call('findPath',actor,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Actual source FindPath boolean required');if(!found){wait(500);return;}wait(clocks.intervalUpdateTimeMs);result.commands.push(Object.freeze({kind:'move',gameTime:time,actorId:actor.id,start:vec(actor.positionNative),end:vec(call('goalPosition',actor)),speedMultiplier:1,source:'CreateMoveToCommand'}));};
 if(near!==null){apply('applyTargetActorId',actor,near.id);result.targetActorId=near.id;const distance=call('distanceToActor',actor,near);if(!Number.isFinite(distance))throw Error('Finite source RookExplode target distance required');if(800>distance){wait(500);result.commands.push(Object.freeze({kind:'attack',gameTime:time,actorId:actor.id,input:5,position:vec(actor.positionNative),direction:vec(call('direction2To1',near,actor)),source:'CreateAttackCommand'}));}else path();}else path();return result;
}
export class ConquestRookExplodeAIRuntime{
 constructor({actor,bindings,actorPorts,readCurrentActor}={}){assertConquestRookExplodeActor(actor);if(typeof readCurrentActor!=='function'||!bindings||!['applyMoveType','applyTargetActorId'].every(n=>typeof actorPorts?.[n]==='function'))throw Error('Current RookExplode AI owners required');Object.assign(this,{actor,bindings,actorPorts,readCurrentActor,disposed:false,fault:null,busy:false,updates:0});this.counter={frames:0,durationMs:clocks.initialWaitMs,elapsedMs:0,paused:false};this.assertLive();}
 assertLive(){if(this.disposed||this.fault||this.readCurrentActor()!==this.actor)throw Error('Current owned RookExplode AI required');assertConquestRookExplodeActor(this.actor);}
 setWaitTime(ms){this.assertLive();if(!u32(ms))throw Error('Native RookExplode uint32 wait required');this.counter.frames=0;this.counter.elapsedMs=0;if(ms!==0)this.counter.durationMs=ms;}
 setPaused(value){this.assertLive();if(typeof value!=='boolean')throw Error('Explicit RookExplode pause required');this.counter.paused=value;}
 tick(deltaMs,{gameTime,isHost}={}){this.assertLive();if(this.busy||![deltaMs,gameTime].every(u32)||typeof isHost!=='boolean')throw Error('Nonreentrant source RookExplode tick required');this.busy=true;try{if(!isHost||!(Math.fround(this.actor.health)>0))return {...this.snapshot(),updated:false,commands:[]};const c=this.counter;if(!c.paused){c.frames=(c.frames+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}if(c.elapsedMs<=c.durationMs)return {...this.snapshot(),updated:false,commands:[]};const result=updateConquestRookExplodeAI({actor:this.actor,gameTime,bindings:this.bindings,actorPorts:this.actorPorts,setWaitTime:ms=>this.setWaitTime(ms)});this.assertLive();this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,commands:result.commands,result};}catch(error){this.fault=error.message;throw error;}finally{this.busy=false;}}
 snapshot(){return {actorId:this.actor.id,monsterKey:1110,counter:{...this.counter},updates:this.updates,disposed:this.disposed,fault:this.fault,sourceLuaKernelQualified:true,timerAuthored:false,selfBombAuthored:false,nativeReady:false};}
 dispose(){this.disposed=true;this.bindings=null;this.actorPorts=null;}
}
