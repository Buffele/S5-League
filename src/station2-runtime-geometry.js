import * as THREE from 'three';

// Exact Float32 tuples: preserve every triangle, UV seam and hard normal.
// No quantization, decimation, welding by distance, or change to draw order.
export function indexStationGeometry(source){
 const names=Object.keys(source.attributes),attributes=names.map(n=>source.attributes[n]);
 const count=source.index?.count??attributes[0].count,lookup=new Map(),indices=[],values=attributes.map(()=>[]);
 for(let i=0;i<count;i++){
  const vertex=source.index?source.index.getX(i):i,tuple=[];
  for(const a of attributes)for(let k=0;k<a.itemSize;k++)tuple.push(a.getComponent(vertex,k));
  const key=tuple.map(v=>Object.is(v,-0)?'-0':v).join(','),known=lookup.get(key);
  if(known!==undefined){indices.push(known);continue;}
  const next=lookup.size;lookup.set(key,next);indices.push(next);
  attributes.forEach((a,j)=>{for(let k=0;k<a.itemSize;k++)values[j].push(a.getComponent(vertex,k));});
 }
 const geometry=new THREE.BufferGeometry();
 attributes.forEach((a,j)=>geometry.setAttribute(names[j],new THREE.BufferAttribute(new a.array.constructor(values[j]),a.itemSize,a.normalized)));
 geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
