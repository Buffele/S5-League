import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectScene} from './effect-scene.js';
import {CAPTAIN_INTERFACE_PRESETS} from './captain-interface-projection.js';

const BASE='/assets/s5runtime/effects/katana/';
const SOURCE='effects/katanaa_s_atk02_line01.seq';
const SOURCE_SHA='0aa51edc411991df935308628f3a58bf4f6a940664a7a55e4be4390f31cc9173';
const CLIP='KATANA_S_ATK_LINE01_5',DEGREES=.017453292521994;
export const KATANA_SCREEN_EFFECT_RESOURCES=Object.freeze({
 sequence:BASE+'sequences/katanaa_s_atk02_line01.json',model:BASE+'models/katana_s_atk_line01.json',
 particleTexture:BASE+'textures/bash1_2.png',modelTexture:BASE+'textures/kata.png',
});
export const KATANA_SCREEN_EFFECT_POLICY=Object.freeze({source:SOURCE,sourceSha256:SOURCE_SHA,
 sourceMethod:'AddSequenceBySelf',localOwnerOnly:true,clock:'current heavy actor-state milliseconds; source cue begins at0',
 modelWindowMs:1500,modelClipTicks:4800,particleWindowMs:[300,500],particleLifeMs:200,
 projection:'source IF absolute coordinates; logical768-high orthographic surface; browser preset fitting follows existing S5 interface adapter',
 nativeReady:false,nativeExecutionCompared:false,
 limits:['No live source-game pixel/timing comparison.','Browser viewport fitting is an S5 adapter; RNG stream and floating-point parity remain unverified.']});

// This is deliberately restricted to the two already authenticated nodes. It
// does not reinterpret arbitrary IF/IFControl nodes as world-space effects.
export function katanaScreenEffectDefinition(raw,model){
 const require=value=>{if(!value)throw Error('Unsupported Katana screen effect source');};
 require(raw.source===SOURCE&&raw.sha256===SOURCE_SHA&&raw.byteLength===596&&raw.coverage?.reachesExactEof&&raw.nodes?.length===2&&raw.header.durationField===1500);
 const loader=raw.nodes[0],particle=raw.nodes[1],l=loader.fields?.nodeLoader,p=particle.fields?.particle;
 require(loader.type==='CActNodeLoader_IF'&&particle.type==='CActParticle_IF'&&l&&p);
 require(l.base.startTimeField.int32===0&&l.base.endTimeField.int32===1500&&l.animationName.value===''&&!l.flag80&&l.field84.int32===0&&l.field88.int32===0);
 require(loader.dependencies?.[0]?.resourcePath==='effects/katana_s_atk_line01.scn');
 const screen=n=>n.fields.interface.screenPositionWords.map(w=>w.float32);
 require(JSON.stringify(screen(loader))==='[0,0,1000]'&&JSON.stringify(screen(particle))==='[0,0,1000]');
 require(p.base.startTimeField.int32===300&&p.base.endTimeField.int32===500);
 const c=p.control,values=c.primaryWords.map((w,i)=>i<4?w.int32:w.float32),key=p.blockA.entries[0],emitter={};
 key.words14to60.forEach((w,i)=>{const address=0x14+4*i;emitter[address.toString(16)]=[0x34,0x58,0x5c,0x60].includes(address)?w.int32:w.float32;});
 require(JSON.stringify(values)==='[0,0,1,0,0,0,0,0,0,0,0,0]'&&c.field58.int32===5&&c.field60.int32===200&&!c.flag54&&!c.flag5c&&!c.flag64&&c.field6c.int32===0);
 require(c.versioned.field30.float32===0&&c.versioned.flags50to53.every(v=>!v)&&c.versioned.field68.int32===0&&!c.versioned.flag24&&!c.versioned.flag25);
 require(p.blockA.entries.length===1&&p.blockA.field10.int32===200&&p.blockA.flag14&&!key.flag10);
 const expected={'14':0,'18':-10,'1c':0,'20':0,'24':0,'28':1,'2c':0,'30':0,'34':0,'38':0,'3c':0,'40':0,'44':0,'48':0,'4c':0,'50':0,'54':0,'58':200,'5c':50,'60':0};
 require(Object.entries(expected).every(([k,v])=>emitter[k]===v));
 const appearance=p.blockB.entries.map(row=>row.map(w=>w.float32));
 require(JSON.stringify(appearance)==='[[0,10,50,1,1,1,1,100],[0.5,5,300,1,1,1,1,100],[1,0,500,1,1,1,1,100]]');
 const texture=p.textures.entries[0];require(p.textures.entries.length===1&&texture.path.value.toLowerCase().endsWith('bash1_2.dds'));
 const uv=texture.uvWords.map(w=>w.float32);require(JSON.stringify(uv)==='[0,0,0,1,1,0,1,1]');
 require(model.source==='effects/katana_s_atk_line01.scn'&&model.models?.length===3&&model.clips?.length===1&&model.clips[0].name===CLIP&&model.clips[0].durationTicks===4800);
 require(model.models.every(m=>m.renderState===33385&&m.effectAnimation?.[CLIP]?.durationTicks===4800&&m.textures.length===1&&m.textures.every(t=>t.name===KATANA_SCREEN_EFFECT_RESOURCES.modelTexture)));
 return Object.freeze({durationMs:raw.header.durationField,loaderStartMs:0,loaderEndMs:1500,modelClip:CLIP,
  particleStartMs:300,particleEndMs:500,particleLifeMs:200,capacity:c.field58.int32,burstCount:Math.min(c.field58.int32,emitter['5c']),screenPosition:screen(particle),particlePosition:[0,-10,1000],appearance,uv});
}

