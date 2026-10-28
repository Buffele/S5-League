import {AdditiveBlending,Box3,BufferGeometry,Float32BufferAttribute,Group,Matrix4,Object3D,Vector3} from 'three';
import {WeaponTrail} from './weapon-trail.js';
import {IRON_BOOTS_TRAIL_WINDOWS} from './iron-boots-effects.js';
import {nominalActorTrailWindow} from './actor-trail-window.js';
import {createTrailMeshWarmup} from './trail-mesh-warmup.js';

const FOOT_SOURCE='model/character/foot/ironboots_n_01_foot.scn';
const FOOT_MODEL='ironBoots_normal_foot';
// Lua supplies names/windows, but current ghost_trail.x7 has no matching Iron
// Boots definitions (its type43 row names GhostTrail_sigma_blade_02). Thus this
// suffix-to-side assignment is explicit S5 reconstruction, not native proof.
// Actual geometry selection below is from the exact actor-skinned foot model
// and its authored Foot/Toe0 weights, never the first weapon/leg mesh.
export const IRON_BOOTS_TRAIL_BINDINGS=Object.freeze([
 Object.freeze({side:'right',suffix:'1',foot:'Bip01 R Foot',toe:'Bip01 R Toe0',source:FOOT_SOURCE,model:FOOT_MODEL}),
 Object.freeze({side:'left',suffix:'2',foot:'Bip01 L Foot',toe:'Bip01 L Toe0',source:FOOT_SOURCE,model:FOOT_MODEL}),
]);
export function ironBootsTrailWindow(attack,side){
 if(attack?.weapon!=='ironboots')return false;
 const binding=IRON_BOOTS_TRAIL_BINDINGS.find(b=>b.side===side);if(!binding)throw new RangeError('Unknown Iron Boots trail side');
 const windows=attack.kind==='light'?IRON_BOOTS_TRAIL_WINDOWS.light[attack.comboIndex??0]:IRON_BOOTS_TRAIL_WINDOWS[attack.kind];
 const timeMs=attack.timeMs??(attack.time??0)*1000;
 return !!windows?.some(w=>w.name.endsWith('_'+binding.suffix)&&nominalActorTrailWindow(timeMs,w));
}

