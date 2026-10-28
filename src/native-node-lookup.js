// Base node virtual+b4 (1156010): self first, then each child virtual+b4.
// 4d1130/4cae80 compare the stored string's full bytes with strlen(query).
// Explicit byte arrays preserve the source encoding; ASCII is unambiguous.
function bytes(value){
 if(typeof value==='string'){
  if(/[^\x00-\x7f]/.test(value))throw new TypeError('Native encoded name bytes required for non-ASCII');
  return Uint8Array.from(value,c=>c.charCodeAt(0));
 }
 if(value instanceof Uint8Array)return value;
 throw new TypeError('Native name bytes or ASCII string required');
}
export function nativeNodeNameEquals(storedName,query){
 const stored=bytes(storedName),requested=bytes(query);
 const zero=requested.indexOf(0),length=zero<0?requested.length:zero;
 if(stored.length!==length)return false;
 for(let i=0;i<length;i++)if(stored[i]!==requested[i])return false;
 return true;
}
export function nativeFindNamedNode(node,query,{readName,readChildren,findChild}={}){
 bytes(query);
 if(typeof readName!=='function')throw new TypeError('Native node name getter required');
 const active=new Set();
 function search(current){
  if(current===undefined||current===null)throw new TypeError('Live native node required');
  if(active.has(current))throw new Error('Cyclic native child hierarchy');
  if(nativeNodeNameEquals(readName(current),query))return current;
  if(typeof readChildren!=='function')throw new TypeError('Ordered native children required');
  const children=readChildren(current);
  if(!Array.isArray(children))throw new TypeError('Ordered native children required');
  active.add(current);
  try{
   for(const child of children){
    if(child===null||child===undefined)throw new TypeError('Live native child required');
    // Supply findChild for subclasses that override slot+b4. Otherwise the
    // caller chooses the verified base implementation for every child.
    const result=findChild?findChild(child,query):search(child);
    if(result===undefined)throw new TypeError('Unresolved child virtual+b4 result');
    if(result!==null)return result;
   }
   return null;
  }finally{active.delete(current);}
 }
 return search(node);
}
