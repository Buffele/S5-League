import * as THREE from 'three';

const ROOT='/assets/maps/alice-house/',EPS=1e-7;
const area=polygon=>Math.abs(polygon.reduce((n,p,i)=>{const q=polygon[(i+1)%polygon.length];return n+p.p[0]*q.p[2]-q.p[0]*p.p[2];},0))/2;
const lerp=(a,b,t)=>({p:a.p.map((v,i)=>v+(b.p[i]-v)*t),ao:a.ao.map((v,i)=>v+(b.ao[i]-v)*t)});
function clip(polygon,distance){
 const result=[];if(!polygon.length)return result;
 let a=polygon.at(-1),da=distance(a);
 for(const b of polygon){const db=distance(b);if((da>=-EPS)!==(db>=-EPS))result.push(lerp(a,b,da/(da-db)));if(db>=-EPS)result.push(b);a=b;da=db;}
 return result.length>=3&&area(result)>EPS?result:[];
}
function rectPlanes([xmin,xmax,zmin,zmax]){return [v=>v.p[0]-xmin,v=>xmax-v.p[0],v=>v.p[2]-zmin,v=>zmax-v.p[2]];}
function takeRect(polygon,bounds){
 let inside=polygon;const outside=[];
 for(const distance of rectPlanes(bounds)){const part=clip(inside,v=>-distance(v));if(part.length)outside.push(part);inside=clip(inside,distance);if(!inside.length)break;}
 return {inside,outside};
}
/** Source triangle subdivision, with original plane and interpolated source UV1. */
export function partitionAliceFloor(polygon,zones){
 let remaining=[polygon];const regions=[];
 for(const zone of zones){const next=[];for(const part of remaining){const pieces=takeRect(part,zone.bounds);if(pieces.inside.length)regions.push({zone,polygon:pieces.inside});next.push(...pieces.outside);}remaining=next;}
 return {regions,remaining};
}
function clipConvex(polygon,hull){
 for(let i=0;i<hull.length&&polygon.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];polygon=clip(polygon,v=>(b[0]-a[0])*(v.p[2]-a[1])-(b[1]-a[1])*(v.p[0]-a[0]));}
 return polygon;
}
function convexHull(polygons){
 const points=[...new Map(polygons.flat().map(v=>[v.p[0].toFixed(5)+':'+v.p[2].toFixed(5),[v.p[0],v.p[2]]])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),half=list=>{const h=[];for(const p of list){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=EPS)h.pop();h.push(p);}return h;};
 const lower=half(points),upper=half([...points].reverse());return [...lower.slice(0,-1),...upper.slice(0,-1)];
}
function insetHull(hull,width){
 const lines=hull.map((p,i)=>{const q=hull[(i+1)%hull.length],dx=q[0]-p[0],dz=q[1]-p[1],length=Math.hypot(dx,dz);return {p:[p[0]-dz/length*width,p[1]+dx/length*width],d:[dx,dz]};});
 return lines.map((b,i)=>{const a=lines[(i+lines.length-1)%lines.length],den=a.d[0]*b.d[1]-a.d[1]*b.d[0],dx=b.p[0]-a.p[0],dz=b.p[1]-a.p[1],t=(dx*b.d[1]-dz*b.d[0])/den;return [a.p[0]+a.d[0]*t,a.p[1]+a.d[1]*t];});
}
function panelFinish(material,pitch){
 // Generated herringbone is a finite panel. Intentional wooden rails cover its
 // boundary; mirrored sampling keeps grain continuous at the other image edges.
 const rail=new THREE.Color(0xb18452);
 material.onBeforeCompile=shader=>{
  shader.uniforms.alicePanelRail={value:rail};shader.uniforms.alicePanelWidth={value:.022/pitch};
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 alicePanelRail;\nuniform float alicePanelWidth;')
   .replace('#include <map_fragment>',`#include <map_fragment>
    vec2 aliceCell=fract(vMapUv);vec2 aliceEdge=min(aliceCell,1.0-aliceCell);
    float aliceDistance=min(aliceEdge.x,aliceEdge.y),aliceAA=max(fwidth(aliceDistance),0.00001);
    float aliceRail=1.0-smoothstep(alicePanelWidth-aliceAA,alicePanelWidth+aliceAA,aliceDistance);
    diffuseColor.rgb=mix(diffuseColor.rgb,alicePanelRail,aliceRail*.88);
   `);
 };
 material.customProgramCacheKey=()=>`alice-botanical-parquet-panel-v1:${pitch}`;
}

