import {assertConquestKnightActor} from './conquest-knight-ai.js';
import {CONQUEST_KNIGHT_ATTACK_STATES} from './conquest-knight-source.js';
import {assertConquestKnightMoveBox} from './conquest-knight-movebox.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const f=Math.fround;
const uint=(n,name)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw Error('Explicit uint32 '+name+' required');return n;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const sounds=Object.freeze({2:'Sound/challenge_arcade/AI_damage.ogg',4:'Sound/challenge_arcade/destroy.ogg',5:'Sound/challenge_arcade/knight_attack.ogg',6:'Sound/challenge_arcade/knight_attack.ogg'});
const owners=new WeakMap();
export function assertConquestKnightBaseLifecycle(owner,{actor}={}){if(owners.get(owner)!==actor)throw Error('Typed actual1203 base lifecycle required');owner.assertLive();return owner;}
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export const CONQUEST_KNIGHT_BASE_SOURCE=Object.freeze({enter:0xa2d490,exit:0xa2d560,tick:0xa2d460,animationB9:false,resetEffectsBE:true,playbackRateAC:1,motionNode:'MoveBox',soundDelayMs:200,nativeReady:false});

// Original A2D490/A2D560/A2D460 for authenticated Knight1203. The real
//MoveBox owner consumes A2E200 after the source effect/sound ticks. State5
//writes AC1.1; state6 retains constructorAC1. Every authored attack uses A0=1.5.
//No attack duration is substituted for the animation channel rate.
export class ConquestKnightBaseLifecycle{
 #records=new WeakMap();#active=null;#disposed=false;#model;#group;#find;#actor;#io;#motion;
 constructor({actor,readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound,moveBoxOwner}={}){
  assertConquestKnightActor(actor);assertConquestKnightMoveBox(moveBoxOwner,{actor});if(!actor.model.mixer||typeof actor.model.findSourceNode!=='function'||![readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound].every(sync))throw Error('Actual Knight and explicit synchronous animation/audio lifecycle ports required');this.#motion=moveBoxOwner;
  owners.set(this,actor);this.#actor=actor;this.#model=actor.model;this.#group=actor.model.group;this.#find=actor.model.findSourceNode;this.#io={readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound};
  this.ports=Object.freeze({enter:state=>this.enter(state),exit:state=>this.exit(state),tick:(state,dt)=>this.tick(state,dt)});
 }
 assertLive(){if(this.#disposed||this.#actor.model!==this.#model||this.#model.group!==this.#group||this.#model.findSourceNode!==this.#find)throw Error('Current1203 base lifecycle required');return this;}
 #call(name,payload){const value=this.#io[name](payload);if(value&&typeof value.then==='function')throw Error('Knight lifecycle ports must finish synchronously');return value;}
 #state(state){
  if(this.#disposed||this.#actor.model!==this.#model||this.#model.group!==this.#group||this.#model.findSourceNode!==this.#find||!(state instanceof ConquestMonsterMappedState)||state.actor!==this.#actor||![0,1,2,3,4,5,6].includes(state.stateId))throw Error('Live owned Knight1203 state/model required');
  let record=this.#records.get(state);if(record&&record.stateId!==state.stateId)throw Error('Knight source state ID replaced');
  if(!record){
   record={stateId:state.stateId,node:null,nodeResolved:false,matrix:identity(),sounds:[]};
   if(sounds[state.stateId]){
    const initial=this.#call('initializeSoundHandle',{actor:this.#actor,model:this.#model,state,path:sounds[state.stateId]});
    if(initial?.accepted!==true||initial.model!==this.#model||initial.policy!=='s5-unplayed-sound-handle'||initial.sourceInitializationQualified!==false||!Object.hasOwn(initial,'handle')||initial.handle===undefined)throw Error('Explicit S5-owned unplayed sound handle policy required; native constructor value unknown');
    record.sounds.push({path:sounds[state.stateId],flag4:false,delay:200,count:1,elapsed:201,paused:false,handle:initial.handle,handleSource:'s5-initialization',initializationPolicy:initial.policy,sourceInitializationQualified:false});
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
  for(const sound of record.sounds){sound.count=0;sound.elapsed=0;}
  this.#active=state;return this.snapshot(state);
 }
 tick(state,deltaMs){
  const record=this.#state(state);uint(deltaMs,'engine delta');if(this.#active!==state)throw Error('Entered current Knight lifecycle state required');
  if(record.node!==this.#model.findSourceNode('MoveBox'))throw Error('Knight motion-node lookup changed');
  let played=0;
  // A2DE60 advances only entries whose pre-tick elapsed<=duration. Equality
  // does not fire, overflow is uint32, and expired entries are not replayed.
  for(const sound of record.sounds){
   if(sound.delay<sound.elapsed)continue;
   if(sound.paused)continue;
   sound.count=(sound.count+1)>>>0;sound.elapsed=(sound.elapsed+deltaMs)>>>0;
   if(sound.delay>=sound.elapsed)continue;
   const receipt=this.#call('playSound',{actor:this.#actor,model:this.#model,state,path:sound.path,nativeFlag4:sound.flag4,argumentLast:1});
   if(receipt?.accepted!==true||!Object.hasOwn(receipt,'handle')||receipt.handle===undefined||receipt.handle===null)throw Error('Explicit retained sound playback handle required');
   sound.handle=receipt.handle;sound.handleSource='play-return';played++;
  }
  const declaration=CONQUEST_KNIGHT_ATTACK_STATES.find(s=>s.stateId===state.stateId),motion=this.#motion.tick(state,declaration?.moveBoxMultiplier??1);record.matrix=[...motion.matrix60];return {...this.snapshot(state),played,motion};
 }
 exit(state){
  const record=this.#state(state);if(this.#active!==state)throw Error('Current Knight lifecycle exit owner required');
  this.#writeRate(state,1);this.#motion.exit(state);record.node=null;
  // A2E510 stops the retained handle then clears it. Before the first play,
  // that handle comes from the explicit S5 policy, not a claimed native zero.
  for(const sound of record.sounds){const receipt=this.#call('stopSound',{actor:this.#actor,model:this.#model,state,handle:sound.handle,handleSource:sound.handleSource,initializationPolicy:sound.initializationPolicy});if(receipt?.accepted!==true)throw Error('Explicit sound stop receipt required');sound.handle=0;sound.handleSource='source-exit-clear';}
  this.#active=null;return this.snapshot(state);
 }
 readPlaybackRate(state){this.#state(state);return Math.fround(CONQUEST_KNIGHT_ATTACK_STATES.find(s=>s.stateId===state.stateId)?.animationSpeed??1);}
 snapshot(state){const record=this.#state(state);return {stateId:record.stateId,active:this.#active===state,motionNodePresent:record.nodeResolved&&record.node!==null,effectsCount:0,animationB9:false,playbackRateAC:this.readPlaybackRate(state),moveBox:this.#motion.snapshot(),matrix60:[...record.matrix],sounds:record.sounds.map(s=>({...s})),nativeReady:false};}
 dispose(){if(this.#disposed)return;if(this.#active)this.exit(this.#active);this.#disposed=true;}
}
