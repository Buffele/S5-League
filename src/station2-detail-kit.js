import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {batchBlenderModule} from './station2-blender.js';

const UP=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
const LABELS=[['ALPHA / 01','HOME SECTOR  •  S5 TRANSIT'],['BETA / 02','HOME SECTOR  •  S5 TRANSIT'],['CENTRAL LINK','02  /  TRANSIT CONCOURSE'],['FIELD ARRAY','HIGH VOLTAGE  /  KEEP CLEAR'],['S5 LEAGUE','STATION 02  /  CITY NETWORK'],['SERVICE 24','AUTONOMOUS MAINTENANCE'],['TRANSIT / 02','PLATFORM ACCESS  >>>'],['NORTH / SOUTH','INTERCHANGE  /  CITY LINE']];
function signAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
 const ctx=canvas.getContext('2d');ctx.textBaseline='middle';
 LABELS.forEach(([title,subtitle],i)=>{
  const x=(i%2)*512,y=Math.floor(i/2)*256;
  ctx.fillStyle='#172b43';ctx.fillRect(x,y,512,256);
  ctx.fillStyle='#eb765f';ctx.fillRect(x,y,9,256);ctx.fillRect(x+30,y+36,38,5);
  ctx.fillStyle='#ede7d9';ctx.font='bold 45px Arial';ctx.fillText(title,x+30,y+102,450);
  ctx.font='bold 16px Arial';ctx.fillStyle='#b9cdda';ctx.fillText(subtitle,x+32,y+156,450);
  ctx.fillStyle='#698d9f';ctx.fillRect(x+32,y+195,448,1);
  ctx.font='12px Arial';ctx.fillText('S5 / URBAN MOBILITY',x+32,y+221);
  ctx.fillStyle='#ed765f';ctx.beginPath();ctx.moveTo(x+435,y+204);ctx.lineTo(x+454,y+217);ctx.lineTo(x+435,y+230);ctx.fill();
 });
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
}
function palette(atlas){
 const standard=(name,color,roughness=.55,metalness=.15)=>Object.assign(new THREE.MeshStandardMaterial({color,roughness,metalness}),{name});
 return {ivory:standard('S5 detail / ceramic',0xd7cbb1),navy:standard('S5 detail / graphite',0x263e55),metal:standard('S5 detail / brushed alloy',0x84959d,.32,.65),coral:standard('S5 detail / coral',0xd95e48),blue:standard('S5 detail / cobalt',0x315b94),
  light:new THREE.MeshBasicMaterial({color:0x91ecff,toneMapped:false}),
  ink:standard('S5 detail / recessed joint',0x4c6275,.8,0),
  signs:new THREE.MeshStandardMaterial({name:'S5 detail / wayfinding',map:atlas,roughness:.66,metalness:.05,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})};
}
function basis(normal){const reference=Math.abs(normal.y)>.99?new THREE.Vector3(0,0,-1):UP;const right=reference.clone().cross(normal).normalize(),up=normal.clone().cross(right).normalize();return {right,up,rotation:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,normal))};}
function piece(root,geometry,material,position,rotation){const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(position);if(rotation)mesh.quaternion.copy(rotation);mesh.userData.presentationOnly=true;root.add(mesh);return mesh;}
function box(root,p,size,material,rotation){return piece(root,new THREE.BoxGeometry(...size),material,p,rotation);}
function plaque(root,p,normal,width,height,label,mats){
 const geo=new THREE.PlaneGeometry(width,height),uv=geo.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,((label%2)+(uv.getX(i)*.98+.01))/2,1-(Math.floor(label/2)+1-(uv.getY(i)*.96+.02))/4);
 return piece(root,geo,mats.signs,p,basis(normal).rotation);
}
function frame(root,p,n,w,h,mats){
 const {right,up,rotation}=basis(n);
 for(const side of [-1,1]){
  box(root,p.clone().addScaledVector(right,side*w/2),[.022,h,.006],mats.ink,rotation);
  box(root,p.clone().addScaledVector(up,side*h/2),[w,.022,.006],mats.ink,rotation);
 }
 for(const x of [-1,1])for(const y of [-1,1])piece(root,new THREE.CircleGeometry(.027,6),mats.metal,p.clone().addScaledVector(right,x*(w/2-.1)).addScaledVector(up,y*(h/2-.1)).addScaledVector(n,.006),rotation);
}
function fitPatch(art,module,p,n,w,h){
 const {right,up}=basis(n),ray=new THREE.Raycaster();
 const patch=new THREE.Box3();
 for(const x of [-.5,.5])for(const y of [-.5,.5])patch.expandByPoint(p.clone().addScaledVector(right,x*w).addScaledVector(up,y*h));
 patch.expandByScalar(.16);
 if((art.userData.brandingBounds??[]).some(b=>patch.intersectsBox(new THREE.Box3(new THREE.Vector3().fromArray(b.min),new THREE.Vector3().fromArray(b.max)))))return false;
 for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
  const q=p.clone().addScaledVector(right,x*w).addScaledVector(up,y*h),origin=module.group.localToWorld(q.clone().addScaledVector(n,.15));
  ray.set(origin,n.clone().transformDirection(module.group.matrixWorld).negate());ray.far=.3;
  const hit=ray.intersectObject(art,true)[0];
  if(!hit||Math.abs(hit.distance-.15)>.025)return false;
 }
 return true;
}
function wallDetails(module,art,mats,label){
 const root=new THREE.Group(),candidates=[],points=[];art.updateWorldMatrix(true,true);
 const inverse=module.group.matrixWorld.clone().invert();
 art.traverse(mesh=>{
  if(!mesh.isMesh||!/Panneau bleu|Composite ivoire/.test(mesh.material.name))return;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index,matrix=inverse.clone().multiply(mesh.matrixWorld);
  for(let i=0;i<(index?.count??p.count);i+=3){
   const [a,b,c]=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix));
   const normal=b.clone().sub(a).cross(c.clone().sub(a)),area=normal.length()/2;normal.normalize();
   if(area>3&&Math.abs(normal.y)<.035)candidates.push({area,p:a.add(b).add(c).multiplyScalar(1/3),n:normal});
  }
 });
 let panels=0,signs=0;
 for(const {p,n} of candidates.sort((a,b)=>b.area-a.area)){
  if(panels>=6||points.some(q=>q.distanceTo(p)<4))continue;
  if(!fitPatch(art,module,p,n,3.4,1.45))continue;
  const {right,up,rotation}=basis(n),at=p.clone().addScaledVector(n,.012);
  frame(root,at,n,3.4,1.45,mats);
  if(panels%2===0){
   plaque(root,at.clone().addScaledVector(n,.007),n,2.85,1.06,label,mats);signs++;
  }else{
   // Flush service hatch: dark ventilation slots and a short status strip.
   for(let i=0;i<6;i++)box(root,at.clone().addScaledVector(up,(i-2.5)*.13),[2.45,.034,.006],mats.ink,rotation);
   box(root,at.clone().addScaledVector(right,1.4),[.038,.62,.008],mats.coral,rotation);
   box(root,at.clone().addScaledVector(right,-1.4).addScaledVector(up,.34),[.038,.22,.01],mats.light,rotation);
  }
  points.push(p);panels++;
 }
 root.name='S5 • panneaux de service';return {root,panels,signs};
}
function bridgeDetails(module,art,mats){
 const root=new THREE.Group(),normal=new THREE.Vector3(0,1,0),flat=new THREE.Quaternion().setFromUnitVectors(Z,normal);
 const ray=new THREE.Raycaster(),hits=[];
 module.group.updateWorldMatrix(true,true);
 for(let z=-10;z<=10;z+=2){
  const origin=module.group.localToWorld(new THREE.Vector3(0,50,z));ray.set(origin,new THREE.Vector3(0,-1,0));ray.far=80;
  const hit=ray.intersectObject(art,true).find(h=>h.face.normal.y>.8);
  if(!hit)continue;
  const p=module.group.worldToLocal(hit.point.clone());if(p.y<5)continue;hits.push(p);
  box(root,new THREE.Vector3(0,p.y+.018,z),[4.55,.006,.028],mats.ink);
  for(const side of [-1,1]){
   box(root,new THREE.Vector3(side*2.3,p.y+.02,z),[.11,.008,1.72],mats.navy);
   box(root,new THREE.Vector3(side*2.3,p.y+.027,z-.53),[.033,.005,.52],mats.light);
   // Thin side trim lies against the existing bridge fascia.
   box(root,new THREE.Vector3(side*2.5,p.y-.19,z),[.014,.11,1.8],mats.metal);
   const face=new THREE.Vector3(side,0,0),at=new THREE.Vector3(side*2.5,p.y-.42,z);
   if(fitPatch(art,module,at,face,1.65,.4)){
    const placed=at.clone().addScaledVector(face,.014),orientation=basis(face);
    frame(root,placed,face,1.65,.4,mats);
    for(let stripe=-1;stripe<=1;stripe++){
     const rib=box(root,placed.clone().addScaledVector(orientation.right,stripe*.4),[.035,.26,.01],mats.navy,orientation.rotation);
     rib.rotateZ(-.45);
    }
   }
  }
 }
 if(hits.length){
  const p=hits[Math.floor(hits.length/2)].clone().add(new THREE.Vector3(0,.02,0));
  const sign=plaque(root,p,normal,2.65,.98,2,mats);sign.quaternion.copy(flat);
 }
 return root;
}

