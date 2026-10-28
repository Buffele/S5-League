import {Box3,BufferAttribute,DynamicDrawUsage,Group,InstancedBufferAttribute,InstancedBufferGeometry,Mesh,ShaderMaterial,SRGBColorSpace,TextureLoader,Vector3} from 'three';
import {readRenderQuality} from './render-quality.js';

// New Refuge solaire artwork, never a claim of the original BLAST2/noise.bmp
// renderer. Native damage, rebirth, launch timing and collision remain owners.
export function createAzitArtistEffects(world,{texture,capacity=96,ambient=null,getQuality=readRenderQuality}={}){
 if(world?.nativeMapId!==15||!texture?.isTexture||!Number.isInteger(capacity)||capacity<16||capacity>128||typeof world.mapObjects?.subscribeEvents!=='function')throw Error('Explicit Azit artist effects resources and event owner required');
 if(typeof getQuality!=='function'||ambient&&(!Array.isArray(ambient.center)||ambient.center.length!==3||!ambient.center.every(Number.isFinite)))throw Error('Explicit finite ambient volume and quality reader required');
 const group=new Group();group.name='Refuge solaire / artist-only pooled effects';group.userData={artistOnly:true,collision:false,nativeVisualParity:false};
 const geometry=new InstancedBufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0]),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));geometry.setIndex([0,1,2,0,2,3]);
 const attributes={center:3,size:1,angle:1,cell:2,opacity:1,tint:3};
 for(const [name,size]of Object.entries(attributes))geometry.setAttribute('i'+name,new InstancedBufferAttribute(new Float32Array(capacity*size),size).setUsage(DynamicDrawUsage));geometry.instanceCount=0;
 const material=new ShaderMaterial({transparent:true,depthWrite:false,toneMapped:true,uniforms:{atlas:{value:texture},cameraRight:{value:new Vector3(1,0,0)},cameraUp:{value:new Vector3(0,1,0)},fxCameraPosition:{value:new Vector3()}},
  vertexShader:`attribute vec3 icenter;attribute float isize;attribute float iangle;attribute vec2 icell;attribute float iopacity;attribute vec3 itint;uniform vec3 cameraRight;uniform vec3 cameraUp;uniform vec3 fxCameraPosition;varying vec2 vUv;varying float vOpacity;varying vec3 vTint;
   void main(){float c=cos(iangle),s=sin(iangle);vec2 p=vec2(position.x*c-position.y*s,position.x*s+position.y*c)*isize;vec3 world=icenter+cameraRight*p.x+cameraUp*p.y;vUv=uv*.5+icell;vOpacity=iopacity*(1.-smoothstep(16.,32.,distance(fxCameraPosition,icenter)));vTint=itint;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
  fragmentShader:`uniform sampler2D atlas;varying vec2 vUv;varying float vOpacity;varying vec3 vTint;
   void main(){vec3 sampled=texture2D(atlas,vUv).rgb;float luminance=max(sampled.r,max(sampled.g,sampled.b));float a=smoothstep(.008,.09,luminance)*vOpacity;if(a<.006)discard;gl_FragColor=vec4(sampled*vTint,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const mesh=new Mesh(geometry,material);mesh.name='Pooled dust, kraft and launch accents';mesh.frustumCulled=false;mesh.visible=false;mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);world.root.add(group);
 const particles=[],contacts=new Map(),counts={destroyed:0,restored:0,launch:0,landed:0,dropped:0};let disposed=false,enabled=true,seed=1,ambientAllowed=false,lastQualityCheck=-1,elapsed=0;
 const cells=[[0,.5],[.5,.5],[0,0],[.5,0]],random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function add(p){if(particles.length>=capacity){counts.dropped++;return;}particles.push({...p,age:0,angle:random()*Math.PI*2,spin:(random()-.5)*5});}
 function clear(){particles.length=0;contacts.clear();geometry.instanceCount=0;mesh.visible=false;}
 function sync(){geometry.instanceCount=particles.length;mesh.visible=enabled&&particles.length>0;for(let i=0;i<particles.length;i++){const p=particles[i],fade=Math.max(0,1-p.age/p.life);geometry.attributes.icenter.setXYZ(i,...p.position);geometry.attributes.isize.setX(i,p.size*(p.kind==='dust'?1+p.age*.35:1));geometry.attributes.iangle.setX(i,p.angle);geometry.attributes.icell.setXY(i,...cells[p.cell]);geometry.attributes.iopacity.setX(i,p.opacity*Math.min(1,fade*3));geometry.attributes.itint.setXYZ(i,...p.tint);}for(const name of Object.keys(attributes))geometry.attributes['i'+name].needsUpdate=true;}
 function burst(type,center){
  if(disposed||!enabled)return;
  const destruction=type==='destroyed',launch=type==='launch';
  if(destruction)for(let i=0;i<6;i++)add({kind:'paper',cell:i%2?3:2,position:center.slice(),velocity:[(random()-.5)*1.7,.7+random()*.8,(random()-.5)*1.7],size:.11+random()*.1,opacity:.85,life:.55+random()*.3,gravity:3.5,tint:[.92,.9,.84]});
  const n=destruction?3:launch?4:2;
  for(let i=0;i<n;i++)add({kind:'dust',cell:launch?1:0,position:[center[0]+(random()-.5)*.3,center[1]+(random()-.5)*.2,center[2]+(random()-.5)*.3],velocity:[(random()-.5)*.2,launch?.6:.12,(random()-.5)*.2],size:destruction?.6:launch?.3:.24,opacity:destruction?.14:launch?.2:.1,life:launch?.25:.45,gravity:0,tint:launch?[.48,.8,1]:[1,.94,.84]});
  sync();
 }
 const objectEvent=event=>{
  if(event.type==='presentation-cleared'||event.type==='reset-local-S5'){clear();return;}
  if(!['destroyed','restored'].includes(event.type))return;
  const entry=world.mapObjects.instances.get(event.instanceKey);if(!entry?.records?.length)return;
  const box=new Box3();for(const record of entry.records)for(const point of record.points)box.expandByPoint(point);
  if(event.artistContact?.point?.length===3&&event.artistContact?.normal?.length===3)contacts.set(event.instanceKey,event.artistContact.point.map((v,i)=>v+event.artistContact.normal[i]*.08));
  counts[event.type]++;burst(event.type,contacts.get(event.instanceKey)??box.getCenter(new Vector3()).toArray());
 };
 const jumpEvent=event=>{if(event.type==='presentation-cleared'){clear();return;}if(!['launch-contact','landed'].includes(event.type))return;const p=event.position;if(![p?.x,p?.y,p?.z].every(Number.isFinite))return;const type=event.type==='launch-contact'?'launch':'landed';counts[type]++;burst(type,[p.x,p.y+.12,p.z]);};
 let unsubscribeObject=()=>{},unsubscribeJump=null;
 try{unsubscribeObject=world.mapObjects.subscribeEvents(objectEvent);unsubscribeJump=world.sourceLaunchMotion?.subscribeEvents?.(jumpEvent);}catch(error){unsubscribeObject();group.removeFromParent();geometry.dispose();material.dispose();throw error;}
 function update(dt){
  if(disposed)return;if(!Number.isFinite(dt)||dt<0)throw RangeError('Finite nonnegative artist effect delta required');elapsed+=dt;
  if(elapsed-lastQualityCheck>.5){lastQualityCheck=elapsed;const next=getQuality()!=='performance';if(enabled!==next){enabled=next;clear();}}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue;}p.velocity[1]-=p.gravity*dt;for(let a=0;a<3;a++)p.position[a]+=p.velocity[a]*dt;p.angle+=p.spin*dt;}
  if(enabled&&ambientAllowed&&ambient?.center){const existing=particles.filter(p=>p.kind==='ambient').length;for(let i=existing;i<6;i++)add({kind:'ambient',cell:0,position:ambient.center.map((v,a)=>v+(random()-.5)*(a===1?.7:1)),velocity:[.006,.018,.004],size:.025+random()*.018,opacity:.22,life:2.5+random()*2,gravity:0,tint:[1,.94,.8]});}
  sync();
 }
 function render(camera){if(disposed||!camera?.matrixWorld)return;camera.updateMatrixWorld();material.uniforms.cameraRight.value.setFromMatrixColumn(camera.matrixWorld,0).normalize();material.uniforms.cameraUp.value.setFromMatrixColumn(camera.matrixWorld,1).normalize();material.uniforms.fxCameraPosition.value.setFromMatrixPosition(camera.matrixWorld);const projected=ambient?.center?new Vector3(...ambient.center).project(camera):null;ambientAllowed=!!projected&&material.uniforms.fxCameraPosition.value.distanceTo(new Vector3(...ambient.center))<8&&Math.abs(projected.x)<1.2&&Math.abs(projected.y)<1.2&&projected.z>=-1&&projected.z<=1;if(!ambientAllowed){for(let i=particles.length-1;i>=0;i--)if(particles[i].kind==='ambient')particles.splice(i,1);sync();}}
 mesh.onBeforeRender=(_renderer,_scene,camera)=>render(camera);
 return{group,mesh,update,render,clear,snapshot:()=>({disposed,enabled,capacity,active:particles.length,ambientAllowed,events:{...counts},drawBatches:mesh.visible?1:0,artistOnly:true,nativeVisualParity:false,collision:false}),dispose(){if(disposed)return;disposed=true;clear();unsubscribeObject();unsubscribeJump?.();group.removeFromParent();geometry.dispose();material.dispose();}};
}

export async function installAzitArtistEffects(world,config,{loadTexture=url=>new TextureLoader().loadAsync(url)}={}){
 if(config?.enabled!==true)return null;
 if(!/^\/assets\/maps\/azit\/reconstruction-effects\/[a-z0-9-]+\.png$/.test(config.atlasUrl))throw Error('Explicit Azit ImageGen effects atlas required');
 const texture=await loadTexture(config.atlasUrl);texture.colorSpace=SRGBColorSpace;
 try{const fx=createAzitArtistEffects(world,{texture,capacity:config.capacity??96,ambient:config.ambient??null});let disposed=false;return{...fx,dispose(){if(disposed)return;disposed=true;fx.dispose();texture.dispose();}};}catch(error){texture.dispose();throw error;}
}
