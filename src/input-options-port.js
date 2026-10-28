import {createInputBindings} from './input-bindings.js';
// A local draft registry drives only the options UI. MovementInput/HUD keep activeBindings.
export function createInputOptionsPort({activeBindings,externalBindings,formatCodeLabel}={}){
 if(!activeBindings?.replace||!Array.isArray(externalBindings))throw TypeError('Actual bindings and exact external reservations required');
 let draftBindings,transaction=null,refreshing=false;const listeners=new Set();
 const make=value=>createInputBindings({initial:{version:1,bindings:value},storage:null,externalBindings,
  ...(typeof formatCodeLabel==='function'?{formatCodeLabel}:{})});
 const current=()=>({...activeBindings.snapshot().bindings});
 function delta(from,to){return Object.fromEntries(Object.entries(to).filter(([id,code])=>from[id]!==code));}
 function notify(detail){for(const listener of [...listeners])listener(detail);}
 const port={id:'input',source:{open:'D72EE0',commit:'D72DE0',cancel:'D72DD0',reset:'D72D40'},
  policy:{preview:'none',cancel:'no-op',reset:'draft-only',persistence:'s5-storage-on-commit'},
  readCurrent:current,
  defaults:()=>Object.fromEntries(activeBindings.definitions.map(row=>[row.id,row.defaultCode])),
  validate(value){
   const previous=current();if(!value||Object.keys(value).length!==Object.keys(previous).length||Object.keys(previous).some(id=>!Object.hasOwn(value,id)))return {accepted:false,reason:'incomplete-bindings'};
   const candidate=make(previous);return candidate.replace(delta(previous,value));
  },
  writeCurrent(value){return activeBindings.replace(delta(current(),value));},
  refreshDraft(value){refreshing=true;draftBindings=make(value);refreshing=false;notify({type:'draft-refreshed'});},
 };
 port.refreshDraft(current());
 const mutate=(method,...args)=>{
  if(!transaction||transaction.snapshot().phase!=='open')return {accepted:false,reason:'closed'};
  const result=draftBindings[method](...args);
  if(result.accepted&&!refreshing){const staged=transaction.stage('input',draftBindings.snapshot().bindings);if(!staged.accepted)return staged;}
  return {...result,persisted:null,persistencePolicy:'draft-only-until-apply'};
 };
 const viewBindings=Object.freeze({definitions:activeBindings.definitions,
  get:id=>draftBindings.get(id),snapshot:()=>draftBindings.snapshot(),export:()=>draftBindings.export(),
  collisions:()=>draftBindings.collisions(),commandsFor:code=>draftBindings.commandsFor(code),
  set:(id,code)=>mutate('set',id,code),replace:value=>mutate('replace',value),reset:id=>mutate('reset',id),
  subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
 });
 return {port,viewBindings,attach(value){transaction=value;}};
}
