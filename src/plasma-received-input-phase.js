// Damage18 configuration809FD0 has no primary7/8 or secondary9 route.
// GUI input is dispatched before actor51EAB0 ticks and commits its pending
// state. Preserve that input phase through all catch-up steps of one frame.
// Scope: local Plasma melee entry only, no new recovery duration or movement.
export function plasmaReceivedInputPhase(previous,{frameId,serial,damageActive,weapon}){
 const blocked=weapon==='plasma'&&damageActive;
 if(frameId===null||previous?.frameId!==frameId||previous?.serial!==serial||weapon!=='plasma')return {frameId,serial,blocked};
 return {frameId,serial,blocked:previous.blocked||blocked};
}
