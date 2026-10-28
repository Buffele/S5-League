import * as THREE from 'three';
import {Particles} from './combat-effects.js';
import {compileBioLabMapObjectContract} from './bio-lab-map-objects.js';
import {resetNativeSequenceClock,advanceNativeSequenceClock} from './native-sequence-clock.js';
import {nativeSequenceParent} from './native-sequence-parent.js';

const SCALE=.006,POLICY='bio-lab-source-particle-presentation-partial-v1';
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const call=(fn,...args)=>{const out=fn(...args);if(out&&typeof out.then==='function')throw TypeError('Synchronous Bio Lab effect owner required');return out;};
const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);
const assetUrl=(url,folder,extension)=>typeof url==='string'&&url.startsWith('/assets/maps/bio-lab/native-effects/'+folder+'/')&&url.endsWith(extension)&&!url.includes('..');
const listErrors=(list,error)=>{list.push(String(error?.message??error));if(list.length>8)list.shift();};

export function validateBioLabNativeEffects(world,data){
 if(world?.nativeMapId!==19||world.sourceData?.key!=='MAPNAME_BIO_LAB'||!world.root?.isObject3D||data?.schema!=='bio-lab-native-effects-presentation-v1'||data.nativeMapId!==19||data.policy?.name!==POLICY)throw TypeError('Explicit Bio Lab19 native effect presentation required');
 const bindings=compileBioLabMapObjectContract(world.sourceData).sequences;
 if(JSON.stringify(bindings)!==JSON.stringify(data.bindings))throw Error('Bio Lab effect source anchor contract mismatch');
 const names=['bg_biolab_poison_eff_01.seq','bg_biolab_poison_eff_02.seq'];
 if(!data.definitions||Object.keys(data.definitions).sort().join('|')!==names.join('|')||!Array.isArray(data.textures)||data.textures.length!==2||!Array.isArray(data.sounds)||data.sounds.length!==2)throw Error('Exact Bio Lab source definitions/resources required');
 const urls=new Set();for(const texture of data.textures){if(!assetUrl(texture.url,'textures','.png')||urls.has(texture.url)||!Number.isInteger(texture.width)||!Number.isInteger(texture.height)||texture.width<1||texture.height<1||texture.width>512||texture.height>512||texture.rgbaAndAlphaPreserved!==true)throw Error('Verified native Bio Lab particle texture required');urls.add(texture.url);}
 let emitters=0,capacity=0;for(const binding of bindings){
  if(!finiteArray(binding.worldRuntimeMatrix,16)||Math.abs(new THREE.Matrix4().fromArray(binding.worldRuntimeMatrix).determinant())<1e-12)throw Error('Explicit nonsingular source effect matrix required');
  const definition=data.definitions[binding.sequence],count=binding.sequence===names[0]?1:2;
  if(!definition||definition.nodes?.length!==count||!Number.isFinite(definition.duration)||definition.duration<=0||definition.duration>3)throw Error('Supported Bio Lab source particle definition required');
  for(const node of definition.nodes){
   if(node.type!=='CActParticle'||node.parentType!==0||node.parent!==0||node.bone!==''||node.native?.['54']!==1||node.native?.['18']!==0||![0,1].includes(node.native?.['20'])||node.emitterKeys?.length!==1||node.textures?.length!==1||!urls.has(node.textures[0])||node.textureUVs?.length!==1||!finiteArray(node.textureUVs[0],8)||!Number.isInteger(node.capacity)||node.capacity<1||node.capacity>60||!Number.isFinite(node.rate)||node.rate<0||node.rate>20||node.start!==0||node.end!==definition.duration||!Array.isArray(node.appearance)||!node.appearance.length||node.appearance.some(key=>!finiteArray(key,8)))throw Error('Unsupported Bio Lab particle grammar or coordinate branch');
   emitters++;capacity+=node.capacity;
  }
 }
 if(emitters!==10||capacity!==360)throw Error('Bio Lab source effect budget changed');
 for(const row of data.sounds)if(!['wall_destroy_wooden.ogg','wall_destroy_steel.ogg'].includes(row.literal)||!assetUrl(row.url,'sounds','.ogg'))throw Error('Exact original Bio Lab sound resource required');
 return {bindings,emitters,capacity};
}

