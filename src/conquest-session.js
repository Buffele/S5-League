import {readAsset} from './scene-assets.js';
import {createConquestWorld} from './conquest-world.js';
import {createConquestMonsterModel} from './conquest-monster-model.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {ConquestBaseGate} from './conquest-base-gate.js';
import {ConquestPawnRuntime} from './conquest-pawn-runtime.js';
import {createConquestBaseVolumeOwner} from './conquest-base-volume.js';
import {createConquestDefenseBaseState} from './conquest-defense-base-state.js';
import {assertConquestPawnDeathEffects} from './conquest-pawn-death-effects.js';
import {assertConquestDeferredActorCleanup,assertConquestActorCleanupTicket} from './conquest-deferred-actor-cleanup.js';
import {assertConquestPawnActorReleaseReceipt} from './conquest-pawn-actor-runtime.js';
import {ConquestWaveSchedule} from './conquest-wave-schedule.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestRetainedBaseCommands} from './conquest-base-volume.js';

const uint32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const requiredProducers=['spawnSamples','allocateActorId','updateAI','updateActorTail','commandPorts','onWaveEvent','collectCleanup'];
const synchronous=(value,label)=>{if(value&&typeof value.then==='function')throw Error(label+' must be synchronous after preparation');return value;};

// Application lifecycle around the recovered components. This is not a new
// native game rule: the caller owns briefing, recall/RNG production, AI clocks,
// state side effects, contacts/recipients and authoritative stage reports.
export class ConquestSession{
 constructor({scene,participants,round,recallSelection,isHost,spawnNode,teamRegistry,producers={},
  assetRoot='/assets/s5runtime/conquest',allowIncompleteTextures=false,
  resources={},world,ownsWorld=false,preparedRounds=[]}={}){
  if(!scene?.isObject3D||typeof spawnNode!=='string'||!spawnNode||typeof teamRegistry?.has!=='function')throw Error('Explicit Conquest scene, player spawn and team registry required');
  if(!Array.isArray(preparedRounds)||preparedRounds.some(value=>!Number.isInteger(value)||value<=round||value>8)||new Set(preparedRounds).size!==preparedRounds.length)throw Error('Distinct future source rounds required');
  this.scene=scene;this.config={participants,round,recallSelection,isHost,spawnNode,teamRegistry,assetRoot,allowIncompleteTextures,preparedRounds:[...preparedRounds]};
  this.producers=producers;
  this.resources={createWorld:createConquestWorld,createModel:createConquestMonsterModel,
   loadModelData:descriptor=>readAsset(assetRoot+'/models/'+descriptor.scene.split('/').at(-1).replace(/\.scn$/,'.json')),...resources};
  if(!['createWorld','createModel','loadModelData'].every(name=>typeof this.resources[name]==='function'))throw Error('Conquest asset resource functions required');
  if(typeof ownsWorld!=='boolean')throw Error('Explicit Conquest world ownership required');
  this.phase='idle';this.blockers=[];this.disposeErrors=[];this.world=world??null;this.ownsWorld=world?ownsWorld:true;this.bridge=null;this.plans=new Map();this.models=new Set();
  this.elapsedMs=0;this.gameTime=null;this.actorSerial=0;this.stepping=false;this.preparePromise=null;
  this.defenseBase=null;this.destroyedBaseCommands=0;this.deathEffects=null;this.actorCleanup=null;this.retiredActors=new Map();
  this.futurePlans=new Map();this.roundActorSerial=0;
 }
 prepare(){
  if(this.phase==='disposed')return Promise.reject(Error('Disposed Conquest session'));
  if(this.preparePromise)return this.preparePromise;
  this.phase='preparing';this.preparePromise=this.prepareResources();return this.preparePromise;
 }
 async prepareResources(){
  try{
   for(const name of requiredProducers)if(typeof this.producers[name]!=='function')this.blockers.push('Missing explicit producer: '+name);
   if(this.blockers.length){this.phase='blocked';return this.snapshot();}
   const {participants,round,recallSelection,isHost,spawnNode,teamRegistry,assetRoot,allowIncompleteTextures}=this.config;
   // Validate briefing/round/recall before allocating graphics resources.
   this.bridge=new ConquestRuntimeBridge({participants,round,recallSelection,isHost});
   const roundPlans=[{round,records:this.bridge.schedule.records,plans:this.plans}];
   for(const futureRound of this.config.preparedRounds){const plans=new Map(),schedule=new ConquestWaveSchedule({rows:CONQUEST_SOURCE_DATA.waveRows,round:futureRound,recallSelection,isHost});this.futurePlans.set(futureRound,plans);roundPlans.push({round:futureRound,records:schedule.records,plans});}
   const records=roundPlans.flatMap(plan=>plan.records);
   for(const record of records)if(isHost&&Number(record.raw.monster_key)){
    const key=Number(record.raw.monster_key),selector=Number(record.raw.team)&255;
    if(!teamRegistry.has(selector===1?1:selector===2?2:0))this.blockers.push('Missing team registry entry for monster '+key);
    if(key===1003){
     if(typeof this.producers.createPawnRuntime!=='function'&&typeof this.producers.pawnPorts!=='function')this.blockers.push('Missing explicit producer: pawnPorts');
     if(typeof this.producers.createPawnRuntime==='function'&&typeof this.producers.releaseActorOwners!=='function')this.blockers.push('Composed Pawn runtime requires releaseActorOwners');
    }
    else if(typeof this.producers.createActorRuntime!=='function')this.blockers.push('Unported monster runtime: '+key);
   }
   this.blockers=[...new Set(this.blockers)];
   if(this.blockers.length){this.phase='blocked';return this.snapshot();}
   const world=this.world??await this.resources.createWorld(this.scene,{assetRoot,allowIncompleteTextures,spawnNode});
   if(this.phase==='disposed'){if(this.ownsWorld)world?.dispose();return this.snapshot();}
   this.world=world;
   if(world?.nativeMapId!==46||!world.group?.isObject3D||!world.collisionSourceWorld||!Array.isArray(world.baseGates)||typeof world.update!=='function'||typeof world.dispose!=='function')throw Error('Actual map46 world, source collision and lifecycle required');
   if(world.unresolvedTextures?.length&&!allowIncompleteTextures)throw Error('Map textures unresolved: '+world.unresolvedTextures.length);
   for(const gate of world.baseGates){if(!(gate instanceof ConquestBaseGate)||this.bridge.baseGates.has(gate.name))throw Error('Actual distinct owned Conquest base gate required');this.bridge.baseGates.set(gate.name,gate);}
   const dataBySource=new Map();
   // Reserve all births in this round, never reuse a live actor's mixer or
   // skeleton. Pool preparation consumes no RNG/jitter or gameplay identity.
   if(isHost)for(const roundPlan of roundPlans)for(const [index,record] of roundPlan.records.entries()){
    const raw=record.raw,key=Number(raw.monster_key);if(!key)continue;
    const descriptor=CONQUEST_RENDER_DATA.monsters[key];if(!descriptor)throw Error('Source monster descriptor unavailable: '+key);
    const count=Number(raw.monster_increase)&255,request={index,round:roundPlan.round,raw:{...raw},spawn:{monsterKey:key,count,recallIndex:recallSelection,spawnIndex:Number(raw['recall'+(recallSelection+1)])&255,team:Number(raw.team)&255}};
    if(!dataBySource.has(descriptor.scene))dataBySource.set(descriptor.scene,await this.resources.loadModelData(descriptor));
    if(this.phase==='disposed')return this.snapshot();
    const data=dataBySource.get(descriptor.scene),models=[];
    const poolSize=Math.fround(Number(descriptor.ability.size_min));
    for(let slot=0;slot<count;slot++){
     const model=await this.resources.createModel(data,{monsterKey:key,size:poolSize});
     if(this.phase==='disposed'){model?.dispose();return this.snapshot();}
     if(model?.source!==descriptor.scene||model.monsterKey!==key||model.nativeSize!==poolSize||!model.group?.isObject3D||typeof model.update!=='function'||typeof model.dispose!=='function'||typeof model.setNativeSize!=='function'||typeof model.warmAnimationActions!=='function'){
      model?.dispose?.();throw Error('Independent actual source monster model required');
     }
     if(this.models.has(model))throw Error('A pooled model cannot own two births');
     this.models.add(model);models.push(model);
     // Bind source clips while the loading screen owns the work. This creates
     // inactive actions only: no pose, clock, RNG or actor birth is advanced.
     model.warmAnimationActions();
    }
    roundPlan.plans.set(index,{request,models,consumed:false});
   }
   if(this.blockers.length){this.releaseResources();this.phase='blocked';}else this.phase='prepared';
  }catch(error){
   if(this.phase!=='disposed'){this.blockers.push(error.message);this.releaseResources();this.phase='blocked';}
  }
  return this.snapshot();
 }
 start({gameTime}={}){
  if(this.phase!=='prepared'||!uint32(gameTime))throw Error('Prepared Conquest session and explicit uint32 game clock required');
  this.gameTime=gameTime;this.phase='running';return this.snapshot();
 }
 enterPreparedRound({round,recallSelection}={}){
  if(this.phase!=='running'||this.stepping||round!==this.config.round+1||!Number.isInteger(recallSelection)||recallSelection<0||recallSelection>3)throw Error('Next consecutive prepared source round outside a frame required');
  const plans=this.futurePlans.get(round);
  if(!plans||this.retiredActors.size||this.bridge.actors.size||this.bridge.aiActors.size||this.bridge.pawnRuntimes.size||[...this.plans.values()].some(plan=>!plan.consumed||plan.models.some(model=>model!==null)))throw Error('Actual complete model finalization and prepared next-round resources required');
  assertConquestRetainedBaseCommands(this.bridge.commands);
  this.bridge.beginRound({round,recallSelection,preserveOwners:true});
  this.plans.clear();for(const [index,plan]of plans){plan.request.spawn.recallIndex=recallSelection;plan.request.spawn.spawnIndex=Number(plan.request.raw['recall'+(recallSelection+1)])&255;this.plans.set(index,plan);}
  this.futurePlans.delete(round);this.config.round=round;this.config.recallSelection=recallSelection;this.roundActorSerial=0;this.phase='prepared';return this.snapshot();
 }
 prepareDefenseBase({revision,hasRegisteredAIResource,readTimeTokenRaw,mirrorEnabled}={}){
  if(this.phase!=='prepared'||this.defenseBase||typeof hasRegisteredAIResource!=='function'||typeof readTimeTokenRaw!=='function'||typeof mirrorEnabled!=='boolean')throw Error('Prepared session and explicit current base-event resource/clock/mirror owners required');
  const volume=createConquestBaseVolumeOwner({world:this.world,revision,monsterActors:this.bridge.actors,hasRegisteredAIResource});
  try{if(!volume.prepare().prepared)throw Error(volume.snapshot().lastReason);const state=createConquestDefenseBaseState({session:this,baseVolumeOwner:volume});this.defenseBase={volume,state,mirrorEnabled,readTimeTokenRaw};return state.snapshot();}
  catch(error){volume.dispose();throw error;}
 }
 prepareDeathEffects({effects,ownsEffects=false,readDeltaMs}={}){
  if(this.phase!=='prepared'||this.deathEffects||typeof ownsEffects!=='boolean'||typeof readDeltaMs!=='function')throw Error('Prepared session and explicit retained Death effects/delta owners required');
  assertConquestPawnDeathEffects(effects,{world:this.world,scene:this.scene});this.deathEffects={effects,ownsEffects,readDeltaMs};return effects.snapshot();
 }
 prepareActorCleanup({owner,ownsOwner=false}={}){
  if(this.phase!=='prepared'||this.actorCleanup||typeof ownsOwner!=='boolean'||typeof this.producers.releaseActorOwners!=='function')throw Error('Prepared session and explicit actor-owner release required');
  assertConquestDeferredActorCleanup(owner,{monsterActors:this.bridge.actors,runtimes:this.bridge.pawnRuntimes});this.actorCleanup={owner,ownsOwner};return owner.snapshot();
 }
 async warm(renderer,camera){
  if(this.phase!=='prepared'||typeof renderer?.compileAsync!=='function'||renderer.initTexture!==undefined&&typeof renderer.initTexture!=='function'||!camera?.isCamera)throw Error('Prepared Conquest session, renderer and camera required');
  // compileAsync prepares programs, but does not upload material textures.
  // Reserve that first-use work behind loading as well, once per texture owner.
  const textures=new Set();
  const prepare=async root=>{
   if(renderer.initTexture)root.traverse(object=>{
    if(this.phase==='disposed')return;
    for(const material of [].concat(object.material??[]))for(const value of Object.values(material)){
     if(value?.isTexture&&!value.isRenderTargetTexture&&!textures.has(value)){
      textures.add(value);renderer.initTexture(value);if(this.phase==='disposed')return;
     }
    }
   });
   if(this.phase!=='disposed')await renderer.compileAsync(root,camera,this.scene);
  };
  if(this.ownsWorld)await prepare(this.world.group);
  for(const model of this.models){if(this.phase==='disposed')return this.snapshot();await prepare(model.group);}
  return this.snapshot();
 }
 context(actor,runtime){return {actor,runtime,world:this.world,bridge:this.bridge,session:this};}
 spawn(request){
  const plan=this.plans.get(request.index);if(!plan||plan.consumed)throw Error('Owned unconsumed prepared birth record required');
  const samples=synchronous(this.producers.spawnSamples({request,session:this}),'Spawn RNG/jitter producer');
  if(!Array.isArray(samples?.statSamples)||!Array.isArray(samples?.jitterSamples)||samples.statSamples.length!==plan.models.length||samples.jitterSamples.length!==plan.models.length)throw Error('Explicit complete spawn samples required for record '+request.index);
  const statSamples=samples.statSamples.map(draws=>[...draws]),jitterSamples=samples.jitterSamples.map(draws=>({...draws}));
  let slot=0;
  const actors=this.bridge.consumeSpawn(request,{statSamples,jitterSamples,actorFactory:input=>{
   const model=plan.models[slot],context={...input,model,slot,request,serial:++this.actorSerial,world:this.world,bridge:this.bridge,session:this};slot++;
   model.setNativeSize(input.nativeStats.size);
   const id=synchronous(this.producers.allocateActorId(context),'Actor identity producer');
   const actor=new ConquestMonsterActor({id,model,nativeStats:input.nativeStats,team:input.team,teamRegistry:this.config.teamRegistry,team1Count:input.team1Count,position:input.location.nativePosition});this.roundActorSerial++;
   return actor;
  }});
  plan.consumed=true;
  // Complete source births already exist in bridge.actors. Parent the WHOLE
  // cohort before binding registries/authority, whose coverage checks must
  // never observe the first model with seven sibling births still unparented.
  for(const actor of actors)this.scene.add(actor.model.group);
  if(this.producers.onActorsCreated)synchronous(this.producers.onActorsCreated({actors:[...actors],request,world:this.world,bridge:this.bridge,session:this}),'Actor cohort registration producer');
  for(const actor of actors){
   if(actor.spawnStats.monsterKey===1003){
    if(this.producers.createPawnRuntime){
     const runtime=synchronous(this.producers.createPawnRuntime(this.context(actor,null)),'Composed Pawn runtime producer');
     if(!(runtime instanceof ConquestPawnRuntime)||runtime.actor!==actor||runtime.disposed||this.bridge.pawnRuntimes.get(actor.id)!==runtime)throw Error('Actual bridge-attached owned Pawn runtime required');
    }else{
     const ports=synchronous(this.producers.pawnPorts(this.context(actor,null)),'Pawn ports producer');
     this.bridge.attachPawnRuntime(actor.id,ports);
    }
   }else{
    const runtime=synchronous(this.producers.createActorRuntime(this.context(actor,null)),'Monster runtime producer');
    if(runtime?.actor!==actor||typeof runtime.tick!=='function'||typeof runtime.dispose!=='function'||!runtime.commandPorts)throw Error('Owned explicit monster state/animation/contact runtime required');
    this.bridge.pawnRuntimes.set(actor.id,runtime);
   }
  }
  return actors;
 }
 queueCommand(source){
  if(this.phase!=='running')throw Error('Running Conquest session required');
  const actor=this.bridge.actors.get(source?.actorId);if(!actor)throw Error('Current owned Conquest command actor required');
  const ports=synchronous(this.producers.commandPorts({...this.context(actor,this.bridge.pawnRuntimes.get(actor.id)),source}),'Command ports producer');
  return this.bridge.queueAICommand(source,ports);
 }
 step(deltaMs,{gameTime}={}){
  if(this.phase!=='running'||this.stepping)throw Error('Running non-reentrant Conquest session required');
  if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0x7fffffff||!uint32(gameTime))throw Error('Native integer milliseconds and explicit uint32 game clock required');
  this.stepping=true;
  try{
   this.gameTime=gameTime;this.elapsedMs+=deltaMs;
   const events=this.bridge.stepNativeClock(deltaMs),born=[];
   for(const request of events){
    synchronous(this.producers.onWaveEvent({request,world:this.world,bridge:this.bridge,session:this}),'Wave event producer');
    if(request.spawn)born.push(...this.spawn(request));
   }
   // A23F60/A27100 removes Death-command actors from the AI list only.
   // Their state, navigation tail and model remain in the actor collection.
   for(const actor of this.bridge.aiActors.values()){
    const runtime=this.bridge.pawnRuntimes.get(actor.id);
    const commands=synchronous(this.producers.updateAI({...this.context(actor,runtime),deltaMs,gameTime}),'AI/navigation producer');
    if(!Array.isArray(commands))throw Error('Explicit ordered AI command array required');
    for(const source of commands)this.queueCommand(source);
   }
   // This is an application phase order, not an authenticated native frame
   // scheduler. Command manager and per-state internal ordering stay native.
   this.bridge.stepCommands(deltaMs,{gameTime});
   for(const actor of this.bridge.actors.values()){
    this.bridge.stepMonsterStates(actor.id,deltaMs);
    // A06630/A065B0 navigation owns actor-tail goal updates. Updating a
    // goal during GetGoalPosition in the earlier AI phase changes which
    // target/waypoint the source move command observes.
    synchronous(this.producers.updateActorTail({...this.context(actor,this.bridge.pawnRuntimes.get(actor.id)),deltaMs,gameTime}),'Actor-tail navigation producer');
   }
   const cleanup=this.actorCleanup?this.actorCleanup.owner.collect():synchronous(this.producers.collectCleanup({world:this.world,bridge:this.bridge,session:this,deltaMs,gameTime}),'Cleanup producer');
   if(!Array.isArray(cleanup))throw Error('Explicit native cleanup record array required');
   for(const record of cleanup){
    const actor=this.bridge.actors.get(record?.actorId);
    if(!actor||!this.actorCleanup)throw Error('Current owned actor and typed deferred cleanup owner required; a boolean cannot qualify native destruction');
    const owner=this.actorCleanup.owner;assertConquestActorCleanupTicket(record,{owner,actor});
    const runtime=this.bridge.pawnRuntimes.get(actor.id),released=synchronous(this.producers.releaseActorOwners({...this.context(actor,runtime),reason:'source-global-reference-removal',record}),'Actor owner cleanup producer');
    assertConquestPawnActorReleaseReceipt(released?.receipt,{owner:released?.owner,actor,model:actor.model,runtime});
    this.bridge.pawnRuntimes.delete(actor.id);this.bridge.aiActors.delete(actor.id);this.bridge.actors.delete(actor.id);
    const receipt=owner.acknowledgeGlobalRemoval(record);
    // Global-list Release is not a native final destructor. The session still
    // owns this reserved model; preserve that real lease until finalization is
    // independently closed or this session releases its graphics resources.
    // It is no longer an active scene actor. Reaction disposal restores its
    // owned materials, so leaving the reserved graph attached would make the
    // faded monster reappear. Detach without destroying GPU resources.
    actor.model.group.removeFromParent();
    this.retiredActors.set(actor.id,{actor,model:actor.model,receipt,actorOwner:released.owner,releaseReceipt:released.receipt});
   }
   if(this.producers.afterActorCleanup)synchronous(this.producers.afterActorCleanup({session:this,world:this.world,bridge:this.bridge,deltaMs,gameTime}),'Post-cleanup application finalization producer');
   if(this.defenseBase){
    const {volume,state,mirrorEnabled,readTimeTokenRaw}=this.defenseBase;
    // A27900/A11C70 global actor cleanup precedes6F0180 map contacts.
    // Their real pending commands are admitted by the next command pass.
    for(const contact of volume.tick({playing:true,isHost:this.config.isHost,readTimeTokenRaw:request=>synchronous(readTimeTokenRaw({...request,session:this,world:this.world,gameTime}),'Base event timestamp producer')}))if(contact.event)
     volume.enqueueEvent(contact.event,{commandQueue:this.bridge.commands,defenseState:state,mirrorEnabled,onDestroy:()=>{this.destroyedBaseCommands++;}});
   }
   if(this.deathEffects){
    // Source global effects follow actor state/tail and deferred actor-list
    // cleanup. Their scaled delta is a separate producer from actor raw time.
    const {effects,readDeltaMs}=this.deathEffects;assertConquestPawnDeathEffects(effects,{world:this.world,scene:this.scene});
    const effectDelta=synchronous(readDeltaMs({session:this,world:this.world,deltaMs,gameTime}),'Global effect delta producer');
    if(!uint32(effectDelta))throw Error('Explicit unsigned global effect delta required');effects.tick(effectDelta);
   }
   if(this.ownsWorld)this.world.update(deltaMs/1000);
   for(const actor of this.bridge.actors.values()){actor.model.update(deltaMs/1000);if(this.producers.updateActorPresentation)synchronous(this.producers.updateActorPresentation({...this.context(actor,this.bridge.pawnRuntimes.get(actor.id)),deltaMs,gameTime}),'Post-pose actor presentation producer');}
   return {...this.snapshot(),events,born};
  }catch(error){this.phase='faulted';this.blockers.push(error.message);throw error;}
  finally{this.stepping=false;}
 }
 releaseResources(){
  const cleanupError=error=>error instanceof AggregateError?error.message+': '+error.errors.map(cleanupError).join('; '):error.message;
  const attempt=operation=>{try{operation();}catch(error){this.disposeErrors.push(cleanupError(error));}};
  if(this.bridge){
   // Local abort does not run command Exit or manufacture a native cleanup,
   // contact, kill, round completion or server response. Destructors run once.
   const queue=this.bridge.commands,commands=[...queue.active,...queue.pending];queue.active=[];queue.pending=[];queue.mirrored=[];
   for(const command of commands)attempt(()=>command.destroy());
   if(this.producers.releaseActorOwners)for(const actor of this.bridge.actors.values())attempt(()=>synchronous(this.producers.releaseActorOwners({...this.context(actor,this.bridge.pawnRuntimes.get(actor.id)),reason:'session-abort'}),'Actor owner cleanup producer'));
   for(const runtime of this.bridge.pawnRuntimes.values())attempt(()=>runtime.dispose());
   this.bridge.pawnRuntimes.clear();this.bridge.aiActors.clear();this.bridge.actors.clear();this.bridge.playerDamageBindings.clear();
  }
  if(this.deathEffects){if(this.deathEffects.ownsEffects)attempt(()=>this.deathEffects.effects.dispose());this.deathEffects=null;}
  if(this.actorCleanup){if(this.actorCleanup.ownsOwner)attempt(()=>this.actorCleanup.owner.dispose());this.actorCleanup=null;}
  for(const model of this.models)attempt(()=>model.dispose());this.models.clear();this.plans.clear();this.futurePlans.clear();
  this.retiredActors.clear();
  if(this.defenseBase){attempt(()=>this.defenseBase.state.dispose());attempt(()=>this.defenseBase.volume.dispose());this.defenseBase=null;}
  if(this.world){const world=this.world;this.world=null;if(this.ownsWorld)attempt(()=>world.dispose());}
 }
 dispose(){if(this.phase==='disposed')return this.snapshot();this.phase='disposed';this.releaseResources();return this.snapshot();}
 snapshot(){let defense=null;if(this.defenseBase)try{defense=this.defenseBase.state.snapshot();}catch(error){defense={qualified:false,reason:error.message,nativeReady:false};}return {phase:this.phase,round:this.config.round,recallSelection:this.config.recallSelection,elapsedMs:this.elapsedMs,gameTime:this.gameTime,
  actorCount:this.bridge?.actors.size??0,retiredActorCount:this.retiredActors.size,preparedModelCount:this.models.size,preparedWaveCount:this.plans.size,blockers:[...this.blockers],disposeErrors:[...this.disposeErrors],
  unresolvedTextures:this.world?.unresolvedTextures?.length??null,ownsWorld:this.ownsWorld,
  defenseBase:defense,destroyedBaseCommands:this.destroyedBaseCommands,
  nativeReady:false,serverAccepted:false,winner:null,randomStreamQualified:false,applicationFrameOrderQualified:false};}
}
