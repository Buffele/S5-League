// Native state consumer. Source: AF3850 and the SGState vtables,
// AF5FE0 SetTime, AFA480 timers, and state callbacks in native-source.json.
// Perception, head aim, hit resolution, audio/SEQ loading and score are separate.
const uint=value=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Native uint32 milliseconds required');return value;};
const add=(a,b)=>(a+b)>>>0;
const CLIPS=Object.freeze({0:'S1',1:'S4',2:'S5',3:'S2',5:'S3'});
const NAMES=Object.freeze({0:'creation',1:'normal',2:'reload',3:'attack',5:'destruction'});
export function practiceSentryTimedRate(rawChannelTicks,targetMs){
 uint(rawChannelTicks);uint(targetMs);const denominator=add(targetMs,100);
 if(!denominator)throw Error('Native animation denominator is zero');
 const rawMs=Math.trunc(Math.fround(Math.fround(rawChannelTicks)/Math.fround(4.8)))>>>0;
 return Math.fround(Math.fround(rawMs)/Math.fround(denominator));
}
export class PracticeSentryBehavior{
 constructor({profile,bindings}){
  if(!profile||![5,6,7,8].includes(profile.attributeId))throw Error('Authentic Exercise Sentry profile required');
  for(const key of ['attackMs','creationMs','destructionMs','findTargetMs','reloadMs'])uint(profile[key]);
  for(const key of ['searchTarget','hasTarget','clearTarget','updateHead','beginAttack','tickAttack','endAttack'])if(typeof bindings?.[key]!=='function')throw Error('Explicit native binding required: '+key);
  this.profile=profile;this.bindings=bindings;this.nativeReady=false;this.stateClipMappingVerified=true;this.events=[];this.generation=0;this.stateId=null;this.removed=false;this.timers=new Map(Object.keys(CLIPS).map(id=>[Number(id),{elapsedMs:0,paused:false}]));this.delayedCreation=false;
 }
 emit(type,data={}){const event={type,generation:this.generation,...data,nativeScoreProduced:false};this.events.push(event);return event;}
 drainEvents(){return this.events.splice(0);}
 reset({gate6c}){
  if(typeof gate6c!=='boolean')throw Error('Explicit actor+6C gate required');
  this.events=[];
  if(this.stateId!==null&&!this.removed)this.leave(this.stateId);
  if(this.stateId!==null)this.emit('clear-actor-cues',{localAdapterLifecycle:true});
  const cleanup=this.drainEvents();
  this.generation++;this.removed=false;this.stateId=null;this.timers=new Map(Object.keys(CLIPS).map(id=>[Number(id),{elapsedMs:0,paused:false}]));this.delayedCreation=false;this.enter(0,gate6c);return [...cleanup,...this.drainEvents()];
 }
 animationRequest(){
  if(this.stateId===null)return null;const id=this.stateId,p=this.profile;
  const durationMs=({0:p.creationMs,2:p.reloadMs,3:p.attackMs,5:p.destructionMs})[id];
  return {clip:CLIPS[id],channelIndices:[1,0],blendMs:id===0||id===1?1000:id===5?0:500,setterFlag:false,loop:id===1,reset:true,...(id===1?{call:'97ED90',rate:1}:{call:'97EE00',targetMs:durationMs}),channelMaskMeaningEstablished:false};
 }
 enter(id,gate6c){
  if(!Object.hasOwn(CLIPS,id))throw Error('Unsupported source Sentry state');
  if(typeof gate6c!=='boolean')throw Error('Explicit actor+6C gate required');
  if(this.stateId!==null)this.leave(this.stateId);
  this.stateId=id;if(!gate6c)this.timers.get(id).elapsedMs=0;
  const p=this.profile;this.emit('state',{id,name:NAMES[id]});this.emit('animation',this.animationRequest());
  if(id===0){if(!gate6c)this.delayedCreation=true;this.emit('sound',{operation:'play',resource:p.sounds.creation});}
  if(id===1){this.emit('sequence',{operation:'start',resource:p.sequences.search});this.emit('sound',{operation:'play',resource:p.sounds.search});}
  if(id===2)this.emit('sequence',{operation:'start',resource:p.sequences.search});
  if(id===3){this.bindings.beginAttack();this.emit('sequence',{operation:'start',resource:p.sequences.attack});}
  if(id===5){this.emit('collision-enabled',{value:false});this.emit('sequence',{operation:'start',resource:p.sequences.destruction});this.emit('sound',{operation:'play',resource:p.sounds.destruction});}
 }
 leave(id){
  if(id===1){this.emit('sound',{operation:'stop-normal-loop'});this.emit('sequence',{operation:'stop',resource:this.profile.sequences.search});}
  if(id===2)this.emit('sequence',{operation:'stop',resource:this.profile.sequences.search});
  if(id===3){this.bindings.endAttack();this.emit('sequence',{operation:'stop',resource:this.profile.sequences.attack});}
 }
 // External source state changes may be applied by a real actor/network driver.
 applyState(id,{gate6c}){if(this.removed)throw Error('Sentry already removed');this.enter(id,gate6c);return this.drainEvents();}
 get elapsedMs(){return this.timers.get(this.stateId)?.elapsedMs??0;}
 set elapsedMs(value){this.timers.get(this.stateId).elapsedMs=value;}
 setTimerPaused(value){if(typeof value!=='boolean'||this.stateId===null)throw Error('Native timer pause byte required');this.timers.get(this.stateId).paused=value;}
 tick(deltaMs,{hp,gate6c,normalSoundPlaying,attackSoundPlaying}){
  uint(deltaMs);if(typeof gate6c!=='boolean'||![normalSoundPlaying,attackSoundPlaying].every(v=>v===null||typeof v==='boolean')||!Number.isFinite(hp))throw Error('Explicit actual actor HP/gate and audio status required');
  if(this.removed||this.stateId===null)return [];
  const id=this.stateId,p=this.profile,shouldTick=id===0?this.delayedCreation&&p.creationMs!==0:!gate6c;if(shouldTick&&!this.timers.get(id).paused)this.elapsedMs=add(this.elapsedMs,deltaMs);
  // AFA480 runs before the derived callback. Creation uses its delayed target1.
  if(id===0&&this.delayedCreation&&p.creationMs!==0&&this.elapsedMs>p.creationMs)this.enter(1,gate6c);
  // Ordered equality against0, not a made-up negative-health/NaN predicate.
  if(id!==5&&!gate6c&&hp===0){this.enter(5,gate6c);return this.drainEvents();}
  if(id===1||id===2||id===3)this.bindings.updateHead();
  if(id===1){
   if(normalSoundPlaying===false)this.emit('sound',{operation:'play',resource:'Resources/Sound/sentrygun_loop.ogg',source:'AF98E5',resourceAvailable:false});
   if(!gate6c){
    if(this.elapsedMs>p.findTargetMs){this.elapsedMs=0;this.bindings.clearTarget();this.bindings.searchTarget({rawScale0:1,rawScale1:1});}
    if(this.bindings.hasTarget()===true)this.enter(3,gate6c);
   }
  }
  if(id===3){
   if(attackSoundPlaying===false)this.emit('sound',{operation:'play',resource:p.sounds.attack});
   this.bindings.tickAttack(deltaMs);
   if(!gate6c&&this.elapsedMs>p.attackMs)this.enter(2,gate6c);
  }
  if(id===2&&!gate6c&&this.elapsedMs>p.reloadMs){this.bindings.clearTarget();this.bindings.searchTarget({rawScale0:1,rawScale1:1});const target=this.bindings.hasTarget();if(typeof target==='boolean')this.enter(target?3:1,gate6c);}
  if(id===5&&!gate6c&&this.elapsedMs>p.destructionMs){this.removed=true;this.emit('actor-remove',{source:'AF932F/AF934C/AF937F',notificationProduced:false});}
  return this.drainEvents();
 }
 snapshot(){return {id:this.stateId,name:NAMES[this.stateId]??null,elapsedMs:this.elapsedMs,generation:this.generation,removed:this.removed,nativeReady:false};}
}

