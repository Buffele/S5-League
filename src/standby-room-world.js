import * as THREE from 'three';
import {DDSLoader} from 'three/addons/loaders/DDSLoader.js';
import {sourceMapScale,sourceMapPoint} from './s5runtime-coordinates.js';
import {meshTriangles} from './native-map-source-geometry.js';
import {nativeStaticCollisionRegistration} from './native-collision-registration.js';

const ASSET_ROOT='/assets/maps/standbyroom/';
const SOURCE='model/background/standbyroom.scn';
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

async function readJson(file){
 const response=await fetch(ASSET_ROOT+file);
 if(!response.ok)throw Error('Standby room source unavailable: '+file);
 return response.json();
}

function geometryFor(model){
 const vertices=model.vertices;
 const indices=model.indicesUnsigned??model.indices.map(index=>index&0xffff);
 if(vertices.length%3||indices.length%3||model.normals.length!==vertices.length||
  !vertices.every(Number.isFinite)||!model.normals.every(Number.isFinite)||
  !indices.every(index=>Number.isInteger(index)&&index>=0&&index<vertices.length/3))throw Error('Invalid standby source geometry: '+model.name);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(model.normals,3));
 geometry.setIndex(indices);
 for(const [field,attribute] of [['uv','uv'],['uv2','uv1']]){
  if(model[field]?.length===vertices.length/3*2)geometry.setAttribute(attribute,new THREE.Float32BufferAttribute(model[field],2));
 }
 for(const [index,texture] of model.textures.entries())geometry.addGroup(texture.start*3,texture.count*3,index);
 return geometry;
}

