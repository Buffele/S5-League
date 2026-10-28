const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
function provenance(value){if(typeof value!=='string'||!value.trim())throw Error('Actor profile provenance required');return value;}
export function createS5RuntimeShieldActorProfile({actorId,sourceClass,provenance:origin}={}){
 if((typeof actorId!=='string'&&typeof actorId!=='number')||String(actorId).length===0||sourceClass!=='13C1C14')throw Error('Explicit actor identity and source class13C1C14 required');
 return {actorId,sourceClass,provenance:provenance(origin),revision:0,actorByte6c:0,protected154:true,protected1aa:false,property128:false,timer324:{counter:0,duration:0,elapsed:0,blocked:false},writerLedger:[],nativeEligibilityVerified:false,nativeActorObserved:false,nativeReady:false};
}
export function updateS5RuntimeShieldActorProfile(profile,changes,{provenance:origin,sourceSite}={}){
 provenance(origin);if(typeof sourceSite!=='string'||!sourceSite.trim())throw Error('Typed writer source/adaptation site required');
 const names=Object.keys(changes??{}),allowed=['actorByte6c','protected154','protected1aa','property128','timer324'];if(names.some(k=>!allowed.includes(k)))throw Error('Unknown typed actor profile field');
 if('actorByte6c' in changes&&![0,1].includes(changes.actorByte6c))throw Error('Profile supports actorByte6c0/1 only');
 for(const k of ['protected154','protected1aa','property128'])if(k in changes&&typeof changes[k]!=='boolean')throw Error('Typed actor bool required');
 if('timer324' in changes){const timer=changes.timer324;if(!timer||Object.keys(timer).some(k=>!['counter','duration','elapsed','blocked'].includes(k)))throw Error('Unknown actor timer field');for(const k of ['counter','duration','elapsed'])if(k in timer&&!u32(timer[k]))throw Error('Actor timer uint32 required');if('blocked' in timer&&typeof timer.blocked!=='boolean')throw Error('Actor timer blocked bool required');}
 const copy={...changes,...('timer324' in changes?{timer324:{...changes.timer324}}:{})};
 for(const k of names)if(k==='timer324')Object.assign(profile.timer324,copy.timer324);else profile[k]=copy[k];
 profile.writerLedger.push({revision:++profile.revision,provenance:origin,sourceSite,changes:copy});return profile;
}
export function advanceS5RuntimeShieldActorProfileTimer(profile,dtMs){
 if(!u32(dtMs))throw Error('Native actor Tick uint32 milliseconds required');
 const timer=profile.timer324;
 // Actor global Tick51EFEE/51F03E, before actor physics/body/tail: expired
 // timers stop; equality gets a final Tick; blocked timers do not increment.
 if(timer.elapsed<=timer.duration&&!timer.blocked){timer.counter=(timer.counter+1)>>>0;timer.elapsed=(timer.elapsed+dtMs)>>>0;}
 return {counter:timer.counter,duration:timer.duration,elapsed:timer.elapsed,blocked:timer.blocked,remaining:timer.duration>timer.elapsed?timer.duration-timer.elapsed:0,nativeReady:false};
}
export function readS5RuntimeShieldActorProfile(profile,{currentStateExists,actorStateId,currentStateSlotB0,shieldBodyIdentityConfirmed=false}={}){
 const refuse=reason=>({accepted:false,reason,nativeReady:false});
 if(typeof currentStateExists!=='boolean'||(currentStateExists&&!Number.isInteger(actorStateId)))return refuse('explicit-current-state-required');
 let slotB0=currentStateSlotB0;
 if(currentStateExists&&actorStateId===34&&shieldBodyIdentityConfirmed===true)slotB0=true; // vtable13B7184+B0→B4A300.
 if(currentStateExists&&typeof slotB0!=='boolean')return refuse('current-state-slotb0-required');
 const slot44=profile.protected154&&currentStateExists&&slotB0===true;
 const slot4c=profile.timer324.duration>profile.timer324.elapsed;
 return {accepted:true,actorId:profile.actorId,profileRevision:profile.revision,actorByte6c:profile.actorByte6c,actorSlot3c:profile.actorByte6c!==0,actorSlot40:false,actorSlot1c4:profile.protected1aa,actorSlot44:slot44,actorSlot4c:slot4c,actorSlot128:profile.property128,currentStateExists,actorStateId:currentStateExists?actorStateId:null,currentStateSlotB0:currentStateExists?slotB0:null,nativeSpWritePermitted:slot44&&!slot4c&&!profile.property128,profileProvenance:profile.provenance,nativeEligibilityVerified:false,nativeActorObserved:false,nativeReady:false};
}
