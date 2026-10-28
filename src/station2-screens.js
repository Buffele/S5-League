import * as THREE from 'three';

// Recover the separate, coplanar display rectangles from the native screen mesh.
export function screenPlanes(geometry,matrix=new THREE.Matrix4()){
 const p=geometry.attributes.position,n=geometry.attributes.normal,index=geometry.index;
 const normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),planes=[];
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
  const points=ids.map(j=>new THREE.Vector3().fromBufferAttribute(p,j).applyMatrix4(matrix));
  const normal=n?new THREE.Vector3().fromBufferAttribute(n,ids[0]).applyNormalMatrix(normalMatrix):points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
  const distance=normal.dot(points[0]);
  let plane=planes.find(a=>a.normal.dot(normal)>.9999&&Math.abs(a.distance-distance)<.002);
  if(!plane){plane={normal,distance,points:[]};planes.push(plane);}plane.points.push(...points);
 }
 return planes.map(({normal,points})=>{
  const up=new THREE.Vector3(0,1,0).addScaledVector(normal,-normal.y).normalize();
  const right=up.clone().cross(normal).normalize();
  const x=points.map(p=>p.dot(right)),y=points.map(p=>p.dot(up));
  const minX=Math.min(...x),maxX=Math.max(...x),minY=Math.min(...y),maxY=Math.max(...y);
  const center=right.clone().multiplyScalar((minX+maxX)/2).addScaledVector(up,(minY+maxY)/2).addScaledVector(normal,points[0].dot(normal));
  return {center,normal,width:maxX-minX,height:maxY-minY,rotation:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,normal))};
 });
}

// Keep the authored display atlas. Screens no longer allocate render targets
// or render a reflected copy of the level.
export function applyStationScreens(world){
 if(world.baseScreens)return world.baseScreens;
 const screens=['alpha-base','beta-base'].flatMap(id=>world.modules.get(id)?.meshes.filter(mesh=>/^screenlight/i.test(mesh.name))??[]);
 world.baseScreens={mirrors:[],screens};return world.baseScreens;
}
