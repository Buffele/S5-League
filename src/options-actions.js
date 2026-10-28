// Functional S5 action row; this layout is not a reconstruction of the native XUI.
export function installOptionsTransactionActions(host,{transaction,beforeAction=()=>{},canAct=()=>true,document:doc=host.ownerDocument}={}){
 const root=doc.createElement('div'),status=doc.createElement('p'),buttons=[];
 root.className='s5-options-transaction-actions';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const title=doc.createElement('h3');title.textContent='Audio and controls';root.append(title);
 const help=doc.createElement('p');help.textContent='These actions affect audio and controls. Audio changes are previewed immediately; Cancel discards new bindings. Reset restores default volumes immediately. Visual settings apply separately and immediately.';
 function sync(){const state=transaction.snapshot();for(const {button} of buttons)button.disabled=state.phase!=='open'||!canAct();}
 for(const [action,label] of [['reset','Reset'],['apply','Apply'],['confirm','Confirm'],['cancel','Cancel']]){
  const button=doc.createElement('button');button.type='button';button.textContent=label;button.dataset.optionsAction=action;
  button.setAttribute('aria-label',`${label} audio and controls`);
  // Cancel the capture on pointerdown, before the document mousedown remap listener.
  button.addEventListener('pointerdown',()=>{if(!button.disabled&&canAct())beforeAction(action);});
  button.addEventListener('click',()=>{
   if(button.disabled||!canAct())return;beforeAction(action);
   const result=transaction[action]();
   status.textContent=!result.accepted?'Audio and controls could not be saved.':
    result.portResults?.input?.persisted===false?'Controls applied for this session; local storage is unavailable.':
    action==='cancel'?'New bindings discarded. The previewed volume remains active until settings are reopened.':
    action==='reset'?'Default values shown; volumes restored immediately.':
    'Volumes and controls saved.';sync();
  });buttons.push({button,action});root.append(button);
 }
 root.append(help,status);host.append(root);const unsubscribe=transaction.subscribe(sync);sync();
 return {sync,dispose(){unsubscribe();root.remove();}};
}
