// Native 5ADDC0 -> B10AD0(path, remote, loop=1, actor, 0, 0).
// B10AD0 stores loop at handle+24; 1295D20 -> vtable+34 -> 1295180
// forwards it as buffer Play(0,0,1). 5ADC00 stops the owned handle.
export const HMG_FIRING_SOUND='/assets/s5runtime/heavy-machine-gun/sounds/hmg_blast.ogg';

export function syncHeavyMachineGunAudio({audio,opponentAudio,controller,combat,disabledLocal=false}){
 const banks=[...new Set([audio,...(opponentAudio?.values()??[])])].filter(a=>a?.weapon==='heavymachinegun');
 if(!banks.length)return;
 const records=new Map();
 const add=(actor,disabled)=>{if(!actor)return;const record=records.get(actor);if(record)record.disabled||=!!disabled;else records.set(actor,{actor,disabled:!!disabled});};
 add(controller,disabledLocal||combat?.playerState?.dead||combat?.playerState?.locked);
 if(typeof combat?.records==='function')for(const r of combat.records())add(r.actor,r.health?.dead||r.health?.locked||r.avatar?.group?.visible===false);
 else if(combat?.enemy)add(combat.enemy,combat.enemyState?.dead||combat.enemyState?.locked||combat.avatar?.group?.visible===false);
 for(const bank of banks)bank.syncHeavyMachineGunActors([...records.values()]);
}
