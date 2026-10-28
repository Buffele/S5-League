import {ConquestBaseGate} from './conquest-base-gate.js';
import {ConquestPawnActorAuthority,readConquestPawnActorAuthorityDisposed} from './conquest-pawn-actor-authority.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';

const f=Math.fround,owners=new WeakMap();
const vector=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error('Finite native map area XYZ required');return v.map(f);};
const name=v=>{if(typeof v!=='string'||v.length>511||/[^\x20-\x7e]/.test(v))throw Error('Bounded ASCII native area name required');return v;};
const object=v=>Object.fromEntries(['x','y','z'].map((key,i)=>[key,v[i]]));
const zero=()=>({x:0,y:0,z:0});
export const CONQUEST_PAWN_MAP_AI_MATH_PROFILE=Object.freeze({source:'Source float32 SSE distance stores with JS Math.sqrt; native CRT/x87 universal bit parity unverified',nativeReady:false});

//6F1EA0 tries six type buckets in this order.6F1F60 lowercases the request
// through714890, then compares names; safe lookup6F5970 uses strcmp directly.
export function conquestMapAIFindArea(buckets,requestedName,{safe=false}={}){
 requestedName=name(requestedName);if(typeof safe!=='boolean'||!Array.isArray(buckets)||buckets.length!==(safe?1:6)||buckets.some(b=>!Array.isArray(b)))throw Error('Complete ordered native area buckets required');
 const key=safe?requestedName:requestedName.toLowerCase();
 for(const bucket of buckets)for(const area of bucket)if(area.name===key)return area;
 return null;
}
//6C3AD0/6C3D20 make two virtual7C calls: Z first, then X. Missing area
// returns zero without asking for an actor position. Y never enters distance.
export function conquestMapAIDistanceXZ(area,readPosition){
 if(area===null)return 0;const target=vector(area.position);
 if(typeof readPosition!=='function')throw Error('Current source actor position getter required');
 const z=readPosition()?.z,x=readPosition()?.x;
 if(![z,x].every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Current finite source actor position required');
 const dz=f(target[2]-f(z)),dx=f(target[0]-f(x));return f(Math.sqrt(f(f(dx*dx)+f(dz*dz))));
}
export function assertConquestPawnMapAI(provider,{world,actorAuthority}={}){
 const entry=owners.get(provider);if(!entry||entry.world!==world||entry.actorAuthority!==actorAuthority)throw Error('Owned source Pawn map AI required');entry.requireLive();return provider;
}
export function auditConquestPawnMapAI(provider,{world,actorAuthority}={}){const entry=owners.get(provider);if(!entry||entry.world!==world||entry.actorAuthority!==actorAuthority)throw Error('Owned source Pawn map AI required');return entry.audit();}

// Map46 has four source scenes and104 Box nodes:45 monster regen,54
// waypoint,4 player spawn and1 safe zone. Player spawn areas are NOT in
// GetAreaPos's six buckets. This source-specific owner supplies real entries,
// not callbacks that report an unknown zone present or a default zero target.
export function createConquestPawnMapAI({world,actorAuthority,revision,mathProfile}={}){
 if(!(actorAuthority instanceof ConquestPawnActorAuthority)||mathProfile!==CONQUEST_PAWN_MAP_AI_MATH_PROFILE||!(typeof revision==='string'&&revision.trim()||Number.isSafeInteger(revision)&&revision>=0))throw Error('Actual actor authority, explicit map AI math profile and generation required');
 let phase='idle',lastReason=null,bundle=null,descriptors=null,sourceNodes=[],buckets=null,safeBuckets=null,gates=null,gateArray=null;
 const revoke=reason=>{phase='revoked';lastReason=reason;throw Error(reason);};
 function requireLive(){
  if(phase!=='prepared')throw Error('Prepared current Pawn map AI required'+(lastReason?': '+lastReason:''));
  if(readConquestPawnActorAuthorityDisposed(actorAuthority)||world.nativeMapId!==46||world.sourceData!==bundle||world.collisionSourceWorld?.active!==true||world.nativeCollisionSources.length!==descriptors.length||descriptors.some((d,i)=>world.nativeCollisionSources[i]!==d||d.active()!==true)||world.baseGates!==gateArray||world.baseGates.length!==gates.length||gates.some((g,i)=>world.baseGates[i]!==g.gate||g.gate.name!==g.name||g.gate.selector!==g.selector||g.gate.obb.center.some((v,j)=>v!==g.position[j])))return revoke('Current Pawn map area/gate owner replaced or disposed');
  if(!hasSealedConquestStaticSource(world,bundle))for(const s of sourceNodes){if(!bundle.scenes.includes(s.source)||s.source.nodes!==s.nodes||s.source.root!==s.root||s.root.matrix!==s.rootMatrix||s.rootMatrix.some((v,i)=>v!==s.rootValues[i])||s.nodes.length!==s.entries.length||s.entries.some((e,i)=>s.nodes[i]!==e.node||e.node.name!==e.name||e.node.type!==e.type||e.node.parent!==e.parent||e.node.matrix!==e.matrix||e.matrix.length!==e.values.length||e.matrix.some((v,j)=>v!==e.values[j])||e.type==='Box'&&Object.keys(e.node.animations??{}).length!==0))return revoke('Current source map area transform or registry changed');}
 }
 function audit(){if(phase==='prepared')try{requireLive();}catch(error){phase='revoked';lastReason=error.message;}return phase==='prepared';}
 function find(requested,safe){requireLive();return conquestMapAIFindArea(safe?safeBuckets:buckets,requested,{safe});}
 function position(requested,safe){const area=find(requested,safe);return area?object(area.position):zero();}
 function distance(actor,requested,safe){const area=find(requested,safe);return conquestMapAIDistanceXZ(area,()=>{requireLive();const p=actorAuthority.position(actor);requireLive();return p;});}
 const bindings=Object.freeze({areaPosition:requested=>position(requested,false),safeAreaPosition:requested=>position(requested,true),safeZoneEnabled:requested=>{
  const area=find(requested,true);if(!area)return false;const gate=area.gate;
  if(!Number.isInteger(gate.health)||gate.health< -0x80000000||gate.health>0x7fffffff)throw Error('Current signed32 source safe-zone health required');return gate.health>0;
 },distanceToArea:(actor,requested)=>distance(actor,requested,false),distanceToSafeArea:(actor,requested)=>distance(actor,requested,true)});
 const api={bindings,
  prepare(){
   if(phase==='prepared'){requireLive();return api.snapshot();}if(phase!=='idle')return api.snapshot();
   try{
    if(world?.nativeMapId!==46||world.sourceData?.schema!=='conquest-native-collision-source-v1'||world.collisionSourceWorld?.active!==true||world.baseGateStaticNameBindingEstablished!==true)throw Error('Actual loaded map46 source and static base-name binding required');
    bundle=world.sourceData;descriptors=[...world.nativeCollisionSources];gateArray=world.baseGates;
    if(bundle.scenes?.length!==4||bundle.sources?.length!==4||descriptors.length!==4||descriptors.some((d,i)=>d.source!==bundle.scenes[i]||d.active()!==true)||!Array.isArray(gateArray)||gateArray.length!==1)throw Error('Complete current map46 source scenes and safe-zone owner required');
    const spawnSource=bundle.scenes.find(s=>s.source==='model/background/wave_d_sp.scn'),proof=bundle.sources.find(s=>s.path===spawnSource?.source);
    if(!spawnSource||proof?.sha256!=='7d8a1ad01b1224c5a19d7a7747b80e0ae9d33a96d51f35e26b36a2532898cd26'||spawnSource.nodes.length!==104)throw Error('Authenticated complete map46 area scene required');
    const regenNames=new Set(Object.values(CONQUEST_SOURCE_DATA.spawns).map(row=>row.object_name));if(regenNames.size!==45)throw Error('Complete source45 monster regen names required');
    buckets=Array.from({length:6},()=>[]);safeBuckets=[[]];let playerSpawns=0;const names=new Set();
    for(const source of bundle.scenes){
     const root=source.root,rootMatrix=root?.matrix;if(JSON.stringify(rootMatrix)!==JSON.stringify([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]))throw Error('Source map46 identity root profile required');
     sourceNodes.push({source,nodes:source.nodes,root,rootMatrix,rootValues:[...rootMatrix],entries:source.nodes.map(node=>({node,name:node.name,type:node.type,parent:node.parent,matrix:node.matrix,values:[...node.matrix]}))});
     for(const node of source.nodes.filter(n=>n.type==='Box')){
      if(source!==spawnSource||node.parent!==''||node.matrix.length!==16||!node.matrix.every(Number.isFinite)||node.matrix[3]!==0||node.matrix[7]!==0||node.matrix[11]!==0||node.matrix[15]!==1||Object.keys(node.animations??{}).length!==0||names.has(node.name))throw Error('Unique ordinary static root source map46 Box area required');names.add(node.name);
      //11C1990 zeros the serialized center;11992B0 transforms that zero by
      // the current root world matrix. Only its translation is consumed here.
      const area=Object.freeze({name:name(node.name),position:Object.freeze(vector(node.matrix.slice(12,15)))});
      if(regenNames.has(area.name))buckets[4].push(area);
      else if(/^waypoint_\d{3}$/.test(area.name))buckets[5].push(area);
      else if(/^alpha_spawn_pos_0[1-4]$/.test(area.name))playerSpawns++;
      else if(area.name==='beta_safezone_00'){
       const gate=gateArray[0];if(!(gate instanceof ConquestBaseGate)||gate.name!==area.name||gate.selector!==2||gate.obb.center.some((v,i)=>v!==area.position[i]))throw Error('Actual source beta safe-zone position/name/health owner required');safeBuckets[0].push(Object.freeze({...area,gate}));
      }else throw Error('Unqualified additional map46 area class '+area.name);
     }
    }
    if(names.size!==104||buckets[4].length!==45||buckets[5].length!==54||playerSpawns!==4||safeBuckets[0].length!==1)throw Error('Complete map46 area-class coverage differs');
    gates=gateArray.map(gate=>({gate,name:gate.name,selector:gate.selector,position:[...gate.obb.center]}));phase='prepared';lastReason=null;
   }catch(error){phase='blocked';lastReason=error.message;}
   return api.snapshot();
  },
  snapshot(){audit();return {phase,prepared:phase==='prepared',lastReason,revision,genericCategoryCounts:buckets?.map(b=>b.length)??null,safeZoneCount:safeBuckets?.[0].length??null,numericProfile:mathProfile.source,nativeReady:false,liveMapAreaCompared:false,baseCollisionVolumeEstablished:false};},
  dispose(){phase='disposed';buckets=null;safeBuckets=null;sourceNodes=[];gates=null;lastReason='Pawn map AI disposed';},
 };
 owners.set(api,{world,actorAuthority,requireLive,audit});return Object.freeze(api);
}