function createBioLabSoundBus(data,{fetchAsset=globalThis.fetch,readActive}){
 let getGain=()=>1,getAudioContext=()=>null,current=null,epoch=0,disposed=false,lastError=null;
 const byLiteral=new Map(data.sounds.map(row=>[row.literal,row])),played={destroyed:0,restored:0};let suppressed=0,missing=0;
 function clear(){epoch++;if(!current)return;for(const pending of current.pending.values())pending.controller.abort();current.pending.clear();for(const source of current.sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}current.sources.clear();}
 function gain(entry){const value=call(getGain);if(!Number.isFinite(value)||value<0||value>1)throw RangeError('SFX gain must be0..1');entry.bus.gain.value=value;return value;}
 function owner(context){if(current?.context===context)return current;clear();if(current){current.bus.disconnect();current.buffers.clear();}const bus=context.createGain();bus.connect(context.destination);current={context,bus,buffers:new Map(),pending:new Map(),sources:new Set()};return current;}
 async function buffer(entry,row,token){
  if(entry.buffers.has(row.literal))return entry.buffers.get(row.literal);if(entry.pending.has(row.literal))return entry.pending.get(row.literal).promise;
  const pending={controller:new AbortController(),promise:null};pending.promise=(async()=>{const response=await fetchAsset(row.url,{signal:pending.controller.signal});if(disposed||epoch!==token||current!==entry)return null;if(!response.ok)throw Error('Original Bio Lab sound unavailable: '+row.literal);const bytes=await response.arrayBuffer();if(disposed||epoch!==token||current!==entry)return null;const decoded=await entry.context.decodeAudioData(bytes);if(disposed||epoch!==token||current!==entry)return null;if(!Number.isFinite(decoded?.duration)||decoded.duration<=0)throw Error('Invalid original Bio Lab sound');entry.buffers.set(row.literal,decoded);return decoded;})().finally(()=>{if(entry.pending.get(row.literal)===pending)entry.pending.delete(row.literal);});entry.pending.set(row.literal,pending);return pending.promise;
 }
 const api={
  configure(settings){if(disposed)return;if(!synchronous(settings?.getGain)||settings.getAudioContext!==undefined&&!synchronous(settings.getAudioContext))throw TypeError('Caller SFX gain and optional existing audio-context readers required');getGain=settings.getGain;if(settings.getAudioContext)getAudioContext=settings.getAudioContext;api.update();},
  async cue(type,literal){let entry,source,token=epoch;try{
   if(disposed||!readActive()){suppressed++;return false;}const row=byLiteral.get(literal);if(!row){missing++;lastError='Missing exact native sound, no fallback: '+String(literal);return false;}if(!['destroyed','restored'].includes(type))return false;
   const context=call(getAudioContext);if(!context||context.state!=='running'){suppressed++;return false;}if(!context.createGain||!context.createBufferSource||!context.decodeAudioData)throw TypeError('Existing running shared WebAudio context required');entry=owner(context);token=epoch;if(gain(entry)===0){suppressed++;return false;}const decoded=await buffer(entry,row,token);
   if(disposed||token!==epoch||current!==entry||!readActive()||call(getAudioContext)!==context||context.state!=='running'||!decoded)return false;if(gain(entry)===0){suppressed++;return false;}
   source=context.createBufferSource();source.buffer=decoded;source.loop=false;source.connect(entry.bus);entry.sources.add(source);source.onended=()=>{if(entry.sources.delete(source)){source.onended=null;source.disconnect();}};source.start();played[type]++;lastError=null;return true;
  }catch(error){if(source){entry?.sources.delete(source);source.onended=null;try{source.stop();}catch{}source.disconnect();}if(!disposed&&epoch===token)lastError=String(error?.message??error);return false;}},
  update(){if(disposed||!current)return;try{if(call(getAudioContext)!==current.context){clear();current.bus.disconnect();current.buffers.clear();current=null;}else gain(current);}catch(error){lastError=String(error?.message??error);}},
  clear,snapshot(){return {played:{...played},suppressed,missingDeclaredResources:missing,activeSources:current?.sources.size??0,pendingLoads:current?.pending.size??0,cachedBuffers:current?.buffers.size??0,gain:current?.bus.gain.value??null,lastError,nativeSpatialMixVerified:false,newAudioContextCreated:false};},
  dispose(){if(disposed)return;clear();disposed=true;if(current){current.bus.disconnect();current.buffers.clear();current=null;}},
 };return api;
}

