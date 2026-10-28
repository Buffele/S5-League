import {AIRGUN} from './airgun-data.js';
import {CANNONADE} from './cannonade-runtime.js';
import {ROCKET_LAUNCHER} from './rocket-launcher-runtime.js';
const f=Math.fround;
export function activeSiegeMagazine(actor){
 const runtime=actor?.rifle??actor?.support??actor?.throwable??actor?.airgun??actor?.cannonade??actor?.rocketLauncher;
 const capacity=runtime?.capacity??runtime?.profile?.capacity??(actor?.airgun?AIRGUN.magazine:actor?.cannonade?CANNONADE.capacity:actor?.rocketLauncher?ROCKET_LAUNCHER.capacity:null);
 return {runtime,capacity,reserve:runtime&&Object.hasOwn(runtime,'reserve')?runtime.reserve:Infinity};
}
// B901D0: these are raw component368 inputs, not an assumed elapsed time.
// The ordinary S5 profile supplies the source constructor's zero values;
// dynamic native modifiers still require their own current-state mapping.
export function siegeMagazineWriteIsDeferred({ammo,reserve,primary2=0,secondary2=0}){
 if(!Number.isFinite(primary2)||!Number.isFinite(secondary2))throw Error('Explicit finite ammunition component inputs required');
 return ammo===0&&reserve!==0&&!(f(primary2)>f(.1)||f(secondary2)>f(.1));
}
export function siegeMagazineReward(ammo,capacity,rate){
 const percent=Math.round(rate*100),increment=Math.trunc(f(f(f(capacity)*f(percent))*f(.01)));
 return Math.min(capacity,ammo+increment);
}
