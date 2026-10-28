import {BURST_SHOTGUN_SOURCE as source} from './burst-shotgun-data.js';
// Both records share the caller gates. Their filenames do not encode an
// airborne selector. Audio playback belongs to the game-audio owner.
export function burstShotgunBlastSounds({soundsEnabled,positionedSound}={}){
 if(typeof soundsEnabled!=='boolean'||typeof positionedSound!=='boolean')throw new TypeError('Explicit Burst sound gates required');
 return soundsEnabled?source.blastBindings.map(b=>({index:b.index,file:b.soundAsset,source:b.sound,attachNode:b.attachNode,positionedSound,nativeReady:false})):[];
}