// Rendering seam: actual clip samples only; requires an explicit policy for
// unresolved native channel membership/blending and pose-clock composition.
export function createPracticeSentryPoseConsumer(model,{sourceSeconds}){
 if(typeof model?.sampleClip!=='function'||typeof sourceSeconds!=='function')throw Error('Actual source model and explicit pose clock required');
 let animation=null,generation=null;
 return {consume(events){for(const event of events){if(event.type==='animation'){if(!model.clips.some(c=>c.name===event.clip))throw Error('Missing literal Sentry clip '+event.clip);animation={...event};generation=event.generation;model.sampleClip(animation.clip,0);}}},sample(elapsedMs,currentGeneration){uint(elapsedMs);if(!animation||generation!==currentGeneration)return false;const seconds=sourceSeconds({animation,elapsedMs});if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid explicit source pose time');model.sampleClip(animation.clip,seconds);return true;},reset(){animation=null;generation=null;model.restoreBind();},nativeReady:false};
}

// Per-actor integration seam. It steps no player or match and owns no points.
// The caller supplies actual perception/attack services, actor bit6C, audio
// status and an explicitly identified pose-clock policy until channel join.
export function createPracticeSentryActorDriver({model,profile,bindings,poseClockPolicy,onCue,onRemove,afterPose=()=>{}}){
 if(typeof poseClockPolicy?.name!=='string'||!poseClockPolicy.name||typeof poseClockPolicy.sourceSeconds!=='function'||typeof onCue!=='function'||typeof onRemove!=='function')throw Error('Explicit pose-clock policy and cue/remove consumers required');
 if(typeof afterPose!=='function')throw Error('Invalid Sentry post-pose consumer');
 const behavior=new PracticeSentryBehavior({profile,bindings}),pose=createPracticeSentryPoseConsumer(model,poseClockPolicy);let animationElapsedMs=0,disposed=false;
 const finishPose=()=>afterPose(model,{stateId:behavior.stateId,generation:behavior.generation});
 function consume(events){
  if(events.some(e=>e.type==='animation'))animationElapsedMs=0;
  pose.consume(events);if(events.some(e=>e.type==='animation'))finishPose();
  for(const event of events){if(['sound','sequence','collision-enabled','clear-actor-cues'].includes(event.type))onCue(event);if(event.type==='actor-remove'){model.group.visible=false;onRemove(event);}}
  return events;
 }
 return {behavior,model,nativeReady:false,poseClockPolicy:poseClockPolicy.name,
  reset({gate6c}){if(disposed)throw Error('Sentry driver disposed');pose.reset();model.group.visible=true;animationElapsedMs=0;return consume(behavior.reset({gate6c}));},
  tick(deltaMs,actualInputs){uint(deltaMs);if(disposed)return [];animationElapsedMs=add(animationElapsedMs,deltaMs);const events=consume(behavior.tick(deltaMs,actualInputs));if(!behavior.removed){pose.sample(animationElapsedMs,behavior.generation);finishPose();}return events;},
  applyState(id,{gate6c}){if(disposed)throw Error('Sentry driver disposed');return consume(behavior.applyState(id,{gate6c}));},
  dispose(){if(disposed)return;disposed=true;if(behavior.stateId!==null&&!behavior.removed)behavior.leave(behavior.stateId);behavior.emit('clear-actor-cues',{localAdapterLifecycle:true});consume(behavior.drainEvents());pose.reset();}
 };
}
