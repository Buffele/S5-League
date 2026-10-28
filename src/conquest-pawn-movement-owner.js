import {ConquestKingRuntime,assertConquestKingRuntime} from './conquest-king-runtime.js';
import {assertConquestKingAIClocks} from './conquest-king-ai-clocks.js';
import {assertConquestKingFastRunFlagReceipt} from './conquest-king-pre-fast-run-command.js';
import {ConquestQueenRuntime,assertConquestQueenRuntime} from './conquest-queen-runtime.js';
import {ConquestRookExplodeRuntime,assertConquestRookExplodeRuntime} from './conquest-rook-explode-runtime.js';
import {ConquestBishopSnipeRuntime,assertConquestBishopSnipeRuntime} from './conquest-bishop-snipe-runtime.js';
import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {assertConquestMovementWorldQueries} from './conquest-movement-world-queries.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
import {conquestMonsterCollisionOperation} from './conquest-monster-collision.js';
import {conquestMonsterVerticalTick} from './conquest-monster-vertical-motion.js';
import {readConquestPawnPhysicsProperties,assertConquestPawnMovementSourceActor} from './conquest-pawn-physics-properties.js';
import {ConquestPawnExplodeRuntime,assertConquestPawnExplodeRuntime} from './conquest-pawn-explode-runtime.js';
import {ConquestRookRuntime,assertConquestRookRuntime} from './conquest-rook-runtime.js';
import {ConquestBishopRuntime,assertConquestBishopRuntime} from './conquest-bishop-runtime.js';
import {ConquestKnightRuntime,assertConquestKnightRuntime} from './conquest-knight-runtime.js';
import {ConquestKnightChargeRuntime,assertConquestKnightChargeRuntime} from './conquest-knight-charge-runtime.js';
import {assertConquestRookDefenseConditions,assertConquestRookDefenseConditionReceipt} from './conquest-rook-defense-conditions.js';

const f=Math.fround,uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
// Explicit PE-image initial values, not a claim about every running client.
// A separate VM_READ observation matched all three on2026-10-21; see handoff.
export const CONQUEST_PAWN_SOURCE_INITIAL_MOVEMENT_GLOBALS=Object.freeze({
 profile:'source-image-initial-globals',skin:f(.015),globalMask:0x1867ff,validationGlobalMask:0x67ff,
 sourceAddresses:Object.freeze({skin:0x15f4210,globalMask:0x15f4218,validationGlobalMask:0x15f4214}),nativeReady:false,
});
export const CONQUEST_PAWN_MOVEMENT_CONSTANTS=Object.freeze({float1:f(.0001),float13:f(.02),float37:f(.7),float42:f(.9)});
const owners=new WeakMap();
export function assertConquestPawnMovementOwner(owner,{actor}={}){if(!(owner instanceof ConquestPawnMovementOwner)||actor!==undefined&&owners.get(actor)!==owner)throw Error('Actual retained Pawn movement owner required');owner.synchronize();return owner;}
// Actor virtual78/97EB50 also calls7B0C10 on its retained body118. A
// delayed command must not update only the model/protected actor position.
export function setConquestPawnCommandPosition(actor,position){
 assertConquestPawnMovementSourceActor(actor);
 const owner=owners.get(actor);if(owner)return owner.writeCommandPosition(position);
 actor.setNativePosition(position);return {actor,bodyPresent:false};
}

// A retained *fresh* CMonster solver, not a replacement physics controller.
// Creation A01B30 initializes6A8 through7B0AE0; each A03B30 move initializes
// response6AC through7B0B30. Their equal fresh values do not make them aliases.
export function commitConquestKingFastRunFlag35d(actor,receipt){const owner=owners.get(actor);if(!owner)throw Error('Actual King movement owner required');return owner.commitKingFastRunFlag35d(actor,receipt);}

