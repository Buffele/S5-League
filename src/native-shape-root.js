// 11b3590 reads typed roots; 11b3840 clones the first typed node directly.
// Verified narrow case: one root Shape, no children, models or bones.
// General SCN clone ordering, animation controllers and other types remain
// outside this adapter. No synthetic source-file-name root is inserted.
// This is the typed SCN root only. Active Bat NodeLoader observations on
// 2026-10-25 show an a0015.scn resource container above it; callers must not
// treat this raw-data helper as the complete live NodeLoader hierarchy.
export function nativeSingleShapeRoot(data,shapeNodes){
 if(data?.nodes?.length!==1||data.nodes[0].type!=='Shape'||data.nodes[0].parent!==''||data.models?.length||data.bones?.length)return null;
 const node=shapeNodes.get(data.nodes[0].name);
 if(!node)throw new Error('Missing runtime Shape root');
 node.setHierarchy({parent:null,children:[]});
 return node;
}
