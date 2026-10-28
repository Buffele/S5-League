import {loadGunParticleEffects} from './revolver-effects.js';
// Native particles are staged. Shared procedural tracers remain an explicit
// arena presentation pending weapon_assultgun_rail endpoint registration proof.
export function loadAssaultRifleEffects(scene){return loadGunParticleEffects(scene,{weapon:'assaultrifle',muzzle:'assult_Fire_Dummy',root:'/assets/s5runtime/assault-rifle/effects'});}
