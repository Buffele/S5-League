import * as T from 'three';
import {loadAvatar} from './avatar.js';

const pos=m=>new T.Vector3().setFromMatrixPosition(m);
const rot=m=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(m)).normalize();
const reflect=v=>new T.Vector3(v.x,v.y,-v.z);
const reflection=new T.Matrix4().makeScale(1,1,-1),up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1);
const mapping=[['Bip01','Hips','Bip01 Spine','Spine'],['Bip01 Pelvis','Hips','Bip01 Spine','Spine'],['Bip01 Spine','Spine','Bip01 Spine1','Spine2'],['Bip01 Spine1','Spine2','Bip01 Spine2','Spine3'],['Bip01 Spine2','Spine3','Bip01 Neck','Neck'],['Bip01 Neck','Neck','Bip01 Head','Head']];
for(const [side,full]of [['L','Left'],['R','Right']])for(const [b,s,c,sc]of [['Clavicle','Shoulder','UpperArm','Arm'],['UpperArm','Arm','Forearm','ForeArm'],['Forearm','ForeArm','Hand','Hand'],['Hand','Hand','Finger2','HandMiddle1'],['Thigh','UpLeg','Calf','Leg'],['Calf','Leg','Foot','Foot'],['Foot','Foot','Toe0','ToeBase']])mapping.push([`Bip01 ${side} ${b}`,full+s,`Bip01 ${side} ${c}`,full+sc]);
function anatomicalFrame(direction,normal){const x=direction.clone().normalize(),y=new T.Vector3().crossVectors(normal,x);if(y.lengthSq()<1e-8)y.crossVectors(Math.abs(x.y)<.9?up:forward,x);y.normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,new T.Vector3().crossVectors(x,y).normalize()));}
function setWorldRotation(bone,q){const parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(q));bone.updateWorldMatrix(false,true);}
// Analytic two-bone IK. Bone translations and scales are never changed.
export function solveLimb(a,b,c,target,pole,endRotation=c.getWorldQuaternion(new T.Quaternion())){
 const s=a.getWorldPosition(new T.Vector3()),e=b.getWorldPosition(new T.Vector3()),w=c.getWorldPosition(new T.Vector3()),l1=s.distanceTo(e),l2=e.distanceTo(w),axis=target.clone().sub(s),requested=axis.length();
 if(requested<1e-8||l1<1e-8||l2<1e-8)return requested;
 axis.divideScalar(requested);const d=T.MathUtils.clamp(requested,Math.abs(l1-l2)+1e-5,l1+l2-1e-5),x=(l1*l1-l2*l2+d*d)/(2*d);
 let bend=pole.clone().sub(s).addScaledVector(axis,-pole.clone().sub(s).dot(axis));if(bend.lengthSq()<1e-8)bend=new T.Vector3().crossVectors(axis,up);if(bend.lengthSq()<1e-8)bend=new T.Vector3(1,0,0);bend.normalize();
 const elbow=s.clone().addScaledVector(axis,x).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-x*x)));
 setWorldRotation(a,new T.Quaternion().setFromUnitVectors(e.clone().sub(s).normalize(),elbow.clone().sub(s).normalize()).multiply(a.getWorldQuaternion(new T.Quaternion())));
 const eb=b.getWorldPosition(new T.Vector3()),wc=c.getWorldPosition(new T.Vector3());
 setWorldRotation(b,new T.Quaternion().setFromUnitVectors(wc.sub(eb).normalize(),target.clone().sub(eb).normalize()).multiply(b.getWorldQuaternion(new T.Quaternion())));
 setWorldRotation(c,endRotation);return c.getWorldPosition(new T.Vector3()).distanceTo(target);
}

