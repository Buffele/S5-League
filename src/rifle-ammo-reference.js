// Current CRC/SHA-qualified xbn/weapon.xml; tools/prepare-rifle-ammo-reference.mjs.
export const RIFLE_AMMO_REFERENCE=Object.freeze({"revolver":{"itemKey":2010002,"capacity":7,"maxAmmo":-1},"semirifle":{"itemKey":2010004,"capacity":30,"maxAmmo":-1},"smashrifle":{"itemKey":2010006,"capacity":40,"maxAmmo":-1}});
export const referenceRifleReserve=weapon=>RIFLE_AMMO_REFERENCE[weapon].maxAmmo===-1?Infinity:RIFLE_AMMO_REFERENCE[weapon].maxAmmo;
