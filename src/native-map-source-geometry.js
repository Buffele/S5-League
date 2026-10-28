import * as THREE from 'three';
import {TUNING} from './movement-profile.js';
import {COLLISION_SETTINGS} from './collision.js';
import {nativeSourceCollisionMetadata} from './native-collision-registration.js';

// Source-preserving static authoring helpers, shared by the individually
// qualified map loaders. These do not select native runtime masks or poses.
export function nativeMapParentIndices(source){
 const nodes=source.nodes,children=new Map([[-1,[]]]),parents=[];
 const find=name=>{
  if(source.root.name===name)return -1;
  const stack=[...children.get(-1)].reverse();
  while(stack.length){const index=stack.pop();if(nodes[index].name===name)return index;stack.push(...children.get(index).slice().reverse());}
  return -1;
 };
 for(const [index,node] of nodes.entries()){
  const parent=find(node.parent);parents.push(parent);children.get(parent).push(index);children.set(index,[]);
 }
 return parents;
}

export function sourceGeometry(model){
 const indices=model.indicesUnsigned??model.indices.map(index=>index&0xffff),vertices=model.vertices;
 if(vertices.length%3||indices.length%3||model.normals.length!==vertices.length||
  !vertices.every(Number.isFinite)||!model.normals.every(Number.isFinite)||
  !indices.every(index=>Number.isInteger(index)&&index>=0&&index<vertices.length/3))throw Error('Invalid native source geometry: '+model.name);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(model.normals,3));geometry.setIndex(indices);
 for(const [field,name] of [['uv','uv'],['uv2','uv1']])if(model[field]?.length===vertices.length/3*2)geometry.setAttribute(name,new THREE.Float32BufferAttribute(model[field],2));
 for(const [index,slot] of model.textures.entries())geometry.addGroup(slot.start*3,slot.count*3,index);
 return geometry;
}

export function meshTriangles(meshes,source,{nativeCollisionOwner=null}={}){
 const triangles=[],records=[];
 for(const mesh of meshes){
  const nativeCollision=nativeSourceCollisionMetadata(mesh.name,nativeCollisionOwner);
  const positions=mesh.geometry.attributes.position,indices=mesh.geometry.index;
  for(let offset=0;offset<indices.count;offset+=3){
   const points=[0,1,2].map(corner=>new THREE.Vector3().fromBufferAttribute(positions,indices.getX(offset+corner)).applyMatrix4(mesh.matrixWorld));
   triangles.push(points.map(point=>point.toArray()));
   records.push({source,sourceModelIndex:mesh.userData.sourceModelIndex,sourceNodeIndex:mesh.userData.sourceNodeIndex,nativeCollision,
    triangleIndex:offset/3,sourceVertexIndices:[0,1,2].map(corner=>indices.getX(offset+corner)),
    nativeSourceVertexIndices:Object.freeze([0,1,2].map(corner=>indices.getX(offset+corner))),points,
    normal:new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0])).normalize()});
  }
 }
 return {triangles,records};
}

export function verticalFloor(point,records){
 let hit=null;
 for(const record of records){
  if(record.normal.y<COLLISION_SETTINGS.groundNormalY)continue;
  const [a,b,c]=record.points,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(Math.abs(den)<1e-12)continue;
  const u=((b.z-c.z)*(point.x-c.x)+(c.x-b.x)*(point.z-c.z))/den;
  const v=((c.z-a.z)*(point.x-c.x)+(a.x-c.x)*(point.z-c.z))/den,w=1-u-v;
  if(Math.min(u,v,w)<-1e-8)continue;
  const y=u*a.y+v*b.y+w*c.y;
  if(y>point.y+1e-7||hit&&y<=hit.point.y)continue;
  hit={point:{x:point.x,y,z:point.z},record,barycentric:[u,v,w]};
 }
 return hit;
}

const clamp=value=>Math.max(0,Math.min(1,value));
function segmentDistanceSq(p,q,a,b){
 const d1=q.clone().sub(p),d2=b.clone().sub(a),r=p.clone().sub(a);
 const aa=d1.dot(d1),ee=d2.dot(d2),f=d2.dot(r);let s=0,t=0;
 if(aa<=1e-16&&ee<=1e-16)return p.distanceToSquared(a);
 if(aa<=1e-16)t=clamp(f/ee);
 else{
  const c=d1.dot(r);
  if(ee<=1e-16)s=clamp(-c/aa);
  else{
   const bb=d1.dot(d2),den=aa*ee-bb*bb;s=Math.abs(den)>1e-16?clamp((bb*f-c*ee)/den):0;t=(bb*s+f)/ee;
   if(t<0){t=0;s=clamp(-c/aa);}else if(t>1){t=1;s=clamp((bb-c)/aa);}
  }
 }
 return p.clone().addScaledVector(d1,s).distanceToSquared(a.clone().addScaledVector(d2,t));
}

function segmentTriangleDistanceSq(start,end,triangle){
 const delta=end.clone().sub(start),length=delta.length(),intersection=new THREE.Vector3();
 if(length>0&&new THREE.Ray(start,delta.clone().normalize()).intersectTriangle(triangle.a,triangle.b,triangle.c,false,intersection)&&intersection.distanceTo(start)<=length)return 0;
 let distance=Math.min(triangle.closestPointToPoint(start,new THREE.Vector3()).distanceToSquared(start),triangle.closestPointToPoint(end,new THREE.Vector3()).distanceToSquared(end));
 for(const [a,b] of [[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]])distance=Math.min(distance,segmentDistanceSq(start,end,a,b));
 return distance;
}

export function previewClearance(foot,records){
 const radii=new THREE.Vector3(TUNING.radius,TUNING.height/2,TUNING.radius),center=new THREE.Vector3(foot.x,foot.y+radii.y,foot.z),unitCenter=center.clone().divide(radii);
 const start=new THREE.Vector3(foot.x,foot.y+TUNING.radius,foot.z),end=new THREE.Vector3(foot.x,foot.y+TUNING.height-TUNING.radius,foot.z);
 let ellipsoidDistance=Infinity,capsuleDistance=Infinity;
 for(const record of records){
  const [a,b,c]=record.points;
  const scaled=new THREE.Triangle(a.clone().divide(radii),b.clone().divide(radii),c.clone().divide(radii));
  ellipsoidDistance=Math.min(ellipsoidDistance,scaled.closestPointToPoint(unitCenter,new THREE.Vector3()).distanceTo(unitCenter));
  capsuleDistance=Math.min(capsuleDistance,Math.sqrt(segmentTriangleDistanceSq(start,end,new THREE.Triangle(a,b,c))));
 }
 return {radii:{x:radii.x,y:radii.y,z:radii.z},capsuleRadius:TUNING.radius,capsuleHeight:TUNING.height,
  minimumEllipsoidNormalizedDistance:ellipsoidDistance,minimumCapsuleSurfaceGap:capsuleDistance-TUNING.radius,
  passed:ellipsoidDistance>=1-1e-6&&capsuleDistance>=TUNING.radius-1e-6,
  qualification:'Current S5 Controller ellipsoid plus conservative capsule check; not a recovered native spawn-volume rule.'};
}

