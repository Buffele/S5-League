// Base actor51C2F0, vtable13AAFDC+70. ONE already-forwarded MoveBy request.
// The module1 wrapper accumulates BEFORE this gate/cap/split consumer. The
// physics slot1F8 owns the ground-byte reset; neither setter clears it here.
import {nativePushActorWrites} from './native-push-actor.js';
import {nativeCollisionOperation} from './native-collision-operation.js';
const f=Math.fround;
export function nativeActorCollisionMove({state,displacement,actorPolicy,readOperation}={}){
 if(typeof readOperation!=='function')throw TypeError('Current source collision operation ports required');
 const writes=nativePushActorWrites(displacement,actorPolicy);
 let current=nativeCollisionOperation({state,target:state?.anchor684,mode:state?.mode6b8??0}).state;
 const operations=[];
 for(const [index,write]of writes.entries()){
  const ports=readOperation({index,mode:write.flag,displacement:write.delta.slice(),state:structuredClone(current)});
  if(!ports||typeof ports.queryContact!=='function')throw TypeError('Current complete collision operation ports required');
  const result=nativeCollisionOperation({...ports,state:current,mode:write.flag,
   target:current.anchor684.map((n,i)=>f(n+write.delta[i]))});
  operations.push({index,mode:write.flag,displacement:write.delta.slice(),...result});
  if(!result.qualified)return {qualified:false,position:null,state:null,actor2f0:null,writes,operations,reason:result.reason};
  current=result.state;
 }
 return {qualified:true,position:current.anchor684.slice(),state:current,actor2f0:current.anchor684.slice(),writes,operations,
  nativeMovementCompared:false,nativeReady:false};
}
