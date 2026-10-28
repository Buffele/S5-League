import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const f=Math.fround,clips=['L0002','L0000','L0002','L0001','00065'];
const blends=[200,200,500,500,500],loops=[true,false,true,true,false];
function float(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Finite float32 '+label+' required');return f(value);}
function vector(v,label){if(!v||v.length!==3)throw Error('Raw '+label+' vector3 required');return Array.from(v,x=>float(x,label));}
function integer(v){if(!Number.isFinite(v)||v<0||v>0xffffffff)throw Error('Native conversion outside supported uint32 domain');return Math.trunc(v);}
// 63D491..63D577 and 63D884..63D896: source operands are actor+2D8/+2E4,
// NOT an inferred camera/anchor/socket. This function does not identify writers.
export function s5runtimeAnchoringPullDurationArgument({actor2d8Vector,actor2e4Vector,nativeSpeed178}={}){
 const a=vector(actor2d8Vector,'actor2d8'),b=vector(actor2e4Vector,'actor2e4'),speed=float(nativeSpeed178,'body178');
 if(speed<=0)throw Error('Positive body178 required; native exceptional division unsupported');
 const d=a.map((v,i)=>f(v-b[i]));
 const distance=f(Math.sqrt(f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]))));
 return integer(f(f(distance*f(1000))/speed));
}
// Caller invokes after the REAL phase setter entered its effects branch.
// A lower nonzero phase write skips these effects; it is not a new pose.
export function s5runtimeAnchoringPrimaryAnimation({itemKey,primaryPhase,nativeContext,actor2d8Vector,actor2e4Vector,nativeSpeed178}={}){
 if(![3010001,3010002].includes(itemKey)||!Number.isInteger(primaryPhase)||primaryPhase<1||primaryPhase>5)throw Error('Supported Anchoring item and primary phase1..5 required');
 if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||nativeContext.primaryEntryEffectsConfirmed!==true)return {accepted:false,commands:[],reason:'actual-primary-entry-effects-required',nativeReady:false};
 const action=s5runtimeSkillDefinition(itemKey).action;
 let argument=0,timer=0;
 if(primaryPhase===1)timer=integer(f(f(Number(action.Float.Float_Value1))*f(1000)));
 if(primaryPhase===2)argument=timer=integer(f(f(Number(action.Float.Float_Value2))*f(1000)));
 if(primaryPhase===4)argument=timer=s5runtimeAnchoringPullDurationArgument({actor2d8Vector,actor2e4Vector,nativeSpeed178});
 if(primaryPhase===5)argument=timer=integer(f(f(Number(action.Float.Float_Value3))*f(1000)));
 const commands=[0,1,3,4,5].map(channel=>({nativeChannel:channel,clip:clips[primaryPhase-1],luaIndex:primaryPhase-1,
  nativeDurationArgument:argument,beginTicks:0,blendTicks:blends[primaryPhase-1],endTicks:0,loop:loops[primaryPhase-1],speed:1,reset:true,
  targetSemanticVerified:false,fittingVerified:false,nativeReady:false}));
 return {accepted:true,commands,timerReset:{counter:0,durationMs:timer,elapsedMs:0,preserveBlocked:true},nativeReady:false,nativeCompared:false};
}
