import * as THREE from 'three';

// Presentation requested by the user. These moving streaks are not a decoded
// S5Runtime sequence; combat remains hitscan and supplies the exact stopped endpoint.
export function createBulletTracers(scene,{capacity=32,color=0xffdc8a}={}){
 const pixels=new Uint8Array(32*8*4);
 for(let y=0;y<8;y++)for(let x=0;x<32;x++){
  const i=(y*32+x)*4,across=Math.max(0,1-Math.abs((y+.5)/8*2-1));
  pixels.set([255,255,255,Math.round(255*across*across*Math.sin(Math.PI*(x+.5)/32))],i);
 }
 const map=new THREE.DataTexture(pixels,32,8);map.needsUpdate=true;
 map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearFilter;
 const geometry=new THREE.PlaneGeometry(1,1);
 const beams=Array.from({length:capacity},()=>{
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map,color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  mesh.name='Moving bullet tracer';mesh.visible=false;mesh.frustumCulled=false;scene.add(mesh);
  return {mesh,start:new THREE.Vector3(),end:new THREE.Vector3(),age:Infinity,duration:0,length:0,owner:null};
 });
 let next=0;
 const axis=new THREE.Vector3(),normal=new THREE.Vector3(),across=new THREE.Vector3(),basis=new THREE.Matrix4();
 const release=b=>{b.age=Infinity;b.mesh.visible=false;b.owner=null;};
 return {
  emit(origin,endpoint,owner=null){
   const length=new THREE.Vector3().copy(origin).distanceTo(endpoint);if(length<1e-6)return;
   const b=beams[next++%beams.length];b.start.copy(origin);b.end.copy(endpoint);b.length=length;
   b.age=0;b.duration=Math.min(.18,Math.max(.06,length/240));b.mesh.visible=true;b.owner=owner;
  },
  update(dt){for(const b of beams){b.age+=dt;b.mesh.visible=b.age<b.duration+.05;if(!b.mesh.visible)b.owner=null;}},
  clear(){for(const b of beams)release(b);},
  clearForOwner(owner){for(const b of beams)if(b.owner===owner)release(b);},
  render(camera){
   for(const b of beams)if(b.mesh.visible){
    const head=Math.min(1,(b.age+.008)/b.duration)*b.length,tail=Math.max(0,head-Math.min(2.5,b.length));
    axis.subVectors(b.end,b.start).normalize();normal.subVectors(camera.position,b.start).normalize();
    across.crossVectors(normal,axis);
    if(across.lengthSq()<1e-8)across.crossVectors(Math.abs(axis.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),axis);
    across.normalize();normal.crossVectors(axis,across).normalize();basis.makeBasis(axis,across,normal);
    b.mesh.quaternion.setFromRotationMatrix(basis);b.mesh.position.copy(b.start).addScaledVector(axis,(head+tail)/2);
    b.mesh.scale.set(head-tail,.045,1);b.mesh.material.opacity=1-Math.max(0,b.age-b.duration)/.05;
   }
  },
 };
}
