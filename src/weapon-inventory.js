const weapon=(id,name,category,qaUrl,loadoutId=null,metadata={})=>Object.freeze({id,name,category,qaUrl,loadoutId,thumbnail:`/assets/weapons/thumbnails/${id}.png`,...metadata});
// Identity only: these CRC-authenticated _eu_weapon.x7 records do not grant
// runtime availability. inventoryEntryState also requires WEAPON_CHOICES and
// a live enabled main-game select option before enabling equipment.
const nativeIdentity=(itemKey,weaponType,scene,category)=>Object.freeze({itemKey,weaponType,scene,category});

// This registry is deliberately separate from WEAPON_CHOICES. WEAPON_CHOICES
// contains the weapons that the main arena runtime can equip today, whereas
// this list is the complete imported arsenal and always offers a working QA
// destination for entries that are not yet promoted to the arena runtime.
export const IMPORTED_WEAPONS=Object.freeze([
 weapon('demonic-knuckle','Demonic Knuckle','Corps à corps','/?weapon=demonicknuckle','demonicknuckle'),
 weapon('dagger','Spy Dagger','Corps à corps','/?weapon=dagger','dagger'),
 weapon('plasma','Plasma Sword','Corps à corps','/?weapon=plasma','plasma'),
 weapon('counter','Counter Sword','Corps à corps','/?weapon=counter','counter'),
 weapon('breaker','Breaker','Corps à corps','/breaker-preview.html','breaker'),
 weapon('katana','Katana','Corps à corps','/?weapon=katana&weaponSkin=classic','katana'),
 weapon('twin-blade','Twin Blade','Corps à corps','/?weapon=twinblade','twinblade'),
 weapon('assassin-claw','Assassin Claw (formerly Vital Shock)','Corps à corps','/?weapon=assassinclaw','assassinclaw'),
 weapon('vital-shock','Vital Shock','Corps à corps','/?weapon=vitalshock','vitalshock'),
 weapon('sigma-blade','Sigma Blade','Corps à corps','/?weapon=sigmablade','sigmablade'),
 weapon('death-scythe','Death Scythe','Corps à corps','/?weapon=deathscythe','deathscythe'),
 weapon('iron-boots','Iron Boots','Corps à corps','/?weapon=ironboots','ironboots'),
 weapon('bat','Bat / Storm Bat','Corps à corps','/?weapon=bat','bat'),
 weapon('airgun','Air Gun','Arme à distance','/qa-matrix.html','airgun'),
 weapon('cannonade','Cannonade','Arme à distance','/?weapon=cannonade','cannonade'),
 weapon('semi-rifle','Semi Rifle','Arme à distance','/qa-matrix.html','semirifle'),
 weapon('rail-gun','Rail Gun','Arme à distance','/qa-matrix-2.html'),
 weapon('revolver','Revolver','Arme à distance','/qa-matrix-3.html'),
 weapon('smash-rifle','Smash Rifle','Arme à distance','/qa-matrix-3.html','smashrifle'),
 weapon('submachine-gun','Submachine Gun','Arme à distance','/?weapon=submachinegun','submachinegun'),
 weapon('hand-gun-revolver2','Hand Gun','Arme à distance','/qa-matrix-4.html','handgun',{nativeIdentity:nativeIdentity(2010007,22,'handgun.scn','guns')}),
 weapon('assault-rifle','Assault Rifle','Arme à distance','/qa-matrix-4.html','assaultrifle',{nativeIdentity:nativeIdentity(2010024,34,'assult_rifle.scn','rifle')}),
 weapon('burst-shotgun','Burst Shotgun','Arme à distance','/?weapon=burstshotgun','burstshotgun',{nativeIdentity:nativeIdentity(2010008,23,'shotgun.scn','guns'),thumbnail:'/assets/s5runtime/inventory/weapons/burst-shotgun.png'}),
 weapon('heavy-machine-gun','Heavy Machine Gun','Arme à distance','/qa-matrix-5.html'),
 weapon('dual-magnum','Dual Magnum','Arme à distance','/qa-matrix-5.html'),
 weapon('homing-rifle','Homing Rifle','Arme à distance','/qa-matrix-5.html'),
 weapon('machine-gun-2','Machine Gun 2','Arme à distance','/qa-matrix-7.html'),
 weapon('rocket-launcher','Rocket Launcher','Lanceur','/?weapon=rocketlauncher','rocketlauncher'),
 weapon('gauss-rifle-mk2','Gauss Rifle Mk2','Arme à distance','/qa-matrix-7.html'),
 weapon('grenade','Grenade / Summer Night Mine Gun','Installation','/qa-matrix-2.html'),
 weapon('sentry','Sentry Gun','Installation','/qa-matrix-2.html'),
 weapon('earth-bomber','Earth Bomber','Lanceur','/qa-matrix-4.html'),
 weapon('mind-energy','Mind Energy','Arme mentale','/qa-matrix-5.html'),
 weapon('lightning-bomber','Lightning Bomber','Lanceur','/qa-matrix-7.html'),
 weapon('spark-rifle','Spark Rifle','Arme à distance','/spark-rifle-preview.html'),
]);

export function weaponThumbnail(id){
 return IMPORTED_WEAPONS.find(entry=>entry.id===id||entry.loadoutId===id)?.thumbnail??null;
}

export function validateImportedWeaponInventory(weapons=IMPORTED_WEAPONS){
 const ids=new Set(),loadoutIds=new Set();
 for(const entry of weapons){
  if(!entry.id||!entry.name||!entry.category||!entry.qaUrl)throw Error(`Invalid imported weapon entry ${entry?.id??'unknown'}`);
  if(ids.has(entry.id))throw Error(`Duplicate imported weapon ${entry.id}`);ids.add(entry.id);
  if(entry.loadoutId){if(loadoutIds.has(entry.loadoutId))throw Error(`Duplicate loadout weapon ${entry.loadoutId}`);loadoutIds.add(entry.loadoutId);}
 }
 return weapons;
}
