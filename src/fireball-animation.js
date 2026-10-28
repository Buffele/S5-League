import {AnimationClip,Bone,Group,Matrix4,Quaternion,QuaternionKeyframeTrack,Vector3,VectorKeyframeTrack} from 'three';
import {FIREBALL} from './fireball.js';
import {KATON_BONES,KATON_FPS,KATON_HANDS,katonFrame} from './katon-spec.js';
const D=new Vector3(-1,0,0),UP=new Vector3(0,1,0),FORWARD=new Vector3(0,0,-1),rad=Math.PI/180;
const anatomical=([right,up,forward],h=1)=>new Vector3(-right*h,up*h,-forward*h);
const point=b=>b.getWorldPosition(new Vector3());
const rotation=b=>b.getWorldQuaternion(new Quaternion());
// Measured outfit-01 face after its real attachment hierarchy, in source units.
// Lip center (not nose or Head pivot); soles measured from boot vertices.
export const KATON_MEASUREMENTS={male:{crown:275.246784,sole:-1.712494,mouth:[0,248.347914,-12.990222]},female:{crown:264.128442,sole:-.000107,mouth:[0,238.773932,-11.426032]}};
function handAxes(code,side){
 const sign=side==='L'?1:-1;let longitudinal,palm;
 if(code==='BAS'){longitudinal=UP.clone().negate();palm=D.clone().multiplyScalar(sign);}
 if(code==='VERTICAL'){longitudinal=UP.clone();palm=D.clone().multiplyScalar(sign);}
 if(code==='H1'||code==='H2'){longitudinal=D.clone().multiplyScalar(sign);palm=UP.clone().multiplyScalar(sign*(code==='H1'?1:-1));}
 if(code==='DIAGONAL'){longitudinal=UP.clone().addScaledVector(D,sign).normalize();palm=FORWARD.clone().negate();}
 if(code==='SEPARATION'){longitudinal=UP.clone().negate().add(FORWARD).normalize();palm=D.clone();}
 if(code==='FORWARD'){longitudinal=FORWARD.clone();palm=D.clone().multiplyScalar(-1);}
 return {longitudinal,palm};
}
function basis(longitudinal,palm){
 const x=longitudinal.clone().normalize(),z=palm.clone().addScaledVector(x,-palm.dot(x)).normalize(),y=new Vector3().crossVectors(z,x).normalize();
 return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x,y,z));
}
export function createKatonRig(bones,{sex='male'}={}){
 const root=new Group(),rig=new Map();
 for(const [name,b] of bones){const clone=new Bone();clone.name=name;clone.position.copy(b.position);clone.quaternion.copy(b.quaternion);clone.scale.copy(b.scale);rig.set(name,clone);}
 for(const [name,b] of bones)(rig.get(b.parent?.name)||root).add(rig.get(name));
 for(const name of KATON_BONES)if(!rig.has(name))throw Error(`Katon: missing ${name}`);
 root.updateMatrixWorld(true);
 const measure=KATON_MEASUREMENTS[sex],H=measure.crown-measure.sole;
 const mouthLocal=rig.get('Bip01 Head').worldToLocal(new Vector3(...measure.mouth));
 const bind=new Map([...rig].map(([n,b])=>[n,{p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone(),world:rotation(b)}]));
 const hands={};
 for(const side of ['L','R']){
  const hand=rig.get(`Bip01 ${side} Hand`),base=point(rig.get(`Bip01 ${side} Finger1`)).add(point(rig.get(`Bip01 ${side} Finger2`))).multiplyScalar(.5);
  const localPalm=hand.worldToLocal(point(hand).lerp(base,.65)),longitudinal=hand.worldToLocal(base.clone()).normalize();
  const palm=new Vector3(0,-1,0).applyQuaternion(rotation(hand).invert());hands[side]={localPalm,localBasis:basis(longitudinal,palm)};
 }
 // One fixed calibration lift places the real soles at y=0. Root then stays fixed.
 const rootBone=rig.get('Bip01');rootBone.position.y-=measure.sole;bind.get('Bip01').p.copy(rootBone.position);root.updateMatrixWorld(true);
 const ground=point(rig.get('Bip01 Pelvis'));ground.y=0;const feet={};
 for(const side of ['L','R']){
  const foot=rig.get(`Bip01 ${side} Foot`),sign=side==='L'?-1:1;
  feet[side]={point:ground.clone().add(anatomical([sign*.11,0,-sign*.09],H)),q:new Quaternion().setFromAxisAngle(UP,(side==='L'?-8:15)*rad).multiply(rotation(foot))};
  feet[side].point.y=point(foot).y;
 }
 const diagnostics={sex,H,mouthLocal:mouthLocal.toArray(),palmOffsets:Object.fromEntries(Object.entries(hands).map(([s,h])=>[s,h.localPalm.toArray()])),corrections:[],unreachable:[]};
 const setWorld=(b,q)=>{b.quaternion.copy(rotation(b.parent).invert().multiply(q)).normalize();root.updateMatrixWorld(true);};
 function aim(b,child,target){const start=point(b),from=point(child).sub(start).normalize(),to=target.clone().sub(start).normalize();setWorld(b,new Quaternion().setFromUnitVectors(from,to).multiply(rotation(b)));}
 function solve(a,b,end,target,pole,frame){
  const start=point(a),l1=start.distanceTo(point(b)),l2=point(b).distanceTo(point(end));
  const axis=target.clone().sub(start),distance=axis.length(),min=Math.abs(l1-l2)+1e-5,max=l1+l2-1e-5;
  if(distance>max+.001||distance<min-.001)diagnostics.unreachable.push({frame,bone:a.name,distance,available:l1+l2});
  const d=Math.max(min,Math.min(max,distance));axis.normalize();const bend=pole.clone().sub(start);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
  const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  aim(a,b,start.clone().addScaledVector(axis,along).addScaledVector(bend,height));aim(b,end,start.clone().addScaledVector(axis,d));
 }
 function handTarget(pose,side,C,M){
  const s=side==='L'?0:1,description=KATON_HANDS[pose],offset=[...description[s]];
  if(pose==='A'||pose==='R2'&&side==='L')offset[1]=sex==='female'?-.18:-.215;
  if(sex==='female'&&side==='L'&&(pose==='F'||pose==='R1'))offset[1]=-.175;
  if(sex==='female'&&side==='R'&&pose==='R2')offset[1]=-.16;
  if(pose==='S1'||pose==='S6')offset[0]=(side==='L'?-1:1)*.027;
  // The native gloves include rigid fingers: give their full volumes separate
  // depth lanes through the height exchanges, fixed for every playback.
  if(pose.startsWith('S'))offset[2]+=side==='L'?-.065:.045;
  const {longitudinal,palm}=handAxes(description[s+2],side),q=basis(longitudinal,palm).multiply(hands[side].localBasis.clone().invert());
  return {point:(pose==='F'&&side==='R'?M:C).clone().add(anatomical(offset,H)),q};
 }
 diagnostics.corrections.push({poses:['A','R2.L'],field:'palm height / H',requested:-.25,calibrated:sex==='female'?-.18:-.215,reason:'finite native arm reach; no bone translation or scale change'},
  {poses:['S1','S6'],field:'absolute lateral palm offset / H',requested:[.022,.015],calibrated:.027,reason:'rigid palm clearance'});
 diagnostics.corrections.push({poses:['S1','S2','S3','S4','S5','S6'],field:'additional forward offset / H',calibrated:{L:-.065,R:.045},reason:'separate rigid glove volumes during height exchanges'});
 if(sex==='female')diagnostics.corrections.push({poses:['F.L','R1.L','R2.R'],field:'palm height / H',requested:[-.20,-.21,-.18],calibrated:[-.175,-.175,-.16],reason:'shorter native female arms'});
 function sample(frame){
  for(const [n,b] of rig){const t=bind.get(n);b.position.copy(t.p);b.quaternion.copy(t.q);b.scale.copy(t.s);}root.updateMatrixWorld(true);
  const f=katonFrame(frame),pelvis=rig.get('Bip01 Pelvis');
  pelvis.position.add(anatomical([0,f.height,f.forward],H).applyQuaternion(rotation(pelvis.parent).invert()));
  // Spine is Pelvis's sibling: cumulative anatomical WORLD targets preserve
  // the actual hierarchy, instead of blindly adding local percentages.
  for(const [name,portion] of [['Pelvis',.1],['Spine',.35],['Spine1',.6],['Spine2',1]]){const n='Bip01 '+name;setWorld(rig.get(n),new Quaternion().setFromAxisAngle(D,f.theta*portion*rad).multiply(bind.get(n).world));}
  for(const [i,side] of ['L','R'].entries()){
   const b=rig.get(`Bip01 ${side} Clavicle`),axis=FORWARD.clone().applyQuaternion(new Quaternion().setFromAxisAngle(D,f.theta*rad));
   setWorld(b,new Quaternion().setFromAxisAngle(axis,f.clavicle[i]*rad*(side==='L'?-1:1)).multiply(rotation(b)));
  }
  for(const [name,portion] of [['Neck',.35],['Head',0]]){const n='Bip01 '+name;setWorld(rig.get(n),new Quaternion().setFromAxisAngle(D,f.theta*portion*rad).multiply(bind.get(n).world));}
  const C=point(rig.get('Bip01 Spine2')),M=rig.get('Bip01 Head').localToWorld(mouthLocal.clone());
  for(const side of ['L','R']){
   const a=rig.get(`Bip01 ${side} Thigh`),b=rig.get(`Bip01 ${side} Calf`),foot=rig.get(`Bip01 ${side} Foot`);
   solve(a,b,foot,feet[side].point,point(a).add(anatomical([side==='L'?-.05:.05,-.15,.3],H)),frame);setWorld(foot,feet[side].q);
  }
  const palmTargets={};
  for(const side of ['L','R']){
   const a=handTarget(f.a,side,C,M),b=handTarget(f.b,side,C,M),target=a.point.lerp(b.point,f.w),q=a.q.slerp(b.q,f.w).normalize();
   const upper=rig.get(`Bip01 ${side} UpperArm`),forearm=rig.get(`Bip01 ${side} Forearm`),hand=rig.get(`Bip01 ${side} Hand`);
   const wrist=target.clone().sub(hands[side].localPalm.clone().multiply(hand.scale).applyQuaternion(q));
   const sign=side==='L'?-1:1,guide=anatomical([sign*.20,-.12,.03],H).lerp(anatomical(side==='L'?[-.15,-.18,-.08]:[.20,-.02,.03],H),f.pole);
   solve(upper,forearm,hand,wrist,point(upper).add(guide),frame);setWorld(hand,q);palmTargets[side]=target;
  }
  root.updateMatrixWorld(true);return {parameters:f,C,M,palmTargets,feet,rig,root};
 }
 return {sample,rig,root,diagnostics,mouthLocal,H,feet,hands};
}
export function buildFireballClip(source,bones,options={}){
 const authored=createKatonRig(bones,options),times=Array.from({length:91},(_,i)=>i/KATON_FPS),poses=[];
 for(let frame=0;frame<=90;frame++){const result=authored.sample(frame);poses.push(Object.fromEntries(KATON_BONES.map(n=>{const b=result.rig.get(n);return [n,{p:b.position.toArray(),q:b.quaternion.toArray()}];})));}
 if(authored.diagnostics.unreachable.length)throw Error('Katon calibration unreachable: '+JSON.stringify(authored.diagnostics.unreachable.slice(0,3)));
 const tracks=KATON_BONES.flatMap(n=>[new VectorKeyframeTrack(`${bones.get(n).uuid}.position`,times,poses.flatMap(p=>p[n].p)),new QuaternionKeyframeTrack(`${bones.get(n).uuid}.quaternion`,times,poses.flatMap(p=>p[n].q))]);
 const clip=new AnimationClip(FIREBALL.clip,3,tracks);clip.userData={katon:authored.diagnostics,mouthLocal:authored.mouthLocal.toArray()};return clip;
}
