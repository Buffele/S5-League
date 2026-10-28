// Equipment sockets are scoped to a source scene and its evaluated model.
// Never substitute the character origin when a weapon socket is missing.
import {Matrix4,Vector3} from 'three';
export function resolveWeaponEffectSocket(avatar,{source,model,node}={}){
 if(!source||!model||!node)throw Error('Explicit weapon effect source/model/socket required');
 const meshes=avatar?.meshes?.filter(mesh=>mesh.userData.weapon&&mesh.userData.source===source&&mesh.name===model)??[];
 if(meshes.length!==1)throw Error(`Ambiguous weapon effect model: ${source}/${model}`);
 const carrier=meshes[0].parent;
 if(!carrier?.isBone||!carrier.name.endsWith(model))throw Error(`Missing evaluated weapon effect carrier: ${model}`);
 const name=carrier.name.slice(0,-model.length)+node,socket=avatar.bones?.get(name);
 if(!socket||socket!==carrier&&!carrier.getObjectByName(name))throw Error(`Missing weapon effect socket: ${node}`);
 socket.updateWorldMatrix(true,false);
 return name;
}

export function weaponSurfaceImpactMatrix(avatar,socketName,collision,{maxDrop}={}){
 if(!collision?.raycast||!(maxDrop>0))throw Error('Weapon ground effect requires a surface query and explicit reach');
 const socket=avatar.bones.get(socketName);socket.updateWorldMatrix(true,false);
 const origin=new Vector3().setFromMatrixPosition(socket.matrixWorld);
 const contact=collision.raycast(origin,{x:0,y:-maxDrop,z:0});
 if(!contact||contact.normal.y<=0)return null;
 const up=new Vector3().copy(contact.normal).normalize();
 const across=new Vector3().setFromMatrixColumn(socket.matrixWorld,0).projectOnPlane(up);
 if(across.lengthSq()<1e-10)across.setFromMatrixColumn(socket.matrixWorld,2).projectOnPlane(up);
 if(across.lengthSq()<1e-10)throw Error('Weapon impact has no surface tangent');
 across.normalize();const along=new Vector3().crossVectors(across,up).normalize();
 // Preserve the socket's source-unit scale; replace its origin and up axis
 // with the actual contacted surface. The result is detached at the strike.
 const scale=new Vector3().setFromMatrixScale(socket.matrixWorld);
 // Match the existing melee surface renderer's small normal offset so flat
 // shockwave quads do not z-fight with the contacted floor.
 const position=new Vector3().copy(contact.point).addScaledVector(up,.025);
 return new Matrix4().makeBasis(across,up,along).scale(scale).setPosition(position);
}
