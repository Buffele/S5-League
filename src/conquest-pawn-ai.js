import {CONQUEST_MONSTER_ANIMATION_SOURCES} from './conquest-monster-animation-data.js';
import {CONQUEST_PAWN_ATTACK_CONTACT} from './conquest-monster-attack-runtime.js';
// Literal monsterai_pawn_normal.lua + monsterai_constants.lua consumer.
// Required native utility/path/clock values are injected; no geometric nearest
// actor or shortest-path replacement is silently supplied.
const pawnStates=CONQUEST_MONSTER_ANIMATION_SOURCES['script/monsterai_pawn_normal.lua'].states;
export const CONQUEST_PAWN_ANIMATIONS=Object.freeze(Object.fromEntries(['normal','run','damage','blow','death','attack0','attack1','attack2','preFastRun','fastRun'].map((name,stateId)=>{
 const [clip,blendEnabled,blendInMs,blendOutMs,loop,resetClock]=pawnStates[stateId].arguments;
 return [name,Object.freeze({stateId,clip,blendEnabled,blendInMs,blendOutMs,loop,resetClock})];
})));
// InitAttack1(weapon,attribute,300,5,0): delay300, raw power5 and additional
// raw power0. The latter two arguments are not period/damage-delay timers.
export const CONQUEST_PAWN_ATTACK=Object.freeze({...CONQUEST_PAWN_ATTACK_CONTACT,stateInput:5,damageResolved:false});
const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const vector=value=>value&&['x','y','z'].every(k=>Number.isFinite(value[k]));
export class ConquestPawnAI{
 constructor({mainPattern,spawnBase}){if(![0,1,2,3].includes(mainPattern)||typeof spawnBase!=='string'||!spawnBase)throw Error('Explicit native Pawn MainPattern/SpawnBase required');Object.assign(this,{mainPattern,spawnBase,targetBase:'beta_safezone_00',areaDistance:2000,pattern:0});}
 reset(){this.pattern=0;}
 update({monster,gameTime,addTime,intervalUpdateTime,bindings}){
  if(!monster||!vector(monster.position)||!u32(gameTime)||!u32(addTime)||!u32(intervalUpdateTime))throw Error('Native Pawn actor and explicit clock constants required');
  const call=(name,...args)=>{if(typeof bindings?.[name]!=='function')throw Error('Native Pawn binding unresolved: '+name);return bindings[name](...args);};
  const near=call('nearestActor',{monster,firstFlag:true,minDistance:0,maxDistance:this.mainPattern===2?10000:3000,requireVisible:false,partVisible:false}),originalPattern=this.pattern,result={commands:[],waitMs:null,moveType:null,targetActorId:null,nativeReady:false};
  const commandTime=(gameTime+addTime)>>>0;
  const outside=()=>{const distance=call('distanceToArea',monster,this.spawnBase);if(!Number.isFinite(distance))throw Error('Invalid native Pawn area distance');return distance>this.areaDistance;};
  const movePath=(end,multiplier)=>{if(!vector(end))throw Error('Invalid native Pawn endpoint');result.moveType=0;const found=call('findPath',monster,{x:0,y:0,z:0},end);if(typeof found!=='boolean')throw Error('Native FindPath boolean required');if(!found){result.waitMs=500;return;}const goal=call('goalPosition',monster);if(!vector(goal))throw Error('Invalid native Pawn goal');result.waitMs=intervalUpdateTime;result.commands.push({kind:'move',gameTime:commandTime,actorId:monster.id,start:{...monster.position},end:{...goal},speedMultiplier:multiplier,source:'CreateMoveToCommand'});};
  const actorCheck=()=>{if(near==null)return;result.moveType=1;result.targetActorId=near.id;const distance=call('distanceToActor',monster,near);if(!Number.isFinite(distance))throw Error('Invalid native Pawn actor distance');if(400>distance){const direction=call('direction2To1',near,monster);if(!vector(direction))throw Error('Invalid native Pawn attack direction');result.waitMs=670;result.commands.push({kind:'attack',gameTime:commandTime,actorId:monster.id,input:5,position:{...monster.position},direction:{...direction},source:'CreateAttackCommand'});}else{const goal=call('goalPosition',monster),rate=call('rakeMoveSpeedRate',monster);if(!vector(goal)||!Number.isFinite(rate))throw Error('Invalid native Pawn actor move');result.waitMs=100;result.commands.push({kind:'move',gameTime:commandTime,actorId:monster.id,start:{...monster.position},end:{...goal},speedMultiplier:rate,source:'CreateMoveToCommand'});}};
  if(originalPattern===0){if(this.mainPattern!==0){if(near!=null)this.pattern=1;else if(this.mainPattern!==1)this.pattern=2;}}
  else if(originalPattern===1){if(near!=null)actorCheck();else this.pattern=2;if(this.mainPattern===1&&outside())this.pattern=2;}
  else if(originalPattern===2){if(this.mainPattern===1){if(!outside()&&near!=null)this.pattern=1;movePath(call('areaPosition',this.spawnBase),4);}else{if(near!=null)this.pattern=1;const enabled=call('safeZoneEnabled','beta_safezone_00');if(typeof enabled!=='boolean')throw Error('Native safe-zone boolean required');if(enabled){const end=call('safeAreaPosition',this.targetBase);call('distanceToSafeArea',monster,this.targetBase);movePath(end,1);}}}
  result.pattern=this.pattern;return result;
 }
}

