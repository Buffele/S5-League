// Original per-class tables, not an ordinary-state alias. Additional class
// record flags are executed by player-action-damage-record-20261022/qualify.py.
// D8 is a four-float setter; DC reads current state+F8. Neither is a flag.
export const CONQUEST_PLAYER_DAMAGE_STATE_SOURCE=Object.freeze(Object.fromEntries([
 ['CNormalState',0x13b5dc4],['CRunState',0x13b6350],['CFastRunState',0x13b4a80],['CJumpState',0x13b58cc],
 ['CAttackSpyDaggerState',0x13b17e0],['CAttackRevolverShotState',0x13b0d98],['CAttackPistolShotState',0x13b0b6c],['CReloadState',0x13b5ef0],['CFallState',0x13b4900],
 ['CDodgeState',0x13b4468],['CBoundJumpState',0x13b3a58]
].map(([nativeClass,vtable])=>[vtable,Object.freeze({nativeClass,vtable,slot34:0x501b40,slot88:0xf172f0,slot8c:0x9883d0,slot90:0xacd900,slotB0:0xb4a300,
 slotD8:['CAttackSpyDaggerState','CAttackRevolverShotState','CAttackPistolShotState'].includes(nativeClass)?0x58c150:0xae7910,slotDC:0x567180,
 recordField44:false,recordField47:true,recordField4a:false,recordField4d:false,nativeReady:false})])));