export function footEndpoints(mesh,binding){
 const skeleton=mesh.skeleton,foot=skeleton.bones.findIndex(b=>b.name===binding.foot),toe=skeleton.bones.findIndex(b=>b.name===binding.toe);
 if(foot<0||toe<0)throw Error(`Missing Iron Boots ${binding.side} actor Foot/Toe0 skin bones`);
 const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
 if(!position||!skinIndex||!skinWeight)throw Error('Iron Boots foot mesh requires position and skin weights');
 const intoFoot=new Matrix4().multiplyMatrices(skeleton.boneInverses[foot],mesh.bindMatrix),points=[],bounds=new Box3();
 for(let index=0;index<position.count;index++){
  let weight=0;
  for(let slot=0;slot<skinIndex.itemSize;slot++){
   const bone=skinIndex.array[index*skinIndex.itemSize+slot];
   if(bone===foot||bone===toe)weight+=skinWeight.array[index*skinWeight.itemSize+slot];
  }
  if(weight<.5)continue;
  const p=new Vector3().fromBufferAttribute(position,index).applyMatrix4(intoFoot);
  points.push({index,p});bounds.expandByPoint(p);
 }
 if(points.length<2)throw Error(`Missing Iron Boots ${binding.side} weighted foot vertices`);
 const size=bounds.getSize(new Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
 points.sort((a,b)=>a.p[axis]-b.p[axis]||a.index-b.index);
 if(points.at(-1).p[axis]-points[0].p[axis]<1e-8)throw Error(`Degenerate Iron Boots ${binding.side} foot geometry`);
 return {indices:[points[0].index,points.at(-1).index],weightedVertexCount:points.length,axis};
}

export class IronBootsTrails {
 constructor(avatar,{texture=null,capacity=32,lifetime=.12}={}){
  const candidates=avatar.meshes.filter(m=>m.userData.weapon&&m.userData.source===FOOT_SOURCE&&m.name===FOOT_MODEL);
  if(candidates.length!==1||!candidates[0].isSkinnedMesh)throw Error('Expected the exact Iron Boots actor-skinned foot mesh');
  this.footMesh=candidates[0];
  // Validate both sides before allocating GPU-backed ribbon resources.
  const endpoints=IRON_BOOTS_TRAIL_BINDINGS.map(b=>footEndpoints(this.footMesh,b));
  this.mesh=new Group();this.mesh.name='iron-boots-motion-trails';this.proxies=new WeakMap();this.warmup=createTrailMeshWarmup(this.mesh);
  this.trails=endpoints.map((endpoint,i)=>{
   const binding=IRON_BOOTS_TRAIL_BINDINGS[i],carrier=new Object3D();carrier.name=binding.foot;
   carrier.geometry=new BufferGeometry();carrier.geometry.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0],3));
   const trail=new WeaponTrail(carrier,{weapon:'ironboots',texture:Array.isArray(texture)?texture[i]:texture,capacity,lifetime,blending:AdditiveBlending});
   trail.mesh.name=`iron-boots-${binding.side}-trail`;trail.binding=binding;trail.endpointIndices=endpoint.indices;
   trail.endpointSelection={weightedVertexCount:endpoint.weightedVertexCount,axis:endpoint.axis,policy:'Foot/Toe0 combined skin weight >= .5; bind-foot-local longest-axis extrema'};
   this.mesh.add(trail.mesh);return trail;
  });
 }
 update(dt,attack,options={}){
  if(options.cancel){this.clear();return;}
  if(dt<=0)return;
  let proxies=null;
  if(attack?.weapon==='ironboots'){
   proxies=this.proxies.get(attack);
   if(!proxies){proxies=[{},{}];this.proxies.set(attack,proxies);}
  }
  // getVertexPosition applies current skinning; matrixWorld alone would leave
  // a skinned boot's endpoints behind while the actor's feet rotate or kick.
  this.footMesh.updateWorldMatrix(true,false);this.footMesh.skeleton.update();
  for(const [i,trail] of this.trails.entries()){
   const active=ironBootsTrailWindow(attack,trail.binding.side);
   if(active){
    this.footMesh.getVertexPosition(trail.endpointIndices[0],trail.base).applyMatrix4(this.footMesh.matrixWorld);
    this.footMesh.getVertexPosition(trail.endpointIndices[1],trail.tip).applyMatrix4(this.footMesh.matrixWorld);
   }
   // WeaponTrail's existing renderer is reused as a ribbon only. Its Twin
   // gate is held open/closed by the exact per-foot window above; no gameplay
   // attack, clock, weapon ID or contact ledger is modified.
   const proxy=proxies?.[i]??null;
   if(proxy)Object.assign(proxy,{weapon:'twinblade',kind:'light',time:active ? .1 : .9});
   trail.update(dt,proxy,options);
  }
 }
 clear(){for(const trail of this.trails)trail.clear();}
 dispose(){for(const trail of this.trails){trail.dispose();trail.weapon.geometry.dispose();}this.mesh.removeFromParent();}
}

export const IRON_BOOTS_TRAIL_LIMITS=Object.freeze([
 'Two S5 geometry-derived ribbons, not the native GhostTrail Line renderer, tessellation, texture mapping or lifetime.',
 'Source suffix1 maps to right foot and suffix2 to left as explicit reconstruction; current ghost_trail.x7 lacks these names.',
 'Source600,600 means delay600 plus duration600, not an empty window; elapsed-time gating remains nominal rather than the native uint32 wrapper activation cadence. No trail is added to boost/dash states without declarations.',
 'Additive composition keeps the existing RGB gi ribbon luminous without an opaque black background. This is an S5 reconstruction policy; exact native Iron Boots texture/blend binding remains unresolved.',
]);
