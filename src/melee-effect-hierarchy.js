import {prepareSourceEffectHierarchy} from './rocket-launcher-effect-hierarchy.js';

// Qualified scenes only. Repeated leaf models keep their source index;
// ambiguous named parents and external actor sockets remain outside this fix.
export const MELEE_EFFECT_HIERARCHIES=Object.freeze([
 {asset:'/assets/s5runtime/vital-shock/models/vt_dashatk_01.json',source:'effects/vt_dashatk_01.scn',animation:'vtdash',models:2,bones:['IB_dashath_eff_dummy']},
 {asset:'/assets/s5runtime/demonic-knuckle/models/demonic_claw_01.json',source:'effects/demonic_claw_01.scn',animation:'D',models:6,bones:['demonic_claw_01_Dummy']},
 {asset:'/assets/s5runtime/demonic-knuckle/models/demonic_kn013_eff_01.json',source:'effects/demonic_kn013_eff_01.scn',animation:'demonic_kn013_eff_01',models:36,bones:['Group002','Group003','Group004']},
 {asset:'/assets/s5runtime/iron-boots/models/ironboots_dashatk_01.json',source:'effects/ironboots_dashatk_01.scn',animation:'IB005_DASHATK_01_09',models:2,bones:['IB_dashath_eff_dummy']},
 {asset:'/assets/s5runtime/death-scythe/models/deathscythe_strong_att.json',source:'effects/deathscythe_strong_att.scn',animation:'MALE_BAT_SIDE_??_??? ???06',models:60,bones:['Dummy01']},
 {asset:'/assets/s5runtime/vital-shock/models/vital_claw_01.json',source:'effects/vital_claw_01.scn',animation:'VTclaw',models:8,bones:['Particle View 001','demonic_claw_02_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/vital-shock/models/vital_claw_02.json',source:'effects/vital_claw_02.scn',animation:'vital_claw_02',models:8,bones:['Particle View 001','demonic_claw_02_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/demonic-knuckle/models/demonic_claw_02.json',source:'effects/demonic_claw_02.scn',animation:'d_cl_02',models:6,bones:['demonic_claw_02_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/demonic-knuckle/models/demonic_kn014_eff_01.json',source:'effects/demonic_kn014_eff_01.scn',animation:'demonic_kn014_eff_01',models:1,bones:['Cs_Wea_Dummy','demonic_knuckle_body_Dummy']},
 {asset:'/assets/s5runtime/iron-boots/models/weapon_ironboots_n_strong_01.json',source:'effects/weapon_ironboots_n_strong_01.scn',animation:'weapon_ironboots_n_strong_01',models:9,bones:['sonic_Dummy','spin_jump_katana_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/iron-boots/models/weapon_ironboots_strong_01.json',source:'effects/weapon_ironboots_strong_01.scn',animation:'IB019_STRONG_03',models:9,bones:['sonic_Dummy','spin_jump_katana_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/iron-boots/models/ironboots_2atk_01.json',source:'effects/ironboots_2atk_01.scn',animation:'IRONBOOTS_2ATK_01_02',models:8,bones:['sonic_Dummy','spin_jump_katana_Dummy'],indexedModels:true},
 {asset:'/assets/s5runtime/death-scythe/models/deathscythe_3_att.json',source:'effects/deathscythe_3_att.scn',animation:'MALE_BAT_SIDE_����_3Ÿ ����ƮƮ����',models:39,bones:['Dummy01'],indexedModels:true,sourceRootName:'fire_nocull_nofog_nodepthwrite_alphablend2'},
 {asset:'/assets/s5runtime/death-scythe/models/deathscythe_ex2_att.json',source:'effects/deathscythe_ex2_att.scn',animation:'MALE_BAT_SIDE_����_Ư������ 2Ÿ ����ƮƮ����',models:40,bones:['Dummy01','eff_Dummy'],indexedModels:true,sourceRootName:'fire_nocull_nofog_nodepthwrite_alphablend2'},
 {asset:'/assets/s5runtime/sigma-blade/models/sigma_power_att.json',source:'effects/sigma_power_att.scn',animation:'sigma_power_att',models:12,bones:[],indexedModels:true,sourceRootName:'fire_nocull_nofog_nodepthwrite_alphablend2'},
].map(profile=>Object.freeze({...profile,bones:Object.freeze(profile.bones)})));

export function withMeleeEffectHierarchies(definitions){
 return Object.fromEntries(Object.entries(definitions).map(([name,definition])=>[name,{...definition,nodes:definition.nodes.map(node=>{
  const profile=MELEE_EFFECT_HIERARCHIES.find(profile=>profile.asset===node.asset);
  if(!profile)return node;
  if(node.type!=='CActNodeLoader'||!node.loader||node.loader.animation&&node.loader.animation!==profile.animation)throw Error('Qualified melee loader/clip changed: '+node.asset);
  return {...node,loader:{...node.loader,animation:profile.animation,includeSourceBones:true,nativeHierarchy:'melee-polish'}};
 })}]));
}

export function prepareMeleeEffectHierarchy(data,group,nodes,{animation,loop=false,meshes=[]}={}){
 const profile=MELEE_EFFECT_HIERARCHIES.find(profile=>profile.source===data.source);
 if(!profile||animation!==profile.animation||data.models.length!==profile.models||data.bones.map(bone=>bone.name).join('|')!==profile.bones.join('|')||data.clips.length!==1||data.clips[0].name!==animation)throw Error('Unqualified melee effect hierarchy/clip: '+data.source);
 for(const bone of data.bones)if(!nodes.has(bone.name)||!bone.animations[animation]?.data||bone.animations[animation].copy)throw Error('Qualified melee source dummy/track missing: '+bone.name);
 if(profile.indexedModels)return prepareIndexedModels(data,group,nodes,meshes,{animation,loop},profile.sourceRootName);
 if(new Set(data.nodes.map(node=>node.name)).size!==data.nodes.length)throw Error('Melee effect hierarchy has ambiguous names');
 return prepareSourceEffectHierarchy(data,group,nodes,{animation,loop});
}

function prepareIndexedModels(data,group,nodes,meshes,options,sourceRootName){
 const counts=new Map(),boneNames=new Set(data.bones.map(b=>b.name)),modelNodes=data.nodes.filter(n=>n.type==='ModelData');
 if(boneNames.size!==data.bones.length||meshes.length!==data.models.length||modelNodes.length!==meshes.length||data.nodes.some(n=>!['Bone','ModelData'].includes(n.type)))throw Error('Unqualified indexed melee scene layout');
 for(const node of data.nodes)counts.set(node.name,(counts.get(node.name)??0)+1);
 if(data.bones.some(b=>counts.get(b.name)!==1))throw Error('Ambiguous melee dummy name');
 const modelKey=i=>'__melee_source_model_'+i,parents=new Map();
 modelNodes.forEach((node,i)=>{if(counts.get(node.name)===1)parents.set(node.name,modelKey(i));});
 const parentName=name=>{
  // The SCN header container is searched before its children. Its name can
  // equal several model names; opt in only with the authenticated header name.
  if(sourceRootName&&name===sourceRootName)return data.source;
  if((counts.get(name)??0)>1)throw Error('Ambiguous melee source parent: '+name);
  return parents.get(name)??name;
 };
 const scoped=new Map(nodes),virtualNodes=[];let modelIndex=0;
 for(const node of data.nodes){
  if(node.type==='Bone'){virtualNodes.push({...node,parent:parentName(node.parent)});continue;}
  const i=modelIndex++,mesh=meshes.find(m=>m.userData.sourceModelIndex===i);
  if(!mesh||mesh.name!==node.name||data.models[i].name!==node.name||counts.has(modelKey(i)))throw Error('Melee source model index mismatch');
  scoped.set(modelKey(i),mesh);virtualNodes.push({...node,name:modelKey(i),parent:parentName(node.parent)});
 }
 // Only the evaluator's lookup keys are scoped. Actual meshes, visible names,
 // buffers, per-index tracks and exported source objects are never renamed.
 return prepareSourceEffectHierarchy({...data,nodes:virtualNodes},group,scoped,options);
}
