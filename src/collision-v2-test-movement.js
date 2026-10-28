// Opt-in playable V2 TEST: source collision kernels with ordinary S5 controls,
// combat and action velocities. Geometry-only host experiment, not native parity.
import {TUNING} from './movement-profile.js';
import {createNativeCollisionMovement} from './native-collision-movement.js';
import {createCollisionV2TestWorld} from './collision-v2-test-world.js';
import {queryNativeCompleteContact} from './native-special-contact-query.js';
import {queryNativePostMoveOverlap} from './native-post-move-query.js';
import {queryNativeStaticHeight} from './native-static-height-query.js';
import {nativePrioritizedSupportHeight} from './native-lower-support.js';
import {nativeStaticSweepBounds,nativeStaticTriangleContact} from './native-static-contact-query.js';
import {nativePreSlide,nativeActorContactContinuation} from './native-collision-response.js';
const f=Math.fround,unit=.006;
export const COLLISION_V2_TEST_SCOPE='v2-test-host-geometry-only';
export const COLLISION_V2_TEST_SUPPORT_ALLOWANCE=.1;
const context=Object.freeze({skin:f(.015),maximumIterations:5,solverMask:0x2b17bf,globalMask:0x1867ff,responseMask:0xffffffff,validationGlobalMask:0x67ff,float1:f(.0001),float13:f(.02),float37:f(.7),float42:f(.9)});
const empty={complete:true,treeComplete:true,children:[],tree:null};
const arithmeticProfile={roundX87:n=>n,source:'Explicit JS53 V2 TEST prototype, not native execution precision'};
const xyz=p=>{const values=[p?.x,p?.y,p?.z];if(!values.every(Number.isFinite))throw TypeError('Finite V2 TEST host position required');return values;};

