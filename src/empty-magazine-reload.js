/** S5 input convenience: request the weapon's existing reload on an empty-fire
 * attempt. Never refill ammunition here or alter a family's reload clock.
 * Air Gun / Cannonade explicitly refill without a separate reserve counter. */
const hasReserve=(state,{unlimitedRefill=false}={})=>state&&(state.reserve===Infinity||(Number.isFinite(state.reserve)&&state.reserve>0)||(unlimitedRefill&&!Object.hasOwn(state,'reserve')));
export function emptyMagazineReloadInput(state,input,options={}){
 const {secondaryFire=false}=options;
 if(!state||state.ammo!==0||input.reload||state.phase==='reload')return input;
 const firing=!!(input.light||input.lightPressed||(secondaryFire&&(input.heavy||input.heavyHeld||input.heavyPressed)));
 return firing&&hasReserve(state,options)?{...input,reload:true}:input;
}

/** Remember a click during fire recovery until the family can enter reload.
 * The pending request belongs to this equipped runtime, never to another gun. */
export function createEmptyMagazineReload(){
 let previous=null,pending=false;
 return {update(state,input,options={}){
  if(state!==previous){previous=state;pending=false;}
  if(!state||state.ammo!==0||state.phase==='reload'||!hasReserve(state,options))pending=false;
  const requested=emptyMagazineReloadInput(state,input,options);
  if(requested!==input)pending=true;
  return pending&&!input.reload?{...input,reload:true}:requested;
 },reset(){previous=null;pending=false;}};
}
