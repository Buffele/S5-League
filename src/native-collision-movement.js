// S5 host adapter for the source movement operation and module1 accumulator.
// The host MUST supply current queries, state, coordinate mapping, callsites
// and caller ground/condition/cap policy. Setter modes come from51C2F0,
// after accumulation, not from a host-supplied direction heuristic.
// This adapter establishes integration, not measured native frame cadence.
import {Vector3} from 'three';
import {nativeCollisionOperation} from './native-collision-operation.js';
import {nativeActorCollisionMove} from './native-actor-collision-move.js';
import {createNativeMovementBatcher} from './native-movement-batching.js';
const f=Math.fround;
const xyz=value=>{
 const a=Array.isArray(value)?value:[value?.x,value?.y,value?.z];
 if(a.length!==3||a.some(n=>!Number.isFinite(n)))throw TypeError('Finite host XYZ required');
 return a.slice();
};
const evidence=value=>typeof value==='string'&&value.trim();

export function createNativeCollisionMovement({state,mapping,batching,prepareMove,readActorPolicy,readHostGrounded,readOperation,source,channelOrder=['horizontal','vertical']}={}){
 if(!evidence(source)||!evidence(mapping?.evidence)||typeof prepareMove!=='function'||typeof readActorPolicy!=='function'||typeof readHostGrounded!=='function'||typeof readOperation!=='function')throw TypeError('Explicit mapping, caller ground/actor policy, host grounded reader, current queries and evidence required');
 const scale=xyz(mapping.scale),origin=xyz(mapping.origin);
 if(scale.some(n=>n===0||Math.abs(n)!==Math.abs(scale[0])))throw TypeError('Uniform source unit scale with explicit axis signs required');
 if(!batching||batching.horizontalCallsite===batching.verticalCallsite)throw TypeError('Distinct explicit horizontal/vertical callsites required');
 if(!Array.isArray(channelOrder)||channelOrder.length!==2||new Set(channelOrder).size!==2||channelOrder.some(channel=>!['horizontal','vertical'].includes(channel)))throw TypeError('Explicit horizontal/vertical operation order required');
 channelOrder=channelOrder.slice();
 const template=nativeCollisionOperation({state,target:state?.anchor684,mode:0}).state;
 let current=structuredClone(template),batcher;
 const makeBatch=initial=>createNativeMovementBatcher({...batching,state:initial});
 batcher=makeBatch(batching.state);
 const initialBatch=batcher.snapshot();
 const positionFor=anchor=>Object.fromEntries(['x','y','z'].map((axis,i)=>[axis,anchor[i]*scale[i]+origin[i]]));
 const anchorFor=position=>xyz(position).map((n,i)=>f((n-origin[i])/scale[i]));
 const position=()=>positionFor(current.anchor684);
 function reset({position:nextPosition,grounded}={}){
  if(typeof grounded!=='boolean')throw TypeError('Explicit reset ground state required');
  const anchor=anchorFor(nextPosition);
  current={...structuredClone(template),anchor684:anchor,lastSafe69c:anchor.slice(),history:[],accumulatedCategoriesC:0,nearest658:-1,found650:false,grounded6b4:grounded};
  batcher=makeBatch({...initialBatch,records:[]});
  return position();
 }
 function move({position:hostPosition,horizontal,vertical,deltaSeconds,grounded}={}){
  const expected=position(),actual=xyz(hostPosition);
  if(actual.some((n,i)=>n!==expected[['x','y','z'][i]]))return {qualified:false,reason:'host-position-changed-reset-required',position:null};
  if(typeof grounded!=='boolean')throw TypeError('Explicit current host grounded state required');
  const requested={horizontal:xyz(horizontal),vertical:xyz(vertical)};
  const displacements=channelOrder.map(channel=>[channel,requested[channel]]);
  const previousState=structuredClone(current),previousBatch=batcher.snapshot();
  const operations=[],contacts=[],channels=[];let refusal=null,nextGrounded=grounded;
  const rollback=()=>{current=previousState;batcher=makeBatch(previousBatch);};
  try{
   batcher.timerFrame({deltaSeconds,forwardFrame:()=>{
    for(const [channel,delta]of displacements){
     if(refusal)break;
     const nativeDelta=delta.map((n,i)=>f(n/scale[i]));
     const path=batcher.move({actorId:batching.actorId,localActorId:batching.localActorId,
      callsite:channel==='horizontal'?batching.horizontalCallsite:batching.verticalCallsite,
      displacement:nativeDelta,forwardEnabled:true,forward:({displacement})=>{
       const request={channel,displacement:displacement.slice(),state:structuredClone(current),grounded:nextGrounded};
       const policy=prepareMove(request);
       if(!policy||typeof policy.grounded!=='boolean')throw TypeError('Explicit caller ground state before actor MoveBy required');
       const actorPolicy=readActorPolicy(request);
       const hits=[];
       const result=nativeActorCollisionMove({state:{...current,grounded6b4:policy.grounded},displacement,actorPolicy,
        readOperation:write=>{
         const input=readOperation({channel,...write});
         if(!input||typeof input.queryContact!=='function')throw TypeError('Current complete operation ports required');
         return {...input,queryContact:args=>{
          const hit=input.queryContact(args);
          if(hit?.qualified===true&&hit.hit)hits.push(hit);
          return hit;
         }};
        }});
       operations.push(...result.operations.map(operation=>({channel,...operation})));
       if(!result.qualified){refusal=result.reason;return;}
       current=result.state;
       // Native actor mode114 can remain0 while physics temporarily clears
       // solver6B4. The host's logical state cannot be inferred from that byte.
       nextGrounded=readHostGrounded({channel,state:structuredClone(current),result,previousGrounded:nextGrounded});
       if(typeof nextGrounded!=='boolean')throw TypeError('Explicit logical host grounded state required');
       // Preserve the source operation's componentwise normal conversion.
       // S5's velocity/walljump policy consumes these world-oriented contacts;
       // that host policy is not claimed to be native actor integration.
       for(const hit of hits){
        const normal=new Vector3(...hit.normal.map((n,i)=>f(n*current.radii690[i])*Math.sign(scale[i]))).normalize();
        const point=new Vector3(...hit.point.map((n,i)=>f(n*current.radii690[i])*scale[i]+origin[i]));
        contacts.push({normal,point,channel,nativeContact:hit});
       }
      }});
     channels.push({channel,...path});
    }
   }});
   if(refusal){rollback();return {qualified:false,reason:refusal,position:null,operations,contacts:[]};}
   return {qualified:true,position:position(),grounded:nextGrounded,operations,contacts,channels,
    nativeMovementCompared:false,nativeReady:false};
  }catch(error){rollback();throw error;}
 }
 return {move,reset,position,snapshot:()=>({state:structuredClone(current),batching:batcher.snapshot()}),source};
}
