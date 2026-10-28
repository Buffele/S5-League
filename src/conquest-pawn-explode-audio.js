import {GameAudio} from './game-audio.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
import {readConquestPawnExplodeTimerOwner} from './conquest-pawn-explode-timer.js';

// Exact AddSound resources of monsterai_pawn_explode.lua, states2/4.
// Native timers/source arguments belong to the1013 base lifecycle/timer. WebAudio
// one-shot bus playback does not qualify the native spatial/audio renderer.
export const CONQUEST_PAWN_EXPLODE_SOUND_ASSETS=Object.freeze([
 {stateId:2,path:'Sound/challenge_arcade/AI_damage.ogg',url:'/assets/conquest/pawn/sound/AI_damage.ogg',bytes:17110,sha256:'12507a06929995b0975bf8c53c23bcf569fc49f25a95f17cadded6dd83b84795'},
 {stateId:4,path:'Sound/challenge_arcade/destroy.ogg',url:'/assets/conquest/pawn/sound/destroy.ogg',bytes:29100,sha256:'629e326167f16c9049e1e50e010a8d96b73fb982522f845a9e03375d62d5002b'},
].map(Object.freeze));
export const CONQUEST_PAWN_EXPLODE_COUNTDOWN_SOUND=Object.freeze({path:'Sound/challenge_arcade/unique_pawn_countdown.ogg',url:'/assets/conquest/pawn-explode/sound/unique_pawn_countdown.ogg',bytes:13146,sha256:'bd2a1b6d61936417c5aa9f2e7edd8538b53d2f78835f7bb5f3e9733a299c5eb0'});
export const CONQUEST_PAWN_EXPLODE_AUDIO_POLICY=Object.freeze({id:'s5-pawn-explode-voice-budget-v1',maxPawnVoices:4,maxBusVoices:12,
 overflow:'cull-new-source-return-owned-handle',retry:'next-authored-state-sound-event',nativeAudioPolicyQualified:false});
