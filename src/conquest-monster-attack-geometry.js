import {nativeBoxAabbIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const f=Math.fround;
export const CONQUEST_ATTACK_BOX_SOURCE=Object.freeze({
 type:1,origin:Object.freeze([0,180,0]),direction:Object.freeze([0,0,-1]),
 width:400,height:300,depth:400,halfFactor:.5,
 halfTurnThreshold:0.9998999834060669,pi:3.1415927410125732,
 nativeReady:false,
});
function vector(value,label){
 if(!Array.isArray(value)||value.length!==3||!value.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit native '+label+' vec3 required');
 return value.map(f);
}
function boolean(value,label){if(typeof value!=='boolean')throw Error('Explicit native '+label+' boolean required');return value;}
function nonnegative(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value))||value<0)throw Error('Native nonnegative '+label+' required');return f(value);}
function normalize(value){const square=f(f(f(value[0]*value[0])+f(value[1]*value[1]))+f(value[2]*value[2])),length=f(Math.sqrt(square));if(!(length>0))throw Error('Nonzero native direction required');return value.map(v=>f(v/length));}

// 5F5790 and 53FAF0 use this threshold, not the different97EC00 visual
// facing shortcut. Quaternion/matrix math is a bounded scalar port; original
// DLL29 CPU cases carry explicit numeric tolerances, not live-pose evidence.
function sourceRotation(direction){
 const d=vector(direction,'rotation direction');
 let axis,angle;
 if(d[2]>CONQUEST_ATTACK_BOX_SOURCE.halfTurnThreshold){axis=[0,1,0];angle=CONQUEST_ATTACK_BOX_SOURCE.pi;}
 else {
  const length=f(Math.sqrt(f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]))));
  angle=f(Math.acos(f(f(-d[2])/length)));if(Number.isNaN(angle))angle=0;
  const raw=[d[1],f(-d[0]),0],squared=f(raw[0]*raw[0]+raw[1]*raw[1]);
  axis=squared>1.1754943508222875e-38?raw.map(v=>f(v/Math.sqrt(squared))):[0,0,0];
 }
 const half=f(angle*.5),s=f(Math.sin(half)),[x,y,z]=axis.map(v=>f(v*s)),w=f(Math.cos(half));
 const matrix=[f(1-2*y*y-2*z*z),f(2*x*y+2*z*w),f(2*x*z-2*y*w),
  f(2*x*y-2*z*w),f(1-2*x*x-2*z*z),f(2*y*z+2*x*w),
  f(2*x*z+2*y*w),f(2*y*z-2*x*w),f(1-2*x*x-2*y*y)];
 return {matrix,quaternion:[x,y,z,w]};
}
const rotate=(v,m)=>[0,1,2].map(i=>f(f(f(v[0]*m[i])+f(v[1]*m[3+i]))+f(v[2]*m[6+i])));

// 5F5790: position7C and direction8C are actual native actor ports. No Three
// Object3D, yaw, skeleton node, S5 units or rig animation is consumed.
export function conquestPawnWorldAttackBox({position7c,direction8c,orientDirection280,placeOrigin281}={}){
 const position=vector(position7c,'actor position7C'),direction=vector(direction8c,'actor direction8C');
 boolean(orientDirection280,'attack280');boolean(placeOrigin281,'attack281');
 // Current Pawn A28D60 explicitly flattens Y before its facing setter. Other
 // pitched actor paths are not silently represented as ordinary Pawn attacks.
 if(direction[1]!==0||Math.abs(Math.hypot(...direction)-1)>1e-5)throw Error('Source-normalized horizontal Pawn direction8C required');
 const source=CONQUEST_ATTACK_BOX_SOURCE,m=sourceRotation(direction).matrix;
 const origin=placeOrigin281?rotate(source.origin,m).map((v,i)=>f(v+position[i])):[...source.origin];
 const oriented=orientDirection280?normalize(rotate(source.direction,m)):[...source.direction];
 return {type:1,origin,direction:oriented,width:400,height:300,depth:400,
  source:'5F5790',coordinateSpace:'native',orientDirection280,placeOrigin281,nativeReady:false};
}

export function conquestAttackBoxObb(shape){
 if(shape?.type!==1)throw Error('Actual source type1 BOX required');
 const origin=vector(shape.origin,'world attack origin'),direction=vector(shape.direction,'world attack direction');
 const dimensions=['width','height','depth'].map(key=>nonnegative(shape[key],key));
 if(dimensions.some(n=>n<=0))throw Error('Positive source BOX dimensions required');
 // 5448C0 passes X/Z only. 53FAF0 authors its own rotation from those two
 // components and uses the rear anchor, not an already centered renderer OBB.
 const rotation=sourceRotation([direction[0],0,direction[2]]),m=rotation.matrix;
 const center=rotate([0,0,f(-dimensions[2]*.5)],m).map((v,i)=>f(v+origin[i]));
 return {center,halfExtents:dimensions.map(v=>f(v*.5)),axes:[[m[0],m[1],m[2]],[m[3],m[4],m[5]],[m[6],m[7],m[8]]]};
}

