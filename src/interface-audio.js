import {INTERFACE_TRACKS,XUI_AUDIO_BINDINGS} from './interface-audio-data.js';

// These callbacks are an explicitly selected native base-window contract.
// They are not success/failure/transition cues and are never global fallbacks.
export function resolveNativeBaseButton({nativeCallback,enabled,isButtonType,mouseButton}={}) {
  if(enabled!==true||isButtonType!==true) return {status:'suppressed',reason:'native-button-condition-false'};
  if(nativeCallback==='974910' && mouseButton===0) return {status:'mapped',path:'sound/interface/mouse_click.ogg',source:'PE11BDBE0 event4 on_mouse_up →973B20→974910: enabled CGUI_Button-derived type, button0'};
  if(nativeCallback==='974970') return {status:'mapped',path:'sound/interface/mouse_enter.ogg',source:'PE11BB480 event7 on_mouse_enter →973D70→974970: enabled CGUI_Button-derived type'};
  return {status:'suppressed',reason:'native-button-phase-or-button-not-mapped'};
}

export function resolveInterfaceAudio(event={}) {
  // S5 design adaptation, explicitly separate from recovered native widgets.
  // Reuse the authenticated base samples; do not infer new native bindings.
  if(event.kind==='s5-lobby-presentation') {
    const path=event.phase==='click'?'sound/interface/mouse_click.ogg':event.phase==='hover'?'sound/interface/mouse_enter.ogg':null;
    return Object.freeze(path?{status:'mapped',path,source:'S5 lobby presentation adaptation'}:{status:'unknown',reason:'s5-presentation-phase-unavailable'});
  }
  if(event.kind==='native-base-button') return Object.freeze(resolveNativeBaseButton(event));
  if(event.kind==='xui') {
    const rows=XUI_AUDIO_BINDINGS.filter(b=>b.xui===event.xui&&b.nodePath===event.nodePath&&b.event===event.phase);
    if(!rows.length) return Object.freeze({status:'unknown',reason:'xui-event-binding-not-established'});
    const paths=[...new Set(rows.map(r=>r.path))];
    if(paths.length!==1) return Object.freeze({status:'unknown',reason:'xui-event-binding-ambiguous'});
    const path=paths[0];
    return Object.freeze({status:INTERFACE_TRACKS[path]?'mapped':'unavailable',path,reason:INTERFACE_TRACKS[path]?null:'exact-source-resource-missing',source:rows[0]});
  }
  if(event.kind==='equipment') return Object.freeze({status:'unknown',reason:'native-equipment-outcome-audio-not-established',outcome:event.status??null});
  if(event.kind==='session') return Object.freeze({status:'unknown',reason:'native-session-transition-audio-not-established',phase:event.phase??null});
  return Object.freeze({status:'unknown',reason:'interface-audio-event-not-established'});
}

/** One-shot SFX bus on the caller's existing context. SFX gain is always read
 * from the caller's authoritative audio settings, never a second preference. */
export function createInterfaceAudio({context,destination=context?.destination,getSfxGain,resolveUrl,fetchImpl=globalThis.fetch,isCurrent=()=>true}={}) {
  if(!context?.createGain||!context?.createBufferSource||!context?.decodeAudioData) throw new TypeError('Existing AudioContext required');
  if(typeof getSfxGain!=='function'||typeof resolveUrl!=='function'||typeof fetchImpl!=='function'||typeof isCurrent!=='function') throw new TypeError('SFX getter, URL resolver, fetch and current-context guard required');
  const bus=context.createGain();bus.connect(destination);
  const cache=new Map(),pending=new Map(),sources=new Set(),listeners=new Set();
  let epoch=0,disposed=false,connected=true;
  let state={status:'idle',path:null,reason:null,error:null,revision:0};
  const snapshot=()=>Object.freeze({...state,connected,audioGain:bus.gain.value,activeSources:sources.size,pendingLoads:pending.size});
  function emit(patch){state={...state,...patch,revision:state.revision+1};const v=snapshot();for(const fn of [...listeners])try{fn(v);}catch{}return v;}
  function applyVolume(){
    if(disposed)return false;const value=getSfxGain();
    if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Authoritative SFX gain must be 0..1');
    bus.gain.setValueAtTime(value,context.currentTime);return true;
  }
  async function load(path,token){
    if(cache.has(path))return cache.get(path);
    if(pending.has(path))return pending.get(path).promise;
    const controller=new AbortController();const record={controller,promise:null};
    record.promise=(async()=>{
      const response=await fetchImpl(resolveUrl(INTERFACE_TRACKS[path]),{signal:controller.signal});
      if(token!==epoch) return null;
      if(!response.ok)throw new Error(`Interface audio HTTP ${response.status}`);
      const bytes=await response.arrayBuffer();if(token!==epoch)return null;
      const buffer=await context.decodeAudioData(bytes);if(token!==epoch)return null;
      if(!Number.isFinite(buffer?.duration)||buffer.duration<=0)throw new Error('Invalid interface audio duration');
      cache.set(path,buffer);return buffer;
    })().finally(()=>{if(pending.get(path)===record)pending.delete(path);});
    pending.set(path,record);return record.promise;
  }
  function stop(reason='s5-ui-lifecycle-cancel') {
    if(disposed)return snapshot();epoch++;
    for(const r of pending.values())r.controller.abort();pending.clear();
    for(const source of sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}sources.clear();
    return emit({status:'idle',reason,error:null,path:null});
  }
  const api={
    snapshot,applyVolume,
    subscribe(fn){if(typeof fn!=='function')throw new TypeError('Listener required');listeners.add(fn);return()=>listeners.delete(fn);},
    async notify(event){
      if(disposed)return Object.freeze({status:'disposed'});
      const cue=resolveInterfaceAudio(event);if(cue.status!=='mapped')return Object.freeze({...cue});
      if(context.state!=='running')return emit({status:'blocked',path:cue.path,reason:`audio-context-${context.state}`,error:null});
      const token=epoch;emit({status:'loading',path:cue.path,reason:null,error:null});
      let source=null;
      try{
        // The owner may replace its shared context while this sample decodes.
        // Its current-context guard complements this bus's own stop epoch.
        const buffer=await load(cue.path,token);if(disposed||token!==epoch||!buffer||!isCurrent())return Object.freeze({status:'cancelled'});
        if(context.state!=='running')return emit({status:'blocked',reason:`audio-context-${context.state}`});
        applyVolume();source=context.createBufferSource();source.buffer=buffer;source.loop=false;source.connect(bus);sources.add(source);
        source.onended=()=>{if(!sources.delete(source))return;source.onended=null;source.disconnect();emit({status:sources.size?'playing':'idle'});};
        source.start();return emit({status:'playing',path:cue.path,reason:null,error:null});
      }catch(error){
        if(source){sources.delete(source);source.onended=null;try{source.stop();}catch{}source.disconnect();}
        if(disposed||token!==epoch||!isCurrent())return Object.freeze({status:'cancelled'});
        return emit({status:'error',path:cue.path,reason:'interface-audio-load-or-play-failed',error:String(error?.message||error)});
      }
    },
    stop,
    dispose(){if(disposed)return;stop('dispose');disposed=true;bus.disconnect();connected=false;cache.clear();emit({status:'disposed'});listeners.clear();},
  };
  applyVolume();return Object.freeze(api);
}
