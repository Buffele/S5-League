import * as THREE from 'three';
import {Controller} from './controller.js';
import {queryNativeCompleteContact} from './native-special-contact-query.js';
import {queryNativePostMoveOverlap} from './native-post-move-query.js';
import {queryNativeStaticHeight} from './native-static-height-query.js';
import {nativePrioritizedSupportHeight} from './native-lower-support.js';
const f=Math.fround,unit=.006;

export const COLLISION_TEST_SCENARIOS=Object.freeze({
 floor:{label:'Sol et déplacement',spawn:[0,1,7]},
 wall:{label:'Glisser contre un mur',spawn:[-5,0,4]},
 ramp:{label:'Monter une pente',spawn:[3,0,4]},
 ceiling:{label:'Saut sous un plafond',spawn:[8,0,1]},
 ledge:{label:'Tomber d’une plateforme',spawn:[-11,2.5,-9]},
});

// Authored test scene, never presented as a captured map. Its collections are
// exhaustive because this constructor creates every test collider itself.
export function createCollisionTestGeometry(){
 const surfaces=[];
 function box(name,size,position,color){const geometry=new THREE.BoxGeometry(...size);geometry.translate(...position);surfaces.push({name,geometry,color});}
 box('Sol',[34,.5,30],[0,-.25,0],0x28384e);
 box('Mur',[.7,4,12],[-7,2,0],0x538cb3);
 box('Plafond',[7,.4,6],[8,3,0],0xe1ab56);
 box('Plateforme',[5,2.5,5],[-11,1.25,-9],0x8c83c8);
 const ramp=new THREE.BufferGeometry();
 // Upward-wound ramp from z2/y0 to z-6/y3.
 ramp.setAttribute('position',new THREE.Float32BufferAttribute([1,0,2,5,3,-6,1,3,-6,1,0,2,5,0,2,5,3,-6],3));ramp.computeVertexNormals();
 surfaces.push({name:'Pente',geometry:ramp,color:0x57ad9b});
 const vertices=[];
 for(const {geometry}of surfaces){const flat=geometry.index?geometry.toNonIndexed():geometry,p=flat.getAttribute('position');for(let i=0;i<p.count;i++)vertices.push([f(p.getX(i)/unit),f(p.getY(i)/unit),f(p.getZ(i)/unit)]);if(flat!==geometry)flat.dispose();}
 const triangles=Array.from({length:vertices.length/3},(_,i)=>vertices.slice(i*3,i*3+3));
 const bounds={min:[0,1,2].map(i=>f(Math.min(...vertices.map(p=>p[i]))-1)),max:[0,1,2].map(i=>f(Math.max(...vertices.map(p=>p[i]))+1))};
 const packets=triangles.map(([a,b,c])=>({origin:a,edge1:b.map((n,i)=>f(n-a[i])),edge2:c.map((n,i)=>f(n-a[i]))}));
 const triangleBounds=triangles.map(t=>({min:[0,1,2].map(i=>Math.min(...t.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...t.map(p=>p[i])))}));
 const tree={bounds,branch:false,records:[{key:'authored-test-course',qualified:true,raw10:1,raw18:0,raw34:true,triangleCount:triangles.length,vertices,packets,triangleBounds}]};
 return {surfaces,world:{complete:true,treeComplete:true,tree,children:[]},dispose(){for(const s of surfaces)s.geometry.dispose();}};
}

