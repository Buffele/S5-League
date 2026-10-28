// Offline source ports for Run presentation and timed effect children.
// Physical actor F0, mode114 and actor70 are not written by these helpers.
const f=Math.fround;
const uint=(value,name)=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw TypeError(`Explicit uint32 ${name} required`);return value;};
const scalar=(value,name)=>{if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`Explicit finite native ${name} required`);return f(value);};
const bool=(value,name)=>{if(typeof value!=='boolean')throw TypeError(`Explicit boolean ${name} required`);return value;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
function requirePorts(ports,names){if(!names.every(name=>sync(ports[name]))||typeof ports.source!=='string'||!ports.source.trim())throw TypeError(`Explicit synchronous source ports required: ${names.join(', ')}`);}
function call(fn,...args){const result=fn(...args);if(result&&typeof result.then==='function')throw TypeError('Native locomotion effect ports must complete synchronously');return result;}
function timer(value,name){
 if(!value||typeof value!=='object')throw TypeError(`Explicit ${name} timer required`);
 for(const field of ['count','limit','elapsed'])uint(value[field],`${name}.${field}`);
 bool(value.paused,`${name}.paused`);return value;
}
function advance(value,dtMs){if(!value.paused){value.count=(value.count+1)>>>0;value.elapsed=(value.elapsed+dtMs)>>>0;}}
function childTickInPlace(child,dtMs){
 if(!child||typeof child!=='object')throw TypeError('Explicit source child record required');
 const primary=timer(child.timer24,'child24'),wasWithin=primary.limit>=primary.elapsed;
 if(child.effect20!==null){if(!child.effect20||typeof child.effect20!=='object')throw TypeError('Explicit nullable effect20 required');bool(child.effect20.visible10,'effect20.visible10');}
 advance(primary,dtMs);
 if(wasWithin!==(primary.limit>=primary.elapsed)&&child.effect20!==null)child.effect20.visible10=true;
 if(child.effect20!==null&&child.effect20.visible10){
  const secondary=timer(child.timer28,'child28'),secondaryWithin=secondary.limit>=secondary.elapsed;
  advance(secondary,dtMs);
  if(secondaryWithin!==(secondary.limit>=secondary.elapsed))child.effect20.visible10=false;
 }
}

// Complete8856C0 body: timer24, possible effect20+10=true, then timer28
// and possible false. structuredClone preserves shared timer identities.
export function nativeLocomotionEffectChildTick({state,dtMs}={}){
 dtMs=uint(dtMs,'dtMs');const result=structuredClone(state);childTickInPlace(result,dtMs);
 return {qualified:true,state:result,physicalActorWrite:false,nativeReady:false};
}

//888310 with the actual Run literal13B633E="": all children in source order.
// Collection qualification is explicit; an unknown list is never empty.
export function nativeRunEffectChildrenTick({state,dtMs,collectionQualified}={}){
 dtMs=uint(dtMs,'dtMs');
 if(collectionQualified!==true||!state||!Array.isArray(state.children))throw TypeError('Explicit qualified current Run child collection required');
 const result=structuredClone(state);
 for(const child of result.children)childTickInPlace(child,dtMs);
 return {qualified:true,state:result,ticked:result.children.length,filter:'',physicalActorWrite:false,nativeReady:false};
}

//634C6F then634C86. The writer can use frame.writeStateContainer so timers
// and visibility participate in the same rollback as physical movement.
export function createNativeRunHeadEffects(ports={}){
 requirePorts(ports,['animationPreface','readContainer124','writeContainer124']);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');const animation=call(ports.animationPreface,api);
  const collection=call(ports.readContainer124,api);
  const children=nativeRunEffectChildrenTick({state:collection?.state,collectionQualified:collection?.qualified,dtMs});
  call(ports.writeContainer124,children.state,api);
  return {qualified:true,animation,children,physicalActorWrite:false,nativeReady:false};
 };
}

function parameter(value,index){
 if(!value||typeof value!=='object'||typeof value.name!=='string'||value.name.includes('\0'))throw TypeError(`Explicit decoded animation parameter ${index} required`);
 return value;
}

