import {BGM_TRACKS, resolveBgmRoute} from './game-bgm-data.js';
import {validPlaylist,createJukeboxQueue} from './jukebox-playlist.js';

/** WebAudio transport for sourced playlists. Pause/resume offsets and aborts are
 * S5 browser lifecycle policy, not a claim about the native menu transition. */
export function createGameBgm({context, destination=context?.destination, fetchImpl=globalThis.fetch, resolveUrl,nextInt=null,rngPolicy=null}={}) {
  if (!context?.createGain || !context?.decodeAudioData || !context?.createBufferSource) throw new TypeError('Existing AudioContext required');
  if (typeof fetchImpl !== 'function' || typeof resolveUrl !== 'function') throw new TypeError('fetchImpl and resolveUrl required');
  const gainNode=context.createGain(); gainNode.connect(destination); let connected=true;
  const listeners=new Set(), cache=new Map();
  let source=null, controller=null, generation=0, route=null, index=0, buffer=null, startedAt=0, offset=0;
  let mapRecord=null,queue=null,previewBookmark=null;
  let state={status:'idle',routeKey:null,trackKey:null,index:null,offset:0,gain:1,reason:null,error:null,revision:0};
  const elapsed=()=>source ? Math.min(buffer.duration, offset+Math.max(0,context.currentTime-startedAt)) : offset;
  const snapshot=()=>Object.freeze({...state,offset:elapsed(),audioGain:gainNode.gain.value,connected,preview:previewBookmark!==null,previewPolicy:previewBookmark?'s5-single-player-suspend-and-restore-paused':null});
  function emit(patch) {
    state={...state,...patch,revision:state.revision+1};
    const value=snapshot(); for(const fn of [...listeners]) { try { fn(value); } catch { /* observer cannot break transport */ } }
    return value;
  }
  function detach() {
    const old=source; source=null;
    if(old) { old.onended=null; try { old.stop(); } catch { /* already ended */ } old.disconnect(); }
  }
  function cancel() { generation++; controller?.abort(); controller=null; detach(); }
  const live=()=>state.status!=='disposed';
  async function play() {
    if(!live()) return snapshot();
    if(context.state==='closed') return emit({status:'error',error:'AudioContext closed',reason:'audio-context-closed'});
    if(context.state!=='running') return emit({status:'blocked',reason:'audio-context-suspended',error:null});
    const key=route.tracks[index],track=BGM_TRACKS[key];
    if(!track)return emit({status:'blocked',trackKey:key,index,reason:'jukebox-track-not-published',error:null});
    const token=++generation;
    controller?.abort(); controller=new AbortController();
    emit({status:'loading',trackKey:key,index,reason:null,error:null});
    try {
      let decoded=cache.get(key);
      if(!decoded) {
        const response=await fetchImpl(resolveUrl(track),{signal:controller.signal});
        if(token!==generation) return snapshot();
        if(!response.ok) throw new Error(`BGM HTTP ${response.status}`);
        const bytes=await response.arrayBuffer();
        if(token!==generation) return snapshot();
        decoded=await context.decodeAudioData(bytes);
        if(token!==generation) return snapshot();
        if(!Number.isFinite(decoded?.duration)||decoded.duration<=0) throw new Error('Invalid decoded BGM duration');
        cache.set(key,decoded);
      }
      if(token!==generation) return snapshot();
      controller=null; buffer=decoded;
      if(context.state!=='running') return emit({status:context.state==='closed'?'error':'blocked',reason:`audio-context-${context.state}`,error:context.state==='closed'?'AudioContext closed':null});
      if(offset>=buffer.duration) offset=0;
      const next=context.createBufferSource(); next.buffer=buffer; next.loop=route.bufferLoop===true; next.connect(gainNode);
      next.onended=()=>{
        if(source!==next||token!==generation||state.status!=='playing'||route.bufferLoop===true) return;
        source=null; next.onended=null; next.disconnect(); offset=0;
        // Native map controller checks the completed handle then advances the queue.
        index=queue?queue.next().index:(index+1)%route.tracks.length;
        void play();
      };
      source=next; startedAt=context.currentTime; next.start(0,offset);
      return emit({status:'playing',reason:null,error:null});
    } catch(error) {
      if(token!==generation) return snapshot();
      controller=null; detach();
      return emit({status:'error',reason:'bgm-load-or-play-failed',error:String(error?.message||error)});
    }
  }
  const api={
    snapshot,
    subscribe(fn) { if(typeof fn!=='function') throw new TypeError('Listener required'); listeners.add(fn); return ()=>listeners.delete(fn); },
    async setRoute(value) {
      if(!live()) return snapshot();
      const original=resolveBgmRoute(value);
      const selected=value?.kind==='map'&&value.nativeMapId===66&&mapRecord?{...original,key:JSON.stringify([mapRecord.slots,mapRecord.random])===JSON.stringify([['OP_0030','OP_0039',''],false])?original.key:'map:66:jukebox:'+JSON.stringify([mapRecord.slots,mapRecord.random]),tracks:[...mapRecord.slots],jukeboxRecord:mapRecord}:original;
      if(route?.key===selected.key && ['playing','loading','paused'].includes(state.status)) return snapshot();
      cancel();previewBookmark=null;route=selected;queue=selected.jukeboxRecord?createJukeboxQueue(selected.jukeboxRecord,{nextInt,rngPolicy}):null;index=queue?.next()?.index??0;offset=0;buffer=null;
      emit({routeKey:route.key,trackKey:null,index:null,offset:0,error:null,reason:null});
      if(!route.tracks.some(Boolean))return emit({status:'blocked',reason:route.reason??'jukebox-playlist-empty'});
      return play();
    },
    setPlaylistRecord(value){
      if(!live())return {accepted:false,reason:'disposed'};
      if(!validPlaylist(value))return {accepted:false,reason:'invalid-playlist'};
      if(value.random&&(typeof nextInt!=='function'||!rngPolicy))return {accepted:false,reason:'rng-unavailable'};
      const changed=!mapRecord||JSON.stringify([mapRecord.slots,mapRecord.random])!==JSON.stringify([value.slots,value.random]);mapRecord={...value,slots:[...value.slots]};
      return {accepted:true,changed,policy:'s5-apply-playlist-on-game-resume'};
    },
    async previewTrack(key){
      if(!live())return snapshot();if(!BGM_TRACKS[key])throw Error('Jukebox track not published');
      if(route?.key==='preview:'+key&&['playing','loading'].includes(state.status))return snapshot();
      if(!previewBookmark)previewBookmark={route,index,offset:elapsed(),buffer,queue};
      cancel();route={key:'preview:'+key,tracks:[key],bufferLoop:true};queue=null;index=0;offset=0;buffer=null;
      emit({routeKey:route.key,trackKey:key,index:0,offset:0,error:null,reason:null});return play();
    },
    stopPreview(reason='s5-jukebox-preview-stop'){
      if(!live()||!previewBookmark)return snapshot();const saved=previewBookmark;cancel();previewBookmark=null;
      ({route,index,offset,buffer,queue}=saved);
      return emit({status:route?.tracks.some(Boolean)?'paused':'idle',routeKey:route?.key??null,trackKey:route?.tracks[index]??null,index:route?index:null,offset,reason,error:null});
    },
    pause() {
      if(!live()||!['playing','loading'].includes(state.status)) return snapshot();
      offset=elapsed(); cancel(); return emit({status:'paused',reason:'s5-pause-policy'});
    },
    async resume() {
      if(!live()||!route?.tracks.length||!['paused','blocked','error'].includes(state.status)) return snapshot();
      return play();
    },
    stop(reason='s5-stop-policy') {
      if(!live()) return snapshot(); cancel();previewBookmark=null;queue=null;route=null;offset=0;buffer=null;
      return emit({status:'idle',routeKey:null,trackKey:null,index:null,offset:0,reason,error:null});
    },
    setVolume(value) {
      if(!Number.isFinite(value)||value<0||value>1) throw new RangeError('BGM gain must be 0..1');
      if(!live()) return false;
      gainNode.gain.setValueAtTime(value,context.currentTime); emit({gain:value}); return true;
    },
    dispose() {
      if(!live()) return; cancel();previewBookmark=null;queue=null;mapRecord=null;offset=0;buffer=null;route=null;cache.clear(); gainNode.disconnect(); connected=false;
      emit({status:'disposed',routeKey:null,trackKey:null,index:null,offset:0}); listeners.clear();
    },
  };
  return Object.freeze(api);
}
