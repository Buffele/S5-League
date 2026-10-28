import {createAudioSettings} from './audio-settings.js';

// Current, cached weapons and separately prepared actor audio share one gain.
// Identity deduplication keeps shared instances from receiving it twice.
export function createGameAudioSettings({getCurrentAudio,getWeaponBundles,getAdditionalAudio=()=>[],initial=null}){
 if(typeof getCurrentAudio!=='function'||typeof getWeaponBundles!=='function'||typeof getAdditionalAudio!=='function')throw TypeError('Game audio accessors are required');
 return createAudioSettings({initial,sfxSink(gain){
  const instances=new Set([getCurrentAudio(),...Array.from(getWeaponBundles().values(),bundle=>bundle.audio),...getAdditionalAudio()]);
  for(const audio of instances)if(audio)audio.setVolume(gain);
  return true;
 }});
}
