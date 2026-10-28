// Source static-contact response in the existing S5 actor runtime. The current
// host geometry/role views remain authoritative; this is not activation of the
// complete native actor, registration tree, actor collections or state engine.
import {TUNING} from './movement-profile.js';
import {createNativeCollisionMovement} from './native-collision-movement.js';
import {createStaticContactIndex} from './static-contact-index.js';
import {queryNativeStaticContact,nativeStaticSweepBounds} from './native-static-contact-query.js';
import {queryNativeStaticHeight} from './native-static-height-query.js';
import {queryNativePostMoveOverlap} from './native-post-move-query.js';
const f=Math.fround,unit=.006;
// PE7B11C0 and live solver/Float profile in native-live-profile.json. Category1
// below denotes this adapter's ordinary static geometry, not native admission.
const context=Object.freeze({skin:f(.015),maximumIterations:5,solverMask:1,globalMask:1,responseMask:1,validationGlobalMask:1,
 float1:f(.0001),float13:f(.02),float37:f(.7),float42:f(.9)});
const empty={complete:true,treeComplete:true,children:[],tree:null};
const arithmeticProfile={roundX87:n=>n,source:'S5 host JS53 arithmetic; source static kernels, no x87 bitwise equivalence claim'};
const xyz=p=>[p.x,p.y,p.z];
export function createStaticContactMovement(controller){
 let query=null;
 const index=createStaticContactIndex(({vertices:[a,b,c]})=>{
  if(query?.kind!=='sweep')return false;
  const ab=b.map((n,i)=>n-a[i]),ac=c.map((n,i)=>n-a[i]);
  const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  const delta=query.displacement.map((n,i)=>n*query.radii[i]),origin=query.origin.map((n,i)=>n*query.radii[i]);
  return delta.reduce((s,n,i)=>s+n*normal[i],0)<0&&origin.reduce((s,n,i)=>s+(n-a[i])*normal[i],0)>=0;
 });
 const live=()=>index.read(controller.collision.world);
 const radii=[f(TUNING.radius/unit),f(TUNING.height/2/unit),f(TUNING.radius/unit)];
 let disposed=false,verticalStartY=0,moves=0;
 function placement(position,grounded){
  const p={...position};
  if(grounded){
   // S5 floor-projected spawns may be exactly tangent. The source setter's
   // zero-distance descending correction is one skin*radiusY (7B0635).
   // Give only that clearance, on a real upper supporting contact, never a
   // blanket lift, arbitrary support range or correction to X/Z.
   const margin=context.skin*TUNING.height/2;
   const center={...p,y:p.y+TUNING.height/2};
   const hit=controller.collision.sweep(center,{x:0,y:-2*margin,z:0});
   if(hit&&(center.y-2*margin*hit.time-hit.point.y)/(TUNING.height/2)>context.float42)
    p.y+=Math.max(0,margin-2*margin*hit.time);
  }
  return Object.fromEntries(['x','y','z'].map(axis=>[axis,f(p[axis]/unit)*unit]));
 }
 const anchor=xyz(placement(controller.position,controller.grounded)).map(n=>f(n/unit));
 const body=createNativeCollisionMovement({source:'Source ordinary static response with current S5 state/geometry ownership',
  channelOrder:['vertical','horizontal'],
  state:{offset678:[0,radii[1],0],anchor684:anchor,radii690:radii,lastSafe69c:anchor.slice(),contactPoint660:[0,0,0],normal66c:[0,0,0],grounded6b4:false,found650:false,nearest658:-1,history:[],accumulatedCategoriesC:0},
  mapping:{scale:[unit,unit,unit],origin:[0,0,0],evidence:'Current S5 world coordinates at .006 source scale'},
  batching:{state:{clock28:0,clock30:0,remainder38:0,remainder40:0,flushFlag:false,bypassFlag:false,records:[]},remainder:(a,b)=>a%b,
   source:'Source16ms accumulator, separate S5 physical/input channels; native state callsite cadence remains unverified',actorId:1,localActorId:1,horizontalCallsite:1,verticalCallsite:2},
  prepareMove:({channel,state,grounded})=>{
   if(channel==='vertical'){verticalStartY=state.anchor684[1];return {grounded:false};}
   return {grounded};
  },
  readActorPolicy:()=>({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:f(200*f(.9))}),
  readHostGrounded:({channel,state,previousGrounded})=>{
   if(channel==='horizontal')return previousGrounded;
   if(state.grounded6b4)return true;
   //526F75..527101: logical ground does not become fall just because the
   // byte was reset or the batched operation did not move downward.
   return previousGrounded&&state.anchor684[1]>=verticalStartY;
  },
  readOperation:()=>({context:controller.bodyContactQuery?{...context,solverMask:0x1001,responseMask:0x1001}:context,
   queryContact:args=>{
    query={...args,kind:'sweep'};
    const bounds=nativeStaticSweepBounds({...args,float47:1});
    const hit=queryNativeStaticContact({...args,tree:live().tree,complete:true,arithmeticProfile,
     bounds,initialCategories:args.initialCategories??0});
    return {...(controller.bodyContactQuery?controller.bodyContactQuery({...args,bounds},hit):hit),completeUnion:true};
   },
   queryLowerSupport:args=>{query={kind:'height'};return queryNativeStaticHeight({...args,tree:live().tree,complete:true});},
   queryAdjustedPosition:args=>{query={kind:'overlap'};return queryNativePostMoveOverlap({center:args.centerNormalized,radii:args.radii,bounds:args.bounds,
    solverMask:1,overlapGlobalMask:1,managerFlag20:false,worldC:empty,world8:live(),category400:{complete:true,records:[]},arithmeticProfile});},
  }),
 });
 function check(){if(disposed)throw Error('Static contact movement disposed');live();}
 return {
  position:()=>body.position(),
  snapshot:()=>({...body.snapshot(),scope:'source-static-response-in-s5',nativeReady:false}),
  diagnostics:()=>({scope:'source-static-response-in-s5',nativeReady:false,fullNativeActor:false,moves,disposed,geometry:index.diagnostics()}),
  reset(input){check();return body.reset({...input,position:placement(input.position,input.grounded)});},
  move(input){
   check();moves++;
   const expected=body.position();
   if(xyz(input.position).some((n,i)=>n!==xyz(expected)[i]))body.reset({position:placement(input.position,input.grounded),grounded:input.grounded});
   //526D00 mode0 probes with terminal speed before Run/Jump input, rather
   // than the tiny gravity step used by the former S5 step/snap integrator.
   const vertical=input.grounded&&input.vertical.y<0?{x:0,y:-TUNING.terminal*input.deltaSeconds,z:0}:input.vertical;
   return body.move({...input,position:body.position(),vertical});
  },
  dispose(){if(disposed)return;disposed=true;index.dispose();},
 };
}
