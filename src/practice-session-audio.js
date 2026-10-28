// Exact original three OGGs; shared GameAudio owns the AudioContext and gain.
// Missing sentrygun_loop is not replaced with another sound. Spatial mixing
// and native sound scheduling remain unverified adaptation boundaries.
export async function createPracticeSessionAudio({context,getGain,assetRoot='/assets/s5runtime/practice',fetchAsset=globalThis.fetch,onUnknown=()=>{}}){
 if(!context||typeof context.decodeAudioData!=='function'||typeof context.createBufferSource!=='function'||typeof context.createGain!=='function'||typeof getGain!=='function')throw Error('Actual shared AudioContext and sfx gain service required');
 const buffers=new Map(),playing=new Map();let disposed=false,epoch=0;
 for(const name of ['bsentrygun_loading','sentrygun_blast','sentrygun_die']){const url=assetRoot+'/sound/'+name+'.ogg',response=await fetchAsset(url);if(!response.ok)throw Error('Practice sound unavailable '+url);buffers.set(name,await context.decodeAudioData(await response.arrayBuffer()));}
 function stopActor(actorId,generation){const key=actorId+':'+generation;for(const item of playing.get(key)||[]){item.source.onended=null;try{item.source.stop();}finally{item.source.disconnect();item.gain.disconnect();}}playing.delete(key);}
 function cue(event){if(disposed)return;if(event.type==='clear-actor-cues'){stopActor(event.actorId,event.actorGeneration);return;}
  if(event.type!=='sound'||!event.resource)return;const name=event.resource.split('/').at(-1).replace(/\.ogg$/i,''),buffer=buffers.get(name);if(!buffer){onUnknown({port:'sound',resource:event.resource,nativeReady:false});return;}
  if(event.operation!=='play')return;const level=getGain();if(!Number.isFinite(level)||level<0)throw Error('Actual nonnegative sfx gain required');
  const source=context.createBufferSource(),gain=context.createGain(),key=event.actorId+':'+event.actorGeneration,item={source,gain,name};source.buffer=buffer;gain.gain.value=level;source.connect(gain);gain.connect(context.destination);if(!playing.has(key))playing.set(key,new Set());playing.get(key).add(item);
  const startEpoch=epoch;source.onended=()=>{if(startEpoch===epoch){playing.get(key)?.delete(item);if(!playing.get(key)?.size)playing.delete(key);}source.disconnect();gain.disconnect();};source.start();
 }
 return {cue,updateGain(){if(disposed)return;const level=getGain();if(!Number.isFinite(level)||level<0)throw Error('Actual nonnegative sfx gain required');for(const items of playing.values())for(const item of items)item.gain.gain.value=level;},readStatus(actorId,generation){const items=[...(playing.get(actorId+':'+generation)||[])];return {normalSoundPlaying:null,attackSoundPlaying:items.some(i=>i.name==='sentrygun_blast')};},stopActor,reset(){epoch++;for(const key of [...playing.keys()]){const at=key.lastIndexOf(':');stopActor(key.slice(0,at),Number(key.slice(at+1)));}},dispose(){if(disposed)return;this.reset();disposed=true;buffers.clear();},get playingCount(){return [...playing.values()].reduce((n,s)=>n+s.size,0);},nativeReady:false,status:'original OGG playback; flat shared sfx gain, spatial/native scheduler unverified; normal loop absent'};
}
