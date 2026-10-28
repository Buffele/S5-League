// Pure source consumers 7B24A0/7B2C90/7B3520. All lists and registry values
// describe the CURRENT operation; an unknown list never becomes an empty one.
import {queryNativeOrdinaryContact} from './native-static-contact-query.js';
const f=Math.fround,uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=p=>{if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');return p.map(f);};
const add=(a,b)=>a.map((n,i)=>f(n+b[i])),sub=(a,b)=>a.map((n,i)=>f(n-b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const length=a=>f(Math.sqrt(dot(a,a))),normalize=a=>{const n=length(a);return n===0?a.slice():a.map(v=>f(v*f(1/n)));};
const overlaps=(a,b)=>[0,2,1].every(i=>a.min[i]<=b.max[i]&&b.min[i]<=a.max[i]);
const finite=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Explicit ${label} required`);return f(n);};
const identity=id=>typeof id==='string'&&id.length>0||uint(id);
const profileRound=profile=>{if(typeof profile?.roundX87!=='function'||!profile.source?.trim())throw TypeError('Explicit x87 arithmetic profile required');return profile.roundX87;};
function cloneState(input){
 if(input?.qualified!==true||typeof input.hit!=='boolean'||!Array.isArray(input.history)||input.history.length>200||
  input.history.some(row=>!uint(row.category)||!uint(row.ownerId))||!uint(input.accumulatedHitCategories))throw TypeError('Qualified shared native contact accumulator required');
 const result={...input,history:input.history.map(row=>({...row}))};
 if(input.hit){if(!Number.isFinite(input.distance)||input.distance<0||!uint(input.activeTableCategory))throw TypeError('Qualified hit fields required');result.point=vector(input.point);result.normal=vector(input.normal);}
 return result;
}
function accept(state,{distance,point,normal},category,ownerId,selected){
 if(state.hit&&state.distance<=distance)return;
 Object.assign(state,{hit:true,distance,point,normal,hitRecordCategory:category,selected});
 state.accumulatedHitCategories=(state.accumulatedHitCategories|category)>>>0;
 if(state.history.length<200){state.history.push({category,ownerId});state.activeTableCategory=category;}
}

//119D3D0 returns a SIGNED ray/sphere distance, or literal -1 on a miss. Its
// intermediate length and dot are f32 promoted to double before x87 math.
export function nativeActorSphereDistance({origin,direction,center,radius,arithmeticProfile}={}){
 const q=profileRound(arithmeticProfile);origin=vector(origin);direction=vector(direction);center=vector(center);
 if(!Number.isFinite(radius))throw TypeError('Explicit sphere radius required');
 const offset=sub(center,origin),n=length(offset),projection=dot(offset,direction);
 const h=q(q(radius*radius)-q(q(n*n)-q(projection*projection)));
 return h<0?-1:q(projection-q(Math.sqrt(h)));
}

// Source-body records for1000 carry solver+678/+684/+690. The10000/200000
// records carry solver+684 plus qualified virtual60/64 return values; these
// two forms must not be substituted for each other.
export function queryNativeActorContacts({branch,collection,sourceSolverId,origin,displacement,radii,bounds,
 initialContact,arithmeticProfile,float33,float47,float48,integer3}={}){
 profileRound(arithmeticProfile);origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
 if(![0x1000,0x10000,0x200000].includes(branch)||radii.some(n=>n<=0)||!identity(sourceSolverId))throw TypeError('Explicit actor branch, source solver identity and positive radii required');
 const refuse=reason=>({qualified:false,hit:false,reason,nativeReady:false});
 if(collection?.complete!==true)return refuse('actor-list-unqualified');
 const candidates=[];
 if(branch===0x1000){
  if(!Array.isArray(collection.teams))return refuse('team-list-unqualified');
  for(const team of collection.teams){
   if(typeof team?.enabled!=='boolean')return refuse('team-enable-unqualified');
   if(!team.enabled)continue;
   if(team.actorsComplete!==true||!Array.isArray(team.actors))return refuse('team-actors-unqualified');
   candidates.push(...team.actors);
  }
 }else{
  if(!Array.isArray(collection.actors))return refuse('actor-list-unqualified');
  candidates.push(...collection.actors);
 }
 const state=cloneState(initialContact),direction=normalize(displacement),travelLength=length(displacement);
 for(const [index,actor]of candidates.entries()){
  // A proven self solver cannot contribute for either virtual44 result. This
  // qualifies contact exclusion only; it does not claim to execute that getter.
  if(actor?.eligible===false)continue;
  if(identity(actor?.solverId)&&actor.solverId===sourceSolverId)continue;
  if(typeof actor?.eligible!=='boolean'||!identity(actor.solverId))return refuse('actor-eligibility-unqualified');
  if(actor.qualified!==true)return refuse('actor-shape-unqualified');
  const offset=vector(actor.raw684);let center,extent;
  if(branch===0x1000){center=add(vector(actor.raw678),offset);extent=vector(actor.raw690);}
  else{
   const multiplier=finite(float33,'registry Float33');extent=[f(finite(actor.virtual60,'virtual60')*multiplier),f(finite(actor.virtual64,'virtual64')*multiplier),f(finite(actor.virtual60,'virtual60')*multiplier)];
   center=offset.slice();center[1]=f(center[1]+extent[1]);
  }
  //1000 broadphase expands by the MOVING solver radii; the other branches
  // expand by their target virtual-body extent. No guessed capsule is used.
  const expansion=branch===0x1000?radii:extent;
  const box={min:sub(center,expansion),max:add(center,expansion)};
  if(!overlaps(box,bounds))continue;
  const normalizedCenter=center.map((v,i)=>f(v/radii[i]));let ratio=1;
  if(extent.some((n,i)=>n!==radii[i])){
   if(!Number.isInteger(integer3)||integer3===0)throw TypeError('Explicit registry Integer3 divisor required');
   const values=extent.map((n,i)=>f(n/radii[i]));ratio=f(f(f(values[0]+values[1])+values[2])/f(integer3));
  }
  const radius=f(ratio+finite(float47,'registry Float47'));
  const signedDistance=f(nativeActorSphereDistance({origin,direction,center:normalizedCenter,radius,arithmeticProfile}));
  if(signedDistance===finite(float48,'registry Float48 miss sentinel'))continue;
  const distance=f(Math.abs(signedDistance));if(!Number.isFinite(distance)||travelLength<distance)continue;
  accept(state,{distance,point:add(origin,direction.map(v=>f(v*signedDistance))),normal:normalize(sub(origin,normalizedCenter))},0x1000,0,
   {kind:'actor-sphere',branch,index,solverId:actor.solverId,signedDistance,center:normalizedCenter,radius});
 }
 return {...state,qualified:true,nativeReady:false,nativeMovementCompared:false};
}

// Full7B11C0 query order: ordinary manager(C/8/world90/400), then1000,
//10000,200000 gated by RAW solverMask, independently of globalMask.
export function queryNativeCompleteContact(input={}){
 const ordinary=queryNativeOrdinaryContact(input);if(ordinary.qualified!==true)return ordinary;
 let state=ordinary;const calls=ordinary.calls.slice();
 for(const branch of [0x1000,0x10000,0x200000]){
  if(!(input.solverMask&branch))continue;
  const collection=typeof input.readActorCollection==='function'?input.readActorCollection(branch):input.actorCollections?.[branch];
  const result=queryNativeActorContacts({...input,branch,collection,bounds:ordinary.bounds,initialContact:state});
  if(result.qualified!==true)return result;
  state=result;calls.push(`solver-branch-${branch.toString(16)}`);
 }
 return {...state,calls,otherSolverBranchesRequired:0,completeUnion:true,nativeReady:false,nativeMovementCompared:false};
}
