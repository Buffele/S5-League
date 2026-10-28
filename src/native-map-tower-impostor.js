import * as THREE from 'three';

// Artist-only ray-painted facade in the existing panorama. There is no wall,
// floor, light, geometry, collider or scene object behind this implementation.
const MAX_SIDES=16,EPS=1e-6;
const allowed=new Set(['enabled','texture','boundsXZ','footprintXZ','topY','depth','tileSize','fogColor','fogStart','fogEnd','intensity','faceShadeStrength','storeyHeight','uvRect']);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const invalid=message=>{throw new Error('Invalid native panorama tower illusion: '+message);};
const pair=(value,label)=>{if(!Array.isArray(value)||value.length!==2||!value.every(finite))invalid(label);return [...value];};
const vec3=(value,label)=>{const a=value?.isVector3?value.toArray():value;if(!Array.isArray(a)||a.length!==3||!a.every(finite))invalid(label);return a;};
function color(value){
 if(value?.isColor){if(!value.toArray().every(v=>finite(v)&&v>=0&&v<=1))invalid('fogColor');return value.clone();}
 if(typeof value==='string'&&!/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value))invalid('fogColor');
 if(typeof value!=='string'&&!(Number.isInteger(value)&&value>=0&&value<=0xffffff))invalid('fogColor');
 return new THREE.Color(value);
}
function resolve(options){
 if(options==null)return null;
 if(typeof options!=='object'||Array.isArray(options))invalid('options object');
 for(const key of Object.keys(options))if(!allowed.has(key))invalid('unknown field '+key);
 if(options.enabled===false)return null;
 if(options.enabled!==true)invalid('enabled must be explicit');
 if(!options.texture?.isTexture)invalid('borrowed mineral texture');
 if(!finite(options.topY))invalid('topY');
 const depth=options.depth??240,tileSize=pair(options.tileSize??[8,12],'tileSize');
 if(!finite(depth)||depth<=0||depth>2000)invalid('depth must be in (0, 2000] metres');
 if(tileSize.some(v=>v<=0||v>2000))invalid('tileSize must be positive metres');
 const uvRect=options.uvRect??[0,0,1,1];
 if(!Array.isArray(uvRect)||uvRect.length!==4||!uvRect.every(v=>finite(v)&&v>=0&&v<=1)||uvRect[0]>=uvRect[2]||uvRect[1]>=uvRect[3])invalid('uvRect needs increasing bounds within [0,1]');
 let footprint;
 if(options.footprintXZ!==undefined){
  if(!Array.isArray(options.footprintXZ)||options.footprintXZ.length<3||options.footprintXZ.length>MAX_SIDES)invalid('footprintXZ needs 3 to 16 convex vertices');
  footprint=options.footprintXZ.map(p=>pair(p,'footprintXZ vertex'));
 }else{
  const b=options.boundsXZ;
  if(!b||typeof b!=='object')invalid('boundsXZ or footprintXZ required');
  const lo=pair(b.min,'boundsXZ.min'),hi=pair(b.max,'boundsXZ.max');
  if(lo.some((v,i)=>v>=hi[i]))invalid('boundsXZ must have positive area');
  footprint=[[lo[0],lo[1]],[hi[0],lo[1]],[hi[0],hi[1]],[lo[0],hi[1]]];
 }
 const bounds={min:[Math.min(...footprint.map(p=>p[0])),Math.min(...footprint.map(p=>p[1]))],max:[Math.max(...footprint.map(p=>p[0])),Math.max(...footprint.map(p=>p[1]))]};
 const span=Math.max(bounds.max[0]-bounds.min[0],bounds.max[1]-bounds.min[1]);
 if(!(span>EPS))invalid('footprint area');
 const area=footprint.reduce((sum,p,i)=>{const q=footprint[(i+1)%footprint.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
 if(Math.abs(area)<EPS)invalid('footprint area');
 if(area<0)footprint=[footprint[0],...footprint.slice(1).reverse()];
 const edges=[];let perimeter=0;
 for(let i=0;i<footprint.length;i++){
  const a=footprint[i],b=footprint[(i+1)%footprint.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  if(length<EPS)invalid('zero-length footprint edge');
  const tangent=[dx/length,dz/length],normal=[tangent[1],-tangent[0]],offset=normal[0]*a[0]+normal[1]*a[1];
  if(footprint.some(p=>normal[0]*p[0]+normal[1]*p[1]-offset>span*1e-7))invalid('footprint must be convex and ordered without crossing edges');
  edges.push({start:[...a],tangent,normal,offset,length,uOffset:perimeter});perimeter+=length;
 }
 if(options.boundsXZ!==undefined){
  const b=options.boundsXZ,lo=pair(b?.min,'boundsXZ.min'),hi=pair(b?.max,'boundsXZ.max');
  if(lo.some((v,i)=>v>=hi[i]||v>bounds.min[i]+EPS||hi[i]<bounds.max[i]-EPS))invalid('boundsXZ must enclose footprintXZ');
 }
 const fogStart=options.fogStart??Math.min(35,depth*.15),fogEnd=options.fogEnd??Math.min(220,depth),intensity=options.intensity??.6,faceShadeStrength=options.faceShadeStrength??.16;
 if(!finite(fogStart)||fogStart<0||!finite(fogEnd)||fogEnd<=fogStart||fogEnd>depth)invalid('fogStart/fogEnd must rise within depth');
 if(!finite(intensity)||intensity<0||intensity>4)invalid('intensity');
 if(!finite(faceShadeStrength)||faceShadeStrength<0||faceShadeStrength>.35)invalid('faceShadeStrength');
 const storeyHeight=options.storeyHeight??8;
 if(!finite(storeyHeight)||storeyHeight<2||storeyHeight>20)invalid('storeyHeight in [2,20] metres');
 return {texture:options.texture,footprint,bounds,edges,topY:options.topY,depth,tileSize,uvRect:[...uvRect],fogStart,fogEnd,intensity,faceShadeStrength,storeyHeight,fogColor:color(options.fogColor??'#5b5573')};
}
const inside=(c,p)=>p[1]<=c.topY+EPS&&p[1]>=c.topY-c.depth-EPS&&c.edges.every(e=>e.normal[0]*p[0]+e.normal[1]*p[2]<=e.offset+EPS);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

// CPU reference used by placement/QA tools. It traces the same outward facade
// segments and UV anchoring as GLSL, not an AABB proxy around chamfered corners.
export function intersectTowerImpostorRay(options,origin,direction){
 const c=resolve(options);if(!c)return null;
 const o=vec3(origin,'ray origin'),input=vec3(direction,'ray direction'),length=Math.hypot(...input);
 if(length<EPS)invalid('zero ray direction');
 const d=input.map(v=>v/length);if(inside(c,o))return null;
 let result=null;
 for(let i=0;i<c.edges.length;i++){
  const e=c.edges[i],den=e.normal[0]*d[0]+e.normal[1]*d[2];
  if(den>=-EPS)continue; // Never show the reverse/interior side of the facade.
  const t=(e.offset-e.normal[0]*o[0]-e.normal[1]*o[2])/den;
  if(t<=EPS||(result&&t>=result.distance))continue;
  const point=o.map((v,j)=>v+d[j]*t),drop=c.topY-point[1],along=(point[0]-e.start[0])*e.tangent[0]+(point[2]-e.start[1])*e.tangent[1];
  if(drop<=EPS||drop>c.depth||along<-EPS||along>e.length+EPS)continue;
  const u=(e.uOffset+along)/c.tileSize[0],v=drop/c.tileSize[1],fog=smooth(c.fogStart,c.fogEnd,drop),sun=[-.4503480378,.8928536123];
  result={distance:t,point,faceIndex:i,uv:[c.uvRect[0]+(u-Math.floor(u))*(c.uvRect[2]-c.uvRect[0]),c.uvRect[1]+(1-(v-Math.floor(v)))*(c.uvRect[3]-c.uvRect[1])],drop,coverage:1-fog,faceShade:1-c.faceShadeStrength*(.5-.5*(e.normal[0]*sun[0]+e.normal[1]*sun[1]))};
 }
 return result;
}

export const towerImpostorFragmentDeclarations=`
 uniform sampler2D towerFacade;
 uniform vec3 towerCameraOrigin;
 uniform float towerCameraVisible;
 uniform vec4 towerPlanes[${MAX_SIDES}];
 uniform vec4 towerEdges[${MAX_SIDES}];
 uniform float towerUOffsets[${MAX_SIDES}];
 uniform int towerSideCount;
 uniform float towerTopY;
 uniform float towerDepth;
 uniform vec2 towerTileSize;
 uniform vec4 towerUvRect;
 uniform vec2 towerFogRange;
 uniform vec3 towerFogColor;
 uniform float towerIntensity;
 uniform float towerFaceShadeStrength;
 uniform float towerStoreyHeight;
 vec3 nativeTowerFacade(vec3 sky,vec3 worldRay){
  if(towerCameraVisible<.5)return sky;
  float closest=1.e20;vec2 facadeUV=vec2(0.);float drop=0.;float facadeAlong=0.;float faceLength=0.;vec2 hitNormal=vec2(0.);bool hit=false;
  for(int i=0;i<${MAX_SIDES};i++){
   if(i>=towerSideCount)break;
   vec4 plane=towerPlanes[i];vec4 edge=towerEdges[i];float den=dot(plane.xy,worldRay.xz);
   if(den>=-0.000001)continue;
   float t=(plane.z-dot(plane.xy,towerCameraOrigin.xz))/den;
   if(t<=0.000001||t>=closest)continue;
   vec3 p=towerCameraOrigin+worldRay*t;float candidateDrop=towerTopY-p.y;float along=dot(p.xz-edge.xy,edge.zw);
   if(candidateDrop<=0.000001||candidateDrop>towerDepth||along<-.000001||along>plane.w+.000001)continue;
   closest=t;drop=candidateDrop;facadeAlong=along;faceLength=plane.w;hitNormal=plane.xy;facadeUV=vec2(fract((towerUOffsets[i]+along)/towerTileSize.x),1.-fract(drop/towerTileSize.y));hit=true;
  }
  if(!hit)return sky;
  float fog=smoothstep(towerFogRange.x,towerFogRange.y,drop);
  float shade=1.-towerFaceShadeStrength*(.5-.5*dot(hitNormal,vec2(-.4503480378,.8928536123)));
  vec3 facade=texture2D(towerFacade,mix(towerUvRect.xy,towerUvRect.zw,facadeUV)).rgb*towerIntensity*shade;
  // Continue the current facade material: wide solid walls, a restrained
  // horizontal floor joint, and sparse narrow dark recesses. No office atlas.
  // The untouched mineral collar meets the real bottom with no invented door.
  float level=mod(drop,towerStoreyHeight);
  float aa=max(fwidth(drop),.025);
  float joint=1.-smoothstep(.055,.055+aa,min(level,towerStoreyHeight-level));
  float collar=smoothstep(.8,2.2,drop);
  facade*=1.-joint*.24*collar;
  float cell=mod(facadeAlong,5.8);
  float aperture=smoothstep(1.6-aa,1.6+aa,cell)*(1.-smoothstep(2.35-aa,2.35+aa,cell));
  aperture*=smoothstep(1.1-aa,1.1+aa,level)*(1.-smoothstep(2.65-aa,2.65+aa,level));
  aperture*=smoothstep(.75,1.2,min(facadeAlong,faceLength-facadeAlong))*collar;
  facade=mix(facade,vec3(.033,.044,.051)*shade,aperture*.82);
  facade=mix(facade,towerFogColor,fog*.2);
  // Fade completely into the ORIGINAL sampled panorama, never an opaque fog slab.
  return mix(sky,facade,1.-fog);
 }
`;

export function createNativeMapTowerImpostor(options){
 const c=resolve(options);if(!c)return null;
 const planes=Array.from({length:MAX_SIDES},()=>new THREE.Vector4()),edges=Array.from({length:MAX_SIDES},()=>new THREE.Vector4()),offsets=new Float32Array(MAX_SIDES),origin=new THREE.Vector3();
 c.edges.forEach((e,i)=>{planes[i].set(...e.normal,e.offset,e.length);edges[i].set(...e.start,...e.tangent);offsets[i]=e.uOffset;});
 const uniforms={towerFacade:{value:c.texture},towerCameraOrigin:{value:origin},towerCameraVisible:{value:0},towerPlanes:{value:planes},towerEdges:{value:edges},towerUOffsets:{value:offsets},towerSideCount:{value:c.edges.length},towerTopY:{value:c.topY},towerDepth:{value:c.depth},towerTileSize:{value:new THREE.Vector2(...c.tileSize)},towerUvRect:{value:new THREE.Vector4(...c.uvRect)},towerFogRange:{value:new THREE.Vector2(c.fogStart,c.fogEnd)},towerFogColor:{value:c.fogColor},towerIntensity:{value:c.intensity},towerFaceShadeStrength:{value:c.faceShadeStrength},towerStoreyHeight:{value:c.storeyHeight}};
 return {uniforms,updateCamera(camera){
  if(!camera?.isCamera||typeof camera.getWorldPosition!=='function')invalid('render camera');
  camera.getWorldPosition(origin);const valid=origin.toArray().every(finite);
  uniforms.towerCameraVisible.value=valid&&camera.isPerspectiveCamera&&!inside(c,origin.toArray())?1:0;
 },snapshot(){return {enabled:true,artisticOnly:true,geometryAdded:0,collidersAdded:0,borrowedTexture:true,style:'existing-facade-sparse-recesses',storeyHeight:c.storeyHeight,footprintXZ:c.footprint.map(p=>[...p]),boundsXZ:{min:[...c.bounds.min],max:[...c.bounds.max]},topY:c.topY,bottomY:c.topY-c.depth,sideCount:c.edges.length,depth:c.depth,tileSize:[...c.tileSize],uvRect:[...c.uvRect],fogRange:[c.fogStart,c.fogEnd],cameraWorldPosition:origin.toArray(),visibleForCamera:uniforms.towerCameraVisible.value===1,qualification:'Perspective-only analytical background facade. Foreground scene always occludes it; no parallax relief, shadows, gameplay surface or collision.'};}};
}
