import {s5runtimeFlyVerticalStep} from './s5runtime-skill-runtime.js';
// Actor526D00 airborne branch, before CFly: B4 * (dt * float3 * rate),
// add to protected actor+FC; if B0 exceeds decoded Y, write B0; then decode
// actor+F0 and multiply by a separate displacement rate. Getter values/rates
// are required, since equipment/actor conditions may change them.
export function nativeActorAirbornePreFly({velocityY,gravityNative,gravityRate,terminalLowerBoundNative,displacementRate,dtMs}){
 const f=Math.fround;
 if(![velocityY,gravityNative,gravityRate,terminalLowerBoundNative,displacementRate,dtMs].every(v=>Number.isFinite(v)&&Number.isFinite(f(v)))||dtMs<0)throw new TypeError('Explicit finite native actor gravity, lower bound, rates and clock required');
 const seconds=f(f(dtMs)*f(.001)),gravityDelta=f(f(gravityNative)*f(seconds*f(gravityRate)));
 const afterGravity=f(f(velocityY)+gravityDelta),clamped=f(terminalLowerBoundNative)>afterGravity;
 const nativeVelocityY=clamped?f(terminalLowerBoundNative):afterGravity;
 return {nativeVelocityY,gravityDelta,clamped,displacementNative:f(nativeVelocityY*f(seconds*f(displacementRate))),nativeReady:false};
}
// Two-phase diagnostic orchestrator. Native source determines ordering, while
// the explicit callbacks determine collision policy and live actor velocity.
// Never infer a velocity reset from contact or from realized displacement.
export function compareFlyPhysicsOrder({dtMs,verticalParameters,physicsMove,submitInput,readVelocityNative,writeVelocityNative}){
 if(!Number.isFinite(dtMs)||dtMs<0||![physicsMove,submitInput,readVelocityNative,writeVelocityNative].every(v=>typeof v==='function'))throw new TypeError('Explicit flight tick and actor callbacks required');
 if(!verticalParameters||!['acceleration','damping','minimum','maximum'].every(k=>Number.isFinite(verticalParameters[k])))throw new TypeError('Explicit native vertical kernel parameters required');
 const timeline=[];
 const before={...readVelocityNative()};if(!['x','y','z'].every(k=>Number.isFinite(before[k])))throw Error('Invalid initial actor velocity');
 timeline.push({stage:'read-before-physics',velocityY:before.y});
 const physics=physicsMove({dtMs,velocityNative:{...before}});timeline.push({stage:'actor-physics',result:physics});
 const input=submitInput({dtMs});timeline.push({stage:'actor70-input',result:input});
 const current={...readVelocityNative()};if(!['x','y','z'].every(k=>Number.isFinite(current[k])))throw Error('Invalid post-collision actor velocity');
 timeline.push({stage:'read-post-input',velocityY:current.y});
 const updated=s5runtimeFlyVerticalStep({...verticalParameters,velocityY:current.y},dtMs);
 writeVelocityNative({...current,y:updated.nativeVelocityY});timeline.push({stage:'write-next-velocity',velocityY:updated.nativeVelocityY});
 const cached=s5runtimeFlyVerticalStep({...verticalParameters,velocityY:before.y},dtMs);
 return {timeline,physics,input,postCollisionVelocityY:current.y,nativeVelocityY:updated.nativeVelocityY,cachedNativeVelocityY:cached.nativeVelocityY,cachedError:cached.nativeVelocityY-updated.nativeVelocityY,nativeReady:false};
}
