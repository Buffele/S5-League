import * as THREE from 'three';
import { DDSLoader } from 'three/addons/loaders/DDSLoader.js';
import {buildAnimationClips,splitClips} from './animation-data.js';
import {AnimationPlayer} from './animation-player.js';
import {playAvatarLowerChannel} from './avatar-lower-playback.js';
import {buildDirectionalAirClips} from './air-poses.js';
import {buildFireballClip} from './fireball-animation.js';
import {FIREBALL} from './fireball.js';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {WallPoseContact} from './wall-pose-contact.js';
import {equipmentModelMatrix,prepareEquipmentRig,resolveEquipmentAttachment} from './equipment-rig.js';
import {readAsset} from './scene-assets.js';
import {WEAPON_CHOICES} from './loadout.js';
import {loadAnimeSprint} from './anime-sprint.js';
import {loadMixamoLocomotion} from './mixamo-locomotion.js';
import {buildSmoothWalkClips,withSmoothWalkPhase} from './walk-smoothing.js';
import {BLENDER_WALK_ENABLED,loadBlenderWalkExperiments,withBlenderWalkPhase} from './blender-walk-experiment.js';
import {loadMeshyRunFast} from './meshy-run-fast.js';
import {mergeRigAnimationDelta} from './rig-animation-delta.js';
import {katanaMaterial,applyKatanaRenderFlags} from './equipment-material.js';
import {createResourceCache} from './resource-cache.js';
import {createWeaponFitting} from './weapon-fitting.js';
import {appendEquipmentOpacityTracks} from './equipment-opacity.js';
const avatarTexture=createResourceCache(async name=>{
 const texture=name.startsWith('/')?await new THREE.TextureLoader().loadAsync(name):await new DDSLoader().loadAsync('/assets/'+name);
 texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
});

// SCN uses row-vector matrices; Three's column-major array consumes the same
// serialized elements. Bone bind matrices are world-space, animation keys local.
const mat = a => new THREE.Matrix4().fromArray(a);
// Live S5Runtime actor+0x70 -> male_bip.scn: node scale (+0x28/+0x2C/+0x30)
// and all three world-matrix axis lengths are 1.3. This is model scale,
// independent of the map/physics unit conversion.
export const CHARACTER_MODEL_SCALE=1.3;
export const weaponAssetId=weapon=>weapon==='submachinegun'?'submachine-gun':weapon==='smashrifle'?'smash-rifle':weapon==='semirifle'?'semi-rifle':weapon==='twinblade'?'twin-blade':weapon;
const EQUIPPED_OPACITY_ASSETS={sigmablade:'/assets/s5runtime/sigma-blade/equipment-opacity.json',twinblade:'/assets/weapons/twin-blade/equipment-opacity.json',deathscythe:'/assets/weapons/death-scythe/equipment-opacity.json'};

function clothingAssetPath(appearance,sex,outfit){return appearance==='meshy'?`/assets/characters/meshy/outfit-${sex}.json`:appearance==='s5runtime'?`/assets/s5runtime/outfit-${sex}-${outfit}.json`:'/assets/s4-model-reference.json';}
export async function preloadAvatarAppearance({appearance='s5runtime',sex='male',outfit='01'}={}){
 if(appearance==='urban'&&sex!=='male')throw Error('Urban is only available on the male rig');
 const [,clothing]=await Promise.all([readAsset(`/assets/s5runtime/rig-${sex}.json`),appearance==='urban'?[]:readAsset(clothingAssetPath(appearance,sex,outfit))]);
 const names=new Set(clothing.filter(file=>!file.source.includes('/weapon/')).flatMap(file=>file.models.flatMap(model=>model.textures.map(texture=>texture.name).filter(Boolean))));
 await Promise.all([...names].map(avatarTexture));
 if(appearance==='anime')await import('./anime-character.js');
 if(appearance==='urban')await import('./urban-character.js');
 return {appearance,sex,outfit,textures:names.size};
}

