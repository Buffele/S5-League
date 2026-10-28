import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// S5 art direction selected by the user: body aura + dodge-like pose echoes
// + blade energy. This replaces only the Plasma right-click presentation.
export const PLASMA_RUSH_PRESENTATION=Object.freeze({name:'plasma_rush_spectral',at:.05,follow:true,cancelOnExit:true});
export const PLASMA_RUSH_LIFETIME=1.3;
const ECHO_COUNT=4,ECHO_INTERVAL=.105,ECHO_LIFE=.52,RELEASE=.30;
const CHANNELS=6,SEGMENTS=48;
const point=new THREE.Vector3(),before=new THREE.Vector3(),after=new THREE.Vector3();
const tangent=new THREE.Vector3(),side=new THREE.Vector3(),view=new THREE.Vector3();
const tempMatrix=new THREE.Matrix4();

export function plasmaRushOpacity(age,releaseAge=null){
 const attack=THREE.MathUtils.smoothstep(age,0,.04);
 const natural=1-THREE.MathUtils.smoothstep(age,.56,1.04);
 const release=releaseAge===null?1:1-THREE.MathUtils.smoothstep(age-releaseAge,0,RELEASE);
 return attack*natural*release;
}
function shellMaterial({weapon=false}={}){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  side:THREE.DoubleSide,toneMapped:false,uniforms:{time:{value:0},opacity:{value:0},expand:{value:weapon?.035:.018}},
  vertexShader:`#include <common>
   #include <skinning_pars_vertex>
   varying vec3 vN;varying vec3 vView;varying vec3 vPosition;uniform float expand;
   void main(){
    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    vec4 mv=modelViewMatrix*vec4(transformed,1.);
    vN=normalize(transformedNormal);vView=-mv.xyz;vPosition=(modelMatrix*vec4(transformed,1.)).xyz;
    mv.xyz+=vN*expand;gl_Position=projectionMatrix*mv;
   }`,
  fragmentShader:`varying vec3 vN;varying vec3 vView;varying vec3 vPosition;uniform float time;uniform float opacity;
   void main(){
    float rim=1.-abs(dot(normalize(vN),normalize(vView)));
    float flow=.78+.22*sin(vPosition.y*17.+vPosition.x*9.-time*10.);
    float intensity=pow(rim,1.5);
    gl_FragColor=vec4(mix(vec3(.025,.16,.85),vec3(.16,.66,1.),intensity),opacity*(.055+intensity*.7)*flow);
   }`});
}
function ribbonGeometry(channels,segments){
 const geometry=new THREE.BufferGeometry(),uv=new Float32Array(channels*(segments+1)*4),indices=[];
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(channels*(segments+1)*6),3).setUsage(THREE.DynamicDrawUsage));
 for(let c=0;c<channels;c++)for(let i=0;i<=segments;i++){
  const v=(c*(segments+1)+i)*2;uv.set([i/segments,0,i/segments,1],v*2);
  if(i<segments)indices.push(v,v+1,v+2,v+1,v+3,v+2);
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);return geometry;
}
function streamMaterial({blade=false}={}){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:blade?THREE.AdditiveBlending:THREE.NormalBlending,toneMapped:false,
  uniforms:{time:{value:0},opacity:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float time;uniform float opacity;
   void main(){
    float across=abs(vUv.y*2.-1.);
    float flow=.8+.2*sin(vUv.x*19.-time*11.+sin(vUv.x*9.+time*3.)*.8);
    float edge=pow(max(0.,1.-across),1.4);
    float core=exp(-across*across*32.);
    float tail=1.-smoothstep(.52,1.,vUv.x);
    vec3 color=mix(vec3(.035,.18,.88),vec3(.24,.78,1.),core);
    gl_FragColor=vec4(color,opacity*edge*flow*tail);
   }`});
}
function makePoseCopy(source,materials){
 const root=clone(source),pairs=[],skeletons=new Set();
 function pair(a,b){
  pairs.push([a,b]);
  if(b.isMesh){b.material=a.userData.weapon?materials.weapon:materials.body;b.castShadow=false;b.receiveShadow=false;
   b.frustumCulled=false;b.userData.excludeInkOutline=true;if(b.isSkinnedMesh)skeletons.add(b.skeleton);}
  a.children.forEach((child,i)=>pair(child,b.children[i]));
 }
 pair(source,root);root.visible=false;
 return {root,pairs,skeletons};
}
function copyPose(copy,source){
 source.updateWorldMatrix(true,true);
 for(const [a,b]of copy.pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;}
 source.matrixWorld.decompose(copy.root.position,copy.root.quaternion,copy.root.scale);
 copy.root.visible=true;copy.root.updateMatrixWorld(true);
 for(const skeleton of copy.skeletons)skeleton.update();
}
function disposePose(copy){for(const skeleton of copy.skeletons)skeleton.dispose();copy.root.removeFromParent();}

export class PlasmaRushEffect{
 constructor(scene){
  this.data={duration:PLASMA_RUSH_LIFETIME,nodes:[]};this.age=Infinity;this.avatar=null;this.boundAvatar=null;
  this.group=new THREE.Group();this.group.name='plasma-rush-spectral';this.group.visible=false;scene.add(this.group);
  this.auraGroup=new THREE.Group();this.group.add(this.auraGroup);this.nodes=[{group:this.group}];
  this.aura=new THREE.Mesh(ribbonGeometry(CHANNELS,SEGMENTS),streamMaterial());
  this.blade=new THREE.Mesh(ribbonGeometry(1,1),streamMaterial({blade:true}));
  this.auraGroup.add(this.aura);this.group.add(this.blade);
  for(const mesh of [this.aura,this.blade]){mesh.frustumCulled=false;mesh.renderOrder=5;mesh.userData.excludeInkOutline=true;}
  this.bodyMaterial=shellMaterial();this.weaponMaterial=shellMaterial({weapon:true});
  this.echoes=[];this.releaseAge=null;this.lastCapture=-Infinity;this.captureCount=0;this.cursor=0;
  this.lastPosition=new THREE.Vector3();this.tip=new THREE.Vector3();this.base=new THREE.Vector3();
  this.lastEchoPosition=new THREE.Vector3();this.centerY=.8;this.sourceWeapon=null;
 }
 bind(avatar){
  if(this.boundAvatar===avatar)return;
  if(this.live)disposePose(this.live);
  for(const echo of this.echoes){disposePose(echo);echo.material.dispose();}
  this.echoes=[];this.boundAvatar=avatar;this.sourceWeapon=null;
  if(!avatar)return;
  this.live=makePoseCopy(avatar.group,{body:this.bodyMaterial,weapon:this.weaponMaterial});this.group.add(this.live.root);
  for(let i=0;i<ECHO_COUNT;i++){
   const material=new THREE.MeshBasicMaterial({color:i%2?0x2a8dff:0x159dff,transparent:true,opacity:0,
    blending:THREE.NormalBlending,depthWrite:false,toneMapped:false});
   const echo={...makePoseCopy(avatar.group,{body:material,weapon:material}),material,born:-Infinity};
   this.echoes.push(echo);this.group.add(echo.root);
  }
  this.sourceWeapon=(avatar.meshes??[]).find(mesh=>mesh.userData.weapon);
  if(this.sourceWeapon){
   this.sourceWeapon.geometry.computeBoundingBox();const box=this.sourceWeapon.geometry.boundingBox;
   const size=box.getSize(new THREE.Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
   this.localBase=box.getCenter(new THREE.Vector3());this.localTip=this.localBase.clone();
   this.localBase[axis]=box.min[axis];this.localTip[axis]=box.max[axis];
  }
 }
 trigger(position,avatar,{facing=0,attack=null}={}){
  this.clear();this.bind(avatar);this.age=0;this.avatar=avatar;this.attack=attack;
  this.group.visible=true;this.auraGroup.position.copy(position);this.auraGroup.rotation.set(0,facing,0);
  this.lastPosition.copy(position);this.releaseAge=null;this.lastCapture=-Infinity;this.captureCount=0;this.cursor=0;
 }
 clear(){
  this.age=Infinity;this.avatar=null;this.attack=null;this.releaseAge=null;this.group.visible=false;
  if(this.live)this.live.root.visible=false;
  for(const echo of this.echoes){echo.root.visible=false;echo.born=-Infinity;echo.material.opacity=0;}
  this.aura.material.uniforms.opacity.value=0;this.blade.material.uniforms.opacity.value=0;
  this.bodyMaterial.uniforms.opacity.value=0;this.weaponMaterial.uniforms.opacity.value=0;
  this.group.userData.rush=this.snapshot();
 }
 stop(){if(Number.isFinite(this.age)&&this.releaseAge===null)this.releaseAge=this.age;}
 update(dt){
  if(!Number.isFinite(this.age))return;
  this.age+=Math.max(0,dt);
  if(this.attack?.phase&&this.attack.phase!=='action')this.stop();
  for(const echo of this.echoes){
   const progress=THREE.MathUtils.clamp((this.age-echo.born)/ECHO_LIFE,0,1);
   echo.root.visible=progress<1;echo.material.opacity=.64*(1-THREE.MathUtils.smoothstep(progress,.16,1));
  }
  if(this.age>=PLASMA_RUSH_LIFETIME||this.releaseAge!==null&&this.age-this.releaseAge>=Math.max(RELEASE,ECHO_LIFE))this.clear();
 }
 sample(capture=true){
  if(!Number.isFinite(this.age)||!this.avatar)return;
  if(this.attack?.phase&&this.attack.phase!=='action')this.stop();
  const source=this.avatar.group;source.updateWorldMatrix(true,true);
  source.getWorldPosition(this.lastPosition);this.auraGroup.position.copy(this.lastPosition);
  // Local +Z is the leading edge of the wind; the imported actor faces -Z.
  // Follow its current presented heading even without travel and during fade.
  source.getWorldQuaternion(this.auraGroup.quaternion);this.auraGroup.rotateY(Math.PI);
  this.auraGroup.updateWorldMatrix(true,false);
  const chest=this.avatar.bones?.get('Bip01 Spine1');
  if(chest){chest.getWorldPosition(point);this.centerY=Math.max(.45,point.y-this.lastPosition.y);}
  if(this.live)copyPose(this.live,source);
  if(this.sourceWeapon){
   const weapon=this.sourceWeapon;weapon.updateWorldMatrix(true,false);
   this.base.copy(this.localBase).applyMatrix4(weapon.matrixWorld);this.tip.copy(this.localTip).applyMatrix4(weapon.matrixWorld);
   const hand=this.avatar.bones?.get('R_Hand_Dummy');
   if(hand){hand.getWorldPosition(point);if(this.tip.distanceToSquared(point)<this.base.distanceToSquared(point)){point.copy(this.base);this.base.copy(this.tip);this.tip.copy(point);}}
  }
  // Capture completed simulation poses only. Render/interpolation never invents
  // older positions or duplicates an echo while the simulation is paused.
  if(capture&&this.releaseAge===null&&this.echoes.length&&this.age<=.66&&this.age-this.lastCapture>=ECHO_INTERVAL&&
    (this.captureCount===0||this.lastPosition.distanceToSquared(this.lastEchoPosition)>.1764)){
   const echo=this.echoes[this.cursor++%this.echoes.length];copyPose(echo,source);echo.born=this.age;
   echo.material.opacity=.64;this.lastCapture=this.age;this.captureCount++;
   this.lastEchoPosition.copy(this.lastPosition);
  }
 }
 curve(out,u,channel){
  const phi=channel/CHANNELS*Math.PI*2,r=Math.sin(u*Math.PI*.78)*(.48+u*.12);
  // A continuous wave travels toward the wake (increasing u). The envelope
  // grows behind the shoulders, so the leading energy stays attached while
  // the air streams bow and unfurl instead of forming straight speed lines.
  const wake=Math.sin(u*Math.PI*.8),phase=u*8-this.age*6+phi;
  const bend=Math.sin(phase)*.18*wake+Math.sin(u*14-this.age*9+phi)*.035*wake;
  const lift=Math.cos(phase-.5)*.12*wake;
  return out.set(Math.cos(phi)*r+bend,this.centerY+Math.sin(phi)*r*.6+lift,
   .75-u*2.15+Math.sin(u*7-this.age*5+phi)*.07*wake);
 }
 render(camera){
  if(!Number.isFinite(this.age))return;
  const opacity=plasmaRushOpacity(this.age,this.releaseAge),time=this.age;
  // Live shells follow the current interpolated pose; historical copies remain
  // exactly where/when sample() captured them after the animation mixer.
  this.sample(false);
  for(const material of [this.aura.material,this.blade.material,this.bodyMaterial,this.weaponMaterial]){
   material.uniforms.time.value=time;material.uniforms.opacity.value=opacity;
  }
  this.aura.material.uniforms.opacity.value*=.7;this.weaponMaterial.uniforms.opacity.value*=1.25;
  this.auraGroup.updateWorldMatrix(true,false);tempMatrix.copy(this.auraGroup.matrixWorld).invert();
  const eye=camera.getWorldPosition(new THREE.Vector3()).applyMatrix4(tempMatrix),positions=this.aura.geometry.attributes.position;
  for(let c=0;c<CHANNELS;c++)for(let i=0;i<=SEGMENTS;i++){
   const u=i/SEGMENTS;this.curve(point,u,c);this.curve(before,u-.002,c);this.curve(after,u+.002,c);
   tangent.subVectors(after,before).normalize();view.subVectors(eye,point).normalize();side.crossVectors(tangent,view).normalize();
   if(side.lengthSq()<1e-8)side.set(1,0,0);
   const width=(.07+.095*Math.sin(u*Math.PI))*Math.pow(1-u,.5),v=(c*(SEGMENTS+1)+i)*2;
   before.copy(point).addScaledVector(side,-width);after.copy(point).addScaledVector(side,width);
   positions.setXYZ(v,before.x,before.y,before.z);positions.setXYZ(v+1,after.x,after.y,after.z);
  }
  positions.needsUpdate=true;
  if(this.sourceWeapon){
   const eyeWorld=camera.getWorldPosition(new THREE.Vector3()),p=this.blade.geometry.attributes.position;
   tangent.subVectors(this.tip,this.base).normalize();view.subVectors(eyeWorld,this.tip).normalize();side.crossVectors(tangent,view).normalize();
   if(side.lengthSq()<1e-8)side.set(1,0,0);
   point.copy(this.tip).addScaledVector(tangent,.24);
   for(const [i,center,width]of [[0,point,.035],[1,this.base,.105]]){
    before.copy(center).addScaledVector(side,-width);after.copy(center).addScaledVector(side,width);
    p.setXYZ(i*2,before.x,before.y,before.z);p.setXYZ(i*2+1,after.x,after.y,after.z);
   }
   p.needsUpdate=true;this.blade.visible=true;
  }else this.blade.visible=false;
  this.group.userData.rush=this.snapshot();
 }
 snapshot(){return {age:Number.isFinite(this.age)?this.age:null,avatarId:this.avatar?.group.uuid??null,
  opacity:Number.isFinite(this.age)?plasmaRushOpacity(this.age,this.releaseAge):0,releaseAge:this.releaseAge,
  captures:this.captureCount,echoes:this.echoes.filter(e=>e.root.visible).map(e=>({age:this.age-e.born,opacity:e.material.opacity,position:e.root.position.toArray()})),
  blade:this.sourceWeapon?{base:this.base.toArray(),tip:this.tip.toArray()}:null,position:this.lastPosition.toArray()};}
 dispose(){this.clear();if(this.live)disposePose(this.live);for(const e of this.echoes){disposePose(e);e.material.dispose();}
  this.bodyMaterial.dispose();this.weaponMaterial.dispose();for(const mesh of [this.aura,this.blade]){mesh.geometry.dispose();mesh.material.dispose();}this.group.removeFromParent();}
}
