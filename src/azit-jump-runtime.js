// Azit-only lifecycle adapter. Physics stays in per-actor F0 owners; this file
// never mutates Controller/input, source meshes, collision streams or clocks.
import {TUNING} from './movement-profile.js';
import {createAzitJumpStations,azitActorTriggerBox} from './azit-jump-stations.js';
import {createAzitNativeLaunch,azitS5LaunchGates} from './azit-native-launch.js';

const installed=new WeakMap();
const actorObject=actor=>actor!==null&&['object','function'].includes(typeof actor);
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);

export function installAzitJumpRuntime(world){
 if(!world||world.nativeMapId!==15||world.sourceData?.key!=='MAPNAME_AZIT')throw Error('Azit15 source world required for jump runtime');
 if(installed.has(world))return installed.get(world);
 const keys=['sourceLaunchMotion','setSourceLaunchContext','dispose'];
 const descriptors=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(world,key)]));
 if([...descriptors.values()].some(descriptor=>descriptor?.configurable===false))throw Error('Azit jump lifecycle requires configurable owned world ports');
 const stations=createAzitJumpStations(world.sourceData),actors=new Map(),contacts=new Map(),listeners=new Set(),originalDispose=world.dispose;
 const notify=event=>{for(const listener of listeners)try{listener(event);}catch{/* An artist observer cannot change F0 or interrupt a collision step. */}};
 let readActorState=null,disposed=false;
 const releaseActor=actor=>{contacts.delete(actor);return actors.delete(actor);};
 const clear=()=>{for(const owner of actors.values())owner.reset();actors.clear();contacts.clear();notify({type:'presentation-cleared',artistPresentation:true});};
 function configure(settings){
  if(disposed)return false;
  if(settings!==null&&(!settings||!synchronous(settings.readActorState)))throw TypeError('Explicit synchronous Azit readActorState or null required');
  // A new context owns a new actor lifetime. Old pending moves and momentum
  // cannot leak into a cached map or another match when the context changes.
  clear();readActorState=settings===null?null:settings.readActorState;return true;
 }
 const runtime=Object.freeze({stations,
  subscribeEvents(listener){if(disposed)throw Error('Azit jump runtime disposed');if(typeof listener!=='function')throw TypeError('Jump presentation listener required');listeners.add(listener);return()=>listeners.delete(listener);},
  configure,
  beforeMove(actor,dt){
   if(disposed||!readActorState)return null;
   if(!actorObject(actor))throw TypeError('Explicit Azit actor identity required');
   if(actor.world&&actor.world!==world){releaseActor(actor);return null;}
   const context=readActorState(actor);
   if(context&&typeof context.then==='function')throw TypeError('Azit actor state reader must return synchronously');
   if(context===null){releaseActor(actor);return null;}
   const policy=azitS5LaunchGates(context);
   if(!policy.qualified)throw Error('Azit actor context unqualified: '+policy.reason);
   const box=azitActorTriggerBox(actor.position,{width:.7*(2*TUNING.radius),height:TUNING.height});
   let owner=actors.get(actor);
   if(!owner){owner=createAzitNativeLaunch({stations});actors.set(actor,owner);}
   const contribution=owner.beforeMove({dt,position:actor.position,actorBox:box,gates:policy.gates}),previous=contacts.get(actor)??new Set(),current=new Set(contribution.launches.map(command=>command.areaId));contacts.set(actor,current);
   for(const command of contribution.launches)if(!previous.has(command.areaId))notify({type:'launch-contact',areaId:command.areaId,position:{...actor.position},artistPresentation:true});
   return contribution;
  },
  afterMove(actor,{position,groundContact}={}){
   if(disposed||!readActorState)return null;
   const owner=actors.get(actor),result=owner?owner.afterMove({position,groundContact}):null;if(result?.landed)notify({type:'landed',position:{...position},artistPresentation:true});return result;
  },
  resetActor(actor){contacts.delete(actor);const owner=actors.get(actor);if(!owner)return null;const state=owner.reset();notify({type:'presentation-cleared',artistPresentation:true});return state;},
  releaseActor,
  snapshotActor(actor){return actors.get(actor)?.exportState()??null;},
  snapshot(){return Object.freeze({disposed,configured:readActorState!==null,actorCount:actors.size,stationCount:stations.profiles.length,
   scope:'S5 ordinary-character fixed-step adaptation',nativeRuntimeParity:false});},
  dispose(){
   if(disposed)return;disposed=true;readActorState=null;clear();listeners.clear();installed.delete(world);
   // Do not undo a later owner's replacements. Restore exact original
   // descriptors only while the corresponding port still belongs to us.
   for(const [key,value]of [['sourceLaunchMotion',runtime],['setSourceLaunchContext',configure],['dispose',disposeWorld]]){
    if(Object.getOwnPropertyDescriptor(world,key)?.value!==value)continue;
    const descriptor=descriptors.get(key);if(descriptor)Object.defineProperty(world,key,descriptor);else delete world[key];
   }
  }
 });
 function disposeWorld(...args){runtime.dispose();return typeof originalDispose==='function'?originalDispose.apply(this,args):undefined;}
 try{
  Object.defineProperties(world,{
   sourceLaunchMotion:{value:runtime,writable:true,configurable:true,enumerable:true},
   setSourceLaunchContext:{value:configure,writable:true,configurable:true,enumerable:true},
   dispose:{value:disposeWorld,writable:true,configurable:true,enumerable:true}
  });
 }catch(error){runtime.dispose();throw error;}
 installed.set(world,runtime);return runtime;
}
