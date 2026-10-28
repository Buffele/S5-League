import {AdditiveBlending,Box3,Matrix4,Vector3} from 'three';

// Lighting is an artistic runtime adaptation. It never creates a collision
// surface and only marks meshes supplied by the reconstruction transaction.
export function configureReconstructionShadows(world,meshes,config){
 if(config?.enabled!==true)return{dispose(){},snapshot:()=>({enabled:false})};
 if(world.nativeMapId!==15)throw Error('Reconstruction shadows require Azit');
 const light=world.localLights?.children.find(o=>o.isDirectionalLight);
 if(!light||light.castShadow||![1024,2048,4096].includes(config.mapSize))throw Error('Explicit unused reconstructed sun and shadow budget required');
 const own=[...new Set(meshes)],source=new Set(world.sourceMeshes);
 if(!own.length||own.some(o=>!o.isMesh||source.has(o)))throw Error('Reconstructed shadow meshes must exclude native sources');
 const bias=config.bias??-.0005,normalBias=config.normalBias??.18;
 if(!Number.isFinite(bias)||!Number.isFinite(normalBias)||Math.abs(bias)>.005||normalBias<0||normalBias>.5)throw Error('Invalid reconstruction shadow bias');
 world.root.updateMatrixWorld(true);
 const box=new Box3();for(const mesh of own)box.expandByObject(mesh);
 if(box.isEmpty()||!box.min.toArray().concat(box.max.toArray()).every(Number.isFinite))throw Error('Finite reconstructed shadow bounds required');
 const saved={position:light.position.clone(),target:light.target.position.clone(),castShadow:light.castShadow,camera:light.shadow.camera.clone(),mapSize:light.shadow.mapSize.clone(),bias:light.shadow.bias,normalBias:light.shadow.normalBias,autoUpdate:light.shadow.autoUpdate,needsUpdate:light.shadow.needsUpdate,map:light.shadow.map,mapPass:light.shadow.mapPass,meshes:own.map(mesh=>({mesh,cast:mesh.castShadow,receive:mesh.receiveShadow}))};
 const direction=light.position.clone().sub(light.target.position).normalize(),center=box.getCenter(new Vector3()),distance=Math.max(200,box.getSize(new Vector3()).length()+10);
 light.position.copy(center).addScaledVector(direction,distance);light.target.position.copy(center);light.target.updateMatrixWorld(true);light.updateMatrixWorld(true);
 const view=new Matrix4().lookAt(light.position,center,new Vector3(0,1,0));view.setPosition(light.position);view.invert();const projected=new Box3();
 for(let i=0;i<8;i++)projected.expandByPoint(new Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(view));
 Object.assign(light.shadow.camera,{left:projected.min.x-1,right:projected.max.x+1,bottom:projected.min.y-1,top:projected.max.y+1,near:Math.max(.1,-projected.max.z-5),far:-projected.min.z+5});light.shadow.camera.updateProjectionMatrix();
 light.castShadow=true;light.shadow.mapSize.set(config.mapSize,config.mapSize);light.shadow.bias=bias;light.shadow.normalBias=normalBias;light.shadow.autoUpdate=true;light.shadow.needsUpdate=true;
 for(const mesh of own){
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  // Source-qualified additive indicators are luminous graphics. Their black
  // RGB background contributes no color and must not cast an opaque quad.
  mesh.castShadow=!materials.some(m=>m.blending===AdditiveBlending);
  mesh.receiveShadow=!materials.every(m=>m.isMeshBasicMaterial);
 }
 let disposed=false;
 return{snapshot:()=>({enabled:true,disposed,meshes:own.length,mapSize:config.mapSize,sourceMeshesChanged:false,qualification:'One artist sun, original direction preserved; runtime shadow calibration, not native S5Runtime lighting parity.'}),dispose(){
  if(disposed)return;disposed=true;
  for(const row of saved.meshes){row.mesh.castShadow=row.cast;row.mesh.receiveShadow=row.receive;}
  if(light.shadow.map&&light.shadow.map!==saved.map)light.shadow.map.dispose();if(light.shadow.mapPass&&light.shadow.mapPass!==saved.mapPass)light.shadow.mapPass.dispose();
  light.position.copy(saved.position);light.target.position.copy(saved.target);light.castShadow=saved.castShadow;light.shadow.camera.copy(saved.camera);light.shadow.mapSize.copy(saved.mapSize);light.shadow.bias=saved.bias;light.shadow.normalBias=saved.normalBias;light.shadow.autoUpdate=saved.autoUpdate;light.shadow.needsUpdate=saved.needsUpdate;light.shadow.map=saved.map;light.shadow.mapPass=saved.mapPass;light.updateMatrixWorld(true);light.target.updateMatrixWorld(true);
 }};
}
