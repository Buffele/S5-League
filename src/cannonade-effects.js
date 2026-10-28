import {Vector3,Matrix4} from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {CannonadeShots,cannonadeAimContact} from './cannonade-contact.js';
export async function loadCannonadeEffects(scene){
 const definitions=await readAsset('/assets/s5runtime/effects/cannonade/runtime.json'),effects=await loadEffectRuntime(scene,definitions);
 const shots=new CannonadeShots();let owner=null,serialOwner=null,avatarOwner=null,stateOwner=null,charge=null,chargeClock=0,chargeKey=null,chargeDuration=2;
 function clearEmission(){charge?.clear();charge=null;chargeKey=null;shots.items.length=0;effects.clear();}
 function clear(){clearEmission();shots.pushes.clear();owner=null;serialOwner=null;avatarOwner=null;stateOwner=null;}
 return {
  shots,lightningState:()=>effects.lightningState(),
  advanceAcceptedPushes(dt,c){
   if(owner!==c||serialOwner!==c.resetSerial){clear();owner=c;serialOwner=c.resetSerial;return;}
   shots.advancePushes(dt);
  },
  update(dt,c,avatar,{targets=[],onHit=()=>false,audio=null,disabled=false}={}){
   // Accepted pushes belong to their target; source weapon/rig churn only cancels emission and unaccepted delayed contacts.
   if(owner!==c||serialOwner!==c.resetSerial){clear();owner=c;serialOwner=c.resetSerial;avatarOwner=avatar;stateOwner=c.cannonade;}
   else if(avatarOwner!==avatar||stateOwner!==c.cannonade){clearEmission();avatarOwner=avatar;stateOwner=c.cannonade;}
   shots.advancePushes(dt);
   const state=disabled?null:c.cannonade;
   if(!state){clearEmission();return;}
   avatar.group.updateWorldMatrix(true,true);
   const socket=[...avatar.bones].find(([name])=>name.endsWith('AreaRailgun_Fire_Dummy'))?.[1];
   if(!socket)throw Error('Cannonade post-mixer muzzle missing');
   const view={group:avatar.group,bones:new Map(avatar.bones)};view.bones.set('AreaRailgun_Fire_Dummy',socket);
   const key=state.phase==='charge'?state.serial:null;
   if(key!==chargeKey){charge?.clear();charge=null;chargeKey=key;chargeClock=0;chargeDuration=definitions.weapon_canon_charge.duration;
    if(key!==null)charge=effects.play('weapon_canon_charge',c.position,view,{rootBone:'AreaRailgun_Fire_Dummy',follow:true,facing:c.facing});
   }
   if(charge){chargeClock+=dt;if(chargeClock>=chargeDuration){charge.clear();charge=effects.play('weapon_canon_charge_loop',c.position,view,{rootBone:'AreaRailgun_Fire_Dummy',follow:true,facing:c.facing});chargeClock=0;chargeDuration=definitions.weapon_canon_charge_loop.duration;}}
   const origin=socket.getWorldPosition(new Vector3());
   // Existing contacts age before this tick's release is scheduled. This keeps
   // InitAttack1's100ms delay relative to release, independent of distance.
   shots.update(dt,c.collision,targets,(explosion,item)=>{
    effects.play(item.max?'weapon_canon_hit_max':'weapon_canon_hit',explosion.point,null,{facing:c.facing});
    audio?.play(item.max?'impactMax':'impact');
    for(const contact of explosion.contacts){const acceptance=onHit(contact,item);if(acceptance&&acceptance.pushAccepted!==false)shots.push(contact);}
   },{origin,aimTarget:state.aimTarget});
   for(const shot of state.pendingShots.splice(0)){
    const aim=shot.aimTarget??origin.clone().addScaledVector(new Vector3(Math.sin(c.facing)*Math.cos(shot.aimPitch),Math.sin(shot.aimPitch),Math.cos(c.facing)*Math.cos(shot.aimPitch)),150);
    shots.schedule(origin,aim,shot,c);
    // Native other_effects names the muzzle parent; no invented moving orb.
    // Native Lightning resolves external0 -> external1. Supply an explicit
    // evaluated LIVE muzzle and the same aimed contact used by the shot.
    //1291750 reads the linked nodes' evaluated matrices on every update.
    // Native destination following and GPU blend parity still need comparison.
    const destination=cannonadeAimContact(origin,aim,c.collision,targets.filter(a=>a!==c)).aimPoint??aim;
    const targetMatrix=new Matrix4().makeTranslation(destination.x,destination.y,destination.z);
    effects.play(shot.max?'weapon_canon_fire_max':'weapon_canon_fire',c.position,view,{rootBone:'AreaRailgun_Fire_Dummy',follow:false,facing:c.facing,externalNodes:[socket,targetMatrix]});
   }
   effects.update(dt);
  },
  render:camera=>effects.render(camera),clear,warmup:(renderer,camera)=>effects.warmup(renderer,camera),
 };
}