export function createCollisionTestBody({geometry,scenario='floor',scenarios=COLLISION_TEST_SCENARIOS,characterScale=1}={}){
 if(!geometry?.world||!scenarios?.[scenario])throw TypeError('Explicit collision scene and scenario required');
 if(!Number.isFinite(characterScale)||characterScale<1||characterScale>2)throw TypeError('Prototype character scale must be between 1 and 2');
 const empty={complete:true,treeComplete:true,children:[],tree:null},world=geometry.world;
 const spawn=scenarios[scenario].spawn;
 if(!Array.isArray(spawn)||spawn.length!==3||!spawn.every(Number.isFinite))throw TypeError('Explicit finite map spawn required');
 const controller=new Controller({colliders:[],spawn:{x:spawn[0],y:spawn[1],z:spawn[2]}});controller.grounded=false;
 // Values observed in native-alice-original-vertices.json. The overlap mask
 // and cap were captured separately in native-actor-collision-context.json.
 // These are fixed LAB inputs, not claimed current native actor properties.
 const context={skin:f(.015),maximumIterations:5,solverMask:0x2b17bf,globalMask:0x1867ff,responseMask:0xffffffff,validationGlobalMask:0x67ff,float1:f(.0001),float13:f(.02),float37:f(.7),float42:f(.9)};
 const arithmeticProfile={roundX87:n=>n,source:'Explicit JS53 prototype; native execution-thread precision remains unmeasured'};
 const base={float47:1,managerFlag20:false,worldC:empty,world8:world,category400:{complete:true,queries:[]},sourceSolverId:1,
  actorCollections:{0x1000:{complete:true,teams:[]},0x10000:{complete:true,actors:[]},0x200000:{complete:true,actors:[]}},arithmeticProfile};
 // User-adjustable preview size. Scale model and collision dimensions together;
 // the captured native dimensions remain the 100% reference, not recalibrated.
 const radii=[100,160,100].map(n=>f(n*characterScale));
 // Enlarged preview bodies start above the floor by two skin margins so a
 // zero-height authored start does not begin inside its contact skin.
 const spawnLift=characterScale===1?0:2*radii[1]*context.skin*unit;
 const placedSpawn=values=>({x:values[0],y:values[1]+spawnLift,z:values[2]});
 const anchor=Object.values(placedSpawn(spawn)).map(n=>f(n/unit));
 controller.position=Object.fromEntries(['x','y','z'].map((axis,i)=>[axis,anchor[i]*unit]));
 controller.configureNativeCollisionMovement({source:'Authored isolated course, source collision solver, explicit prototype host controls',
  state:{offset678:[0,radii[1],0],anchor684:anchor,radii690:radii,lastSafe69c:anchor,contactPoint660:[0,0,0],normal66c:[0,0,0],grounded6b4:false,found650:false,nearest658:-1,history:[],accumulatedCategoriesC:0},
  mapping:{scale:[unit,unit,unit],origin:[0,0,0],evidence:'Authored unmirrored course in host metres; source units .006'},
  batching:{state:{clock28:0,clock30:0,remainder38:0,remainder40:0,flushFlag:false,bypassFlag:false,records:[]},remainder:(a,b)=>a%b,source:'Explicit prototype fixed16ms cadence',actorId:1,localActorId:1,horizontalCallsite:1,verticalCallsite:2},
  prepareMove:({channel,displacement,grounded})=>({grounded:channel==='vertical'&&displacement[1]!==0?false:grounded}),
  readActorPolicy:()=>({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:f(200*f(.9))}),
  // Prototype presentation/input needs stable logical support across tiny
  // downward moves. Recheck the ACTUAL authored geometry when no sweep ran;
  // never latch the previous byte over a ledge. The10cm allowance is an
  // explicit host prototype policy, not a recovered native mode114 gate.
  readHostGrounded:({channel,state,result,previousGrounded})=>{
   if(state.grounded6b4)return true;
   if(!previousGrounded||channel!=='vertical'||controller.velocity.y>0||!result.operations.every(operation=>['same-target','below-skin'].includes(operation.reason)))return false;
   const support=queryNativeStaticHeight({position:[state.anchor684[0],f(state.anchor684[1]+state.radii690[1]*context.skin),state.anchor684[2]],mask:context.solverMask&context.globalMask,tree:world.tree,complete:true});
   if(!support.qualified)throw Error('Prototype current support geometry unavailable');
   const gap=state.anchor684[1]-support.height;
   return support.hit&&gap>=-state.radii690[1]*context.skin&&gap<=.1/unit;
  },
  readOperation:()=>({context,queryContact:args=>queryNativeCompleteContact({...base,...args}),
   queryLowerSupport:args=>nativePrioritizedSupportHeight({...args,managerFlag20:false,worldC:{complete:true,query:input=>queryNativeStaticHeight({...input,tree:null,complete:true})},world8:{complete:true,query:input=>queryNativeStaticHeight({...input,tree:world.tree,complete:true})},category400:{complete:true,queries:[]}}),
   queryAdjustedPosition:args=>queryNativePostMoveOverlap({center:args.centerNormalized,radii:args.radii,bounds:args.bounds,solverMask:args.mask,overlapGlobalMask:0xffffffff,managerFlag20:false,worldC:empty,world8:world,category400:{complete:true,records:[]},arithmeticProfile}),
  }),
 });
 // Reaching the old response/snap is an error even in this prototype.
 controller.collision.move=controller.collision.sweep=()=>{throw Error('Legacy solver reached in isolated collision test');};
 let jumps=0,steps=0;
 return {controller,step({x=0,z=0,jump=false}={}){
  if(![x,z].every(Number.isFinite))throw TypeError('Finite test input required');
  const length=Math.hypot(x,z),speed=5.5,wasGrounded=controller.grounded;controller.events=[];controller.moveIntent={x,z};
  controller.velocity.x=length?x/Math.max(1,length)*speed:0;controller.velocity.z=length?z/Math.max(1,length)*speed:0;
  if(jump&&controller.grounded){controller.velocity.y=12;controller.grounded=false;jumps++;controller.events.push('jump');}
  // Authored controls and gravity are deliberately separate from source
  // actor lifecycle. Only the collision operation is under manual test here.
  controller.velocity.y=Math.max(-45,controller.velocity.y-35*.016);controller.move(.016);steps++;
  if(!wasGrounded&&controller.grounded)controller.events.push('land');
  controller.state=controller.grounded?(length?'run':'idle'):(controller.velocity.y>0?'jump':'fall');
  return this.snapshot();
 },snapshot(){return {position:{...controller.position},velocity:{...controller.velocity},grounded:controller.grounded,state:controller.state,events:controller.events.slice(),steps,jumps,characterScale,radius:radii[0]*unit,height:radii[1]*2*unit,operations:controller.nativeCollisionMovementFrame?.operations.length??0,nativeReady:false,scope:'source-collision-with-prototype-controls'};},
 reset(next=scenario){if(!scenarios[next])throw TypeError('Known test scenario required');scenario=next;controller.world.spawn=placedSpawn(scenarios[next].spawn);controller.reset();controller.grounded=false;jumps=0;steps=0;return this.snapshot();}};
}
