import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {selectedWeaponEffect} from './weapon-effect-styles.js';
import {CounterArtParts} from './counter-art-parts.js';
import {EXTRA_MELEE_EFFECTS,extraMeleeProfile} from './melee-art-catalog.js';
import {MeleeArtParts} from './melee-art-parts.js';
import {WeaponPowerAura} from './weapon-power-aura.js';
import {WeaponIdleFlame} from './weapon-idle-flame.js';

// Artist-authored S5 presentation, independent of native attack/contact clocks.
// Every blade sample comes from the evaluated equipped mesh, never actor origin.
const white=new T.Color(0xe5faff),up=new T.Vector3(0,1,0),N=56;
const palette={dagger:0x72dfff,counter:0xffbd67,plasma:0x278bff,bat:0x80e4d2};
const fade=(age,start,end)=>1-T.MathUtils.smoothstep(age,start,end);
export function artProfile({weapon,action,style}){
 if(style==='F')return {weapon,action,style,color:0x397dff,flameOnly:true,trail:false,echo:null,flow:0,shards:0,auraMode:'flame'};
 const p={weapon,action,style,color:palette[weapon],trail:true,width:1,life:.26,echo:null,echoLife:.48,interval:.10,echoCount:3,flow:0,orbit:false,shell:false,distort:false,shards:0};
 if(weapon==='dagger'){
  Object.assign(p,{width:.24,life:.23,color:style==='C'?0x9389ff:0x62dfff});
  if(action==='cut'){
   if(style==='B')Object.assign(p,{echo:'hand',echoCount:2,interval:.075,width:.45});
   if(style==='C')Object.assign(p,{distort:true,shell:true,flow:2,shards:8,width:.6});
  }else{
   if(style==='A')Object.assign(p,{flow:2,shell:true,width:.3});
   if(style==='B')Object.assign(p,{echo:'body',echoLife:.7,interval:.13,echoCount:4,shell:true,flow:1});
   if(style==='C')Object.assign(p,{echo:'body',echoCount:1,echoLife:.9,interval:.18,distort:true,shell:true,flow:3,shards:12});
  }
 }
 if(weapon==='counter'){
  p.shell=true;
  if(style==='A')Object.assign(p,{width:1.18,life:.20,shards:12,shell:true});
  if(style==='B')Object.assign(p,{echo:'weapon',echoCount:2,echoLife:.43,interval:.075,width:.65});
  if(style==='C')Object.assign(p,{width:.85,shell:true,flow:4,shards:18});
  if(action==='power')Object.assign(p,{width:p.width*1.5,life:.34,echoCount:1,echoLife:.62,interval:.15});
  if(action==='guard')Object.assign(p,{trail:false,echo:null,shell:true,orbit:style==='C',plates:style==='B',flow:style==='C'?4:0});
  if(action==='air'&&style==='B')Object.assign(p,{echo:'body',echoCount:1,echoLife:.9,interval:.2});
  if(p.echo==='weapon')p.echo='weapons';
 }
 if(weapon==='plasma'){
  Object.assign(p,{color:0x238cff,width:1,life:.34,shell:true});
  if(style==='A')Object.assign(p,{width:1.35,flow:1});
  if(style==='B')Object.assign(p,{echo:'weapon',echoCount:2,echoLife:.5,interval:.085,width:.55});
  if(style==='C')Object.assign(p,{flow:5,width:.55,life:.4,shards:16});
  if(action==='power')p.width*=1.45;
  if(action==='air'&&style==='B')Object.assign(p,{echo:'body',echoCount:1,echoLife:.95,interval:.20});
 }
 if(weapon==='bat'){
  if(style==='A')Object.assign(p,{color:0xffd283,width:1.1,life:.19,echo:action==='spin'?'weapon':null,shards:16});
  if(style==='B')Object.assign(p,{color:0x83e0d1,width:.65,life:.38,flow:4,orbit:action==='spin',shell:true});
  if(style==='C')Object.assign(p,{color:0xffb93f,width:.9,life:.26,segmented:true,shards:14,shell:true});
 }
 extraMeleeProfile(p);
 if(['counter','plasma'].includes(weapon)&&action==='power')Object.assign(p,{powerAura:true,auraMode:style==='A'?'edge':style==='B'?'flame':'current',trail:false,echo:null,flow:0,shards:0,shell:false});
 return p;
}
function glowMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,
 uniforms:{color:{value:new T.Color()},alpha:{value:0},time:{value:0},distort:{value:0},center:{value:new T.Vector3()},radius:{value:1e5}},
 vertexShader:`#include <common>
 #include <skinning_pars_vertex>
 varying vec3 vP;varying vec3 vN;uniform float time;uniform float distort;
 void main(){
 #include <beginnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <defaultnormal_vertex>
 #include <begin_vertex>
 #include <skinning_vertex>
 vec4 world=modelMatrix*vec4(transformed,1.);vN=normalize(mat3(viewMatrix)*mat3(modelMatrix)*objectNormal);
 world.xyz+=normalize(mat3(modelMatrix)*objectNormal)*distort*(.025+.025*sin(world.y*31.+time*14.+world.z*10.));vP=world.xyz;
 gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`varying vec3 vP;varying vec3 vN;uniform vec3 color;uniform float alpha;uniform float time;uniform float distort;uniform vec3 center;uniform float radius;
 void main(){float mask=1.-smoothstep(radius*.65,radius,distance(vP,center));float rim=pow(1.-abs(dot(normalize(vN),normalize((viewMatrix*vec4(cameraPosition-vP,0.)).xyz))),1.7);
 float stripes=.6+.4*sin(vP.y*48.-time*18.+sin(vP.x*12.+time*3.)*2.);float breakup=mix(1.,smoothstep(.18,.8,stripes),distort);
 gl_FragColor=vec4(mix(color,vec3(.85,.98,1.),rim*.55),alpha*(.18+.75*rim)*mask*breakup);}`});}
function poseCopy(source,scene){
 const root=clone(source),pairs=[],skeletons=new Set(),material=glowMaterial();
 function pair(a,b){pairs.push([a,b]);if(b.isMesh){b.material=material;b.castShadow=false;b.receiveShadow=false;b.frustumCulled=false;b.userData.excludeInkOutline=true;if(b.isSkinnedMesh)skeletons.add(b.skeleton);}a.children.forEach((child,i)=>pair(child,b.children[i]));}
 pair(source,root);scene.add(root);root.visible=false;return {root,pairs,skeletons,material,born:-Infinity,scope:null};
}
function capture(copy,avatar,scope,guard){
 avatar.group.updateWorldMatrix(true,true);
 for(const [a,b]of copy.pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;
  if(b.isMesh){if(scope==='weapons')b.visible=a.visible&&a.userData.weapon===true;else if(scope==='weapon')b.visible=a.visible&&a.userData.weapon===true&&a.userData.source!==guard?.userData.source;else if(scope==='guard')b.visible=a.visible&&a.userData.source===guard?.userData.source;}}
 avatar.group.matrixWorld.decompose(copy.root.position,copy.root.quaternion,copy.root.scale);copy.root.visible=true;copy.root.updateMatrixWorld(true);for(const skeleton of copy.skeletons)skeleton.update();copy.scope=scope;
}
function ribbon(){
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array((N+1)*6),3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(new Float32Array((N+1)*8),4).setUsage(T.DynamicDrawUsage));
 const uv=[],indices=[];for(let i=0;i<=N;i++){uv.push(i/N,0,i/N,1);if(i<N){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,
  uniforms:{time:{value:0},segments:{value:0}},vertexShader:'attribute vec4 color;varying vec4 vC;varying vec2 vUv;void main(){vC=color;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec4 vC;varying vec2 vUv;uniform float time;uniform float segments;void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),.65);float core=exp(-pow((vUv.y-.5)*13.,2.));float dash=mix(1.,smoothstep(.15,.3,fract(vUv.x*11.-time*2.)),segments);gl_FragColor=vec4(mix(vC.rgb,vec3(.9,.98,1.),core*.65),vC.a*edge*dash);}'});
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=5;mesh.userData.excludeInkOutline=true;mesh.visible=false;return mesh;
}
function impactMesh(){
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(384*3),3).setUsage(T.DynamicDrawUsage));
 const material=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.userData.excludeInkOutline=true;mesh.visible=false;return mesh;
}
export class MeleeArtEffect{
 constructor(scene,avatar,{owner=null}={}){
  this.avatar=avatar;this.owner=owner;this.age=0;this.attack=null;this.selection=null;this.releaseAge=null;this.history=[];this.samples=[];this.lastSample=-Infinity;this.echoCursor=0;this.lastEcho=-Infinity;this.firstBladeEcho=false;this.landed=false;
  this.group=new T.Group();this.group.name='weapon-art-'+avatar.weapon;scene.add(this.group);this.group.visible=false;
  this.weapon=(avatar.meshes??[]).find(mesh=>mesh.userData.weapon&&!mesh.userData.source?.endsWith('_l.scn'));
  if(!this.weapon)throw Error('Missing evaluated weapon for artistic effect: '+avatar.weapon);
  this.guard=(avatar.meshes??[]).find(mesh=>mesh.userData.weapon&&mesh.userData.source?.endsWith('_l.scn'));
  this.weapon.geometry.computeBoundingBox();const box=this.weapon.geometry.boundingBox,size=box.getSize(new T.Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
  this.localBase=box.getCenter(new T.Vector3());this.localTip=this.localBase.clone();this.localBase[axis]=box.min[axis];this.localTip[axis]=box.max[axis];
  if(avatar.weapon==='dagger'){this.localBase.set(-5,-55,0);this.localTip.set(-9.530236,-150.67503,0);}
  this.base=new T.Vector3();this.tip=new T.Vector3();this.guardPoint=new T.Vector3();this.guardRight=new T.Vector3();this.guardUp=new T.Vector3();this.guardNormal=new T.Vector3();this.color=new T.Color();this.forward=new T.Vector3();this.right=new T.Vector3();this.previousPosition=new T.Vector3();
  this.ribbons=Array.from({length:7},()=>{const mesh=ribbon();this.group.add(mesh);return mesh;});
  this.counterParts=avatar.weapon==='counter'&&this.guard?new CounterArtParts(this.group,avatar,this.weapon,this.guard,ribbon):null;
  this.parts=EXTRA_MELEE_EFFECTS[avatar.weapon]?new MeleeArtParts(avatar,this.group,ribbon):null;
  if(this.parts)this.weapon=this.parts.parts[0].mesh;
  this.live=poseCopy(avatar.group,this.group);this.echoes=Array.from({length:5},()=>poseCopy(avatar.group,this.group));
  this.powerAura=['counter','plasma'].includes(avatar.weapon)?new WeaponPowerAura({avatar,group:this.group,copy:()=>poseCopy(avatar.group,this.group),capture:copy=>capture(copy,avatar,'weapons',this.guard)}):null;
  this.flame=new WeaponIdleFlame({avatar,owner,scene,parts:this.parts?.parts,copy:group=>poseCopy(avatar.group,group),capture:copy=>capture(copy,avatar,'weapons',this.guard)});
  this.bursts=Array.from({length:8},()=>{const mesh=impactMesh();this.group.add(mesh);return {mesh,born:-Infinity,position:new T.Vector3(),normal:new T.Vector3(),ground:false};});
  this.fragments=[];this.lastFragment=-Infinity;this.fragmentMesh=impactMesh();this.fragmentMesh.material.dispose();this.fragmentMesh.material=new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});this.fragmentMesh.geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(384*4),4).setUsage(T.DynamicDrawUsage));this.group.add(this.fragmentMesh);
  this.nodes=[{group:this.group}];this.data={duration:3,nodes:[]};this.burstCursor=0;
 }
 select(attack){
  const selection=selectedWeaponEffect(this.avatar,attack,{replacementOnly:true});
  if(!selection){if(this.attack)this.stop();this.attack=null;return false;}
  if(selection.weapon==='counter'&&!this.counterParts)throw Error('Counter art requires both evaluated weapon scenes');
  if(this.attack!==attack||this.selection?.code!==selection.code){this.stop();this.counterParts?.clear();this.parts?.clear();this.powerAura?.clear();this.attack=attack;this.selection=selection;this.profile=artProfile(selection);this.color.set(this.profile.color);this.startAge=this.age;this.releaseAge=null;this.samples=[];this.history=[];this.lastSample=-Infinity;this.lastEcho=-Infinity;this.lastEchoPosition=null;this.echoCursor=0;this.firstBladeEcho=false;this.landed=false;this.group.visible=true;}
  return true;
 }
 stop(){if(this.releaseAge===null)this.releaseAge=this.age;}
 update(dt){
  if(!(dt>=0&&Number.isFinite(dt)))throw Error('Nonnegative art effect delta required');this.age+=dt;this.flame.update(dt);
  if(this.attack&&this.owner&&this.owner.attack!==this.attack)this.stop();
  if(this.attack?.phase&&this.attack.phase!=='action'&&this.profile?.action!=='guard')this.stop();
  if(this.selection&&this.releaseAge!==null&&this.age-this.releaseAge>1.15)this.clear({flames:false});
 }
 clear({flames=true}={}){if(flames)this.flame.clear();this.counterParts?.clear();this.parts?.clear();this.powerAura?.clear();this.attack=null;this.selection=null;this.releaseAge=this.age;this.samples=[];this.history=[];this.fragments=[];this.lastFragment=-Infinity;this.fragmentMesh.visible=false;this.group.visible=false;this.live.root.visible=false;for(const echo of this.echoes){echo.root.visible=false;echo.born=-Infinity;}for(const burst of this.bursts){burst.mesh.visible=false;burst.born=-Infinity;}for(const mesh of this.ribbons)mesh.visible=false;}
 opacity(){return !this.selection?0:T.MathUtils.smoothstep(this.age-this.startAge,0,.045)*(this.releaseAge===null?1:fade(this.age-this.releaseAge,0,.30));}
 sample({capturePose=true}={}){
  this.flame.sample();
  if(!this.selection||!this.group.visible)return;
  const avatar=this.avatar,p=this.profile;avatar.group.updateWorldMatrix(true,true);this.weapon.updateWorldMatrix(true,false);
  this.base.copy(this.localBase).applyMatrix4(this.weapon.matrixWorld);this.tip.copy(this.localTip).applyMatrix4(this.weapon.matrixWorld);
  if(!this.parts&&avatar.weapon!=='dagger'){const hand=avatar.bones?.get('R_Hand_Dummy');if(!hand)throw Error('Missing R_Hand_Dummy for artistic blade orientation');const hp=hand.getWorldPosition(new T.Vector3());if(this.tip.distanceToSquared(hp)<this.base.distanceToSquared(hp)){const tmp=this.base.clone();this.base.copy(this.tip);this.tip.copy(tmp);}}
  if(p.action==='guard'){
   if(!this.guard)throw Error('Counter guard art requires the evaluated left shield mesh');this.guard.geometry.computeBoundingBox();this.guard.geometry.boundingBox.getCenter(this.guardPoint).applyMatrix4(this.guard.matrixWorld);
   const dimensions=this.guard.geometry.boundingBox.getSize(new T.Vector3()),axes=[0,1,2].sort((a,b)=>dimensions.getComponent(b)-dimensions.getComponent(a));
   this.guardUp.setFromMatrixColumn(this.guard.matrixWorld,axes[0]).normalize();this.guardRight.setFromMatrixColumn(this.guard.matrixWorld,axes[1]).normalize();this.guardNormal.crossVectors(this.guardRight,this.guardUp).normalize();
   const outside=this.guardPoint.clone().sub(avatar.group.getWorldPosition(new T.Vector3()));if(this.guardNormal.dot(outside)<0)this.guardNormal.negate();this.guardPoint.addScaledVector(this.guardNormal,.12);
  }
  avatar.group.getWorldDirection(this.forward).negate();this.forward.y=0;this.forward.normalize();this.right.crossVectors(this.forward,up).normalize();
  const center=avatar.group.getWorldPosition(new T.Vector3()),clock=this.attack?.timeMs??(this.attack?.time??0)*1000;
  const emitting=this.releaseAge===null&&this.attack?.phase!=='recovery';
  this.parts?.sample(this.age,{capture:capturePose&&this.lastSample!==this.age,emit:p.trail&&emitting&&clock>=35,life:p.life});
  if(this.parts){const primary=this.parts.parts.find(part=>part.visible)??this.parts.parts[0];this.base.copy(primary.base);this.tip.copy(primary.tip);this.weapon=primary.mesh;}
  this.counterParts?.sample(this.age,{capture:capturePose&&this.lastSample!==this.age,emit:p.trail&&emitting&&clock>=35,life:p.life});
  if(capturePose&&this.lastSample!==this.age){
   if(this.history.length&&center.distanceTo(this.history.at(-1).position)>3){this.samples=[];this.history=[];}
   this.samples=this.samples.filter(sample=>this.age-sample.time<p.life);this.history=this.history.filter(sample=>this.age-sample.time<.9);
   if(emitting){this.history.push({position:center.clone(),time:this.age});if(p.trail&&clock>=35)this.samples.push({base:this.base.clone(),tip:this.tip.clone(),time:this.age});}
   this.fragments=this.fragments.filter(fragment=>this.age-fragment.born<fragment.life);
   if(emitting&&p.shards&&clock>=100&&this.age-this.lastFragment>.035){
    const seed=this.fragments.length+clock*.017;
    for(let j=0;j<2;j++){const angle=seed*2.399+j*Math.PI,along=.35+.55*((Math.sin(seed*8+j)+1)*.5),part=j===1&&this.counterParts?this.counterParts:this,position=part.base.clone().lerp(part.tip,along);
     const velocity=this.right.clone().multiplyScalar(Math.cos(angle)*.65).addScaledVector(up,Math.sin(angle)*.55).addScaledVector(this.forward,-.5);
     this.fragments.push({position,velocity,born:this.age,life:.3+(j%2)*.13});}
    if(this.fragments.length>64)this.fragments.splice(0,this.fragments.length-64);this.lastFragment=this.age;
   }
   if(this.samples.length>72)this.samples.shift();if(this.history.length>96)this.history.shift();this.lastSample=this.age;
   const echoAllowed=p.echo&&emitting&&clock>=70&&this.echoCursor<p.echoCount;
   const spaced=p.echo!=='body'||!this.lastEchoPosition||center.distanceToSquared(this.lastEchoPosition)>.09||['air','spin'].includes(p.action);
   if(echoAllowed&&spaced&&this.age-this.lastEcho>=p.interval){const echo=this.echoes[this.echoCursor++];capture(echo,avatar,p.echo,this.guard);echo.born=this.age;echo.color=this.color.clone();echo.distort=p.distort;echo.life=p.echoLife;echo.handCenter=this.base.clone();this.lastEcho=this.age;this.lastEchoPosition=center.clone();}
   // D2-B: a separate weapon-only echo appears at the first thrust activation,
   // never on button-down. Later character poses do not move that copy.
   if(p.weapon==='dagger'&&p.action==='rush'&&p.style==='B'&&!this.firstBladeEcho&&clock>=180&&emitting){const echo=this.echoes[4];capture(echo,avatar,'weapon',this.guard);echo.born=this.age;echo.color=new T.Color(0xb5f4ff);echo.life=.65;echo.distort=false;this.firstBladeEcho=true;}
   if(p.action==='air'&&!this.landed&&this.attack&&this.owner?.grounded&&clock>=(this.attack?.profile?.hits?.[0]??300)){
    const contact=this.owner.collision?.raycast({x:center.x,y:center.y+.15,z:center.z},{x:0,y:-.5,z:0});if(contact){this.impact(contact.point,contact.normal,true);this.landed=true;}
   }
  }
  if(this.avatar.group.userData.weaponEffectSettings?.getAura().alwaysActive)this.powerAura?.clear();else this.powerAura?.sample(this,{capturePose});
  const liveScope=p.weapon==='counter'||this.parts?'weapons':p.action==='guard'?'guard':p.weapon==='dagger'&&p.action==='cut'?'hand':'weapon';
  if(p.shell||p.distort){capture(this.live,avatar,liveScope,this.guard);this.material(this.live,this.opacity()*(p.distort?.45:.36),p.distort,liveScope==='hand'?this.base:null);}else this.live.root.visible=false;
  for(const echo of this.echoes){const elapsed=this.age-echo.born;echo.root.visible=elapsed>=0&&elapsed<echo.life;
   if(echo.root.visible)this.material(echo,.78*fade(elapsed,.05,echo.life),echo.distort,echo.scope==='hand'?echo.handCenter:null,echo.color);}
 }
 material(copy,alpha,distort,center=null,color=this.color){const u=copy.material.uniforms;u.color.value.copy(color);u.alpha.value=alpha;u.distort.value=distort?1:0;u.time.value=this.age;u.radius.value=center?.85:1e5;if(center)u.center.value.copy(center);}
 impact(position,normal=null,ground=false){
  if(!this.selection||!position||![position.x,position.y,position.z].every(Number.isFinite))return false;
  const b=this.bursts[this.burstCursor++%this.bursts.length];b.position.copy(position);b.normal.copy(normal??this.forward).normalize();if(b.normal.lengthSq()<1e-10)b.normal.copy(up);b.born=this.age;b.ground=ground;b.mesh.material.color.copy(this.color);this.group.visible=true;return true;
 }
 fillRibbon(mesh,centers,width,opacity,{sweep=null,segmented=false,color=this.color}={}){
  const positions=mesh.geometry.attributes.position,colors=mesh.geometry.attributes.color;mesh.visible=opacity>.002&&centers.length===N+1;if(!mesh.visible)return;
  mesh.material.uniforms.time.value=this.age;mesh.material.uniforms.segments.value=segmented?1:0;
  for(let i=0;i<=N;i++){const u=i/N,c=centers[i],a=new T.Vector3(),b=new T.Vector3();
   if(sweep){a.copy(sweep[i].base);b.copy(sweep[i].tip);const middle=a.clone().lerp(b,.5);a.lerp(middle,1-width);b.lerp(middle,1-width);}
   else{const tangent=centers[Math.min(N,i+1)].clone().sub(centers[Math.max(0,i-1)]).normalize(),side=new T.Vector3().crossVectors(tangent,this.view.clone().sub(c)).normalize();if(side.lengthSq()<1e-8)side.copy(this.right);const w=width*(.15+.85*Math.sin(Math.PI*u));a.copy(c).addScaledVector(side,-w);b.copy(c).addScaledVector(side,w);}
   positions.setXYZ(i*2,a.x,a.y,a.z);positions.setXYZ(i*2+1,b.x,b.y,b.z);const strength=opacity*(.08+.92*u)*Math.sin(Math.PI*(.05+.9*u));
   for(let edge=0;edge<2;edge++)colors.setXYZW(i*2+edge,color.r,color.g,color.b,strength);
  }positions.needsUpdate=true;colors.needsUpdate=true;
 }
 render(camera){
  this.flame.sample();
  if(!this.group.visible||!this.profile)return;this.sample({capturePose:false});this.view=camera.getWorldPosition(new T.Vector3());const p=this.profile,opacity=this.opacity();for(const mesh of this.ribbons)mesh.visible=false;
  const fresh=this.samples.filter(s=>this.age-s.time<p.life);
  if(!this.parts&&p.trail&&fresh.length>=2){
   const bs=new T.CatmullRomCurve3(fresh.map(s=>s.base)),ts=new T.CatmullRomCurve3(fresh.map(s=>s.tip)),centers=[],sweep=[];
   for(let i=0;i<=N;i++){const u=i/N,base=bs.getPoint(u),tip=ts.getPoint(u);sweep.push({base,tip});centers.push(base.clone().lerp(tip,.5));}
   const residual=fade(this.age-fresh.at(-1).time,0,p.life);this.fillRibbon(this.ribbons[0],centers,p.width,residual*.85,{sweep,segmented:p.segmented});
  }
  if(!this.parts&&p.flow&&opacity>0){
   const center=this.profile.action==='guard'?this.guardPoint:this.base.clone().lerp(this.tip,.5),body=this.avatar.group.getWorldPosition(new T.Vector3()).addScaledVector(up,1.05);
   const blade=this.tip.clone().sub(this.base);const rush=p.action==='rush',orbit=p.orbit;
   for(let c=0;c<p.flow;c++){const points=[];for(let i=0;i<=N;i++){
    const u=i/N,phase=c/p.flow*Math.PI*2,wave=Math.sin(u*8-this.age*7+phase),envelope=Math.sin(Math.PI*u);let v;
    if(orbit){const angle=u*Math.PI*2+phase+this.age*5,r=p.action==='guard'?.6:.85;v=(p.action==='guard'?center:body).clone().addScaledVector(p.action==='guard'?this.guardRight:this.right,Math.cos(angle)*r).addScaledVector(p.action==='guard'?this.guardUp:this.forward,Math.sin(angle)*r).addScaledVector(p.action==='guard'?this.guardNormal:up,(u-.5)*.45+wave*.10);}
    else if(rush){v=body.clone().addScaledVector(this.forward,.5-u*2.7).addScaledVector(this.right,Math.cos(phase)*(.22+u*.22)+wave*.16*envelope).addScaledVector(up,Math.sin(phase)*.35+Math.cos(u*6-this.age*6+phase)*.16*envelope);}
    else if(p.action==='air'){v=this.tip.clone().addScaledVector(up,u*1.65).addScaledVector(this.right,Math.cos(phase)*.12+wave*.18*envelope).addScaledVector(this.forward,Math.sin(phase)*.12+Math.cos(u*6-this.age*5+phase)*.13*envelope);}
    else{v=this.base.clone().addScaledVector(blade,u).addScaledVector(this.right,Math.cos(phase)*.07+wave*.14*envelope).addScaledVector(up,Math.sin(phase)*.07+Math.cos(u*8-this.age*8+phase)*.12*envelope);}
    points.push(v);
   }this.fillRibbon(this.ribbons[c+1],points,rush?.05:orbit?.055:.045,opacity*.78,{segmented:p.segmented});}
  }
  if(p.plates&&opacity>0){for(let c=0;c<3;c++){const points=[];for(let i=0;i<=N;i++){const angle=i/N*Math.PI*.52+c*Math.PI*2/3;points.push(this.guardPoint.clone().addScaledVector(this.guardRight,Math.cos(angle)*.65).addScaledVector(this.guardUp,Math.sin(angle)*.85).addScaledVector(this.guardNormal,.08));}this.fillRibbon(this.ribbons[c+1],points,.13,opacity*.85);}}
  this.parts?.render(this);this.counterParts?.render(this);this.powerAura?.render(this);this.renderBursts();this.renderFragments();this.group.userData.art=this.snapshot();
 }
 renderFragments(){
  const mesh=this.fragmentMesh,positions=mesh.geometry.attributes.position,colors=mesh.geometry.attributes.color;let index=0;
  for(const fragment of this.fragments){const t=this.age-fragment.born;if(t>=fragment.life)continue;
   const head=fragment.position.clone().addScaledVector(fragment.velocity,t),direction=fragment.velocity.clone().normalize(),side=new T.Vector3().crossVectors(direction,this.view.clone().sub(head)).normalize();
   const size=(this.profile.segmented?.065:.045)*fade(t,0,fragment.life),tail=head.clone().addScaledVector(direction,-size*2.8),points=[head.clone().addScaledVector(side,size*.4),head.clone().addScaledVector(side,-size*.4),tail];
   for(const point of points){positions.setXYZ(index,point.x,point.y,point.z);colors.setXYZW(index,this.color.r,this.color.g,this.color.b,fade(t,.04,fragment.life)*.85);index++;}
  }mesh.geometry.setDrawRange(0,index);positions.needsUpdate=true;colors.needsUpdate=true;mesh.visible=index>0;
 }
 renderBursts(){
  for(const b of this.bursts){const t=this.age-b.born,life=b.ground?.65:.42;b.mesh.visible=t>=0&&t<life;if(!b.mesh.visible)continue;
   b.mesh.material.opacity=fade(t,.03,life);const positions=b.mesh.geometry.attributes.position,n=b.normal,tangent=new T.Vector3().crossVectors(n,Math.abs(n.y)>.95?new T.Vector3(1,0,0):up).normalize(),bitangent=new T.Vector3().crossVectors(n,tangent).normalize();let index=0;
   const put=v=>positions.setXYZ(index++,v.x,v.y,v.z),radius=(b.ground?.25:.08)+t*(b.ground?2.1:1.5),count=b.ground?24:12;
   for(let j=0;j<count;j++){
    const angle=j/count*Math.PI*2,dir=tangent.clone().multiplyScalar(Math.cos(angle)).addScaledVector(bitangent,Math.sin(angle)),side=new T.Vector3().crossVectors(n,dir);
    const length=(.10+(j%4)*.06)*(1-t/life),head=b.position.clone().addScaledVector(dir,radius*(.65+(j%3)*.18)).addScaledVector(n,.02+(b.ground?Math.sin(j*2)*t*.4:0));
    const tip=head.clone().addScaledVector(dir,length*(this.profile.style==='C'?2:1));put(head.clone().addScaledVector(side,.018));put(head.clone().addScaledVector(side,-.018));put(tip);
   }
   if(b.ground){const point=(a,r)=>b.position.clone().addScaledVector(tangent,Math.cos(a)*r).addScaledVector(bitangent,Math.sin(a)*r).addScaledVector(n,.025);
    if(this.profile.style==='C'){for(let branch=0;branch<8;branch++)for(let step=0;step<4;step++){
     const a=branch/8*Math.PI*2+Math.sin(step*2+branch)*.19,next=branch/8*Math.PI*2+Math.sin((step+1)*2+branch)*.19,start=point(a,radius*step/4),end=point(next,radius*(step+1)/4),side=new T.Vector3().crossVectors(n,end.clone().sub(start)).normalize().multiplyScalar(.018);
     put(start.clone().add(side));put(start.clone().sub(side));put(end);}
    }else for(let j=0;j<48;j++){const angle=j/48*Math.PI*2,next=(j+1)/48*Math.PI*2;put(point(angle,radius));put(point(next,radius));put(point(angle,radius+.045));put(point(next,radius));put(point(next,radius+.045));put(point(angle,radius+.045));}}
   b.mesh.geometry.setDrawRange(0,index);positions.needsUpdate=true;
  }
 }
 snapshot(){return {selection:this.selection,motif:this.profile?.motif??null,opacity:this.opacity(),active:!!this.attack,flame:this.flame.snapshot(),blade:{base:this.base.toArray(),tip:this.tip.toArray(),source:this.weapon.userData.source,mesh:this.weapon.name},...(this.counterParts?{secondPart:this.counterParts.snapshot()}:{}),aura:this.powerAura?.snapshot()??null,parts:this.parts?.snapshot()??[],samples:this.samples.length,echoes:this.echoes.filter(e=>e.root.visible).map(e=>({scope:e.scope,position:e.root.position.toArray(),opacity:e.material.uniforms.alpha.value})),bursts:this.bursts.filter(b=>b.mesh.visible).length};}
 async warmup(renderer,camera,scene){const stage=new T.Scene();for(const copy of [this.live,...this.echoes,...(this.powerAura?.copies??[]),...this.flame.aura.copies])copy.root.traverse(object=>{if(object.isMesh){const proxy=object.clone(false);proxy.visible=true;stage.add(proxy);}});for(const mesh of [this.fragmentMesh,...this.ribbons,...(this.counterParts?.meshes??[]),...(this.parts?.meshes??[]),...(this.powerAura?.meshes??[]),...this.flame.aura.meshes,...this.bursts.map(b=>b.mesh)]){const proxy=mesh.clone(false);proxy.visible=true;stage.add(proxy);}try{for(const volume of this.flame.aura.volumes){renderer.initTexture?.(volume.field.texture);renderer.initTexture?.(volume.mesh.material.uniforms.noiseMap.value);}await renderer.compileAsync(stage,camera,scene);}finally{stage.clear();}}
 dispose(){this.clear();this.counterParts?.dispose();this.parts?.dispose();this.powerAura?.dispose();this.flame.dispose();for(const copy of [this.live,...this.echoes]){for(const skeleton of copy.skeletons)skeleton.dispose();copy.material.dispose();}for(const mesh of [this.fragmentMesh,...this.ribbons,...this.bursts.map(b=>b.mesh)]){mesh.geometry.dispose();mesh.material.dispose();}this.group.removeFromParent();}
}