/** Standalone static source pose. No Alice mode, camera, recentering or spawn. */
export async function loadStandbyRoomWorld(scene,{observedSpawnPoint=null,observedSpawnEvidence=null}={}){
 if(!scene?.isObject3D)throw Error('Standby room requires an explicit Three scene/root');
 if(observedSpawnPoint!==null&&(!Array.isArray(observedSpawnPoint)||observedSpawnPoint.length!==3||
  !observedSpawnPoint.every(Number.isFinite)||typeof observedSpawnEvidence?.file!=='string'||!observedSpawnEvidence.file||
  !/^[a-f0-9]{64}$/i.test(observedSpawnEvidence.sha256??'')||observedSpawnEvidence.channel!=='actor+0x74'))throw Error('Observed standby placement requires native XYZ and explicit actor+0x74 file/hash evidence');
 if(observedSpawnPoint===null&&observedSpawnEvidence!==null)throw Error('Observed standby evidence requires an explicit native point');
 const manifest=await readJson('manifest.json');
 if(manifest.schema!=='standbyroom-source-runtime-v1'||manifest.source!==SOURCE||manifest.nativeMapId!==null||manifest.scene!=='scene.json')throw Error('Standby room manifest contract mismatch');
 const data=await readJson(manifest.scene);
 // This narrowly qualified asset has an identity root and all empty parent
 // literals. Reject a different hierarchy rather than assuming scene-space.
 if(data.source!==SOURCE||data.models?.length!==41||data.nodes?.length!==71||
  JSON.stringify(data.root?.matrix)!==JSON.stringify(IDENTITY)||data.nodes.some(node=>node.parent!==''))throw Error('Standby room static transform contract changed');
 const root=new THREE.Group();root.name='Standby room / native source';root.scale.set(...sourceMapScale(false));
 const sourceRoot=new THREE.Group();sourceRoot.name=data.root.name;sourceRoot.matrix.fromArray(data.root.matrix);sourceRoot.matrixAutoUpdate=false;root.add(sourceRoot);
 const textures=new Map(),roleSamplers=new Map(),materials=new Map(),geometries=[],sourceMeshes=[],collisionMeshes=[],markers=[];
 let disposed=false;
 const dispose=()=>{
  if(disposed)return;disposed=true;root.removeFromParent();
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials.values())material.dispose();
  for(const texture of roleSamplers.values())texture.dispose();
  for(const texture of textures.values())texture.dispose();
 };
 try{
  const loader=new DDSLoader();
  const loaded=await Promise.allSettled(manifest.textures.map(async resource=>{
   if(!/^textures\/model\/background\/[^/]+\.dds$/i.test(resource.file))throw Error('Unexpected standby texture path');
   const texture=await loader.loadAsync(ASSET_ROOT+resource.file);
   texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.channel=0;
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
   textures.set(resource.file,texture);
  }));
  const failure=loaded.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  const references=new Map(manifest.references.map(ref=>[`${ref.modelIndex}:${ref.textureIndex}:${ref.field}`,ref]));
  function sourceTexture(modelIndex,textureIndex,field,literal){
   if(!literal)return null;
   const reference=references.get(`${modelIndex}:${textureIndex}:${field}`);
   if(!reference||reference.scene!==SOURCE||reference.reference!==literal||!textures.has(reference.file))throw Error('Unresolved standby source texture: '+literal);
   const texture=textures.get(reference.file);
   if(field!=='lightmap')return texture;
   // A single DDS may serve both roles. Clone the sampler rather than changing
   // the diffuse texture's color space or UV channel in another material.
   if(!roleSamplers.has(reference.file)){
    const lightmap=texture.clone();lightmap.colorSpace=THREE.NoColorSpace;lightmap.channel=1;
    lightmap.needsUpdate=true;roleSamplers.set(reference.file,lightmap);
   }
   return roleSamplers.get(reference.file);
  }
  function materialFor(model,modelIndex,slot,textureIndex){
   const state=model.renderState??0;
   const diffuse=sourceTexture(modelIndex,textureIndex,'source',slot?.source);
   const lightmap=sourceTexture(modelIndex,textureIndex,'lightmap',slot?.lightmap);
   const key=[state,diffuse?.uuid,lightmap?.uuid].join(':');
   if(materials.has(key))return materials.get(key);
   const transparent=!!(state&(2|32));
   // Render-state interpretation follows the existing S5 map convention;
   // native shader/sampler/animation parity remains explicitly unverified.
   const options={map:diffuse,color:0xffffff,side:state&8?THREE.DoubleSide:THREE.FrontSide,
    transparent,alphaTest:state&4?.5:transparent?.015:0,
    depthWrite:!(state&64),fog:!(state&512),
    blending:state&32?THREE.AdditiveBlending:THREE.NormalBlending};
   if(state&8192)Object.assign(options,{polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
   const material=state&1?new THREE.MeshBasicMaterial(options):new THREE.MeshLambertMaterial(options);
   if(lightmap)material.lightMap=lightmap;
   material.name='Standby source material / '+key;material.userData.nativeRenderState=state;
   materials.set(key,material);return material;
  }
  for(const [modelIndex,model] of data.models.entries()){
   if(!model.vertices.length)continue;
   const geometry=geometryFor(model);geometries.push(geometry);
   const slots=model.textures.length?model.textures.map((slot,index)=>materialFor(model,modelIndex,slot,index)):[materialFor(model,modelIndex,null,0)];
   const mesh=new THREE.Mesh(geometry,slots);mesh.name=model.name;
   mesh.matrix.fromArray(model.matrix);mesh.matrixAutoUpdate=false;
   const collision=/^oct_/i.test(model.name);
   mesh.userData={source:SOURCE,sourceModelIndex:modelIndex,sourceNodeIndex:model.sourceNodeIndex,
    nativeParentName:model.parent,nativeMatrix:[...model.matrix],collision,
    nativeCollisionCategory:collision&&nativeStaticCollisionRegistration(model.name)?'0x'+nativeStaticCollisionRegistration(model.name).raw10.toString(16):null};
   mesh.visible=!/^oct_|occlusion|sector/i.test(model.name);
   sourceRoot.add(mesh);sourceMeshes.push(mesh);if(collision)collisionMeshes.push(mesh);
  }
  for(const node of data.nodes){
   if(node.type==='ModelData')continue;
   const object=new THREE.Object3D();object.name=node.name;object.matrix.fromArray(node.matrix);object.matrixAutoUpdate=false;
   object.userData={source:SOURCE,sourceNodeIndex:node.sourceNodeIndex,nativeType:node.type};sourceRoot.add(object);
   markers.push({source:SOURCE,nodeIndex:node.sourceNodeIndex,type:node.type,name:node.name,parent:node.parent,
    matrix:[...node.matrix],rawSerializedTranslation:node.matrix.slice(12,15),object,
    positionQualification:'Raw native matrix translation; not certified actor feet or floor-safe spawn.'});
  }
  scene.add(root);root.updateMatrixWorld(true);
  //704F31 stores this explicit standby scene in root1A4;706B40 registers
  // its exact model groups via7B6560 into manager+C. Keep this owner typed;
  // other source scenes must not infer their partition from an asset prefix.
  const {triangles,records:queryTriangleRecords}=meshTriangles(collisionMeshes,SOURCE,{nativeCollisionOwner:'standby-root1A4'});
  if(triangles.length!==708)throw Error('Standby source collision triangle count changed');
  root.userData.source=SOURCE;root.userData.staticSerializedPoseOnly=true;
  // This is an explicitly supplied session observation, never a marker-based
  // selector or inferred feet position. Do not project or add a height here.
  const spawn=observedSpawnPoint===null?null:sourceMapPoint({x:observedSpawnPoint[0],y:observedSpawnPoint[1],z:observedSpawnPoint[2]},false);
  return {root,group:root,name:'Standby room',nativeMapId:null,meshes:collisionMeshes,collisionMeshes,
   nativeCollisionSources:[{source:data,parentIndices:data.nodes.map(()=>-1),requiredModelIndices:collisionMeshes.map(mesh=>mesh.userData.sourceModelIndex),
    readRecords:()=>disposed?null:queryTriangleRecords,active:()=>!disposed}],
   sourceMeshes,visualMeshes:sourceMeshes.filter(mesh=>mesh.visible),colliders:[],triangles,queryTriangleRecords,markers,
   spawn,spawnSelectionVerified:false,readyForController:spawn!==null,nativeSpawnConventionCertified:false,nativeReady:false,
   observedSpawnNative:observedSpawnPoint===null?null:[...observedSpawnPoint],
   observedSpawnEvidence:observedSpawnEvidence===null?null:{...observedSpawnEvidence},
   spawnSource:spawn===null?null:'caller-supplied-observed-actor-position',
   sourceData:data,staticSerializedPoseOnly:true,requiresExternalLighting:true,
   qualification:{unitScaleSource:'sourceMapScale(false)',recentered:false,mirrored:false,
    nativeSpawnCertified:false,nativePhysicalFeetConventionCertified:false,nativeAnimationPlaybackCertified:false,nativeRenderParityCertified:false,
    nativeCollisionExhaustivenessCertified:false,aliceModeInherited:false,alphaBetaWayfindingRequired:false},dispose};
 }catch(error){dispose();throw error;}
}