export async function createLocomotionFit(sex,sourceRest){
 const reference=await fetch(`/assets/s5runtime/rig-${sex}.json`).then(r=>r.json()),actor=await loadAvatar({appearance:'s5runtime',sex,outfit:'01',weapon:'dagger',weaponSkin:'classic'});
 return fitLocomotion(actor,reference,sourceRest);
}
export function fitLocomotion(actor,reference,sourceRest){
 actor.prepareSwitch();actor.mixer.stopAllAction();
 // The only source pose used is the static SN002 grasp: fingers, hand socket
 // and wrist orientation. No native walk cycle or native phase is evaluated.
 const gripMixer=new T.AnimationMixer(actor.rig),gripAction=gripMixer.clipAction(actor.actions.get('SN002').getClip()).play();gripMixer.update(0);actor.group.updateMatrixWorld(true);
 const grip=new Map([...actor.bones].map(([n,b])=>[n,{p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}]));
 const wristRelative=actor.bones.get('Bip01 Spine2').getWorldQuaternion(new T.Quaternion()).invert().multiply(actor.bones.get('Bip01 R Hand').getWorldQuaternion(new T.Quaternion()));
 gripAction.stop();gripMixer.uncacheRoot(actor.rig);
 const rest=new Map(reference.bones.map(b=>[b.name,new T.Matrix4().fromArray(b.matrix)])),local=new Map();
 for(const d of reference.bones){const m=rest.get(d.name).clone();if(rest.has(d.parent))m.premultiply(rest.get(d.parent).clone().invert());local.set(d.name,m);m.decompose(actor.bones.get(d.name).position,actor.bones.get(d.name).quaternion,actor.bones.get(d.name).scale);}
 // Added equipment/hair nodes retain the resolved BASE transforms captured by
 // the real mixer, rather than reintroducing their authored scene-space bind.
 for(const [n,p]of grip)if(!rest.has(n)){const b=actor.bones.get(n);b.position.copy(p.p);b.quaternion.copy(p.q);b.scale.copy(p.s);}
 actor.group.rotation.y=Math.PI;actor.group.position.set(0,0,0);actor.group.updateMatrixWorld(true);
 const scale=actor.rig.scale.y,ratio=pos(rest.get('Bip01')).y*scale/pos(sourceRest.get('Hips')).y,binds=new Map();
 for(const [target,source,child,sourceChild]of mapping){const foot=target.endsWith(' Foot'),frame=anatomicalFrame(pos(rest.get(child)).sub(pos(rest.get(target))),foot?up:new T.Vector3(0,0,-1));binds.set(target,{source,sourceChild,foot,sourceRestQ:rot(sourceRest.get(source)),targetRestQ:rot(rest.get(target)),offset:frame.invert().multiply(rot(rest.get(target)))});}
 const shoes={L:[],R:[]},v=new T.Vector3();
 for(const mesh of actor.meshes){if(!mesh.isSkinnedMesh||!mesh.userData.source?.includes('/foot/'))continue;for(let i=0;i<mesh.geometry.attributes.position.count;i++){const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);if(p.y<.14)shoes[p.x<0?'L':'R'].push([mesh,i]);}}
 for(const side of ['L','R']){const list=shoes[side],stride=Math.max(1,Math.ceil(list.length/100));shoes[side]=list.filter((_,i)=>i%stride===0);}
 const soleMinimum=side=>Math.min(...shoes[side].map(([mesh,i])=>mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).y));
 const groundOffset=-Math.min(soleMinimum('L'),soleMinimum('R'));
 const feet=new Map(['L','R'].map((side)=>{const source=(side==='L'?'Left':'Right')+'Foot',b=actor.bones.get(`Bip01 ${side} Foot`);return[side,{source,bind:b.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,groundOffset,0)),sourceBind:pos(sourceRest.get(source))}];}));
 const diagnostics={};
 return {actor,ratio,diagnostics,apply(p,current,{carry=true,feetIK=true}={}){
  const worlds=new Map();
  for(const d of reference.bones){const m=local.get(d.name).clone();if(worlds.has(d.parent))m.premultiply(worlds.get(d.parent));const bind=binds.get(d.name);
   if(bind){const source=current.get(bind.source),delta=rot(source).multiply(bind.sourceRestQ.clone().invert()),direction=reflect(pos(current.get(bind.sourceChild)).sub(pos(source))),normal=reflect((bind.foot?up:forward).clone().applyQuaternion(delta)),q=bind.foot?new T.Quaternion().setFromRotationMatrix(reflection.clone().multiply(new T.Matrix4().makeRotationFromQuaternion(delta)).multiply(reflection)).multiply(bind.targetRestQ):anatomicalFrame(direction,normal).multiply(bind.offset);m.compose(pos(m),q,new T.Vector3(1,1,1));}
   if(d.name==='Bip01'){const hip=pos(current.get('Hips')).sub(pos(sourceRest.get('Hips'))).sub(new T.Vector3(...p.root));m.setPosition(pos(rest.get('Bip01')).add(reflect(hip).multiplyScalar(ratio/scale)));}
   worlds.set(d.name,m);const relative=m.clone();if(worlds.has(d.parent))relative.premultiply(worlds.get(d.parent).clone().invert());relative.decompose(actor.bones.get(d.name).position,actor.bones.get(d.name).quaternion,actor.bones.get(d.name).scale);
  }
  // Grip-only local properties keep fingers closed and the dagger attached.
  if(carry)for(const [name,g]of grip)if(/^Bip01 R Finger/.test(name)||name==='R_Hand_Dummy'){const b=actor.bones.get(name);b.position.copy(g.p);b.quaternion.copy(g.q);b.scale.copy(g.s);}
  for(const mesh of actor.meshes)if(mesh.userData.weapon)mesh.visible=carry;
  actor.group.position.set(-p.root[0]*ratio,groundOffset,p.root[2]*ratio);actor.group.updateMatrixWorld(true);
  const residuals={};let pelvisLowering=0;
  if(feetIK){const targets=[];
   for(const [side,f]of feet){const names=['Thigh','Calf','Foot'].map(n=>actor.bones.get(`Bip01 ${side} ${n}`)),s=pos(current.get(f.source)),goal=new T.Vector3(-(s.x-f.sourceBind.x)*ratio+f.bind.x,(s.y-f.sourceBind.y)*ratio+f.bind.y,(s.z-f.sourceBind.z)*ratio+f.bind.z),hip=names[0].getWorldPosition(new T.Vector3()),knee=names[1].getWorldPosition(new T.Vector3()),ankle=names[2].getWorldPosition(new T.Vector3()),reach=hip.distanceTo(knee)+knee.distanceTo(ankle)-.001,horizontal=(goal.x-hip.x)**2+(goal.z-hip.z)**2;
    pelvisLowering=Math.max(pelvisLowering,hip.y-goal.y-Math.sqrt(Math.max(0,reach*reach-horizontal)));targets.push({side,names,goal,pole:knee,q:names[2].getWorldQuaternion(new T.Quaternion())});
   }
   // Different thigh/calf proportions can make a source ankle unreachable.
   // Lower the pelvis only as much as required; never lengthen the legs.
   pelvisLowering=T.MathUtils.clamp(pelvisLowering,0,.12);actor.bones.get('Bip01').position.y-=pelvisLowering/scale;actor.group.updateMatrixWorld(true);
   for(const {side,names,goal,pole,q}of targets){
    for(let iteration=0;iteration<4;iteration++){residuals[side]=solveLimb(...names,goal,pole,q);actor.group.updateMatrixWorld(true);const minimum=soleMinimum(side);if(minimum>=-.0002)break;goal.y+=-minimum+.0002;}
   }
  }
  if(carry){const b=n=>actor.bones.get(n),pelvis=b('Bip01 Pelvis').getWorldPosition(new T.Vector3()),right=b('Bip01 R Thigh').getWorldPosition(new T.Vector3()).sub(b('Bip01 L Thigh').getWorldPosition(new T.Vector3()));right.y=0;right.normalize();const front=new T.Vector3(0,0,-1).transformDirection(actor.group.matrixWorld),shoulder=b('Bip01 R UpperArm').getWorldPosition(new T.Vector3()),target=pelvis.clone().addScaledVector(right,.34).addScaledVector(front,.20).add(new T.Vector3(0,.06,0)),pole=shoulder.clone().addScaledVector(right,.22).addScaledVector(front,-.08).add(new T.Vector3(0,-.25,0)),q=b('Bip01 Spine2').getWorldQuaternion(new T.Quaternion()).multiply(wristRelative);
   residuals.hand=solveLimb(b('Bip01 R UpperArm'),b('Bip01 R Forearm'),b('Bip01 R Hand'),target,pole,q);
  }
  actor.group.updateMatrixWorld(true);
  Object.assign(diagnostics,{carry,feetIK,source:'AI4AnimationPy Neutral, unmodified generation clock',nativePoseUse:carry?'SN002 static grip only':'none',pelvisLowering,ikResidualMeters:residuals,soleMinY:{L:soleMinimum('L'),R:soleMinimum('R')},root:actor.group.position.toArray(),finite:[...actor.bones.values()].every(b=>b.matrixWorld.elements.every(Number.isFinite))});
  return actor.group.position;
 }};
}
