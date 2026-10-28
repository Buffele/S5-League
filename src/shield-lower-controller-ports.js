import {createShieldLowerContainer,enterShieldLowerContainer,tickShieldLowerContainer,inputShieldLowerContainer,leaveShieldLowerContainer,switchShieldLowerContainer} from './shield-body-locomotion.js';

// Adapter of the source containers to the installed Controller body. This
// neither creates missing child behavior nor maps keyboard axes/native modes.
export function createShieldLowerControllerPorts(controller,{sets,readNativeContext}={}){
 if(!controller||typeof readNativeContext?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(readNativeContext.tick.constructor.name)||!['source-port','explicit-unverified'].includes(readNativeContext.provenance?.kind)||typeof readNativeContext.provenance.source!=='string'||!readNativeContext.provenance.source.trim())throw new TypeError('Controller and explicit synchronous lower context port/provenance required');
 if(!sets?.[0])throw new TypeError('Explicit Shield LowerPartStateSet0 required');
 const containers=new Map(Object.entries(sets).map(([key,value])=>{
  if(!['0','1'].includes(key))throw new TypeError('Only source lower sets0/1 are supported');
  return [Number(key),createShieldLowerContainer(value)];
 }));
 let body=null,selectedSet=null,left=false;
 const requireBody=()=>{const current=controller.s5runtimeShieldBodyState;if(!current||current.actorStateId!==34||(body&&current!==body)||left)throw new Error('Matching current Shield body required for lower ports');return current;};
 const read=()=>{const value=readNativeContext.tick({controller,body});if(value?.then)throw new TypeError('Synchronous lower context required');return value;};
 const selected=()=>{requireBody();if(selectedSet===null)throw new Error('Lower container must enter before Tick/Input/Leave');return containers.get(selectedSet);};
 return {
  provenance:{source:'Shield lower container62A270/300/330/3E0, actual Controller body identity',context:{...readNativeContext.provenance}},
  supportsWeaponType(type){return !left&&(!body||controller.s5runtimeShieldBodyState===body)&&Number.isInteger(type)&&containers.has(type===43?1:0);},
  enter(weaponType){
   const current=requireBody(),set=weaponType===43?1:0,container=containers.get(set);
   if(!Number.isInteger(weaponType)||!container)throw new Error('Explicit source lower set required; weapon43 has no Set0 fallback');
   body=current;selectedSet=set;return enterShieldLowerContainer(container,read());
  },
  tick(dtMs){return tickShieldLowerContainer(selected(),dtMs,read());},
  input(code){return inputShieldLowerContainer(selected(),code);},
  switchChild(next){return switchShieldLowerContainer(selected(),next);},
  leave(){const container=selected();leaveShieldLowerContainer(container);left=true;return {left:true,bodyEntrySerial:body.bodyEntrySerial,nativeReady:false};},
  snapshot(){return {bodyEntrySerial:body?.bodyEntrySerial??null,selectedSet,selectedChild:selectedSet===null?null:containers.get(selectedSet).selected,left,nativeReady:false,callbackTruthVerified:false};},
 };
}
