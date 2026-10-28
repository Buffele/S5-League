import {TextureLoader,Vector3} from 'three';
import {Sequence,Particles} from './combat-effects.js';
import {readAsset} from './scene-assets.js';

export const ALICE_DESTRUCTION_EFFECT_ROOT='/assets/maps/alice-house/destruction-effects';
const SEQUENCE='mapeffect_blast_glass.seq',SOUND='wall_destroy_steel.ogg';

// Map lifecycle owns when/where a committed destruction is emitted. This
// adapter neither changes life/collision nor substitutes missing source assets.
export function createAliceDestructionEffects(scene,{definition,textures,playSound=null,random=Math.random,ownsTextures=false,manifest=null}={}){
 if(!scene?.add||!definition||definition.nodes?.length!==4||definition.nodes.some(node=>node.type!=='CActParticle'||node.emitterKeys.length!==1))throw Error('Four supported native map particle definitions required');
 if(!(textures instanceof Map)||definition.nodes.some(node=>node.textures.some(url=>!textures.get(url)?.isTexture)))throw Error('All four source particle textures required');
 if(playSound!==null&&typeof playSound!=='function')throw TypeError('Explicit sound dispatcher required');
 const pool=[];let disposed=false;
 function instantiate(){
  const nodes=definition.nodes.map(node=>({...node,particles:new Particles(node,node.textures.map(url=>textures.get(url)),{random})}));
  const sequence=new Sequence(definition,nodes,scene);pool.push(sequence);return sequence;
 }
 instantiate();instantiate();
 function playDestruction({sequence,sound=null,position,facing=0}={}){
  if(disposed)throw Error('Alice destruction effects disposed');
  if(!['x','y','z'].every(axis=>Number.isFinite(position?.[axis]))||!Number.isFinite(facing))throw TypeError('Finite committed effect position/facing required');
  const point=new Vector3(position.x,position.y,position.z),missingResources=[];let effect=null,sequenceStatus='none',soundStatus='none';
  if(sequence===SEQUENCE||sequence==='effects/'+SEQUENCE){
   effect=pool.find(item=>!Number.isFinite(item.age))??instantiate();effect.trigger(point,null,{follow:false,facing});sequenceStatus='particle-adaptation-triggered';
  }else if(sequence){sequenceStatus='missing';missingResources.push(sequence);}
  if(sound===SOUND||sound==='sound/'+SOUND){
   if(playSound){playSound({source:SOUND,url:ALICE_DESTRUCTION_EFFECT_ROOT+'/sound/'+SOUND,position:point.clone()});soundStatus='dispatched';}
   else soundStatus='dispatcher-unbound';
  }else if(sound){soundStatus='missing';missingResources.push(sound);}
  return {effect,sequenceStatus,soundStatus,missingResources,nativeReady:false};
 }
 function clear(){for(const sequence of pool)sequence.clear();}
 return Object.freeze({playDestruction,
  update(dt){if(!Number.isFinite(dt)||dt<0)throw RangeError('Nonnegative finite effect delta required');if(!disposed)for(const sequence of pool)sequence.update(dt);},
  render(camera){if(!disposed)for(const sequence of pool)sequence.render(camera);},clear,
  async warmup(renderer,camera){
   if(disposed)return;
   const visibility=pool.flatMap(sequence=>sequence.nodes.map(node=>({mesh:node.particles.mesh,visible:node.particles.mesh.visible})));
   for(const item of visibility)item.mesh.visible=true;
   try{await renderer.compileAsync(scene,camera);}finally{for(const item of visibility)item.mesh.visible=item.visible;}
  },
  dispose(){if(disposed)return;clear();disposed=true;for(const sequence of pool)for(const node of sequence.nodes){node.particles.mesh.removeFromParent();node.particles.geometry.dispose();for(const material of new Set(node.particles.materials))material.dispose();}if(ownsTextures)for(const texture of new Set(textures.values()))texture.dispose();pool.length=0;},
  snapshot:()=>({poolSize:pool.length,active:pool.filter(sequence=>Number.isFinite(sequence.age)).length,particles:pool.reduce((sum,sequence)=>sum+sequence.nodes.reduce((count,node)=>count+node.particles.particles.length,0),0),disposed}),
  qualification:Object.freeze({nativeReady:false,nativeVisualParityCertified:false,sourceSequence:SEQUENCE,sourceNodeCount:4,
   renderer:'Existing Sequence/Particles; unsupported nonzero fields preserved in source/config and listed in manifest.',
   missingResources:Object.freeze(['wall_destroy_steel.ogg1','noise.bmp','teleport.ogg']),substitutionsMade:false,
   effectPlacement:'Explicit map lifecycle event position/facing; no native placement inferred',manifest})});
}

export async function loadAliceDestructionEffects(scene,{read=readAsset,textureLoader=new TextureLoader(),playSound=null}={}){
 const [definitions,manifest]=await Promise.all([read(ALICE_DESTRUCTION_EFFECT_ROOT+'/runtime.json'),read(ALICE_DESTRUCTION_EFFECT_ROOT+'/manifest.json')]);
 const definition=definitions.mapeffect_blast_glass;if(!definition)throw Error('Native map blast definition unavailable');
 const urls=[...new Set(definition.nodes.flatMap(node=>node.textures))],textures=new Map();
 try{
  const loaded=await Promise.allSettled(urls.map(async url=>textures.set(url,await textureLoader.loadAsync(url))));
  const failure=loaded.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  return createAliceDestructionEffects(scene,{definition,textures,playSound,ownsTextures:true,manifest});
 }catch(error){for(const texture of textures.values())texture.dispose();throw error;}
}
