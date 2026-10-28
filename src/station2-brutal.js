import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const BRUTAL_ASSETS=['concrete','metal','sky','train-body','train-side','structure','facade'];
const ATLAS={f4b9becf7221669b72d0:'train-body','1d37cdcb9abe2f73532a':'train-side',a96e320e2eb782f6b04e:'structure',c7efe1f1a632a799d6f7:'facade'};
const idOf=material=>(material.map?.image?.src||material.map?.name||'').split('/').pop().split('.')[0];
export async function loadBrutalProps(){
 const asset=await new GLTFLoader().loadAsync('/assets/station2-brutal/aircon/aircon-clean.gltf');
 return {aircon:asset.scene};
}
export async function loadBrutalTextures(){
 const loader=new THREE.TextureLoader();
 return Object.fromEntries(await Promise.all(BRUTAL_ASSETS.map(async id=>{
  const map=await loader.loadAsync('/assets/station2-brutal/'+id+'.png');
  map.name=id;map.colorSpace=THREE.SRGBColorSpace;map.flipY=false;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;return [id,map];
 })));
}

// All new shells live under their source module and use its transform.
// Physics never traverses these groups: world.meshes and world.triangles are untouched.
export function projectedGeometry(source,scale=2.5){
 const geometry=source.index?source.toNonIndexed():source.clone();
 const p=geometry.attributes.position,uv=new Float32Array(p.count*2),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<p.count;i+=3){
  a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
  const n=b.sub(a).cross(c.sub(a));n.set(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z));
  const axes=n.y>=n.x&&n.y>=n.z?[0,2]:n.x>n.z?[2,1]:[0,1];
  for(let j=0;j<3;j++){uv[(i+j)*2]=p.array[(i+j)*3+axes[0]]/scale;uv[(i+j)*2+1]=p.array[(i+j)*3+axes[1]]/scale;}
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}

function makePalette(textures){
 const concreteBump=textures.concrete.clone();concreteBump.colorSpace=THREE.NoColorSpace;concreteBump.needsUpdate=true;
 const metalBump=textures.metal.clone();metalBump.colorSpace=THREE.NoColorSpace;metalBump.needsUpdate=true;
 const make=(map,color,metalness,roughness)=>new THREE.MeshStandardMaterial({map,color,metalness,roughness,envMapIntensity:.35});
 const concrete=make(textures.concrete,0xffffff,.05,.82);concrete.bumpMap=concreteBump;concrete.bumpScale=.035;
 const metal=make(textures.metal,0xd0d7df,.5,.49);metal.bumpMap=metalBump;metal.bumpScale=.012;
 const edge=make(textures.metal,0x626e7c,.65,.4);
 const lime=new THREE.MeshStandardMaterial({color:0xb9d632,roughness:.45,metalness:.15,emissive:0x7e980a,emissiveIntensity:.15});
 const blue=new THREE.MeshStandardMaterial({color:0x267dff,emissive:0x0870ff,emissiveIntensity:3.5,roughness:.3});
 const white=new THREE.MeshStandardMaterial({color:0xd9e2ea,emissive:0xc8eaff,emissiveIntensity:1.4});
 const red=new THREE.MeshStandardMaterial({color:0x9b2337,roughness:.5,metalness:.25});
 const pixels=new Uint8Array(128*128*4),emission=new Uint8Array(pixels.length);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const i=(y*128+x)*4,lit=y>=14&&y<=17||y>=110&&y<=113;
  const seam=x%32===0||y===10||y===117;
  pixels.set(lit?[28,114,255,255]:seam?[18,23,30,255]:[66,73,83,255],i);
  emission.set(lit?[18,90,255,255]:[0,0,0,255],i);
 }
 const bandMap=new THREE.DataTexture(pixels,128,128),bandGlow=new THREE.DataTexture(emission,128,128);
 for(const t of [bandMap,bandGlow]){t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;}
 const band=new THREE.MeshStandardMaterial({map:bandMap,roughness:.63,metalness:.35,emissiveMap:bandGlow,emissive:0xffffff,emissiveIntensity:3});
 const atlas=Object.fromEntries(Object.keys(ATLAS).map(hash=>[hash,make(textures[ATLAS[hash]],0xffffff,ATLAS[hash].startsWith('train')?.3:.12,.67)]));
 return {concrete,metal,edge,lime,blue,white,red,band,atlas};
}

