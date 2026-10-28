import {sampleScnScalar116a3b0} from './anchoring-scn-scalar-source.js';
import {compileScnMorphFrames,planScnMorph116ba90} from './anchoring-scn-morph-source.js';

function channel(records){
 let first=null,selected=null;
 return {
  select(name){
   const found=records.get(name);
   // 12579A0 /1256FD0: first successful selection is remembered only
   // while current is null. A missing name falls back to that selection.
   if(!selected&&found)first=name;
   selected=found?name:first;
  },
  get(){return records.get(selected);},
  snapshot(){return {selected,first};},
 };
}

// Dedicated adapter for the two Siege base sources. Their mesh readers
// 1155690/1159970 return null when a channel's serialized count is zero;
// a model clip is not evidence that all three properties have that clip.
// Unlike SRT, visibility and morph named selection ignore blend arguments.
// Node+C4 -> material.opacity is the existing S5 presentation policy, not
// a newly established native material/shader binding.
export function prepareSiegeBaseProperties(model,mesh){
 const scalars=new Map(),morphs=new Map();
 for(const [name,a]of Object.entries(model.effectAnimation)){
  if(a.floatKeys.length)scalars.set(name,a.floatKeys);
  if(a.morphKeys.length)morphs.set(name,{frames:compileScnMorphFrames(a.morphKeys),durationTicks:a.durationTicks});
 }
 const scalar=channel(scalars),morph=channel(morphs),materials=[].concat(mesh.material);
 let nodeScalarC4=1; // Existing S5 initial presentation value, not a native constructor claim.
 const select=name=>{scalar.select(name);morph.select(name);};select('in00');
 return {
  select,
  apply(ticks){
   const keys=scalar.get();if(keys)nodeScalarC4=sampleScnScalar116a3b0(keys,ticks).value;
   for(const material of materials)material.opacity=Math.min(1,Math.max(0,nodeScalarC4));
   const track=morph.get();if(!track)return;
   const plan=planScnMorph116ba90({...track,timeTicks:ticks});
   let positions=false,uv=false;
   for(const write of plan.writes){
    const attribute=mesh.geometry.getAttribute(write.kind==='position'?'position':'uv');
    if(!attribute||write.index>=attribute.count)throw Error('Siege source morph index outside bound attribute');
    if(write.kind==='position'){attribute.setXYZ(write.index,...write.value);positions=true;}
    else{attribute.setXY(write.index,...write.value);uv=true;}
   }
   if(positions)mesh.geometry.attributes.position.needsUpdate=true;
   if(uv)mesh.geometry.attributes.uv.needsUpdate=true;
  },
  snapshot(){return {scalar:scalar.snapshot(),morph:morph.snapshot(),nodeScalarC4,sourceChannelSelectionVerified:true,nativeMaterialOpacityBindingVerified:false,nativeBufferLayoutCompared:false};},
 };
}
