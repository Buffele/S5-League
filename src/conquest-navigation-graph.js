import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';

const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const pair=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(u32))throw Error('Native area team QWORD required');return [...value];};
const xyz=value=>{if(!Array.isArray(value)||value.length!==3||!value.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Finite native graph XYZ required');return value.map(f);};
const sync=(fn,arg,label)=>{if(typeof fn!=='function')throw Error('Explicit current '+label+' producer required');const result=fn(arg);if(result&&typeof result.then==='function')throw Error('Synchronous '+label+' producer required');return result;};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const CONQUEST_NAVIGATION_GRAPH_SEGMENT=Object.freeze({queryMask:0x4000ff,rawQueryFlag:true,coordinateSpace:'native',nativeEntry:0x7b57a0});
export const CONQUEST_NAVIGATION_GRAPH_MATH_PROFILE=Object.freeze({source:'Explicit static orthogonal SCN/SRT JS53 baseline with float32 stores and unsigned scale magnitudes, including reflected matrices; native D3DX decomposition, reflected scale signs and live evaluated Box parity unverified',nativeReady:false});
const sourcePath='model/background/wave_d_sp.scn',sourceSha='7d8a1ad01b1224c5a19d7a7747b80e0ae9d33a96d51f35e26b36a2532898cd26';

// 71A600 receives the current 71A650 result. Its producer stays explicit;
// no game-manager pointer/room-state default is fabricated by this module.
export function conquestNavigationAreaTeam(rawTeam64,{flipTeams}={}){
 const result=pair(rawTeam64);if(typeof flipTeams!=='boolean')throw Error('Current source71A650 team flip boolean required');
 if(flipTeams&&result[1]===0&&(result[0]===1||result[0]===2))result[0]=3-result[0];return result;
}
export function conquestNavigationDistance3d(first,second){
 first=xyz(first);second=xyz(second);const d=first.map((n,i)=>f(second[i]-n));
 const sum=f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]));return f(Math.sqrt(sum));
}
// Pure A14C20 branch logic. This function alone confers no world/graph receipt;
// the registry below supplies its current owned nodes and visibility owner.
export function conquestNavigationNearestVisibleNodes(nodes,from,{probeSegment}={}){
 from=xyz(from);let selected=null,minimum=3.4028234663852886e38;
 for(const node of nodes){if(node.adjacency.length===0)continue;const distance=conquestNavigationDistance3d(node.position,from);if(!(distance<minimum))continue;
  const receipt=sync(probeSegment,{...CONQUEST_NAVIGATION_GRAPH_SEGMENT,from:[...from],to:[...node.position]},'A165A0(true) graph segment');if(receipt?.qualified!==true||typeof receipt.blocked!=='boolean')throw Error('Qualified native4000FF graph visibility required; unknown is not clear');
  if(!receipt.blocked){minimum=distance;selected=node;}
 }
 return selected;
}
// A150D0 is deliberately preserved, including its local edge cost and its
// expansion-order deque. Parent IDs are stored but never reconstructed here.
// Original x86/sort oracle: graph-routing-20261022/qualify-routing.py.
export function conquestNavigationSearchNodes(nodes,start,end,{previousTarget=null,deque=[]}={}){
 const result=(accepted,targetNode=previousTarget,records=deque,events=[])=>({accepted,targetNode,deque:records.map(record=>({...record})),events});
 if(start===null||end===null)return result(false);
 const valid=node=>Number.isInteger(node?.nodeId)&&nodes[node.nodeId]===node;
 if(!valid(start)||!valid(end))throw Error('Exact source search node identities required');
 if(end===previousTarget)return result(true,end,deque.length?deque:[{nodeId:start.nodeId,parentId:-1,g:0,h:0,total:0}]);
 const open=[{nodeId:start.nodeId,parentId:start.nodeId,g:0,h:0,total:0}],closed=[],events=[];let found=false;
 while(open.length&&!found){
  const current=open.shift();closed.unshift(current);events.push({kind:'expand',record:{...current}});
  const node=nodes[current.nodeId];
  for(const nodeId of node.adjacency){
   const neighbor=nodes[nodeId];if(!valid(neighbor))throw Error('Actual source adjacency node required');
   const g=conquestNavigationDistance3d(neighbor.position,node.position),h=conquestNavigationDistance3d(neighbor.position,end.position),record={nodeId,parentId:current.nodeId,g,h,total:f(g+h)};
   if(closed.some(item=>item.nodeId===nodeId)){events.push({kind:'closedSkip',nodeId});continue;}
   const previous=open.findIndex(item=>item.nodeId===nodeId);
   if(previous!==-1){if(!(open[previous].g>g))continue;open.splice(previous,1);events.push({kind:'replaceOpen',nodeId});}
   open.push(record);
   if(neighbor===end){found=true;closed.unshift(record);events.push({kind:'discoverGoal',record:{...record}});}
  }
  // Native A16F70/A16C60 stable ascending merge: only strict > moves a
  // right-hand item before the left item; equal totals retain insertion order.
  open.sort((a,b)=>a.total>b.total?1:a.total<b.total?-1:0);
 }
 return result(found,end,found?closed.reverse():[],events);
}
function evaluatedBox(node){
 if(node.type!=='Box'||node.parent!==''||node.matrix?.length!==16||node.serializedVectors?.length!==4)throw Error('Complete root source Box fields required');
 const m=node.matrix;if(!m.every(Number.isFinite)||m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1)throw Error('Finite affine source Box matrix required');
 if(JSON.stringify(node.serializedVectors.slice(0,3))!==JSON.stringify([[1,0,0],[0,1,0],[0,0,1]]))throw Error('This explicit source Box profile requires authored identity axes');
 const columns=[m.slice(0,3),m.slice(4,7),m.slice(8,11)],scale=columns.map(axis=>f(Math.hypot(...axis)));
 if(scale.some(n=>!Number.isFinite(n)||n<=0))throw Error('Nondegenerate source Box scale required');
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(Math.abs(columns[a].reduce((sum,v,i)=>sum+v*columns[b][i],0)/(scale[a]*scale[b]))>1e-5)throw Error('Orthogonal ordinary-static source Box required');
 // 11C1990 resets serialized center to zero, then11992B0 transforms it
 // by world matrix and multiplies extents componentwise by SRT scale.
 return {position:xyz(m.slice(12,15)),extents:xyz(node.serializedVectors[3]).map((n,i)=>f(n*scale[i]))};
}
const providerOwners=new WeakMap(),graphOwners=new WeakMap(),nodeOwners=new WeakMap();
// Retain the authored values once. Checking them must still notice edits made
// inside a callback; recreating a JSON copy of104 nodes at every check is not
// part of the source query. Identity/length checks also revoke replacement.
function retainGraphValue(value){
 if(value===null||typeof value!=='object')return ()=>true;
 if(Array.isArray(value)){
  const values=[...value],children=values.map(v=>v&&typeof v==='object'?retainGraphValue(v):null);
  return ()=>{if(value.length!==values.length)return false;for(let i=0;i<values.length;i++)if(!Object.is(value[i],values[i])||children[i]&&!children[i]())return false;return true;};
 }
 const keys=Object.keys(value),values=keys.map(key=>value[key]),children=values.map(v=>v&&typeof v==='object'?retainGraphValue(v):null);
 return ()=>{
  if(Object.keys(value).length!==keys.length)return false;
  for(let i=0;i<keys.length;i++)if(!Object.is(value[keys[i]],values[i])||children[i]&&!children[i]())return false;
  return true;
 };
}
export function auditConquestNavigationGraphRegistry(registry,{world}={}){const entry=providerOwners.get(registry);if(!entry||entry.world!==world)throw Error('Prepared current map46 graph registry required');return entry.audit();}
export function assertConquestNavigationGraphRegistry(registry,expected={}){if(!auditConquestNavigationGraphRegistry(registry,expected))throw Error('Prepared current map46 graph registry required');return registry;}
export function assertConquestNavigationGraphOwnership(registry,graph){if(!providerOwners.has(registry)||graphOwners.get(graph)!==registry)throw Error('Native A14DC0 graph lookup/search unresolved: current owned graph registry required');registry.readNode(graph,0);return registry;}

