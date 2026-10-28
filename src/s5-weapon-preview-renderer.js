import * as THREE from 'three';
import {createS5WeaponPreviewModel} from './s5-weapon-preview-model.js';

const WIDTH=256,HEIGHT=160;
// A static inventory image service. The host requests visible weapons only;
// this service owns one lazy context and no continuous animation loop.
export function createS5WeaponPreviewRenderer({readSource,document:doc=globalThis.document,
 rendererFactory=options=>new THREE.WebGLRenderer(options),
 raf=callback=>globalThis.requestAnimationFrame(callback),cancel=id=>globalThis.cancelAnimationFrame(id)}={}){
 if(typeof readSource!=='function'||!doc?.createElement||typeof rendererFactory!=='function'||typeof raf!=='function'||typeof cancel!=='function')throw new TypeError('Weapon source, document and scheduling ports are required');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,WIDTH/HEIGHT,.01,100);
 const ambient=new THREE.AmbientLight(0xffffff,1.5),key=new THREE.DirectionalLight(0xffffff,2.5);scene.add(ambient,key,key.target);
 const queue=[],pending=new Map(),cache=new Map(),errors=[];
 let renderer=null,canvas=null,scheduled=null,running=false,disposed=false,rendererAttempted=false,rendererCreations=0,renderCount=0,cacheHits=0,failed=0;
 function report(){return {width:WIDTH,height:HEIGHT,disposed,rendererCreated:renderer!==null,rendererAttempted,rendererCreations,renderCount,cacheHits,queued:queue.length,pending:pending.size,cacheEntries:cache.size,cachedImages:[...cache.values()].filter(Boolean).length,failed,errors:errors.map(row=>({...row}))};}
 function failure(weapon,error){failed++;errors.push({weapon,error:String(error?.message??error)});if(errors.length>8)errors.shift();}
 function releaseRenderer(){const owned=renderer,ownedCanvas=canvas;renderer=null;canvas=null;try{owned?.dispose();}finally{try{owned?.forceContextLoss?.();}finally{ownedCanvas?.remove?.();}}}
 function ensureRenderer(){
  if(renderer)return renderer;
  if(rendererAttempted)throw Error('Weapon preview renderer is unavailable');
  rendererAttempted=true;canvas=doc.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
  try{renderer=rendererFactory({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});rendererCreations++;renderer.setPixelRatio(1);renderer.setSize(WIDTH,HEIGHT,false);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;return renderer;}
  catch(error){try{releaseRenderer();}catch{}throw error;}
 }
 function frame(model){
  if(!model?.root?.isObject3D||typeof model.bounds!=='function'||typeof model.dispose!=='function')throw Error('Actual owned weapon preview model required');
  const bounds=model.bounds();
  if(!bounds?.isBox3||bounds.isEmpty()||![...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite))throw Error('Finite weapon preview bounds required');
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),radius=size.length()/2;
  if(!center.toArray().every(Number.isFinite)||!Number.isFinite(radius)||radius<=0)throw Error('Nonempty weapon preview geometry required');
  // View across the longest axis so swords and rifles retain their silhouette.
  const direction=(size.z>=size.x&&size.z>=size.y?new THREE.Vector3(1,.4,.15):size.x>=size.y?new THREE.Vector3(.15,.4,1):new THREE.Vector3(1,.35,1)).normalize();
  const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right),tanHalf=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  let distance=0,minDepth=Infinity,maxDepth=-Infinity;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const corner=new THREE.Vector3(x,y,z).sub(center),depth=corner.dot(direction);minDepth=Math.min(minDepth,depth);maxDepth=Math.max(maxDepth,depth);
   distance=Math.max(distance,depth+Math.abs(corner.dot(right))*1.1/(tanHalf*camera.aspect),depth+Math.abs(corner.dot(up))*1.1/tanHalf);
  }
  distance=Math.max(distance,maxDepth+radius*.01);
  camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);
  camera.near=(distance-maxDepth)*.5;camera.far=distance-minDepth+radius*.05;
  if(!camera.position.toArray().every(Number.isFinite)||!Number.isFinite(camera.near)||!Number.isFinite(camera.far)||camera.near<=0||camera.far<=camera.near)throw Error('Finite weapon preview camera required');
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  key.position.copy(center).add(new THREE.Vector3(radius*3,radius*4,radius*5));key.target.position.copy(center);
  scene.add(model.root);scene.updateMatrixWorld(true);
 }
 function settle(job,value){if(pending.get(job.weapon)!==job)return;pending.delete(job.weapon);if(!disposed)cache.set(job.weapon,value);job.resolve(disposed?null:value);}
 function schedule(){
  if(disposed||running||scheduled!==null||!queue.length)return;
  try{scheduled=raf(renderNext);}catch(error){for(const job of queue.splice(0)){failure(job.weapon,error);settle(job,null);}}
 }
 function renderNext(){
  scheduled=null;if(disposed)return;const job=queue.shift();if(!job)return;running=true;
  let model=null,result=null;
  try{
   const source=readSource(job.weapon);if(disposed)return;if(!source)throw Error('Weapon model is unavailable');
   model=typeof source.createModel==='function'?source.createModel():createS5WeaponPreviewModel(source);
   if(disposed)return;frame(model);if(disposed)return;
   const output=ensureRenderer();output.render(scene,camera);renderCount++;
   if(!disposed){result=output.domElement.toDataURL('image/png');if(typeof result!=='string'||!result.startsWith('data:image/png;base64,'))throw Error('Weapon preview image capture failed');}
  }catch(error){result=null;if(!disposed)failure(job.weapon,error);}
  finally{
   if(model){try{try{model.root?.removeFromParent?.();}finally{model.dispose();}}catch(error){result=null;if(!disposed)failure(job.weapon,error);}}
   settle(job,result);running=false;
   if(disposed){try{releaseRenderer();}catch{}}else schedule();
  }
 }
 return Object.freeze({
  invalidate(weapon){
   cache.delete(weapon);const job=pending.get(weapon);
   if(job){pending.delete(weapon);const index=queue.indexOf(job);if(index>=0)queue.splice(index,1);job.resolve(null);}
  },
  getPreview(weapon){
   if(disposed||typeof weapon!=='string'||!weapon)return Promise.resolve(null);
   if(cache.has(weapon)){cacheHits++;return Promise.resolve(cache.get(weapon));}
   if(pending.has(weapon))return pending.get(weapon).promise;
   let resolve;const promise=new Promise(done=>{resolve=done;}),job={weapon,promise,resolve};pending.set(weapon,job);queue.push(job);schedule();return promise;
  },report,
  dispose(){
   if(disposed)return;disposed=true;if(scheduled!==null){try{cancel(scheduled);}catch{}scheduled=null;}
   queue.length=0;for(const job of pending.values())job.resolve(null);pending.clear();cache.clear();
   if(!running){try{releaseRenderer();}catch{}}
  },
 });
}
