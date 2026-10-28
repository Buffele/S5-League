import {BackSide,Box3,FrontSide,Matrix4,Mesh,Ray,Triangle,Vector3} from 'three';

// Camera-only acceleration of the same render triangles, draw ranges and face
// sides queried by Mesh.raycast. No proxy collider, geometry edit or reduced
// ceiling/near-plane coverage. Animated/custom raycasts keep Three's path.
export class CameraTriangleIndex{
 constructor(){this.cache=new WeakMap();this.inverse=new Matrix4();this.local=new Ray();this.a=new Vector3();this.b=new Vector3();this.c=new Vector3();this.point=new Vector3();this.boxPoint=new Vector3();this.end=new Vector3();}
 entry(mesh){
  const geometry=mesh.geometry,position=geometry?.attributes.position,index=geometry?.index;
  if(!position||mesh.isSkinnedMesh||mesh.morphTargetInfluences?.length||mesh.raycast!==Mesh.prototype.raycast||mesh.getVertexPosition!==Mesh.prototype.getVertexPosition)return null;
  const groups=Array.isArray(mesh.material)?geometry.groups:null,range=geometry.drawRange,count=index?.count??position.count;
  if(range.start%3||groups?.some(group=>group.start%3))return null;
  const signature=JSON.stringify([range.start,range.count,groups?.map(group=>[group.start,group.count,group.materialIndex])]);
  let saved=this.cache.get(geometry);
  if(saved?.position===position&&saved.index===index&&saved.positionVersion===position.version&&saved.indexVersion===index?.version&&saved.signature===signature)return saved;
  const records=[];
  for(const group of groups??[{start:0,count,materialIndex:0}]){
   const start=Math.max(0,group.start,range.start),end=Math.min(count,group.start+group.count,range.start+range.count);
   for(let offset=start;offset<end;offset+=3){
    if(offset+2>=count)return null;
    const a=index?index.getX(offset):offset,b=index?index.getX(offset+1):offset+1,c=index?index.getX(offset+2):offset+2;
    this.a.fromBufferAttribute(position,a);this.b.fromBufferAttribute(position,b);this.c.fromBufferAttribute(position,c);
    records.push({offset,a,b,c,materialIndex:group.materialIndex,order:records.length,x:(this.a.x+this.b.x+this.c.x)/3,y:(this.a.y+this.b.y+this.c.y)/3,z:(this.a.z+this.b.z+this.c.z)/3});
   }
  }
  const build=rows=>{
   const box=new Box3();for(const record of rows)for(const key of ['a','b','c'])box.expandByPoint(this.a.fromBufferAttribute(position,record[key]));
   if(rows.length<=16)return {box,rows};
   const extent=box.getSize(this.a),axis=extent.x>=extent.y&&extent.x>=extent.z?'x':extent.y>=extent.z?'y':'z';rows.sort((a,b)=>a[axis]-b[axis]);const mid=rows.length>>1;
   return {box,left:build(rows.slice(0,mid)),right:build(rows.slice(mid))};
  };
  saved={position,index,positionVersion:position.version,indexVersion:index?.version,signature,tree:build(records)};this.cache.set(geometry,saved);return saved;
 }
 raycast(mesh,raycaster,hits){
  if(!mesh.layers.test(raycaster.layers))return;
  const entry=this.entry(mesh);if(!entry){mesh.raycast(raycaster,hits);return;}
  this.inverse.copy(mesh.matrixWorld).invert();this.local.copy(raycaster.ray).applyMatrix4(this.inverse);
  this.end.copy(raycaster.ray.direction).multiplyScalar(raycaster.far).add(raycaster.ray.origin).applyMatrix4(this.inverse);
  const far=this.local.origin.distanceToSquared(this.end),found=[];
  const visit=node=>{
   if(!node.box.containsPoint(this.local.origin)&&(!this.local.intersectBox(node.box,this.boxPoint)||this.boxPoint.distanceToSquared(this.local.origin)>far+1e-8))return;
   if(!node.rows){visit(node.left);visit(node.right);return;}
   for(const record of node.rows){
    const material=Array.isArray(mesh.material)?mesh.material[record.materialIndex]:mesh.material;if(!material)continue;
    this.a.fromBufferAttribute(entry.position,record.a);this.b.fromBufferAttribute(entry.position,record.b);this.c.fromBufferAttribute(entry.position,record.c);
    const point=material.side===BackSide?this.local.intersectTriangle(this.c,this.b,this.a,true,this.point):this.local.intersectTriangle(this.a,this.b,this.c,material.side===FrontSide,this.point);
    if(!point)continue;const worldPoint=point.clone().applyMatrix4(mesh.matrixWorld),distance=worldPoint.distanceTo(raycaster.ray.origin);
    if(distance<raycaster.near||distance>raycaster.far)continue;
    found.push({order:record.order,hit:{distance,point:worldPoint,object:mesh,faceIndex:Math.floor(record.offset/3),face:{a:record.a,b:record.b,c:record.c,normal:Triangle.getNormal(this.a,this.b,this.c,new Vector3()),materialIndex:record.materialIndex}}});
   }
  };
  visit(entry.tree);found.sort((a,b)=>a.order-b.order);for(const result of found)hits.push(result.hit);
 }
 intersectObjects(raycaster,meshes){const hits=[];for(const mesh of meshes)this.raycast(mesh,raycaster,hits);return hits.sort((a,b)=>a.distance-b.distance);}
}
