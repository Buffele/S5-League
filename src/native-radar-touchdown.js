import * as THREE from 'three';
import {NativeRadarMapRenderer,loadNativeRadarMapRenderer} from './native-radar-map-renderer.js';
import {NativeRadarMarkerRenderer,loadNativeRadarMarkerRenderer,nativeRadarSampleCenterTranslation} from './native-radar-marker-renderer.js';
import {nativeRadarUvCorners,nativeRadarProjectPoint,NATIVE_RADAR_STATION2_CLASSIC} from './native-radar-projection.js';
import {nativeRadarNearbyMarkerLayers,nativeRadarLocalMarkerLayer,nativeRadarFrameQuad} from './native-radar-marker-layers.js';
import {nativeRadarFumbiMarker} from './native-radar-fumbi-layer.js';
import {nativeRadarVisibility} from './native-radar-visibility.js';

// Assembly only. This does not qualify an S5 subject/briefing/identity adapter,
// resource alias, UI placement or the scheduling of the native owner's calls.
export const nativeRadarTouchdownPolicy=Object.freeze({
 scope:'station2-classic-rule2',nativeReady:false,snapshotAdapterQualified:false,
 mapResourceBindingQualified:false,viewportAdapterQualified:false,
 initialFrame:'await-explicit-registry5-sample',
 drawOrder:Object.freeze(['map','fumbi','nearby-inactive','nearby-active','local','frame']),
 directionArrow:false,
});

const vector=(value,label)=>{
 if(!Array.isArray(value)||value.length!==3||value.some(v=>!Number.isFinite(v)||!Number.isFinite(Math.fround(v))))throw TypeError(`Explicit finite float32 ${label} XYZ required`);
 return value.map(Math.fround);
};
const boolean=(value,label)=>{if(typeof value!=='boolean')throw TypeError(`Explicit ${label} boolean required`);return value;};
const rectangle=(value,keys,label)=>{
 if(!value||keys.some(key=>!Number.isFinite(value[key])||!Number.isFinite(Math.fround(value[key]))))throw TypeError(`Explicit finite ${label} required`);
 if(value.width<=0||value.height<=0)throw RangeError(`Positive ${label} extents required`);
 return Object.fromEntries(keys.map(key=>[key,value[key]]));
};

/** TD subset of 8EC630/8EC7E0; every input is already source-qualified.
 * nearby is the current, already collected 8929A0 briefing result in source
 * order, not the world's actors, HP targets or cached avatar list. Each item
 * supplies positionNative, slot44 and slot1C4. No S5 state is inferred here.
 * update samples center/direction only with registry5; it always prepares
 * CURRENT draw inputs against that cache. render is a separate submission.
 */
