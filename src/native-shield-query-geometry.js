import {createNativeShieldLocalSphere,transformNativeShieldSphere} from './native-shield-bounding-sphere.js';
//11E1F90 producer dispatcher, flag1 handlers expand indexed triangle corners
// and apply prepare matrix BEFORE sphere1182430. Runtime format/reader and
// source matrix binding remain external; these helpers do not infer either.
function transformPoint(point,matrix,provenance){return transformNativeShieldSphere({localSphere:{center:point,radius:0},matrixElements:matrix,provenance}).center;}
export function prepareNativeShieldQueryGeometry({vertices,triangleIndices,prepareMatrixElements,provenance}={}){
 if(!Array.isArray(vertices)||vertices.length%3!==0||vertices.length===0||!vertices.every(Number.isFinite))throw new TypeError('Explicit flat position stream required');
 if(!Array.isArray(triangleIndices)||triangleIndices.length===0||triangleIndices.length%3!==0||!triangleIndices.every(i=>Number.isInteger(i)&&i>=0&&i<vertices.length/3))throw new TypeError('Explicit ordered triangle index stream required');
 const preparedVertices=triangleIndices.map(index=>transformPoint(vertices.slice(index*3,index*3+3),prepareMatrixElements,provenance));
 const localSphere=createNativeShieldLocalSphere({orderedVertices:preparedVertices,provenance});
 return {preparedVertices,localSphere,triangleCount:triangleIndices.length/3,rawVertexCount:vertices.length/3,
  sourceProducerAlgorithm:'11E1F90 flag1→indexed corners→prepare matrix→append; handler11E2030 pinned',
  provenance:{...provenance},nativeProducerDispatchVerified:false,nativePrepareMatrixVerified:false,nativeSphereConstructionVerified:false,nativeReady:false};
}
export function updateNativeShieldQueryGeometry({preparedGeometry,modelMatrixElements,provenance}={}){
 if(!Array.isArray(preparedGeometry?.preparedVertices)||preparedGeometry.preparedVertices.length%3!==0||!preparedGeometry.localSphere)throw new TypeError('Prepared geometry required');
 const vertices=preparedGeometry.preparedVertices.map(point=>transformPoint(point,modelMatrixElements,provenance));
 const worldTriangles=Array.from({length:vertices.length/3},(_,i)=>vertices.slice(i*3,i*3+3));
 const worldSphere=transformNativeShieldSphere({localSphere:preparedGeometry.localSphere,matrixElements:modelMatrixElements,provenance});
 return {worldTriangles,worldSphere,coordinateSpace:'caller-explicit-consistent-space',sourceOrder:'prepare-node matrix baked once; current Shield+1C model matrix afterwards',
  nativeTransformVerified:false,nativeSphereConstructionVerified:false,nativeReady:false};
}
