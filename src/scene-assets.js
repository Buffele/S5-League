import * as THREE from 'three';
import {createResourceCache} from './resource-cache.js';
import {loadValidatedAssetJson} from './persistent-asset-json.js';
const loader=new THREE.TextureLoader();
const textureCache=createResourceCache(async url=>{const t=await loader.loadAsync(url);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;});
export const readAsset=createResourceCache(loadValidatedAssetJson);
export function sceneTexture(source,state){
 if(!source||!(state&2048))return source;
 // S5Runtime disables mipmaps on fine cutout meshes such as Station 2 grating.
 // Clone the sampler so another material sharing this image keeps its flags.
 const map=source.clone();map.generateMipmaps=false;map.minFilter=THREE.LinearFilter;
 map.needsUpdate=true;return map;
}
async function texture(url){
 if(!url)return null;
 return textureCache(url);
}
export function modelGeometry(model){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(model.vertices,3));g.setIndex(model.indices);
 if(model.uv.length===model.vertices.length/3*2)g.setAttribute('uv',new THREE.Float32BufferAttribute(model.uv,2));
 if(model.uv2?.length===model.vertices.length/3*2)g.setAttribute('uv1',new THREE.Float32BufferAttribute(model.uv2,2));
 if(model.normals.length===model.vertices.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(model.normals,3));else g.computeVertexNormals();
 model.textures.forEach((t,i)=>g.addGroup(t.start*3,t.count*3,i));return g;
}
export async function sceneAsset(data,{effect=false,sky=false}={}){
 const group=new THREE.Group(),meshes=[],tracks=[];let duration=0;
 await Promise.all(data.models.map(async (model,sourceModelIndex)=>{
  if(!model.vertices.length)return;
  const state=model.renderState||0;
  const materials=await Promise.all(model.textures.map(async t=>{
   const map=sceneTexture(await texture(t.name),state),lightMap=await texture(t.lightmap),transparent=effect||!!(state&34);
   if(lightMap){lightMap.channel=1;lightMap.colorSpace=THREE.NoColorSpace;}
   const options={map,side:THREE.DoubleSide,transparent,alphaTest:transparent?.015:.4,depthWrite:!effect&&!(state&64),fog:!sky&&!(state&512),color:0xffffff};
   if(effect||state&1||sky)return new THREE.MeshBasicMaterial({...options,blending:effect||state&32?THREE.AdditiveBlending:THREE.NormalBlending});
   if(lightMap)return new THREE.MeshLambertMaterial({...options,lightMap,lightMapIntensity:.7});
   return new THREE.MeshLambertMaterial(options);
  }));
  const mesh=new THREE.Mesh(modelGeometry(model),materials.length?materials:new THREE.MeshBasicMaterial({color:0x778899,side:THREE.DoubleSide}));
  mesh.name=model.name;new THREE.Matrix4().fromArray(model.matrix).decompose(mesh.position,mesh.quaternion,mesh.scale);
  mesh.userData.sourceModelIndex=sourceModelIndex;mesh.userData.source=data.source;mesh.userData.collision=/^oct_/i.test(model.name)&&!/^oct_weapon/i.test(model.name);
  mesh.visible=!/^oct_|occlusion|sector/i.test(model.name);
  mesh.receiveShadow=!sky;group.add(mesh);meshes.push(mesh);
  if(effect){
   const a=Object.values(model.animations||{}).find(Boolean);
   if(a){duration=Math.max(duration,a.durationTicks/4800);
    for(const [property,key,single,Track] of [['position','positions','position',THREE.VectorKeyframeTrack],['quaternion','rotations','rotation',THREE.QuaternionKeyframeTrack],['scale','scales','scale',THREE.VectorKeyframeTrack]]){
     const frames=a[key]||[];tracks.push(new Track(`${mesh.uuid}.${property}`,frames.length?frames.map(f=>f[0]/4800):[0],frames.length?frames.flatMap(f=>f.slice(1)):a[single]));
    }
   }
  }
 }));
 group.updateMatrixWorld(true);
 return {group,meshes,clip:tracks.length?new THREE.AnimationClip('effect',duration,tracks):null};
}
export function collisionTriangles(meshes){
 const triangles=[];
 for(const mesh of meshes.filter(m=>m.userData.collision)){
  mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const oneWayTop=mesh.userData.oneWayTop,up=oneWayTop?new THREE.Vector3(0,1,0).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)):null;
  for(let i=0;i<index.count;i+=3){
   const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index.getX(i+j)).applyMatrix4(mesh.matrixWorld));
   const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));
   if(normal.lengthSq()<=1e-14)continue;
   // A designated one-way lip contributes only its top; its visible box must
   // not become a ceiling or side wall when the player jumps from below.
   if(oneWayTop&&normal.clone().normalize().dot(up)<.999)continue;
   const points=v.map(x=>x.toArray());if(oneWayTop)points.oneWay=true;
   triangles.push(points);
  }
 }
 return triangles;
}
