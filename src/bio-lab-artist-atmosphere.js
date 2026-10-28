import {readRenderQuality} from './render-quality.js';

// New artist lighting, not a substitute for the eight native SEQ emitters.
// It modifies only caller-owned reconstructed PBR materials, without geometry,
// textures, lights, collision surfaces or access to the original source meshes.
export function createBioLabArtistAtmosphere(world,meshes,config,{getQuality=readRenderQuality}={}){
 if(config?.enabled!==true)return null;
 if(world?.nativeMapId!==19||world.sourceData?.key!=='MAPNAME_BIO_LAB')throw Error('Bio Lab atmosphere requires its explicit source world');
 if(Object.keys(config).some(k=>!['enabled','intensity','scale','speed'].includes(k)))throw Error('Unknown Bio Lab atmosphere option');
 const intensity=config.intensity??.065,scale=config.scale??.6,speed=config.speed??.2;
 if(!Number.isFinite(intensity)||intensity<0||intensity>.12||!Number.isFinite(scale)||scale<=0||scale>2||!Number.isFinite(speed)||speed<0||speed>1||typeof getQuality!=='function')throw Error('Invalid bounded Bio Lab caustics');
 const native=new Set(world.sourceMeshes),owned=[...new Set(meshes)];if(!owned.length||owned.some(mesh=>!mesh.isMesh||native.has(mesh)))throw Error('Atmosphere must exclude all native meshes');
 const materials=new Set();for(const mesh of owned)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(material.isMeshStandardMaterial&&!material.transparent)materials.add(material);
 const time={value:0},amount={value:0},saved=[];let disposed=false,suspended=true,quality='performance';
 function sync(){try{quality=getQuality();}catch{quality='performance';}amount.value=!disposed&&!suspended&&['balanced','high'].includes(quality)?intensity:0;}
 try{for(const material of materials){
  const before=material.onBeforeCompile,key=material.customProgramCacheKey;
  const compile=function(shader,renderer){before.call(this,shader,renderer);shader.uniforms.bioLabCausticTime=time;shader.uniforms.bioLabCausticAmount=amount;
   shader.vertexShader='varying vec3 vBioLabArtistWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvBioLabArtistWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='varying vec3 vBioLabArtistWorld;uniform float bioLabCausticTime;uniform float bioLabCausticAmount;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    if(bioLabCausticAmount>.0001){vec3 p=vBioLabArtistWorld*${scale.toFixed(8)};float t=bioLabCausticTime*${speed.toFixed(8)};float a=sin(p.x*1.13+p.z*.78+t+sin(p.z*.41-t*.6));float b=sin(p.z*1.07-p.x*.63-t*.71+sin(p.x*.37+t*.4));float line=pow(max(0.,1.-abs(a+b)*.8),12.);totalEmissiveRadiance+=vec3(.30,.80,1.)*line*bioLabCausticAmount;}`);
  };
  const cache=function(){return key.call(this)+'|bio-lab-artist-caustics-v1|'+scale+'|'+speed;};saved.push({material,before,key,compile,cache});material.onBeforeCompile=compile;material.customProgramCacheKey=cache;material.needsUpdate=true;
 }}catch(error){for(const row of saved){row.material.onBeforeCompile=row.before;row.material.customProgramCacheKey=row.key;row.material.needsUpdate=true;}throw error;}
 const api={update(dt){if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw Error('Finite atmosphere delta required');if(!suspended)time.value=(time.value+Math.min(dt,.1))%4096;sync();},render(camera){if(disposed)return;if(!camera?.isCamera){api.clear();return;}suspended=false;sync();},clear(){suspended=true;amount.value=0;},snapshot:()=>({enabled:true,disposed,suspended,quality,materials:saved.length,active:amount.value>0,intensity:amount.value,time:time.value,geometryAdded:0,texturesAdded:0,lightsAdded:0,collidersAdded:0,artistOnly:true,nativeVisualParity:false,qualification:'Subtle analytical moving cyan caustics on new PBR artwork only; native SEQ effects remain separately qualified.'}),dispose(){if(disposed)return;disposed=true;api.clear();for(const row of saved){if(row.material.onBeforeCompile===row.compile)row.material.onBeforeCompile=row.before;if(row.material.customProgramCacheKey===row.cache)row.material.customProgramCacheKey=row.key;row.material.needsUpdate=true;}}};return api;
}