export class ConquestPawnMovementOwner{
 #bridge;#actor;#model;#world;#queries;#globals;#body;#queryMask;#actorMask;#responseMask;#runtime=null;#lastResult=null;#disposed=false;#refusal=null;
 #fastRun35d=0;#conditions208=[];#helper2f0={enabled30:false,rate2c:1};
 #physical={phase:0,velocity:[0,0,0]};#lastVertical=null;
 #defenseConditions=null;#conditionAuthority=null;
 constructor({bridge,actor,world,worldQueries,globalsProfile}={}){
  if(!(bridge instanceof ConquestRuntimeBridge)||!(actor instanceof ConquestMonsterActor)||bridge.actors.get(actor.id)!==actor)throw Error('Actual authority-owned fresh Pawn actor and bridge required');
  assertConquestPawnMovementSourceActor(actor);
  if(globalsProfile!==CONQUEST_PAWN_SOURCE_INITIAL_MOVEMENT_GLOBALS)throw Error('Explicit source-image-initial movement globals profile required');
  if(owners.has(actor))throw Error('Pawn already has a retained movement body owner');
  if(bridge.pawnRuntimes.has(actor.id))throw Error('Movement body must be owned before attaching Pawn state runtime');
  assertConquestMovementWorldQueries(worldQueries,{world});
  this.#bridge=bridge;this.#actor=actor;this.#model=actor.model;this.#world=world;this.#queries=worldQueries;this.#globals=globalsProfile;
  this.#body=actor.createNativeCollisionBody({ruleId:12});
  //7AFFF0 constructor6A8=17BF, then A01E32..A01E59 clears and ORs actor318.
  this.#actorMask=this.#body.collisionMask;this.#queryMask=this.#actorMask;this.#responseMask=this.#body.solverDefaults.responseMask;
  owners.set(actor,this);
 }
 #current(){
  if(this.#disposed)throw Error('Disposed Pawn movement owner');
  if(this.#refusal)throw Error(this.#refusal);
  if(this.#bridge.actors.get(this.#actor.id)!==this.#actor||this.#actor.model!==this.#model||owners.get(this.#actor)!==this)throw Error('Stale or replaced Pawn movement owner');
  assertConquestMovementWorldQueries(this.#queries,{world:this.#world});
  if(this.#runtime&&(this.#runtime.disposed||this.#bridge.pawnRuntimes.get(this.#actor.id)!==this.#runtime))throw Error('Stale or disposed actual Pawn state runtime');
  if(this.#actor.width!==this.#body.width||this.#actor.height!==this.#body.height)throw Error('Pawn dimensions changed without the native body setters');
 }
 #aligned(){if(['x','y','z'].some((key,i)=>this.#actor.positionNative[key]!==this.#body.state.anchor684[i]))throw Error('Pawn position changed without its retained movement solver');}
 synchronize=()=>{
  this.#current();const result=this.#runtime?.lastMovementResult;
  if(result&&result!==this.#lastResult){
   if(result.actor!==this.#actor)throw Error('Foreign Pawn movement result');
   if(result.qualified===true){
    if(!result.state||!result.position||['x','y','z'].some((key,i)=>result.position[key]!==result.state.anchor684[i]||result.position[key]!==this.#actor.positionNative[key]))throw Error('Actual committed Pawn solver/actor position mismatch');
    if(result.solverMask!==this.#queryMask||result.responseMask!==this.#actorMask)throw Error('Retained Pawn query/response masks mismatch');
    this.#body.state=result.state;
   }
   // Refused solver steps remain on the runtime for diagnosis; they cannot
   // impersonate an actor write or overwrite this last committed body.
   this.#lastResult=result;
   this.#responseMask=result.responseMask;
  }
  this.#aligned();return this.#body.state;
 };
 writeCommandPosition(position){
  this.synchronize();const p=conquestNativeMoveVector(position);
  this.#actor.setNativePosition(p);
  //7B0C10 copies both anchors and leaves contact/support/history fields
  // intact. Never create a new solver or retain the old last-safe position.
  this.#body.state.anchor684=[p.x,p.y,p.z];this.#body.state.lastSafe69c=[p.x,p.y,p.z];
  return {actor:this.#actor,bodyPresent:true,sourceSetter:0x97eb50,bodySetter:0x7b0c10};
 }
 // A0154B writes35D=0. The ordinary Normal state A31DEA reads this field.
 // No guessed fast-run setter or unsupported input9 is supplied.
 commitKingFastRunFlag35d(actor,receipt){this.#current();this.#aligned();if(actor!==this.#actor||actor.spawnStats.monsterKey!==1500||!this.#runtime)throw Error('Actual attached King1500 movement owner required');assertConquestKingFastRunFlagReceipt(receipt,{actor,movementOwner:this});this.#fastRun35d=1;return receipt;}
 isFastRun=state=>{this.#current();if(state?.actor!==this.#actor)throw Error('Actual Pawn state required');return this.#fastRun35d!==0;};
 // Fresh54ABC0 vector has begin=end=capacity=0;54B1C0(flag1) returns false.
 // Populated defense0x100 comes from its real virtual54/50 owner below;
 // unknown status lists never become a default false callback.
 readStatus=()=>{
  this.#current();if(this.#conditions208.length)throw Error('Native condition virtual54/50 producers required');
  let blocksHorizontal=false;
  if(this.#defenseConditions){
   assertConquestRookDefenseConditions(this.#defenseConditions,{actorAuthority:this.#conditionAuthority});
   const receipt=this.#defenseConditions.readConditions(this.#actor);assertConquestRookDefenseConditionReceipt(receipt,{owner:this.#defenseConditions,actor:this.#actor});
   if(receipt.conditions.some(c=>c.conditionMask!==0x100||typeof c.activeVirtual54!=='boolean'||typeof c.matchesMovementMask1!=='boolean'))throw Error('Unknown populated source208 movement condition');
   blocksHorizontal=receipt.blocksHorizontal;
  }
  return {blocksHorizontal,statusRate:this.#helper2f0.enabled30?f(this.#helper2f0.rate2c):1};
 };
 bindDefenseConditions({owner,actorAuthority}={}){
  this.#current();if(this.#defenseConditions)throw Error('Movement condition208 already has an owner');
  assertConquestRookDefenseConditions(owner,{actorAuthority});if(!owner.hasActor(this.#actor))throw Error('Same actual actor208 defense binding required');
  this.#defenseConditions=owner;this.#conditionAuthority=actorAuthority;return this.readStatus();
 }
 readWorldContext=({managerFlag20}={})=>{
  this.#current();if(typeof managerFlag20!=='boolean')throw Error('Actual current collision manager flag20 required');
  // Requests retain this private owner for context lookup; the native contact
  // consumer needs its stable S5 scalar identity for self-exclusion.
  return {qualified:true,managerFlag20,solverMask:this.#queryMask,overlapGlobalMask:this.#globals.validationGlobalMask,sourceSolverId:this.#actor.id};
 };
 readPhysicalPhase114(){this.#current();return this.#physical.phase;}
 writeBlowPhase114(state,value){this.#current();if(state!==this.#runtime?.blow||state.actor!==this.#actor||value!==1)throw Error('Actual source Blow entry phase1 writer required');this.#physical.phase=1;}
 // A031D0: physics property97DFD0 gates virtual1F8/A033D0 before
 // A13680. The same retained body subsequently receives the Run XZ request.
 tickActorPrefix=deltaMs=>{
  this.synchronize();if(!uint(deltaMs))throw Error('Source actor DWORD delta required');
  if(this.#defenseConditions)this.#defenseConditions.tickActor(this.#actor,deltaMs);
  const properties=readConquestPawnPhysicsProperties(this.#actor);
  if(properties.qualified!==true||typeof properties.physicsEnabled!=='boolean')throw Error('Authenticated Pawn physics properties required');
  if(!properties.physicsEnabled)return this.#lastVertical={qualified:true,physicsEnabled:false,nativeReady:false};
  const status=this.readStatus(),context={skin:this.#globals.skin,globalMask:this.#globals.globalMask,validationGlobalMask:this.#globals.validationGlobalMask,solverMask:this.#queryMask,
   maximumIterations:this.#body.solverDefaults.maximumIterations,...CONQUEST_PAWN_MOVEMENT_CONSTANTS};
  const result=conquestMonsterVerticalTick(this.#physical,deltaMs,{
   readTerminal:()=>readConquestPawnPhysicsProperties(this.#actor).terminalVelocity,
   readGravity:()=>readConquestPawnPhysicsProperties(this.#actor).gravity,
   readPosition:()=>[...this.#body.state.anchor684],clearGrounded:()=>{this.#body.state.grounded6b4=false;},readGrounded:()=>this.#body.state.grounded6b4,
   move:delta=>{
    const moved=conquestMonsterCollisionOperation({state:this.#body.state,displacement:{x:delta[0],y:delta[1],z:delta[2]},blocksHorizontal:status.blocksHorizontal,collisionMask:this.#actorMask,context,
     queryContact:input=>this.#queries.queryContact({...input,sourceSolverId:this}),
     queryLowerSupport:input=>this.#queries.queryLowerSupport({...input,sourceSolverId:this}),
     queryAdjustedPosition:input=>this.#queries.queryAdjustedPosition({...input,sourceSolverId:this})});
    this.#responseMask=moved.responseMask;if(moved.qualified){this.#body.state=moved.state;this.#actor.setNativePosition(moved.position);}return moved;
   },
  });
  if(result.qualified)this.#physical=result.state;
  return this.#lastVertical={...result,physicsEnabled:true};
 };
 readKingTimedMovementOperands=(actor,state)=>{this.synchronize();if(actor!==this.#actor||actor.spawnStats.monsterKey!==1500||!this.#runtime||this.#runtime.manager.current!==state||![9,10].includes(state.stateId))throw Error('Actual retained King timed-motion state required');assertConquestKingRuntime(this.#runtime,{actor});const status=this.readStatus(),direction=conquestNativeMoveVector(actor.moveDirectionNative);let speed=f(f(actor.spawnStats.moveSpeed)*f(actor.commandSpeedMultiplier));speed=f(speed*f(status.statusRate));return {direction,speed,tempo:f(.001)};};
 readRunContext=(actor,state,deltaMs)=>{
  this.#current();if(actor!==this.#actor||state?.actor!==actor||state.stateId!==1||!uint(deltaMs))throw Error('Actual Pawn Run state and unsigned delta required');
  const retained=this.synchronize(),status=this.readStatus();
  return {state:retained,...status,collisionMask:this.#actorMask,
   context:{skin:this.#globals.skin,globalMask:this.#globals.globalMask,validationGlobalMask:this.#globals.validationGlobalMask,solverMask:this.#queryMask,
    maximumIterations:this.#body.solverDefaults.maximumIterations,...CONQUEST_PAWN_MOVEMENT_CONSTANTS},
   // JS owner token, not an extra native field. A shared map tree can resolve
   // the current retained solver without a mutable "last actor" global or
   // recompiling1601 faces for every Pawn.
   queryContact:input=>this.#queries.queryContact({...input,sourceSolverId:this}),
   queryLowerSupport:input=>this.#queries.queryLowerSupport({...input,sourceSolverId:this}),
   queryAdjustedPosition:input=>this.#queries.queryAdjustedPosition({...input,sourceSolverId:this})};
 };
 attachPawnRuntime(ports={}){
  this.#current();this.#aligned();if(this.#runtime||['readRunContext','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Movement owner ports cannot be replaced or attached twice');
  this.#runtime=this.#bridge.attachPawnRuntime(this.#actor.id,{...ports,readRunContext:this.readRunContext,isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix});return this.#runtime;
 }
 attachExplodeRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1013||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1013 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestPawnExplodeRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned explosive Pawn movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned explosive Pawn state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestPawnExplodeRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachRookRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1100||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1100 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestRookRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned Rook movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Rook state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestRookRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachRookExplodeRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1110||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1110 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestRookExplodeRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned RookExplode movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned RookExplode state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestRookExplodeRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachBishopRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1303||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1303 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestBishopRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned Bishop movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Bishop state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestBishopRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachBishopSnipeRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1314||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1314 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestBishopSnipeRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned BishopSnipe movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned BishopSnipe state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestBishopSnipeRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachKnightRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1203||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1203 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestKnightRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned Knight movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Knight state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestKnightRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachKingRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1500||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick','moveSourceDisplacement','readMovementOperands'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1500 runtime and retained movement ports required');
  const actor=this.#actor,{clockOwner,...runtimePorts}=ports;assertConquestKingAIClocks(clockOwner,{actor,monsterActors:this.#bridge.actors});const runtime=new ConquestKingRuntime({...runtimePorts,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:deltaMs=>{const result=this.tickActorPrefix(deltaMs);if(result.qualified===true)clockOwner.tickActorClocks(actor,deltaMs);return result;},moveSourceDisplacement:this.moveSourceDisplacement,readMovementOperands:this.readKingTimedMovementOperands,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned King movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned King state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestKingRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachQueenRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1403||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1403 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestQueenRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned Queen movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Queen state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestQueenRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 attachKnightChargeRuntime(ports={}){
  this.#current();this.#aligned();
  if(this.#actor.spawnStats.monsterKey!==1204||this.#runtime||this.#bridge.pawnRuntimes.has(this.#actor.id)||['actor','readCurrentActor','readRunContext','runMovement','isFastRun','beforeStateTick'].some(key=>Object.hasOwn(ports,key)))throw Error('Distinct1204 runtime and retained movement ports required');
  const actor=this.#actor,runtime=new ConquestKnightChargeRuntime({...ports,actor,readCurrentActor:()=>this.#bridge.actors.get(actor.id),
   isFastRun:this.isFastRun,beforeStateTick:this.tickActorPrefix,
   runMovement:(target,state,deltaMs)=>{
    if(target!==actor)throw Error('Owned KnightCharge movement actor required');
    const source=this.readRunContext(target,state,deltaMs);
    return this.#bridge.executeRunMovement(actor.id,deltaMs,{...source,stateId:state.stateId,requestNativeState:(received,input)=>{if(received!==actor)throw Error('Owned Knight state actor required');runtime.manager.requestInput(input);}});
   }});
  assertConquestKnightChargeRuntime(runtime,{actor});this.#runtime=runtime;this.#bridge.pawnRuntimes.set(actor.id,runtime);return runtime;
 }
 // A2E200 calls virtual70/A03B30 for a MoveBox delta in every base state,
 // including attacks. It does not call the state1 Run speed calculator.
 moveSourceDisplacement=(actor,state,deltaXYZ)=>{
  this.synchronize();
  if(actor!==this.#actor||![1203,1204,1403,1500].includes(actor.spawnStats.monsterKey)||!this.#runtime||state?.actor!==actor||this.#runtime.manager.current!==state||this.#runtime.manager.findInputState(state.stateId)!==state||(actor.spawnStats.monsterKey===1500?![0,1,2,3,4,5,8,9,10].includes(state.stateId):state.stateId>6))throw Error('Actual retained Knight state required for source MoveBox collision');
  if(actor.spawnStats.monsterKey===1204)assertConquestKnightChargeRuntime(this.#runtime,{actor});else if(actor.spawnStats.monsterKey===1403)assertConquestQueenRuntime(this.#runtime,{actor});else if(actor.spawnStats.monsterKey===1500)assertConquestKingRuntime(this.#runtime,{actor});else assertConquestKnightRuntime(this.#runtime,{actor});
  const displacement=conquestNativeMoveVector(deltaXYZ),status=this.readStatus();
  const moved=conquestMonsterCollisionOperation({state:this.#body.state,displacement,blocksHorizontal:status.blocksHorizontal,collisionMask:this.#actorMask,
   context:{skin:this.#globals.skin,globalMask:this.#globals.globalMask,validationGlobalMask:this.#globals.validationGlobalMask,solverMask:this.#queryMask,maximumIterations:this.#body.solverDefaults.maximumIterations,...CONQUEST_PAWN_MOVEMENT_CONSTANTS},
   queryContact:input=>this.#queries.queryContact({...input,sourceSolverId:this}),queryLowerSupport:input=>this.#queries.queryLowerSupport({...input,sourceSolverId:this}),queryAdjustedPosition:input=>this.#queries.queryAdjustedPosition({...input,sourceSolverId:this})});
  this.#responseMask=moved.responseMask;
  if(moved.qualified){this.#body.state=moved.state;actor.setNativePosition(moved.position);}
  const result={...moved,actor,sourceOperation:0xa03b30};this.#lastResult=result;return result;
 };
 // The currently closed scope is fresh normal locomotion. A future source
 // writer must extend this owner before mutating35D,208,2F0 or body fields.
 invalidateSourceState(reason){if(typeof reason!=='string'||!reason.trim())throw Error('Exact unqualified native movement writer required');this.#refusal='Pawn movement source state requires qualification: '+reason;}
 snapshot(){
  this.synchronize();return {actorId:this.#actor.id,attached:!!this.#runtime,queryMask6a8:this.#queryMask,responseMask6ac:this.#responseMask,actorMask318:this.#actorMask,
   constructorQueryMask:this.#body.solverDefaults.constructorMask,maximumIterations:this.#body.solverDefaults.maximumIterations,position:[...this.#body.state.anchor684],grounded:this.#body.state.grounded6b4,
   isFastRun:this.#fastRun35d!==0,...this.readStatus(),physicalPhase114:this.#physical.phase,velocityF0:[...this.#physical.velocity],lastVertical:this.#lastVertical,conditionCount:this.#defenseConditions?this.#defenseConditions.readConditions(this.#actor).conditionCount:this.#conditions208.length,globalsProfile:this.#globals.profile,
   nativeReady:false,liveMovementCompared:false,sourceInitialStateOnly:!this.#defenseConditions,
   limits:['Fresh35D/2F0 and empty208 or typed defense0x100 only; other writers must invalidate this owner','Source-image globals and analytical map46 queries; no live movement parity','Teleport, body resize, other populated conditions and damage-blink speed writes are not yet ported']};
 }
 dispose(){if(this.#disposed)return;this.#disposed=true;if(owners.get(this.#actor)===this)owners.delete(this.#actor);}
}
