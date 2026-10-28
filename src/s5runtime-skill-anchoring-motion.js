const f=Math.fround;
function u32(v,label){if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Raw uint32 '+label+' required');return v;}
function vec(v,label){if(!v||v.length!==3)throw Error('Raw '+label+' vector3 required');return Array.from(v,x=>{if(!Number.isFinite(x)||!Number.isFinite(f(x)))throw Error('Finite float32 '+label+' required');return f(x);});}
// Source fragment63A300..63A656. Host applies displacement through actor70
// with its condition/collision policy, then consumes primaryPhaseRequest.
// This helper does not write F0, infer points, apply Bind, or synthesize camera.
export function advanceS5RuntimeAnchoringPullMotion(timer,{dtMs,primaryPhase,nativeContext,actor2d8Vector,actor2e4Vector}={}){
 u32(dtMs,'dtMs');
 if(!timer||typeof timer.blocked!=='boolean')throw Error('Raw body120 timer required');
 for(const key of ['counter','durationMs','elapsedMs'])u32(timer[key],key);
 if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||typeof nativeContext.actorSlot3c!=='boolean')return {accepted:false,commands:{},nativeReady:false,reason:'explicit-native-identity-required'};
 if(nativeContext.actorSlot3c||primaryPhase!==4)return {accepted:true,commands:{},nativeReady:false};
 const a=vec(actor2d8Vector,'actor2d8'),b=vec(actor2e4Vector,'actor2e4');
 const delta=b.map((v,i)=>f(v-a[i]));
 //100B580 and100B450 sum x²+y²+z² in float32 before double sqrt→float32.
 const distance=f(Math.sqrt(f(f(f(delta[0]*delta[0])+f(delta[1]*delta[1]))+f(delta[2]*delta[2]))));
 if(!Number.isFinite(distance))throw Error('Native Anchoring distance overflow');
 const direction=distance===0?[...delta]:delta.map(v=>f(v*f(f(1)/distance)));
 const ratio=elapsed=>timer.durationMs===0?0:f(f(elapsed)/f(timer.durationMs));
 const before=ratio(timer.elapsedMs),nextElapsed=timer.blocked?timer.elapsedMs:(timer.elapsedMs+dtMs)>>>0;
 const after=ratio(nextElapsed),amount=f(distance*f(after-before));
 const displacement=direction.map(v=>f(v*amount));
 if(!displacement.every(Number.isFinite))throw Error('Native Anchoring displacement overflow');
 if(!timer.blocked){timer.counter=(timer.counter+1)>>>0;timer.elapsedMs=nextElapsed;}
 const expired=timer.elapsedMs>timer.durationMs;
 return {accepted:true,commands:{actor70Displacement:displacement,...(expired?{primaryPhaseRequest:5}:{})},
  ratioBefore:before,ratioAfter:after,expired,velocityWriteApplied:false,
  actorPointWritersVerified:false,nativeCompared:false,nativeReady:false};
}