// Source-authenticated assets and placements, with explicit existing S5 particle
// semantics. No native-parity claim is made for unported versioned controls.
export function createBioLabNativeEffects(world,data,{textures,readQuality=()=> 'high',random=Math.random,createEmitter=(node,maps,options)=>new Particles(node,maps,options),fetchAsset=globalThis.fetch}={}){
 validateBioLabNativeEffects(world,data);
 if(!(textures instanceof Map)||!synchronous(readQuality)||!synchronous(random)||!synchronous(createEmitter))throw TypeError('Prepared textures and synchronous Bio Lab effect readers required');
 const previousAudio=Object.getOwnPropertyDescriptor(world,'setMapObjectAudioSettings');if(previousAudio?.configurable===false)throw Error('Configurable world audio-settings owner required');
 const group=new THREE.Group();group.name='Bio Lab / original poison particle presentation';group.matrixAutoUpdate=false;group.visible=false;group.userData={artistOnly:true,collision:false,nativeParity:false};
 const handles=[],maps=new Map(),errors=[],identity=new THREE.Matrix4(),zero=new THREE.Vector3(),rootMatrix=new THREE.Matrix4();let active=false,disposed=false,quality='high',manualQuality=null,remainderMs=0,reason='prepared-inactive',unsubscribe=null,lastMapResetRevision=null;
 const stats={updates:0,renderCalls:0,resets:0,simulationGaps:0};
 const sound=createBioLabSoundBus(data,{fetchAsset,readActive:()=>active&&!disposed});
 function releaseEmitter(emitter){emitter.clear();emitter.mesh.removeFromParent();emitter.geometry.dispose();for(const material of new Set(emitter.materials))material.dispose();}
 try{
  for(const row of data.textures){const source=textures.get(row.url);if(!source?.isTexture)throw Error('Prepared native texture missing: '+row.url);const clone=source.clone();clone.needsUpdate=true;maps.set(row.url,clone);}
  for(const binding of data.bindings){
   const definition=data.definitions[binding.sequence],handle={binding:structuredClone(binding),definition,sourceMatrix:new THREE.Matrix4().fromArray(binding.worldRuntimeMatrix),anchor:new THREE.Matrix4(),emitters:[],clock:{looping:true,precisionBits:24,roundingMode:'nearest'}};resetNativeSequenceClock(handle.clock,Math.round(definition.duration*1000));handles.push(handle);
   for(const input of definition.nodes){const node=structuredClone(input),emitter=call(createEmitter,node,node.textures.map(url=>maps.get(url)),{random});if(!emitter?.mesh?.isObject3D||!emitter.geometry||!Array.isArray(emitter.materials)||!Array.isArray(emitter.particles))throw Error('Concrete shared particle emitter required');emitter.sourceCapacity=input.capacity;emitter.sourceRate=input.rate;emitter.mesh.name=`Bio Lab ${binding.dummy} / source particle ${node.id}`;emitter.mesh.castShadow=false;emitter.mesh.receiveShadow=false;handle.emitters.push(emitter);group.add(emitter.mesh);}
  }
 }catch(error){for(const handle of handles)for(const emitter of handle.emitters)releaseEmitter(emitter);for(const map of maps.values())map.dispose();throw error;}
 function resetFrames(why){remainderMs=0;reason=why;stats.resets++;for(const handle of handles){resetNativeSequenceClock(handle.clock,Math.round(handle.definition.duration*1000));for(const emitter of handle.emitters){emitter.clear();emitter.mesh.visible=false;}}}
 function applyQuality(mode){if(!['high','balanced','performance'].includes(mode))throw TypeError('Explicit Bio Lab effect quality required');if(mode===quality)return;quality=mode;for(const handle of handles)for(const emitter of handle.emitters){emitter.config.capacity=mode==='performance'?Math.min(6,emitter.sourceCapacity):emitter.sourceCapacity;emitter.config.rate=mode==='performance'?Math.min(4,emitter.sourceRate):emitter.sourceRate;}resetFrames('quality-change');}
 function updateQuality(){try{applyQuality(manualQuality??call(readQuality));}catch(error){listErrors(errors,error);applyQuality('performance');}}
 const audioSettings=settings=>{if(disposed)return;previousAudio?.value?.call(world,settings);sound.configure(settings);};
 const api={
  resume(){if(disposed)return false;resetFrames('presentation-resumed');active=true;group.visible=true;updateQuality();return true;},
  clear(why='presentation-cleared'){if(disposed)return;active=false;group.visible=false;resetFrames(why);sound.clear();},
  reset(why='explicit-reset'){if(disposed)return;resetFrames(why);sound.clear();},
  setQuality(mode){applyQuality(mode);manualQuality=mode;},
  setAudioSettings(settings){sound.configure(settings);},
  onMapObjectEvent(event){if(disposed)return;if(event?.type==='reset-local-S5'&&Number.isSafeInteger(event.revision)){if(event.revision!==lastMapResetRevision){lastMapResetRevision=event.revision;api.reset('map-object-reset');}return;}if(!['destroyed','restored'].includes(event?.type))return;const literal=event.type==='destroyed'?event.sourceEffects?.sound?.value:event.sourceEffects?.rebirthSound?.value;void sound.cue(event.type,literal);},
  update(dt){
   if(disposed||!active)return;if(!Number.isFinite(dt)||dt<0)throw RangeError('Finite Bio Lab effect seconds required');updateQuality();sound.update();if(dt===0)return;
   if(dt>.25){stats.simulationGaps++;resetFrames('simulation-gap');return;}
   const total=remainderMs+dt*1000,ms=Math.floor(total+1e-9);remainderMs=total-ms;if(!ms)return;stats.updates++;
   for(const handle of handles){const timing=advanceNativeSequenceClock(handle.clock,ms);for(const emitter of handle.emitters){const n=emitter.config,live=timing.dispatch&&timing.current>=n.start*1000&&timing.current<=n.end*1000;emitter.update(ms/1000,{matrix:identity,position:zero,sprinting:live,facing:0});}}
  },
  render(camera){
   if(disposed||!active)return;if(!camera?.isCamera)throw TypeError('Current render camera required');world.root.updateWorldMatrix(true,false);rootMatrix.copy(world.root.matrixWorld);if(!rootMatrix.elements.every(Number.isFinite)||Math.abs(rootMatrix.determinant())<1e-12){resetFrames('invalid-current-map-transform');return;}
   group.matrix.copy(rootMatrix).invert();group.updateMatrixWorld(true);camera.updateWorldMatrix(true,false);stats.renderCalls++;
   for(const handle of handles){handle.anchor.multiplyMatrices(rootMatrix,handle.sourceMatrix);for(const emitter of handle.emitters){
    const n=emitter.config,parent=nativeSequenceParent({parentType:n.parentType,parentIndex:n.parent,boneName:n.bone},{externalNodes:[handle.anchor]});if(parent!==handle.anchor)throw Error('Missing exact Bio Lab source effect parent');
    const saved=[];try{for(const particle of emitter.particles){saved.push({particle,position:particle.position.clone(),velocity:particle.velocity.clone(),localSpace:particle.localSpace});particle.position.divideScalar(SCALE).applyMatrix4(parent);const a=parent.elements,v=particle.velocity,x=v.x/SCALE,y=v.y/SCALE,z=v.z/SCALE;v.set(a[0]*x+a[4]*y+a[8]*z,a[1]*x+a[5]*y+a[9]*z,a[2]*x+a[6]*y+a[10]*z);particle.localSpace=false;}emitter.render(camera);}
    finally{for(const item of saved){item.particle.position.copy(item.position);item.particle.velocity.copy(item.velocity);item.particle.localSpace=item.localSpace;}}
   }}
  },
  async warm(renderer,camera,scene){if(disposed)return;const visible=group.visible,states=handles.flatMap(h=>h.emitters.map(e=>[e.mesh,e.mesh.visible]));try{group.visible=true;for(const [mesh]of states)mesh.visible=true;await renderer.compileAsync(scene,camera);}finally{if(!disposed){group.visible=visible;for(const [mesh,wasVisible]of states)mesh.visible=wasVisible;}}},
  snapshot(){return {policy:POLICY,active,disposed,quality,reason,instances:handles.length,emitters:handles.reduce((n,h)=>n+h.emitters.length,0),particles:handles.reduce((n,h)=>n+h.emitters.reduce((s,e)=>s+e.particles.length,0),0),capacity:handles.reduce((n,h)=>n+h.emitters.reduce((s,e)=>s+e.config.capacity,0),0),allocatedCapacity:disposed?0:360,textureCount:maps.size,stats:{...stats},errors:[...errors],audio:sound.snapshot(),anchors:handles.map(h=>({dummy:h.binding.dummy,sequence:h.binding.sequence,sourceMatrix:h.sourceMatrix.toArray(),clockMs:h.clock.current})),nativeReady:false,nativeParticleSemanticsVerified:false,nativeLoopOwnershipVerified:false,hazardCueRetainedInPerformance:true};},
  dispose(){if(disposed)return;api.clear('disposed');disposed=true;unsubscribe?.();sound.dispose();for(const handle of handles)for(const emitter of handle.emitters)releaseEmitter(emitter);handles.length=0;for(const map of maps.values())map.dispose();maps.clear();group.removeFromParent();if(world.setMapObjectAudioSettings===audioSettings){if(previousAudio)Object.defineProperty(world,'setMapObjectAudioSettings',previousAudio);else delete world.setMapObjectAudioSettings;}},
 };
 try{world.root.add(group);world.setMapObjectAudioSettings=audioSettings;unsubscribe=world.mapObjects?.subscribeEvents?.(api.onMapObjectEvent)??null;updateQuality();}
 catch(error){api.dispose();throw error;}
 return Object.freeze(api);
}

export async function loadBioLabNativeEffects(world,data,{loadTexture=url=>new THREE.TextureLoader().loadAsync(url),...options}={}){
 validateBioLabNativeEffects(world,data);const textures=new Map();
 try{const results=await Promise.allSettled(data.textures.map(async row=>{const texture=await loadTexture(row.url);if(!texture?.isTexture)throw Error('Native Bio Lab image did not produce a texture');textures.set(row.url,texture);}));const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;return createBioLabNativeEffects(world,data,{...options,textures});}
 finally{for(const map of new Set(textures.values()))map.dispose();}
}
