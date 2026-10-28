import {createBindingInputReader} from './input-binding-reader.js';

// Uses the same remappable registry as movement/settings, with no second
// simulation. Cancel/rebind clears the key without inventing a native End.
export function createGameShieldInput(bindings){
 const reader=createBindingInputReader(bindings,{activeIds:['skill']});
 const sources=new Map(),unsubscribe=bindings.subscribe(()=>sources.clear());
 return Object.freeze({
  down(code,time,repeat=false,source='keyboard'){
   if(!bindings.commandsFor(code).includes('skill'))return false;
   if(repeat)return reader.down(code,time,{repeat});
   const held=sources.get(code)??new Set();if(held.has(source))return true;
   const first=held.size===0;held.add(source);sources.set(code,held);return first?reader.down(code,time,{repeat:false}):true;
  },
  up(code,time,source='keyboard'){
   const held=sources.get(code);if(!held?.delete(source))return false;if(held.size)return true;sources.delete(code);return reader.up(code,time);
  },
  pulse:(code,time)=>reader.pulse(code,time),
  sample:()=>reader.sample().filter(e=>!e.synthetic&&['press','release'].includes(e.edge)).map(e=>({...e,nativeInputCode:e.nativeInputCode})),
  clear(reason){sources.clear();reader.clear(reason);reader.sample();},dispose(){sources.clear();unsubscribe();reader.dispose();},
 });
}
