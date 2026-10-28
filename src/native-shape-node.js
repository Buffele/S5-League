import {nativeNodeWorldMatrix} from './native-node-matrix.js';
import {readNativeShapeEndpoints} from './native-shape.js';
import {nativeRecordedShapePose} from './native-shape-pose.js';

// A meshless native Shape is still a scene node. Keep its authored binding
// separate from the evaluated pose, as required by GhostTrail 115e9b0.
// Hierarchy and pose are unresolved until supplied by the scene loader/owner.
export class NativeShapeNode {
 constructor(binding){
  if(!binding?.pairs?.length||typeof binding.name!=='string')throw new TypeError('Bound native Shape required');
  this.binding=binding;this.name=binding.name;this.type='Shape';
  this.parent=undefined;this.children=undefined;this.worldMatrix=null;
 }
 setHierarchy({parent,children}={}){
  if(parent===undefined||!Array.isArray(children)||children.some(n=>n===null||n===undefined))throw new TypeError('Explicit native Shape hierarchy required');
  if(parent===this||children.includes(this))throw new Error('Self-linked native Shape');
  this.parent=parent;this.children=[...children];return this;
 }
 evaluate(localMatrix,matrixContract){
  // No authored bind-pose fallback. The caller provides the already evaluated
  // local pose and native parent/root matrices and flags.
  this.worldMatrix=Object.freeze(nativeNodeWorldMatrix(localMatrix,matrixContract));
  return this.worldMatrix;
 }
 evaluateRecordedStaticPose(record,matrixContract){
  const pose=nativeRecordedShapePose(this.binding,record);
  return this.evaluate(pose.localMatrix,matrixContract);
 }
 evaluatedMatrix(){
  if(this.worldMatrix===null)throw new Error('Native Shape pose has not been evaluated');
  return this.worldMatrix;
 }
 readSegment(evaluatedGhostMatrix){
  // Native GhostTrail transforms P,V with its OWN matrix, not implicitly
  // this Shape's matrix. Require that matrix even after Shape evaluation.
  return readNativeShapeEndpoints(this.binding,evaluatedGhostMatrix);
 }
}
