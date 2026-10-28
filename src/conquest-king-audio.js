import {GameAudio} from './game-audio.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';

// Exact authenticated King1500 AddSound resources, including each authored native flag4.
// Native timers/source arguments belong to ConquestKingBaseLifecycle. WebAudio
// one-shot bus playback does not qualify the native spatial/audio renderer.
export const CONQUEST_KING_SOUND_ASSETS=Object.freeze([{"stateId":1,"path":"Sound/challenge_arcade/king_move.ogg","url":"/assets/conquest/king/sound/king_move.ogg","nativeFlag4":true,"bytes":72960,"sha256":"46be3a41486c8b2025bf8f469379672d602511a003ba148701d4b3fdaf6cb698"},{"stateId":4,"path":"Sound/challenge_arcade/king_destroy.ogg","url":"/assets/conquest/king/sound/king_destroy.ogg","nativeFlag4":false,"bytes":60833,"sha256":"41a170ffd1ea334a5894e1987b27bdf5b87d29af9d885647e43e93b8d4e96c4a"},{"stateId":5,"path":"Sound/challenge_arcade/king_jump_attack.ogg","url":"/assets/conquest/king/sound/king_jump_attack.ogg","nativeFlag4":false,"bytes":51158,"sha256":"6d7dcd39d8fb2c89737b83e2581bcd9549f297b8480d99561a3ab67b2803219e"},{"stateId":8,"path":"Sound/challenge_arcade/king_skill_start.ogg","url":"/assets/conquest/king/sound/king_skill_start.ogg","nativeFlag4":true,"bytes":79816,"sha256":"55c65f7cf03f7f574997fc883223522216b0865a2bc5bdafbb038204f8f26fec"},{"stateId":9,"path":"Sound/challenge_arcade/king_rush_attack.ogg","url":"/assets/conquest/king/sound/king_rush_attack.ogg","nativeFlag4":true,"bytes":28168,"sha256":"1109cd47762ae19021d06ac654d8f7f9c09a07be1d94ca5fe1459b669234a43c"},{"stateId":10,"path":"Sound/challenge_arcade/king_rush_attack.ogg","url":"/assets/conquest/king/sound/king_rush_attack.ogg","nativeFlag4":true,"bytes":28168,"sha256":"1109cd47762ae19021d06ac654d8f7f9c09a07be1d94ca5fe1459b669234a43c"}].map(Object.freeze));
export const CONQUEST_KING_AUDIO_POLICY=Object.freeze({id:'s5-king-charge-voice-budget-v1',maxKingVoices:4,maxBusVoices:12,
 overflow:'cull-new-source-return-owned-handle',retry:'next-authored-state-sound-event',nativeAudioPolicyQualified:false});
const audioOwners=new WeakMap(),owners=new WeakMap(),banks=new WeakMap(),preparedBanks=new WeakMap(),voicePools=new WeakMap();
let nextHandle=1;
async function loadBank(context,fetchAsset){
 let bank=banks.get(context);if(bank)return bank;
 bank=Promise.all([...new Map(CONQUEST_KING_SOUND_ASSETS.map(asset=>[asset.path,asset])).values()].map(async asset=>{
  const response=await fetchAsset(asset.url);if(!response?.ok)throw Error('King source sound unavailable: '+asset.url);
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==asset.bytes)throw Error('King sound resource size mismatch: '+asset.path);
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  if(Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')!==asset.sha256)throw Error('King sound resource identity mismatch: '+asset.path);
  const buffer=await context.decodeAudioData(bytes.slice(0));if(!buffer||!(buffer.duration>0))throw Error('King source sound did not decode: '+asset.path);
  return [asset.path,buffer];
 })).then(entries=>new Map(entries));
 banks.set(context,bank);try{return await bank;}catch(error){if(banks.get(context)===bank)banks.delete(context);throw error;}
}

// Reserve/decode resources before the source spawn clock starts. This phase
// consumes neither an actor identity nor a sampled size nor a sound handle.
export async function prepareConquestKingSoundBank({audio,fetchAsset=globalThis.fetch}={}){
 if(!(audio instanceof GameAudio)||!audio.context||!audio.gain||!(audio.sources instanceof Set)||!(audio.sourceKeys instanceof WeakMap)||typeof fetchAsset!=='function')throw Error('Actual unlocked S5 GameAudio and asset producer required');
 const context=audio.context,buffers=await loadBank(context,fetchAsset);
 if(audio.context!==context||context.state==='closed')throw Error('King sound-bank audio context changed during preparation');
 const token=Object.freeze({kind:'conquest-prepared-king-sounds'});preparedBanks.set(token,{context,buffers});return token;
}

