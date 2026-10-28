import {nativeMapParentIndices} from './native-map-source-geometry.js';
import {nativeMainStaticCollisionOwner,nativeStaticCollisionRegistration,nativeSourceCollisionMetadata} from './native-collision-registration.js';
const sourceDescriptors=new WeakMap();

// A seal of JSON alone does not authenticate an arbitrary readRecords port.
// This receipt covers only this factory's private, frozen face stream.
export function isConquestSourceCollisionDescriptor(descriptor,{source,records}={}){
 const entry=sourceDescriptors.get(descriptor);return !!entry&&entry.source===source&&entry.records===records&&entry.active();
}

// Original source records for map46, independent of filtered S5 movement
// triangles. Keep oct_weapon, barriers and every face for native mask queries.
export function createConquestSourceCollisionWorld(bundle,{renderSources}={}){
 if(bundle?.schema!=='conquest-native-collision-source-v1'||bundle.key!=='conquest'||bundle.nativeMapId!==46||!Array.isArray(bundle.scenes)||!Array.isArray(bundle.sources))throw Error('Authenticated Conquest collision source bundle required');
 let live=true;const descriptors=[],identities=new Set();let sourceTriangles=0;
 for(const source of bundle.scenes){
  if(identities.has(source.source)||!Array.isArray(source.root?.matrix)||!Array.isArray(source.nodes)||!Array.isArray(source.models))throw Error('Complete distinct native source scene required');
  identities.add(source.source);
  const owner=nativeMainStaticCollisionOwner(bundle,46,source.source);
  if(owner!=='main-static-root1A0')throw Error('Conquest source STATIC owner unresolved');
  const proof=bundle.sources.filter(row=>row.path===source.source);
  if(proof.length!==1||proof[0].sourceModels!==source.models.length||proof[0].sourceNodes!==source.nodes.length||!Array.isArray(proof[0].registeredModels))throw Error('Conquest source geometry coverage differs');
  if(renderSources){
   const matches=renderSources.filter(row=>row.source===source.source);
   if(matches.length!==1||matches[0].models.length!==source.models.length)throw Error('Loaded render and collision sources differ');
   for(const [index,model]of source.models.entries()){
    const rendered=matches[0].models[index];
    if(rendered.name!==model.name||['vertices','indices','matrix'].some(field=>JSON.stringify(rendered[field])!==JSON.stringify(model[field])))throw Error('Loaded render and native collision geometry differ');
   }
  }
  const required=source.models.flatMap((model,index)=>nativeStaticCollisionRegistration(model.name)&&model.vertices?.length?[index]:[]);
  if(JSON.stringify(required)!==JSON.stringify(proof[0].registeredModels))throw Error('Native registered collision model omitted');
  const records=[];
  for(const index of required){
   const model=source.models[index],node=source.nodes[model.sourceNodeIndex],indices=model.indicesUnsigned;
   if(!node||node.name!==model.name||node.parent!==model.parent||!Array.isArray(indices)||indices.length%3||indices.some(value=>!Number.isInteger(value)||value<0||value>=model.vertices.length/3))throw Error('Complete original collision node/index stream required');
   const metadata=nativeSourceCollisionMetadata(model.name,owner);
   for(let triangleIndex=0;triangleIndex<indices.length/3;triangleIndex++){
    const vertices=Object.freeze(indices.slice(triangleIndex*3,triangleIndex*3+3));
    records.push(Object.freeze({source:source.source,sourceModelIndex:index,sourceNodeIndex:model.sourceNodeIndex,triangleIndex,
     sourceVertexIndices:vertices,nativeSourceVertexIndices:vertices,nativeCollision:metadata}));
   }
  }
  if(records.length!==proof[0].sourceTriangles)throw Error('Original collision face coverage differs');
  sourceTriangles+=records.length;Object.freeze(records);
  const descriptor=Object.freeze({source,parentIndices:Object.freeze(nativeMapParentIndices(source)),requiredModelIndices:Object.freeze(required),active:()=>live,readRecords:()=>live?records:null});
  sourceDescriptors.set(descriptor,{source,records,active:()=>live});descriptors.push(descriptor);
 }
 const refs=bundle.variants?.filter(value=>value.id===46)?.[0]?.scenes;
 if(!Array.isArray(refs)||refs.length!==identities.size||refs.some(ref=>!identities.has(ref.path)))throw Error('Complete Conquest STATIC source set required');
 return {nativeMapId:46,sourceData:bundle,nativeCollisionSources:descriptors,sourceTriangleCount:sourceTriangles,
  qualification:{sourceStaticMembership:true,completeOriginalFaceCoverage:true,queryWorldTopologyProvided:false,nativeConstructionArithmeticObserved:false,nativeReady:false},
  dispose(){live=false;},get active(){return live;}};
}
