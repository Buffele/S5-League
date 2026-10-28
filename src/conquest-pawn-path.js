import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestPawnMovementSourceActor} from './conquest-pawn-physics-properties.js';
import {assertConquestNavigationGraphOwnership,CONQUEST_NAVIGATION_GRAPH_SEGMENT} from './conquest-navigation-graph.js';
const f=Math.fround,u32=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff,zero=()=>({x:0,y:0,z:0});
const vector=value=>{if(!['x','y','z'].every(k=>Number.isFinite(value?.[k])&&Number.isFinite(f(value[k]))))throw Error('Finite native path vector required');return {x:f(value.x),y:f(value.y),z:f(value.z)};};
const array=value=>[value.x,value.y,value.z],point=value=>({x:value[0],y:value[1],z:value[2]}),fresh=()=>({nodeId:-1,parentId:-1,g:0,h:0,total:0});
const horizontalDistance=(a,b)=>{const x=f(b.x-a.x),z=f(b.z-a.z);return f(Math.sqrt(f(f(x*x)+f(z*z))));};

// Native actor2D8 path-state owner. A14DC0/A150D0 and nonfresh A15CF0/
// A161F0 are backed by the isolated original x86 routing/consumption oracle.
export class ConquestPawnPath{
 #graph=null;#deque=[];#destination=zero();#target=null;#current={nodeId:-1,parentId:-1,g:0,h:0,total:0};#goal=zero();#selectors=[0xffffffff,0xffffffff,0xffffffff];#factoryGraphApplied=false;
 constructor({actor,monsterActors,resolveGraph,findPathFromActor,graphRegistry,probeSegment,readCurrentMode,readRangeFloat}={}){
  if(!(actor instanceof ConquestMonsterActor)||!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor)throw Error('Current owned actual Pawn path state required');
  assertConquestPawnMovementSourceActor(actor);
  this.actor=actor;this.monsterActors=monsterActors;this.resolveGraph=resolveGraph;this.findPathFromActor=findPathFromActor;this.disposed=false;this.fault=null;
  this.graphRegistry=graphRegistry;this.probeSegment=probeSegment;this.readCurrentMode=readCurrentMode;this.readRangeFloat=readRangeFloat;
  // Ctor default50 is overwritten in native Create by actor.virtual68.
  this.width=f(actor.width);this.randomize=!Number(CONQUEST_SOURCE_DATA.monsters[actor.spawnStats.monsterKey].Ability.moveToWpCenter);
  this.navigationPorts=Object.freeze({readCollisionGroup320:owner=>{this.assertActor(owner);this.assertFactoryGraph();return this.#selectors[0];}});
  this.pathPorts=Object.freeze({
   nextWaypoint:(owner,{from})=>{this.assertActor(owner);return this.nextWaypoint(from).point;},
   findAirPath:(owner,{from,to})=>{this.assertActor(owner);return this.findAirPath(from,to);},
   findGroundedPath:(owner,{from,to})=>{this.assertActor(owner);return this.findGroundedPath(from,to);},
   onPathFailure:(owner,{rawGroup320,rawInput,rawFlag})=>{this.assertActor(owner);return this.selectGraph(rawGroup320,rawInput,rawFlag);},
   leavePursuitRepath:owner=>{this.assertActor(owner);const destination={...this.#destination};this.reset();return this.call(this.findPathFromActor,[zero(),destination],'source actor FindPath A04460');},
   leavePursuitAnchor:owner=>{this.assertActor(owner);return this.adjustAnchor(zero(),this.actor.positionNative);},
  });
 }
 assertLive(){if(this.disposed||this.fault||this.monsterActors.get(this.actor.id)!==this.actor)throw Error('Live owned native path state required'+(this.fault?': '+this.fault:''));}
 assertActor(owner){this.assertLive();if(owner!==this.actor)throw Error('Path state belongs to another actor');}
 assertFactoryGraph(){if(!this.#factoryGraphApplied)throw Error('Native factory A0A7C0 graph selection unresolved; constructor null is not a post-spawn graph receipt');}
 call(fn,args,label){this.assertLive();try{if(typeof fn!=='function')throw Error('Native path producer unresolved: '+label);const result=fn(...args);if(result&&typeof result.then==='function')throw Error('Synchronous native path producer required: '+label);this.assertLive();return result;}catch(error){this.fault=error.message;throw error;}}
 assertGraph(){return assertConquestNavigationGraphOwnership(this.graphRegistry,this.#graph);}
 node(nodeId){this.assertGraph();return this.graphRegistry.readNode(this.#graph,nodeId).node;}
 visible(from,to){
  this.assertGraph();const receipt=this.call(this.probeSegment,[{...CONQUEST_NAVIGATION_GRAPH_SEGMENT,from:array(from),to:array(to)}],'A165A0(true) graph visibility');this.assertGraph();
  if(receipt?.qualified!==true||typeof receipt.blocked!=='boolean')throw Error('Qualified current native4000FF visibility required; unknown is not clear');return !receipt.blocked;
 }
 jitter(extent){
  const maximum=f(extent*f(0.8)),minimum=f(-extent*f(0.8));this.assertGraph();
  const receipt=this.call(this.readRangeFloat,[{actor:this.actor,minimum,maximum,sourceEntry:0x549e70}],'source ranged waypoint jitter');this.assertGraph();
  if(receipt?.qualified!==true||!Number.isFinite(receipt.value)||f(receipt.value)!==receipt.value||receipt.value<minimum||receipt.value>maximum)throw Error('Qualified current source549E70 float range sample required');
  // A160EA..A160F5 retains divide/multiply even though it cancels in reals.
  const result=f(f(receipt.value/this.width)*this.width);if(!Number.isFinite(result))throw Error('Native path width/jitter nonfinite branch unresolved');return result;
 }
 nextWaypoint(from){
  this.assertLive();from=vector(from);if(this.#graph!==null&&this.graphRegistry)this.assertGraph();
  // A15CF0 copies from into caller output before testing deque/current IDs.
  if(this.#deque.length===0){
   if(this.#current.nodeId===-1)return {point:from,accepted:false,sourceEntry:0xa15cf0};
   if(horizontalDistance(from,this.#goal)<200)this.#current=fresh();
   return {point:{...this.#goal},accepted:true,sourceEntry:0xa15cf0};
  }
  const record=this.#deque[0],node=this.node(record.nodeId);if(node===null)return {point:from,accepted:false,sourceEntry:0xa15cf0};
  if(this.#current.nodeId!==-1){
   if(horizontalDistance(from,this.#goal)<200){this.#deque.shift();this.#current=fresh();}
  }else if(this.#current.nodeId!==record.nodeId){
   // Four candidate samples, only the first three require a visibility probe.
   for(let attempt=0;attempt<4;attempt++){
    this.#goal=point(node.position);
    if(this.randomize){this.#goal.x=f(this.#goal.x+this.jitter(node.extents[0]));this.#goal.z=f(this.#goal.z+this.jitter(node.extents[2]));}
    if(attempt===3||this.visible(from,this.#goal))break;
   }
   this.#current={...record};
  }
  return {point:{...this.#goal},accepted:true,sourceEntry:0xa15cf0};
 }
 findAirPath(from,to){
  this.assertLive();from=vector(from);to=vector(to);this.assertFactoryGraph();if(this.#graph===null)return false;
  const registry=this.assertGraph(),receipt=this.call(()=>registry.findPath(this.#graph,array(from),array(to),{probeSegment:request=>this.call(this.probeSegment,[request],'current source graph visibility'),readCurrentMode:request=>this.call(this.readCurrentMode,[request],'current source mode BYTE'),previousTarget:this.#target,deque:this.#deque}),[],'A14DC0/A150D0 current graph routing');
  this.#target=receipt.targetNode;this.#deque=receipt.deque;return receipt.accepted;
 }
 findGroundedPath(from,to){
  this.assertLive();from=vector(from);to=vector(to);if(this.#graph!==null&&this.graphRegistry)this.assertGraph();
  if(this.#deque.length!==0&&['x','y','z'].every(k=>this.#destination[k]===to[k]))return true;
  if(!this.findAirPath(from,to))return false;
  this.#destination=to;this.adjustAnchor(zero(),from);return true;
 }
 adjustAnchor(_unused,from){
  this.assertLive();from=vector(from);if(this.#deque.length===0)return false;let last=0;
  for(let index=1;index<this.#deque.length;index++){
   const node=this.node(this.#deque[index].nodeId);if(node===null)return false;
   if(!this.visible(from,point(node.position)))break;last=index;
  }
  if(last===0)return false;this.#current=fresh();this.#deque.splice(0,last);return true;
 }
 reset(){
  this.assertLive();this.#destination=zero();this.#goal=zero();this.#target=null;this.#current={nodeId:-1,parentId:-1,g:0,h:0,total:0};this.#deque=[];
  // A164E0 preserves graph0, width48 and randomize4C.
 }
 selectGraph(group320,selector324,selector328){
  this.assertLive();const selectors=[group320,selector324,selector328];if(!selectors.every(u32))throw Error('Three raw native graph selector DWORDs required');
  if(selectors.every((v,i)=>v===this.#selectors[i]))return {changed:false,graphBound:this.#graph!==null};
  // Source A043A0 writes selectors before querying6F53A0 with team BYTE
  // zero-extended to a QWORD. A missing producer faults instead of silently
  // manufacturing an absent graph for a real map.
  this.#selectors=selectors;
  const receipt=this.call(this.resolveGraph,[{actor:this.actor,group320,teamSelector64:[this.actor.teamSelector,0],selector324,selector328,sourceEntry:0x6f53a0}],'6F53A0 graph resource lookup');
  if(receipt?.qualified!==true||!Object.hasOwn(receipt,'graph')||receipt.graph!==null&&typeof receipt.graph!=='object'){this.fault='Current native graph resource receipt required';throw Error(this.fault);}
  this.#graph=receipt.graph;return {changed:true,graphBound:this.#graph!==null};
 }
 initializeFactoryGraph({group320,selector324,selector328}={}){
  this.assertLive();if(this.#factoryGraphApplied)throw Error('Native factory graph selection already applied');
  // A0AD4C..A0AD5B applies command58/5C/60 once, before initial state.
  // The producer of these selectors is external, never inferred from the
  // candidate list or constructor defaults. A043A0 still skips equal triples.
  const result=this.selectGraph(group320,selector324,selector328);this.#factoryGraphApplied=true;return result;
 }
 snapshot(){return {actorId:this.actor.id,graphBound:this.#graph!==null,factoryGraphApplied:this.#factoryGraphApplied,dequeCount:this.#deque.length,deque:this.#deque.map(record=>({...record})),destination:{...this.#destination},targetNodePresent:this.#target!==null,current:{...this.#current},currentGoal:{...this.#goal},selectors:[...this.#selectors],width:this.width,randomize:this.randomize,disposed:this.disposed,fault:this.fault,freshDequeBranchQualified:true,sourceRoutingQualified:true,graphSearchQualified:false,nativeReady:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.#deque=[];this.#graph=null;this.resolveGraph=null;this.findPathFromActor=null;this.graphRegistry=null;this.probeSegment=null;this.readCurrentMode=null;this.readRangeFloat=null;}
}