// Actual actor creation stays synchronous once its source resources are ready.
// ConquestSession can therefore consume a native wave without async births.
export function createPreparedConquestKingAudio({actor,audio,soundBank}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1500||!(audio instanceof GameAudio)||!audio.context||!audio.gain||!(audio.sources instanceof Set)||!(audio.sourceKeys instanceof WeakMap))throw Error('Actual King and unlocked S5 GameAudio owner required');
 assertConquestKingActor(actor);const bank=preparedBanks.get(soundBank);if(!bank||bank.context!==audio.context||bank.context.state==='closed')throw Error('Prepared King sound bank belongs to another or expired audio context');
 const buffers=bank.buffers;
 const model=actor.model,mixer=model.mixer,group=model.group,root=model.nativeRoot,find=model.findSourceNode,context=audio.context,gain=audio.gain,sources=audio.sources,sourceKeys=audio.sourceKeys;
 if(!mixer||mixer.getRoot()!==root||owners.has(model))throw Error('Unique live King presentation/mixer owner required');
 let voicePool=voicePools.get(audio);if(!voicePool){voicePool=new Set();voicePools.set(audio,voicePool);}
 const owner={},handles=new Map(),states=new WeakMap();let disposed=false,culledSounds=0,startedSounds=0;
 owners.set(model,owner);
 function live(){assertConquestKingActor(actor);if(disposed||owners.get(model)!==owner||actor.model!==model||model.group!==group||model.mixer!==mixer||model.nativeRoot!==root||model.findSourceNode!==find||audio.context!==context||audio.gain!==gain||audio.sources!==sources||audio.sourceKeys!==sourceKeys||context.state==='closed')throw Error('King presentation owner replaced or disposed');}
 function stateOwner(args){live();if(args?.actor!==actor||args.model!==model||!(args.state instanceof ConquestMonsterMappedState)||args.state.actor!==actor)throw Error('Owned real King lifecycle state required');return args.state;}
 function actionNow(){const action=model.currentAction??null;if(action&&action.getMixer()!==mixer)throw Error('King animation action belongs to another mixer');return action;}
 // The source channel retains its rate when a one-shot animation ends.
 // Three's effective rate becomes zero while clampWhenFinished pauses it;
 // that pause must not erase the stored channel rate or restart the action.
 function channel(args){stateOwner(args);if(args.channelIndex!==0)throw Error('King channel0 required');const action=actionNow(),rate=mixer.timeScale*(action?action.timeScale:1);if(!Number.isFinite(rate))throw Error('Finite actual King animation rate required');return {model,channelIndex:0,playbackRate:rate,action};}
 function cleanup(entry){if(!entry.source||entry.ended)return;entry.ended=true;voicePool.delete(entry);sources.delete(entry.source);entry.source.disconnect();}
 function stopEntry(entry){if(entry.source&&!entry.ended){entry.source.stop();cleanup(entry);}}
 function soundState(args){const state=stateOwner(args),asset=CONQUEST_KING_SOUND_ASSETS.find(a=>a.stateId===state.stateId);if(!asset||args.path!==asset.path||!Number.isInteger(args.soundOrdinal)||args.soundOrdinal<0||args.soundOrdinal>0)throw Error('Exact King state sound resource required');return {state,asset};}
 const ports=Object.freeze({
  readAnimationChannel:args=>channel(args),
  writeAnimationRate(args){const current=channel(args);if(args.channel?.model!==model||args.channel.channelIndex!==0||args.channel.action!==current.action||!Number.isFinite(args.playbackRate)||args.playbackRate<=0)throw Error('Current owned King animation channel receipt/rate required');
   // King's adapter has one current source action. The retained mixer clock is
   // real even before first animationEnter. Reset both factors explicitly.
   mixer.timeScale=1;if(current.action)current.action.setEffectiveTimeScale(args.playbackRate);else mixer.timeScale=args.playbackRate;
   return {accepted:true,model,channelIndex:0};
  },
  initializeSoundHandle(args){const {state,asset}=soundState(args);let rows=states.get(state);if(!rows){rows=new Map();states.set(state,rows);}if(rows.has(args.soundOrdinal))throw Error('King sound row already initialized');const handle=nextHandle++,record={state,stateId:state.stateId,path:asset.path,initialHandle:handle,allowed:new Set([handle])};rows.set(args.soundOrdinal,record);handles.set(handle,{record,source:null,ended:false,initial:true});return {accepted:true,model,handle,policy:'s5-unplayed-sound-handle',sourceInitializationQualified:false};},
  playSound(args){const {state,asset}=soundState(args),record=states.get(state)?.get(args.soundOrdinal);if(!record||record.stateId!==state.stateId||args.nativeFlag4!==asset.nativeFlag4||args.argumentLast!==1)throw Error('Initialized exact King sound playback policy required');
   if(context.state!=='running')throw Error('S5 audio context must be resumed before King sound playback');
   // S5 application culling: keep King crowds below four actual voices and
   // respect the existing shared12-voice bus without stopping player sounds.
   // A culled event still owns a distinct stoppable logical return handle;
   // no WebAudio node or delayed retry survives the authored state event.
   if(voicePool.size>=CONQUEST_KING_AUDIO_POLICY.maxKingVoices||sources.size>=CONQUEST_KING_AUDIO_POLICY.maxBusVoices){
    const handle=nextHandle++;handles.set(handle,{record,source:null,ended:true,initial:false,culled:true});record.allowed.add(handle);
    handles.delete(record.initialHandle);record.allowed.delete(record.initialHandle);culledSounds++;
    return {accepted:true,handle,audible:false,policy:CONQUEST_KING_AUDIO_POLICY.id,cullReason:voicePool.size>=CONQUEST_KING_AUDIO_POLICY.maxKingVoices?'king-voice-budget':'shared-bus-budget',nativeAudioPolicyQualified:false};
   }
   const source=context.createBufferSource(),handle=nextHandle++,entry={record,source,ended:false,initial:false};source.buffer=buffers.get(asset.path);source.loop=false;source.connect(gain);source.onended=()=>cleanup(entry);
   handles.set(handle,entry);record.allowed.add(handle);voicePool.add(entry);sources.add(source);sourceKeys.set(source,'conquest-king:'+asset.path);
   try{source.start();}catch(error){cleanup(entry);handles.delete(handle);record.allowed.delete(handle);throw error;}
   // The initialized handle has no native playback behind it. Once the real
   // return handle replaces it, it must not accumulate or remain stoppable.
   handles.delete(record.initialHandle);record.allowed.delete(record.initialHandle);
   startedSounds++;return {accepted:true,handle,audible:true,policy:CONQUEST_KING_AUDIO_POLICY.id,nativeAudioPolicyQualified:false};
  },
  stopSound(args){const state=stateOwner(args),record=states.get(state)?.get(args.soundOrdinal);if(!record||record.stateId!==state.stateId||args.initializationPolicy!=='s5-unplayed-sound-handle')throw Error('Owned King sound stop policy required');
   if(args.handle===0){if(args.handleSource!=='source-exit-clear'||!record.allowed.has(0))throw Error('Only a previously cleared King state can stop zero');return {accepted:true};}
   const entry=handles.get(args.handle);if(!entry||entry.record!==record||!record.allowed.has(args.handle)||(entry.initial?args.handleSource!=='s5-initialization':args.handleSource!=='play-return'))throw Error('Owned King sound handle required');
   stopEntry(entry);handles.delete(args.handle);record.allowed.delete(args.handle);record.allowed.add(0);return {accepted:true};
  },
 });
 try{live();}catch(error){if(owners.get(model)===owner)owners.delete(model);throw error;}
 const api=Object.freeze({ports,
  snapshot(){live();return {prepared:true,monsterKey:1500,sourceSoundCount:buffers.size,playing:[...handles.values()].filter(e=>e.source&&!e.ended).length,audioContextState:context.state,sharesGameAudioBus:true,initializationPolicy:'s5-unplayed-sound-handle',sourceInitializationQualified:false,audioRenderer:'web-audio-game-bus-one-shot',nativeAudioRenderingQualified:false,animationChannel:0,
   voicePolicy:CONQUEST_KING_AUDIO_POLICY,activeKingVoices:voicePool.size,culledSounds,startedSounds,retainedHandles:handles.size,nativeReady:false};},
  dispose(){if(disposed)return;for(const entry of handles.values())stopEntry(entry);handles.clear();disposed=true;if(owners.get(model)===owner)owners.delete(model);},
 });audioOwners.set(api,{actor,live});return api;
}

export function assertConquestKingAudio(owner,{actor}={}){const r=audioOwners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual King audio owner required');r.live();return owner;}

// Compatibility for isolated actor preparation. Production wave orchestration
// prepares a bank first and calls the synchronous factory at actual birth.
export async function createConquestKingAudio({actor,audio,fetchAsset=globalThis.fetch}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1500)throw Error('Actual King and unlocked S5 GameAudio owner required');
 const model=actor.model,group=model.group;
 const soundBank=await prepareConquestKingSoundBank({audio,fetchAsset});
 if(actor.model!==model||model.group!==group)throw Error('King model changed during sound preparation');
 return createPreparedConquestKingAudio({actor,audio,soundBank});
}
