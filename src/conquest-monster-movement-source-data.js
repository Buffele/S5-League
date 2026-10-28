// Offline original factory A0A7C0 -> A01170 -> CActor97BF00 evidence:
// work/game-modes/conquest-recovery/rook-knight-movement-20261023/.
// These are shared CMonster body/path classes, not interchangeable AI states.
const entry=(group,script,scene)=>Object.freeze({group,script,scene});
export const CONQUEST_MONSTER_MOVEMENT_SOURCE_CLASSES=Object.freeze({
 1003:entry(1000,'Script/MonsterAI_Pawn_Normal.lua','model/monster/pve_mon_pawn.scn'),
 1013:entry(1000,'Script/MonsterAI_Pawn_Explode.lua','model/monster/pve_mon_pawn.scn'),
 1100:entry(1100,'Script/MonsterAI_Rook.lua','model/monster/pve_mon_rook.scn'),
 // Independent1100/1110 factory, dimensions and inherited physics getters:
 // rook-explode1110-20261023; ordinary sphere36/88 AI stays separate.
 1110:entry(1100,'Script/MonsterAI_Rook_Explode.lua','model/monster/pve_mon_rook.scn'),
 1203:entry(1200,'Script/MonsterAI_Knight_Normal.lua','model/monster/pve_mon_knight.scn'),
 // Separate original group1200/key1204 ctor/getters/prefix proof lives in
 // knight-charge1204-20261023; this does not select1203's states/attacks.
 1204:entry(1200,'Script/MonsterAI_Knight_Charge.lua','model/monster/pve_mon_knight.scn'),
 // Bishop's independent1300/1303 factory/getter/prefix proof is retained in
 // bishop1303-20261023; no ranged attack or presentation is implied.
 1303:entry(1300,'Script/MonsterAI_Bishop_Normal.lua','model/monster/pve_mon_bishop.scn'),
 // Separate1314 constructor/getter/critical-point proof: size2 is700x1000;
 // Snipe AI/Rand/HP recovery are independent consumers, not1303 aliases.
 1314:entry(1300,'Script/MonsterAI_Bishop_Snipe.lua','model/monster/pve_mon_bishop.scn'),
 // Queen1403 separate original factory/getters/critical-point proof:
 // queen1403-20261023; its clash1 PLAYER collection remains required.
 1403:entry(1400,'Script/MonsterAI_Queen_Normal.lua','model/monster/pve_mon_queen.scn'),
 // King1500 own factory/getters/critical-point proof: king1500-20261023.
 // Shared body admission does not implement its MoveBox or special states.
 1500:entry(1500,'Script/MonsterAI_King.lua','model/monster/pve_mon_king.scn'),
});
