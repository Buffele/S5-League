import {Mesh,Scene} from 'three';

// Precompile reconstructed multi-mesh trails without revealing/reparenting
// their live meshes or advancing any pose/history. Resources remain borrowed.
export function createTrailMeshWarmup(root){
 const tasks=new WeakMap();
 return (renderer,camera,sourceScene=null)=>{
  const key=sourceScene?.fog?(sourceScene.fog.isFogExp2?'exp2':'linear'):'none';
  let variants=tasks.get(renderer);if(!variants){variants=new Map();tasks.set(renderer,variants);}
  if(variants.has(key))return variants.get(key);
  const task=(async()=>{
   const stage=new Scene();stage.fog=sourceScene?.fog??null;const maps=new Set();
   root.traverse(node=>{if(!node.isMesh)return;const proxy=new Mesh(node.geometry,node.material);proxy.frustumCulled=false;stage.add(proxy);for(const material of Array.isArray(node.material)?node.material:[node.material])if(material.map)maps.add(material.map);});
   for(const map of maps)renderer.initTexture?.(map);
   try{if(renderer.compileAsync)await renderer.compileAsync(stage,camera);else renderer.compile(stage,camera);}finally{stage.clear();}
  })();variants.set(key,task);task.catch(()=>variants.delete(key));return task;
 };
}
