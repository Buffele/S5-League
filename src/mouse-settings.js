// Native defaults are raw source values, distinct from the widget projection100.
export const NATIVE_MOUSE_DEFAULTS=Object.freeze({sensitivity:1000,inverse:false});
export const NATIVE_MOUSE_WIDGET=Object.freeze({range:100,step:10});
export function validMouseRecord(value){return value&&Object.keys(value).length===2&&Number.isInteger(value.sensitivity)&&value.sensitivity>=0&&value.sensitivity<=0x7fffffff&&typeof value.inverse==='boolean';}
export function projectMouseWidget(value){if(!validMouseRecord(value))throw TypeError('Invalid current mouse record');return {sensitivity:Math.min(100,value.sensitivity),inverse:value.inverse};}
export function nativeMouseScalar(value){if(!Number.isInteger(value)||value<0||value>0x7fffffff)throw RangeError('Invalid signed source sensitivity');return Math.fround(Math.fround(value-50)/75);}
export function nativeMouseFactor(value){return Math.fround(1+nativeMouseScalar(value));}
export function createMouseSettings({initial,initialPolicy}={}){
 if(!validMouseRecord(initial)||typeof initialPolicy!=='string'||!initialPolicy)throw TypeError('Explicit initial current record and provenance policy required');
 let current={...initial},consumer=null,revision=0,disposed=false;const listeners=new Set();const copy=()=>({...current,sourceScalar:nativeMouseScalar(current.sensitivity),sourceFactor:nativeMouseFactor(current.sensitivity),available:consumer!==null,revision,initialPolicy});
 const notify=()=>{revision++;for(const fn of [...listeners])fn(copy());};
 return Object.freeze({get:copy,
  writeCurrent(value){if(disposed)return {accepted:false,reason:'disposed'};if(!validMouseRecord(value))return {accepted:false,reason:'invalid-mouse-record'};
   try{if(consumer&&consumer({...value})===false)return {accepted:false,reason:'mouse-consumer-rejected'};}catch{return {accepted:false,reason:'mouse-consumer-failed'};}
   const changed=value.sensitivity!==current.sensitivity||value.inverse!==current.inverse;current={...value};if(changed)notify();return {accepted:true,changed,persisted:null};
  },
  attachConsumer(fn){if(typeof fn!=='function'||consumer||disposed)throw TypeError('One real mouse consumer required');if(fn({...current})===false)throw Error('Mouse consumer refused initial record');consumer=fn;notify();return()=>{if(consumer===fn){consumer=null;notify();}};},
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},dispose(){disposed=true;consumer=null;listeners.clear();},
 });
}
