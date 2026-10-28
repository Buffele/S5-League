import * as THREE from 'three';
import {prepareEquipmentHierarchy} from './equipment-hierarchy.js';
import {buildAnimationClips} from './animation-data.js';
import {AnimationPlayer} from './animation-player.js';

// Independent native-unit animation reader. No item->model or socket is guessed.
// Mesh construction may reuse the returned node map, outside the body mixer.
export function createS5RuntimeFlyingWingReader(file){
 const root=new THREE.Group(),socketName='__flying_reader_socket';
 const reference={source:file.source,clips:file.clips,bones:[{name:socketName,parent:'',matrix:new THREE.Matrix4().toArray(),animations:{},controlsClipDuration:false}]};
 const base=file.clips.find(c=>c.name.toLowerCase()==='base')?.name;
 if(!base)throw Error('Wing source has no BASE animation');
 // wing_nouv retains the authenticated container name wing.scn. Only that
 // exact parsed header may alias the external scene root, never an unknown parent.
 const names=new Set([...file.bones,...file.models].map(n=>n.name));
 const normalize=node=>({...node,parent:!names.has(node.parent)&&node.parent===file.authenticatedContainerName?file.source:node.parent});
 const local={...file,bones:file.bones.map(normalize),models:file.models.map(normalize),attachment:socketName,defaultAnimation:base};
 const mapping=prepareEquipmentHierarchy(reference,local,'flying_',socketName,null);
 const bones=new Map(reference.bones.map(d=>[d.name,new THREE.Bone()]));
 const definitions=new Map(reference.bones.map(d=>[d.name,d]));
 for(const d of reference.bones){const node=bones.get(d.name);node.name=d.name;const parent=bones.get(d.parent),matrix=new THREE.Matrix4().fromArray(d.matrix);
  if(parent)matrix.premultiply(new THREE.Matrix4().fromArray(definitions.get(d.parent).matrix).invert());
  matrix.decompose(node.position,node.quaternion,node.scale);(parent??root).add(node);
 }
 root.updateMatrixWorld(true);
 const player=new AnimationPlayer(root,buildAnimationClips(reference,bones));
 let owner=null,serial=null,signature=null,attached=false;
 function clear(){player.stopAll();root.removeFromParent();owner=null;serial=null;signature=null;attached=false;}
 return {root,bones,reference,mapping,player,nativeReady:false,source:file.source,
  modelNode:name=>bones.get(mapping.get(name)),
  attach(socket,{source,channel,parentNode,bindingEvidence,modelBindingVerified=false}={}){
   if(!modelBindingVerified||source!==file.source||channel!==2||!bindingEvidence||socket?.name!==parentNode)return {attached:false,reason:'native-item-model-socket-binding-required'};
   clear();socket.add(root);root.updateWorldMatrix(true,true);attached=true;return {attached:true,nativeReady:false};
  },
  update(dt,command,{owner:nextOwner=null,resetSerial=0,diagnosticPreview=false}={}){
   if(!Number.isFinite(dt)||dt<0)throw Error('Invalid wing animation frame');
   if(owner!==nextOwner||serial!==resetSerial){player.stopAll();signature=null;owner=nextOwner;serial=resetSerial;}
   if(!attached&&!diagnosticPreview)return {played:false,reason:'native-item-model-socket-binding-required'};
   if(!command||command.channel!==2){player.stopAll();signature=null;return {played:false,reason:'channel2-command-required'};}
   if(!player.actions.has(command.clip)){player.stopAll();signature=null;return {played:false,reason:'native-wing-clip-missing',clip:command.clip};}
   const next=JSON.stringify([command.clip,command.loop,command.speed,command.blendMs]);
   if(signature!==next){player.play(command.clip,{channel:'wing-native2',loop:command.loop,speed:command.speed,fade:(command.blendMs??0)/1000});signature=next;}
   player.update(dt);root.updateWorldMatrix(true,true);return {played:true,clip:command.clip,nativeReady:false,qualification:'independent-source-curve-preview; native parameter windows and binding pending'};
  },
  clear,
 };
}
