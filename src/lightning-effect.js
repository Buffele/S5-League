import * as THREE from 'three';
import {createLightningClock,advanceLightningClock,lightningPointCenters} from './native-lightning.js';
const SCALE=.006,f=Math.fround;
export class LightningEffect{
 constructor(config,texture){
  this.config=config;this.clock=createLightningClock();this.fractionalMs=0;this.start=new THREE.Vector3();this.end=new THREE.Vector3();this.resolved=false;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
  this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(18),3));this.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(12),2));
  this.geometry.setIndex([0,1,2,2,1,3,2,3,4,4,3,5]);
  // Native blend selector1284830 chooses state6/1 with depth disabled for
  // this profile. Its GPU blend translation still needs a live pixel comparison.
  this.material=new THREE.MeshBasicMaterial({map:texture,transparent:true,blending:THREE.AdditiveBlending,depthTest:config.depth,depthWrite:false,side:THREE.DoubleSide});
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;this.mesh.visible=false;this.mesh.userData.nativeLightning=true;
 }
 clear(){this.clock=createLightningClock();this.fractionalMs=0;this.resolved=false;this.mesh.visible=false;}
 update(dt,emitting,startMatrix,endMatrix){
  if(!Number.isFinite(dt)||dt<0)throw Error('Finite nonnegative Lightning frame required');
  if(!startMatrix||!endMatrix){this.resolved=false;this.mesh.visible=false;return;}
  this.start.setFromMatrixPosition(startMatrix);this.end.setFromMatrixPosition(endMatrix);this.resolved=true;
  // Native1290270 accepts uint32 ticks. Accumulate render-time fractions rather
  // than truncate every frame and lose elapsed time. Live tick phase is pending.
  this.fractionalMs+=dt*1000;const deltaMs=Math.trunc(this.fractionalMs);this.fractionalMs-=deltaMs;
  const next=this.clock.elapsedMs+deltaMs,active=emitting&&next>=this.config.start*1000&&next<this.config.end*1000;
  advanceLightningClock(this.clock,deltaMs,active,this.config);
  this.mesh.visible=this.clock.opacity>0;this.material.opacity=this.clock.opacity;
 }
 render(camera){
  if(!this.mesh.visible||!this.resolved)return;
  const center=this.start.clone().add(this.end).multiplyScalar(.5),along=this.end.clone().sub(this.start);
  const view=camera.position.clone().sub(center),side=new THREE.Vector3().crossVectors(along,view);
  if(side.lengthSq()<1e-16){this.mesh.visible=false;return;}
  side.normalize().multiplyScalar(this.config.width*SCALE/2);
  const centers=lightningPointCenters(this.start.toArray().map(v=>v/SCALE),this.end.toArray().map(v=>v/SCALE));
  const positions=this.geometry.attributes.position.array,uv=this.geometry.attributes.uv.array;
  for(let i=0;i<3;i++)for(let edge=0;edge<2;edge++){
   const vertex=i*2+edge,point=centers[2-i],sign=edge===0?1:-1;
   for(let k=0;k<3;k++)positions[vertex*3+k]=f(point[k]*SCALE+side.getComponent(k)*sign);
   uv[vertex*2]=f(f(f((2-i)/2)+this.clock.scroll)*f(this.config.tiles));uv[vertex*2+1]=edge===0?1:0;
  }
  this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.uv.needsUpdate=true;
 }
}