export async function loadAvatar({appearance='s5runtime',sex='male',outfit='01',weapon='dagger',weaponSkin='classic',weaponAssetPath=null,animationDelta=null,initialClip=null,diagnosticMaterial=null,shieldAnimations=false,weaponFit}={}) {
  if(appearance==='urban'&&sex!=='male')throw Error('This new skin preview currently uses the male rig.');
  const sigmaBothForms=weapon==='sigmablade'&&!weaponAssetPath;
  if(weapon==='demonicknuckle'){animationDelta??=`/assets/s5runtime/demonic-knuckle/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/demonic-knuckle/model.json';}
  if(weapon==='deathscythe'){animationDelta??=`/assets/s5runtime/death-scythe/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/death-scythe/model.json';}
  if(weapon==='vitalshock'){animationDelta??=`/assets/s5runtime/vital-shock/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/vital-shock/model.json';}
  if(weapon==='sigmablade'){animationDelta??=`/assets/s5runtime/sigma-blade/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/sigma-blade/model.json';}
  if(weapon==='revolver'){animationDelta??=`/assets/s5runtime/animations/revolver/${sex}.json`;weaponAssetPath??='/assets/s5runtime/weapons/revolver/model.json';}
  if(weapon==='handgun'){animationDelta??=`/assets/s5runtime/handgun/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/handgun/model.json';initialClip??='QQ000';}
  if(weapon==='assaultrifle'){animationDelta??=`/assets/s5runtime/assault-rifle/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/assault-rifle/model.json';initialClip??='AS000';}
  if(weapon==='burstshotgun'){animationDelta??=`/assets/s5runtime/burst-shotgun/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/burst-shotgun/model.json';initialClip??='SS000';}
  if(weapon==='heavymachinegun'){animationDelta??=`/assets/s5runtime/heavy-machine-gun/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/heavy-machine-gun/model.json';initialClip??='F0002';}
  if(weapon==='breaker')animationDelta??=`/assets/s5runtime/animations/breaker/${sex}.json`;
  if(weapon==='katana')animationDelta??=`/assets/s5runtime/animations/katana/${sex}.json`;
  if(weapon==='airgun')animationDelta??=`/assets/s5runtime/animations/airgun/${sex}.json`;
  if(weapon==='cannonade')animationDelta??=`/assets/s5runtime/animations/cannonade/${sex}.json`;
  if(weapon==='rocketlauncher'){animationDelta??=`/assets/s5runtime/animations/rocket-launcher/${sex}.json`;weaponAssetPath??='/assets/s5runtime/weapon-rocket-launcher-classic.json';}
  if(weapon==='semirifle')animationDelta??=`/assets/s5runtime/animations/semi-rifle/${sex}.json`;
  if(weapon==='submachinegun')animationDelta??=`/assets/s5runtime/animations/submachine-gun/${sex}.json`;
  if(weapon==='twinblade'){animationDelta??=`/assets/s5runtime/twin-blade/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/twin-blade/model.json';}
  if(weapon==='bat'){animationDelta??=`/assets/s5runtime/bat/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/bat/model.json';}
  if(weapon==='ironboots'){animationDelta??=`/assets/s5runtime/iron-boots/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/iron-boots/model.json';}
  if(weapon==='assassinclaw'){animationDelta??=`/assets/s5runtime/assassin-claw/animations/${sex}.json`;weaponAssetPath??='/assets/s5runtime/assassin-claw/model.json';}
  const [baseReference, clothing, equipmentFiles, delta, shieldDelta, equipmentOpacity] = await Promise.all([
    readAsset(`/assets/s5runtime/rig-${sex}.json`),
    appearance==='urban'?Promise.resolve([]):readAsset(clothingAssetPath(appearance,sex,outfit)),
    sigmaBothForms?Promise.all([readAsset('/assets/s5runtime/sigma-blade/model.json'),readAsset('/assets/s5runtime/sigma-blade/model-transformed.json')]).then(([normal,transformed])=>[...normal.map(f=>({...f,sigmaTransformed:false})),...transformed.map(f=>({...f,sigmaTransformed:true}))]):readAsset(weaponAssetPath||`/assets/s5runtime/weapon-${weaponAssetId(weapon)}-${weaponSkin}.json`),
    animationDelta?readAsset(animationDelta):null,
    shieldAnimations?readAsset(`/assets/s5runtime/skill-runtime/shield/animations/${sex}.json`):null,
    EQUIPPED_OPACITY_ASSETS[weapon]?readAsset(EQUIPPED_OPACITY_ASSETS[weapon]):null,
  ]);
  // Equipment adds definitions to this array. Cached rig JSON is shared by
  // concurrent weapon loads; each avatar must own its equipment additions.
  let reference=delta?mergeRigAnimationDelta(baseReference,delta):{...baseReference,bones:[...baseReference.bones]};
  if(shieldDelta)reference=mergeRigAnimationDelta(reference,shieldDelta);
  const files=[...clothing.filter(f=>!f.source.includes('/weapon/')),...equipmentFiles];
  const equipment=prepareEquipmentRig(reference,files);
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(SCN_SCENE_SCALE*CHARACTER_MODEL_SCALE);
  group.add(rig);
  const bones = new Map(reference.bones.map(d=>[d.name,new THREE.Bone()]));
  const definitions = new Map(reference.bones.map(d=>[d.name,d]));
  for (const d of reference.bones) {
    const b=bones.get(d.name); b.name=d.name;
    const parent=bones.get(d.parent);
    (parent||rig).add(b);
    const local=mat(d.matrix);
    if(parent) local.premultiply(mat(definitions.get(d.parent).matrix).invert());
    local.decompose(b.position,b.quaternion,b.scale);
  }
  rig.updateMatrixWorld(true);
  const gradient = new THREE.DataTexture(new Uint8Array([80,160,235]),3,1,THREE.RedFormat);
  gradient.needsUpdate=true;
  const textures=new Map();
  const textureNames=new Set(files.flatMap(f=>f.models.flatMap(m=>m.textures.map(t=>t.name).filter(Boolean))));
  const unresolvedTextures=files.flatMap(f=>f.models.flatMap(m=>m.textures.filter(t=>!t.name)));
  if(unresolvedTextures.length&&!diagnosticMaterial)throw Error(`Missing decoded texture payload for ${weapon}`);
  for(const name of textureNames) {
    // Some original SCNs label DDS files .tga. The extractor preserves references;
    // loader detects the actual DDS header, not the filename extension.
    const texture=await avatarTexture(name);
    texture.flipY=false;
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    textures.set(name,texture);
  }
  const meshes=[];
  for(const f of files) for(const [sourceModelIndex,d] of f.models.entries()) {
    if(!d.vertices.length) continue;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(d.vertices,3));
    if(d.normals.length===d.vertices.length) geo.setAttribute('normal',new THREE.Float32BufferAttribute(d.normals,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(d.uv,2));
    geo.setIndex(d.indices);
    if(!geo.attributes.normal) geo.computeVertexNormals();
    // Qualify authored equipment flags separately from character materials.
    // Vital's alpha/additive fingertips and Demonic's 26 unlit inserts retain
    // their authored lighting. Unqualified solids keep their current material.
    const sourceWeaponMaterial=f.attachment&&(weapon==='katana'||weapon==='vitalshock'||weapon==='sigmablade'&&!!(d.renderState&32)||weapon==='demonicknuckle'&&d.renderState===1);
    const materials=d.textures.map(t=>sourceWeaponMaterial&&t.name?katanaMaterial(d,textures.get(t.name),gradient):new THREE.MeshToonMaterial(t.name?{map:textures.get(t.name),gradientMap:gradient,side:THREE.DoubleSide,alphaTest:.45}:{color:diagnosticMaterial,gradientMap:gradient,side:THREE.DoubleSide}));
    d.textures.forEach((t,i)=>geo.addGroup(t.start*3,t.count*3,i));
    let mesh;
    if(d.weights.length) {
      const influences=Array.from({length:d.vertices.length/3},()=>[]);
      d.weights.forEach((w,i)=>w.values.forEach(([index,weight])=>{
        if(!Number.isInteger(index)||!influences[index]) throw Error(`Invalid skin index ${d.name}: ${index}`);
        if(weight>0) influences[index].push([i,weight]);
      }));
      const indices=[],weights=[];
      influences.forEach(list=>{
        list.sort((a,b)=>b[1]-a[1]); const top=list.slice(0,4),sum=top.reduce((s,v)=>s+v[1],0);
        if(!sum) throw Error(`Unweighted vertex: ${d.name}`);
        for(let j=0;j<4;j++){indices.push(top[j]?.[0]??0);weights.push((top[j]?.[1]??0)/sum);}
      });
      geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
      geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
      mesh=new THREE.SkinnedMesh(geo,materials);
      const skeleton=new THREE.Skeleton(d.weights.map(w=>{
        const name=equipment.get(f)?.get(w.bone)||w.bone;
        if(!bones.has(name)) throw Error('Missing bone '+name);
        return bones.get(name);
      }),d.weights.map(w=>mat(w.matrix)));
      rig.add(mesh);
      mesh.bind(skeleton,new THREE.Matrix4());
      mesh.frustumCulled=false;
    } else {
      mesh=new THREE.Mesh(geo,materials);
      // Equipment files contain local attachment transforms, not skeleton globals.
      const localNode=resolveEquipmentAttachment(equipment,f,d);
      if(localNode){
        bones.get(localNode).add(mesh);
        // An exact model node already carries this transform in its animation
        // tracks (Plasma/Dagger). Only a fallback ancestor, as for Breaker,
        // needs the remaining model-local transform on the rigid mesh.
        if(!equipment.get(f)?.has(d)&&!equipment.get(f)?.has(d.name))equipmentModelMatrix(f,d).decompose(mesh.position,mesh.quaternion,mesh.scale);
      }else {rig.add(mesh);mat(d.matrix).decompose(mesh.position,mesh.quaternion,mesh.scale);}
    }
    mesh.userData.source=f.source;mesh.userData.sourceModelIndex=sourceModelIndex;mesh.userData.weapon=!!(f.attachment||f.weaponWearable);
    if(appearance==='meshy'&&!mesh.userData.weapon)mesh.userData.characterSkin='meshy';
    if(sigmaBothForms&&mesh.userData.weapon){mesh.userData.sigmaTransformed=f.sigmaTransformed;mesh.visible=!f.sigmaTransformed;}
    mesh.name=d.name;
    // Katana's authored scales hide the held blade and show the sheathed
    // duplicate in KT004. A global hideblade override removes its handle.
    mesh.castShadow=true;if(sourceWeaponMaterial)applyKatanaRenderFlags(mesh,d);
    mesh.receiveShadow=true;meshes.push(mesh);
  }
  const originals=buildAnimationClips(reference,bones);
  const equipmentOpacityRuntime=equipmentOpacity?appendEquipmentOpacityTracks(originals,equipmentFiles,meshes,equipmentOpacity):null;
  const nativeSprint=originals.find(c=>c.name==='00068');
  const [animeSprint,mixamoClips,meshyRunFast,blenderWalks]=await Promise.all([loadAnimeSprint(sex,bones,nativeSprint),loadMixamoLocomotion(sex,bones,nativeSprint),loadMeshyRunFast(sex,bones,nativeSprint),BLENDER_WALK_ENABLED&&weapon==='dagger'?loadBlenderWalkExperiments(sex,bones,originals,reference):[]]);
  const katonClip=buildFireballClip(originals,bones,{sex});
  const clips=[...originals,...(weapon==='dagger'?buildSmoothWalkClips(originals,bones):[]),...blenderWalks,katonClip,...buildDirectionalAirClips(originals,bones),animeSprint,...mixamoClips,meshyRunFast];
  const player=new AnimationPlayer(rig,[...clips,...splitClips(clips,reference,bones)]);
  const {mixer,actions}=player;
  let current=null,layered=false,lastRestartKey=null,lastLowerRestartKey=null,channelTimes={};
  const hiddenEquipment=new Map();
  function setWeaponForm(transformed){
    if(!sigmaBothForms)return;
    for(const mesh of meshes)if(mesh.userData.weapon){
      const visible=mesh.userData.sigmaTransformed===!!transformed;
      if(hiddenEquipment.has(mesh))hiddenEquipment.set(mesh,visible);else mesh.visible=visible;
    }
  }
  function castingEquipment(casting){
    if(casting){for(const mesh of meshes)if(mesh.userData.weapon&&!hiddenEquipment.has(mesh)){hiddenEquipment.set(mesh,mesh.visible);mesh.visible=false;}}
    else{for(const [mesh,visible] of hiddenEquipment)mesh.visible=visible;hiddenEquipment.clear();}
  }
  const helper=new THREE.SkeletonHelper(rig);helper.visible=false;
  function play(name,{loop=true,fade=.12,restart=false,speed=1}={}) {
    castingEquipment(name===FIREBALL.clip);
    channelTimes={};
    if(layered){player.stopAll();layered=false;lastLowerRestartKey=null;}
    current=player.play(name,{loop,fade,restart,speed});
  }
  function motion(sample){
    sample=withBlenderWalkPhase(withSmoothWalkPhase(sample,player.channels.get('upper')),player.channels.get('upper'));
    if(weapon==='sigmablade')setWeaponForm(!!sample.transformed);
    castingEquipment(sample.clip===FIREBALL.clip);
    channelTimes={upper:sample.time,upperAim:sample.time,lower:sample.lower?undefined:sample.time};
    const restart=lastRestartKey!==`${sample.clip}/${sample.restartKey}`;
    lastRestartKey=`${sample.clip}/${sample.restartKey}`;
    // Keep the same two channels throughout gameplay. Switching to a strike
    // must crossfade from the current pose, not briefly restore the bind pose.
    if(!layered){player.stopAll();layered=true;}
    if(sample.aimBlend){
      // Opt-in source-pose blending for pointer pitch. Existing weapon fades
      // retain their path; these two upper poses share exactly one clock.
      player.clearTransition('upper');
      current=player.play(sample.clip+':upper',{...sample,fade:0,channel:'upper',restart});
      const aim=player.play(sample.aimBlend.clip+':upper',{...sample,fade:0,channel:'upperAim',restart:false});
      current.stopFading().setEffectiveWeight(1-sample.aimBlend.weight);
      aim.stopFading().setEffectiveWeight(sample.aimBlend.weight);
    }else{
      player.stopChannel('upperAim');
      player.channels.get('upper')?.setEffectiveWeight(1);
      current=player.play(sample.clip+':upper',{...sample,channel:'upper',restart});
    }
    lastLowerRestartKey=playAvatarLowerChannel(player,sample,{bodyRestart:restart,previousKey:lastLowerRestartKey}).key;
  }
  const firstClip=WEAPON_CHOICES[weapon]?.idleBySex?.[sex]||WEAPON_CHOICES[weapon]?.idle||initialClip||originals[0]?.name;
  if(!firstClip)throw Error(`No initial animation for ${weapon}`);
  play(firstClip);mixer.update(0);equipmentOpacityRuntime?.sync();
  if(appearance==='anime'){
    const {createAnimeCharacter}=await import('./anime-character.js');
    createAnimeCharacter(rig,bones,definitions);
    for(const mesh of meshes)mesh.visible=mesh.userData.weapon;
  }
  if(appearance==='urban'){
    const {createUrbanCharacter}=await import('./urban-character.js');
    const character=createUrbanCharacter(rig,bones,definitions);
    meshes.push(...character.meshes);
    // These meshes share the original bones, so no retargeting or new clips.
    rig.updateMatrixWorld(true);character.skeleton.update();
  }
  const wallPose=new WallPoseContact(group,rig);
  group.updateMatrixWorld(true);
  const weaponFitting=weaponSkin==='meshy'?createWeaponFitting({weapon,meshes,bones,profile:weaponFit}):null;
  return {group,rig,bones,meshes,helper,clips,actions,mixer,play,motion,wallPose,weaponFitting,source:reference.source,sex,weapon,
    dispose(){
      player.stopAll();mixer.uncacheRoot(rig);group.removeFromParent();helper.removeFromParent();
      const geometries=new Set(),materials=new Set(),skeletons=new Set();
      for(const root of [group,helper])root.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);
        if(object.skeleton)skeletons.add(object.skeleton);
      });
      for(const skeleton of skeletons)skeleton.dispose();
      for(const geometry of geometries)geometry.dispose();
      for(const material of materials)material.dispose();
      // Maps belong to avatarTexture's shared cache. Only this gradient is owned.
      gradient.dispose();
    },
    setWeaponForm,
    playbackTimes:()=>player.playbackTimes(),inheritPlayback:times=>{player.inheritPlayback(times);equipmentOpacityRuntime?.sync();},
    capturePose:()=>player.capturePose(bones),preparePoseSampling:()=>player.preparePoseSampling(),poseKeys:()=>player.poseKeys(bones),
    prepareSwitch:()=>{player.stopAll();layered=false;lastRestartKey=null;lastLowerRestartKey=null;},
    katon:katonClip.userData,
    update:(dt,times)=>{player.update(dt,times?{...channelTimes,...times}:channelTimes);equipmentOpacityRuntime?.sync();weaponFitting?.syncSaved(dt);},get clip(){return current?.getClip().name;}};
}
