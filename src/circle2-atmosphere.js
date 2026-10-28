import * as THREE from 'three';

export const ATMOSPHERE_BUDGET=Object.freeze({couriers:3,motes:100,beaconRings:3});

export function courierPose(index,time){
 const radius=38+index*16,angle=time*(.028+index*.004)+index*2.1;
 return {x:Math.cos(angle)*radius,y:10+index*5+Math.sin(time*.17+index)*.8,z:Math.sin(angle)*radius,yaw:-angle};
}

export async function createCircle2Atmosphere(scene,group,skyUrl){
 const texture=await new THREE.TextureLoader().loadAsync(skyUrl);
 return assembleCircle2Atmosphere(scene,group,texture);
}

export function assembleCircle2Atmosphere(scene,group,texture){
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;
 // A full-resolution backdrop, not a lighting environment convolution.
 texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const time={value:0};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(450,64,32),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,toneMapped:false,
  uniforms:{panorama:{value:texture},clock:time},
  vertexShader:'varying vec2 skyUV; void main(){skyUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D panorama; uniform float clock; varying vec2 skyUV;
   void main(){
    vec2 p=vec2(fract(skyUV.x+clock*.00012),skyUV.y);
    vec3 col=texture2D(panorama,p).rgb;
    float edge=1.-smoothstep(0.,.02,min(p.x,1.-p.x));
    col=mix(col,texture2D(panorama,vec2(1.-p.x,p.y)).rgb,.5*edge);
    col=mix(col,vec3(.29,.57,.78),smoothstep(.96,1.,skyUV.y));
    col=mix(col,vec3(.77,.84,.9),1.-smoothstep(0.,.04,skyUV.y));
    gl_FragColor=vec4(col,1.);
    #include <colorspace_fragment>
   }`,
 }));
 sky.name='Azure / crisp anime panoramic sky';sky.renderOrder=-1000;scene.add(sky);

 const effects=new THREE.Group();effects.name='Azure / animated atmosphere';scene.add(effects);
 const mist=new THREE.Mesh(new THREE.RingGeometry(36,140,80,6),new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{clock:time},
  vertexShader:'varying vec3 local;void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float clock;varying vec3 local;void main(){
   float r=length(local.xy);float edge=smoothstep(36.,65.,r)*(1.-smoothstep(100.,140.,r));
   float wave=.5+.25*sin(local.x*.09+clock*.04)+.25*cos(local.y*.12-clock*.06);
   gl_FragColor=vec4(.87,.95,1.,edge*wave*.13);
   #include <colorspace_fragment>
  }`,
 }));mist.rotation.x=-Math.PI/2;mist.position.y=-7;mist.name='Slow drifting cloud veil';effects.add(mist);
 const courier=group.children.find(o=>o.name.startsWith('A00'));
 const couriers=[];
 if(courier){
  for(let i=0;i<ATMOSPHERE_BUDGET.couriers;i++){
   const o=i?courier.clone():courier;if(i)group.add(o);
   o.name='Azure sky courier '+(i+1);o.traverse(child=>{child.castShadow=false;child.receiveShadow=false;});couriers.push(o);
  }
 }

 const glow=new THREE.MeshBasicMaterial({color:0x70fff0,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending});
 const rings=[];
 for(let i=0;i<ATMOSPHERE_BUDGET.beaconRings;i++){
  const o=new THREE.Mesh(new THREE.TorusGeometry(1.05+i*.18,.025,5,64,Math.PI*1.6),glow);
  o.rotation.x=Math.PI/2;o.position.y=1.5+i*1.2;o.name='Beacon orbital light '+i;effects.add(o);rings.push(o);
 }
 const shafts=new THREE.Mesh(new THREE.CylinderGeometry(.23,.85,6.5,24,1,true),new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{clock:time},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 v;uniform float clock;void main(){float a=pow(1.-v.y,2.)*.12*(.75+.25*sin(clock*1.4));gl_FragColor=vec4(.2,.95,.85,a);}`,
 }));shafts.position.y=3.8;shafts.name='Beacon soft energy veil';effects.add(shafts);

 const positions=new Float32Array(ATMOSPHERE_BUDGET.motes*3),seeds=new Float32Array(positions.length);
 for(let i=0;i<ATMOSPHERE_BUDGET.motes;i++){
  const a=i*2.399963,r=7+(i%19);
  seeds.set([Math.cos(a)*r,1+(i%13)*.65,Math.sin(a)*r],i*3);
 }
 positions.set(seeds);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const motes=new THREE.Points(geometry,new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms:{clock:time},
  vertexShader:`uniform float clock;varying float fade;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(110./max(1.,-p.z),1.,5.);fade=.25+.25*sin(clock+position.x);}`,
  fragmentShader:`varying float fade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.95,.97,.82,fade*(1.-smoothstep(.1,.5,d)));}`,
 }));motes.name='Garden drifting pollen';motes.frustumCulled=false;effects.add(motes);

 // Only green atlas swatches sway; geometry, floor UVs and collision remain stable.
 const atlasMaterials=new Set();group.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.name.includes('one shared atlas')||/^Imported \/ (Leaves|Flowers)/.test(m.name))atlasMaterials.add(m);});
 for(const material of atlasMaterials){
  const imported=material.name.startsWith('Imported / ');
  material.onBeforeCompile=shader=>{
   shader.uniforms.azureTime=time;
   shader.vertexShader='uniform float azureTime;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float leafMask=${imported?'1.':'step(.5,uv.y)*(1.-step(.75,uv.y))*(1.-step(.75,uv.x))'};
    transformed.x+=leafMask*.055*sin(azureTime*1.5+position.y*1.8+position.z);
    transformed.z+=leafMask*.035*cos(azureTime*1.1+position.x*2.);`);
  };
  material.customProgramCacheKey=()=> imported?'azure-imported-leaves-v1':'azure-leaves-v2';material.needsUpdate=true;
 }
 function update(dt){
  if(!Number.isFinite(dt)||dt<0)return;
  time.value+=Math.min(dt,.1);
  couriers.forEach((o,i)=>{const p=courierPose(i,time.value);o.position.set(p.x,p.y,p.z);o.rotation.set(0,p.yaw,Math.sin(time.value*.25+i)*.04);});
  rings.forEach((o,i)=>{o.rotation.z=time.value*(.22+i*.09);o.position.y=1.5+i*1.2+Math.sin(time.value+i)*.12;});
  for(let i=0;i<ATMOSPHERE_BUDGET.motes;i++){
   const j=i*3;positions[j]=seeds[j]+Math.sin(time.value*.3+i)*.6;positions[j+1]=.7+(seeds[j+1]+time.value*.13)%9;positions[j+2]=seeds[j+2]+Math.cos(time.value*.2+i)*.5;
  }
  geometry.attributes.position.needsUpdate=true;
 }
 update(0);
 return {update,sky,effects,couriers,rings,motes,time};
}
