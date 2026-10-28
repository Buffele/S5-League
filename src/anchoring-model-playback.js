import {ANCHORING_MODEL_SELECTIONS,createAnchoringModelController0,evaluateController1153a30} from './anchoring-model-controller.js';
import {createAnchoringPostLoadControllerProfile} from './anchoring-model-profile.js';

function sync(port,name){if(typeof port?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(port.tick.constructor?.name)||!['source-port','s5-explicit-adaptation'].includes(port.provenance?.kind)||!port.provenance.source?.trim())throw TypeError(`${name}: explicit synchronous qualified port required`);return value=>{const result=port.tick(value);if(result&&(typeof result.then==='function'||typeof result.next==='function'))throw TypeError('Deferred model playback refused');return result;};}

// Work-only composition: authenticated initial flags/duration/name + source clock.
// The renderer owns transform/alpha/morph evaluation and scene/tree bindings.
// No interpolation or attachment policy is silently selected here.
export function createAnchoringModelPlayback({modelFile,sourceSha256,constructorEntry,scene,ports,provenance}={}){
 const selection=ANCHORING_MODEL_SELECTIONS[modelFile];
 const profile=createAnchoringPostLoadControllerProfile({modelFile,sourceSha256,selectedName:selection?.name,constructorEntry,provenance});
 if(!scene||!Array.isArray(scene.models)||!Array.isArray(scene.bones))throw TypeError('Captured source model and bone arrays required');
 const tracks=[...scene.models.map((node,index)=>({kind:'model',index,node})),...scene.bones.map((node,index)=>({kind:'bone',index,node}))].filter(({node})=>Object.keys(node.animations??{}).length);
 if(!tracks.length||tracks.some(({node})=>!Object.hasOwn(node.animations,selection.name)))throw Error('Exact authenticated selection required on every animated node');
 const bindings=tracks.map(({kind,index,node})=>Object.freeze({kind,index,name:node.name,animation:node.animations[selection.name]}));
 for(const {kind,animation}of bindings)if(kind==='model'&&!animation.effect)throw Error('Captured effect channels required for each animated mesh');
 const sample=sync(ports?.evaluateAtNativeTicks,'evaluateAtNativeTicks'),configureScene=sync(ports?.configureScene115c9a0,'configureScene115c9a0'),configureTree=sync(ports?.configureTree115c8e0,'configureTree115c8e0');
 const state={clock:profile.clock,duration:profile.duration,raw38:profile.raw38,raw39:profile.raw39,rate:profile.rate};let busy=false;
 const evaluate=()=>sample(Object.freeze({modelFile,selectedName:selection.name,nativeClockTicks:state.clock,bindings:Object.freeze(bindings),nativeCompared:false,interpolationNativeVerified:false}));
 const driver=createAnchoringModelController0({modelFile,sourceSha256,qualification:{kind:'explicit-controller0-source-ports',source:provenance},ports:{
  selectName:({name})=>{if(name!==selection.name)throw Error('Selection changed');},
  resetClock:({value})=>{state.clock=value;evaluate();},
  writeRawFlag:({offset,value})=>{state[offset===0x38?'raw38':'raw39']=value;},
  configureScene115c9a0:configureScene,configureTree115c8e0:configureTree,
  readController:()=>({...state}),advanceNativeClock:({dtNativeUint32})=>{state.clock=evaluateController1153a30({...state,dtNativeUint32}).clock;},evaluateAtNativeClock:evaluate
 }});
 function guard(fn){return (...args)=>{if(busy)throw Error('Reentrant model playback refused');busy=true;try{return fn(...args);}finally{busy=false;}};}
 return Object.freeze({initialize:guard(()=>driver.initialize()),applyBodyEnter:guard(field=>driver.applyBodyEnter(field)),advance:guard(request=>driver.advance(request)),
  resetPlayback:guard(request=>driver.resetPlayback(request)),resetClock:guard(request=>driver.resetClock(request)),snapshot:()=>Object.freeze({...state}),
  qualification:Object.freeze({...driver.qualification,sourceProfileVerified:true,scenePayloadShaVerified:false,rendererBindingVerified:false,loadedObjectConstructorObserved:false,interpolationNativeVerified:false,nativeCompared:false})});
}
