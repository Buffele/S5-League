// s5runtimegame.exe 119f5d0: controller+28 contains external scene nodes;
// controller+24 contains runtime actions (node getter 12018e0).
// Named lookup is native virtual+b4; its search rules remain caller-owned.
function resolved(value){
 if(value===undefined)throw new TypeError('Unresolved native parent node');
 return value;
}
export function nativeSequenceParent({parentType,parentIndex,boneName},{externalNodes,actions,readActionNode,findNamedNode,readSceneRoot}={}){
 if(!Number.isInteger(parentType)||!Number.isInteger(parentIndex)||parentIndex<0||parentIndex>0xffffffff||typeof boneName!=='string')throw new TypeError('Explicit native parent fields required');
 if(parentType===0||parentType===1){
  const nodes=parentType===0?externalNodes:actions;
  if(!Array.isArray(nodes))throw new TypeError('Native parent collection required');
  if(parentIndex>=nodes.length)return null;
  let node=resolved(nodes[parentIndex]);
  if(parentType===1){
   if(typeof readActionNode!=='function')throw new TypeError('Runtime action node getter required');
   node=resolved(readActionNode(node));
  }
  if(node!==null&&boneName.length!==0){
   if(typeof findNamedNode!=='function')throw new TypeError('Native virtual+b4 lookup required');
   node=resolved(findNamedNode(node,boneName));
  }
  return node;
 }
 // 2/3/4 call scene-manager 118c9c0/118c9e0/118c9a0 respectively.
 // These branches do not search boneName or use parentIndex.
 if(parentType>=2&&parentType<=4){
  if(typeof readSceneRoot!=='function')throw new TypeError('Native scene-manager root getter required');
  return resolved(readSceneRoot(parentType));
 }
 return null;
}
// 1201bf0: attach only a live, currently unparented node; do not reparent
// or attach to itself. Parent+98 adds child with flag0, then child+8c links.
export function attachNativeSequenceParent(node,{readParent,resolveParent,addChild,setParent}={}){
 resolved(node);
 if(node===null)return false;
 if(typeof readParent!=='function')throw new TypeError('Native virtual+88 getter required');
 if(resolved(readParent(node))!==null)return false;
 if(typeof resolveParent!=='function')throw new TypeError('Native parent resolver required');
 const parent=resolved(resolveParent());
 if(parent===null||parent===node)return false;
 if(typeof addChild!=='function'||typeof setParent!=='function')throw new TypeError('Native parent mutation methods required');
 addChild(parent,node,0);
 setParent(node,parent);
 return true;
}
// 1201ca0: old parent+9c removes the child, then child+8c clears its link.
export function detachNativeSequenceParent(node,{readParent,removeChild,setParent}={}){
 resolved(node);if(node===null)return false;
 if(typeof readParent!=='function')throw new TypeError('Native virtual+88 getter required');
 const parent=resolved(readParent(node));if(parent===null)return false;
 if(typeof removeChild!=='function'||typeof setParent!=='function')throw new TypeError('Native detach methods required');
 removeChild(parent,node);setParent(node,null);return true;
}