// Batch repeated cladding, lamps and trims into one draw per material per module.
function builder(parent,rounded=true){
 const batches=new Map(),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
 const cube=rounded?new RoundedBoxGeometry(1,1,1,1,.055):new THREE.BoxGeometry(1,1,1),straight=new THREE.BoxGeometry(1,1,1);
 const add=(material,geometry,position,scale,quaternion=new THREE.Quaternion())=>{
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);
  g.clearGroups();matrix.compose(position,quaternion,scale);g.applyMatrix4(matrix);
  if(!batches.has(material))batches.set(material,[]);batches.get(material).push(g);
 };
 return {
  box(material,position,size){add(material,cube,new THREE.Vector3(...position),new THREE.Vector3(...size));},
  beam(material,a,b,width=.055){const direction=b.clone().sub(a),length=direction.length();if(length<.02)return;rotation.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());add(material,straight,a.clone().add(b).multiplyScalar(.5),new THREE.Vector3(width,length,width),rotation);},
  geometry:add,
  finish(){let triangles=0;for(const [material,parts] of batches){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,material);mesh.name='Brutalisme · habillage';mesh.castShadow=!material.emissive?.getHex();mesh.receiveShadow=true;mesh.userData.presentationOnly=true;parent.add(mesh);triangles+=g.attributes.position.count/3;}cube.dispose();straight.dispose();return triangles;}
 };
}

function insideTriangle(x,y,t){
 const [a,b,c]=t,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)return false;
 const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;
 const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;
 return u>=-1e-5&&v>=-1e-5&&u+v<=1.00001;
}

// Rebuild broad walls as individual bevelled concrete slabs. Every panel is
// clipped by membership in the existing face, so door/window gaps stay open.
function addConcreteSlabs(mesh,batch,palette){
 const g=mesh.geometry,p=g.attributes.position,indices=g.index,planes=new Map();
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
 for(let i=0;i<(indices?.count??p.count);i+=3){
  a.fromBufferAttribute(p,indices?indices.getX(i):i).applyMatrix4(mesh.matrix);
  b.fromBufferAttribute(p,indices?indices.getX(i+1):i+1).applyMatrix4(mesh.matrix);
  c.fromBufferAttribute(p,indices?indices.getX(i+2):i+2).applyMatrix4(mesh.matrix);
  normal.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
  const axis=Math.abs(normal.x)>.999?0:Math.abs(normal.z)>.999?2:-1;if(axis<0)continue;
  const sign=Math.sign(normal.getComponent(axis)),u=axis===0?2:0,v=1,d=a.getComponent(axis),key=axis+':'+sign+':'+d.toFixed(3);
  if(!planes.has(key))planes.set(key,{axis,sign,u,v,d,triangles:[],minU:Infinity,maxU:-Infinity,minV:Infinity,maxV:-Infinity});
  const plane=planes.get(key),points=[a,b,c].map(point=>[point.getComponent(u),point.y]);plane.triangles.push(points);
  for(const [x,y] of points){plane.minU=Math.min(plane.minU,x);plane.maxU=Math.max(plane.maxU,x);plane.minV=Math.min(plane.minV,y);plane.maxV=Math.max(plane.maxV,y);}
 }
 let count=0;
 for(const plane of planes.values()){
  const {minU,maxU,minV,maxV,axis,sign,u,d,triangles}=plane,stepU=1.65,stepV=1.45;
  if(maxU-minU<1.7||maxV-minV<1.5)continue;
  for(let x=Math.ceil(minU/stepU)*stepU+.04;x+stepU<maxU;x+=stepU)for(let y=Math.ceil(minV/stepV)*stepV+.04;y+stepV<maxV;y+=stepV){
   const w=stepU-.055,h=stepV-.055;
   if(![[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y+h/2]].every(([px,py])=>triangles.some(t=>insideTriangle(px,py,t))))continue;
   const at=[0,y+h/2,0],size=[0,h,0];at[axis]=d+sign*.006;at[u]=x+w/2;size[axis]=.018;size[u]=w;
   batch.box(palette.concrete,at,size);
   if(count%7===0){const tag=[...at],tagSize=[...size];tag[axis]+=sign*.012;tag[1]-=h*.35;tag[u]-=w*.35;tagSize[1]=.065;tagSize[u]=.23;tagSize[axis]=.012;batch.box(palette.lime,tag,tagSize);}
   if(++count>=50)return count;
  }
 }
 return count;
}

