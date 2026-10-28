import {resetNativeSequenceClock} from './native-sequence-clock.js';

const flag=value=>{
 if(typeof value!=='boolean')throw new TypeError('Explicit native manager flag required');
 return value;
};
const methods=(owner,names)=>{
 for(const name of names)if(typeof owner?.[name]!=='function')throw new TypeError(`Native sequence method ${name} required`);
};

// Controller119f460: clock first, virtual reset of each runtime action,
// then clear controller+28 external nodes. resetAction must include the
// native12016f0 pose reset/detach; resetting the clock alone is insufficient.
export function resetNativeSequenceController(state,duration,actions,owner){
 if(!Array.isArray(actions))throw new TypeError('Native ordered runtime actions required');
 methods(owner,['resetAction','clearExternalNodes']);
 resetNativeSequenceClock(state,duration);
 for(const action of actions)owner.resetAction(action);
 owner.clearExternalNodes();
 return state;
}

// Manager121d960. The owner supplies the native collection traversal;
// remove returns its next cursor. Do not snapshot/sort the collection:
// callbacks can alter it, and erase must not skip the following controller.
// manager+1c is read again for each completed controller.
export function tickNativeSequenceManager(delta,owner){
 if(!Number.isInteger(delta)||delta<0||delta>0xffffffff)throw new RangeError('Native uint32 manager delta required');
 methods(owner,['cleanupHelper','begin','hasCurrent','readController','updateController','readResetEnabled','resetController','remove','next']);
 owner.cleanupHelper();
 if(delta===0)return;
 let cursor=owner.begin();
 while(flag(owner.hasCurrent(cursor))){
  const controller=owner.readController(cursor);
  if(flag(owner.updateController(controller,delta))){
   cursor=owner.next(cursor);
  }else{
   if(flag(owner.readResetEnabled()))owner.resetController(controller);
   cursor=owner.remove(cursor);
  }
 }
}
