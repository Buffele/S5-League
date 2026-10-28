// S5 host policy for Azit15 only: source OBB zones, real match health owner,
// and per-actor source F0 launch contexts. No Controller/collision changes.
import {TUNING} from './movement-profile.js';
import {azitActorTriggerBox} from './azit-jump-stations.js';
import {createAzitLimitedAreas} from './azit-limited-areas.js';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';
import {nativeRadarSideSwitch} from './native-radar-visibility.js';

const installed=new WeakMap();
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous Azit session port required');return value;};
const triggerBox=actor=>azitActorTriggerBox(actor.position,{width:.7*2*TUNING.radius,height:TUNING.height});
const controllerBlocked=actor=>!!(actor.nativeActorFrameConfiguration||actor.s5runtimeAnchoringBodyState||actor.s5runtimeShieldBodyState||actor.nativeJumpDiagnosticContext?.enabled);

export function installAzitSessionRuntime(world){
 if(world?.nativeMapId!==15||world.sourceData?.key!=='MAPNAME_AZIT'||typeof world.setSourceLaunchContext!=='function')throw TypeError('Azit source world with launch owner required');
 if(installed.has(world))return installed.get(world);
 const areas=createAzitLimitedAreas(world.sourceData),keys=['azitSession','setAzitSessionContext','advanceAzitSessionTriggers','resetAzitSessionTriggers','dispose'];
 const descriptors=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(world,key)]));
 if([...descriptors.values()].some(d=>d?.configurable===false))throw Error('Configurable Azit session lifecycle ports required');
 const originalDispose=world.dispose;
 let settings=null,disposed=false,generation=0,lastReason='unconfigured',previousActors=new Set();
 const stats={trainingRespawns:0,dmDefeats:0,queries:0,refusals:0},history=[];
 const record=event=>{history.push(Object.freeze({...event}));if(history.length>24)history.shift();};
 const refuse=reason=>{lastReason=reason;stats.refusals++;return [];};
 const enabled=()=>settings!==null&&call(settings.readSimulationEnabled)===true;
 function actors(){
  if(!settings)return [];
  if(settings.mode==='training')return [{id:'local',actor:settings.localActor,avatar:call(settings.getAvatar),health:null}];
  const {combat,match,localActor}=settings,state=match?.state;
  if(state?.mode!=='deathmatch'||combat?.modeState!==state||combat.player!==localActor)return null;
  const bots=combat.bots??[{id:'bot',actor:combat.enemy,health:combat.enemyState,avatar:combat.avatar}];
  const rows=[{id:'local',actor:localActor,health:combat.playerState,avatar:call(settings.getAvatar)},...bots.map(b=>({id:b.id,actor:b.actor,health:b.health,avatar:b.avatar??b.view?.avatar??combat.avatar}))];
  if(new Set(rows.map(r=>r.actor)).size!==rows.length||rows.some(r=>!r.actor||!r.health||!state.players.has(r.id)))return null;
  return rows;
 }
 const current=actor=>actors()?.find(row=>row.actor===actor)??null;
 function launchContext(actor){
  if(!settings||!enabled()||actor?.world!==world)return null;
  const row=current(actor);if(!row)return null;
  if(settings.mode==='deathmatch'&&(settings.match.state.phase!=='playing'||row.health.dead||!settings.match.state.players.get(row.id)?.alive))return null;
  const hp=row.health?.hp;
  if(row.health&&(!Number.isFinite(hp)||hp<=0))return null;
  return {simulationEnabled:true,ordinaryCharacter:true,enabled:true,bodyReady:!!row.avatar,controllerBlocked:controllerBlocked(actor),
   // Free training has no health owner. This existing launch predicate is an
   // explicit S5 alive policy; limited-area training NEVER manufactures HP.
   hp:row.health?hp:100};
 }
 function reset(){
  previousActors.clear();
  world.setSourceLaunchContext(settings?{readActorState:launchContext}:null);
 }
 function configure(next){
  if(disposed)return false;
  settings=null;reset();generation++;lastReason='unconfigured';
  if(next===null)return true;
  if(!next||!['training','deathmatch'].includes(next.mode)){lastReason='unsupported-mode';return false;}
  if(next.localActor?.world!==world||!sync(next.readSimulationEnabled)||!sync(next.getAvatar))throw TypeError('Current Azit local actor and synchronous session readers required');
  if(next.mode==='training'&&!sync(next.respawnTraining))throw TypeError('Explicit free-training respawn policy required');
  if(next.mode==='deathmatch'&&(!next.combat||!next.match||!sync(next.combat.onFall)))throw TypeError('Deathmatch health and environmental defeat owner required');
  settings={...next};if(!actors()){settings=null;throw TypeError('Current Deathmatch participant lifecycle required');}
  lastReason='configured';reset();return true;
 }
 function dmGates(row,index){
  const state=settings.match.state,participant=state.players.get(row.id),team=participant?.team,tag=team==='alpha'?1:team==='beta'?2:null;
  if(tag===null||![1,2].includes(state.half)||!Number.isFinite(row.health.hp))return null;
  // Source rule1 and protected team1/2 producers are proved. Translating the
  // actual S5 half owner to raw1/3 is an explicit host policy, not a capture.
  const swapSceneKeys=nativeRadarSideSwitch({rulePresent:true,ruleCode:1,gameStateCode:2,gameTimeStateCode:state.half===1?1:3});
  return {areaMode:0,gameStateCode:2,rawRuleKind:1,swapSceneKeys,enumeratedPoolTag:tag,actorPoolTeamTag:tag,
   actor3c:false,actor44:!!row.avatar&&!row.health.dead&&participant.alive===true,
   property94:row.health.hp,dispatchHP:row.health.hp,
   // Stable session-local command identity, not a claimed native wire UID.
   // Raw1 has no special UID filter. Never derive UID kind from team tags.
   actorPeer64:String(index+1),damageOwnerId:`azit-s5-session-${generation}:${row.id}`};
 }
 function advance(){
  if(disposed||!settings)return [];
  if(!enabled()){lastReason='simulation-disabled';return [];}
  const rows=actors();if(!rows)return refuse('participant-lifecycle-unqualified');
  const present=new Set(rows.map(r=>r.actor));for(const actor of previousActors)if(!present.has(actor))world.sourceLaunchMotion.releaseActor(actor);previousActors=present;
  if(settings.mode==='training'){
   const row=rows[0];if(row.actor.world!==world||!row.avatar)return refuse('training-actor-unavailable');
   const box=triggerBox(row.actor),area=areas.profiles.find(p=>nativeBoxIntersection(p.box,box).intersects);stats.queries++;
   if(!area){lastReason='outside-source-areas';return [];}
   const before=row.actor.resetSerial;
   call(settings.respawnTraining,row.actor,Object.freeze({type:'s5-free-training-area-respawn',areaId:area.id,sourceSceneIndex:6,sourceNodeIndex:area.sourceNodeIndex,nativeHPClaimed:false}));
   if(row.actor.resetSerial===before)return refuse('training-respawn-owner-did-not-reset');
   world.sourceLaunchMotion.releaseActor(row.actor);stats.trainingRespawns++;lastReason='training-source-area-respawn';record({type:'training-respawn',areaId:area.id,generation});return ['respawn'];
  }
  const state=settings.match.state;
  if(state.phase!=='playing'){for(const row of rows)world.sourceLaunchMotion.releaseActor(row.actor);lastReason='match-not-playing';return [];}
  for(const [index,row]of rows.entries()){
   if(row.actor.world!==world||row.health.dead||!state.players.get(row.id)?.alive){world.sourceLaunchMotion.releaseActor(row.actor);continue;}
   for(const area of areas.profiles){
    // Read membership/life/HP between areas; one death can invalidate the
    // following source volume even when both boxes geometrically overlap.
    const live=current(row.actor);if(!live||live.health!==row.health||live.health.dead||state.phase!=='playing')break;
    const gates=dmGates(live,index);if(!gates){refuse('deathmatch-gates-unqualified');break;}
    const query=areas.query({areaId:area.id,actorBox:triggerBox(row.actor),gates});stats.queries++;
    if(!query.qualified){refuse(query.reason);break;}
    if(query.notifications.length){refuse('unsupported-rule-notification');break;}
    const command=query.damageCommands[0];if(!command)continue;
    // No direct hp write. The existing match owner performs receive/cancel/
    // environmental attribution and the same respawn/death lifecycle as fall.
    const hpBefore=live.health.hp;
    if(!Number.isFinite(hpBefore)||hpBefore<=0||live.health.dead||!command.ordinaryFinitePositive)break;
    call(settings.combat.onFall,row.actor);
    if(live.health.dead&&live.health.hp===0){stats.dmDefeats++;lastReason='deathmatch-source-area-defeat';record({type:'dm-defeat',actorId:row.id,areaId:area.id,half:state.half,hpBefore,generation});world.sourceLaunchMotion.releaseActor(row.actor);}
    else refuse('environmental-defeat-owner-did-not-accept');
    break;
   }
  }
  return [];
 }
 const runtime=Object.freeze({areas,configure,advance,reset,
  snapshot(){return {disposed,configured:settings!==null,mode:settings?.mode??null,generation,lastReason,stats:{...stats},history:history.map(e=>({...e})),
   scope:'Azit S5 training/Deathmatch host policy; exact static source OBB and launch F0',nativeReady:false,nativeExecutableParity:false,sourceMode1Supported:false,
   qualification:{deathmatchRawRule:1,teamTagProducerProved:true,s5HalfMapping:true,commandUIDs:'S5 session-local only',trainingAreaHPManufactured:false}};},
  dispose(){
   if(disposed)return;configure(null);disposed=true;installed.delete(world);
   for(const [key,value]of [['azitSession',runtime],['setAzitSessionContext',configure],['advanceAzitSessionTriggers',advance],['resetAzitSessionTriggers',reset],['dispose',disposeWorld]]){
    if(Object.getOwnPropertyDescriptor(world,key)?.value!==value)continue;const descriptor=descriptors.get(key);if(descriptor)Object.defineProperty(world,key,descriptor);else delete world[key];
   }
  }
 });
 function disposeWorld(...args){runtime.dispose();return typeof originalDispose==='function'?originalDispose.apply(this,args):undefined;}
 try{Object.defineProperties(world,Object.fromEntries([['azitSession',runtime],['setAzitSessionContext',configure],['advanceAzitSessionTriggers',advance],['resetAzitSessionTriggers',reset],['dispose',disposeWorld]].map(([key,value])=>[key,{value,writable:true,configurable:true,enumerable:true}])));}catch(error){runtime.dispose();throw error;}
 installed.set(world,runtime);return runtime;
}
