// Session-owned FX are shared across skins and loaded before equipment commits.
// GPU warmups mutate scene visibility, so they must not overlap each other.
export function createWeaponEffectCache({loaders,warmup,onReady=()=>{}}){
 if(!loaders||typeof warmup!=='function'||typeof onReady!=='function'||Object.values(loaders).some(load=>typeof load!=='function'))throw TypeError('Explicit weapon FX loaders and warmup required');
 const entries=new Map();let warmTail=Promise.resolve();
 return {
  supports:weapon=>Object.hasOwn(loaders,weapon),
  ensure(weapon){
   if(!Object.hasOwn(loaders,weapon))return Promise.resolve(null);
   let entry=entries.get(weapon);
   if(!entry){entry={effect:null,warmed:false,ready:false,promise:null};entries.set(weapon,entry);}
   if(entry.ready)return Promise.resolve(entry.effect);
   if(entry.promise)return entry.promise;
   entry.promise=Promise.resolve().then(async()=>{
    // A failed shader warmup keeps its constructed effect for a retry, rather
    // than attaching another copy of its pooled meshes to the live scene.
    if(!entry.effect)entry.effect=await loaders[weapon]();
    if(!entry.effect)throw Error('Weapon FX loader returned no effect');
    if(!entry.warmed){
     const task=warmTail.catch(()=>{}).then(()=>warmup(entry.effect,weapon));warmTail=task;
     await task;entry.warmed=true;
    }
    onReady(weapon,entry.effect);entry.ready=true;return entry.effect;
   }).finally(()=>{entry.promise=null;});
   return entry.promise;
  },
  snapshot(){return [...entries].map(([weapon,e])=>({weapon,loaded:!!e.effect,warmed:e.warmed,ready:e.ready,pending:!!e.promise}));},
 };
}
