import * as THREE from 'three';

// Original cel-shaded fire: solid color masses, curled tongues and cutout
// ribbons. No image dependency or additive white sphere hiding the silhouette.
export function createStylizedFireResources(){
 const sphere=new THREE.SphereGeometry(1,24,16);
 const material=new THREE.ShaderMaterial({toneMapped:false,uniforms:{time:{value:0}},
  vertexShader:`uniform float time;varying vec3 p;varying vec3 n;
   void main(){p=position;n=normal;float a=sin(position.x*5.+time*5.)*sin(position.y*6.-time*7.);float b=sin(position.z*7.+time*4.+a);vec3 v=position*(1.+.13*a+.08*b);gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
  fragmentShader:`uniform float time;varying vec3 p;varying vec3 n;
   void main(){float curl=sin(p.x*5.+time*3.+sin(p.y*5.-time*6.))+sin(p.z*7.+p.y*4.-time*8.);float light=dot(normalize(n),normalize(vec3(-.4,.8,.5)));float h=light*.7+curl*.27;
   vec3 color=h>.7?vec3(1.,.94,.43):h>.1?vec3(1.,.51,.025):h>-.55?vec3(.97,.16,.008):vec3(.5,.028,.018);gl_FragColor=vec4(color,1.);}`});
 const outline=new THREE.ShaderMaterial({side:THREE.BackSide,toneMapped:false,uniforms:material.uniforms,
  vertexShader:material.vertexShader.replace('position*(1.+.13*a+.08*b)','position*(1.035+.13*a+.08*b)'),
  fragmentShader:'void main(){gl_FragColor=vec4(.48,.045,.012,1.);}'});
 const positions=[],uv=[],indices=[];
 for(let i=0;i<=18;i++)for(let side=0;side<2;side++){const t=i/18;positions.push((side-.5)*.95*(1-t),Math.sin(t*Math.PI)*.42,-t*2.9);uv.push(side,t);}
 for(let i=0;i<18;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
 const ribbon=new THREE.BufferGeometry();ribbon.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));ribbon.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ribbon.setIndex(indices);
 const ribbonMaterial=new THREE.ShaderMaterial({side:THREE.DoubleSide,toneMapped:false,uniforms:material.uniforms,
  vertexShader:`uniform float time;varying vec2 v;void main(){v=uv;vec3 p=position;p.x+=sin(v.y*9.-time*13.)*.22*v.y;p.y+=cos(v.y*11.-time*10.)*.2*v.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float time;varying vec2 v;void main(){float edge=abs(v.x-.5)*2.;float notch=.16*sin(v.y*28.-time*17.);if(edge>.86+notch)discard;vec3 c=edge>.6?vec3(.85,.055,.006):v.y>.55?vec3(1.,.27,.012):vec3(1.,.8,.13);gl_FragColor=vec4(c,1.);}`});
 function form(){
  const group=new THREE.Group(),lobes=[],tongues=[];
  for(let i=0;i<7;i++){
   const mesh=new THREE.Mesh(sphere,material),border=new THREE.Mesh(sphere,outline);mesh.add(border);group.add(mesh);lobes.push(mesh);
  }
  for(let i=0;i<8;i++){const mesh=new THREE.Mesh(ribbon,ribbonMaterial);mesh.rotation.z=i*Math.PI/4;group.add(mesh);tongues.push(mesh);}
  group.userData={lobes,tongues};return group;
 }
 function animate(group,time,{scale=1,jet=false}={}){
  material.uniforms.time.value=time;
  group.userData.lobes.forEach((mesh,i)=>{
   const a=i*2.39996+time*(i%2?1.7:-1.2),r=i===0?0:.42;
   mesh.position.set(Math.cos(a)*r,Math.sin(a)*r,i===0?.08:Math.sin(a*.7)*.25-.13);
   mesh.scale.setScalar((i===0?.79:.48)*(1+.10*Math.sin(time*14+i*2)));mesh.rotation.set(time*.8+i,time*.6-i,0);
  });
  group.userData.tongues.forEach((mesh,i)=>{const a=i*Math.PI/4+time*.7;mesh.position.set(Math.cos(a)*.42,Math.sin(a)*.42,-.13);mesh.rotation.z=a;mesh.scale.setScalar(.85+.2*Math.sin(time*9+i));});
  group.scale.set(scale*(jet?.55:1),scale*(jet?.55:1),scale*(jet?1.5:1));
 }
 function puffMaterial(){
  const puff=material.clone();puff.transparent=true;puff.depthWrite=false;
  puff.uniforms.time=material.uniforms.time;puff.uniforms.opacity={value:1};puff.uniforms.heat={value:1};
  puff.fragmentShader='uniform float opacity;uniform float heat;'+material.fragmentShader.replace('vec4(color,1.)','vec4(mix(vec3(.35,.035,.008),color,heat),opacity)');
  return puff;
 }
 return {sphere,material,form,animate,puffMaterial,dispose(){sphere.dispose();ribbon.dispose();material.dispose();outline.dispose();ribbonMaterial.dispose();}};
}
