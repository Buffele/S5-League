// The UI sends small plans/reports only. All speculative JSON parsing, texture
// downloads and IndexedDB writes happen in this dedicated worker; no WebGL.
export function installEquipmentSourcePrefetch({plan,scope,onProgress=()=>{},workerFactory=()=>new Worker(new URL('./equipment-prefetch.worker.js',import.meta.url),{type:'module'})}){
 let worker;
 try{worker=workerFactory();}catch(error){onProgress({error:String(error.message)});return {setPaused(){},dispose(){}};}
 let disposed=false,lastPaused=null;
 worker.onmessage=event=>{if(!disposed)onProgress(event.data);};
 worker.onerror=()=>{if(!disposed)onProgress({error:'Source prefetch unavailable'});};
 worker.postMessage({type:'start',plan,scope});
 return {setPaused(paused){if(disposed||lastPaused===!!paused)return;lastPaused=!!paused;worker.postMessage({type:'pause',paused:lastPaused});},dispose(){if(disposed)return;disposed=true;worker.terminate();}};
}
