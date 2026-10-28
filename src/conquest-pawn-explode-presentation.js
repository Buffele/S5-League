import {createConquestModelGpuTemplates,createConquestEffectGpuWarmup} from './conquest-render-warmup.js';
import * as THREE from 'three';
import {prepareConquestPawnExplodeThirdEffect} from './conquest-pawn-explode-third-effect.js';
import {sceneAsset} from './scene-assets.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {CONQUEST_PAWN_EXPLODE_PRESENTATION_ASSETS as assets} from './conquest-pawn-explode-presentation-data.js';
import {resetNativeSequenceClock,advanceNativeSequenceClock} from './native-sequence-clock.js';
import {evaluateController1153a30} from './anchoring-model-controller.js';
import {compileTransformTrack,createTransformSampler11353b0} from './s5runtime-scn-transform-source.js';
import {createSrtBaselinePorts,SRT_POLICY} from './s5runtime-srt-math.js';
import {evaluateScnVisibility1257e90} from './anchoring-scn-scalar-source.js';

const banks=new WeakMap(),owners=new WeakMap(),models=new WeakMap();
const initialName='PVE_MON_PAWN_MOVE(BLACK2)',script='Script/MonsterAI_Pawn_Explode.lua';
export const CONQUEST_PAWN_EXPLODE_PRESENTATION_POLICY=Object.freeze({
 name:'s5-authored-pawn-explode-source-presentation-v2',
 texture:'authenticated1013 Scene.texture replaces the9 authored base-color maps; existing lightmaps/samplers preserved',
 models:'actual2 NodeLoader SCNs and exact named Pawn/pawn_ring parents; immutable source SRT channels, explicit baseline SRT math',
 scheduling:'S5 post-pose update;119FAE0 looping1700ms +1153A30 model clock, source duration8000ticks, rate1 explicit S5 instance policy',
 scalar:'source1257E90 stores C4 only; unknown material binding is not silently assigned to opacity',
 third:'two exact continuous source profiles and live pawn_top frame; texture loader prefers the indexed same-directory DDS',
 nativeReady:false,
});
const source=CONQUEST_SOURCE_DATA.monsters[1013],slots=Object.freeze(Array.from({length:3},(_,i)=>Object.freeze({index:i,parentName:source.Sequence['node_name_'+(i+1)],path:source.Sequence['file_name_'+(i+1)]})));
const nativeLimits=Object.freeze(['native-wrapper344-manager-lease-integration','native-node-loader-model-factory-and-scheduling','native-nodeC4-material-binding','native-general-D3DX-decomposition-and-rotation-math-parity','native-camera-admission-material-GPU-parity']);
function bytes(input){if(input instanceof ArrayBuffer)return new Uint8Array(input);if(input instanceof Uint8Array)return new Uint8Array(input);throw Error('Actual presentation asset bytes required');}
async function readChecked(fetchAsset,row){const response=await fetchAsset(row.url);if(!response?.ok)throw Error('PawnExplode presentation asset unavailable '+row.url);const b=bytes(await response.arrayBuffer()),h=new Uint8Array(await crypto.subtle.digest('SHA-256',b));if(b.length!==row.bytes||[...h].map(n=>n.toString(16).padStart(2,'0')).join('')!==row.sha256)throw Error('PawnExplode presentation asset identity changed');return b;}
function sourceActor(actor){const model=actor?.model;if(!(actor instanceof ConquestMonsterActor)||actor.spawnStats?.monsterKey!==1013||model?.monsterKey!==1013||model.source!=='model/monster/pve_mon_pawn.scn'||model.nativeSize!==actor.spawnStats.size||!model.nativeRoot?.isObject3D||actor.aiScriptLiteral!==script||source.Resources.ai_lua!==script||source.Scene.texture!=='Model/Monster/pve_mon_pawn_etex_2.dds'||source.Sequence.count!=='3')throw Error('Actual authenticated PawnExplode1013 actor/model/script required');return model;}
function compileModel(data,index){
 if(data.source!==assets.models[index].source||data.models.length!==2||data.bones.length||data.clips.length!==1||data.clips[0].name!==initialName||data.clips[0].durationTicks!==8000||data.models.some(m=>m.parent!==data.root.name||m.weights.length||Object.keys(m.animations).join()!==initialName||m.animations[initialName].durationTicks!==8000||m.animations[initialName].effect.morphKeys.length||m.textures.length!==1||m.textures[0].source!=='red_ring.dds'))throw Error('Exact PawnExplode authored two-mesh SCN profile required');
 return data.models.map(m=>({track:compileTransformTrack({track:m.animations[initialName],provenance:{source:data.source+' immutable unique authored animation '+initialName}}),scalar:m.animations[initialName].effect.floatKeys}));
}
function modelInstance(template,ringTexture){
 const group=new THREE.Group(),records=[],srt=createSrtBaselinePorts({policy:SRT_POLICY});group.name=template.data.source;
 for(const [i,original]of template.asset.meshes.entries()){
  const mesh=original.clone(false);mesh.geometry=original.geometry.clone();mesh.material=[].concat(original.material).map(m=>m.clone());for(const m of mesh.material){m.map=ringTexture;m.needsUpdate=true;}mesh.matrixAutoUpdate=false;mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);
  const row=template.channels[mesh.userData.sourceModelIndex],provenance={kind:'s5-explicit-adaptation',source:template.data.source+' selected unique source name; S5 post-pose renderer, native factory unobserved'},sampler=createTransformSampler11353b0({...srt,writeDestination48:{provenance,tick:({matrix})=>{mesh.matrix.fromArray(matrix);mesh.matrixWorldNeedsUpdate=true;}},writeLastClock0c:{provenance,tick({clockTicks}){mesh.userData.sourceAnimatorClock0c=clockTicks;}}});records.push({mesh,row,sampler,provenance});
 }
 return {group,records,sample(ticks){for(const r of records){const result=r.sampler.evaluate({selectedTrack:r.row.track,clockTicks:ticks,transitionActive:false,destinationPresent:true,selectionProvenance:r.provenance});if(!result.sampled)throw Error('PawnExplode model SRT branch unavailable '+result.branch);const scalar=evaluateScnVisibility1257e90({keys:r.row.scalar,timeTicks:ticks,destinationBound:true,selectedKeyDataPresent:true});r.mesh.userData.sourceNodeScalarC4=scalar.commands[0].value;}group.updateWorldMatrix(true,true);},dispose(){group.removeFromParent();for(const {mesh}of records){mesh.geometry.dispose();for(const m of mesh.material)m.dispose();}}};
}

