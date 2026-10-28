// Offline source closure: visibility-subject/HANDOFF.md (PE 6bea9d8c…).
// These are raw native fields. Scene support, selected subject identity and
// lifecycle eligibility belong to the caller; a registry entry is not a phase.
const excludedRuleCodes=new Set([7,8,9,12,13,20]);

function byte(value,name){
 if(!Number.isInteger(value)||value<0||value>255)throw TypeError(`${name} must be an explicit native byte`);
 return value;
}
function boolean(value,name){
 if(typeof value!=='boolean')throw TypeError(`${name} must be an explicit boolean`);
 return value;
}

// 71A650: source game-state2 and virtual+C time-state2/3 switch map sides.
// These are the rule's raw state codes, not S5 phase names. The concrete TD
// getter11E1440 is qualified and independently observed across both halves.
// No rule or Arena20 returns before reading the following state fields.
export function nativeRadarSideSwitch({rulePresent,ruleCode,gameStateCode,gameTimeStateCode}){
 boolean(rulePresent,'rulePresent');
 if(!rulePresent)return false;
 if(byte(ruleCode,'ruleCode')===20)return false;
 const word=(value,name)=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw TypeError(`${name} must be an explicit native uint32`);return value;};
 if(word(gameStateCode,'gameStateCode')!==2)return false;
 const timeState=word(gameTimeStateCode,'gameTimeStateCode');
 return timeState===2||timeState===3;
}

// Actor13AAFDC.slot210 =519310 ->106D770. Without a rule the actor returns0;
// with a rule but no briefing participant,106D770 returns4. Neither reads HP.
export function nativeRadarSubjectState({rulePresent,participantStateCode}){
 boolean(rulePresent,'rulePresent');
 if(!rulePresent)return 0;
 return participantStateCode===null?4:byte(participantStateCode,'participantStateCode');
}

// Owner8D989C..8D9A75 calls radar.slot1B4 only when a rule exists.
// Null is an explicit absent rule; absence must retain the previous AA byte.
export function nativeRadarUiEnabled({previousUiEnabled,ruleCode}){
 boolean(previousUiEnabled,'previousUiEnabled');
 if(ruleCode===null)return previousUiEnabled;
 return !excludedRuleCodes.has(byte(ruleCode,'ruleCode'));
}

// Update8EC630 and draw8EC7E0 are independent native calls. Missing registry5
// prevents sampling a new frame, but does not erase the previously cached one.
// XUI2 dormant's consumer is unqualified: do not alias it to AA/death/phase.
export function nativeRadarVisibility({previousUiEnabled,ruleCode,subjectStateCode,registeredObject5Present}){
 const uiEnabled=nativeRadarUiEnabled({previousUiEnabled,ruleCode});
 byte(subjectStateCode,'subjectStateCode');
 boolean(registeredObject5Present,'registeredObject5Present');
 return {
  uiEnabled,
  updateAllowed:registeredObject5Present,
  drawAllowed:uiEnabled&&(subjectStateCode===0||subjectStateCode===1),
 };
}
