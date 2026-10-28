import {BufferAttribute,Euler,Mesh,Vector3} from 'three';
const same=(a,b)=>a===b&&(a!==0||1/a===1/b)||Number.isNaN(a)&&Number.isNaN(b);
const components=v=>[v.x,v.y,v.z];
const cloneHit=hit=>{
 if(!hit)return null;
 const copy={...hit,face:{...hit.face,normal:hit.face.normal.clone()}};
 for(const key of ['point','normal','uv','uv1','barycoord'])if(hit[key])copy[key]=hit[key].clone();
 return copy;
};
// Only the camera adapter's synchronous read phases use this memo. Ordinary
// standalone raycast calls still run the original query. Each phase compares
// every source byte (including edits without needsUpdate) and current query
// state. It never treats a version number as proof of immutable geometry.
class ExactCameraCache{
 constructor(){this.state=null;this.rows=[];this.views=new WeakMap();this.hits=0;this.misses=0;this.invalidations=0;this.fallbacks=0;}
 audit(query){
  const metadata=[query.meshes,query.meshes?.length,query.ray.near,query.ray.layers.mask],arrays=[];
  for(const {mesh,box} of query.entries){
   const geometry=mesh.geometry,position=geometry?.attributes.position,index=geometry?.index;
   if(!position||mesh.isSkinnedMesh||mesh.morphTargetInfluences?.length||mesh.raycast!==Mesh.prototype.raycast||mesh.getVertexPosition!==Mesh.prototype.getVertexPosition)return null;
   if(!dataProperties(mesh,['geometry','material','visible'])||!dataProperties(geometry.attributes,['position'])||!dataProperties(geometry.drawRange,['start','count']))return null;
   // Non-aligned/custom geometry delegates to Mesh.raycast in the index. It
   // may read extra attributes or callbacks, so retain that path every time.
   const count=index?.count??position.count;
   if(!Number.isInteger(count)||count%3||geometry.drawRange.start%3||(Array.isArray(mesh.material)&&geometry.groups.some(group=>group.start%3)))return null;
   metadata.push(mesh,geometry,position,index,mesh.visible,mesh.layers.mask,mesh.raycast,mesh.getVertexPosition,...mesh.matrixWorld.elements,geometry.drawRange.start,geometry.drawRange.count);
   if(box)metadata.push(...components(box.min),...components(box.max));else metadata.push(null);
   for(const attr of [position,index]){
    if(!attr){metadata.push(null);continue;}
    if(attr.isInterleavedBufferAttribute||attr.getX!==BufferAttribute.prototype.getX||attr.getY!==BufferAttribute.prototype.getY||attr.getZ!==BufferAttribute.prototype.getZ||!dataProperties(attr,['array','itemSize','count','normalized','version'])||(typeof SharedArrayBuffer!=='undefined'&&attr.array.buffer instanceof SharedArrayBuffer))return null;
    metadata.push(attr.array,attr.array.buffer,attr.array.byteOffset,attr.array.length,attr.itemSize,attr.count,attr.normalized,attr.version,attr.getX,attr.getY,attr.getZ);
    let views=this.views.get(attr.array);
    if(!views||views.bytes!==attr.array.byteLength){const bytes=attr.array.byteLength,wide=attr.array.byteOffset%4===0?Math.floor(bytes/4):0;views={bytes,wide:new Uint32Array(attr.array.buffer,attr.array.byteOffset,wide),tail:new Uint8Array(attr.array.buffer,attr.array.byteOffset+wide*4,bytes-wide*4)};this.views.set(attr.array,views);}
    arrays.push(views.wide,views.tail);
   }
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];metadata.push(mesh.material,materials.length);
   for(const material of materials){if(material&&!dataProperties(material,['side','visible']))return null;metadata.push(material,material?.side,material?.visible);}
   if(Array.isArray(mesh.material)){
    metadata.push(geometry.groups.length);for(const group of geometry.groups){if(!dataProperties(group,['start','count','materialIndex']))return null;metadata.push(group.start,group.count,group.materialIndex);}
   }
  }
  let unchanged=this.state&&metadata.length===this.state.metadata.length&&arrays.length===this.state.arrays.length;
  if(unchanged)for(let i=0;i<metadata.length;i++)if(!same(metadata[i],this.state.metadata[i])){unchanged=false;break;}
  if(unchanged)for(let a=0;a<arrays.length;a++){
   const current=arrays[a],saved=this.state.arrays[a];if(current.length!==saved.length){unchanged=false;break;}
   for(let i=0;i<current.length;i++)if(current[i]!==saved[i]){unchanged=false;break;}
   if(!unchanged)break;
  }
  if(!unchanged){this.invalidations++;this.rows.length=0;this.state={metadata,arrays:arrays.map(a=>a.slice())};}
  return this.state;
 }
 run(query,original,origin,delta,stable=false){
  if(!(stable?this.state:this.audit(query))){this.fallbacks++;this.rows.length=0;this.state=null;return original.call(query,origin,delta);}
  const key=[...components(origin),...components(delta)];
  for(const row of this.rows)if(key.every((v,i)=>same(v,row.key[i]))){this.hits++;return cloneHit(row.hit);}
  this.misses++;const hit=original.call(query,origin,delta);if(this.rows.length>=64)this.rows.shift();this.rows.push({key,hit:cloneHit(hit)});return hit;
 }
}
const dataProperties=(object,keys)=>keys.every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(object,key)??{},'value'));
const caches=new WeakMap();
export function configureCameraQueryCache(query,enabled){caches.set(query,{cache:new ExactCameraCache(),enabled,active:false,admitted:false,lastInputs:null});}
export function runCameraQueryReadPhase(query,read,{camera,player,inputs}){
 const owner=caches.get(query);
 if(!owner?.enabled||owner.active||!dataProperties(player,['x','y','z'])||!dataProperties(camera,['near','fov','zoom','aspect'])||camera.position.copy!==Vector3.prototype.copy||camera.rotation.set!==Euler.prototype.set)return read();
 // A new pose uses the original query without scanning geometry for a memo
 // that is unlikely to hit. Repeated fixed substeps of one render pose can
 // enter the audited phase. This changes acceleration only, never cadence.
 const current=[camera,player.x,player.y,player.z,camera.near,camera.fov,camera.zoom,camera.aspect,...inputs];
 const repeated=owner.lastInputs?.length===current.length&&current.every((value,index)=>same(value,owner.lastInputs[index]));
 owner.lastInputs=current;if(!repeated)return read();
 owner.active=true;
 try{refreshCameraQueryReadPhase(query);return read();}finally{owner.active=false;owner.admitted=false;}
}
// Euler's onChange callback runs at the camera pose write. Begin a fresh read
// phase after it, so a callback can edit obstacles before the ceiling probes.
export function refreshCameraQueryReadPhase(query){
 const owner=caches.get(query);if(!owner?.active)return;
 owner.admitted=!!owner.cache.audit(query);
 if(!owner.admitted){owner.cache.rows.length=0;owner.cache.state=null;}
}
export function memoCameraRaycast(query,read,origin,delta){
 const owner=caches.get(query);
 if(!owner?.active||!owner.admitted){if(owner?.active)owner.cache.fallbacks++;return read.call(query,origin,delta);}
 return owner.cache.run(query,read,origin,delta,true);
}
export function readCameraQueryCache(query){
 const owner=caches.get(query),cache=owner?.cache;
 return {enabled:!!owner?.enabled,hits:cache?.hits??0,misses:cache?.misses??0,invalidations:cache?.invalidations??0,fallbacks:cache?.fallbacks??0,retained:cache?.rows.length??0,capacity:64};
}
