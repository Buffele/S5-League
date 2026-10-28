const f=Math.fround;
export const S5RUNTIME_NATIVE_MP_GATES=Object.freeze({nativeReady:false,liveActorObserved:false,nativeCompared:false,source:'work/parallel-gameplay-reference/competences/native-mp/source-proof.json'});
const finite=(values,message)=>{if(!values.every(Number.isFinite))throw Error(message);};
//51E8E0: property15F3D88, attribute14C, protected actor3F4,
//then only mode8 with matching native owner applies mode+D0 multiplier.
export function s5runtimeNativeMpRecoveryRate({rawRecoveryRate,flat14c=0,percent14c=0,actorAddend3f4=0,mode8OwnerMatches=false,mode8RecoveryMultiplier}={}){
 finite([rawRecoveryRate,flat14c,percent14c,actorAddend3f4],'Explicit finite native MP recovery fields required');
 let rate=f(f(f(rawRecoveryRate)+f(flat14c))+f(f(rawRecoveryRate)*f(percent14c)));rate=f(rate+f(actorAddend3f4));
 if(mode8OwnerMatches){finite([mode8RecoveryMultiplier],'Explicit native mode8+D0 multiplier required');rate=f(rate*f(mode8RecoveryMultiplier));}return rate;
}
export function s5runtimeNativeMpItemAdjustedRate(rate,nativeItemTypes){finite([rate],'Explicit recovery rate required');if(!Array.isArray(nativeItemTypes)||nativeItemTypes.some(t=>t!==null&&!Number.isInteger(t)))throw Error('Explicit native item categories required');for(const type of nativeItemTypes){const multiplier={1:.9,2:.5,3:.3,4:.1,5:0}[type];if(multiplier!==undefined)rate=f(f(rate)*f(multiplier));}return rate;}
export function createS5RuntimeNativeMpProfile({actorId,currentMp,maximumMp,regenerationEnabled,rawRecoveryRate,flat14c=0,percent14c=0,actorAddend3f4=0,mode8OwnerMatches=false,mode8RecoveryMultiplier,gameTempoFlat1,gameTempoPercent1}={}){
 finite([currentMp,maximumMp,rawRecoveryRate,gameTempoFlat1,gameTempoPercent1],'Actor-scoped MP values/cap/recovery/GameTempo required');if(currentMp<0||maximumMp<0||typeof regenerationEnabled!=='boolean'||typeof mode8OwnerMatches!=='boolean')throw Error('Invalid native MP profile');s5runtimeNativeMpRecoveryRate({rawRecoveryRate,flat14c,percent14c,actorAddend3f4,mode8OwnerMatches,mode8RecoveryMultiplier});return {actorId,currentMp:f(currentMp),maximumMp:f(maximumMp),regenerationEnabled,rawRecoveryRate,flat14c,percent14c,actorAddend3f4,mode8OwnerMatches,mode8RecoveryMultiplier,gameTempoFlat1,gameTempoPercent1};
}
//51EA50 stores a bool, not a reference counter. Caller owns native lifetime.
export function setS5RuntimeNativeMpRegeneration(profile,enabled){if(typeof enabled!=='boolean')throw Error('Native regeneration bool required');profile.regenerationEnabled=enabled;return profile;}
export function advanceS5RuntimeNativeMp(profile,dtMs,{nativeContext}={}){
 if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw Error('Native MP delta must be uint32 milliseconds');
 const commands={},result=reason=>({currentMp:profile.currentMp,maximumMp:profile.maximumMp,commands,reason,...S5RUNTIME_NATIVE_MP_GATES});
 const nc=nativeContext,flags=['currentStateExists','conditionType400','conditionQuery200','native527650Result','native52c2f0Result','actorSlotD4','currentStateSlotB0','shieldActive'];
 if(nc?.enabled!==true||flags.some(k=>typeof nc[k]!=='boolean')||!Array.isArray(nc.nativeItemTypes))return result('explicit-native-mp-context-required');
 if(!nc.currentStateExists)return result('no-native-current-state');
 //52B148..52B219 applies this branch before regeneration-enabled checks.
 if(nc.conditionType400&&nc.conditionQuery200){if(!Number.isInteger(nc.currentStateId))return result('native-current-state-id-required');profile.currentMp=0;commands.nativeMpForcedZero=true;if([0x25,0x22,0x1f,0x21].includes(nc.currentStateId))commands.nativeCurrentStateSlot24Call=true;return result('native-condition-forces-zero');}
 if(nc.native527650Result&&!nc.native52c2f0Result)return result('native-predicate-recovery-blocked');
 if(!profile.regenerationEnabled||!nc.actorSlotD4||!nc.currentStateSlotB0||nc.shieldActive)return result('native-regeneration-gated');
 const rate=s5runtimeNativeMpItemAdjustedRate(s5runtimeNativeMpRecoveryRate(profile),nc.nativeItemTypes);if(rate===0)return result('native-recovery-rate-zero');
 const seconds=f(f(dtMs)*f(.001)),cap=f(profile.maximumMp);
 let gain=f(f(f(f(rate)*f(.01))*cap)*seconds);
 gain=f(f(f(f(cap)*f(profile.gameTempoPercent1))*seconds)+gain);
 gain=f(gain+f(f(profile.gameTempoFlat1)*seconds));
 profile.currentMp=f(Math.min(cap,Math.max(0,f(f(profile.currentMp)+gain))));commands.nativeMpGain=gain;
 return result('diagnostic-native-mp-recovery');
}
