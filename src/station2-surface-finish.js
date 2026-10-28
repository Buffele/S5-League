// World-space, sparse patina breaks tile repetition without moving the floor.
// The field is continuous across module/material boundaries and is static.
export function applyFloorPatina(material){
 if(material.userData.s5Patina)return;
 material.userData.s5Patina=true;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vS5Surface;')
   .replace('#include <project_vertex>','#include <project_vertex>\nvS5Surface=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vS5Surface;
 float s5Hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float s5Noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(s5Hash(i),s5Hash(i+vec2(1,0)),f.x),mix(s5Hash(i+vec2(0,1)),s5Hash(i+1.0),f.x),f.y);}
 `).replace('#include <map_fragment>',`#include <map_fragment>
 vec2 surface=vS5Surface.xz;
 float patina=smoothstep(.64,.82,s5Noise(surface*.24+17.3));
 float faintWash=smoothstep(.71,.9,s5Noise(surface*.43-8.7));
 float fineScuff=smoothstep(.85,.95,s5Noise(surface*vec2(.13,2.7)+41.0))*patina;
 diffuseColor.rgb*=1.0-patina*.07-fineScuff*.035;
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.018,1.005,.975),faintWash);
 `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+patina*.16-faintWash*.04,.3,.9);');
 };
 material.customProgramCacheKey=()=> 's5-sparse-floor-patina-v1';material.needsUpdate=true;
}
