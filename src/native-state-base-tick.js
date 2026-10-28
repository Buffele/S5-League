// Pinned source 5617F0 and 563920. Native XYZ, uint32 milliseconds.
// The remaining base helpers are mandatory ports, never implicit no-ops.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const scalar=(v,n)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`Explicit native float ${n} required`);return f(v);};
const bool=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const vector=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit native XYZ required');return v.map(n=>scalar(n,'component'));};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
function ports(p,names){if(typeof p.source!=='string'||!p.source.trim()||!names.every(n=>sync(p[n])))throw TypeError(`Explicit synchronous source ports required: ${names.join(', ')}`);}
function call(fn,...args){const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Native base ports must complete synchronously');return value;}
function timer(v){if(!v||typeof v!=='object')throw TypeError('Explicit base timer5C required');return {count:uint(v.count,'count'),limit:uint(v.limit,'limit'),elapsed:uint(v.elapsed,'elapsed'),paused:bool(v.paused,'paused')};}

// 5617F0..561926. Read state60 after object Tick; reread58 and5C after
// writing the timer so owned setters/transition effects retain source order.
export function createNativeStateBaseTick(p={}){
 ports(p,['readActorGate','objectTick5018a0','readBaseState','writeBaseTimer5c','actor24','virtualFc','recoil563920','virtual84','effects561fc0','animations562640']);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');let transitioned=null;
  if(!bool(call(p.readActorGate,api),'actor3C')){
   call(p.objectTick5018a0,dtMs,api);
   if(uint(call(p.readBaseState,api)?.duration60,'state60')!==0){
    const before=timer(call(p.readBaseState,api)?.timer5c);
    if(!before.paused)call(p.writeBaseTimer5c,{...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0},api);
    const target=uint(call(p.readBaseState,api)?.target58,'state58');
    if(target!==0){const live=timer(call(p.readBaseState,api)?.timer5c);if(live.limit<live.elapsed){transitioned=target;call(p.actor24,target,api);}}
   }
  }
  call(p.virtualFc,dtMs,api);
  call(p.recoil563920,api);
  call(p.virtual84,dtMs,api);
  call(p.effects561fc0,dtMs,api);
  call(p.animations562640,dtMs,api);
  return {qualified:true,transitioned,nativeReady:false};
 };
}

// 5018A0 chooses container14 when4CA260 is true, otherwise0C. Traversal
// stays live: callbacks may mutate the native collection. The binding owns
// iterator identity/end detection rather than substituting an array snapshot.
export function createNativeStateObjectTick(p={}){
 ports(p,['readSelector34','beginChildren','isChildrenEnd','readChild','tickChild2c','nextChild']);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');const offset=bool(call(p.readSelector34,api),'selector34')?0x14:0x0c;
  let cursor=call(p.beginChildren,offset,api);let ticked=0;
  while(!bool(call(p.isChildrenEnd,cursor,offset,api),'qualified child end')){
   const child=call(p.readChild,cursor,offset,api);if(child==null)throw TypeError('Explicit live source child required');
   call(p.tickChild2c,child,dtMs,api);ticked++;cursor=call(p.nextChild,cursor,offset,api);
  }
  return {qualified:true,offset,ticked,nativeReady:false};
 };
}

export const NATIVE_STATE_RECOIL_CALLSITE=0x563d46;

