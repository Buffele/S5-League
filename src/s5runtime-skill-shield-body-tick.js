import {advanceS5RuntimeShieldBodyPose} from './s5runtime-skill-shield-body.js';

export function createS5RuntimeShieldBodyTick({pose,componentActiveOnEntry,weaponType,bodyCompletionDurationMs,savedReturnStateId}={}){
 if(!pose||typeof componentActiveOnEntry!=='boolean'||!Number.isInteger(weaponType)||!Number.isInteger(savedReturnStateId)||!Number.isInteger(bodyCompletionDurationMs)||bodyCompletionDurationMs<0||bodyCompletionDurationMs>0xffffffff)throw Error('Explicit Shield body timer/entry profile required');
 return {pose,activationAttempted:componentActiveOnEntry,weaponType,bodyCompletionDurationMs,bodyCompletionElapsedMs:0,savedReturnStateId};
}
export function tickS5RuntimeShieldBody(state,dtMs,ports={}){
 const names=['baseTick','readFrameContext','activationTick','componentBegin','requestBodyReturn','lowerEnter','lowerTick'];
 if(names.some(k=>typeof ports[k]!=='function'))throw Error('Shield body native/base/lower ports required');
 if(!Number.isInteger(dtMs)||dtMs<0)throw Error('Native Shield body integer Tick required');
 ports.baseTick(dtMs);
 const raw=ports.readFrameContext();
 if(typeof raw?.actorSlot3c!=='boolean'||typeof raw.componentActive!=='boolean'||typeof raw.bodyCompletionTimerBlocked!=='boolean'||typeof raw.bodyAnimationTimerBlocked!=='boolean'||!Number.isInteger(raw.weaponType))throw Error('Shield body raw Tick predicates required');
 if(raw.bodyStateConfirmed!==true||raw.bodyEntrySerial!==state.pose.bodyEntrySerial)return {accepted:false,reason:'body-no-longer-current',commands:[],nativeReady:false};
 if(!raw.actorSlot3c){
  if(!state.activationAttempted){
   const activation=ports.activationTick(dtMs,raw);
   if(typeof activation?.componentBegin!=='boolean')throw Error('Explicit activation Tick result required');
   if(activation.componentBegin){
    // Native +178 is written before Begin. Failure is observed next Tick;
    // there is no automatic retry or inference from resulting active flag.
    state.activationAttempted=true;ports.componentBegin();
   }
  }else if(!raw.componentActive){
   ports.requestBodyReturn({actorStateId:state.savedReturnStateId,source:'body+144'});
   return {accepted:true,reason:'inactive-component-body-return-request',commands:[],nativeReady:false};
  }
 }
 if(!raw.bodyCompletionTimerBlocked)state.bodyCompletionElapsedMs=(state.bodyCompletionElapsedMs+dtMs)>>>0;
 if(raw.weaponType!==state.weaponType){ports.lowerEnter(raw.weaponType);state.weaponType=raw.weaponType;}
 ports.lowerTick(dtMs,{weaponType:state.weaponType,bodyCompletionElapsedMs:state.bodyCompletionElapsedMs,bodyCompletionDurationMs:state.bodyCompletionDurationMs});
 return {...advanceS5RuntimeShieldBodyPose(state.pose,dtMs,raw),reason:'source-body-tick-ports',nativeReady:false};
}
