// Presentation adapter only. Contacts stay owned by the combat resolver; each
// migrated effect family advances its shared runtime once for the whole frame.
export function updateRifleEffectActors(effect,dt,controller,avatar,combat,disabledLocal=false){
 if(!effect)return;
 if(typeof effect.updateActors!=='function')return effect.update?.(dt,controller,avatar,disabledLocal);
 const actors=[],seen=new Set();
 const append=(actor,view,disabled)=>{
  if(!actor||!view||seen.has(actor))return;
  seen.add(actor);actors.push({controller:actor,avatar:view,disabled:!!disabled});
 };
 // The caller owns the existing local disable policy. A local death or stun
 // never disables a different actor's muzzle or its already resolved contact.
 append(controller,avatar,disabledLocal);
 const appendRecord=record=>append(record.actor,record.avatar,
  record.health?.dead===true||record.health?.locked===true||record.avatar?.group?.visible===false);
 if(typeof combat?.records==='function')for(const record of combat.records())appendRecord(record);
 else if(combat?.enemy)appendRecord({actor:combat.enemy,avatar:combat.avatar,health:combat.enemyState});
 return effect.updateActors(dt,actors);
}
