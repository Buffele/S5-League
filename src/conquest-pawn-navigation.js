import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestPawnMovementSourceActor} from './conquest-pawn-physics-properties.js';
import {conquestPawnNearestActor} from './conquest-pawn-ai-runtime-perception.js';

const f=Math.fround,uint32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const scalar=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw Error('Finite native '+label+' required');return f(n);};
const vector=(v,label)=>Object.fromEntries(['x','y','z'].map(k=>[k,scalar(v?.[k],label+' '+k)]));
const bool=(v,label)=>{if(typeof v!=='boolean')throw Error('Explicit native '+label+' boolean required');return v;};
const pair=v=>{if(!Array.isArray(v)||v.length!==2||!v.every(uint32))throw Error('Exact two-DWORD native actor identity required');return [...v];};
const synchronous=(fn,args,label)=>{if(typeof fn!=='function')throw Error('Native Pawn navigation producer unresolved: '+label);const value=fn(...args);if(value&&typeof value.then==='function')throw Error('Synchronous native Pawn navigation producer required: '+label);return value;};

export const CONQUEST_PAWN_NAVIGATION_SEGMENT=Object.freeze({queryMask:0x4000bf,rawQueryFlag:true,coordinateSpace:'native',nativeEntry:0x7b57a0});
export const CONQUEST_PAWN_NAVIGATION_MATH=Object.freeze({source:'Float32 SSE operations with JS Math.sqrt port for CRT FE6460; native CRT bit parity unverified',nativeReady:false});
export function conquestPawnIdentityValid(value){return (pair(value)[1]>>>16)!==0;}

// UTIL GetDist6C3A10 reads Z then X through repeated live virtual7C calls.
export function conquestPawnDistanceToActor(first,second,{readPosition7c}={}){
 if(first==null||second==null)return 0;
 const read=(actor,k)=>scalar(synchronous(readPosition7c,[actor],'readPosition7c')?.[k],'position7c '+k);
 const z1=read(first,'z'),x1=read(first,'x'),z2=read(second,'z'),x2=read(second,'x'),dx=f(x2-x1),dz=f(z2-z1);
 return scalar(Math.sqrt(f(f(dx*dx)+f(dz*dz))),'distanceXZ');
}
// 6C51B0 /100B100. Float constant index37=.7 is resource-authenticated.
export function conquestPawnDirection2To1(first,second,{readPosition7c,readHeight6c}={}){
 const raised=actor=>{const p=vector(synchronous(readPosition7c,[actor],'readPosition7c'),'position7c'),h=scalar(synchronous(readHeight6c,[actor],'readHeight6c'),'height6c');p.y=f(p.y+f(h*f(.7)));return p;};
 const a=raised(first),b=raised(second),d={x:f(a.x-b.x),y:f(a.y-b.y),z:f(a.z-b.z)};
 const length=scalar(Math.sqrt(f(f(f(d.x*d.x)+f(d.y*d.y))+f(d.z*d.z))),'direction length');
 if(length===0)return d;
 const inverse=f(1/length);return {x:f(d.x*inverse),y:f(d.y*inverse),z:f(d.z*inverse)};
}