// Extract each original beam's span from connected triangles, including welded
// duplicate vertices. This preserves all native gaps, positions and heights.
export function beamSpans(geometry){
 const p=geometry.attributes.position,index=geometry.index,keys=new Map(),ids=[],vertices=[],parents=[];
 for(let i=0;i<p.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(n=>Math.round(n*10000)).join(',');
  if(!keys.has(key)){keys.set(key,vertices.length);parents.push(vertices.length);vertices.push(v);}ids.push(keys.get(key));
 }
 const find=a=>parents[a]===a?a:(parents[a]=find(parents[a]));
 for(let i=0;i<(index?.count??p.count);i+=3){const a=ids[index?index.getX(i):i];for(let j=1;j<3;j++)parents[find(ids[index?index.getX(i+j):i+j])]=find(a);}
 const boxes=new Map();vertices.forEach((v,i)=>{const key=find(i);if(!boxes.has(key))boxes.set(key,new THREE.Box3());boxes.get(key).expandByPoint(v);});
 return [...boxes.values()].filter(b=>b.max.x-b.min.x>1).map(b=>{const a=b.getCenter(new THREE.Vector3()),end=a.clone();a.x=b.min.x;end.x=b.max.x;return [a,end];});
}
function laserDetails(module,mats,clock){
 const root=new THREE.Group(),original=module.meshes.find(m=>/alphablend2.*nofog/.test(m.name));if(!original)return {root,count:0};
 const spans=beamSpans(original.geometry),core=new THREE.MeshBasicMaterial({color:new THREE.Color(1.8,2.8,3),toneMapped:false});
 const sheath=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
  uniforms:{time:clock},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float time;varying vec2 vUv;void main(){float packet=pow(.5+.5*cos(vUv.y*2.7-time*4.5),12.0);float filament=.5+.5*cos(vUv.x*18.8496+sin(vUv.y*4.0-time*2.0));gl_FragColor=vec4(.06,.55,1.0,.16+packet*.36+filament*.09);}'});
 // Retain original electrical animation, with a quieter blue filament around
 // the new stable core. Native alpha tracks remain untouched.
 for(const mesh of module.meshes.filter(m=>/alphablend2.*nofog/.test(m.name)))for(const m of [].concat(mesh.material))m.color.setRGB(.12,.45,.8);
 spans.forEach(([a,b],i)=>{
  a.applyMatrix4(original.matrix);b.applyMatrix4(original.matrix);
  const direction=b.clone().sub(a),length=direction.length(),rotation=new THREE.Quaternion().setFromUnitVectors(UP,direction.normalize()),center=a.clone().add(b).multiplyScalar(.5);
  piece(root,new THREE.CylinderGeometry(.017,.017,length,6,1,true),core,center,rotation);
  const tube=new THREE.CylinderGeometry(.066,.066,length,8,12,true),uv=tube.attributes.uv;
  for(let k=0;k<uv.count;k++)uv.setY(k,uv.getY(k)*length+i*.71);
  piece(root,tube,sheath,center,rotation);
  const face=new THREE.Quaternion().setFromUnitVectors(Z,direction);
  for(const endpoint of [a,b]){
   piece(root,new THREE.TorusGeometry(.135,.027,5,16),mats.metal,endpoint,face);
   piece(root,new THREE.TorusGeometry(.089,.013,4,16),mats.light,endpoint,face);
  }
 });
 return {root,count:spans.length};
}
function serviceObjects(mats){
 const group=new THREE.Group();group.name='S5 • objets de service hors parcours';group.userData.presentationOnly=true;
 const drones=[];
 for(const [i,position] of [[0,[-69,26,-54]],[1,[76,32,48]],[2,[-77,12,70]]]){
  const drone=new THREE.Group();drone.position.fromArray(position);drone.rotation.y=i*1.6;group.add(drone);
  piece(drone,new RoundedBoxGeometry(4.8,1.45,2.25,2,.3),mats.ivory,new THREE.Vector3());
  piece(drone,new RoundedBoxGeometry(2.4,.65,2.3,2,.14),mats.navy,new THREE.Vector3(.3,.24,0));
  box(drone,new THREE.Vector3(-1.5,.02,0),[.26,1.5,2.28],mats.coral);
  for(const side of [-1,1]){
   box(drone,new THREE.Vector3(.2,-.3,side*1.9),[3.5,.22,1.7],mats.navy);
   for(const x of [-1.25,1.55]){
    const ring=new THREE.TorusGeometry(.66,.12,6,20),q=new THREE.Quaternion().setFromUnitVectors(Z,UP);
    piece(drone,ring,mats.metal,new THREE.Vector3(x,-.3,side*2.2),q);
    piece(drone,new THREE.CylinderGeometry(.49,.49,.07,20),mats.blue,new THREE.Vector3(x,-.32,side*2.2));
    box(drone,new THREE.Vector3(x,-.4,side*2.2),[.45,.025,.04],mats.light);
   }
   plaque(drone,new THREE.Vector3(-.1,.03,side*1.17),new THREE.Vector3(0,0,side),2.3,.85,5,mats);
  }
  const merged=batchBlenderModule(drone);drone.clear();drone.add(merged);
  drones.push({root:drone,height:position[1],phase:i*2.1});
 }
 // Suspended transit signs stay well outside the level's playable footprint.
 for(const [x,z,angle] of [[-73,-98,.55],[83,105,3.7]]){
  const sign=new THREE.Group();sign.position.set(x,27,z);sign.rotation.y=angle;group.add(sign);
  piece(sign,new RoundedBoxGeometry(13,5,.5,2,.15),mats.ivory,new THREE.Vector3());
  plaque(sign,new THREE.Vector3(0,0,.27),Z,12.4,4.55,4,mats);
  plaque(sign,new THREE.Vector3(0,0,-.27),Z.clone().negate(),12.4,4.55,7,mats);
  for(const side of [-1,1]){
   box(sign,new THREE.Vector3(side*5.5,-3.15,0),[.4,1.45,1],mats.navy);
   box(sign,new THREE.Vector3(side*5.5,-3.8,0),[.25,.1,.65],mats.light);
  }
  const merged=batchBlenderModule(sign);sign.clear();sign.add(merged);
 }
 return {group,drones};
}

