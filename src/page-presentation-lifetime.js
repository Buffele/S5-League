// Register before resource teardown listeners. A queued frame must not touch
// disposed rigs or renderers. A bfcache hide retains the live page instead.
export function createPagePresentationLifetime(target){
 if(typeof target?.addEventListener!=='function')throw new TypeError('Page event target required');
 let ended=false;
 target.addEventListener('pagehide',event=>{if(!event.persisted)ended=true;});
 return Object.freeze({get ended(){return ended;}});
}
