// One runtime owner for the source actor frame, current properties and loaded
// source worlds. Source state/preface/tail implementations remain mandatory.
import {createNativeActorCollisionFrame} from './native-actor-collision-frame.js';
import {createNativeActorPropertyPorts} from './native-actor-properties.js';
import {createNativeCollisionRuntimeWorlds} from './native-collision-runtime-world.js';
import {createNativeCollisionWorldPorts} from './native-collision-world-ports.js';
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const syncResult=value=>{if(value&&typeof value.then==='function')throw TypeError('Native actor runtime ports must complete synchronously');return value;};
export function createNativeActorRuntimeProfile({source,worldOwner,initialState,batching,mapping,arithmeticProfile,
 readWorldBindings,readRegistryFloat,readActorProperty,readActorConditions,readCollisionContext,readOperationContext,
 readSourceFrame,readPresentation,readResetState}={}){
 if(typeof source!=='string'||!source.trim()||!worldOwner||typeof worldOwner!=='object'||!initialState||!Object.hasOwn(initialState,'stateContainer'))throw TypeError('Explicit runtime source, loaded world owner and owned state container required');
 if(![readWorldBindings,readRegistryFloat,readActorProperty,readActorConditions,readCollisionContext,readOperationContext,readSourceFrame,readPresentation,readResetState].every(synchronous))throw TypeError('Explicit synchronous native runtime world, property, query, frame, view and reset ports required');
 let disposed=false,engine,sourceHookActive=false,rayFrameApi=null;
 const worlds=createNativeCollisionRuntimeWorlds({readBindings:readWorldBindings});
 const active=()=>{if(disposed)throw Error('Native actor runtime profile is disposed');};
 const lifecycleIdle=()=>{active();if(currentCallbacks||sourceHookActive)throw Error('Native runtime lifecycle cannot change during an active source hook/frame');};
 const sourceHook=fn=>{active();if(sourceHookActive||currentCallbacks)throw Error('Native runtime source hook cannot be reentered');sourceHookActive=true;try{return fn();}finally{sourceHookActive=false;}};
 const currentState=()=>{active();return engine.snapshot();};
 const readFloat=index=>syncResult(readRegistryFloat(index,currentState()));
 const readProperty=(key,storage)=>syncResult(readActorProperty(key,storage,currentState()));
 const properties=createNativeActorPropertyPorts({source,
  readFloat,readProperty:key=>readProperty(key,{storage:'float32',actorOffset:0x2c}),
  readConditionList:()=>syncResult(readActorConditions(currentState()))});
 const queries=createNativeCollisionWorldPorts({arithmeticProfile,readCurrent:(kind,input)=>{
  active();const geometry=worlds.read();if(!geometry.qualified)return geometry;
  const context=syncResult(readCollisionContext(kind,input,currentState(),{api:kind==='ray'?rayFrameApi:undefined}));
  if(context?.qualified!==true)return {qualified:false,reason:context?.reason??'current-runtime-collision-context-unqualified'};
  // Keep current-context getters lazy through the runtime boundary too.
  // Geometry owns its world descriptors, while masked actor branches must not
  // be read just because the context was combined with those descriptors.
  const merged={};
  for(const owner of [context,geometry])for(const key of Reflect.ownKeys(owner))Object.defineProperty(merged,key,{
   enumerable:Object.getOwnPropertyDescriptor(owner,key).enumerable,configurable:true,get:()=>Reflect.get(owner,key,owner)});
  return merged;
 }});
 try{
  engine=createNativeActorCollisionFrame({source,state:initialState,batching,...properties,readFloat,
   readRay:(input,api)=>{
    if(!currentCallbacks||rayFrameApi)throw Error('Source ray requires a non-reentered owned actor frame');
    rayFrameApi=api;try{return queries.queryRay(input);}finally{rayFrameApi=null;}
   },
   readOperation:request=>{
    const value=syncResult(readOperationContext(request,currentState()));
    if(value?.qualified!==true)throw Error(value?.reason??'Current runtime operation context unqualified');
    return {context:value.context,...queries};
   },
   consumeActor28Command:(command,api)=>{
    // Runtime must supply the real command consumer with its frame callbacks.
    if(!currentCallbacks||!synchronous(currentCallbacks.consumeActor28Command))throw TypeError('Current source actor28 consumer required');
    return syncResult(currentCallbacks.consumeActor28Command(command,api));
   },
  });
 }catch(error){worlds.dispose();throw error;}
 let currentCallbacks=null;
 const ownState=value=>{if(!value||!Object.hasOwn(value,'stateContainer'))throw TypeError('Owned native state container required on reset/restore');return value;};
 const checkController=controller=>{active();if(controller?.world!==worldOwner)throw Error('Native runtime belongs to another loaded world');};
 const frame={
  source,
  frame(options){
   lifecycleIdle();
   if(!options||!synchronous(options.consumeActor28Command))throw TypeError('Explicit synchronous current source actor28 consumer required');
   currentCallbacks=options;
   try{return engine.frame(options);}finally{currentCallbacks=null;}
  },
  snapshot:()=>engine.snapshot(),
  reset:value=>{lifecycleIdle();return engine.reset(ownState(value));},
  prepareReset:value=>{lifecycleIdle();return engine.prepareReset(ownState(value));},
  restore:value=>{lifecycleIdle();return engine.restore(ownState(value));},
 };
 return {
  source,frame,mapping,
  readFrame(args){
   checkController(args?.controller);
   return sourceHook(()=>syncResult(readSourceFrame({...args,state:currentState(),readFloat,readProperty})));
  },
  readPresentation(args){checkController(args?.controller);return sourceHook(()=>syncResult(readPresentation(args)));},
  resetFrame(args){checkController(args?.controller);return sourceHook(()=>ownState(syncResult(readResetState({...args,state:currentState()}))));},
  dispose(){if(disposed)return;lifecycleIdle();disposed=true;worlds.dispose();},
  diagnostics(){return {disposed,geometry:worlds.diagnostics(),defaultRuntimeActivated:false,nativeReady:false,nativeTrajectoriesCompared:false};},
 };
}
