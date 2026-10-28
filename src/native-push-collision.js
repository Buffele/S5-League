import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {nativePushActorWrites,applyNativePushActorWrites} from './native-push-actor.js';

// Actor51c2f0 -> position setter7b0180: negative Y is submitted AFTER X/Z,
// using the collision-resolved position. Policy is explicit: gates/modifiers
// are not inferred from an arena actor. EllipsoidWorld is still S5's solver;
// this bridge ports submission order, not the native setter's full skin rules.
export function applyNativePushCollision(actor,sourceDisplacement,{actorPolicy,scale=SCN_SCENE_SCALE}={}){
 if(!actor?.collision||!actor?.position||!Number.isFinite(scale)||scale<=0)throw new TypeError('Actor collision and positive scene scale required');
 const writes=nativePushActorWrites(sourceDisplacement,actorPolicy),steps=[];
 applyNativePushActorWrites(writes,{
  getPosition:()=>[actor.position.x/scale,actor.position.y/scale,actor.position.z/scale],
  setPosition:(position,flag)=>{
   const start={...actor.position,y:actor.position.y+actor.collision.radii.y};
   const destination={x:position[0]*scale,y:position[1]*scale,z:position[2]*scale};
   const displacement={x:destination.x-actor.position.x,y:destination.y-actor.position.y,z:destination.z-actor.position.z};
   const result=actor.collision.move(start,displacement);
   actor.position={x:result.position.x,y:result.position.y-actor.collision.radii.y,z:result.position.z};
   steps.push({flag,displacement,result});
  },
 });
 return {writes,steps};
}
