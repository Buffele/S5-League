const directions={front:'DD005',leftFront:'DD006',left:'DD007',rightFront:'DD008',right:'DD009',back:'DD010',leftBack:'DD011',rightBack:'DD012',normal:'I0004'};
const supported=new Set([3050001,3050002]);
// Enter6491DF..649216: unsigned channel0+2C -> float32 -> /4.8f ->
// FE6050 integer conversion. Input identity must be the native channel field;
// this does not certify that an arbitrary SCN metadata duration is that field.
export function s5runtimeShieldBodyDurationFromNativeTicks(rawTicks){
 if(!Number.isInteger(rawTicks)||rawTicks<0||rawTicks>0xffffffff)throw Error('Native channel0 uint32 ticks required');
 return Math.trunc(Math.fround(Math.fround(rawTicks)/Math.fround(4.8)));
}
function bodyCommand(phase){return {target:'body',channels:[0,3,4,5],clip:phase==='begin'?'I0003':'I0004',durationOverrideMs:0,blendTicks:phase==='begin'?300:1000,nextBlendExtraTicks:0,loop:phase==='end',speed:1,reset:true,fittingVerified:false,nativeReady:false};}
export function createS5RuntimeShieldBodyPose({itemKey,bodyEntrySerial,componentActiveOnEntry,nativeBeginAnimationDurationMs,bodyStateConfirmed}={}){
 if(!supported.has(itemKey)||bodyStateConfirmed!==true||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<0||typeof componentActiveOnEntry!=='boolean')throw Error('Explicit Shield body entry required');
 // Enter648C70 reads channel0 +2C then divides by4.8f/truncates. A rig clip's tick duration or the SP
 // activation delay is not automatically this native playback duration.
 if(!componentActiveOnEntry&&(!Number.isInteger(nativeBeginAnimationDurationMs)||nativeBeginAnimationDurationMs<0||nativeBeginAnimationDurationMs>0xffffffff))throw Error('Native channel0 animation duration required');
 return {itemKey,bodyEntrySerial,phase:componentActiveOnEntry?'end':'begin',elapsedMs:componentActiveOnEntry?1:0,durationMs:componentActiveOnEntry?0:nativeBeginAnimationDurationMs,entryPending:true};
}
// Consume during real body Enter, before the first Tick can request Leave.
export function consumeS5RuntimeShieldBodyEntryPose(state){if(!state.entryPending)return [];state.entryPending=false;return [bodyCommand(state.phase)];}
export function advanceS5RuntimeShieldBodyPose(state,dtMs,{bodyStateConfirmed,bodyEntrySerial,bodyAnimationTimerBlocked}={}){
 if(!Number.isInteger(dtMs)||dtMs<0)throw Error('Native body Tick integer milliseconds required');
 if(bodyStateConfirmed!==true||bodyEntrySerial!==state.bodyEntrySerial)return {accepted:false,commands:[],reason:'matching-body-entry-required',nativeReady:false};
 if(typeof bodyAnimationTimerBlocked!=='boolean')return {accepted:false,commands:[],reason:'native-body-animation-timer-predicate-required',nativeReady:false};
 const commands=consumeS5RuntimeShieldBodyEntryPose(state);
 // Tick649660: timer+158/+15C/+160, blocked byte+164. Independent
 // from actorSlot3c and activation timer+148/+14C/+150/blocked+154.
 if(state.elapsedMs<=state.durationMs&&!bodyAnimationTimerBlocked){
  state.elapsedMs=(state.elapsedMs+dtMs)>>>0;
  if(state.elapsedMs>state.durationMs){state.phase='end';commands.push(bodyCommand('end'));}
 }
 return {accepted:true,commands,phase:state.phase,bodyEntrySerial:state.bodyEntrySerial,nativeReady:false};
}
export function s5runtimeShieldLowerPose({bodyStateConfirmed,weaponType,nativeLowerDirection,lowerPartStateConfirmed}={}){
 if(bodyStateConfirmed!==true||lowerPartStateConfirmed!==true||!Number.isInteger(weaponType))return null;
 if(weaponType===43)return {available:false,reason:'weapon43-IB-clips-missing-in-tested-carriers',nativeReady:false};
 const clip=directions[nativeLowerDirection];if(!clip)return null;
 return {target:'lowerPartStateSet0',clip,durationOverrideMs:0,blendTicks:500,nextBlendExtraTicks:0,loop:true,speed:1,reset:nativeLowerDirection==='normal',channelMappingVerified:false,nativeReady:false};
}
