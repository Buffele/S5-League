import * as THREE from 'three';

const ALLOWED=new Set([14,16,18,20,22,24,28,30,32,34,36,38,62]);

/** Low-poly S5 approximation of the placed Meshy double door, not source collision.
 * Local geometry is Y-up, centered on X=0, with its base at the bbox minimum Y.
 * Sample actual triangles clipped to the middle-height slab (not just vertices:
 * a rectangular leaf may have no original vertices in that slab).
 */
export function createAliceMeshyDoorCollision(geometry,matrixWorld){
 const position=geometry?.attributes?.position;
 if(!position||position.itemSize!==3||!matrixWorld?.isMatrix4||!matrixWorld.elements.every(Number.isFinite)||Math.abs(matrixWorld.determinant())<1e-12)throw TypeError('Finite placed Meshy door geometry and matrix required');
 const count=geometry.index?.count??position.count;if(count%3)throw Error('Meshy door triangle geometry required');
 const vertices=Array.from({length:position.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(position,i));
 if(!vertices.length||vertices.some(p=>!p.toArray().every(Number.isFinite)))throw Error('Finite Meshy door vertices required');
 const box=new THREE.Box3().setFromPoints(vertices),height=box.max.y-box.min.y,depth=box.max.z-box.min.z;
 if(height<=1e-8||depth<=1e-8||box.min.x>=0||box.max.x<=0)throw Error('Meshy door must have two X halves and nonzero height/depth');
 const low=box.min.y+.15*height,high=box.min.y+.8*height,lintelY=box.min.y+.87*height;
 const clip=(polygon,level,above)=>{
  const result=[];if(!polygon.length)return result;
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=above?a.y>=level:a.y<=level,insideB=above?b.y>=level:b.y<=level;
   if(insideA)result.push(a);if(insideA!==insideB)result.push(a.clone().lerp(b,(level-a.y)/(b.y-a.y)));
  }
  return result;
 };
 const buckets=[[],[]];
 for(let offset=0;offset<count;offset+=3){
  const triangle=[0,1,2].map(j=>vertices[geometry.index?geometry.index.getX(offset+j):offset+j]);
  const section=clip(clip(triangle,low,true),high,false);
  for(const p of section)if(p.x<0)buckets[0].push([p.x,p.z]);else if(p.x>0)buckets[1].push([p.x,p.z]);
 }
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const hull=points=>{
  const sorted=[...new Map(points.map(p=>[p.map(x=>x.toFixed(8)).join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  if(sorted.length<3)throw Error('Meshy door half has no middle-height footprint');
  const lower=[],upper=[];for(const p of sorted){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=1e-10)lower.pop();lower.push(p);}
  for(const p of sorted.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=1e-10)upper.pop();upper.push(p);}
  const result=lower.slice(0,-1).concat(upper.slice(0,-1));if(result.length<3)throw Error('Meshy door half footprint is degenerate');return result;
 };
 const triangles=[];
 function prism(footprint,bottom,top){
  const at=(p,y)=>[p[0],y,p[1]],n=footprint.length;
  // CCW in XZ: bottom points down, upper cap reversed to point up.
  for(let i=1;i<n-1;i++){triangles.push([at(footprint[0],bottom),at(footprint[i],bottom),at(footprint[i+1],bottom)]);triangles.push([at(footprint[0],top),at(footprint[i+1],top),at(footprint[i],top)]);}
  for(let i=0;i<n;i++){const a=footprint[i],b=footprint[(i+1)%n];triangles.push([at(a,bottom),at(a,top),at(b,top)],[at(a,bottom),at(b,top),at(b,bottom)]);}
 }
 for(const bucket of buckets)prism(hull(bucket),box.min.y,lintelY);
 const frameDepth=Math.max(depth*.05,1e-5);prism([[box.min.x,box.max.z-frameDepth],[box.max.x,box.max.z-frameDepth],[box.max.x,box.max.z],[box.min.x,box.max.z]],lintelY,box.max.y);
 if(triangles.length>=150)throw Error('Meshy door collision footprint exceeds low-poly budget');
 return triangles.map(face=>{
  const points=face.map(p=>new THREE.Vector3(...p).applyMatrix4(matrixWorld));
  if(new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0])).lengthSq()<1e-16)throw Error('Placed Meshy door collision face is degenerate');
  if(matrixWorld.determinant()<0)[points[1],points[2]]=[points[2],points[1]];
  return points.map(p=>p.toArray());
 });
}

