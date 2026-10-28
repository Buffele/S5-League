import {acknowledgeS5RuntimeShieldBody} from './s5runtime-skill-shield-operation.js';

export function createS5RuntimeShieldBodyHost(){return {savedReturnStateId:null,bodyEntrySerial:null};}
function validSnapshot(snapshot){return Number.isInteger(snapshot?.actorStateId)&&Number.isSafeInteger(snapshot?.bodyEntrySerial)&&snapshot.bodyEntrySerial>=0;}
// The host owns a REAL current-body identity/entry serial. Returning a request
// object or merely accepting input is not a successful transition.
export function consumeS5RuntimeShieldBodyRequest(host,operation,request,{readBodySnapshot,requestBodyTransition}={}){
 const refuse=reason=>({accepted:false,reason,nativeReady:false});
 if(typeof readBodySnapshot!=='function'||typeof requestBodyTransition!=='function')return refuse('host-state-machine-required');
 if(request?.actorStateId!==34||request.requestSerial!==operation.pendingRequest?.requestSerial)return refuse('stale-body-request');
 const before=readBodySnapshot();if(!validSnapshot(before))return refuse('real-body-snapshot-required');
 const result=requestBodyTransition({actorStateId:34,reason:'shield-body-entry',requestSerial:request.requestSerial});
 if(result?.then)throw Error('Shield body host transition must complete synchronously');
 const after=readBodySnapshot();
 if(!validSnapshot(after)||after.actorStateId!==34||after.bodyEntrySerial===before.bodyEntrySerial)return refuse('body-transition-not-committed');
 const ack=acknowledgeS5RuntimeShieldBody(operation,{requestSerial:request.requestSerial,accepted:true,actorStateId:after.actorStateId,bodyEntrySerial:after.bodyEntrySerial});
 if(!ack.accepted)return ack;
 host.savedReturnStateId=before.actorStateId;host.bodyEntrySerial=after.bodyEntrySerial;
 return {...ack,bodySavedReturnStateId:host.savedReturnStateId,nativeReady:false,hostPolicy:'S5-explicit-body-state-machine'};
}
export function consumeS5RuntimeShieldBodyReturn(host,operation,request,{readBodySnapshot,requestBodyTransition}={}){
 const refuse=reason=>({accepted:false,reason,nativeReady:false});
 if(typeof readBodySnapshot!=='function'||typeof requestBodyTransition!=='function')return refuse('host-state-machine-required');
 const before=readBodySnapshot();
 if(!validSnapshot(before)||before.actorStateId!==34||before.bodyEntrySerial!==host.bodyEntrySerial||request?.actorStateId!==host.savedReturnStateId)return refuse('matching-body-return-required');
 const result=requestBodyTransition({actorStateId:host.savedReturnStateId,reason:'shield-body-return'});
 if(result?.then)throw Error('Shield body host transition must complete synchronously');
 const after=readBodySnapshot();if(!validSnapshot(after)||after.actorStateId!==host.savedReturnStateId||after.bodyEntrySerial===before.bodyEntrySerial)return refuse('body-return-not-committed');
 invalidateS5RuntimeShieldBodyHost(host,operation);
 return {accepted:true,actorStateId:after.actorStateId,bodyEntrySerial:after.bodyEntrySerial,nativeReady:false,hostPolicy:'S5-explicit-body-state-machine'};
}
export function invalidateS5RuntimeShieldBodyHost(host,operation){host.savedReturnStateId=null;host.bodyEntrySerial=null;operation.pendingRequest=null;operation.bodyEntrySerial=null;return host;}
