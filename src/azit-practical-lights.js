import {Color,Group,PointLight,Vector3} from 'three';
import {readRenderQuality} from './render-quality.js';

const MAX_LIGHTS=3,MAX_DISTANCE=8,MAX_INTENSITY=30;
const fail=message=>{throw Error('Invalid Azit practical lighting: '+message);};
const finite=number=>typeof number==='number'&&Number.isFinite(number);
const entryKeys=new Set(['id','sourceComponentId','position','color','intensity','distance']);
const qualities=new Set(['performance','balanced','high']);
function color(value){
 if(value?.isColor){if(!value.toArray().every(v=>finite(v)&&v>=0&&v<=1))fail('finite light color');return value.clone();}
 if(typeof value==='string'&&!/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value))fail('hex light color');
 if(typeof value!=='string'&&!(Number.isInteger(value)&&value>=0&&value<=0xffffff))fail('light color');
 return new Color(value);
}
function visibleInScene(object){
 for(let node=object;node;node=node.parent){if(!node.visible)return false;if(node.isScene)return true;}
 return false;
}

// A few local LED reflections, separate from the source lighting and the
// emissive lenses authored in Blender. No geometry, texture, shadow or collider.
export function configureAzitPracticalLights(world,config,{getQuality=readRenderQuality}={}){
 if(config?.enabled===true&&world?.nativeMapId!==15)fail('explicit Azit world required');
 return configurePracticalLights(world,config,{getQuality});
}
export function configureNativePracticalLights(world,config,options={}){
 if(config?.enabled===true&&world?.nativeMapId!==15&&(world?.nativeMapId!==19||world.sourceData?.key!=='MAPNAME_BIO_LAB'))fail('source-qualified native world required');
 return configurePracticalLights(world,config,options);
}
function configurePracticalLights(world,config,{getQuality=readRenderQuality}={}){
 if(config?.enabled!==true)return null;
 if(!world.root?.isObject3D||!Array.isArray(world.sourceMeshes))fail('explicit native world required');
 if(typeof getQuality!=='function')fail('quality reader');
 if(Object.keys(config).some(k=>!['enabled','lights'].includes(k)))fail('unknown configuration field');
 if(!Array.isArray(config.lights)||config.lights.length<1||config.lights.length>MAX_LIGHTS)fail('one to three local lights required');
 const ids=new Set();
 const entries=config.lights.map(raw=>{
  if(!raw||typeof raw!=='object'||Object.keys(raw).some(k=>!entryKeys.has(k)))fail('light entry fields');
  if(typeof raw.id!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(raw.id)||ids.has(raw.id))fail('unique light id');ids.add(raw.id);
  const ref=/^s(\d{2})_m(\d{3})_c\d{4}$/.exec(raw.sourceComponentId??'');
  if(!ref||!world.sourceMeshes.some(o=>o.userData.sourceSceneIndex===Number(ref[1])&&o.userData.sourceModelIndex===Number(ref[2])))fail('existing source support model');
  if(!Array.isArray(raw.position)||raw.position.length!==3||!raw.position.every(finite))fail('finite world position');
  if(!finite(raw.intensity)||raw.intensity<=0||raw.intensity>MAX_INTENSITY)fail('intensity must be in (0, 30] candela');
  if(!finite(raw.distance)||raw.distance<=0||raw.distance>MAX_DISTANCE)fail('range must be in (0, 8] metres');
  return {...raw,position:[...raw.position],color:color(raw.color)};
 });
 const label=world.nativeMapId===15?'Azit':'Bio Lab',group=new Group();group.name=label+' / bounded practical LED reflections';group.visible=false;group.userData={artistOnly:true,collision:false,geometryAdded:0,nativeVisualParity:false};
 const lights=[];let disposed=false,suspended=true,quality='performance',qualitySyncedForRender=false,qualityReadErrors=0;
 function applyVisibility(){const active=!disposed&&!suspended&&quality!=='performance';group.visible=active;for(const {light,entry}of lights){light.visible=active;light.intensity=active?entry.intensity:0;}}
 function syncQuality(){try{const next=getQuality();if(!qualities.has(next))throw Error('Unknown quality');quality=next;}catch{quality='performance';qualityReadErrors++;}applyVisibility();}
 function clear(){suspended=true;qualitySyncedForRender=false;applyVisibility();}
 function dispose(){if(disposed)return;clear();disposed=true;group.removeFromParent();for(const {light}of lights){light.removeFromParent();light.dispose();light.shadow.map=null;light.shadow.mapPass=null;}group.dispose();}
 try{
  // Config positions are world Y-up. Convert once so lights also follow a
  // transformed map root without editing any source object's pose.
  world.root.updateWorldMatrix(true,false);
  for(const entry of entries){
   const light=new PointLight(entry.color,0,entry.distance,2);light.name=label+' practical / '+entry.id;light.position.copy(world.root.worldToLocal(new Vector3(...entry.position)));light.visible=false;light.castShadow=false;light.shadow.autoUpdate=false;light.userData={artistOnly:true,collision:false,sourceComponentId:entry.sourceComponentId,practicalId:entry.id};group.add(light);lights.push({light,entry});
  }
  world.root.add(group);syncQuality();
 }catch(error){dispose();throw error;}
 return {group,clear,dispose,update(dt=0){
  if(disposed)return;if(!finite(dt)||dt<0)throw RangeError('Finite nonnegative practical-light delta required');
  syncQuality();qualitySyncedForRender=true;
 },render(camera){
  if(disposed)return;if(!camera?.isCamera){clear();return;}
  if(!qualitySyncedForRender)syncQuality();qualitySyncedForRender=false;suspended=false;applyVisibility();
 },snapshot(){
  const active=visibleInScene(group);world.root.updateWorldMatrix(true,true);
  return {enabled:true,disposed,suspended,quality,qualityReadErrors,configuredLightCount:lights.length,activeLightCount:active?lights.filter(r=>r.light.visible&&r.light.intensity>0).length:0,budget:{maxPointLights:MAX_LIGHTS,maxRangeMeters:MAX_DISTANCE,maxIntensityCandela:MAX_INTENSITY,shadowCastingLights:0,shadowMaps:lights.filter(r=>r.light.shadow.map).length,additionalShadowPasses:0,geometryAdded:0,collidersAdded:0},lights:lights.map(({light,entry})=>({id:entry.id,sourceComponentId:entry.sourceComponentId,positionWorld:disposed?null:light.getWorldPosition(new Vector3()).toArray(),configuredPosition:[...entry.position],color:'#'+light.color.getHexString(),intensity:light.intensity,configuredIntensity:entry.intensity,distance:light.distance,decay:light.decay,castShadow:light.castShadow,visible:active&&light.visible})),qualification:'Artist-only local LED spill on existing geometry; no native S5Runtime lighting parity, shadow, new mesh or collision.'};
 }};
}