export function createConquestNavigationGraphRegistry({world,revision,mathProfile,readAreaTeam64}={}){
 let phase='idle',bundle=null,source=null,sourceCurrent=null,descriptors=null,owners=[],lastReason=null;
 const live=()=>{try{return phase==='prepared'&&world.nativeMapId===46&&world.sourceData===bundle&&bundle.scenes.includes(source)&&(hasSealedConquestStaticSource(world,bundle)||sourceCurrent())&&world.nativeCollisionSources.length===descriptors.length&&descriptors.every((d,i)=>world.nativeCollisionSources[i]===d&&sync(d.active,undefined,'map source active')===true);}catch{return false;}};
 const requireLive=()=>{if(!live()){phase='revoked';lastReason='Current map46 graph source owner revoked';throw Error(lastReason);}};
 const audit=()=>{if(phase==='prepared'&&!live()){phase='revoked';lastReason='Current graph source owner revoked';}return phase==='prepared';};
 function findOwner(group,team){
  requireLive();team=pair(team);
  // 6F54F0 iterates current area registry order, compares full returned team
  // before raw group80, and returns the first matching actual source owner.
  for(const owner of owners){
   const receipt=sync(readAreaTeam64,{world,revision,owner,rawTeam64:[...owner.rawTeam64]},'area virtual40 team');requireLive();
   if(receipt?.qualified!==true)throw Error('Current source area virtual40 team receipt required');
   const value=pair(receipt.team64);if(value[0]===team[0]&&value[1]===team[1]&&owner.group320===group)return owner;
  }
  return null;
 }
 const api={
  prepare(){
   if(phase==='prepared'){try{requireLive();}catch{}return api.snapshot();}if(phase!=='idle')return api.snapshot();
   try{
    if(world?.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||!Array.isArray(world.nativeCollisionSources)||mathProfile!==CONQUEST_NAVIGATION_GRAPH_MATH_PROFILE||!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0)||typeof readAreaTeam64!=='function')throw Error('Actual map46 owner, explicit graph math profile, generation and team producer required');
    bundle=world.sourceData;source=bundle.scenes?.find(s=>s.source===sourcePath);
    const proof=bundle.sources?.find(s=>s.path===sourcePath);
    if(!source||proof?.sha256!==sourceSha||proof.sourceNodes!==104||source.nodes.length!==104||JSON.stringify(source.root?.matrix)!==JSON.stringify([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]))throw Error('Complete authenticated map46 spawn/waypoint scene required');
    descriptors=[...world.nativeCollisionSources];if(descriptors.length!==4||descriptors.some(d=>sync(d.active,undefined,'map source active')!==true))throw Error('Current full map46 scene owners required');
    const boxes=new Map();for(const node of source.nodes){if(boxes.has(node.name))throw Error('Ambiguous source area name');boxes.set(node.name,node);}
    const raw=CONQUEST_RENDER_DATA.waypoints;if(raw.declaredCount!==69||raw.rawRows.length!==69||raw.sha256!=='97d657f190825ee773bacc035858b95ce857e67881da701be23255a73ec64a2b')throw Error('Authenticated69-row waypoint CSV required');
    const templates=raw.rawRows.map((row,id)=>{
     if(row[0]!==id||row.slice(1).some(n=>n!==null&&(!Number.isInteger(n)||n<0||n>=69)))throw Error('Source CSV node order/adjacency differs');
     const box=boxes.get('waypoint_'+String(id).padStart(3,'0')),geometry=box?evaluatedBox(box):{position:[0,0,0],extents:[0,0,0]};
     return freeze({nodeId:id,adjacency:row.slice(1).filter(n=>n!==null),...geometry,boxPresent:!!box});
    });
    if(templates.filter(n=>n.boxPresent).length!==54||templates.some(n=>!n.boxPresent&&n.adjacency.length!==0))throw Error('Expected54 authored Box nodes and15 disconnected constructor-default nodes');
    const spawnByName=new Map(Object.entries(CONQUEST_SOURCE_DATA.spawns).map(([section,fields])=>{const match=/^MONSTER_REGEN_(\d+)$/.exec(section);if(!match)throw Error('Source monster regen section required');return [fields.object_name,{group320:Number(match[1]),fields}];}));
    if(spawnByName.size!==45)throw Error('Complete45 source monster regen sections required');
    for(const node of source.nodes){
     const spawn=spawnByName.get(node.name);if(!spawn)continue;
     if(!node.name.includes('beta_mon_spawn_pos')&&!node.name.includes('blue_mon_spawn_pos'))throw Error('Map46 source beta monster owner selector required');
     const owner={name:node.name,group320:spawn.group320,rawTeam64:[2,0],lists:[[],[],[],[]]};
     for(const [category,prefix] of ['simple','normal','difficult','complete'].entries()){
      for(let index=0;index<1024;index++){
       const path=spawn.fields[prefix+'_waypoint_set_'+String(index).padStart(2,'0')];if(!path)break;
       if(path.toLowerCase()!==raw.path)throw Error('Unknown native source waypoint CSV');
       const graph=freeze({ownerName:owner.name,group320:owner.group320,category,index,nodes:templates.map(node=>freeze({...node}))});owner.lists[category].push(graph);graphOwners.set(graph,api);for(const node of graph.nodes)nodeOwners.set(node,graph);
      }
     }
     if(owner.lists.map(a=>a.length).join(',')!=='1,0,0,1')throw Error('Source map46 simple/complete graph list coverage differs');owners.push(freeze(owner));
    }
    if(owners.length!==45)throw Error('Current source regen owner missing');
    const root=source.root,nodes=source.nodes,rootCurrent=retainGraphValue(root),entries=nodes.map(node=>({node,name:node.name,parent:node.parent,type:node.type,matrix:node.matrix,vectors:node.serializedVectors,matrixCurrent:retainGraphValue(node.matrix),vectorsCurrent:retainGraphValue(node.serializedVectors)}));
    sourceCurrent=()=>{
     if(source.root!==root||source.nodes!==nodes||nodes.length!==entries.length||!rootCurrent())return false;
     for(let i=0;i<entries.length;i++){const e=entries[i],node=nodes[i];if(node!==e.node||node.name!==e.name||node.parent!==e.parent||node.type!==e.type||node.matrix!==e.matrix||node.serializedVectors!==e.vectors||!e.matrixCurrent()||!e.vectorsCurrent())return false;}
     return true;
    };phase='prepared';lastReason=null;
   }catch(error){phase='blocked';lastReason=error.message;owners=[];}
   return api.snapshot();
  },
  resolveGraph({group320,teamSelector64,selector324,selector328,sourceEntry}={}){
   requireLive();if(![group320,selector324,selector328].every(u32)||sourceEntry!==0x6f53a0)throw Error('Exact6F53A0 raw selectors/source entry required');
   const owner=findOwner(group320,teamSelector64);if(!owner)return {qualified:true,graph:null};
   const category=selector324|0;if(category>=4)return {qualified:true,graph:null};if(category<0)throw Error('Negative native graph category branch unresolved');
   const list=owner.lists[category];if(list.length===0)return {qualified:true,graph:null};const index=selector328|0;
   if(index>=list.length)return {qualified:true,graph:null};if(index<0)throw Error('Negative native graph index branch unresolved');
   return {qualified:true,graph:list[index]};
  },
  sampleSingleCategorySpawn({group320,teamSelector64,categoryCandidates,readRand}={}){
   requireLive();if(!u32(group320)||!Array.isArray(categoryCandidates)||categoryCandidates.length!==1||!Number.isInteger(categoryCandidates[0])||categoryCandidates[0]<0||categoryCandidates[0]>2)throw Error('Only qualified single-category source spawn selection supported; multi-category shuffle unresolved');
   const selector324=categoryCandidates[0],owner=findOwner(group320,teamSelector64);let selector328=0xffffffff;
   if(owner&&owner.lists[selector324].length){const random=sync(readRand,{world,revision,sourceEntry:0x71e020,owner,category:selector324},'CRT graph-index rand');requireLive();if(!Number.isInteger(random)||random<0||random>32767)throw Error('Exact current CRT rand sample required');selector328=random%owner.lists[selector324].length;}
   return {group320,selector324,selector328};
  },
  nearestVisible(graph,from,{probeSegment}={}){
   requireLive();if(graphOwners.get(graph)!==api)throw Error('Current owned source graph required');
   const selected=conquestNavigationNearestVisibleNodes(graph.nodes,from,{probeSegment:request=>{const result=sync(probeSegment,request,'current graph visibility');requireLive();return result;}});
   return {qualified:true,node:selected,sourceEntry:0xa14c20};
  },
  readNode(graph,nodeId){
   requireLive();if(graphOwners.get(graph)!==api)throw Error('Current owned source graph required');
   if(!Number.isInteger(nodeId)||nodeId< -0x80000000||nodeId>0x7fffffff)throw Error('Signed source path node ID required');
   return {qualified:true,node:nodeId<0||nodeId>=graph.nodes.length?null:graph.nodes[nodeId],sourceEntry:0xa14b60};
  },
  findPath(graph,from,to,{probeSegment,readCurrentMode,previousTarget=null,deque=[]}={}){
   requireLive();if(graphOwners.get(graph)!==api||previousTarget!==null&&graphOwners.get(nodeOwners.get(previousTarget))!==api)throw Error('Current owned source graph/target required');
   from=xyz(from);to=xyz(to);let start=api.nearestVisible(graph,from,{probeSegment}).node;
   if(start===null){
    const receipt=sync(readCurrentMode,{world,revision,sourceEntry:0xa14dc0,modeEntry:0x4ca260},'source current mode BYTE');requireLive();
    if(receipt?.qualified!==true||!Number.isInteger(receipt.mode)||receipt.mode<0||receipt.mode>255)throw Error('Qualified current mode BYTE required');
    if(receipt.mode===0x0c){let minimum=3.4028234663852886e38;for(const node of graph.nodes){if(!node.adjacency.length)continue;const distance=conquestNavigationDistance3d(node.position,from);if(distance<minimum){minimum=distance;start=node;}}}
   }
   // Even a missing start still performs destination nearest-visible lookup.
   const end=api.nearestVisible(graph,to,{probeSegment}).node,result=conquestNavigationSearchNodes(graph.nodes,start,end,{previousTarget,deque});requireLive();
   return {qualified:true,...result,sourceEntry:0xa14dc0,searchEntry:0xa150d0};
  },
  snapshot(){audit();return {phase,prepared:phase==='prepared',lastReason,ownerCount:owners.length,graphCount:owners.reduce((sum,o)=>sum+o.lists.reduce((n,list)=>n+list.length,0),0),nodesPerGraph:69,authoredBoxes:54,constructorDefaultDisconnectedNodes:15,mathProfile:mathProfile?.source??null,nativeReady:false,nativeEvaluatedBoxesObserved:false,sourceRoutingQualified:true,graphSearchQualified:false};},
  dispose(){if(phase==='disposed')return;phase='disposed';owners=[];lastReason='Graph registry disposed';},
 };
 providerOwners.set(api,{world,audit});return Object.freeze(api);
}