/** Install before destructibles/controllers. Source meshes/buffers remain authoritative backups.
 * Edits contain explicit S5 world-space faces, never inferred openings or native parity claims.
 * Dispose downstream adapters first, then this adapter (also owned by world.dispose).
 */
export function installAliceMeshyCollision(world,edits){
 if(world.runtimeCollisionAdaptations)throw Error('Alice Meshy collision already installed');
 if(!Array.isArray(edits)||!Array.isArray(world.triangles)||!Array.isArray(world.queryTriangleRecords)||world.triangles.length!==world.queryTriangleRecords.length||typeof world.collisionWorldForActor!=='function')throw TypeError('Alice Meshy collision world contract missing');
 const original={triangles:world.triangles,records:world.queryTriangleRecords,meshes:world.meshes,factory:world.collisionWorldForActor,role:world.setActorCollisionRole,dispose:world.dispose,
  meshDescriptor:Object.getOwnPropertyDescriptor(world,'meshes'),adaptationDescriptor:Object.getOwnPropertyDescriptor(world,'runtimeCollisionAdaptations')};
 const byModel=new Map(),recordForTriangle=new Map(original.triangles.map((t,i)=>[t,original.records[i]]));
 const editCopies=[];
 // Validate the entire request before mutating world or allocating GPU resources.
 for(const edit of edits){
  const id=edit?.sourceModelIndex;
  if(!ALLOWED.has(id))throw Error('Alice Meshy collision owner not allowed: '+id);
  if(byModel.has(id))throw Error('Duplicate Alice Meshy collision owner: '+id);
  if(typeof edit.reason!=='string'||!edit.reason.trim()||!Number.isInteger(edit.visualSourceModelIndex)||!Array.isArray(edit.triangles))throw TypeError('Explicit Alice Meshy edit provenance required');
  const source=original.records.filter(r=>r.sourceModelIndex===id),mesh=original.meshes.find(m=>m.userData.sourceModelIndex===id);
  if(!source.length||!mesh||source.some(r=>r.sourceNodeIndex!==source[0].sourceNodeIndex))throw Error('Alice Meshy collision owner unresolved: '+id);
  const copied={sourceModelIndex:id,visualSourceModelIndex:edit.visualSourceModelIndex,reason:edit.reason,triangles:edit.triangles.map(face=>{
   if(!Array.isArray(face)||face.length!==3||face.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))throw TypeError('Finite world-space collision triangles required');
   const points=face.map(p=>[...p]);if(new THREE.Vector3().subVectors(new THREE.Vector3(...points[1]),new THREE.Vector3(...points[0])).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...points[2]),new THREE.Vector3(...points[0]))).lengthSq()<1e-16)throw Error('Degenerate Alice Meshy collision face');
   return points;
  })};
  const provenance=Object.freeze({schema:'alice-meshy-derived-collision-v1',sourceModelIndex:id,sourceNodeIndex:source[0].sourceNodeIndex,visualSourceModelIndex:copied.visualSourceModelIndex,reason:copied.reason,
   sourceTriangleIndices:Object.freeze(source.map(r=>r.triangleIndex)),coordinateSpace:'S5 world',nativeGeometry:false});
  const records=copied.triangles.map((face,index)=>{
   const points=face.map(p=>new THREE.Vector3(...p)),normal=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0])).normalize();
   return {source:source[0].source,sourceModelIndex:id,sourceNodeIndex:source[0].sourceNodeIndex,triangleIndex:index,sourceVertexIndices:null,
    derivedTriangleIndex:index,derivedVertexIndices:[index*3,index*3+1,index*3+2],points,normal,userData:{collisionAdaptation:provenance},collisionAdaptation:provenance};
  });
  byModel.set(id,{edit:copied,source,mesh,records,triangles:records.map(r=>r.points.map(p=>p.toArray())),provenance});editCopies.push(copied);
 }
 function replace(triangles){
  const result=[],records=[],inserted=new Set();
  for(const triangle of triangles){
   const record=recordForTriangle.get(triangle);if(!record)throw Error('Unknown source triangle in Alice role view');
   const replacement=byModel.get(record.sourceModelIndex);
   if(!replacement){result.push(triangle);records.push(record);continue;}
   if(inserted.has(record.sourceModelIndex))continue;inserted.add(record.sourceModelIndex);result.push(...replacement.triangles);records.push(...replacement.records);
  }
  return {triangles:result,records};
 }
 const adapted=replace(original.triangles),geometries=[],proxies=[];let disposed=false;
 try{
  for(const entry of byModel.values()){
   const geometry=new THREE.BufferGeometry();geometries.push(geometry);geometry.setAttribute('position',new THREE.Float32BufferAttribute(entry.edit.triangles.flat(2),3));
   geometry.setIndex(Array.from({length:entry.edit.triangles.length*3},(_,i)=>i));geometry.addGroup(0,entry.edit.triangles.length*3,0);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const proxy=new THREE.Mesh(geometry,entry.mesh.material);proxy.name=entry.mesh.name+' / Meshy derived collision camera proxy';proxy.visible=false;proxy.matrixAutoUpdate=false;proxy.updateMatrixWorld(true);
   proxy.userData={...entry.mesh.userData,nativeMatrix:entry.mesh.userData.nativeMatrix?[...entry.mesh.userData.nativeMatrix]:undefined,sourceGeometry:false,collisionAdaptation:entry.provenance};entry.proxy=proxy;proxies.push(proxy);
  }
 }catch(error){for(const geometry of geometries)geometry.dispose();throw error;}
 const cameraMeshes=original.meshes.map(mesh=>byModel.get(mesh.userData.sourceModelIndex)?.proxy??mesh),actorViews=new WeakMap();
 function collisionWorldForActor(actor){
  const sourceView=original.factory.call(world,actor);let view=actorViews.get(actor);
  if(!view){let cachedSource=null,cached=null;const current=()=>{const triangles=sourceView.triangles;if(triangles!==cachedSource){cached=replace(triangles);cachedSource=triangles;}return cached;};
   view=Object.create(sourceView);Object.defineProperties(view,{triangles:{get:()=>current().triangles},queryTriangleRecords:{get:()=>current().records}});actorViews.set(actor,view);}
  return view;
 }
 const counts={};for(const record of adapted.records)counts[record.sourceModelIndex]=(counts[record.sourceModelIndex]??0)+1;
 const metadata={schema:'alice-meshy-runtime-collision-adaptations-v1',edits:editCopies,recordsCountsByModel:counts,
  policy:'Explicit S5 derived collision adaptation; raw source geometry, source role11 and static weapon records unchanged.',cameraProxies:proxies};
 function dispose(){
  if(disposed)return;disposed=true;
  world.triangles=original.triangles;world.queryTriangleRecords=original.records;world.collisionWorldForActor=original.factory;world.setActorCollisionRole=original.role;
  if(original.meshDescriptor)Object.defineProperty(world,'meshes',original.meshDescriptor);else delete world.meshes;
  if(original.adaptationDescriptor)Object.defineProperty(world,'runtimeCollisionAdaptations',original.adaptationDescriptor);else delete world.runtimeCollisionAdaptations;
  if(world.dispose===disposeWorld)world.dispose=original.dispose;
  for(const geometry of geometries)geometry.dispose();for(const proxy of proxies)proxy.removeFromParent();
 }
 function disposeWorld(){dispose();original.dispose?.call(world);}
 world.triangles=adapted.triangles;world.queryTriangleRecords=adapted.records;world.meshes=cameraMeshes;world.collisionWorldForActor=collisionWorldForActor;
 if(typeof original.role==='function')world.setActorCollisionRole=(actor,role)=>{original.role.call(world,actor,role);return collisionWorldForActor(actor);};
 world.runtimeCollisionAdaptations=metadata;world.dispose=disposeWorld;
 return {dispose,edits:editCopies,recordsCountsByModel:counts,cameraProxies:proxies};
}
