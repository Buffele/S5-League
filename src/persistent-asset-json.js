// Parsed source data survives a page reload. Validate with the server before
// reuse: changing a native asset must never silently keep an older rig/weapon.
export function createValidatedJsonLoader({fetchAsset=(...args)=>fetch(...args),store}={}){
 const stats={hits:0,misses:0,updated:0,stored:0,storageErrors:0};
 const load=async url=>{
  let cached=null;try{cached=await store?.get(url);}catch{}
  const headers={};if(cached?.etag)headers['If-None-Match']=cached.etag;
  else if(cached?.modified)headers['If-Modified-Since']=cached.modified;
  const response=await fetchAsset(url,cached?{headers,cache:'no-store'}:undefined);
  if(response.status===304&&cached){stats.hits++;return cached.data;}
  if(!response.ok)throw Error(`Ressource absente : ${url}`);
  const data=await response.json(),etag=response.headers?.get('etag'),modified=response.headers?.get('last-modified');
  if(cached)stats.updated++;else stats.misses++;
  // A missing validator means no persistent entry: don't reuse an unversioned
  // development asset. Storage/quota failures never prevent ordinary loading.
  if(etag||modified)Promise.resolve().then(()=>store?.put(url,{data,etag,modified,accessed:Date.now()})).then(()=>{stats.stored++;}).catch(()=>{stats.storageErrors++;});
  return data;
 };load.report=()=>({...stats});return load;
}

function browserJsonStore(){
 let opening;
 const database=()=>opening??=new Promise(resolve=>{
  if(!globalThis.indexedDB){resolve(null);return;}
  const timeout=setTimeout(()=>resolve(null),1000),request=indexedDB.open('s5-source-assets',1);
  request.onupgradeneeded=()=>{const store=request.result.createObjectStore('json');store.createIndex('accessed','accessed');};
  request.onsuccess=()=>{clearTimeout(timeout);resolve(request.result);};request.onerror=request.onblocked=()=>{clearTimeout(timeout);resolve(null);};
 });
 return {
  async get(key){const db=await database();if(!db)return null;return new Promise((resolve,reject)=>{const request=db.transaction('json').objectStore('json').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});},
  async put(key,value){const db=await database();if(!db)return;return new Promise((resolve,reject)=>{
   const tx=db.transaction('json','readwrite'),store=tx.objectStore('json');store.put(value,key);
   const count=store.count();count.onsuccess=()=>{let excess=count.result-512;if(excess<=0)return;const cursor=store.index('accessed').openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(!item||excess--<=0)return;item.delete();item.continue();};};
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });},
 };
}
export const loadValidatedAssetJson=createValidatedJsonLoader({store:browserJsonStore()});
