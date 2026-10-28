// RookExplode1110 source-bound use of the already qualified CActParticle stages; own source/frame receipts.
import * as THREE from 'three';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {assertConquestRookExplodeActor} from './conquest-rook-explode-source.js';
import {assertConquestRookExplodePresentation} from './conquest-rook-explode-presentation.js';
import {assertConquestMonsterDefenseAuraFields} from './conquest-monster-defense-aura-fields.js';
import {ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {conquestRookExplodeParticleSequence} from './conquest-rook-explode-particle-source.js';
import {nativeSequenceParent} from './native-sequence-parent.js';
import {conquestPawnExplodeFrameFields,CONQUEST_PAWN_EXPLODE_FRAME_POLICY} from './conquest-pawn-explode-frame.js';
const owners=new WeakMap(),receipts=new WeakMap(),f=Math.fround,root=n=>{while(n?.parent)n=n.parent;return n;};
export const CONQUEST_ROOK_EXPLODE_PARTICLE_FRAME_POLICY=Object.freeze({name:'s5-rook-authored-parent-and-live-scn-frame-v1',parent:'119F5D0 external0 or action1, exact action index and named real SCN node',matrix:'current post-mixer Object3D frame; remove .006 once',recipient:'explicit S5 live authenticated recipient model root; native condition-effect attachment parity remains false',decomposition:'S5 Matrix4 decomposition and baseline quaternion math; native D3DX parity false',nativeReady:false});

// Real parentType1 is retained: aura action2 belongs to action0, and shield
// particles belong to named bones of actual NodeLoader action3, not actor root.
export function createConquestRookExplodeParticleFrames({source,actor,world,scene,presentation,recipientFields,state,policy}={}){
 const sequence=conquestRookExplodeParticleSequence(source),model=actor?.model;
 if(policy!==CONQUEST_ROOK_EXPLODE_PARTICLE_FRAME_POLICY||world?.nativeMapId!==46||!scene?.isScene||root(world.group)!==scene||root(model?.group)!==scene)throw Error('Actual map46/actor scene and explicit Rook particle frame policy required');
 const recipient=sequence.name==='pve_mon_buf_eff01',death=sequence.name==='rook_death'||sequence.name==='enter_base';
 if(recipient)assertConquestMonsterDefenseAuraFields(recipientFields,{actor});else assertConquestRookExplodeActor(actor);
 let external,ownedExternal=null;
 if(death){if(!(state instanceof ConquestMonsterDeathState)||state.actor!==actor||actor.eligibleVirtual44!==false)throw Error('Actual entered Rook Death state required');external=ownedExternal=new THREE.Group();external.position.copy(actor.positionNative).multiplyScalar(SCN_SCENE_SCALE);external.scale.setScalar(SCN_SCENE_SCALE);scene.add(external);}
 else if(recipient)external=model.group;
 else{const nodeName={pve_mon_rook_b_spark:'rook_foot_spin_Dummy',pve_mon_aura02_rook:'rook_con_Dummy',pve_rook_b_light:'rook_head'}[sequence.name];if(!nodeName)throw Error('Unknown actual Rook sequence attachment');external=model.findSourceNode(nodeName);if(!external?.isObject3D)throw Error('Authored Rook attachment absent');}
 const shield=sequence.name==='pve_rook_b_light';if(shield)assertConquestRookExplodePresentation(presentation,{actor});
 external.updateWorldMatrix(true,false);const capturedMatrix=death?external.matrixWorld.clone():null;
 const groups=sequence.actions.map(action=>action.type==='CActParticle'?new THREE.Group():presentation),frames=new Map(),expectedParents=new Map(),identity=new THREE.Matrix4();let disposed=false;
 const externalName=!recipient&&!death?{pve_mon_rook_b_spark:'rook_foot_spin_Dummy',pve_mon_aura02_rook:'rook_con_Dummy',pve_rook_b_light:'rook_head'}[sequence.name]:null;
 function check(){if(disposed||actor.model!==model||!death&&root(model.group)!==scene||root(world.group)!==scene||externalName&&model.findSourceNode(externalName)!==external)throw Error('Stale Rook particle frame owner');if(recipient)assertConquestMonsterDefenseAuraFields(recipientFields,{actor});else assertConquestRookExplodeActor(actor);if(shield)assertConquestRookExplodePresentation(presentation,{actor});scene.updateWorldMatrix(false,false,true);if(scene.parent||!scene.matrixWorld.equals(identity))throw Error('Identity retained scene boundary required');if(death){external.updateWorldMatrix(true,false);if(external.parent!==scene||!external.matrixWorld.equals(capturedMatrix))throw Error('Captured Rook Death root mutated');}for(const[g,parent]of expectedParents){g.updateWorldMatrix(true,false);if(g.parent!==parent||root(g)!==scene||!g.matrix.equals(identity))throw Error('Source particle parent or identity local root replaced');}}
 try{
  for(const action of sequence.actions){if(action.type!=='CActParticle')continue;const group=groups[action.index],parent=nativeSequenceParent(action,{externalNodes:[external],actions:groups,readActionNode:n=>n,findNamedNode:(node,name)=>node===presentation?presentation.findSourceNode(name):node.getObjectByName(name)??null});if(!parent?.isObject3D)throw Error('Actual source Rook particle parent is missing');group.name=sequence.sourcePath+' action'+action.index;parent.add(group);expectedParents.set(group,parent);}
  for(const action of sequence.actions){if(action.type!=='CActParticle')continue;const group=groups[action.index],renderGroup=new THREE.Group();renderGroup.name=sequence.sourcePath+' particle'+action.index+' identity visuals';scene.add(renderGroup);let last=null,lastMatrix=null,revision=0,frameDisposed=false;
   function read(){check();if(frameDisposed||renderGroup.parent!==scene)throw Error('Disposed Rook particle frame');group.updateWorldMatrix(true,false);renderGroup.updateWorldMatrix(false,false,true);if(!renderGroup.matrixWorld.equals(new THREE.Matrix4()))throw Error('Identity particle render group required');const elements=group.matrixWorld.elements.map((v,i)=>f([3,7,11,15].includes(i)?v:v/SCN_SCENE_SCALE));if(lastMatrix&&elements.every((v,i)=>Object.is(v,lastMatrix[i])))return last;lastMatrix=elements;revision++;last=Object.freeze({kind:'conquest-owned-rook-particle-frame',sequencePath:sequence.sourcePath,nodeIndex:action.index,revision,...conquestPawnExplodeFrameFields(elements,{policy:CONQUEST_PAWN_EXPLODE_FRAME_POLICY}),sourceParentType:action.parentType,sourceParentIndex:action.parentIndex,sourceParentBone:action.boneName,sourceParentSelectionQualified:true,nativeRecipientAttachmentQualified:false,s5BorrowedNodeFrameProduced:!death,sourceCapturedPositionQualified:death,nativeReady:false});receipts.set(last,{owner:frame});return last;}
   const frame=Object.freeze({renderGroup,borrowedNode:group,readFrame:read,snapshot(){const r=read();return {nodeIndex:action.index,parentType:action.parentType,parentIndex:action.parentIndex,boneName:action.boneName,originNative:[...r.originNative],followsActor:!death,nativeReady:false};},dispose(){if(frameDisposed)return;frameDisposed=true;renderGroup.removeFromParent();}});owners.set(frame,{actor,world,scene,source,read});frames.set(action.index,frame);
  }
  check();for(const frame of frames.values())frame.readFrame();
 }catch(error){for(const frame of frames.values())frame.dispose();for(const group of expectedParents.keys())group.removeFromParent();ownedExternal?.removeFromParent();throw error;}
 return Object.freeze({frames,source,readFrame(nodeIndex){check();const frame=frames.get(nodeIndex);if(!frame)throw Error('Particle action frame required');return frame;},dispose(){if(disposed)return;for(const frame of frames.values())frame.dispose();for(const group of expectedParents.keys())group.removeFromParent();ownedExternal?.removeFromParent();disposed=true;}});
}
export function assertConquestRookExplodeParticleFrame(owner,{actor,world,scene}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.world!==world||r.scene!==scene)throw Error('Typed actual Rook particle frame required');r.read();return owner;}
export function assertConquestRookExplodeParticleFrameReceipt(receipt,{owner}={}){const r=owners.get(owner);if(!r||receipts.get(receipt)?.owner!==owner||r.read()!==receipt)throw Error('Current original Rook particle frame receipt required');return receipt;}