// Edge details are fitted to the exact existing surfaces, never across openings.
function addStructuralDetails(mesh,batch,palette,seen){
 const edges=new THREE.EdgesGeometry(mesh.geometry,38),p=edges.attributes.position;
 const a=new THREE.Vector3(),b=new THREE.Vector3();let count=0;
 for(let i=0;i<p.count;i+=2){
  a.fromBufferAttribute(p,i).applyMatrix4(mesh.matrix);b.fromBufferAttribute(p,i+1).applyMatrix4(mesh.matrix);
  const length=a.distanceTo(b);if(length<1.3||length>18)continue;
  const key=[a,b].map(v=>v.toArray().map(x=>x.toFixed(2)).join(',')).sort().join('/');if(seen.has(key))continue;seen.add(key);
  const vertical=Math.abs(a.y-b.y)>length*.98;
  if(vertical){
   batch.beam(palette.edge,a,b,.055);
   // Small flush luminous endcaps and lime identification marks.
   const top=a.y>b.y?a:b,bottom=a.y>b.y?b:a;
   batch.beam(palette.lime,top.clone().add(new THREE.Vector3(0,-Math.min(.45,length*.2),0)),top,.07);
   if(length>3)batch.beam(palette.white,bottom.clone().lerp(top,.17),bottom.clone().lerp(top,.38),.035);
  }else if(Math.abs(a.y-b.y)<.04&&length>2.5){
   batch.beam(palette.edge,a,b,.05);
   if(count%3===0)batch.beam(palette.blue,a.clone().lerp(b,.06),a.clone().lerp(b,.94),.026);
  }
  if(++count>=55)break;
 }
 edges.dispose();
}

function addTrainDetails(module,batch,p){
 const meshes=module.meshes.filter(m=>m.visible&&!m.userData.collision);
 module.group.updateMatrixWorld(true);
 // Side badges/coach ribs are seated by raycast on opaque body, preserving doors.
 const ray=new THREE.Raycaster();
 for(const end of [-1,1])for(const z of [-1.85,1.85]){
  const start=module.group.localToWorld(new THREE.Vector3(end*26,.25,z));
  ray.set(start,new THREE.Vector3(-end,0,0).transformDirection(module.group.matrixWorld));
  const hit=ray.intersectObjects(meshes,false).find(h=>h.distance<12);if(!hit)continue;
  const at=module.group.worldToLocal(hit.point.clone());
  batch.box(p.edge,[at.x+end*.016,at.y,at.z],[.035,.3,.74]);
  batch.box(p.white,[at.x+end*.039,at.y,at.z],[.018,.11,.56]);
 }
 for(const side of [-1,1])for(const x of [-17,-8.5,8.5,17]){
  const start=module.group.localToWorld(new THREE.Vector3(x,1.7,side*8));
  const direction=new THREE.Vector3(0,0,-side).transformDirection(module.group.matrixWorld);
  ray.set(start,direction);const hit=ray.intersectObjects(meshes,false).find(h=>h.distance<7);
  if(!hit)continue;const at=module.group.worldToLocal(hit.point.clone());
  batch.box(p.red,[at.x,at.y,at.z+side*.012],[.42,1.25,.028]);
  batch.box(p.lime,[at.x,at.y-.72,at.z+side*.014],[.45,.065,.03]);
 }
 // Equipment housings stay within the existing rooftop equipment envelopes.
 for(const x of [-13.7,13.55]){
  batch.box(p.edge,[x,5.8,0],[2.15,.28,1.85]);
  for(let i=0;i<8;i++)batch.box(p.metal,[x-.84+i*.24,5.98,0],[.07,.065,1.63]);
 }
}

function addSkyline(scene,palette){
 const group=new THREE.Group();group.name='S5 League · mégastructures lointaines';group.userData.presentationOnly=true;
 const batch=builder(group,false);
 for(let i=0;i<14;i++){
  const angle=i*Math.PI*2/14+.13,radius=350+(i%3)*78,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,height=390+(i*37%135);
  batch.box(palette.concrete,[x,height*.5-400,z],[16,height,20]);
  batch.box(palette.edge,[x-7,height*.5-385,z+3],[3,height+30,9]);
  batch.box(palette.metal,[x+6,height*.5-390,z-4],[4,height+20,8]);
  batch.box(palette.blue,[x+8.1,height*.5-395,z+10.04],[.3,height*.83,.1]);
  for(let y=-160;y<height-400;y+=9){
   batch.box(palette.edge,[x,y,z+10.05],[15,.7,.25]);
   for(const dx of [-4,0,4])batch.box(palette.metal,[x+dx,y+3.5,z+10.06],[1.4,5.4,.12]);
  }
  if(i%4===0){const ring=new THREE.Mesh(new THREE.TorusGeometry(39,1.1,6,80),palette.concrete);ring.position.set(x,8,z);ring.rotation.y=-angle;ring.userData.presentationOnly=true;group.add(ring);}
 }
 batch.finish();scene.add(group);return group;
}

