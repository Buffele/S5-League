// The loading presentation follows actual application work. A resolved
// module import alone is insufficient: main's asynchronous preparation must finish.
export async function startS5Game({loadGame,loading,document:doc=globalThis.document}={}){
 if(typeof loadGame!=='function'||!loading?.updatePhase||!loading?.ready||!loading?.error)throw TypeError('Actual module loader and loading view required');
 const surfaces=['welcome','game'].map(id=>doc.getElementById?.(id)).filter(Boolean);
 const lock=()=>{for(const surface of surfaces){surface.setAttribute('inert','');surface.setAttribute('aria-hidden','true');}};
 const unlock=()=>{for(const surface of surfaces){surface.removeAttribute('inert');surface.removeAttribute('aria-hidden');}};
 lock();
 if(doc.documentElement)doc.documentElement.dataset.gameBootstrap='loading';
 const phase=event=>loading.updatePhase(event.detail);
 doc.addEventListener('s5:loading-phase',phase);
 loading.updatePhase('initializing');
 try{
  const game=await loadGame();
  if(!game?.gameReady||typeof game.gameReady.then!=='function')throw Error('Game preparation promise unavailable');
  await game.gameReady;
  const welcome=doc.getElementById?.('welcome');
  if(welcome&&!welcome.classList?.contains('s5-entry-host'))throw Error('Lobby interface unavailable');
  unlock();
  if(doc.documentElement)doc.documentElement.dataset.gameBootstrap='ready';
  loading.ready();
  if(welcome&&!welcome.hidden)welcome.querySelector?.('.s5-lobby-play:not(:disabled)')?.focus({preventScroll:true});
  return {accepted:true};
 }catch(error){
  lock();
  if(doc.documentElement)doc.documentElement.dataset.gameBootstrap='error';
  loading.error(error);
  return {accepted:false,error};
 }finally{doc.removeEventListener('s5:loading-phase',phase);}
}
