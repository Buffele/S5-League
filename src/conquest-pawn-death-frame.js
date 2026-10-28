import * as THREE from 'three';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {assertConquestPawnExplodePresentation} from './conquest-pawn-explode-presentation.js';

const owners=new WeakMap(),receipts=new WeakMap(),f=Math.fround;
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));

// Both authored actors use the same SCN/death SEQ and inherited Death class.
// The1013 persistent effect collection is checked separately at capture time.
export function assertConquestPawnDeathActorSource(actor){
 const key=actor?.spawnStats?.monsterKey,source=CONQUEST_SOURCE_DATA.monsters[key];
 if(!(actor instanceof ConquestMonsterActor)||![1003,1013].includes(key)||actor.model.monsterKey!==key||actor.model.source.toLowerCase()!=='model/monster/pve_mon_pawn.scn'||actor.aiScriptLiteral.toLowerCase()!==(key===1003?'script/monsterai_pawn_normal.lua':'script/monsterai_pawn_explode.lua')||source?.Scene?.value1?.toLowerCase()!==actor.model.source.toLowerCase()||source.Scene.death_effect!=='Effects/pawn_death.seq')throw Error('Actual authenticated Pawn1003/1013 Death source required');
 return actor;
}

// AFC550 captures actor7C into wrapper4C. AFE920 resets the separate root's
// rotation/scale, then AFC940 writes that captured position and rebuilds SRT.
// This owner implements that static Death-frame branch, not a SEQ controller.
// Its logical root must NOT also translate already world-positioned particles.
export function createConquestPawnDeathFrame({actor,state,world,scene,persistentPresentation}={}){
 assertConquestPawnDeathActorSource(actor);
 if(!(state instanceof ConquestMonsterDeathState)||state.actor!==actor||actor.eligibleVirtual44!==false||!Number.isFinite(actor.health)||actor.health>0||world?.nativeMapId!==46||!world.group?.isObject3D||!scene?.isScene||rootOf(world.group)!==scene||rootOf(actor.model.group)!==scene)throw Error('Actual entered Pawn Death, map46 and retained scene owners required');
 if(actor.spawnStats.monsterKey===1013){assertConquestPawnExplodePresentation(persistentPresentation,{actor});const owned=persistentPresentation.snapshot();if(!owned.persistentSourceComplete||!owned.persistentEffectsCleared||owned.retainedS5Effects344!==0)throw Error('Actual1013 three persistent effects must be cleared before Death capture');}
 // Only this scene's own matrix is part of the coordinate-boundary proof.
 // Traversing its descendants here repeats every map/actor pose evaluation
 // for every particle assertion; model.update retains the post-mixer pass.
 scene.updateWorldMatrix(false,false,true);
 if(scene.parent!==null||!equal(scene.matrixWorld.elements,identity()))throw Error('Identity S5 scene coordinate boundary required for static native Death frame');
 const captured=Object.freeze(['x','y','z'].map(key=>f(actor.positionNative[key])));
 if(!captured.every(Number.isFinite))throw Error('Finite captured source Pawn Death position required');
 const enterBase=actor.nativeField33C===2,sourceSequence=CONQUEST_SOURCE_DATA.monsters[actor.spawnStats.monsterKey].Scene.death_effect;
 if(typeof sourceSequence!=='string'||!sourceSequence)throw Error('Authored Pawn Death sequence required');
 const sequencePath=enterBase?'Resources/Effects/enter_base.seq':sourceSequence;
 const logicalRoot=new THREE.Group(),renderGroup=new THREE.Group();
 logicalRoot.name='Conquest Pawn captured Death frame';renderGroup.name='Conquest Pawn world-space Death visuals';
 logicalRoot.position.fromArray(captured).multiplyScalar(SCN_SCENE_SCALE);logicalRoot.scale.setScalar(SCN_SCENE_SCALE);
 scene.add(logicalRoot,renderGroup);logicalRoot.updateMatrixWorld(true);renderGroup.updateMatrixWorld(true);
 const logicalMatrix=logicalRoot.matrix.toArray(),logicalWorldMatrix=logicalRoot.matrixWorld.toArray();
 // D3DX's SRT matrix sums translation with positive zero. Its rebuilt world
 // translation therefore canonicalizes -0, while wrapper4C keeps input bits.
 const origin=Object.freeze(captured.map(value=>f(value+0))),sourceMatrix=identity();sourceMatrix.splice(12,3,...origin);
 let disposed=false;
 function live(){
  if(disposed||rootOf(world.group)!==scene||logicalRoot.parent!==scene||renderGroup.parent!==scene)throw Error('Current retained Pawn Death root/scene required');
  // These three matrices are the complete static-frame invariant. Refresh
  // them (including manual matrix writes), without visiting unrelated models,
  // skeletons or the particle renderables below these identity containers.
  scene.updateWorldMatrix(false,false,true);
  logicalRoot.updateWorldMatrix(false,false,true);
  renderGroup.updateWorldMatrix(false,false,true);
  if(scene.parent!==null||!equal(scene.matrixWorld.elements,identity())||!equal(logicalRoot.matrix.elements,logicalMatrix)||!equal(logicalRoot.matrixWorld.elements,logicalWorldMatrix)||!equal(renderGroup.matrixWorld.elements,identity()))throw Error('Static Pawn Death frame or identity render container changed');
 }
 const api=Object.freeze({logicalRoot,renderGroup,sequencePath,
  readFrame(){
   live();
   const receipt=Object.freeze({kind:'conquest-owned-pawn-death-frame',sequencePath,enterBase,
    originNative:origin,capturedPositionNative:captured,rotationQuaternionNative:Object.freeze([0,0,0,1]),quaternionNative:Object.freeze([0,0,0,1]),
    rotationAxisNative:Object.freeze([0,0,0]),rotationDegrees:0,parentScale:1,matrixNative:Object.freeze([...sourceMatrix]),
    sourceCapturedPositionQualified:true,sourceStaticRootResetQualified:true,sourceFramePolicy:'AFC550-capture;AFE920-static-reset;AFC940-position',
    sceneScale:SCN_SCENE_SCALE,renderContainerWorldIdentity:true,clockQualified:false,admissionQualified:false,lifetimeQualified:false,nativeReady:false});
   receipts.set(receipt,api);return receipt;
  },
  snapshot(){live();return {sequencePath,enterBase,capturedPositionNative:[...captured],followsActor:false,renderContainerWorldIdentity:true,clockQualified:false,admissionQualified:false,lifetimeQualified:false,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;logicalRoot.removeFromParent();renderGroup.removeFromParent();},
 });
 owners.set(api,{actor,state,world,scene,live});return api;
}
export function assertConquestPawnDeathFrame(owner,{actor,world,scene}={}){
 const record=owners.get(owner);if(!record||record.actor!==actor||record.world!==world||record.scene!==scene)throw Error('Typed current Pawn Death frame owner required');record.live();return owner;
}
export function assertConquestPawnDeathFrameReceipt(receipt,{owner}={}){
 const record=owners.get(owner);if(!record||receipts.get(receipt)!==owner)throw Error('Original typed Pawn Death frame receipt required');record.live();return receipt;
}
