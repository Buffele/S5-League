// Own asynchronous browser control requests. Main owns session identity, menu
// policy and fallback controls; this port never changes a match or its clocks.
export function createGameSessionControl({document:doc,canvas,getOwner,isCurrent,onFallback=()=>{},onCaptured=()=>{}}={}){
 if(!doc?.addEventListener||!doc?.removeEventListener||!canvas||typeof getOwner!=='function'||typeof isCurrent!=='function')throw TypeError('Document, canvas and session ownership callbacks required');
 let epoch=0,disposed=false,pending=null,captured=null;
 const valid=operation=>!disposed&&operation.epoch===epoch&&isCurrent(operation.owner)===true;
 const release=()=>{if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();};
 function finish(operation,result){
  if(operation.settled)return result;
  operation.settled=true;if(pending===operation)pending=null;operation.resolve(Object.freeze(result));return result;
 }
 function stale(operation){
  // A delayed older promise must not release a newer, still-valid capture.
  if(doc.pointerLockElement===canvas&&!((pending?.stage==='capture'&&valid(pending))||(captured&&valid(captured))))release();
  return finish(operation,{accepted:false,reason:disposed?'disposed':'stale-request'});
 }
 function cancel(reason){
  epoch++;captured=null;
  if(pending)finish(pending,{accepted:false,reason});
 }
 function completeCapture(operation){
  if(!valid(operation))return stale(operation);
  if(operation.settled)return;
  captured=operation;
  try{onCaptured(operation.owner,{unadjustedMovement:operation.unadjustedMovement});}catch(error){captured=null;release();return finish(operation,{accepted:false,reason:'capture-callback-failed',error});}
  return finish(operation,{accepted:true,mode:'pointerlock'});
 }
 function fallback(operation,error){
  if(!valid(operation))return stale(operation);
  if(operation.settled)return;
  // Never enable mouse fallback behind a lock owned by another canvas/app.
  if(doc.pointerLockElement&&doc.pointerLockElement!==canvas)return finish(operation,{accepted:false,reason:'foreign-pointerlock',error});
  if(doc.pointerLockElement===canvas)return completeCapture(operation);
  try{onFallback(operation.owner,error);}catch(cause){return finish(operation,{accepted:false,reason:'fallback-callback-failed',error:cause});}
  return finish(operation,{accepted:true,mode:'fallback'});
 }
 function request(operation,unadjustedMovement=true){
  if(!valid(operation))return stale(operation);
  operation.stage='capture';operation.unadjustedMovement=unadjustedMovement;operation.promiseBacked=false;
  const rejected=error=>{
   if(!valid(operation))return stale(operation);
   if(operation.settled)return;
   // Windows' ordinary pointer path may recenter/filter cursor motion. Prefer
   // the browser's raw-input path, but unsupported hardware/platforms retain
   // the original capture policy. Never retry permission or activation denial.
   if(unadjustedMovement&&error?.name==='NotSupportedError'&&doc.pointerLockElement!==canvas)return request(operation,false);
   return fallback(operation,error);
  };
  try{
   canvas.focus?.();
   if(!valid(operation))return stale(operation);
   if(doc.pointerLockElement===canvas)return completeCapture(operation);
   const result=unadjustedMovement?canvas.requestPointerLock({unadjustedMovement:true}):canvas.requestPointerLock();
   // Older browsers return void: pointerlockchange/error complete the request.
   if(result&&typeof result.then==='function'){operation.promiseBacked=true;Promise.resolve(result).then(()=>{
    if(!valid(operation)){stale(operation);return;}
    if(doc.pointerLockElement===canvas)completeCapture(operation);
   },rejected);}
  }catch(error){rejected(error);}
 }
 function begin(kind){
  if(disposed)return null;
  cancel('superseded');
  const operation={epoch,owner:getOwner(),kind,stage:kind==='resume'?'preparing':'capture',settled:false,resolve:null,promise:null};
  operation.promise=new Promise(resolve=>{operation.resolve=resolve;});pending=operation;return operation;
 }
 function lockChanged(){
  if(doc.pointerLockElement!==canvas)return;
  if(pending&&valid(pending)&&pending.stage==='capture')completeCapture(pending);
  else if(!captured||!valid(captured))release();
 }
 // Promise APIs carry request identity; a global error from an older request
 // must not finish a newer promise-backed request. Void APIs only have events.
 function lockFailed(event){if(pending?.stage==='capture'&&!pending.promiseBacked)fallback(pending,event);}
 doc.addEventListener('pointerlockchange',lockChanged);doc.addEventListener('pointerlockerror',lockFailed);
 return Object.freeze({
  capture(){const operation=begin('capture');if(!operation)return Promise.resolve({accepted:false,reason:'disposed'});request(operation);return operation.promise;},
  resume(prepare=()=>{}){
   if(pending?.kind==='resume'&&valid(pending))return pending.promise;
   if(typeof prepare!=='function')throw TypeError('Resume preparation must be callable');
   const operation=begin('resume');if(!operation)return Promise.resolve({accepted:false,reason:'disposed'});
   if(!valid(operation)){stale(operation);return operation.promise;}
   Promise.resolve().then(()=>valid(operation)?prepare(operation.owner):undefined).then(()=>{
    if(valid(operation))request(operation);else stale(operation);
   },error=>{if(valid(operation))finish(operation,{accepted:false,reason:'preparation-failed',error});else stale(operation);});
   return operation.promise;
  },
  invalidate(reason='invalidated'){if(disposed)return;cancel(reason);release();},
  snapshot(){return Object.freeze({epoch,disposed,pending:pending?Object.freeze({kind:pending.kind,stage:pending.stage}):null,captured:!!captured&&valid(captured)});},
  dispose(){if(disposed)return;cancel('disposed');disposed=true;release();doc.removeEventListener('pointerlockchange',lockChanged);doc.removeEventListener('pointerlockerror',lockFailed);},
 });
}