// Complete635650 logical orchestration. readAlternateBinding retains635E70;
// applyParameter and synchronizeCursor retain B78580 and1152B90 effects.
// Those ports can write transaction-owned animation state and emit commands.
export function createNativeRunAnimationPreface(ports={}){
 requirePorts(ports,['readSubstate118','readAlternateBinding','readParameter','readAnimator','readGameTempo22','readMoveSpeed51dae0','readRatio13c','writeRatio13c','readAnimatorName','applyParameterB78580','readAnimatorCursor30','synchronizeCursor1152b90']);
 return api=>{
  const substate=call(ports.readSubstate118,api);
  if(!Number.isInteger(substate)||substate<0||substate>0x7fffffff)throw TypeError('Run substate118 must lie in the qualified signed nonnegative domain');
  if(substate>=8)return {qualified:true,path:'non-directional-substate',physicalActorWrite:false,nativeReady:false};
  const alternate=bool(call(ports.readAlternateBinding,api),'alternate binding');
  const upperIndex=substate+(alternate?16:0),lowerIndex=substate+(alternate?24:8);
  const upper=parameter(call(ports.readParameter,upperIndex,api),upperIndex),lower=parameter(call(ports.readParameter,lowerIndex,api),lowerIndex);
  // Source getter order0,1,3,4,5 precedes the ratio properties.
  const animators=new Map([0,1,3,4,5].map(slot=>[slot,call(ports.readAnimator,slot,api)]));
  if(animators.get(0)==null||animators.get(1)==null)throw Error('Run preface requires source upper/lower animators before name access');
  const reference=scalar(call(ports.readGameTempo22,api),'GameTempo22'),speed=scalar(call(ports.readMoveSpeed51dae0,api),'actor speed51DAE0');
  const ratio=f(speed/reference);
  if(!Number.isFinite(ratio))throw TypeError('Unqualified Run animation speed ratio');
  const oldRatio=scalar(call(ports.readRatio13c,api),'state ratio13C'),changed=oldRatio!==ratio;
  if(changed)call(ports.writeRatio13c,ratio,api);
  const upperName=call(ports.readAnimatorName,animators.get(0),api);
  if(typeof upperName!=='string')throw TypeError('Explicit current upper animation name required');
  const upperChanged=upperName!==upper.name||changed;
  if(upperChanged)for(const slot of [0,3,4,5])call(ports.applyParameterB78580,{parameter:upper,parameterIndex:upperIndex,animator:animators.get(slot),slot,speedRatio:ratio,weight:1},api);
  // A source upper apply may change lower state; the lower name is live here.
  const lowerName=call(ports.readAnimatorName,animators.get(1),api);
  if(typeof lowerName!=='string')throw TypeError('Explicit current lower animation name required');
  const lowerChanged=lowerName!==lower.name||changed;
  if(lowerChanged)call(ports.applyParameterB78580,{parameter:lower,parameterIndex:lowerIndex,animator:animators.get(1),slot:1,speedRatio:ratio,weight:1},api);
  const cursor=uint(call(ports.readAnimatorCursor30,animators.get(1),api),'lower animator cursor30');
  call(ports.synchronizeCursor1152b90,{animator:animators.get(0),slot:0,cursor30:cursor},api);
  return {qualified:true,path:'directional-animation',upperIndex,lowerIndex,ratio,ratioChanged:changed,upperChanged,lowerChanged,physicalActorWrite:false,nativeReady:false};
 };
}

//635CF0 reads lower animator1's uint32 cursor. A missing animator returns0.
// The 4.8f divisor and200/333 are authenticated PE immediates, not tuning.
export function nativeRunFootstepIndex({animatorCursor30}={}){
 if(animatorCursor30===null)return 0;
 const cursor=uint(animatorCursor30,'animator cursor30'),quotient=f(f(cursor)/f(4.8));
 return ((Math.trunc(quotient)+200)>>>0)%333;
}

function truncLow32(value){
 if(!Number.isFinite(value)||value< -(2**63)||value>=2**63)throw TypeError('Native float to int64 conversion domain is unqualified');
 return Number(BigInt.asUintN(32,BigInt(Math.trunc(value))));
}
function position(value){if(!Array.isArray(value)||value.length!==3)throw TypeError('Explicit actor7C XYZ required');return value.map(v=>scalar(v,'actor7C component'));}

//635D70: footstep only when the current phase is below previous11C.
// The command describes the exact unported7EFB00→5635A0→B0FE50 chain.
// Its eventual consumer still requires a real source implementation.
export function nativeRunFootstepPlan({previous11c,animatorCursor30,gameTempo15,actorPosition7c}={}){
 previous11c=uint(previous11c,'previous11C');const current=nativeRunFootstepIndex({animatorCursor30});
 if(previous11c<=current)return {qualified:true,previous11c:current,commands:[],physicalActorWrite:false,nativeReady:false};
 const rate=scalar(gameTempo15,'GameTempo15'),radius=f(rate*f(3000)),duration=truncLow32(f(rate*f(100)));
 if(!Number.isFinite(radius))throw TypeError('Native footstep radius overflow');
 return {qualified:true,previous11c:current,commands:[{type:'native-run-footstep',source:'635D70:7EFB00->5635A0->B0FE50',actorPosition7c:position(actorPosition7c),radius,argumentZero:0,durationLow32:duration,consumerSourceQualified:false}],physicalActorWrite:false,nativeReady:false};
}

export function createNativeRunFootstepTick(ports={}){
 requirePorts(ports,['readLowerAnimator','readAnimatorCursor30','readPrevious11c','readGameTempo15','readActorPosition7c','emitCommand','writePrevious11c']);
 return api=>{
  const animator=call(ports.readLowerAnimator,api),cursor=animator===null?null:uint(call(ports.readAnimatorCursor30,animator,api),'animator cursor30');
  const current=nativeRunFootstepIndex({animatorCursor30:cursor}),previous=uint(call(ports.readPrevious11c,api),'previous11C');
  let result;
  if(previous>current){
   const rate=call(ports.readGameTempo15,api),actorPosition=call(ports.readActorPosition7c,api);
   result=nativeRunFootstepPlan({previous11c:previous,animatorCursor30:cursor,gameTempo15:rate,actorPosition7c:actorPosition});
   for(const command of result.commands)call(ports.emitCommand,command,api);
  }else result=nativeRunFootstepPlan({previous11c:previous,animatorCursor30:cursor});
  call(ports.writePrevious11c,current,api);return result;
 };
}
