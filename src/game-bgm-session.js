import {MAPS} from './imported-map.js';
import {validPlaylist,JUKEBOX_DEFAULTS} from './jukebox-playlist.js';

// The presentation scenes explicitly derive from the imported maps.
// The local training arena has no native map identity or substitute playlist.
export function gameBgmMapIdentity(scene){
 if(scene==='conquest-46')return Object.freeze({nativeMapId:46,sourceMap:'conquest-46',presentationAdaptation:false});
 const key=scene==='station2-modular'?'station2':scene==='circle2-classic'?'circle2':scene;
 const map=MAPS[key];
 return map?Object.freeze({nativeMapId:map.nativeMapId,sourceMap:key,presentationAdaptation:['station2-modular','circle2'].includes(scene)}):null;
}

/** Main owns the single AudioContext. Opening S5 menus/lab pauses its current
 * music; returning to the same map resumes it. This is an explicit S5 lifecycle
 * policy, not a reconstruction of S5Runtime's still-unresolved menu transition.
 */
export function createGameBgmSession({createPlayer,getContext,audioSettings,onError=()=>{}}){
 if(typeof createPlayer!=='function'||typeof getContext!=='function'||typeof audioSettings?.setSink!=='function')throw TypeError('BGM player, context and audio settings are required');
 let player=null,context=null,surface='menu',scene=null,routeKey=null,disposed=false,serial=0,error=null;
 let playlistRecord={...JUKEBOX_DEFAULTS,slots:[...JUKEBOX_DEFAULTS.slots]},playlistDirty=false,previewSerial=0,offPlayer=null;const listeners=new Set();const notify=()=>{for(const fn of [...listeners])fn(snapshot());};
 const snapshot=()=>Object.freeze({policy:'s5-menu-lab-pause-and-resume-v1',surface,scene,mapIdentity:gameBgmMapIdentity(scene),unlocked:!!player,disposed,error,playlistRecord:playlistRecord?{...playlistRecord,slots:[...playlistRecord.slots]}:null,playlistDirty,previewPolicy:'s5-single-player-suspend-and-restore-paused',player:player?.snapshot()??null});
 async function apply(){
  const token=++serial;
  if(!player||disposed)return snapshot();
  try{
   error=null;
   if(surface!=='game'){
    if(routeKey!==null)player.pause();
    else await player.setRoute({kind:'menu'});
   }else{
    const identity=gameBgmMapIdentity(scene);
    if(!identity){routeKey=null;player.stop('no-native-map-identity');}
    else{
     const nextKey=`map:${identity.nativeMapId}`;
     if(routeKey!==nextKey||playlistDirty){routeKey=nextKey;playlistDirty=false;await player.setRoute({kind:'map',nativeMapId:identity.nativeMapId});}
     else if(player.snapshot().status==='paused')await player.resume();
    }
   }
  }catch(cause){
   if(token===serial&&!disposed){error=String(cause);routeKey=null;onError(cause);}
  }
  notify();return snapshot();
 }
 const api={
  snapshot,
  subscribe(fn){if(typeof fn!=='function')throw TypeError('Session listener required');listeners.add(fn);return()=>listeners.delete(fn);},
  setPlaylistRecord(value){
   if(disposed)return {accepted:false,reason:'disposed'};if(value?.random===true)return {accepted:false,reason:'rng-unavailable'};if(!validPlaylist(value))return {accepted:false,reason:'invalid-playlist'};
   const result=player?.setPlaylistRecord?.(value);if(player&&(!result||result.accepted===false))return {accepted:false,reason:result?.reason??'playlist-api-unavailable'};
   const changed=JSON.stringify([playlistRecord.slots,playlistRecord.random])!==JSON.stringify([value.slots,value.random]);playlistRecord={...value,slots:[...value.slots]};playlistDirty=playlistDirty||changed;notify();return {accepted:true,changed,policy:'s5-apply-playlist-on-game-resume'};
  },
  async previewTrack(key){const token=++previewSerial;if(disposed)return snapshot();if(!player)await api.unlock();if(disposed||token!==previewSerial)return snapshot();if(!player)throw Error('Shared game audio context unavailable');return player.previewTrack(key);},
  stopPreview(reason='s5-jukebox-stop'){previewSerial++;return player?.stopPreview(reason)??snapshot();},
  setSurface(nextSurface,nextScene=scene){
   if(disposed)return Promise.resolve(snapshot());
   if(!['menu','game','lab'].includes(nextSurface)||typeof nextScene!=='string')throw TypeError('Valid BGM surface and scene are required');
   previewSerial++;player?.stopPreview?.('s5-surface-transition');surface=nextSurface;scene=nextScene;return apply();
  },
  unlock(){
   if(disposed)return Promise.resolve(snapshot());
   const current=getContext();
   if(!current)return Promise.resolve(snapshot());
   if(player&&current!==context)throw Error('BGM must retain the shared game AudioContext');
   if(!player){
    context=current;player=createPlayer({context,destination:context.destination});
    if(playlistRecord&&player.setPlaylistRecord){const ack=player.setPlaylistRecord(playlistRecord);if(ack?.accepted===false)throw Error(ack.reason);}
    offPlayer=player.subscribe?.(notify)??null;
    audioSettings.setSink('bgm',gain=>{if(disposed)return false;player.setVolume(gain);return true;});
   }
   return apply();
  },
  dispose(){
   if(disposed)return;
   disposed=true;serial++;previewSerial++;offPlayer?.();audioSettings.setSink('bgm',null);player?.dispose();listeners.clear();
  },
 };return Object.freeze(api);
}
