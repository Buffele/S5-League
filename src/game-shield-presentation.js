import {prepareS5RuntimeShieldModelEffects} from './s5runtime-skill-shield-model-effects.js';
import * as THREE from 'three';
import {modelGeometry} from './scene-assets.js';
import {s5runtimeShieldNativePose} from './s5runtime-skill-shield-contact.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {prepareNativeShieldQueryGeometry,updateNativeShieldQueryGeometry} from './native-shield-query-geometry.js';
import {createShieldCoreSequenceConsumer} from './s5runtime-skill-shield-core-sequence-consumer.js';
import {createS5RuntimeShieldCoreSequenceRenderPorts,S5RUNTIME_SHIELD_CORE_RENDER_POLICY} from './s5runtime-skill-shield-core-sequence-render.js';

const ROOT='/assets/s5runtime/skill-runtime/shield';
const keys=[3050001,3050002];
const json=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Shield asset absent: '+url);return r.json();};
function trackData(definition,clip,chain=[]){
  if(chain.includes(clip))throw Error('Cyclic Shield model alias');
  const entry=definition.animations?.[clip];
  if(!entry)return null;
  if(entry.copy)return trackData(definition,entry.copy,[...chain,clip]);
  return entry.data??entry;
}
function sample(target,frames,single,t,quaternion=false){
  if(!frames?.length){if(single)target.fromArray(single);return;}
  const index=frames.findIndex(row=>row[0]>=t);
  if(index<=0){target.fromArray((index<0?frames.at(-1):frames[0]),1);return;}
  const a=frames[index-1],b=frames[index],weight=(t-a[0])/(b[0]-a[0]);
  if(quaternion)target.fromArray(a,1).slerp(new THREE.Quaternion().fromArray(b,1),weight);
  else target.set(...[1,2,3].map(i=>a[i]+(b[i]-a[i])*weight));
}
function material(model,texture){
  const flags=model.renderState??0;
  return new THREE.MeshBasicMaterial({map:texture??null,color:0xffffff,side:flags&8?THREE.DoubleSide:THREE.FrontSide,transparent:!!(flags&34),depthWrite:!(flags&64),fog:!(flags&512),blending:flags&32?THREE.AdditiveBlending:THREE.NormalBlending,toneMapped:false});
}

async function prepareModel(data,collision,textures){
  if(data.clips.length!==1)throw Error('Explicit single Shield model animation required');
  if(collision.triangles.length!==12)throw Error('Shield source requires12 octree triangles');
  const group=new THREE.Group(),records=[],byName=new Map(),usedModels=new Set(),usedBones=new Set(),clip=data.clips[0];
  for(const [sourceIndex,node] of data.nodes.entries()){
    const collection=node.type==='ModelData'?data.models:data.bones,used=node.type==='ModelData'?usedModels:usedBones;
    const index=collection.findIndex((value,i)=>!used.has(i)&&value.name===node.name&&value.parent===node.parent);
    if(index<0)throw Error('Missing Shield node record: '+node.name);used.add(index);
    const definition=collection[index];let object;
    if(node.type==='ModelData'){
      if(definition.weights.length)throw Error('Shield weighted model requires qualified skin adapter');
      const materials=definition.textures.map(t=>{if(!t.name||!textures.has(t.name))throw Error('Unresolved Shield texture');return material(definition,textures.get(t.name));});
      object=new THREE.Mesh(modelGeometry(definition),materials.length?materials:material(definition));
      object.visible=node.name!=='octree';object.frustumCulled=false;
    }else if(node.type==='Bone')object=new THREE.Object3D();
    else throw Error('Unqualified Shield node type: '+node.type);
    object.name=node.name;object.userData.shieldSourceIndex=sourceIndex;
    const record={object,node,definition,data:trackData(definition,clip.name)};records.push(record);
    const matches=byName.get(node.name)??[];matches.push(record);byName.set(node.name,matches);
  }
  for(const record of records){
    const parents=byName.get(record.node.parent)??[];
    if(parents.length>1)throw Error('Ambiguous referenced Shield parent: '+record.node.parent);
    const parent=parents[0];
    if(!parent&&record.node.parent!==data.source&&record.node.parent!==data.source.split('/').at(-1)&&record.node.parent!=='')throw Error('Missing Shield parent: '+record.node.parent);
    (parent?.object??group).add(record.object);
    const bind=new THREE.Matrix4().fromArray(record.node.matrix);
    if(parent)bind.premultiply(new THREE.Matrix4().fromArray(parent.node.matrix).invert());
    bind.decompose(record.object.position,record.object.quaternion,record.object.scale);
  }
  const octree=byName.get('octree');if(octree?.length!==1)throw Error('Unique Shield octree required');
  function update(age){
    const t=clip.durationTicks>0?(age*4800)%clip.durationTicks:0;
    for(const record of records){const a=record.data;if(!a)continue;sample(record.object.position,a.positions,a.position,t);sample(record.object.quaternion,a.rotations,a.rotation,t,true);sample(record.object.scale,a.scales,a.scale,t);}
    group.updateWorldMatrix(true,true);
  }
  update(0);
  const effects=prepareS5RuntimeShieldModelEffects(records,{clip:clip.name});effects.update(0);
  const prepareMatrix=[...octree[0].node.matrix];
  const preparedGeometry=prepareNativeShieldQueryGeometry({vertices:octree[0].definition.vertices,triangleIndices:octree[0].definition.indices,prepareMatrixElements:prepareMatrix,provenance:{kind:'s5-explicit-adaptation',source:'S5-selected authored SCN octree node.matrix; native detached node+34 cached-matrix binding unobserved'}});
  return {group,records,octree:octree[0].object,collision,clip,prepareMatrix,preparedGeometry,effects,update(age){update(age);effects.update(age);},dispose(){for(const r of records)if(r.object.isMesh){r.object.geometry.dispose();for(const m of Array.isArray(r.object.material)?r.object.material:[r.object.material])m.dispose();}group.removeFromParent();}};
}

