import {createSmashRifleState,advanceSmashRifle,smashRiflePose} from './smash-rifle-runtime.js';
import {createRevolverGameplay,advanceRevolverGameplay,revolverGameplayPose} from './revolver-gameplay.js';
import {createSemiRifleState,advanceSemiRifle,semiRiflePose} from './semi-rifle-runtime.js';
import {createSubmachineGunState,advanceSubmachineGun,submachineGunPose} from './submachine-gun-runtime.js';
import {createHandgunState,advanceHandgun,handgunPose} from './handgun-runtime.js';
import {createAssaultRifleState,advanceAssaultRifle,assaultRiflePose} from './assault-rifle-runtime.js';
import {createBurstShotgunState,advanceBurstShotgun,burstShotgunPose} from './burst-shotgun-runtime.js';
import {createHeavyMachineGunState,advanceHeavyMachineGun,heavyMachineGunPose} from './heavy-machine-gun-runtime.js';
import {createSparkRifleSourceState,advanceSparkRifleSource,sparkRifleSourcePose,cancelSparkRifleSource} from './spark-rifle-source-runtime.js';
import {captureRifleMapAttackSource} from './map-attack-source.js';

// Family adapters retain their own native timings, animation channels and ammo.
// Both simulation and presentation use this registry when equipment changes.
const families=Object.freeze({
 smashrifle:{create:createSmashRifleState,advance:advanceSmashRifle,pose:smashRiflePose},
 revolver:{create:createRevolverGameplay,advance:advanceRevolverGameplay,pose:revolverGameplayPose},
 semirifle:{create:createSemiRifleState,advance:advanceSemiRifle,pose:semiRiflePose},
 submachinegun:{create:createSubmachineGunState,advance:advanceSubmachineGun,pose:submachineGunPose},
 handgun:{create:createHandgunState,advance:advanceHandgun,pose:handgunPose,ownsPendingShots:true},
 assaultrifle:{create:createAssaultRifleState,advance:advanceAssaultRifle,pose:assaultRiflePose,ownsPendingShots:true},
 burstshotgun:{create:createBurstShotgunState,advance:advanceBurstShotgun,pose:burstShotgunPose,ownsPendingShots:true},
 heavymachinegun:{create:createHeavyMachineGunState,advance:advanceHeavyMachineGun,pose:heavyMachineGunPose,ownsPendingShots:true},
 // Source adapter only: main exposure/contact still require the explicit
 // deferred-offset consumer and the source model/animation loadout.
 sparkrifle:{create:()=>{const state=createSparkRifleSourceState();state.muzzle=state.profile.muzzle;return state;},advance:advanceSparkRifleSource,
  pose:(state,direction,moving,sex)=>{
   const pose=sparkRifleSourcePose(state,direction,moving,sex);
   // Bridge the source adapter's explicit lower requests to Avatar's
   // independent playback API. Mobile reload remains an unresolved mapping.
   return {...pose,lowerLoop:pose.lowerLoopRequested,
    lowerRestartKey:pose.lowerRestartRequested?`sparkrifle/${state.phase}/${state.cycleSerial}`:null,
    lowerSpeed:pose.lower&&!moving?(pose.lowerRateScale??1):undefined};
  },cancel:cancelSparkRifleSource,ownsPendingShots:true},
});
export const isRifleWeapon=weapon=>Object.hasOwn(families,weapon);
export const createRifleRuntime=weapon=>families[weapon]?.create()??null;
export const rifleOwnsPendingShots=weapon=>families[weapon]?.ownsPendingShots===true;
export function cancelRifleRuntime(weapon,state,held=false){
 if(!isRifleWeapon(weapon))throw new RangeError('Unknown rifle family '+weapon);
 if(families[weapon].cancel)return families[weapon].cancel(state,{held});
 state.phase='idle';state.pendingShots=[];state.activationPending=false;state.held=held;
 return state;
}
export function advanceRifleRuntime(weapon,state,dt,input,events){
 if(!isRifleWeapon(weapon))throw new RangeError('Unknown rifle family '+weapon);
 const previous=new Set(state.pendingShots),eventStart=events.length;
 const result=families[weapon].advance(state,dt,input,events);
 for(const shot of state.pendingShots)if(!previous.has(shot))shot.mapAttackSource=captureRifleMapAttackSource(weapon,state,shot);
 if(events.slice(eventStart).includes('shot'))state.mapAttackSource=captureRifleMapAttackSource(weapon,state);
 return result;
}
export function rifleRuntimePose(weapon,state,direction,moving,sex){
 if(!isRifleWeapon(weapon))throw new RangeError('Unknown rifle family '+weapon);
 return families[weapon].pose(state,direction,moving,sex);
}