function particleMesh(definition,texture){
 const map=texture.clone();map.flipY=false;map.colorSpace=THREE.SRGBColorSpace;
 const geometry=new THREE.BufferGeometry(),positions=new Float32Array(definition.capacity*18),colors=new Float32Array(definition.capacity*24),uv=new Float32Array(definition.capacity*12);
 const corners=[[-1,-1],[-1,1],[1,-1],[1,-1],[-1,1],[1,1]],indices=[1,0,3,3,0,2];
 for(let i=0;i<definition.capacity*6;i++){const offset=indices[i%6]*2;uv.set(definition.uv.slice(offset,offset+2),i*2);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setDrawRange(0,0);
 const material=new THREE.MeshBasicMaterial({map,vertexColors:true,transparent:true,depthTest:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Katana source Particle_IF';mesh.scale.z=-1;mesh.frustumCulled=false;mesh.visible=false;
 const angle=100*DEGREES,cos=Math.cos(angle),sin=Math.sin(angle);let count=0,ageMs=0;
 return {mesh,
  clear(){count=0;ageMs=0;mesh.visible=false;geometry.setDrawRange(0,0);},
  set(age,countValue){ageMs=age;count=countValue;mesh.visible=count>0&&age>=0&&age<definition.particleLifeMs;
   if(!mesh.visible){geometry.setDrawRange(0,0);return;}
   const t=age/definition.particleLifeMs,a=definition.appearance[t<.5?0:1],b=definition.appearance[t<.5?1:2],fraction=(t-a[0])/(b[0]-a[0]);
   const width=Math.max(0,a[1]+(b[1]-a[1])*fraction),height=Math.max(0,a[2]+(b[2]-a[2])*fraction);
   let vertex=0;for(let p=0;p<count;p++)for(let j=0;j<6;j++){
    const dx=corners[j][0]*width,dy=corners[j][1]*height;
    positions[vertex*3]=dx*cos-dy*sin;positions[vertex*3+1]=-10+dx*sin+dy*cos;positions[vertex*3+2]=1000;
    const at=vertex*4;colors[at]=colors[at+1]=colors[at+2]=colors[at+3]=1;vertex++;
   }
   geometry.setDrawRange(0,vertex);geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  },
  count(){return mesh.visible?count:0;},age(){return ageMs;},
  dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();map.dispose();}
 };
}

export async function loadKatanaScreenEffects({read=readAsset,load=loadEffectScene,loadTexture=url=>new THREE.TextureLoader().loadAsync(url)}={}){
 const [raw,model]=await Promise.all([read(KATANA_SCREEN_EFFECT_RESOURCES.sequence),read(KATANA_SCREEN_EFFECT_RESOURCES.model)]);
 const definition=katanaScreenEffectDefinition(raw,model);
 let effect,particles;const scene=new THREE.Scene(),wrapper=new THREE.Group(),camera=new THREE.OrthographicCamera(-512,512,384,-384,1,10000);
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),size=new THREE.Vector2();
 let disposed=false,visible=false,current=null,ageMs=0,previousMs=0,burstAt=null,burstDone=false;
 const cleanup=()=>{particles?.dispose();if(effect)for(const mesh of effect.meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}wrapper.removeFromParent();};
 try{
  effect=await load(model,{animation:definition.modelClip,loop:false});
  const texture=await loadTexture(KATANA_SCREEN_EFFECT_RESOURCES.particleTexture);
  try{particles=particleMesh(definition,texture);}finally{texture.dispose();}
  wrapper.add(effect.group);wrapper.scale.set(1,1,-1);wrapper.position.set(0,0,-1000);scene.add(wrapper,particles.mesh);wrapper.visible=false;
  for(const mesh of effect.meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.depthTest=false;material.depthWrite=false;}
  effect.update(0,1);
 }catch(error){cleanup();throw error;}
 function clear(){visible=false;current=null;ageMs=previousMs=0;burstAt=null;burstDone=false;wrapper.visible=false;particles.clear();}
 const api={
  update(attack,{localOwner=false,visible:show=false}={}){
   if(disposed)return;
   if(localOwner!==true||show!==true||attack?.weapon!=='katana'||attack.kind!=='heavy'){clear();return;}
   const time=Number.isFinite(attack.timeMs)?attack.timeMs:Number.isFinite(attack.time)?attack.time*1000:NaN;
   if(!Number.isFinite(time)||time<0){clear();return;}
   if(attack!==current||time<ageMs){clear();current=attack;previousMs=time;}
   ageMs=time;visible=true;wrapper.visible=time>=definition.loaderStartMs&&time<=definition.loaderEndMs;
   if(wrapper.visible)effect.update(time/1000,1);
   //11361B0: flag10 false emits once, clamped to capacity. The current IF
   // gate is inclusive; a late frame births at its observed time, not at an
   // invented interpolated300ms boundary. Lifetimes outlive the emission gate.
   if(time-previousMs>250){burstAt=null;particles.clear();}
   else{
    if(!burstDone&&time>=definition.particleStartMs&&time<=definition.particleEndMs){burstAt=time;burstDone=true;}
    particles.set(burstAt===null?-1:time-burstAt,burstAt===null?0:definition.burstCount);
   }
   previousMs=time;
  },clear,
  async warmup(renderer){if(disposed)throw Error('Katana screen effects disposed');
   if(!renderer?.compileAsync)throw Error('Actual renderer compileAsync required');
   const modelVisible=wrapper.visible,particleVisible=particles.mesh.visible;
   try{wrapper.visible=true;particles.mesh.visible=true;await renderer.compileAsync(scene,camera);}
   finally{wrapper.visible=modelVisible;particles.mesh.visible=particleVisible;}
   if(renderer.initTexture){renderer.initTexture(particles.mesh.material.map);for(const mesh of effect.meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(material.map)renderer.initTexture(material.map);}
  },
  render(renderer){
   if(disposed||!visible||!wrapper.visible&&!particles.mesh.visible)return;
   const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getSize(size);
   let preset=CAPTAIN_INTERFACE_PRESETS[0],distance=Math.abs(Math.log(size.x/size.y/preset.aspect));
   for(let i=1;i<CAPTAIN_INTERFACE_PRESETS.length;i++){const candidate=CAPTAIN_INTERFACE_PRESETS[i],next=Math.abs(Math.log(size.x/size.y/candidate.aspect));if(next<distance){distance=next;preset=candidate;}}
   const height=Math.min(size.y,size.x/preset.aspect),width=height*preset.aspect;
   camera.left=-preset.width/2;camera.right=preset.width/2;camera.top=preset.height/2;camera.bottom=-preset.height/2;camera.updateProjectionMatrix();
   try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.setScissorTest(false);renderer.setViewport((size.x-width)/2,(size.y-height)/2,width,height);renderer.clearDepth();if(wrapper.visible)effect.render(camera);renderer.render(scene,camera);}
   finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=autoClear;}
  },
  snapshot(){return {disposed,visible,ageMs,modelVisible:wrapper.visible,particles:particles.count(),particleAgeMs:particles.age(),burstAt,burstDone,policy:KATANA_SCREEN_EFFECT_POLICY};},
  dispose(){if(disposed)return;clear();disposed=true;cleanup();}
 };
 return api;
}
