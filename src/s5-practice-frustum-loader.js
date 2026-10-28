const POLICY='s5-diagnostic-static-part7-conservative-sphere-v1';
const RESOURCES=Object.freeze([
 Object.freeze({source:'effects/skill_hacker_centrygun_part7.scn',url:'/assets/s5runtime/practice/sentry-fx/models/skill_hacker_centrygun_part7.json',sha256:"f931d8ed29779f530dd1631df9e96e7c8e22ac98392089ad558c6f2b82085506"}),
 Object.freeze({source:'effects/skill_hacker_centrygun_part7a.scn',url:'/assets/s5runtime/practice/sentry-fx/models/skill_hacker_centrygun_part7a.json',sha256:"bd042f52f0176f15be3378575e5ec2f411a276cfe264ea85d021a30658162711"}),
]);
const sha256=bytes=>globalThis.crypto.subtle.digest('SHA-256',bytes);
function failure(code,message,resource){const error=new Error(message);error.code=code;if(resource)error.resource=resource;return error;}
function digestHex(value){
 if(typeof value==='string'&&/^[a-fA-F0-9]{64}$/.test(value))return value.toLowerCase();
 let bytes;
 if(value instanceof ArrayBuffer)bytes=new Uint8Array(value);
 else if(ArrayBuffer.isView(value))bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
 if(!bytes||bytes.byteLength!==32)throw failure('invalid-sha256-result','The SHA-256 digest port returned an invalid result');
 return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}

/** Call only from the explicit opt-in host. Importing this module performs no IO.
 * Both receipts become available together, after hashing and parsing the same
 * fetched buffers. The returned loadJson must be used by the effect managers.
 */
export async function createS5PracticeFrustumLoader({fetchImpl=globalThis.fetch,digest=sha256}={}){
 if(typeof fetchImpl!=='function'||typeof digest!=='function')throw TypeError('Fetch and SHA-256 digest ports are required');
 if(digest===sha256&&typeof globalThis.crypto?.subtle?.digest!=='function')throw failure('sha256-unavailable','SHA-256 authentication is unavailable');
 const source=digest===sha256?'S5 opt-in Practice: Web Crypto SHA-256 verified actual fetched JSON bytes before parsing':'S5 opt-in Practice: injected SHA-256 digest port verified actual fetched JSON bytes before parsing';
 const verified=await Promise.all(RESOURCES.map(async resource=>{
  const response=await fetchImpl(resource.url);
  if(!response?.ok)throw failure('practice-frustum-fetch-failed','Required Practice effect data could not be loaded',resource.source);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const hash=digestHex(await digest(bytes));
  if(hash!==resource.sha256)throw failure('practice-frustum-hash-mismatch','Practice effect data failed SHA-256 verification',resource.source);
  // A separate response.json() would read different bytes or consume the body
  // again. Decode this exact authenticated buffer instead.
  const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(parsed?.source!==resource.source)throw failure('practice-frustum-source-mismatch','Practice effect data does not match its authenticated source',resource.source);
  return {resource,parsed,receipt:Object.freeze({publishedJsonSha256:hash,source})};
 }));
 const cache=new Map(verified.map(({resource,parsed})=>[resource.url,parsed]));
 const receipts=Object.freeze(Object.fromEntries(verified.map(({resource,receipt})=>[resource.source,receipt])));
 return Object.freeze({
  staticFrustumDiagnostic:Object.freeze({enabled:false,policy:POLICY,source,receipts}),
  async loadJson(url){
   if(cache.has(url))return cache.get(url);
   const response=await fetchImpl(url);
   if(!response?.ok)throw failure('practice-json-fetch-failed','Practice JSON data could not be loaded');
   return response.json();
  },
 });
}
