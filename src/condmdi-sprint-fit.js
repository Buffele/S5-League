import * as T from 'three';
import {solveLimb} from './neural-locomotion-fit.js';
const vpos=m=>new T.Vector3().setFromMatrixPosition(m),vrot=m=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(m)).normalize(),up=new T.Vector3(0,1,0),reflect=v=>new T.Vector3(v.x,v.y,-v.z);
const mapping=[['Bip01',0,3,'Bip01 Spine'],['Bip01 Pelvis',0,3,'Bip01 Spine'],['Bip01 Spine',3,6,'Bip01 Spine1'],['Bip01 Spine1',6,9,'Bip01 Spine2'],['Bip01 Spine2',9,12,'Bip01 Neck'],['Bip01 Neck',12,15,'Bip01 Head']];
for(const [side,j]of [['L',[13,16,18,20,1,4,7,10]],['R',[14,17,19,21,2,5,8,11]]])for(const [n,a,b,child]of [['Clavicle',j[0],j[1],'UpperArm'],['UpperArm',j[1],j[2],'Forearm'],['Forearm',j[2],j[3],'Hand'],['Thigh',j[4],j[5],'Calf'],['Calf',j[5],j[6],'Foot']])mapping.push([`Bip01 ${side} ${n}`,a,b,`Bip01 ${side} ${child}`]);
function frame(direction,normal){const x=direction.clone().normalize(),y=new T.Vector3().crossVectors(normal,x);if(y.lengthSq()<1e-8)y.crossVectors(up,x);if(y.lengthSq()<1e-8)y.set(1,0,0);y.normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,new T.Vector3().crossVectors(x,y).normalize()));}
export function fitCondMDISprint(actor,reference,data){
 if(data.format!=='s5-ai-sprint-points-v1'||data.sex!==actor.sex)throw Error('Invalid AI sprint asset');
 actor.prepareSwitch();actor.play('SN002',{fade:0,restart:true});actor.update(0);actor.group.updateMatrixWorld(true);
 const grip=new Map([...actor.bones].map(([n,b])=>[n,{position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()}]));actor.prepareSwitch();
 const definitions=new Map(reference.bones.map(b=>[b.name,b])),rest=new Map(reference.bones.map(b=>[b.name,new T.Matrix4().fromArray(b.matrix)])),locals=new Map(),bindings=new Map();
 for(const d of reference.bones){const m=rest.get(d.name).clone();if(rest.has(d.parent))m.premultiply(rest.get(d.parent).clone().invert());locals.set(d.name,m);m.decompose(actor.bones.get(d.name).position,actor.bones.get(d.name).quaternion,actor.bones.get(d.name).scale);}
 for(const [name,a,b,childName]of mapping){const d=definitions.get(name);
  if(!d||!childName)throw Error('Missing sprint mapping '+name);
  const leg=/ (Thigh|Calf)$/.test(name),normal=leg?new T.Vector3(-1,0,0):new T.Vector3(0,0,-1),q=frame(vpos(rest.get(childName)).sub(vpos(rest.get(name))),normal);
  bindings.set(name,{a,b,leg,offset:q.invert().multiply(vrot(rest.get(name)))});
 }
 const scale=actor.rig.scale.y,ratio=scale/data.nativeUnitToCanonical,interpolant=new T.LinearInterpolant(data.times,data.positions.flat(2),66),shoes={L:[],R:[]};
 actor.group.position.set(0,0,0);actor.group.rotation.y=Math.PI;actor.group.updateMatrixWorld(true);
 for(const m of actor.meshes)if(m.isSkinnedMesh&&m.userData.source?.includes('/foot/'))for(let i=0;i<m.geometry.attributes.position.count;i++){const p=m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);shoes[p.x<0?'L':'R'].push([m,i]);}
 for(const s of ['L','R']){const stride=Math.max(1,Math.ceil(shoes[s].length/140));shoes[s]=shoes[s].filter((_,i)=>i%stride===0);}
 const temp=new T.Vector3(),sole=s=>Math.min(...shoes[s].map(([m,i])=>m.getVertexPosition(i,temp).applyMatrix4(m.matrixWorld).y)),floorOffset=-Math.min(sole('L'),sole('R'));
 const ankleHeight=Object.fromEntries(['L','R'].map(s=>[s,vpos(rest.get(`Bip01 ${s} Foot`)).y*scale+floorOffset]));
 const diagnostics={};
 return {duration:data.duration,travelSpeed:data.canonicalTravelSpeed*ratio,diagnostics,apply(time,{grounding=true,weapon=true}={}){
  const values=interpolant.evaluate(((time%data.duration)+data.duration)%data.duration),p=Array.from({length:22},(_,i)=>new T.Vector3().fromArray(values,i*3));
  const right=p[2].clone().sub(p[1]);right.y=0;right.normalize();const forward=new T.Vector3().crossVectors(up,right).normalize(),nativeRight=reflect(right),nativeForward=reflect(forward),worlds=new Map();
  for(const d of reference.bones){const m=locals.get(d.name).clone();if(worlds.has(d.parent))m.premultiply(worlds.get(d.parent));const b=bindings.get(d.name);
   if(b)m.compose(vpos(m),frame(reflect(p[b.b].clone().sub(p[b.a])),b.leg?nativeRight:nativeForward).multiply(b.offset).normalize(),new T.Vector3(1,1,1));
   if(d.name==='Bip01')m.setPosition(reflect(p[0]).divideScalar(data.nativeUnitToCanonical));
   if(d.name.endsWith(' Foot')){const j=d.name.includes(' L ')?7:8,toe=j===7?10:11,dir=p[toe].clone().sub(p[j]),yaw=-Math.atan2(dir.x,dir.z),pitch=Math.atan2(dir.y,Math.hypot(dir.x,dir.z))-data.footPitchBaseline[String(j)],q=new T.Quaternion().setFromAxisAngle(up,yaw).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),pitch)).multiply(vrot(rest.get(d.name)));m.compose(vpos(m),q,new T.Vector3(1,1,1));}
   worlds.set(d.name,m);const local=m.clone();if(worlds.has(d.parent))local.premultiply(worlds.get(d.parent).clone().invert());local.decompose(actor.bones.get(d.name).position,actor.bones.get(d.name).quaternion,actor.bones.get(d.name).scale);
  }
  for(const [n,g]of grip)if(/ Finger/.test(n)||/ Hand$/.test(n)||n.endsWith('_Hand_Dummy')){const bone=actor.bones.get(n);bone.quaternion.copy(g.quaternion);if(n.endsWith('_Hand_Dummy')){bone.position.copy(g.position);bone.scale.copy(g.scale);}}
  actor.group.updateMatrixWorld(true);const root=actor.group.position.clone(),yaw=actor.group.rotation.y-Math.PI,worldPoint=q=>new T.Vector3(-q.x*ratio,q.y*ratio,q.z*ratio).applyAxisAngle(up,yaw).add(root),residuals={};
  if(grounding){const targets=[];let lowering=0;
   for(const [side,j]of [['L',7],['R',8]]){const bones=['Thigh','Calf','Foot'].map(n=>actor.bones.get(`Bip01 ${side} ${n}`)),goal=worldPoint(p[j]);goal.y=root.y+ankleHeight[side]+Math.max(0,p[j].y-data.footBaseline[String(j)])*ratio;const hip=bones[0].getWorldPosition(new T.Vector3()),knee=bones[1].getWorldPosition(new T.Vector3()),ankle=bones[2].getWorldPosition(new T.Vector3()),reach=hip.distanceTo(knee)+knee.distanceTo(ankle)-.001;lowering=Math.max(lowering,hip.y-goal.y-Math.sqrt(Math.max(0,reach*reach-(hip.x-goal.x)**2-(hip.z-goal.z)**2)));targets.push({side,bones,goal,pole:knee,q:bones[2].getWorldQuaternion(new T.Quaternion())});}
   lowering=T.MathUtils.clamp(lowering,0,.15);actor.bones.get('Bip01').position.y-=lowering/scale;actor.group.updateMatrixWorld(true);
   for(const {side,bones,goal,pole,q}of targets)for(let i=0;i<4;i++){residuals[side]=solveLimb(...bones,goal,pole,q);actor.group.updateMatrixWorld(true);const min=sole(side);if(min>=-.0002)break;goal.y+=-min+.0002;}
  }
  // Fit arm reach to S5Runtime's actual proportions; preserve the learned gesture
  // instead of pulling a straightened arm beyond its physical length.
  for(const [side,s,e,h]of [['L',16,18,20],['R',17,19,21]]){const bones=['UpperArm','Forearm','Hand'].map(n=>actor.bones.get(`Bip01 ${side} ${n}`)),shoulder=bones[0].getWorldPosition(new T.Vector3()),elbow=bones[1].getWorldPosition(new T.Vector3()),hand=bones[2].getWorldPosition(new T.Vector3()),reach=shoulder.distanceTo(elbow)+elbow.distanceTo(hand),sourceReach=p[s].distanceTo(p[e])+p[e].distanceTo(p[h]),convert=v=>new T.Vector3(-v.x,v.y,v.z).multiplyScalar(reach/Math.max(sourceReach,1e-6)).applyAxisAngle(up,yaw),goal=shoulder.clone().add(convert(p[h].clone().sub(p[s]))),pole=shoulder.clone().add(convert(p[e].clone().sub(p[s])));residuals[side+'Hand']=solveLimb(...bones,goal,pole);bones[2].quaternion.copy(grip.get(`Bip01 ${side} Hand`).quaternion);bones[2].updateWorldMatrix(false,true);}
  for(const m of actor.meshes)if(m.userData.weapon)m.visible=weapon;actor.group.updateMatrixWorld(true);
  Object.assign(diagnostics,{model:data.meta.model,learnedFPS:data.meta.fps,displayFPS:60,observedFraction:data.meta.observedFraction,sourceSeamRMS:data.meta.loop.sourceSeamPositionRMS,ikResiduals:residuals,soleMinY:{L:sole('L'),R:sole('R')},finite:[...actor.bones.values()].every(b=>b.matrixWorld.elements.every(Number.isFinite))});
 }};
}

