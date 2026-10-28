// Source51C2F0 dispatch only. Native7B0180 collision resolution is a required port.
const f=Math.fround;
function scalar(v,label){if(typeof v!=='number'||!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`${label}: finite float32 required`);return f(v);}
function vec(v,label){if(!Array.isArray(v)||v.length!==3)throw TypeError(`${label}: explicit XYZ required`);return v.map(x=>scalar(x,label));}
function qualified(p,name){if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor?.name))throw TypeError(`${name}: synchronous port required`);if(!['source-port','s5-explicit-adaptation'].includes(p.provenance?.kind)||typeof p.provenance.source!=='string'||!p.provenance.source.trim())throw TypeError(`${name}: provenance required`);return p;}
function call(p,...args){const r=p.tick(...args);if(r&&(typeof r.then==='function'||typeof r.next==='function'))throw TypeError('Deferred port result refused');return r;}
function boolean(v,label){if(typeof v!=='boolean')throw TypeError(`${label}: raw boolean required`);return v;}
function length(v){const square=f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]));const r=f(Math.sqrt(square));if(!Number.isFinite(r))throw RangeError('float32 length overflow unsupported');return r;}
export function createAnchoringActor70SourcePorts(ports){
 const names=['queryCondition54b1c0','hasCondition54b110','readCondition400Field40','readFloat1053900','readSolverAnchor7b0c50','setSolverTarget7b0180','writeActor2f0'];
 const p=Object.fromEntries(names.map(name=>[name,qualified(ports?.[name],name)]));
 const readFloat=(id)=>scalar(call(p.readFloat1053900,id),`Float${id}`);
 const readAnchor=()=>vec(call(p.readSolverAnchor7b0c50),'solver anchor');
 return Object.freeze({run({coordinateSpace,actorVtable,displacement}={}){
  if(coordinateSpace!=='s5runtime-source'||actorVtable!==0x13c1c14)throw TypeError('Explicit s5runtime-source/current Character vtable identity required');
  let delta=vec(displacement,'displacement');
  const blocked=boolean(call(p.queryCondition54b1c0,1),'query1');
  if(blocked){delta[0]=readFloat(0);delta[2]=readFloat(0);}
  if(boolean(call(p.hasCondition54b110,0x400),'has400')&&boolean(call(p.queryCondition54b1c0,4),'query4')){
   const multiplier=call(p.readCondition400Field40); // null is the source lookup-null branch.
   if(multiplier!==null){const m=scalar(multiplier,'condition400+40');delta[0]=f(delta[0]*m);delta[2]=f(delta[2]*m);}
  }
  let capped=false,threshold=null,selectedCap=null;
  if(delta[1]>=0||delta[0]!==0||delta[2]!==0){
   threshold=f(readFloat(0x6c)*readFloat(0x2a));
   if(!Number.isFinite(threshold))throw RangeError('threshold overflow unsupported');
   const distance=length(delta);
   if(threshold<=distance){
    selectedCap=f(readFloat(0x6c)*readFloat(0x2a));
    if(!Number.isFinite(selectedCap))throw RangeError('cap overflow unsupported');
    //100B100 normalizes using a fresh float32 magnitude and preserves zero vector.
    const magnitude=length(delta);
    if(magnitude!==0){const inverse=f(1/magnitude);delta=delta.map(v=>f(v*inverse));}
    delta=delta.map(v=>f(v*selectedCap));capped=true;
   }
  }
  delta=vec(delta,'conditioned displacement');
  const writes=[];
  const submit=(relative,flag)=>{
   const start=readAnchor(),target=vec(start.map((v,i)=>f(v+relative[i])),'target');
   call(p.setSolverTarget7b0180,Object.freeze(target),flag);
   writes.push({start,target,flag,relative:[...relative]});
  };
  if(delta[1]<0){
   submit([delta[0],readFloat(0),delta[2]],0);
   //Source reads Float0 for Z, then Float0 for X before its fresh anchor read.
   const z=readFloat(0),x=readFloat(0);submit([x,delta[1],z],1);
  }else submit(delta,0);
  const finalAnchor=Object.freeze(readAnchor());call(p.writeActor2f0,finalAnchor);
  return Object.freeze({conditionedDisplacement:Object.freeze(delta),writes,finalAnchor,blocked,capped,threshold,selectedCap,
   physicalVelocityWriteApplied:false,nativeRuntimeGeometryVerified:false,nativeCompared:false,nativeReady:false});
 },sourceFunction:'0x51C2F0',nativeRuntimeGeometryVerified:false});
}