const owners=new WeakMap(),audioOwners=new WeakMap(),banks=new WeakMap(),preparedBanks=new WeakMap(),voicePools=new WeakMap();
export function assertConquestPawnExplodeAudio(owner,{actor}={}){const r=audioOwners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual1013 audio owner required');r.live();return owner;}
let nextHandle=1;
async function loadBank(context,fetchAsset){
 let bank=banks.get(context);if(bank)return bank;
 bank=Promise.all([...CONQUEST_PAWN_EXPLODE_SOUND_ASSETS,CONQUEST_PAWN_EXPLODE_COUNTDOWN_SOUND].map(async asset=>{
  const response=await fetchAsset(asset.url);if(!response?.ok)throw Error('Pawn source sound unavailable: '+asset.url);
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==asset.bytes)throw Error('Pawn sound resource size mismatch: '+asset.path);
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  if(Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')!==asset.sha256)throw Error('Pawn sound resource identity mismatch: '+asset.path);
  const buffer=await context.decodeAudioData(bytes.slice(0));if(!buffer||!(buffer.duration>0))throw Error('Pawn source sound did not decode: '+asset.path);
  return [asset.path,buffer];
 })).then(entries=>new Map(entries));
 banks.set(context,bank);try{return await bank;}catch(error){if(banks.get(context)===bank)banks.delete(context);throw error;}
}

// Reserve/decode resources before the source spawn clock starts. This phase
// consumes neither an actor identity nor a sampled size nor a sound handle.
export async function prepareConquestPawnExplodeSoundBank({audio,fetchAsset=globalThis.fetch}={}){
 if(!(audio instanceof GameAudio)||!audio.context||!audio.gain||!(audio.sources instanceof Set)||!(audio.sourceKeys instanceof WeakMap)||typeof fetchAsset!=='function')throw Error('Actual unlocked S5 GameAudio and asset producer required');
 const context=audio.context,buffers=await loadBank(context,fetchAsset);
 if(audio.context!==context||context.state==='closed')throw Error('Pawn sound-bank audio context changed during preparation');
 const token=Object.freeze({kind:'conquest-prepared-pawn-explode-sounds'});preparedBanks.set(token,{context,buffers});return token;
}

// Actual actor creation stays synchronous once its source resources are ready.
// ConquestSession can therefore consume a native wave without async births.
export function createPreparedConquestPawnExplodeAudio({actor,audio,soundBank}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1013||actor.aiScriptLiteral.toLowerCase()!=='script/monsterai_pawn_explode.lua'||!(audio instanceof GameAudio)||!audio.context||!audio.gain||!(audio.sources instanceof Set)||!(audio.sourceKeys instanceof WeakMap))throw Error('Actual Pawn and unlocked S5 GameAudio owner required');
 const bank=preparedBanks.get(soundBank);if(!bank||bank.context!==audio.context||bank.context.state==='closed')throw Error('Prepared Pawn sound bank belongs to another or expired audio context');
 const buffers=bank.buffers;
 const model=actor.model,mixer=model.mixer,group=model.group,root=model.nativeRoot,find=model.findSourceNode,context=audio.context,gain=audio.gain,sources=audio.sources,sourceKeys=audio.sourceKeys;
 if(!mixer||mixer.getRoot()!==root||owners.has(model))throw Error('Unique live Pawn presentation/mixer owner required');
 let voicePool=voicePools.get(audio);if(!voicePool){voicePool=new Set();voicePools.set(audio,voicePool);}
 const owner={},handles=new Map(),states=new WeakMap(),countdownRequests=[];let disposed=false,culledSounds=0,startedSounds=0;
 owners.set(model,owner);
 function live(){if(disposed||owners.get(model)!==owner||actor.model!==model||model.group!==group||model.mixer!==mixer||model.nativeRoot!==root||model.findSourceNode!==find||audio.context!==context||audio.gain!==gain||audio.sources!==sources||audio.sourceKeys!==sourceKeys||context.state==='closed')throw Error('Pawn presentation owner replaced or disposed');}
 function stateOwner(args){live();if(args?.actor!==actor||args.model!==model||!(args.state instanceof ConquestMonsterMappedState)||args.state.actor!==actor)throw Error('Owned real Pawn lifecycle state required');return args.state;}
 function actionNow(){const action=model.currentAction??null;if(action&&action.getMixer()!==mixer)throw Error('Pawn animation action belongs to another mixer');return action;}
 // The source channel retains its rate when a one-shot animation ends.
 // Three's effective rate becomes zero while clampWhenFinished pauses it;
 // that pause must not erase the stored channel rate or restart the action.
 function channel(args){stateOwner(args);if(args.channelIndex!==0)throw Error('Pawn channel0 required');const action=actionNow(),rate=mixer.timeScale*(action?action.timeScale:1);if(!Number.isFinite(rate))throw Error('Finite actual Pawn animation rate required');return {model,channelIndex:0,playbackRate:rate,action};}
 function cleanup(entry){if(!entry.source||entry.ended)return;entry.ended=true;voicePool.delete(entry);sources.delete(entry.source);entry.source.disconnect();if(entry.countdown)handles.delete(entry.handle);}
 function stopEntry(entry){if(entry.source&&!entry.ended){entry.source.stop();cleanup(entry);}}
 function soundState(args){const state=stateOwner(args),asset=CONQUEST_PAWN_EXPLODE_SOUND_ASSETS.find(a=>a.stateId===state.stateId);if(!asset||args.path!==asset.path)throw Error('Exact Pawn state sound resource required');return {state,asset};}
 const ports=Object.freeze({
  readAnimationChannel:args=>channel(args),
  writeAnimationRate(args){const current=channel(args);if(args.channel?.model!==model||args.channel.channelIndex!==0||args.channel.action!==current.action||!Number.isFinite(args.playbackRate)||args.playbackRate<=0)throw Error('Current owned Pawn animation channel receipt/rate required');
   // Pawn's adapter has one current source action. The retained mixer clock is
   // real even before first animationEnter. Reset both factors explicitly.
   mixer.timeScale=1;if(current.action)current.action.setEffectiveTimeScale(args.playbackRate);else mixer.timeScale=args.playbackRate;
   return {accepted:true,model,channelIndex:0};
  },
  initializeSoundHandle(args){const {state,asset}=soundState(args);if(states.has(state))throw Error('Pawn sound state already initialized');const handle=nextHandle++,record={state,stateId:state.stateId,path:asset.path,initialHandle:handle,allowed:new Set([handle])};states.set(state,record);handles.set(handle,{record,source:null,ended:false,initial:true});return {accepted:true,model,handle,policy:'s5-unplayed-sound-handle',sourceInitializationQualified:false};},
  playSound(args){const {state,asset}=soundState(args),record=states.get(state);if(!record||record.stateId!==state.stateId||args.nativeFlag4!==false||args.argumentLast!==1)throw Error('Initialized exact Pawn sound playback policy required');
   if(context.state!=='running')throw Error('S5 audio context must be resumed before Pawn sound playback');
   // S5 application culling: keep Pawn crowds below four actual voices and
   // respect the existing shared12-voice bus without stopping player sounds.
   // A culled event still owns a distinct stoppable logical return handle;
   // no WebAudio node or delayed retry survives the authored state event.
   if(voicePool.size>=CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.maxPawnVoices||sources.size>=CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.maxBusVoices){
    const handle=nextHandle++;handles.set(handle,{record,source:null,ended:true,initial:false,culled:true});record.allowed.add(handle);
    handles.delete(record.initialHandle);record.allowed.delete(record.initialHandle);culledSounds++;
    return {accepted:true,handle,audible:false,policy:CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.id,cullReason:voicePool.size>=CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.maxPawnVoices?'pawn-voice-budget':'shared-bus-budget',nativeAudioPolicyQualified:false};
   }
   const source=context.createBufferSource(),handle=nextHandle++,entry={record,source,ended:false,initial:false};source.buffer=buffers.get(asset.path);source.loop=false;source.connect(gain);source.onended=()=>cleanup(entry);
   handles.set(handle,entry);record.allowed.add(handle);voicePool.add(entry);sources.add(source);sourceKeys.set(source,'conquest-pawn-explode:'+asset.path);
   try{source.start();}catch(error){cleanup(entry);handles.delete(handle);record.allowed.delete(handle);throw error;}
   // The initialized handle has no native playback behind it. Once the real
   // return handle replaces it, it must not accumulate or remain stoppable.
   handles.delete(record.initialHandle);record.allowed.delete(record.initialHandle);
   startedSounds++;return {accepted:true,handle,audible:true,policy:CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.id,nativeAudioPolicyQualified:false};
  },
  stopSound(args){const state=stateOwner(args),record=states.get(state);if(!record||record.stateId!==state.stateId||args.initializationPolicy!=='s5-unplayed-sound-handle')throw Error('Owned Pawn sound stop policy required');
   if(args.handle===0){if(args.handleSource!=='source-exit-clear'||!record.allowed.has(0))throw Error('Only a previously cleared Pawn state can stop zero');return {accepted:true};}
   const entry=handles.get(args.handle);if(!entry||entry.record!==record||!record.allowed.has(args.handle)||(entry.initial?args.handleSource!=='s5-initialization':args.handleSource!=='play-return'))throw Error('Owned Pawn sound handle required');
   stopEntry(entry);handles.delete(args.handle);record.allowed.delete(args.handle);record.allowed.add(0);return {accepted:true};
  },
 });
 const timerPorts=Object.freeze({
  startCountdown({actor:target,effect,node,sourceComponent,generation}={}){
   live();if(target!==actor||sourceComponent!==readConquestPawnExplodeTimerOwner(actor)||sourceComponent===null||effect!=='Effects/set_num3.seq'||node!==''||!Number.isSafeInteger(generation)||generation<1)throw Error('Actual1013 timer source countdown request required');
   // B8A720 permits failure to create its effect while retaining the timer.
   // The authored set_num3 sequence runtime has not been qualified: expose
   // that failed presentation boundary, never an invented visible counter.
   const receipt=Object.freeze({accepted:false,effect,node,generation,reason:'authored-set_num3-runtime-unavailable',sourceEffectCreationFailed:true,renderer:null,nativeReady:false});
   countdownRequests.push(receipt);if(countdownRequests.length>16)countdownRequests.shift();return receipt;
  },
  playCountdownSound({actor:target,sound,firstFlag,lastFlag}={}){
   live();if(target!==actor||readConquestPawnExplodeTimerOwner(actor)===null||sound!==CONQUEST_PAWN_EXPLODE_COUNTDOWN_SOUND.path||firstFlag!==false||lastFlag!==true)throw Error('Actual1013 timer countdown sound request required');
   if(context.state!=='running')throw Error('S5 audio context must be resumed before countdown sound playback');
   const handle=nextHandle++;
   if(voicePool.size>=CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.maxPawnVoices||sources.size>=CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.maxBusVoices){culledSounds++;return {accepted:true,handle,audible:false,policy:CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.id,nativeAudioPolicyQualified:false};}
   const source=context.createBufferSource(),entry={record:null,source,handle,countdown:true,ended:false};source.buffer=buffers.get(sound);source.loop=false;source.connect(gain);source.onended=()=>cleanup(entry);handles.set(handle,entry);voicePool.add(entry);sources.add(source);sourceKeys.set(source,'conquest-pawn-explode:'+sound);
   try{source.start();}catch(error){cleanup(entry);throw error;}startedSounds++;return {accepted:true,handle,audible:true,policy:CONQUEST_PAWN_EXPLODE_AUDIO_POLICY.id,nativeAudioPolicyQualified:false};
  },
 });
 try{live();}catch(error){if(owners.get(model)===owner)owners.delete(model);throw error;}
 const api=Object.freeze({ports,timerPorts,
  snapshot(){live();return {prepared:true,monsterKey:1013,sourceSoundCount:buffers.size,playing:[...handles.values()].filter(e=>e.source&&!e.ended).length,audioContextState:context.state,sharesGameAudioBus:true,initializationPolicy:'s5-unplayed-sound-handle',sourceInitializationQualified:false,audioRenderer:'web-audio-game-bus-one-shot',nativeAudioRenderingQualified:false,animationChannel:0,
   voicePolicy:CONQUEST_PAWN_EXPLODE_AUDIO_POLICY,activePawnVoices:voicePool.size,culledSounds,startedSounds,retainedHandles:handles.size,countdownEffectPrepared:false,countdownRequests:[...countdownRequests],nativeReady:false};},
  dispose(){if(disposed)return;for(const entry of handles.values())stopEntry(entry);handles.clear();disposed=true;if(owners.get(model)===owner)owners.delete(model);},
 });
 audioOwners.set(api,{actor,live});return api;
}

// Compatibility for isolated actor preparation. Production wave orchestration
// prepares a bank first and calls the synchronous factory at actual birth.
export async function createConquestPawnExplodeAudio({actor,audio,fetchAsset=globalThis.fetch}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1013)throw Error('Actual Pawn and unlocked S5 GameAudio owner required');
 const model=actor.model,group=model.group;
 const soundBank=await prepareConquestPawnExplodeSoundBank({audio,fetchAsset});
 if(actor.model!==model||model.group!==group)throw Error('Pawn model changed during sound preparation');
 return createPreparedConquestPawnExplodeAudio({actor,audio,soundBank});
}
