const f=Math.fround;
function float(v,label){if(typeof v!=='number'||!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`${label}: finite float32 required`);return f(v);}
function vec(v,label){if(!Array.isArray(v)||v.length!==3)throw TypeError(`${label}: explicitXYZ required`);return Object.freeze(v.map(x=>float(x,label)));}
function bool(v,label){if(typeof v!=='boolean')throw TypeError(`${label}: rawbool required`);return v;}
function port(p,name){if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor?.name))throw TypeError(`${name}: synchronous port required`);if(!['source-port','s5-explicit-adaptation'].includes(p.provenance?.kind)||typeof p.provenance.source!=='string'||!p.provenance.source.trim())throw TypeError(`${name}: provenance required`);return p;}
function invoke(p,...args){const r=p.tick(...args);if(r&&(typeof r.then==='function'||typeof r.next==='function'))throw TypeError('Deferred producer result refused');return r;}
function int32(v,label){if(!Number.isInteger(v)||v< -0x80000000||v>0x7fffffff)throw TypeError(`${label}: rawint32 required`);return v;}
const names=['readActor110Present','resetFields14e15015417c','readActorSlotD4','readFcSlot14','readFcPresent','readController2cPresent','readControllerSlot10','readDimension28','readDimension24','createScreenRay119ec20','readOffset170','readFar15f4404','writePoint158','writePoint164','queryWorld7b5f10','writeWorldHit14e','writeObject17c'];
//Through world-point writes only. Remaining53DD60 actor target selection is separate.
export function createAnchoringEnvironmentAimProducer(ports){
 const p=Object.fromEntries(names.map(name=>[name,port(ports?.[name],name)]));
 return Object.freeze({run({coordinateSpace,managerVtable}={}){
  if(coordinateSpace!=='s5runtime-source'||managerVtable!==0x13c6440)throw TypeError('Explicit manager13C6440/source coordinates required');
  const base={producerRuntimeObserved:false,worldQueryNativeVerified:false,nativeCompared:false,nativeReady:false,remainingActorSelectionImplemented:false};
  if(!bool(invoke(p.readActor110Present),'actor110Present'))return {...base,updated:false,reason:'actor-absent-prior-point-and-flags-preserved'};
  invoke(p.resetFields14e15015417c,Object.freeze({field14e:false,field150:0,field154:0,field17c:0}));
  let enabled=bool(invoke(p.readActorSlotD4),'actorSlotD4');
  if(enabled&&int32(invoke(p.readFcSlot14),'FC.slot14')===5&&bool(invoke(p.readFcPresent),'FCPresent')&&bool(invoke(p.readController2cPresent),'controller2CPresent')){
   const raw=invoke(p.readControllerSlot10);if(!Number.isInteger(raw)||raw<0||raw>0xffffffff)throw TypeError('Controller.slot10 rawuint32 required');
   if(raw!==0x16637d4)enabled=false;
  }
  if(!enabled)return {...base,updated:false,reason:'raw-actor-or-special-gate-refused-prior-point-preserved'};
  const height=int32(invoke(p.readDimension28),'dimension28'),width=int32(invoke(p.readDimension24),'dimension24');
  const pixelX=Math.trunc(width/2),pixelY=Math.trunc(height/2);
  const ray=invoke(p.createScreenRay119ec20,Object.freeze({pixelX,pixelY,coordinateSpace:'s5runtime-source'}));
  if(ray?.coordinateSpace!=='s5runtime-source')throw TypeError('Screen-ray source coordinates required');
  const rawOrigin=vec(ray?.origin,'screen-ray origin'),direction=vec(ray?.direction,'screen-ray direction'),offset=vec(invoke(p.readOffset170),'manager170');
  const origin=vec(rawOrigin.map((v,i)=>f(v+offset[i])),'offset ray origin'),far=float(invoke(p.readFar15f4404),'global15F4404');
  const endpoint=vec(origin.map((v,i)=>f(v+f(direction[i]*far))),'endpoint');
  invoke(p.writePoint158,endpoint);invoke(p.writePoint164,endpoint);
  const query=invoke(p.queryWorld7b5f10,Object.freeze({mask:0x87c0,flag:1,from:origin,to:endpoint,coordinateSpace:'s5runtime-source'}));
  if(query?.coordinateSpace!=='s5runtime-source')throw TypeError('World-query source coordinates required');
  if(typeof query?.hit!=='boolean')throw TypeError('Explicit world-query hit boolean required');
  let point=endpoint;
  if(query.hit){
   point=vec(query.point,'world-hit point');if(!Number.isInteger(query.type)||query.type<0||query.type>0xffffffff)throw TypeError('Raw world-query type required');
   invoke(p.writeWorldHit14e,true);invoke(p.writePoint158,point);invoke(p.writePoint164,point);
   if(query.type===0x200){if(query.object===undefined)throw TypeError('Raw type200 object result required');invoke(p.writeObject17c,query.object);}
  }
  return Object.freeze({...base,updated:true,point,origin,direction,far,pixelX,pixelY,worldHit:query.hit,sourceFunction:'7ECF60..7ED326'});
 },sourceFunction:'7ECF60',worldQueryNativeVerified:false});
}
