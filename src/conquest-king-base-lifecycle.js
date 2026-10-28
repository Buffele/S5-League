import {CONQUEST_KING_STATE_SOURCE} from './conquest-king-state-source.js';
import {assertConquestKingEffectsPresentation,CONQUEST_KING_AUTHORED_PRESENTATION_POLICY} from './conquest-king-effects-presentation.js';
import {assertConquestKingPendingPresentation,CONQUEST_KING_PENDING_PRESENTATION} from './conquest-king-pending-presentation.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
const CONQUEST_KING_ATTACK_STATES=Object.freeze([Object.freeze({stateId:5,moveBoxMultiplier:1.5,animationSpeed:1.1})]);
import {assertConquestKingMoveBox} from './conquest-king-movebox.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const f=Math.fround;
const uint=(n,name)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw Error('Explicit uint32 '+name+' required');return n;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const sounds=Object.freeze(Object.fromEntries(CONQUEST_KING_STATE_SOURCE.states.flatMap(s=>s.events.filter(e=>e.method==='AddSound').map(e=>[s.stateId,e.args[1]]))));
const owners=new WeakMap();
export function assertConquestKingBaseLifecycle(owner,{actor}={}){if(owners.get(owner)!==actor)throw Error('Typed actual1500 base lifecycle required');owner.assertLive();return owner;}
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export const CONQUEST_KING_BASE_SOURCE=Object.freeze({enter:0xa2d490,exit:0xa2d560,tick:0xa2d460,animationB9:false,resetEffectsBE:true,playbackRateAC:1,motionNode:'MoveBox',soundDelayMs:200,nativeReady:false});

