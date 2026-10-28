import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {createPracticeSentryWaitAttackEffects} from './practice-sentry-wait-attack-effects.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import {Particles,Sequence} from './combat-effects.js';
import {resetNativeSequenceClock,advanceNativeSequenceClock} from './native-sequence-clock.js';

export const PRACTICE_SENTRY_EFFECTS_RENDER_POLICY=Object.freeze({name:'s5-practice-original-seq-particles-borrowed-model-root-v1',root:'AF1BE0→AFF110→AFF160 borrows actor70; actual Sentry nativeRoot matrix',clock:'119FAE0 port; integer frame carry is an explicit S5 scheduler policy',renderer:'existing Particles/Sequence, native windows/scale/billboard/RNG parity unverified',nativeReady:false});
const canonical=value=>String(value).replace(/\\/g,'/').toLowerCase(),uint=v=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Explicit uint32 FX delta required');return v;};
const DESTRUCTION='effects/mapeffect_blast_glass.seq';

// Original destruction particles and waiting/attack models consume their exact
// source resources. The authenticated initial-name invariant is scoped to the
// five Sentry effect scenes; renderer and scheduler parity remain unverified.
export async function createPracticeSessionEffects({scene,resolveActor,random,policy,assetRoot='/assets/s5runtime/practice',loadJson=readAsset,loadTexture=url=>new THREE.TextureLoader().loadAsync(url),staticFrustumDiagnostic=null}={}){
 if(!scene?.isObject3D||typeof resolveActor!=='function'||typeof random!=='function'||policy?.name!==PRACTICE_SENTRY_EFFECTS_RENDER_POLICY.name)throw Error('Explicit source actor resolver, random and Practice effects policy required');
 const bundle=await loadJson(assetRoot+'/sentry-fx/bundle.json'),rawSequences=new Map(),textures=new Map();let waitAttack,disposed=false,epoch=0;const handles=new Map(),blocked=new Map();
 try{
  for(const [source,url] of Object.entries(bundle.sequences)){const raw=await loadJson(url);if(!raw.coverage?.reachesExactEof)throw Error('Incomplete Practice effect sequence '+source);rawSequences.set(canonical(source),raw);}
  const raw=rawSequences.get(DESTRUCTION);if(!raw||raw.header.byteField!==0||raw.header.durationField!==3000||raw.nodes.length!==4||raw.nodes.some(n=>n.type!=='CActParticle'))throw Error('Authentic Sentry destruction sequence required');
  const definition=convertParticleSequence(raw,assetRoot+'/sentry-fx');for(const node of definition.nodes){if(node.emitterKeys.length!==1||node.bone!==''||!([0,1].includes(node.parentType)))throw Error('Unsupported destruction emitter branch');for(const url of node.textures)if(!textures.has(url))textures.set(url,await loadTexture(url));}
  waitAttack=await createPracticeSentryWaitAttackEffects({scene,resolveActor,assetRoot,loadJson,staticFrustumDiagnostic});
 }catch(error){waitAttack?.dispose();for(const texture of textures.values())texture.dispose();throw error;}
 const definition=convertParticleSequence(rawSequences.get(DESTRUCTION),assetRoot+'/sentry-fx');
 function instantiate(){const nodes=[],maps=[];try{for(const node of definition.nodes){const ownMaps=node.textures.map(url=>{const map=textures.get(url).clone();maps.push(map);return map;});const particles=new Particles(node,ownMaps,{random});particles.mesh.name='Practice source destruction particle '+node.id;nodes.push({...node,particles});}const sequence=new Sequence(definition,nodes,scene);return {sequence,nodes,maps};}catch(error){disposeInstance({nodes,maps});throw error;}}
 function disposeInstance(handle){for(const n of handle.nodes){n.particles.clear();n.particles.mesh.removeFromParent();n.particles.geometry.dispose();for(const material of n.particles.materials)material.dispose();}for(const map of handle.maps)map.dispose();}
 const key=(id,generation,resource)=>id+':'+generation+':'+resource;
 function stopOwner(id,generation){waitAttack.stopOwner(id,generation);for(const [k,h] of [...handles])if(h.actorId===id&&h.generation===generation){disposeInstance(h);handles.delete(k);}for(const [k,h] of [...blocked])if(h.actorId===id&&h.generation===generation)blocked.delete(k);}
 function cue(event){if(disposed)return {status:'disposed'};if(event.type==='sequence'&&canonical(event.resource)!==DESTRUCTION&&rawSequences.has(canonical(event.resource)))return waitAttack.cue(event);if(event.type==='clear-actor-cues'){stopOwner(event.actorId,event.actorGeneration);return {status:'cleared'};}if(event.type!=='sequence')return {status:'ignored'};
  const resource=canonical(event.resource),k=key(event.actorId,event.actorGeneration,resource);if(event.operation==='stop'){const handle=handles.get(k);if(handle)disposeInstance(handle);handles.delete(k);blocked.delete(k);return {status:'stopped'};}
  if(event.operation!=='start')return {status:'ignored'};const actor=resolveActor(event.actorId,event.actorGeneration);if(!actor||actor.generation!==event.actorGeneration||actor.released)return {status:'stale-actor'};
  const raw=rawSequences.get(resource);if(!raw)return {status:'unknown-resource',resource,nativeReady:false};
  if(resource!==DESTRUCTION){const entry={actorId:event.actorId,generation:event.actorGeneration,resource,status:'unknown-node-loader-default-animation-control-attachment',nativeReady:false};blocked.set(k,entry);return entry;}
  if(handles.has(k))return {status:'already-started',resource,nativeReady:false};if(!actor.model?.nativeRoot?.isObject3D)throw Error('Actual Sentry source root required');
  const h={...instantiate(),actorId:event.actorId,generation:event.actorGeneration,actor,resource,clock:{looping:false,precisionBits:24,roundingMode:'nearest'}};resetNativeSequenceClock(h.clock,raw.header.durationField);h.sequence.trigger(actor.model.group.position,null,{follow:false,duration:raw.header.durationField/1000});
  actor.model.nativeRoot.updateWorldMatrix(true,true);h.sequence.rootSnapshot=actor.model.nativeRoot.matrixWorld.clone();h.sequence.update(0);handles.set(k,h);return {status:'original-particle-sequence-started',resource,nativeReady:false};
 }
 return {cue,stopOwner,setStaticFrustum(next){if(disposed)throw Error('Practice effects disposed');if(typeof next!=='boolean')throw TypeError('Explicit static-frustum boolean required');return waitAttack.setStaticFrustum(next);},staticFrustumReport(){return waitAttack.staticFrustumReport();},
  beginTick(){return {epoch,waitAttackToken:waitAttack.beginTick(),handles:[...handles.values()]};},
  endTick(token,deltaMs){uint(deltaMs);if(disposed||token.epoch!==epoch)return;waitAttack.endTick(token.waitAttackToken,deltaMs);for(const h of token.handles){if(![...handles.values()].includes(h))continue;const actor=resolveActor(h.actorId,h.generation);if(actor!==h.actor||actor.released||actor.generation!==h.generation){stopOwner(h.actorId,h.generation);continue;}actor.model.nativeRoot.updateWorldMatrix(true,true);h.sequence.rootSnapshot.copy(actor.model.nativeRoot.matrixWorld);const timing=advanceNativeSequenceClock(h.clock,deltaMs);
    // Source loop=false/duration3000. The shared presentation engine's
    // particle action windows remain explicitly qualified by this policy.
    if(timing.dispatch)h.sequence.update((h.clock.current-h.sequence.age*1000)/1000);
   }},
  render(camera){if(disposed)return;if(!camera?.isCamera)throw Error('Actual camera required for source particles');waitAttack.render(camera);for(const h of handles.values())h.sequence.render(camera);},
  async warm(renderer,camera){if(disposed)throw Error('Practice effects disposed');await waitAttack.warm(renderer,camera);const h=instantiate();for(const n of h.nodes)n.particles.mesh.visible=true;try{await renderer.compileAsync(scene,camera);}finally{disposeInstance(h);}},
  reset(){epoch++;waitAttack.reset();for(const h of handles.values())disposeInstance(h);handles.clear();blocked.clear();},
  snapshot(){return {rendered:[...handles.values()].map(h=>({actorId:h.actorId,generation:h.generation,resource:h.resource,currentMs:h.clock.current,emitters:h.nodes.length,particles:h.nodes.reduce((n,e)=>n+e.particles.particles.length,0)})),blocked:[...blocked.values()],waitAttack:waitAttack.snapshot(),policy:PRACTICE_SENTRY_EFFECTS_RENDER_POLICY,nativeReady:false,nativeCompared:false};},
  dispose(){if(disposed)return;this.reset();disposed=true;waitAttack.dispose();for(const texture of textures.values())texture.dispose();textures.clear();},nativeReady:false,
 };
}
