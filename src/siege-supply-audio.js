// Exact native7D838D first-contact and7D7C23 local-pickup resources. Mixing uses the existing S5 SFX
// gain; native positional attenuation and sound-service scheduling are open.
export async function createSiegeSupplyAudio({context,getGain,fetchAsset=globalThis.fetch}={}){
 if(!context?.decodeAudioData||!context?.createBufferSource||!context?.createGain||typeof getGain!=='function')throw Error('Shared game audio context and SFX gain required');
 const buffers=Object.fromEntries(await Promise.all([['contact','item_drop'],['collect','item_gain']].map(async([key,name])=>{const response=await fetchAsset('/assets/siege-pickup-effects/sound/'+name+'.ogg');if(!response.ok)throw Error('Original Siege item sound unavailable '+name);return [key,await context.decodeAudioData(await response.arrayBuffer())];})));
 const bus=context.createGain(),playing=new Set(),played={contact:0,collect:0};let disposed=false;
 bus.connect(context.destination);
 function updateGain(){const gain=getGain();if(!Number.isFinite(gain)||gain<0||gain>1)throw Error('Authoritative SFX gain0..1 required');bus.gain.value=gain;}
 updateGain();
 function play(key){if(disposed||context.state!=='running')return false;updateGain();if(bus.gain.value===0)return false;const source=context.createBufferSource();source.buffer=buffers[key];source.connect(bus);playing.add(source);source.onended=()=>{playing.delete(source);source.disconnect();};source.start();played[key]++;return true;}
 const api={context,
  contact(){return play('contact');},collect(){return play('collect');},
  updateGain(){if(!disposed)updateGain();},
  reset(){for(const source of playing){source.onended=null;try{source.stop();}finally{source.disconnect();}}playing.clear();},
  snapshot(){return {disposed,activeSources:playing.size,gain:bus.gain.value,played:{...played},resources:['sound/item_drop.ogg','sound/item_gain.ogg'],nativeSpatialMixVerified:false};},
  dispose(){if(disposed)return;api.reset();disposed=true;bus.disconnect();},
 };return api;
}
