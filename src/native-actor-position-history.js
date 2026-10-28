// Actor308 source B7E290/B7E580/B7E660/B7E730. These records interpolate
// protected74 presentation; they are not actor2F0 collision or velocityF0.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const scalar=v=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError('Finite source history float32 required');return f(v);};
const xyz=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit source history vector required');return v.map(scalar);};
const record=v=>{if(!v)throw TypeError('Explicit source position history record required');return {time:uint(v.time,'record time08'),flags:uint(v.flags,'record flags0C'),position:xyz(v.position),vector:xyz(v.vector)};};
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
const sync=v=>{if(v&&typeof v.then==='function')throw TypeError('Source position history callbacks must complete synchronously');return v;};

export function interpolateNativeActorPositionRecord({time,previous,next}={}){
 time=uint(time,'query time');previous=record(previous);next=record(next);
 // Native converts DWORDs to double BEFORE subtract/divide, then rounds the
 // ratio once to float32. It neither clamps nor sorts the supplied records.
 let ratio=0;
 if(next.time!==previous.time&&time!==previous.time)ratio=f((time-previous.time)/(next.time-previous.time));
 if(next.flags===1&&ratio===1)ratio=0;
 const complement=f(1-ratio);
 const blend=(a,b)=>a.map((v,i)=>scalar(f(f(v*complement)+f(b[i]*ratio))));
 return {time,flags:3,position:blend(previous.position,next.position),vector:blend(previous.vector,next.vector),ratio};
}

export function queryNativeActorPositionHistory({time,records,input,readActor3C,extrapolateB7EA20}={}){
 time=uint(time,'query time');
 if(!Array.isArray(records)||records.length>50000)throw TypeError('Explicit bounded current source history records required');
 const current=records.map(record);
 if(!input||typeof input.byteInitialKnown!=='boolean')throw TypeError('Explicit initial output-byte provenance required');
 const initial={position:xyz(input.position),vector:xyz(input.vector),byteInitialKnown:input.byteInitialKnown};
 if(input.byteInitialKnown){initial.byte=uint(input.byte,'initial byte');if(initial.byte>255)throw TypeError('Explicit initial byte required');}
 const unchanged=reason=>({qualified:true,...initial,changed:false,reason,nativeReady:false});
 // B7E580 returns the LAST <=time before the FIRST >time, or end if none.
 let previous=-1;
 for(let i=0;i<current.length;i++){if(current[i].time>time)break;previous=i;}
 let next=current.findIndex(item=>item.time>=time);
 if(previous===-1)return unchanged('no-previous-record');
 if(next===-1){
  if(!synchronous(readActor3C))throw TypeError('Reached actor3C source gate required');
  const gate=sync(readActor3C());if(!Number.isInteger(gate)||gate<0||gate>255)throw TypeError('Explicit actor3C source byte required');
  if(gate===0)return unchanged('no-next-record-local-actor');
  if(!synchronous(extrapolateB7EA20))throw TypeError('Reached source extrapolation B7EA20 implementation required');
  const advanced=sync(extrapolateB7EA20({time,records:current.map(item=>structuredClone(item))}));
  if(advanced?.qualified!==true)throw Error(advanced?.reason??'source-extrapolation-unqualified');
  if(!Array.isArray(advanced.records))throw TypeError('Explicit postB7EA20 current history required');
  const after=advanced.records.map(record);next=after.findIndex(item=>item.time>=time);
  if(next===-1)return unchanged('no-next-record-after-extrapolation');
  // B7E386..391 deliberately copies the NEW next iterator to BOTH inputs.
  const blended=interpolateNativeActorPositionRecord({time,previous:after[next],next:after[next]});
  return {qualified:true,...blended,byte:3,byteInitialKnown:true,changed:true,nativeReady:false};
 }
 const blended=interpolateNativeActorPositionRecord({time,previous:current[previous],next:current[next]});
 return {qualified:true,...blended,byte:3,byteInitialKnown:true,changed:true,nativeReady:false};
}

export function queryNativeActorPresentedPosition({frameContext,delay15F498C,...options}={}){
 // B7E1F0 subtracts the live source delay as wrapping DWORD arithmetic.
 return queryNativeActorPositionHistory({...options,time:(uint(frameContext,'frame context')-uint(delay15F498C,'source delay15F498C'))>>>0});
}
