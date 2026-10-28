import * as THREE from 'three';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
const owners=new WeakMap(),receipts=new WeakMap(),f=Math.fround;
const rootOf=n=>{while(n?.parent)n=n.parent;return n;};
export const CONQUEST_PAWN_EXPLODE_FRAME_POLICY=Object.freeze({name:'s5-live-authored-pawn-top-frame-v1',matrix:'actual post-mixer borrowed named SCN node; world .006 boundary removed once',decomposition:'explicit S5 Matrix4.decompose;11361B0 max(scaleXYZ);100E600 axisXYZ and float radians→degrees',nativeD3DXDecompositionQualified:false,nativeReady:false});
export function conquestPawnExplodeFrameFields(elements,{policy}={}){
 if(policy!==CONQUEST_PAWN_EXPLODE_FRAME_POLICY||!Array.isArray(elements)||elements.length!==16||elements.some(v=>!Number.isFinite(v)))throw Error('Explicit finite native matrix and S5 decomposition policy required');
 const matrix=new THREE.Matrix4().fromArray(elements.map(f)),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(position,quaternion,scale);
 const q=quaternion.toArray().map(f),origin=position.toArray().map(f),scales=scale.toArray().map(f);if([...q,...origin,...scales].some(v=>!Number.isFinite(v))||q[3]<-1||q[3]>1)throw Error('Live frame outside finite decomposed source domain');
 return Object.freeze({originNative:Object.freeze(origin),quaternionNative:Object.freeze(q),rotationAxisNative:Object.freeze(q.slice(0,3)),rotationDegrees:f(f(2*Math.acos(q[3]))*57.29577951307855),parentScale:Math.max(...scales),matrixNative:Object.freeze(elements.map(f)),nativeD3DXDecompositionQualified:false});
}
export function createConquestPawnExplodeFrame({actor,world,scene,policy}={}){
 const model=actor?.model,node=model?.findSourceNode?.('pawn_top');
 if(policy!==CONQUEST_PAWN_EXPLODE_FRAME_POLICY||!(actor instanceof ConquestMonsterActor)||actor.spawnStats.monsterKey!==1013||model?.monsterKey!==1013||actor.aiScriptLiteral!=='Script/MonsterAI_Pawn_Explode.lua'||!node?.isObject3D||!scene?.isScene||world?.nativeMapId!==46||rootOf(model.group)!==scene||rootOf(world.group)!==scene)throw Error('Actual PawnExplode pawn_top/scene/map and explicit live-frame policy required');
 const renderGroup=new THREE.Group();renderGroup.name='PawnExplode third source particle visuals';scene.add(renderGroup);let disposed=false,revision=0,last=null,lastMatrix=null;
 function live(){if(disposed||actor.model!==model||model.findSourceNode('pawn_top')!==node||rootOf(node)!==scene||rootOf(world.group)!==scene||renderGroup.parent!==scene)throw Error('Stale borrowed PawnExplode frame');scene.updateWorldMatrix(false,false,true);if(scene.parent||!scene.matrixWorld.equals(new THREE.Matrix4()))throw Error('Identity scene boundary required for live PawnExplode frame');node.updateWorldMatrix(true,false);renderGroup.updateWorldMatrix(false,false,true);if(!renderGroup.matrixWorld.equals(new THREE.Matrix4()))throw Error('Identity particle render container required');}
 function read(){
  live();const elements=node.matrixWorld.elements.map((v,i)=>f([3,7,11,15].includes(i)?v:v/SCN_SCENE_SCALE));if(lastMatrix&&elements.every((v,i)=>Object.is(v,lastMatrix[i])))return last;
  const fields=conquestPawnExplodeFrameFields(elements,{policy});revision++;lastMatrix=elements;last=Object.freeze({kind:'s5-owned-live-pawn-explode-frame',revision,sequencePath:'Effects/pve_mon_pawn_red_eff3.seq',...fields,s5BorrowedNodeFrameProduced:true,sceneScale:SCN_SCENE_SCALE,nativeReady:false});receipts.set(last,{owner:api,revision});return last;
 }
 const api=Object.freeze({renderGroup,borrowedNode:node,readFrame:read,snapshot(){const r=read();return{revision:r.revision,originNative:[...r.originNative],quaternionNative:[...r.quaternionNative],parentScale:r.parentScale,followsActor:true,nativeReady:false};},dispose(){if(disposed)return;disposed=true;renderGroup.removeFromParent();}});owners.set(api,{actor,world,scene,read});read();return api;
}
export function assertConquestPawnExplodeFrame(owner,{actor,world,scene}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.world!==world||r.scene!==scene)throw Error('Typed actual PawnExplode live frame required');r.read();return owner;}
export function assertConquestPawnExplodeFrameReceipt(receipt,{owner}={}){const r=owners.get(owner),p=receipts.get(receipt);if(!r||p?.owner!==owner||r.read()!==receipt)throw Error('Current original PawnExplode live frame receipt required');return receipt;}
