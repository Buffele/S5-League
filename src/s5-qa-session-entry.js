const mounted=new WeakMap();
// QA may arrange a scenario before entry. Only the supplied real Play callback
// starts a session; this control never writes gameplay flags or result state.
export function installS5QaSessionEntry(host,{startSession=null,document:doc=host?.ownerDocument??globalThis.document}={}){
 if(!host||!doc)throw TypeError('QA host and document required');
 if(mounted.has(host))return mounted.get(host);
 const root=doc.createElement('section'),button=doc.createElement('button'),status=doc.createElement('p');
 root.className='s5-qa-session-entry';root.dataset.state=typeof startSession==='function'?'ready':'unavailable';
 button.type='button';button.textContent='Enter match';button.disabled=typeof startSession!=='function';
 button.style.cssText='display:block;box-sizing:border-box;width:100%;min-width:0;margin-top:6px;padding:8px;border:1px solid #80cfd6;border-radius:5px;background:#24495c;color:#effbff;font:600 11px system-ui;cursor:pointer';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='margin:6px 0;color:#c5dce5;font:10px/1.4 system-ui';
 status.textContent=button.disabled?'Real Play callback unavailable.':'QA arrangements are test fixtures. This button uses the real Play action.';
 root.append(button,status);host.append(root);let pending=false,disposed=false;
 async function enter(){
  if(disposed||pending||typeof startSession!=='function')return;
  pending=true;button.disabled=true;button.textContent='Entering match…';root.dataset.state='pending';status.textContent='Waiting for the real Play action…';
  try{
   const result=await startSession();if(disposed)return;
   if(result===false||result?.accepted===false)throw Error(result?.error?.message??result?.error??result?.reason??'Play action was rejected.');
   // main already catches audio failures. Read its actual rendered route and
   // status rather than interpreting a resolved void handler as successful entry.
   if(doc.getElementById?.('welcome')?.dataset.entryRoute==='error')throw Error(doc.getElementById?.('load-status')?.textContent||'Play action failed.');
   root.dataset.state='completed';status.textContent='Play action completed. QA arrangements remain test fixtures.';
  }catch(error){if(!disposed){root.dataset.state='error';status.textContent='Unable to enter match: '+(error instanceof Error?error.message:String(error));}}
  finally{pending=false;if(!disposed){button.disabled=false;button.textContent='Enter match';}}
 }
 button.addEventListener('click',enter);
 const view=Object.freeze({root,button,status,dispose(){if(disposed)return;disposed=true;button.removeEventListener('click',enter);root.remove();mounted.delete(host);}});
 mounted.set(host,view);return view;
}
