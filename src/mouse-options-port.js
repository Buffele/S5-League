import {NATIVE_MOUSE_DEFAULTS,validMouseRecord,projectMouseWidget} from './mouse-settings.js';
export function createMouseOptionsPort({settings}={}){
 if(!settings?.writeCurrent||!settings?.get)throw TypeError('Actual shared mouse model required');const initial=settings.get();let transaction=null,widget=projectMouseWidget({sensitivity:initial.sensitivity,inverse:initial.inverse}),normalizing=false,disposed=false;const listeners=new Set();
 const record=()=>{const value=settings.get();return {sensitivity:value.sensitivity,inverse:value.inverse};};
 const notify=()=>{for(const fn of [...listeners])fn();};
 const port={id:'mouse',source:{open:'D73660/C70EB0',commit:'C71050/D73600',cancel:'D735F0',reset:'C6ACB0/D73590',widgetRange:'D736C0/122E5A0',widgetStep:'D736D0/1224F70'},
  policy:{preview:'none',cancel:'no-op',reset:'draft-only',persistence:'none'},readCurrent:record,defaults:()=>({...NATIVE_MOUSE_DEFAULTS}),
  validate:value=>validMouseRecord(value)?{accepted:true}:{accepted:false,reason:'invalid-mouse-record'},
  writeCurrent:value=>settings.get().available?settings.writeCurrent(projectMouseWidget(value)):{accepted:false,reason:'mouse-consumer-unavailable'},
  refreshDraft(value){widget=projectMouseWidget(value);
   // Native Refresh writes the raw record into HScroll, whose clamp is collected on Apply.
   if(transaction?.snapshot().phase==='open'&&!normalizing&&value.sensitivity!==widget.sensitivity){normalizing=true;try{const ack=transaction.stage('mouse',widget);if(!ack.accepted)throw Error('Mouse widget normalization rejected');}finally{normalizing=false;}}
   notify();
  },
 };
 const change=patch=>{if(disposed||!transaction)return {accepted:false,reason:'unattached'};if(!settings.get().available)return {accepted:false,reason:'mouse-consumer-unavailable'};return transaction.stage('mouse',{...widget,...patch});};
 const off=settings.subscribe(notify);
 const view=Object.freeze({get:()=>({...widget,available:settings.get().available,currentSensitivity:settings.get().sensitivity,currentInverse:settings.get().inverse,sourceDefaultSensitivity:NATIVE_MOUSE_DEFAULTS.sensitivity,widgetRange:100,widgetStep:10}),
  setSensitivity(value){if(!Number.isInteger(value)||value<0||value>100)return {accepted:false,reason:'invalid-widget-value'};return change({sensitivity:value});},
  setInverse(value){if(typeof value!=='boolean')return {accepted:false,reason:'invalid-inverse'};return change({inverse:value});},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}});
 return {port,view,attach(value){if(transaction)throw Error('Mouse port already attached');transaction=value;},dispose(){disposed=true;off();listeners.clear();}};
}
