import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, code-authored geometry. Only the comparison skeleton / motion data
// comes from S4; no costume, hair, face or weapon mesh is copied here.
export function createAnimeCharacter(rig,bones,definitions){
  const meshes=[];
  const names=[...bones.keys()],indices=new Map(names.map((n,i)=>[n,i]));
  const inverse=names.map(n=>new THREE.Matrix4().fromArray(definitions.get(n).matrix).invert());
  const skeleton=new THREE.Skeleton(names.map(n=>bones.get(n)),inverse);
  const gradient=new THREE.DataTexture(new Uint8Array([78,163,245]),3,1,THREE.RedFormat);gradient.needsUpdate=true;
  const palette={jacket:0xffecd2,orange:0xff7d3d,navy:0x253751,navyLight:0x3c5470,dark:0x162438,skin:0xf7bf8f,hair:0x483541,hairLight:0x715055,white:0xfff5dd,sole:0x9eabb6,iris:0x38bec1,blade:0xff9b45};
  const materials=Object.fromEntries(Object.entries(palette).map(([name,color])=>[name,new THREE.MeshToonMaterial({color,gradientMap:gradient})]));
  const outline=new THREE.MeshBasicMaterial({color:0x192339,side:THREE.BackSide});
  outline.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += objectNormal * 0.8;');};
  outline.customProgramCacheKey=()=> 'anime-outline-08';
  const pos=n=>new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(definitions.get(n).matrix));
  const fixed=name=>()=>[[name,1]];
  function mesh(geometry,material,weights,name,outlined=true){
    const si=[],sw=[];
    for(let i=0;i<geometry.attributes.position.count;i++){
      const p=new THREE.Vector3().fromBufferAttribute(geometry.attributes.position,i),list=weights(p);
      for(let j=0;j<4;j++){si.push(indices.get(list[j]?.[0])??0);sw.push(list[j]?.[1]??0);}
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    geometry.computeVertexNormals();
    const body=new THREE.SkinnedMesh(geometry,materials[material]);body.name=name;body.bind(skeleton,new THREE.Matrix4());body.frustumCulled=false;body.castShadow=true;body.receiveShadow=true;rig.add(body);meshes.push(body);
    if(outlined){const line=new THREE.SkinnedMesh(geometry,outline);line.bind(skeleton,new THREE.Matrix4());line.frustumCulled=false;line.name=name+' outline';rig.add(line);meshes.push(line);}
    return body;
  }
  function rings(centers,radii,material,weights,name,sides=10){
    const points=[],faces=[];
    const axis=centers.at(-1).clone().sub(centers[0]).normalize();
    const tangent=new THREE.Vector3(0,0,1).cross(axis).normalize();
    if(tangent.lengthSq()<.1)tangent.set(1,0,0);
    const bitangent=axis.clone().cross(tangent).normalize();
    centers.forEach((c,i)=>{for(let j=0;j<sides;j++){
      const a=j/sides*Math.PI*2,p=c.clone().addScaledVector(tangent,Math.cos(a)*radii[i][0]).addScaledVector(bitangent,Math.sin(a)*radii[i][1]);points.push(...p.toArray());
    }});
    for(let i=0;i<centers.length-1;i++)for(let j=0;j<sides;j++){
      const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;faces.push(a,b,c,b,d,c);
    }
    for(let j=1;j<sides-1;j++){faces.push(0,j+1,j);const o=(centers.length-1)*sides;faces.push(o,o+j,o+j+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(faces);return mesh(geo,material,weights,name);
  }
  function solid(geometry,center,scale,material,bone,name,rotation=null,outlined=true){
    geometry.scale(...scale);if(rotation)geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rotation));geometry.translate(...center);
    return mesh(geometry,material,fixed(bone),name,outlined);
  }
  function torsoWeight(p){
    const levels=[['Bip01 Pelvis',162],['Bip01 Spine',178],['Bip01 Spine1',194],['Bip01 Spine2',212]];
    if(p.y<=162)return [[levels[0][0],1]];
    for(let i=0;i<levels.length-1;i++)if(p.y<=levels[i+1][1]){
      const t=(p.y-levels[i][1])/(levels[i+1][1]-levels[i][1]);return [[levels[i][0],1-t],[levels[i+1][0],t]];
    }
    return [['Bip01 Spine2',1]];
  }
  const torsoY=[158,165,179,196,215,227,233];
  rings(torsoY.map(y=>new THREE.Vector3(0,y,3)),[[20,12],[22,14],[21,14],[25,15],[30,17],[28,16],[15,11]],'jacket',torsoWeight,'short jacket',12);
  rings([158,161,165].map(y=>new THREE.Vector3(0,y,3)),[[20.4,12.4],[22,14.5],[22.4,14.4]],'orange',torsoWeight,'jacket hem',12);
  // Dark front opening, orange piping and back panel follow the torso bones.
  function panel(points,material,weights,name){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    const normalZ=(points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0]);
    g.setIndex(normalZ*Math.sign(points[0][2])>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);return mesh(g,material,weights,name,false);
  }
  const opening=[[166,5.5,-11.4],[179,5.5,-11.4],[196,7,-12.4],[215,9.5,-14.4],[227,11,-13.4]];
  for(let i=0;i<opening.length-1;i++){
    const [y,w,z]=opening[i],[ny,nw,nz]=opening[i+1];
    panel([[-w,y,z],[w,y,z],[nw,ny,nz],[-nw,ny,nz]],'navy',torsoWeight,'undershirt '+i);
    for(const s of [-1,1])panel([[s*w,y,z-.12],[s*(w+1),y,z-.12],[s*(nw+1),ny,nz-.12],[s*nw,ny,nz-.12]],'orange',torsoWeight,'jacket piping '+i+' '+s);
  }
  panel([[-23,198,18.5],[23,198,18.5],[24,212,20.7],[-24,212,20.7]],'orange',torsoWeight,'back orange stripe');
  solid(new THREE.BoxGeometry(1,1,1),[0,206,21.5],[7,12,1.5],'navy','Bip01 Spine2','back badge',null,false);
  rings([new THREE.Vector3(0,230,4),new THREE.Vector3(0,243,4)],[[10,9],[9,8]],'skin',fixed('Bip01 Neck'),'neck');
  // Raised collar, two separated sides leave the neck / face silhouette clear.
  for(const s of [-1,1])solid(new THREE.BoxGeometry(1,1,1),[s*13,234,6],[8,17,24],'orange','Bip01 Spine2','raised collar',new THREE.Euler(0,0,-s*.22));
  // Waist / pelvis holds the belt, then loose tapered trousers.
  rings([new THREE.Vector3(0,145,2),new THREE.Vector3(0,159,2)],[[24,15],[21,13]],'navy',fixed('Bip01 Pelvis'),'hips',12);
  rings([new THREE.Vector3(0,155,2),new THREE.Vector3(0,161,2)],[[24,15],[23,15]],'dark',fixed('Bip01 Pelvis'),'belt',12);
  solid(new THREE.BoxGeometry(1,1,1),[0,159,-14],[9,7,3],'orange','Bip01 Pelvis','belt buckle');
  for(const side of ['L','R']){
    const sign=side==='L'?1:-1;
    const upper=`Bip01 ${side} UpperArm`,fore=`Bip01 ${side} Forearm`,hand=`Bip01 ${side} Hand`;
    const a=pos(upper),b=pos(fore),c=pos(hand);
    const sleeveEnd=b.clone().lerp(c,.24);
    const blendArm=p=>{
      if(Math.abs(p.x)<Math.abs(a.x)+12){const t=THREE.MathUtils.smoothstep(Math.abs(p.x),Math.abs(a.x)-3,Math.abs(a.x)+12);return [[`Bip01 ${side} Clavicle`,1-t],[upper,t]];}
      const t=THREE.MathUtils.smoothstep(Math.abs(p.x),Math.abs(b.x)-10,Math.abs(b.x)+10);return [[upper,1-t],[fore,t]];
    };
    rings([a.clone().add(new THREE.Vector3(-sign*3,0,0)),a.clone().lerp(b,.38),b.clone(),sleeveEnd],[[15,15],[15,14],[13,12],[12,11]],'jacket',blendArm,side+' sleeve');
    rings([b.clone().lerp(c,.2),b.clone().lerp(c,.33)],[[12.5,11.5],[12,11]],'orange',fixed(fore),side+' sleeve cuff');
    rings([b.clone().lerp(c,.3),c.clone()],[[8,8],[5.8,6]],'skin',fixed(fore),side+' forearm');
    rings([b.clone().lerp(c,.76),c.clone().lerp(b,-.06)],[[7.8,8],[7.5,7.5]],'navy',fixed(fore),side+' wrist guard');
    solid(new THREE.SphereGeometry(1,10,8),c.clone().add(new THREE.Vector3(sign*5,0,-1)).toArray(),[9,6,7],'dark',hand,side+' glove');
    for(const f of ['Finger0','Finger1','Finger2']){
      const finger=`Bip01 ${side} ${f}`,tip=finger+'1';
      if(bones.has(tip))rings([pos(finger),pos(tip).lerp(pos(finger),-.3)],[[2.8,2.8],[2.3,2.3]],'skin',fixed(finger),side+' '+f,6);
    }
    const thigh=`Bip01 ${side} Thigh`,calf=`Bip01 ${side} Calf`,foot=`Bip01 ${side} Foot`;
    const hip=pos(thigh),knee=pos(calf),ankle=pos(foot);
    const legWeight=p=>{
      if(p.y>hip.y-20){const t=THREE.MathUtils.smoothstep(hip.y-p.y,0,20);return [['Bip01 Pelvis',1-t],[thigh,t]];}
      const t=THREE.MathUtils.smoothstep(knee.y-p.y,-15,15);return [[thigh,1-t],[calf,t]];
    };
    rings([hip,hip.clone().lerp(knee,.25),hip.clone().lerp(knee,.75),knee,knee.clone().lerp(ankle,.4),knee.clone().lerp(ankle,.85),ankle],[[15,15],[18,18],[16,16],[15,14],[14,13],[9,9],[8,8]],'navy',legWeight,side+' trousers');
    solid(new THREE.BoxGeometry(1,1,1),[hip.x+sign*15,hip.y-20,hip.z],[6,21,17],'dark',thigh,side+' cargo pocket');
    solid(new THREE.BoxGeometry(1,1,1),[hip.x+sign*18.5,hip.y-16,hip.z],[1,5,14],'orange',thigh,side+' pocket tag',null,false);
    const patchVertices=[],patchIndices=[];
    for(const dy of [0,7.5,15])for(const dx of [-8.5,0,8.5]){
      const center=knee.clone().lerp(hip,dy/(hip.y-knee.y));
      patchVertices.push(center.x+dx,center.y,center.z-Math.sqrt(1-(dx/16)**2)*16-.5);
    }
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){const n=row*3+col;patchIndices.push(n,n+3,n+1,n+1,n+3,n+4);}
    const patch=new THREE.BufferGeometry();patch.setAttribute('position',new THREE.Float32BufferAttribute(patchVertices,3));patch.setIndex(patchIndices);
    mesh(patch,'navyLight',legWeight,side+' knee panel',false);
    rings([ankle.clone().add(new THREE.Vector3(0,4,0)),ankle.clone().add(new THREE.Vector3(0,11,0))],[[9.5,9],[9.5,9]],'orange',fixed(calf),side+' ankle strap');
    const shoe=ankle.clone().add(new THREE.Vector3(0,-12,-10));
    solid(new THREE.SphereGeometry(1,10,8),shoe.toArray(),[12,11,24],'white',foot,side+' shoe');
    solid(new THREE.BoxGeometry(1,1,1),[shoe.x,shoe.y-8,shoe.z],[23,5,42],'navy',foot,side+' sole');
    solid(new THREE.BoxGeometry(1,1,1),[shoe.x,shoe.y+6,shoe.z+1],[24,6,15],'orange',foot,side+' shoe strap');
  }
  const head='Bip01 Head';
  rings([246,250,259,272,281,286].map(y=>new THREE.Vector3(0,y,2)),[[5,9],[11,12],[18,15],[19,16],[15,13],[7,6]],'skin',fixed(head),'sculpted face',14);
  for(const s of [-1,1]){
    solid(new THREE.SphereGeometry(1,8,6),[s*19,263,2],[3.5,6,4],'skin',head,'ear');
    // Sharp almond eyes, brows and small highlights, modelled rather than decals.
    const eyePoints=[[s*3,266.5,-13.5],[s*15,268,-10.8],[s*14,263,-11.4],[s*4,262,-13.4]];
    const eyeGeo=new THREE.BufferGeometry();eyeGeo.setAttribute('position',new THREE.Float32BufferAttribute(eyePoints.flat(),3));eyeGeo.setIndex(s===1?[0,1,2,0,2,3]:[0,2,1,0,3,2]);
    mesh(eyeGeo,'white',fixed(head),'eye white',false);
    const eyeRotation=new THREE.Euler(0,Math.PI-s*.23,0);
    solid(new THREE.CircleGeometry(1,12),[s*8.5,264.7,-12.9],[2.4,2.8,1],'iris',head,'iris',eyeRotation,false);
    solid(new THREE.CircleGeometry(1,10),[s*8.5,264.7,-13.02],[1,2.25,1],'dark',head,'pupil',eyeRotation,false);
    solid(new THREE.CircleGeometry(1,8),[s*8,265.8,-13.35],[.5,.65,1],'white',head,'eye highlight',eyeRotation,false);
    solid(new THREE.BoxGeometry(1,1,1),[s*9,270,-12.9],[13,1.7,1],'hair',head,'brow',new THREE.Euler(0,s*.22,-s*.12),false);
  }
  solid(new THREE.SphereGeometry(1,6,4),[0,259,-13.2],[2.4,3.2,3.3],'skin',head,'nose',null,false);
  solid(new THREE.BoxGeometry(1,1,1),[0,253,-10.9],[6,.8,.6],'hair',head,'mouth',null,false);
  // A shaped cap plus irregular low-poly swept spikes avoids a smooth helmet.
  solid(new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.63),[0,276,3],[21,18,18],'hair',head,'hair cap');
  const spikes=[[-17,274,-7,-24,273,-9,7],[-12,280,-11,-15,264,-17,8],[-4,284,-12,-5,265,-18,8],[6,284,-10,9,270,-17,8],[15,280,-7,23,269,-10,7],[-15,285,4,-24,293,0,8],[-6,289,6,-13,302,2,9],[5,289,8,8,305,5,9],[15,285,8,26,297,6,8],[17,279,16,27,282,23,8],[5,282,19,10,291,31,9],[-9,281,18,-18,289,28,8],[-18,272,13,-27,273,19,7]];
  for(let i=0;i<spikes.length;i++){
    const [x,y,z,tx,ty,tz,r]=spikes[i],start=new THREE.Vector3(x,y,z),end=new THREE.Vector3(tx,ty,tz);
    const geo=new THREE.ConeGeometry(r,start.distanceTo(end),4,1);geo.translate(0,start.distanceTo(end)/2,0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()));geo.translate(x,y,z);
    mesh(geo,i%4===0?'hairLight':'hair',fixed(head),'hair spike '+i);
  }
  // Author small pieces independently, then batch by material. Each garment
  // remains skinned; hundreds of separate draw calls are not needed per frame.
  const batches=new Map();
  for(const part of meshes){
    const geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
    for(const attribute of Object.keys(geometry.attributes))if(!['position','normal','skinIndex','skinWeight'].includes(attribute))geometry.deleteAttribute(attribute);
    if(!batches.has(part.material))batches.set(part.material,{geometries:[],names:[]});
    batches.get(part.material).geometries.push(geometry);batches.get(part.material).names.push(part.name);
  }
  const batched=[];
  for(const [material,{geometries,names}] of batches){
    const geometry=mergeGeometries(geometries);if(!geometry)throw Error('Cannot batch anime character');
    const combined=new THREE.SkinnedMesh(geometry,material);combined.bind(skeleton,new THREE.Matrix4());
    combined.name=material===outline?'anime outlines':'anime costume';combined.userData.parts=names;
    combined.frustumCulled=false;combined.castShadow=material!==outline;combined.receiveShadow=material!==outline;
    rig.add(combined);batched.push(combined);for(const source of geometries)source.dispose();
  }
  for(const part of meshes)rig.remove(part);
  for(const geometry of new Set(meshes.map(m=>m.geometry)))geometry.dispose();
  return {meshes:batched,skeleton,materials};
}
