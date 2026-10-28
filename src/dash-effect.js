import {
  AdditiveBlending,BufferAttribute,BufferGeometry,Color,DoubleSide,Group,Mesh,
  MeshBasicMaterial,NormalBlending,Points,RingGeometry,ShaderMaterial,Vector3,
} from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export const DASH_STYLES=Object.freeze({
  temporal:'Temporal glitch',
  plasma:'Plasma energy',
  smoke:'Ghost smoke',
});
export const normalizeDashStyle=value=>Object.hasOwn(DASH_STYLES,value)?value:'temporal';

const STYLE={
  temporal:{life:.27,interval:.045,opacity:.52,pulse:0xff4fdd,blending:NormalBlending},
  plasma:{life:.34,interval:.034,opacity:.62,pulse:0x68f5ff,blending:AdditiveBlending},
  smoke:{life:.48,interval:.055,opacity:.32,pulse:0xa899ff,blending:NormalBlending},
};
const TEMPORAL_COLORS=[0x41efff,0xff3dbb,0xf5fbff,0x735cff];
const PLASMA_COLORS=[0x9affff,0x29d9ff,0x7a8dff,0xe5ffff];
const SMOKE_COLORS=[0x302c55,0x665d91,0x9a8bbd,0x474263];

function particleField(count=40){
  const geometry=new BufferGeometry();
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),alphas=new Float32Array(count),sizes=new Float32Array(count),softness=new Float32Array(count);
  geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('color',new BufferAttribute(colors,3));
  geometry.setAttribute('alpha',new BufferAttribute(alphas,1));geometry.setAttribute('size',new BufferAttribute(sizes,1));geometry.setAttribute('softness',new BufferAttribute(softness,1));
  const material=new ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:AdditiveBlending,toneMapped:false,
    vertexShader:`attribute float alpha;attribute float size;attribute float softness;varying vec3 vColor;varying float vAlpha;varying float vSoft;
      void main(){vColor=color;vAlpha=alpha;vSoft=softness;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*(240./max(160.,-mv.z));}`,
    fragmentShader:`varying vec3 vColor;varying float vAlpha;varying float vSoft;
      void main(){vec2 p=gl_PointCoord-.5;float roundMask=1.-smoothstep(.18,.5,length(p));float scan=.55+.45*step(.48,fract(gl_PointCoord.y*5.));float mask=mix(scan,roundMask,vSoft);if(mask<.02)discard;gl_FragColor=vec4(vColor,vAlpha*mask);}`});
  const points=new Points(geometry,material);points.frustumCulled=false;points.renderOrder=8;
  const pool=Array.from({length:count},()=>({active:false,age:0,life:1,p:new Vector3(),v:new Vector3(),color:new Color(),size:10,soft:0}));
  return {geometry,material,points,pool,positions,colors,alphas,sizes,softness};
}