export class NativeRadarTouchdown{
 constructor({mapRenderer,markerRenderer}){
  if(!(mapRenderer instanceof NativeRadarMapRenderer)||!(markerRenderer instanceof NativeRadarMarkerRenderer)||mapRenderer.disposed||markerRenderer.disposed)throw TypeError('Live actual native radar sub-renderers required');
  this.mapRenderer=mapRenderer;this.markerRenderer=markerRenderer;
  this.uiEnabled=true;this.cachedFrame=null;this.ready=false;this.disposed=false;this.viewport=null;
 }
 update(snapshot){
  if(this.disposed)throw Error('Touchdown radar disposed');
  this.ready=false;
  if(snapshot?.ruleCode!==2)throw TypeError('Only explicit native Touchdown ruleCode 2 is supported');
  const visibility=nativeRadarVisibility({previousUiEnabled:this.uiEnabled,ruleCode:2,
   subjectStateCode:snapshot.subjectStateCode,registeredObject5Present:snapshot.registeredObject5Present});
  // These constructors' initial center/direction are not qualified. Wait for
  // the first real sample rather than substituting zero/forward/normal state.
  const sampled=visibility.updateAllowed?{
   center:vector(snapshot.subjectPositionNative,'subject position'),
   // Projection ports already perform the native flatten/normalize step.
   // Retain its raw input, avoiding a second float32 normalization.
   direction:vector(snapshot.directionNative,'view direction'),
  }:this.cachedFrame;
  if(!visibility.drawAllowed||!sampled){
   this.cachedFrame=sampled;this.uiEnabled=visibility.uiEnabled;
   return {sampled:visibility.updateAllowed,drawAllowed:visibility.drawAllowed,ready:false};
  }
  const sourceRect=rectangle(snapshot.sourceRect,['left','top','width','height'],'source rectangle');
  const viewport=rectangle(snapshot.viewport,['x','y','width','height'],'logical renderer viewport');
  const projection={...sampled,...NATIVE_RADAR_STATION2_CLASSIC,rect:sourceRect};
  if(!Array.isArray(snapshot.nearby))throw TypeError('Qualified current collected briefing actors required');
  const projected=snapshot.nearby.map(actor=>{
   if(!actor||typeof actor!=='object')throw TypeError('Qualified nearby actor required');
   // Source slot1C4 exclusion precedes position projection. Do not demand an
   // unused position (or inspect its health) for an excluded actor.
   if(boolean(actor.slot1C4,'nearby slot1C4'))return {...actor,rangeExcluded:true,screen:null};
   return {...actor,...nativeRadarProjectPoint({...projection,point:actor.positionNative})};
  });
  const draws=[];
  const fumbi=nativeRadarFumbiMarker({ruleCode:2,record:snapshot.fumbiRecord,getEntityByIdentity:snapshot.getEntityByIdentity,projection});
  if(fumbi)draws.push(fumbi);
  draws.push(...nativeRadarNearbyMarkerLayers({actors:projected,modeByte:2}));
  const local=nativeRadarLocalMarkerLayer({...nativeRadarProjectPoint({...projection,point:snapshot.subjectPositionNative}),slot44:snapshot.localSlot44});
  if(local)draws.push(local);
  draws.push(nativeRadarFrameQuad(sourceRect));
  // Prepare both sub-draws before any GPU submission. A rejected frame cannot
  // accidentally submit the preceding frame. This is not pixel rollback.
  this.markerRenderer.setFrame({draws,sourceRect});
  this.mapRenderer.setFrame({uvCorners:nativeRadarUvCorners({...sampled,...NATIVE_RADAR_STATION2_CLASSIC}),actorByte:snapshot.actorByte,flag71A650:snapshot.flag71A650});
  this.cachedFrame=sampled;this.uiEnabled=visibility.uiEnabled;this.viewport=viewport;this.ready=true;
  return {sampled:visibility.updateAllowed,drawAllowed:true,ready:true};
 }
 render(renderer,{renderTarget=null}={}){
  if(this.disposed)throw Error('Touchdown radar disposed');
  if(!this.ready)return false;
  // Refuse incomplete ports before changing the target or submitting the map.
  for(const key of ['getRenderTarget','getActiveCubeFace','getActiveMipmapLevel','setRenderTarget','getViewport','getScissor','getScissorTest','setViewport','setScissor','setScissorTest','getCurrentViewport','render'])if(typeof renderer?.[key]!=='function')throw TypeError(`Renderer ${key} port required`);
  const oldTarget=renderer.getRenderTarget(),oldFace=renderer.getActiveCubeFace(),oldMip=renderer.getActiveMipmapLevel();
  const oldViewport=renderer.getViewport(new THREE.Vector4()),oldScissor=renderer.getScissor(new THREE.Vector4()),oldTest=renderer.getScissorTest(),oldClear=renderer.autoClear;
  try{
   renderer.setRenderTarget(renderTarget);
   renderer.setViewport(this.viewport.x,this.viewport.y,this.viewport.width,this.viewport.height);
   nativeRadarSampleCenterTranslation(this.markerRenderer.sourceRect,renderer.getCurrentViewport(new THREE.Vector4()));
   this.mapRenderer.render(renderer,this.viewport);
   this.markerRenderer.render(renderer,this.viewport);
   return true;
  }finally{
   // setRenderTarget can itself change viewport/scissor, so restore it first.
   renderer.setRenderTarget(oldTarget,oldFace,oldMip);
   renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldTest);renderer.autoClear=oldClear;
  }
 }
 dispose(){
  if(this.disposed)return;
  this.disposed=true;this.ready=false;this.cachedFrame=null;this.viewport=null;
  try{this.mapRenderer.dispose();}finally{this.markerRenderer.dispose();}
 }
}

// Each call owns new renderer instances; the two underlying loaders retain
// their own authenticated texture caches. On failure/abort, wait for BOTH
// siblings and dispose every successful renderer, including late arrivals.
// No rejected owner promise is cached, so retry is possible.
export async function loadNativeRadarTouchdown({mapLoader=loadNativeRadarMapRenderer,markerLoader=loadNativeRadarMarkerRenderer,signal}={}){
 if(typeof mapLoader!=='function'||typeof markerLoader!=='function')throw TypeError('Explicit renderer loader functions required');
 if(signal?.aborted)throw signal.reason??Error('Radar loading aborted');
 const results=await Promise.allSettled([Promise.resolve().then(mapLoader),Promise.resolve().then(markerLoader)]);
 const failed=results.find(result=>result.status==='rejected');
 try{
  if(signal?.aborted)throw signal.reason??Error('Radar loading aborted');
  if(failed)throw failed.reason;
  return new NativeRadarTouchdown({mapRenderer:results[0].value,markerRenderer:results[1].value});
 }catch(error){
  for(const result of results)if(result.status==='fulfilled'){
   // A faulty disposer must not orphan the other successful sibling.
   try{result.value?.dispose?.();}catch{/* preserve the original load/abort failure */}
  }
  throw error;
 }
}
