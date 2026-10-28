import {ASSAULT_RIFLE} from './assault-rifle-runtime.js';
// Original SelectByWeapon factory80415A/802C26 selects the EQUIPMENT type34.
// Independently, StandardClassicRifle and570FFE feed ATTACK type2 to damage.
// The two identities must never substitute for each other.
export const CONQUEST_ASSAULT_RIFLE_PLAYER_ACTION_SOURCE=Object.freeze({itemKey:2010024,equipmentWeaponType:34,attackWeaponType:2,attackAttribute:85,fireClass:'CAttackPistolShotState',fireVtable:0x13b0b6c,reloadClass:'CReloadState',reloadVtable:0x13b5ef0,fireFactory:0x80415a,reloadFactory:0x802c26,stateWidth68:Math.fround(.7),stateHeight6c:1,nativeStateSelectionObserved:false,nativeReady:false});
export function assertConquestAssaultRifleRuntime(runtime){
 if(!runtime||Object.getPrototypeOf(runtime)!==Object.prototype||runtime.weapon!=='assaultrifle'||runtime.profile!==ASSAULT_RIFLE||ASSAULT_RIFLE.itemKey!==2010024||ASSAULT_RIFLE.nativeType!==34||runtime.capacity!==30||runtime.muzzle!=='assult_Fire_Dummy'||runtime.shotDelay!==.01||!['idle','fire','reload'].includes(runtime.phase)||!Array.isArray(runtime.pendingShots)||!Number.isSafeInteger(runtime.shotSerial)||runtime.shotSerial<0||!Number.isSafeInteger(runtime.serial)||runtime.serial<0||!Number.isInteger(runtime.ammo)||runtime.ammo<0||runtime.ammo>30||!Number.isFinite(runtime.timeMs)||runtime.timeMs<0||!Number.isFinite(runtime.cooldownMs))throw Error('Actual supported Assault Rifle equipment34 runtime required');
 return runtime;
}