export function applyBrutalArchitecture(scene,world,textures,props={}){
 if(world.brutal)throw Error('Habillage déjà appliqué');
 const palette=makePalette(textures),stats={shells:0,claddingPanels:0,addedTriangles:0,drawGroups:0},materialCache=new Map();
 for(const [id,module] of world.modules){
  if(id==='sky'||id==='backdrop'){for(const mesh of module.meshes)if(!mesh.userData.collision)mesh.visible=false;continue;}
  if(/lasers|goal/.test(id))continue;
  const art=new THREE.Group();art.name='S5 · Brutalisme néon';art.userData.presentationOnly=true;
  const batch=builder(art),seen=new Set();
  // Collect only existing visual meshes; added objects cannot enter physics arrays.
  for(const mesh of module.meshes){
   if(!mesh.visible||mesh.userData.collision)continue;
   const materials=[].concat(mesh.material);
   // Retain original transparent apertures, animation targets and alpha-tested grid.
   if(materials.some(m=>m.transparent||m.alphaTest>0||m.blending!==THREE.NormalBlending))continue;
   const old=materials[0],hash=idOf(old),isTrainBody=id==='train'&&['f4b9becf7221669b72d0','1d37cdcb9abe2f73532a'].includes(hash);
   if(props.aircon&&id==='train'&&['Object11219','Object11216'].includes(mesh.name)&&hash==='3bae463c945cb359a51a'){
    mesh.userData.brutalReplaced=true;continue;
   }
   let material=palette.atlas[hash],project=false;
   if(hash==='81a26c1268b48a00ba82'){
    // Old broad blue gradients become slim luminous architectural channels.
    material=palette.band;project=false;
   }else if(!material){material=/Line|Shape/.test(mesh.name)?palette.metal:palette.concrete;project=true;}
   if(hash==='1d37cdcb9abe2f73532a'&&!isTrainBody){material=palette.concrete;project=true;}
   if(hash==='3bae463c945cb359a51a'){material=palette.metal;project=true;}
   const cacheKey=material.uuid+':'+old.side+':'+old.polygonOffset;
   if(!materialCache.has(cacheKey)){
    const copy=material.clone();copy.side=old.side;copy.polygonOffset=old.polygonOffset;copy.polygonOffsetFactor=old.polygonOffsetFactor;copy.polygonOffsetUnits=old.polygonOffsetUnits;materialCache.set(cacheKey,copy);
   }
   const geometry=project?projectedGeometry(mesh.geometry):mesh.geometry.clone();
   batch.geometry(materialCache.get(cacheKey),geometry,mesh.position,mesh.scale,mesh.quaternion);geometry.dispose();
   if(!isTrainBody&&!old.polygonOffset&&mesh.geometry.attributes.position.count>12)addStructuralDetails(mesh,batch,palette,seen);
   if(!isTrainBody&&!old.polygonOffset&&['a96e320e2eb782f6b04e','6530c6b8394fe60396a1','c7efe1f1a632a799d6f7'].includes(hash))stats.claddingPanels+=addConcreteSlabs(mesh,batch,palette);
   mesh.userData.brutalReplaced=true;stats.shells++;
  }
  if(id==='train'&&!world.blenderSlice){
   addTrainDetails(module,batch,palette);
   if(props.aircon)for(const x of [-13.96,13.81]){
    const housing=new THREE.Group(),model=props.aircon.clone(true);housing.add(model);model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),scale=Math.min(4.3/size.x,1.5/size.y,2.6/size.z);model.scale.setScalar(scale);model.updateMatrixWorld(true);
    box.setFromObject(model);const center=box.getCenter(new THREE.Vector3());model.position.set(-center.x,-box.min.y,-center.z);
    housing.position.set(x,5.32,0);housing.name='S5 · ventilation importée';housing.userData.presentationOnly=true;
    housing.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});art.add(housing);
   }
  }
  for(const mesh of module.meshes)if(mesh.userData.brutalReplaced)mesh.visible=false;
  stats.addedTriangles+=batch.finish();stats.drawGroups+=art.children.length;module.group.add(art);
 }
 const sky=textures.sky.clone();sky.flipY=true;sky.mapping=THREE.EquirectangularReflectionMapping;sky.needsUpdate=true;
 scene.background=sky;scene.backgroundIntensity=.85;scene.backgroundRotation.y=.5;
 scene.fog=new THREE.Fog(0x899ba9,130,700);
 const skyline=addSkyline(scene,palette);
 world.name='Station 2 · Neon brutalism';
 world.brutal={stats,skyline,palette};return world.brutal;
}
