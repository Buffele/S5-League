import {Vector3,CatmullRomCurve3,MathUtils} from 'three';

const N=56;
// Counter has two independently animated equipped scenes. A left-arm frame
// cannot stand in for the right blade (nor vice versa).
function frame(mesh,actor){
 mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox,dimensions=box.getSize(new Vector3());
 const axes=[0,1,2].sort((a,b)=>dimensions.getComponent(b)-dimensions.getComponent(a));
 const center=box.getCenter(new Vector3()).applyMatrix4(mesh.matrixWorld),up=new Vector3().setFromMatrixColumn(mesh.matrixWorld,axes[0]).normalize(),right=new Vector3().setFromMatrixColumn(mesh.matrixWorld,axes[1]).normalize();
 const normal=new Vector3().crossVectors(right,up).normalize();if(normal.dot(center.clone().sub(actor))<0)normal.negate();
 return {center:center.addScaledVector(normal,.12),up,right,normal};
}
export class CounterArtParts{
 constructor(group,avatar,right,left,createRibbon){
  this.avatar=avatar;this.right=right;this.left=left;this.samples=[];this.base=new Vector3();this.tip=new Vector3();
  left.geometry.computeBoundingBox();const box=left.geometry.boundingBox,size=box.getSize(new Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
  this.localBase=box.getCenter(new Vector3());this.localTip=this.localBase.clone();this.localBase[axis]=box.min[axis];this.localTip[axis]=box.max[axis];
  this.meshes=Array.from({length:7},(_,index)=>{const mesh=createRibbon();mesh.name='counter-second-part-'+index;group.add(mesh);return mesh;});
 }
 clear(){this.samples=[];for(const mesh of this.meshes)mesh.visible=false;}
 sample(age,{capture,emit,life}){
  const actor=this.avatar.group.getWorldPosition(new Vector3());this.leftFrame=frame(this.left,actor);this.rightFrame=frame(this.right,actor);
  this.base.copy(this.localBase).applyMatrix4(this.left.matrixWorld);this.tip.copy(this.localTip).applyMatrix4(this.left.matrixWorld);
  const arm=this.avatar.bones.get('Bip01 L Forearm');if(!arm)throw Error('Counter art requires the evaluated left forearm');
  const anchor=arm.getWorldPosition(new Vector3());if(this.tip.distanceToSquared(anchor)<this.base.distanceToSquared(anchor)){const point=this.base.clone();this.base.copy(this.tip);this.tip.copy(point);}
  if(!capture)return;
  this.samples=this.samples.filter(sample=>age-sample.time<life);
  if(emit){if(this.samples.length&&this.base.distanceTo(this.samples.at(-1).base)>2)this.samples=[];this.samples.push({base:this.base.clone(),tip:this.tip.clone(),time:age});if(this.samples.length>72)this.samples.shift();}
 }
 render(effect){
  const p=effect.profile,opacity=effect.opacity(),age=effect.age;for(const mesh of this.meshes)mesh.visible=false;
  if(p.action==='guard'){
   // The original guard ornaments remain on the left; mirror the selected
   // treatment onto the actual right blade frame, not the actor's other side.
   const f=this.rightFrame;if(!f||opacity<=0)return;
   if(p.plates)for(let c=0;c<3;c++){
    const points=Array.from({length:N+1},(_,i)=>{const a=i/N*Math.PI*.52+c*Math.PI*2/3;return f.center.clone().addScaledVector(f.right,Math.cos(a)*.42).addScaledVector(f.up,Math.sin(a)*.65).addScaledVector(f.normal,.08);});
    effect.fillRibbon(this.meshes[c+1],points,.10,opacity*.85);
   }
   if(p.flow)for(let c=0;c<p.flow;c++){
    const points=Array.from({length:N+1},(_,i)=>{const u=i/N,a=u*Math.PI*2+c/p.flow*Math.PI*2+age*5;return f.center.clone().addScaledVector(f.right,Math.cos(a)*.45).addScaledVector(f.up,Math.sin(a)*.62).addScaledVector(f.normal,(u-.5)*.3+Math.sin(u*8-age*7+c)*.08);});
    effect.fillRibbon(this.meshes[c+1],points,.05,opacity*.78);
   }
   return;
  }
  const fresh=this.samples.filter(sample=>age-sample.time<p.life);
  if(p.trail&&fresh.length>=2){
   const bases=new CatmullRomCurve3(fresh.map(sample=>sample.base)),tips=new CatmullRomCurve3(fresh.map(sample=>sample.tip)),sweep=[],centers=[];
   for(let i=0;i<=N;i++){const base=bases.getPoint(i/N),tip=tips.getPoint(i/N);sweep.push({base,tip});centers.push(base.clone().lerp(tip,.5));}
   const residual=1-MathUtils.smoothstep(age-fresh.at(-1).time,0,p.life);effect.fillRibbon(this.meshes[0],centers,p.width,residual*.85,{sweep});
  }
  if(p.flow&&opacity>0){const f=this.leftFrame,blade=this.tip.clone().sub(this.base);
   for(let c=0;c<p.flow;c++){
    const points=Array.from({length:N+1},(_,i)=>{const u=i/N,phase=c/p.flow*Math.PI*2,envelope=Math.sin(Math.PI*u),v=p.action==='air'?this.tip.clone().addScaledVector(new Vector3(0,1,0),u*1.65):this.base.clone().addScaledVector(blade,u);
     return v.addScaledVector(f.right,Math.cos(phase)*.07+Math.sin(u*8-age*7+phase)*.14*envelope).addScaledVector(f.normal,Math.sin(phase)*.07+Math.cos(u*8-age*8+phase)*.12*envelope);});
    effect.fillRibbon(this.meshes[c+1],points,.045,opacity*.78);
   }
  }
 }
 snapshot(){return {source:this.left.userData.source,mesh:this.left.name,base:this.base.toArray(),tip:this.tip.toArray(),samples:this.samples.length,visibleRibbons:this.meshes.filter(mesh=>mesh.visible).length};}
 dispose(){for(const mesh of this.meshes){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}this.samples=[];}
}
