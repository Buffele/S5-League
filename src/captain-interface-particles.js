import * as THREE from 'three';
import {createResourceCache} from './resource-cache.js';

const f=Math.fround,DEGREES=0.017453292521994,TAU=6.28000020980835;
export const CAPTAIN_INTERFACE_PARTICLE_RENDER_POLICY=Object.freeze({name:'captain-source-screen-particles-v1',blendFactors:'SRCALPHA / ONE',depthTest:true,depthWrite:false,cull:'NONE',fog:false,blendOperation:'S5 ADD; native inherited BlendOp not qualified',alphaTest:'S5 disabled; native inherited AlphaTest not qualified',nativeReady:false});
export const loadCaptainInterfaceTexture=createResourceCache(url=>new THREE.TextureLoader().loadAsync(url));

// Exact two source branches only. This deliberately does not reinterpret IF
// nodes as world particles or use the shared converter's speed/variation map.
export function captainInterfaceParticleDefinition(raw){
 const name=raw.source?.match(/^uieffect\/(captain_win|captain_rose)\.seq$/)?.[1],node=raw.nodes?.[1];
 const require=value=>{if(!value)throw Error('Unsupported Captain interface particle source');};
 require(name&&raw.coverage?.reachesExactEof&&raw.header.byteField===0&&raw.header.durationField===2000&&raw.nodes.length===2&&node.type==='CActParticle_IF');
 const p=node.fields.particle,c=p.control,v=c.versioned,b=p.base,k=p.blockA.entries[0],key={};
 k.words14to60.forEach((word,i)=>key[(0x14+4*i).toString(16)]=[0x34,0x58,0x5c,0x60].includes(0x14+4*i)?word.int32:word.float32);
 const values=c.primaryWords.map((w,i)=>i<4?w.int32:w.float32),appearance=p.blockB.entries.map(row=>row.map(w=>w.float32)),position=node.fields.interface.screenPositionWords.map(w=>w.float32),uv=p.textures.entries[0]?.uvWords.map(w=>w.float32);
 require(b.field0c.int32===2&&b.field10.int32===0&&b.name.value===''&&b.startTimeField.int32===100&&b.endTimeField.int32===2000);
 require(JSON.stringify(position)==='[0,0,1000]'&&JSON.stringify(values)==='[0,0,1,200,60,0,0,0,0,0,0,800]');
 require(c.versionField===.5&&c.field58.int32===200&&c.field60.int32===200&&c.field6c.int32===0&&!c.flag54&&!c.flag5c&&!c.flag64&&v.field30.float32===100&&v.flags50to53.every(x=>!x)&&v.field68.int32===0&&!v.flag24&&!v.flag25);
 require(p.blockA.entries.length===1&&p.blockA.field10.int32===1900&&p.blockA.flag14&&k.field0c.int32===0&&k.flag10);
 const expected={'14':0,'18':0,'1c':0,'20':100,'24':100,'28':100,'2c':360,'30':0,'34':0,'38':0,'3c':500,'40':0,'44':150,'48':0,'4c':0,'50':0,'54':0,'58':400,'5c':50,'60':0};
 require(Object.entries(expected).every(([keyName,value])=>key[keyName]===value));
 require(JSON.stringify(appearance)==='[[0,20,20,1,1,1,1,0],[1,40,40,1,1,1,0,0]]'&&JSON.stringify(uv)==='[0,0,0,1,1,0,1,1]'&&p.textures.entries.length===1);
 const textureName=name==='captain_win'?'tick3':'tick';
 require(p.textures.entries[0].path.value.split(/[\\/]/).at(-1).toLowerCase()===textureName+'.bmp');
 return {source:raw.source,sourceSha256:raw.sha256,startMs:100,endMs:2000,position,capacity:200,rate:50,lifeMs:400,lifeVariationMs:200,speed:0,speedVariation:60,direction:[100,100,100],spreadDegrees:360,radius:500,height:150,sizeVariation:100,angleVariation:800,appearance,uv,textureName};
}

function rotate(vector,axis,degrees){
 const angle=f(degrees*DEGREES),c=f(Math.cos(angle)),s=f(Math.sin(angle)),[x,y,z]=vector;
 if(axis===0)return [x,f(f(y*c)-f(z*s)),f(f(y*s)+f(z*c))];
 if(axis===1)return [f(f(x*c)+f(z*s)),y,f(f(z*c)-f(x*s))];
 return [f(f(x*c)-f(y*s)),f(f(x*s)+f(y*c)),z];
}

