import * as THREE from 'three';
import {dressArena,createSky} from './arena-detail.js';
import {rampGeometry} from './collision.js';

export function createArena(scene) {
  const colliders=[], meshes=[];
  const colors={cream:0xf0dfbb,navy:0x304866,blue:0x759bcc,orange:0xf68b48,green:0x63b9a1,white:0xfff5df};
  const gradient=new THREE.DataTexture(new Uint8Array([105,190,255]),3,1,THREE.RedFormat);gradient.needsUpdate=true;
  const materials=Object.fromEntries(Object.entries(colors).map(([n,c])=>[n,new THREE.MeshToonMaterial({color:c,gradientMap:gradient})]));
  function box(x,y,z,w,h,d,color='cream',solid=false,edges=true) {
    const geo=new THREE.BoxGeometry(w,h,d),mesh=new THREE.Mesh(geo,materials[color]);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);if(solid)meshes.push(mesh);
    if(edges){const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x273e59,transparent:true,opacity:.6}));mesh.add(outline);}
    if(solid) colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
    return mesh;
  }
  function label(text,x,y,z,width=3,height=.5,color='#314965',rotation=0) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font='bold 75px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,64);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
    mesh.position.set(x,y,z);mesh.rotation.x=rotation;scene.add(mesh);return mesh;
  }
  box(0,-.35,0,46,.7,48,'cream',true);
  // Broad tile lines keep speed and distance readable without visual noise.
  const points=[];
  for(let n=-22;n<=22;n+=4){points.push(new THREE.Vector3(n,.006,-24),new THREE.Vector3(n,.006,24));points.push(new THREE.Vector3(-23,.006,n),new THREE.Vector3(23,.006,n));}
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xafa98e,transparent:true,opacity:.42})));
  box(-23,1,0,.5,2,48,'blue',true);box(23,1,0,.5,2,48,'blue',true);
  box(0,1,-24,46,2,.5,'blue',true);box(0,1,24,46,2,.5,'blue',true);
  box(-9,3.4,-5,1,6.8,9,'green',true);box(-14,3.4,-5,1,6.8,9,'green',true);
  for(const x of [-9,-14]){box(x,6.45,-.46,.65,.12,.06,'orange');label('↑',x,4,-.45,.65,1,'#fff5df');}
  box(6,1,-4,5,2,2.4,'orange',true);box(12,.65,3,4,1.3,2.8,'orange',true);box(9,1.6,10,3,3.2,3,'orange',true);
  box(6,1.75,-16,20,3.5,9,'blue',true);
  box(6,3.6,-16,20,.2,9,'white',true);
  // Ramp from z=-5.5 (ground) to z=-11.5 (platform height).
  const ramp={minX:11,maxX:15,minZ:-11.5,maxZ:-5.5,bottom:0,top:3.7};
  const rampShape=rampGeometry(ramp);
  const rampGeo=new THREE.BufferGeometry();rampGeo.setAttribute('position',new THREE.Float32BufferAttribute(rampShape.vertices,3));rampGeo.setIndex(rampShape.indices);rampGeo.computeVertexNormals();
  const rampMesh=new THREE.Mesh(rampGeo,new THREE.MeshToonMaterial({color:colors.white,gradientMap:gradient,side:THREE.DoubleSide}));rampMesh.castShadow=true;rampMesh.receiveShadow=true;scene.add(rampMesh);meshes.push(rampMesh);
  box(0,6.2,-18,1,5.2,1,'white',true);box(10,6.2,-18,1,5.2,1,'white',true);box(5,8.8,-18,12,.8,3,'white',true);box(5,8.35,-17.2,7,.12,.2,'orange');
  label('AIR / DAGGER',3,1.5,-11.48,7,.8);label('01  —  MOVEMENT LAB',0,.02,13,9,1,'#84979b',-Math.PI/2);
  label('WALL JUMP',-11.5,.02,2,5,.7,'#519582',-Math.PI/2);
  createSky(scene);
  for(let i=0;i<12;i++) {
    const cloud=new THREE.Group();cloud.position.set((i-6)*14,25+(i%3)*4,-70-(i%2)*20);
    for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.SphereGeometry(2+j%2,8,6),new THREE.MeshBasicMaterial({color:0xfff8e9}));puff.position.set(j*2.5,Math.sin(j)*1.2,0);puff.scale.set(1.6,1,.7);cloud.add(puff);}scene.add(cloud);
  }
  // A single non-combat target provides visual range / timing feedback.
  const target=new THREE.Group();target.position.set(1,0,-7);scene.add(target);
  const targetMat=new THREE.MeshToonMaterial({color:0xe9f1eb,gradientMap:gradient});
  for(const [x,y,z,w,h,d] of [[0,1,0,.8,.9,.45],[0,1.7,0,.5,.5,.45],[-.23,.3,0,.2,.6,.25],[.23,.3,0,.2,.6,.25],[-.55,1,0,.2,.7,.25],[.55,1,0,.2,.7,.25]]) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),targetMat);mesh.position.set(x,y,z);mesh.castShadow=true;target.add(mesh);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.22,.045,6,24),new THREE.MeshBasicMaterial({color:0xff7d3c}));ring.position.set(0,1.12,.24);target.add(ring);
  dressArena(scene,{materials,box,target});
  return {colliders,ramp,meshes,target,materials};
}