export async function loadGameShieldPresentation({scene,getAudioContext,getSfxGain,coreSequencePolicy=null,loadJson=json,loadTexture=url=>new THREE.TextureLoader().loadAsync(url),fetchImpl=globalThis.fetch}={}){
  if(!scene?.isObject3D||typeof getAudioContext!=='function'||typeof getSfxGain!=='function')throw Error('Shield scene and authoritative audio getters required');
  if(coreSequencePolicy!==null&&coreSequencePolicy?.name!==S5RUNTIME_SHIELD_CORE_RENDER_POLICY.name)throw Error('Explicit named Shield core sequence policy required');
  const manifest=await loadJson(ROOT+'/manifest.json'),textures=new Map(),models=new Map();
  let coreDefinition=null,coreSource=null;
  if(coreSequencePolicy){
    if(!manifest.sequence?.resourceReady)throw Error('Shield core sequence resource gate closed');
    const [runtime,source]=await Promise.all([loadJson(manifest.sequence.runtimePath),loadJson(ROOT+'/effects/sequence.json')]);
    if(source.sha256!==manifest.sequence.sourceSha256||!source.coverage?.reachesExactEof||source.header?.byteField!==1||source.header?.durationField!==2000)throw Error('Qualified Shield core sequence source profile required');
    coreDefinition=runtime.weapon_shield_u_core_eff_02;coreSource=source;
  }
  const urls=new Set();const files=await Promise.all(keys.map(async itemKey=>{
    const entry=manifest.models[itemKey];if(!entry?.resourceReady)throw Error('Shield model resources not ready');
    const [data,collision]=await Promise.all([loadJson(entry.path),loadJson(entry.collision.path)]);
    for(const model of data.models)for(const texture of model.textures){if(!texture.name)throw Error('Shield texture absent');urls.add(texture.name);}
    return {itemKey,data,collision};
  }));
  if(coreDefinition)for(const node of coreDefinition.nodes)for(const path of node.textures){
    if(!Object.values(manifest.textures).some(entry=>entry.path===path))throw Error('Shield core texture lacks manifest provenance');urls.add(path);
  }
  try{
    const loaded=await Promise.allSettled([...urls].map(async url=>{const texture=await loadTexture(url);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;textures.set(url,texture);}));
    const failed=loaded.find(result=>result.status==='rejected');if(failed)throw failed.reason;
    for(const file of files)models.set(file.itemKey,await prepareModel(file.data,file.collision,textures));
  }catch(error){for(const m of models.values())m.dispose();for(const t of textures.values())t.dispose();throw error;}
  let soundBytes;
  try{const response=await fetchImpl(manifest.sounds.defense.path);if(!response.ok)throw Error('Shield component defense.ogg absent');soundBytes=await response.arrayBuffer();}
  catch(error){for(const m of models.values())m.dispose();for(const t of textures.values())t.dispose();throw error;}
  let coreRenderer=null,coreConsumer=null;
  try{if(coreDefinition){
    const model=models.get(3050002);
    coreRenderer=createS5RuntimeShieldCoreSequenceRenderPorts({scene,definition:coreDefinition,textures,policy:coreSequencePolicy,readAttachmentMatrix(descriptor){
      const record=model.records[descriptor.sourceNodeIndex];
      if(record?.node.name!==descriptor.parentName)throw Error('Core Dummy source index mismatch');
      model.group.updateWorldMatrix(true,true);return record.object.matrixWorld.toArray();
    }});
    coreConsumer=createShieldCoreSequenceConsumer({modelNodes:files.find(file=>file.itemKey===3050002).data.nodes,ports:coreRenderer,
      portProvenance:Object.fromEntries(['create','update','remove','readAttachmentMatrix'].map(key=>[key,S5RUNTIME_SHIELD_CORE_RENDER_POLICY.name+'; actual prepared source Dummy matrixWorld after model update'])),
      clockProfile:{loop:coreSource.header.byteField!==0,durationMs:coreSource.header.durationField,rate:1,provenance:'authenticated SEQ header; CSequenceData/119F230/119FAE0 offline clock port; runtime/native comparison unverified'}});
  }}catch(error){coreRenderer?.dispose();for(const m of models.values())m.dispose();for(const t of textures.values())t.dispose();throw error;}
  const boundary=new THREE.Group(),pose=new THREE.Group();boundary.name='s5runtime-shield-source-boundary';boundary.add(pose);scene.add(boundary);boundary.visible=false;
  for(const model of models.values()){pose.add(model.group);model.group.visible=false;}
  let active=null,age=0,disposed=false,revision=0,audioEpoch=0,audioSource=null,audioBus=null,audioContext=null,audioPending=false,audioStatus='idle',audioError=null,pendingCoreStart=false;
  const decoded=new WeakMap(),consumed=new WeakSet();
  function stopAudio(){audioEpoch++;audioPending=false;if(audioSource){audioSource.onended=null;try{audioSource.stop();}catch{}audioSource.disconnect();audioSource=null;}audioBus?.disconnect();audioBus=null;audioContext=null;audioStatus='idle';}
  async function ensureAudio(){
    if(!active||disposed||audioPending)return;
    const context=getAudioContext();if(!context||context.state!=='running'){audioStatus='waiting-for-running-host-context';return;}
    const gain=getSfxGain();if(!Number.isFinite(gain)||gain<0||gain>1)throw Error('Authoritative Shield SFX gain0..1 required');
    if(audioSource&&audioContext===context){audioBus.gain.setValueAtTime(gain,context.currentTime);return;}
    if(audioSource)stopAudio();const token=audioEpoch;audioPending=true;audioStatus='loading';
    try{
      if(!decoded.has(context))decoded.set(context,context.decodeAudioData(soundBytes.slice(0)));
      const buffer=await decoded.get(context);if(disposed||!active||token!==audioEpoch)return;
      const currentGain=getSfxGain();if(!Number.isFinite(currentGain)||currentGain<0||currentGain>1)throw Error('Authoritative Shield SFX gain0..1 required');
      audioContext=context;audioBus=context.createGain();audioBus.gain.setValueAtTime(currentGain,context.currentTime);audioBus.connect(context.destination);
      audioSource=context.createBufferSource();audioSource.buffer=buffer;audioSource.loop=true;audioSource.connect(audioBus);audioSource.start();audioStatus='playing-component-defense-loop';
    }catch(error){if(token===audioEpoch){stopAudio();audioStatus='error';audioError=String(error?.message??error);}}
    finally{if(token===audioEpoch)audioPending=false;}
  }
  function queueAudio(){void ensureAudio().catch(error=>{audioStatus='error';audioError=String(error?.message??error);});}
  function remove(){if(!active)return false;coreConsumer?.clear('shield-object-remove');pendingCoreStart=false;models.get(active.itemKey).group.visible=false;active=null;age=0;boundary.visible=false;stopAudio();revision++;return true;}
  const api={
    consume(frames,{itemKey,actorId,ownerSlot1c4}={}){
      if(disposed)return {accepted:false,reason:'disposed'};let created=0,removed=0;
      for(const frame of Array.isArray(frames)?frames:[frames]){
        if(!frame||typeof frame!=='object'||consumed.has(frame))continue;consumed.add(frame);const commands=frame.commands??frame;
        if(commands.shieldObjectRemove){if(remove())removed++;}
        if(commands.shieldObjectRequest){
          if(commands.shieldObjectRequest!=='7FC250')return {accepted:false,reason:'alternate-native-shield-object-variant-not-rendered',created,removed};
          if(!models.has(itemKey)||(typeof actorId!=='string'&&typeof actorId!=='number'))throw Error('Explicit Shield item and actor identity required');
          if(active?.itemKey===itemKey&&active.actorId===actorId)continue;
          remove();active={itemKey,actorId,ownerSlot1c4};age=0;models.get(itemKey).group.visible=true;boundary.visible=false;models.get(itemKey).update(0);revision++;pendingCoreStart=!!coreConsumer&&itemKey===3050002;created++;queueAudio();
        }
      }
      return {accepted:true,created,removed};
    },
    update({actorPositionNative,actorForwardNative,actorQuaternion,dtSeconds=0,sequenceDtMs,mirrorZ=false,ownerSlot1c4}={}){
      if(disposed||!active)return false;if(!Number.isFinite(dtSeconds)||dtSeconds<0||typeof mirrorZ!=='boolean')throw Error('Explicit finite Shield frame timing/boundary required');
      if(coreConsumer&&active.itemKey===3050002&&(!Number.isInteger(sequenceDtMs)||sequenceDtMs<0||sequenceDtMs>0xffffffff))throw Error('Opt-in core sequence requires explicit uint32 sequenceDtMs');
      const p=s5runtimeShieldNativePose({actorPosition:actorPositionNative,actorForward:actorForwardNative,actorQuaternion});
      boundary.scale.set(SCN_SCENE_SCALE,SCN_SCENE_SCALE,mirrorZ?-SCN_SCENE_SCALE:SCN_SCENE_SCALE);
      pose.position.fromArray(p.position);pose.quaternion.fromArray(p.quaternion);pose.scale.fromArray(p.scale);
      if(ownerSlot1c4!==undefined){if(typeof ownerSlot1c4!=='boolean')throw Error('Raw Shield ownerSlot1c4 bool required');active.ownerSlot1c4=ownerSlot1c4;}
      age+=dtSeconds;models.get(active.itemKey).update(age);boundary.visible=true;boundary.updateWorldMatrix(true,true);
      if(coreConsumer&&active.itemKey===3050002){
        if(pendingCoreStart){coreConsumer.start({itemKey:active.itemKey,activationSerial:revision,provenance:'S5 component request revision; source four-Dummy descriptor plan; pose evaluated before allocation'});pendingCoreStart=false;}
        coreConsumer.advance({dtMs:sequenceDtMs});
      }
      queueAudio();return true;
    },
    render(camera){if(disposed||!coreRenderer)return false;coreRenderer.render(camera);return true;},
    getQueryCandidates(){
      if(disposed||!active||!boundary.visible)return [];
      const model=models.get(active.itemKey);model.group.updateWorldMatrix(true,true);const rootMatrix=model.group.matrixWorld.toArray();
      const geometry=updateNativeShieldQueryGeometry({preparedGeometry:model.preparedGeometry,modelMatrixElements:rootMatrix,provenance:{kind:'s5-explicit-adaptation',source:'rendered Shield model root matrixWorld; native Shield+1C runtime matrix binding unobserved'}});
      const matrixWorld=new THREE.Matrix4().fromArray(rootMatrix).multiply(new THREE.Matrix4().fromArray(model.prepareMatrix)).toArray();
      return [{shieldId:`${active.actorId}:${active.itemKey}:${revision}`,actorId:active.actorId,itemKey:active.itemKey,ownerSlot1c4:active.ownerSlot1c4,...geometry,matrixWorld,renderedOctreeMatrixWorld:model.octree.matrixWorld.toArray(),spherePrepareMatrix:[...model.prepareMatrix],sphereRootWorldMatrix:rootMatrix,coordinateSpace:'s5-world-after-single-source-boundary',sphereQualification:'source-producer-pipeline:indexed-corners→fixed-prepare→Ritter→current-root-world; format/prepare/root-bindings-open',localSphereVertexCount:model.preparedGeometry.localSphere.vertexCount,sourceSphereAlgorithmVerified:true,sourceGeometryIteratorOrderVerified:false,nativeProducerDispatchVerified:false,nativePrepareMatrixVerified:false,nativeSphereConstructionVerified:false,nativeTransformVerified:false,nativeReady:false}];
    },
    snapshot(){return {preparedItems:[...models.keys()],active:active?{...active}:null,age,revision,disposed,visible:boundary.visible,audioStatus,audioError,componentSound:'sound/defense.ogg',audioSpatialVerified:false,bodySoundHandle:null,bodySoundBlocker:'Resources/Sound/defense_on.ogg absent; no fallback',sequenceCoreStatus:coreRenderer?'explicit S5 particle renderer enabled; native parity unverified':'resource-ready; source bindings/clock available; S5 renderer opt-in disabled',pendingCoreStart,coreSequence:coreConsumer?.snapshot()??null,coreSequenceRender:coreRenderer?.snapshot()??null,animationPolicy:'s5-single-authored-model-clip-loop',modelEffectTracksStatus:'captured-source-tracks; S5 alpha/UV presentation policy',modelEffectTrackSnapshots:Object.fromEntries([...models].map(([id,m])=>[id,m.effects.snapshot()])),renderStatesVerified:false,nativeTransformVerified:false,rendered:false,nativeReady:false,nativeCompared:false};},
    dispose(){if(disposed)return;remove();stopAudio();coreConsumer?.dispose();coreRenderer?.dispose();disposed=true;for(const m of models.values())m.dispose();for(const t of textures.values())t.dispose();boundary.removeFromParent();soundBytes=null;},
  };
  return api;
}
