// Source composition: module1 timer -> actor51EAB0 physics/current-state
// ordering -> actor526D00 -> batched actor70 ->51C2F0 ->7B0180.
// Intermediate/current-state/tail callbacks remain explicit source ports.
import {nativeActorPhysicsTick,copyNativeActorPhysicsState} from './native-actor-physics.js';
import {nativeActorCollisionMove} from './native-actor-collision-move.js';
import {nativeCollisionOperation} from './native-collision-operation.js';
import {createNativeMovementBatcher} from './native-movement-batching.js';
import {traceNativeJumpDispatch} from './native-air-control-order.js';
const f=Math.fround;
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const vector=a=>{if(!Array.isArray(a)||a.length!==3||a.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit native XYZ required');return a.map(f);};
class Refusal extends Error{}
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const resultSync=value=>{if(value&&typeof value.then==='function')throw TypeError('Native frame ports must complete synchronously');return value;};
function copyContainer(value){
 if(!value||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)throw TypeError('Explicit plain source state container required');
 const active=new Set(),copies=new Map();let nodes=0;
 function copy(item,depth){
  if(++nodes>50000||depth>100)throw RangeError('Source state container exceeds bounded data domain');
  if(item===null||typeof item==='string'||typeof item==='boolean')return item;
  if(typeof item==='number'&&Number.isFinite(item))return item;
  if(typeof item!=='object'||active.has(item)||(!Array.isArray(item)&&Object.getPrototypeOf(item)!==Object.prototype))throw TypeError('Source state container requires finite acyclic plain data');
  if(copies.has(item))return copies.get(item);
  active.add(item);const result=Array.isArray(item)?[]:{};copies.set(item,result);
  if(Array.isArray(item))for(const value of item)result.push(copy(value,depth+1));
  else for(const [key,value]of Object.entries(item))Object.defineProperty(result,key,{value:copy(value,depth+1),enumerable:true,writable:true,configurable:true});
  active.delete(item);return result;
 }
 return copy(value,0);
}

export function createNativeActorCollisionFrame({state,batching,readActorPolicy,readOperation,readRay,readFloat,readTerminalSpeed,readGravity,consumeActor28Command,source}={}){
 if(typeof source!=='string'||!source.trim()||![readActorPolicy,readOperation,readFloat,readTerminalSpeed,readGravity,consumeActor28Command].every(synchronous))throw TypeError('Explicit synchronous source frame, properties, actor policy, complete queries and actor28 consumer required');
 function checkedState(value){
  const physics=copyNativeActorPhysicsState(value?.physics);
  const solver=nativeCollisionOperation({state:value?.solver,target:value?.solver?.anchor684,mode:value?.solver?.mode6b8??0}).state;
  if(physics.actor2f0.some((n,i)=>n!==solver.anchor684[i]))throw TypeError('Coherent physical actor2F0 and solver684 entry required');
  if(physics.grounded6b4!==solver.grounded6b4)throw TypeError('Actor and solver must expose the same contact byte at frame entry');
  return {physics,solver,...(Object.hasOwn(value,'stateContainer')?{stateContainer:copyContainer(value.stateContainer)}:{})};
 }
 let current=checkedState(state);
 const makeBatch=value=>createNativeMovementBatcher({...batching,state:value});
 let batch=makeBatch(batching?.state);const initialBatch=batch.snapshot();
 let running=false;
 const snapshot=()=>({...structuredClone(current),batching:batch.snapshot()});
 function restore(value){if(running)throw Error('Cannot restore during an active native frame');const restored=checkedState(value),restoredBatch=makeBatch(value?.batching);current=restored;batch=restoredBatch;return snapshot();}
 function prepareReset(value){if(running)throw Error('Cannot prepare reset during an active native frame');const restored=checkedState(value),restoredBatch=makeBatch({...initialBatch,records:[]});return {...restored,batching:restoredBatch.snapshot()};}
 function reset(value){const prepared=prepareReset(value),restored=checkedState(prepared),restoredBatch=makeBatch(prepared.batching);current=restored;batch=restoredBatch;return snapshot();}
 function frame({engineDtMs,frameDeltaSeconds,beforePhysics,resolveActorAcceptsPhysics,betweenPhysicsAndState,resolveCurrentStateTick,afterCurrentStateTick}={}){
  engineDtMs=uint(engineDtMs,'engine frame delta');
  if(running)throw Error('Native actor frame cannot be reentered');
  if(![beforePhysics,resolveActorAcceptsPhysics,betweenPhysicsAndState,resolveCurrentStateTick,afterCurrentStateTick].every(synchronous))throw TypeError('Explicit synchronous preface/current physics gate/intermediate/current-state/tail ports required');
  const before=snapshot(),operations=[],requests=[],actor28Commands=[],commands=[],timeline=[];let physicsResult=null;
  let active=true,actorAcceptedPhysics=null;running=true;
  const ensureActive=()=>{if(!active)throw Error('Native frame API cannot escape its synchronous callback window');};
  const api={
   readPhysics(){ensureActive();return structuredClone(current.physics);},
   readActorAcceptedPhysics(){ensureActive();if(actorAcceptedPhysics===null)throw Error('Frame physics gate has not been resolved');return actorAcceptedPhysics;},
   querySourceRay(input){ensureActive();if(!synchronous(readRay))throw TypeError('Explicit synchronous owned source ray provider required');return resultSync(readRay(input,api));},
   writeVelocityF0(value){ensureActive();current.physics.velocityF0=vector(value);},
   writeMode114(value){ensureActive();current.physics.mode114=uint(value,'actor mode114');},
   writeTimer22c(value){ensureActive();current.physics=copyNativeActorPhysicsState({...current.physics,timer22c:value});},
   readStateContainer(){ensureActive();if(!Object.hasOwn(current,'stateContainer'))throw Error('No source state container was supplied');return copyContainer(current.stateContainer);},
   writeStateContainer(value){ensureActive();if(!Object.hasOwn(current,'stateContainer'))throw Error('No source state container was supplied');current.stateContainer=copyContainer(value);},
   emitCommand(value){ensureActive();const command=copyContainer(value);if(typeof command.type!=='string'||!command.type.trim())throw TypeError('Explicit deferred command type required');commands.push(command);},
   actor70({displacement,callsite}){
    ensureActive();displacement=vector(displacement);callsite=uint(callsite,'actor70 caller return address');
    const path=batch.move({actorId:batching.actorId,localActorId:batching.localActorId,callsite,displacement,forwardEnabled:true,
     forward:({displacement:forwarded})=>{
      const request={callsite,displacement:forwarded.slice(),physics:structuredClone(current.physics),solver:structuredClone(current.solver)};
      const result=nativeActorCollisionMove({state:current.solver,displacement:forwarded,actorPolicy:readActorPolicy(request),
       readOperation:write=>readOperation({...request,...write})});
      operations.push(...result.operations.map(operation=>({callsite,...operation})));
      if(!result.qualified)throw new Refusal(result.reason);
      current.solver=result.state;current.physics.actor2f0=result.actor2f0;
      current.physics.grounded6b4=current.solver.grounded6b4;
     }});
    requests.push({callsite,displacement:displacement.slice(),...path});
    return {qualified:true,actor2f0:current.physics.actor2f0.slice(),grounded6b4:current.solver.grounded6b4};
   },
  };
  try{
   batch.timerFrame({deltaSeconds:frameDeltaSeconds,forwardFrame:()=>{
    //51EAE2..51F356 is an explicit source port, not an implicit no-op.
    resultSync(beforePhysics(engineDtMs,api));timeline.push('before-physics-preface');
    const actorAcceptsPhysics=resultSync(resolveActorAcceptsPhysics(api));
    if(typeof actorAcceptsPhysics!=='boolean')throw TypeError('Explicit current actor physics gate result required');
    actorAcceptedPhysics=actorAcceptsPhysics;
    timeline.push('resolve-actor-physics-gate');
    const dispatch=traceNativeJumpDispatch({actorAcceptsPhysics,dtMs:engineDtMs,
     physicsTick:dtMs=>{
      const publish=physics=>{
       current.physics=copyNativeActorPhysicsState(physics);
       current.solver.grounded6b4=physics.grounded6b4;
      };
      // Property readers see the current source writes: Float3 precedes the
      // ground reset, gravity precedes terminal lookup, timer precedes actor70.
      physicsResult=nativeActorPhysicsTick({state:current.physics,dtMs,
       readFloat:(index,physics)=>{publish(physics);return readFloat(index,api);},
       readTerminalSpeed:physics=>{publish(physics);return readTerminalSpeed(api);},
       readGravity:physics=>{publish(physics);return readGravity(api);},
       moveBy:request=>{
        // Gravity, clamp and timer writes precede actor70 in the source.
        // Its condition/cap reader must see those current physical fields.
        current.physics=copyNativeActorPhysicsState(request.physicsState);
        return api.actor70({displacement:request.displacement,callsite:request.callsite});
       }});
      if(!physicsResult.qualified)throw new Refusal(physicsResult.reason);
      current.physics=copyNativeActorPhysicsState(physicsResult.state);
      for(const command of physicsResult.actor28Commands){actor28Commands.push(command);resultSync(consumeActor28Command(command,api));}
     },
     betweenPhysicsAndState:dtMs=>resultSync(betweenPhysicsAndState(dtMs,api)),
     resolveCurrentStateTick:()=>{
      const tick=resolveCurrentStateTick(api);
      if(tick!==null&&!synchronous(tick))throw TypeError('Explicit synchronous current-state Tick or null required');
      return tick===null?null:dtMs=>resultSync(tick(dtMs,api));
     }});
    timeline.push(...dispatch.timeline);
    resultSync(afterCurrentStateTick(engineDtMs,api));timeline.push('after-current-state-tail');
   }});
   return {qualified:true,state:snapshot(),physicsResult,operations,requests,actor28Commands,commands,timeline,
    nativeMovementCompared:false,nativeReady:false};
  }catch(error){
   current=checkedState(before);batch=makeBatch(before.batching);
   if(error instanceof Refusal)return {qualified:false,state:null,reason:error.message,operations,requests,actor28Commands:[],commands:[],timeline};
   throw error;
  }finally{active=false;running=false;}
 }
 return {frame,reset,prepareReset,restore,snapshot,source};
}
