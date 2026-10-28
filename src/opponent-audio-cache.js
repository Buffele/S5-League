// Exact opponent weapon/body players on the game's shared AudioContext.
// Construction/prepare before a gesture never creates or unlocks a context.
export function createOpponentAudioCache({createAudio,getCurrentAudio,getWeaponAudio,getGain}={}){
 if([createAudio,getCurrentAudio,getWeaponAudio,getGain].some(port=>typeof port!=='function'))throw new TypeError('Explicit opponent audio factory, current audio, weapon audio and SFX gain ports required');
 const entries=new Map();let disposed=false;
 const live=()=>{if(disposed)throw new Error('Opponent audio cache is disposed');};
 const key=(weapon,sex)=>{
  if(typeof weapon!=='string'||!weapon.trim()||!['male','female'].includes(sex))throw new TypeError('Exact opponent weapon and male/female body required');
  return JSON.stringify([weapon,sex]);
 };
 const matches=(audio,weapon,sex)=>audio?.weapon===weapon&&audio?.sex===sex;
 const volume=audio=>{const gain=getGain();if(!Number.isFinite(gain)||gain<0||gain>1)throw new RangeError('Opponent SFX gain must be in [0,1]');audio.setVolume(gain);};
 const release=entry=>{if(!entry.owned)return;entry.audio.stop?.();entry.audio.gain?.disconnect?.();entry.audio.connected=false;};
 function activate(entry,context){
  const previous=entry.pending;
  if(previous&&entry.pendingContext===context)return previous;
  let task;
  task=Promise.resolve(previous).catch(()=>{}).then(async()=>{
   live();
   const audio=entry.audio;volume(audio);
   if(context){
    if(audio.context!==context){
     // A GainNode belongs to its creating context. Keep borrowed ownership,
     // but reconnect that player's bus when the caller replaces the context.
     audio.stop?.();audio.gain?.disconnect?.();audio.gain=null;audio.connected=false;audio.loading=null;audio.buffers?.clear?.();
     audio.context=context;
    }
    await audio.unlock();
    if(disposed){release(entry);live();}
    volume(audio);
   }
   live();entry.prepared=true;return audio;
  }).catch(error=>{
   if(entry.pending===task){entries.delete(entry.key);entry.prepared=false;release(entry);}
   throw error;
  }).finally(()=>{if(entry.pending===task){entry.pending=null;entry.pendingContext=null;}});
  entry.pending=task;entry.pendingContext=context;return task;
 }
 function prepare(weapon,sex){
  live();const identity=key(weapon,sex);let entry=entries.get(identity);
  if(!entry){
   const borrowed=getWeaponAudio(weapon,sex),owned=!matches(borrowed,weapon,sex),audio=owned?createAudio(weapon,sex):borrowed;
   if(!matches(audio,weapon,sex)||typeof audio.unlock!=='function'||typeof audio.setVolume!=='function')throw new TypeError('Opponent audio factory must return the exact weapon/body player');
   entry={key:identity,audio,owned,prepared:false,pending:null,pendingContext:null};entries.set(identity,entry);
  }
  return activate(entry,getCurrentAudio()?.context??null);
 }
 return Object.freeze({
  prepare,
  get(weapon,sex){live();const entry=entries.get(key(weapon,sex));if(!entry?.prepared)throw new Error(`Opponent audio not prepared: ${weapon}/${sex}`);return entry.audio;},
  values(){return new Set([...entries.values()].map(entry=>entry.audio)).values();},
  async unlock(context){
   live();if(!context)throw new TypeError('Existing shared AudioContext required');
   const seen=new Set();
   while(true){const batch=[...entries.values()].filter(entry=>!seen.has(entry));if(!batch.length)return;for(const entry of batch)seen.add(entry);await Promise.all(batch.map(entry=>activate(entry,context)));live();}
  },
  stop(){for(const audio of new Set([...entries.values()].map(entry=>entry.audio)))audio.stop?.();},
  dispose(){if(disposed)return;disposed=true;for(const entry of entries.values())release(entry);entries.clear();},
 });
}