// Owns the actor's 160/164, 2BC,340 and360 navigation fields. It does NOT
// choose graph paths or declare blocked/unknown world probes clear. The host
// must run updateHost in the actor-tail phase (after its source state tick),
// rather than recomputing a target goal in GetGoalPosition or the AI clock.
export class ConquestPawnNavigation{
 constructor({actor,monsterActors,ports={},pathPorts={},perceptionPorts}={}){
  if(!(actor instanceof ConquestMonsterActor)||!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor)throw Error('Current owned actual Pawn required');
  assertConquestPawnMovementSourceActor(actor);
  this.actor=actor;this.monsterActors=monsterActors;this.ports=ports;this.pathPorts=pathPorts;this.perceptionPorts=perceptionPorts;
  this.targetIdentity=[0,0];this.goal={x:0,y:0,z:0};this.moveType=0;this.delegate=null;this.disposed=false;this.running=false;this.updates=0;this.lastReason=null;
  // Native Create A01B30 calls SetMoveType(0) atA02164 after AI setup.
  // Ctor zero fields and post-Create callback are deliberately distinct.
  this.setMoveType(0);
  this.actorPorts=Object.freeze({applyMoveType:(owner,value)=>{this.assertActor(owner);return this.setMoveType(value);},applyTargetActorId:(owner,id)=>{this.assertActor(owner);return this.setTargetActorId(id);}});
  this.bindings=Object.freeze({nearestActor:request=>this.nearestActor(request),goalPosition:owner=>{this.assertActor(owner);return this.goalPosition();},rakeMoveSpeedRate:owner=>{this.assertActor(owner);return this.rakeMoveSpeedRate();},distanceToActor:(first,second)=>this.distanceToActor(first,second),direction2To1:(first,second)=>this.direction2To1(first,second),findPath:(owner,from,to)=>{this.assertActor(owner);return this.findPath(from,to);}});
 }
 assertLive(){if(this.disposed||this.monsterActors.get(this.actor.id)!==this.actor)throw Error('Live current owned Pawn navigation required');}
 assertActor(owner){this.assertLive();if(owner!==this.actor)throw Error('Navigation belongs to a different Pawn actor');}
 call(ports,name,...args){this.assertLive();const value=synchronous(ports[name],args,name);this.assertLive();return value;}
 setTargetIdentity(value){this.assertLive();this.targetIdentity=pair(value);return [...this.targetIdentity];}
 setTargetActorId(id){
  const record=this.call(this.ports,'readActorIdentityById',id);
  if(record?.qualified!==true)throw Error('Current registry-produced target identity required');
  return this.setTargetIdentity(record.identityPair);
 }
 setMoveType(value){
  this.assertLive();if(!uint32(value))throw Error('Native move-type DWORD required');
  // Only the explicit0 case runs the two source transitions. An unknown
  // enum falls back to callback0 but intentionally skips those side effects.
  if(value===0&&this.moveType===1){this.call(this.pathPorts,'leavePursuitRepath',this.actor);this.call(this.pathPorts,'leavePursuitAnchor',this.actor);}
  this.moveType=value===1?1:0;this.delegate=this.moveType===1?'pursuit':'waypoint';return this.moveType;
 }
 goalPosition(){this.assertLive();return {...this.goal};}
 rakeMoveSpeedRate(){this.assertLive();return scalar(Number(CONQUEST_SOURCE_DATA.monsters[this.actor.spawnStats.monsterKey].Ability.rake_speed),'record164 rake speed');}
 readPosition7c(subject){this.assertLive();return vector(this.call(this.ports,'readPosition7c',subject),'position7c');}
 readHeight6c(subject){this.assertLive();return scalar(this.call(this.ports,'readHeight6c',subject),'height6c');}
 distanceToActor(first,second){this.assertLive();return conquestPawnDistanceToActor(first,second,{readPosition7c:actor=>this.readPosition7c(actor)});}
 direction2To1(first,second){this.assertLive();return conquestPawnDirection2To1(first,second,{readPosition7c:actor=>this.readPosition7c(actor),readHeight6c:actor=>this.readHeight6c(actor)});}
 nearestActor(request){
  this.assertActor(request?.monster);
  // Native AI collection order and player state filters are supplied by their
  // actual owners; the attack candidate registry is not substituted here.
  const found=conquestPawnNearestActor(request,this.perceptionPorts);this.assertLive();return found;
 }
 raisedSelf(rate){this.assertLive();const p=vector(this.actor.positionNative,'actor74'),height=scalar(this.actor.height,'height6c');p.y=f(p.y+f(height*f(rate)));return p;}
 findPath(_unusedFrom,destination){
  this.assertLive();const raised=this.raisedSelf(.5),to=vector(destination,'path destination'),grounded=bool(this.call(this.ports,'readGrounded',this.actor),'solver6B4');
  const from=grounded?vector(this.actor.positionNative,'actor74'):raised;
  const result=bool(this.call(this.pathPorts,grounded?'findGroundedPath':'findAirPath',this.actor,{from,to}),'path result');
  if(!result){const group=this.call(this.ports,'readCollisionGroup320',this.actor);if(!uint32(group))throw Error('Current collision-group DWORD required');this.call(this.pathPorts,'onPathFailure',this.actor,{rawGroup320:group,rawInput:3,rawFlag:0});}
  return result;
 }
 nextWaypoint(from){return vector(this.call(this.pathPorts,'nextWaypoint',this.actor,{from:{...from}}),'next waypoint');}
 updateHost(deltaMs,{isHost}={}){
  this.assertLive();if(!uint32(deltaMs)||typeof isHost!=='boolean'||this.running)throw Error('Native milliseconds, host flag and non-reentrant navigation update required');
  if(!isHost)return {...this.snapshot(),updated:false,reason:'not-host'};
  // F780E0 throws on an empty bound function; silently skipping it would hide
  // an unestablished creation/delegate producer.
  if(this.delegate===null)throw Error('Native actor-tail delegate not installed by SetMoveType');
  this.running=true;
  try{
   if(this.delegate==='waypoint'){this.goal=this.nextWaypoint(this.raisedSelf(.5));this.lastReason='waypoint';}
   else this.updatePursuit();
   this.updates=(this.updates+1)>>>0;return {...this.snapshot(),updated:true,reason:this.lastReason};
  }finally{this.running=false;}
 }
 updatePursuit(){
  this.assertLive();
  if(!conquestPawnIdentityValid(this.targetIdentity)){this.lastReason='invalid-identity-preserves-goal';return;}
  const short=[this.targetIdentity[0],this.targetIdentity[1]&0xffff],target=this.call(this.ports,'lookupShortIdentity',short);
  if(target===undefined)throw Error('Explicit current registry target or null required');
  if(target===null||!bool(this.call(this.ports,'isActorType165AC58',target),'actor RTTI165AC58')){this.targetIdentity=[0,0];this.lastReason='missing-target-preserves-goal';return;}
  const from=this.raisedSelf(.7),to=this.readPosition7c(target);to.y=f(to.y+f(this.readHeight6c(target)*f(.7)));
  const probe=this.call(this.ports,'probeNavigationSegment',{...CONQUEST_PAWN_NAVIGATION_SEGMENT,from:[from.x,from.y,from.z],to:[to.x,to.y,to.z]});
  if(probe?.qualified!==true||typeof probe.blocked!=='boolean')throw Error('Qualified native7B57A0 navigation segment required; unknown is not clear');
  if(!probe.blocked){this.goal=this.readPosition7c(target);this.lastReason='source-visible-target';return;}
  if(this.findPath({x:0,y:0,z:0},this.readPosition7c(target))){this.goal=this.nextWaypoint(from);this.lastReason='source-path-waypoint';}
  else this.lastReason='path-failed-preserves-goal';
 }
 snapshot(){return {actorId:this.actor.id,targetIdentity:[...this.targetIdentity],goal:{...this.goal},moveType:this.moveType,delegate:this.delegate,updates:this.updates,disposed:this.disposed,lastReason:this.lastReason,nativeReady:false,navigationGraphQualified:false,perceptionProducersQualified:false,numericProfile:CONQUEST_PAWN_NAVIGATION_MATH.source};}
 dispose(){if(this.disposed)return;this.disposed=true;this.ports={};this.pathPorts={};this.perceptionPorts=null;this.delegate=null;}
}
