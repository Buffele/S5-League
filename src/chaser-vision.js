import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {CHASER_VISION_SOURCE} from './chaser-vision-source.js';

// Authenticated map SHADERPARAM_S values and the embedded S5Runtime material shader.
export function chaserVisionProfile(nativeMapId){
 return CHASER_VISION_SOURCE.profiles[String(nativeMapId)]??CHASER_VISION_SOURCE.profiles[CHASER_VISION_SOURCE.defaultProfile];
}
export function chaserContrastSaturation(rgb,contrast,saturation){
 const curved=rgb.map(c=>c-contrast*(c-1)*c*(c-2));
 const luminance=curved[0]*.2126+curved[1]*.7152+curved[2]*.0722;
 return curved.map(c=>Math.max(0,Math.min(1,luminance+(c-luminance)*saturation)));
}
function createShadeRamp(){
 const source=CHASER_VISION_SOURCE.shadeMap;
 const texture=new THREE.DataTexture(new Uint8Array(source.rgba),source.width,source.height,THREE.RGBAFormat);
 texture.name='S5Runtime / image/redshade.dds';texture.colorSpace=THREE.NoColorSpace;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return texture;
}
export function createChaserEnemyMaterial(original,shadeMap,profile){
 const material=new THREE.ShaderMaterial({
  name:'Chaser / native red shade ramp',side:original.side,transparent:original.transparent,
  depthWrite:false,blending:THREE.NoBlending,toneMapped:false,
  uniforms:{map:{value:original.map??null},mapTransform:{value:original.map?.matrix??new THREE.Matrix3()},
   diffuse:{value:original.color?.clone()??new THREE.Color(1,1,1)},opacity:{value:original.opacity??1},
   alphaTest:{value:original.alphaTest??0},shadeMap:{value:shadeMap},
   nativeLightPosition:{value:new THREE.Vector3(...profile.lightPosition)},nativeLightColor:{value:new THREE.Color(...profile.lightColor)}},
  vertexShader:`
   #include <common>
   #include <uv_pars_vertex>
   #include <color_pars_vertex>
   #include <morphtarget_pars_vertex>
   #include <skinning_pars_vertex>
   uniform vec3 nativeLightPosition;
   varying float nativeDifPow;
   void main(){
    #include <uv_vertex>
    #include <color_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    vec3 worldPosition=(modelMatrix*vec4(transformed,1.)).xyz;
    vec3 worldNormal=inverseTransformDirection(transformedNormal,viewMatrix);
    nativeDifPow=.5*dot(normalize(worldNormal),normalize(nativeLightPosition-worldPosition))+.5;
   }`,
  fragmentShader:`
   #include <common>
   #include <uv_pars_fragment>
   #include <color_pars_fragment>
   #include <map_pars_fragment>
   #include <alphatest_pars_fragment>
   uniform vec3 diffuse;
   uniform float opacity;
   uniform sampler2D shadeMap;
   uniform vec3 nativeLightColor;
   varying float nativeDifPow;
   void main(){
    vec4 diffuseColor=vec4(diffuse,opacity);
    #include <map_fragment>
    #include <color_fragment>
    #include <alphatest_fragment>
    // Native D3D9 material arithmetic uses the encoded diffuse/ramp values.
    // Three's imported diffuse textures are sRGB and have already been decoded.
    vec3 nativeDiffuse=sRGBTransferOETF(vec4(diffuseColor.rgb,1.)).rgb;
    vec3 shade=texture2D(shadeMap,vec2(nativeDifPow)).rgb;
    gl_FragColor=vec4(nativeDiffuse*nativeLightColor*shade*2.,diffuseColor.a);
   }`,
 });
 material.map=original.map??null;material.alphaTest=original.alphaTest??0;material.vertexColors=!!original.vertexColors;
 return material;
}

export function createChaserViewPass(scene=null,camera=null,world={}){
 const profile=chaserVisionProfile(world?.nativeMapId),shadeMap=createShadeRamp();
 const enemyView=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
 const depth=new THREE.MeshBasicMaterial({colorWrite:false,fog:false}),materials=new Map();
 const captureMaterial=original=>{
  if(!materials.has(original))materials.set(original,createChaserEnemyMaterial(original,shadeMap,profile));
  const material=materials.get(original);
  material.uniforms.opacity.value=original.opacity??1;
  if(original.color)material.uniforms.diffuse.value.copy(original.color);
  return material;
 };
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},enemyView:{value:null},contrast:{value:profile.contrast},saturation:{value:profile.saturation}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D enemyView;uniform float contrast;uniform float saturation;varying vec2 vUv;
   void main(){
    vec4 c=texture2D(tDiffuse,vUv);
    vec3 curved=c.rgb-contrast*(c.rgb-1.)*c.rgb*(c.rgb-2.);
    float luminance=dot(curved,vec3(.2126,.7152,.0722));
    vec3 colour=clamp(mix(vec3(luminance),curved,saturation),0.,1.);
    vec4 enemy=texture2D(enemyView,vUv);
    gl_FragColor=vec4(mix(colour,enemy.rgb,enemy.a),c.a);
   }`});
 pass.uniforms.enemyView.value=enemyView.texture;pass.targets=[];pass.excluded=[];
 const render=pass.render.bind(pass),dispose=pass.dispose.bind(pass);
 pass.render=(renderer,...args)=>{
  if(scene&&camera){
   const saved={target:renderer.getRenderTarget(),autoClear:renderer.autoClear,material:scene.overrideMaterial,background:scene.background,layers:camera.layers.mask,color:renderer.getClearColor(new THREE.Color()).clone(),alpha:renderer.getClearAlpha(),shadow:renderer.shadowMap.autoUpdate};
   const changed=[],visibility=pass.excluded.map(o=>[o,o.visible]);
   try{
    for(const [o]of visibility)o.visible=false;
    scene.background=null;renderer.autoClear=false;renderer.shadowMap.autoUpdate=false;
    renderer.setRenderTarget(enemyView);renderer.setClearColor(0x000000,0);renderer.clear();
    // Retain real scene depth; the red material does not reveal actors through walls.
    scene.overrideMaterial=depth;renderer.render(scene,camera);scene.overrideMaterial=null;
    const seen=new Set();
    for(const group of pass.targets)group.traverse(o=>{if(o.isMesh&&!seen.has(o)){
     seen.add(o);changed.push([o,o.layers.mask,o.material]);o.layers.set(31);
     o.material=Array.isArray(o.material)?o.material.map(captureMaterial):captureMaterial(o.material);
    }});
    camera.layers.set(31);renderer.render(scene,camera);
   }finally{
    for(const [o,layers,material]of changed){o.layers.mask=layers;o.material=material;}
    for(const [o,value]of visibility)o.visible=value;
    camera.layers.mask=saved.layers;scene.overrideMaterial=saved.material;scene.background=saved.background;
    renderer.autoClear=saved.autoClear;renderer.shadowMap.autoUpdate=saved.shadow;
    renderer.setClearColor(saved.color,saved.alpha);renderer.setRenderTarget(saved.target);
   }
  }
  render(renderer,...args);
 };
 pass.setSize=(w,h)=>enemyView.setSize(w,h);
 pass.dispose=()=>{enemyView.dispose();depth.dispose();shadeMap.dispose();for(const material of materials.values())material.dispose();materials.clear();dispose();};
 pass.enabled=false;return pass;
}
