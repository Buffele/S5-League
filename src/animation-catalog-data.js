import {Bone} from 'three';
import {buildAnimationClips,resolveTransform} from './animation-data.js';

// Parse references, never execute imported Lua. Preserve line numbers.
export function scriptReferences(text,path){
  const clean=text.replace(/--\[\[[\s\S]*?\]\]/g,s=>s.replace(/[^\n]/g,' ')).replace(/--[^\n]*/g,'');
  const refs=[];let context='';
  const tokens=/\bfunction\s+([\w.:]+)\s*\([^)]*\)|([^\n]*?):SetAnim\s*\(\s*"([^"]+)"\s*,([^)]*)\)/g;
  for(const m of clean.matchAll(tokens)){
    if(m[1]){context=m[1];continue;}
    refs.push({clip:m[3],source:path,line:clean.slice(0,m.index).split('\n').length,
      context,parameter:m[2].trim(),arguments:m[4].trim().replace(/\s+/g,' '),kind:'s5runtime-script'});
  }
  return refs;
}

export function inventoryRig(reference,sex,references=[]){
  const bones=new Map(reference.bones.map(d=>[d.name,new Bone()]));
  const clips=buildAnimationClips(reference,bones);
  return clips.map(clip=>{
    const aliases=reference.bones.flatMap(b=>b.animations?.[clip.name]?.copy?[{bone:b.name,target:b.animations[clip.name].copy}]:[]);
    const root=reference.bones.find(b=>b.name==='Bip01');
    const data=root&&resolveTransform(root,clip.name);
    const positions=data?.positions?.map(p=>p.slice(1))||[data?.position].filter(Boolean);
    const rootRange=positions.length?[0,1,2].map(i=>Math.max(...positions.map(p=>p[i]))-Math.min(...positions.map(p=>p[i]))):null;
    return {id:`${sex}:${clip.name}`,sex,clip:clip.name,source:reference.source,
      duration:clip.duration,tracks:clip.tracks.length,aliases,
      rootRange,rootStart:positions[0]||null,rootEnd:positions.at(-1)||null,
      references:references.filter(r=>r.clip===clip.name)};
  });
}

// Loaded parameters plus statically checked call sites; NOT per-frame playback.
export function nativeParameterReferences(evidence,source){
  return (evidence.jumpUses||[]).map(use=>{
    const parameter=evidence.jumpParameters.find(p=>p.index===use.parameterIndex);
    if(!parameter)throw Error('Missing native animation parameter '+use.parameterIndex);
    const rate=evidence.animationTicksPerSecond;
    if(!(rate>0))throw Error('Invalid native animation tick rate');
    return {...use,clip:parameter.clip,source,kind:'s5runtime-native-loaded-settings',
      sourceSha256:evidence.sourceSha256,notSynchronizedWithVideo:true,
      blendMs:parameter.blendTicks/rate*1000,nextBlendExtraMs:parameter.offsetTicks/rate*1000,
      baseSpeed:parameter.speed,loop:parameter.loop,reset:parameter.reset};
  });
}

export function catalogEntry(entry,annotations){
  const note=annotations[entry.id]||annotations[entry.clip]||{};
  const script=entry.references.length>0;
  const nativeReferences=entry.nativeReferences||[],native=nativeReferences.length>0;
  return {...entry,nativeReferences,label:note.label||entry.clip,category:note.category||(native?'déplacements':script?'combat':'inconnu'),
    gestureStatus:note.gestureStatus||'inconnu',usageStatus:note.usageStatus==='contesté'?'contesté':native?'confirmé':note.usageStatus||(script?'confirmé':'inconnu'),
    notes:note.notes||'',evidence:note.evidence||[],
    usage:native?'Association confirmée par code natif et paramètres chargés ; pas de trace synchronisée avec la vidéo.':note.usage||(script?'Association présente dans un script S5Runtime ; lecture en session non vérifiée.':'Utilisation S5Runtime non identifiée.')};
}

export function filterCatalog(entries,{sex='male',query='',category='',status=''}={}){
  const q=query.toLocaleLowerCase('fr');
  return entries.filter(e=>(!sex||e.sex===sex)&&(!category||e.category===category)&&
    (!status||e.gestureStatus===status||e.usageStatus===status)&&
    (!q||[e.clip,e.label,e.notes,...e.references.map(r=>r.context),...(e.nativeReferences||[]).map(r=>r.context)].join(' ').toLocaleLowerCase('fr').includes(q)));
}