// Complete563920..563D54 orchestration/arithmetic. 100B450 is a float32
// Euclidean distance; its CRT sqrt implementation is an explicit source port.
// readActor2f0/2fc are source probe vectors, not actor7C/8C substitutions.
export function createNativeStateRecoil(p={}){
 ports(p,['readActorGate','readFloat','readState50','readActor68','readActor6c','readActor2f0','readActor2fc','rayQuery7b5f10','readInt2','readLiteral15f4210','readActor118','distance100b450']);
 return api=>{
  if(bool(call(p.readActorGate,api),'actor3C'))return {qualified:true,path:'gated',nativeReady:false};
  const threshold=scalar(call(p.readFloat,33,api),'Float33');
  const actor68=scalar(call(p.readActor68,api),'actor68');
  if(!(scalar(call(p.readState50,api),'state50')>f(actor68*threshold)))return {qualified:true,path:'below-threshold',nativeReady:false};
  const start=vector(call(p.readActor2f0,api));
  const heightRate=scalar(call(p.readFloat,38,api),'Float38'),height=scalar(call(p.readActor6c,api),'actor6C');
  start[1]=f(start[1]+f(height*heightRate));
  const direction=vector(call(p.readActor2fc,api)),state50=scalar(call(p.readState50,api),'state50');
  const end=direction.map((v,i)=>f(start[i]+f(v*state50)));
  if(end.some(v=>!Number.isFinite(v)))throw TypeError('Native recoil endpoint overflow');
  const hit=call(p.rayQuery7b5f10,{mask:0x7c0,argumentZero:0,start:start.slice(),end:end.slice()},api);
  if(!hit||typeof hit!=='object'||hit.qualified!==true)throw TypeError('Explicit qualified source ray result required');
  if(!bool(hit.hit,'ray hit'))return {qualified:true,path:'clear',nativeReady:false};
  //118 is read even though the value is not used by563920.
  call(p.readActor118,api);
  const literal=scalar(call(p.readLiteral15f4210,api),'literal15F4210');
  const integer=call(p.readInt2,api);if(!Number.isInteger(integer)||integer< -2147483648||integer>2147483647)throw TypeError('Explicit signed Int2 required');
  const bias=f(f(integer)*literal);
  const distance=scalar(call(p.distance100b450,end.slice(),vector(hit.point),api),'distance100B450');
  const amount=f(distance+bias),currentDirection=vector(call(p.readActor2fc,api));
  const displacement=currentDirection.map(v=>f(-f(v*amount)));
  if(displacement.some(v=>!Number.isFinite(v)))throw TypeError('Native recoil displacement overflow');
  call(api.actor70,{displacement,callsite:NATIVE_STATE_RECOIL_CALLSITE});
  return {qualified:true,path:'recoil',displacement,callsite:NATIVE_STATE_RECOIL_CALLSITE,nativeReady:false};
 };
}

// Shared Normal/Run/Jump virtual84=561C00: a timer boundary crossing can
// issue7EDAE0 at the live actor top. It is not skipped on the actor3C gate.
export function createNativeStateTimedEffect(p={}){
 ports(p,['readTimedEffectState','writeTimer88','isLocalActor','readActor7c','readActor6c','effect7edae0']);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');let state=call(p.readTimedEffectState,api);
  if(!bool(state?.enabled84,'state84'))return {qualified:true,path:'disabled',nativeReady:false};
  const before=timer(state.timer88),within=before.limit>=before.elapsed;
  if(!before.paused)call(p.writeTimer88,{...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0},api);
  state=call(p.readTimedEffectState,api);const after=timer(state.timer88);
  if(within===(after.limit>=after.elapsed))return {qualified:true,path:'no-crossing',nativeReady:false};
  if(bool(state.localOnly98,'state98')&&!bool(call(p.isLocalActor,api),'current local actor'))return {qualified:true,path:'remote-actor',nativeReady:false};
  // Push order from561D1C..561D97 is retained in this record construction.
  const flag99=uint(call(p.readTimedEffectState,api).flag99,'flag99');if(flag99>255)throw TypeError('Explicit byte flag99 required');
  const b4=scalar(call(p.readTimedEffectState,api).b4,'B4'),b0=scalar(call(p.readTimedEffectState,api).b0,'B0'),ac=scalar(call(p.readTimedEffectState,api).ac,'AC');
  const a8=scalar(call(p.readTimedEffectState,api).a8,'A8'),a4=scalar(call(p.readTimedEffectState,api).a4,'A4');
  const a0=uint(call(p.readTimedEffectState,api).a0,'A0'),field9c=uint(call(p.readTimedEffectState,api).field9c,'9C');
  const z=vector(call(p.readActor7c,api))[2],yPosition=vector(call(p.readActor7c,api)),height=scalar(call(p.readActor6c,api),'actor6C');
  const y=f(height+yPosition[1]),x=vector(call(p.readActor7c,api))[0];if(!Number.isFinite(y))throw TypeError('Native timed effect position overflow');
  const command={type:'native-state-timed-effect',source:'561C00:7EDAE0',position:[x,y,z],field9c,a0,a4,a8,ac,b0,b4,flag99,argumentZero:0,argumentOne:1};
  call(p.effect7edae0,command,api);return {qualified:true,path:'emitted',command,nativeReady:false};
 };
}

