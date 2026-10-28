import {AIRGUN} from './airgun-data.js';
export {AIRGUN};
// RELOAD_AIRGUN -> constant index 112; native default is 2500, not
// the AW007 clip's 3000 ms. See native-reload-movement.json.
export const AIRGUN_RELOAD_MS=2500;
export function createAirgunState(){return {phase:'idle',timeMs:0,chargeMs:0,ammo:AIRGUN.magazine,serial:0,held:false,maxCue:false};}
export function advanceAirgun(state,dt,input,events,sex='male'){
 const held=!!input.light,pressed=!!input.lightPressed||held&&!state.held;
 const released=!!input.lightReleased||state.held&&!held;
 state.held=held;state.timeMs+=dt*1000;
 if(state.phase==='fire'&&state.timeMs>=AIRGUN.fireMs)state.phase='idle';
 if(state.phase==='reload'&&state.timeMs>=AIRGUN_RELOAD_MS){state.ammo=AIRGUN.magazine;state.phase='idle';events.push('reloadEnd');}
 if(input.reload&&state.phase!=='reload'&&state.phase!=='fire'){
  state.phase='reload';state.timeMs=0;state.serial++;events.push('reloadStart');return;
 }
 if(state.phase==='idle'&&pressed){
  if(!state.ammo){events.push('empty');return;}
  state.phase='charge';state.timeMs=0;state.chargeMs=0;state.maxCue=false;state.serial++;events.push('chargeStart');
 }
 if(state.phase==='charge'){
  state.chargeMs+=dt*1000;
  if(state.chargeMs>=AIRGUN.chargeMs&&!state.maxCue){state.maxCue=true;events.push('chargeMax');}
  if(released){state.phase='fire';state.timeMs=0;state.ammo--;state.serial++;events.push(state.maxCue?'shotMax':'shot');}
 }
}
export function airgunPose(state,direction,moving,sex='male'){
 if(state.phase==='idle')return null;
 const clip=AIRGUN[state.phase],loop=state.phase==='charge';
 const duration=AIRGUN.durations[sex][clip];
 const sample={clip,loop,speed:1,fade:.1,restartKey:state.serial,time:loop?(state.timeMs/1000)%duration:Math.min(state.timeMs/1000,duration)};
 if(state.phase==='reload')sample.time=Math.min(state.timeMs/AIRGUN_RELOAD_MS,1)*duration;
 // UseWeapon1State_AIRGUN: aim triplets belong to the upper body. AW003
 // is downward aim, NEVER legs. Horizontal charge/fire are AW002 / AW005.
 if(state.phase!=='reload')Object.assign(sample,{lower:moving?AIRGUN.chargeLower[direction]:'E0001',lowerSpeed:1});
 // ReloadState specifies AW007 for stationary legs only. User comparison
 // in S5Runtime confirms locomotion continues while reloading; retain its channel.
 else if(moving)Object.assign(sample,{lower:AIRGUN.runLower[direction],lowerSpeed:1});
 return sample;
}