export function createCaptainInterfaceParticleSimulation(definition,{randomInt=()=>Math.floor(Math.random()*32768)}={}){
 if(typeof randomInt!=='function')throw Error('Captain integer random source required');
 const d=definition,pool=[];let remainder=0,elapsedMs=0;
 const random=()=>{const value=randomInt();if(!Number.isInteger(value)||value<0||value>32767)throw Error('Captain random integer outside CRT range');return value;};
 const uniform=()=>f(random()/32768),difference=()=>f((random()-random())/32767);
 const sizeAt=key=>{const delta=f(d.sizeVariation*difference());return [Math.max(0,f(key[1]+delta)),Math.max(0,f(key[2]+delta))];};
 const birth=()=>{
  const radius=f(uniform()*d.radius),height=f(uniform()*d.height),azimuth=f(uniform()*TAU),polar=f(uniform()*TAU);
  const sinPolar=f(Math.sin(polar)),cosPolar=f(Math.cos(polar)),cosAzimuth=f(Math.cos(azimuth)),sinAzimuth=f(Math.sin(azimuth));
  const offset=[f(cosAzimuth*f(sinPolar*radius)),f(cosPolar*height),f(sinAzimuth*f(sinPolar*radius))];
  const speed=f(d.speed+f(d.speedVariation*difference()));let velocity=d.direction.map(x=>f(x*speed));
  for(let axis=0;axis<3;axis++)velocity=rotate(velocity,axis,f(d.spreadDegrees*difference()));
  const life=d.lifeMs+Math.trunc(d.lifeVariationMs*difference());
  const size=sizeAt(d.appearance[0]),angle=f(d.appearance[0][7]+f(d.angleVariation*difference()));
  const targetSize=sizeAt(d.appearance[1]),targetAngle=f(d.appearance[1][7]+f(d.angleVariation*difference())),rate=f(1000/life);
  return {age:0,life,position:offset.map((x,i)=>f(x+d.position[i])),velocity,size,sizeRate:size.map((x,i)=>f(f(targetSize[i]-x)*rate)),angle,angleRate:f(f(targetAngle-angle)*rate),alpha:1,alphaRate:f(-rate)};
 };
 return {
  reset(){pool.length=0;remainder=0;elapsedMs=0;},
  step(deltaMs,{emitting=true}={}){
   if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff||typeof emitting!=='boolean')throw Error('Captain native uint32 delta and emission flag required');
   elapsedMs+=deltaMs;
   // Native11361B0's fallback1136120 zeroes the birth remainder and marks
   // every allocated slot inactive. Retain those slots for ordered reuse.
   if(deltaMs>250){for(const p of pool)p.age=-1;remainder=0;return;}
   const seconds=f(deltaMs*f(.001));let births=0;
   if(emitting){const count=f(f(d.rate*Math.min(seconds,f(.25)))+remainder);births=Math.trunc(count);remainder=f(count-births);}
   // The native pool checks expiry before integration, reuses dead slots in
   // collection order, then appends new slots up to capacity.
   for(let i=0;i<pool.length;i++){
    const p=pool[i];if(p.age>=0)p.age+=deltaMs;
    if(p.age<0||p.age>=p.life){p.age=-1;if(births>0){pool[i]=birth();births--;}continue;}
    p.position=p.position.map((x,axis)=>f(x+f(p.velocity[axis]*seconds)));
    p.size=p.size.map((x,axis)=>f(x+f(p.sizeRate[axis]*seconds)));
    p.angle=f(p.angle+f(p.angleRate*seconds));p.alpha=f(p.alpha+f(p.alphaRate*seconds));
   }
   while(births>0&&pool.length<d.capacity){pool.push(birth());births--;}
  },
  live(){return pool.filter(p=>p.age>=0);},
  snapshot({details=false}={}){return {elapsedMs,remainder,slots:pool.length,particles:pool.filter(p=>p.age>=0).length,...(details?{pool:structuredClone(pool)}:{})};},
 };
}

export function createCaptainInterfaceParticles(definition,texture,options){
 if(!texture?.isTexture)throw Error('Prepared Captain interface texture required');
 const simulation=createCaptainInterfaceParticleSimulation(definition,options),map=texture.clone();map.flipY=false;map.colorSpace=THREE.SRGBColorSpace;
 const geometry=new THREE.BufferGeometry();
 const positions=new Float32Array(definition.capacity*18),colors=new Float32Array(definition.capacity*24),uv=new Float32Array(definition.capacity*12);
 //1240600: bottom-left,top-left,bottom-right, bottom-right,top-left,top-right.
 const corners=[[-1,-1],[-1,1],[1,-1],[1,-1],[-1,1],[1,1]],indices=[1,0,3,3,0,2];
 for(let i=0;i<definition.capacity*6;i++){const index=indices[i%6]*2;uv.set(definition.uv.slice(index,index+2),i*2);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('color',new THREE.BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setDrawRange(0,0);
 // Native singleton16F4398: SRCALPHA/ONE, ZENABLE1, ZWRITE0, CULLNONE,
 // FOG0. BlendOp/AlphaTest inheritance is not certified by this source port.
 const material=new THREE.MeshBasicMaterial({map,vertexColors:true,transparent:true,depthTest:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='captain-interface-'+definition.textureName;mesh.frustumCulled=false;mesh.scale.z=-1;mesh.visible=false;let disposed=false;
 return {mesh,
  reset(){simulation.reset();geometry.setDrawRange(0,0);mesh.visible=false;},
  update(deltaMs,options){if(!disposed)simulation.step(deltaMs,options);},
  render(){
   if(disposed)return;let vertex=0;
   for(const p of simulation.live()){
    const angle=f(p.angle*DEGREES),c=f(Math.cos(angle)),s=f(Math.sin(angle));
    for(const [x,y]of corners){const dx=x*p.size[0],dy=y*p.size[1];positions.set([f(p.position[0]+f(f(dx*c)-f(dy*s))),f(p.position[1]+f(f(dx*s)+f(dy*c))),p.position[2]],vertex*3);colors.set([1,1,1,p.alpha],vertex*4);vertex++;}
   }
   geometry.setDrawRange(0,vertex);geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  },
  snapshot(options){return {disposed,...simulation.snapshot(options),source:definition.source,policy:CAPTAIN_INTERFACE_PARTICLE_RENDER_POLICY,nativeReady:false,nativeRngStreamVerified:false,nativeNumericParityVerified:false};},
  dispose(){if(disposed)return;disposed=true;simulation.reset();mesh.removeFromParent();geometry.dispose();material.dispose();map.dispose();},
 };
}
