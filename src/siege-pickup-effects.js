import * as THREE from 'three';
import {Particles} from './combat-effects.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import {readAsset} from './scene-assets.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

const BASE='/assets/siege-pickup-effects/';
export const SIEGE_PICKUP_PRESENTATION=Object.freeze({source:'7D7CB0 item_get.seq at item+38, Y+80; 7D8140 item_drop.ogg on first contact',offsetNative:80,durationMs:2000,nativePlaybackVerified:false,particleRenderer:'shared S5 particles; emitter-key speed/acceleration; mode0 half-extents; RNG, motion flags and native rendering parity unverified'});
export function siegePickupDefinition(raw,manifest){
 if(raw.source!=='effects/item_get.seq'||!raw.coverage?.reachesExactEof||raw.header.byteField!==0||raw.header.durationField!==2000||raw.nodes.length!==8)throw Error('Exact eight-node Siege pickup sequence required');
 const converted=convertParticleSequence(raw,BASE);
 return {...converted,nodes:converted.nodes.map((node,index)=>{
  if(node.parentType!==0||node.parent!==0||node.bone!==''||node.emitterKeys.length!==1||node.textures.length!==1||node.widthVariation!==0||node.heightVariation!==0||node.start<0||node.end>2)throw Error('Unsupported Siege pickup particle branch');
  const binding=manifest.bindings.find(b=>b.owner===raw.source&&b.sourceLiteral===raw.nodes[index].fields.textures.entries[0].path.value&&b.kind==='texture');
  const asset=manifest.assets.find(a=>a.source===binding?.selectedPath);
  if(!asset?.file.endsWith('.png'))throw Error('Authenticated Siege pickup texture required');
  const key=node.emitterKeys[0];
  // Birth reads emitter+30 and emitter+48/4c/50, rather than the older shared
  // converter's primary-word motion projection. Keep all eight source nodes.
  return {...node,speed:key['object+30'],acceleration:['48','4c','50'].map(k=>key['object+'+k]),textures:[BASE+asset.file]};
 })};
}
const releaseEmitter=e=>{e.clear();e.mesh.removeFromParent();e.geometry.dispose();e.materials.forEach(m=>m.dispose());e.maps.forEach(m=>m.dispose());};
export function createSiegePickupEffects({scene,read=readAsset,loadTexture=url=>new THREE.TextureLoader().loadAsync(url),random=Math.random}={}){
 if(!scene?.isObject3D)throw Error('Siege pickup scene required');
 let disposed=false,definition=null,visible=true,error=null,status='loading',serial=0;
 const textures=new Map(),active=new Map();
 const ready=Promise.all([read(BASE+'effects/item_get.seq.json'),read(BASE+'manifest.json')]).then(async([raw,manifest])=>{
  definition=siegePickupDefinition(raw,manifest);
  const loaded=await Promise.allSettled([...new Set(definition.nodes.flatMap(n=>n.textures))].map(async url=>({url,map:await loadTexture(url)})));
  for(const result of loaded)if(result.status==='fulfilled'){const {url,map}=result.value;if(disposed)map.dispose();else textures.set(url,map);}
  if(disposed)return false;
  const failed=loaded.find(r=>r.status==='rejected');if(failed)throw failed.reason;
  status='ready';for(const cue of active.values())instantiate(cue);return true;
 }).catch(reason=>{if(!disposed){status='error';error=String(reason.message??reason);for(const texture of textures.values())texture.dispose();textures.clear();for(const cue of active.values())release(cue);active.clear();}return false;});
 function release(cue){for(const e of cue.emitters??[])releaseEmitter(e);}
 function instantiate(cue){
  if(cue.emitters||cue.age>=2)return;
  cue.emitters=definition.nodes.map(node=>{
   const maps=node.textures.map(url=>textures.get(url).clone()),e=new Particles(node,maps,{random});e.maps=maps;e.mesh.name='siege-pickup-'+cue.serial+'-'+node.id;
   // All source nodes have exactly one texture. An array material with no
   // initial geometry groups never reaches onBeforeRender in Three's render
   // list, so it cannot produce its first billboard vertices.
   e.mesh.material=e.materials[0];
   e.mesh.onBeforeRender=(_renderer,_scene,camera)=>drawEmitter(e,camera);scene.add(e.mesh);return e;
  });
  let milliseconds=Math.round(cue.age*1000);cue.age=0;
  while(milliseconds>0){const delta=Math.min(8,milliseconds);advance(cue,delta/1000);milliseconds-=delta;}
 }
 function drawEmitter(e,camera){
  // Shared billboards take full widths. Source mode0 stores half-extents.
  const scale=e.config.native['18']===0?2:1;
  for(const p of e.particles){p.size.width*=scale;p.size.height*=scale;}
  try{e.render(camera);}finally{for(const p of e.particles){p.size.width/=scale;p.size.height/=scale;}}
 }
 function advance(cue,dt){
  cue.age+=dt;
  for(const e of cue.emitters??[]){e.update(dt,{matrix:cue.matrix,position:cue.position,sprinting:cue.age>=e.config.start&&cue.age<=e.config.end});e.mesh.visible=visible&&e.particles.length>0;}
 }
 return {ready,
  collect({position,record}){
   // The native consumer7D8593 compares the recipient with the local actor
   // before virtual+10 dispatches this effect. No bot-local feedback invented.
   if(disposed||status==='error'||record?.id!=='local')return false;
   if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw Error('Actual collected-item position required');
   const point=new THREE.Vector3(...position);point.y+=80*SCN_SCENE_SCALE;
   const cue={serial:++serial,age:0,position:point,matrix:new THREE.Matrix4().makeTranslation(point.x,point.y,point.z),emitters:null};active.set(cue.serial,cue);if(status==='ready')instantiate(cue);return true;
  },
  step(dt){if(disposed)return;if(!Number.isFinite(dt)||dt<0||dt>1/30)throw Error('Bounded pickup simulation delta required');for(const [id,cue]of active){advance(cue,dt);if(cue.age>=2){release(cue);active.delete(id);}}},
  render({visible:show=true}={}){visible=show;for(const cue of active.values())for(const e of cue.emitters??[])e.mesh.visible=show&&e.particles.length>0;},
  reset(){for(const cue of active.values())release(cue);active.clear();},
  snapshot(){return {status,error,disposed,policy:SIEGE_PICKUP_PRESENTATION,active:[...active.values()].map(c=>({id:c.serial,age:c.age,position:c.position.toArray(),nodes:c.emitters?.map(e=>({id:e.config.id,particles:e.particles.length,speed:e.config.speed,acceleration:e.config.acceleration,visible:e.mesh.visible,drawVertices:e.geometry.drawRange.count}))??[]}))};},
  dispose(){if(disposed)return;this.reset();disposed=true;for(const map of textures.values())map.dispose();textures.clear();status='disposed';},
 };
}
