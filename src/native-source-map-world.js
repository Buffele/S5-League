import * as THREE from 'three';
import {sourceMapScale} from './s5runtime-coordinates.js';
import {TUNING} from './movement-profile.js';
import {COLLISION_SETTINGS,EllipsoidWorld} from './collision.js';
import {nativeMapParentIndices,sourceGeometry,meshTriangles,verticalFloor,previewClearance} from './native-map-source-geometry.js';
import {nativeMainStaticCollisionOwner} from './native-collision-registration.js';

// Individually audited contracts choose the supplied source scenes/categories.
// No name-based universal collision mask, invented floor or spawn fallback.
export function createNativeSourceMapWorld(bundle,contract,{materialsForModel=null}={}){
 if(contract?.schema!=='s5runtime-static-map-runtime-contract-v1'||bundle.key!==contract.key||!Array.isArray(contract.scenes)||!Array.isArray(contract.movementCandidates)||!Array.isArray(contract.weaponCandidates)||!Array.isArray(contract.expectedRejected))throw Error('Audited native map contract required');
 const root=new THREE.Group();root.name=contract.name;
 const boundary=new THREE.Group();boundary.name='Native source unit boundary';boundary.scale.set(...sourceMapScale(false));root.add(boundary);
 const sourceMeshes=[],markers=[],geometries=[],ownedMaterials=new Set(),logicalScenes=[],byRef=new Map();let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;root.removeFromParent();for(const geometry of geometries)geometry.dispose();for(const material of ownedMaterials)material.dispose();};
 try{
  for(const config of contract.scenes){
   const source=bundle.scenes[config.sceneIndex];
   if(source?.source!==config.source||source.models.length!==config.modelCount||source.nodes.length!==config.nodeCount||!Array.isArray(source.root?.matrix))throw Error('Native map scene identity mismatch');
   const nativeCollisionOwner=nativeMainStaticCollisionOwner(bundle,contract.nativeMapId,source.source);
   const sourceRoot=new THREE.Group();sourceRoot.name=source.root.name;sourceRoot.matrix.fromArray(source.root.matrix);sourceRoot.matrixAutoUpdate=false;boundary.add(sourceRoot);
   const parents=nativeMapParentIndices(source),nodes=[],models=new Map(source.models.map((model,index)=>[model.sourceNodeIndex,{model,index}]));
   logicalScenes.push({sceneIndex:config.sceneIndex,sourceRoot,nodes,parentIndices:parents,nativeCollisionOwner});
   for(const [nodeIndex,node] of source.nodes.entries()){
    const logical=new THREE.Object3D();logical.name=node.name;logical.matrix.fromArray(node.matrix);logical.matrixAutoUpdate=false;
    logical.userData={sourceSceneIndex:config.sceneIndex,sourceNodeIndex:nodeIndex,nativeParentIndex:parents[nodeIndex],nativeParentName:node.parent};
    (parents[nodeIndex]<0?sourceRoot:nodes[parents[nodeIndex]]).add(logical);nodes.push(logical);
    if(node.type!=='ModelData'){markers.push({source:source.source,sourceSceneIndex:config.sceneIndex,nodeIndex,name:node.name,type:node.type,object:logical});continue;}
    const entry=models.get(nodeIndex);
    if(!entry||entry.model.name!==node.name||entry.model.parent!==node.parent||JSON.stringify(entry.model.matrix)!==JSON.stringify(node.matrix))throw Error('Native map node/model identity mismatch');
    const {model,index}=entry;if(!model.vertices.length)continue;
    const geometry=sourceGeometry(model);geometries.push(geometry);let materials;
    if(config.render&&materialsForModel&&!/^oct_|occlusion|sector/i.test(model.name))materials=materialsForModel(model,index,config.sceneIndex);
    else{const material=new THREE.MeshBasicMaterial({color:0xcccccc,side:THREE.DoubleSide});ownedMaterials.add(material);materials=Array(Math.max(1,model.textures.length)).fill(material);}
    if(!Array.isArray(materials)||materials.length!==Math.max(1,model.textures.length)||materials.some(material=>!material?.isMaterial))throw Error('Native map material slots unresolved');
    const mesh=new THREE.Mesh(geometry,materials);mesh.name=model.name;mesh.matrixAutoUpdate=false;
    mesh.userData={source:source.source,sourceSceneIndex:config.sceneIndex,sourceModelIndex:index,sourceNodeIndex:nodeIndex,nativeMatrix:[...model.matrix],nativeParentIndex:parents[nodeIndex],nativeCollisionOwner};
    mesh.visible=!!config.render&&!/^oct_|occlusion|sector/i.test(model.name);logical.add(mesh);sourceMeshes.push(mesh);byRef.set(`${config.sceneIndex}:${index}`,mesh);
   }
  }
  root.updateMatrixWorld(true);
  function candidates(refs){return refs.map(ref=>{
   const mesh=byRef.get(`${ref.sceneIndex}:${ref.modelIndex}`);
   if(!mesh||mesh.name!==ref.name||mesh.userData.sourceNodeIndex!==ref.nodeIndex)throw Error('Native map collision binding mismatch');
   mesh.visible=false;return mesh;
  });}
  const movementMeshes=candidates(contract.movementCandidates),weaponMeshes=candidates(contract.weaponCandidates);
  const recordsFor=meshes=>meshes.flatMap(mesh=>meshTriangles([mesh],mesh.userData.source,{nativeCollisionOwner:mesh.userData.nativeCollisionOwner}).records.map(record=>({...record,sourceSceneIndex:mesh.userData.sourceSceneIndex})));
  const movementRecords=recordsFor(movementMeshes),weaponRecords=recordsFor(weaponMeshes),queryRecords=[],rejected=[];
  // Weapon candidates can include the entire movement set. The native source
  // stream registers each original face once, independently of S5 query use.
  const nativeRecords=[...new Map([...movementRecords,...weaponRecords].map(record=>[
   `${record.sourceSceneIndex}:${record.sourceModelIndex}:${record.triangleIndex}`,record])).values()];
  const radii=new THREE.Vector3(TUNING.radius,TUNING.height/2,TUNING.radius);
  for(const record of movementRecords){
   const [a,b,c]=record.points.map(point=>point.clone().divide(radii)),crossLengthSq=b.sub(a).cross(c.sub(a)).lengthSq();
   if(crossLengthSq<COLLISION_SETTINGS.epsilon**2)rejected.push({sceneIndex:record.sourceSceneIndex,modelIndex:record.sourceModelIndex,triangleIndex:record.triangleIndex});
   else queryRecords.push(record);
  }
  if(JSON.stringify(rejected)!==JSON.stringify(contract.expectedRejected))throw Error('Native map solver rejection set changed');
  if(!queryRecords.length)throw Error('Native map has no qualified movement faces');
  const triangles=queryRecords.map(record=>record.points.map(point=>point.toArray()));
  const spawnRef=contract.previewSpawn,marker=markers.find(entry=>entry.sourceSceneIndex===spawnRef?.sceneIndex&&entry.nodeIndex===spawnRef.nodeIndex&&entry.name===spawnRef.name);
  if(!marker)throw Error('Native map preview marker missing');
  const sourcePosition=marker.object.getWorldPosition(new THREE.Vector3()),floor=verticalFloor(sourcePosition,queryRecords);
  const direction=new THREE.Vector3().setFromMatrixColumn(marker.object.matrixWorld,2);direction.y=0;
  if(direction.lengthSq()<1e-12)throw Error('Native map preview marker lacks a horizontal Box-Z direction');direction.normalize();
  if(!floor)throw Error('Native map marker has no downward source floor');
  const spawn={...floor.point,y:floor.point.y+COLLISION_SETTINGS.snapBase},clearance=previewClearance(spawn,queryRecords);
  const solver=new EllipsoidWorld({triangles,colliders:[]},radii),settle=solver.move({x:spawn.x,y:spawn.y+radii.y,z:spawn.z},{x:0,y:-COLLISION_SETTINGS.snapBase*2,z:0},{stopOnGround:true});
  if(!clearance.passed||settle.exhausted||!settle.contacts.some(contact=>contact.groundSupport))throw Error('Native map preview spawn fails current controller clearance/support');
  const bounds=new THREE.Box3();for(const record of movementRecords)for(const point of record.points)bounds.expandByPoint(point);
  const target=new THREE.Group();target.name='S5 preview target adapter';target.visible=false;root.add(target);
  return {root,group:root,name:contract.name,nativeMapId:contract.nativeMapId,sourceData:bundle,sourceContract:contract,boundary,logicalScenes,sourceMeshes,markers,
   nativeCollisionSources:logicalScenes.map(logical=>({source:bundle.scenes[logical.sceneIndex],parentIndices:logical.parentIndices,
    requiredModelIndices:[...new Set([...movementMeshes,...weaponMeshes].filter(mesh=>mesh.userData.sourceSceneIndex===logical.sceneIndex).map(mesh=>mesh.userData.sourceModelIndex))],
    readRecords:()=>disposed?null:nativeRecords.filter(record=>record.sourceSceneIndex===logical.sceneIndex),active:()=>!disposed})),
   meshes:movementMeshes,movementMeshes,weaponCollisionMeshes:weaponMeshes,weaponTriangleRecords:weaponRecords,weaponTriangles:weaponRecords.map(record=>record.points.map(point=>point.toArray())),
   triangles,colliders:[],sourceMovementTriangles:movementRecords.map(record=>record.points.map(point=>point.toArray())),movementTriangleRecords:movementRecords,queryTriangleRecords:queryRecords,rejectedQueryTriangles:rejected,
   spawn,target,bounds,deathY:bounds.min.y-TUNING.height*2,cameraFar:Math.max(200,bounds.getSize(new THREE.Vector3()).length()*2),
   previewFacing:Math.atan2(direction.x,direction.z),previewSpawn:{...spawnRef,sourcePosition:sourcePosition.toArray(),sourceDirection:direction.toArray(),floorPosition:[spawn.x,spawn.y,spawn.z],clearance,qualification:'Explicit S5 preview floor projection and source Box-Z facing; native actor placement/mode selection not certified.'},
   readyForController:true,nativeReady:false,gameplayReady:false,
   qualification:{staticRawLocalAuthoringPose:true,nativeRuntimePlacementCertified:false,nativeCollisionExhaustivenessCertified:false,nativeGameplayCertified:false,alphaBetaWayfindingRequired:contract.modes?.includes('Touchdown')??false},
   update(){},dispose};
 }catch(error){dispose();throw error;}
}
