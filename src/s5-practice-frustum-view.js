/** Optional diagnostic controls. The host opts in and calls sync on session changes. */
export function installPracticeFrustumView({document:doc=globalThis.document,getEffects=()=>null,isActive=()=>false,onError=()=>{}}={}){
 if(!doc?.body||typeof doc.createElement!=='function')throw new TypeError('An actual document is required');
 let disposed=false,currentEffects=null,failure='';const bindings=[];
 const make=(tag,id)=>{const node=doc.createElement(tag);node.id=id;return node;};
 const toggle=make('button','practice-frustum-toggle'),read=make('button','practice-frustum-read'),output=make('output','practice-frustum-readout');
 const common={position:'fixed',right:'16px',zIndex:'61',boxSizing:'border-box',maxWidth:'calc(100vw - 32px)',margin:'0',padding:'10px 12px',border:'1px solid #59788c',borderRadius:'3px',background:'#102435f5',color:'#e0edf4',font:'12px/1.4 system-ui, sans-serif',textAlign:'left'};
 for(const button of [toggle,read]){button.type='button';Object.assign(button.style,common,{minHeight:'44px',cursor:'pointer'});}
 Object.assign(toggle.style,{bottom:'16px'});Object.assign(read.style,{bottom:'64px'});read.textContent='Read FX culling state';
 Object.assign(output.style,common,{bottom:'112px',width:'min(380px, calc(100vw - 32px))',maxHeight:'240px',overflow:'auto',fontSize:'11px',whiteSpace:'pre-wrap'});output.setAttribute('role','status');output.setAttribute('aria-live','polite');
 doc.body.append(toggle,read,output);
 const bind=(node,type,handler)=>{node.addEventListener(type,handler);bindings.push([node,type,handler]);};
 const stop=event=>event.stopPropagation();
 for(const node of [toggle,read,output])bind(node,'pointerdown',stop);
 bind(output,'click',stop);
 function fail(error){const message=String(error?.message??error),changed=message!==failure;failure=message;if(changed)try{onError(error);}catch{}}
 function state(){
  const effects=getEffects();if(effects!==currentEffects){currentEffects=effects;failure='';}
  if(!effects||typeof effects.staticFrustumReport!=='function'||typeof effects.setStaticFrustum!=='function')return {effects:null,report:null,active:false};
  const report=effects.staticFrustumReport();if(typeof report?.requestedEnabled!=='boolean')throw new TypeError('An authoritative static FX culling report is required');
  return {effects,report,active:isActive()===true&&report.disposed!==true};
 }
 function sync(){
  if(disposed)return;
  try{
   const {effects,report,active}=state();toggle.disabled=read.disabled=!active;
   toggle.textContent=report?`Static FX culling ${report.requestedEnabled?'ON':'OFF'}`:'Static FX culling unavailable';toggle.setAttribute('aria-pressed',String(report?.requestedEnabled===true));
   output.dataset.observation=JSON.stringify(report);output.dataset.error=failure;
   if(!effects){output.textContent='No active Practice effects.';return;}
   const templates=Array.isArray(report.templates)?report.templates:[],instances=Array.isArray(report.instances)?report.instances:[],rows=[...templates,...instances],enabled=rows.filter(row=>row.enabled===true).length;
   const sum=key=>rows.reduce((total,row)=>total+(Number.isFinite(row[key])?row[key]:0),0);
   const summary=`Templates: ${templates.length} · Instances: ${instances.length}\nEnabled rows: ${enabled} / ${rows.length} · Active meshes: ${sum('active')} / ${sum('qualified')}`;
   output.textContent=(failure?'Error: '+failure+'\n':!active?'Practice culling controls inactive.\n':'')+summary;
  }catch(error){fail(error);toggle.disabled=read.disabled=true;toggle.textContent='Static FX culling unavailable';output.dataset.observation='null';output.dataset.error=failure;output.textContent='Error: '+failure;}
 }
 bind(toggle,'click',event=>{
  stop(event);if(disposed)return;
  try{
   const {effects,report,active}=state();if(!active){sync();return;}
   failure='';const result=effects.setStaticFrustum(!report.requestedEnabled);
   if(result?.accepted!==true)fail(new Error(result?.transaction?.error||'Static FX culling change was not accepted.'));
  }catch(error){fail(error);}
  sync();
 });
 bind(read,'click',event=>{stop(event);if(disposed)return;failure='';sync();});
 sync();
 return {sync,dispose(){if(disposed)return;disposed=true;toggle.disabled=read.disabled=true;for(const [node,type,handler] of bindings)node.removeEventListener(type,handler);toggle.remove();read.remove();output.remove();}};
}
