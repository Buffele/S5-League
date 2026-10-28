// A session owns constructed bundles; avatar JSON and textures remain in their
// existing shared caches. Failed loads may be retried, concurrent loads coalesce.
export function createWeaponResourceCache({load,release=()=>{},scope={}}={}){
 if(typeof load!=='function')throw new TypeError('A weapon loader is required');
 const entries=new Map();let disposed=false,hits=0,loads=0;
 const owner=JSON.stringify(scope),key=(weapon,skin)=>JSON.stringify([owner,weapon,skin]);
 return {
  peek(weapon,skin='classic'){const value=entries.get(key(weapon,skin))?.value??null;if(value)hits++;return value;},
  values(){return [...entries.values()].map(entry=>entry.value).filter(Boolean).values();},
  seed(weapon,skin,value){
   if(disposed)throw new Error('Weapon resources disposed');
   const id=key(weapon,skin);if(entries.has(id))throw new Error('Weapon resources already cached');
   loads++;entries.set(id,{weapon,skin,value,promise:Promise.resolve(value)});
  },
  get(weapon,skin='classic'){
   if(disposed)return Promise.reject(new Error('Weapon resources disposed'));
   const id=key(weapon,skin);
   if(entries.has(id)){hits++;return entries.get(id).promise;}
   loads++;const entry={weapon,skin,value:null,promise:null};
   entry.promise=Promise.resolve().then(()=>load(weapon,skin)).then(value=>{
    if(disposed){release(value);throw new Error('Weapon resources disposed');}
    entry.value=value;return value;
   }).catch(error=>{if(entries.get(id)===entry)entries.delete(id);throw error;});
   entries.set(id,entry);return entry.promise;
  },
  report(){return {scope:JSON.parse(owner),disposed,loads,hits,entries:[...entries.values()].map(({weapon,skin,value})=>({weapon,skin,ready:value!==null}))};},
  dispose(){if(disposed)return;disposed=true;for(const entry of entries.values())if(entry.value)release(entry.value);entries.clear();},
 };
}