export function installAliceFloorFinish(world,config,textures){
 if(config.schema!=='alice-house-botanical-floor-v1'||config.source!==world.sourceData.source||textures.size!==9){for(const texture of textures.values())texture.dispose();throw Error('Alice botanical floor contract mismatch');}
 const inversePresentation=world.presentationMatrix.clone().invert(),group=new THREE.Group();group.name='Alice House / botanical floor finishes';
 const buckets=new Map(),materials=new Set(),geometries=[],provenance=[],changedArea={base:0,border:0};let disposed=false;
 world.root.updateMatrixWorld(true);
 const sourceById=new Map(world.sourceMeshes.map(m=>[m.userData.sourceModelIndex,m]));
 function bucket(style,template,{border=false,panel=true}={}){
  const key=[style.id,style.texture,template.uuid,border,panel].join(':');if(buckets.has(key))return buckets.get(key);
  const material=template.clone();material.name='Alice botanical / '+style.id;material.map=textures.get(style.texture);material.color.set(0xffffff);material.roughness=border ? .62 : style.texture===6 ? .7 : style.texture===7 ? .6 : .58;material.metalness=.025;
  material.transparent=false;material.opacity=1;material.alphaMap=null;material.alphaTest=0;material.depthWrite=true;material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=border?-4:-2;
  material.userData={...material.userData,aliceBotanicalFloor:true,zone:style.id,texture:style.texture,sourceGeometry:false};
  if(!border&&style.texture<=5&&panel)panelFinish(material,style.pitch);
  materials.add(material);const entry={style,material,position:[],uv:[],uv1:[],border};buckets.set(key,entry);return entry;
 }
 function add(polygon,style,template,uv,options){
  if(!polygon.length)return;const b=bucket(style,template,options);changedArea[b.border?'border':'base']+=area(polygon);
  for(let i=1;i<polygon.length-1;i++){
   const tri=[polygon[0],polygon[i],polygon[i+1]],a=tri[0].p,cross=(tri[1].p[2]-a[2])*(tri[2].p[0]-a[0])-(tri[1].p[0]-a[0])*(tri[2].p[2]-a[2]);
   if(Math.abs(cross)<EPS)continue;if(cross<0)[tri[1],tri[2]]=[tri[2],tri[1]];
   // Derived positions receive only the same left/right presentation matrix.
   const points=tri.map(v=>new THREE.Vector3(...v.p).applyMatrix4(world.presentationMatrix));
   if(world.presentationMatrix.determinant()<0){[tri[1],tri[2]]=[tri[2],tri[1]];[points[1],points[2]]=[points[2],points[1]];}
   for(let j=0;j<3;j++){b.position.push(...points[j].toArray());b.uv.push(...uv(tri[j]));b.uv1.push(...tri[j].ao);}
  }
 }
 const tiled=style=>v=>[v.p[0]/style.pitch,v.p[2]/style.pitch];
 function border(polygons,hull,style,template,width=config.borderWidth){
  if(hull.length<3)return;const inner=insetHull(hull,width),asset=config.assets.find(a=>a.id===style.border),repeatLength=width*asset.width/asset.height;
  for(let i=0;i<hull.length;i++){
   const a=hull[i],j=(i+1)%hull.length,b=hull[j],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),ring=[a,b,inner[j],inner[i]];
   for(const original of polygons){const part=clipConvex(original,ring);if(part.length)add(part,{id:style.id+'-bordure',texture:style.border},template,v=>[((v.p[0]-a[0])*dx+(v.p[2]-a[1])*dz)/length/repeatLength,((v.p[0]-a[0])*-dz+(v.p[2]-a[1])*dx)/length/width],{border:true});}
  }
 }
 try{
  for(const id of [0,51,52,53]){
   const mesh=sourceById.get(id);if(!mesh||mesh.userData.meshyItemId)throw Error('Alice floor source was replaced unexpectedly: '+id);
   const geometry=mesh.geometry,position=geometry.attributes.position,ao=geometry.attributes.uv1,index=geometry.index,polygons=[];
   const sourceMatrix=new THREE.Matrix4().multiplyMatrices(inversePresentation,mesh.matrixWorld);
   const originalArea={value:0},derivedStart=changedArea.base;
   for(let f=0;f<index.count/3;f++){
    if(id===0&&f>=23||id===53&&f<2)continue; // Terrace and upper wall cap remain original.
    const slot=geometry.groups.find(g=>f*3>=g.start&&f*3<g.start+g.count)?.materialIndex??0,template=mesh.material[slot];
    const poly=[0,1,2].map(k=>{const vertex=index.getX(f*3+k),p=new THREE.Vector3().fromBufferAttribute(position,vertex).applyMatrix4(sourceMatrix);return {p:p.toArray(),ao:ao?[ao.getX(vertex),ao.getY(vertex)]:[0,0]};});
    if(Math.max(...poly.map(v=>v.p[1]))-Math.min(...poly.map(v=>v.p[1]))>.002||area(poly)<EPS)continue;
    originalArea.value+=area(poly);polygons.push(poly);provenance.push({sourceModelIndex:id,triangleIndex:f,area:area(poly)});
    if(id===0&&f<2){
     const parts=partitionAliceFloor(poly,config.zones);
     for(const part of parts.regions){add(part.polygon,part.zone,template,tiled(part.zone));const [xmin,xmax,zmin,zmax]=part.zone.bounds;border([part.polygon],[[xmin,zmin],[xmax,zmin],[xmax,zmax],[xmin,zmax]],part.zone,template);}
     for(const part of parts.remaining)add(part,config.circulation,template,tiled(config.circulation));
    }else if(id===51){const bounds=[.8985,14.7547,-7.4453,6.4109];add(poly,config.central,template,v=>[(v.p[0]-bounds[0])/(bounds[1]-bounds[0]),(v.p[2]-bounds[2])/(bounds[3]-bounds[2])],{panel:false});}
    else {const style=id===0?(f<15?config.rearGallery:config.circulation):config.stairs;add(poly,style,template,tiled(style),{panel:id===0});}
   }
   const derivativeArea=changedArea.base-derivedStart;if(Math.abs(originalArea.value-derivativeArea)>1e-4)throw Error('Alice floor subdivision changed source coverage: '+id);
   if(id===51)border(polygons,convexHull(polygons),config.central,mesh.material[0]);
   if(id===53)border(polygons,convexHull(polygons),{...config.stairs,border:8},mesh.material[1],.18);
   if(id===0){const rear=provenance.filter(p=>p.sourceModelIndex===0&&p.triangleIndex>=2&&p.triangleIndex<15);if(rear.length)border(polygons.slice(2,15),convexHull(polygons.slice(2,15)),config.rearGallery,mesh.material[1]);}
  }
  for(const b of buckets.values()){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(b.position,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(b.uv1,2));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometries.push(geometry);
   const mesh=new THREE.Mesh(geometry,b.material);mesh.name=b.material.name;mesh.receiveShadow=true;mesh.castShadow=false;mesh.userData={aliceBotanicalFloor:true,sourceGeometry:false,collision:false,zone:b.style.id};group.add(mesh);
  }
  world.root.add(group);world.botanicalFloors={schema:config.schema,group,sourceFaces:provenance,baseArea:changedArea.base,borderArea:changedArea.border,drawCalls:group.children.length,sourceGeometryChanged:false,collisionChanged:false,terraceChanged:false,zones:config.zones.map(z=>z.id),policy:config.policy};
  return {summary:world.botanicalFloors,dispose,filter(renderer){const maximum=renderer.capabilities?.getMaxAnisotropy?.()??1,level=Math.min(maximum,world.artistConfig?.runtimeRendering?.textureAnisotropy??8);for(const texture of textures.values())if(texture.anisotropy!==level){texture.anisotropy=level;texture.needsUpdate=true;}}};
 }catch(error){dispose();throw error;}
 function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures.values())texture.dispose();delete world.botanicalFloors;}
}

export async function loadAliceFloorFinish(world){
 const textures=new Map();let handedOff=false;
 try{
  const response=await fetch(ROOT+'floor-finish.json');if(!response.ok)throw Error('Alice botanical floor configuration unavailable');const config=await response.json();
  if(config.schema!=='alice-house-botanical-floor-v1'||config.source!==world.sourceData.source||!Array.isArray(config.assets)||config.assets.length!==9||new Set(config.assets.map(a=>a.id)).size!==9)throw Error('Alice botanical floor configuration invalid');
  const loader=new THREE.TextureLoader(),results=await Promise.allSettled(config.assets.map(async asset=>{
   if(!/^\/assets\/maps\/alice-house\/textures\/alice-botanical-floor-0[1-9]-v1\.png$/.test(asset.url)||!Number.isInteger(asset.id)||asset.id<1||asset.id>9)throw Error('Unexpected Alice botanical floor asset');
   const texture=await loader.loadAsync(asset.url);texture.name=asset.url;texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;textures.set(asset.id,texture);
  }));
  const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;handedOff=true;return installAliceFloorFinish(world,config,textures);
 }catch(error){if(!handedOff)for(const texture of textures.values())texture.dispose();throw error;}
}