// 5744E0 is attack3B8 && shape.type==7. Pawn's authenticated single MAKEBOX
// remains type1, so the adjusted ray/re-query path is not a critical BOX pass.
export function conquestPawnBoxGeometryPasses({shapeType,adjustment3b8}={}){
 if(shapeType!==1)throw Error('Pawn source BOX type1 required');boolean(adjustment3b8,'attack3B8');
 return {primaryQueries:1,adjustedQueries:0,geometryPassSelectionResolved:true,geometryPassesResolved:false,
  completeQueryWrapperQualified:true,candidateProducerQualified:false,
  source:'56E870→5744E0(type==7)',criticalDamageResolved:false,nativeReady:false};
}

function peerType(peer){
 if(typeof peer==='bigint'&&peer>=0n&&peer<=0xffffffffffffffffn)return Number((peer>>48n)&7n);
 if(Array.isArray(peer)&&peer.length===2&&peer.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff))return (peer[1]>>>16)&7;
 throw Error('Explicit native peerId2C words or uint64 required');
}

// 548AE0 ordering, supplied by actual registry snapshots. Pool tag0 is skipped;
// no deduplication, nearest-player scan or HP/liveness surrogate is introduced.
export function enumerateConquestAttackBoxCandidates({firstRegistryPools,secondRegistry,thirdRegistry,
 excludeSubtype2,omitSecondRegistry,omitThirdRegistry,excludeSubtype5}={}){
 for(const [key,value]of Object.entries({excludeSubtype2,omitSecondRegistry,omitThirdRegistry,excludeSubtype5}))boolean(value,key);
 if(!Array.isArray(firstRegistryPools)||(!omitSecondRegistry&&!Array.isArray(secondRegistry))||(!omitThirdRegistry&&!Array.isArray(thirdRegistry)))throw Error('Explicit source registry collections required');
 const result=[];
 for(const pool of firstRegistryPools){
  if(!Number.isInteger(pool.tag)||pool.tag<0||pool.tag>255||!Array.isArray(pool.actors))throw Error('Native pool tag and ordered actors required');
  if(pool.tag===0)continue;
  for(const actor of pool.actors){if(excludeSubtype2&&peerType(actor.peerId2c)===2)continue;if(excludeSubtype5&&peerType(actor.peerId2c)===5)continue;result.push(actor);}
 }
 if(!omitSecondRegistry)result.push(...secondRegistry);
 if(!omitThirdRegistry)result.push(...thirdRegistry);
 return result;
}

// 5448C0(type1)→53FAF0. Candidate producers remain explicit; this stage uses
// actual slot44 eligibility, slot80 feet for the AABB, and slot7C for Y clamp.
// It does not use target HP, team, actor identity dedup or obstructing scenery.
export function queryConquestAttackBoxGeometry({shape,candidates}={}){
 if(!Array.isArray(candidates))throw Error('Explicit ordered native query candidates required');
 const obb=conquestAttackBoxObb(shape),origin=vector(shape.origin,'world attack origin'),depth=f(shape.depth),contacts=[];
 for(const actor of candidates){
  if(!actor||actor.identity===undefined)throw Error('Actual candidate actor identity required');
  if(!boolean(actor.eligible44,'candidate44'))continue;
  const p=vector(actor.position80,'candidate position80'),q=vector(actor.position7c,'candidate position7C');
  const width=nonnegative(actor.width68,'candidate width68'),height=nonnegative(actor.height6c,'candidate height6C'),half=f(width*.5);
  const min=[f(p[0]-half),p[1],f(p[2]-half)],max=[f(p[0]+half),f(p[1]+height),f(p[2]+half)];
  if(!nativeBoxAabbIntersection(obb,min,max).intersects)continue;
  const ratio=f(depth/f(width+depth));
  const point=[f(origin[0]+f(f(p[0]-origin[0])*ratio)),origin[1],f(origin[2]+f(f(p[2]-origin[2])*ratio))];
  point[1]=Math.max(q[1],Math.min(f(q[1]+height),point[1]));
  contacts.push({actor,point,flag16:0});
 }
 // Full53FAF0 now completes in original CPU code with explicit actor/registry
 // ports. This does not qualify the caller's candidate producer or open the
 // downstream complete-runtime geometry gate merely because it passed an array.
 return {status:'box-geometry-explicit-candidates',contacts,shape,obb,geometryPassesResolved:false,
  satAndContactPointQualified:true,completeQueryWrapperQualified:true,candidateProducerQualified:false,
  // 11992B0 decomposes/reconstructs the matrix through DLL29. The scalar OBB
  // port above is numerically bounded against that full path, not bit-identical
  // at every rotated boundary (observed extent difference3.05176e-5).
  obbDecompositionParity:false,
  numericParity:'float32 scalar; x87 boundary/profile limits retained',nativeReady:false};
}
