const flag=v=>{if(typeof v!=='boolean')throw Error('Explicit native effect lifecycle flag required');return v;};
const required=(ports,names)=>{for(const name of names)if(typeof ports?.[name]!=='function')throw Error('Actual effect lifecycle port '+name+' required');return ports;};

// Source AFE220/AFE3D0/AFE100. This kernel owns an ordered intrusive-style
// collection, not the renderer, controller clock or native allocation count.
// Ports must refer to the real parent service/wrapper owners. A callback's
// presence alone never claims native reference-count or scene ownership.
export class ConquestPawnEffectLifetimeKernel{
 #head={next:null,previous:null};#ports;#count=0;
 constructor(ports){this.#ports=required(ports,['readServices','retainWrapper','releaseWrapper','setupWrapper','readController','attachActionParents','unregisterWrapper','readMembership','tickSequenceManager']);this.#head.next=this.#head.previous=this.#head;}
 register(wrapper,volume){
  if(wrapper===undefined||!Number.isFinite(volume)||!Number.isFinite(Math.fround(volume)))throw Error('Explicit wrapper or null and finite source volume required');
  const p=this.#ports;if(wrapper!==null)p.retainWrapper(wrapper,'entry-temporary');
  try{
   if(wrapper===null)return false;const services=p.readServices();
   if(services.manager8==null||services.sceneC==null)return false;
   if(!flag(p.setupWrapper(wrapper,{manager:services.manager8,scene:services.sceneC,sound:services.sound10,volume:Math.fround(volume)})))return false;
   if(p.readController(wrapper)!==null)p.attachActionParents(p.readController(wrapper));
   p.retainWrapper(wrapper,'insert-temporary');
   try{p.retainWrapper(wrapper,'collection-value');const node={wrapper,next:this.#head,previous:this.#head.previous};this.#head.previous.next=node;this.#head.previous=node;this.#count++;}
   finally{p.releaseWrapper(wrapper,'insert-temporary');}
   return true;
  }finally{if(wrapper!==null)p.releaseWrapper(wrapper,'entry-temporary');}
 }
 remove(wrapper){
  if(wrapper===undefined)throw Error('Explicit wrapper or null required');if(wrapper===null)return true;
  let node=this.#head.next;while(node!==this.#head&&node.wrapper!==wrapper)node=node.next;
  if(node===this.#head)return false;const p=this.#ports,services=p.readServices();if(services.manager8==null)return false;
  // Source ignores virtual24's boolean, and erases only the FIRST identical
  // wrapper. Duplicate registrations are preserved, not silently deduplicated.
  p.unregisterWrapper(wrapper,services.manager8);node.previous.next=node.next;node.next.previous=node.previous;this.#count--;p.releaseWrapper(wrapper,'collection-value');return true;
 }
 tick(deltaMs){
  if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Explicit native unsigned effect delta required');const p=this.#ports;if(p.readServices().manager8==null)return;
  let cursor=this.#head.next;
  while(cursor!==this.#head){const wrapper=cursor.wrapper;cursor=cursor.next;if(!flag(p.readMembership(wrapper,p.readServices().manager8,deltaMs)))this.remove(wrapper);}
  const services=p.readServices();if(services.manager8!==null&&services.manager8!==undefined)p.tickSequenceManager(services.manager8,deltaMs);
 }
 snapshot(){const wrappers=[];for(let node=this.#head.next;node!==this.#head;node=node.next)wrappers.push(node.wrapper);return Object.freeze({wrappers:Object.freeze(wrappers),count:this.#count,sourceOrderedLifecycleQualified:true,nativeRefCountQualified:false,wrapperSceneOwnerQualified:false,nativeReady:false});}
}

//121D760's reserved helper comparison precedes null/vector membership.
// manager+10 is allocated119EF80 by121CCA0 and loop-enabled119FAA0;
// it is not the currently ticking controller and is not an active-list item.
export function conquestSequenceControllerMembership({controller,reservedController10,orderedControllers}={}){
 if(controller===undefined||reservedController10===undefined||!Array.isArray(orderedControllers))throw Error('Actual sequence controller/helper and ordered collection required');
 return controller!==reservedController10&&controller!==null&&orderedControllers.some(value=>value===controller);
}

// Ordinary AFCD90 no-secondary/no-child branch. Retained28/20 strong-field
// writes and detach methods remain mandatory actual owner ports. The raw
// controller30 is NOT cleared by this source method.
export function unregisterConquestOrdinaryEffectWrapper(state,ports){
 required(ports,['readMembership','removeController','readParent','removeChild','setParent','clearStrongField','clearEmptyChildren']);
 if(!state||state.manager==null||state.secondary2C!==null||!Array.isArray(state.children24)||state.children24.length!==0)throw Error('Ordinary effect manager/null-secondary/owned-empty-child branch required');
 if(flag(ports.readMembership(state.controller30,state.manager)))ports.removeController(state.controller30,state.manager);
 const root=state.root28;if(root!==null){const initialParent=ports.readParent(root);if(initialParent===undefined)throw Error('Resolved retained root parent required');if(initialParent!==null){const parent=ports.readParent(root);if(parent===undefined)throw Error('Resolved current retained root parent required');ports.removeChild(parent,root);ports.setParent(root,null);}}
 ports.clearStrongField(state,0x28);ports.clearStrongField(state,0x2c);ports.clearEmptyChildren(state.children24);ports.clearStrongField(state,0x20);
 return Object.freeze({accepted:true,sourceUnregisterBranch:'AFCD90-ordinary-root-empty-children',rawController30Cleared:false,nativeRefCountQualified:false,sceneOwnerQualified:false,nativeReady:false});
}
