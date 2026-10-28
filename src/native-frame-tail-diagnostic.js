import {advanceS5RuntimeNativeMp} from './s5runtime-skill-native-mp.js';
import {advanceS5RuntimeBindCondition} from './s5runtime-skill-bind-kernel.js';

// Bounded actor51EAB0 segment, after CurrentStateTick51F506. The actual
// global function continues after conditions, including velocity callbacks.
export const NATIVE_FRAME_TAIL_STAGES=Object.freeze([
 {id:'queuedState',site:'51F521',target:'518E20',gate:'actor+274 nonnull'},
 {id:'actor52aca0',site:'51F52D',target:'52ACA0'},
 {id:'actorMpSlotAdjustment',site:'51F57F/51F5AB',target:'actor slotsC8/C4 with decoded constant0'},
 {id:'mpRecovery',site:'51F5BB',target:'52B110'},
 {id:'invisible',site:'51F5CD',target:'B88D50',actorField:'2A0'},
 {id:'fly',site:'51F5DF',target:'B808D0',actorField:'2A8'},
 {id:'actor2b8',site:'51F5F1',target:'B84E50',actorField:'2B8'},
 {id:'actor2ac',site:'51F603',target:'B85F10',actorField:'2AC'},
 {id:'shield',site:'51F615',target:'B868A0',actorField:'2B0'},
 {id:'actor2bc',site:'51F627',target:'B874C0',actorField:'2BC'},
 {id:'conditions',site:'51F639',target:'54ADE0',actorField:'208'},
].map(Object.freeze));
const kinds=new Set(['source-port','explicit-no-op-unverified','external-unverified']);
function validCallback(callback){
 if(typeof callback?.tick!=='function'||callback.tick.constructor.name==='AsyncFunction'||!kinds.has(callback.provenance?.kind)||typeof callback.provenance.source!=='string'||!callback.provenance.source)throw new TypeError('Explicit synchronous callback and source/provenance required for every tail stage');
}
// Pure preflight: Controller may call this before physics/state mutations.
// It checks declaration/cadence only, and never invokes live context readers.
export function validateNativeFrameTailDiagnostic({enabled=false,dtMs,callbacks}={}){
 if(enabled===false)return {status:'disabled',nativeReady:false};
 if(enabled!==true||!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw new TypeError('Opt-in and uint32 engine dt required');
 for(const stage of NATIVE_FRAME_TAIL_STAGES)validCallback(callbacks?.[stage.id]);
 return {status:'validated',scope:'after-current-state-through-condition-manager',nativeReady:false};
}
export function runNativeFrameTailDiagnostic({enabled=false,afterCurrentStateTick,dtMs,callbacks,shared}={}){
 const validation=validateNativeFrameTailDiagnostic({enabled,dtMs,callbacks});
 if(validation.status==='disabled')return validation;
 if(afterCurrentStateTick!==true)throw new TypeError('Explicit dispatch after CurrentStateTick required');
 // Validate the whole dispatch before any mutation. No absent-stage fallback.
 const timeline=[];
 for(const stage of NATIVE_FRAME_TAIL_STAGES){
  const callback=callbacks[stage.id],result=callback.tick(dtMs,{stage,shared});
  if(result&&typeof result.then==='function')throw new TypeError('Native frame callbacks must complete synchronously');
  timeline.push({...stage,provenance:{...callback.provenance},result});
 }
 return {status:'diagnostic-only',scope:'after-current-state-through-condition-manager',timeline,nativeReady:false,sourceOrderEstablished:true,callbackTruthVerified:false,limits:['Caller must complete physics/input/current state before this segment','Unknown and no-op callbacks remain unverified','Global51EAB0 continues after conditions; later actor callbacks and protected-vector/position writes are outside this segment; F0 feedback remains unverified','S5 collision bridge and actor MP profile are not native live validation']};
}

// Live context is read at the prepass, never cached before component changes.
// Raw commands (including state slot24 requests) require an explicit consumer.
export function nativeMpRecoveryStage({profile,readNativeContext,consumeCommands,provenance}={}){
 if(profile?.actorId===undefined||profile.actorId===null||typeof readNativeContext!=='function'||typeof consumeCommands!=='function')throw new TypeError('Explicit actor MP profile, live predicates and command consumer required');
 const callback={provenance,tick:dtMs=>{
  const result=advanceS5RuntimeNativeMp(profile,dtMs,{nativeContext:readNativeContext()});
  consumeCommands(result.commands,result);return result;
 }};
 validCallback(callback);return callback;
}

// Bind subset only. Other condition types need their own sourced callbacks.
// Collection removal is explicit and occurs only after that condition's End.
export function nativeBindExpiryStage({conditions,readNativeContext,onConditionEnded,provenance}={}){
 if(!Array.isArray(conditions)||typeof readNativeContext!=='function'||typeof onConditionEnded!=='function')throw new TypeError('Explicit Bind collection, owner context and End consumer required');
 const callback={provenance,tick:dtMs=>{
  const results=[];
  for(const condition of [...conditions]){
   const wasInstalled=condition.installed===true,result=advanceS5RuntimeBindCondition(condition,dtMs,{nativeContext:readNativeContext(condition)});
   results.push({id:condition.id,...result});
   if(wasInstalled&&!condition.installed)onConditionEnded(condition,result);
  }
  return {results,nativeReady:false,scope:'explicit-Bind-subset-only'};
 }};
 validCallback(callback);return callback;
}
