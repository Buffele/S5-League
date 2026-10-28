const frames=new WeakMap();

// Explicit opt-in for the loaded map's JSON source only. Live actors, gates,
// descriptors, readers and the world itself remain mutable/current owners.
// A public-looking token cannot impersonate this private world/bundle receipt.
export function sealConquestStaticSource(world){
 const previous=frames.get(world);if(previous&&previous.bundle===world.sourceData)return previous.token;
 const bundle=world?.sourceData;
 if(world?.nativeMapId!==46||bundle?.schema!=='conquest-native-collision-source-v1'||!Array.isArray(bundle.scenes)||bundle.scenes.length!==4)throw Error('Current loaded map46 JSON source bundle required for sealing');
 const objects=[],seen=new Set(),pending=[bundle];
 while(pending.length){
  const value=pending.pop();
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))continue;
  if(typeof value!=='object')throw Error('Only plain finite JSON source values may be sealed');
  if(seen.has(value))continue;seen.add(value);
  if(![Object.prototype,Array.prototype,null].includes(Object.getPrototypeOf(value)))throw Error('Only plain JSON source objects and arrays may be sealed');
  objects.push(value);
  for(const key of Reflect.ownKeys(value)){
   const property=Object.getOwnPropertyDescriptor(value,key);
   if(typeof key!=='string'||!Object.hasOwn(property,'value'))throw Error('Source accessors and symbols cannot certify immutable JSON');
   pending.push(property.value);
  }
 }
 // Validate the entire graph before changing any property descriptors.
 for(let i=objects.length-1;i>=0;i--)Object.freeze(objects[i]);
 const token=Object.freeze({kind:'conquest-sealed-static-source',nativeReady:false});frames.set(world,{bundle,token});return token;
}

export function hasSealedConquestStaticSource(world,bundle){
 const frame=frames.get(world);return !!frame&&frame.bundle===bundle&&world.sourceData===bundle&&world.nativeMapId===46;
}
