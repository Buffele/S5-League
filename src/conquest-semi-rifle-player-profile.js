// Original factory803A12/802677 registers weapon4, independently of weapon2.
// See conquest-semi-rifle-20261023/action-proof.json and source.json. The
// existing Semi adapter predates runtime.profile; its retained Controller owner
// supplies identity, while this predicate refuses unsupported runtime shapes.
export const CONQUEST_SEMI_RIFLE_PLAYER_ACTION_SOURCE=Object.freeze({weaponType:4,fireClass:'CAttackPistolShotState',fireVtable:0x13b0b6c,reloadClass:'CReloadState',reloadVtable:0x13b5ef0,fireFactory:0x803a12,reloadFactory:0x802677,stateWidth68:Math.fround(.7),stateHeight6c:1,nativeStateSelectionObserved:false,nativeReady:false});
export function assertConquestSemiRifleRuntime(runtime){
 if(!runtime||Object.getPrototypeOf(runtime)!==Object.prototype||runtime.profile!==undefined||runtime.capacity!==30||runtime.muzzle!=='Smg_02_Fire_Dummy'||runtime.shotDelay!==.01||typeof runtime.zoom!=='boolean'||!['idle','fire','reload'].includes(runtime.phase)||!Array.isArray(runtime.pendingShots)||!Number.isSafeInteger(runtime.shotSerial)||runtime.shotSerial<0||!Number.isSafeInteger(runtime.serial)||runtime.serial<0||!Number.isInteger(runtime.ammo)||runtime.ammo<0||runtime.ammo>30||!Number.isFinite(runtime.timeMs)||runtime.timeMs<0||!Number.isFinite(runtime.cooldownMs))throw Error('Actual supported Semi Rifle runtime shape required');
 return runtime;
}
