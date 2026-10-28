// Bind the complete source ray union to current runtime packet trees and
// source actor/category readers. Raw40-byte triangle packets stay unchanged.
import {createNativeCollisionRayQuery,queryNativeWorldRay} from './native-collision-ray-query.js';
import {queryNativeCollisionRayTree} from './native-collision-ray-tree.js';
import {createNativeCategory400Ray} from './native-category400-ray.js';
import {createNativeCategory800Ray} from './native-category800-ray.js';
import {queryNativeCategory8000Ray} from './native-category8000-ray.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
const knownByte=n=>typeof n==='boolean'||Number.isInteger(n)&&n>=0&&n<=255;
const rawOutput=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});

export function nativePacketRayTreeView(tree,profile){
 if(tree===null)return null;
 if(profile?.qualified!==true||profile.nodeVtable!==0x14aca50||profile.boundsVtable!==0x13f617c||typeof profile.source!=='string'||!profile.source.trim())throw TypeError('Explicit source packet-tree constructor profile required');
 const nodes=new WeakMap(),path=new Set(),lazy=profile.lazyChildren===true;let visited=0;
 function convert(node){
  if(node===null)return null;
  // Opt-in source worlds may contain more than100000 nodes in total. The ray
  // tests bounds before reading children, so materialize only the reached
  // branches. The query still checks cycles and its own traversal budget.
  if(lazy&&node&&typeof node==='object'&&nodes.has(node))return nodes.get(node);
  if(!node||typeof node!=='object'||path.has(node)||++visited>100000)throw TypeError('Bounded acyclic complete source packet tree required');
  if(nodes.has(node))return nodes.get(node);
  if(typeof node.branch!=='boolean'||!node.bounds)throw TypeError('Source packet tree bounds and branch required');
  path.add(node);
  try{
   const view={vtable:profile.nodeVtable,bounds48:{vtable:profile.boundsVtable,min:node.bounds.min,max:node.bounds.max},raw30:node.branch};nodes.set(node,view);
   if(node.branch){
    if(!Array.isArray(node.children)||node.children.length!==8)throw TypeError('Complete source packet child order required');
    if(lazy){
     let children;
     Object.defineProperty(view,'children10',{enumerable:true,get:()=>children??(children=node.children.map(convert))});
    }else view.children10=node.children.map(convert);
   }else{
    if(!Array.isArray(node.records))throw TypeError('Complete packet leaf records required');
    view.records8=node.records.map(record=>{
     if(record?.qualified!==true||!Array.isArray(record.packets)||!knownByte(record.raw14))throw TypeError('Qualified source packet record and filter byte required');
     const raw={raw10:record.raw10,raw18:record.raw18,raw14:!!record.raw14,meshC:{beginEndEqual:record.packets.length===0,trianglePackets:record.packets}};
     Object.defineProperty(raw,'raw34',{enumerable:true,get:()=>{const enabled=record.raw34;if(!knownByte(enabled))throw TypeError('Current source ray enable unavailable');return !!enabled;}});
     return raw;
    });
   }
   return view;
  }finally{path.delete(node);}
 }
 return convert(tree);
}

export function createNativeCollisionRayPorts({readCurrent}={}){
 if(!sync(readCurrent))throw TypeError('Synchronous current source ray reader required');
 let running=false,snapshot=null;
 const bind=(category,names)=>Object.fromEntries(names.map(name=>[name,(...args)=>{
  const binding=snapshot?.[category+'Bindings'];
  if(binding?.qualified!==true||typeof binding.source!=='string'||!binding.source.trim()||!sync(binding.ports?.[name]))throw TypeError(`Current ${category} source port ${name} unavailable`);
  const result=binding.ports[name](...args);if(result&&typeof result.then==='function')throw TypeError('Runtime source ray ports must complete synchronously');return result;
 }]));
 const category400=createNativeCategory400Ray({source:'F6A350 with explicit current source bindings',...bind('category400',['readState1c','readFlagB4','readActor110','readActorSlot2c','readRecordIdentity','readGlobalAa4Actor8','readShapeAc','readVerticesB0','readId08'])});
 const category800=createNativeCategory800Ray({source:'7FDAC0 with explicit current source bindings',...bind('category800',['resolveOwner7EDA30','readRequesterAA4Actor8','readActorSlot1c4','readSphere34','readVertexCount3c','readVertex3c','readId08','readMode7ECB60','readModeFC','readModeComponent','writeOwnerEntryB62080'])});
 function worldView(world){
  const path=new Set();let count=0;
  function convert(value){
   if(value?.complete!==true||value.treesComplete!==true||!Object.hasOwn(value,'packetTree')||!Array.isArray(value.children)||path.has(value)||++count>10000)throw TypeError('Current complete ray world and world90 order required');
   path.add(value);
   try{
    const children=value.children.map(convert),tree=nativePacketRayTreeView(value.packetTree,snapshot.treeProfile);
    return {get complete(){return value.complete===true&&value.treesComplete===true;},tree,children};
   }finally{path.delete(value);}
  }
  return convert(world);
 }
 const query=createNativeCollisionRayQuery({source:'Current7B5F10 source union and full primitive ports',readCurrent(input){
  const current=readCurrent(input);if(current&&typeof current.then==='function')throw TypeError('Current ray reader must complete synchronously');
  if(current?.qualified!==true||typeof current.managerFlag20!=='boolean')return current;
  snapshot=current;
  // world8 is not needed when worldC hits, and category collections are read
  // only when their source mask is enabled. Unknown data stays unavailable.
  return {qualified:true,get managerFlag20(){return current.managerFlag20;},
   get worldC(){return worldView(current.worldC);},get world8(){return worldView(current.world8);},
   get category400(){return current.category400;},get category800(){return current.category800;},get category8000(){return current.category8000;}};
 },queryWorld204:(world,input)=>queryNativeWorldRay({...input,world,queryTree50:(node,request)=>queryNativeCollisionRayTree(node,{...request,dispatch85:snapshot.dispatch85})}),
 queryCategory400:category400,queryCategory800:category800,queryCategory8000:queryNativeCategory8000Ray});
 return input=>{
  if(running)return refuse('runtime-ray-query-reentered');running=true;
  try{
   // Native output cells are written on a hit. Unknown initial cells are
   // represented explicitly as null and are never read as a fabricated ID.
   const initialized=input?.outputs!==undefined;
   const outputs=initialized?structuredClone(input.outputs):{outputType:null,outputObject:null};
   if(!outputs||!['outputType','outputObject'].every(key=>Object.hasOwn(outputs,key)&&(outputs[key]===null||rawOutput(outputs[key]))))throw TypeError('Explicit uint32 or unknown-null caller ray output cells required');
   const initialOutputsKnown=initialized&&['outputType','outputObject'].every(key=>rawOutput(outputs[key]));
   const result=query({...input,outputs});
   return {...result,...(result.qualified?{initialOutputsKnown,outputs}:{}),nativeReady:false};
  }catch(error){return refuse(error instanceof Error?error.message:String(error));}
  finally{snapshot=null;running=false;}
 };
}