// Original A2D490/A2D560/A2D460 for authenticated King1500. The real
//MoveBox owner consumes A2E200 after the source effect/sound ticks. State5
//writes AC1.1/A0=1.5; the other states retain constructor AC1/A0=1.
//No attack duration is substituted for the animation channel rate.
export class ConquestKingBaseLifecycle{
 #records=new WeakMap();#active=null;#disposed=false;#model;#group;#find;#actor;#io;#motion;#presentation;
 constructor({actor,readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound,moveBoxOwner,persistentPresentation,presentationPolicy=CONQUEST_KING_PENDING_PRESENTATION}={}){
  assertConquestKingActor(actor);assertConquestKingMoveBox(moveBoxOwner,{actor});if(!actor.model.mixer||typeof actor.model.findSourceNode!=='function'||![readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound].every(sync))throw Error('Actual King and explicit synchronous animation/audio lifecycle ports required');this.#motion=moveBoxOwner;if(![CONQUEST_KING_PENDING_PRESENTATION,CONQUEST_KING_AUTHORED_PRESENTATION_POLICY].includes(presentationPolicy))throw Error('Exact King pending/authored presentation policy required');(presentationPolicy===CONQUEST_KING_AUTHORED_PRESENTATION_POLICY?assertConquestKingEffectsPresentation:assertConquestKingPendingPresentation)(persistentPresentation,{actor});this.#presentation=persistentPresentation;
  owners.set(this,actor);this.#actor=actor;this.#model=actor.model;this.#group=actor.model.group;this.#find=actor.model.findSourceNode;this.#io={readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound};
  this.ports=Object.freeze({enter:state=>this.enter(state),exit:state=>this.exit(state),tick:(state,dt)=>this.tick(state,dt)});
 }
 assertLive(){if(this.#disposed||this.#actor.model!==this.#model||this.#model.group!==this.#group||this.#model.findSourceNode!==this.#find)throw Error('Current1500 base lifecycle required');return this;}
 #call(name,payload){const value=this.#io[name](payload);if(value&&typeof value.then==='function')throw Error('King lifecycle ports must finish synchronously');return value;}
 #state(state){
  if(this.#disposed||this.#actor.model!==this.#model||this.#model.group!==this.#group||this.#model.findSourceNode!==this.#find||!(state instanceof ConquestMonsterMappedState)||state.actor!==this.#actor||![0,1,2,3,4,5,8,9,10].includes(state.stateId))throw Error('Live owned King1500 state/model required');
  let record=this.#records.get(state);if(record&&record.stateId!==state.stateId)throw Error('King source state ID replaced');
  if(!record){
   record={stateId:state.stateId,node:null,nodeResolved:false,matrix:identity(),sounds:[],effects:(CONQUEST_KING_STATE_SOURCE.states.find(s=>s.stateId===state.stateId)?.events??[]).filter(e=>e.method==='AddSequence').map((e,index)=>({index,delay:e.args[0],elapsed:0,finished:false}))};
   if(sounds[state.stateId]){
    const initial=this.#call('initializeSoundHandle',{actor:this.#actor,model:this.#model,state,soundOrdinal:0,path:sounds[state.stateId]});
    if(initial?.accepted!==true||initial.model!==this.#model||initial.policy!=='s5-unplayed-sound-handle'||initial.sourceInitializationQualified!==false||!Object.hasOwn(initial,'handle')||initial.handle===undefined)throw Error('Explicit S5-owned unplayed sound handle policy required; native constructor value unknown');
    record.sounds.push({path:sounds[state.stateId],flag4:CONQUEST_KING_STATE_SOURCE.states.find(s=>s.stateId===state.stateId).events.find(e=>e.method==='AddSound').args[2]??false,delay:200,count:1,elapsed:201,paused:false,handle:initial.handle,handleSource:'s5-initialization',initializationPolicy:initial.policy,sourceInitializationQualified:false});
   }
   this.#records.set(state,record);
  }
  return record;
 }
 #writeRate(state,rate){
  const before=this.#call('readAnimationChannel',{actor:this.#actor,model:this.#model,state,channelIndex:0});
  const valid=c=>c?.model===this.#model&&c.channelIndex===0&&Number.isFinite(c.playbackRate)&&Number.isFinite(f(c.playbackRate));
  if(!valid(before))throw Error('Actual readable model animation channel0 required');
  const write=this.#call('writeAnimationRate',{actor:this.#actor,model:this.#model,state,channelIndex:0,channel:before,playbackRate:rate});
  if(write?.accepted!==true||write.model!==this.#model||write.channelIndex!==0)throw Error('Actual animation channel write receipt required');
  const after=this.#call('readAnimationChannel',{actor:this.#actor,model:this.#model,state,channelIndex:0});
  if(!valid(after)||f(after.playbackRate)!==rate)throw Error('Animation rate write was not retained by the actual channel');
 }
 enter(state){
  const record=this.#state(state),node=this.#model.findSourceNode('MoveBox');
  this.#motion.enter(state);record.node=node;record.nodeResolved=true;record.matrix=identity();this.#writeRate(state,this.readPlaybackRate(state));
  for(const sound of record.sounds){sound.count=0;sound.elapsed=0;}for(const effect of record.effects){effect.elapsed=0;effect.finished=false;}
  this.#active=state;return this.snapshot(state);
 }
 tick(state,deltaMs){
  const record=this.#state(state);uint(deltaMs,'engine delta');if(this.#active!==state)throw Error('Entered current King lifecycle state required');
  if(record.node!==this.#model.findSourceNode('MoveBox'))throw Error('King motion-node lookup changed');
  let played=0;for(const effect of record.effects){if(effect.finished)continue;effect.elapsed=(effect.elapsed+deltaMs)>>>0;if(effect.elapsed>effect.delay){this.#presentation.requestStateEffect({state,elapsedMs:effect.elapsed,index:effect.index});effect.finished=true;}}
  // A2DE60 advances only entries whose pre-tick elapsed<=duration. Equality
  // does not fire, overflow is uint32, and expired entries are not replayed.
  for(const sound of record.sounds){
   if(sound.delay<sound.elapsed)continue;
   if(sound.paused)continue;
   sound.count=(sound.count+1)>>>0;sound.elapsed=(sound.elapsed+deltaMs)>>>0;
   if(sound.delay>=sound.elapsed)continue;
   const receipt=this.#call('playSound',{actor:this.#actor,model:this.#model,state,soundOrdinal:0,path:sound.path,nativeFlag4:sound.flag4,argumentLast:1});
   if(receipt?.accepted!==true||!Object.hasOwn(receipt,'handle')||receipt.handle===undefined||receipt.handle===null)throw Error('Explicit retained sound playback handle required');
   sound.handle=receipt.handle;sound.handleSource='play-return';played++;
  }
  const declaration=CONQUEST_KING_ATTACK_STATES.find(s=>s.stateId===state.stateId),motion=this.#motion.tick(state,declaration?.moveBoxMultiplier??1);record.matrix=[...motion.matrix60];return {...this.snapshot(state),played,motion};
 }
 exit(state){
  const record=this.#state(state);if(this.#active!==state)throw Error('Current King lifecycle exit owner required');
  this.#writeRate(state,1);if([4,5,8,9,10].includes(state.stateId))this.#presentation.releaseStateEffects(state);this.#motion.exit(state);record.node=null;
  // A2E510 stops the retained handle then clears it. Before the first play,
  // that handle comes from the explicit S5 policy, not a claimed native zero.
  for(const sound of record.sounds){const receipt=this.#call('stopSound',{actor:this.#actor,model:this.#model,state,soundOrdinal:0,path:sound.path,handle:sound.handle,handleSource:sound.handleSource,initializationPolicy:sound.initializationPolicy});if(receipt?.accepted!==true)throw Error('Explicit sound stop receipt required');sound.handle=0;sound.handleSource='source-exit-clear';}
  this.#active=null;return this.snapshot(state);
 }
 readPlaybackRate(state){this.#state(state);return Math.fround(CONQUEST_KING_ATTACK_STATES.find(s=>s.stateId===state.stateId)?.animationSpeed??1);}
 snapshot(state){const record=this.#state(state);return {stateId:record.stateId,active:this.#active===state,motionNodePresent:record.nodeResolved&&record.node!==null,effectsCount:record.effects.length,animationB9:false,playbackRateAC:this.readPlaybackRate(state),moveBox:this.#motion.snapshot(),matrix60:[...record.matrix],sounds:record.sounds.map(s=>({...s})),nativeReady:false};}
 dispose(){if(this.#disposed)return;if(this.#active)this.exit(this.#active);this.#disposed=true;}
}
