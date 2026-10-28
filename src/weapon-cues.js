// State sequences play without a victim. Keep audio and visuals on one clock.
import {plasmaStateCue} from './plasma-effects-data.js';
import {PLASMA_RUSH_PRESENTATION} from './plasma-rush-effect.js';
import {SPY_DAGGER_RUSH_CUE} from './spy-dagger-effects.js';
import {twinBladeStateCues} from './twin-blade-effects.js';
import {batStateCues} from './bat-effects.js';
import {ironBootsStateCues} from './iron-boots-effects.js';
import {sigmaBladeStateCues} from './sigma-blade-effects.js';
import {vitalShockStateCues} from './vital-shock-effects.js';
import {deathScytheStateCues} from './death-scythe-effects.js';
import {demonicKnuckleStateCues} from './demonic-knuckle-effects.js';
import {katanaStateCues} from './katana-state-effects.js';
import {breakerStateCues} from './breaker-effects.js';
export function weaponStateCues(attack){
 if(attack?.weapon==='plasma'&&attack.kind==='heavy')return [PLASMA_RUSH_PRESENTATION];
 if(attack?.weapon==='katana')return katanaStateCues(attack);
 if(attack?.weapon==='demonicknuckle')return demonicKnuckleStateCues(attack);
 if(attack?.weapon==='deathscythe')return deathScytheStateCues(attack);
 if(attack?.weapon==='vitalshock')return vitalShockStateCues(attack);
 if(attack?.weapon==='sigmablade')return sigmaBladeStateCues(attack);
 if(attack?.weapon==='twinblade')return twinBladeStateCues(attack);
 if(attack?.weapon==='bat')return batStateCues(attack);
 if(attack?.weapon==='ironboots')return ironBootsStateCues(attack,{sex:attack.sex}).map(cue=>({...cue,name:'ironboots_'+cue.name}));
 if(attack?.weapon==='breaker')return breakerStateCues(attack);
 const cue=weaponStateCue(attack);return cue?[cue]:[];
}
// Source audio clock: Plasma rush and Counter aerial AddSequence at 500 ms.
// Counter hold asset/audio: _eu_weapon.x7 item 2000002. The 250 ms offset is
// corroborated by aiactor_typecounterswordstrong.lua, not yet by player capture.
const COUNTER_HOLD={name:'weapon_counter_upper02',sound:'counterAttack',at:.25,follow:false};
const COUNTER_AIR={name:'weapon_counter_upper01',sound:'counterAttack',at:.5,follow:false};
export function weaponStateCue(attack){
 if(attack&&(attack.weapon??'dagger')==='dagger'&&(attack.kind??attack.type)==='rush')return SPY_DAGGER_RUSH_CUE;
 if(attack?.weapon==='katana'){
  return katanaStateCues(attack)[0]??null;
 }
 if(attack?.weapon==='counter')return attack.kind==='heavy'?COUNTER_HOLD:attack.kind==='air'?COUNTER_AIR:null;
 if(attack?.weapon==='plasma')return plasmaStateCue(attack);
 return null;
}
