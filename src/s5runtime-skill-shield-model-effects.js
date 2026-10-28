// Consumer of captured SCN float/UV fields. Material alpha interpretation and
// playback clock are explicit S5 presentation policies, not native readiness.
function interval(keys,t){let i=keys.findIndex(k=>k.time>=t);if(i<=0){const k=keys[i<0?keys.length-1:0];return [k,k,0];}const a=keys[i-1],b=keys[i];return [a,b,(t-a.time)/(b.time-a.time)];}
function scalar(keys,t){if(!keys.length)return 1;const [a,b,w]=interval(keys.map(k=>({time:k[0],value:k[1]})),t);return a.value+(b.value-a.value)*w;}
function dense(base,keys){
 let previous=Float32Array.from(base);
 return keys.map(k=>{const values=previous.slice();for(const row of k.uv){const index=row[0];if(!Number.isInteger(index)||index<0||(index+1)*2>values.length)throw Error('Invalid source Shield UV morph index');values[index*2]=row[1];values[index*2+1]=row[2];}previous=values;return {time:k.time,values};});
}
export function prepareS5RuntimeShieldModelEffects(records,{clip}={}){
 const entries=records.filter(r=>r.object.isMesh).map(r=>{
  const effect=r.definition.effectAnimation?.[clip];if(!effect)throw Error('Captured Shield SCN effect tracks required');
  if(effect.morphKeys.some(k=>k.vertices.length))throw Error('Shield vertex morph collision consumer not qualified');
  return {mesh:r.object,effect,uv:dense(r.definition.uv,effect.morphKeys),materials:Array.isArray(r.object.material)?r.object.material:[r.object.material]};
 });
 return {
  update(age){for(const e of entries){const t=e.effect.durationTicks>0?(age*4800)%e.effect.durationTicks:0;const alpha=Math.min(1,Math.max(0,scalar(e.effect.floatKeys,t)));for(const material of e.materials)material.opacity=alpha;
   if(e.uv.length){const attribute=e.mesh.geometry.attributes.uv;if(!attribute)throw Error('Source Shield UV morph needs model UV attribute');const [a,b,w]=interval(e.uv,t);for(let i=0;i<attribute.array.length;i++)attribute.array[i]=a.values[i]+(b.values[i]-a.values[i])*w;attribute.needsUpdate=true;}
  }},
  snapshot(){return {modelCount:entries.length,alphaModels:entries.filter(e=>e.effect.floatKeys.length).length,uvMorphModels:entries.filter(e=>e.effect.morphKeys.some(k=>k.uv.length)).length,sourceTrackDataVerified:true,alphaMaterialInterpretationVerified:false,playbackPolicy:'s5-single-authored-model-clip-loop',nativeReady:false,nativeCompared:false};},
 };
}
