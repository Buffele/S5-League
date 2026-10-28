// Copied S5Runtime live comparisons20261016, native-all/{all-male,
// katana-current-counter-male,released-right-pilot}. These are airborne
// Counter-guard Dodge entries, with real selected-slot/state observations.
// VitalShock2000065 reports native type20 rather than its script type54;
// do not substitute Assassin Claw's permission for that unresolved factory.
const primary=Object.freeze({
 counter:'long',katana:'long',demonicknuckle:'short',bat:'classified',plasma:'classified',
 dagger:'held',assassinclaw:'held',
 submachinegun:'held',revolver:'held',semirifle:'held',smashrifle:'held',
 handgun:'held',burstshotgun:'held',assaultrifle:'held',airgun:'held',
 cannonade:'held',rocketlauncher:'held',
});
export function canCarryDodgePrimary(weapon){return Object.hasOwn(primary,weapon);}
export function dodgePrimaryRequest(weapon,input){
 const mode=primary[weapon];
 if(mode==='held')return input.light?'light':null;
 if((mode==='long'||mode==='classified')&&input.lightLong)return weapon==='counter'?'heavy':'strong';
 if((mode==='short'||mode==='classified')&&input.lightShort)return 'light';
 return null;
}
