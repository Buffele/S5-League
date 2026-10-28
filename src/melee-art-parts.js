import {Vector3,CatmullRomCurve3,MathUtils} from 'three';
import {footEndpoints,IRON_BOOTS_TRAIL_BINDINGS} from './iron-boots-trails.js';
import {buildMeleeMotif} from './melee-art-motifs.js';
import {resolveWeaponEffectSocket} from './weapon-effect-anchor.js';
import {BREAKER_IMPACT_SOCKET} from './breaker-effects.js';

// Explicit equipped identities: no scabbard/helper/leg or inactive Sigma form.
const bindings={
 katana:[['katana_body','model/weapon/katana_a.scn']],
 twinblade:[['twinsword_r','model/weapon/twinsword_r.scn'],['twinsword_l','model/weapon/twinsword_l.scn']],
 breaker:[['breaker','model/weapon/breaker.scn']],
 assassinclaw:[['vital_shock','model/weapon/vital_shock.scn']],
 sigmablade:[['sigmabalde','model/weapon/sigmablade.scn'],['sigma_blade','model/weapon/sigmablade_change.scn']],
 vitalshock:[['vital_shock_hand_cat_nolight','model/weapon/vital_shock_blackcat.scn']],
 deathscythe:[['deathscythe_normal','model/weapon/deathscythe_normal.scn']],
 demonicknuckle:[['demonic_knuckle_body','model/weapon/demonic_knuckle_r_01.scn'],['demonic_knuckle_body','model/weapon/demonic_knuckle_l_01.scn']],
};
const N=56;
function exactMesh(avatar,name,source){
 const matches=avatar.meshes.filter(m=>m.userData.weapon&&m.name===name&&m.userData.source===source);
 if(matches.length!==1)throw Error(`Art ${avatar.weapon}: expected evaluated ${source}/${name}`);return matches[0];
}
function part(mesh,extra={}){
 mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox,size=box.getSize(new Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';
 const localBase=box.getCenter(new Vector3()),localTip=localBase.clone();localBase[axis]=box.min[axis];localTip[axis]=box.max[axis];
 return {mesh,localBase,localTip,base:new Vector3(),tip:new Vector3(),samples:[],...extra};
}
export class MeleeArtParts{
 constructor(avatar,group,createRibbon){
  this.avatar=avatar;
  if(avatar.weapon==='ironboots'){
   const mesh=exactMesh(avatar,'ironBoots_normal_foot','model/character/foot/ironboots_n_01_foot.scn');
   this.parts=IRON_BOOTS_TRAIL_BINDINGS.map(binding=>part(mesh,{side:binding.side,indices:footEndpoints(mesh,binding).indices}));
  }else{
   if(!bindings[avatar.weapon])throw Error('Missing artistic part bindings: '+avatar.weapon);
   this.parts=bindings[avatar.weapon].map(([name,source])=>part(exactMesh(avatar,name,source),{anchor:avatar.weapon==='breaker'?'L_Hand_Dummy':/_l(?:_01)?\.scn$/.test(source)?'L_Hand_Dummy':'R_Hand_Dummy'}));
  }
  if(avatar.weapon==='deathscythe'){
   // Current model.json Line01 P/P+V through inverse(model)*Shape. Its cutting
   // edge is transverse to the pole; a longest-bounds axis would light the pole.
   this.parts[0].localBase.set(67.86748255848131,-13.521609444131133,31.109968466367924);
   this.parts[0].localTip.set(109.27843792258146,-36.642545999517296,-21.42737860169739);
  }
  for(const [index,p] of this.parts.entries())p.meshes=Array.from({length:6},(_,r)=>{const mesh=createRibbon();mesh.name=`art-${avatar.weapon}-part${index}-${r}`;group.add(mesh);return mesh;});
  this.meshes=this.parts.flatMap(p=>p.meshes);
 }
 clear(){for(const p of this.parts){p.samples=[];for(const mesh of p.meshes)mesh.visible=false;}}
 sample(age,{capture,emit,life}){
  for(const p of this.parts){
   p.mesh.updateWorldMatrix(true,false);p.mesh.skeleton?.update();
   if(p.indices){p.mesh.getVertexPosition(p.indices[0],p.base).applyMatrix4(p.mesh.matrixWorld);p.mesh.getVertexPosition(p.indices[1],p.tip).applyMatrix4(p.mesh.matrixWorld);}
   else{p.base.copy(p.localBase).applyMatrix4(p.mesh.matrixWorld);p.tip.copy(p.localTip).applyMatrix4(p.mesh.matrixWorld);}
   if(this.avatar.weapon==='breaker'){
    const head=this.avatar.bones.get(resolveWeaponEffectSocket(this.avatar,BREAKER_IMPACT_SOCKET)),grip=this.avatar.bones.get('L_Hand_Dummy');if(!head||!grip)throw Error('Breaker art requires its evaluated head and grip');
    grip.getWorldPosition(p.base);head.getWorldPosition(p.tip);
   }
   const anchor=this.avatar.bones.get(p.indices?`Bip01 ${p.side==='right'?'R':'L'} Toe0`:p.anchor);if(!anchor)throw Error('Missing artistic part anchor: '+p.anchor);
   const origin=anchor.getWorldPosition(new Vector3()),swap=p.indices?p.base.distanceToSquared(origin)<p.tip.distanceToSquared(origin):p.tip.distanceToSquared(origin)<p.base.distanceToSquared(origin);
   if(swap){const tmp=p.base.clone();p.base.copy(p.tip);p.tip.copy(tmp);}
   // Twin blades fade while the source chain models deploy. Sigma switches
   // meshes through the existing mixer. Never force either mesh visible.
   p.visible=p.mesh.visible;for(let node=p.mesh.parent;node;node=node.parent)p.visible&&=node.visible;
   if(!capture)continue;
   p.samples=p.samples.filter(s=>age-s.time<life);
   if(emit&&p.visible){if(p.samples.length&&p.base.distanceTo(p.samples.at(-1).base)>2)p.samples=[];p.samples.push({base:p.base.clone(),tip:p.tip.clone(),time:age});if(p.samples.length>72)p.samples.shift();}
  }
 }
 render(effect){
  const p=effect.profile,age=effect.age,opacity=effect.opacity();
  for(const part of this.parts){
   for(const mesh of part.meshes)mesh.visible=false;
   const fresh=part.samples.filter(s=>age-s.time<p.life);
   if(p.trail&&fresh.length>=2){const bases=new CatmullRomCurve3(fresh.map(s=>s.base)),tips=new CatmullRomCurve3(fresh.map(s=>s.tip)),sweep=[],centers=[];
    for(let i=0;i<=N;i++){const base=bases.getPoint(i/N),tip=tips.getPoint(i/N);sweep.push({base,tip});centers.push(base.clone().lerp(tip,.5));}
    effect.fillRibbon(part.meshes[0],centers,p.width,(1-MathUtils.smoothstep(age-fresh.at(-1).time,0,p.life))*.9,{sweep,segmented:p.segmented});
   }
   if(!part.visible||opacity<=0)continue;
   const other=this.parts.find(candidate=>candidate!==part&&candidate.visible);
   const motifs=buildMeleeMotif(p,part,age,other);
   motifs.forEach((motif,index)=>effect.fillRibbon(part.meshes[index+1],motif.points,motif.width,opacity*.85*motif.alpha));
  }
 }
 snapshot(){return this.parts.map(p=>({source:p.mesh.userData.source,mesh:p.mesh.name,side:p.side??null,indices:p.indices??null,visible:p.visible,base:p.base.toArray(),tip:p.tip.toArray(),samples:p.samples.length,ribbons:p.meshes.filter(m=>m.visible).length}));}
 dispose(){this.clear();for(const mesh of this.meshes){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}}
}
