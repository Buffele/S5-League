import {GameAudio} from './game-audio.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';

// All eight original source rounds carry this exact Ogg at3000ms/event843.
// ConquestWaveSchedule owns the strict elapsed>deadline clock and dispatch.
export const CONQUEST_WAVE_SOUND=Object.freeze({path:'Sound/Interface/ready2.ogg',url:'/assets/s5runtime/interface-audio/sound/interface/ready2.ogg',bytes:156104,sha256:'c6e2202b03250ea90adcb3778a667ca06529fabf3ddacb3bb2a27fd7ede55d6c'});
export const CONQUEST_WAVE_AUDIO_POLICY=Object.freeze({id:'s5-conquest-wave-game-bus-v1',volume:'existing-S5-GameAudio-gain',renderer:'web-audio-one-shot',nativeAudioPolicyQualified:false});
const banks=new WeakMap();
async function load(context,fetchAsset){
 let promise=banks.get(context);if(promise)return promise;
 promise=(async()=>{
  const response=await fetchAsset(CONQUEST_WAVE_SOUND.url);if(!response?.ok)throw Error('Conquest wave sound unavailable');
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==CONQUEST_WAVE_SOUND.bytes)throw Error('Conquest wave sound size mismatch');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  if(Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')!==CONQUEST_WAVE_SOUND.sha256)throw Error('Conquest wave sound identity mismatch');
  const buffer=await context.decodeAudioData(bytes.slice(0));if(!buffer||!(buffer.duration>0))throw Error('Conquest wave sound did not decode');return buffer;
 })();banks.set(context,promise);
 try{return await promise;}catch(error){if(banks.get(context)===promise)banks.delete(context);throw error;}
}

// Await before session.start. No fetch, digest, decode or delayed retry occurs
// in play(): it consumes the actual synchronous schedule request directly.
export async function prepareConquestWaveAudio({audio,fetchAsset=globalThis.fetch,signal}={}){
 if(!(audio instanceof GameAudio)||!audio.context||!audio.gain||!(audio.sources instanceof Set)||!(audio.sourceKeys instanceof WeakMap)||typeof fetchAsset!=='function')throw Error('Actual unlocked S5 GameAudio and asset producer required');
 if(signal!==undefined&&!(signal instanceof AbortSignal))throw Error('Conquest wave audio cancellation requires AbortSignal');
 const {context,gain,sources,sourceKeys}=audio;
 function current(){if(audio.context!==context||audio.gain!==gain||audio.sources!==sources||audio.sourceKeys!==sourceKeys||context.state==='closed')throw Error('Conquest wave audio owner replaced or closed');if(signal?.aborted)throw Error('Conquest wave audio cancelled');}
 current();const buffer=await load(context,fetchAsset);current();
 const entries=new Set(),consumed=new WeakSet();let disposed=false,started=0;
 function live(){if(disposed)throw Error('Conquest wave audio disposed');current();}
 function cleanup(entry){if(entry.ended)return;entry.ended=true;entries.delete(entry);sources.delete(entry.source);sourceKeys.delete(entry.source);entry.source.disconnect();}
 function stop(){const errors=[];for(const entry of [...entries]){try{entry.source.stop();}catch(error){errors.push(error);}try{cleanup(entry);}catch(error){errors.push(error);}}if(errors.length)throw new AggregateError(errors,'Conquest wave audio stop failed');}
 function dispose(){if(disposed)return;disposed=true;signal?.removeEventListener('abort',dispose);stop();}
 const api=Object.freeze({
  play(request){
   live();if(!request||typeof request!=='object')throw Error('Actual Conquest wave request required');
   if(!request.sound)return {accepted:false,reason:'source-row-without-sound'};
   const rows=CONQUEST_SOURCE_DATA.waveRows.filter(row=>Number(row.round)===request.round),raw=rows[request.index];
   if(request.sound!==CONQUEST_WAVE_SOUND.path||!raw||raw.sound_event!==request.sound||Number(raw.recall_time)!==3000||Number(raw.event_type)!==0||Number(raw.string_event)!==843||request.sourceEvent?.type!==0||request.sourceEvent.stringId!==843||!Number.isInteger(request.elapsedMs)||request.elapsedMs<=3000||!request.raw||Object.keys(request.raw).length!==Object.keys(raw).length||Object.keys(raw).some(key=>request.raw[key]!==raw[key]))throw Error('Exact emitted Conquest source wave sound request required');
   if(consumed.has(request))throw Error('Conquest wave sound request already consumed');
   if(context.state!=='running')throw Error('S5 audio context must be resumed before wave sound playback');
   const source=context.createBufferSource(),entry={source,ended:false};source.buffer=buffer;source.loop=false;source.connect(gain);source.onended=()=>cleanup(entry);entries.add(entry);sources.add(source);sourceKeys.set(source,'conquest-wave:'+request.sound);
   try{source.start();}catch(error){cleanup(entry);throw error;}
   consumed.add(request);started++;return {accepted:true,audible:gain.gain.value!==0,path:request.sound,round:request.round,policy:CONQUEST_WAVE_AUDIO_POLICY};
  },
  stop(){live();stop();},
  snapshot(){live();return {prepared:true,started,playing:entries.size,policy:CONQUEST_WAVE_AUDIO_POLICY};},
  dispose,
 });
 signal?.addEventListener('abort',dispose,{once:true});return api;
}
