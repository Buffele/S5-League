import {loadGunParticleEffects} from './revolver-effects.js';
export function loadHandgunEffects(scene){return loadGunParticleEffects(scene,{weapon:'handgun',muzzle:'handgun_Fire_Dummy',root:'/assets/s5runtime/handgun/effects',followMuzzleSmoke:true});}
