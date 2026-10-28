import * as THREE from 'three';
import {readAsset,sceneAsset} from './scene-assets.js';
import {prepareEffectScene} from './effect-scene.js';
import {SiegeSupplies,SIEGE_SUPPLY_NAMES} from './siege-supplies.js';
import {siegeSupplyContact} from './siege-supply-contact.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {SiegeSupplyCollision} from './siege-supply-collision.js';
import {SIEGE_SUPPLY_FLIGHT,supplyLaunchVelocity,advanceSupplyVelocity,supplyContactVelocity} from './siege-supply-flight.js';
import {supplyLaunchAngles} from './siege-supply-random.js';

const models={hp:'hp',sp:'sp',pen:'pen',exp:'exp',reloadmmo:'magazine',game_score:'score'};
const release=effect=>{effect.group.removeFromParent();for(const mesh of effect.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}};
async function loadSupply(data){
 if(data.models.length!==1||data.nodes.some(n=>n.type!=='ModelData')||data.rootNode?.matrix?.some((v,i)=>v!==(i%5===0?1:0)))throw Error('Unsupported supply source hierarchy');
 const loaded=await sceneAsset(data),effect=prepareEffectScene(data,loaded.group,loaded.meshes,{animation:data.clips[0].name,loop:true});
 // Closed supply shells have consistently outward triangle normals. Their
 // reverse faces otherwise cover the inset icon with the dark backing.
 for(const mesh of loaded.meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.side=THREE.FrontSide;
 return effect;
}
export function createSiegeSupplyWorld({scene,world,zones,records,onCollect=()=>{},onContact=()=>{},random=Math.random,launchAngles=null,read=readAsset,load=loadSupply}){
 const supplies=new SiegeSupplies({random}),slots=new Map(),pending=[];
 const radius=SIEGE_SUPPLY_FLIGHT.radiusNative*SCN_SCENE_SCALE;
 // Source pre-slide/slide arithmetic over the explicit S5 terrain query.
 // Character collision behavior and native query-readiness gates are unchanged.
 const solver=new SiegeSupplyCollision(world,{x:radius,y:radius,z:radius});
 // Each item seeds its own source generator, independent of reward selection
 // and frame order. Explicit angle injection remains available to fixtures.
 const angles=launchAngles??supplyLaunchAngles;
 let disposed=false,age=0,frameRemainder=0,queueClock=0;
 function clear(slot){slot.token=null;if(slot.effect)release(slot.effect);slot.anchor.removeFromParent();}
 function reset(){for(const slot of slots.values())clear(slot);slots.clear();supplies.reset();pending.length=0;age=0;frameRemainder=0;queueClock=0;}
 function visual(slot,phase){
  if(slot.phase===phase)return;slot.phase=phase;slot.source=`effects/item_${models[slot.item.effect]}_${phase}.scn`;
  if(slot.effect){release(slot.effect);slot.effect=null;}slot.token={};const token=slot.token;slot.born=age;
  read('/assets/siege-supplies/'+slot.source+'.json').then(data=>{
   if(data.source!==slot.source)throw Error('Supply source mismatch');return load(data);
  }).then(effect=>{
   if(disposed||slot.token!==token){release(effect);return;}
   slot.effect=effect;slot.anchor.add(effect.group);effect.update(age-slot.born);
  }).catch(error=>{if(!disposed&&slot.token===token)slot.error=error.message;});
 }
 function place(item){
  const zone=zones.find(z=>z.id===item.pointId);if(!zone)throw Error('Supply point absent from world');
  const position=new THREE.Vector3(...zone.core.center),degrees=angles(item.id),velocityNative=supplyLaunchVelocity(item.id,degrees);
  const anchor=new THREE.Group();anchor.name=`siege-supply-${item.id}`;anchor.position.copy(position);anchor.scale.setScalar(SCN_SCENE_SCALE);scene?.add(anchor);
  const slot={item,pointId:item.pointId,anchor,position,velocityNative,anglesDegrees:[...degrees],phase:null,born:age,effect:null,error:null,token:null,source:null};slots.set(item.id,slot);visual(slot,'fast');
  return slot;
 }
 function move(slot,milliseconds){
  const frame=advanceSupplyVelocity(slot.velocityNative,milliseconds),delta=new THREE.Vector3(...frame.displacementNative).multiplyScalar(SCN_SCENE_SCALE);
  const moved=solver.move(slot.position,delta);
  slot.position.set(...moved.position.toArray().map(v=>Math.fround(v/SCN_SCENE_SCALE)*SCN_SCENE_SCALE));slot.anchor.position.copy(slot.position);slot.velocityNative=frame.velocityNative;
  if(moved.contacts.length){slot.velocityNative=supplyContactVelocity(slot.velocityNative,moved.contacts.at(-1).normal.toArray(),frame.seconds);if(slot.phase==='fast')onContact({item:slot.item,position:slot.position.toArray()});visual(slot,'slow');}
 }
 function step(state){
  if(disposed)return;
  if(state.phase!=='playing'){reset();return;}
  supplies.sync(state);
  for(const [id,slot]of slots)if(!supplies.items.has(id)){clear(slot);slots.delete(id);}
  frameRemainder+=state.playingDelta*1000;const milliseconds=Math.floor(frameRemainder+1e-9);frameRemainder-=milliseconds;
  // Real client7D91F0 queues each descriptor and resets a180ms timer.
  //7D9410 emits at most one after strictly exceeding the delay, dropping
  // any remainder. New actors start at the actual core center.
  let added=false;for(const id of supplies.items.keys())if(!slots.has(id)&&!pending.includes(id)){pending.push(id);added=true;}
  if(added)queueClock=0;
  for(const slot of slots.values())move(slot,milliseconds);
  if(pending.length){queueClock+=milliseconds;if(queueClock>SIEGE_SUPPLY_FLIGHT.queueMilliseconds){queueClock=0;const id=pending.shift(),item=supplies.items.get(id);if(item)place(item);}}
  for(const [id,item]of supplies.items){
   const slot=slots.get(id);if(!slot)continue;
   for(const record of records())if(!record.health.dead&&siegeSupplyContact(record.actor,slot.position.toArray())){
    const collected=supplies.collect(id,record,state);if(!collected)continue;
    const position=slot.position.toArray();clear(slot);slots.delete(id);onCollect({record,item:collected,position,label:SIEGE_SUPPLY_NAMES[collected.effect]});break;
   }
   if(state.phase!=='playing'){reset();return;}
  }
 }
 return {supplies,step,reset,applyPendingMagazine:(record,state,runtime)=>supplies.applyPendingMagazine(record,state,runtime),forgetActor:actor=>supplies.forgetActor(actor),
  render(dt,{visible=true}={}){if(disposed)return;age+=dt;for(const slot of slots.values()){slot.anchor.visible=visible;slot.effect?.update(age-slot.born);}},
  snapshot(){return {items:[...supplies.items.values()].map(item=>{const slot=slots.get(item.id);return {...item,queued:!slot,position:slot?.position.toArray()??null,velocityNative:slot?[...slot.velocityNative]:null,phase:slot?.phase??null,source:slot?.source??null,anglesDegrees:slot?.anglesDegrees??null,loaded:!!slot?.effect,error:slot?.error??null};}),placement:'core center, queued native impulse/gravity and source pre-slide/slide over the S5 sphere query',sourcePreSlideMarginApplied:true,sourceSlideContinuationApplied:true,pickupGeometry:'native sphere/vertical-segment strict distance; ordinary S5 body140x320',nativePickupBodyGettersVerified:false,nativeFreeVelocityVerified:true,sourceSeededLaunchRngVerified:launchAngles===null,nativeSeededRngVerified:false,nativeContactSolverVerified:false,nativeDropPhysicsVerified:false};},
  dispose(){if(!disposed){reset();disposed=true;}},
 };
}
