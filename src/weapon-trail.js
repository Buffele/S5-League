import * as THREE from 'three';
import {plasmaTrailWindow} from './plasma-effects-data.js';
import {SPY_DAGGER_EFFECTS} from './spy-dagger-data.js';
import {assassinClawTrailWindow} from './assassin-claw-data.js';

// Light-strike window comes from the extracted Lua's 50–300 ms ghost trail.
// Air/rush presentation is provisional, not a claim about original S4 effects.
export function trailWindow(attack){
  if(!attack)return false;
  if(attack.weapon==='bat')return false; // Native CActGhostTrail shape is not restored.
  if(attack.weapon==='ironboots')return false; // Requires two actor-skinned foot trails.
  if(attack.weapon==='sigmablade')return false; // Native two-form ghost trail remains unconverted.
  if(attack.weapon==='vitalshock')return false; // No converted native ghost trail for this item.
  if(attack.weapon==='deathscythe')return false; // Native scythe ghost trail geometry remains unconverted.
  if(attack.weapon==='assassinclaw')return assassinClawTrailWindow(attack);
  if(attack.weapon==='twinblade')return ['light','strong'].includes(attack.kind)&&attack.time>=.05&&attack.time<=.6;
  if(attack.weapon==='katana'){
    const window=attack.kind==='light'?[[.3,.6],[.05,3],[.5,1]][attack.comboIndex??0]:attack.kind==='strong'?[0,.9]:attack.kind==='air'?[.1,1.2]:attack.kind==='heavy'?[.05,.5]:null;
    return !!window&&attack.time>=window[0]&&attack.time<=window[1];
  }
  // Source timings, existing S5 ribbon renderer (not the native GhostTrail).
  if(attack.weapon==='breaker')return attack.kind!=='charge'&&attack.time>=(attack.kind==='heavy'?.1:.05)&&attack.time<=(attack.kind==='heavy'?.9:attack.kind==='air'?.35:.6);
  if(attack.weapon==='counter')return attack.kind!=='guard'&&attack.kind!=='air'&&attack.time>=(attack.comboIndex===3?.15:.05)&&attack.time<=(attack.comboIndex===3?1.1:.6);
  if(attack.weapon==='plasma')return plasmaTrailWindow(attack);
  // Rush's native shortknife01 sequence is loaded by combat-effects; its
  // GhostTrail declaration is commented out. Cuts retain their authored trail.
  const trail=SPY_DAGGER_EFFECTS.cut.trail;
  return ['light','air'].includes(attack.type)&&attack.time>=trail.beginMs/1000&&attack.time<=trail.endMs/1000;
}

export class WeaponTrail {
  constructor(weapon,{capacity=32,lifetime=.12,texture=null,weapon:kind='dagger',blending=kind==='assassinclaw'?THREE.AdditiveBlending:THREE.NormalBlending}={}){
    this.weapon=weapon;this.capacity=capacity;this.lifetime=lifetime;
    this.samples=[];this.time=0;this.attack=null;
    // Local blade centreline: tip measured on shortknife.scn, base chosen
    // inside the cutting edge so the ribbon does not include the guard/hand.
    this.base=new THREE.Vector3(-5,-55,0);
    this.tip=new THREE.Vector3(-9.530236,-150.67503,0);
    if(kind!=='dagger'){
      weapon.geometry.computeBoundingBox();const bounds=weapon.geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      const axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';this.base.copy(center);this.tip.copy(center);
      this.base[axis]=bounds.max[axis];this.tip[axis]=bounds.min[axis];
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(capacity*6),3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(capacity*8),4).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(capacity*4),2).setUsage(THREE.DynamicDrawUsage));
    const indices=[];
    for(let i=0;i<capacity-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    geometry.setIndex(indices);geometry.setDrawRange(0,0);
    const material=new THREE.MeshBasicMaterial({map:texture,blending,vertexColors:true,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
    this.mesh=new THREE.Mesh(geometry,material);this.mesh.name='spy-dagger-motion-trail';
    this.mesh.frustumCulled=false;this.mesh.visible=false;
    this.rootColor=new THREE.Color(0xff7136);this.tipColor=new THREE.Color(0xffe6a2);
    if(kind!=='dagger'){this.rootColor.set(0xffffff);this.tipColor.set(0xffffff);}
  }
  clear(){this.samples.length=0;this.attack=null;this.mesh.visible=false;this.mesh.geometry.setDrawRange(0,0);}
  update(dt,attack,{cancel=false}={}){
    if(cancel){this.clear();return;}
    if(dt<=0)return; // Paused scenes retain their exact pose and trail.
    this.time+=dt;
    if(attack&&attack!==this.attack){this.clear();this.attack=attack;}
    if(!this.samples.length&&!trailWindow(attack))return;
    this.samples=this.samples.filter(s=>this.time-s.time<this.lifetime);
    if(trailWindow(attack)){
      this.weapon.updateWorldMatrix(true,false);
      const base=this.base.clone().applyMatrix4(this.weapon.matrixWorld),tip=this.tip.clone().applyMatrix4(this.weapon.matrixWorld);
      const last=this.samples.at(-1);
      // No arena-wide ribbon after a reset, teleport or diagnostic pose change.
      if(last&&base.distanceTo(last.base)>2)this.samples.length=0;
      this.samples.push({base,tip,time:this.time});
      if(this.samples.length>this.capacity)this.samples.shift();
    }
    const geometry=this.mesh.geometry,position=geometry.attributes.position,color=geometry.attributes.color;
    for(let i=0;i<this.samples.length;i++){
      const sample=this.samples[i],fade=Math.max(0,1-(this.time-sample.time)/this.lifetime);
      position.setXYZ(i*2,sample.base.x,sample.base.y,sample.base.z);
      position.setXYZ(i*2+1,sample.tip.x,sample.tip.y,sample.tip.z);
      color.setXYZW(i*2,this.rootColor.r,this.rootColor.g,this.rootColor.b,.12*fade);
      color.setXYZW(i*2+1,this.tipColor.r,this.tipColor.g,this.tipColor.b,.85*fade);
      geometry.attributes.uv.setXY(i*2,i/Math.max(1,this.samples.length-1),0);
      geometry.attributes.uv.setXY(i*2+1,i/Math.max(1,this.samples.length-1),1);
    }
    position.needsUpdate=true;color.needsUpdate=true;
    geometry.attributes.uv.needsUpdate=true;
    geometry.setDrawRange(0,Math.max(0,this.samples.length-1)*6);
    this.mesh.visible=this.samples.length>=2;
  }
  dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();}
}
