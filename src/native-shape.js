import {shapePairToEndpoints} from './native-ghost-trail-math.js';
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
// 121a580 loads P,V pairs; 115e9b0 uses index 0 and restores the source
// after a temporary transform. Caller supplies the evaluated ghost-node+34
// matrix: the authored Shape matrix alone is not the native update matrix.
export function bindNativeShape(node){
 if(node?.type!=='Shape'||typeof node.name!=='string'||!node.name)throw new TypeError('Named native Shape required');
 if(!Array.isArray(node.serializedPairs)||!node.serializedPairs.length)throw new RangeError('Shape has no native segment');
 const pairs=node.serializedPairs.map(pair=>{
  shapePairToEndpoints(pair,identity);
  return Object.freeze(pair.map(vector=>Object.freeze(Array.from(vector))));
 });
 if(!Array.isArray(node.matrix)||node.matrix.length!==16||!node.matrix.every(Number.isFinite))throw new TypeError('Authored Shape matrix required');
 return Object.freeze({name:node.name,parent:node.parent,authoredMatrix:Object.freeze([...node.matrix]),pairs:Object.freeze(pairs)});
}
export function readNativeShapeEndpoints(binding,evaluatedGhostMatrix){
 if(!binding?.pairs?.length)throw new TypeError('Bound native Shape required');
 // No guessed parent transform, current bone, bind pose or source-matrix fallback.
 return shapePairToEndpoints(binding.pairs[0],evaluatedGhostMatrix?.elements??evaluatedGhostMatrix);
}
export function bindNativeShapes(nodes=[]){
 const bindings=new Map();
 for(const node of nodes)if(node.type==='Shape'){
  if(bindings.has(node.name))throw new Error('Duplicate Shape '+node.name);
  bindings.set(node.name,bindNativeShape(node));
 }
 return bindings;
}
