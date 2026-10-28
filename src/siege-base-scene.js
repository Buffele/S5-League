import {prepareSiegeIndicator} from './siege-indicator-scene.js';
import {sceneAsset} from './scene-assets.js';
import {createDefaultScnControllerClock} from './scn-controller-clock.js';
import {createSiegeBaseTransformTransition} from './scn-transform-transition.js';
import {prepareSiegeBaseProperties} from './siege-base-properties.js';

// Native AEE3F0 dispatches in00/in20/.../in100 with (2000,1). Each model
// shares controller0's clock across a named selection; 115D0A0 ->1152DC0
// ->7C7B00 does not seek/reset currentTicks. 7C8CC0 falls back to the initial
// clip (in00 here) on an absent transform track. The authored sparse sources
// all use9600ticks. Transform transitions use the separate native old clock.
export function prepareSiegeBase(data,scene){
 if(!/^model\/background\/indicator_base_(red|green)\.scn$/.test(data.source)||data.bones.length)throw Error('Explicit Siege base source required');
 if(data.clips.some(c=>c.durationTicks!==9600)||data.models.some(m=>Object.values(m.effectAnimation).some(a=>a.durationTicks!==9600)))throw Error('Supported Siege base common duration required');
 const hierarchy=prepareSiegeIndicator(data,scene,{animation:'in00',loop:false});
 const sourceClock=createDefaultScnControllerClock(9600);
 const controllers=scene.meshes.map(mesh=>{
  const model=data.models[mesh.userData.sourceModelIndex],clips=new Set(Object.keys(model.effectAnimation));
  if(!clips.has('in00'))throw Error('Siege base initialization track missing');
  const transforms=Object.fromEntries(Object.entries(model.effectAnimation).map(([name,a])=>[name,a.transform]));
  if(Object.values(transforms).some(t=>!t))throw Error('Supported Siege base transform required');
  return {index:mesh.userData.sourceModelIndex,mesh,clips,properties:prepareSiegeBaseProperties(model,mesh),transform:createSiegeBaseTransformTransition(transforms),clip:'in00',selectedAt:0};
 });
 let clock=0,selected='in00';
 return {...hierarchy,
  setClip(clip,seconds=clock){
   if(!data.clips.some(c=>c.name===clip))throw Error('Exact Siege base clip required');
   if(clip===selected)return;
   if(!Number.isFinite(seconds)||seconds<clock)throw Error('Monotonic Siege selection clock required');
   selected=clip;
   const ms=Math.floor(seconds*1000+Number.EPSILON*Math.max(1,seconds*1000)*4);
   for(const controller of controllers){controller.transform.select(clip,ms);controller.properties.select(clip);controller.clip=controller.clips.has(clip)?clip:'in00';controller.selectedAt=seconds;}
  },
  update(seconds){
   if(!Number.isFinite(seconds)||seconds<clock)throw Error('Monotonic Siege base clock required');
   sourceClock.advance(seconds-clock);clock=seconds;
   const ms=Math.floor(seconds*1000+Number.EPSILON*Math.max(1,seconds*1000)*4),ticks=sourceClock.snapshot().currentTicks;
   for(const c of controllers){c.transform.apply(c.mesh,ticks,ms);c.properties.apply(ticks);}
   scene.group.updateMatrixWorld(true);
  },
  snapshot(){return {selected,clock,controller:sourceClock.snapshot(),tracks:controllers.map(c=>({sourceModelIndex:c.index,clip:c.clip,selectedAt:c.selectedAt,transition:c.transform.snapshot(),properties:c.properties.snapshot()})),nativeSparseTrackCarryCompared:false,nativeTransformBlendIncluded:true,sourceClockSelectionVerified:true,sourcePropertySelectionVerified:true};},
 };
}
export async function loadSiegeBase(data){
 const scene=await sceneAsset(data,{effect:true});
 try{return prepareSiegeBase(data,scene);}
 catch(error){for(const mesh of scene.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}throw error;}
}
