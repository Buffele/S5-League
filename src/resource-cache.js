export function createResourceCache(load){
 const entries=new Map();
 return key=>{
  if(!entries.has(key)){
   const pending=Promise.resolve().then(()=>load(key));entries.set(key,pending);
   pending.catch(()=>{if(entries.get(key)===pending)entries.delete(key);});
  }
  return entries.get(key);
 };
}
