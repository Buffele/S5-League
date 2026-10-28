import * as THREE from 'three';

// Source markers supply X/Z and facing. Floor projection is explicitly an S5
// mounting policy, not proof of the original server's player-slot selector.
export function projectWaitingRoomMarker(world,name){
 const marker=world.markers.find(m=>m.name===name);if(!marker)throw Error('Missing source waiting-room marker: '+name);
 marker.object.updateWorldMatrix(true,false);const start=marker.object.getWorldPosition(new THREE.Vector3());start.y+=1;
 const ray=new THREE.Raycaster(start,new THREE.Vector3(0,-1,0),0,50);
 const ground=ray.intersectObjects(world.meshes,false).find(hit=>hit.face&&hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y>.5);
 if(!ground)throw Error('No authored waiting-room ground below '+name);
 return {position:{x:ground.point.x,y:ground.point.y,z:ground.point.z},facing:Math.atan2(marker.matrix[8],marker.matrix[10]),marker:name,policy:'source-marker-xz-and-facing-with-s5-floor-projection',nativeSelectorVerified:false};
}
