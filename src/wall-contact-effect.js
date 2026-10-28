import {Group,Mesh,RingGeometry,MeshBasicMaterial,DoubleSide,AdditiveBlending,Vector3} from 'three';

// Reusable procedural placeholder for basic_wall_jump.seq, on the contact plane.
export class WallContactEffect {
  constructor(){
    this.group=new Group();this.group.visible=false;this.age=0;this.duration=.38;
    this.material=new MeshBasicMaterial({color:0x8ef4ff,transparent:true,opacity:0,side:DoubleSide,depthWrite:false,blending:AdditiveBlending});
    this.ring=new Mesh(new RingGeometry(.75,1,24),this.material);this.group.add(this.ring);
    this.core=new Mesh(new RingGeometry(.1,.2,12),this.material);this.group.add(this.core);
  }
  setContact(contact){
    if(!contact)return;
    const n=new Vector3(contact.normal.x,contact.normal.y,contact.normal.z).normalize();
    this.group.position.copy(contact.point).addScaledVector(n,.025);
    this.group.quaternion.setFromUnitVectors(new Vector3(0,0,1),n);
  }
  trigger(contact){
    if(!contact)return;
    this.setContact(contact);
    this.age=0;this.group.visible=true;this.update(0);
  }
  update(dt){
    if(!this.group.visible)return;
    this.age+=dt;const t=Math.min(1,this.age/this.duration);
    this.material.opacity=(1-t)*.95;this.ring.scale.setScalar(.12+t*.48);
    this.core.rotation.z=t*2;this.core.scale.setScalar(1+t*2);
    if(t===1)this.clear();
  }
  clear(){this.group.visible=false;this.material.opacity=0;}
  dispose(){this.ring.geometry.dispose();this.core.geometry.dispose();this.material.dispose();}
}
