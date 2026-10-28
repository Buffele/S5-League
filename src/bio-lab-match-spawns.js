import {Vector3} from 'three';
import {TUNING} from './movement-profile.js';
import {COLLISION_SETTINGS,EllipsoidWorld} from './collision.js';
import {verticalFloor,previewClearance} from './native-map-source-geometry.js';

const SOURCE='74c3e4875f32df813dcdb799aa8a8c1a10d210c5b6a0fbcf9c66a885f2da09cc';
const installed=new WeakMap(),axes=['x','y','z'];
const finitePoint=p=>p&&axes.every(axis=>Number.isFinite(p[axis]));
const point=v=>({x:v.x,y:v.y,z:v.z});
const near=(a,b)=>axes.every(axis=>Math.abs(a[axis]-b[axis])<1e-6);
const invalid=message=>{throw TypeError('Unqualified Bio Lab match spawn: '+message);};
const directionFor=marker=>new Vector3(0,0,-1).transformDirection(marker.object.matrixWorld);

// Bio19 only. Marker transforms/floors are source data; cycle, occupancy and
// the Controller-foot projection are explicit S5 local-session policies.
export function installBioLabMatchSpawns(world,contract){
 if(world?.nativeMapId!==19||world.sourceData?.key!=='MAPNAME_BIO_LAB'||world.sourceContract?.nativeMapId!==19)invalid('Bio Lab19 source world required');
 if(installed.has(world))return installed.get(world);
 if(contract?.schema!=='bio-lab-source-behavior-compact-v1'||contract.sourceSha256!==SOURCE)invalid('authenticated source behavior contract required');
 const variant=contract.spawnsByVariant?.find(row=>row.nativeId===19),rows=variant?.spawns;
 if(!Array.isArray(rows)||rows.length!==6||!Array.isArray(world.markers)||!Array.isArray(world.queryTriangleRecords))invalid('six source markers and exact query records required');
 const solver=new EllipsoidWorld({triangles:world.triangles,colliders:[]},{x:TUNING.radius,y:TUNING.height/2,z:TUNING.radius});
 const profiles=rows.map(row=>{
  const group=row.name?.match(/^(alpha|beta)_spawn_pos_\d+$/)?.[1];
  const marker=world.markers.find(m=>m.source===row.source&&m.nodeIndex===row.sourceNodeIndex&&m.name===row.name&&m.type==='Box');
  if(!group||!marker||row.stable!==true||row.sharedSourceClearance?.passed!==true||!finitePoint(row.rawWorldPosition)||!Array.isArray(row.rawWorldDirection)||row.rawWorldDirection.length!==3||!row.rawWorldDirection.every(Number.isFinite))invalid('marker identity or historical placement proof');
  const node=world.sourceData.scenes[marker.sourceSceneIndex]?.nodes[marker.nodeIndex];
  if(!node||JSON.stringify(node.matrix)!==JSON.stringify(row.rawLocalMatrix))invalid('raw marker affine changed');
  marker.object.updateWorldMatrix(true,false);
  const raw=marker.object.getWorldPosition(new Vector3()),direction=directionFor(marker),auditedDirection=new Vector3(...row.rawWorldDirection);
  if(!near(raw,row.rawWorldPosition)||direction.distanceTo(auditedDirection)>1e-7||Math.hypot(direction.x,direction.z)<1e-8)invalid('world marker pose or source minus-Box-Z facing changed');
  const floor=verticalFloor(raw,world.queryTriangleRecords),expected=row.sourceFloor?.sourceFace;
  if(!floor||!expected||floor.record.source!==expected.source||floor.record.sourceModelIndex!==expected.sourceModelIndex||floor.record.triangleIndex!==expected.triangleIndex||!near(floor.point,row.sourceFloor.point))invalid('downward source floor changed');
  const projected={...floor.point,y:floor.point.y+COLLISION_SETTINGS.snapBase},clearance=previewClearance(projected,world.queryTriangleRecords),center={...projected,y:projected.y+TUNING.height/2};
  const landing=solver.move(center,{x:0,y:-COLLISION_SETTINGS.snapBase*2,z:0},{stopOnGround:true});
  const projectedQualified=clearance.passed&&!landing.exhausted&&landing.contacts.some(contact=>contact.groundSupport);
  // A failed conservative projection keeps the exact, separately qualified
  // raw marker. It never shifts X/Z or creates a substitute spawn surface.
  return Object.freeze({marker,group,name:row.name,sourceNodeIndex:marker.nodeIndex,sourceSceneIndex:marker.sourceSceneIndex,source:marker.source,
   sourcePosition:Object.freeze(point(raw)),direction:Object.freeze(point(direction)),position:Object.freeze(projectedQualified?projected:point(raw)),
   grounded:projectedQualified,placement:projectedQualified?'s5-foot-on-authenticated-source-floor':'exact-source-marker',
   floor:Object.freeze({source:floor.record.source,sourceSceneIndex:floor.record.sourceSceneIndex,sourceModelIndex:floor.record.sourceModelIndex,sourceNodeIndex:floor.record.sourceNodeIndex,triangleIndex:floor.record.triangleIndex,point:Object.freeze({...floor.point})}),
   projection:Object.freeze({qualified:projectedQualified,clearance:Object.freeze({...clearance}),groundSupportObserved:landing.contacts.some(contact=>contact.groundSupport),historicalSettledPosition:Object.freeze({...row.settledPosition})})});
 });
 const pools=Object.fromEntries(['alpha','beta'].map(team=>[team,profiles.filter(p=>p.group===team).sort((a,b)=>a.sourceNodeIndex-b.sourceNodeIndex)]));
 if(Object.values(pools).some(pool=>pool.length!==3))invalid('three source markers per group required');
 const ports=['bioLabMatchSpawns','spawnForMatch','clearMatchSpawns','dispose'],descriptors=new Map(ports.map(k=>[k,Object.getOwnPropertyDescriptor(world,k)]));
 if([...descriptors.values()].some(d=>d?.configurable===false))invalid('configurable lifecycle ports required');
 const originalDefaults=new Map(['spawn','previewFacing','sessionSpawnSelection'].map(k=>[k,Object.getOwnPropertyDescriptor(world,k)]));
 if([...originalDefaults.values()].some(d=>d?.configurable===false))invalid('configurable preview defaults required');
 const originalDispose=world.dispose,cursors={alpha:0,beta:0},history=[];let disposed=false,defaultSelection=null,generation=0;
 const restoreDefault=()=>{if(!defaultSelection)return;for(const [key,descriptor]of originalDefaults){if(descriptor)Object.defineProperty(world,key,descriptor);else delete world[key];}defaultSelection=null;};
 function clear(reason='clear-match-spawns'){
  if(disposed)return false;restoreDefault();cursors.alpha=0;cursors.beta=0;generation++;history.push({type:'clear',reason,generation});if(history.length>24)history.shift();return true;
 }
 function select({mode,team,participantIndex=0,participantId=participantIndex===0?'local':`participant-${participantIndex}`,occupied=[],setDefault=false}={}){
  if(disposed||mode!=='deathmatch')return null;
  if(!Object.hasOwn(pools,team)||!Number.isInteger(participantIndex)||participantIndex<0||participantIndex>64||typeof participantId!=='string'||!participantId||!Array.isArray(occupied)||typeof setDefault!=='boolean'||setDefault&&participantId!=='local')invalid('explicit local Deathmatch participant/team request');
  const occupants=occupied.map(entry=>entry?.position??entry);if(!occupants.every(finitePoint))invalid('finite occupancy positions');
  for(const profile of profiles){profile.marker.object.updateWorldMatrix(true,false);if(!near(profile.marker.object.getWorldPosition(new Vector3()),profile.sourcePosition)||directionFor(profile.marker).distanceTo(new Vector3(...axes.map(axis=>profile.direction[axis])))>1e-7)invalid('source marker moved after installation');}
  const pool=pools[team],start=cursors[team],candidates=Array.from({length:pool.length},(_,offset)=>{
   const index=(start+offset)%pool.length,profile=pool[index];let clearance=Infinity;
   for(const position of occupants)if(Math.abs(position.y-profile.position.y)<TUNING.height)clearance=Math.min(clearance,Math.hypot(position.x-profile.position.x,position.z-profile.position.z)-TUNING.radius*2);
   return {index,profile,clearance,offset};
  });
  const candidate=candidates.find(c=>c.clearance>=0)??[...candidates].sort((a,b)=>b.clearance-a.clearance||a.offset-b.offset)[0];
  const p=candidate.profile;cursors[team]=(candidate.index+1)%pool.length;
  const result={qualified:true,mode,team,participantId,participantIndex,markerName:p.name,source:p.source,sourceSceneIndex:p.sourceSceneIndex,sourceNodeIndex:p.sourceNodeIndex,
   position:{...p.position},direction:{...p.direction},facing:Math.atan2(p.direction.x,p.direction.z),sourcePosition:{...p.sourcePosition},placement:p.placement,grounded:p.grounded,
   sourceFloor:{...p.floor,point:{...p.floor.point}},sourceMinusBoxZVerified:true,nativeMarkerPoseVerified:true,nativeNetworkAllocationVerified:false,
   occupancy:{unoccupied:candidate.clearance>=0,minimumHorizontalBodyGap:Number.isFinite(candidate.clearance)?candidate.clearance:null,allMarkersOccupied:candidates.every(c=>c.clearance<0)},
   policy:'S5 deterministic source-group cycle with current live-body occupancy preference; no jitter or invented fallback point. Team labels select source groups only; no unproved native halftime swap.'};
  if(setDefault){defaultSelection=result;world.spawn={...result.position};world.previewFacing=result.facing;world.sessionSpawnSelection={mode,kind:'bio-lab-local-deathmatch-source-marker',markerName:p.name,placement:p.placement,nativeNetworkAllocationVerified:false};}
  history.push({type:'selection',markerName:p.name,participantId,team,placement:p.placement,allMarkersOccupied:result.occupancy.allMarkersOccupied,generation});if(history.length>24)history.shift();return result;
 }
 const runtime=Object.freeze({select,clear,
  snapshot(){return {disposed,generation,configured:!!defaultSelection,selectedLocalMarker:defaultSelection?.markerName??null,sourceSha256:SOURCE,pools:Object.fromEntries(Object.entries(pools).map(([team,pool])=>[team,pool.map(p=>({name:p.name,sourceSceneIndex:p.sourceSceneIndex,sourceNodeIndex:p.sourceNodeIndex,sourcePosition:{...p.sourcePosition},position:{...p.position},direction:{...p.direction},placement:p.placement,grounded:p.grounded,sourceFloor:{...p.floor,point:{...p.floor.point}},projection:{qualified:p.projection.qualified,clearance:{...p.projection.clearance},groundSupportObserved:p.projection.groundSupportObserved}}))])),cursors:{...cursors},history:history.map(e=>({...e})),nativeReady:false,nativeNetworkAllocationVerified:false};},
  dispose(){if(disposed)return;clear('dispose');disposed=true;installed.delete(world);for(const [key,value]of [['bioLabMatchSpawns',runtime],['spawnForMatch',select],['clearMatchSpawns',clear],['dispose',disposeWorld]]){if(Object.getOwnPropertyDescriptor(world,key)?.value!==value)continue;const descriptor=descriptors.get(key);if(descriptor)Object.defineProperty(world,key,descriptor);else delete world[key];}}
 });
 function disposeWorld(...args){runtime.dispose();return originalDispose?.apply(this,args);}
 try{Object.defineProperties(world,Object.fromEntries([['bioLabMatchSpawns',runtime],['spawnForMatch',select],['clearMatchSpawns',clear],['dispose',disposeWorld]].map(([key,value])=>[key,{value,writable:true,configurable:true,enumerable:true}])));}catch(error){runtime.dispose();throw error;}
 installed.set(world,runtime);return runtime;
}
