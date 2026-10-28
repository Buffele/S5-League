import {compileTransformTrack,createTransformSampler11353b0} from './s5runtime-scn-transform-source.js';
import {nativeCollisionMatrixMultiply,nativeAffineCollisionPoint} from './native-collision-transform.js';
const f=Math.fround;
const matrix=value=>{
 if(!Array.isArray(value)||value.length!==16||!value.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw TypeError('Explicit finite source matrix required');
 return value.map(f);
};

// Qualified ordinary, fresh, constant-transform scene branch only. The source
// reader1204100 sets the first inserted KeyData name as default; the mono-name
// contract makes that name unambiguous without selecting the first JSON key.
// Numeric SRT ports retain their own provenance/limitations independently.
export function compileNativeStaticSourcePose({source,parentIndices,selectedName,initialState,transformPorts,reciprocalOneEstimate}={}){
 if(!source||typeof source.source!=='string'||!Array.isArray(source.nodes)||!Array.isArray(source.models)||!Array.isArray(source.bones))throw TypeError('Explicit complete SCN source required');
 if(!Array.isArray(parentIndices)||parentIndices.length!==source.nodes.length||parentIndices.some((n,i)=>!Number.isInteger(n)||n< -1||n>=i))throw TypeError('Qualified preceding source-parent indices required');
 if(typeof selectedName!=='string'||!selectedName)throw TypeError('Explicit authenticated selected name required');
 if(initialState?.fresh!==true||initialState.controllerIndex!==0||initialState.transitionActive!==false||initialState.destinationPresent!==true||typeof initialState.evidence!=='string'||!initialState.evidence.trim())throw TypeError('Explicit fresh ordinary-controller initialization and evidence required');
 if(source.nodes.some(node=>typeof node.name!=='string'||node.name.includes('Bip01')))throw TypeError('Ordinary decor controller qualification required');
 if(!Number.isFinite(reciprocalOneEstimate)||reciprocalOneEstimate<=0)throw TypeError('Explicit affine reciprocal estimate required');
 const rootMatrix=matrix(source.root?.matrix),entities=[...source.models,...source.bones],byNode=new Map(),names=new Set();
 for(const entity of entities){
  if(!entity.animations||typeof entity.animations!=='object'||Array.isArray(entity.animations))throw TypeError('Authenticated named source KeyData map required');
  for(const name of Object.keys(entity.animations))names.add(name);
  const index=entity.sourceNodeIndex??source.nodes.findIndex(node=>node.name===entity.name&&node.parent===entity.parent);
  const matches=source.nodes.flatMap((node,i)=>node.name===entity.name&&node.parent===entity.parent?[i]:[]);
  if(!Number.isInteger(index)||index<0||index>=source.nodes.length||!matches.includes(index)||entity.sourceNodeIndex==null&&matches.length!==1||byNode.has(index))throw TypeError('Unambiguous original source node identity required');
  const node=source.nodes[index];
  if(JSON.stringify(matrix(entity.matrix))!==JSON.stringify(matrix(node.matrix)))throw TypeError('Original node/entity matrices differ');
  const serialized=entity.animations[selectedName];
  if(serialized&&Object.hasOwn(serialized,'data')&&serialized.copy!=='')throw TypeError('Copied bone KeyData needs a separately qualified resolver');
  const track=serialized&&Object.hasOwn(serialized,'data')?serialized.data:serialized;
  if(!track||track._capture?.hasTransform!==true||!Array.isArray(track.positions)||!Array.isArray(track.rotations)||!Array.isArray(track.scales)||track.positions.length+track.rotations.length+track.scales.length!==0||
   entity.weights?.length||track.morphKeys?.length||track.effect?.morphKeys?.length)throw TypeError('Authenticated constant unskinned transform track required');
  byNode.set(index,{entity,track});
 }
 if(names.size!==1||!names.has(selectedName))throw TypeError('Mono-name initial-selection qualification required; never an implicit first clip');
 const localMatrices=[],worldMatrices=[],selectionSource=`${initialState.evidence}; ${source.source}; ${selectedName}`;
 for(const [index,node]of source.nodes.entries()){
  const entry=byNode.get(index);let local=matrix(node.matrix);
  if(entry){
   const selectedTrack=compileTransformTrack({track:entry.track,provenance:{source:selectionSource+'; '+node.name}});
   let written=null,lastClock=null;
   const sink={provenance:{kind:'source-port',source:'11353B0 destination+48 and lastclock+0C'},
    tick:({matrix:value})=>{written=matrix(value);}};
   const sampler=createTransformSampler11353b0({...transformPorts,writeDestination48:sink,
    writeLastClock0c:{provenance:sink.provenance,tick:({clockTicks})=>{lastClock=clockTicks;}}});
   const result=sampler.evaluate({selectedTrack,clockTicks:0,transitionActive:false,destinationPresent:true,selectionProvenance:{source:selectionSource}});
   if(!result.sampled||!written||lastClock!==0)throw TypeError('Static initial transform was not evaluated');
   local=written;
  }
  localMatrices.push(local);
  worldMatrices.push(nativeCollisionMatrixMultiply(local,parentIndices[index]<0?rootMatrix:worldMatrices[parentIndices[index]]));
 }
 const point=(nodeIndex,value)=>{
  if(!Number.isInteger(nodeIndex)||nodeIndex<0||nodeIndex>=worldMatrices.length)throw TypeError('Explicit source node required');
  return nativeAffineCollisionPoint(worldMatrices[nodeIndex],value,{reciprocalOneEstimate});
 };
 const triangle=record=>{
  if(record?.source!==source.source||record.nativeCollision?.sourceGeometry===false||!Number.isInteger(record.sourceModelIndex)||!Number.isInteger(record.triangleIndex))throw TypeError('Original source triangle identity required');
  const model=source.models[record.sourceModelIndex];
  if(!model||record.sourceNodeIndex!==model.sourceNodeIndex)throw TypeError('Source model/node identity differs');
  const indices=model.indicesUnsigned??model.indices?.map(index=>index&65535),offset=record.triangleIndex*3;
  if(!Array.isArray(indices)||offset<0||offset+3>indices.length)throw TypeError('Bounded source triangle required');
  // Presentation can reverse the derived query winding (e.g. a reflected
  // world). The immutable original index triplet remains the native input.
  const originalIndices=record.nativeSourceVertexIndices??record.sourceVertexIndices;
  if(originalIndices&&JSON.stringify(originalIndices)!==JSON.stringify(indices.slice(offset,offset+3)))throw TypeError('Source vertex identity differs');
  return [0,1,2].map(corner=>point(model.sourceNodeIndex,model.vertices.slice(indices[offset+corner]*3,indices[offset+corner]*3+3)));
 };
 return {selectedName,localMatrices,worldMatrices,point,triangle,
  provenance:{source:source.source,initialSelection:selectionSource,transformMath:transformPorts?.matrixTransformation?.provenance},
  qualification:{ordinaryFreshConstantTrackSourceBranch:true,nativeSrtMathDispatchVerified:false,nativeConstructionThreadPrecisionObserved:false,
   nativeColliderMatricesCaptured:false,nativeMovementCompared:false,nativeReady:false}};
}
