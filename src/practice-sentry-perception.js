// AF0B90 ->5478D0/5488E0/AF1D10, AF0D40 and AF0F10.
// Every vector here is in NATIVE coordinates. No S5 team or nearest-player rule.
const f=Math.fround;
//All four Exercise entries in authenticated sentrygunattribindexer.lua use
//these SetRange/SetEnableHeadRotation values. Actor+268 remains an input.
export const PRACTICE_SENTRY_PERCEPTION_ATTRIBUTES=Object.freeze({range20:20000,angle2c:120,vertical38:40,headRotationEnabled:true,source:'script/sentrygunattribindexer.lua Exercise5..8→AF5C50/AF5040'});
const finite=(n,label)=>{if(!Number.isFinite(n))throw Error('Finite '+label+' required');return f(n);};
export const sentryNativeVector=(v,label='native vector')=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Explicit '+label+' required');return v.map(f);};
export const sentryNativeSubtract=(a,b)=>a.map((v,i)=>f(v-b[i]));
const add=(a,b)=>a.map((v,i)=>f(v+b[i]));
export const sentryNativeDot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
export const sentryNativeLengthSquared=v=>sentryNativeDot(v,v);
export function sentryNativeNormalize(v){const length=f(Math.sqrt(sentryNativeLengthSquared(v)));return length!==0?v.map(n=>f(n*f(1/length))):[...v];}
export function sentryNativeAngle(a,b){const denominator=f(f(Math.sqrt(sentryNativeLengthSquared(a)))*f(Math.sqrt(sentryNativeLengthSquared(b)))),radians=f(Math.acos(f(sentryNativeDot(a,b)/denominator)));return Number.isNaN(radians)?0:radians;}
const DEG=57.29577951307855,RAD=0.017453292521994;
export function sentryNativeYaw(v,degrees){const r=f(finite(degrees,'source yaw')*RAD),sin=f(Math.sin(r)),cos=f(Math.cos(r));return [f(f(v[0]*cos)+f(v[2]*sin)),v[1],f(f(v[2]*cos)-f(v[0]*sin))];}
export function sentryNativePeerId(id){if(!Array.isArray(id)||id.length!==2||!id.every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff))throw Error('Two native peer DWORDs required');return [...id];}
//5306F0 checks the top16 peer bits, then the complete64-bit value.
export function practiceSentryHasPeerId(id){const [low,high]=sentryNativePeerId(id);return (high>>>16)!==0&&(low!==0||high!==0);}
export function practiceSentryCandidateEligible(self,candidate){
 if(!self||!candidate||self.identity===undefined||candidate.identity===undefined)throw Error('Explicit native actor identities required');
 if(typeof self.slot1c4!=='boolean'||typeof candidate.slot1c4!=='boolean'||typeof candidate.activeD4!=='boolean')throw Error('Explicit raw actor virtual1C4/D4 values required');
 const hp=finite(candidate.hp94,'actor virtual94 HP');
 return self.identity!==candidate.identity&&self.slot1c4!==candidate.slot1c4&&candidate.activeD4&&hp!==0;
}
export function practiceSentryQueryCandidates({actors,origin74,forwardA8,effectiveRange,angleDegrees,halfFactor=.5}){
 if(!Array.isArray(actors))throw Error('Explicit native actor collection required');
 const origin=sentryNativeVector(origin74),forward=sentryNativeVector(forwardA8),range=finite(effectiveRange,'effective AF3210 range'),angle=f(finite(angleDegrees,'AF3280 angle')*finite(halfFactor,'constant float33'));
 const radiusSquared=f(range*range),cos=f(Math.cos(f(angle*RAD))),result=[];
 for(const actor of actors){const delta=sentryNativeSubtract(sentryNativeVector(actor.position7c,'actor virtual7C position'),origin),distanceSquared=sentryNativeLengthSquared(delta),direction=sentryNativeNormalize(delta);
  if(distanceSquared<=radiusSquared&&sentryNativeDot(forward,direction)>=cos)result.push({actor,distanceSquared});
 }
 //54A160(param3=0): strict-less left, equal right. In-order traversal retains
 //insertion order for equal keys; no pointer/ID tie-breaker is invented.
 result.sort((a,b)=>a.distanceSquared-b.distanceSquared);return result;
}
export function practiceSentryWithinHeadRange({origin74,forwardA8,targetPosition,effectiveRange,angleDegrees,halfFactor=.5}){
 const delta=sentryNativeSubtract(sentryNativeVector(targetPosition),sentryNativeVector(origin74)),range=finite(effectiveRange,'effective range');
 return sentryNativeLengthSquared(delta)<=f(range*range)&&f(sentryNativeAngle(sentryNativeVector(forwardA8),sentryNativeNormalize(delta))*DEG)<=f(finite(angleDegrees,'source angle')*finite(halfFactor,'source half factor'));
}
export function practiceSentryVisibilityDecision({origin74,forwardA8,targetPosition,angleDegrees,halfFactor=.5,blocked}){
 if(blocked!==null&&typeof blocked!=='boolean')throw Error('Explicit native probe result or unknown null required');
 if(blocked===null)return {accepted:null};if(blocked)return {accepted:false};
 const forward=sentryNativeVector(forwardA8),delta=sentryNativeNormalize(sentryNativeSubtract(sentryNativeVector(targetPosition),sentryNativeVector(origin74)));
 if(delta[1]>=1||delta[1]<=-1)return {accepted:false};
 const horizontal=sentryNativeNormalize([delta[0],0,delta[2]]),degrees=f(sentryNativeAngle(forward,horizontal)*DEG),limit=f(finite(angleDegrees,'source angle')*finite(halfFactor,'source half factor'));
 if(degrees>limit){const crossY=f(f(forward[2]*delta[0])-f(forward[0]*delta[2]));return {accepted:false,aim228:sentryNativeYaw(forward,crossY<0?limit:f(-limit))};}
 return {accepted:true};
}
export function practiceSentryProbeEndpoint(candidate,halfFactor=.5){const point=sentryNativeVector(candidate.position7c),height=finite(candidate.height6c,'target virtual6C height');point[1]=f(point[1]+f(height*finite(halfFactor,'constant float33')));return point;}
export function practiceSentryHorizontalAim(origin,target){const d=sentryNativeSubtract(sentryNativeVector(target),sentryNativeVector(origin));return sentryNativeNormalize([d[0],0,d[2]]);}
//AF1360 supplies a full3D direction to every component; the origin's rotation
//uses horizontal aim. The singular +Z branch is explicit in the caller.
export function practiceSentryAttackAim(origin74,targetPosition){const fullDirection=sentryNativeNormalize(sentryNativeSubtract(sentryNativeVector(targetPosition),sentryNativeVector(origin74)));return {fullDirection,aim228:sentryNativeNormalize([fullDirection[0],0,fullDirection[2]])};}
export const practiceSentryNativeAdd=add;
