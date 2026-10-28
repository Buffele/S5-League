import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {NATIVE_RIFLE_RANGE} from './native-rifle-range-data.js';
export {NATIVE_RIFLE_RANGE};
export const INITIAL_RIFLE_RANGE=NATIVE_RIFLE_RANGE.initialNativeLimit*SCN_SCENE_SCALE;

// 861D60 clamps RayDistanceLimit to native map fog/cull limits and option33.
// Presentation fog, camera far-plane and visual presets do not change combat.
export function nativeRifleDistance(profile,option33=NATIVE_RIFLE_RANGE.referenceOption33){
 if(!Number.isFinite(option33)||option33<=0)throw Error('Finite positive native view distance required');
 if(profile===null)return NATIVE_RIFLE_RANGE.initialNativeLimit;
 if(!profile||!['fogMaxDist','cullDist'].every(key=>Number.isFinite(profile[key])&&profile[key]>0))throw Error('Native map range profile required');
 return Math.min(Math.fround(profile.fogMaxDist),Math.fround(profile.cullDist),Math.fround(option33));
}
export function rifleRangeForWorld(world){
 const profile=world.nativeRifleRangeProfile??Object.values(NATIVE_RIFLE_RANGE.profiles).find(p=>p.nativeMapId===world.nativeMapId)??null;
 return nativeRifleDistance(profile,world.nativeViewDistance??NATIVE_RIFLE_RANGE.referenceOption33)*SCN_SCENE_SCALE;
}