export function createCollisionV2TestMovement(controller){
 if(!controller?.collision?.world||!controller.position)throw TypeError('Current Controller collision world required');
 const index=createCollisionV2TestWorld(controller.collision.world);
 let geometry=index.read(controller.collision.world),disposed=false,resyncs=0,moves=0,supportChecks=0;
 const radii=[f(TUNING.radius/unit),f(TUNING.height/2/unit),f(TUNING.radius/unit)];
 const live=()=>{if(disposed)throw Error('V2 TEST movement disposed');geometry=index.read(controller.collision.world);return geometry.world;};
 // Native AI/special collections remain disabled in the geometry-only TEST.
 // Active combat player bodies are merged below from the same live roster as
 // ordinary play; this does not claim complete native-world activation.
 const base=()=>({float47:1,managerFlag20:false,worldC:empty,world8:live(),category400:{complete:true,queries:[]},sourceSolverId:1,actorCollections:{0x1000:{complete:true,teams:[]},0x10000:{complete:true,actors:[]},0x200000:{complete:true,actors:[]}},arithmeticProfile});
 const contact=args=>{
  const hit=queryNativeCompleteContact({...base(),...args});
  return controller.bodyContactQuery&&hit.qualified?{...controller.bodyContactQuery(args,hit),completeUnion:true}:hit;
 };
 function supportQuery(state){
  supportChecks++;
  const origin=state.anchor684.map((v,i)=>f(f(v+state.offset678[i])/state.radii690[i]));
  const travel=f(COLLISION_V2_TEST_SUPPORT_ALLOWANCE/unit/state.radii690[1]);
  const hit=contact({origin,displacement:[0,-travel,0],radii:state.radii690,solverMask:context.solverMask,globalMask:context.globalMask,initialHistory:[],initialCategories:0});
  if(hit.qualified!==true)throw Error('V2 TEST current swept support unavailable: '+hit.reason);
  return {hit,origin,travel};
 }
 function shortSupport(state){
  const {hit,origin,travel}=supportQuery(state);
  if(hit.hit&&hit.activeTableCategory===0x1000&&hit.distance<=2*context.skin+context.float1){
   const displacement=[0,-travel,0],preSlide=nativePreSlide(origin,displacement,hit.distance).position;
   return nativeActorContactContinuation({origin,displacement,preSlide,point:hit.point,normal:hit.normal,descending:true,iterations:1,float13:context.float13,responseMask:context.responseMask}).grounded;
  }
  // TEST host locomotion follows the rounded body's actual support, also
  // while it climbs a low step. The source upper-contact .9 cap excludes
  // these lower-hemisphere edge contacts even when lower-support stops fall.
  // Evaluate the center AT IMPACT: subtracting travel rejects vertical wall
  // faces, whose contact stays at center height, rather than grounding them.
  // Keep only contact within the existing two-skin placement clearance;
  // the wider sweep is a search bound, not permission to stand above a floor.
  const supports=contact=>contact.hit&&contact.distance<=f(2*context.skin)+context.float1&&
   f(f(origin[1]-contact.distance)-contact.point[1])>context.float1;
  if(supports(hit))return true;
  // A nearer side-wall tangent must not hide a real step/floor contact.
  // Search the current TEST index for any supporting swept contact; the
  // source movement solver and its nearest-hit ordering remain unchanged.
  const displacement=[0,-travel,0],bounds=nativeStaticSweepBounds({origin,displacement,radii:state.radii690,float47:1});
  const overlaps=box=>box.min.every((n,i)=>n<=bounds.max[i]&&box.max[i]>=bounds.min[i]);
  function visit(node){
   if(!node||!overlaps(node.bounds))return false;
   if(node.branch)return node.children.some(visit);
   for(const record of node.records){
    if(!record.raw34||!(record.raw10&context.solverMask&context.globalMask))continue;
    for(let i=0;i<record.triangleCount;i++){
     if(record.triangleBounds&&!overlaps(record.triangleBounds[i]))continue;
     if(supports(nativeStaticTriangleContact({origin,displacement,radii:state.radii690,
      triangle:record.vertices.slice(i*3,i*3+3),arithmeticProfile})))return true;
    }
   }
   return false;
  }
  return visit(geometry.world.tree);
 }
 function placement(position,grounded){
  const anchor=xyz(position).map(n=>f(n/unit));
  if(grounded){
   const state={anchor684:anchor,offset678:[0,radii[1],0],radii690:radii};
   const {hit,origin}=supportQuery(state);
   if(hit.hit&&hit.normal[1]>0&&f(origin[1]-hit.point[1])>context.float42){
    // A host feet-on-floor spawn can overlap after source float32 transforms.
    // TEST placement gives it two skins of ACTUAL support clearance, bounded
    // by the same explicit10cm allowance. Never alter X/Z or lift open air.
    let lift=f(f(hit.point[1]*radii[1])+f(2*context.skin*radii[1])-anchor[1]);
    if(lift>0&&lift<=COLLISION_V2_TEST_SUPPORT_ALLOWANCE/unit){
     // A source tangent-floor hit can hide a later roof in this special
     // placement query. The host's short sweep rejects separating contacts
     // and bounds ONLY this TEST placement lift; it never resolves movement.
     const hostCenter={x:anchor[0]*unit,y:(anchor[1]+radii[1])*unit,z:anchor[2]*unit};
     const roof=controller.collision.sweep(hostCenter,{x:0,y:lift*unit,z:0});
     if(roof)lift=Math.max(0,Math.min(lift,lift*roof.time));
     anchor[1]=f(anchor[1]+lift);
    }
   }
  }
  return Object.fromEntries(['x','y','z'].map((axis,i)=>[axis,anchor[i]*unit]));
 }
 const anchor=xyz(placement(controller.position,controller.grounded)).map(n=>f(n/unit));
 const body=createNativeCollisionMovement({source:'V2 TEST geometry-only source solver with current S5 host controls/combat',
  state:{offset678:[0,radii[1],0],anchor684:anchor,radii690:radii,lastSafe69c:anchor.slice(),contactPoint660:[0,0,0],normal66c:[0,0,0],grounded6b4:false,found650:false,nearest658:-1,history:[],accumulatedCategoriesC:0},
  mapping:{scale:[unit,unit,unit],origin:[0,0,0],evidence:'V2 TEST host scene units; unmirrored .006 source scale'},
  batching:{state:{clock28:0,clock30:0,remainder38:0,remainder40:0,flushFlag:false,bypassFlag:false,records:[]},remainder:(a,b)=>a%b,source:'V2 TEST JS53 callsite batching; native cadence unverified',actorId:1,localActorId:1,horizontalCallsite:1,verticalCallsite:2},
  prepareMove:({channel,displacement,grounded})=>({grounded:channel==='vertical'&&displacement[1]!==0?false:grounded}),
  readActorPolicy:()=>({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:f(200*f(.9))}),
  readHostGrounded:({channel,state})=>{
   if(state.grounded6b4)return true;
   if(channel!=='vertical'||controller.velocity.y>0)return false;
   return shortSupport(state);
  },
  readOperation:()=>({context,
   queryContact:contact,
   queryLowerSupport:args=>nativePrioritizedSupportHeight({...args,managerFlag20:false,worldC:{complete:true,query:input=>queryNativeStaticHeight({...input,tree:null,complete:true})},world8:{complete:true,query:input=>queryNativeStaticHeight({...input,tree:live().tree,complete:true})},category400:{complete:true,queries:[]}}),
   queryAdjustedPosition:args=>queryNativePostMoveOverlap({center:args.centerNormalized,radii:args.radii,bounds:args.bounds,solverMask:args.mask,overlapGlobalMask:0xffffffff,managerFlag20:false,worldC:empty,world8:live(),category400:{complete:true,records:[]},arithmeticProfile}),
  }),
 });
 return {
  position:()=>body.position(),
  snapshot:()=>({...body.snapshot(),scope:COLLISION_V2_TEST_SCOPE,nativeReady:false}),
  diagnostics:()=>({scope:COLLISION_V2_TEST_SCOPE,nativeReady:false,fullActorRuntime:false,actorCollections:controller.bodyContactQuery?'current S5 combat player roster; other native collections disabled':'explicitly disabled for geometry-only TEST',supportAllowance:COLLISION_V2_TEST_SUPPORT_ALLOWANCE,moves,resyncs,supportChecks,disposed,geometry:index.diagnostics()}),
  reset(input){live();return body.reset({...input,position:placement(input.position,input.grounded)});},
  move(input){
   live();moves++;
   const expected=body.position();
   if(xyz(input.position).some((n,i)=>n!==expected[['x','y','z'][i]])){
    // Spawn, approach and other host teleport consumers remain authoritative.
    // Clear pending batches explicitly and quantize into the source anchor.
    body.reset({position:placement(input.position,input.grounded),grounded:input.grounded});resyncs++;
   }
   const result=body.move({...input,position:body.position()});
   // Re-query current support after EVERY descending move, including a
   // horizontal climb and source lower-support/restore results. Those can
   // physically stop falling without preserving the source upper-support byte.
   if(result.qualified&&controller.velocity.y<=0)result.grounded=shortSupport(body.snapshot().state);
   return result;
  },
  dispose(){if(disposed)return;disposed=true;index.dispose();},
 };
}
