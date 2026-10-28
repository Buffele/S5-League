import {Controller,TUNING} from './controller.js';
import {SCN_SCENE_SCALE} from './root-motion.js';

// Isolated test world. No shared movement tuning or weapon selector is changed.
export function createBreakerPreviewWorld(wall=false){
 if(typeof wall!=='boolean')throw Error('Expected wall toggle');
 const floor={minX:-20,maxX:20,minY:-1,maxY:0,minZ:-20,maxZ:20};
 const obstacle={minX:-4,maxX:4,minY:0,maxY:3,minZ:-.75,maxZ:-.65};
 return {spawn:{x:0,y:0,z:0},colliders:wall?[floor,obstacle]:[floor]};
}
const point=p=>{
 if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))throw Error('Invalid evaluated MoveBox position');
 return {x:p.x,y:p.y,z:p.z};
};

// Consume the evaluated local MoveBox, including AnimationPlayer's crossfade.
// NEVER reset the differential at NORMAL -> MINIMUM -> DELAY or sample each
// clip independently. .006 converts source units once; visual model scale 1.3
// must not enter this path. The existing preview fade remains an approximation.
export class BreakerPreviewMotion{
 constructor({wall=false,sex='male',facing=Math.PI}={}){
  if(!Number.isFinite(facing))throw Error('Invalid facing');
  this.controller=new Controller(createBreakerPreviewWorld(wall),{weapon:'breaker',sex});
  this.facing=facing;this.previous=null;this.enabled=false;this.trace=[];this.blockedSteps=0;
  this.drop=null;
 }
 begin(kind,evaluatedPosition){
  this.controller.reset();this.controller.facing=this.facing;
  this.previous=point(evaluatedPosition);this.enabled=kind==='weak'||kind==='strong';this.trace=[];this.blockedSteps=0;
  this.drop=kind==='jump'?{elapsedMs:0,thresholdMs:200,active:false,assignments:0,terminal:-20000*SCN_SCENE_SCALE,contactAdapted:false}:null;
  if(this.drop){this.controller.position.y=5;this.controller.grounded=false;}
 }
 advance(dt,evaluatedPosition){
  if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('Expected positive preview step <= 50 ms');
  const current=point(evaluatedPosition);
  if(!this.previous)throw Error('Begin motion before advancing');
  const previous=this.previous;this.previous=current;
  const local=this.enabled?{x:(current.x-previous.x)*SCN_SCENE_SCALE,y:(current.y-previous.y)*SCN_SCENE_SCALE,z:(current.z-previous.z)*SCN_SCENE_SCALE}:{x:0,y:0,z:0};
  const angle=this.facing+Math.PI,c=Math.cos(angle),s=Math.sin(angle);
  const requested={x:local.x*c+local.z*s,y:local.y,z:-local.x*s+local.z*c};
  const before={...this.controller.position};
  // Controller.move expects velocity, not a displacement. Use only its existing
  // collision/grounding path; do not run dagger/melee inputs via Controller.step.
  if(this.drop){
   const beforeDrop=this.drop.elapsedMs;this.drop.elapsedMs+=dt*1000;
   if(!this.drop.active&&beforeDrop<=this.drop.thresholdMs&&this.drop.elapsedMs>this.drop.thresholdMs){
    this.drop.active=true;this.drop.assignments++;this.controller.velocity={x:0,y:this.drop.terminal,z:0};
   }
   if(this.drop.active){
    this.controller.velocity.y=Math.max(this.drop.terminal,this.controller.velocity.y-TUNING.gravity*dt);
   }else this.controller.velocity.y=0;
  }else this.controller.velocity.y=requested.y/dt;
  const controllerRequested={x:this.controller.velocity.x*dt,y:this.controller.velocity.y*dt,z:this.controller.velocity.z*dt};
  const specialRequested=this.drop?.active?{...controllerRequested}:{x:0,y:0,z:0};
  const totalRequested={x:requested.x+controllerRequested.x,y:controllerRequested.y,z:requested.z+controllerRequested.z};
  this.controller.move(dt,{x:requested.x/dt,z:requested.z/dt});
  // Preview adapter only: grounded is compatible with a floor contact, but is
  // not claimed equivalent to S5Runtime controller+0x6b4.
  if(this.drop?.active&&this.controller.grounded){this.drop.active=false;this.drop.contactAdapted=true;}
  const after={...this.controller.position};
  const record={dt,source:current,requested,moveBoxRequested:requested,controllerRequested,specialRequested,totalRequested,resolved:{x:after.x-before.x,y:after.y-before.y,z:after.z-before.z},position:after,drop:this.drop?{...this.drop,velocityY:this.controller.velocity.y}:null};
  if(Math.hypot(totalRequested.x-record.resolved.x,totalRequested.z-record.resolved.z)>1e-5)this.blockedSteps++;
  this.trace.push(record);return record;
 }
}