// Procedural presentation feedback: geometry, skeletons and particles are
// allocated once. Styles only change pooled transforms and materials.
export class DashEffect {
  constructor(source,{style='temporal'}={}){
    this.source=source;this.group=new Group();this.group.name='dash-feedback';this.style=normalizeDashStyle(style);
    this.elapsed=0;this.next=0;this.captures=0;this.particleCursor=0;
    this.slots=Array.from({length:6},(_,index)=>{
      const root=clone(source),pairs=[],skeletons=new Set();
      const material=new MeshBasicMaterial({color:0x71e9ff,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
      function pair(a,b){pairs.push([a,b]);if(b.isMesh){b.material=material;b.castShadow=false;b.receiveShadow=false;if(b.isSkinnedMesh)skeletons.add(b.skeleton);}a.children.forEach((child,i)=>pair(child,b.children[i]));}
      pair(source,root);root.visible=false;this.group.add(root);
      return {root,pairs,material,skeletons,age:Infinity,index,basePosition:new Vector3(),baseScale:new Vector3(1,1,1)};
    });
    this.pulseMaterial=new MeshBasicMaterial({color:0xc3f7ff,transparent:true,opacity:0,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,toneMapped:false});
    this.pulse=new Mesh(new RingGeometry(.8,1,32),this.pulseMaterial);this.pulse.visible=false;this.group.add(this.pulse);this.pulseAge=1;
    this.particles=particleField();this.group.add(this.particles.points);this.configure(this.style);
  }
  configure(style){
    this.style=normalizeDashStyle(style);const config=STYLE[this.style];this.lifetime=config.life;this.interval=config.interval;
    this.pulseMaterial.color.setHex(config.pulse);this.pulseMaterial.blending=this.style==='smoke'?NormalBlending:AdditiveBlending;this.pulseMaterial.needsUpdate=true;
    this.particles.material.blending=config.blending;this.particles.material.needsUpdate=true;
    for(const slot of this.slots){slot.material.blending=config.blending;slot.material.needsUpdate=true;}
    this.clear();
  }
  clear(){
    this.elapsed=0;this.next=0;
    for(const slot of this.slots){slot.age=Infinity;slot.root.visible=false;slot.material.opacity=0;}
    for(const particle of this.particles.pool)particle.active=false;
    this.pulse.visible=false;this.pulseAge=1;this.syncParticles();
  }
  colors(){return this.style==='plasma'?PLASMA_COLORS:this.style==='smoke'?SMOKE_COLORS:TEMPORAL_COLORS;}
  capture(controller){
    const slot=this.slots[this.next];this.next=(this.next+1)%this.slots.length;
    for(const [source,target] of slot.pairs){target.position.copy(source.position);target.quaternion.copy(source.quaternion);target.scale.copy(source.scale);target.visible=source.visible;}
    slot.age=0;slot.root.visible=true;slot.basePosition.copy(slot.root.position);slot.baseScale.copy(slot.root.scale);
    const colors=this.colors();slot.material.color.setHex(colors[this.captures%colors.length]);slot.material.opacity=STYLE[this.style].opacity;slot.root.updateMatrixWorld(true);
    for(const skeleton of slot.skeletons)skeleton.update();
    this.emit(controller,this.style==='plasma'?5:this.style==='smoke'?4:3);this.captures++;
  }
  emit(controller,count){
    if(!controller)return;const direction=controller.dashDirection||{x:0,z:0},colors=this.colors();
    for(let index=0;index<count;index++){
      const particle=this.particles.pool[this.particleCursor++%this.particles.pool.length],spread=(index-(count-1)/2)/(count||1),color=colors[(this.captures+index)%colors.length];
      particle.active=true;particle.age=0;particle.life=this.style==='smoke'?.42+index*.025:.2+index*.018;
      particle.p.set(controller.position.x+(Math.random()-.5)*.45,controller.position.y+.35+Math.random()*1.35,controller.position.z+(Math.random()-.5)*.45);
      if(this.style==='smoke')particle.v.set(-direction.x*.35+spread*.25,.8+Math.random()*.45,-direction.z*.35-spread*.25);
      else particle.v.set(-direction.x*(1.2+Math.random())+spread*.7,(Math.random()-.5)*.8,-direction.z*(1.2+Math.random())-spread*.7);
      particle.color.setHex(color);particle.size=this.style==='smoke'?20+Math.random()*18:this.style==='plasma'?8+Math.random()*10:7+Math.random()*12;particle.soft=this.style==='temporal'?0:1;
    }
  }
  updateSlot(slot,dt){
    slot.age+=dt;const progress=Math.min(1,slot.age/this.lifetime);slot.root.visible=slot.age<this.lifetime;if(!slot.root.visible)return;
    const config=STYLE[this.style];slot.material.opacity=config.opacity*(1-progress);slot.root.position.copy(slot.basePosition);slot.root.scale.copy(slot.baseScale);
    if(this.style==='temporal'){
      const amount=(1-progress)*.035;slot.root.position.x+=Math.sin(slot.age*95+slot.index*2.1)*amount;slot.root.position.y+=Math.cos(slot.age*73+slot.index)*amount*.6;slot.root.scale.x*=1+Math.sin(slot.age*120+slot.index)*.018;
    }else if(this.style==='plasma')slot.root.scale.multiplyScalar(1+progress*.055);
    else{slot.root.position.y+=progress*.42;slot.root.scale.multiplyScalar(1+progress*.18);}
  }
  updateParticles(dt){
    for(const particle of this.particles.pool){if(!particle.active)continue;particle.age+=dt;if(particle.age>=particle.life){particle.active=false;continue;}particle.p.addScaledVector(particle.v,dt);particle.v.multiplyScalar(this.style==='smoke'?.985:.94);if(this.style==='smoke')particle.v.y+=dt*.35;}
    this.syncParticles();
  }
  syncParticles(){
    const field=this.particles;
    field.pool.forEach((particle,index)=>{const offset=index*3,life=particle.active?Math.max(0,1-particle.age/particle.life):0;field.positions[offset]=particle.p.x;field.positions[offset+1]=particle.p.y;field.positions[offset+2]=particle.p.z;field.colors[offset]=particle.color.r;field.colors[offset+1]=particle.color.g;field.colors[offset+2]=particle.color.b;field.alphas[index]=life*(this.style==='smoke'?.32:.8);field.sizes[index]=particle.size*(this.style==='smoke'?(1+(1-life)*.7):1);field.softness[index]=particle.soft;});
    for(const name of ['position','color','alpha','size','softness'])field.geometry.attributes[name].needsUpdate=true;
  }
  update(dt,controller){
    if(dt<=0)return;const revenge=controller.events.includes('revengedash');
    const start=revenge||controller.events.includes('dash')||controller.events.includes('airdash');
    if(start){this.clear();this.elapsed=this.interval;this.pulse.position.set(controller.position.x,controller.position.y+(controller.grounded?.05:.8),controller.position.z);const normal=controller.grounded?new Vector3(0,1,0):new Vector3(controller.dashDirection.x,0,controller.dashDirection.z);this.pulse.quaternion.setFromUnitVectors(new Vector3(0,0,1),normal);this.pulseAge=0;this.pulse.visible=true;this.emit(controller,this.style==='plasma'?14:this.style==='smoke'?10:12);}
    for(const slot of this.slots)this.updateSlot(slot,dt);this.updateParticles(dt);
    this.pulseAge+=dt;const pulseLife=this.style==='smoke'?.42:.32;this.pulse.visible=this.pulseAge<pulseLife;this.pulse.scale.setScalar(.2+this.pulseAge*(this.style==='plasma'?4.7:3.5));this.pulseMaterial.opacity=(this.style==='smoke'?.42:.9)*Math.max(0,1-this.pulseAge/pulseLife);
    // Switching bundles clears the outgoing effect. Emit on the destination
    // avatar for a short trail, without extending dodge physics or SP cost.
    const revengeTrail=controller.attack?.revengeDash&&controller.attack.timeMs<250;
    if(revenge||(controller.dash>0&&controller.dashPhase==='evade')||revengeTrail){this.elapsed+=dt;if(this.elapsed>=this.interval){this.elapsed%=this.interval;this.capture(controller);}}else this.elapsed=0;
  }
  dispose(){
    this.group.removeFromParent();this.pulse.geometry.dispose();this.pulseMaterial.dispose();this.particles.geometry.dispose();this.particles.material.dispose();
    for(const slot of this.slots){slot.material.dispose();for(const skeleton of slot.skeletons)skeleton.dispose();}
  }
}
