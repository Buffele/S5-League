import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installAliceMeshyCollision,createAliceMeshyDoorCollision} from './alice-house-meshy-collision.js';

const ROOT='/assets/maps/alice-house/meshy-batch01/';
function resources(objects){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 for(const root of objects)root.traverse(object=>{if(!object.isMesh)return;geometries.add(object.geometry);for(const material of [object.material].flat()){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
 return {geometries,materials,textures};
}
function release(owned){for(const texture of owned.textures)texture.dispose();for(const material of owned.materials)material.dispose();for(const geometry of owned.geometries)geometry.dispose();}

export async function loadAliceMeshyAssets(){
 const response=await fetch(ROOT+'placements.json');if(!response.ok)throw Error('Alice Meshy placement data unavailable');
 const config=await response.json();if(config.schema!=='alice-meshy-integration-v1')throw Error('Alice Meshy placement contract mismatch');
 const loader=new GLTFLoader(),entries=await Promise.allSettled(config.assets.map(async item=>{
  if(!/^item(?:0[1-7]|1[1-5]|1[7-9]|20)\.glb$/.test(item.file))throw Error('Unexpected Alice Meshy asset');
  const gltf=await loader.loadAsync(ROOT+'models/'+item.file);gltf.scene.updateMatrixWorld(true);
  const meshes=[];gltf.scene.traverse(object=>{if(object.isMesh)meshes.push(object);});
  if(meshes.length!==1)throw Error('Alice Meshy assets require one static mesh');
  const mesh=meshes[0],geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);geometry.computeBoundingBox();
  if(item.itemId===7)for(const material of [mesh.material].flat())material.side=THREE.DoubleSide;
  return {itemId:item.itemId,root:gltf.scene,geometry,material:mesh.material};
 }));
 const assets=new Map(),roots=[];
 for(const entry of entries)if(entry.status==='fulfilled'){assets.set(entry.value.itemId,entry.value);roots.push(entry.value.root);}
 const owned=resources(roots);for(const asset of assets.values())owned.geometries.add(asset.geometry);
 let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;release(owned);};
 const error=entries.find(entry=>entry.status==='rejected');if(error){dispose();throw error.reason;}
 return {config,assets,dispose,owned};
}

// Deform a straight handrail along the actual native segmented centerline.
export function bendAliceBalustrade(geometry,{pathXZ,floorY,topY,depth}){
 const result=geometry.clone();result.computeBoundingBox();const box=result.boundingBox,size=box.getSize(new THREE.Vector3()),lengths=[0];
 for(let i=1;i<pathXZ.length;i++)lengths.push(lengths.at(-1)+Math.hypot(pathXZ[i][0]-pathXZ[i-1][0],pathXZ[i][1]-pathXZ[i-1][1]));
 const positions=result.attributes.position;
 for(let i=0;i<positions.count;i++){
  const along=(positions.getX(i)-box.min.x)/size.x*lengths.at(-1);let segment=1;while(segment<lengths.length-1&&lengths[segment]<along)segment++;
  const a=pathXZ[segment-1],b=pathXZ[segment],span=lengths[segment]-lengths[segment-1],t=(along-lengths[segment-1])/span;
  const nx=-(b[1]-a[1])/span,nz=(b[0]-a[0])/span,offset=(positions.getZ(i)-(box.min.z+box.max.z)/2)/size.z*depth;
  positions.setXYZ(i,a[0]+(b[0]-a[0])*t+nx*offset,floorY+(positions.getY(i)-box.min.y)/size.y*(topY-floorY),a[1]+(b[1]-a[1])*t+nz*offset);
 }
 result.computeVertexNormals();result.computeBoundingBox();result.computeBoundingSphere();return result;
}

// Map an already curved rail from its measured centerline onto the native rail.
// In particular, do not bend its curved X/Z coordinates a second time as a straight bar.
export function fitAliceCurvedBalustrade(geometry,{sourcePathXZ,targetPathXZ,sourceRailWidth,targetRailWidth,floorY,topY,postMatrix}){
 const result=geometry.clone();result.computeBoundingBox();const box=result.boundingBox,height=box.max.y-box.min.y;
 const lengths=path=>{const values=[0];for(let i=1;i<path.length;i++)values.push(values.at(-1)+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));return values;};
 const fromLengths=lengths(sourcePathXZ),toLengths=lengths(targetPathXZ),positions=result.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i);let best=null;
  for(let s=1;s<sourcePathXZ.length;s++){
   const a=sourcePathXZ[s-1],b=sourcePathXZ[s],dx=b[0]-a[0],dz=b[1]-a[1],span=fromLengths[s]-fromLengths[s-1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(span*span))),px=a[0]+dx*t,pz=a[1]+dz*t,distance=(x-px)**2+(z-pz)**2;
   if(!best||distance<best.distance)best={distance,along:fromLengths[s-1]+span*t,normalOffset:((x-px)*-dz+(z-pz)*dx)/span,tangentOffset:((x-px)*dx+(z-pz)*dz)/span};
  }
  const along=best.along/fromLengths.at(-1)*toLengths.at(-1);let s=1;while(s<toLengths.length-1&&toLengths[s]<along)s++;
  const a=targetPathXZ[s-1],b=targetPathXZ[s],span=toLengths[s]-toLengths[s-1],t=(along-toLengths[s-1])/span,tx=(b[0]-a[0])/span,tz=(b[1]-a[1])/span;
  const offset=best.normalOffset*targetRailWidth/sourceRailWidth,extra=best.tangentOffset*toLengths.at(-1)/fromLengths.at(-1);
  positions.setXYZ(i,a[0]+(b[0]-a[0])*t-tz*offset+tx*extra,floorY+(positions.getY(i)-box.min.y)/height*(topY-floorY),a[1]+(b[1]-a[1])*t+tx*offset+tz*extra);
 }
 result.computeVertexNormals();if(postMatrix)result.applyMatrix4(new THREE.Matrix4().fromArray(postMatrix));result.computeBoundingBox();result.computeBoundingSphere();return result;
}

