// Presentation only: the caller supplies its existing session phase and menu
// visibility. Returning to the lobby never implies replay or a session reset.
export function installS5SessionNavigation({host=null,onReturnToLobby,document:providedDocument=null}={}){
 const doc=providedDocument??host?.ownerDocument??globalThis.document;host??=doc?.body;
 if(!host||!doc||typeof onReturnToLobby!=='function')throw TypeError('Document host and real lobby callback required');
 const root=doc.createElement('nav'),button=doc.createElement('button');
 root.className='s5-session-navigation';root.setAttribute('aria-label','Result navigation');
 button.className='s5-session-return';button.type='button';button.textContent='Return to room';
 root.append(button);host.append(root);let disposed=false;
 function sync({phase=null,visible=false,busy=false}={}){
  if(disposed)return;
  const show=phase==='result'&&visible===true;
  root.hidden=!show;button.disabled=!show||!!busy;
  root.setAttribute('aria-busy',String(show&&!!busy));
 }
 function returnToLobby(){if(!disposed&&!root.hidden&&!button.disabled)onReturnToLobby();}
 button.addEventListener('click',returnToLobby);sync();
 return Object.freeze({root,button,sync,dispose(){if(disposed)return;disposed=true;button.removeEventListener('click',returnToLobby);root.remove();}});
}
