import * as THREE from 'three';
import {createNativeMapTowerImpostor,towerImpostorFragmentDeclarations} from './native-map-tower-impostor.js';

// Camera background samples the original panorama directly. The PBR lighting
// environment remains separate; its PMREM must not limit visible sky detail.
export function createNativeMapPanorama(texture,{rotationY=0,intensity=1,seamBlend=0,towerIllusion}={}){
 if(!texture?.isTexture||!Number.isFinite(rotationY)||!Number.isFinite(intensity)||intensity<0||!Number.isFinite(seamBlend)||seamBlend<0||seamBlend>.05)throw Error('Invalid native panorama presentation');
 const tower=createNativeMapTowerImpostor(towerIllusion);
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,toneMapped:false,
  uniforms:{panorama:{value:texture},rotation:{value:new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(-rotationY))},intensity:{value:intensity},seamBlend:{value:seamBlend},...tower?.uniforms},
  vertexShader:`varying vec3 direction;
   void main(){direction=position;vec4 projected=projectionMatrix*vec4(mat3(viewMatrix)*position,1.);gl_Position=projected.xyww;}`,
  fragmentShader:`uniform sampler2D panorama;uniform mat3 rotation;uniform float intensity;uniform float seamBlend;varying vec3 direction;
   ${tower?towerImpostorFragmentDeclarations:''}
   void main(){
    vec3 ray=normalize(rotation*direction);
    vec2 p=vec2(atan(ray.z,ray.x)*.15915494309189535+.5,asin(clamp(ray.y,-1.,1.))*.3183098861837907+.5);
    vec3 color=texture2D(panorama,p).rgb;
    if(seamBlend>0.){
     float edge=.5*(1.-smoothstep(0.,seamBlend,min(p.x,1.-p.x)));
     color=mix(color,texture2D(panorama,vec2(1.-p.x,p.y)).rgb,edge);
    }
    gl_FragColor=vec4(${tower?'nativeTowerFacade(color*intensity,normalize(direction))':'color*intensity'},1.);
    #include <colorspace_fragment>
   }`,
 });
 const geometry=new THREE.SphereGeometry(1,32,16),mesh=new THREE.Mesh(geometry,material);
 mesh.name='Native map / direct-resolution panorama';mesh.frustumCulled=false;mesh.renderOrder=-10000;mesh.visible=false;
 if(tower)mesh.onBeforeRender=(_renderer,_scene,camera)=>tower.updateCamera(camera);
 mesh.userData={presentationOnly:true,collision:false,originalPixelsUnmodified:true,seamBlend,qualification:'Optional runtime seam feather over original native API panorama; no asset pixel rewrite or geometry/collision contribution.'};
 let disposed=false;
 return {mesh,snapshot(){return {towerIllusion:tower?.snapshot()??{enabled:false}};},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