export function buildCondMDISprintClip(actor,reference,data){
 const original=actor.actions.get('00068').getClip(),position=actor.group.position.clone(),rotation=actor.group.quaternion.clone(),fit=fitCondMDISprint(actor,reference,data),nativeIds=new Set(reference.bones.map(d=>actor.bones.get(d.name).uuid));
 const arrays=new Map(reference.bones.map(d=>[d.name,{position:[],quaternion:[],scale:[]}])) ,report={frames:data.times.length,maxSolePenetration:0,maxIKResidual:0,finite:true};
 for(const time of data.times){fit.apply(time);report.maxSolePenetration=Math.max(report.maxSolePenetration,-fit.diagnostics.soleMinY.L,-fit.diagnostics.soleMinY.R);report.maxIKResidual=Math.max(report.maxIKResidual,...Object.values(fit.diagnostics.ikResiduals));report.finite&&=fit.diagnostics.finite;
  for(const [name,values]of arrays){const b=actor.bones.get(name);for(const key of ['position','quaternion','scale'])values[key].push(...b[key].toArray());}
 }
 const tracks=original.tracks.filter(t=>!nativeIds.has(t.name.split('.')[0])).map(t=>t.clone().scale(data.duration/original.duration));
 for(const [name,values]of arrays){const id=actor.bones.get(name).uuid;tracks.push(new T.VectorKeyframeTrack(`${id}.position`,data.times,values.position),new T.QuaternionKeyframeTrack(`${id}.quaternion`,data.times,values.quaternion),new T.VectorKeyframeTrack(`${id}.scale`,data.times,values.scale));}
 const clip=new T.AnimationClip('AI_S5_SPRINT',data.duration,tracks);clip.userData={model:data.meta.model,meta:data.meta,bake:report};
 actor.group.position.copy(position);actor.group.quaternion.copy(rotation);actor.group.updateMatrixWorld(true);actor.actions.set(clip.name,actor.mixer.clipAction(clip));actor.clips.push(clip);
 return {clip,travelSpeed:fit.travelSpeed,report,meta:data.meta};
}