// Shared virtualFC=563D60. Debits actor250 with key15F3D74 after timerBC.
// The source wraps a positive balance in4CA7E0 (runtime key constructor);
// preserve that operation as an explicit consumer rather than guessing it.
export function createNativeStateResourceTick(p={}){
 ports(p,['readVirtual78','readLiteral14c904c','readActorGate','readTimerBc','writeTimerBc','readFloat','readActorC8','readActor250','prepareProtectedFloat4ca7e0','writeActor250','readActor44','readActor4c','readActor128','readActorPresent','readTargetCc','actor24']);
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'dtMs');const value=scalar(call(p.readVirtual78,api),'state virtual78'),zero=scalar(call(p.readLiteral14c904c,api),'literal14C904C');
  if(value===zero)return {qualified:true,path:'zero-rate',nativeReady:false};
  if(bool(call(p.readActorGate,api),'actor3C'))return {qualified:true,path:'gated',nativeReady:false};
  const before=timer(call(p.readTimerBc,api));
  // Source's timer operator reports true while paused, regardless elapsed.
  if(before.paused)return {qualified:true,path:'paused-delay',nativeReady:false};
  const after={...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0};call(p.writeTimerBc,after,api);
  if(after.limit>=after.elapsed)return {qualified:true,path:'delay',nativeReady:false};
  const seconds=f(f(dtMs)*scalar(call(p.readFloat,3,api),'Float3')),rate=scalar(call(p.readVirtual78,api),'state virtual78');
  const cost=f(rate*seconds),resource=scalar(call(p.readActorC8,api),'actorC8');if(!Number.isFinite(cost))throw TypeError('Native resource cost overflow');
  if(resource>=cost){
   let previous=scalar(call(p.readFloat,0,api),'Float0');
   const compareZero=scalar(call(p.readFloat,0,api),'Float0');
   if(cost!==compareZero){
    previous=scalar(call(p.readActor250,{keyAddress:0x15f3d74},api),'actor250');
    const floor=scalar(call(p.readFloat,0,api),'Float0'),difference=f(previous-cost);if(!Number.isFinite(difference))throw TypeError('Native resource difference overflow');
    let prepared;
    if(floor>difference)prepared={kind:'source-float-property',propertyIndex:0,value:scalar(call(p.readFloat,0,api),'Float0')};
    else {prepared=call(p.prepareProtectedFloat4ca7e0,difference,api);if(!prepared||typeof prepared!=='object'||prepared.qualified!==true)throw TypeError('Explicit qualified4CA7E0 protected float required');}
    call(p.writeActor250,{keyAddress:0x15f3d74,prepared},api);
    const restore=!bool(call(p.readActor44,api),'actor44')||bool(call(p.readActor4c,api),'actor4C')||bool(call(p.readActor128,api),'actor128');
    if(restore)call(p.writeActor250,{keyAddress:0x15f3d74,prepared:{kind:'native-float-value',value:previous}},api);
   }
   return {qualified:true,path:'debit',cost,nativeReady:false};
  }
  // Valid state actors are non-null.563D60's null branch dereferences that
  // null actor before its possible7EFDE0 sound, so it is an invalid contract.
  if(!bool(call(p.readActorPresent,api),'state actor54 present'))throw TypeError('Native resource Tick requires its valid state actor54');
  const target=uint(call(p.readTargetCc,api),'targetCC');if(target!==0)call(p.actor24,target,api);
  return {qualified:true,path:'insufficient-resource',cost,target,nativeReady:false};
 };
}
