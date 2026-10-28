import {KATANA_ACTION_EVENTS} from './katana-combat-data.js';

// Catalog item2000018 other_effects + CAttackChargeMovingState:
// Enter598bd0 ->59a8f0 ->59cdf0. InitLuaInputSecond sets+570, selecting
// 59ca50: two independent instances, parent+574 (Bip01 L Hand) and+58c
// (empty: actor model). Exit598f10/59cf50 removes BOTH handles554/558.
// The normal effect ends when its1000ms charge timer is strictly exceeded;
// this is separate from the900ms full-charge damage selection.
// Source/binary proof: work/katana-charge-effects-20261024/.
export const KATANA_CHARGE_PRESENTATION=Object.freeze({
 name:'katana_charge2',at:0,follow:true,cancelOnExit:true,stopAfterMs:1000,
 sourceMethod:'CAttackChargeMovingState::59cdf0/59ca50',
 sourcePath:KATANA_ACTION_EVENTS.catalogCharge.sequence,
 sourceSound:KATANA_ACTION_EVENTS.catalogCharge.sound,
 nativeExecutionCompared:false,
});
const chargeCues=Object.freeze([
 Object.freeze({...KATANA_CHARGE_PRESENTATION,rootBone:'Bip01 L Hand',sound:'katanaChargeStart',sourceParent:'InitLuaInputSecond parent1 +574'}),
 Object.freeze({...KATANA_CHARGE_PRESENTATION,sourceParent:'InitLuaInputSecond parent2 +58c: actor model'}),
]);

// AddSequence's trailing time is preserved as metadata, not a SEQ duration.
// Actor following remains the existing explicit arena policy. Source parenting
// and native sequence cancellation are not certified by this adapter.
export function katanaStateCues(attack){
 if(attack?.weapon!=='katana')return [];
 if(attack.kind==='charge')return chargeCues;
 const events=attack.kind==='light'?KATANA_ACTION_EVENTS.light[attack.comboIndex??0]:KATANA_ACTION_EVENTS[attack.kind];
 return (events?.sequences??[]).filter(event=>!event.bySelf).map((event,sourceIndex)=>({
  name:event.path.split('/').at(-1).replace(/\.seq$/i,'').toLowerCase(),at:event.beginMs/1000,follow:true,
  sourceEndMs:event.endMs,sourceMethod:'AddSequence',sourceIndex,sourcePath:event.path,
  spatialPolicy:'arena follow:true; native parent/cancellation unverified',
 }));
}

// These authored IF nodes use the local-only orthographic renderer in
// katana-screen-effects.js. They must stay out of the world-space cue list.
export const KATANA_SCREEN_STATE_CUES=Object.freeze([
 {kind:'heavy',name:'katanaa_s_atk02_line01',sourceMethod:'AddSequenceBySelf',sourceEndMs:1500,
  renderer:'katana-screen-effects',localOwnerOnly:true,nativeExecutionCompared:false},
]);
