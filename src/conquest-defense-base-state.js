import {ConquestSession} from './conquest-session.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestBaseVolumeOwner,conquestDefenseBaseDamage} from './conquest-base-volume.js';

const owners=new WeakMap();
//707C40 writes the sum of the admitted INI gate HP to BOTH7C/80. These are
// distinct retained fields, not a computed view of the subsequently damaged
// gates. A1DCF0 consumes signed16 damage;71EAE0 consumes the full DWORD.
export function createConquestDefenseBaseState({session,baseVolumeOwner}={}){
 if(!(session instanceof ConquestSession)||session.phase!=='prepared'||session.world?.nativeMapId!==46||CONQUEST_SOURCE_DATA.pveRule.type!=='defense')throw Error('Prepared actual map46 defense session required');
 const world=session.world,bridge=session.bridge,volume=assertConquestBaseVolumeOwner(baseVolumeOwner,{world}),source=CONQUEST_SOURCE_DATA.pveRule;
 const initialVolume=volume.snapshot(),gate=volume.readGate().gate,initialHp=Number(source.base_object_1_hp);
 if(source.base_object_1!==gate.name||source.base_object_2!==undefined||world.baseGates.length!==1||world.baseGates[0]!==gate||bridge.baseGates.get(gate.name)!==gate||initialVolume.produced!==0||initialVolume.consumed!==0||gate.health!==initialHp||!Number.isInteger(initialHp)||initialHp< -0x80000000||initialHp>0x7fffffff)throw Error('Actual source-initialized complete map46 base list required before events');
 let health=initialHp|0,finished=false,ruleResult=null,disposed=false,received=0;
 const seen=new WeakSet();
 function live(){if(disposed||session.phase==='disposed'||session.world!==world||session.bridge!==bridge||CONQUEST_SOURCE_DATA.pveRule!==source||source.base_object_1!==gate.name||Number(source.base_object_1_hp)!==initialHp||world.baseGates.length!==1||world.baseGates[0]!==gate||bridge.baseGates.get(gate.name)!==gate)throw Error('Current owned Conquest defense state required');assertConquestBaseVolumeOwner(volume,{world});}
 const api=Object.freeze({
  snapshot(){live();return {health,maxHealth:initialHp,finished,ruleResult,received,sourceInitializationQualified:true,defenseCounterEstablished:true,nativeReady:false,serverAccepted:false,failureReportSent:false};},
  dispose(){disposed=true;},
 });
 owners.set(api,{session,world,volume,live,receive(event){
  live();volume.assertEvent(event);if(seen.has(event))throw Error('Conquest defense event replay refused');
  const before=health,wasFinished=finished,result=conquestDefenseBaseDamage({health,finished},event);
  health=result.health;
  if(result.failureRequested){
   // Local prefix of source virtual4C/A1E1E0: finished0A=1, rule result=2,
   // hp80=0. The downstream server2030/HUD/effects remain separate work.
   finished=true;ruleResult=2;health=0;
  }
  seen.add(event);received++;
  return {qualified:true,event,healthBefore:before,health,damageSigned16:result.damageSigned16,wasFinished,finished,failureRequested:result.failureRequested,ruleResult,
   sourceInitializationQualified:true,defenseCounterEstablished:true,sourceEntry:0xa1dcf0,failurePrefixApplied:result.failureRequested,serverAccepted:false,failureReportSent:false};
 }});return api;
}
export function applyConquestDefenseBaseEvent(state,event,{world,baseVolumeOwner}={}){
 const owner=owners.get(state);if(!owner||owner.world!==world||owner.volume!==baseVolumeOwner)throw Error('Typed current owned defense counter required');owner.live();return owner.receive(event);
}
export function assertConquestDefenseBaseState(state,{world,baseVolumeOwner}={}){
 const owner=owners.get(state);if(!owner||owner.world!==world||owner.volume!==baseVolumeOwner)throw Error('Typed current owned defense counter required');owner.live();return state;
}