// Prepare once, then instantiate synchronously at real actor birth. The bank
// owns decoded images/textures; each actor owns only its clones and materials.
export async function prepareConquestPawnExplodePresentation({fetchAsset=globalThis.fetch,decodeImage=globalThis.createImageBitmap,policy}={}){
 if(policy!==CONQUEST_PAWN_EXPLODE_PRESENTATION_POLICY||typeof fetchAsset!=='function'||typeof decodeImage!=='function')throw Error('Explicit PawnExplode partial presentation policy and asset decoders required');
 const textureBytes=await readChecked(fetchAsset,assets.texture),ringBytes=await readChecked(fetchAsset,assets.ringTexture),data=await Promise.all(assets.models.map(async row=>JSON.parse(new TextDecoder().decode(await readChecked(fetchAsset,row))))),templates=[],images=[];
 let texture,ringTexture,thirdBank,disposed=false;const children=new Set();
 try{
  for(const b of [textureBytes,ringBytes])images.push(await decodeImage(new Blob([b],{type:'image/png'})));
  texture=new THREE.Texture(images[0]);ringTexture=new THREE.Texture(images[1]);for(const t of [texture,ringTexture]){t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;}
  thirdBank=await prepareConquestPawnExplodeThirdEffect({fetchAsset,decodeImage});
  for(const [i,d]of data.entries()){const channels=compileModel(d,i),copy={...d,models:d.models.map(m=>({...m,textures:m.textures.map(t=>({...t,name:null,lightmap:null}))}))};templates.push({data:d,channels,asset:await sceneAsset(copy,{effect:true})});}
 }catch(error){thirdBank?.dispose();texture?.dispose();ringTexture?.dispose();for(const image of images)image.close?.();for(const t of templates)for(const m of t.asset.meshes){m.geometry.dispose();for(const material of [].concat(m.material))material.dispose();}throw error;}
 function live(){if(disposed)throw Error('Disposed PawnExplode presentation bank');}
 let gpuWarmup=null;const bank=Object.freeze({async warm(renderer,camera,scene){live();if(!gpuWarmup){const templatesGpu=createConquestModelGpuTemplates(templates.flatMap(template=>template.asset.meshes.map(original=>({geometry:original.geometry,material:[].concat(original.material).map(material=>{const copy=material.clone();copy.map=ringTexture;copy.needsUpdate=true;return copy;})}))));gpuWarmup=createConquestEffectGpuWarmup({...templatesGpu,textures:[texture,ringTexture],assertCurrent:live,disposeTemplates:templatesGpu.dispose});}const reports=[await gpuWarmup.warm(renderer,camera,scene),await thirdBank.warm(renderer,camera,scene)];live();return reports;},
  create({actor,renderModelEffects=false,particles}={}){
   live();if(typeof renderModelEffects!=='boolean')throw Error('Explicit authored model-effect opt-in required');const model=sourceActor(actor);if(models.has(model))throw Error('PawnExplode model presentation already owned');
   const materials=[...new Set(model.meshes.flatMap(m=>[].concat(m.material)))],saved=[],instances=[];let ownTexture,thirdEffect=null,ownerDisposed=false,effectsCleared=false;
   if(materials.length!==9||materials.some(m=>!m.map?.isTexture||['anisotropy','wrapS','wrapT','generateMipmaps','minFilter','magFilter'].some(k=>m.map[k]!==materials[0].map[k])))throw Error('Exact9 authored Pawn base-color material maps required');
   try{
    ownTexture=texture.clone();ownTexture.anisotropy=materials[0].map.anisotropy;ownTexture.wrapS=materials[0].map.wrapS;ownTexture.wrapT=materials[0].map.wrapT;ownTexture.generateMipmaps=materials[0].map.generateMipmaps;ownTexture.minFilter=materials[0].map.minFilter;ownTexture.magFilter=materials[0].map.magFilter;ownTexture.needsUpdate=true;
    for(const material of materials){saved.push({material,map:material.map});material.map=ownTexture;material.needsUpdate=true;}
    if(renderModelEffects)for(const [i,template]of templates.entries()){const parent=model.findSourceNode(slots[i].parentName);if(!parent||!parent.isObject3D)throw Error('Exact source PawnExplode attachment node absent '+slots[i].parentName);const instance=modelInstance(template,ringTexture);parent.add(instance.group);instances.push({instance,parent,clock:0,started:false});instance.sample(0);}
    if(particles!==undefined){if(!renderModelEffects)throw Error('Complete source presentation requires the authored model effects');thirdEffect=thirdBank.create({actor,...particles});}
   }catch(error){thirdEffect?.dispose();for(const row of saved){row.material.map=row.map;row.material.needsUpdate=true;}for(const {instance}of instances)instance.dispose();ownTexture?.dispose();throw error;}
   const sourceEffectsPrepared=thirdEffect!==null;const clock={looping:true,precisionBits:24,roundingMode:'nearest'};resetNativeSequenceClock(clock,1700);
   function current(){live();if(ownerDisposed||sourceActor(actor)!==model||models.get(model)!==owner||saved.some(r=>r.material.map!==ownTexture)||instances.some(r=>r.instance.group.parent!==r.parent||model.findSourceNode(r.parent.name)!==r.parent))throw Error('Stale/replaced PawnExplode presentation owner');}
   const owner=Object.freeze({
    update(deltaMs){current();if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Unsigned source presentation deltaMs required');if(deltaMs===0)return owner.snapshot();const timing=advanceNativeSequenceClock(clock,deltaMs);if(timing.dispatch)for(const r of instances){if(r.started)r.clock=evaluateController1153a30({clock:r.clock,duration:8000,raw38:true,raw39:true,rate:1,dtNativeUint32:deltaMs}).clock;r.started=true;r.instance.sample(r.clock);}thirdEffect?.update(deltaMs);return owner.snapshot();},
    clearPersistentEffects(){current();const removed=instances.length;for(const r of instances.splice(0))r.instance.dispose();const removedThird=thirdEffect!==null;thirdEffect?.dispose();thirdEffect=null;effectsCleared=true;return Object.freeze({removedS5ModelEffects:removed,removedS5ParticleSequences:Number(removedThird),sourceRequestedEffects:3,nativeComplete344ReleaseQualified:false,nativeReady:false});},
    snapshot(){current();return {kind:'s5-authored-pawn-explode-source-presentation',monsterKey:1013,textureApplied:true,textureMaterialCount:saved.length,modelEffectsRendered:instances.length,retainedS5Effects344:instances.length+Number(thirdEffect!==null),persistentEffectsCleared:effectsCleared,sourcePersistentEffects:slots,missingPersistentEffects:renderModelEffects?(sourceEffectsPrepared?[]:[slots[2]]):slots,sequenceTimeMs:clock.current,modelClocksTicks:instances.map(r=>r.clock),thirdEffect:thirdEffect?.snapshot()??null,persistentSourceComplete:renderModelEffects&&sourceEffectsPrepared,nativeWrapper344Qualified:false,nativeNodeScalarMaterialBindingQualified:false,nativeReady:false,unresolved:nativeLimits};},
    dispose(){if(ownerDisposed)return;ownerDisposed=true;const errors=[];for(const {instance}of instances)try{instance.dispose();}catch(e){errors.push(e);}try{thirdEffect?.dispose();}catch(e){errors.push(e);}thirdEffect=null;for(const r of saved){if(r.material.map===ownTexture){r.material.map=r.map;r.material.needsUpdate=true;}else errors.push(Error('PawnExplode material was replaced before cleanup'));}ownTexture.dispose();children.delete(owner);if(models.get(model)===owner)models.delete(model);if(errors.length)throw new AggregateError(errors,'PawnExplode presentation cleanup failed');},
   });models.set(model,owner);children.add(owner);owners.set(owner,{bank,actor,model,current});return owner;
  },
  snapshot(){live();return {activeActors:children.size,preparedTextures:2,preparedModelTemplates:2,preparedSourceSequences:3,nativeReady:false};},
  dispose(){if(disposed)return;if(children.size)throw Error('PawnExplode presentation bank has active actor owners');disposed=true;gpuWarmup?.dispose();thirdBank.dispose();for(const t of templates)for(const m of t.asset.meshes){m.geometry.dispose();for(const material of [].concat(m.material))material.dispose();}texture.dispose();ringTexture.dispose();for(const image of images)image.close?.();},
 });banks.set(bank,{live});return bank;
}
export function assertConquestPawnExplodePresentation(owner,{actor,bank}={}){const r=owners.get(owner);if(!r||r.actor!==actor||bank!==undefined&&r.bank!==bank)throw Error('Typed actual PawnExplode presentation owner required');r.current();return owner;}
