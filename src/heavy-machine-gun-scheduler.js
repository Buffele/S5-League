// Pinned S5Runtime PE 6bea9d8c…: 5ACAD0 (ammo then container then cycle),
// 56D890 (one-shot component timer). M/F readback: live-scheduler-v3-20261018.
// These are timer windows, not proof of native hit admission or damage parity.
export const HMG_TIMING=Object.freeze({beginMs:750,cycleMs:1666,firstAmmoMs:100,repeatAmmoMs:83,
 starts:Object.freeze([0,83,166,250,333,416,500,583,666,750,833,916,1000,1083,1166,1250,1333,1416,1500,1583])});
const timer=limit=>({ticks:0,limit,elapsed:0,paused:false});
function tick(t,ms){if(t.paused)return false;t.ticks=(t.ticks+1)>>>0;t.elapsed=(t.elapsed+ms)>>>0;return t.elapsed>t.limit;}
function reset(t,limit=t.limit){t.ticks=0;t.elapsed=0;t.limit=limit;}
export function createHmgClocks(){return {cycle:timer(HMG_TIMING.cycleMs),ammo:timer(HMG_TIMING.firstAmmoMs),components:HMG_TIMING.starts.map(timer)};}
export function advanceHmgClocks(clocks,milliseconds,{ammoAvailable=true}={}){
 if(!Number.isInteger(milliseconds)||milliseconds<0||milliseconds>0xffffffff)throw new RangeError('HMG native clocks require uint32 milliseconds');
 let debit=0;
 if(tick(clocks.ammo,milliseconds)){
  debit=Math.trunc(Math.fround(Math.fround(clocks.ammo.elapsed)/Math.fround(clocks.ammo.limit)));
  reset(clocks.ammo,HMG_TIMING.repeatAmmoMs);
  // Native checks ammunition before subtraction; reaching zero this update
  // still allows its container windows. Next expired ammo clock stops them.
  if(!ammoAvailable)return {debit:0,empty:true,windows:[],cycleReset:false};
 }
 const windows=[];
 clocks.components.forEach((t,index)=>{if(t.elapsed<=t.limit&&tick(t,milliseconds))windows.push(index);});
 const cycleReset=tick(clocks.cycle,milliseconds);
 if(cycleReset){reset(clocks.cycle);for(const t of clocks.components)reset(t);}
 return {debit,empty:false,windows,cycleReset};
}
