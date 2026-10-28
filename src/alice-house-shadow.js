import {Box3,Vector3,OrthographicCamera,PCFShadowMap} from 'three';

function visible(object){for(let p=object;p;p=p.parent)if(!p.visible)return false;return true;}
const vec=(value,label)=>{const v=value?.isVector3?value.clone():new Vector3(...value);if(!v.toArray().every(Number.isFinite))throw Error('Finite '+label+' required');return v;};
export function sourceVisibleBounds(meshes){
 const bounds=new Box3(),models=[];let indexedVertexReferences=0;
 for(const mesh of meshes){
  if(!mesh.isMesh||!visible(mesh)||!mesh.geometry?.attributes.position)continue;
  mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position,index=mesh.geometry.index,materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const ranges=mesh.geometry.groups.length?mesh.geometry.groups:[{start:0,count:index?.count??p.count,materialIndex:0}];let used=false;
  for(const group of ranges){if(materials[group.materialIndex]?.visible===false)continue;
   const first=Math.max(group.start,mesh.geometry.drawRange.start),last=Math.min(group.start+group.count,mesh.geometry.drawRange.start+mesh.geometry.drawRange.count,index?.count??p.count);
   for(let i=first;i<last;i++){const point=new Vector3().fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);if(!point.toArray().every(Number.isFinite))throw Error('Non-finite source shadow point');bounds.expandByPoint(point);indexedVertexReferences++;used=true;}
  }
  if(used)models.push({sourceModelIndex:mesh.userData.sourceModelIndex,name:mesh.name});
 }
 if(bounds.isEmpty())throw Error('No visible indexed source geometry for shadow fit');
 return {bounds,models,indexedVertexReferences};
}
export function boundsCorners(bounds){return [0,1].flatMap(x=>[0,1].flatMap(y=>[0,1].map(z=>new Vector3(x?bounds.max.x:bounds.min.x,y?bounds.max.y:bounds.min.y,z?bounds.max.z:bounds.min.z))));}

// A DirectionalLight's radiance/direction are translation-invariant. Re-anchor
// its position AND target along the same world direction so the shadow camera
// can place all geometry in front of its near plane. No source mesh is changed.
export function fitDirectionalShadow(meshes,light,{padding=2,depthPadding=4,minNear=.1,mapSize=2048,bias=.001,normalBias=.02}={}){
 if(!light?.isDirectionalLight)throw Error('DirectionalLight required');
 if(![padding,depthPadding,minNear].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(mapSize)||mapSize<=0)throw Error('Positive shadow fit configuration required');
 const source=sourceVisibleBounds(meshes),center=source.bounds.getCenter(new Vector3());
 const originalPosition=light.getWorldPosition(new Vector3()),originalTarget=light.target.getWorldPosition(new Vector3()),direction=originalTarget.clone().sub(originalPosition);
 if(direction.lengthSq()<1e-20)throw Error('Nonzero source sun direction required');direction.normalize();
 const up=Math.abs(direction.y)>.98?new Vector3(0,0,1):new Vector3(0,1,0),corners=boundsCorners(source.bounds);
 const minProjection=Math.min(...corners.map(p=>p.clone().sub(center).dot(direction))),distance=-minProjection+depthPadding+minNear;
 const cameraPosition=center.clone().addScaledVector(direction,-distance),camera=new OrthographicCamera(-1,1,1,-1,minNear,1000);
 camera.position.copy(cameraPosition);camera.up.copy(up);camera.lookAt(center);camera.updateMatrixWorld(true);
 const view=corners.map(p=>p.clone().applyMatrix4(camera.matrixWorldInverse)),min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
 view.forEach(p=>{min.min(p);max.max(p);});
 const left=min.x-padding,right=max.x+padding,bottom=min.y-padding,top=max.y+padding,near=Math.max(minNear,-max.z-depthPadding),far=-min.z+depthPadding;
 return {schema:'alice-directional-shadow-fit-v1',bounds:{min:source.bounds.min.toArray(),max:source.bounds.max.toArray()},models:source.models,indexedVertexReferences:source.indexedVertexReferences,
  originalPosition:originalPosition.toArray(),originalTarget:originalTarget.toArray(),direction:direction.toArray(),position:cameraPosition.toArray(),target:center.toArray(),up:up.toArray(),camera:{left,right,bottom,top,near,far},
  mapSize:[mapSize,mapSize],shadowType:PCFShadowMap,bias,normalBias,worldUnitsPerTexel:[(right-left)/mapSize,(top-bottom)/mapSize],
  qualification:'Static S5 raster shadow framing. PCF and chosen bias values require visual calibration; no Blender/Cycles or native rendering parity claim.'};
}
export function applyDirectionalShadowFit(light,fit){
 if(!light?.isDirectionalLight)throw Error('DirectionalLight required');
 const position=vec(fit.position,'shadow position'),target=vec(fit.target,'shadow target');
 if(light.parent){light.parent.updateWorldMatrix(true,false);light.parent.worldToLocal(position);}if(light.target.parent){light.target.parent.updateWorldMatrix(true,false);light.target.parent.worldToLocal(target);}
 light.position.copy(position);light.target.position.copy(target);light.castShadow=true;
 Object.assign(light.shadow.camera,fit.camera);light.shadow.camera.up.copy(vec(fit.up,'shadow up'));light.shadow.camera.updateProjectionMatrix();
 light.shadow.mapSize.fromArray(fit.mapSize);light.shadow.bias=fit.bias;light.shadow.normalBias=fit.normalBias;light.shadow.needsUpdate=true;
 light.updateWorldMatrix(true,false);light.target.updateWorldMatrix(true,false);light.shadow.updateMatrices(light);
 return light;
}

// Explicit Three raster policy proposal, not a recovered native/Cycles rule.
// Keep native cutout alpha maps in the automatic depth material; blended glass
// cannot produce transmissive colored shadows through a binary depth map.
export function proposeSourceShadowPolicy(mesh,entries){
 if(!mesh?.isMesh||!visible(mesh)||!mesh.geometry?.attributes.position)return {castShadow:false,receiveShadow:false,reason:'not-visible-source-mesh'};
 const blended=entries.some(e=>e.transparent===true&&(e.renderState&2)!==0);
 const cutout=entries.some(e=>!!e.alphaTexture&&(e.alphaTest??0)>0);
 return {castShadow:!blended,receiveShadow:true,reason:blended?'S5 proposal: blended glass has no transmissive PCF shadow parity; avoid an opaque depth wall':cutout?'Use existing alphaMap/alphaTest in automatic depth shader':'Opaque visible source geometry',preserveMaterialAlpha:true,transmissionShadowParity:false};
}
