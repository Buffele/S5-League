// Main supplies GameAudio.unlockContext; this bridge never creates a context/player/gain.
// It closes the user-gesture await race before the existing BGM session sees a request.
export function createJukeboxAudioBridge({session,unlockContext}={}){
 if(!session?.previewTrack||!session?.stopPreview||!session?.setPlaylistRecord||typeof unlockContext!=='function')throw TypeError('Existing BGM session and shared GameAudio unlock required');let disposed=false,serial=0;
 return Object.freeze({setPlaylistRecord:value=>disposed?{accepted:false,reason:'disposed'}:session.setPlaylistRecord(value),getPlayback:()=>session.snapshot(),subscribePlayback:fn=>session.subscribe(fn),
  async previewTrack(key){const token=++serial;if(disposed)return session.snapshot();await unlockContext();if(disposed||token!==serial)return session.snapshot();return session.previewTrack(key);},
  stopPreview(reason){serial++;return session.stopPreview(reason);},dispose(){if(disposed)return;disposed=true;serial++;session.stopPreview('s5-jukebox-bridge-dispose');},
 });
}
