import {Frustum,Group,InstancedMesh,Material,Matrix4,Mesh,WebGLCoordinateSystem} from 'three';
import {assertConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';

export const CONQUEST_PAWN_RENDER_BATCH_POLICY=Object.freeze({id:'s5-pawn-opaque-source-parts-instancing-v1',transparentPartsBatched:false,nativePixelParityQualified:false,nativeReady:false});
const owners=new WeakMap();
export function assertConquestPawnRenderBatch(owner,{scene}={}){
 const record=owners.get(owner);if(!record||record.disposed()||scene!==undefined&&record.scene!==scene||record.group.parent!==record.scene)throw Error('Actual live scene-owned Pawn render batch required');return owner;
}

const ignoredMaterialKeys=new Set(['uuid','version','_listeners']);
function materialEqual(a,b){
 if(a===b)return true;if(!a||!b||Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return false;
 const keys=Object.keys(a).filter(k=>!ignoredMaterialKeys.has(k));
 if(Object.keys(b).filter(k=>!ignoredMaterialKeys.has(k)).length!==keys.length)return false;
 for(const key of keys){
  const x=a[key],y=b[key];if(Object.is(x,y))continue;
  if(x?.isTexture||y?.isTexture)return false;
  if(x?.isColor&&y?.isColor){if(x.r!==y.r||x.g!==y.g||x.b!==y.b)return false;continue;}
  if(x?.isVector2&&y?.isVector2){if(x.x!==y.x||x.y!==y.y)return false;continue;}
  if(key==='userData'&&JSON.stringify(x)===JSON.stringify(y))continue;
  if(x?.isEuler&&y?.isEuler&&x.equals(y))continue;
  if(Array.isArray(x)&&Array.isArray(y)&&x.length===0&&y.length===0)continue;
  return false;
 }
 return true;
}
function bytesEqual(a,b){
 if(a.constructor!==b.constructor||a.length!==b.length||a.byteOffset%4||b.byteOffset%4||a.byteLength%4)return false;
 const left=new Uint32Array(a.buffer,a.byteOffset,a.byteLength/4),right=new Uint32Array(b.buffer,b.byteOffset,b.byteLength/4);
 for(let i=0;i<left.length;i++)if(left[i]!==right[i])return false;return true;
}
function attributeEqual(a,b){return a?.array&&b?.array&&a.itemSize===b.itemSize&&a.normalized===b.normalized&&a.count===b.count&&a.gpuType===b.gpuType&&bytesEqual(a.array,b.array);}
function geometryEqual(a,b){
 const keys=Object.keys(a.attributes);if(keys.length!==Object.keys(b.attributes).length||a.drawRange.start!==b.drawRange.start||a.drawRange.count!==b.drawRange.count||a.groups.length!==b.groups.length)return false;
 if(!!a.index!==!!b.index||a.index&&!attributeEqual(a.index,b.index))return false;
 for(const key of keys)if(!attributeEqual(a.attributes[key],b.attributes[key]))return false;
 for(let i=0;i<a.groups.length;i++){const x=a.groups[i],y=b.groups[i];if(x.start!==y.start||x.count!==y.count||x.materialIndex!==y.materialIndex)return false;}
 return true;
}
const materialsOf=mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material];
function visible(mesh,scene){for(let node=mesh;node;node=node.parent){if(!node.visible)return false;if(node===scene)return true;}return false;}
const matrixIdentity=new Matrix4();

// Explicit S5 presentation acceleration. Standard instanced shaders associate
// floating point operations differently from per-object modelView uniforms.
// Source meshes, independent mixers, physics and transparent sorting stay owned
// by their original actors. Only render submission borrows the opaque parts.
export function createConquestPawnRenderBatch({scene,capacity=48,enabled=true}={}){
 if(!scene?.isScene||!Number.isInteger(capacity)||capacity<1||capacity>48||typeof enabled!=='boolean')throw Error('Actual scene, bounded Pawn instance capacity1..48 and explicit boolean switch required');
 const group=new Group();group.name='S5 Pawn opaque render batch';group.visible=false;scene.add(group);
 const bindings=new Map(),batches=new Map(),hidden=[],frustum=new Frustum(),projection=new Matrix4();
 let disposed=false,active=false,last={batched:0,batchDraws:0,opaqueCandidates:0,transparentOriginal:0,fallbackOriginal:0},previousBefore=scene.onBeforeRender,previousAfter=scene.onAfterRender,passes=0,nestedFallbacks=0,totalBatched=0,peakBatched=0;
 const frames=[];
 function bindActor(owner){
  const actor=owner?.actor;assertConquestPawnActorRuntime(owner,{actor,model:actor?.model});
  if(disposed||active||owner.disposed||owner.runtime.disposed||!actor?.model||actor.model.monsterKey!==1003||actor.model.source!=='model/monster/pve_mon_pawn.scn'||actor.model.meshes.length!==9)throw Error('Actual live source Pawn1003 required outside render');
  const model=actor.model;if(bindings.has(actor))throw Error('Already bound');
  for(const mesh of model.meshes){
   const materials=materialsOf(mesh);if(materials.some(material=>material.transparent))continue;
   const index=mesh.userData.sourceModelIndex;
   if(!batches.has(index)){
    const geometry=mesh.geometry.clone(),ownedMaterials=materials.map(material=>material.clone()),instance=new InstancedMesh(geometry,Array.isArray(mesh.material)?ownedMaterials:ownedMaterials[0],capacity);
    instance.name='Pawn batch source part '+index;instance.count=0;instance.frustumCulled=false;instance.receiveShadow=mesh.receiveShadow;instance.castShadow=false;instance.renderOrder=mesh.renderOrder;instance.layers.mask=mesh.layers.mask;
    group.add(instance);batches.set(index,{geometry,materials:ownedMaterials,instance});
   }
  }
  if(bindings.size>=capacity||[...bindings.values()].some(entry=>entry.model===model))throw Error('Distinct current Pawn model within batch capacity required');
  bindings.set(actor,{owner,actor,model,meshes:[...model.meshes]});
 }
 function end(){
  for(const material of hidden)material.visible=true;hidden.length=0;group.visible=false;active=false;
 }
 function begin(camera){
  if(disposed)throw Error('Disposed batch');if(active)throw Error('Reentrant prototype render');
  active=true;last={batched:0,batchDraws:0,opaqueCandidates:0,transparentOriginal:0,fallbackOriginal:0};
  for(const batch of batches.values()){batch.instance.count=0;batch.instance.visible=false;}
  if(!enabled||scene.overrideMaterial||group.parent!==scene||!group.matrixWorld.equals(matrixIdentity)||!scene.matrixWorld.equals(matrixIdentity)||!camera.isPerspectiveCamera||camera.isArrayCamera)return;
  projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection,WebGLCoordinateSystem,camera.reversedDepth);
  const materialUsers=new Map();for(const entry of bindings.values())for(const mesh of entry.meshes)for(const material of materialsOf(mesh))materialUsers.set(material,(materialUsers.get(material)||0)+1);
  for(const entry of bindings.values()){
   const {owner,actor,model,meshes}=entry;
   if(owner.disposed||owner.runtime.disposed||actor.model!==model||actor.eligibleVirtual44===false||model.meshes.length!==meshes.length||model.meshes.some((mesh,i)=>mesh!==meshes[i]))continue;
   for(const mesh of meshes){
    if(!visible(mesh,scene)||!mesh.layers.test(camera.layers))continue;
    if(mesh.intersectsFrustum!==Mesh.prototype.intersectsFrustum){last.fallbackOriginal++;continue;}
    if(mesh.frustumCulled&&!mesh.intersectsFrustum(frustum))continue;
    const materials=materialsOf(mesh);
    if(materials.some(material=>material.transparent)){last.transparentOriginal++;continue;}
    last.opaqueCandidates++;
    const batch=batches.get(mesh.userData.sourceModelIndex);
    let parentOrder=false;for(let node=mesh.parent;node&&node!==scene;node=node.parent)if(node.isGroup&&node.renderOrder!==0){parentOrder=true;break;}
    if(!batch||batch.instance.parent!==group||!batch.instance.matrixWorld.equals(matrixIdentity)||batch.instance.geometry!==batch.geometry||batch.instance.frustumCulled!==false||batch.instance.castShadow!==false||materialsOf(batch.instance).length!==batch.materials.length||materialsOf(batch.instance).some((material,i)=>material!==batch.materials[i])||batch.instance.count>=capacity||parentOrder||mesh.isInstancedMesh||mesh.geometry.isInstancedBufferGeometry||mesh.isSkinnedMesh||mesh.morphTargetInfluences?.length||mesh.castShadow||mesh.receiveShadow!==batch.instance.receiveShadow||mesh.renderOrder!==batch.instance.renderOrder||mesh.layers.mask!==batch.instance.layers.mask||mesh.onBeforeRender!==Mesh.prototype.onBeforeRender||mesh.onAfterRender!==Mesh.prototype.onAfterRender||materials.length!==batch.materials.length||materials.some((material,i)=>materialUsers.get(material)!==1||material.opacity!==1||!material.visible||material.onBeforeRender!==Material.prototype.onBeforeRender||material.onBeforeCompile!==Material.prototype.onBeforeCompile||material.customProgramCacheKey!==Material.prototype.customProgramCacheKey||!materialEqual(material,batch.materials[i]))||!geometryEqual(mesh.geometry,batch.geometry)||mesh.matrixWorld.determinant()<=0){last.fallbackOriginal++;continue;}
    batch.instance.setMatrixAt(batch.instance.count,mesh.matrixWorld);batch.instance.count++;
    // Source ModelData nodes have drawable descendants, including the additive
    // eye. Hiding an ancestor mesh would suppress those children as well.
    for(const material of materials){material.visible=false;hidden.push(material);}last.batched++;
   }
  }
  for(const batch of batches.values())if(batch.instance.count){batch.instance.visible=true;batch.instance.instanceMatrix.needsUpdate=true;last.batchDraws+=batch.geometry.groups.length||1;}
  totalBatched+=last.batched;peakBatched=Math.max(peakBatched,last.batched);
  group.visible=true;
 }
 function before(renderer,currentScene,camera,...args){
  if(disposed)return previousBefore.call(this,renderer,currentScene,camera,...args);
  // Nested rendering of this same scene uses its original meshes. Suspend the
  // outer material mask and restore it after the inner pass, without repacking
  // or overwriting the outer instance buffer. Ordinary multipasses pack afresh.
  const suspended=active?{materials:[...hidden],groupVisible:group.visible}:null;
  if(suspended){end();nestedFallbacks++;}
  try{
   previousBefore.call(this,renderer,currentScene,camera,...args);
   if(!suspended)begin(camera);passes++;frames.push(suspended);
  }catch(error){end();if(suspended){for(const material of suspended.materials){material.visible=false;hidden.push(material);}group.visible=suspended.groupVisible;active=true;}throw error;}
 }
 function after(...args){
  if(disposed)return previousAfter.apply(this,args);
  const suspended=frames.pop();end();
  try{return previousAfter.apply(this,args);}finally{if(suspended){for(const material of suspended.materials){material.visible=false;hidden.push(material);}group.visible=suspended.groupVisible;active=true;}}
 }
 scene.onBeforeRender=before;scene.onAfterRender=after;
 const api=Object.freeze({
  bindActor,
  setEnabled(value){if(disposed||active||frames.length||typeof value!=='boolean')throw Error('Boolean batch switch outside a live render pass required');enabled=value;return enabled;},
  unbindActor(actor){if(active||frames.length)throw Error('Unbind outside render');return bindings.delete(actor);},
  readActorLeases(actor){return !disposed&&bindings.has(actor)?[api]:[];},
  snapshot(){return {...last,bound:bindings.size,active,enabled,passes,nestedFallbacks,totalBatched,peakBatched,capacity,policy:CONQUEST_PAWN_RENDER_BATCH_POLICY,nativeReady:false,instancingArithmeticQualified:false};},
  dispose(){if(disposed)return;end();if(scene.onBeforeRender===before)scene.onBeforeRender=previousBefore;if(scene.onAfterRender===after)scene.onAfterRender=previousAfter;group.removeFromParent();for(const batch of batches.values()){batch.geometry.dispose();for(const material of batch.materials)material.dispose();batch.instance.dispose();}bindings.clear();batches.clear();disposed=true;},
 });
 owners.set(api,{scene,group,disposed:()=>disposed});return api;
}
