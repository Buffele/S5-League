// Work-only ports. Policies describe source effects, never derive them from button labels.
const copy = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const success = value => value !== false && value?.accepted !== false;
function checkSync(value) {
 if (value && typeof value.then === 'function') throw TypeError('Current-record ports must be synchronous');
 return value;
}
export function createOptionsTransaction({ports, onClose = null, onConfirm = null} = {}) {
 if (!Array.isArray(ports) || !ports.length) throw TypeError('Explicit option ports required');
 const registry = new Map(), listeners = new Set();
 for (const port of ports) {
  if (!port.id || registry.has(port.id) || !port.source || !['live', 'none'].includes(port.policy?.preview) ||
      !['no-op', 'restore-current'].includes(port.policy?.cancel) ||
      !['current-and-draft', 'draft-only'].includes(port.policy?.reset) ||
      ['readCurrent', 'defaults', 'validate', 'writeCurrent'].some(key => typeof port[key] !== 'function') ||
      port.policy.preview === 'live' && typeof port.preview !== 'function') throw TypeError('Unresolved or invalid option port');
  registry.set(port.id, port);
 }
 let phase = 'closed', revision = 0, draft = {}, errors = {}, disposed = false, mutating = false;
 const previewTokens=new Map();
 const read = port => copy(checkSync(port.readCurrent()));
 function snapshot() {
  const current = Object.fromEntries([...registry].map(([id, port]) => [id, read(port)]));
  return copy({phase, revision, current, draft, errors,
   dirty: phase === 'open' && [...registry.keys()].some(id => !same(draft[id], current[id])),
   persistence: Object.fromEntries([...registry].map(([id,port])=>[id,port.policy.persistence??'none'])), nativeDiskSaveEstablished: false});
 }
 function notify() { revision++; for (const listener of [...listeners]) { try { listener(snapshot()); } catch {} } }
 function validate(port, value) {
  const result = checkSync(port.validate(copy(value)));
  return success(result) ? null : {accepted:false, reason:result?.reason ?? 'invalid-value', detail:result};
 }
 function preview(port, value, reason) {
  if (port.policy.preview === 'none') return {accepted:true, delivered:null};
  try {
   const token=(previewTokens.get(port.id)??0)+1;previewTokens.set(port.id,token);
   const result = port.preview(copy(value), {reason});
   if (!success(result)) throw Error(result?.reason ?? 'Preview rejected');
   errors[port.id] = result?.delivered === false ? result.error ?? 'Preview delivery failed' : null;
   let completion=result?.completion;
   if(completion)completion=Promise.resolve(completion).then(row=>{
    if(!disposed&&previewTokens.get(port.id)===token){errors[port.id]=row?.delivered===false?row.error??'Preview delivery failed':null;notify();}
    return row;
   },error=>{if(!disposed&&previewTokens.get(port.id)===token){errors[port.id]=String(error);notify();}return {delivered:false,error:String(error)};});
   return {accepted:true, delivered:result&&Object.hasOwn(result,'delivered')?result.delivered:true, completion};
  } catch (error) { errors[port.id] = String(error); return {accepted:true, delivered:false, error:String(error)}; }
 }
 function refresh(port) { port.refreshDraft?.(copy(draft[port.id])); }
 function guard() {
  if (disposed) return {accepted:false,reason:'disposed'};
  if (mutating) return {accepted:false,reason:'busy'};
  if (phase !== 'open') return {accepted:false,reason:'closed'};
  return null;
 }
 function write(port, value, action) {
  const result = checkSync(port.writeCurrent(copy(value), {action}));
  if (!success(result)) throw Error(result?.reason ?? 'Current record rejected');
  return result;
 }
 function commit(action) {
  const refusal = guard(); if (refusal) return refusal;
  for (const [id, port] of registry) { const invalid = validate(port, draft[id]); if (invalid) return {...invalid,port:id}; }
  const committedPorts = [], portResults={}; mutating = true;
  try {
   for (const [id, port] of registry) { portResults[id]=write(port, draft[id], action); committedPorts.push(id); }
   notify(); return {accepted:true,committedPorts,portResults,persisted:null,nativeDiskSaveEstablished:false};
  } catch (error) {
   notify(); return {accepted:false,reason:'commit-failed',error:String(error),committedPorts,
    partial:committedPorts.length>0,persisted:null};
  } finally { mutating = false; }
 }
 const api = {
  snapshot,
  open() {
   if (disposed) return {accepted:false,reason:'disposed'};
   if (phase === 'open') return {accepted:true,changed:false};
   const next = {};
   try {
    for (const [id, port] of registry) { next[id]=read(port); const invalid=validate(port,next[id]); if(invalid)return {...invalid,port:id}; }
   } catch(error) { return {accepted:false,reason:'read-failed',error:String(error)}; }
   draft=next; errors={}; phase='open';
   for(const [id,port] of registry){refresh(port);preview(port,draft[id],'open-refresh');}
   notify();return {accepted:true};
  },
  stage(id, value) {
   const refusal=guard();if(refusal)return refusal;
   const port=registry.get(id);if(!port)return {accepted:false,reason:'unknown-port'};
   const invalid=validate(port,value);if(invalid)return invalid;
   const changed=!same(draft[id],value);draft[id]=copy(value);
   const delivery=changed?preview(port,draft[id],'edit'):{accepted:true,changed:false};
   refresh(port);notify();return {...delivery,changed};
  },
  retryPreview(id) { const refusal=guard();if(refusal)return refusal;const port=registry.get(id);if(!port)return {accepted:false,reason:'unknown-port'};const result=preview(port,draft[id],'retry');notify();return result; },
  apply() { return commit('apply'); },
  confirm() {
   const result=commit('confirm');if(!result.accepted)return result;
   try { if(onConfirm && !success(checkSync(onConfirm(snapshot()))))return {...result,accepted:false,reason:'confirm-effect-failed',committed:true}; }
   catch(error){return {...result,accepted:false,reason:'confirm-effect-failed',error:String(error),committed:true};}
   phase='closed';notify();onClose?.({action:'confirm',sourceCloseMessage:0x801f});return {...result,closed:true};
  },
  cancel(reason='explicit-cancel') {
   const refusal=guard();if(refusal)return refusal;
   // No generic rollback. A restore-current policy is allowed only with explicit provenance.
   for(const [id,port] of registry){if(port.policy.cancel==='restore-current')preview(port,read(port),'cancel-port-restore');port.cancel?.(copy(draft[id]));}
   phase='closed';notify();onClose?.({action:'cancel',reason,sourceCloseMessage:0x801f});return {accepted:true,closed:true,persisted:null};
  },
  reset(id=null, keys=null) {
   const refusal=guard();if(refusal)return refusal;
   const selected=id===null?[...registry.values()]:[registry.get(id)];
   if(selected.some(port=>!port))return {accepted:false,reason:'unknown-port'};
   const values=new Map();
   for(const port of selected){
    const defaults=copy(checkSync(port.defaults()));
    if(keys && (!Array.isArray(keys)||keys.some(key=>!Object.hasOwn(defaults,key))))return {accepted:false,reason:'unknown-default-field'};
    const value=keys?{...draft[port.id],...Object.fromEntries(keys.map(key=>[key,defaults[key]]))}:defaults;
    const invalid=validate(port,value);if(invalid)return {...invalid,port:port.id};values.set(port.id,value);
   }
   const committedPorts=[];
   try {
    for(const port of selected){
     const value=values.get(port.id);
     if(port.policy.reset==='current-and-draft'){
      const current=keys?{...read(port),...Object.fromEntries(keys.map(key=>[key,value[key]]))}:value;
      write(port,current,'reset');committedPorts.push(port.id);
     }
     draft[port.id]=copy(value);refresh(port);preview(port,value,'reset-refresh');
    }
    notify();return {accepted:true,committedPorts,scope:keys?'s5-per-control-default-projection':'native-family-reset',persisted:null};
   }catch(error){notify();return {accepted:false,reason:'reset-failed',error:String(error),committedPorts,partial:committedPorts.length>0};}
  },
  subscribe(listener){if(typeof listener!=='function')throw TypeError('Listener required');listeners.add(listener);return()=>listeners.delete(listener);},
  dispose(){if(disposed)return;disposed=true;phase='disposed';notify();listeners.clear();},
 };
 return Object.freeze(api);
}
