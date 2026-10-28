// Azit15 CJumpArea source profiles and pure launch commands. No frame hook or
// Controller.velocity mutation: native F0 and input locomotion are separate.
// Evidence: work/azit-native-adaptation/jump-audit-v2.json.
import {Matrix4,Quaternion,Vector3} from 'three';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const identity=()=>[[1,0,0],[0,1,0],[0,0,1]];
const vector=(v,label)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw TypeError(`Finite ${label} XYZ required`);return v.slice();};
const positive=(v,label)=>{if(!Number.isFinite(v)||v<=0)throw TypeError(`Positive ${label} required`);return v;};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const expected=['jump_dir03','jump_dir04','jump_dir07','jump_dir08','jump_dir10','jump_dir11','jump_dir12','jump_dir13','jump_dir14'];

function evaluatedBox(node,world){
 if(node.type!=='Box'||!Array.isArray(node.serializedVectors)||node.serializedVectors.length!==4)throw Error('Azit source Box fields missing');
 const scale=new Vector3(),rotation=new Quaternion(),translation=new Vector3();world.decompose(translation,rotation,scale);
 const axes=node.serializedVectors.slice(0,3).map(axis=>new Vector3(...vector(axis,'Box axis')).applyQuaternion(rotation).normalize().toArray());
 const extents=vector(node.serializedVectors[3],'Box extents').map((v,i)=>v*scale.getComponent(i));
 // Native11C1990 deliberately zeros raw center before world transform.
 return {center:translation.toArray(),axes,halfExtents:extents};
}

// Raw local hierarchy is preserved. Three's decomposition is an ordinary
// static adaptation, not a claim of D3DX float parity or evaluated clip timing.
export function compileAzitJumpStations(source,{scale=.006}={}){
 positive(scale,'source scale');
 const scene=source?.scenes?.[2];
 if(!scene?.source?.toLowerCase().endsWith('/azit_jump.scn')||scene.nodes?.length!==18||!Array.isArray(scene.root?.matrix))throw Error('Expected exact Azit15 jump scene');
 const worlds=[];
 for(const [index,node] of scene.nodes.entries()){
  const parent=node.parentIndex;
  if(parent!==undefined&&(!Number.isInteger(parent)||parent<0||parent>=index))throw Error('Azit parent ordinal is not already inserted');
  worlds.push(new Matrix4().fromArray(parent===undefined?scene.root.matrix:worlds[parent].elements).multiply(new Matrix4().fromArray(node.matrix)));
 }
 const profiles=[];
 for(const [index,node]of scene.nodes.entries()){
  if(!node.name.startsWith('jump_dir'))continue;
  const children=scene.nodes.map((n,i)=>({n,i})).filter(({n})=>n.parentIndex===index&&n.name.startsWith('power'));
  if(children.length!==1)throw Error('Azit power child identity ambiguous');
  const child=children[0],area=evaluatedBox(node,worlds[index]),power=evaluatedBox(child.n,worlds[child.i]);
  if(area.halfExtents.some(v=>v<=0))throw Error('Invalid source trigger extent');
  const velocityNative=power.axes[2].map(v=>v*power.halfExtents[2]);
  const box={center:area.center.map(v=>v*scale),axes:area.axes,halfExtents:area.halfExtents.map(v=>v*scale)};
  // Reuse the actual native-derived SAT consumer to validate orthogonality.
  nativeBoxIntersection(box,box);
  profiles.push(freeze({id:node.name,sourceSceneIndex:2,sourceNodeIndex:index,powerNodeIndex:child.i,powerName:child.n.name,selector:3,
   box,velocityNative,velocity:velocityNative.map(v=>v*scale),qualification:{staticSourceDerived:true,nativeRuntimeCompared:false,D3DXBitParity:false}}));
 }
 if(JSON.stringify(profiles.map(p=>p.id))!==JSON.stringify(expected))throw Error('Azit nine jump-area identities changed');
 return freeze(profiles);
}

// Native986FE0: center=position74+[0,height/2,0], extents=(width,height,width)/2.
// Pass the CURRENT width/height getters, not ellipsoid radii. Ordinary native
// width getter applies Float37=.7; altered body/model shapes need their values.
export function azitActorTriggerBox(position,{width,height}={}){
 const p=vector([position?.x,position?.y,position?.z],'feet position');positive(width,'current OBB width');positive(height,'current OBB height');
 return {center:[p[0],p[1]+height/2,p[2]],halfExtents:[width/2,height/2,width/2],axes:identity()};
}

export function azitJumpEligibility(gates){
 if(!gates||!Number.isInteger(gates.gameStateCode)||!Number.isInteger(gates.actorUidKind)||
  !['actor3c','actor44','controllerBlocked'].every(k=>typeof gates[k]==='boolean')||typeof gates.property94!=='number')return {qualified:false,eligible:false,reason:'explicit-native-gates-required'};
 const reason=gates.gameStateCode!==2?'game-state':gates.actor3c?'actor3c':!gates.actor44?'actor44':gates.controllerBlocked?'controller-guard':
  gates.actorUidKind===2||gates.actorUidKind===4?'actor-uid-kind':gates.property94===0?'zero-property94':null;
 // The source UCOMISS/LAHF/TEST44 rejects ordered zero, not negatives/NaN.
 return {qualified:true,eligible:reason===null,reason};
}

export function createAzitJumpStations(source,options){
 const profiles=compileAzitJumpStations(source,options);
 return Object.freeze({profiles,
  query({actorBox,gates}={}){
   const eligibility=azitJumpEligibility(gates);
   if(!eligibility.qualified||!eligibility.eligible)return {qualified:eligibility.qualified,commands:[],reason:eligibility.reason};
   if(!actorBox)return {qualified:false,commands:[],reason:'current-actor-obb-required'};
   const commands=profiles.filter(p=>nativeBoxIntersection(p.box,actorBox).intersects).map(p=>freeze({type:'replace-native-velocity',target:'actor+F0',mode114:1,
    areaId:p.id,sourceSceneIndex:p.sourceSceneIndex,sourceNodeIndex:p.sourceNodeIndex,powerNodeIndex:p.powerNodeIndex,
    velocityNative:p.velocityNative.slice(),velocity:p.velocity.slice(),cancelFlyIfActive:true,qualification:p.qualification}));
   return {qualified:true,commands,reason:commands.length?'source-overlap':'outside-source-areas'};
  }
 });
}

// Pure command consumer for decoded source-physics state (native units).
// All other fields/timers are retained. The host owns collision, input motion,
// current fly cancellation, timing and publication. No cooldown/lock invented.
export function applyAzitJumpCommands(state,commands){
 let next={...state,velocityF0:vector(state?.velocityF0,'native velocityF0')};
 for(const command of commands){
  if(command?.type!=='replace-native-velocity'||command.target!=='actor+F0'||command.mode114!==1)throw TypeError('Expected Azit source launch command');
  next={...next,velocityF0:vector(command.velocityNative,'launch velocity'),mode114:1};
 }
 return next;
}
