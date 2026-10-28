// Deliberate opt-in playground: ordinary S5 controls with the TEST V2 solver.
export function installCollisionV2TestControls(controller){
 const label=document.createElement('label');label.textContent='Collisions · test';
 const select=document.createElement('select');select.id='collision-v2-test';select.setAttribute('aria-label','Collisions · test');
 select.add(new Option('V1 · classiques','off'));select.add(new Option('V2 · expérimental','on'));label.append(select);
 document.querySelector('.setup').append(label);
 const status=document.createElement('output');status.id='collision-v2-test-status';status.setAttribute('aria-live','polite');
 status.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:1000;padding:5px 12px;border-radius:6px;background:#182b39;color:#a9efff;font:600 12px sans-serif;pointer-events:none';
 document.body.append(status);
 function apply(enabled){
  try{
   controller.setCollisionV2TestEnabled(enabled);
   select.value=enabled?'on':'off';status.hidden=!enabled;status.textContent='COLLISIONS V2 · TEST';
   document.body.dataset.collisionMode=enabled?'v2-test':'v1';
   const url=new URL(location.href);if(enabled)url.searchParams.set('collisionV2','1');else url.searchParams.delete('collisionV2');history.replaceState(null,'',url);
  }catch(error){
   select.value=controller.collisionV2TestEnabled?'on':'off';status.hidden=false;status.textContent='V2 indisponible : '+error.message;
  }
 }
 select.onchange=()=>apply(select.value==='on');
 apply(new URL(location.href).searchParams.get('collisionV2')==='1');
 return {select,status};
}
