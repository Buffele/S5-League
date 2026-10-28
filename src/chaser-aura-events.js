// Transfer only survivor auras when target eligibility changes. Reaper and
// elimination sequences share the runtime and must keep their own clocks.
export function createChaserAuraEvents(runtime){
 const entries=new Map();let age=Infinity;
 const clear=entry=>{for(const effect of entry.effects)if(effect.avatar===entry.avatar)effect.clear();};
 return {
  reset(){for(const entry of entries.values())clear(entry);entries.clear();age=Infinity;},
  update(dt,state,records){
   age+=dt;const refresh=age>=2;if(refresh)age=0;
   const eligible=new Set();
   for(const record of records){
    if(state.phase==='intermission'||!state.survivors?.includes(record.id)||record.health?.dead)continue;
    eligible.add(record.id);
    const name=record.id===state.bonus?'slaughter_bonus_target_aura':'slaughter_target_aura';
    let entry=entries.get(record.id),changed=!entry||entry.name!==name||entry.avatar!==record.avatar;
    if(changed){if(entry)clear(entry);entry={name,avatar:record.avatar,effects:new Set()};entries.set(record.id,entry);}
    for(const effect of entry.effects)if(!Number.isFinite(effect.age)||effect.avatar!==entry.avatar)entry.effects.delete(effect);
    if(changed||refresh){
     const effect=runtime?.play(name,record.avatar.group.getWorldPosition(record.avatar.group.position.clone()),record.avatar,{follow:true});
     if(effect)entry.effects.add(effect);
    }
   }
   for(const [id,entry] of entries)if(!eligible.has(id)){clear(entry);entries.delete(id);}
  },
 };
}
