import {s5runtimeShieldNativeEligibility} from './s5runtime-skill-shield-kernel.js';
import {endS5RuntimeSkillDiagnostic} from './s5runtime-skill-runtime.js';

// Operational adapter for the host state machine. It never invents native raw
// predicates, confirms a body request, advances clocks or applies rendering.
export function createS5RuntimeShieldOperation(){return {requestSerial:0,pendingRequest:null,bodyEntrySerial:null};}

export function requestS5RuntimeShieldOperation(operation,skillState,{nativeInputCode,energy,nativeContext}={}){
 const refuse=reason=>({accepted:false,reason,nativeReady:false});
 if(![3050001,3050002].includes(skillState.itemKey))return refuse('shield-not-equipped');
 if(nativeContext?.enabled!==true)return refuse('explicit-context-required');
 // Only the single equipped slot is represented here. Code22 remains a
 // separate explicit slot1 contract in the existing component facade.
 if(nativeInputCode!==20)return refuse('no-slot0-press');
 if(nativeContext.slot0ActionType!==undefined&&nativeContext.slot0ActionType!==4)return refuse('slot0-action-type-mismatch');
 if(nativeContext.currentStateExists===true&&nativeContext.actorStateId===34){
  // Body Input649B40 differs from component InputB86D10: matching press
  // ends an active component directly, then returns to saved body+144.
  if(nativeContext.actorSlot3c!==false)return refuse('native-body-input-predicate-required');
  const saved=nativeContext.bodySavedReturnStateId;
  if(!Number.isInteger(saved))return refuse('body-saved-return-state-required');
  return {accepted:true,componentEnd:skillState.shield.active,bodyReturnRequest:{actorStateId:saved,source:'body+144'},reason:'body-input-return-request',nativeReady:false};
 }
 if(skillState.shield.active)return {accepted:true,nativeInputCode:20,reason:'component-input-request',nativeReady:false};
 if(nativeContext.dispatcherEligibilityConfirmed!==true)return refuse('dispatcher-eligibility-required');
 if(!s5runtimeShieldNativeEligibility(skillState.shield,energy,nativeContext))return refuse('component-ineligible');
 if(operation.pendingRequest)return refuse('body-request-pending');
 const request={type:'s5runtime-skill-body-request',actorStateId:34,itemKey:skillState.itemKey,requestSerial:++operation.requestSerial};
 operation.pendingRequest=request;
 return {accepted:true,bodyRequest:{...request},reason:'await-body-entry-ack',nativeReady:false};
}

export function acknowledgeS5RuntimeShieldBody(operation,{requestSerial,accepted,bodyEntrySerial,actorStateId}={}){
 if(!operation.pendingRequest||operation.pendingRequest.requestSerial!==requestSerial)return {accepted:false,reason:'stale-body-request'};
 if(accepted!==true){operation.pendingRequest=null;return {accepted:false,reason:'body-entry-refused'};}
 if(actorStateId!==34||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<0)return {accepted:false,reason:'explicit-body34-entry-required'};
 operation.bodyEntrySerial=bodyEntrySerial;operation.pendingRequest=null;
 return {accepted:true,bodyEntrySerial};
}

export function s5runtimeShieldOperationContext(operation,nativeContext){
 // The host must report actual current state and all body timer predicates.
 // Caller supplies this frame's context, including any Begin/End edge. This
 // function does not cache context or clear edges supplied by the caller.
 const bodyStateConfirmed=operation.bodyEntrySerial!==null&&nativeContext?.currentStateExists===true&&nativeContext.actorStateId===34&&nativeContext.bodyEntrySerial===operation.bodyEntrySerial;
 return {...nativeContext,bodyStateConfirmed,...(bodyStateConfirmed?{bodyEntrySerial:operation.bodyEntrySerial}:{})};
}

export function endS5RuntimeShieldOperation(operation,skillState,options={}){
 // Consume returned commands before host reset/equip/disposal. This is a
 // diagnostic lifecycle action, not a native blur/menu cancellation claim.
 const result=endS5RuntimeSkillDiagnostic(skillState,options);
 operation.pendingRequest=null;operation.bodyEntrySerial=null;
 return result;
}
