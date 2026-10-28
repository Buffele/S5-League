// Preload policy only: availability and runtime readiness keep their own gates.
export function equipmentPreloadPlan(catalog,enabledWeapons){
 const enabled=new Set(enabledWeapons);
 return Object.entries(catalog).filter(([weapon,choice])=>enabled.has(weapon)&&choice.disabled!==true)
  .flatMap(([weapon,choice])=>Object.entries(choice.skins).map(([skin,label])=>({kind:'weapon',weapon,skin,label:choice.name+' · '+label})));
}
export const CHARACTER_PRELOAD_PLAN=Object.freeze([
 ...['male','female'].flatMap(sex=>[
  ...['01','02'].map(outfit=>({kind:'character',appearance:'s5runtime',sex,outfit,label:`Classic · ${sex} · ${outfit}`})),
  ...['reference','anime','meshy'].map(appearance=>({kind:'character',appearance,sex,outfit:'01',label:`${appearance==='meshy'?'Modernized':appearance} · ${sex}`})),
 ]),{kind:'character',appearance:'urban',sex:'male',outfit:'01',label:'Urban · male'},
].map(Object.freeze));

/** One constructed character/GPU warmup at a time; yield between units so the
 * loading view paints. Optional failures remain retryable in the demand cache. */
export async function preloadEquipment({plan,loadWeapon,loadCharacter,onProgress=()=>{},beforeItem=null,yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0)),signal}={}){
 const result={total:plan.length,completed:0,ready:0,failures:[]};
 onProgress({...result,detail:'Preparing equipment library'});
 for(const item of plan){
  if(beforeItem)await beforeItem(item);
  if(signal?.aborted)throw new DOMException('Equipment preparation cancelled','AbortError');
  onProgress({...result,detail:item.label});
  try{await(item.kind==='weapon'?loadWeapon(item.weapon,item.skin):loadCharacter(item));result.ready++;}
  catch(error){if(signal?.aborted)throw error;result.failures.push({...item,error:String(error?.message??error)});}
  result.completed++;onProgress({...result,detail:item.label});await yieldControl();
 }
 return result;
}
