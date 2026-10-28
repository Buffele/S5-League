import {nativeSequenceParent,attachNativeSequenceParent,detachNativeSequenceParent} from './native-sequence-parent.js';
import {nativeFindNamedNode} from './native-node-lookup.js';
import {nativeNodeWorldMatrix} from './native-node-matrix.js';
import {nativeRecordedShapePose} from './native-shape-pose.js';
const parentFields=node=>({parentType:node.fields.base.field0c.int32,parentIndex:node.fields.base.field10.int32,boneName:node.fields.base.name.value});
// Prepared native NodeLoader/GhostTrail parent graph for skill_bat_strike.
// The owner supplies the external scene node and its native methods; this
// adapter does not select an avatar socket or convert scene units.
// Historical direct-typed-root fixture, not the active NodeLoader graph:
// 2026-10-25 observations establish an identity a0015.scn container above the
// loaded Shape. Main-game aerial rendering uses bat-aerial-trail.js instead.
export function bindBatNativeStrikeShape({sequence,effect,poseRecord,externalNodes,findNamedNode,addChild}){
 if(sequence?.source!=='effects/skill_bat_strike.seq'||sequence.nodes?.length!==2||sequence.nodes[0].type!=='CActNodeLoader'||sequence.nodes[1].type!=='CActGhostTrail')throw new Error('Expected authored Bat strike NodeLoader/GhostTrail');
 const shape=effect.nativeShapeRoot;
 if(!shape||shape.name!=='Line01')throw new Error('Native single Shape root required');
 nativeRecordedShapePose(shape.binding,poseRecord);
 if(typeof addChild!=='function')throw new TypeError('External scene child insertion required');
 const bat=nativeSequenceParent(parentFields(sequence.nodes[0]),{externalNodes,findNamedNode});
 if(bat===null)throw new Error('Authored external Bat parent is missing');
 attachNativeSequenceParent(shape,{readParent:n=>n.parent,resolveParent:()=>bat,addChild,setParent:(n,p)=>{n.parent=p;}});
 if(shape.parent!==bat)throw new Error('Shape was already bound to another native parent');
 const selected=nativeSequenceParent(parentFields(sequence.nodes[1]),{actions:[{node:shape}],readActionNode:a=>a.node,findNamedNode:(n,q)=>nativeFindNamedNode(n,q,{readName:n=>n.name,readChildren:n=>n.children})});
 if(selected!==shape)throw new Error('Authored GhostTrail parent did not resolve to the loaded Shape');
 return {shape,parent:bat,
  evaluate({parentWorld,parentRootWorld,shapeLocalMatrix,shapeFlags,ghostLocalMatrix,ghostParentRootWorld,ghostFlags}={}){
   // Caller provides native flags and the current external Bat matrix AFTER
   // pose evaluation. The owner's lifecycle supplies the Shape local pose:
   // 12016f0 resets runtime node TRS to identity. The loaded static pose must
   // not be silently reused after this reset. GhostTrail pose is separate.
   if(shape.parent!==bat)throw new Error('Native Shape is detached');
   const shapeWorld=shape.evaluate(shapeLocalMatrix,{...shapeFlags,parentWorld,parentRootWorld});
   const ghostWorld=nativeNodeWorldMatrix(ghostLocalMatrix,{...ghostFlags,parentWorld:shapeWorld,parentRootWorld:ghostParentRootWorld});
   return {shapeWorld,ghostWorld,endpoints:shape.readSegment(ghostWorld)};
  },
  detach(removeChild){return detachNativeSequenceParent(shape,{readParent:n=>n.parent,removeChild,setParent:(n,p)=>{n.parent=p;}});},
 };
}
