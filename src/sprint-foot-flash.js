import * as THREE from 'three';

// Art-directed addition requested from the reference image, separate from
// the decoded S5Runtime trail. One draw call, fixed buffers, no textures or lights.
const corners=[[-1,1],[1,1],[-1,-1],[-1,-1],[1,1],[1,-1]];
export class SprintFootFlash {
 constructor({capacity=40,random=Math.random}={}){
  this.random=random;this.timer=0;this.side=0;this.active=false;
  this.slots=Array.from({length:capacity},()=>({age:1,life:0,p:new THREE.Vector3(),v:new THREE.Vector3(),width:0,length:0,kind:0,facing:0}));
  this.geometry=new THREE.BufferGeometry();
  for(const [name,size] of [['position',3],['uv',2],['opacity',1],['kind',1],['variation',1]])
   this.geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(capacity*6*size),size).setUsage(THREE.DynamicDrawUsage));
  this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.NormalBlending,toneMapped:false,
   vertexShader:`attribute float opacity; attribute float kind; attribute float variation; varying vec2 vUv; varying float vOpacity; varying float vKind; varying float vVariation;
    void main(){vUv=uv;vOpacity=opacity;vKind=kind;vVariation=variation;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
   fragmentShader:`varying vec2 vUv; varying float vOpacity; varying float vKind; varying float vVariation;
    float stroke(vec2 p,vec2 a,vec2 b,float wa,float wb){vec2 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0);return length(p-a-ab*t)-mix(wa,wb,t);}
    float discharge(vec2 p){
     // Filled, tapering shards: broad hot roots and needle tips, never a wire outline.
     float d=stroke(p,vec2(-.08,.22),vec2(.07,-.32),.09,.035);
     d=min(d,stroke(p,vec2(.07,-.32),vec2(-.18,-.87),.035,.001));
     d=min(d,stroke(p,vec2(-.04,.14),vec2(-.36,.29),.07,.025));
     d=min(d,stroke(p,vec2(-.36,.29),vec2(-.24,.58),.025,.001));
     d=min(d,stroke(p,vec2(.02,.03),vec2(.44,-.14),.085,.025));
     d=min(d,stroke(p,vec2(.44,-.14),vec2(.73,.10),.025,.001));
     d=min(d,stroke(p,vec2(-.04,-.13),vec2(-.65,-.42),.045,.001));
     return min(d,stroke(p,vec2(.07,-.29),vec2(.48,-.71),.035,.001));
    }
    void main(){
     vec2 p=vUv*2.0-1.0; float r=length(p); float shape; float heat;
     if(vKind<0.5){
      float angle=(vVariation-.5)*.7;float cs=cos(angle),sn=sin(angle);
      vec2 q=mat2(cs,-sn,sn,cs)*p;q.x*=vVariation>.5?-1.0:1.0;
      float d=discharge(q);
      float core=1.0-smoothstep(-.014,.012,d);
      float rim=1.0-smoothstep(.01,.055,d);
      float halo=exp(-max(d,0.0)*max(d,0.0)*70.0)*.32;
      float flash=exp(-dot(q*vec2(1.0,1.4),q*vec2(1.0,1.4))*18.0);
      shape=core+rim*.45+halo+flash*.85;heat=max(core,flash);
     }else if(vKind<1.5){
      shape=pow(max(0.0,1.0-abs(p.x)),2.0)*pow(max(0.0,1.0-abs(p.y)),.55);
      heat=exp(-p.x*p.x*30.0)*max(0.0,1.0-abs(p.y));
     }else if(vKind>2.5){
      // Soft light on the floor, not a second copy of the lightning silhouette.
      shape=exp(-r*r*7.0)*max(0.0,1.0-r)*.85;heat=exp(-r*r*45.0);
     }else{shape=exp(-r*r*5.0)*max(0.0,1.0-r)*.22;heat=0.0;}
     float alpha=min(1.0,shape)*vOpacity;if(alpha<.003)discard;
     vec3 color=mix(vec3(1.0,.24,.008),vec3(1.0,.98,.86),clamp(heat*1.6,0.0,1.0));
     gl_FragColor=vec4(color*1.35,alpha);
     #include <colorspace_fragment>
    }`});
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='Sprint • heel flare';this.mesh.frustumCulled=false;this.mesh.visible=false;
  this.right=new THREE.Vector3();this.axis=new THREE.Vector3();this.view=new THREE.Vector3();this.foot=new THREE.Vector3();this.point=new THREE.Vector3();
 }
 clear(){for(const p of this.slots)p.life=0;this.timer=0;this.active=false;this.geometry.setDrawRange(0,0);this.mesh.visible=false;}
 locateFoot(controller,avatar,side){
  const s=Math.sin(controller.facing),c=Math.cos(controller.facing);
  const foot=avatar?.bones?.get(side<0?'Bip01 L Foot':'Bip01 R Foot');
  if(foot){foot.updateWorldMatrix(true,false);foot.getWorldPosition(this.foot);}
  else this.foot.set(controller.position.x+c*side*.2-s*.15,controller.position.y,controller.position.z-s*side*.2-c*.15);
  // The flash sits just above the support plane; lifted heels leave sparks.
  this.foot.y=controller.position.y+.065;
 }
 emit(controller,avatar){
  const side=this.side++%2===0?-1:1,s=Math.sin(controller.facing),c=Math.cos(controller.facing),r=this.random;
  this.locateFoot(controller,avatar,side);
  for(let i=0;i<8;i++){
   const p=this.slots.find(p=>p.age>=p.life);if(!p)break;
   p.p.copy(this.foot);p.floor=this.foot.y;p.age=0;p.facing=controller.facing;p.anchorSide=side;p.variation=r();p.kind=i===0?0:i===1?2:i===2?3:1;
   if(i<3){
    p.life=i===1?.20:.14;p.width=i===2?1.1:i===0?.9:.8;p.length=i===2?1.2:i===0?.75:1.1;p.v.set(0,0,0);
    if(i===0)p.p.y+=.12;
    if(i===2){p.p.x-=s*.12;p.p.z-=c*.12;p.p.y+=.015;}
   }
   else{
    const spread=(r()-.5)*2.2,speed=2+r()*3.5;
    p.life=.17+r()*.15;p.width=.03+r()*.04;p.length=.5+r()*.65;
    p.v.set(-s*speed+c*spread,.2+r()*.8,-c*speed-s*spread);p.p.y+=.025+r()*.09;
   }
  }
 }
 update(dt,controller,avatar){
  if(!(dt>0))return;
  const active=controller.sprinting&&controller.grounded;
  for(const p of this.slots)if(p.age<p.life){
   p.age+=dt;p.p.addScaledVector(p.v,dt);
   if(p.kind===1){p.v.y-=4*dt;p.p.y=Math.max(p.p.y,p.floor);}
   // The electric discharge follows the shoe; only its sparks and glow are left behind.
   if(active&&(p.kind===0||p.kind===3)){
    this.locateFoot(controller,avatar,p.anchorSide);p.p.copy(this.foot);p.facing=controller.facing;
    if(p.kind===0)p.p.y+=.12;
    else{p.p.x-=Math.sin(p.facing)*.12;p.p.z-=Math.cos(p.facing)*.12;p.p.y+=.015;}
   }
  }
  if(!active){this.active=false;this.timer=0;return;}
  if(!this.active){this.timer=0;this.active=true;}
  this.timer-=dt;
  if(this.timer<=0){this.emit(controller,avatar);this.timer+=.12;}
 }
 render(camera){
  camera.updateMatrixWorld();let vertex=0;
  const attrs=this.geometry.attributes;
  for(const p of this.slots){
   if(p.age>=p.life)continue;
   const age=p.age/p.life,fade=p.kind===0||p.kind===3?1-Math.pow(age,3):Math.pow(1-age,1.5),size=p.kind===0?1+age*.15:1;
   if(p.kind>=2){this.right.set(Math.cos(p.facing),0,-Math.sin(p.facing));this.axis.set(Math.sin(p.facing),0,Math.cos(p.facing));}
   else if(p.kind===1){
    this.axis.copy(p.v).normalize();this.view.subVectors(camera.position,p.p).normalize();this.right.crossVectors(this.view,this.axis);
    if(this.right.lengthSq()<1e-8)this.right.setFromMatrixColumn(camera.matrixWorld,0);this.right.normalize();
   }else{this.right.setFromMatrixColumn(camera.matrixWorld,0);this.axis.setFromMatrixColumn(camera.matrixWorld,1);}
   for(const [x,y] of corners){
    this.point.copy(p.p).addScaledVector(this.right,x*p.width*.5*size).addScaledVector(this.axis,y*p.length*.5*size);
    attrs.position.setXYZ(vertex,this.point.x,this.point.y,this.point.z);attrs.uv.setXY(vertex,(x+1)/2,(y+1)/2);
    attrs.opacity.setX(vertex,fade);attrs.kind.setX(vertex,p.kind);attrs.variation.setX(vertex,p.variation);vertex++;
   }
  }
  this.geometry.setDrawRange(0,vertex);this.mesh.visible=vertex>0;for(const attr of Object.values(attrs))attr.needsUpdate=true;
 }
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
