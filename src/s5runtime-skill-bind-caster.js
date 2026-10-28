import {s5runtimeBindPacketDuration,s5runtimeBindRequiredSp} from './s5runtime-skill-bind-kernel.js';
const f=Math.fround;
//80F0D0..80F191 loads s32[120]=5000 and s32[39]=250 three times,
//6426A0 assigns normal/recovery/emit/cooldown to118/124/130/13C.
export const S5RUNTIME_BIND_CAST_TIMING=Object.freeze({normalMs:250,recoveryMs:250,emitMs:250,cooldownMs:5000,nativeReady:false});
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function s5runtimeBindNativeCooldownReady({nowMs,lastSuccessMs,flat150=0,percent150=0,actorByte6c,actorSlot224}={}){
 if(!uint(nowMs)||!uint(lastSuccessMs)||![0,1].includes(actorByte6c)||![flat150,percent150].every(Number.isFinite))return false;
 if(actorByte6c===1)return true;
 if(typeof actorSlot224!=='boolean')return false;
 const base=S5RUNTIME_BIND_CAST_TIMING.cooldownMs,adjusted=Math.max(0,base-Math.trunc(f(flat150))-Math.trunc(f(f(base)*f(percent150))));
 //643A30 compares unsigned(lastSuccess+adjusted) strictly < native clock.
 return ((lastSuccessMs+adjusted)>>>0)<nowMs&&actorSlot224;
}
export function createS5RuntimeBindCastState({itemKey=3070001}={}){s5runtimeBindPacketDuration(itemKey);return {itemKey,entered:false,bodySubstate:2,emitElapsedMs:0,normalElapsedMs:0,emitCounter:0,normalCounter:0,emitTimerBlocked:false,normalTimerBlocked:false,castAttempted:false};}
export function enterS5RuntimeBindCast(state,{nativeContext}={}){
 if(nativeContext?.enabled!==true||nativeContext.bodyEntryConfirmed!==true||![0,1].includes(nativeContext.actorByte6c))return {accepted:false,commands:{},reason:'explicit-native-bind-body-entry-required',nativeReady:false};
 state.entered=true;state.emitElapsedMs=0;state.normalElapsedMs=0;state.emitCounter=0;state.normalCounter=0;state.castAttempted=false;if(nativeContext.actorByte6c===0)state.bodySubstate=0;
 //SP is a caster/base-state transaction, not a target condition transaction.
 //Expose source required value; no unproved debit or regeneration mutation.
 return {accepted:true,commands:{nativeRequiredSp:s5runtimeBindRequiredSp(state.itemKey,nativeContext.attribute160)},nativeReady:false};
}
export function advanceS5RuntimeBindCast(state,dtMs,{nativeContext}={}){
 if(!uint(dtMs))throw Error('Native Bind tick requires uint32 milliseconds');
 const commands={},result=reason=>({bodySubstate:state.bodySubstate,castAttempted:state.castAttempted,commands,reason,nativeReady:false});
 if(nativeContext?.enabled!==true||nativeContext.bodyStateConfirmed!==true||![0,1].includes(nativeContext.actorByte6c))return result('explicit-native-bind-body-state-required');
 if(!state.entered||nativeContext.actorByte6c!==0)return result('native-bind-body-not-advanced');
 //642E70 checks elapsed<=duration before advancing emission timer: one crossing.
 if(state.emitElapsedMs<=S5RUNTIME_BIND_CAST_TIMING.emitMs&&!state.emitTimerBlocked){state.emitCounter=(state.emitCounter+1)>>>0;state.emitElapsedMs=(state.emitElapsedMs+dtMs)>>>0;if(state.emitElapsedMs>S5RUNTIME_BIND_CAST_TIMING.emitMs){state.castAttempted=true;commands.bindCastSelectionRequest={itemKey:state.itemKey,actionCode:0x10,durationMs:s5runtimeBindPacketDuration(state.itemKey),qualification:'native-target-shape-and-occlusion-consumer-required'};}}
 if(state.bodySubstate===0&&!state.normalTimerBlocked){state.normalCounter=(state.normalCounter+1)>>>0;state.normalElapsedMs=(state.normalElapsedMs+dtMs)>>>0;if(state.normalElapsedMs>S5RUNTIME_BIND_CAST_TIMING.normalMs){state.bodySubstate=1;commands.nativeBodySubstate=1;}}
 return result('diagnostic-bind-cast-schedule');
}
