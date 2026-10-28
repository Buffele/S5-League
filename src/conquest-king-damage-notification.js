import * as healthAPI from './conquest-player-monster-combat.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
import {assertConquestKingRuntime,assertConquestKingStateControl} from './conquest-king-runtime.js';
import {ConquestKingPreFastRunState,assertConquestKingSpecialState} from './conquest-king-special-states.js';

const owners=new WeakMap(),localReceipts=new WeakMap();
export const CONQUEST_KING_DAMAGE_NOTIFICATION_SOURCE=Object.freeze({numericReceiver:0xa041f0,managerNotify:0xa13c90,state8Notify:0xa32990,accumulate:0xa32250,noOp:0x7563f0,autoDamageInputQualified:false,nativeReady:false});

export function assertConquestKingDamageNotification(owner,{actor,health,runtime,runtimes}={}){
 const r=owners.get(owner);if(!r||r.actor!==actor||r.health!==health||r.runtime!==runtime||r.runtimes!==runtimes)throw Error('Typed actual King damage-notification owner required');r.live();return owner;
}

// Only the authentic synchronous B8 notification boundary may call notify.
// Outer record flags/source/attribute lookup belong to Health; HP acceptance
// is deliberately NOT a condition here. A041F0 forwards the original float.
export function createConquestKingDamageNotification({actor,monsterActors,playerActors,worldOwner,renderOwner,health,runtimes,runtime}={}){
 const receiveHealth=healthAPI.ConquestMonsterHealth.prototype.receive;
 assertConquestKingActor(actor);assertConquestKingRuntime(runtime,{actor});
 if(!(monsterActors instanceof Map)||!(runtimes instanceof Map)||runtimes.get(actor.id)!==runtime)throw Error('Actual current King actor/runtime Maps required');
 const config={actor,monsterActors,playerActors,worldOwner,renderOwner},model=actor.model,pre=runtime.preFastRun;
 healthAPI.assertConquestMonsterHealth(health,config);assertConquestKingSpecialState(pre,{actor,stateId:8});
 let disposed=false,busy=false,receiving=false,activeReceipt=null,delivered=0,last=null;const used=new WeakSet();
 const live=()=>{if(disposed||monsterActors.get(actor.id)!==actor||runtimes.get(actor.id)!==runtime||actor.model!==model||runtime.preFastRun!==pre)throw Error('Current owned King damage-notification owner required');assertConquestKingRuntime(runtime,{actor});healthAPI.assertConquestMonsterHealth(health,config);};
 const notify=receipt=>{
  live();if(busy)throw Error('Nonreentrant King damage notification required');
  const record=receipt?.record,validate=healthAPI.assertConquestMonsterStateNotificationReceipt;
  const local=localReceipts.get(receipt);
  if(local){if(local.owner!==api||activeReceipt!==receipt||!receiving)throw Error('Actual synchronous King Health notification receipt required');}
  else {if(typeof validate!=='function')throw Error('Authentic Health B8 notification receipt required');validate(receipt,{receiver:health,actor,record});}
  if(used.has(receipt))throw Error('Once-only King state notification required');
  if(healthAPI.ConquestMonsterHealth.prototype.readCurrentRecord.call(health)!==record||receipt.damage50!==record.damage50)throw Error('Actual current received record50 required');
  const control=runtime.readStateControl();assertConquestKingStateControl(control,{runtime,actor});
  if(![0,1,2,3,4,5,8,9,10].includes(control.stateId))throw Error('Unqualified King state virtual44');
  const current=runtime.manager.current;if(control.stateId===8){if(current!==pre)throw Error('Actual current King PreFastRun state required');assertConquestKingSpecialState(current,{actor,stateId:8});}
  busy=true;used.add(receipt);try{
   let accumulatedDamage=null;
   if(control.stateId===8)accumulatedDamage=ConquestKingPreFastRunState.prototype.accumulateDamage.call(pre,record.damage50);
   delivered++;last=Object.freeze({stateId:control.stateId,damage50:record.damage50,accumulatedDamage,notified:true,sourceVirtual44:control.stateId===8?0xa32990:0x7563f0,autoDamageInputQualified:false,nativeReady:false});return last;
  }finally{busy=false;}
 };
 const api=Object.freeze({notify,receive(record){
  live();if(receiving||busy)throw Error('Nonreentrant King Health receive required');receiving=true;
  try{
   const result=receiveHealth.call(health,record);live();
   // Only these statuses reached virtualB8. accepted:false alone cannot tell
   // a rejected HP prefix from an earlier record/source/attribute rejection.
   if(!['monster-hp-written','monster-hp-rejected'].includes(result.status))return result;
   const receipt=Object.freeze({record,damage50:record.damage50,nativeReady:false});localReceipts.set(receipt,{owner:api});activeReceipt=receipt;
   const notification=notify(receipt);return {...result,stateNotificationsComplete:true,stateNotification:notification};
  }finally{activeReceipt=null;receiving=false;}
 },snapshot(){live();return {actorId:actor.id,monsterKey:1500,delivered,last,nativeReady:false};},dispose(){if(busy||receiving)throw Error('Cannot release delivering King state notification');disposed=true;}});
 owners.set(api,{actor,health,runtime,runtimes,live});return api;
}
