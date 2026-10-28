import {BufferGeometry,Float32BufferAttribute,Matrix4,Mesh,Vector3} from 'three';
import {IRON_BOOTS_TRAIL_BINDINGS} from './iron-boots-trails.js';

export function weaponFlameSources(avatar,parts){
 let surfaceMeshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&!/chain|uvani|alphablend|^light_/i.test(mesh.name)&&!(avatar.weapon==='katana'&&mesh.userData.source!=='model/weapon/katana_a.scn'));
 if(avatar.weapon!=='ironboots'){
  const owned=[],sources=surfaceMeshes.filter(mesh=>!mesh.isSkinnedMesh&&(avatar.weapon!=='demonicknuckle'||mesh.name==='demonic_knuckle_body')&&(avatar.weapon!=='sigmablade'||['sigmabalde','sigma_blade'].includes(mesh.name)));
  // The Claw's talons are in its weapon skin, not its small wrist housing.
  // Partition their triangles by dominant weighted equipment bone so each
  // articulated segment follows its evaluated pose, rather than the actor.
  if(avatar.weapon==='assassinclaw')for(const mesh of surfaceMeshes.filter(mesh=>mesh.isSkinnedMesh)){
   const {position,skinIndex,skinWeight}=mesh.geometry.attributes,indices=mesh.geometry.index,groups=new Map();
   for(let i=0;i<(indices?.count??position.count);i+=3){const ids=[0,1,2].map(j=>indices?indices.getX(i+j):i+j),weights=new Map();for(const id of ids)for(let slot=0;slot<4;slot++){const bone=skinIndex.getComponent(id,slot);weights.set(bone,(weights.get(bone)??0)+skinWeight.getComponent(id,slot));}
    const index=[...weights].sort((a,b)=>b[1]-a[1])[0][0],bone=mesh.skeleton.bones[index];if(!bone?.name.startsWith('equipment'))throw Error('Claw flame requires its evaluated equipment skin pivot');
    if(!groups.has(index))groups.set(index,{bone,intoBone:new Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[index],mesh.bindMatrix),vertices:[]});const group=groups.get(index);for(const id of ids)group.vertices.push(...new Vector3().fromBufferAttribute(position,id).applyMatrix4(group.intoBone).toArray());
   }
   for(const {bone,vertices}of groups.values()){
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const source=new Mesh(geometry,mesh.material);source.name='flame-skin-'+mesh.name+'-'+bone.name;source.userData={...mesh.userData,flameBone:bone.name};source.parent=mesh;source.updateWorldMatrix=function(){bone.updateWorldMatrix(true,false);this.matrixWorld.copy(bone.matrixWorld);this.visible=mesh.visible;};source.updateWorldMatrix();sources.push(source);owned.push(geometry);
   }
  }
  return {sources,surfaceMeshes,dispose(){for(const geometry of owned)geometry.dispose();}};
 }
 surfaceMeshes=[...new Set(parts.map(part=>part.mesh))];
 const mesh=surfaceMeshes[0];if(!mesh?.isSkinnedMesh||mesh.name!=='ironBoots_normal_foot')throw Error('Flames require the actual Iron Boots foot skin');
 const surfaceMask=new Float32Array(mesh.geometry.attributes.position.count);
 const sources=IRON_BOOTS_TRAIL_BINDINGS.map(binding=>{
  const foot=mesh.skeleton.bones.findIndex(b=>b.name===binding.foot),toe=mesh.skeleton.bones.findIndex(b=>b.name===binding.toe);if(foot<0||toe<0)throw Error('Missing evaluated flame foot: '+binding.side);
  const intoFoot=new Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[foot],mesh.bindMatrix),{position,skinIndex,skinWeight}=mesh.geometry.attributes,selected=[],vertices=[];
  for(let i=0;i<position.count;i++){let weight=0;for(let slot=0;slot<4;slot++){const bone=skinIndex.getComponent(i,slot);if(bone===foot||bone===toe)weight+=skinWeight.getComponent(i,slot);}selected[i]=weight>=.5;surfaceMask[i]=Math.max(surfaceMask[i],selected[i]?1:0);}
  const indices=mesh.geometry.index;for(let i=0;i<(indices?.count??position.count);i+=3){const ids=[0,1,2].map(j=>indices?indices.getX(i+j):i+j);if(ids.every(id=>selected[id]))for(const id of ids)vertices.push(...new Vector3().fromBufferAttribute(position,id).applyMatrix4(intoFoot).toArray());}
  if(!vertices.length)throw Error('Missing weighted flame foot triangles: '+binding.side);
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
  const source=new Mesh(geometry,mesh.material),bone=mesh.skeleton.bones[foot];source.name='flame-'+binding.side+'-foot';source.userData={...mesh.userData,flameBone:binding.foot};source.parent=mesh;
  source.updateWorldMatrix=function(){bone.updateWorldMatrix(true,false);this.matrixWorld.copy(bone.matrixWorld);this.visible=mesh.visible;};source.updateWorldMatrix();return source;
 });
 return {sources,surfaceMeshes,surfaceMasks:new Map([[mesh,surfaceMask]]),dispose(){for(const source of sources)source.geometry.dispose();}};
}
