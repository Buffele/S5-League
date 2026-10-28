// CFastRunVerIronBoots event handler61c270. These are native event IDs,
// Current actorstates_constants.lua maps5/6/7 to primary begin/end/short.
// State39 is USE_WEAPON1, current item2000035 left_attack is DashKick.
export function ironBootsBoostNativeEventDecision(eventId,{elapsedMs,inputWaitMs=100,remoteActor=false}={}){
 if(!Number.isInteger(eventId)||!Number.isFinite(elapsedMs)||elapsedMs<0||!Number.isFinite(inputWaitMs)||inputWaitMs<0)
  throw new RangeError('Invalid native boost event or timer');
 if(remoteActor)return {handled:false,forwardToBase:false};
 if(eventId===21||eventId===23)return {handled:true,forwardToBase:false,requestSavedState:true};
 if(eventId>=5&&eventId<=7){
  if(elapsedMs<=inputWaitMs)return {handled:true,forwardToBase:false};
  return {handled:true,forwardToBase:true,actorFlags:{offset49c:1,offset4a0:1},lookupNativeStateId:39};
 }
 return {handled:true,forwardToBase:true,...([32,33,34].includes(eventId)?{invokeNative564330:true}:{})};
}

export function ironBootsBoostInputTransition(attack,input){
 if(attack?.weapon!=='ironboots'||attack.kind!=='boost')return null;
 const eventId=input.lightPressed?5:input.lightReleased?6:input.lightShort?7:null;
 if(eventId===null)return null;
 const decision=ironBootsBoostNativeEventDecision(eventId,{elapsedMs:attack.timeMs,inputWaitMs:attack.profile.weaponInputWaitMs});
 return decision.lookupNativeStateId===39?{kind:'dash',combo:0}:null;
}
