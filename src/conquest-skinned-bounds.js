import {Box3,Sphere,Vector3} from 'three';

// The Conquest model needs both animated bounds. Keep Three's source vertex
// order and each accumulator's exact expansion; share only the skinned point.
const vertex=new Vector3();
export function updateConquestSkinnedBounds(mesh){
 if(mesh.boundingBox===null)mesh.boundingBox=new Box3();
 if(mesh.boundingSphere===null)mesh.boundingSphere=new Sphere();
 mesh.boundingBox.makeEmpty();mesh.boundingSphere.makeEmpty();
 const positions=mesh.geometry.getAttribute('position');
 for(let index=0;index<positions.count;index++){
  mesh.getVertexPosition(index,vertex);
  mesh.boundingBox.expandByPoint(vertex);mesh.boundingSphere.expandByPoint(vertex);
 }
}
