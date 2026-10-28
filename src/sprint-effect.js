import * as THREE from 'three';
import {SCN_SCENE_SCALE as SCALE} from './root-motion.js';
import {SprintFootFlash} from './sprint-foot-flash.js';

// Port of the recovered skill_fastrun1.seq parameters. Native evidence and
// outstanding renderer differences are recorded in effet-sprint/LECTURE.md.
export function appearanceAt(keys,t){
  t=Math.max(0,Math.min(1,t));
  const end=keys.findIndex(k=>k[0]>=t);
  if(end<=0)return [...keys[end<0?keys.length-1:0]];
  const a=keys[end-1],b=keys[end],f=(t-a[0])/(b[0]-a[0]);
  return a.map((v,i)=>v+(b[i]-v)*f);
}

// Native 0x1136C50 / 0x1137C50: randomize key targets, then integrate
// the size rate at 0x1169018. Randomness is not sampled every frame.
export function createParticleSize(config,life,random){
  const sample=key=>({width:Math.max(0,key[1]+(random()-random())*config.widthVariation),
    height:Math.max(0,key[2]+(random()-random())*config.heightVariation)});
  const first=sample(config.appearance[0]);
  const size={...first,target:first,nextTime:0,widthRate:0,heightRate:0};
  selectSizeTarget(size,config,life,0,sample);
  return size;
}
function selectSizeTarget(size,config,life,age,sample){
  if(age<size.nextTime)return;
  size.width=size.target.width;size.height=size.target.height;
  const key=config.appearance.find(key=>key[0]*life>age);
  if(!key){size.widthRate=0;size.heightRate=0;size.nextTime=Infinity;return;}
  size.target=sample(key);size.nextTime=key[0]*life;
  const remaining=size.nextTime-age;
  size.widthRate=(size.target.width-size.width)/remaining;
  size.heightRate=(size.target.height-size.height)/remaining;
}
export function advanceParticleSize(size,config,life,age,dt,random){
  size.width+=size.widthRate*dt;size.height+=size.heightRate*dt;
  selectSizeTarget(size,config,life,age,key=>({
    width:Math.max(0,key[1]+(random()-random())*config.widthVariation),
    height:Math.max(0,key[2]+(random()-random())*config.heightVariation)}));
}

export class SprintEffect {
  constructor(config,texture,{random=Math.random}={}){
    this.config=config;this.random=random;this.particles=[];this.remainder=0;
    const capacity=config.capacity*6;
    this.positions=new Float32Array(capacity*3);this.colors=new Float32Array(capacity*4);
    const uv=new Float32Array(capacity*2),corners=[0,1,2,2,1,3];
    for(let i=0;i<capacity;i++)uv.set(config.uv.slice(corners[i%6]*2,corners[i%6]*2+2),i*2);
    this.geometry=new THREE.BufferGeometry();
    this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('color',new THREE.BufferAttribute(this.colors,4).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    this.geometry.setDrawRange(0,0);
    texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
    this.material=new THREE.MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;
    this.mesh.name='S5Runtime skill_fastrun1';
    this.axis=new THREE.Vector3();this.right=new THREE.Vector3();this.view=new THREE.Vector3();
  }
  clear(){this.particles.length=0;this.remainder=0;this.geometry.setDrawRange(0,0);}
  spawn(controller){
    const c=this.config,r=this.random;
    // Native 0x1136F2D: independent radii and two angles for emitter shape 0.
    const radius=r()*c.radius,vertical=r()*c.verticalRadius,azimuth=r()*c.angularRange,polar=r()*c.angularRange;
    const local={x:radius*Math.sin(polar)*Math.cos(azimuth),y:vertical*Math.cos(polar),z:radius*Math.sin(polar)*Math.sin(azimuth)};
    const sin=Math.sin(controller.facing),cos=Math.cos(controller.facing);
    const speed=(c.speed+(r()-r())*c.speedVariation)*SCALE;
    const life=(c.lifeMs+Math.trunc((r()-r())*c.lifeVariationMs))/1000;
    if(life<=0)return;
    this.particles.push({age:0,life,size:createParticleSize(c,life,r),
      position:new THREE.Vector3(controller.position.x+(local.x*cos-local.z*sin)*SCALE,
        controller.position.y+(local.y+c.origin[1])*SCALE,controller.position.z+(-local.x*sin-local.z*cos)*SCALE),
      velocity:new THREE.Vector3(-sin*speed,0,-cos*speed)});
  }
  update(dt,controller){
    if(!(dt>0))return;
    const c=this.config;
    for(const p of this.particles){
      p.age+=dt;
      p.position.addScaledVector(p.velocity,dt);
      p.velocity.y+=c.acceleration[1]*SCALE*dt;
      if(p.age<p.life)advanceParticleSize(p.size,c,p.life,p.age,dt,this.random);
    }
    this.particles=this.particles.filter(p=>p.age<p.life);
    if(!controller.sprinting){this.remainder=0;return;}
    this.remainder+=dt*c.rate;
    const count=Math.floor(this.remainder);this.remainder-=count;
    for(let n=0;n<count&&this.particles.length<c.capacity;n++)this.spawn(controller);
  }
  render(camera){
    camera.updateMatrixWorld();
    const corners=[[-1,1],[1,1],[-1,-1],[-1,-1],[1,1],[1,-1]];
    let vertex=0;
    for(const p of this.particles){
      const [,,,r,g,b,alpha]=appearanceAt(this.config.appearance,p.age/p.life);
      const {width,height}=p.size;
      this.axis.copy(p.velocity).normalize();this.view.subVectors(camera.position,p.position).normalize();
      this.right.crossVectors(this.view,this.axis);
      if(this.right.lengthSq()<1e-8)this.right.setFromMatrixColumn(camera.matrixWorld,0);
      this.right.normalize();
      for(const [x,y] of corners){
        const i=vertex*3,j=vertex*4;
        this.positions[i]=p.position.x+this.right.x*x*width*SCALE*.5+this.axis.x*y*height*SCALE*.5;
        this.positions[i+1]=p.position.y+this.right.y*x*width*SCALE*.5+this.axis.y*y*height*SCALE*.5;
        this.positions[i+2]=p.position.z+this.right.z*x*width*SCALE*.5+this.axis.z*y*height*SCALE*.5;
        this.colors.set([r,g,b,alpha],j);vertex++;
      }
    }
    this.geometry.setDrawRange(0,vertex);this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;
  }
  dispose(){this.geometry.dispose();this.material.map.dispose();this.material.dispose();}
}

class LayeredSprintEffect extends SprintEffect{
 constructor(config,texture){super(config,texture);this.footFlash=new SprintFootFlash();this.mesh.add(this.footFlash.mesh);}
 update(dt,controller,avatar){super.update(dt,controller);this.footFlash.update(dt,controller,avatar);}
 render(camera){super.render(camera);this.footFlash.render(camera);}
 clear(){super.clear();this.footFlash?.clear();}
 dispose(){this.footFlash.dispose();super.dispose();}
 async warmup(renderer,camera,scene){this.footFlash.mesh.visible=true;try{await renderer.compileAsync(this.mesh,camera,scene);}finally{this.footFlash.mesh.visible=false;}}
}
export async function loadSprintEffect(){
  const response=await fetch('/assets/s5runtime/effects/sprint.json');
  if(!response.ok)throw Error(`Sprint effect: ${response.status}`);
  const config=await response.json();
  const texture=await new THREE.TextureLoader().loadAsync('/assets/s5runtime/effects/gazer03_1.png');
  return new LayeredSprintEffect(config,texture);
}
