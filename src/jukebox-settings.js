import {JUKEBOX_DATA} from './options-jukebox-data.js';import {JUKEBOX_DEFAULTS,validPlaylist} from './jukebox-playlist.js';
const copy=value=>({...value,slots:[...value.slots]});
export function createJukeboxSettings({initial=JUKEBOX_DEFAULTS,setPlaylistRecord,previewTrack,stopPreview,getPlayback,subscribePlayback,randomAvailable=false}={}){
 if(!validPlaylist(initial))throw TypeError('Authenticated current playlist record required');
 if([setPlaylistRecord,previewTrack,stopPreview,getPlayback,subscribePlayback].some(fn=>typeof fn!=='function'))throw TypeError('One actual BGM session and its callbacks required');
 let current=copy(initial),disposed=false,error=null,revision=0;const listeners=new Set(),catalog=JUKEBOX_DATA.catalog;
 const snapshot=()=>({current:copy(current),playback:getPlayback(),available:!disposed,randomAvailable:!disposed&&randomAvailable,error,revision});
 const notify=()=>{revision++;for(const fn of [...listeners])fn(snapshot());};const off=subscribePlayback(notify);
 const api={snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},writeCurrent(value){if(disposed)return {accepted:false,reason:'disposed'};if(!validPlaylist(value))return {accepted:false,reason:'invalid-playlist'};if(value.random&&!randomAvailable)return {accepted:false,reason:'rng-unavailable'};
   try{const result=setPlaylistRecord(copy(value));if(result?.then)throw Error('Synchronous playlist registration required');if(result===false||result?.accepted===false)return {accepted:false,reason:result?.reason??'playlist-consumer-rejected'};current=copy(value);error=null;notify();return {accepted:true,persisted:null};}catch(cause){error=String(cause);notify();return {accepted:false,reason:'playlist-consumer-failed'};}
  },async preview(key){if(disposed)return {accepted:false,reason:'disposed'};const track=catalog.find(row=>row.key===key);if(!track)return {accepted:false,reason:'unknown-source-track'};if(!track.published)return {accepted:false,reason:'track-not-published'};
   try{const result=await previewTrack(key);if(disposed)return {accepted:false,reason:'disposed'};error=null;notify();return {accepted:true,playback:result};}catch(cause){if(disposed)return {accepted:false,reason:'disposed'};error=String(cause);notify();return {accepted:false,reason:'preview-consumer-failed'};}
  },stop(){if(disposed)return {accepted:false,reason:'disposed'};try{const result=stopPreview('jukebox-stop-button');error=null;notify();return {accepted:true,playback:result};}catch(cause){error=String(cause);notify();return {accepted:false,reason:'preview-stop-failed'};}},
  dispose(){if(disposed)return;disposed=true;try{stopPreview('s5-jukebox-dispose');}catch(cause){error=String(cause);}finally{off();listeners.clear();}},
 };return Object.freeze(api);
}
