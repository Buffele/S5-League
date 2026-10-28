// Browser presentation routes only. Runtime readiness, session changes and Play
// remain owned by main.js; no network, result or native state is synthesized here.
export const S5_ENTRY_ROUTES=Object.freeze({
 'ready-lobby':Object.freeze({section:'lobby',panel:null}),
 equipment:Object.freeze({section:'inventory',panel:'inventory'}),
 preparation:Object.freeze({section:'loadout',panel:'loadout'}),
 room:Object.freeze({section:'room',panel:'room'}),
 settings:Object.freeze({section:'settings',panel:'settings'}),
 motion:Object.freeze({section:'motion',panel:'motion'}),
});
const aliases=Object.freeze({lobby:'ready-lobby',inventory:'equipment',loadout:'preparation'});
const accepted=value=>value!==false&&value?.accepted!==false;

export function createS5EntryFlow({onChange=null,beforeNavigate=null,beforePlay=null}={}){
 let route='boot',returnRoute='ready-lobby',status='',error=null,operation=null,serial=0,disposed=false;
 const runtime={ready:false,busy:false,capturing:false,playing:false},listeners=new Set();
 if(onChange)listeners.add(onChange);
 const busy=()=>runtime.busy||operation!==null;
 function refusal(){
  if(disposed)return 'disposed';
  if(runtime.capturing)return 'input-capture';
  if(busy())return 'busy';
  if(!runtime.ready)return 'not-ready';
  if(runtime.playing)return 'playing';
  return null;
 }
 function snapshot(){
  const screen=S5_ENTRY_ROUTES[route];
  return Object.freeze({route,section:screen?.section??null,panel:screen?.panel??null,returnRoute,
   ...runtime,busy:busy(),status,error,operation:operation?Object.freeze({...operation}):null,
   canPlay:!!screen&&!refusal(),blockedReason:refusal()??(screen?null:'unavailable-screen')});
 }
 let last=JSON.stringify(snapshot());
 function emit(){const next=snapshot(),signature=JSON.stringify(next);if(signature!==last){last=signature;for(const listener of [...listeners])listener(next);}return next;}
 function port(call,...args){
  if(!call)return {accepted:true};
  try{const result=call(...args);if(result&&typeof result.then==='function')return {accepted:false,reason:'asynchronous-guard'};
   return accepted(result)?{accepted:true}:{accepted:false,reason:result?.reason??'blocked',detail:result};
  }catch(cause){return {accepted:false,reason:'guard-failed',error:String(cause)};}
 }
 function go(name){
  const target=aliases[name]??name;
  if(!S5_ENTRY_ROUTES[target])return {accepted:false,reason:'unknown-route'};
  if(disposed)return {accepted:false,reason:'disposed'};
  if(busy())return {accepted:false,reason:'busy'};
  if(!runtime.ready)return {accepted:false,reason:'not-ready'};
  if(runtime.playing)return {accepted:false,reason:'playing'};
  if(route===target)return {accepted:true,changed:false};
  // The host cancels binding capture and delegates Settings departures to the
  // existing options lifecycle. Refusal leaves the previous section visible.
  const guard=port(beforeNavigate,{from:route,to:target,section:S5_ENTRY_ROUTES[target].section});
  if(!guard.accepted)return guard;
  route=target;returnRoute=target;error=null;emit();return {accepted:true,changed:true};
 }
 function beginLoading({kind='session',status:nextStatus=status}={}){
  if(disposed)return {accepted:false,reason:'disposed'};
  if(busy())return {accepted:false,reason:'busy'};
  if(runtime.capturing)return {accepted:false,reason:'input-capture'};
  const guard=port(beforeNavigate,{from:route,to:'loading',kind});if(!guard.accepted)return guard;
  if(S5_ENTRY_ROUTES[route])returnRoute=route;
  const token=++serial;operation={token,kind};route='loading';status=String(nextStatus);error=null;emit();
  return {accepted:true,token};
 }
 function startPlay(){
  const reason=refusal();if(reason)return {accepted:false,reason};
  if(!S5_ENTRY_ROUTES[route])return {accepted:false,reason:'unavailable-screen'};
  const guard=port(beforePlay,{from:route});if(!guard.accepted)return guard;
  returnRoute=route==='settings'?'ready-lobby':route;
  const token=++serial;operation={token,kind:'play'};route='loading';error=null;emit();return {accepted:true,token};
 }
 function tokenRefusal(token){
  if(disposed)return {accepted:false,reason:'disposed'};
  if(!operation||operation.token!==token)return {accepted:false,reason:'stale-operation'};
  return null;
 }
 function completeLoading(token,{ready=true,status:nextStatus=status}={}){
  const denied=tokenRefusal(token);if(denied)return denied;
  if(operation.kind==='play')return {accepted:false,reason:'play-not-confirmed'};
  operation=null;runtime.busy=false;runtime.ready=!!ready;runtime.playing=false;status=String(nextStatus);
  route=runtime.ready?returnRoute:'loading';emit();return {accepted:true};
 }
 function enterPlaying(token){
  const denied=tokenRefusal(token);if(denied)return denied;
  if(operation.kind!=='play')return {accepted:false,reason:'not-play-operation'};
  if(runtime.capturing||runtime.busy||!runtime.ready)return {accepted:false,reason:runtime.capturing?'input-capture':runtime.busy?'busy':'not-ready'};
  operation=null;runtime.playing=true;route='playing';error=null;emit();return {accepted:true};
 }
 function cancelPlay(token,nextStatus=status){
  const denied=tokenRefusal(token);if(denied)return denied;
  if(operation.kind!=='play')return {accepted:false,reason:'not-play-operation'};
  // Session changes can supersede audio unlock. Release only this Play token;
  // readiness/busy remain the runtime's facts, without manufacturing an error.
  operation=null;runtime.playing=false;error=null;status=String(nextStatus??'');
  route=runtime.busy||!runtime.ready?'loading':returnRoute;emit();return {accepted:true};
 }
 function returnToLobby(){
  if(disposed)return {accepted:false,reason:'disposed'};
  // Call only after the runtime exposes its menu (pointer-lock loss/Escape).
  // This changes presentation, not the underlying match or its current score.
  if(busy())return {accepted:false,reason:'busy'};
  const guard=port(beforeNavigate,{from:route,to:'ready-lobby',section:'lobby'});if(!guard.accepted)return guard;
  runtime.playing=false;route=runtime.ready?'ready-lobby':'loading';returnRoute='ready-lobby';emit();return {accepted:true};
 }
 function fail(cause,{token=null,recoverable=runtime.ready}={}){
  if(disposed)return {accepted:false,reason:'disposed'};
  if(token!==null){const denied=tokenRefusal(token);if(denied)return denied;}
  operation=null;runtime.busy=false;runtime.playing=false;runtime.ready=runtime.ready&&!!recoverable;
  error=cause instanceof Error?cause.message:String(cause??'Loading failed');status=error;route='error';emit();return {accepted:true};
 }
 function sync(values={}){
  if(disposed)return {accepted:false,reason:'disposed'};
  for(const key of ['ready','busy','capturing','playing'])if(Object.hasOwn(values,key))runtime[key]=!!values[key];
  if(Object.hasOwn(values,'status'))status=String(values.status??'');
  // Only an authoritative runtime notification may confirm Play without its
  // token, e.g. a pre-existing QA entry. Busy=false alone never confirms it.
  if(runtime.playing){operation=null;route='playing';error=null;}
  else if(!operation&&route!=='error'){
   if(runtime.busy||!runtime.ready){if(S5_ENTRY_ROUTES[route])returnRoute=route;route='loading';}
   else if(['boot','loading','playing'].includes(route))route=route==='playing'?'ready-lobby':returnRoute;
  }
  emit();return {accepted:true};
 }
 return Object.freeze({snapshot,go,sync,beginLoading,completeLoading,startPlay,enterPlaying,cancelPlay,returnToLobby,fail,
  subscribe(listener){if(typeof listener!=='function')throw TypeError('Listener required');listeners.add(listener);return()=>listeners.delete(listener);},
  dispose(){disposed=true;operation=null;listeners.clear();},
 });
}
