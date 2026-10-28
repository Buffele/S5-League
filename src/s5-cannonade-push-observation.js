// Read-only, bounded evidence for inputDebug sessions. Never drives gameplay.
export function createS5CannonadePushObservation(){
 let owner=null,serial=null,previous=new Map(),current=null;
 const samples=[];
 const append=value=>{samples.push(value);if(samples.length>128)samples.shift();};
 return {
  sample({controller,shots,combat,dt}){
   const reset=owner!==controller||serial!==controller.resetSerial;
   if(reset){if(owner&&samples.length)append({kind:'reset',resetSerial:controller.resetSerial,weapon:controller.weapon,enemyPosition:combat?.enemy?{...combat.enemy.position}:null,enemyHp:combat?.enemyState?.hp});previous.clear();owner=controller;serial=controller.resetSerial;}
   const pushes=shots?.pushes??new Map();
   current={weapon:controller.weapon,resetSerial:serial,phase:controller.cannonade?.phase??null,chargeMs:controller.cannonade?.chargeMs??null,ammo:controller.cannonade?.ammo??null,pendingContacts:shots?.items.length??0,acceptedPushes:pushes.size,enemyPosition:combat?.enemy?{...combat.enemy.position}:null,enemyHp:combat?.enemyState?.hp};
   const targets=new Set([...previous.keys(),...pushes.keys()]);
   if(targets.size)append({kind:'step',dtMs:dt*1000,...current,targets:[...targets].map(actor=>{const state=pushes.get(actor)??previous.get(actor);return {position:{...actor.position},elapsedMs:state.elapsedMs,active:pushes.has(actor),hp:actor===combat?.enemy?combat.enemyState.hp:combat?.actorRecord?.(actor)?.health?.hp};})});
   previous=new Map(pushes);
  },
  snapshot(){return {current,samples:[...samples]};},
 };
}
