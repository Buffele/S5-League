// Explicit S5 presentation adaptation. Native channel-to-mask mapping is open.
export function normalizeShieldBodyPresentationPolicy(value){
 if(value?.kind!=='s5-explicit-adaptation'||typeof value.id!=='string'||!value.id.trim()||!['s5-avatar-upper-and-lower','s5-avatar-upper-with-explicit-lower'].includes(value.maskPolicy)||value.clockPolicy!=='s5-animation-player'||!['begin','end'].every(phase=>Number.isFinite(value.fadeSeconds?.[phase])&&value.fadeSeconds[phase]>=0)||!Number.isFinite(value.playbackSpeed)||value.playbackSpeed<0)throw new TypeError('Explicit named S5 Shield presentation masks, clock, speed and fades required');
 return Object.freeze({kind:value.kind,id:value.id,maskPolicy:value.maskPolicy,clockPolicy:value.clockPolicy,playbackSpeed:value.playbackSpeed,fadeSeconds:Object.freeze({...value.fadeSeconds})});
}
export function normalizeShieldLowerPresentationSnapshot(body,value){
 if(!body||body.actorStateId!==34||value?.schema!=='shield-lower-presentation-v1'||value.bodyEntrySerial!==body.bodyEntrySerial||!Number.isSafeInteger(value.bodyEntrySerial)||value.bodyEntrySerial<1||value.lowerSet!==(body.tick.weaponType===43?1:0)||!Number.isInteger(value.child)||value.child<0||value.child>2||!Number.isInteger(value.phase)||value.phase<0||value.phase>9||typeof value.clip!=='string'||!value.clip.trim()||typeof value.loop!=='boolean'||!Number.isFinite(value.speed)||value.speed<0||!Number.isFinite(value.fadeSeconds)||value.fadeSeconds<0||!Number.isSafeInteger(value.playbackSerial)||value.playbackSerial<0||value.provenance?.kind!=='s5-explicit-adaptation'||typeof value.provenance.source!=='string'||!value.provenance.source.trim())throw new TypeError('Matching Shield body and explicit S5 lower snapshot required');
 return Object.freeze({schema:value.schema,bodyEntrySerial:value.bodyEntrySerial,lowerSet:value.lowerSet,child:value.child,phase:value.phase,clip:value.clip,loop:value.loop,speed:value.speed,fadeSeconds:value.fadeSeconds,playbackSerial:value.playbackSerial,provenance:Object.freeze({...value.provenance}),nativeChannelMappingVerified:false,nativeReady:false});
}
export function shieldBodyPresentationPose(body,policy,lowerSnapshot=null){
 if(!body||!policy)return null;
 const confirmed=normalizeShieldBodyPresentationPolicy(policy),phase=body.tick?.pose?.phase;
 if(body.actorStateId!==34||!Number.isSafeInteger(body.bodyEntrySerial)||!['begin','end'].includes(phase))throw new TypeError('Actual installed Shield body phase required');
 const pose={clip:phase==='begin'?'I0003':'I0004',loop:phase==='end',speed:confirmed.playbackSpeed,fade:confirmed.fadeSeconds[phase],restartKey:`shield-body:${body.bodyEntrySerial}:${phase}`,
  shieldPresentation:{policyId:confirmed.id,maskPolicy:confirmed.maskPolicy,clockPolicy:confirmed.clockPolicy,sourceChannels:[0,3,4,5],sourceBlendTicks:phase==='begin'?300:1000,nativeChannelMappingVerified:false,nativeFittingVerified:false,nativeReady:false}};
 if(confirmed.maskPolicy==='s5-avatar-upper-with-explicit-lower'){
  const lower=normalizeShieldLowerPresentationSnapshot(body,lowerSnapshot);
  Object.assign(pose,{lower:lower.clip,lowerLoop:lower.loop,lowerSpeed:lower.speed,lowerFade:lower.fadeSeconds,lowerRestartKey:`shield-lower:${lower.bodyEntrySerial}:${lower.lowerSet}:${lower.playbackSerial}`});
  pose.shieldPresentation.lower={bodyEntrySerial:lower.bodyEntrySerial,lowerSet:lower.lowerSet,child:lower.child,phase:lower.phase,playbackSerial:lower.playbackSerial,provenance:lower.provenance,nativeChannelMappingVerified:false,nativeReady:false};
 }
 return pose;
}