function filteredSourceGeometry(geometry,removed){
 const result=geometry.clone(),indices=[],groups=[];
 for(const group of geometry.groups){const start=indices.length;for(let offset=group.start;offset<group.start+group.count;offset+=3)if(!removed.has(offset/3))indices.push(geometry.index.getX(offset),geometry.index.getX(offset+1),geometry.index.getX(offset+2));
  if(indices.length>start)groups.push({start,count:indices.length-start,materialIndex:group.materialIndex});}
 result.setIndex(indices);result.clearGroups();for(const group of groups)result.addGroup(group.start,group.count,group.materialIndex);return result;
}

function reverseGeometryWinding(geometry){
 const index=geometry.index;
 if(index){for(let i=0;i<index.count;i+=3){const second=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,second);}index.needsUpdate=true;}
 else throw Error('Alice Meshy mirrored overlay requires indexed triangles');
}

export function installAliceMeshyVisuals(world,bundle){
 const {config,assets}=bundle,bySource=new Map(world.sourceMeshes.map(mesh=>[mesh.userData.sourceModelIndex,mesh])),changed=[],geometries=[],overlays=[],collisionEdits=[];
 const group=new THREE.Group();group.name='Alice House / Meshy integrated appearance';world.root.add(group);
 let collision=null,disposed=false;
 const save=mesh=>{if(!changed.some(entry=>entry.mesh===mesh))changed.push({mesh,geometry:mesh.geometry,material:mesh.material,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,userData:{...mesh.userData}});};
 try{
  const suppress=new Map();
  for(const placement of config.placements)for(const entry of placement.suppress??[]){if(!suppress.has(entry.sourceModelIndex))suppress.set(entry.sourceModelIndex,new Set());for(const face of entry.faces)suppress.get(entry.sourceModelIndex).add(face);}
  for(const [id,removed]of suppress){const mesh=bySource.get(id);if(!mesh)throw Error('Alice Meshy source subset unavailable');save(mesh);const geometry=filteredSourceGeometry(mesh.geometry,removed);geometries.push(geometry);mesh.geometry=geometry;mesh.userData.meshySuppressedSourceFaces=[...removed];}
  world.root.updateMatrixWorld(true);
  for(const placement of config.placements){
   const asset=assets.get(placement.itemId);if(!asset)throw Error('Alice Meshy prototype missing');
   const matrix=new THREE.Matrix4().fromArray(placement.matrix),material=asset.material;
   let geometry;
   if(placement.curveFit){geometry=fitAliceCurvedBalustrade(asset.geometry,placement.curveFit);}
   else if(placement.bend){geometry=bendAliceBalustrade(asset.geometry,placement.bend);}
   else{
    geometry=asset.geometry.clone();
    if(placement.profileY){
     const {sourceSplitY,targetSplitY,sourceTopY}=placement.profileY,positions=geometry.attributes.position;
     for(let i=0;i<positions.count;i++){const y=positions.getY(i),adapted=y<=sourceSplitY?y*targetSplitY/sourceSplitY:targetSplitY+(y-sourceSplitY)*(sourceTopY-targetSplitY)/(sourceTopY-sourceSplitY);positions.setY(i,adapted);}
     geometry.computeVertexNormals();
    }
    geometry.applyMatrix4(matrix);
   }
   // Placement data stays in the original source frame, including files sent
   // for texturing. Only the runtime derivative receives the session mirror.
   const presentation=world.presentationMatrix;
   if(presentation){geometry.applyMatrix4(presentation);if(placement.replaceSourceModelIndex===undefined&&presentation.determinant()<0)reverseGeometryWinding(geometry);}
   geometries.push(geometry);
   if(placement.replaceSourceModelIndex!==undefined){
    const mesh=bySource.get(placement.replaceSourceModelIndex);if(!mesh)throw Error('Alice Meshy replacement owner missing');save(mesh);
    geometry.applyMatrix4(mesh.matrixWorld.clone().invert());geometry.computeBoundingBox();geometry.computeBoundingSphere();
    mesh.geometry=geometry;mesh.material=material;mesh.userData.meshyItemId=placement.itemId;mesh.userData.meshyPlacementKey=placement.key;
    mesh.castShadow=true;mesh.receiveShadow=true;
    if(placement.colliderSourceModelIndex!==undefined)collisionEdits.push({sourceModelIndex:placement.colliderSourceModelIndex,visualSourceModelIndex:placement.replaceSourceModelIndex,
     reason:'Visible Meshy open door leaves/frame; simplified leaf hulls replace the former closed plane.',triangles:createAliceMeshyDoorCollision(asset.geometry,presentation?presentation.clone().multiply(matrix):matrix)});
   }else{
    const mesh=new THREE.Mesh(geometry,material);mesh.name=placement.key;mesh.castShadow=placement.itemId!==7;mesh.receiveShadow=true;mesh.userData={meshyItemId:placement.itemId,meshyPlacementKey:placement.key,sourceGeometry:false};group.add(mesh);overlays.push(mesh);
   }
  }
  collision=installAliceMeshyCollision(world,collisionEdits);
  const replaced=changed.filter(entry=>entry.mesh.userData.meshyItemId).map(entry=>({sourceModelIndex:entry.mesh.userData.sourceModelIndex,itemId:entry.mesh.userData.meshyItemId,key:entry.mesh.userData.meshyPlacementKey}));
  world.meshyAppearance={schema:config.schema,assetCount:assets.size,placementCount:config.placements.length,instanceCount:overlays.length+replaced.length,replaced,collisionEdits:collisionEdits.map(edit=>({sourceModelIndex:edit.sourceModelIndex,visualSourceModelIndex:edit.visualSourceModelIndex,triangles:edit.triangles.length})),group,
   policy:collisionEdits.length?'Meshy visual adaptation with explicitly declared derived collisions; native role barrier, floors and destructible identities retained.':'Meshy visual adaptation over retained S5Runtime structure and unchanged native collision faces; incorrect open-door assemblies and floating relief panels withdrawn.'};
  return {dispose,filter(renderer){const anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()??1);for(const texture of bundle.owned.textures)texture.anisotropy=anisotropy;},summary:world.meshyAppearance};
 }catch(error){dispose();throw error;}
 function dispose(){if(disposed)return;disposed=true;collision?.dispose();group.removeFromParent();for(const entry of changed){entry.mesh.geometry=entry.geometry;entry.mesh.material=entry.material;entry.mesh.castShadow=entry.castShadow;entry.mesh.receiveShadow=entry.receiveShadow;entry.mesh.userData=entry.userData;}for(const geometry of geometries)geometry.dispose();delete world.meshyAppearance;bundle.dispose();}
}
