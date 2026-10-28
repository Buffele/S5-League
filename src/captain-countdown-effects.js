import * as THREE from 'three';
const BASE='/assets/s5runtime/ui-mode-completion/captain-siege/captain/countdown/';
// The native captured five-second break uses these one-second IF loaders.
// S5's remaining intermission clock selects the digit; no result/death trigger
// or unsupported countdown beyond1..5 is inferred from the resource names.
export async function loadCaptainCountdownEffects({read,load}){
 const manifest=await read(BASE+'manifest.json'),group=new THREE.Group(),entries=[];
 const dispose=()=>{for(const e of entries){e.wrapper.removeFromParent();for(const mesh of e.effect.meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}}entries.length=0;group.removeFromParent();};
 try{
  if(manifest.format!=='captain-source-countdown-v1'||manifest.scenes.length!==5||manifest.texture.source!=='uieffect/_eu_interface_effect.dds'||!/^[a-f0-9]{64}$/.test(manifest.texture.sha256))throw Error('Captain countdown manifest differs');
  for(let digit=1;digit<=5;digit++){
   const r=manifest.scenes.find(r=>r.digit===digit),name=`inter_count_${digit}`;
   if(!r||r.file!==name+'.json'||r.source!==`uieffect/${name}.scn`||r.sequenceSource!==`uieffect/${name}.seq`||r.startMs!==0||r.endMs!==1000||r.fadeInMs!==0||r.fadeOutMs!==0||r.clip!=='COUNT'||r.durationTicks!==19200||JSON.stringify(r.screenPosition)!=='[0,0,1000]')throw Error('Captain countdown source loader differs');
   const data=await read(BASE+r.file);
   if(data.source!==r.source||data.models.length!==1||!data.models[0].effectAnimation?.COUNT||data.models[0].textures.some(t=>t.name!==BASE+'interface_effect.png'))throw Error('Captain countdown source model differs');
   const effect=await load(data,{animation:'COUNT',loop:false}),wrapper=new THREE.Group();wrapper.add(effect.group);wrapper.scale.set(1,1,-1);wrapper.position.set(0,0,-1000);wrapper.visible=false;group.add(wrapper);entries.push({digit,effect,wrapper});
   for(const mesh of effect.meshes)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){m.depthTest=false;m.depthWrite=false;}
   effect.update(0,1);
  }
 }catch(error){dispose();throw error;}
 let disposed=false,digit=null,age=0;group.visible=false;
 const hide=()=>{group.visible=false;};
 const reset=()=>{hide();digit=null;age=0;for(const e of entries)e.wrapper.visible=false;};
 return {group,hide,reset,
  update(state,show){
   if(disposed)return;reset();
   if(!show||state.phase!=='intermission'||state.rules.intermissionSeconds!==5||!Number.isFinite(state.pause)||state.pause<=0||state.pause>5)return;
   digit=Math.ceil(state.pause);age=digit-state.pause;
   const e=entries.find(e=>e.digit===digit);e.wrapper.visible=true;group.visible=true;e.effect.update(age,1);
  },
  render(camera){if(!disposed&&group.visible)entries.find(e=>e.digit===digit).effect.render(camera);},
  snapshot(){return {visible:group.visible,digit,age,disposed,nativeReady:false,clock:'S5 remaining intermission time; source COUNT/IF window and placement'};},
  dispose(){if(disposed)return;disposed=true;reset();dispose();}
 };
}
