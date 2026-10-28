// Presentation only: filtering never removes bones or animation tracks.
export const PRIMARY_JOINT_GROUPS=[
 {label:'Corps',joints:[['Bip01','Corps entier'],['Bip01 Pelvis','Bassin'],['Bip01 Spine','Buste'],['Bip01 Spine2','Poitrine'],['Bip01 Neck','Cou'],['Bip01 Head','Tête']]},
 ...[['L','gauche'],['R','droit']].map(([side,label])=>({label:'Bras '+label,joints:[
  [`Bip01 ${side} Clavicle`,'Épaule '+(side==='L'?'gauche':'droite')],
  [`Bip01 ${side} UpperArm`,'Bras '+label],
  [`Bip01 ${side} Forearm`,'Avant-bras '+label],
  [`Bip01 ${side} Hand`,'Main '+(side==='L'?'gauche':'droite')],
 ]})),
 ...[['L','gauche'],['R','droite']].map(([side,label])=>({label:'Jambe '+label,joints:[
  [`Bip01 ${side} Thigh`,'Cuisse '+label],
  [`Bip01 ${side} Calf`,'Genou / mollet '+(side==='L'?'gauche':'droit')],
  [`Bip01 ${side} Foot`,'Pied '+(side==='L'?'gauche':'droit')],
 ]})),
];
const labels=new Map(PRIMARY_JOINT_GROUPS.flatMap(g=>g.joints));
export const isPrimaryJoint=name=>labels.has(name);
export const jointLabel=(name,advanced=false)=>labels.has(name)?labels.get(name)+(advanced?' · '+name:''):name;
export function jointGroups(names,advanced=false){
 const available=new Set(names);
 const groups=PRIMARY_JOINT_GROUPS.map(g=>({label:g.label,joints:g.joints.filter(([n])=>available.has(n)).map(([n])=>({name:n,label:jointLabel(n,advanced)}))})).filter(g=>g.joints.length);
 if(advanced){
  const others=[...available].filter(n=>!isPrimaryJoint(n)).sort();
  const secondary=others.filter(n=>/^Bip01 (?:Spine1$|[LR] (?:Finger|Toe))/.test(n));
  const secondarySet=new Set(secondary);
  for(const [label,names] of [['Doigts et articulations secondaires',secondary],['Os techniques et accessoires',others.filter(n=>!secondarySet.has(n))]]){
   if(names.length)groups.push({label,joints:names.map(name=>({name,label:name}))});
  }
 }
 return groups;
}

// Resolve a body-surface click using the bones actually deforming its triangle.
// Hidden fingers/helper bones are folded into the nearest selectable parent.
export function jointFromIntersection(hit,selectable=isPrimaryJoint){
 if(!hit?.object)return null;
 const ancestor=node=>{
  while(node){if(node.isBone&&selectable(node.name))return node.name;node=node.parent;}
  return null;
 };
 const mesh=hit.object,indices=mesh.geometry?.attributes?.skinIndex,weights=mesh.geometry?.attributes?.skinWeight;
 if(mesh.isSkinnedMesh&&hit.face&&indices&&weights){
  const scores=new Map(),vertices=[hit.face.a,hit.face.b,hit.face.c];
  const bary=hit.barycoord?[hit.barycoord.x,hit.barycoord.y,hit.barycoord.z]:[1/3,1/3,1/3];
  for(let i=0;i<3;i++)for(const getter of ['getX','getY','getZ','getW']){
   const weight=weights[getter](vertices[i])*bary[i];if(weight<=0)continue;
   const name=ancestor(mesh.skeleton.bones[indices[getter](vertices[i])]);
   if(name)scores.set(name,(scores.get(name)||0)+weight);
  }
  if(scores.size)return [...scores].sort((a,b)=>b[1]-a[1])[0][0];
 }
 return ancestor(mesh.parent);
}
