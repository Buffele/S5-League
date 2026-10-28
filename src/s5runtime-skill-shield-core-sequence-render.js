import * as THREE from 'three';
import {Particles} from './combat-effects.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

export const S5RUNTIME_SHIELD_CORE_RENDER_POLICY=Object.freeze({
 name:'s5-shield-core-existing-particles-full-dummy-centers-v1',
 emissionWindow:'s5-current-clock-start-inclusive-end-exclusive',
 billboardSize:'s5-source-size-times-0.006-without-dummy-scale',
 emitterClock:'s5-continuous-existing-emitter-with-source-sequence-modulo',
 nativeParticleSemanticsVerified:false,nativeBillboardVerified:false,nativeScaleInheritanceVerified:false,nativeReady:false,
});

// Deliberate S5 presentation policy. Shared Particles' local-space interpretation,
// RNG, spawning cap and render-state approximations remain explicit limitations.
// This module neither changes that shared engine nor claims native particle parity.
export function createS5RuntimeShieldCoreSequenceRenderPorts({scene,definition,textures,readAttachmentMatrix,policy,random=Math.random,createParticleEmitter=(node,maps,options)=>new Particles(node,maps,options)}={}){
 if(policy?.name!==S5RUNTIME_SHIELD_CORE_RENDER_POLICY.name)throw Error('Explicit Shield core S5 render policy required');
 if(!scene?.isObject3D||typeof readAttachmentMatrix!=='function')throw Error('Scene and explicit attachment matrix reader required');
 if(typeof random!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(random.constructor.name))throw Error('Synchronous random function required');
 if(typeof createParticleEmitter!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(createParticleEmitter.constructor.name))throw Error('Synchronous particle constructor required');
 if(!Array.isArray(definition?.nodes)||definition.nodes.length!==5)throw Error('Five qualified core particle nodes required');
 for(const n of definition.nodes){
  if(n.type!=='CActParticle'||n.parentType!==0||n.parent!==0||n.bone!==''||n.native?.['54']!==1||n.emitterKeys?.length!==1)throw Error('Unsupported Shield core particle branch');
  for(const path of n.textures)if(!textures?.get(path)?.isTexture)throw Error('Prepared core texture required: '+path);
 }
 const handles=new Set(),identity=new THREE.Matrix4(),zero=new THREE.Vector3();let disposed=false;
 function requireHandle(handle){if(disposed||!handles.has(handle))throw Error('Inactive core render handle');}
 function readMatrix(values){if(!values||values.length!==16||!Array.from(values).every(Number.isFinite))throw Error('Explicit finite Dummy matrix16 required');return new THREE.Matrix4().fromArray(values);}
 function remove(handle){
  if(!handles.delete(handle))return false;
  for(const emitter of handle.emitters){
   emitter.clear();emitter.mesh.removeFromParent();emitter.geometry.dispose();
   for(const material of emitter.materials)material.dispose();
   for(const map of emitter.ownedMaps)map.dispose();
  }
  return true;
 }
 return {
  create({descriptor,matrixElements}){
   if(disposed)throw Error('Disposed core render ports');
   const matrix=readMatrix(matrixElements),emitters=[],ownedMaps=[];
   try{
    for(const node of definition.nodes){
     // Texture state and disposal belong to this renderer instance, never the model.
     const maps=[];for(const path of node.textures){const map=textures.get(path).clone();maps.push(map);ownedMaps.push(map);}
     const emitter=createParticleEmitter(node,maps,{random});
     if(!emitter||typeof emitter.then==='function'||!emitter.mesh?.isObject3D)throw Error('Concrete synchronous particle emitter required');
     emitter.ownedMaps=maps;
     emitter.mesh.name=`S5 Shield core ${descriptor.descriptorIndex} particle ${node.id}`;
     emitters.push(emitter);scene.add(emitter.mesh);
    }
   }catch(error){for(const emitter of emitters){emitter.mesh.removeFromParent();emitter.geometry.dispose();for(const material of emitter.materials)material.dispose();}for(const map of ownedMaps)map.dispose();throw error;}
   const handle={descriptor,matrix,emitters};handles.add(handle);return handle;
  },
  update(handle,{matrixElements,dtMs,currentMs,updateActions}){
   requireHandle(handle);
   if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff||!Number.isInteger(currentMs)||currentMs<0||currentMs>0xffffffff||typeof updateActions!=='boolean')throw Error('Explicit uint32 sequence frame required');
   handle.matrix.copy(readMatrix(matrixElements));
   for(const emitter of handle.emitters){
    const n=emitter.config,emitting=updateActions&&currentMs>=n.start*1000&&currentMs<n.end*1000;
    // Keep shared particle integration in its existing local S5 units. Apply
    // the complete Dummy world matrix only when producing world draw vertices.
    emitter.update(dtMs/1000,{matrix:identity,position:zero,sprinting:emitting,facing:0});
   }
  },
  remove,
  readAttachmentMatrix,
  render(camera){
   if(disposed)return;
   for(const handle of handles)for(const emitter of handle.emitters){
    const saved=[];
    try{
     for(const particle of emitter.particles){
      saved.push({particle,position:particle.position.clone(),velocity:particle.velocity.clone(),localSpace:particle.localSpace});
      particle.position.divideScalar(SCN_SCENE_SCALE).applyMatrix4(handle.matrix);
      // Affine direction transform retains magnitude; normalize would change
      // the shared renderer's direction fallback behavior.
      const a=handle.matrix.elements,v=particle.velocity,x=v.x,y=v.y,z=v.z;
      v.set(a[0]*x+a[4]*y+a[8]*z,a[1]*x+a[5]*y+a[9]*z,a[2]*x+a[6]*y+a[10]*z);
      particle.localSpace=false;
     }
     emitter.render(camera);
    }finally{for(const s of saved){s.particle.position.copy(s.position);s.particle.velocity.copy(s.velocity);s.particle.localSpace=s.localSpace;}}
   }
  },
  snapshot(){return {handles:handles.size,emitters:[...handles].reduce((sum,h)=>sum+h.emitters.length,0),particles:[...handles].reduce((sum,h)=>sum+h.emitters.reduce((n,e)=>n+e.particles.length,0),0),policy:S5RUNTIME_SHIELD_CORE_RENDER_POLICY,disposed,nativeReady:false,nativeCompared:false};},
  dispose(){if(disposed)return;for(const handle of [...handles])remove(handle);disposed=true;},
 };
}
