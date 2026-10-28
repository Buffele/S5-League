import {Controller} from './controller.js';
import {CUT_ACTION_MS} from './spy-dagger-timing.js';
// Original803F66 registers equipment24 to CAttackSpyDaggerState5DC700.
// Constructor/getters and32 record cases executed in conquest-dagger-20261023.
export const CONQUEST_DAGGER_CUT_ACTION_SOURCE=Object.freeze({itemKey:2000006,weaponType:24,nativeClass:'CAttackSpyDaggerState',vtable:0x13b17e0,constructor:0x5dc700,factory:0x803f66,width68:Math.fround(.7),height6c:1,slotB0:true,nativeReady:false});
export function assertConquestDaggerCutRuntime(controller){
 const a=controller?.attack;
 if(!(controller instanceof Controller)||controller.weapon!=='dagger'||!a||!['light','air'].includes(a.type)||!Number.isFinite(a.time)||a.time<0||a.duration!==CUT_ACTION_MS/1000||!['light','air'].includes(controller.state))throw Error('Actual retained Dagger cut Controller/action required');
 return a;
}