export function applyStationDetails(world,{atlas=signAtlas()}={}){
 const mats=palette(atlas),clock={value:0},groups=[],stats={panels:0,signs:0,beams:0,drawCalls:0,triangles:0};
 for(const id of ['alpha-base','beta-base','alpha-deck','beta-deck','west-route','east-route','alpha-bridge','beta-bridge','alpha-lasers','beta-lasers']){
  const module=world.modules.get(id),art=world.blenderSlice.groups.find(g=>g.userData.moduleId===id);if(!module||!art)continue;
  const root=new THREE.Group();
  if(/base|deck|route/.test(id)){
   const wall=wallDetails(module,art,mats,id.startsWith('alpha')?0:id.startsWith('beta')?1:6);root.add(wall.root);stats.panels+=wall.panels;stats.signs+=wall.signs;
  }
  if(id.includes('bridge'))root.add(bridgeDetails(module,art,mats));
  if(id.includes('lasers')){const laser=laserDetails(module,mats,clock);root.add(laser.root);stats.beams+=laser.count;}
  const batched=batchBlenderModule(root);batched.name='S5 • finition '+id;batched.traverse(o=>{if(o.isMesh)o.castShadow=false;});module.group.add(batched);groups.push(batched);
 }
 const service=serviceObjects(mats);world.modules.get('backdrop').group.add(service.group);groups.push(service.group);
 for(const group of groups)group.traverse(o=>{if(o.isMesh){stats.drawCalls++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 const update=world.update;world.update=dt=>{update(dt);clock.value+=Math.min(Math.max(dt,0),.1);for(const d of service.drones){d.root.position.y=d.height+Math.sin(clock.value*.6+d.phase)*.3;d.root.rotation.z=Math.sin(clock.value*.45+d.phase)*.018;}};
 world.artDetails={groups,stats};return world.artDetails;
}
