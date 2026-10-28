// Current source: work/cannonade-recovery/source-contract.json. This adapter
// remains experimental: body timing, equipment HP scaling and received-condition
// policy still need live comparisons. The native route has no moving rocket.
import {cannonadeChargePower} from './cannonade-charge.js';
export const CANNONADE_SOURCE=Object.freeze({
 runLower:{front:'E0019',leftFront:'E0020',left:'E0021',rightFront:'E0022',right:'E0023',back:'E0024',leftBack:'E0025',rightBack:'E0026'},
 actionLower:{front:'E0008',leftFront:'E0009',left:'E0010',rightFront:'E0011',right:'E0012',back:'E0013',leftBack:'E0014',rightBack:'E0015'},
});
// E locomotion already has S5 lateral handedness (+1 in source root curves),
// unlike the ordinary 00008-series. Keep the native semantic mapping intact.
// Fire state's recovery timer500ms is distinct from SetAnim's1500ms fitting.
// Both-sex native-engine-v3 observations return to Normal after500–563ms.
// Logical getters from both-sex native-logical-values-v4.json. The source
// catalogue lists8.5 before the observed native equipped-reference profile.
// Keep the observed maximum independently rounded, rather than a JS product.
export const CANNONADE_POWER_REFERENCE=Object.freeze({minimum:7.203390121459961,maximum:36.01695251464844,sourceBeforeNativeProfile:8.5,evidence:'work/cannonade-recovery/native-logical-values-v4.json'});
// Native right click toggles, surviving release and charge/fire. Observed
// camera target45 differs from catalogue15; the measured angle transition is
// in cannonade-camera.js. Full camera/reticle parity remains open.
export const CANNONADE_ZOOM=Object.freeze({fov:45,catalogueFov:15,evidence:'work/cannonade-recovery/native-zoom-v2.json'});
export const CANNONADE=Object.freeze({capacity:4,reloadMs:1000,chargeMs:2000,fireMs:500,
 moveRate:.9,power:CANNONADE_POWER_REFERENCE.minimum,maximumPower:CANNONADE_POWER_REFERENCE.maximum,chargePowerRate:5,rangeNative:400,
 runLower:CANNONADE_SOURCE.runLower,actionLower:CANNONADE_SOURCE.actionLower});
export function createCannonadeState(){return {phase:'idle',timeMs:0,chargeMs:0,ammo:4,serial:0,held:false,heldRight:false,zoom:false,maxCue:false,aimPitch:0,aimTarget:null,pendingShots:[],shotSerial:0};}
export function cancelCannonade(state,held=false){state.phase='idle';state.timeMs=0;state.held=held;state.maxCue=false;state.pendingShots.length=0;}
export function advanceCannonade(s,dt,input,events){
 const right=!!(input.heavyHeld??input.heavy),rightPressed=!!input.heavyPressed||right&&!s.heldRight;
 if(rightPressed)s.zoom=!s.zoom;s.heldRight=right;
 const ms=dt*1000,held=!!input.light,pressed=!!input.lightPressed||held&&!s.held,released=!!input.lightReleased||s.held&&!held;
 s.held=held;s.timeMs+=ms;s.aimPitch=Number.isFinite(input.aimPitch)?input.aimPitch:s.aimPitch;
 if(input.aimTarget)s.aimTarget={...input.aimTarget};
 if(s.phase==='fire'&&s.timeMs>=CANNONADE.fireMs-1e-7)s.phase='idle';
 // Native live sample: two missing rounds refill at ~1s and ~2s. The1000ms
 // constant is PER ROUND, not a full-magazine duration (native-states-v1.json).
 while(s.phase==='reload'&&s.timeMs>=CANNONADE.reloadMs-1e-7){
  s.timeMs=Math.max(0,s.timeMs-CANNONADE.reloadMs);s.ammo++;events.push('reloadRound');
  if(s.ammo===4){s.phase='idle';events.push('reloadEnd');}
 }
 if(input.reload&&!['fire','reload'].includes(s.phase)&&s.ammo<4){s.phase='reload';s.timeMs=0;s.serial++;events.push('reloadStart');return;}
 if(s.phase==='idle'&&pressed){
  if(!s.ammo){events.push('empty');return;}
  s.phase='charge';s.timeMs=0;s.chargeMs=0;s.maxCue=false;s.serial++;events.push('chargeStart');
  // A new press starts at this input instant; do not count the preceding tick.
 }else if(s.phase==='charge')s.chargeMs=Math.min(CANNONADE.chargeMs,s.chargeMs+ms);
 if(s.phase==='charge'){
  if(s.chargeMs>=CANNONADE.chargeMs-1e-7&&!s.maxCue){s.maxCue=true;events.push('chargeMax');}
  if(released){
   s.phase='fire';s.timeMs=0;s.ammo--;s.serial++;s.shotSerial++;
   const damage=cannonadeChargePower({minimumPower:CANNONADE.power,maximumPower:CANNONADE.maximumPower,elapsedMs:s.chargeMs,durationMs:CANNONADE.chargeMs});
   s.pendingShots.push({id:s.shotSerial,max:s.maxCue,damage,chargeMs:s.chargeMs,aimPitch:s.aimPitch,aimTarget:s.aimTarget&&{...s.aimTarget}});
   events.push(s.maxCue?'shotMax':'shot');
  }
 }
}
export function cannonadePose(s,direction,moving){
 const base={loop:true,speed:1,fade:500/4800,restartKey:s.serial};
 if(s.phase==='idle')return moving?{...base,clip:'E0019',fade:2000/4800,lower:CANNONADE.runLower[direction]}:{...base,clip:'E0018',fade:1000/4800};
 if(s.phase==='reload')return {...base,clip:'E0007',fade:1000/4800,time:s.timeMs/1000,
  // User-observed mobile reload policy, not an explicit directional Reload Lua.
  ...(moving?{lower:CANNONADE.runLower[direction]}:{})};
 const firing=s.phase==='fire',clip=firing?'E0005_C':'E0002';
 return {...base,clip,loop:!firing,time:firing?Math.min(s.timeMs/1000,1.5):s.timeMs/1000%(8000/4800),
  aimBlend:{clip:firing?(s.aimPitch>=0?'E0004_C':'E0006_C'):(s.aimPitch>=0?'E0001':'E0003'),weight:Math.min(1,Math.abs(s.aimPitch)/(Math.PI/2))},
  lower:moving?CANNONADE.actionLower[direction]:'E0001',lowerRateScale:moving?(4000/4800)/.8:1};
}
