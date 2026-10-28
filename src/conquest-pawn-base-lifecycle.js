import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const f=Math.fround;
const uint=(n,name)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw Error('Explicit uint32 '+name+' required');return n;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const sounds=Object.freeze({2:'Sound/challenge_arcade/AI_damage.ogg',4:'Sound/challenge_arcade/destroy.ogg',5:'Sound/challenge_arcade/pawn_attack.ogg'});
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export const CONQUEST_PAWN_BASE_SOURCE=Object.freeze({enter:0xa2d490,exit:0xa2d560,tick:0xa2d460,animationB9:false,resetEffectsBE:true,playbackRateAC:1,motionNode:'MoveBox',soundDelayMs:200,nativeReady:false});

// A2D490/A2D560/A2D460 for authenticated normal Pawn1003. Resource playback
// and actual channel0 writes are mandatory synchronous application ports.
export class ConquestPawnBaseLifecycle{
 #records=new WeakMap();#active=null;#disposed=false;#model;#group;#find;#actor;#io;
 constructor({actor,readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound}={}){
  if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1003||!actor.model.mixer||typeof actor.model.findSourceNode!=='function'||![readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound].every(sync))throw Error('Actual Pawn and explicit synchronous animation/audio lifecycle ports required');
  this.#actor=actor;this.#model=actor.model;this.#group=actor.model.group;this.#find=actor.model.findSourceNode;this.#io={readAnimationChannel,writeAnimationRate,initializeSoundHandle,playSound,stopSound};
  this.ports=Object.freeze({enter:state=>this.enter(state),exit:state=>this.exit(state),tick:(state,dt)=>this.tick(state,dt)});
 }
 #call(name,payload){const value=this.#io[name](payload);if(value&&typeof value.then==='function')throw Error('Pawn lifecycle ports must finish synchronously');return value;}
 #state(state){
  if(this.#disposed||this.#actor.model!==this.#model||this.#model.group!==this.#group||this.#model.findSourceNode!==this.#find||!(state instanceof ConquestMonsterMappedState)||state.actor!==this.#actor||![0,1,2,3,4,5].includes(state.stateId))throw Error('Live owned ordinary Pawn state/model required');
  let record=this.#records.get(state);if(record&&record.stateId!==state.stateId)throw Error('Pawn source state ID replaced');
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
  // Empty lookup is established on this actual loaded source model, rather
  // than skipping root motion globally. Another model/node requires a port.
  if(node!==null)throw Error('Pawn MoveBox root-motion branch requires another qualified lifecycle');
  record.node=node;record.nodeResolved=true;record.matrix=identity();this.#writeRate(state,1);
  for(const sound of record.sounds){sound.count=0;sound.elapsed=0;}
  this.#active=state;return this.snapshot(state);
 }
 tick(state,deltaMs){
  const record=this.#state(state);uint(deltaMs,'engine delta');if(this.#active!==state)throw Error('Entered current Pawn lifecycle state required');
  if(record.node!==null||this.#model.findSourceNode('MoveBox')!==null)throw Error('Pawn motion-node lookup changed');
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
  return {...this.snapshot(state),played};
 }
 exit(state){
  const record=this.#state(state);if(this.#active!==state)throw Error('Current Pawn lifecycle exit owner required');
  this.#writeRate(state,1);record.node=null;
  // A2E510 stops the retained handle then clears it. Before the first play,
  // that handle comes from the explicit S5 policy, not a claimed native zero.
  for(const sound of record.sounds){const receipt=this.#call('stopSound',{actor:this.#actor,model:this.#model,state,handle:sound.handle,handleSource:sound.handleSource,initializationPolicy:sound.initializationPolicy});if(receipt?.accepted!==true)throw Error('Explicit sound stop receipt required');sound.handle=0;sound.handleSource='source-exit-clear';}
  this.#active=null;return this.snapshot(state);
 }
 readPlaybackRate(state){this.#state(state);return 1;}
 snapshot(state){const record=this.#state(state);return {stateId:record.stateId,active:this.#active===state,motionNodeResolvedAbsent:record.nodeResolved&&record.node===null,effectsCount:0,animationB9:false,playbackRateAC:1,matrix60:[...record.matrix],sounds:record.sounds.map(s=>({...s})),nativeReady:false};}
 dispose(){if(this.#disposed)return;if(this.#active)this.exit(this.#active);this.#disposed=true;}
}
