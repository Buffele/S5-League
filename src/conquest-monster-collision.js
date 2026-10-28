import {conquestNativeMoveVector} from './conquest-monster-movement.js';
import {nativeCollisionOperation} from './native-collision-operation.js';
const f=Math.fround,keys=['x','y','z'];
const vector=conquestNativeMoveVector;
const array=v=>keys.map(k=>v[k]);
const object=v=>Object.fromEntries(keys.map((k,i)=>[k,v[i]]));
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// A03B30, constant_info float0/42/108, both original resources agree.
export const CONQUEST_MONSTER_COLLISION_CONSTANTS=Object.freeze({zero:0,distance:200,factor:f(.9)});

export function conquestMonsterCollisionDisplacement(displacement,{blocksHorizontal}={}){
 if(typeof blocksHorizontal!=='boolean')throw Error('Explicit monster status flag1 result required');
 const d=vector(displacement),c=CONQUEST_MONSTER_COLLISION_CONSTANTS;
 if(blocksHorizontal)d.x=d.z=c.zero;
 // A03C1F: a purely vertical descending request skips the distance cap.
 if(d.y<0&&d.x===0&&d.z===0)return d;
 const length=f(Math.sqrt(f(f(f(d.x*d.x)+f(d.y*d.y))+f(d.z*d.z)))),cap=f(c.distance*c.factor);
 // Equality enters the normalize/rescale branch in the original.
 if(!(cap>length)&&length!==0){const inverse=f(1/length);for(const k of keys)d[k]=f(f(d[k]*inverse)*cap);}
 return d;
}

// Source A03B30 owns target ordering, mask setup and final actor+74 write.
// moveTarget is the solver operation, never an assumed free translation.
export function conquestMonsterCollisionMove({displacement,blocksHorizontal,collisionMask,readAnchor,setMask,moveTarget,writePosition}={}){
 if(!uint(collisionMask)||![readAnchor,setMask,moveTarget,writePosition].every(p=>typeof p==='function'))throw Error('Explicit native monster collision mask/ports required');
 setMask(0xffffffff,false);setMask(collisionMask,true);
 const delta=conquestMonsterCollisionDisplacement(displacement,{blocksHorizontal}),submissions=[];
 const submit=(part,mode)=>{
  const anchor=vector(readAnchor()),target=Object.fromEntries(keys.map(k=>[k,f(anchor[k]+part[k])]));
  const result=moveTarget(target,mode);submissions.push({target,mode});
  if(result?.qualified!==true)return {qualified:false,reason:result?.reason??'monster-collision-unqualified',position:null,displacement:delta,submissions};
  return null;
 };
 let refused;
 if(delta.y>=0)refused=submit(delta,0);
 else{refused=submit({x:delta.x,y:0,z:delta.z},0);if(!refused)refused=submit({x:0,y:delta.y,z:0},1);}
 if(refused)return refused;
 const position=vector(readAnchor());writePosition({...position});
 return {qualified:true,position,displacement:delta,submissions};
}

// Compose with the existing qualified 7B0180 implementation. Query providers
// still have to prove the complete current collision worlds/lists themselves.
// On refusal, retain completed solver steps for diagnosis; no actor write occurs.
export function conquestMonsterCollisionOperation({state,displacement,blocksHorizontal,collisionMask,context,queryContact,queryLowerSupport,queryAdjustedPosition}={}){
 if(!state)throw Error('Explicit current monster collision solver state required');
 if(!uint(context?.solverMask))throw Error('Explicit retained native query mask6A8 required');
 let current=state,responseMask,committed=null;
 const result=conquestMonsterCollisionMove({displacement,blocksHorizontal,collisionMask,
  readAnchor:()=>object(current.anchor684),
  // A03B30 calls7B0B30: these writes target RESPONSE6AC. Query6A8
  // was initialized separately by7B0AE0 during actor Create and must be
  // retained even if a later actor318 response-mask writer changes.
  setMask:(bits,enabled)=>{responseMask=enabled?((responseMask|bits)>>>0):(((responseMask??0)&~bits)>>>0);},
  moveTarget:(target,mode)=>{
   const step=nativeCollisionOperation({state:current,target:array(target),mode,context:{...context,responseMask},queryContact,queryLowerSupport,queryAdjustedPosition});
   if(step.qualified)current=step.state;return step;
  },writePosition:position=>{committed=position;}});
 return {...result,state:current,solverMask:context.solverMask,responseMask,position:committed};
}
