// Native module1, SHA256 1d0d6c9850405949a46903eb5558905d4c511f5c7083f296bf22e47ed2cbabd0:
// timer19D16BE0 and MoveBy wrapper19D18820, mapped base19B90000.
// This is a callsite accumulator, NOT a fixed-step physics scheduler. Its
// caller supplies the actual frame delta, current local actor and original
// callbacks. Installing it does not establish measured native call cadence.
const f=Math.fround;
export const NATIVE_BATCH_WINDOW_SECONDS=.016;
const uint=(n,label)=>{
  if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);
  return n;
};
const vector=p=>{
  if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite float32 displacement required');
  return p.map(f);
};
const clock=(n,label)=>{
  if(!Number.isFinite(n)||n<0)throw TypeError(`Explicit finite nonnegative ${label} required`);
  return n;
};

export function createNativeMovementBatcher({state,remainder,source}={}){
  if(!state||typeof source!=='string'||!source.trim()||typeof remainder!=='function')throw TypeError('Explicit initial state, remainder arithmetic and provenance required');
  let clock28=clock(state.clock28,'clock28'),clock30=clock(state.clock30,'clock30');
  let remainder38=clock(state.remainder38,'remainder38'),remainder40=clock(state.remainder40,'remainder40');
  let flushFlag=state.flushFlag;
  const bypassFlag=state.bypassFlag;
  if(typeof flushFlag!=='boolean'||typeof bypassFlag!=='boolean'||!Array.isArray(state.records))throw TypeError('Explicit native flags and callsite records required');
  const records=new Map();
  for(const input of state.records){
    const callsite=uint(input.callsite,'callsite');
    if(records.has(callsite)||typeof input.flushed!=='boolean')throw TypeError('Unique native callsite and explicit record flag required');
    records.set(callsite,{callsite,pending:vector(input.pending),flushed:input.flushed});
  }
  const snapshot=()=>({clock28,clock30,remainder38,remainder40,flushFlag,bypassFlag,
    records:[...records.values()].map(r=>({...r,pending:r.pending.slice()}))});
  function timerFrame({deltaSeconds,forwardFrame}={}){
    deltaSeconds=clock(deltaSeconds,'frame delta seconds');
    if(typeof forwardFrame!=='function')throw TypeError('Explicit original frame callback required');
    // 19D16C89: only40 is reduced BEFORE the original callback.
    let next40=remainder40;
    if(next40>=NATIVE_BATCH_WINDOW_SECONDS){
      next40=remainder(next40,NATIVE_BATCH_WINDOW_SECONDS);
      if(!Number.isFinite(next40)||next40<0||next40>=NATIVE_BATCH_WINDOW_SECONDS)throw RangeError('Invalid explicit native remainder result');
    }
    next40+=deltaSeconds;
    const next38=remainder38+deltaSeconds,next28=clock28+deltaSeconds;
    if(![next40,next38,next28].every(Number.isFinite))throw RangeError('Native clock overflow');
    remainder40=next40;remainder38=next38;clock28=next28;clock30=next28;
    flushFlag=remainder38>=NATIVE_BATCH_WINDOW_SECONDS;
    // ONE original callback, even after a long frame. Movement callbacks made
    // inside this window can flush; no pending callsite is visited by timer.
    forwardFrame(snapshot());
    let windows=0;
    while(remainder38>=NATIVE_BATCH_WINDOW_SECONDS){
      const reduced=remainder38-NATIVE_BATCH_WINDOW_SECONDS;
      if(reduced===remainder38)throw RangeError('Unrepresentable native clock subtraction');
      remainder38=reduced;clock30+=NATIVE_BATCH_WINDOW_SECONDS;windows++;
    }
    // Source does not reset48 after reducing38. It is overwritten next frame.
    return {windows,state:snapshot()};
  }
  function move({actorId,localActorId,callsite,displacement,forwardEnabled,forward}={}){
    actorId=uint(actorId,'actor identity');callsite=uint(callsite,'callsite');
    if(localActorId!==null)localActorId=uint(localActorId,'local actor identity');
    displacement=vector(displacement);
    if(typeof forwardEnabled!=='boolean'||forwardEnabled&&typeof forward!=='function')throw TypeError('Explicit original callback readiness required');
    // 19D1884D..1890C: bypass, missing local actor, and other actors all pass
    // directly through the original descriptor. Pending local records survive.
    if(bypassFlag||localActorId===null||localActorId!==actorId){
      if(forwardEnabled)forward({actorId,displacement:displacement.slice()});
      return {path:'direct',forwarded:forwardEnabled,displacement:displacement.slice()};
    }
    let record=records.get(callsite);
    if(!record){record={callsite,pending:[0,0,0],flushed:false};records.set(callsite,record);}
    // Hash-table placement is not observable here; key identity and float32
    // per-call addition are. Never combine separate callsites into one vector.
    record.pending=displacement.map((n,i)=>f(n+record.pending[i]));
    if(!record.pending.every(Number.isFinite))throw RangeError('Native pending displacement overflow');
    if(!flushFlag)return {path:'queued',forwarded:false,pending:record.pending.slice()};
    const sent=record.pending.slice();
    if(forwardEnabled)forward({actorId,displacement:sent.slice()});
    // 19D18C1F..C48 executes even when the original descriptor is unavailable.
    // SUBTRACT the sent snapshot after forwarding; do not assign zero, since
    // nested callbacks can have changed the record in the meantime.
    record.flushed=true;record.pending=record.pending.map((n,i)=>f(n-sent[i]));
    return {path:'flushed',forwarded:forwardEnabled,displacement:sent,pending:record.pending.slice()};
  }
  return {timerFrame,move,snapshot,source};
}
