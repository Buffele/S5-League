// Plasma WEAK43 enters after the old input-frame Tick. Its expiry requests
// Standby4; the following input frame consumes events there before Normal5
// commits. This ports melee admission only: jump/dodge/movement retain their
// existing S5 policy. It does not certify a complete native Standby state, and
// no Standby clip or duration is inferred.
export function isPlasmaLight(attack){return attack?.weapon==='plasma'&&attack.kind==='light';}
export function deferPlasmaLightEntry(attack,inputFrame){
 return isPlasmaLight(attack)&&attack.plasmaLightEntryInputFrame===inputFrame;
}
export function requestPlasmaLightHandoff(inputFrame){
 return {phase:'standby-pending',requestedInputFrame:inputFrame};
}
export function finishPlasmaLightInputFrame(handoff,inputFrame,hadStep){
 if(!handoff||!hadStep)return handoff;
 if(handoff.requestedInputFrame===inputFrame)return {...handoff,phase:'standby'};
 return null;
}
