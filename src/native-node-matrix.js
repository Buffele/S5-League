// GhostTrail vtable1481e94 +104 =1156810. +44 builds local TRS,
// +58 returns node+34, 100ca20 -> D3DXMatrixMultiply(local,parent).
// Arrays use serialized SCN/D3DX row-vector order (Three column-major layout).
function matrix(value){
 const data=value?.elements??value;
 if(!(Array.isArray(data)||ArrayBuffer.isView(data))||data.length!==16||!Array.from(data).every(Number.isFinite))throw new TypeError('Finite evaluated native matrix required');
 return Array.from(data);
}
function append(local,parent){
 const result=Array(16).fill(0);
 for(let row=0;row<4;row++)for(let column=0;column<4;column++)for(let k=0;k<4;k++)result[row*4+column]+=local[row*4+k]*parent[k*4+column];
 if(!result.every(Number.isFinite))throw new RangeError('Non-finite native matrix product');
 return result;
}
// 1155c40 starts at node+8c, then queries slot88 twice on each non-root
// ancestor (test, then advance). Supply that first parent and the real getter.
export function nativeTopAncestor(firstParent,readParent){
 if(firstParent===undefined||typeof readParent!=='function')throw new TypeError('Explicit ancestor link/getter required');
 let current=firstParent;const visited=new Set();
 while(current!==null){
  if(visited.has(current))throw new Error('Cyclic native parent chain');
  visited.add(current);
  const next=readParent(current);if(next===undefined)throw new TypeError('Unresolved native ancestor');
  if(next===null)return current;
  current=readParent(current);if(current===undefined)throw new TypeError('Unresolved native ancestor');
 }
 return null;
}
// Caller supplies the result of native local pose evaluation and explicitly
// resolved parent/root-ancestor matrices, not a guessed bone or bind pose.
// Parent slot90 (1155c40) walks to its topmost ancestor, not just one level up.
export function nativeNodeWorldMatrix(localMatrix,{parentWorld,parentRootWorld,skipParent,inheritParentRoot,externalController}={}){
 if([skipParent,inheritParentRoot,externalController].some(v=>typeof v!=='boolean'))throw new TypeError('Explicit native matrix flags required');
 if(externalController)throw new Error('External node animation controller 12019e0/1201ac0 is not ported');
 const local=matrix(localMatrix);
 // Null explicitly represents absent links. An omitted matrix is not absence.
 if(parentWorld===undefined||parentRootWorld===undefined)throw new TypeError('Explicit parent links required');
 if(parentWorld===null)return local;
 const parent=matrix(parentWorld);
 if(!skipParent)return append(local,parent);
 if(!inheritParentRoot||parentRootWorld===null)return local;
 return append(local,matrix(parentRootWorld));
}
