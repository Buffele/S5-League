// Copied S5Runtime,20261016:23 families x2 rigs, held/fresh right before/after
// equipment. Proof: tests/fixtures/native/dodge-secondary-entry-20261016.json.
// A held guard handoff enters USE_WEAPON2 directly. Fresh right in Dodge
// has its own permissions; never grant a ground attack throughout flight.
const held=Object.freeze({
 counter:'guard',katana:'backdash',twinblade:'charge',breaker:'charge',
 sigmablade:'heavy',deathscythe:'heavy',ironboots:'boost',demonicknuckle:'heavy',
 dagger:'rush',bat:'heavy',plasma:'heavy',rocketlauncher:'preload',
 assassinclaw:'empty',submachinegun:'empty',revolver:'empty',semirifle:'empty',
 smashrifle:'empty',handgun:'empty',burstshotgun:'empty',assaultrifle:'empty',
 airgun:'empty',cannonade:'empty',
 // Vital modern factory54 remains unresolved: actual item uses family20.
});
const fresh=Object.freeze({counter:'guard',katana:'backdash',twinblade:'charge',
 breaker:'charge',sigmablade:'heavy',ironboots:'boost',smashrifle:'secondary',rocketlauncher:'preload'});
export const guardDodgeSecondaryKind=weapon=>held[weapon]??null;
export function dodgeSecondaryRequest(weapon,input,hasAttack=false){
 return !hasAttack&&(input.heavy||input.heavyHeld&&!input.heavyReleased)?fresh[weapon]??null:null;
}
