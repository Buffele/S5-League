import * as THREE from 'three';
import {FIREBALL,FireballProjectiles,fireballContact} from './fireball.js';
import {katonEmission} from './katon-spec.js';
import {createStylizedFireResources} from './stylized-fire.js';
const axis=new THREE.Vector3(0,0,1);
export class FireballEffects{
 constructor(scene){
  this.group=new THREE.Group();this.group.name='Katon · stylized fire';scene.add(this.group);
  this.resources=createStylizedFireResources();this.projectiles=new FireballProjectiles();this.orbs=new Map();this.clock=0;this.cursor=0;this.particles=[];this.rings=[];
  this.breath=this.resources.form();this.breath.visible=false;this.group.add(this.breath);
  this.light=new THREE.PointLight(0xff6e16,0,7,2);this.group.add(this.light);
  this.puffGeometry=new THREE.IcosahedronGeometry(1,1);this.ringGeometry=new THREE.TorusGeometry(1,.045,4,48);
  for(let i=0;i<128;i++){
   const material=this.resources.puffMaterial();
   const mesh=new THREE.Mesh(this.puffGeometry,material);mesh.visible=false;this.group.add(mesh);this.particles.push({mesh,sprite:mesh,life:0,velocity:new THREE.Vector3()});
  }
  for(let i=0;i<4;i++){const mesh=new THREE.Mesh(this.ringGeometry,new THREE.MeshBasicMaterial({color:0xffd254,transparent:true,depthWrite:false,toneMapped:false}));mesh.visible=false;this.group.add(mesh);this.rings.push({mesh,life:0});}
 }
 particle(point,{burst=false,direction=null,size=null}={}){
  const p=this.particles[this.cursor++%this.particles.length],seed=this.cursor*2.39996;
  p.life=p.total=burst?.5+(this.cursor%9)*.045:.28+(this.cursor%5)*.055;p.burst=burst;
  p.mesh.visible=true;p.mesh.position.copy(point);p.mesh.material.uniforms.opacity.value=1;p.mesh.material.uniforms.heat.value=1;p.size=size??(burst?.13+(this.cursor%7)*.055:.035+(this.cursor%5)*.013);
  p.mesh.scale.set(p.size,p.size*2,p.size);
  p.velocity.set(Math.cos(seed),Math.sin(seed*.71)*.65+.4,Math.sin(seed)).multiplyScalar(burst?3.5:1.1);
  if(direction)p.velocity.addScaledVector(direction,burst?2:1.8-p.velocity.dot(direction));p.mesh.rotation.set(seed,seed*.7,seed*.3);
 }
 impact(contact,audio,item){
  for(let i=0;i<(contact.expired?10:46);i++)this.particle(contact.point,{burst:true,direction:item?.direction});
  if(!contact.expired){
   const ring=this.rings.find(r=>!r.life)||this.rings[0];ring.life=.42;ring.mesh.visible=true;ring.mesh.position.copy(contact.point);ring.mesh.quaternion.setFromUnitVectors(axis,item?.direction||axis);
   audio?.specialSound('impact');
  }
 }
 mouth(avatar,c){
  const head=avatar.bones.get('Bip01 Head');if(!head||!avatar.katon?.mouthLocal)throw Error('Katon mouth calibration missing');
  avatar.group.updateWorldMatrix(true,true);
  const mouth=head.localToWorld(new THREE.Vector3().fromArray(avatar.katon.mouthLocal));
  const forward=new THREE.Vector3(Math.sin(c.facing),0,Math.cos(c.facing));
  return {mouth,point:mouth.clone().addScaledVector(forward,.055),forward};
 }
 update(dt,c,avatar,{target=null,onHit=()=>{},audio=null,paused=false}={}){
  if(paused)return;this.clock+=dt;this.resources.material.uniforms.time.value=this.clock;
  for(const p of this.particles){
   p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;if(!p.life)continue;
   const t=p.life/p.total;p.mesh.position.addScaledVector(p.velocity,dt);p.velocity.multiplyScalar(Math.exp(-2*dt));p.velocity.y+=dt*1.5;
   p.mesh.scale.set(p.size*(2-t),p.size*(p.burst?1.2+.8*t:3),p.size*(2-t));p.mesh.rotation.z+=dt*4;
   p.mesh.material.uniforms.opacity.value=Math.min(1,t*2.8);p.mesh.material.uniforms.heat.value=Math.min(1,t*1.5);
  }
  for(const r of this.rings){r.life=Math.max(0,r.life-dt);r.mesh.visible=r.life>0;if(r.life){r.mesh.scale.setScalar(.3+(1-r.life/.42)*2.5);r.mesh.material.opacity=r.life/.42;}}
  this.projectiles.update(dt,c.collision,target,(contact,item)=>{this.impact(contact,audio,item);if(contact.hit)onHit(contact,item);});
  const cast=c.fireball,power=cast?katonEmission(cast.time):0;
  this.breath.visible=power>0;this.light.intensity=0;
  if(cast&&(power>0||cast.pending)){
   const {mouth,point,forward}=this.mouth(avatar,c);
   // Mouth jet points backwards in the form's local space so its curled
   // trailing tongues project outward from the lips, along the locked facing.
   this.breath.position.copy(point).addScaledVector(forward,.11);
   this.breath.quaternion.setFromUnitVectors(axis,forward.clone().negate());
   this.resources.animate(this.breath,this.clock,{scale:.13+.24*power,jet:true});
   this.light.position.copy(point);this.light.intensity=power*2.5;
   if(power>0&&dt>0){for(let i=0;i<2;i++)this.particle(point.clone().addScaledVector(forward,.3+i*.14),{direction:forward,size:.02+.025*power});}
   if(cast.pending){
    cast.pending=false;const chest=new THREE.Vector3(c.position.x,c.position.y+1.45,c.position.z);
    const obstruction=fireballContact(chest,point,c.collision,target);
    if(obstruction){this.impact(obstruction,audio);if(obstruction.hit)onHit(obstruction);}
    else {const item=this.projectiles.launch(point,null,c.facing);item.age=0;item.mouthOrigin=mouth.clone();}
   }
  }
  const alive=new Set(this.projectiles.items.map(p=>p.id));for(const [id,orb] of this.orbs)if(!alive.has(id)){orb.removeFromParent();this.orbs.delete(id);}
  for(const p of this.projectiles.items){
   let orb=this.orbs.get(p.id);if(!orb){orb=this.resources.form();this.orbs.set(p.id,orb);this.group.add(orb);}
   p.age=(p.age||0)+dt;orb.position.copy(p.position);orb.quaternion.setFromUnitVectors(axis,p.direction);
   this.resources.animate(orb,this.clock,{scale:FIREBALL.radius*Math.min(1,.2+p.age*6)});
   if(dt>0)for(let i=0;i<2;i++)this.particle(p.position.clone().addScaledVector(p.direction,-.2-i*.2),{direction:p.direction});
   if(!this.breath.visible){this.light.position.copy(p.position);this.light.intensity=3;}
  }
 }
 clear(){this.projectiles.clear();for(const orb of this.orbs.values())orb.removeFromParent();this.orbs.clear();this.breath.visible=false;this.light.intensity=0;for(const p of this.particles){p.life=0;p.mesh.visible=false;}for(const r of this.rings){r.life=0;r.mesh.visible=false;}}
 async warmup(renderer,camera,scene){this.breath.visible=true;this.light.intensity=2;this.particles[0].mesh.visible=true;try{await renderer.compileAsync(scene,camera);}finally{this.clear();}}
 dispose(){this.clear();this.resources.dispose();this.puffGeometry.dispose();this.ringGeometry.dispose();for(const p of this.particles)p.mesh.material.dispose();for(const r of this.rings)r.mesh.material.dispose();this.group.removeFromParent();}
}
